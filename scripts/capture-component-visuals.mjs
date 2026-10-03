import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { open, readFile, mkdir, writeFile, rename, rm, stat, appendFile } from 'node:fs/promises';
import { join, isAbsolute, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { PinchTabBrowser } from './collect-browser-link-evidence.mjs';
import { catalogFingerprint, DISCOVERY_REVISION, DiscoveryLedger } from './lib/registry-discovery.mjs';

const SCHEMA = 'registry-atlas-discovery/v1';
const PREFIX = '/Registry-Atlas/data/previews/';
const normalize = value => String(value).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const safePage = (raw, homepage) => {
  try {
    const page = new URL(raw);
    const official = new URL(homepage);
    return page.protocol === 'https:' && official.protocol === 'https:'
      && page.origin === official.origin && !page.username && !page.password
      && !page.port && !page.hash && !page.pathname.endsWith('.json');
  } catch { return false; }
};

export function captureOutputFilename(namespace, slug) {
  if (!/^@[a-z0-9][a-z0-9-]*$/.test(namespace)) throw Error('Unsafe namespace');
  if (typeof slug !== 'string' || !slug.trim()) throw Error('Unsafe component name');
  const name = slug.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '').slice(0, 64) || 'item';
  const identity = createHash('sha256').update(namespace + '/' + slug).digest('hex').slice(0, 12);
  return namespace.slice(1) + '/' + name + '-' + identity + '.jpg';
}

export function planVisualCaptures(registry, indexedItems, journal, previews = {}, limit = 5) {
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 25) throw Error('Limit must be 1..25');
  const fp = catalogFingerprint(registry, indexedItems);
  const ready = [], skipped = [];
  for (const slug of [...new Set(indexedItems)].sort()) {
    if (ready.length >= limit) break;
    const token = registry.name + '/' + slug;
    if (Object.hasOwn(previews, token)) { skipped.push({slug, reason: 'already-captured'}); continue; }
    const row = journal.get(token);
    if (row?.schema !== SCHEMA || row.discoveryRevision !== DISCOVERY_REVISION
      || row.catalogFingerprint !== fp || row.status !== 'page-observed'
      || row.namespace !== registry.name || row.slug !== slug
      || !row.evidence?.renderedHeading
      || !row.checkedAt) {
      skipped.push({slug, reason: 'unverified-or-stale-page'});
      continue;
    }
    if (row.evidence.observedUrl !== row.docsUrl || !safePage(row.docsUrl, registry.homepage)) {
      skipped.push({slug, reason: 'unsafe-observed-page'});
      continue;
    }
    ready.push({namespace: registry.name, slug, officialPage: row.docsUrl,
      observedHeading: row.evidence.renderedHeading, checkedAt: row.checkedAt});
  }
  return {ready, skipped};
}

export async function captureObservedVisual(browser, candidate, outputPath) {
  await browser.nav(candidate.officialPage);
  const snapshot = await browser.snap();
  if (snapshot?.url !== candidate.officialPage
    || await browser.url() !== candidate.officialPage)
    throw Error('Official component page changed origin or URL');
  if (!(snapshot.nodes ?? []).some(node => node.role === 'heading'
    && normalize(node.name) === normalize(candidate.observedHeading)))
    throw Error('Official component heading changed');
  const selector = await browser.selectPreview(candidate.observedHeading);
  if (!selector) throw Error('No isolated component visual could be identified');
  const capture = await browser.captureElement(outputPath, selector);
  if (capture.url !== candidate.officialPage
    || await browser.url() !== candidate.officialPage)
    throw Error('Screenshot captured a different URL');
  return {status: 'captured', officialPage: candidate.officialPage, selector};
}

// A bounded, fixed DOM inspection. It never imports or evaluates registry source.
export class VisualBrowser extends PinchTabBrowser {
  async selectPreview(title) {
    const expression = `(() => {
      const wanted = ${JSON.stringify(normalize(title))};
      const normalize = text => String(text).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
      const headings = [...document.querySelectorAll('h2,h3,h4')].filter(h => {
        const label = normalize(h.innerText || h.textContent || '');
        return label.includes(wanted) && (label !== wanted
          || /preview|example|demo|component|showcase/.test(label));
      });
      const choices = [];
      // Reusable tabbed documentation: a visible Preview panel supplies the
      // component surface even when no nearby heading names the demo.
      for (const root of [...document.querySelectorAll('#component-preview, [data-component-preview]')].slice(0, 10)) {
        const tab = [...root.querySelectorAll('[role="tab"]')].find(t =>
          normalize(t.textContent || '') === 'preview' && t.getAttribute('data-state') === 'active');
        const panel = tab && [...root.querySelectorAll('[role="tabpanel"]')].find(p =>
          p.getAttribute('aria-labelledby') === tab.id && p.getAttribute('data-state') === 'active');
        const surface = panel?.querySelector('#component-wrapper,[data-preview-surface]') || panel;
        const box = surface?.getBoundingClientRect();
        if (box && box.width >= 180 && box.width <= 1800
          && box.height >= 100 && box.height <= 950
          && getComputedStyle(surface).visibility !== 'hidden')
          choices.push({node:surface, area: -1});
      }
      for (const heading of headings.slice(0, 50)) {
        let node = heading.parentElement;
        for (let depth=0; depth<5 && node; depth++,node=node.parentElement) {
          const box = node.getBoundingClientRect();
          const text = (node.innerText || '').trim();
          if (box.width < 180 || box.width > 1800 || box.height < 150
            || box.height > 950 || text.length > 1500
            || node.querySelectorAll('pre').length
            || !node.querySelector('button,input,svg,canvas,img,iframe,[role=button],[aria-expanded]')
            || !/border|preview|demo|example/i.test(String(node.className))) continue;
          choices.push({node, area: box.width * box.height});
        }
      }
      choices.sort((a,b) => a.area-b.area);
      document.querySelectorAll('[data-registry-atlas-visual]').forEach(el =>
        el.removeAttribute('data-registry-atlas-visual'));
      const best = choices[0]?.node;
      if (!best) return 'null';
      best.setAttribute('data-registry-atlas-visual', '1');
      best.scrollIntoView({block:'center', inline:'nearest', behavior:'instant'});
      return JSON.stringify('[data-registry-atlas-visual="1"]');
    })()`;
    return JSON.parse(this.call('eval', expression).result);
  }
  async captureElement(path, selector) {
    const captured = this.call('capture', '--require-pair', '--selector', selector,
      '--quality', '82', '--output', path);
    return {url: captured.url, path};
  }
}

function parseArgs(argv) {
  const supported = new Set(['--registry', '--profile', '--server', '--tab',
    '--journal', '--limit', '--delay-ms']);
  const args = {dryRun: false};
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i];
    if (key === '--dry-run' && !args.dryRun) {args.dryRun = true; continue;}
    if (!supported.has(key) || Object.hasOwn(args, key)
      || !argv[i+1] || argv[i+1].startsWith('--'))
      throw Error('Unknown or missing argument: ' + key);
    args[key] = argv[++i];
  }
  for (const flag of ['--registry', '--profile', '--server', '--journal']) {
    if (!args[flag]) throw Error('Missing ' + flag);
  }
  if (!args.dryRun && !args['--tab']) throw Error('Live capture requires --tab');
  if (!isAbsolute(args['--journal'])) throw Error('--journal must be absolute');
  const limit = args['--limit'] === undefined ? 3 : Number(args['--limit']);
  const delayMs = args['--delay-ms'] === undefined ? 1000 : Number(args['--delay-ms']);
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 25
    || !Number.isSafeInteger(delayMs) || delayMs < 1000 || delayMs > 60000)
    throw Error('Expected --limit 1..25 and --delay-ms 1000..60000');
  return { ...args, limit, delayMs };
}

function assertManagedInstance(args) {
  const payload = JSON.parse(execFileSync('pinchtab-profile-manager',
    [args['--profile'], 'status', '--json'],
    {encoding:'utf8',timeout:15000,maxBuffer:1024*1024}));
  if (!payload.ok || !payload.data?.instances?.some(i =>
    i.url === args['--server'] && i.status === 'running'))
    throw Error('Selected server is not running under the named managed source profile');
  if (args['--tab']) {
    const payload = JSON.parse(execFileSync('pinchtab',
      ['--server', args['--server'], 'tab', '--json'],
      {encoding:'utf8',timeout:15000,maxBuffer:1024*1024}));
    if (!payload.tabs?.some(tab => tab.id === args['--tab']))
      throw Error('Selected tab does not belong to this managed browser instance');
  }
}

export async function main(argv, cwd = process.cwd()) {
  const args = parseArgs(argv);
  assertManagedInstance(args);
  const [registries,catalog,curated,manifest,ledger] = await Promise.all([
    readFile(join(cwd,'data/shadcn/registries.raw.json'),'utf8').then(JSON.parse),
    readFile(join(cwd,'public/data/registry-catalog-items.json'),'utf8').then(JSON.parse),
    readFile(join(cwd,'data/shadcn/registry-items.json'),'utf8').then(JSON.parse),
    readFile(join(cwd,'public/data/component-previews.json'),'utf8').then(JSON.parse),
    DiscoveryLedger.open(args['--journal']),
  ]);
  const registry = registries.find(item => item.name === args['--registry']);
  if (!registry) throw Error('Registry not in official directory');
  if (manifest.schemaVersion !== 1 || !manifest.previews
    || Array.isArray(manifest.previews)) throw Error('Invalid visual reference manifest');
  const indexedItems = [...new Set([
    ...(catalog.registries?.[registry.name] ?? []).map(x=>x.name),
    ...(curated[registry.name] ?? []).map(x=>x.slug),
  ])];
  const plan = planVisualCaptures(registry, indexedItems, ledger, manifest.previews, args.limit);
  const result = {registry:registry.name, dryRun:args.dryRun, pending:plan.ready.length,
    sampleSkipped:plan.skipped.slice(0,10), captured:[], unresolved:[]};
  if (args.dryRun) {
    result.candidates = plan.ready;
    return result;
  }
  if (!plan.ready.length) return result;
  const manifestFile = join(cwd,'public/data/component-previews.json');
  const journalFile = join(process.env.XDG_STATE_HOME || join(process.env.HOME,'.local/state'),
    'registry-atlas','visuals',registry.name.slice(1)+'.jsonl');
  await mkdir(dirname(journalFile),{recursive:true});
  const browser = new VisualBrowser(args['--server'],args['--tab']);
  browser.call('set', 'viewport', '980', '850');
  const lock = await open(manifestFile + '.lock','wx',0o600);
  try {
    for (const candidate of plan.ready) {
      const filename = captureOutputFilename(registry.name,candidate.slug);
      const output = join(cwd,'public/data/previews',filename);
      const tmp = output.replace(/\.jpg$/,'.partial.jpg');
      await mkdir(dirname(output),{recursive:true});
      try {
        await rm(tmp,{force:true});
        const captured = await captureObservedVisual(browser,candidate,tmp);
        const metadata = await stat(tmp);
        if (metadata.size < 1000 || metadata.size > 5*1024*1024)
          throw Error('Captured image is empty or oversized');
        await rename(tmp,output);
        manifest.previews[registry.name+'/'+candidate.slug] = {
          imageUrl: PREFIX+filename, officialPage:candidate.officialPage,
          kind:'component', capturedAt:new Date().toISOString(),
          verification:'official rendered component demo screenshot',
        };
        const draft = manifestFile + '.pending';
        await writeFile(draft,JSON.stringify(manifest,null,2)+'\n',{flag:'w'});
        await rename(draft,manifestFile);
        const row = {status:'captured',slug:candidate.slug,officialPage:candidate.officialPage,
          imageUrl:PREFIX+filename,selector:captured.selector};
        result.captured.push(row);
        await appendFile(journalFile,JSON.stringify(row)+'\n');
      } catch(error) {
        await rm(tmp,{force:true});
        const row = {status:'unresolved',slug:candidate.slug,reason:String(error.message)};
        result.unresolved.push(row);
        await appendFile(journalFile,JSON.stringify(row)+'\n');
      }
      await new Promise(done=>setTimeout(done,args.delayMs));
    }
  } finally {
    await lock.close();
    await rm(manifestFile+'.lock',{force:true});
  }
  return result;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).then(result => {
    console.log(JSON.stringify(result,null,2));
    if (result.unresolved.length) process.exitCode=2;
  }).catch(error => {console.error('Visual capture failed: '+error.message);process.exitCode=1});
}

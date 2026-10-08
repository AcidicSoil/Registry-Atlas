import { execFileSync } from 'node:child_process';
import { readFile, open, unlink } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { isAbsolute } from 'node:path';
import { PinchTabBrowser } from './collect-browser-link-evidence.mjs';
import { discoverRegistry, DiscoveryLedger, catalogFingerprint } from './lib/registry-discovery.mjs';
import { openAtlasCoreDatabase, readAtlasState } from './lib/atlas-storage.mjs';

function args(argv) {
  const legal = new Set(['--registry', '--profile', '--server', '--tab', '--journal',
    '--limit', '--max-pages', '--max-depth', '--max-links', '--delay-ms', '--sitemap-dir']);
  const opts = {};
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i], value = argv[i + 1];
    if (!legal.has(key) || !value || value.startsWith('--') || opts[key] !== undefined)
      throw new Error('Unknown, repeated or incomplete CLI argument: ' + key);
    opts[key] = value;
  }
  for (const key of ['--registry', '--profile', '--server', '--tab', '--journal']) {
    if (!opts[key]) throw new Error('Missing required ' + key);
  }
  if (!isAbsolute(opts['--journal'])) throw new Error('--journal must be an absolute path');
  if (opts['--sitemap-dir'] && !isAbsolute(opts['--sitemap-dir']))
    throw new Error('--sitemap-dir must be an absolute path');
  const numeric = (key, defaultValue) => {
    if (!opts[key]) return defaultValue;
    const num = Number(opts[key]);
    if (!Number.isSafeInteger(num)) throw new Error('Invalid ' + key);
    return num;
  };
  return { registry: opts['--registry'], profile: opts['--profile'],
    server: opts['--server'], tab: opts['--tab'], journal: opts['--journal'],
    sitemapDir: opts['--sitemap-dir'] ?? null,
    limit: numeric('--limit', 20), maxPages: numeric('--max-pages', 40),
    maxDepth: numeric('--max-depth', 4), maxLinks: numeric('--max-links', 1500),
    delayMs: numeric('--delay-ms', 1000) };
}

export function checkedSourceProfile({profile, server}, registry) {
  const raw = execFileSync('pinchtab-profile-manager', [profile, 'status', '--json'],
    { encoding: 'utf8', timeout: 15000 });
  const response = JSON.parse(raw);
  if (!response.ok || !response.data?.instances?.some(
    instance => instance.status === 'running' && instance.url === server))
    throw new Error('Source server is not a running instance of the named managed profile');
  const allowed = response.data.settings?.allowedDomains ?? [];
  const host = new URL(registry.homepage).hostname.toLowerCase();
  if (!allowed.some(pattern => pattern === '*' || pattern === host
    || (pattern.startsWith('*.') && host.endsWith(pattern.slice(1))
      && host.length > pattern.length - 1)))
    throw new Error('Managed profile does not allow this registry official homepage domain');
}

export function configureManagedSourceBrowser(browser) {
  // An empty hydration snapshot cannot be treated as an empty registry.
  browser.waitForLinks = async timeoutMs => browser.call('wait', '--fn',
    String.raw`[...document.querySelectorAll('a[href]')].some(a => {
      try {
        const url = new URL(a.getAttribute('href'), location.href);
        return url.origin === location.origin && url.href !== location.href
          && (a.innerText || a.textContent || '').trim().length > 0;
      } catch { return false; }
    })`,
    '--timeout', String(Math.min(timeoutMs, 4000)));
  // Execute a fixed, bounded JSON read on the already-approved official origin.
  // Index URLs come only from links observed by discoverRegistry.
  browser.structuredIndex = async observedUrl => {
    const u = new URL(observedUrl);
    const current = new URL(await browser.url());
    if (u.protocol !== 'https:' || u.origin !== current.origin
      || !u.pathname.toLowerCase().endsWith('.json') || u.username || u.password)
      throw new Error('Structured index is not on the observed official origin');
    const expression = String.raw`(async () => {
      const requested = ${JSON.stringify(observedUrl)};
      if (location.origin !== new URL(requested).origin) throw Error('Origin changed');
      const response = await fetch(requested, {
        credentials: 'omit', redirect: 'error', mode: 'same-origin', cache: 'no-store',
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok || response.url !== requested
        || !/json/i.test(response.headers.get('content-type') || ''))
        throw Error('Official JSON unavailable');
      const reader = response.body.getReader();
      const chunks = []; let size = 0;
      while (true) {
        const {done, value} = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 2 * 1024 * 1024) { await reader.cancel(); throw Error('Index too large'); }
        chunks.push(value);
      }
      const bytes = new Uint8Array(size);
      let offset = 0;
      for (const chunk of chunks) {bytes.set(chunk, offset); offset += chunk.byteLength;}
      return JSON.stringify(JSON.parse(new TextDecoder().decode(bytes)));
    })()`;
    return JSON.parse(browser.call('eval', expression, '--await-promise').result);
  };
  return browser;
}

export async function main(argv, cwd = process.cwd()) {
  const options = args(argv);
  const database = openAtlasCoreDatabase(cwd, { readOnly: true });
  const state = readAtlasState(database);
  database.close();
  const raw = state.rawRegistries;
  const catalog = state.catalog;
  const curated = state.curated;
  const registry = raw.find(item => item.name === options.registry);
  if (!registry) throw new Error('Unknown exact raw registry namespace');
  checkedSourceProfile(options, registry);
  const indexedItems = [...new Set([
    ...(catalog.registries?.[options.registry] ?? []).map(x => x.name),
    ...(curated[options.registry] ?? []).map(x => x.slug),
  ])].filter(x => typeof x === 'string');
  // A journal has one writer at a time; an interrupted worker leaves an explicit
  // lock for operator recovery rather than silently racing another worker.
  let sitemapCandidates=[];
  if(options.sitemapDir){
    const evidencePath=options.sitemapDir+'/'+registry.name.slice(1)+'.json';
    let candidate=null;
    try{candidate=JSON.parse(await readFile(evidencePath,'utf8'));}
    catch(error){if(error.code!=='ENOENT')throw error;}
    const expectedFingerprint=catalogFingerprint(registry,indexedItems);
    if(candidate?.schema==='registry-atlas-sitemap-survey/v1'
      && candidate.namespace===registry.name
      && candidate.officialHomepage===registry.homepage
      && candidate.catalogFingerprint===expectedFingerprint
      && Date.parse(candidate.surveyedAt)>=Date.now()-30*24*60*60*1000
      && Array.isArray(candidate.matchedPages)
      && candidate.sitemaps?.some(index=>typeof index.url==='string')) {
      const sourceUrl=candidate.sitemaps.find(index=>index.kind==='urls')?.url;
      if(sourceUrl) sitemapCandidates=candidate.matchedPages.map(row=>({
        slug:row.slug,url:row.url,sitemapUrl:sourceUrl,
      }));
    }
  }
  const lockPath = options.journal + '.lock';
  const lock = await open(lockPath, 'wx', 0o600).catch(error => {
    if (error.code === 'EEXIST') throw new Error('Discovery journal is already claimed');
    throw error;
  });
  try {
  const ledger = await DiscoveryLedger.open(options.journal);
  const browser = configureManagedSourceBrowser(new PinchTabBrowser(options.server, options.tab));
  const result = await discoverRegistry({
    registry, indexedItems, ledger, browser,
    limit: options.limit, maxPages: options.maxPages,
    maxDepth: options.maxDepth, maxLinks: options.maxLinks, delayMs: options.delayMs,
    sitemapCandidates,
  });
  const outcomes = {};
  for (const record of result.records) {
    const key = record.status === 'page-observed' ? 'page-observed' : record.reason;
    outcomes[key] = (outcomes[key] ?? 0) + 1;
  }
  return { schema: result.schema, namespace: registry.name,
    indexedIdentities: indexedItems.length, attemptedIdentities: result.records.length,
    processedThisRun: result.processed, pending: result.pending,
    allAttempted: result.complete, allDocumentationPagesObserved: result.fullyVerified,
    listingPages: result.listings.length, discoveryExhausted: result.exhausted,
    outcomes, catalogFingerprint: result.catalogFingerprint,
    journalPath: options.journal,
    upstreamBuildsVerified: 0,
    note: 'Observed documentation identity is not a reviewed source-exact build or functional component preview.' };
  } finally {
    await lock.close();
    await unlink(lockPath);
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).then(result => {
    console.log(JSON.stringify(result, null, 2));
  }).catch(error => {
    console.error('Registry discovery failed: ' + error.message);
    process.exitCode = 1;
  });
}

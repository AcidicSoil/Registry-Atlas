import { readFile, appendFile, mkdir, writeFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { resolve, join, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { collectBrowserLinkEvidence, PinchTabBrowser } from './collect-browser-link-evidence.mjs';
import { recoverOfficialItem } from './recover-item-evidence.mjs';
const VALID_SLUG = /^[a-z0-9][a-z0-9_-]*$/;
const hash = value => createHash('sha256').update(value).digest('hex');
const wait = ms => new Promise(done => setTimeout(done, ms));
function publicHomepage(raw) {
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:' || url.port || url.username || url.password) return null;
    const name = url.hostname.toLowerCase();
    if (name === 'localhost' || name.endsWith('.localhost') || name.endsWith('.local'))
      return null;
    if (/^(10|127|0|192\.168|169\.254)\./.test(name)) return null;
    if (/^172\.(\d+)\./.test(name)
      && Number(name.split('.')[1]) >= 16 && Number(name.split('.')[1]) <= 31) return null;
    if (name === '[::1]' || name.startsWith('[fc') || name.startsWith('[fd')) return null;
    return url;
  } catch { return null; }
}
export function planRegistryCrawl(registries, catalog, curated, filter = {}) {
  return [...registries].filter(reg => !filter.registry || reg.name === filter.registry)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(registry => {
      const existing = new Map((curated[registry.name] ?? []).map(x => [x.slug, x]));
      const compact = new Map();
      for (const item of catalog.registries?.[registry.name] ?? []) {
        const prior = compact.get(item.name);
        compact.set(item.name, prior && prior.type !== item.type
          ? { ...item, type: null, ambiguousType: true } : prior ?? item);
      }
      const names = new Set([...compact.keys(), ...existing.keys()]);
      const targets = [...names].sort().map(slug => ({
        slug, token: registry.name + '/' + slug,
        docs_url: existing.get(slug)?.docs_url ?? null,
        indexed: compact.has(slug), itemType: compact.get(slug)?.type ?? null,
        ambiguousType: compact.get(slug)?.ambiguousType === true,
      }));
      return { registry, targets: filter.slug ? targets.filter(x => x.slug === filter.slug) : targets };
    });
}
export function summarizeRegistryCrawl(jobs, journal) {
  let verified = 0, unresolved = 0, blocked = 0, pending = 0, fullyVerifiedRegistries = 0;
  let items = 0, registriesAttempted = 0;
  for (const job of jobs) {
    let clean = job.targets.length > 0, attempted = false;
    const targets = job.targets.length
      ? job.targets : [{ token: 'registry:' + job.registry.name }];
    for (const target of targets) {
      const saved = journal.get(target.token);
      if (saved) attempted = true;
      if (!job.targets.length) { if (!saved) pending++; else if (saved.status !== 'checked-empty') unresolved++; }
      else if (!saved) { pending++; clean = false; }
      else if (saved.status === 'verified') verified++;
      else { unresolved++; clean = false; }
      if (saved?.reason === 'profile-domain-not-allowed') blocked++;
    }
    if (attempted) registriesAttempted++;
    if (clean) fullyVerifiedRegistries++;
    items += job.targets.length;
  }
  return { registries: jobs.length, registriesAttempted, items,
    verified, unresolved, blocked, pending, fullyVerifiedRegistries,
    complete: pending === 0 && unresolved === 0
      && registriesAttempted === jobs.length };
}
function sameSource(registry, record, target, sourceFact) {
  const homepage = publicHomepage(registry.homepage);
  const url = publicHomepage(record?.verifiedUrl);
  if (!homepage || !url || url.origin !== homepage.origin) return false;
  if (record.namespace !== registry.name || record.slug !== target.slug) return false;
  const b = record.browser ?? {};
  if (b.sourceFilePath) {
    const structural = structuredDocsPath(sourceFact);
    return Boolean(structural && b.sourceFilePath === structural.file
      && url.pathname === structural.route && b.observedUrl === record.verifiedUrl
      && b.observedSlug === target.slug
      && [structural.route.split('/').at(-1), structural.title]
        .some(name => normalizeTitle(name) === normalizeTitle(b.renderedHeading)));
  }
  return b.observedUrl === record.verifiedUrl
    && b.observedSlug === target.slug
    && normalizeTitle(b.renderedHeading) === normalizeTitle(target.slug);
}
export async function runRegistryCrawl({
  jobs, browser, journal, collect = collectBrowserLinkEvidence,
  probe, siteAllowed, verifyPage = validateObservedPage,
  batchSize = 10, delayMs = 1000, captureDir = '/tmp/registry-audit-captures',
  maxItemsPerRun = Infinity, onProgress = () => {},
}) {
  if (batchSize < 1 || batchSize > 200) throw new Error('Batch size must be 1..200');
  let processed = 0;
  const navigated = { last: 0 };
  const polite = async (method, ...args) => {
    if (delayMs) await wait(Math.max(0, delayMs - (Date.now() - navigated.last)));
    navigated.last = Date.now();
    return browser[method](...args);
  };
  const wrapped = { url: () => browser.url(), snap: () => browser.snap(),
    attr: ref => browser.attr(ref), nav: url => polite('nav', url),
    click: ref => polite('click', ref),
    // Source navigation and rendered identity, not screenshots, establish URLs.
    capture: async () => ({ url: await browser.url(), capturePath: null }),
    domLinks: browser.domLinks ? () => browser.domLinks() : undefined,
    extract: browser.extract ? () => browser.extract() : undefined };
  for (const { registry, targets } of jobs) {
    const all = targets.length ? targets : [{ token: 'registry:' + registry.name }];
    const pending = all.filter(item => !journal.get(item.token));
    if (!pending.length) continue;
    if (!publicHomepage(registry.homepage) || !siteAllowed(registry)) {
      for (const item of pending) {
        await journal.append({ token: item.token, status: 'unresolved',
          reason: 'profile-domain-not-allowed', registry: registry.name });
      }
      onProgress(registry.name, summarizeRegistryCrawl(jobs, journal));
      continue;
    }
    for (let i = 0; i < pending.length; i += batchSize) {
      if (processed >= maxItemsPerRun) return summarizeRegistryCrawl(jobs, journal);
      const batch = pending.slice(i, i + Math.min(batchSize, maxItemsPerRun - processed));
      const usable = batch.filter(item => !item.slug || VALID_SLUG.test(item.slug));
      const excluded = batch.filter(item => item.slug && !VALID_SLUG.test(item.slug));
      for (const item of excluded) {
        await journal.append({ token: item.token, status: 'unresolved',
          reason: 'unsupported-component-slug', registry: registry.name });
      }
      const sourceFacts = new Map();
      for (const item of usable) {
        if (!item.slug) continue;
        try {
          const fact = await probe(registry, item.slug);
          sourceFacts.set(item.token, { status: fact.status, sourceUrl: fact.sourceUrl ?? null,
            summary: fact.summary ?? null, reason: fact.reason ?? null });
        } catch {
          sourceFacts.set(item.token, { status: 'unresolved', reason: 'official-item-network-error' });
        }
      }
      let collected;
      try {
        await wrapped.nav(new URL(registry.homepage).href);
        collected = registry.name === '@animate-ui' && collect === collectBrowserLinkEvidence
          ? await collectQualifiedRegistryRoutes(wrapped, registry, usable.filter(item => item.slug), sourceFacts)
          : await collect(wrapped, registry, usable.filter(item => item.slug), captureDir);
      } catch (error) {
        collected = { records: [], unresolved: usable.map(item => ({
          slug: item.slug, reason: 'browser-collection-error',
          detail: String(error?.message ?? error).slice(0, 150),
        })) };
      }
      const matches = new Map();
      for (const record of collected.records ?? []) {
        if (!matches.has(record.slug)) matches.set(record.slug, []);
        matches.get(record.slug).push(record);
      }
      const problems = new Map((collected.unresolved ?? []).map(x => [x.slug, x.reason]));
      for (const item of usable) {
        if (!item.slug) continue; // Empty-registry sentinel is recorded below, exactly once.
        const candidates = matches.get(item.slug) ?? [];
        const source = sourceFacts.get(item.token) ?? null;
        let outcome = { token: item.token, registry: registry.name,
          slug: item.slug ?? null, source, status: 'unresolved' };
        if (candidates.length !== 1 || !sameSource(registry, candidates[0], item, source)) {
          outcome.reason = candidates.length > 1 ? 'ambiguous-source-pages'
            : candidates.length === 1 ? 'source-identity-mismatch'
              : problems.get(item.slug) ?? problems.get(undefined) ?? 'collector-omitted-item';
        } else {
          const found = candidates[0];
          // The collection adapter intentionally does not capture an image.
          // Do not persist the collector's would-be screenshot filename.
          if (found.browser) found.browser.capturePath = null;
          let accepted = false;
          try {
            accepted = Boolean(await verifyPage(wrapped, registry, found));
          } catch { accepted = false; }
          if (accepted) outcome = { ...outcome, status: 'verified',
            verifiedUrl: found.verifiedUrl, evidence: found };
          else outcome.reason = 'live-recheck-failed';
        }
        await journal.append(outcome);
        processed++;
      }
      if (!targets.length) {
        await journal.append({ token: 'registry:' + registry.name, registry: registry.name,
          status: collected.unresolved?.length ? 'unresolved' : 'checked-empty',
          ...(collected.unresolved?.length
            ? { reason: collected.unresolved[0].reason } : {}) });
        processed++;
      }
      onProgress(registry.name, summarizeRegistryCrawl(jobs, journal));
    }
  }
  return summarizeRegistryCrawl(jobs, journal);
}
export class JsonlJournal {
  constructor(file, entries = new Map()) { this.file = file; this.entries = entries; }
  get(token) { return this.entries.get(token); }
  async append(entry) {
    if (this.entries.has(entry.token)) throw new Error('Journal already contains ' + entry.token);
    const row = { ...entry, checkedAt: new Date().toISOString() };
    await appendFile(this.file, JSON.stringify(row) + '\n', { flag: 'a' });
    this.entries.set(entry.token, row);
  }
  static async open(file) {
    let data = '';
    try { data = (await readFile(file)).toString('utf8'); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    const entries = new Map();
    for (const line of data.split('\n').filter(Boolean)) {
      const row = JSON.parse(line);
      if (entries.has(row.token)) throw new Error('Duplicate journal identity');
      entries.set(row.token, row);
    }
    return new JsonlJournal(file, entries);
  }
}

async function validateObservedPage(browser, registry, record) {
  const home = publicHomepage(registry.homepage);
  const target = publicHomepage(record.verifiedUrl);
  if (!home || !target || home.origin !== target.origin) return false;
  await browser.nav(record.verifiedUrl);
  const snap = await browser.snap();
  const landed = await browser.url();
  const normalize = s => s.toLowerCase().replace(/[-_]+/g, ' ').trim();
  return landed === record.verifiedUrl && snap.url === landed
    && (snap.nodes ?? []).some(x => x.role === 'heading'
      && normalize(String(x.name ?? '')) === normalize(record.browser?.renderedHeading ?? record.slug));
}
function numericOption(argv, flag, fallback) {
  const at = argv.indexOf(flag);
  if (at < 0) return fallback;
  const value = Number(argv[at + 1]);
  if (!Number.isSafeInteger(value) || value < (flag === '--delay-ms' ? 0 : 1))
    throw new Error('Invalid ' + flag);
  return value;
}
function option(argv, flag, required = true) {
  const at = argv.indexOf(flag);
  const value = at < 0 ? null : argv[at + 1];
  if ((!value || value.startsWith('--')) && required) throw new Error('Missing ' + flag);
  return value ?? null;
}
function managedSitePolicy(profile, server) {
  const response = JSON.parse(execFileSync('pinchtab-profile-manager',
    [profile, 'status', '--json'], { encoding: 'utf8', timeout: 12000 }));
  if (!response.ok) throw new Error('Managed source profile unavailable');
  const instances = response.data?.instances ?? [];
  if (!instances.some(i => i.status === 'running' && i.url === server))
    throw new Error('Server does not belong to the named managed source profile');
  const allowed = response.data.settings?.allowedDomains ?? [];
  return reg => {
    const url = publicHomepage(reg.homepage);
    if (!url) return false;
    return allowed.some(entry => entry === '*' || url.hostname === entry
      || (entry.startsWith('*.') && url.hostname.endsWith(entry.slice(1))));
  };
}
async function cli(argv) {
  const profile = option(argv, '--profile');
  const server = option(argv, '--server');
  const tab = option(argv, '--tab');
  const journalPath = resolve(option(argv, '--journal'));
  const reportPath = option(argv, '--report', false);
  const registryName = option(argv, '--registry', false);
  const selectedSlug = option(argv, '--slug', false);
  if (selectedSlug && !registryName) throw new Error('--slug requires --registry');
  const batchSize = numericOption(argv, '--batch-size', 10);
  const delayMs = numericOption(argv, '--delay-ms', 1000);
  const maxItemsPerRun = numericOption(argv, '--max-items', Infinity);
  if (batchSize > 200) throw new Error('Batch size exceeds 200');
  // The profile identity and domain permissions come from PPM, not an
  // unchecked user-supplied allowlist or a shared default browser.
  const siteAllowed = managedSitePolicy(profile, server);
  const files = ['data/shadcn/registries.raw.json',
    'public/data/registry-catalog-items.json', 'data/shadcn/registry-items.json'];
  const bytes = await Promise.all(files.map(file => readFile(file, 'utf8')));
  const digest = hash(bytes.join('\n--source-boundary--\n'));
  const [registries, catalog, curated] = bytes.map(JSON.parse);
  if (registryName && !registries.some(r => r.name === registryName))
    throw new Error('Unknown registry in official inventory');
  const jobs = planRegistryCrawl(registries, catalog, curated,
    { registry: registryName, slug: selectedSlug });
  if (selectedSlug && jobs[0]?.targets.length !== 1)
    throw new Error('Unknown exact registry item slug: ' + selectedSlug);
  const manifestPath = journalPath + '.source.json';
  const prior = await readFile(manifestPath, 'utf8').then(JSON.parse)
    .catch(e => { if (e.code === 'ENOENT') return null; throw e; });
  if (prior && (prior.digest !== digest || prior.registry !== registryName))
    throw new Error('Source inventory changed; use a new journal, do not mix snapshots');
  await mkdir(dirname(journalPath), { recursive: true });
  if (!prior) await writeFile(manifestPath,
    JSON.stringify({ digest, registry: registryName, files, createdAt: new Date().toISOString() }) + '\n',
    { flag: 'wx' });
  const journal = await JsonlJournal.open(journalPath);
  const browser = new PinchTabBrowser(server, tab);
  const summary = await runRegistryCrawl({
    jobs, browser, journal, siteAllowed, probe: recoverOfficialItem,
    batchSize, delayMs, maxItemsPerRun,
    onProgress: (registry, totals) => console.log(JSON.stringify({
      registry, verified: totals.verified, unresolved: totals.unresolved,
      pending: totals.pending, registriesAttempted: totals.registriesAttempted,
    })),
  });
  const report = {
    schemaVersion: 'registry-atlas-autonomous-link-audit/v1',
    generatedAt: new Date().toISOString(),
    sourceDigest: digest, profile, server, registry: registryName, slug: selectedSlug,
    screenshotsRequired: false, verifiedCount: summary.verified,
    ...summary, scopedComplete: summary.complete,
    complete: !registryName && !selectedSlug && summary.complete,
    journalPath, nonVerifiedRows: [...journal.entries.values()]
      .filter(row => row.status !== 'verified'),
    note: 'This report does not establish Atlas UI verification or repair until source and runtime records are updated and the app links opened.',
  };
  if (reportPath) await writeFile(resolve(reportPath),
    JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ result: 'crawl-finished', report: reportPath,
    registry: registryName, slug: selectedSlug, ...summary,
    scopedComplete: summary.complete,
    complete: !registryName && !selectedSlug && summary.complete }));
  if (summary.unresolved) process.exitCode = 2;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  cli(process.argv.slice(2)).catch(error => {
    console.error('Registry crawl failed: ' + error.message); process.exitCode = 1;
  });
}

export function proposeVerifiedLinkUpdates(jobs, journal, curated, runtime) {
  const nextCurated = structuredClone(curated);
  const nextRuntime = structuredClone(runtime);
  const changes = [], unresolved = [];
  for (const { registry, targets } of jobs) {
    const runtimeRegistry = nextRuntime.registries?.find(r => r.official?.name === registry.name);
    for (const target of targets) {
      const saved = journal.get(target.token);
      if (saved?.status !== 'verified') continue;
      const invalid = !saved.evidence || !sameSource(registry, saved.evidence, target, saved.source)
        || saved.verifiedUrl !== saved.evidence.verifiedUrl;
      if (invalid) {
        unresolved.push({ token: target.token, reason: 'unverified-source-identity' });
        continue;
      }
      const originalCurated = nextCurated[registry.name] ?? [];
      const prior = originalCurated.find(item => item.slug === target.slug);
      if ((prior?.docs_url ?? null) !== target.docs_url
        || saved.evidence.previousUrl !== target.docs_url) {
        unresolved.push({ token: target.token, reason: 'source-link-changed' });
        continue;
      }
      const published = runtimeRegistry?.atlas?.item_summaries;
      const priorPublished = published?.find(item => item.slug === target.slug);
      if (!published || (priorPublished?.docs_url ?? null) !== target.docs_url) {
        unresolved.push({ token: target.token, reason: 'runtime-link-changed' });
        continue;
      }
      if (target.docs_url === saved.verifiedUrl) continue;
      if (!prior && (!target.indexed || target.ambiguousType || !target.itemType)) {
        unresolved.push({ token: target.token, reason: target.ambiguousType
          ? 'ambiguous-catalog-type' : 'unknown-component-identity' });
        continue;
      }
      const newSummary = prior ? { ...prior, docs_url: saved.verifiedUrl }
        : { name: target.slug, slug: target.slug, type: target.itemType ?? 'registry:item',
          source: 'official-browser', provenance: 'Official page ' + saved.verifiedUrl,
          catalog_status: 'available', route_eligible: true, docs_url: saved.verifiedUrl };
      const newPublished = priorPublished ? { ...priorPublished, docs_url: saved.verifiedUrl }
        : { name: newSummary.name, slug: target.slug, type: newSummary.type,
          source: newSummary.source, provenance: newSummary.provenance,
          catalog_status: 'available', route_eligible: true,
          dependencies: [], devDependencies: [], registryDependencies: [],
          files: [], warnings: [], docs_url: saved.verifiedUrl };
      if (!nextCurated[registry.name]) nextCurated[registry.name] = [];
      if (prior) nextCurated[registry.name][nextCurated[registry.name].indexOf(prior)] = newSummary;
      else nextCurated[registry.name].push(newSummary);
      if (priorPublished) published[published.indexOf(priorPublished)] = newPublished;
      else published.push(newPublished);
      changes.push({ token: target.token, previousUrl: target.docs_url,
        verifiedUrl: saved.verifiedUrl });
    }
  }
  return { curated: nextCurated, runtime: nextRuntime, changes, unresolved };
}

const normalizeTitle = text => String(text ?? '').toLowerCase().replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
function structuredDocsPath(fact) {
  if (fact?.status !== 'verified') return null;
  const paths = [...new Set((fact.summary?.files ?? []).map(x => x.path)
    .filter(p => /^registry\/(?:components|primitives)\/(?:[a-z0-9_-]+\/)+index\.tsx$/.test(p)))];
  if (paths.length !== 1) return null;
  return { file: paths[0], route: '/docs/' + paths[0].slice('registry/'.length, -'/index.tsx'.length),
    title: fact.summary?.title ?? null };
}
function observedLink(raw, from, home) {
  if (typeof raw !== 'string') return null;
  try {
    const u = new URL(raw, from);
    return u.protocol === 'https:' && u.origin === home.origin && !u.hash && !u.username && !u.password
      ? u.href : null;
  } catch { return null; }
}
export async function collectQualifiedRegistryRoutes(browser, registry, targets, sourceFacts) {
  const home = publicHomepage(registry.homepage);
  const result = { records: [], unresolved: [] };
  if (!home || await browser.url() !== home.href) {
    return { records: [], unresolved: [{ reason: 'source-tab-homepage-mismatch' }] };
  }
  await browser.snap();
  const listingCache = new Map();
  for (const target of targets) {
    const fact = sourceFacts.get(target.token);
    const described = structuredDocsPath(fact);
    if (!described) {
      result.unresolved.push({ slug: target.slug,
        reason: target.slug.startsWith('demo-') ? 'auxiliary-demo-no-observed-page'
          : target.slug.startsWith('icons-') ? 'icon-gallery-no-observed-item-page'
            : 'no-unique-source-file-path' });
      continue;
    }
    const listingRoute = '/' + described.route.split('/').slice(1, 3).join('/');
    let listing = listingCache.get(listingRoute);
    if (!listing) {
      // A previous item may have left the tab on a component or another catalog.
      // Discover each route family from the official homepage, never the last page.
      if (await browser.url() !== home.href) {
        await browser.nav(home.href);
        const homePage = await browser.snap();
        if (homePage.url !== home.href || await browser.url() !== home.href) {
          result.unresolved.push({ slug: target.slug, reason: 'homepage-navigation-mismatch' });
          continue;
        }
      }
      let matching = [];
      for (let attempt = 0; attempt < 6; attempt++) {
        const homepageLinks = await browser.domLinks();
        matching = [...new Set(homepageLinks.map(a => observedLink(a.href, home.href, home))
          .filter(url => url && new URL(url).pathname === listingRoute))];
        if (matching.length) break;
        await wait(250);
        await browser.snap();
      }
      if (matching.length !== 1) {
        result.unresolved.push({ slug: target.slug, reason: 'no-unique-observed-catalog-link' });
        continue;
      }
      await browser.nav(matching[0]);
      const snap = await browser.snap();
      if (await browser.url() !== matching[0] || snap.url !== matching[0]) {
        result.unresolved.push({ slug: target.slug, reason: 'catalog-navigation-mismatch' });
        continue;
      }
      let anchors = await browser.domLinks();
      for (let attempt = 0; attempt < 5 && anchors.length < 12; attempt++) {
        await wait(250);
        await browser.snap();
        anchors = await browser.domLinks();
      }
      listing = { url: matching[0], anchors };
      listingCache.set(listingRoute, listing);
    }
    const candidates = [...new Set(listing.anchors.map(a => observedLink(a.href, listing.url, home))
      .filter(url => url && new URL(url).pathname === described.route))];
    if (candidates.length !== 1) {
      result.unresolved.push({ slug: target.slug, reason: 'no-unique-observed-item-link' });
      continue;
    }
    await browser.nav(candidates[0]);
    const page = await browser.snap();
    if (page.url !== candidates[0] || await browser.url() !== candidates[0]) {
      result.unresolved.push({ slug: target.slug, reason: 'item-navigation-mismatch' });
      continue;
    }
    const leaf = described.route.split('/').at(-1);
    const heading = (page.nodes ?? []).find(x => x.role === 'heading'
      && [leaf, described.title].some(expected => normalizeTitle(x.name) === normalizeTitle(expected)));
    if (!heading) {
      result.unresolved.push({ slug: target.slug, reason: 'item-heading-mismatch' });
      continue;
    }
    result.records.push({ namespace: registry.name, slug: target.slug,
      previousUrl: target.docs_url ?? null, verifiedUrl: candidates[0], browser: {
        homepageUrl: home.href, listingUrl: listing.url, observedUrl: candidates[0],
        observedSlug: target.slug, expectedHeading: leaf, renderedHeading: heading.name,
        sourceFilePath: described.file, navigationSource: 'observed-official-file-path',
        capturePath: null, checkedAt: new Date().toISOString(),
      } });
  }
  return result;
}

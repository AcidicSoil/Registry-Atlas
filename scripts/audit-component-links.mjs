import { readFile, writeFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { PinchTabBrowser } from './collect-browser-link-evidence.mjs';

const SCHEMA = 'registry-atlas-component-link-evidence/v1';
const PUBLIC_PATHS = {
  raw: 'data/shadcn/registries.raw.json',
  catalog: 'public/data/registry-catalog-items.json',
  curated: 'data/shadcn/registry-items.json',
};
function publicHttps(input) {
  if (typeof input !== 'string') return null;
  try {
    const u = new URL(input);
    if (u.protocol !== 'https:' || u.username || u.password || u.port) return null;
    const h = u.hostname.toLowerCase();
    if (h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.local')
      || h === '[::1]' || /^\[(?:fc|fd|fe80)/i.test(h)
      || /^(?:10|127|0|192\.168|169\.254)\./.test(h)
      || (/^172\.(\d+)\./.test(h) && Number(h.split('.')[1]) >= 16 && Number(h.split('.')[1]) <= 31)) return null;
    return u.href;
  } catch { return null; }
}

function uniqueRows(items) {
  const result = new Map();
  for (const item of items) {
    if (typeof item?.slug !== 'string' || result.has(item.slug)) continue;
    result.set(item.slug, item);
  }
  return result;
}
export function inventoryLinks(registries, catalog, curated) {
  const rows = [];
  const perRegistry = [];
  const known = new Map(registries.map(r => [r.name, r]));
  for (const registry of [...registries].sort((a, b) => a.name.localeCompare(b.name))) {
    const namespace = registry.name;
    const existing = uniqueRows(curated[namespace] ?? []);
    const slugs = new Set((catalog.registries?.[namespace] ?? []).map(i => i.name));
    for (const slug of existing.keys()) slugs.add(slug);
    const start = rows.length;
    for (const slug of [...slugs].sort()) {
      const item = existing.get(slug);
      rows.push({
        token: `${namespace}/${slug}`, namespace, slug,
        homepage: registry.homepage, rawTemplate: registry.url,
        docsUrl: item?.docs_url ?? item?.docsUrl ?? null,
        rawItemUrl: item?.raw_item_url ?? null,
        evidenceUrl: item?.evidence_url ?? null,
        indexed: Boolean(catalog.registries?.[namespace]?.some(i => i.name === slug)),
        status: 'not-checked',
      });
    }
    const section = rows.slice(start);
    perRegistry.push({
      namespace, homepage: registry.homepage, count: section.length,
      docsLinks: section.filter(x => x.docsUrl).length,
      rawItemLinks: section.filter(x => x.rawItemUrl).length,
      reviewedItems: 0, homepageVisited: false, listingVisited: false,
    });
  }
  const docsLinks = rows.filter(x => x.docsUrl).length;
  const catalogEntries = Object.values(catalog.registries ?? {})
    .reduce((count, items) => count + items.length, 0);
  const uniqueIndexedItems = rows.filter(x => x.indexed).length;
  return {
    schemaVersion: 'registry-atlas-component-link-inventory/v1',
    totals: { registries: known.size, items: rows.length, catalogEntries,
      duplicateCatalogEntries: catalogEntries - uniqueIndexedItems, docsLinks,
      missingDocsLinks: rows.length - docsLinks, registryCoverage: 0,
      rawItemLinks: rows.filter(x => x.rawItemUrl).length },
    perRegistry, rows,
  };
}
function checkObservation(row, record) {
  if (!row) return 'unrecognized-item';
  if (record.previousUrl !== row.docsUrl) return 'stale-existing-url';
  const target = publicHttps(record.verifiedUrl);
  if (!target) return 'invalid-public-url';
  const browser = record.browser;
  if (!browser || !browser.capturePath || !browser.renderedHeading
    || !browser.checkedAt || !Number.isFinite(Date.parse(browser.checkedAt))
    || !browser.listingUrl || !browser.homepageUrl) return 'missing-browser-evidence';
  const homepage = publicHttps(row.homepage);
  if (!homepage || publicHttps(browser.homepageUrl) !== homepage) return 'official-homepage-mismatch';
  if (!publicHttps(browser.listingUrl)) return 'invalid-listing-url';
  if (new URL(target).origin === new URL(homepage).origin
    && new URL(target).pathname.replace(/\/+$/, '') === new URL(homepage).pathname.replace(/\/+$/, '')
    && (record.exception !== true || !(new URL(target).search || new URL(target).hash)))
    return 'generic-homepage';
  if (browser.observedUrl !== target) return 'browser-url-mismatch';
  if (browser.observedSlug !== row.slug) return 'browser-identity-mismatch';
  return null;
}

export async function recheckLivePages(inventory, evidence, browser) {
  const rows = new Map(inventory.rows.map(row => [row.token, row]));
  const unresolved = [];
  for (const record of evidence) {
    const token = `${record.namespace}/${record.slug}`;
    const row = rows.get(token);
    const invalid = checkObservation(row, record);
    if (invalid) {
      unresolved.push({ token, reason: invalid });
      continue;
    }
    const homepage = new URL(publicHttps(row.homepage));
    const target = new URL(record.verifiedUrl);
    if (target.origin !== homepage.origin) {
      unresolved.push({ token, reason: 'live-origin-mismatch' });
      continue;
    }
    try {
      const initial = new URL(await browser.url());
      if (initial.origin !== homepage.origin) {
        unresolved.push({ token, reason: 'live-tab-origin-mismatch' });
        break;
      }
      await browser.nav(record.verifiedUrl);
      const snapshot = await browser.snap();
      const landed = await browser.url();
      if (landed !== record.verifiedUrl || snapshot.url !== landed) {
        unresolved.push({ token, reason: 'live-navigation-mismatch' });
        continue;
      }
      const expected = record.slug.replace(/[-_]+/g, ' ').toLowerCase();
      const actualHeading = (snapshot.nodes ?? []).some(node =>
        node.role === 'heading' && typeof node.name === 'string'
          && node.name.trim().toLowerCase().replace(/\s+/g, ' ') === expected);
      if (!actualHeading) unresolved.push({ token, reason: 'live-heading-mismatch' });
    } catch {
      unresolved.push({ token, reason: 'live-browser-error' });
      break;
    }
  }
  return unresolved;
}

export function applyVerifiedLinks(inventory, curated, evidence) {
  const output = structuredClone(curated);
  const rows = new Map(inventory.rows.map(r => [r.token, r]));
  const counts = new Map();
  for (const record of evidence) {
    const token = `${record.namespace}/${record.slug}`;
    counts.set(token, (counts.get(token) ?? 0) + 1);
  }
  const repaired = [], confirmedUnchanged = [], unresolved = [], verifiedUrls = [];
  for (const record of evidence) {
    const token = `${record.namespace}/${record.slug}`;
    const row = rows.get(token);
    const reason = counts.get(token) !== 1 ? 'duplicate-evidence' : checkObservation(row, record);
    if (reason) { unresolved.push({ token, reason }); continue; }
    const list = output[row.namespace] ?? [];
    const index = list.findIndex(i => i.slug === row.slug);
    if (index < 0) { unresolved.push({ token, reason: 'missing-curated-summary' }); continue; }
    verifiedUrls.push({ token, url: record.verifiedUrl,
      homepageUrl: record.browser.homepageUrl, listingUrl: record.browser.listingUrl,
      capturePath: record.browser.capturePath, checkedAt: record.browser.checkedAt,
      routePattern: record.routePattern ?? null, exception: record.exception === true });
    if (row.docsUrl === record.verifiedUrl) { confirmedUnchanged.push(token); continue; }
    list[index] = { ...list[index], docs_url: record.verifiedUrl };
    repaired.push(token);
  }
  return { curated: output, repaired, confirmedUnchanged, unresolved, verifiedUrls };
}
async function loadJson(file) { return JSON.parse(await readFile(file, 'utf8')); }
const checksum = value => createHash('sha256').update(value).digest('hex');
async function main(argv) {
  const args = new Set(argv);
  const indexOf = key => argv.indexOf(key);
  const valueOf = key => indexOf(key) >= 0 ? argv[indexOf(key) + 1] : null;
  const evidenceFile = valueOf('--evidence');
  const reportPath = valueOf('--report');
  const apply = args.has('--apply');
  if (apply && !evidenceFile) throw new Error('--apply requires --evidence');
  if (apply && !args.has('--reviewed') && !args.has('--recheck-browser'))
    throw new Error('--apply requires --reviewed or independent --recheck-browser with a dedicated managed PinchTab tab');
  if (args.has('--recheck-browser') && (!valueOf('--server') || !valueOf('--tab')))
    throw new Error('--recheck-browser requires --server and --tab');
  if ((indexOf('--evidence') >= 0 && !evidenceFile) || (indexOf('--report') >= 0 && !reportPath))
    throw new Error('Missing path for --evidence or --report');
  const [rawText, catalogText, curatedText] = await Promise.all([
    readFile(PUBLIC_PATHS.raw, 'utf8'), readFile(PUBLIC_PATHS.catalog, 'utf8'),
    readFile(PUBLIC_PATHS.curated, 'utf8'),
  ]);
  const inventory = inventoryLinks(JSON.parse(rawText), JSON.parse(catalogText), JSON.parse(curatedText));
  const metadata = { rawSha256: checksum(rawText), catalogSha256: checksum(catalogText),
    curatedSha256: checksum(curatedText) };
  let evaluation = { repaired: [], confirmedUnchanged: [], unresolved: [], verifiedUrls: [] };
  if (evidenceFile) {
    const evidence = await loadJson(evidenceFile);
    if (evidence.schemaVersion !== SCHEMA || !Array.isArray(evidence.records))
      throw new Error('Unsupported browser evidence manifest');
    evaluation = applyVerifiedLinks(inventory, JSON.parse(curatedText), evidence.records);
    if (apply && evaluation.unresolved.length) throw new Error(`Refusing partial apply: ${JSON.stringify(evaluation.unresolved)}`);
    if (apply && args.has('--recheck-browser')) {
      const browser = new PinchTabBrowser(valueOf('--server'), valueOf('--tab'));
      const liveProblems = await recheckLivePages(inventory, evidence.records, browser);
      if (liveProblems.length) throw new Error(`Refusing apply after live browser check: ${JSON.stringify(liveProblems)}`);
    }
    if (apply) {
      for (const record of evidence.records) {
        const file = record?.browser?.capturePath;
        if (!file || !(await stat(file).catch(() => null))?.isFile()) throw new Error(`Missing PinchTab capture: ${file}`);
      }
      if ((await readFile(PUBLIC_PATHS.curated, 'utf8')) !== curatedText) throw new Error('Curated records changed during audit');
      if (evaluation.repaired.length)
        await writeFile(PUBLIC_PATHS.curated, JSON.stringify(evaluation.curated, null, 2) + '\n');
    }
  }
  const report = {
    ...inventory, generatedAt: new Date().toISOString(), dataset: metadata,
    audit: {
      evidenceCount: evaluation.repaired.length + evaluation.confirmedUnchanged.length + evaluation.unresolved.length,
      repaired: evaluation.repaired, confirmedUnchanged: evaluation.confirmedUnchanged,
      verifiedUrls: evaluation.verifiedUrls, unresolved: evaluation.unresolved,
      remainingUnchecked: inventory.rows.length - evaluation.repaired.length - evaluation.confirmedUnchanged.length,
      completed: false,
    },
    apply,
  };
  if (reportPath) await writeFile(reportPath, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({
    mode: apply ? 'apply' : 'dry-run',
    totals: inventory.totals, audit: report.audit, reportPath,
    coverageNote: 'Browser evidence must be independently reviewed. A manifest alone does not verify a page. The full-catalog audit remains incomplete.',
  }, null, 2));
  if (evaluation.unresolved.length) process.exitCode = 2;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).catch(error => {
    console.error(error.message); process.exitCode = 1;
  });
}

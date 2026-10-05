import { readFile, writeFile } from 'node:fs/promises';
import { isIP } from 'node:net';
import { pathToFileURL } from 'node:url';
import { catalogFingerprint } from './lib/registry-discovery.mjs';

export const SOURCE_PAGE_SCHEMA = 'registry-atlas-source-page-index/v1';
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export function exactOfficialPage(url, homepage) {
  try {
    const home = new URL(homepage);
    const target = new URL(url);
    if (home.protocol !== 'https:' || target.protocol !== 'https:'
      || home.origin !== target.origin || home.port || target.port
      || home.username || home.password || target.username || target.password
      || target.hash || target.searchParams.has('redirect')
      || !home.hostname.includes('.') || isIP(home.hostname)
      || /(?:^localhost$|\.local$|\.internal$|\.localhost$)/.test(home.hostname)
      || target.pathname.replace(/\/+$/, '') === home.pathname.replace(/\/+$/, '')
      || /\.(?:json|js|map|png|jpe?g|webp|svg|css|pdf|woff2?)\/?$/i.test(target.pathname)
      || /%2f|%5c|%00|\.\./i.test(target.pathname)) return null;
    return target.href;
  } catch { return null; }
}

export function buildSourcePageIndex({ raw, catalog, curated, traversal, previews, demos, patternLinks, now = new Date().toISOString() }) {
  const databaseSitemaps = patternLinks?.schema === 'registry-atlas-pattern-links/v1'
    && Array.isArray(patternLinks.sitemapLinks);
  if ((!databaseSitemaps && (traversal?.schema !== 'registry-atlas-traversal-inventory/v1'
      || !Array.isArray(traversal.registries)))
    || !Array.isArray(raw) || !catalog?.registries)
    throw new Error('Unsupported source inventory');
  const nowMs = Date.parse(now);
  if (!Number.isFinite(nowMs)) throw new Error('Invalid observation time');
  const known = new Map(raw.map(reg => [reg.name, reg]));
  const names = new Map(Object.entries(catalog.registries).map(([namespace, items]) =>
    [namespace, new Set(items.map(item => item.name))]));
  const candidatePages = new Map();
  const rejected = { stale: 0, ambiguous: 0, 'unknown-item': 0,
    'invalid-url': 0, 'reviewed-conflict': 0, 'fingerprint-mismatch': 0, 'sitemap-review-disagreement': 0 };
  const offer = (token, page) => {
    const saved = candidatePages.get(token);
    if (!saved) { candidatePages.set(token, [page]); return; }
    if (!saved.some(entry => entry.url === page.url && entry.level === page.level))
      saved.push(page);
  };
  const databaseGroups = new Map();
  if (databaseSitemaps) for (const page of patternLinks.sitemapLinks) {
    if (typeof page?.namespace !== 'string' || typeof page?.observedAt !== 'string') continue;
    const key = page.namespace + '\\0' + page.observedAt;
    if (!databaseGroups.has(key)) databaseGroups.set(key,{
      namespace:page.namespace,
      homepage:known.get(page.namespace)?.homepage,
      catalogFingerprint:patternLinks.fingerprints?.[page.namespace],
      sitemapSurveyedAt:page.observedAt,
      sitemapPages:[],
    });
    databaseGroups.get(key).sitemapPages.push({slug:page.slug,url:page.url});
  }
  const sitemapRows = databaseSitemaps ? [...databaseGroups.values()] : traversal.registries;
  for (const row of sitemapRows) {
    const registry = known.get(row.namespace);
    if (!registry || row.homepage !== registry.homepage) continue;
    const slugs = [...new Set([
      ...(catalog.registries[row.namespace] ?? []).map(item => item.name),
      ...(curated[row.namespace] ?? []).map(item => item.slug),
    ])].sort();
    if (row.catalogFingerprint !== catalogFingerprint(registry, slugs)) {
      rejected['fingerprint-mismatch'] += row.sitemapPages?.length ?? 0;
      continue;
    }
    const surveyedMs = Date.parse(row.sitemapSurveyedAt ?? '');
    if (!Number.isFinite(surveyedMs) || surveyedMs > nowMs
      || nowMs - surveyedMs > MAX_AGE_MS) {
      rejected.stale += row.sitemapPages?.length ?? 0;
      continue;
    }
    const matches = new Map();
    for (const candidate of row.sitemapPages ?? []) {
      const token = row.namespace + '/' + candidate.slug;
      if (!names.get(row.namespace)?.has(candidate.slug)) {
        rejected['unknown-item']++;
        continue;
      }
      const url = exactOfficialPage(candidate.url, registry.homepage);
      if (!url) { rejected['invalid-url']++; continue; }
      const possible = matches.get(token) ?? new Set();
      possible.add(url);
      matches.set(token, possible);
    }
    for (const [token, urls] of matches) {
      if (urls.size !== 1) { rejected.ambiguous++; candidatePages.set(token, []); continue; }
      offer(token, { url: [...urls][0], level: 'sitemap', source: 'official-sitemap', observedAt: row.sitemapSurveyedAt });
    }
  }
  if (patternLinks?.schema === 'registry-atlas-pattern-links/v1'
    && Array.isArray(patternLinks.links)) {
    for (const row of patternLinks.links) {
      if (!['pattern-observed','pattern-inferred'].includes(row.status)) continue;
      const registry = known.get(row.namespace);
      if (!registry || !names.get(row.namespace)?.has(row.slug)) {
        rejected['unknown-item']++;
        continue;
      }
      const checked = Date.parse(row.checkedAt ?? '');
      if (!Number.isFinite(checked) || checked > nowMs || nowMs - checked > MAX_AGE_MS) {
        rejected.stale++;
        continue;
      }
      const url = exactOfficialPage(row.source_url, registry.homepage);
      if (!url) { rejected['invalid-url']++; continue; }
      offer(row.namespace+'/'+row.slug,{
        url,level:'pattern',source:'verified-route-pattern',observedAt:row.checkedAt,
      });
    }
  }
  for (const [namespace, items] of Object.entries(curated)) {
    const registry = known.get(namespace);
    if (!registry) continue;
    for (const item of items) {
      if (!names.get(namespace)?.has(item.slug)) continue;
      const candidate = item.docs_url ?? item.docsUrl;
      if (!candidate) continue;
      const url = exactOfficialPage(candidate, registry.homepage);
      if (url) offer(namespace + '/' + item.slug,
        { url, level: 'reviewed', source: 'reviewed-summary' });
      else rejected['invalid-url']++;
    }
  }
  for (const demo of demos?.items ?? []) {
    if (demo.kind !== 'upstream-built' || demo.status !== 'interaction-verified'
      || !/^[a-f0-9]{64}$/.test(demo.sourceSha256 ?? '')) continue;
    const namespace=demo.namespace, slug=demo.slug;
    const registry=known.get(namespace);
    if (!registry || !names.get(namespace)?.has(slug)) continue;
    const url=exactOfficialPage(demo.source?.docsUrl, registry.homepage);
    if (url) offer(namespace+'/'+slug,
      {url,level:'reviewed',source:'interaction-verified-demo'});
  }
  for (const [token, reference] of Object.entries(previews?.previews ?? {})) {
    const split = token.indexOf('/');
    const namespace = token.slice(0, split), slug = token.slice(split + 1);
    const registry = known.get(namespace);
    if (!registry || !names.get(namespace)?.has(slug)) continue;
    const url = exactOfficialPage(reference.officialPage, registry.homepage);
    if (url) offer(token, { url, level: 'reviewed', source: 'visual-reference' });
  }

  const pages = {};
  for (const token of [...candidatePages.keys()].sort()) {
    const entries = candidatePages.get(token);
    const reviewed = entries.filter(entry => entry.level === 'reviewed');
    const sitemap = entries.filter(entry => entry.level === 'sitemap');
    const choices = reviewed.length ? reviewed : sitemap.length ? sitemap : entries;
    if (!choices.length) continue;
    if (new Set(choices.map(entry => entry.url)).size !== 1) {
      rejected[reviewed.length ? 'reviewed-conflict' : 'ambiguous']++;
      continue;
    }
    // Keep independently reviewed URLs authoritative, but surface discrepancies.
    if (reviewed.length && entries.some(entry =>
      entry.level === 'sitemap' && entry.url !== choices[0].url)) {
      rejected['sitemap-review-disagreement']++;
    }
    pages[token] = choices[0];
  }
  const levels = Object.values(pages);
  const indexedCount = [...names.values()].reduce((count, slugs) => count + slugs.size, 0);
  return {
    schema: SOURCE_PAGE_SCHEMA,
    sourceSnapshotAt: databaseSitemaps
      ? patternLinks.sourceSnapshotAt ?? null : traversal.generatedAt ?? null,
    coverage: {
      distinctIndexed: indexedCount,
      published: levels.length,
      reviewed: levels.filter(entry => entry.level === 'reviewed').length,
      sitemap: levels.filter(entry => entry.level === 'sitemap').length,
      pattern: levels.filter(entry => entry.level === 'pattern').length,
      missing: indexedCount - levels.length,
      rejections: rejected,
    },
    pages,
  };
}

async function main(argv) {
  if (!['--output', '--report'].every(flag => argv.includes(flag)))
    throw new Error('Usage: --output <manifest> --report <coverage>');
  const value = flag => argv[argv.indexOf(flag) + 1];
  for (const flag of ['--output', '--report'])
    if (!value(flag) || value(flag).startsWith('--')) throw new Error('Missing '+flag);
  const patternFile = value('--pattern-links') ?? 'data/shadcn/verified-registry-pattern-links.json';
  const patternLinks = await readFile(patternFile,'utf8').then(JSON.parse)
    .catch(error => { if (error.code === 'ENOENT') return null; throw error; });
  const [raw, catalog, curated, previews, demos] = await Promise.all([
    'data/shadcn/registries.raw.json', 'public/data/registry-catalog-items.json',
    'data/shadcn/registry-items.json', 'public/data/component-previews.json',
    'src/registry-explorer/data/component-demo-manifest.json',
  ].map(file => readFile(file,'utf8').then(JSON.parse)));
  // The legacy traversal inventory is consulted only before its records are migrated to SQLite.
  const traversal = Array.isArray(patternLinks?.sitemapLinks) ? null
    : await readFile('data/shadcn/registry-traversal-patterns.json','utf8').then(JSON.parse);
  const result = buildSourcePageIndex({ raw,catalog,curated,traversal,previews,demos,patternLinks });
  await writeFile(value('--output'), JSON.stringify(result) + '\n');
  await writeFile(value('--report'), JSON.stringify({
    schema: SOURCE_PAGE_SCHEMA, sourceSnapshotAt: result.sourceSnapshotAt,
    ...result.coverage, note: 'Sitemap and pattern-derived links have not all been individually page-verified',
  }, null, 2) + '\n');
  console.log(JSON.stringify(result.coverage));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  main(process.argv.slice(2)).catch(error => { console.error(error); process.exitCode = 1; });

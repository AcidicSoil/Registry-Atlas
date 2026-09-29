import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const DEFAULT_SOURCE_PATH = 'data/shadcn/registries.raw.json';
const DEFAULT_OUTPUT_PATH = 'data/shadcn/registry-catalog-evidence.json';
const DEFAULT_REPORT_PATH = 'data/shadcn/registry-catalog-evidence-report.json';
const DEFAULT_ITEMS_PATH = 'public/data/registry-catalog-items.json';
const DEFAULT_DETAILS_DIR = 'public/data/registry-item-details';

export const DISCOVERABLE_REGISTRY_ITEM_TYPES = Object.freeze([
  'registry:block',
  'registry:component',
  'registry:ui',
  'registry:page',
  'registry:item',
  'registry:style',
  'registry:theme',
  'registry:icon',
]);

const COMPACT_DESCRIPTION_MAX = 280;
const COMPACT_AUTHOR_MAX = 120;
const THEME_SWATCH_KEYS = Object.freeze([
  'background',
  'foreground',
  'primary',
  'secondary',
  'accent',
  'muted',
  'card',
]);

export function deriveCatalogUrls(template) {
  if (typeof template !== 'string' || !template.includes('{name}')) return [];

  const templates = [];
  if (template.includes('{style}')) {
    templates.push(
      template.replace(/\/\{style\}(?=\/)/g, ''),
      template.replaceAll('{style}', 'new-york-v4'),
      template.replaceAll('{style}', 'new-york'),
      template.replaceAll('{style}', 'default'),
    );
  } else {
    templates.push(template);
  }

  const urls = [];
  for (const candidateTemplate of templates) {
    const candidate = candidateTemplate.replaceAll('{name}', 'registry');
    if (/\{[^}]+\}/.test(candidate)) continue;
    try {
      const url = new URL(candidate);
      if ((url.protocol === 'https:' || url.protocol === 'http:') && !urls.includes(url.href)) {
        urls.push(url.href);
      }
    } catch {
      // Ignore malformed candidates and continue to deterministic fallbacks.
    }
  }
  return urls;
}

export function deriveCatalogUrl(template) {
  return deriveCatalogUrls(template)[0] ?? null;
}

export function buildCatalogEvidence(
  namespace,
  template,
  catalog,
  syncedAt = new Date().toISOString(),
  resolvedCatalogUrl = null,
) {
  const catalogUrl = resolvedCatalogUrl || deriveCatalogUrl(template);
  if (!catalogUrl || !catalog || !Array.isArray(catalog.items)) return null;
  return {
    namespace,
    catalog_url: catalogUrl,
    item_count: catalog.items.length,
    status: 'available',
    synced_at: syncedAt,
  };
}

export function buildCompactCatalogItems(catalog) {
  const allowedTypes = new Set(DISCOVERABLE_REGISTRY_ITEM_TYPES);
  const items = [];

  for (const item of Array.isArray(catalog?.items) ? catalog.items : []) {
    if (!item || typeof item !== 'object') continue;
    const name = typeof item.name === 'string' ? item.name.trim() : '';
    const type = typeof item.type === 'string' ? item.type.trim() : '';
    if (!name || !allowedTypes.has(type)) continue;

    const compact = { name, type };
    if (typeof item.title === 'string' && item.title.trim()) compact.title = item.title.trim();
    const description = boundedText(item.description, COMPACT_DESCRIPTION_MAX);
    if (description) compact.description = description;
    const author = boundedText(item.author, COMPACT_AUTHOR_MAX);
    if (author) compact.author = author;
    if (Array.isArray(item.files) && item.files.length > 0) compact.fileCount = item.files.length;
    const themePreview = buildThemePreview(type, item.cssVars);
    if (themePreview) compact.themePreview = themePreview;

    const categories = [
      ...(Array.isArray(item.categories) ? item.categories : []),
      ...(typeof item.category === 'string' ? [item.category] : []),
    ].filter(value => typeof value === 'string' && value.trim()).map(value => value.trim());
    if (categories.length) compact.categories = [...new Set(categories)];

    items.push(compact);
  }

  return items;
}

function boundedText(value, maxCodePoints) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  return Array.from(trimmed).slice(0, maxCodePoints).join('');
}

function buildThemePreview(type, cssVars) {
  if (type !== 'registry:theme' && type !== 'registry:style') return null;
  if (!cssVars || typeof cssVars !== 'object' || Array.isArray(cssVars)) return null;
  const preview = {};
  for (const mode of ['light', 'dark']) {
    const source = cssVars[mode];
    if (!source || typeof source !== 'object' || Array.isArray(source)) continue;
    const swatches = {};
    for (const key of THEME_SWATCH_KEYS) {
      const value = boundedText(source[key], 160);
      if (value) swatches[key] = value;
    }
    if (Object.keys(swatches).length > 0) preview[mode] = swatches;
  }
  return Object.keys(preview).length > 0 ? preview : null;
}

function sanitizeCssVars(cssVars) {
  if (!cssVars || typeof cssVars !== 'object' || Array.isArray(cssVars)) return null;
  const output = {};
  for (const mode of ['theme', 'light', 'dark']) {
    const source = cssVars[mode];
    if (!source || typeof source !== 'object' || Array.isArray(source)) continue;
    const entries = Object.entries(source)
      .filter(([key, value]) => key && typeof value === 'string' && value.trim())
      .map(([key, value]) => [key, value.trim()]);
    if (entries.length) output[mode] = Object.fromEntries(entries);
  }
  return Object.keys(output).length > 0 ? output : null;
}

export function buildRegistryItemDetailBundle(catalog) {
  const allowedTypes = new Set(DISCOVERABLE_REGISTRY_ITEM_TYPES);
  const details = [];

  for (const item of Array.isArray(catalog?.items) ? catalog.items : []) {
    if (!item || typeof item !== 'object') continue;
    const name = typeof item.name === 'string' ? item.name.trim() : '';
    const type = typeof item.type === 'string' ? item.type.trim() : '';
    if (!name || !allowedTypes.has(type)) continue;

    const detail = { name, type };
    if (typeof item.title === 'string' && item.title.trim()) detail.title = item.title.trim();
    if (typeof item.description === 'string' && item.description.trim()) detail.description = item.description.trim();
    if (typeof item.author === 'string' && item.author.trim()) detail.author = item.author.trim();
    const cssVars = sanitizeCssVars(item.cssVars);
    if (cssVars) detail.cssVars = cssVars;

    const categories = [
      ...(Array.isArray(item.categories) ? item.categories : []),
      ...(typeof item.category === 'string' ? [item.category] : []),
    ].filter(value => typeof value === 'string' && value.trim()).map(value => value.trim());
    if (categories.length) detail.categories = [...new Set(categories)];

    for (const field of ['dependencies', 'devDependencies', 'registryDependencies']) {
      const values = Array.isArray(item[field])
        ? item[field].filter(value => typeof value === 'string' && value.trim()).map(value => value.trim())
        : [];
      if (values.length) detail[field] = values;
    }

    const files = Array.isArray(item.files)
      ? item.files
          .filter(file => file && typeof file === 'object')
          .map(file => {
            const pathValue = typeof file.path === 'string' ? file.path.trim() : '';
            const typeValue = typeof file.type === 'string' ? file.type.trim() : '';
            const target = typeof file.target === 'string' && file.target.trim() ? file.target.trim() : null;
            if (!pathValue || !typeValue) return null;
            return target
              ? { path: pathValue, type: typeValue, target }
              : { path: pathValue, type: typeValue };
          })
          .filter(Boolean)
      : [];
    if (files.length) detail.files = files;

    details.push(detail);
  }

  return details;
}

export function mergeCatalogItems(previous = {}, fresh = {}, failures = []) {
  const output = { ...fresh };
  for (const failure of failures) {
    const namespace = failure?.namespace;
    if (!namespace || fresh[namespace] || !previous[namespace]) continue;
    output[namespace] = previous[namespace];
  }
  return Object.fromEntries(Object.entries(output).sort(([a], [b]) => a.localeCompare(b)));
}

export function buildCatalogCoverageFacts(atlas = {}, itemSummaries = [], evidence = null) {
  const hasReviewedItems = Array.isArray(itemSummaries) && itemSummaries.length > 0;
  const hasCatalogEvidence = evidence?.status === 'available' || evidence?.status === 'stale';
  const coverageStatus = hasReviewedItems || hasCatalogEvidence
    ? 'verified'
    : (typeof atlas.coverage_status === 'string' ? atlas.coverage_status : 'unverified');
  const confidence = hasReviewedItems || hasCatalogEvidence
    ? 'high'
    : (typeof atlas.confidence === 'string' ? atlas.confidence : 'unknown');
  const evidenceStatus = evidence?.status === 'available'
    ? 'catalog'
    : evidence?.status === 'stale'
      ? 'stale-catalog'
      : 'none';
  return {
    coverage_status: coverageStatus,
    confidence,
    comparison_evidence: evidenceStatus,
    catalog_item_count: Number.isFinite(evidence?.item_count) ? evidence.item_count : 0,
    catalog_evidence_url: typeof evidence?.catalog_url === 'string' ? evidence.catalog_url : '',
  };
}

export function mergeCatalogEvidence(previous = {}, fresh = {}, failures = []) {
  const output = {};
  for (const [namespace, entry] of Object.entries(previous)) {
    if (!entry || typeof entry !== 'object') continue;
    const { component_tags: _retired, ...safe } = entry;
    output[namespace] = safe;
  }
  for (const [namespace, entry] of Object.entries(fresh)) {
    if (!entry || typeof entry !== 'object') continue;
    const { component_tags: _retired, ...safe } = entry;
    output[namespace] = safe;
  }
  for (const failure of failures) {
    const namespace = failure?.namespace;
    if (!namespace || fresh[namespace] || !output[namespace]) continue;
    output[namespace] = { ...output[namespace], status: 'stale' };
  }
  return Object.fromEntries(Object.entries(output).sort(([a], [b]) => a.localeCompare(b)));
}

async function readJsonIfExists(filePath) {
  try { return JSON.parse(await readFile(filePath, 'utf8')); }
  catch (error) { if (error?.code === 'ENOENT') return null; throw error; }
}

async function writeJson(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}
`);
}

async function writeCompactJson(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value)}
`);
}

export async function writeRegistryItemDetailBundles(outputDir, detailsByNamespace) {
  await mkdir(outputDir, { recursive: true });
  for (const [namespace, details] of Object.entries(detailsByNamespace ?? {})) {
    const normalized = normalizeNamespace(namespace);
    if (!normalized || !Array.isArray(details)) continue;
    const filename = `${encodeURIComponent(normalized.slice(1))}.json`;
    await writeCompactJson(path.join(outputDir, filename), details);
  }
}

function normalizeNamespace(value) {
  if (typeof value !== 'string' || !value.trim()) return '';
  const valueLower = value.trim().toLowerCase();
  return valueLower.startsWith('@') ? valueLower : `@${valueLower}`;
}

async function fetchCatalog(registry, timeoutMs, fetchImpl = fetch) {
  const namespace = normalizeNamespace(registry?.name);
  const catalogUrls = deriveCatalogUrls(registry?.url);
  if (!namespace || catalogUrls.length === 0) {
    return { failure: { namespace, reason: 'unsupported-template' } };
  }

  let lastFailure = { namespace, reason: 'fetch-error', catalog_url: catalogUrls[0] };
  for (const catalogUrl of catalogUrls) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const response = await fetchImpl(catalogUrl, { signal: AbortSignal.timeout(timeoutMs) });
        if (!response.ok) {
          lastFailure = {
            namespace,
            reason: `http-${response.status}`,
            catalog_url: response.url || catalogUrl,
          };
          if ((response.status === 429 || response.status >= 500) && attempt === 0) {
            await new Promise(resolve => setTimeout(resolve, 700));
            continue;
          }
          break;
        }

        let catalog;
        try {
          catalog = await response.json();
        } catch {
          lastFailure = {
            namespace,
            reason: 'invalid-json',
            catalog_url: response.url || catalogUrl,
          };
          break;
        }
        if (!Array.isArray(catalog?.items)) {
          lastFailure = {
            namespace,
            reason: 'invalid-registry-catalog',
            catalog_url: response.url || catalogUrl,
          };
          break;
        }

        const resolvedCatalogUrl = response.url || catalogUrl;
        return {
          evidence: buildCatalogEvidence(
            namespace,
            registry.url,
            catalog,
            new Date().toISOString(),
            resolvedCatalogUrl,
          ),
          items: buildCompactCatalogItems(catalog),
          details: buildRegistryItemDetailBundle(catalog),
        };
      } catch (error) {
        const errorName = error?.name ?? 'fetch-error';
        const reason = errorName === 'TimeoutError'
          ? 'timeout'
          : errorName === 'TypeError'
            ? 'network-error'
            : errorName;
        lastFailure = { namespace, reason, catalog_url: catalogUrl };
        if (attempt === 0) continue;
      }
    }
  }
  return { failure: lastFailure };
}

export function classifyCatalogFailureReason(reason) {
  if (reason === 'unsupported-template') return 'template-unsupported';
  if (reason === 'invalid-json' || reason === 'invalid-registry-catalog') return 'invalid-response';
  if (reason === 'http-403') return 'access-restricted';
  if (reason === 'http-429' || reason === 'timeout' || reason === 'network-error' || /^http-5\d\d$/.test(reason)) {
    return 'transient-network';
  }
  if (reason === 'http-400' || reason === 'http-404') return 'catalog-root-unavailable';
  return 'other';
}

export async function syncCatalogEvidenceForRegistries(
  registries,
  { previous = {}, previousItems = {}, concurrency = 16, timeoutMs = 8000, fetchImpl = fetch } = {},
) {
  if (!Array.isArray(registries)) throw new Error('Registry directory must be an array.');
  const queue = [...registries];
  const fresh = {};
  const freshItems = {};
  const freshDetails = {};
  const failures = [];
  let itemCount = 0;

  async function worker() {
    while (queue.length > 0) {
      const registry = queue.shift();
      const result = await fetchCatalog(registry, timeoutMs, fetchImpl);
      if (result.evidence) {
        fresh[result.evidence.namespace] = result.evidence;
        freshItems[result.evidence.namespace] = result.items ?? [];
        freshDetails[result.evidence.namespace] = result.details ?? [];
        itemCount += result.evidence.item_count;
      } else if (result.failure) failures.push(result.failure);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, registries.length) }, worker));
  const evidence = mergeCatalogEvidence(previous, fresh, failures);
  const itemsByNamespace = mergeCatalogItems(previousItems, freshItems, failures);
  const staleCount = Object.values(evidence).filter(item => item.status === 'stale').length;
  const discoverableItemCount = Object.values(itemsByNamespace)
    .reduce((count, items) => count + (Array.isArray(items) ? items.length : 0), 0);
  const sortedFailures = failures
    .map(failure => ({
      ...failure,
      failure_class: classifyCatalogFailureReason(failure.reason),
    }))
    .sort((a, b) => String(a.namespace).localeCompare(String(b.namespace)));
  const failureClassCounts = {};
  for (const failure of sortedFailures) {
    failureClassCounts[failure.failure_class] = (failureClassCounts[failure.failure_class] ?? 0) + 1;
  }

  const report = {
    generated_at: new Date().toISOString(),
    registry_count: registries.length,
    fetched_catalog_count: Object.keys(fresh).length,
    fetched_item_count: itemCount,
    discoverable_item_count: discoverableItemCount,
    evidence_registry_count: Object.keys(evidence).length,
    stale_registry_count: staleCount,
    failure_count: sortedFailures.length,
    failure_class_counts: failureClassCounts,
    failures: sortedFailures,
  };
  return { evidence, itemsByNamespace, freshDetailsByNamespace: freshDetails, report };
}

function parseArgs(argv) {
  const options = { source: DEFAULT_SOURCE_PATH, output: DEFAULT_OUTPUT_PATH, report: DEFAULT_REPORT_PATH, items: DEFAULT_ITEMS_PATH, detailsDir: DEFAULT_DETAILS_DIR, concurrency: 16, timeoutMs: 8000 };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--source') options.source = argv[++index] ?? options.source;
    else if (arg === '--output') options.output = argv[++index] ?? options.output;
    else if (arg === '--report') options.report = argv[++index] ?? options.report;
    else if (arg === '--items') options.items = argv[++index] ?? options.items;
    else if (arg === '--details-dir') options.detailsDir = argv[++index] ?? options.detailsDir;
    else if (arg === '--concurrency') options.concurrency = Math.max(1, Number(argv[++index]) || options.concurrency);
    else if (arg === '--timeout-ms') options.timeoutMs = Math.max(1000, Number(argv[++index]) || options.timeoutMs);
  }
  return options;
}

async function main(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  const registries = await readJsonIfExists(options.source);
  if (!Array.isArray(registries)) throw new Error(`${options.source} must contain the official registry array.`);
  const previous = await readJsonIfExists(options.output) ?? {};
  const previousIndex = await readJsonIfExists(options.items);
  const { evidence, itemsByNamespace, freshDetailsByNamespace, report } = await syncCatalogEvidenceForRegistries(registries, {
    previous,
    previousItems: previousIndex?.registries ?? {},
    concurrency: options.concurrency,
    timeoutMs: options.timeoutMs,
  });
  await writeJson(options.output, evidence);
  await writeCompactJson(options.items, {
    meta: {
      generated_at: report.generated_at,
      source: options.source,
      registry_count: Object.keys(itemsByNamespace).length,
      item_count: report.discoverable_item_count,
    },
    registries: itemsByNamespace,
  });
  await writeRegistryItemDetailBundles(options.detailsDir, freshDetailsByNamespace);
  await writeJson(options.report, report);
  console.log(`Fetched ${report.fetched_catalog_count}/${report.registry_count} registry catalogs (${report.fetched_item_count} items).`);
  console.log(`Comparable evidence retained for ${report.evidence_registry_count} registries; stale: ${report.stale_registry_count}; failures: ${report.failure_count}.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}

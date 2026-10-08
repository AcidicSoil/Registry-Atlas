import { pathToFileURL } from 'node:url';
import {
  applyCatalogClassificationOverlay,
  stripCatalogClassificationFields,
  validateCatalogClassificationOverlay,
} from './lib/catalog-classification-overlay.mjs';
import { validateCatalogTaxonomy } from './lib/catalog-taxonomy.mjs';
import {
  openAtlasCoreDatabase,
  openAtlasDetailDatabase,
  putDocument,
  readAtlasState,
  replaceCatalogEvidence,
  replaceCatalogSnapshot,
  replaceItemDetails,
} from './lib/atlas-storage.mjs';

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

function deriveCatalogCandidates(template) {
  if (typeof template !== 'string' || !template.includes('{name}')) return [];

  const itemTemplates = [];
  if (template.includes('{style}')) {
    itemTemplates.push(
      template.replace(/\/\{style\}(?=\/)/g, ''),
      template.replaceAll('{style}', 'new-york-v4'),
      template.replaceAll('{style}', 'new-york'),
      template.replaceAll('{style}', 'default'),
    );
  } else {
    itemTemplates.push(template);
  }

  const candidates = [];
  for (const itemTemplate of itemTemplates) {
    const catalogCandidate = resolveItemUrlFromTemplate(itemTemplate, 'registry');
    if (!catalogCandidate || candidates.some(candidate => candidate.catalogUrl === catalogCandidate)) continue;
    candidates.push({ catalogUrl: catalogCandidate, itemTemplate });
  }
  return candidates;
}

export function deriveCatalogUrls(template) {
  return deriveCatalogCandidates(template).map(candidate => candidate.catalogUrl);
}

function resolveItemUrlFromTemplate(template, itemName) {
  if (typeof template !== 'string' || typeof itemName !== 'string') return null;
  const trimmedName = itemName.trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(trimmedName)) return null;
  const encodedName = trimmedName.split('/').map(segment => encodeURIComponent(segment)).join('/');
  const candidate = template.replaceAll('{name}', encodedName);
  if (/\{[^}]+\}/.test(candidate)) return null;
  try {
    const url = new URL(candidate);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
  } catch {
    return null;
  }
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

export function rawItemUrlFromCatalogUrl(catalogUrl, itemName) {
  if (typeof catalogUrl !== 'string' || typeof itemName !== 'string') return null;
  const trimmedName = itemName.trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(trimmedName)) return null;
  try {
    const url = new URL(catalogUrl);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    const lastSlash = url.pathname.lastIndexOf('/');
    if (lastSlash < 0) return null;
    const leaf = url.pathname.slice(lastSlash + 1);
    if (leaf !== 'registry.json' && leaf !== 'registry') return null;
    const encodedName = trimmedName.split('/').map(segment => encodeURIComponent(segment)).join('/');
    url.pathname = `${url.pathname.slice(0, lastSlash + 1)}${encodedName}${leaf.endsWith('.json') ? '.json' : ''}`;
    return url.href;
  } catch {
    return null;
  }
}

export function buildCompactCatalogItems(catalog, resolvedCatalogUrl = null) {
  const allowedTypes = new Set(DISCOVERABLE_REGISTRY_ITEM_TYPES);
  const items = [];

  for (const item of Array.isArray(catalog?.items) ? catalog.items : []) {
    if (!item || typeof item !== 'object') continue;
    const name = typeof item.name === 'string' ? item.name.trim() : '';
    const type = typeof item.type === 'string' ? item.type.trim() : '';
    if (!name || !allowedTypes.has(type)) continue;

    const compact = { name, type };
    const rawItemUrl = rawItemUrlFromCatalogUrl(resolvedCatalogUrl, name);
    if (rawItemUrl) compact.rawItemUrl = rawItemUrl;
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

function normalizeNamespace(value) {
  if (typeof value !== 'string' || !value.trim()) return '';
  const valueLower = value.trim().toLowerCase();
  return valueLower.startsWith('@') ? valueLower : `@${valueLower}`;
}

async function fetchCatalog(registry, timeoutMs, fetchImpl = fetch) {
  const namespace = normalizeNamespace(registry?.name);
  const candidates = deriveCatalogCandidates(registry?.url);
  if (!namespace || candidates.length === 0) {
    return { failure: { namespace, reason: 'unsupported-template' } };
  }

  let lastFailure = { namespace, reason: 'fetch-error', catalog_url: candidates[0].catalogUrl };
  for (const candidate of candidates) {
    const { catalogUrl } = candidate;
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
          items: buildCompactCatalogItems(catalog, resolvedCatalogUrl),
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
  const options = { concurrency: 16, timeoutMs: 8000 };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--concurrency') options.concurrency = Math.max(1, Number(argv[++index]) || options.concurrency);
    else if (arg === '--timeout-ms') options.timeoutMs = Math.max(1000, Number(argv[++index]) || options.timeoutMs);
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return options;
}

async function main(argv = process.argv.slice(2), cwd = process.cwd()) {
  const options = parseArgs(argv);
  const core = openAtlasCoreDatabase(cwd);
  const details = openAtlasDetailDatabase(cwd);
  try {
    const state = readAtlasState(core);
    const registries = state.rawRegistries;
    if (!Array.isArray(registries) || registries.length === 0) {
      throw new Error('The Atlas database does not contain the official registry directory');
    }
    const result = await syncCatalogEvidenceForRegistries(registries, {
      previous: state.catalogEvidence,
      previousItems: state.catalog?.registries ?? {},
      concurrency: options.concurrency,
      timeoutMs: options.timeoutMs,
    });
    const stripped = stripCatalogClassificationFields(result.itemsByNamespace);
    let projected = { itemsByNamespace: stripped, report: { applied: 0, stale: 0, missing: 0 } };
    if (state.classificationOverlay) {
      if (!state.taxonomy) throw new Error('Catalog taxonomy is missing from the Atlas database');
      const taxonomy = validateCatalogTaxonomy(state.taxonomy);
      const overlay = validateCatalogClassificationOverlay(state.classificationOverlay, taxonomy);
      projected = applyCatalogClassificationOverlay(stripped, overlay, state.accessRules ?? {});
    }

    replaceCatalogEvidence(core, result.evidence);
    replaceCatalogSnapshot(core, {
      meta: {
        source_url: state.runtime?.meta?.source_url ?? 'database:raw-registries',
        generated_at: result.report.generated_at,
        registry_count: Object.keys(projected.itemsByNamespace).length,
        item_count: result.report.discoverable_item_count,
      },
      registries: projected.itemsByNamespace,
    });
    for (const [namespace, rows] of Object.entries(result.freshDetailsByNamespace)) {
      replaceItemDetails(details, namespace, rows);
    }
    putDocument(core, 'catalog-evidence-report', 'sync-report', result.report);
    putDocument(core, 'catalog-classification-projection-report', 'sync-report', projected.report);

    console.log(`Fetched ${result.report.fetched_catalog_count}/${result.report.registry_count} registry catalogs (${result.report.fetched_item_count} items).`);
    console.log(`Comparable evidence retained for ${result.report.evidence_registry_count} registries; stale: ${result.report.stale_registry_count}; failures: ${result.report.failure_count}.`);
  } finally {
    details.close();
    core.close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}

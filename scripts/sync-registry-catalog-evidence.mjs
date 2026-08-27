import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const DEFAULT_SOURCE_PATH = 'data/shadcn/registries.raw.json';
const DEFAULT_OUTPUT_PATH = 'data/shadcn/registry-catalog-evidence.json';
const DEFAULT_REPORT_PATH = 'data/shadcn/registry-catalog-evidence-report.json';

export const COMPONENT_TAGS = Object.freeze([
  "chatbot", "chat-window", "message-list", "typing-indicator", "prompt-box", "button", "input", "badge",
  "avatar", "toolbar", "icon-button", "loading-button", "toggle", "switch", "select", "textarea",
  "table", "data-grid", "filter-bar", "pagination", "chart", "stat-widget", "auth-form", "password-input",
  "stepper", "alert", "navbar", "sidebar", "breadcrumb", "app-shell", "tabs", "dropdown",
  "hero-section", "feature-grid", "testimonial", "cta-section", "card", "product-card", "price-badge", "cart-drawer",
  "mini-cart", "column-resize", "search-input", "tag-input", "checkbox", "radio", "datepicker", "submit-button",
  "error-message", "toast", "modal", "dialog", "drawer", "skeleton", "spinner", "accordion",
  "calendar", "carousel", "collapsible", "combobox", "command", "context-menu", "hover-card", "menubar",
  "popover", "progress", "radio-group", "scroll-area", "separator", "sheet", "slider", "tooltip",
  "file-upload", "dropzone", "pricing-table", "timeline", "scroll-progress", "color-picker", "audio-player", "waveform",
  "voice-picker", "transcript-viewer", "cropper", "compare-slider", "color-swatch", "circular-progress", "angle-slider", "map-pointer",
  "chat-interface", "qr-code", "admonition", "card-deck", "zoomable-image", "utility-button", "syntax-highlighting", "code-block",
  "otp-input", "audit", "receipt", "pill", "decision-pill", "status-pill", "theme", "ai-chat"
]);

const TAG_ALIASES = Object.freeze({
  'qr-code': ['qrcode', 'qr'],
  'otp-input': ['input-otp', 'otp'],
  'code-block': ['codeblock', 'code-snippet'],
  'syntax-highlighting': ['syntax-highlighter', 'syntax-highlight'],
  'chat-interface': ['chat-ui', 'chat-interface'],
  'ai-chat': ['ai-chat', 'llm-chat'],
  'map-pointer': ['mapbox-pointer', 'map-pin'],
  'utility-button': ['copy-button', 'clipboard-button'],
  'zoomable-image': ['image-zoom', 'zoom-image'],
  'card-deck': ['card-stack', 'swipe-cards'],
  'admonition': ['callout'],
  'circular-progress': ['radial-progress', 'circle-progress'],
  'compare-slider': ['before-after', 'image-compare'],
});

function normalize(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function containsTerm(value, term) {
  if (!value || !term) return false;
  return value === term || `-${value}-`.includes(`-${term}-`);
}

export function deriveCatalogUrl(template) {
  if (typeof template !== 'string' || !template.includes('{name}')) return null;
  const candidate = template.replaceAll('{name}', 'registry');
  if (/\{[^}]+\}/.test(candidate)) return null;
  try {
    const url = new URL(candidate);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
  } catch {
    return null;
  }
}

export function inferComponentTagsFromCatalogItems(items) {
  const tags = new Set();
  for (const item of Array.isArray(items) ? items : []) {
    if (!item || typeof item !== 'object') continue;
    const values = [item.name, item.title, item.category]
      .map(normalize)
      .filter(Boolean);
    for (const tag of COMPONENT_TAGS) {
      const normalizedTag = normalize(tag);
      if (values.some(value => containsTerm(value, normalizedTag))) tags.add(tag);
      for (const alias of TAG_ALIASES[tag] ?? []) {
        if (values.some(value => containsTerm(value, normalize(alias)))) tags.add(tag);
      }
    }
  }
  return [...tags].sort((a, b) => a.localeCompare(b));
}

export function buildCatalogEvidence(namespace, template, catalog, syncedAt = new Date().toISOString()) {
  const catalogUrl = deriveCatalogUrl(template);
  if (!catalogUrl || !catalog || !Array.isArray(catalog.items)) return null;
  return {
    namespace,
    catalog_url: catalogUrl,
    item_count: catalog.items.length,
    component_tags: inferComponentTagsFromCatalogItems(catalog.items),
    status: 'available',
    synced_at: syncedAt,
  };
}

function itemSummaryTags(item) {
  return [
    ...(Array.isArray(item?.component_tags_existing) ? item.component_tags_existing : []),
    ...(Array.isArray(item?.componentTagsExisting) ? item.componentTagsExisting : []),
    ...(Array.isArray(item?.component_tags_proposed) ? item.component_tags_proposed : []),
    ...(Array.isArray(item?.componentTagsProposed) ? item.componentTagsProposed : []),
  ].filter(tag => COMPONENT_TAGS.includes(tag));
}

export function applyCatalogEvidenceToAtlas(atlas = {}, itemSummaries = [], evidence = null) {
  const tags = new Set(Array.isArray(atlas.component_tags) ? atlas.component_tags : []);
  for (const item of Array.isArray(itemSummaries) ? itemSummaries : []) {
    itemSummaryTags(item).forEach(tag => tags.add(tag));
  }
  for (const tag of Array.isArray(evidence?.component_tags) ? evidence.component_tags : []) {
    if (COMPONENT_TAGS.includes(tag)) tags.add(tag);
  }

  const hasItems = Array.isArray(itemSummaries) && itemSummaries.length > 0;
  const hasCatalogEvidence = Array.isArray(evidence?.component_tags) && evidence.component_tags.length > 0;
  let coverageStatus = typeof atlas.coverage_status === 'string' ? atlas.coverage_status : 'unverified';
  let confidence = typeof atlas.confidence === 'string' ? atlas.confidence : 'unknown';
  if (hasItems) {
    coverageStatus = 'verified';
    confidence = 'high';
  } else if (hasCatalogEvidence) {
    if (coverageStatus === 'unverified' || coverageStatus === 'unavailable') coverageStatus = 'inferred';
    if (confidence === 'unknown' || confidence === 'low') confidence = 'medium';
  }
  const evidenceStatus = evidence?.status === 'available'
    ? 'catalog'
    : evidence?.status === 'stale'
      ? 'stale-catalog'
      : 'none';
  return {
    component_tags: [...tags].sort((a, b) => a.localeCompare(b)),
    coverage_status: coverageStatus,
    confidence,
    comparison_evidence: evidenceStatus,
    catalog_item_count: Number.isFinite(evidence?.item_count) ? evidence.item_count : 0,
    catalog_evidence_url: typeof evidence?.catalog_url === 'string' ? evidence.catalog_url : '',
  };
}

export function mergeCatalogEvidence(previous = {}, fresh = {}, failures = []) {
  const output = { ...previous, ...fresh };
  for (const failure of failures) {
    const namespace = failure?.namespace;
    if (!namespace || fresh[namespace] || !previous[namespace]) continue;
    output[namespace] = { ...previous[namespace], status: 'stale' };
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

function normalizeNamespace(value) {
  if (typeof value !== 'string' || !value.trim()) return '';
  const valueLower = value.trim().toLowerCase();
  return valueLower.startsWith('@') ? valueLower : `@${valueLower}`;
}

async function fetchCatalog(registry, timeoutMs, fetchImpl = fetch) {
  const namespace = normalizeNamespace(registry?.name);
  const catalogUrl = deriveCatalogUrl(registry?.url);
  if (!namespace || !catalogUrl) return { failure: { namespace, reason: 'unsupported-template' } };
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetchImpl(catalogUrl, { signal: AbortSignal.timeout(timeoutMs) });
      if (!response.ok) {
        if ((response.status === 429 || response.status >= 500) && attempt === 0) {
          await new Promise(resolve => setTimeout(resolve, 700));
          continue;
        }
        return { failure: { namespace, reason: `http-${response.status}`, catalog_url: catalogUrl } };
      }
      const catalog = await response.json();
      if (!Array.isArray(catalog?.items)) {
        return { failure: { namespace, reason: 'invalid-registry-catalog', catalog_url: catalogUrl } };
      }
      return { evidence: buildCatalogEvidence(namespace, registry.url, catalog) };
    } catch (error) {
      if (attempt === 0) continue;
      return { failure: { namespace, reason: error?.name ?? 'fetch-error', catalog_url: catalogUrl } };
    }
  }
  return { failure: { namespace, reason: 'fetch-error', catalog_url: catalogUrl } };
}

export async function syncCatalogEvidenceForRegistries(
  registries,
  { previous = {}, concurrency = 16, timeoutMs = 8000, fetchImpl = fetch } = {},
) {
  if (!Array.isArray(registries)) throw new Error('Registry directory must be an array.');
  const queue = [...registries];
  const fresh = {};
  const failures = [];
  let itemCount = 0;

  async function worker() {
    while (queue.length > 0) {
      const registry = queue.shift();
      const result = await fetchCatalog(registry, timeoutMs, fetchImpl);
      if (result.evidence) {
        fresh[result.evidence.namespace] = result.evidence;
        itemCount += result.evidence.item_count;
      } else if (result.failure) failures.push(result.failure);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, registries.length) }, worker));
  const evidence = mergeCatalogEvidence(previous, fresh, failures);
  const staleCount = Object.values(evidence).filter(item => item.status === 'stale').length;
  const report = {
    generated_at: new Date().toISOString(),
    registry_count: registries.length,
    fetched_catalog_count: Object.keys(fresh).length,
    fetched_item_count: itemCount,
    evidence_registry_count: Object.keys(evidence).length,
    stale_registry_count: staleCount,
    failure_count: failures.length,
    failures: failures.sort((a, b) => String(a.namespace).localeCompare(String(b.namespace))),
  };
  return { evidence, report };
}

function parseArgs(argv) {
  const options = { source: DEFAULT_SOURCE_PATH, output: DEFAULT_OUTPUT_PATH, report: DEFAULT_REPORT_PATH, concurrency: 16, timeoutMs: 8000 };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--source') options.source = argv[++index] ?? options.source;
    else if (arg === '--output') options.output = argv[++index] ?? options.output;
    else if (arg === '--report') options.report = argv[++index] ?? options.report;
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
  const { evidence, report } = await syncCatalogEvidenceForRegistries(registries, {
    previous,
    concurrency: options.concurrency,
    timeoutMs: options.timeoutMs,
  });
  await writeJson(options.output, evidence);
  await writeJson(options.report, report);
  console.log(`Fetched ${report.fetched_catalog_count}/${report.registry_count} registry catalogs (${report.fetched_item_count} items).`);
  console.log(`Comparable evidence retained for ${report.evidence_registry_count} registries; stale: ${report.stale_registry_count}; failures: ${report.failure_count}.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}

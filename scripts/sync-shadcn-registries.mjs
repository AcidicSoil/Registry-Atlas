import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const SOURCE_URL = 'https://ui.shadcn.com/r/registries.json';
const RAW_OUTPUT_PATH = 'data/shadcn/registries.raw.json';
const REPORT_OUTPUT_PATH = 'data/shadcn/sync-report.json';
const RUNTIME_OUTPUT_PATH = 'public/data/registries.json';
const LEGACY_DATA_PATH = 'src/registry-explorer/data/registries.data.ts';
const REGISTRY_ITEMS_PATH = 'data/shadcn/registry-items.json';

const DEFAULT_ATLAS_ENRICHMENT = Object.freeze({
  primary_focus: [],
  component_tags: [],
  aliases: [],
  coverage_status: 'unverified',
  confidence: 'unknown',
  notes: '',
  catalog_status: 'unavailable',
  item_summaries: [],
});

async function readJsonIfExists(filePath) {
  try {
    return JSON.parse(await readFile(filePath, 'utf8'));
  } catch (error) {
    if (error && error.code === 'ENOENT') return null;
    throw error;
  }
}

async function writeJson(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function normalizeNamespace(value) {
  if (typeof value !== 'string') return '';
  return value.startsWith('@') ? value : `@${value}`;
}

function legacyNameCandidates(registry) {
  const rawName = typeof registry.name === 'string' ? registry.name : '';
  const normalized = normalizeNamespace(rawName);

  return new Set([
    rawName,
    normalized,
    normalized.slice(1),
    rawName.startsWith('@') ? rawName.slice(1) : rawName,
  ].filter(Boolean));
}

async function readLegacyEnrichment() {
  let source;
  try {
    source = await readFile(LEGACY_DATA_PATH, 'utf8');
  } catch (error) {
    if (error && error.code === 'ENOENT') return new Map();
    throw error;
  }

  const executableSource = source
    .replace(/^import type .*;\n/m, '')
    .replace(/export const registries: ReadonlyArray<Registry> = /, 'const registries = ');

  const registries = Function(`${executableSource}\nreturn registries;`)();
  const enrichment = new Map();

  for (const registry of registries) {
    const atlas = {
      primary_focus: Array.isArray(registry.primary_focus) ? registry.primary_focus : [],
      component_tags: Array.isArray(registry.component_tags) ? registry.component_tags : [],
      aliases: [],
      coverage_status: 'inferred',
      confidence: 'medium',
      notes: '',
    };

    for (const candidate of legacyNameCandidates(registry)) {
      enrichment.set(candidate, atlas);
    }
  }

  return enrichment;
}

function readPreviousEnrichment(previousRuntimeData) {
  const enrichment = new Map();

  if (!previousRuntimeData || !Array.isArray(previousRuntimeData.registries)) {
    return enrichment;
  }

  for (const registry of previousRuntimeData.registries) {
    const name = registry?.official?.name;
    if (typeof name === 'string' && registry.atlas && typeof registry.atlas === 'object') {
      enrichment.set(name, registry.atlas);
    }
  }

  return enrichment;
}

function normalizeStringArray(value) {
  return Array.isArray(value) ? value.filter(item => typeof item === 'string') : [];
}

function normalizeFiles(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter(file => file && typeof file === 'object')
    .map(file => ({
      path: typeof file.path === 'string' ? file.path : '',
      type: typeof file.type === 'string' ? file.type : '',
      target: typeof file.target === 'string' ? file.target : undefined,
    }))
    .filter(file => file.path && file.type);
}

function optionalString(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function normalizeItemSummary(item) {
  return {
    name: item.name,
    slug: item.slug,
    title: optionalString(item.title),
    description: optionalString(item.description),
    type: item.type,
    category: item.category,
    component_tags_existing: normalizeStringArray(item.component_tags_existing),
    component_tags_proposed: normalizeStringArray(item.component_tags_proposed),
    source: item.source,
    provenance: item.provenance,
    catalog_status: item.catalog_status ?? item.catalogStatus,
    confidence: optionalString(item.confidence),
    route_eligible: Boolean(item.route_eligible ?? item.routeEligible),
    install_token: optionalString(item.install_token),
    view_command: optionalString(item.view_command),
    install_command: optionalString(item.install_command),
    raw_item_url: optionalString(item.raw_item_url),
    docs_url: optionalString(item.docs_url),
    preview_url: optionalString(item.preview_url),
    evidence_url: optionalString(item.evidence_url),
    evidence_note: optionalString(item.evidence_note),
    dependencies: normalizeStringArray(item.dependencies),
    devDependencies: normalizeStringArray(item.devDependencies),
    registryDependencies: normalizeStringArray(item.registryDependencies),
    files: normalizeFiles(item.files),
    warnings: normalizeStringArray(item.warnings),
  };
}

function normalizeOfficialRegistry(registry, enrichmentByNamespace, legacyEnrichment, itemSummariesByNamespace) {
  const name = normalizeNamespace(registry.name);
  const atlas =
    enrichmentByNamespace.get(name) ||
    legacyEnrichment.get(name) ||
    legacyEnrichment.get(name.slice(1)) ||
    DEFAULT_ATLAS_ENRICHMENT;
  const itemSummaries = Array.isArray(itemSummariesByNamespace?.[name])
    ? itemSummariesByNamespace[name].map(normalizeItemSummary)
    : [];
  const catalogStatus = itemSummaries.length > 0
    ? (itemSummaries.some(item => item.catalog_status === 'partial') ? 'partial' : 'available')
    : (typeof atlas.catalog_status === 'string' ? atlas.catalog_status : 'unavailable');

  return {
    official: {
      name,
      homepage: typeof registry.homepage === 'string' ? registry.homepage : '',
      registry_url_template: typeof registry.url === 'string' ? registry.url : '',
      description: typeof registry.description === 'string' ? registry.description : '',
    },
    atlas: {
      primary_focus: Array.isArray(atlas.primary_focus) ? atlas.primary_focus : [],
      component_tags: Array.isArray(atlas.component_tags) ? atlas.component_tags : [],
      aliases: Array.isArray(atlas.aliases) ? atlas.aliases : [],
      coverage_status: itemSummaries.length > 0 ? 'verified' : (typeof atlas.coverage_status === 'string' ? atlas.coverage_status : 'unverified'),
      confidence: itemSummaries.length > 0 ? 'high' : (typeof atlas.confidence === 'string' ? atlas.confidence : 'unknown'),
      catalog_status: catalogStatus,
      item_summaries: itemSummaries,
      notes: typeof atlas.notes === 'string' ? atlas.notes : '',
    },
    status: {
      warnings: [],
    },
  };
}

function sortedNames(registries) {
  return registries
    .map(registry => registry?.official?.name)
    .filter(name => typeof name === 'string')
    .sort((a, b) => a.localeCompare(b));
}

function changedRegistries(previousRegistries, nextRegistries) {
  const previous = new Map(previousRegistries.map(registry => [registry.official.name, registry]));
  const changed = [];

  for (const registry of nextRegistries) {
    const old = previous.get(registry.official.name);
    if (!old) continue;

    const oldOfficial = JSON.stringify(old.official);
    const nextOfficial = JSON.stringify(registry.official);
    if (oldOfficial !== nextOfficial) {
      changed.push(registry.official.name);
    }
  }

  return changed.sort((a, b) => a.localeCompare(b));
}

async function main() {
  const response = await fetch(SOURCE_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${SOURCE_URL}: ${response.status} ${response.statusText}`);
  }

  const upstream = await response.json();
  if (!Array.isArray(upstream)) {
    throw new Error('Official registry directory response must be a JSON array.');
  }

  const previousRuntimeData = await readJsonIfExists(RUNTIME_OUTPUT_PATH);
  const previousRegistries = Array.isArray(previousRuntimeData?.registries)
    ? previousRuntimeData.registries
    : [];
  const previousEnrichment = readPreviousEnrichment(previousRuntimeData);
  const legacyEnrichment = await readLegacyEnrichment();
  const itemSummariesByNamespace = await readJsonIfExists(REGISTRY_ITEMS_PATH) ?? {};
  const syncedAt = new Date().toISOString();

  const registries = upstream.map(registry =>
    normalizeOfficialRegistry(registry, previousEnrichment, legacyEnrichment, itemSummariesByNamespace)
  );

  const runtimeData = {
    meta: {
      source_url: SOURCE_URL,
      synced_at: syncedAt,
      upstream_count: upstream.length,
      registry_count: registries.length,
      local_count: registries.length,
      validation_status: 'not_run',
      report_path: REPORT_OUTPUT_PATH,
    },
    registries,
  };

  const previousNames = new Set(sortedNames(previousRegistries));
  const nextNames = new Set(sortedNames(registries));
  const added = [...nextNames].filter(name => !previousNames.has(name)).sort((a, b) => a.localeCompare(b));
  const removed = [...previousNames].filter(name => !nextNames.has(name)).sort((a, b) => a.localeCompare(b));

  const report = {
    source_url: SOURCE_URL,
    synced_at: syncedAt,
    upstream_count: upstream.length,
    local_count: registries.length,
    previous_count: previousRegistries.length,
    added,
    removed,
    changed: changedRegistries(previousRegistries, registries),
  };

  await writeJson(RAW_OUTPUT_PATH, upstream);
  await writeJson(RUNTIME_OUTPUT_PATH, runtimeData);
  await writeJson(REPORT_OUTPUT_PATH, report);

  console.log(`Synced ${registries.length} registries from ${SOURCE_URL}`);
  console.log(`Raw: ${RAW_OUTPUT_PATH}`);
  console.log(`Runtime: ${RUNTIME_OUTPUT_PATH}`);
  console.log(`Report: ${REPORT_OUTPUT_PATH}`);
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

import { buildCatalogCoverageFacts, syncCatalogEvidenceForRegistries } from './sync-registry-catalog-evidence.mjs';
import { applyCatalogClassificationOverlay, stripCatalogClassificationFields, validateCatalogClassificationOverlay } from './lib/catalog-classification-overlay.mjs';
import { validateCatalogTaxonomy } from './lib/catalog-taxonomy.mjs';
import {
  openAtlasCoreDatabase,
  openAtlasDetailDatabase,
  putDocument,
  readAtlasState,
  replaceCatalogEvidence,
  replaceCatalogSnapshot,
  replaceItemDetails,
  replaceRawRegistries,
  replaceRegistrySnapshot,
} from './lib/atlas-storage.mjs';
import { pathToFileURL } from 'node:url';

const SOURCE_URL = 'https://ui.shadcn.com/r/registries.json';

const DEFAULT_ATLAS_ENRICHMENT = Object.freeze({
  aliases: [],
  coverage_status: 'unverified',
  confidence: 'unknown',
  notes: '',
  catalog_status: 'unavailable',
  item_summaries: [],
});

function normalizeNamespace(value) {
  if (typeof value !== 'string') return '';
  return value.startsWith('@') ? value : `@${value}`;
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
    evidence_url: optionalString(item.evidence_url),
    evidence_note: optionalString(item.evidence_note),
    dependencies: normalizeStringArray(item.dependencies),
    devDependencies: normalizeStringArray(item.devDependencies),
    registryDependencies: normalizeStringArray(item.registryDependencies),
    files: normalizeFiles(item.files),
    warnings: normalizeStringArray(item.warnings),
  };
}

function normalizeOfficialRegistry(registry, enrichmentByNamespace, itemSummariesByNamespace, catalogEvidenceByNamespace) {
  const name = normalizeNamespace(registry.name);
  const atlas = enrichmentByNamespace.get(name) || DEFAULT_ATLAS_ENRICHMENT;
  const itemSummaries = Array.isArray(itemSummariesByNamespace?.[name])
    ? itemSummariesByNamespace[name].map(normalizeItemSummary)
    : [];
  const catalogEvidence = catalogEvidenceByNamespace?.[name] ?? null;
  const catalogFacts = buildCatalogCoverageFacts(atlas, itemSummaries, catalogEvidence);
  const catalogStatus = itemSummaries.length > 0
    ? (itemSummaries.some(item => item.catalog_status === 'partial') ? 'partial' : 'available')
    : (catalogFacts.comparison_evidence === 'catalog' || catalogFacts.comparison_evidence === 'stale-catalog'
      ? 'available'
      : 'unavailable');

  return {
    official: {
      name,
      homepage: typeof registry.homepage === 'string' ? registry.homepage : '',
      registry_url_template: typeof registry.url === 'string' ? registry.url : '',
      description: typeof registry.description === 'string' ? registry.description : '',
    },
    atlas: {
      aliases: Array.isArray(atlas.aliases) ? atlas.aliases : [],
      coverage_status: catalogFacts.coverage_status,
      confidence: catalogFacts.confidence,
      catalog_status: catalogStatus,
      comparison_evidence: catalogFacts.comparison_evidence,
      catalog_item_count: catalogFacts.catalog_item_count,
      catalog_evidence_url: catalogFacts.catalog_evidence_url,
      item_summaries: itemSummaries,
      notes: typeof atlas.notes === 'string' ? atlas.notes : '',
    },
    status: { warnings: [] },
  };
}

export function projectReviewedCatalogClassifications(
  itemsByNamespace,
  { taxonomy, overlay = null, accessRules = {} } = {},
) {
  const reviewedTaxonomy = validateCatalogTaxonomy(taxonomy);
  const stripped = stripCatalogClassificationFields(itemsByNamespace);
  if (!overlay) {
    return {
      itemsByNamespace: stripped,
      report: { applied: 0, stale: 0, missing: 0 },
    };
  }
  const reviewedOverlay = validateCatalogClassificationOverlay(overlay, reviewedTaxonomy);
  return applyCatalogClassificationOverlay(stripped, reviewedOverlay, accessRules);
}

export function projectCuratedSummaries(runtime, curated) {
  if (!Array.isArray(runtime?.registries)) throw new Error('Expected an official runtime mirror');
  const names = new Map(runtime.registries.map((entry, index) => [entry.official.name, index]));
  const output = structuredClone(runtime);
  for (const [namespace, items] of Object.entries(curated)) {
    const index = names.get(namespace);
    if (index === undefined) throw new Error(`Curated namespace ${namespace} not in official runtime mirror`);
    if (!Array.isArray(items)) throw new Error(`Invalid curated items in ${namespace}`);
    const slugs = new Set();
    for (const item of items) {
      if (!item?.slug || slugs.has(item.slug)) {
        throw new Error(`duplicate curated slug in ${namespace}: ${item?.slug}`);
      }
      slugs.add(item.slug);
    }
    const atlas = output.registries[index].atlas;
    atlas.item_summaries = items.map(normalizeItemSummary);
    if (items.length && atlas.catalog_status === 'unavailable') atlas.catalog_status = 'available';
  }
  return output;
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
  const core = openAtlasCoreDatabase();
  const details = openAtlasDetailDatabase();
  try {
    const state = readAtlasState(core);

    if (process.argv.includes('--local-curated-only')) {
      const projected = projectCuratedSummaries(state.runtime, state.curated);
      replaceRegistrySnapshot(core, projected);
      console.log('Projected curated item summaries directly into data/registry-atlas.sqlite');
      return;
    }

    const response = await fetch(SOURCE_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${SOURCE_URL}: ${response.status} ${response.statusText}`);
    }

    const upstream = await response.json();
    if (!Array.isArray(upstream)) {
      throw new Error('Official registry directory response must be a JSON array.');
    }

    const previousRuntimeData = state.runtime;
    const previousRegistries = Array.isArray(previousRuntimeData?.registries)
      ? previousRuntimeData.registries
      : [];
    const previousEnrichment = readPreviousEnrichment(previousRuntimeData);
    const catalogSync = await syncCatalogEvidenceForRegistries(upstream, {
      previous: state.catalogEvidence,
      previousItems: state.catalog?.registries ?? {},
    });

    if (!state.taxonomy) throw new Error('Missing catalog-taxonomy document in data/registry-atlas.sqlite');
    const taxonomy = validateCatalogTaxonomy(state.taxonomy);
    const classificationProjection = projectReviewedCatalogClassifications(
      catalogSync.itemsByNamespace,
      {
        taxonomy,
        overlay: state.classificationOverlay,
        accessRules: state.accessRules ?? {},
      },
    );
    const catalogEvidenceByNamespace = catalogSync.evidence;
    const syncedAt = new Date().toISOString();

    const registries = upstream.map(registry =>
      normalizeOfficialRegistry(
        registry,
        previousEnrichment,
        state.curated,
        catalogEvidenceByNamespace,
      )
    );

    const runtimeData = {
      meta: {
        source_url: SOURCE_URL,
        synced_at: syncedAt,
        upstream_count: upstream.length,
        registry_count: registries.length,
        local_count: registries.length,
        validation_status: 'not_run',
        report_path: 'database:registry-sync-report',
      },
      registries,
    };

    const previousNames = new Set(sortedNames(previousRegistries));
    const nextNames = new Set(sortedNames(registries));
    const added = [...nextNames].filter(name => !previousNames.has(name))
      .sort((a, b) => a.localeCompare(b));
    const removed = [...previousNames].filter(name => !nextNames.has(name))
      .sort((a, b) => a.localeCompare(b));

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

    replaceRawRegistries(core, upstream);
    replaceCatalogEvidence(core, catalogEvidenceByNamespace);
    putDocument(core, 'catalog-evidence-report', 'sync-report', catalogSync.report);
    replaceCatalogSnapshot(core, {
      meta: {
        source_url: SOURCE_URL,
        synced_at: syncedAt,
        registry_count: Object.keys(classificationProjection.itemsByNamespace).length,
        item_count: catalogSync.report.discoverable_item_count,
      },
      registries: classificationProjection.itemsByNamespace,
    });
    for (const [namespace, rows] of Object.entries(catalogSync.freshDetailsByNamespace)) {
      replaceItemDetails(details, namespace, rows);
    }
    replaceRegistrySnapshot(core, runtimeData);
    putDocument(core, 'registry-sync-report', 'sync-report', report);
    putDocument(core, 'catalog-classification-projection-report', 'sync-report',
      classificationProjection.report);

    console.log(`Synced ${registries.length} registries from ${SOURCE_URL}`);
    console.log(`Catalog evidence: ${catalogSync.report.fetched_catalog_count} fetched, ${catalogSync.report.stale_registry_count} stale, ${catalogSync.report.failure_count} failed`);
    console.log('Canonical registry/catalog state: data/registry-atlas.sqlite');
    console.log('Canonical item details: data/registry-details.sqlite');
  } finally {
    details.close();
    core.close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { validateCatalogRuntimeContract } from './lib/catalog-runtime-contract.mjs';
import {
  openAtlasCoreDatabase,
  openAtlasDetailDatabase,
  readAtlasState,
} from './lib/atlas-storage.mjs';

const root = process.cwd();
const failures = [];

function read(relative) {
  return readFileSync(path.join(root, relative), 'utf8');
}

function assert(condition, message) {
  if (!condition) failures.push(message);
}

const routeSource = read('src/registry-explorer/core/catalogRoutes.ts');
const shellSource = read('src/registry-explorer/ui/shell.ts');
const componentViewSource = read('src/registry-explorer/ui/catalogComponentsView.ts');
const sidebarNavigationSource = read('src/registry-explorer/ui/catalogSidebarNavigation.ts');
const registryDirectorySource = read('src/registry-explorer/ui/registryDirectoryView.ts');
const detailViewSource = read('src/registry-explorer/ui/itemDetailView.ts');
const promptSource = read('src/registry-explorer/core/itemPrompts.ts');
const indexSource = read('index.html');

for (const token of [
  'kind: "home"',
  'kind: "components"',
  'kind: "blocks"',
  'kind: "pages"',
  'kind: "explore"',
  'kind: "registries"',
  'kind: "registry"',
  'kind: "component"',
  'kind: "block"',
  'kind: "page"',
  'kind: "templates"',
  'kind: "template"',
  'kind: "themes"',
  'kind: "theme"',
  'kind: "theme-editor"',
  'kind: "icons"',
  'kind: "icon-family"',
  'kind: "icon-category"',
  'kind: "compare"',
]) {
  assert(routeSource.includes(token), `canonical route contract is missing ${token}`);
}

assert(shellSource.includes("kind: 'not-found'"),
  'shell must preserve unsupported paths as not-found state');
assert(!/parseCatalogRoute[\s\S]{0,500}\?\?\s*\{\s*kind:\s*['"]components['"]/.test(shellSource),
  'unsupported canonical paths must not default to Components');
assert(indexSource.includes('id="searchInput"')
    && indexSource.includes('placeholder="Search catalog"'),
  'Catalog browse must expose one persistent global search input');
assert(sidebarNavigationSource.includes('data-catalog-sort-value')
    && sidebarNavigationSource.includes('data-catalog-canonical-value')
    && sidebarNavigationSource.includes('sidebar-nav-row')
    && sidebarNavigationSource.includes('sidebar-nav-section-label'),
  'Catalog browse controls must use the exemplar-style persistent navigation-row rail');
assert(!sidebarNavigationSource.includes('data-catalog-registry-checkbox')
    && !sidebarNavigationSource.includes('data-sidebar-registry-search')
    && !sidebarNavigationSource.includes('data-sidebar-search-root')
    && !sidebarNavigationSource.includes('type="checkbox"')
    && !sidebarNavigationSource.includes('type="radio"')
    && !sidebarNavigationSource.includes('<select'),
  'Catalog browse must not reintroduce checkbox/radio/select walls or a second sidebar search input');
assert(registryDirectorySource.includes('data-registry-sort-value')
    && registryDirectorySource.includes('data-registry-asset-value')
    && registryDirectorySource.includes('sidebar-nav-row')
    && !registryDirectorySource.includes('type="checkbox"')
    && !registryDirectorySource.includes('type="radio"'),
  'Registry directory controls must use the same exemplar-style navigation-row rail');
assert(componentViewSource.includes('catalog-results-context')
    && componentViewSource.includes('catalog-applied-filter'),
  'Results may expose applied-filter context without duplicating selection controls');
assert(!componentViewSource.includes('data-catalog-search')
    && !componentViewSource.includes('data-catalog-registry-select')
    && !componentViewSource.includes('data-catalog-access-select')
    && !componentViewSource.includes('data-catalog-sort')
    && !componentViewSource.includes('<select')
    && !componentViewSource.includes('catalog-filter-menu')
    && !componentViewSource.includes('<summary>Filters'),
  'Catalog result panes must not duplicate search/filter/sort controls or custom disclosures');
assert(!componentViewSource.includes('Preview not published'),
  'browse cards must not expose preview placeholders');
assert(!componentViewSource.includes('catalog-component-preview')
    && !componentViewSource.includes('data-component-demo')
    && !componentViewSource.includes('<iframe'),
  'browse cards must not render fake/local component preview surfaces');
assert(!detailViewSource.includes('data-source-sandbox')
    && !detailViewSource.includes('data-local-build-preview')
    && !detailViewSource.includes('<iframe'),
  'item detail must not expose fake/local component previews');
assert(componentViewSource.includes('sourcePageNavigation')
    && componentViewSource.includes('itemActionLabel')
    && componentViewSource.includes('catalog-component-deeplink')
    && componentViewSource.includes('Source ↗')
    && !componentViewSource.includes('View item JSON'),
  'catalog cards must expose an internal item deeplink, keep upstream pages as separate Source links, and never expose raw item JSON actions');
assert(detailViewSource.includes('View item JSON'),
  'item details may expose direct item JSON links for inspection');
assert(componentViewSource.includes('renderRegistryIcon')
    && detailViewSource.includes('renderRegistryIcon'),
  'catalog and item detail surfaces must render registry identity icons');
assert(promptSource.includes('Do the work:')
    && !promptSource.includes('possible adoption')
    && !promptSource.includes('Security, provenance, maintenance'),
  'copy-agent prompts must be concise operational prompts rather than defensive review gates');

for (const nav of [
  ['discover', 'Components'],
  ['blocks', 'Blocks'],
  ['pages', 'Pages'],
  ['templates', 'Templates'],
  ['themes', 'Themes'],
  ['icons', 'Icons'],
  ['registries', 'Registries'],
]) {
  assert(indexSource.includes(`data-view="${nav[0]}">${nav[1]}</button>`),
    `primary navigation is missing ${nav[1]}`);
}

assert(!componentViewSource.includes('data-catalog-type-select')
    && !componentViewSource.includes('data-catalog-category-select')
    && !componentViewSource.includes('data-catalog-reviewed'),
  'Results must not expose legacy or route-local browse controls');

const retiredFiles = [
  'src/registry-explorer/core/catalogFacets.ts',
  'src/registry-explorer/core/catalogSort.ts',
  'src/registry-explorer/core/compare.ts',
  'src/registry-explorer/core/componentEvidence.ts',
  'src/registry-explorer/core/componentFilters.ts',
  'src/registry-explorer/core/componentPeek.ts',
  'src/registry-explorer/core/componentTaxonomy.ts',
  'src/registry-explorer/core/discovery.ts',
  'src/registry-explorer/core/grouping.ts',
  'src/registry-explorer/core/labels.ts',
  'src/registry-explorer/core/matrixColumns.ts',
  'src/registry-explorer/core/registryBrowse.ts',
  'src/registry-explorer/core/registryProfile.ts',
  'src/registry-explorer/core/urlState.ts',
  'src/registry-explorer/ui/compareView.ts',
  'src/registry-explorer/ui/componentPeekView.ts',
  'src/registry-explorer/ui/discoveryView.ts',
  'src/registry-explorer/ui/registriesView.ts',
  'src/registry-explorer/ui/registryProfileView.ts',
  'src/registry-explorer/ui/componentPreview.ts',
  'src/registry-explorer/ui/liveRegistryPreview.ts',
  'src/registry-explorer/ui/sourcePreviewStatus.ts',
  'src/registry-explorer/ui/visualReference.ts',
  'src/registry-explorer/data/component-demo-manifest.json',
  'public/data/component-previews.json',
  'public/data/previews',
  'public/component-demos',
  'tools/component-preview-host',
];

for (const file of retiredFiles) {
  assert(!existsSync(path.join(root, file)), `retired inferred/preview system still exists: ${file}`);
}

const sourceFiles = [];
function walk(relative) {
  const absolute = path.join(root, relative);
  if (!existsSync(absolute)) return;
  for (const entry of readdirSync(absolute, { withFileTypes: true })) {
    const child = path.join(relative, entry.name);
    if (entry.isDirectory()) walk(child);
    else if (/\.(?:ts|mjs)$/.test(entry.name)) sourceFiles.push(child);
  }
}
walk('src');
walk('scripts');

const retiredModulePattern = /(?:componentTaxonomy|componentEvidence|componentFilters|componentPeek|catalogFacets|matrixColumns|registryBrowse|registryProfile|componentPreview|liveRegistryPreview|sourcePreviewStatus|visualReference|\/discovery|\/grouping|\/urlState)(?:['".]|$)/;
for (const file of sourceFiles) {
  if (file === 'scripts/check-product-contract.mjs') continue;
  const text = read(file);
  assert(!retiredModulePattern.test(text),
    `active source references a retired inferred/preview module: ${file}`);
}

const schema = read('src/registry-explorer/core/registry.schema.ts');
for (const token of [
  'component_tags',
  'primary_focus',
  'ComponentTag',
  'PrimaryFocus',
  'MatrixRow',
  'ComponentCandidate',
  'RegistryVisualReference',
]) {
  assert(!schema.includes(token), `runtime schema still exposes retired token: ${token}`);
}

const core = openAtlasCoreDatabase(root, { readOnly: true });
const details = openAtlasDetailDatabase(root, { readOnly: true });
let enrichmentCoverage = {
  total: 0,
  description: 0,
  author: 0,
  fileCount: 0,
  themePreview: 0,
};

try {
  const state = readAtlasState(core);
  assert(Boolean(state.taxonomy), 'catalog taxonomy is missing from the Atlas database');
  assert(Boolean(state.classificationOverlay),
    'reviewed canonical classification overlay is missing from the Atlas database');

  if (state.taxonomy && state.classificationOverlay) {
    const canonicalContract = validateCatalogRuntimeContract({
      sourceTaxonomy: state.taxonomy,
      runtimeTaxonomy: state.taxonomy,
      overlay: state.classificationOverlay,
      runtimeCatalog: state.catalog,
      accessRules: state.accessRules,
    });
    for (const error of canonicalContract.errors) {
      failures.push(`canonical runtime contract: ${error}`);
    }
  }

  const allowedThemeSwatches = new Set([
    'background', 'foreground', 'primary', 'secondary', 'accent', 'muted', 'card',
  ]);
  for (const [namespace, items] of Object.entries(state.catalog?.registries ?? {})) {
    assert(Array.isArray(items), `catalog namespace must be an array: ${namespace}`);
    if (!Array.isArray(items)) continue;
    for (const item of items) {
      enrichmentCoverage.total += 1;
      if (typeof item.description === 'string') {
        enrichmentCoverage.description += 1;
        assert(Array.from(item.description).length <= 280,
          `compact description exceeds 280 code points: ${namespace}/${item.name}`);
      }
      if (typeof item.author === 'string') {
        enrichmentCoverage.author += 1;
        assert(Array.from(item.author).length <= 120,
          `compact author exceeds 120 code points: ${namespace}/${item.name}`);
      }
      if (item.fileCount !== undefined) {
        enrichmentCoverage.fileCount += 1;
        assert(Number.isInteger(item.fileCount) && item.fileCount >= 0,
          `compact fileCount is invalid: ${namespace}/${item.name}`);
      }
      if (item.themePreview !== undefined) {
        enrichmentCoverage.themePreview += 1;
        for (const mode of Object.keys(item.themePreview)) {
          assert(mode === 'light' || mode === 'dark',
            `compact themePreview mode is unsupported: ${namespace}/${item.name}/${mode}`);
          for (const swatch of Object.keys(item.themePreview[mode] ?? {})) {
            assert(allowedThemeSwatches.has(swatch),
              `compact themePreview swatch is unsupported: ${namespace}/${item.name}/${swatch}`);
          }
        }
      }
    }
  }

  const serializedCanonicalState = JSON.stringify({
    runtime: state.runtime,
    curated: state.curated,
    evidence: state.catalogEvidence,
    catalog: state.catalog,
  });
  for (const key of [
    '"component_tags"',
    '"primary_focus"',
    '"component_tags_existing"',
    '"component_tags_proposed"',
  ]) {
    assert(!serializedCanonicalState.includes(key),
      `Atlas database still persists retired inferred taxonomy key ${key}`);
  }

  const detailRows = details.prepare(
    'SELECT namespace,name,payload_json FROM atlas_item_details ORDER BY namespace,name',
  ).all();
  assert(detailRows.length > 0, 'Atlas detail database is empty');
  for (const row of detailRows) {
    let payload;
    try {
      payload = JSON.parse(row.payload_json);
    } catch {
      assert(false, `invalid detail JSON payload: ${row.namespace}/${row.name}`);
      continue;
    }
    assert(!Object.hasOwn(payload, 'content'),
      `detail database must not persist source-code content: ${row.namespace}/${row.name}`);
  }

  const catalogNamespaceCount = core.prepare(
    'SELECT COUNT(*) AS n FROM atlas_catalog_namespaces',
  ).get().n;
  const catalogItemCount = core.prepare(
    'SELECT COUNT(*) AS n FROM atlas_catalog_items',
  ).get().n;
  assert(catalogNamespaceCount === state.catalog.meta.registry_count,
    'catalog namespace metadata must match persisted database namespaces');
  assert(catalogItemCount === state.catalog.meta.item_count,
    'catalog item metadata must match persisted database identities');
} finally {
  details.close();
  core.close();
}

if (failures.length > 0) {
  console.error('Registry Atlas product contract failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Registry Atlas product contract passed.');
console.log(
  `Catalog enrichment coverage: ${enrichmentCoverage.description}/${enrichmentCoverage.total} descriptions, `
  + `${enrichmentCoverage.author}/${enrichmentCoverage.total} authors, `
  + `${enrichmentCoverage.fileCount}/${enrichmentCoverage.total} file counts, `
  + `${enrichmentCoverage.themePreview}/${enrichmentCoverage.total} theme previews.`,
);

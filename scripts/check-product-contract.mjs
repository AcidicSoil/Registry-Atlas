import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

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

for (const token of [
  'kind: "home"',
  'lens?: "featured" | "newest"',
  'kind: "explore"',
  'kind: "authors"',
  'kind: "registries"',
  'kind: "registry"',
  'kind: "component"',
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
assert(shellSource.includes("kind: 'not-found'"), 'shell must preserve unsupported paths as not-found state');
assert(!/parseCatalogRoute[\s\S]{0,500}\?\?\s*\{\s*kind:\s*['"]components['"]/.test(shellSource),
  'unsupported canonical paths must not default to Components');

const retiredFiles = [
  'src/registry-explorer/core/catalogFacets.ts',
  'src/registry-explorer/core/catalogSort.ts',
  'src/registry-explorer/core/catalogTaxonomy.ts',
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
];

for (const file of retiredFiles) {
  assert(!existsSync(path.join(root, file)), `retired inferred-system file still exists: ${file}`);
}

const sourceFiles = [];
function walk(relative) {
  const absolute = path.join(root, relative);
  for (const entry of readdirSync(absolute, { withFileTypes: true })) {
    const child = path.join(relative, entry.name);
    if (entry.isDirectory()) walk(child);
    else if (/\.(?:ts|mjs)$/.test(entry.name)) sourceFiles.push(child);
  }
}
walk('src');
walk('scripts');

const retiredModulePattern = /(?:componentTaxonomy|componentEvidence|componentFilters|componentPeek|catalogFacets|catalogTaxonomy|matrixColumns|registryBrowse|registryProfile|\/discovery|\/grouping|\/urlState)(?:['".]|$)/;
for (const file of sourceFiles) {
  if (file === 'scripts/check-product-contract.mjs') continue;
  const text = read(file);
  assert(!retiredModulePattern.test(text), `active source references a retired inferred-system module: ${file}`);
}

const schema = read('src/registry-explorer/core/registry.schema.ts');
for (const token of ['component_tags', 'primary_focus', 'ComponentTag', 'PrimaryFocus', 'MatrixRow', 'ComponentCandidate']) {
  assert(!schema.includes(token), `runtime schema still exposes retired taxonomy token: ${token}`);
}

for (const relative of [
  'public/data/registries.json',
  'data/shadcn/registry-items.json',
  'data/shadcn/registry-catalog-evidence.json',
]) {
  const text = read(relative);
  for (const key of ['"component_tags"', '"primary_focus"', '"component_tags_existing"', '"component_tags_proposed"']) {
    assert(!text.includes(key), `${relative} still persists retired inferred taxonomy key ${key}`);
  }
}

const detailDir = path.join(root, 'public/data/registry-item-details');
assert(existsSync(detailDir), 'same-origin registry item detail bundle directory is missing');
if (existsSync(detailDir)) {
  const bundleFiles = readdirSync(detailDir).filter(name => name.endsWith('.json'));
  assert(bundleFiles.length > 0, 'same-origin registry item detail bundle directory is empty');
  for (const name of bundleFiles.slice(0, 5)) {
    const payload = JSON.parse(readFileSync(path.join(detailDir, name), 'utf8'));
    assert(Array.isArray(payload), `detail bundle must be a JSON array: ${name}`);
  }
}

if (failures.length > 0) {
  console.error('Registry Atlas product contract failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Registry Atlas product contract passed.');

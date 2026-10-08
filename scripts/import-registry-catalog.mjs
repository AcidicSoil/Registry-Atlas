import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import {
  openAtlasCoreDatabase,
  putDocument,
  readCuratedItemSummaries,
  replaceCuratedItemSummaries,
} from './lib/atlas-storage.mjs';

const DEFAULT_SOURCE_PATH = 'registry-altas-improvement-phase/gpt-agent-outputs/registry-catalog.normalized.json';

const ITEM_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const INSTALL_TOKEN_PATTERN = /^@[a-z0-9][a-z0-9-]*\/[a-z0-9]+(?:-[a-z0-9]+)*$/;

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'));
}

export function normalizeNamespace(value) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return '';
  return trimmed.startsWith('@') ? trimmed : `@${trimmed}`;
}

function normalizeOptionalString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeStringArray(value) {
  if (!Array.isArray(value)) return [];
  return value.filter(item => typeof item === 'string').map(item => item.trim()).filter(Boolean);
}

function normalizeFiles(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter(file => file && typeof file === 'object')
    .map(file => ({
      path: normalizeOptionalString(file.path),
      type: normalizeOptionalString(file.type),
      target: normalizeOptionalString(file.target),
    }))
    .filter(file => file.path && file.type)
    .map(file => file.target ? file : { path: file.path, type: file.type });
}

function titleFromName(name) {
  return normalizeOptionalString(name)
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function validateImportedItem(namespace, item, warnings) {
  const slug = normalizeOptionalString(item.slug || item.name).toLowerCase();
  if (!ITEM_SLUG_PATTERN.test(slug)) {
    warnings.push(`${namespace}: skipped invalid item slug ${JSON.stringify(item.slug || item.name)}`);
    return null;
  }

  const installToken = normalizeOptionalString(item.install_token || `${namespace}/${slug}`);
  if (installToken && !INSTALL_TOKEN_PATTERN.test(installToken)) {
    warnings.push(`${namespace}/${slug}: invalid install token ${installToken}`);
  }

  return slug;
}

export function normalizeImportedItem(namespace, item, warnings = []) {
  const slug = validateImportedItem(namespace, item, warnings);
  if (!slug) return null;

  const name = normalizeOptionalString(item.name) || slug;
  const title = normalizeOptionalString(item.title) || titleFromName(name);
  const catalogStatus = normalizeOptionalString(item.catalog_status) || 'available';
  const routeEligible = Boolean(item.route_eligible);
  const installToken = normalizeOptionalString(item.install_token) || `${namespace}/${slug}`;
  const viewCommand = normalizeOptionalString(item.view_command) || `npx shadcn@latest view ${installToken}`;
  const installCommand = normalizeOptionalString(item.install_command) || `npx shadcn@latest add ${installToken}`;

  return {
    name,
    slug,
    title,
    description: normalizeOptionalString(item.description),
    type: normalizeOptionalString(item.type),
    category: normalizeOptionalString(item.category),
    source: normalizeOptionalString(item.source) || 'registry-json',
    provenance: normalizeOptionalString(item.provenance) || `Imported from ${namespace} normalized registry catalog.`,
    catalog_status: catalogStatus,
    confidence: normalizeOptionalString(item.confidence) || 'high',
    route_eligible: routeEligible,
    install_token: installToken,
    view_command: viewCommand,
    install_command: installCommand,
    raw_item_url: normalizeOptionalString(item.raw_item_url),
    docs_url: normalizeOptionalString(item.docs_url),
    evidence_url: normalizeOptionalString(item.evidence_url),
    evidence_note: normalizeOptionalString(item.evidence_note),
    dependencies: normalizeStringArray(item.dependencies),
    devDependencies: normalizeStringArray(item.devDependencies),
    registryDependencies: normalizeStringArray(item.registryDependencies),
    files: normalizeFiles(item.files),
    warnings: normalizeStringArray(item.warnings),
  };
}

export function buildRegistryItemsByNamespace(catalog, existingItems = {}) {
  const warnings = [];
  const skipped = [];
  const output = { ...existingItems };

  const registries = Array.isArray(catalog?.registries) ? catalog.registries : [];
  for (const registry of registries) {
    const namespace = normalizeNamespace(registry?.name);
    if (!namespace) {
      skipped.push({ registry: registry?.name ?? null, reason: 'missing namespace' });
      continue;
    }

    const items = Array.isArray(registry.items) ? registry.items : [];
    const normalized = [];
    for (const item of items) {
      const normalizedItem = normalizeImportedItem(namespace, item, warnings);
      if (normalizedItem) normalized.push(normalizedItem);
      else skipped.push({ registry: namespace, item: item?.name ?? item?.slug ?? null, reason: 'invalid item' });
    }

    output[namespace] = normalized;
  }

  return {
    itemsByNamespace: Object.fromEntries(Object.entries(output).sort(([a], [b]) => a.localeCompare(b))),
    warnings,
    skipped,
  };
}

export function buildImportReport(catalog, importResult) {
  const registries = Array.isArray(catalog?.registries) ? catalog.registries : [];
  const importedNamespaces = registries
    .map(registry => normalizeNamespace(registry?.name))
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
  const itemCounts = Object.fromEntries(importedNamespaces.map(namespace => [
    namespace,
    importResult.itemsByNamespace[namespace]?.length ?? 0,
  ]));

  return {
    source_path: DEFAULT_SOURCE_PATH,
    generated_at: new Date().toISOString(),
    registry_count: importedNamespaces.length,
    item_count: Object.values(itemCounts).reduce((sum, count) => sum + count, 0),
    namespaces: importedNamespaces,
    item_counts: itemCounts,
    warnings: importResult.warnings,
    skipped: importResult.skipped,
  };
}

function parseArgs(argv) {
  const options = {
    source: DEFAULT_SOURCE_PATH,
    dryRun: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--source') options.source = argv[++index] ?? options.source;
    else if (arg === '--dry-run') options.dryRun = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

async function main(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  const catalog = await readJson(options.source);
  const database = openAtlasCoreDatabase();
  try {
    const existing = readCuratedItemSummaries(database);
    const importResult = buildRegistryItemsByNamespace(catalog, existing);
    const report = buildImportReport(catalog, importResult);

    if (!options.dryRun) {
      replaceCuratedItemSummaries(database, importResult.itemsByNamespace);
      putDocument(database, 'catalog-import-report', 'sync-report', report);
    }

    console.log(`Imported ${report.item_count} item summaries across ${report.registry_count} registries`);
    console.log(`Namespaces: ${report.namespaces.join(', ')}`);
    if (report.warnings.length > 0) console.log(`Warnings: ${report.warnings.length}`);
    if (report.skipped.length > 0) console.log(`Skipped: ${report.skipped.length}`);
  } finally {
    database.close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}

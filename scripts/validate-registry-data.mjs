#!/usr/bin/env node

import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import ts from 'typescript';
import { validateCatalogRuntimeContract } from './lib/catalog-runtime-contract.mjs';
import {
  openAtlasCoreDatabase,
  openAtlasDetailDatabase,
  readAtlasState,
} from './lib/atlas-storage.mjs';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDir, '..');
const coreDatabasePath = resolve(projectRoot, 'data/registry-atlas.sqlite');
const detailDatabasePath = resolve(projectRoot, 'data/registry-details.sqlite');
const { validateRegistryMirror } = await loadRegistryMirrorValidator();

const core = openAtlasCoreDatabase(projectRoot, { readOnly: true });
const details = openAtlasDetailDatabase(projectRoot, { readOnly: true });

try {
  const state = readAtlasState(core);
  const rawData = state.rawRegistries;
  const runtimeData = state.runtime;
  const knownItemData = state.curated;
  const catalogData = state.catalog;
  const taxonomy = state.taxonomy;
  const classificationOverlay = state.classificationOverlay;
  const accessRules = state.accessRules;

  const result = validateRegistryMirror(runtimeData, rawData);
  const knownItemIssues = validateKnownItemOutput(runtimeData, knownItemData);
  for (const message of knownItemIssues) {
    result.errors.push({
      code: 'atlas-invalid-item-summary',
      message,
      severity: 'error',
      field: 'atlas.item_summaries',
    });
  }

  if (!taxonomy) {
    result.errors.push({
      code: 'atlas-missing-catalog-taxonomy',
      message: 'catalog-taxonomy document is missing from the Atlas database',
      severity: 'error',
      field: 'atlas_documents',
    });
  }
  if (!classificationOverlay) {
    result.errors.push({
      code: 'atlas-missing-classification-overlay',
      message: 'reviewed canonical classification overlay is missing from the Atlas database',
      severity: 'error',
      field: 'atlas_classifications',
    });
  }

  if (taxonomy && classificationOverlay) {
    const canonicalContract = validateCatalogRuntimeContract({
      sourceTaxonomy: taxonomy,
      runtimeTaxonomy: taxonomy,
      overlay: classificationOverlay,
      runtimeCatalog: catalogData,
      accessRules,
    });
    for (const message of canonicalContract.errors) {
      result.errors.push({
        code: 'atlas-invalid-canonical-runtime',
        message,
        severity: 'error',
        field: 'atlas_catalog_items.canonical',
      });
    }
  }

  for (const message of validateDatabaseInvariants(core, details, state)) {
    result.errors.push({
      code: 'atlas-database-invariant',
      message,
      severity: 'error',
      field: 'database',
    });
  }

  console.log(`validated: ${coreDatabasePath}`);
  console.log(`details: ${detailDatabasePath}`);
  console.log(`errors: ${result.errors.length}`);
  console.log(`warnings: ${result.warnings.length}`);

  for (const issue of result.errors) console.error(formatIssue(issue));
  for (const issue of result.warnings) console.warn(formatIssue(issue));

  if (result.errors.length > 0) process.exitCode = 1;
} finally {
  details.close();
  core.close();
}

function validateDatabaseInvariants(core, details, state) {
  const issues = [];
  const catalogMeta = state.catalog?.meta ?? {};
  const catalogNamespaces = core.prepare(
    'SELECT COUNT(*) AS n FROM atlas_catalog_namespaces',
  ).get().n;
  const catalogItems = core.prepare(
    'SELECT COUNT(*) AS n FROM atlas_catalog_items',
  ).get().n;
  const duplicateCatalogItems = core.prepare(`
    SELECT COUNT(*) AS n FROM (
      SELECT namespace,name,COUNT(*) AS c
      FROM atlas_catalog_items
      GROUP BY namespace,name
      HAVING c > 1
    )
  `).get().n;
  const duplicateDetails = details.prepare(`
    SELECT COUNT(*) AS n FROM (
      SELECT namespace,name,COUNT(*) AS c
      FROM atlas_item_details
      GROUP BY namespace,name
      HAVING c > 1
    )
  `).get().n;

  if (catalogNamespaces !== catalogMeta.registry_count) {
    issues.push(`catalog namespace count ${catalogNamespaces} does not match metadata ${catalogMeta.registry_count}`);
  }
  if (catalogItems !== catalogMeta.item_count) {
    issues.push(`catalog item count ${catalogItems} does not match metadata ${catalogMeta.item_count}`);
  }
  if (duplicateCatalogItems !== 0) {
    issues.push(`catalog contains ${duplicateCatalogItems} duplicate namespace/name identities`);
  }
  if (duplicateDetails !== 0) {
    issues.push(`detail database contains ${duplicateDetails} duplicate namespace/name identities`);
  }

  const requiredDocuments = [
    'catalog-taxonomy',
    'catalog-kind-overrides',
    'catalog-access-rules',
    'catalog-gold-set',
    'source-page-index-meta',
  ];
  const available = new Set(core.prepare(
    'SELECT name FROM atlas_documents',
  ).all().map(row => row.name));
  for (const name of requiredDocuments) {
    if (!available.has(name)) issues.push(`required database document is missing: ${name}`);
  }

  return issues;
}

function validateKnownItemOutput(runtimeData, knownItemData) {
  const issues = [];
  const registries = Array.isArray(runtimeData?.registries) ? runtimeData.registries : [];
  const byNamespace = new Map(registries.map(registry => [registry?.official?.name, registry]));
  const knownEntries = Object.entries(knownItemData ?? {})
    .filter(([, items]) => Array.isArray(items) && items.length > 0);
  const generatedItemCount = registries.reduce(
    (count, registry) => count
      + (Array.isArray(registry?.atlas?.item_summaries)
        ? registry.atlas.item_summaries.length : 0),
    0,
  );

  if (knownEntries.length > 0 && generatedItemCount === 0) {
    issues.push('known catalog-backed item input exists, but generated atlas.item_summaries is empty');
  }

  for (const [namespace] of knownEntries) {
    const registry = byNamespace.get(namespace);
    const generatedItems = registry?.atlas?.item_summaries;
    if (!registry || !Array.isArray(generatedItems) || generatedItems.length === 0) {
      issues.push(`${namespace} has known catalog-backed items but no generated atlas.item_summaries`);
      continue;
    }

    for (const item of generatedItems) {
      if (!item.source || !item.provenance) {
        issues.push(`${namespace}/${item.slug ?? 'unknown'} is missing source or provenance`);
      }
      if (item.route_eligible === true
        && (!item.slug || !registry.official?.registry_url_template?.includes('{name}'))) {
        issues.push(`${namespace}/${item.slug ?? 'unknown'} is route_eligible without route prerequisites`);
      }
    }

    if (!['available', 'partial'].includes(registry.atlas?.catalog_status)) {
      issues.push(`${namespace} has known catalog-backed items but catalog_status is not available or partial`);
    }
  }

  return issues;
}

function formatIssue(issue) {
  const location = [issue.namespace, issue.field].filter(Boolean).join(' ');
  const prefix = location.length > 0
    ? `${issue.severity} ${issue.code} ${location}`
    : `${issue.severity} ${issue.code}`;
  return `${prefix}: ${issue.message}`;
}

async function loadRegistryMirrorValidator() {
  const sourceDir = resolve(projectRoot, 'src/registry-explorer/core');
  const compiledDir = await mkdtemp(join(tmpdir(), 'registry-atlas-validator-'));
  const modules = [
    'registry.schema.ts',
    'coverageStatus.ts',
    'registryMirror.ts',
  ];

  await Promise.all(modules.map(async moduleName => {
    const source = await readFile(resolve(sourceDir, moduleName), 'utf8');
    const transpiled = ts.transpileModule(source, {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ES2022,
        verbatimModuleSyntax: true,
      },
    }).outputText.replaceAll(".ts';", ".mjs';");
    await writeFile(resolve(compiledDir, moduleName.replace(/\.ts$/, '.mjs')), transpiled);
  }));

  return import(resolve(compiledDir, 'registryMirror.mjs'));
}

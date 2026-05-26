#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { validateRegistryMirror } from '../src/registry-explorer/core/registryMirror.ts';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDir, '..');
const rawPath = resolve(projectRoot, 'data/shadcn/registries.raw.json');
const runtimePath = resolve(projectRoot, 'public/data/registries.json');
const registryItemsPath = resolve(projectRoot, 'data/shadcn/registry-items.json');

const [rawData, runtimeData, knownItemData] = await Promise.all([
  readJson(rawPath),
  readJson(runtimePath),
  readJson(registryItemsPath),
]);

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

console.log(`validated: ${runtimePath}`);
console.log(`raw: ${rawPath}`);
console.log(`errors: ${result.errors.length}`);
console.log(`warnings: ${result.warnings.length}`);

for (const issue of result.errors) {
  console.error(formatIssue(issue));
}

for (const issue of result.warnings) {
  console.warn(formatIssue(issue));
}

if (result.errors.length > 0) {
  process.exitCode = 1;
}

async function readJson(path) {
  const content = await readFile(path, 'utf8');
  return JSON.parse(content);
}

function validateKnownItemOutput(runtimeData, knownItemData) {
  const issues = [];
  const registries = Array.isArray(runtimeData?.registries) ? runtimeData.registries : [];
  const byNamespace = new Map(registries.map(registry => [registry?.official?.name, registry]));
  const knownEntries = Object.entries(knownItemData ?? {}).filter(([, items]) => Array.isArray(items) && items.length > 0);
  const generatedItemCount = registries.reduce((count, registry) => count + (Array.isArray(registry?.atlas?.item_summaries) ? registry.atlas.item_summaries.length : 0), 0);

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
      if (item.route_eligible === true && (!item.slug || !registry.official?.registry_url_template?.includes('{name}'))) {
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
  const location = [
    issue.namespace,
    issue.field,
  ].filter(Boolean).join(' ');
  const prefix = location.length > 0 ? `${issue.severity} ${issue.code} ${location}` : `${issue.severity} ${issue.code}`;

  return `${prefix}: ${issue.message}`;
}

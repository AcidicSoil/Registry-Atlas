#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { validateRegistryMirror } from '../src/registry-explorer/core/registryMirror.ts';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDir, '..');
const rawPath = resolve(projectRoot, 'data/shadcn/registries.raw.json');
const runtimePath = resolve(projectRoot, 'public/data/registries.json');

const [rawData, runtimeData] = await Promise.all([
  readJson(rawPath),
  readJson(runtimePath),
]);

const result = validateRegistryMirror(runtimeData, rawData);

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

function formatIssue(issue) {
  const location = [
    issue.namespace,
    issue.field,
  ].filter(Boolean).join(' ');
  const prefix = location.length > 0 ? `${issue.severity} ${issue.code} ${location}` : `${issue.severity} ${issue.code}`;

  return `${prefix}: ${issue.message}`;
}

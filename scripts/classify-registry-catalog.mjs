#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { isAbsolute, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { buildCatalogClassificationState } from './lib/catalog-classification-state.mjs';
import {
  catalogClassificationInputFingerprint,
  classifyCatalogItem,
  findDeterministicAliasClassification,
} from './lib/catalog-classifier.mjs';
import { validateCatalogTaxonomy } from './lib/catalog-taxonomy.mjs';
import { chooseTaxonomyOption } from './lib/systemone-taxonomy.mjs';

const SCHEMA = 'registry-atlas.catalog-classification.v1';
const DEFAULT_TAXONOMY = 'data/catalog-taxonomy/v1.json';
const DEFAULT_CATALOG = 'public/data/registry-catalog-items.json';
const DEFAULT_DECISION_URL = 'http://127.0.0.1:18080/v1/systemone';
const KINDS = new Set(['component', 'block', 'page', 'template', 'theme', 'icon', 'other']);
const VALUE_FLAGS = new Set([
  '--taxonomy', '--catalog', '--output-dir', '--cursor', '--max-registries', '--decision-url',
]);
const BOOLEAN_FLAGS = new Set(['--dry-run', '--deterministic-only', '--all-batches', '--resume']);

function boundedInteger(raw, flag, fallback, min, max) {
  if (raw === undefined) return fallback;
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < min || value > max) throw new Error(`Invalid ${flag}`);
  return value;
}

export function parseCatalogClassificationArgs(argv) {
  const values = {};
  const booleans = new Set();
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    if (BOOLEAN_FLAGS.has(flag)) {
      if (booleans.has(flag) || Object.hasOwn(values, flag)) throw new Error(`Repeated argument: ${flag}`);
      booleans.add(flag);
      continue;
    }
    if (!VALUE_FLAGS.has(flag)) throw new Error(`Unknown argument: ${flag}`);
    if (Object.hasOwn(values, flag) || booleans.has(flag)) throw new Error(`Repeated argument: ${flag}`);
    const value = argv[++index];
    if (!value || value.startsWith('--')) throw new Error(`Missing value for ${flag}`);
    values[flag] = value;
  }
  const result = {
    taxonomyPath: values['--taxonomy'] ?? DEFAULT_TAXONOMY,
    catalogPath: values['--catalog'] ?? DEFAULT_CATALOG,
    ...(values['--output-dir'] ? { outputDir: values['--output-dir'] } : {}),
    ...(values['--cursor'] ? { cursor: values['--cursor'] } : {}),
    maxRegistries: boundedInteger(values['--max-registries'], '--max-registries', 20, 1, 10000),
    decisionUrl: values['--decision-url'] ?? DEFAULT_DECISION_URL,
    dryRun: booleans.has('--dry-run'),
    deterministicOnly: booleans.has('--deterministic-only'),
    allBatches: booleans.has('--all-batches'),
    resume: booleans.has('--resume'),
  };
  if (result.resume && !result.allBatches) throw new Error('--resume requires --all-batches');
  if (!result.dryRun) {
    if (!result.outputDir) throw new Error('Missing required --output-dir');
    if (!isAbsolute(result.outputDir)) throw new Error('Classification output directory must be absolute');
  } else if (result.outputDir && !isAbsolute(result.outputDir)) {
    throw new Error('Classification output directory must be absolute');
  }
  return result;
}

function sha256(value) {
  return 'sha256:' + createHash('sha256').update(value).digest('hex');
}

function validateCatalog(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)
    || !value.registries || typeof value.registries !== 'object' || Array.isArray(value.registries)) {
    throw new Error('Catalog classification input requires a registries object');
  }
  for (const [namespace, items] of Object.entries(value.registries)) {
    if (!namespace.startsWith('@') || !Array.isArray(items)) {
      throw new Error('Catalog classification input contains an invalid registry bucket');
    }
  }
  return value;
}

function normalizeKind(item, namespace, overrides) {
  if (KINDS.has(item?.kind)) return item.kind;
  const reviewed = overrides?.registryDefaults?.[namespace];
  if (KINDS.has(reviewed)) return reviewed;
  const categories = Array.isArray(item?.categories)
    ? item.categories.map(value => String(value).trim().toLowerCase()) : [];
  if (item?.type === 'registry:icon' || categories.some(value => ['icon', 'icons', 'icon-stack', 'morph-icon'].includes(value))) {
    return 'icon';
  }
  if (item?.type === 'registry:block') return 'block';
  if (item?.type === 'registry:page') return 'page';
  if (item?.type === 'registry:style' || item?.type === 'registry:theme') return 'theme';
  if (item?.type === 'registry:component' || item?.type === 'registry:ui' || item?.type === 'registry:item') return 'component';
  return 'other';
}

function sourceHintsFor(item) {
  const hints = {};
  if (Array.isArray(item?.categories) && item.categories.length) hints.categories = item.categories;
  if (Array.isArray(item?.sourceGroups) && item.sourceGroups.length) hints.verifiedGroups = item.sourceGroups;
  return Object.keys(hints).length ? hints : undefined;
}

function pendingClassification(state, taxonomyVersion) {
  return {
    taxonomyVersion,
    primary: null,
    path: [],
    method: 'unclassified',
    inputFingerprint: catalogClassificationInputFingerprint(state),
    pendingDecision: true,
  };
}

export async function classifyRegistryCatalog({
  namespace,
  items,
  taxonomy,
  taxonomyFingerprint,
  catalogFingerprint,
  deterministicOnly = false,
  choose,
  kindOverrides = {},
} = {}) {
  if (typeof namespace !== 'string' || !namespace.startsWith('@')) throw new Error('Classification namespace is invalid');
  if (!Array.isArray(items)) throw new Error('Classification items must be an array');
  const generatedAt = new Date().toISOString();
  const outputItems = [];
  for (const item of items) {
    if (!item || typeof item.name !== 'string' || !item.name.trim()) continue;
    const kind = normalizeKind(item, namespace, kindOverrides);
    const state = buildCatalogClassificationState({
      namespace,
      item: {
        name: item.name,
        ...(item.title ? { title: item.title } : {}),
        ...(item.description ? { description: item.description } : {}),
        kind,
      },
      ...(sourceHintsFor(item) ? { sourceHints: sourceHintsFor(item) } : {}),
    });
    let classification = findDeterministicAliasClassification(state, taxonomy);
    if (!classification) {
      if (deterministicOnly) {
        classification = pendingClassification(state, taxonomy.version);
      } else {
        classification = await classifyCatalogItem({ state, taxonomy, choose });
      }
    }
    outputItems.push({
      namespace,
      name: item.name,
      kind,
      taxonomyVersion: classification.taxonomyVersion,
      canonical: { primary: classification.primary, path: classification.path },
      method: classification.method,
      inputFingerprint: classification.inputFingerprint,
      ...(classification.pendingDecision ? { pendingDecision: true } : {}),
      ...(classification.systemOne ? { systemOne: classification.systemOne } : {}),
      generatedAt,
    });
  }
  return {
    schema: SCHEMA,
    namespace,
    taxonomyVersion: taxonomy.version,
    taxonomyFingerprint,
    catalogFingerprint,
    generatedAt,
    summary: {
      items: outputItems.length,
      deterministic: outputItems.filter(item => item.method === 'deterministic-alias').length,
      systemOne: outputItems.filter(item => item.method === 'system-one').length,
      unclassified: outputItems.filter(item => item.method === 'unclassified').length,
      pendingDecision: outputItems.filter(item => item.pendingDecision).length,
    },
    items: outputItems,
  };
}

function planCatalog(catalog, { cursor, maxRegistries = 20 } = {}) {
  const namespaces = Object.keys(catalog.registries).sort((a, b) => a.localeCompare(b));
  let start = 0;
  if (cursor) {
    const index = namespaces.indexOf(cursor);
    if (index < 0) throw new Error(`Unknown classification cursor: ${cursor}`);
    start = index + 1;
  }
  const batch = namespaces.slice(start, start + maxRegistries);
  const hasMore = start + batch.length < namespaces.length;
  return {
    totalRegistries: namespaces.length,
    batch,
    nextCursor: hasMore && batch.length ? batch.at(-1) : null,
  };
}

async function writeJsonAtomic(path, value) {
  const tmp = path + '.tmp';
  await writeFile(tmp, JSON.stringify(value, null, 2) + '\n', 'utf8');
  await rename(tmp, path);
}

async function readBatchState(outputDir) {
  try { return JSON.parse(await readFile(join(outputDir, '_state.json'), 'utf8')); }
  catch (error) { if (error?.code === 'ENOENT') return null; throw error; }
}

export async function runCatalogClassificationBatches({
  outputDir,
  initialCursor,
  resume = false,
  taxonomyVersion = null,
  taxonomyFingerprint,
  catalogFingerprint,
  executeBatch,
  stopAfterBatches = Number.POSITIVE_INFINITY,
} = {}) {
  if (!isAbsolute(outputDir ?? '')) throw new Error('Batch output directory must be absolute');
  if (typeof executeBatch !== 'function') throw new Error('executeBatch is required');
  if (!(stopAfterBatches > 0)) throw new Error('stopAfterBatches must be positive');
  const batchesDir = join(outputDir, '_batches');
  await mkdir(batchesDir, { recursive: true });
  const previous = resume ? await readBatchState(outputDir) : null;
  if (resume && !previous) throw new Error('No resumable classification state found');
  if (previous && (previous.taxonomyFingerprint !== taxonomyFingerprint
    || previous.catalogFingerprint !== catalogFingerprint)) {
    throw new Error('Classification resume fingerprint mismatch');
  }
  if (previous?.status === 'completed') return previous;

  let cursor = resume ? previous.nextCursor ?? initialCursor : initialCursor;
  let batches = previous?.batches ?? 0;
  let completed = previous?.completed ?? 0;
  let failed = previous?.failed ?? 0;
  let totalRegistries = previous?.totalRegistries ?? null;
  let executed = 0;
  while (executed < stopAfterBatches) {
    const batch = await executeBatch(cursor);
    batches += 1;
    executed += 1;
    completed += batch.completed ?? 0;
    failed += batch.failed ?? 0;
    totalRegistries = batch.totalRegistries ?? totalRegistries;
    const nextCursor = batch.nextCursor ?? null;
    await writeJsonAtomic(join(batchesDir, `batch-${String(batches).padStart(4, '0')}.json`), {
      ...batch, batch: batches, cursor: cursor ?? null, nextCursor,
      taxonomyVersion, taxonomyFingerprint, catalogFingerprint,
    });
    const status = nextCursor === null ? 'completed' : executed >= stopAfterBatches ? 'paused' : 'running';
    const state = {
      schema: SCHEMA, status, batches, completed, failed, totalRegistries,
      taxonomyVersion, taxonomyFingerprint, catalogFingerprint,
      cursor: cursor ?? null, nextCursor, updatedAt: new Date().toISOString(),
    };
    await writeJsonAtomic(join(outputDir, '_state.json'), state);
    if (nextCursor === null || executed >= stopAfterBatches) return state;
    cursor = nextCursor;
  }
  throw new Error('Classification batch runner stopped unexpectedly');
}

async function loadJson(path) {
  const raw = await readFile(path, 'utf8');
  return { raw, value: JSON.parse(raw) };
}

export async function main(argv = process.argv.slice(2), cwd = process.cwd()) {
  const options = parseCatalogClassificationArgs(argv);
  const taxonomyFile = resolve(cwd, options.taxonomyPath);
  const catalogFile = resolve(cwd, options.catalogPath);
  const [{ raw: taxonomyRaw, value: taxonomyValue }, { raw: catalogRaw, value: catalogValue }] = await Promise.all([
    loadJson(taxonomyFile), loadJson(catalogFile),
  ]);
  const taxonomy = validateCatalogTaxonomy(taxonomyValue);
  const catalog = validateCatalog(catalogValue);
  const taxonomyFingerprint = sha256(taxonomyRaw);
  const catalogFingerprint = sha256(catalogRaw);
  let kindOverrides = {};
  try { kindOverrides = JSON.parse(await readFile(join(cwd, 'data/catalog-taxonomy/kind-overrides.json'), 'utf8')); }
  catch (error) { if (error?.code !== 'ENOENT') throw error; }

  const dryPlan = planCatalog(catalog, { cursor: options.cursor, maxRegistries: options.maxRegistries });
  if (options.dryRun) {
    return {
      schema: SCHEMA,
      dryRun: true,
      taxonomyVersion: taxonomy.version,
      taxonomyFingerprint,
      catalogFingerprint,
      totalRegistries: dryPlan.totalRegistries,
      batchSize: dryPlan.batch.length,
      nextCursor: dryPlan.nextCursor,
      registries: dryPlan.batch.map(namespace => ({ namespace, itemCount: catalog.registries[namespace].length })),
    };
  }

  await mkdir(options.outputDir, { recursive: true });
  const choose = options.deterministicOnly ? undefined : request => chooseTaxonomyOption({
    ...request, endpoint: options.decisionUrl,
  });
  const executeBatch = async cursor => {
    const plan = planCatalog(catalog, { cursor, maxRegistries: options.maxRegistries });
    const results = [];
    for (const namespace of plan.batch) {
      try {
        const artifact = await classifyRegistryCatalog({
          namespace,
          items: catalog.registries[namespace],
          taxonomy,
          taxonomyFingerprint,
          catalogFingerprint,
          deterministicOnly: options.deterministicOnly,
          choose,
          kindOverrides,
        });
        const output = join(options.outputDir, `${namespace.slice(1)}.json`);
        await writeJsonAtomic(output, artifact);
        results.push({ namespace, outcome: 'completed', output, summary: artifact.summary });
      } catch (error) {
        results.push({ namespace, outcome: 'failed', reason: String(error?.message ?? error).slice(0, 250) });
      }
    }
    return {
      schema: SCHEMA,
      totalRegistries: plan.totalRegistries,
      completed: results.filter(result => result.outcome === 'completed').length,
      failed: results.filter(result => result.outcome === 'failed').length,
      nextCursor: plan.nextCursor,
      results,
    };
  };

  if (options.allBatches) {
    return runCatalogClassificationBatches({
      outputDir: options.outputDir,
      initialCursor: options.cursor,
      resume: options.resume,
      taxonomyVersion: taxonomy.version,
      taxonomyFingerprint,
      catalogFingerprint,
      executeBatch,
    });
  }
  return executeBatch(options.cursor);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().then(result => console.log(JSON.stringify(result, null, 2))).catch(error => {
    console.error('Catalog classification failed: ' + String(error?.message ?? error));
    process.exitCode = 1;
  });
}

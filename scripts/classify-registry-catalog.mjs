#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { buildCatalogClassificationState } from './lib/catalog-classification-state.mjs';
import {
  catalogClassificationInputFingerprint,
  classifyCatalogItem,
  findDeterministicAliasClassification,
  findDeterministicKindClassification,
} from './lib/catalog-classifier.mjs';
import { validateCatalogTaxonomy } from './lib/catalog-taxonomy.mjs';
import {
  openAtlasCoreDatabase,
  putClassificationBatch,
  putClassificationRun,
  readAtlasState,
  readClassificationRun,
  resetClassificationRun,
  upsertClassificationRunItems,
} from './lib/atlas-storage.mjs';
import { chooseTaxonomyOption } from './lib/systemone-taxonomy.mjs';

const SCHEMA = 'registry-atlas.catalog-classification.v1';
const DEFAULT_DECISION_URL = 'http://127.0.0.1:18080/v1/systemone';
const KINDS = new Set(['component', 'block', 'page', 'template', 'theme', 'icon', 'other']);
const VALUE_FLAGS = new Set([
  '--run-id', '--cursor', '--max-registries', '--decision-url',
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
    ...(values['--run-id'] ? { runId: values['--run-id'] } : {}),
    ...(values['--cursor'] ? { cursor: values['--cursor'] } : {}),
    maxRegistries: boundedInteger(values['--max-registries'], '--max-registries', 20, 1, 10000),
    decisionUrl: values['--decision-url'] ?? DEFAULT_DECISION_URL,
    dryRun: booleans.has('--dry-run'),
    deterministicOnly: booleans.has('--deterministic-only'),
    allBatches: booleans.has('--all-batches'),
    resume: booleans.has('--resume'),
  };
  if (result.resume && !result.allBatches) throw new Error('--resume requires --all-batches');
  if (!result.dryRun && !result.runId) throw new Error('Missing required --run-id');
  if (result.runId && !/^[a-z0-9][a-z0-9._-]{0,79}$/i.test(result.runId)) {
    throw new Error('Classification run id is invalid');
  }
  return result;
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]));
  }
  return value;
}

function sha256(value) {
  return 'sha256:' + createHash('sha256').update(JSON.stringify(stable(value))).digest('hex');
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
  const categories = Array.isArray(item?.categories)
    ? item.categories.map(value => String(value).trim().toLowerCase()) : [];
  if (categories.some(value => value === 'template' || value === 'templates')) {
    return 'template';
  }
  if (KINDS.has(item?.kind)) return item.kind;
  const reviewed = overrides?.registryDefaults?.[namespace];
  if (KINDS.has(reviewed)) return reviewed;
  if (item?.type === 'registry:icon'
    || categories.some(value => ['icon', 'icons', 'icon-stack', 'morph-icon'].includes(value))) {
    return 'icon';
  }
  if (item?.type === 'registry:block') return 'block';
  if (item?.type === 'registry:page') return 'page';
  if (item?.type === 'registry:style' || item?.type === 'registry:theme') return 'theme';
  if (item?.type === 'registry:component' || item?.type === 'registry:ui' || item?.type === 'registry:item') {
    return 'component';
  }
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
  if (typeof namespace !== 'string' || !namespace.startsWith('@')) {
    throw new Error('Classification namespace is invalid');
  }
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
    let classification = findDeterministicKindClassification(state, taxonomy)
      ?? findDeterministicAliasClassification(state, taxonomy);
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
      deterministic: outputItems.filter(item => item.method === 'deterministic-alias'
        || item.method === 'deterministic-kind').length,
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

export async function runCatalogClassificationBatches({
  database,
  runId,
  initialCursor,
  resume = false,
  taxonomyVersion = null,
  taxonomyFingerprint,
  catalogFingerprint,
  executeBatch,
  stopAfterBatches = Number.POSITIVE_INFINITY,
} = {}) {
  if (!database) throw new Error('Classification database is required');
  if (!runId) throw new Error('Classification run id is required');
  if (typeof executeBatch !== 'function') throw new Error('executeBatch is required');
  if (!(stopAfterBatches > 0)) throw new Error('stopAfterBatches must be positive');

  const previous = resume ? readClassificationRun(database, runId) : null;
  if (resume && !previous) throw new Error('No resumable classification state found');
  if (previous && (previous.taxonomyFingerprint !== taxonomyFingerprint
    || previous.catalogFingerprint !== catalogFingerprint)) {
    throw new Error('Classification resume fingerprint mismatch');
  }
  if (!resume) resetClassificationRun(database, runId);
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
    const batchRecord = {
      ...batch,
      batch: batches,
      cursor: cursor ?? null,
      nextCursor,
      taxonomyVersion,
      taxonomyFingerprint,
      catalogFingerprint,
    };
    putClassificationBatch(database, runId, batches, batchRecord);
    const status = nextCursor === null
      ? 'completed'
      : executed >= stopAfterBatches ? 'paused' : 'running';
    const state = {
      schema: SCHEMA,
      runId,
      status,
      batches,
      completed,
      failed,
      totalRegistries,
      taxonomyVersion,
      taxonomyFingerprint,
      catalogFingerprint,
      cursor: cursor ?? null,
      nextCursor,
      updatedAt: new Date().toISOString(),
    };
    putClassificationRun(database, runId, state, state.updatedAt);
    if (nextCursor === null || executed >= stopAfterBatches) return state;
    cursor = nextCursor;
  }
  throw new Error('Classification batch runner stopped unexpectedly');
}

export async function main(argv = process.argv.slice(2), cwd = process.cwd()) {
  const options = parseCatalogClassificationArgs(argv);
  const database = openAtlasCoreDatabase(cwd);
  try {
    const state = readAtlasState(database);
    if (!state.taxonomy) throw new Error('Catalog taxonomy is missing from the Atlas database');
    const taxonomy = validateCatalogTaxonomy(state.taxonomy);
    const catalog = validateCatalog(state.catalog);
    const taxonomyFingerprint = sha256(taxonomy);
    const catalogFingerprint = sha256(catalog);
    const kindOverrides = state.kindOverrides ?? {};

    const dryPlan = planCatalog(catalog, {
      cursor: options.cursor,
      maxRegistries: options.maxRegistries,
    });
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
        registries: dryPlan.batch.map(namespace => ({
          namespace,
          itemCount: catalog.registries[namespace].length,
        })),
      };
    }

    const choose = options.deterministicOnly ? undefined : request => chooseTaxonomyOption({
      ...request,
      endpoint: options.decisionUrl,
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
          upsertClassificationRunItems(database, options.runId, artifact.items);
          results.push({
            namespace,
            outcome: 'completed',
            summary: artifact.summary,
          });
        } catch (error) {
          results.push({
            namespace,
            outcome: 'failed',
            reason: String(error?.message ?? error).slice(0, 250),
          });
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

    return await runCatalogClassificationBatches({
      database,
      runId: options.runId,
      initialCursor: options.cursor,
      resume: options.resume,
      taxonomyVersion: taxonomy.version,
      taxonomyFingerprint,
      catalogFingerprint,
      executeBatch,
      stopAfterBatches: options.allBatches ? Number.POSITIVE_INFINITY : 1,
    });
  } finally {
    database.close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().then(result => console.log(JSON.stringify(result, null, 2))).catch(error => {
    console.error('Catalog classification failed: ' + String(error?.message ?? error));
    process.exitCode = 1;
  });
}

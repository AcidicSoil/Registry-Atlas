#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { isAbsolute, join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { pathToFileURL } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { catalogFingerprint } from './lib/registry-discovery.mjs';
import {
  CATALOG_STRUCTURE_SURVEY_SCHEMA,
  planCatalogStructureSurvey,
  surveyRegistryCatalogStructure,
  writeRegistrySurveyArtifact,
} from './lib/catalog-structure-survey.mjs';
import { chooseObservedGroup } from './lib/systemone-group.mjs';

const DEFAULT_DECISION_URL = 'http://127.0.0.1:18080/v1/systemone';
const VALUE_FLAGS = new Set([
  '--profile', '--server', '--tab', '--output-dir', '--cursor',
  '--max-registries', '--max-surfaces', '--max-links', '--delay-ms', '--decision-url',
]);
const BOOLEAN_FLAGS = new Set(['--dry-run', '--no-clef', '--all-batches', '--resume']);

function boundedInteger(raw, flag, fallback, min, max) {
  if (raw === undefined) return fallback;
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < min || value > max)
    throw new Error('Invalid ' + flag);
  return value;
}

export function parseCatalogStructureSurveyArgs(argv) {
  const values = {};
  const booleans = new Set();
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    if (BOOLEAN_FLAGS.has(flag)) {
      if (booleans.has(flag) || Object.hasOwn(values, flag))
        throw new Error('Repeated argument: ' + flag);
      booleans.add(flag);
      continue;
    }
    if (!VALUE_FLAGS.has(flag)) throw new Error('Unknown argument: ' + flag);
    if (Object.hasOwn(values, flag) || booleans.has(flag))
      throw new Error('Repeated argument: ' + flag);
    const value = argv[++i];
    if (!value || value.startsWith('--')) throw new Error('Missing value for ' + flag);
    values[flag] = value;
  }

  const dryRun = booleans.has('--dry-run');
  const result = {
    ...(values['--profile'] ? { profile: values['--profile'] } : {}),
    ...(values['--server'] ? { server: values['--server'] } : {}),
    ...(values['--tab'] ? { tab: values['--tab'] } : {}),
    ...(values['--output-dir'] ? { outputDir: values['--output-dir'] } : {}),
    ...(values['--cursor'] ? { cursor: values['--cursor'] } : {}),
    maxRegistries: boundedInteger(values['--max-registries'], '--max-registries', 20, 1, 10000),
    maxSurfaces: boundedInteger(values['--max-surfaces'], '--max-surfaces', 4, 1, 20),
    maxLinks: boundedInteger(values['--max-links'], '--max-links', 1500, 1, 10000),
    delayMs: boundedInteger(values['--delay-ms'], '--delay-ms', 1000, 0, 60000),
    decisionUrl: values['--decision-url'] ?? DEFAULT_DECISION_URL,
    dryRun,
    useClef: !booleans.has('--no-clef'),
    ...(booleans.has('--all-batches') ? { allBatches: true } : {}),
    ...(booleans.has('--resume') ? { resume: true } : {}),
  };
  if (result.resume && !result.allBatches)
    throw new Error('--resume requires --all-batches');

  if (!dryRun) {
    for (const flag of ['--profile', '--server', '--tab', '--output-dir']) {
      const key = {
        '--profile': 'profile',
        '--server': 'server',
        '--tab': 'tab',
        '--output-dir': 'outputDir',
      }[flag];
      if (!result[key]) throw new Error('Missing required ' + flag);
    }
    if (!isAbsolute(result.outputDir))
      throw new Error('Survey output directory must be absolute');
  } else if (result.outputDir && !isAbsolute(result.outputDir)) {
    throw new Error('Survey output directory must be absolute');
  }
  return result;
}

function runJson(command, args, timeout = 30000) {
  const raw = execFileSync(command, args, {
    encoding: 'utf8',
    timeout,
    maxBuffer: 32 * 1024 * 1024,
  });
  return JSON.parse(raw);
}

function validateManagedBrowser({ profile, server, tab }) {
  const status = runJson('pinchtab-profile-manager', [profile, 'status', '--json'], 15000);
  if (!status?.ok || !status.data?.instances?.some(instance =>
    instance.status === 'running' && instance.url === server))
    throw new Error('Managed source profile is not running on the supplied server');
  const tabs = runJson('pinchtab', ['--server', server, 'tab', '--json'], 15000);
  if (!tabs?.tabs?.some(candidate => candidate.id === tab))
    throw new Error('Supplied tab does not belong to the managed source server');
}

function evidenceFromDatabase(db) {
  const evidence = {};
  const row = namespace => evidence[namespace] ??= {
    routePatterns: [], examples: [], itemRoutes: [], sitemapLinks: [],
  };
  for (const pattern of db.prepare(
    'SELECT id, namespace, template, prefix, source, status, checked_at, failure FROM route_patterns'
  ).all()) row(pattern.namespace).routePatterns.push(pattern);
  for (const example of db.prepare(
    'SELECT p.namespace, e.slug, e.url FROM examples e JOIN route_patterns p ON p.id=e.pattern_id'
  ).all()) row(example.namespace).examples.push(example);
  for (const route of db.prepare(
    'SELECT namespace, slug, source_url, status, pattern_id FROM item_routes'
  ).all()) row(route.namespace).itemRoutes.push(route);
  for (const link of db.prepare(
    'SELECT namespace, slug, url, observed_at FROM sitemap_links'
  ).all()) row(link.namespace).sitemapLinks.push(link);
  return evidence;
}

function mergeItems(catalogItems = [], curatedItems = []) {
  const byName = new Map();
  for (const item of catalogItems) {
    if (!item || typeof item.name !== 'string' || !item.name.trim()) continue;
    if (!byName.has(item.name))
      byName.set(item.name, { name: item.name, type: item.type ?? 'registry:item' });
  }
  for (const item of curatedItems) {
    if (!item || typeof item.slug !== 'string' || !item.slug.trim() || byName.has(item.slug))
      continue;
    byName.set(item.slug, { name: item.slug, type: item.type ?? 'registry:item' });
  }
  return [...byName.values()];
}

function domExpression(maxLinks) {
  return String.raw`
JSON.stringify((() => {
  const LIMIT = ${maxLinks};
  const clean = value => (value || "").trim().replace(/\\s+/g, " ");
  const semSelector = "section,nav,aside,article";
  const headingSelector = "h2,h3,h4,h5";
  const level = heading => Number(heading.tagName.slice(1));
  const allHeadings = [...document.querySelectorAll(headingSelector)].slice(0, 250);
  const links = [...document.querySelectorAll("a[href]")].slice(0, LIMIT).map(a => ({
    text: clean(a.textContent),
    heading: clean(a.querySelector(headingSelector)?.textContent),
    href: a.getAttribute("href") || "",
    ownerTag: a.closest(semSelector)?.tagName || "",
  })).filter(link => link.text && link.href);
  const containers = [...document.querySelectorAll(semSelector)].slice(0, 250).map(el => {
    const heads = [...el.querySelectorAll(headingSelector)]
      .filter(heading => heading.closest(semSelector) === el)
      .slice(0, 20)
      .map(heading => ({ text: clean(heading.textContent), tag: heading.tagName }))
      .filter(heading => heading.text);
    const ownedLinks = [...el.querySelectorAll("a[href]")]
      .filter(a => a.closest(semSelector) === el)
      .slice(0, LIMIT)
      .map(a => ({ text: clean(a.textContent), href: a.getAttribute("href") || "" }))
      .filter(link => link.text && link.href);
    return { tag: el.tagName, heads, links: ownedLinks };
  }).filter(container => container.heads.length || container.links.length);
  const ranges = allHeadings.map((heading, index) => {
    const headingLevel = level(heading);
    const next = allHeadings.slice(index + 1).find(other => level(other) <= headingLevel);
    const range = document.createRange();
    range.setStartAfter(heading);
    if (next) range.setEndBefore(next);
    else range.setEndAfter(document.body.lastChild || document.body);
    const fragment = range.cloneContents();
    const rangeLinks = [...fragment.querySelectorAll("a[href]")].slice(0, LIMIT).map(a => ({
      text: clean(a.textContent),
      href: a.getAttribute("href") || "",
    })).filter(link => link.text && link.href);
    return {
      text: clean(heading.textContent),
      tag: heading.tagName,
      ownerTag: heading.closest(semSelector)?.tagName || "",
      links: rangeLinks,
    };
  }).filter(range => range.text);
  return {
    title: document.title,
    url: location.href,
    pathname: location.pathname,
    links,
    containers,
    ranges,
  };
})())
`;
}

function createPinchTabObserver({ server, tab, delayMs }) {
  let lastNavigationAt = 0;
  return async function observePage(url, { maxLinks = 1500 } = {}) {
    const elapsed = Date.now() - lastNavigationAt;
    if (lastNavigationAt && elapsed < delayMs) await sleep(delayMs - elapsed);
    runJson('pinchtab', ['--server', server, 'nav', url, '--tab', tab, '--json'], 45000);
    lastNavigationAt = Date.now();
    try {
      runJson('pinchtab', [
        '--server', server, 'wait', '--tab', tab, '--load', 'networkidle',
        '--timeout', '15000', '--json',
      ], 20000);
    } catch {
      // Some sites keep background connections alive. DOM observation below is authoritative.
    }
    const result = runJson('pinchtab', [
      '--server', server, 'eval', domExpression(maxLinks), '--tab', tab, '--json',
    ], 30000);
    if (typeof result?.result !== 'string')
      throw new Error('PinchTab DOM evaluation returned no result');
    return JSON.parse(result.result);
  };
}

async function loadInputs(cwd) {
  const [raw, catalog, curated] = await Promise.all([
    readFile(join(cwd, 'data/shadcn/registries.raw.json'), 'utf8').then(JSON.parse),
    readFile(join(cwd, 'public/data/registry-catalog-items.json'), 'utf8').then(JSON.parse),
    readFile(join(cwd, 'data/shadcn/registry-items.json'), 'utf8').then(JSON.parse),
  ]);
  const db = new DatabaseSync(join(cwd, 'data/shadcn/registry-patterns.sqlite'), { readOnly: true });
  try {
    return { raw, catalog, curated, evidence: evidenceFromDatabase(db) };
  } finally {
    db.close();
  }
}


async function writeJsonAtomic(path, value) {
  const tmp = path + '.tmp';
  await writeFile(tmp, JSON.stringify(value, null, 2) + '\n', 'utf8');
  await rename(tmp, path);
}

async function readBatchState(outputDir) {
  try {
    return JSON.parse(await readFile(join(outputDir, '_state.json'), 'utf8'));
  } catch (error) {
    if (error?.code === 'ENOENT') return null;
    throw error;
  }
}

export async function runCatalogStructureSurveyBatches({
  outputDir,
  initialCursor,
  resume = false,
  executeBatch,
  stopAfterBatches = Number.POSITIVE_INFINITY,
} = {}) {
  if (!isAbsolute(outputDir ?? '')) throw new Error('Batch output directory must be absolute');
  if (typeof executeBatch !== 'function') throw new Error('executeBatch is required');
  if (!(stopAfterBatches > 0)) throw new Error('stopAfterBatches must be positive');

  const batchesDir = join(outputDir, '_batches');
  await mkdir(batchesDir, { recursive: true });

  const previous = resume ? await readBatchState(outputDir) : null;
  if (resume && !previous) throw new Error('No resumable survey state found');
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
    };
    await writeJsonAtomic(join(batchesDir, 'batch-' + String(batches).padStart(4, '0') + '.json'), batchRecord);

    const status = nextCursor === null ? 'completed'
      : executed >= stopAfterBatches ? 'paused' : 'running';
    const state = {
      schema: CATALOG_STRUCTURE_SURVEY_SCHEMA,
      status,
      batches,
      completed,
      failed,
      totalRegistries,
      cursor: cursor ?? null,
      nextCursor,
      updatedAt: new Date().toISOString(),
    };
    await writeJsonAtomic(join(outputDir, '_state.json'), state);
    console.error('[catalog-structure] batch ' + batches
      + ': completed=' + (batch.completed ?? 0)
      + ' failed=' + (batch.failed ?? 0)
      + ' next=' + (nextCursor ?? 'done'));

    if (nextCursor === null || executed >= stopAfterBatches) return state;
    cursor = nextCursor;
  }

  throw new Error('Batch runner stopped unexpectedly');
}

export async function main(argv, cwd = process.cwd()) {
  const options = parseCatalogStructureSurveyArgs(argv);
  const { raw, catalog, curated, evidence } = await loadInputs(cwd);

  if (options.dryRun) {
    const plan = planCatalogStructureSurvey(raw, catalog, curated, evidence, {
      cursor: options.cursor,
      maxRegistries: options.maxRegistries,
    });
    return {
      schema: CATALOG_STRUCTURE_SURVEY_SCHEMA,
      dryRun: true,
      totalRegistries: plan.totalRegistries,
      batchSize: plan.batch.length,
      nextCursor: plan.nextCursor,
      registries: plan.registries.map(row => ({
        namespace: row.namespace,
        itemCount: row.itemCount,
        surfaceCount: row.surfaces.length,
      })),
    };
  }

  validateManagedBrowser(options);
  const observePage = createPinchTabObserver(options);

  const executeBatch = async cursor => {
    const plan = planCatalogStructureSurvey(raw, catalog, curated, evidence, {
      cursor,
      maxRegistries: options.maxRegistries,
    });
    const results = [];
    for (const job of plan.batch) {
      const registry = raw.find(candidate => candidate.name === job.namespace);
      if (!registry) continue;
      const items = mergeItems(catalog.registries[job.namespace] ?? [], curated[job.namespace] ?? []);
      try {
        const artifact = await surveyRegistryCatalogStructure({
          registry,
          items,
          surfaces: job.surfaces,
          maxSurfaces: options.maxSurfaces,
          maxLinks: options.maxLinks,
          observePage,
          chooseGroup: options.useClef
            ? request => chooseObservedGroup({
              ...request,
              endpoint: options.decisionUrl,
            })
            : undefined,
          catalogFingerprint: catalogFingerprint(registry, items.map(item => item.name)),
        });
        const output = await writeRegistrySurveyArtifact(options.outputDir, artifact);
        results.push({
          namespace: job.namespace,
          outcome: 'completed',
          status: artifact.status,
          groups: artifact.summary.groups,
          observedItems: artifact.summary.observedItems,
          deterministic: artifact.summary.deterministic,
          clef: artifact.summary.clef,
          flat: artifact.summary.flat,
          unresolved: artifact.summary.unresolved,
          output,
        });
      } catch (error) {
        results.push({
          namespace: job.namespace,
          outcome: 'failed',
          reason: String(error?.message ?? error).slice(0, 250),
        });
      }
    }

    return {
      schema: CATALOG_STRUCTURE_SURVEY_SCHEMA,
      dryRun: false,
      totalRegistries: plan.totalRegistries,
      completed: results.filter(row => row.outcome === 'completed').length,
      failed: results.filter(row => row.outcome === 'failed').length,
      nextCursor: plan.nextCursor,
      results,
    };
  };

  if (options.allBatches) {
    return runCatalogStructureSurveyBatches({
      outputDir: options.outputDir,
      initialCursor: options.cursor,
      resume: options.resume,
      executeBatch,
    });
  }

  return executeBatch(options.cursor);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2))
    .then(result => console.log(JSON.stringify(result, null, 2)))
    .catch(error => {
      console.error('Catalog structure survey failed: ' + String(error?.message ?? error));
      process.exitCode = 1;
    });
}

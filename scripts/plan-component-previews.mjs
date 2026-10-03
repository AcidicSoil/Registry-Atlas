import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SCHEMA = 'registry-atlas-component-demos/v1';
const LOCAL_DEMO = /^\/Registry-Atlas\/component-demos\/[a-z0-9-]+(?:\/[a-z0-9-]+)*\/index\.html$/;
const NAMESPACE = /^@[a-z0-9][a-z0-9-]*$/;
const byName = (a, b) => a.localeCompare(b);

function manifestReason(entry) {
  if (!entry || typeof entry !== 'object') return 'malformed-review';
  if (entry.status !== 'interaction-verified') return 'review-not-verified';
  if (!['source-informed-fixture', 'upstream-built'].includes(entry.kind)) return 'unknown-runtime-kind';
  if (typeof entry.path !== 'string' || !LOCAL_DEMO.test(entry.path)) return 'unsafe-demo-path';
  if (!entry.source || typeof entry.source.docsUrl !== 'string'
      || typeof entry.source.registryItemUrl !== 'string'
      || !/^https:\/\/[^/]+\/.+/.test(entry.source.docsUrl)
      || !/^https:\/\/[^/]+\/.+\.json$/.test(entry.source.registryItemUrl)) return 'unverified-source';
  if (!Number.isFinite(Date.parse(entry.reviewedAt))
      || !Number.isFinite(Date.parse(entry.verifiedAt))) return 'invalid-review-timestamps';
  if (entry.kind === 'upstream-built'
      && !/^[a-f0-9]{64}$/i.test(entry.sourceSha256 ?? '')) return 'missing-reviewed-source-hash';
  return null;
}

export function planPreviewCoverage(raw, catalog, manifest, options = {}, curated = {}) {
  if (!Array.isArray(raw) || !catalog || typeof catalog.registries !== 'object'
      || manifest?.schema !== SCHEMA || !Array.isArray(manifest.items))
    throw new Error('Invalid registry source or component demo manifest schema');
  const limit = options.limit ?? 50;
  if (!Number.isInteger(limit) || limit < 1 || limit > 200)
    throw new Error('limit must be an integer from 1 to 200');

  const errors = [];
  const source = new Map();
  for (const registry of raw) {
    const name = registry?.name;
    if (typeof name !== 'string' || !NAMESPACE.test(name)) {
      errors.push({ token: String(name), reason: 'invalid-registry-name' });
      continue;
    }
    if (source.has(name)) {
      errors.push({ token: name, reason: 'duplicate-registry' });
      continue;
    }
    source.set(name, new Map());
  }
  if (options.registry && !source.has(options.registry))
    throw new Error('Unknown registry: ' + options.registry);

  let indexedRows = 0;
  let indexedDuplicates = 0;
  for (const [namespace, items] of Object.entries(catalog.registries)) {
    if (!Array.isArray(items)) throw new Error('Invalid catalog array for ' + namespace);
    const bucket = source.get(namespace);
    if (!bucket) {
      errors.push({ token: namespace, reason: 'indexed-registry-not-in-directory' });
      continue;
    }
    for (const item of items) {
      indexedRows++;
      if (typeof item.name !== 'string' || !item.name) {
        errors.push({ token: namespace, reason: 'invalid-indexed-item-name' });
        continue;
      }
      if (bucket.has(item.name)) {
        indexedDuplicates++;
        continue;
      }
      bucket.set(item.name, { namespace, slug: item.name,
        token: namespace + '/' + item.name, itemType: item.type ?? null,
        indexed: true });
    }
  }
  const indexedDistinct = [...source.values()]
    .reduce((count, bucket) => count + bucket.size, 0);
  let curatedOnly = 0;
  for (const [namespace, items] of Object.entries(curated ?? {})) {
    const bucket = source.get(namespace);
    if (!bucket) {
      errors.push({ token: namespace, reason: 'curated-registry-not-in-directory' });
      continue;
    }
    if (!Array.isArray(items)) {
      errors.push({ token: namespace, reason: 'invalid-curated-records' });
      continue;
    }
    for (const item of items) {
      const slug = item?.slug ?? item?.name;
      if (typeof slug !== 'string' || !slug) {
        errors.push({ token: namespace, reason: 'invalid-curated-item-name' });
        continue;
      }
      if (!bucket.has(slug)) {
        curatedOnly++;
        bucket.set(slug, { namespace, slug, token: namespace + '/' + slug,
          itemType: item.type ?? null, indexed: false });
      }
    }
  }

  const approved = new Map();
  const bad = new Map();
  for (const entry of manifest.items) {
    const namespace = entry?.namespace;
    const slug = entry?.slug;
    const token = String(namespace) + '/' + String(slug);
    if (typeof namespace !== 'string' || typeof slug !== 'string'
        || !source.get(namespace)?.has(slug)) {
      errors.push({ token, reason: 'reviewed-item-missing-from-directory-or-catalog' });
      continue;
    }
    if (approved.has(token) || bad.has(token)) {
      bad.set(token, 'duplicate-reviewed-identity');
      approved.delete(token);
      errors.push({ token, reason: 'duplicate-reviewed-identity' });
      continue;
    }
    const reason = manifestReason(entry)
      ?? (options.assetExists && !options.assetExists(entry.path) ? 'missing-built-asset' : null);
    if (reason) {
      bad.set(token, reason);
      errors.push({ token, reason });
    } else {
      approved.set(token, entry);
    }
  }

  const rows = [];
  const registries = [];
  let fixtureVerified = 0;
  let upstreamBuiltVerified = 0;
  let pending = 0;
  let blocked = 0;
  let emptyRegistries = 0;
  let populatedRegistries = 0;
  for (const namespace of [...source.keys()].sort(byName)) {
    const bucket = source.get(namespace);
    const local = { namespace, total: bucket.size, fixtureVerified: 0,
      upstreamBuiltVerified: 0, pending: 0, blocked: 0, status: 'empty' };
    if (bucket.size === 0) emptyRegistries++;
    else populatedRegistries++;
    for (const slug of [...bucket.keys()].sort(byName)) {
      const item = bucket.get(slug);
      const entry = approved.get(item.token);
      const status = bad.has(item.token) ? 'blocked'
        : entry?.kind === 'upstream-built' ? 'upstream-built'
          : entry?.kind === 'source-informed-fixture' ? 'fixture' : 'pending';
      if (status === 'fixture') { fixtureVerified++; local.fixtureVerified++; }
      if (status === 'upstream-built') { upstreamBuiltVerified++; local.upstreamBuiltVerified++; }
      if (status === 'blocked') { blocked++; local.blocked++; }
      if (status === 'pending') { pending++; local.pending++; }
      rows.push({ ...item, status, ...(bad.has(item.token) ? { reason: bad.get(item.token) } : {}) });
    }
    if (local.total) local.status = local.blocked ? 'blocked'
      : local.pending ? 'partial' : 'preview-covered';
    registries.push(local);
  }
  const distinctItems = rows.length;
  const summary = { rawRegistries: source.size, populatedRegistries, emptyRegistries,
    indexedRows, indexedDuplicates, indexedDistinct, curatedOnly, distinctItems,
    fixtureVerified, upstreamBuiltVerified, pending, blocked, errors: errors.length,
    // A source-informed recreation does not prove the original upstream component is runnable.
    complete: distinctItems > 0 && pending === 0 && blocked === 0 && errors.length === 0
      && fixtureVerified === 0,
  };

  const eligible = rows.filter(item => item.status === 'pending'
    && (!options.registry || item.namespace === options.registry))
    .sort((a, b) => byName(a.token, b.token));
  const cursor = options.cursor;
  let start = 0;
  if (cursor != null) {
    const index = eligible.findIndex(item => item.token === cursor);
    if (index === -1) throw new Error('Unknown or already reviewed cursor: ' + cursor);
    start = index + 1;
  }
  const batch = eligible.slice(start, start + limit);
  const nextCursor = eligible.length > start + batch.length && batch.length
    ? batch[batch.length - 1].token : null;
  return { schema: 'registry-atlas-component-preview-coverage/v1',
    summary, registries, batch, nextCursor, errors,
    ...(options.includeItems ? { items: rows } : {}) };
}

async function cli(argv) {
  const options = {};
  let reportPath;
  for (let i = 0; i < argv.length; i += 2) {
    const flag = argv[i];
    const value = argv[i + 1];
    if (!value || !['--registry', '--cursor', '--limit', '--report'].includes(flag))
      throw new Error('Unknown or missing planner flag: ' + flag);
    if (flag === '--registry') options.registry = value;
    if (flag === '--cursor') options.cursor = value;
    if (flag === '--limit') options.limit = Number(value);
    if (flag === '--report') reportPath = value;
  }
  const root = fileURLToPath(new URL('../', import.meta.url));
  const readJson = async path => JSON.parse(await readFile(join(root, path), 'utf8'));
  const [raw, catalog, manifest, curated] = await Promise.all([
    readJson('data/shadcn/registries.raw.json'),
    readJson('public/data/registry-catalog-items.json'),
    readJson('src/registry-explorer/data/component-demo-manifest.json'),
    readJson('data/shadcn/registry-items.json'),
  ]);
  const coverage = planPreviewCoverage(raw, catalog, manifest, {
    ...options,
    assetExists: localPath => existsSync(join(root, 'public',
      localPath.slice('/Registry-Atlas/'.length))),
  }, curated);
  const output = JSON.stringify(coverage, null, 2) + '\n';
  if (reportPath != null) {
    if (!isAbsolute(reportPath)) throw new Error('--report requires an absolute path');
    await writeFile(reportPath, output, { flag: 'wx' });
    process.stdout.write(JSON.stringify({ report: resolve(reportPath),
      summary: coverage.summary, nextCursor: coverage.nextCursor }) + '\n');
  } else process.stdout.write(output);
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  cli(process.argv.slice(2)).catch(error => {
    process.stderr.write('Preview coverage planning failed: ' + error.message + '\n');
    process.exitCode = 1;
  });
}

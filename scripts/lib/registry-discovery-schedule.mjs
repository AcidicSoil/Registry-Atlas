import { catalogFingerprint, DISCOVERY_REVISION } from './registry-discovery.mjs';

const NAMESPACE = /^@[a-z0-9][a-z0-9-]*$/;
const STATUSES = ['pageObserved', 'notVisited', 'stale', 'ambiguous', 'blocked', 'unresolved'];
const byName = (a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0;

function publicHomepage(homepage) {
  try {
    const url = new URL(homepage);
    if (url.protocol !== 'https:' || url.username || url.password || url.port)
      return null;
    return url;
  } catch { return null; }
}

function profileAllows(homepage, allowedDomains) {
  const url = publicHomepage(homepage);
  if (!url) return false;
  const host = url.hostname.toLowerCase();
  return allowedDomains.some(pattern => pattern === host || pattern === '*'
    || (pattern.startsWith('*.') && host.endsWith(pattern.slice(1))
      && host.length > pattern.length - 1));
}

function rowStatus(row, fingerprint, now, maxAgeMs) {
  if (!row) return 'notVisited';
  const when = Date.parse(row.checkedAt);
  if (row.discoveryRevision !== DISCOVERY_REVISION
    || row.catalogFingerprint !== fingerprint
    || !Number.isFinite(when) || when > now || now - when >= maxAgeMs)
    return 'stale';
  if (row.status === 'page-observed') return 'pageObserved';
  if (row.reason === 'profile-domain-not-allowed' || row.reason === 'unsafe-homepage')
    return 'blocked';
  if (/ambiguous|multiple-observed-destinations/.test(row.reason ?? ''))
    return 'ambiguous';
  return 'unresolved';
}

export function planRegistryDiscovery(raw, catalog, curated = {}, ledgers = {}, options = {}) {
  if (!Array.isArray(raw) || !catalog?.registries
    || typeof catalog.registries !== 'object' || Array.isArray(catalog.registries))
    throw new Error('Invalid raw registry list or compact index');
  const maxRegistries = options.maxRegistries ?? 2;
  const maxAgeMs = options.maxAgeMs ?? 24 * 3600 * 1000;
  const now = Date.parse(options.asOf ?? new Date().toISOString());
  if (!Number.isSafeInteger(maxRegistries) || maxRegistries < 1 || maxRegistries > 20)
    throw new Error('Invalid maxRegistries, expected 1..20');
  if (!Number.isSafeInteger(maxAgeMs) || maxAgeMs < 1 || !Number.isFinite(now))
    throw new Error('Invalid freshness budget or observation time');
  const names = new Set();
  const source = [...raw].sort(byName);
  for (const entry of source) {
    if (!NAMESPACE.test(entry?.name ?? '') || names.has(entry.name))
      throw new Error('Invalid or duplicate official registry namespace');
    names.add(entry.name);
  }
  if (options.cursor && !names.has(options.cursor))
    throw new Error('Unknown registry cursor: ' + options.cursor);
  const allowedDomains = options.allowedDomains ?? [];
  const totals = Object.fromEntries(STATUSES.map(key => [key, 0]));
  const rows = source.map(registry => {
    const identities = [...new Set([
      ...(catalog.registries[registry.name] ?? []).map(item => item.name),
      ...(curated[registry.name] ?? []).map(item => item.slug),
    ])].sort();
    const fingerprint = catalogFingerprint(registry, identities);
    const counts = Object.fromEntries(STATUSES.map(key => [key, 0]));
    const journal = ledgers[registry.name];
    for (const name of identities) {
      const state = rowStatus(journal?.get(registry.name + '/' + name), fingerprint, now, maxAgeMs);
      counts[state]++;
      totals[state]++;
    }
    const eligible = profileAllows(registry.homepage, allowedDomains);
    return {
      namespace: registry.name, homepage: registry.homepage,
      totalItems: identities.length, ...counts,
      eligible, remaining: identities.length - counts.pageObserved,
    };
  });
  const summary = {
    rawRegistries: source.length,
    distinctItems: rows.reduce((sum, row) => sum + row.totalItems, 0),
    blockedByProfile: rows.filter(row => !row.eligible).length,
    ...totals,
  };
  const afterCursor = rows.filter(row => !options.cursor || row.namespace > options.cursor);
  const eligible = afterCursor.filter(row => row.eligible && row.remaining > 0);
  const batch = eligible.slice(0, maxRegistries);
  const nextCursor = eligible.length > batch.length
    ? batch.at(-1).namespace : null;
  return {schema: 'registry-atlas-discovery-schedule/v1', summary, registries: rows,
    batch, nextCursor};
}

export async function executeDiscoveryBatch(batch, runOne) {
  const results = [];
  for (const job of batch) {
    try {
      results.push({namespace: job.namespace, outcome: 'completed',
        result: await runOne(job)});
    } catch (error) {
      results.push({namespace: job.namespace, outcome: 'failed',
        reason: String(error?.message ?? error).slice(0, 250)});
    }
  }
  return results;
}

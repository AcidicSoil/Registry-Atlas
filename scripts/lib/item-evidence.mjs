import { planPreviewCoverage } from '../plan-component-previews.mjs';
import { catalogFingerprint, DISCOVERY_REVISION } from './registry-discovery.mjs';

const SCHEMA = 'registry-atlas-item-evidence/v1';
const keySort = (a, b) => a.localeCompare(b);
const safeUrl = value => {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password
      && !url.port ? url.href : null;
  } catch { return null; }
};
const localImage = url => /^\/Registry-Atlas\/data\/previews\/[a-z0-9/_-]+\.(?:jpg|jpeg|png|webp|svg)$/i.test(url);

function documentEvidence(row, fingerprint, asOf, maxAgeMs, token) {
  if (!row) return { status: 'pending' };
  const checked = Date.parse(row.checkedAt);
  if (row.discoveryRevision !== DISCOVERY_REVISION
    || row.catalogFingerprint !== fingerprint || !Number.isFinite(checked)
    || checked > asOf || asOf - checked >= maxAgeMs) return { status: 'stale' };
  if (row.status === 'page-observed' && row.token === token
    && safeUrl(row.docsUrl) && row.docsUrl === row.evidence?.observedUrl)
    return { status: 'observed', url: row.docsUrl };
  return { status: row.status === 'blocked' ? 'blocked' : 'unresolved' };
}

function visualEvidence(entry, source, assetExists) {
  if (!entry) return { status: 'pending' };
  if (!entry.imageUrl || typeof entry.imageUrl !== 'string'
    || !safeUrl(entry.officialPage)) return { status:'blocked', reason:'invalid-image-evidence' };
  if (localImage(entry.imageUrl) && !assetExists(entry.imageUrl))
    return { status:'blocked', reason:'missing-image-asset' };
  if (!localImage(entry.imageUrl) && !safeUrl(entry.imageUrl))
    return { status:'blocked', reason:'unapproved-image-url' };
  if (source.status !== 'observed' || source.url !== entry.officialPage)
    return { status:'blocked', reason:'source-page-unverified' };
  if (typeof entry.verification !== 'string' || !/official|matching/i.test(entry.verification))
    return { status:'blocked', reason:'image-review-missing' };
  return { status:'verified', url: entry.imageUrl, officialPage: entry.officialPage };
}

export function compileItemEvidence({raw, catalog, curated={}, visual, manifest, ledgers={},
  asOf=new Date().toISOString(), maxAgeMs=86_400_000, assetExists=()=>false}) {
  if (!visual || visual.schemaVersion !== 1 || !visual.previews
    || typeof visual.previews !== 'object' || Array.isArray(visual.previews))
    throw Error('Invalid visual preview manifest');
  const now = Date.parse(asOf);
  if (!Number.isFinite(now) || !Number.isSafeInteger(maxAgeMs) || maxAgeMs < 1)
    throw Error('Invalid evidence freshness window');
  const planned = planPreviewCoverage(raw, catalog, manifest,
    {limit:1, includeItems:true, assetExists}, curated);
  const validTokens = new Set(planned.items.map(row => row.token));
  const errors = [...planned.errors];
  for (const [namespace, indexed] of Object.entries(catalog.registries)) {
    const counts = new Map();
    for (const item of indexed ?? []) {
      if (typeof item?.name !== 'string' || !item.name) continue;
      counts.set(item.name, (counts.get(item.name) ?? 0) + 1);
    }
    for (const [slug, count] of counts)
      if (count > 1) errors.push({
        token: namespace + '/' + slug, reason:'duplicate-indexed-identity', count: count - 1,
      });
  }
  for (const token of Object.keys(visual.previews))
    if (!validTokens.has(token)) errors.push({token, reason:'orphan-visual-reference'});
  const fingerprints = new Map(raw.map(registry => {
    const identities = [...new Set([
      ...(catalog.registries[registry.name]??[]).map(item=>item.name),
      ...(curated[registry.name]??[]).map(item=>item.slug??item.name),
    ])];
    return [registry.name, catalogFingerprint(registry, identities)];
  }));
  const summaries = {
    source: {observed:0, pending:0, stale:0, blocked:0, unresolved:0},
    visual: {verified:0, pending:0, blocked:0},
    functional: {fixture:0, upstreamBuilt:0, pending:0, blocked:0},
  };
  const items = planned.items.map(item => {
    const token = item.token;
    const document = documentEvidence(ledgers[item.namespace]?.get(token),
      fingerprints.get(item.namespace), now, maxAgeMs, token);
    const image = visualEvidence(visual.previews[token], document, assetExists);
    const functional = { status:item.status,
      ...(item.reason?{reason:item.reason}:{}) };
    summaries.source[document.status]++;
    summaries.visual[image.status]++;
    summaries.functional[functional.status==='upstream-built'?'upstreamBuilt':functional.status]++;
    return {token, namespace:item.namespace, slug:item.slug, itemType:item.itemType,
      source:document, visual:image, functional};
  });
  const summary = { registryCount:raw.length, identityCount:items.length,
    indexedRows:planned.summary.indexedRows,
    indexedDistinct:planned.summary.indexedDistinct,
    curatedOnly:planned.summary.curatedOnly,
    indexedDuplicates:planned.summary.indexedDuplicates,
    ...summaries, errors:errors.length,
    complete:items.length>0 && errors.length===0
      && summaries.source.observed===items.length
      && summaries.visual.verified===items.length
      && summaries.functional.upstreamBuilt===items.length
      && planned.summary.complete };
  return {schema:SCHEMA,asOf,summary,items,errors,registries:planned.registries,
    note:'An image or source-informed fixture is not a verified upstream runtime.'};
}

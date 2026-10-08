import { buildCatalogClassificationState } from './catalog-classification-state.mjs';
import { catalogClassificationInputFingerprint } from './catalog-classifier.mjs';
import { flattenCatalogTaxonomy, validateCatalogTaxonomy } from './catalog-taxonomy.mjs';

const SCHEMA = 'registry-atlas.catalog-classification-overlay.v1';
const FINGERPRINT = /^sha256:[a-f0-9]{64}$/;
const KINDS = new Set(['component', 'block', 'page', 'template', 'theme', 'icon', 'other']);

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function identity(namespace, name) {
  return `${String(namespace).trim().toLowerCase()}\u0000${String(name).trim().toLowerCase()}`;
}

function expectedPathMap(taxonomy) {
  const records = flattenCatalogTaxonomy(taxonomy);
  const byId = new Map(records.map(record => [record.id, record]));
  const paths = new Map();
  for (const record of records) {
    const path = [];
    let current = record;
    while (current) {
      path.unshift(current.id);
      current = current.parentId ? byId.get(current.parentId) : null;
    }
    paths.set(record.id, path);
  }
  return paths;
}

export function validateCatalogClassificationOverlay(value, taxonomy) {
  const reviewedTaxonomy = validateCatalogTaxonomy(taxonomy);
  if (!isRecord(value) || value.schema !== SCHEMA) throw new Error('Classification overlay schema is invalid');
  if (value.taxonomyVersion !== reviewedTaxonomy.version) throw new Error('Classification overlay taxonomy version mismatch');
  for (const field of ['taxonomyFingerprint', 'classificationRunFingerprint', 'evaluationReportFingerprint']) {
    if (!FINGERPRINT.test(value[field] ?? '')) throw new Error(`Classification overlay ${field} is invalid`);
  }
  if (typeof value.approvedBy !== 'string' || !value.approvedBy.trim()) throw new Error('Classification overlay approvedBy is required');
  if (typeof value.approvedAt !== 'string' || Number.isNaN(Date.parse(value.approvedAt))) throw new Error('Classification overlay approvedAt is invalid');
  if (!Array.isArray(value.items)) throw new Error('Classification overlay items must be an array');

  const paths = expectedPathMap(reviewedTaxonomy);
  const seen = new Set();
  for (const item of value.items) {
    if (!isRecord(item) || typeof item.namespace !== 'string' || !item.namespace.startsWith('@')
      || typeof item.name !== 'string' || !item.name.trim()) {
      throw new Error('Classification overlay item identity is invalid');
    }
    const key = identity(item.namespace, item.name);
    if (seen.has(key)) throw new Error(`Duplicate classification overlay item: ${item.namespace}/${item.name}`);
    seen.add(key);
    if (!KINDS.has(item.kind)) throw new Error('Classification overlay item kind is invalid');
    if (!FINGERPRINT.test(item.inputFingerprint ?? '')) throw new Error('Classification overlay item input fingerprint is invalid');
    if (!isRecord(item.canonical) || !Array.isArray(item.canonical.path)) throw new Error('Classification overlay canonical value is invalid');
    if (item.canonical.primary === null) {
      if (item.canonical.path.length !== 0) throw new Error('Classification overlay unclassified canonical path must be empty');
    } else {
      const expected = paths.get(item.canonical.primary);
      if (!expected || JSON.stringify(expected) !== JSON.stringify(item.canonical.path)) {
        throw new Error(`Classification overlay canonical path is outside taxonomy: ${item.canonical.primary}`);
      }
    }
    if (item.sourceGroups !== undefined
      && (!Array.isArray(item.sourceGroups)
        || item.sourceGroups.some(group => typeof group !== 'string' || !group.trim()))) {
      throw new Error('Classification overlay sourceGroups must be non-empty strings');
    }
  }
  return value;
}

function currentInputFingerprint(namespace, rawItem, overlayItem) {
  const sourceHints = {};
  if (Array.isArray(rawItem.categories) && rawItem.categories.length) sourceHints.categories = rawItem.categories;
  if (Array.isArray(rawItem.sourceGroups) && rawItem.sourceGroups.length) sourceHints.verifiedGroups = rawItem.sourceGroups;
  const state = buildCatalogClassificationState({
    namespace,
    item: {
      name: rawItem.name,
      ...(rawItem.title ? { title: rawItem.title } : {}),
      ...(rawItem.description ? { description: rawItem.description } : {}),
      kind: overlayItem.kind,
    },
    ...(Object.keys(sourceHints).length ? { sourceHints } : {}),
  });
  return catalogClassificationInputFingerprint(state);
}

function explicitAccess(namespace, labels, accessRules) {
  const registryRules = accessRules?.registries?.[namespace];
  const normalizedRules = registryRules && typeof registryRules === 'object' && !Array.isArray(registryRules)
    ? new Map(Object.entries(registryRules).map(([label, normalized]) => [label.trim().toLowerCase(), normalized]))
    : new Map();
  const matches = [];
  for (const label of labels) {
    if (typeof label !== 'string' || !label.trim()) continue;
    const normalized = normalizedRules.get(label.trim().toLowerCase());
    if (normalized === 'free' || normalized === 'paid') matches.push({ normalized, sourceLabel: label.trim() });
  }
  const normalizedValues = new Set(matches.map(match => match.normalized));
  if (normalizedValues.size > 1) throw new Error(`Conflicting explicit access labels for ${namespace}`);
  if (matches[0]) return matches[0];

  const fallback = accessRules?.registryDefaults?.[namespace];
  if (!fallback || typeof fallback !== 'object' || Array.isArray(fallback)) return undefined;
  if ((fallback.normalized !== 'free' && fallback.normalized !== 'paid')
    || typeof fallback.sourceLabel !== 'string' || !fallback.sourceLabel.trim()) {
    throw new Error(`Invalid registry-level access rule for ${namespace}`);
  }
  return {
    normalized: fallback.normalized,
    sourceLabel: fallback.sourceLabel.trim(),
  };
}

export function stripCatalogClassificationFields(itemsByNamespace) {
  if (!itemsByNamespace || typeof itemsByNamespace !== 'object' || Array.isArray(itemsByNamespace)) {
    throw new Error('Catalog overlay input must be registry item buckets');
  }
  return Object.fromEntries(Object.entries(itemsByNamespace).map(([namespace, items]) => {
    if (!Array.isArray(items)) throw new Error(`Catalog overlay registry bucket ${namespace} must be an array`);
    return [namespace, items.map(item => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return item;
      const { kind: _kind, canonical: _canonical, sourceGroups: _sourceGroups, access: _access, ...raw } = item;
      return raw;
    })];
  }));
}

export function applyCatalogClassificationOverlay(itemsByNamespace, overlay, accessRules = {}) {
  if (!itemsByNamespace || typeof itemsByNamespace !== 'object' || Array.isArray(itemsByNamespace)) {
    throw new Error('Catalog overlay input must be registry item buckets');
  }
  const stripped = stripCatalogClassificationFields(itemsByNamespace);
  const overlayByIdentity = new Map(overlay.items.map(item => [identity(item.namespace, item.name), item]));
  const matchedOverlay = new Set();
  let applied = 0;
  let stale = 0;
  const output = {};

  for (const [namespace, items] of Object.entries(stripped)) {
    if (!Array.isArray(items)) throw new Error(`Catalog overlay registry bucket ${namespace} must be an array`);
    output[namespace] = items.map(rawItem => {
      if (!rawItem || typeof rawItem.name !== 'string') return rawItem;
      const key = identity(namespace, rawItem.name);
      const reviewed = overlayByIdentity.get(key);
      if (!reviewed) return { ...rawItem };
      matchedOverlay.add(key);
      if (currentInputFingerprint(namespace, rawItem, reviewed) !== reviewed.inputFingerprint) {
        stale += 1;
        return { ...rawItem };
      }
      const labels = [
        ...(Array.isArray(rawItem.categories) ? rawItem.categories : []),
        ...(Array.isArray(reviewed.sourceGroups) ? reviewed.sourceGroups : []),
      ];
      const access = explicitAccess(namespace, labels, accessRules);
      applied += 1;
      return {
        ...rawItem,
        kind: reviewed.kind,
        canonical: {
          taxonomyVersion: overlay.taxonomyVersion,
          primary: reviewed.canonical.primary,
          path: [...reviewed.canonical.path],
        },
        ...(reviewed.sourceGroups?.length ? { sourceGroups: [...reviewed.sourceGroups] } : {}),
        ...(access ? { access } : {}),
      };
    });
  }

  return {
    itemsByNamespace: output,
    report: {
      applied,
      stale,
      missing: [...overlayByIdentity.keys()].filter(key => !matchedOverlay.has(key)).length,
    },
  };
}

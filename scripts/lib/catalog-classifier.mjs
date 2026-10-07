import { createHash } from 'node:crypto';
import { flattenCatalogTaxonomy } from './catalog-taxonomy.mjs';

function normalizeAlias(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/^\s+|\s+$/g, '')
    .replace(/\s+/g, ' ');
}

function fingerprintState(state) {
  return 'sha256:' + createHash('sha256').update(JSON.stringify(state)).digest('hex');
}

function evidenceStrings(state) {
  return [
    state?.item?.title,
    ...(state?.sourceHints?.categories ?? []),
    ...(state?.sourceHints?.verifiedGroups ?? []),
  ].filter(value => typeof value === 'string' && value.trim());
}

function pathFor(recordsById, id) {
  const path = [];
  let record = recordsById.get(id);
  while (record) {
    path.unshift(record.id);
    record = record.parentId ? recordsById.get(record.parentId) : null;
  }
  return path;
}

export function findDeterministicAliasClassification(state, taxonomy) {
  const records = flattenCatalogTaxonomy(taxonomy);
  const recordsById = new Map(records.map(record => [record.id, record]));
  const aliasOwners = new Map();
  for (const record of records) {
    for (const value of [record.label, ...record.aliases]) {
      const alias = normalizeAlias(value);
      if (!alias) continue;
      const owners = aliasOwners.get(alias) ?? new Set();
      owners.add(record.id);
      aliasOwners.set(alias, owners);
    }
  }

  const matches = new Set();
  for (const value of evidenceStrings(state)) {
    const owners = aliasOwners.get(normalizeAlias(value));
    if (!owners) continue;
    for (const id of owners) matches.add(id);
  }
  if (matches.size !== 1) return null;

  const primary = [...matches][0];
  return {
    taxonomyVersion: taxonomy.version,
    primary,
    path: pathFor(recordsById, primary),
    method: 'deterministic-alias',
    inputFingerprint: fingerprintState(state),
  };
}

export function catalogClassificationInputFingerprint(state) {
  return fingerprintState(state);
}

import { createHash } from 'node:crypto';
import { flattenCatalogTaxonomy, validateCatalogTaxonomy } from './catalog-taxonomy.mjs';
import { chooseTaxonomyOption } from './systemone-taxonomy.mjs';

const ROOT_SPECIAL = 'UNCLASSIFIED';
const CHILD_SPECIAL = 'THIS_CATEGORY';

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

export function findDeterministicKindClassification(state, taxonomy) {
  const records = flattenCatalogTaxonomy(taxonomy);
  const recordsById = new Map(records.map(record => [record.id, record]));
  if (state?.item?.kind !== 'icon' || !recordsById.has('foundation/iconography')) return null;
  return {
    taxonomyVersion: taxonomy.version,
    primary: 'foundation/iconography',
    path: pathFor(recordsById, 'foundation/iconography'),
    method: 'deterministic-kind',
    inputFingerprint: fingerprintState(state),
  };
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

function scorePath(path) {
  if (path.edgeCount === 0) return 0;
  if (path.logProbability === Number.NEGATIVE_INFINITY) return 0;
  return Math.exp(path.logProbability / path.edgeCount);
}

function extendPath(path, probability, id, terminal = false, unclassified = false) {
  const logProbability = probability === 0
    ? Number.NEGATIVE_INFINITY
    : path.logProbability + Math.log(probability);
  const next = {
    ids: id ? [...path.ids, id] : [...path.ids],
    logProbability,
    edgeCount: path.edgeCount + 1,
    terminal,
    unclassified,
  };
  return { ...next, score: scorePath(next) };
}

function sortPaths(paths) {
  return [...paths].sort((a, b) => b.score - a.score
    || b.edgeCount - a.edgeCount
    || a.ids.join('/').localeCompare(b.ids.join('/')));
}

function traceDecision(node, answer) {
  return {
    nodeId: node?.id ?? null,
    choice: answer.choice,
    probabilities: { ...answer.probabilities },
    confidence: answer.confidence,
    model: answer.model ?? null,
  };
}

function optionNode(record) {
  return record.node;
}

export async function classifyCatalogItem({
  state,
  taxonomy,
  choose = chooseTaxonomyOption,
  beamWidth = 2,
} = {}) {
  const validated = validateCatalogTaxonomy(taxonomy);
  if (!state || typeof state !== 'object' || Array.isArray(state)) {
    throw new Error('Catalog classification requires semantic state');
  }
  if (typeof choose !== 'function') throw new Error('Catalog classification requires a Choice function');
  if (!Number.isSafeInteger(beamWidth) || beamWidth < 1 || beamWidth > 8) {
    throw new Error('Catalog classification beamWidth must be an integer from 1 to 8');
  }

  const deterministicKind = findDeterministicKindClassification(state, validated);
  if (deterministicKind) return deterministicKind;
  const deterministicAlias = findDeterministicAliasClassification(state, validated);
  if (deterministicAlias) return deterministicAlias;

  const records = flattenCatalogTaxonomy(validated);
  const byId = new Map(records.map(record => [record.id, record]));
  const roots = records.filter(record => record.parentId === null);
  const decisions = [];
  let model = null;

  const rootAnswer = await choose({
    state,
    node: null,
    options: roots.map(optionNode),
  });
  decisions.push(traceDecision(null, rootAnswer));
  if (rootAnswer.model) model = rootAnswer.model;

  const initial = { ids: [], logProbability: 0, edgeCount: 0, terminal: false, unclassified: false, score: 0 };
  const rootPaths = [];
  for (const record of roots) {
    const probability = rootAnswer.probabilities[record.id];
    rootPaths.push(extendPath(initial, probability, record.id, record.children.length === 0, false));
  }
  rootPaths.push(extendPath(initial, rootAnswer.probabilities[ROOT_SPECIAL], null, true, true));
  let beam = sortPaths(rootPaths).slice(0, beamWidth);

  const maxDepth = records.reduce((max, record) => Math.max(max, record.depth), 0) + 1;
  for (let depth = 0; depth <= maxDepth && beam.some(path => !path.terminal); depth += 1) {
    const candidates = beam.filter(path => path.terminal);
    for (const path of beam.filter(candidate => !candidate.terminal)) {
      const currentId = path.ids.at(-1);
      const current = byId.get(currentId);
      if (!current) throw new Error(`Catalog classification reached unknown taxonomy node ${currentId}`);
      if (current.children.length === 0) {
        candidates.push({ ...path, terminal: true });
        continue;
      }
      const childRecords = current.children.map(id => byId.get(id));
      if (childRecords.some(record => !record)) {
        throw new Error(`Catalog classification found an invalid child under ${current.id}`);
      }
      const answer = await choose({
        state,
        node: optionNode(current),
        options: childRecords.map(optionNode),
      });
      decisions.push(traceDecision(optionNode(current), answer));
      if (!model && answer.model) model = answer.model;

      for (const child of childRecords) {
        const probability = answer.probabilities[child.id];
        candidates.push(extendPath(path, probability, child.id, child.children.length === 0, false));
      }
      candidates.push(extendPath(path, answer.probabilities[CHILD_SPECIAL], null, true, false));
    }
    beam = sortPaths(candidates).slice(0, beamWidth);
  }

  const finals = sortPaths(beam.map(path => path.terminal ? path : { ...path, terminal: true }));
  const best = finals[0];
  if (!best) throw new Error('Catalog classification produced no path');
  const runnerUp = finals[1];
  const primary = best.unclassified ? null : (best.ids.at(-1) ?? null);
  const method = primary === null ? 'unclassified' : 'system-one';
  const result = {
    taxonomyVersion: validated.version,
    primary,
    path: primary === null ? [] : best.ids,
    method,
    inputFingerprint: fingerprintState(state),
    systemOne: {
      model: model ?? 'unknown',
      beamWidth,
      decisions,
      finalPathScore: best.score,
      ...(runnerUp ? { runnerUpPathScore: runnerUp.score } : {}),
      ...(runnerUp && runnerUp.score > 0 ? { separation: best.score / runnerUp.score } : {}),
    },
  };
  return result;
}

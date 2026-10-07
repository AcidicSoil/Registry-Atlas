#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const KINDS = new Set(['component', 'block', 'page', 'template', 'theme', 'icon', 'other']);
const FINGERPRINT = /^sha256:[a-f0-9]{64}$/;

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requiredString(value, field) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${field} is required`);
  return value.trim();
}

function validateExpected(expected) {
  if (!isRecord(expected) || !KINDS.has(expected.kind)) throw new Error('Gold expected kind is invalid');
  if (!Array.isArray(expected.path) || expected.path.some(id => typeof id !== 'string' || !id)) {
    throw new Error('Gold expected path is invalid');
  }
  if (expected.primary === null) {
    if (expected.path.length) throw new Error('Gold expected path must be empty when primary is null');
  } else {
    const primary = requiredString(expected.primary, 'Gold expected primary');
    if (!expected.path.length || expected.path.at(-1) !== primary) {
      throw new Error('Gold expected path must end at primary');
    }
    for (let index = 0; index < expected.path.length; index += 1) {
      const id = expected.path[index];
      if (index === 0) {
        if (id.includes('/')) throw new Error('Gold expected path must begin at a root');
      } else {
        const parent = expected.path[index - 1];
        if (!id.startsWith(`${parent}/`) || id.split('/').length !== parent.split('/').length + 1) {
          throw new Error('Gold expected path must be hierarchical');
        }
      }
    }
  }
  return { kind: expected.kind, primary: expected.primary, path: [...expected.path] };
}

export function validateGoldSet(value) {
  if (!isRecord(value)) throw new Error('Gold set must be an object');
  const version = requiredString(value.version, 'Gold version');
  const taxonomyVersion = requiredString(value.taxonomyVersion, 'Gold taxonomyVersion');
  if (!Array.isArray(value.records) || value.records.length === 0) throw new Error('Gold records are required');
  const seen = new Set();
  const records = value.records.map(raw => {
    if (!isRecord(raw) || !isRecord(raw.item)) throw new Error('Gold record is invalid');
    const registry = requiredString(raw.registry, 'Gold registry');
    if (!registry.startsWith('@')) throw new Error('Gold registry must be a namespace');
    const name = requiredString(raw.item.name, 'Gold item name');
    if (!KINDS.has(raw.item.kind)) throw new Error('Gold item kind is invalid');
    const key = `${registry}/${name}`;
    if (seen.has(key)) throw new Error(`Duplicate gold identity: ${key}`);
    seen.add(key);
    return {
      ...raw,
      registry,
      item: { ...raw.item, name, kind: raw.item.kind },
      expected: validateExpected(raw.expected),
    };
  });
  return { ...value, version, taxonomyVersion, records };
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (isRecord(value)) return Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]));
  return value;
}

export function catalogArtifactFingerprint(value) {
  return 'sha256:' + createHash('sha256').update(JSON.stringify(stable(value))).digest('hex');
}

function identity(namespace, name) {
  return `${namespace}/${name}`;
}

function accuracy(correct, total) {
  return { correct, total, accuracy: total ? correct / total : 1 };
}

function numericSummary(values) {
  const nums = values.filter(Number.isFinite).map(Number);
  if (!nums.length) return { count: 0, min: null, max: null, mean: null };
  const sum = nums.reduce((total, value) => total + value, 0);
  return { count: nums.length, min: Math.min(...nums), max: Math.max(...nums), mean: sum / nums.length };
}

function evaluateOne(gold, items) {
  const actualByKey = new Map(items.map(item => [identity(item.namespace, item.name), item]));
  let exact = 0;
  let family = 0;
  let pathCorrect = 0;
  let pathTotal = 0;
  let truePositive = 0;
  let falsePositive = 0;
  let falseNegative = 0;
  const confusions = new Map();
  const byKind = new Map();
  const byRegistry = new Map();

  for (const row of gold.records) {
    const actual = actualByKey.get(identity(row.registry, row.item.name));
    const expectedPrimary = row.expected.primary;
    const actualPrimary = actual?.canonical?.primary ?? (actual ? null : '<missing>');
    const primaryCorrect = actual !== undefined && actualPrimary === expectedPrimary;
    if (primaryCorrect) exact += 1;

    const expectedFamily = row.expected.path[0] ?? null;
    const actualFamily = actual?.canonical?.path?.[0] ?? (actual ? null : '<missing>');
    if (actual !== undefined && actualFamily === expectedFamily) family += 1;

    if (expectedPrimary === null) {
      pathTotal += 1;
      if (actual !== undefined && actual?.canonical?.primary === null) pathCorrect += 1;
    } else {
      for (let index = 0; index < row.expected.path.length; index += 1) {
        pathTotal += 1;
        if (actual?.canonical?.path?.[index] === row.expected.path[index]) pathCorrect += 1;
      }
    }

    const predictedUnclassified = actual !== undefined && actual?.canonical?.primary === null;
    const expectedUnclassified = expectedPrimary === null;
    if (predictedUnclassified && expectedUnclassified) truePositive += 1;
    else if (predictedUnclassified && !expectedUnclassified) falsePositive += 1;
    else if (!predictedUnclassified && expectedUnclassified) falseNegative += 1;

    if (!primaryCorrect) {
      const expectedLabel = expectedPrimary ?? 'UNCLASSIFIED';
      const actualLabel = actual === undefined ? 'MISSING' : (actual?.canonical?.primary ?? 'UNCLASSIFIED');
      const key = `${expectedLabel}\u0000${actualLabel}`;
      confusions.set(key, (confusions.get(key) ?? 0) + 1);
    }

    for (const [map, key] of [[byKind, row.expected.kind], [byRegistry, row.registry]]) {
      const current = map.get(key) ?? { correct: 0, total: 0 };
      current.total += 1;
      if (primaryCorrect && actual?.kind === row.expected.kind) current.correct += 1;
      map.set(key, current);
    }
  }

  const summarizeGroups = map => Object.fromEntries([...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => [
    key, accuracy(value.correct, value.total),
  ]));
  return {
    exactPrimary: accuracy(exact, gold.records.length),
    topFamily: accuracy(family, gold.records.length),
    ancestorPath: { correct: pathCorrect, total: pathTotal, accuracy: pathTotal ? pathCorrect / pathTotal : 1 },
    unclassified: {
      precision: truePositive + falsePositive ? truePositive / (truePositive + falsePositive) : 1,
      recall: truePositive + falseNegative ? truePositive / (truePositive + falseNegative) : 1,
      truePositive, falsePositive, falseNegative,
    },
    confusions: [...confusions.entries()].map(([key, count]) => {
      const [expected, actual] = key.split('\u0000');
      return { expected, actual, count };
    }).sort((a, b) => b.count - a.count || a.expected.localeCompare(b.expected) || a.actual.localeCompare(b.actual)),
    byKind: summarizeGroups(byKind),
    byRegistry: summarizeGroups(byRegistry),
  };
}

export function evaluateCatalogClassifications({ gold, beamItems, greedyItems = null } = {}) {
  const reviewed = validateGoldSet(gold);
  if (!Array.isArray(beamItems)) throw new Error('Beam classification items are required');
  if (greedyItems !== null && !Array.isArray(greedyItems)) throw new Error('Greedy classification items must be an array');
  const metrics = evaluateOne(reviewed, beamItems);
  const selectedProbabilities = [];
  const finalPathScores = [];
  const separations = [];
  for (const item of beamItems) {
    if (!item?.systemOne) continue;
    if (Number.isFinite(item.systemOne.finalPathScore)) finalPathScores.push(item.systemOne.finalPathScore);
    if (Number.isFinite(item.systemOne.separation)) separations.push(item.systemOne.separation);
    for (const decision of item.systemOne.decisions ?? []) {
      const probability = decision?.probabilities?.[decision?.choice];
      if (Number.isFinite(probability)) selectedProbabilities.push(probability);
    }
  }
  const greedyMetrics = greedyItems ? evaluateOne(reviewed, greedyItems) : null;
  const base = {
    schema: 'registry-atlas.catalog-classification-evaluation.v1',
    taxonomyVersion: reviewed.taxonomyVersion,
    goldVersion: reviewed.version,
    goldFingerprint: catalogArtifactFingerprint(reviewed),
    classificationRunFingerprint: catalogArtifactFingerprint(beamItems),
    metrics,
    greedyVsBeam: greedyMetrics ? {
      beamExactAccuracy: metrics.exactPrimary.accuracy,
      greedyExactAccuracy: greedyMetrics.exactPrimary.accuracy,
      delta: metrics.exactPrimary.accuracy - greedyMetrics.exactPrimary.accuracy,
    } : null,
    distributions: {
      selectedProbability: numericSummary(selectedProbabilities),
      finalPathScore: numericSummary(finalPathScores),
      separation: numericSummary(separations),
    },
  };
  return { ...base, evaluationReportFingerprint: catalogArtifactFingerprint(base) };
}

export function validatePromotionReview(value) {
  if (!isRecord(value) || value.schema !== 'registry-atlas.catalog-promotion-review.v1') {
    throw new Error('Promotion review schema is invalid');
  }
  if (value.approved !== true) throw new Error('Promotion review must be explicitly approved');
  requiredString(value.taxonomyVersion, 'Promotion taxonomyVersion');
  if (!FINGERPRINT.test(value.classificationRunFingerprint ?? '')) throw new Error('Promotion classification fingerprint is invalid');
  if (!FINGERPRINT.test(value.evaluationReportFingerprint ?? '')) throw new Error('Promotion evaluation fingerprint is invalid');
  requiredString(value.reviewer, 'Promotion reviewer');
  const approvedAt = requiredString(value.approvedAt, 'Promotion approvedAt');
  if (Number.isNaN(Date.parse(approvedAt))) throw new Error('Promotion approvedAt is invalid');
  return value;
}

async function loadItems(path) {
  const info = await stat(path);
  if (info.isDirectory()) {
    const files = (await readdir(path)).filter(name => name.endsWith('.json') && !name.startsWith('_')).sort();
    const items = [];
    for (const file of files) {
      const parsed = JSON.parse(await readFile(resolve(path, file), 'utf8'));
      if (Array.isArray(parsed.items)) items.push(...parsed.items);
    }
    return items;
  }
  const parsed = JSON.parse(await readFile(path, 'utf8'));
  if (Array.isArray(parsed)) return parsed;
  if (Array.isArray(parsed.items)) return parsed.items;
  throw new Error(`Classification input ${path} does not contain items`);
}

function parseArgs(argv) {
  const output = { gold: 'data/catalog-taxonomy/gold.json', beam: null, greedy: null, output: null };
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    if (!['--gold', '--beam', '--greedy', '--output'].includes(flag)) throw new Error(`Unknown argument: ${flag}`);
    const value = argv[++index];
    if (!value || value.startsWith('--')) throw new Error(`Missing value for ${flag}`);
    output[flag.slice(2)] = value;
  }
  if (!output.beam) throw new Error('Missing required --beam');
  return output;
}

export async function main(argv = process.argv.slice(2), cwd = process.cwd()) {
  const options = parseArgs(argv);
  const gold = JSON.parse(await readFile(resolve(cwd, options.gold), 'utf8'));
  const beamItems = await loadItems(resolve(cwd, options.beam));
  const greedyItems = options.greedy ? await loadItems(resolve(cwd, options.greedy)) : null;
  const report = evaluateCatalogClassifications({ gold, beamItems, greedyItems });
  if (options.output) await writeFile(resolve(cwd, options.output), JSON.stringify(report, null, 2) + '\n');
  return report;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().then(result => console.log(JSON.stringify(result, null, 2))).catch(error => {
    console.error(String(error?.message ?? error));
    process.exitCode = 1;
  });
}

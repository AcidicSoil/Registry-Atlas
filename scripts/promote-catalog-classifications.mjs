#!/usr/bin/env node
import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { validateCatalogClassificationOverlay } from './lib/catalog-classification-overlay.mjs';
import { validateCatalogTaxonomy } from './lib/catalog-taxonomy.mjs';
import { catalogArtifactFingerprint, validatePromotionReview } from './evaluate-catalog-classifications.mjs';

const DEFAULT_TAXONOMY = 'data/catalog-taxonomy/v1.json';
const DEFAULT_OUTPUT = 'data/catalog-taxonomy/classifications.json';

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

async function loadClassificationItems(path) {
  const info = await stat(path);
  if (info.isDirectory()) {
    const items = [];
    const files = (await readdir(path)).filter(name => name.endsWith('.json') && !name.startsWith('_')).sort();
    for (const file of files) {
      const value = await readJson(resolve(path, file));
      if (Array.isArray(value.items)) items.push(...value.items);
    }
    return items;
  }
  const value = await readJson(path);
  if (Array.isArray(value)) return value;
  if (Array.isArray(value.items)) return value.items;
  throw new Error('Classification run does not contain items');
}

function evaluationFingerprint(value) {
  const base = { ...value };
  delete base.evaluationReportFingerprint;
  return catalogArtifactFingerprint(base);
}

export function buildReviewedClassificationOverlay({ taxonomy, classifications, evaluation, review } = {}) {
  const reviewedTaxonomy = validateCatalogTaxonomy(taxonomy);
  if (!Array.isArray(classifications)) throw new Error('Reviewed classifications must be an array');
  const approved = validatePromotionReview(review);
  if (approved.taxonomyVersion !== reviewedTaxonomy.version
    || evaluation?.taxonomyVersion !== reviewedTaxonomy.version) {
    throw new Error('Promotion taxonomy version does not match reviewed taxonomy');
  }

  const runFingerprint = catalogArtifactFingerprint(classifications);
  if (evaluation?.classificationRunFingerprint !== runFingerprint
    || approved.classificationRunFingerprint !== runFingerprint) {
    throw new Error('Promotion classification run fingerprint mismatch');
  }
  const computedEvaluationFingerprint = evaluationFingerprint(evaluation ?? {});
  if (evaluation?.evaluationReportFingerprint !== computedEvaluationFingerprint
    || approved.evaluationReportFingerprint !== computedEvaluationFingerprint) {
    throw new Error('Promotion evaluation report fingerprint mismatch');
  }

  const items = classifications.map(item => {
    if (!item || typeof item !== 'object' || item.pendingDecision) {
      throw new Error('Promotion cannot include pending or invalid classification items');
    }
    if (item.taxonomyVersion !== reviewedTaxonomy.version) {
      throw new Error(`Promotion item taxonomy mismatch for ${item?.namespace}/${item?.name}`);
    }
    return {
      namespace: item.namespace,
      name: item.name,
      kind: item.kind,
      canonical: {
        primary: item.canonical?.primary ?? null,
        path: [...(item.canonical?.path ?? [])],
      },
      inputFingerprint: item.inputFingerprint,
      ...(Array.isArray(item.sourceGroups) && item.sourceGroups.length
        ? { sourceGroups: [...item.sourceGroups] } : {}),
    };
  }).sort((a, b) => a.namespace.localeCompare(b.namespace) || a.name.localeCompare(b.name));

  const overlay = {
    schema: 'registry-atlas.catalog-classification-overlay.v1',
    taxonomyVersion: reviewedTaxonomy.version,
    taxonomyFingerprint: catalogArtifactFingerprint(reviewedTaxonomy),
    classificationRunFingerprint: runFingerprint,
    evaluationReportFingerprint: computedEvaluationFingerprint,
    approvedBy: approved.reviewer,
    approvedAt: approved.approvedAt,
    items,
  };
  return validateCatalogClassificationOverlay(overlay, reviewedTaxonomy);
}

function parseArgs(argv) {
  const options = {
    taxonomy: DEFAULT_TAXONOMY,
    classifications: null,
    evaluation: null,
    review: null,
    output: DEFAULT_OUTPUT,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    if (!['--taxonomy', '--classifications', '--evaluation', '--review', '--output'].includes(flag)) {
      throw new Error(`Unknown argument: ${flag}`);
    }
    const value = argv[++index];
    if (!value || value.startsWith('--')) throw new Error(`Missing value for ${flag}`);
    options[flag.slice(2)] = value;
  }
  for (const key of ['classifications', 'evaluation', 'review']) {
    if (!options[key]) throw new Error(`Missing required --${key}`);
  }
  return options;
}

export async function main(argv = process.argv.slice(2), cwd = process.cwd()) {
  const options = parseArgs(argv);
  const [taxonomyValue, classifications, evaluation, review] = await Promise.all([
    readJson(resolve(cwd, options.taxonomy)),
    loadClassificationItems(resolve(cwd, options.classifications)),
    readJson(resolve(cwd, options.evaluation)),
    readJson(resolve(cwd, options.review)),
  ]);
  const overlay = buildReviewedClassificationOverlay({
    taxonomy: taxonomyValue, classifications, evaluation, review,
  });
  const output = resolve(cwd, options.output);
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, JSON.stringify(overlay, null, 2) + '\n');
  return overlay;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().then(result => console.log(JSON.stringify(result, null, 2))).catch(error => {
    console.error(String(error?.message ?? error));
    process.exitCode = 1;
  });
}

#!/usr/bin/env node
import { pathToFileURL } from 'node:url';
import { validateCatalogClassificationOverlay } from './lib/catalog-classification-overlay.mjs';
import {
  openAtlasCoreDatabase,
  readClassificationRun,
  readClassificationRunItems,
  readDocument,
  replaceClassificationOverlay,
} from './lib/atlas-storage.mjs';
import { validateCatalogTaxonomy } from './lib/catalog-taxonomy.mjs';
import { catalogArtifactFingerprint, validatePromotionReview } from './evaluate-catalog-classifications.mjs';


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

export function parsePromotionArgs(argv) {
  const options = {
    runId: null,
    evaluationDocument: 'catalog-classification-evaluation',
    reviewDocument: 'catalog-promotion-review',
  };
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    if (!['--run-id', '--evaluation-document', '--review-document'].includes(flag)) {
      throw new Error(`Unknown argument: ${flag}`);
    }
    const value = argv[++index];
    if (!value || value.startsWith('--')) throw new Error(`Missing value for ${flag}`);
    if (flag === '--run-id') options.runId = value;
    else if (flag === '--evaluation-document') options.evaluationDocument = value;
    else options.reviewDocument = value;
  }
  if (!options.runId) throw new Error('Missing required --run-id');
  return options;
}

export async function main(argv = process.argv.slice(2), cwd = process.cwd()) {
  const options = parsePromotionArgs(argv);
  const database = openAtlasCoreDatabase(cwd);
  try {
    const taxonomyValue = readDocument(database, 'catalog-taxonomy');
    if (!taxonomyValue) throw new Error('Catalog taxonomy is missing from the Atlas database');
    const run = readClassificationRun(database, options.runId);
    if (!run || run.status !== 'completed') {
      throw new Error(`Classification run is not complete: ${options.runId}`);
    }
    const classifications = readClassificationRunItems(database, options.runId);
    const evaluation = readDocument(database, options.evaluationDocument);
    const review = readDocument(database, options.reviewDocument);
    if (!evaluation) throw new Error(`Evaluation document is missing: ${options.evaluationDocument}`);
    if (!review) throw new Error(`Promotion review document is missing: ${options.reviewDocument}`);
    if (evaluation.beamRunId && evaluation.beamRunId !== options.runId) {
      throw new Error('Evaluation document belongs to a different classification run');
    }
    const overlay = buildReviewedClassificationOverlay({
      taxonomy: taxonomyValue,
      classifications,
      evaluation,
      review,
    });
    replaceClassificationOverlay(database, overlay);
    return overlay;
  } finally {
    database.close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().then(result => console.log(JSON.stringify(result, null, 2))).catch(error => {
    console.error(String(error?.message ?? error));
    process.exitCode = 1;
  });
}

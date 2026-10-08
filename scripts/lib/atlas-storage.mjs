import { resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import {
  ensureAtlasCoreSchema,
  ensureAtlasDetailSchema,
  putClassificationBatch,
  putClassificationRun,
  putDocument,
  readCatalogEvidence,
  readCatalogSnapshot,
  readClassificationBatches,
  readClassificationRun,
  readClassificationRunItems,
  readClassifications,
  readCuratedItemSummaries,
  readDocument,
  readRawRegistries,
  readRegistrySnapshot,
  readSourcePages,
  replaceCatalogEvidence,
  replaceCatalogSnapshot,
  replaceClassifications,
  replaceCuratedAndRegistrySnapshot,
  replaceCuratedItemSummaries,
  replaceItemDetails,
  replaceRawRegistries,
  replaceRegistrySnapshot,
  replaceSourcePages,
  resetClassificationRun,
  upsertClassificationRunItems,
} from './atlas-database.mjs';

export const CORE_DATABASE_PATH = 'data/registry-atlas.sqlite';
export const DETAIL_DATABASE_PATH = 'data/registry-details.sqlite';

export function openAtlasCoreDatabase(cwd = process.cwd(), { readOnly = false } = {}) {
  const database = new DatabaseSync(resolve(cwd, CORE_DATABASE_PATH), { readOnly });
  if (!readOnly) ensureAtlasCoreSchema(database);
  return database;
}

export function openAtlasDetailDatabase(cwd = process.cwd(), { readOnly = false } = {}) {
  const database = new DatabaseSync(resolve(cwd, DETAIL_DATABASE_PATH), { readOnly });
  if (!readOnly) ensureAtlasDetailSchema(database);
  return database;
}

export function readAtlasState(database) {
  return {
    rawRegistries: readRawRegistries(database),
    runtime: readRegistrySnapshot(database),
    catalog: readCatalogSnapshot(database),
    curated: readCuratedItemSummaries(database),
    catalogEvidence: readCatalogEvidence(database),
    sourcePages: readSourcePages(database),
    taxonomy: readDocument(database, 'catalog-taxonomy'),
    accessRules: readDocument(database, 'catalog-access-rules') ?? {},
    kindOverrides: readDocument(database, 'catalog-kind-overrides') ?? {},
    gold: readDocument(database, 'catalog-gold-set'),
    classificationEvaluation: readDocument(database, 'catalog-classification-evaluation'),
    promotionReview: readDocument(database, 'catalog-promotion-review'),
    classificationOverlay: readClassificationOverlay(database),
  };
}

export function readClassificationOverlay(database) {
  const metadata = readDocument(database, 'catalog-classification-overlay');
  if (!metadata) return null;
  return { ...metadata, items: readClassifications(database) };
}

export function replaceClassificationOverlay(database, overlay) {
  const { items = [], ...metadata } = overlay ?? {};
  replaceClassifications(database, items);
  putDocument(database, 'catalog-classification-overlay', 'taxonomy-classification', metadata);
}

export {
  putClassificationBatch,
  putClassificationRun,
  putDocument,
  readCatalogEvidence,
  readCatalogSnapshot,
  readClassificationBatches,
  readClassificationRun,
  readClassificationRunItems,
  readClassifications,
  readCuratedItemSummaries,
  readDocument,
  readRawRegistries,
  readRegistrySnapshot,
  readSourcePages,
  replaceCatalogEvidence,
  replaceCatalogSnapshot,
  replaceClassifications,
  replaceCuratedAndRegistrySnapshot,
  replaceCuratedItemSummaries,
  replaceItemDetails,
  replaceRawRegistries,
  replaceRegistrySnapshot,
  replaceSourcePages,
  resetClassificationRun,
  upsertClassificationRunItems,
};

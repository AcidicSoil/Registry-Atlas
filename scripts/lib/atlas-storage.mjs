import {
  openAtlasCoreDatabase, transaction, exec, one, bulkInsert,
  putClassificationBatch, putClassificationRun, putDocument,
  readCatalogEvidence, readCatalogSnapshot, readClassificationBatches,
  readClassificationRun, readClassificationRunItems, readClassifications,
  readCuratedItemSummaries, readDocument, readRawRegistries, readRegistrySnapshot,
  readSourcePages, replaceCatalogEvidence, replaceCatalogSnapshot,
  replaceClassifications, replaceCuratedAndRegistrySnapshot,
  replaceCuratedItemSummaries, replaceItemDetails, replaceRawRegistries,
  replaceRegistrySnapshot, replaceSourcePages, resetClassificationRun,
  upsertClassificationRunItems
} from './atlas-postgres.mjs';

export { openAtlasCoreDatabase, transaction, exec, one, bulkInsert,
  putClassificationBatch, putClassificationRun, putDocument,
  readCatalogEvidence, readCatalogSnapshot, readClassificationBatches,
  readClassificationRun, readClassificationRunItems, readClassifications,
  readCuratedItemSummaries, readDocument, readRawRegistries, readRegistrySnapshot,
  readSourcePages, replaceCatalogEvidence, replaceCatalogSnapshot,
  replaceClassifications, replaceCuratedAndRegistrySnapshot,
  replaceCuratedItemSummaries, replaceItemDetails, replaceRawRegistries,
  replaceRegistrySnapshot, replaceSourcePages, resetClassificationRun,
  upsertClassificationRunItems
};

export async function readAtlasState(db) {
  const [rawRegistries,runtime,catalog,curated,catalogEvidence,sourcePages,taxonomy,
    accessRules,kindOverrides,gold,classificationEvaluation,promotionReview,classificationOverlay]
    = await Promise.all([
      readRawRegistries(db),readRegistrySnapshot(db),readCatalogSnapshot(db),
      readCuratedItemSummaries(db),readCatalogEvidence(db),readSourcePages(db),
      readDocument(db,'catalog-taxonomy'),readDocument(db,'catalog-access-rules'),
      readDocument(db,'catalog-kind-overrides'),readDocument(db,'catalog-gold-set'),
      readDocument(db,'catalog-classification-evaluation'),
      readDocument(db,'catalog-promotion-review'),readClassificationOverlay(db)
    ]);

  return {rawRegistries,runtime,catalog,curated,catalogEvidence,sourcePages,taxonomy,
    accessRules:accessRules??{},kindOverrides:kindOverrides??{},gold,
    classificationEvaluation,promotionReview,classificationOverlay};
}

export async function readClassificationOverlay(db) {
  const meta=await readDocument(db,'catalog-classification-overlay');

  return meta?{...meta,items:await readClassifications(db)}:null;
}

export async function replaceClassificationOverlay(db,overlay) {
  const {items=[],...meta}=overlay??{};
  await transaction(db,async tx=>{
    await replaceClassifications(tx,items);
    await putDocument(tx,'catalog-classification-overlay','taxonomy-classification',meta);
  });
}

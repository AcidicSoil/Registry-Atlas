import { exec, putDocument, readDocument } from "./atlas-postgres.mjs";

const AUDIT_NAME = "catalog-retired-classification-approvals";

const AUDIT_SCHEMA = "registry-atlas.catalog-approval-retirement.v1";

/** Delete retired approvals inside the caller's catalog-sync transaction. */
export async function persistRetiredCatalogApprovals(tx, retired, evidence = {}) {
  if (retired.length === 0) return 0;

  const previous = await readDocument(tx, AUDIT_NAME);

  if (previous && (previous.schema !== AUDIT_SCHEMA || !Array.isArray(previous.entries))) {
    throw new Error("Existing classification retirement audit is invalid");
  }

  const history = previous?.entries ?? [];
  const at = new Date().toISOString();

  const entries = retired.map((review) => ({
    namespace: review.namespace,
    name: review.name,
    inputFingerprint: review.inputFingerprint,
    approvedCanonicalPrimary: review.canonical.primary,
    retiredAt: at,
    sourceCatalogUrl: evidence[review.namespace]?.catalog_url ?? null,
  }));

  // The audit is not a fallback catalog or a source of live classifications.
  await putDocument(tx, AUDIT_NAME, "classification-retirement", {
    schema: AUDIT_SCHEMA,
    entries: [...history, ...entries],
  });

  for (const review of retired) {
    const deleted = await exec(
      tx,
      "DELETE FROM atlas.atlas_classifications WHERE namespace=$1 AND name=$2 RETURNING name",
      [review.namespace, review.name],
    );

    if (deleted.length !== 1) throw new Error("Reviewed classification changed during retirement");
  }

  return retired.length;
}

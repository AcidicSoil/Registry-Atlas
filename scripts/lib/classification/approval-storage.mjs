import { exec, putDocument, readDocument } from "../atlas-postgres.mjs";

const RETIREMENT_AUDIT = {
  name: "catalog-retired-classification-approvals",
  schema: "registry-atlas.catalog-approval-retirement.v1",
  kind: "classification-retirement",
};

const REVALIDATION_AUDIT = {
  name: "catalog-revalidated-classification-approvals",
  schema: "registry-atlas.catalog-approval-revalidation.v1",
  kind: "classification-revalidation",
};

async function appendAudit(tx, config, entries) {
  const previous = await readDocument(tx, config.name);

  if (previous && (previous.schema !== config.schema || !Array.isArray(previous.entries))) {
    throw new Error(`Invalid existing approval audit: ${config.name}`);
  }

  await putDocument(tx, config.name, config.kind, {
    schema: config.schema,
    entries: [...(previous?.entries ?? []), ...entries],
  });
}

/** Record and remove obsolete approvals atomically with the source update. */
export async function persistRetiredCatalogApprovals(tx, retired, evidence = {}) {
  if (retired.length === 0) return 0;

  const at = new Date().toISOString();

  const entries = retired.map((review) => ({
    namespace: review.namespace,
    name: review.name,
    inputFingerprint: review.inputFingerprint,
    approvedCanonicalPrimary: review.canonical.primary,
    retiredAt: at,
    reason: review.retirementReason ?? "absent-from-current-index",
    sourceCatalogUrl: evidence[review.namespace]?.catalog_url ?? null,
    itemSourceUrl: review.currentSourceUrl ?? null,
  }));

  await appendAudit(tx, RETIREMENT_AUDIT, entries);

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

/** Revalidate independently reproduced decisions without claiming new human approval. */
export async function persistRevalidatedCatalogApprovals(tx, revalidated) {
  if (revalidated.length === 0) return 0;

  const at = new Date().toISOString();

  const entries = revalidated.map(({ review, oldFingerprint, method, sourceUrl }) => ({
    namespace: review.namespace,
    name: review.name,
    oldFingerprint,
    newFingerprint: review.inputFingerprint,
    verifiedCanonicalPrimary: review.canonical.primary,
    method,
    sourceUrl,
    revalidatedAt: at,
  }));

  await appendAudit(tx, REVALIDATION_AUDIT, entries);

  for (const { review, oldFingerprint } of revalidated) {
    const updated = await exec(
      tx,
      "UPDATE atlas.atlas_classifications SET payload_json=$3 WHERE namespace=$1 AND name=$2 AND (payload_json::jsonb)->>'inputFingerprint'=$4 RETURNING name",
      [review.namespace, review.name, JSON.stringify(review), oldFingerprint],
    );

    if (updated.length !== 1)
      throw new Error("Reviewed classification changed during revalidation");
  }

  return revalidated.length;
}

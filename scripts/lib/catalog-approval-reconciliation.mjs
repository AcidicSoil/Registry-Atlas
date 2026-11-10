import { currentCatalogClassificationEvidence } from "./catalog-classification-overlay.mjs";
import { isInputString } from "./input-guards.mjs";
import {
  findDeterministicAliasClassification,
  findDeterministicKindClassification,
} from "./catalog-classifier.mjs";

const identity = (value) => value.trim().toLowerCase();

/** Targeted fetches replace only refreshed namespaces, never the untouched catalog. */
export function mergeRefreshedCatalog(previous, refreshed) {
  return { ...previous, ...refreshed };
}

function currentByIdentity(catalog, verifiedNamespaces) {
  const byNamespace = new Map();

  for (const namespace of verifiedNamespaces) {
    const items = catalog[namespace];

    if (!Array.isArray(items) || !items.length)
      throw new Error(`Verified source catalog missing or empty: ${namespace}`);

    const records = new Map();

    for (const item of items) {
      if (!isInputString(item?.name) || !item.name.trim())
        throw new Error(`Invalid current source catalog identity: ${namespace}`);

      const key = identity(item.name);

      if (records.has(key))
        throw new Error(`Duplicate current source identity: ${namespace}/${item.name}`);

      records.set(key, item);
    }

    byNamespace.set(identity(namespace), records);
  }

  return byNamespace;
}

function retire(review, reason, source = null) {
  return { ...review, retirementReason: reason, currentSourceUrl: source?.rawItemUrl ?? null };
}

/** Reconcile active approvals against verified current sources, without inferring approvals. */
export function planCatalogApprovalReconciliation({
  catalog,
  reviews,
  taxonomy,
  verifiedNamespaces = [],
  absentNamespaces = [],
}) {
  const current = currentByIdentity(catalog, verifiedNamespaces);
  const absent = new Set(absentNamespaces.map(identity));
  const active = [];
  const retired = [];
  const revalidated = [];
  let retained = 0;

  for (const review of reviews) {
    const namespace = identity(review.namespace);

    if (absent.has(namespace)) {
      retired.push(retire(review, "absent-from-current-directory"));
      continue;
    }

    const records = current.get(namespace);

    if (!records) {
      active.push(review);
      retained += 1;
      continue;
    }

    const raw = records.get(identity(review.name));

    if (!raw) {
      retired.push(retire(review, "absent-from-current-index"));
      continue;
    }

    const evidence = currentCatalogClassificationEvidence(review.namespace, raw, review);

    if (evidence.fingerprint === review.inputFingerprint) {
      active.push(review);
      retained += 1;
      continue;
    }

    const resolved =
      findDeterministicKindClassification(evidence.state, taxonomy) ??
      findDeterministicAliasClassification(evidence.state, taxonomy);

    if (
      resolved?.primary === review.canonical.primary &&
      JSON.stringify(resolved.path) === JSON.stringify(review.canonical.path)
    ) {
      const updated = { ...review, inputFingerprint: evidence.fingerprint };

      active.push(updated);
      revalidated.push({
        review: updated,
        oldFingerprint: review.inputFingerprint,
        method: resolved.method,
        sourceUrl: raw.rawItemUrl ?? null,
      });
      continue;
    }

    retired.push(retire(review, "changed-input-unverified", raw));
  }

  return {
    active,
    retired,
    revalidated,
    summary: { retained, revalidated: revalidated.length, retired: retired.length },
  };
}

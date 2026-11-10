import { describe, expect, it } from "vitest";
import { readRepositoryDocument } from "./testAtlasDatabase";
// @ts-ignore Standalone Node catalog planner.
import {
  mergeRefreshedCatalog,
  planCatalogApprovalReconciliation,
  // @ts-ignore Standalone Node catalog planner.
} from "../../scripts/lib/classification/reconciliation.mjs";
// @ts-ignore Standalone Node classifier.
import { buildCatalogClassificationState } from "../../scripts/lib/classification/state.mjs";
// @ts-ignore Standalone Node classifier.
import { catalogClassificationInputFingerprint } from "../../scripts/lib/classification/classifier.mjs";

const taxonomy = readRepositoryDocument("catalog-taxonomy");

const primary = "controls/button";

const path = ["controls", "controls/button"];

function reviewed(name: string, title: string, namespace = "@example") {
  const state = buildCatalogClassificationState({
    namespace,
    item: { name, title, kind: "component" },
  });

  return {
    namespace,
    name,
    kind: "component",
    canonical: { primary, path },
    inputFingerprint: catalogClassificationInputFingerprint(state),
  };
}

describe("reviewed classification queue reconciliation", () => {
  it("preserves untouched namespace snapshots during targeted fetches", () => {
    const result = mergeRefreshedCatalog(
      { "@a": [{ name: "old" }], "@b": [{ name: "preserved" }] },
      { "@a": [{ name: "new" }] },
    );

    expect(result).toEqual({
      "@a": [{ name: "new" }],
      "@b": [{ name: "preserved" }],
    });
  });

  it("revalidates only independently matching deterministic classifications", () => {
    const prior = reviewed("button", "Old button label");

    const result = planCatalogApprovalReconciliation({
      catalog: { "@example": [{ name: "button", title: "Button" }] },
      reviews: [prior],
      taxonomy,
      verifiedNamespaces: ["@example"],
    });

    expect(result.summary).toEqual({ retained: 0, revalidated: 1, retired: 0 });
    expect(result.revalidated[0].review.inputFingerprint).not.toBe(prior.inputFingerprint);
    expect(result.revalidated[0].review.canonical).toEqual(prior.canonical);
    expect(result.revalidated[0].method).toBe("deterministic-alias");
  });

  it("retires unproven changes without forging a new approval", () => {
    const prior = reviewed("uncertain-widget", "Button");

    const result = planCatalogApprovalReconciliation({
      catalog: { "@example": [{ name: "uncertain-widget", title: "Unknown widget" }] },
      reviews: [prior],
      taxonomy,
      verifiedNamespaces: ["@example"],
    });

    expect(result.summary).toEqual({ retained: 0, revalidated: 0, retired: 1 });
    expect(result.retired[0].retirementReason).toBe("changed-input-unverified");
    expect(result.active).toEqual([]);
  });

  it("retires absent identities from verified indexes", () => {
    const result = planCatalogApprovalReconciliation({
      catalog: { "@example": [{ name: "other", title: "Other" }] },
      reviews: [reviewed("old-button", "Button")],
      taxonomy,
      verifiedNamespaces: ["@example"],
    });

    expect(result.retired[0].retirementReason).toBe("absent-from-current-index");
  });

  it("retires absent registry namespaces from the authoritative directory", () => {
    const result = planCatalogApprovalReconciliation({
      catalog: {},
      reviews: [reviewed("old-button", "Button", "@no-registry")],
      taxonomy,
      absentNamespaces: ["@no-registry"],
    });

    expect(result.retired[0].retirementReason).toBe("absent-from-current-directory");
  });

  it("leaves unverified namespaces untouched after source failures", () => {
    const prior = reviewed("button", "Old button label");

    const result = planCatalogApprovalReconciliation({
      catalog: { "@example": [{ name: "button", title: "Button" }] },
      reviews: [prior],
      taxonomy,
    });

    expect(result.active).toEqual([prior]);
    expect(result.summary).toEqual({ retained: 1, revalidated: 0, retired: 0 });
  });

  it("rejects ambiguous current identities", () => {
    expect(() =>
      planCatalogApprovalReconciliation({
        catalog: { "@example": [{ name: "button" }, { name: "button" }] },
        reviews: [reviewed("button", "Button")],
        taxonomy,
        verifiedNamespaces: ["@example"],
      }),
    ).toThrow(/duplicate/i);
  });
});

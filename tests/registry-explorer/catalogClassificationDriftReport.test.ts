import { describe, expect, it } from "vitest";
// @ts-ignore Standalone Node ESM audit module.
import { catalogClassificationDriftReport } from "../../scripts/audits/report-classification-drift.mjs";
// @ts-ignore Standalone Node ESM state module.
import { buildCatalogClassificationState } from "../../scripts/lib/classification/state.mjs";
// @ts-ignore Standalone Node ESM classifier module.
import { catalogClassificationInputFingerprint } from "../../scripts/lib/classification/classifier.mjs";

function fingerprint(name: string, title: string) {
  return catalogClassificationInputFingerprint(
    buildCatalogClassificationState({
      namespace: "@demo",
      item: { name, title, kind: "block" },
    }),
  );
}

describe("classification drift review report", () => {
  it("reports changed source inputs and absent reviewed identities without approving them", () => {
    const overlay = [
      {
        namespace: "@demo",
        name: "unchanged",
        kind: "block",
        canonical: { primary: "application/form", path: ["application", "application/form"] },
        inputFingerprint: fingerprint("unchanged", "Same"),
      },
      {
        namespace: "@demo",
        name: "updated",
        kind: "block",
        canonical: { primary: "application/form", path: ["application", "application/form"] },
        inputFingerprint: fingerprint("updated", "Old"),
      },
      {
        namespace: "@demo",
        name: "removed",
        kind: "block",
        canonical: { primary: "application/form", path: ["application", "application/form"] },
        inputFingerprint: fingerprint("removed", "Gone"),
      },
    ];

    const report = catalogClassificationDriftReport(
      {
        "@demo": [
          { name: "unchanged", title: "Same" },
          { name: "updated", title: "New", rawItemUrl: "https://example.com/updated.json" },
        ],
      },
      overlay,
    );

    expect(report.summary).toEqual({ reviewed: 3, matched: 1, stale: 1, missing: 1 });
    expect(report.stale).toEqual([
      expect.objectContaining({
        namespace: "@demo",
        name: "updated",
        approvedCanonicalPrimary: "application/form",
        currentTitle: "New",
        sourceUrl: "https://example.com/updated.json",
        reviewedFingerprint: fingerprint("updated", "Old"),
        currentFingerprint: fingerprint("updated", "New"),
      }),
    ]);
    expect(report.missing).toEqual([
      expect.objectContaining({
        namespace: "@demo",
        name: "removed",
        approvedCanonicalPrimary: "application/form",
      }),
    ]);
    expect(overlay[1].inputFingerprint).toBe(fingerprint("updated", "Old"));
  });

  it("accepts any current duplicate variant matching the reviewed fingerprint", () => {
    const items = [
      {
        namespace: "@demo",
        name: "button",
        kind: "block",
        inputFingerprint: fingerprint("button", "Verified"),
        canonical: { primary: null },
      },
    ];

    const report = catalogClassificationDriftReport(
      {
        "@demo": [
          { name: "button", title: "Changed" },
          { name: "button", title: "Verified" },
        ],
      },
      items,
    );

    expect(report.summary).toEqual({ reviewed: 1, matched: 1, stale: 0, missing: 0 });
    expect(report.stale).toEqual([]);
  });
});

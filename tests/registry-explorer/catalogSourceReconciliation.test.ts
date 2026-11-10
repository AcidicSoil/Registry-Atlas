import { describe, expect, it } from "vitest";
// @ts-ignore Standalone Node ESM audit module.
import { assertCurrentCatalogMatches } from "../../scripts/audits/reconcile-catalog-approvals.mjs";

describe("source-authoritative approval retirement", () => {
  it("accepts equal item identities regardless of catalog order", () => {
    expect(
      assertCurrentCatalogMatches(
        "@example",
        [{ name: "button", title: "Earlier title" }, { name: "dialog" }],
        [{ name: "dialog" }, { name: "button", title: "New title" }],
      ),
    ).toBe(2);
  });

  it("rejects a changed upstream set until the canonical catalog is refreshed", () => {
    expect(() =>
      assertCurrentCatalogMatches(
        "@example",
        [{ name: "old-version" }],
        [{ name: "current-version" }],
      ),
    ).toThrow(/catalog differs/i);
  });

  it("rejects an empty or duplicated upstream index", () => {
    expect(() => assertCurrentCatalogMatches("@example", [{ name: "button" }], [])).toThrow(
      /empty/i,
    );
    expect(() =>
      assertCurrentCatalogMatches(
        "@example",
        [{ name: "button" }],
        [{ name: "button" }, { name: "button" }],
      ),
    ).toThrow(/duplicate/i);
  });
});

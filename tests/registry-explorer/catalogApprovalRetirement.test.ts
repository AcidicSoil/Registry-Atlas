import { describe, expect, it } from "vitest";
// @ts-ignore Node ESM domain module.
import { retireMissingCatalogApprovals } from "../../scripts/lib/catalog-classification-overlay.mjs";
// @ts-ignore Standalone Node PostgreSQL storage adapter.
import {
  persistRetiredCatalogApprovals,
  persistRevalidatedCatalogApprovals,
  // @ts-ignore Standalone Node PostgreSQL storage adapter.
} from "../../scripts/lib/catalog-approval-storage.mjs";
import {
  readClassifications,
  replaceClassifications,
  readDocument,
  transaction,
  // @ts-ignore Standalone Node PostgreSQL storage adapter.
} from "../../scripts/lib/atlas-postgres.mjs";
import { testRouteDatabase } from "./postgresFixture";

function approved(namespace: string, name: string) {
  return {
    namespace,
    name,
    inputFingerprint: "sha256:" + "a".repeat(64),
    kind: "component",
    canonical: { primary: "navigation/tabs" },
  };
}

describe("current catalog approval reconciliation", () => {
  it("retires superseded identities only after that namespace fetched successfully", () => {
    const old = approved("@animate-ui", "components-animate-tabs");
    const active = approved("@animate-ui", "backgrounds-bubble");
    const unrelated = approved("@other", "button");

    const result = retireMissingCatalogApprovals(
      { "@animate-ui": [{ name: "backgrounds-bubble" }], "@other": [{ name: "button" }] },
      [old, active, unrelated],
      ["@animate-ui"],
    );

    expect(result.active).toEqual([active, unrelated]);
    expect(result.retired).toEqual([old]);
  });

  it("never retires approvals after a failed source refresh", () => {
    const old = approved("@animate-ui", "components-animate-tabs");

    const result = retireMissingCatalogApprovals(
      { "@animate-ui": [{ name: "backgrounds-bubble" }] },
      [old],
      [],
    );

    expect(result.active).toEqual([old]);
    expect(result.retired).toEqual([]);
  });

  it("does not retire changed-but-present classifications", () => {
    const stale = approved("@example", "button");

    const result = retireMissingCatalogApprovals(
      { "@example": [{ name: "button", title: "Different" }] },
      [stale],
      ["@example"],
    );

    expect(result.active).toEqual([stale]);
    expect(result.retired).toEqual([]);
  });

  it("refuses to retire everything from an empty or malformed catalog", () => {
    const old = approved("@example", "button");
    expect(() => retireMissingCatalogApprovals({ "@example": [] }, [old], ["@example"])).toThrow(
      /empty/i,
    );
    expect(() => retireMissingCatalogApprovals({}, [old], ["@example"])).toThrow(/missing/i);
  });

  it("removes only retired rows and stores audit records atomically", async () => {
    const db = await testRouteDatabase();
    const old = approved("@animate-ui", "components-animate-tabs");
    const active = approved("@animate-ui", "backgrounds-bubble");

    try {
      await replaceClassifications(db, [old, active]);
      await transaction(db, async (tx: any) => {
        await persistRetiredCatalogApprovals(tx, [old], {
          "@animate-ui": { catalog_url: "https://animate-ui.com/r/registry.json" },
        });
      });
      expect(await readClassifications(db)).toEqual([active]);
      const audit = await readDocument(db, "catalog-retired-classification-approvals");

      expect(audit.entries).toEqual([
        expect.objectContaining({
          namespace: "@animate-ui",
          name: "components-animate-tabs",
          sourceCatalogUrl: "https://animate-ui.com/r/registry.json",
        }),
      ]);
    } finally {
      await db.close();
    }
  });

  it("rolls back deletions and audit when publication fails", async () => {
    const db = await testRouteDatabase();
    const old = approved("@animate-ui", "components-animate-tabs");

    try {
      await replaceClassifications(db, [old]);
      await expect(
        transaction(db, async (tx: any) => {
          await persistRetiredCatalogApprovals(tx, [old]);
          throw new Error("publication interrupted");
        }),
      ).rejects.toThrow("publication interrupted");

      expect(await readClassifications(db)).toEqual([old]);
      expect(await readDocument(db, "catalog-retired-classification-approvals")).toBeNull();
    } finally {
      await db.close();
    }
  });

  it("rejects a stale retirement request after the row disappeared", async () => {
    const db = await testRouteDatabase();

    try {
      const old = approved("@animate-ui", "components-animate-tabs");

      await expect(
        transaction(db, async (tx: any) => {
          await persistRetiredCatalogApprovals(tx, [old]);
        }),
      ).rejects.toThrow(/changed during retirement/i);

      expect(await readDocument(db, "catalog-retired-classification-approvals")).toBeNull();
    } finally {
      await db.close();
    }
  });

  it("revalidates one fingerprint with provenance and no changed category", async () => {
    const db = await testRouteDatabase();
    const prior = approved("@example", "button");
    const changed = { ...prior, inputFingerprint: "sha256:" + "b".repeat(64) };

    try {
      await replaceClassifications(db, [prior]);
      await transaction(db, async (tx: any) => {
        await persistRevalidatedCatalogApprovals(tx, [
          {
            review: changed,
            oldFingerprint: prior.inputFingerprint,
            method: "deterministic-alias",
            sourceUrl: "https://example.com/r/button.json",
          },
        ]);
      });

      expect(await readClassifications(db)).toEqual([changed]);
      const audit = await readDocument(db, "catalog-revalidated-classification-approvals");

      expect(audit.entries).toEqual([
        expect.objectContaining({
          namespace: "@example",
          name: "button",
          oldFingerprint: prior.inputFingerprint,
          newFingerprint: changed.inputFingerprint,
          verifiedCanonicalPrimary: "navigation/tabs",
          method: "deterministic-alias",
        }),
      ]);
    } finally {
      await db.close();
    }
  });

  it("rejects a stale revalidation and rolls back its audit", async () => {
    const db = await testRouteDatabase();
    const prior = approved("@example", "button");

    try {
      await replaceClassifications(db, [prior]);

      await expect(
        transaction(db, async (tx: any) => {
          await persistRevalidatedCatalogApprovals(tx, [
            {
              review: { ...prior, inputFingerprint: "sha256:" + "b".repeat(64) },
              oldFingerprint: "sha256:" + "c".repeat(64),
              method: "deterministic-alias",
            },
          ]);
        }),
      ).rejects.toThrow(/changed during revalidation/i);

      expect(await readClassifications(db)).toEqual([prior]);
      expect(await readDocument(db, "catalog-revalidated-classification-approvals")).toBeNull();
    } finally {
      await db.close();
    }
  });

  it("cannot silently reintroduce retired approvals on a later sync", () => {
    const old = approved("@animate-ui", "components-animate-tabs");
    const current = { "@animate-ui": [{ name: "backgrounds-bubble" }] };
    const first = retireMissingCatalogApprovals(current, [old], ["@animate-ui"]);
    const second = retireMissingCatalogApprovals(current, first.active, ["@animate-ui"]);
    expect(second).toEqual({ active: [], retired: [] });
  });
});

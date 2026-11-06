import { describe, expect, it } from "vitest";
import { testRouteDatabase } from "./postgresFixture";
// @ts-expect-error Recovery CLI is a standalone authored ESM module.
import { reconcileSourceEvidence } from "../../scripts/reconcile-runtime-source-evidence.mjs";
// @ts-ignore Authored PostgreSQL storage JavaScript module.
import { putDocument, readDocument, readSourcePages, replaceSourcePages } from "../../scripts/lib/atlas-storage.mjs";

const recovered = {
  "@demo/button": { url: "https://demo.test/components/button", level: "reviewed" },
  "@demo/card": { url: "https://demo.test/components/card", level: "sitemap" },
};
const documents = { "source-page-index-meta": { version: 2 } };

describe("source evidence recovery", () => {
  it("rejects an entire apply when existing PostgreSQL evidence conflicts", async () => {
    const db = await testRouteDatabase();
    try {
      await replaceSourcePages(db, {
        "@demo/button": { url: "https://demo.test/newer", level: "reviewed" },
      });
      await putDocument(db, "source-page-index-meta", "source-evidence", { version: 3 });

      const dryRun = await reconcileSourceEvidence(db, recovered, documents, false);
      expect(dryRun).toMatchObject({
        missingSourcePages: 1,
        conflictingSourcePages: ["@demo/button"],
        conflictingDocuments: ["source-page-index-meta"],
        mode: "dry-run",
      });
      await expect(reconcileSourceEvidence(db, recovered, documents, true)).rejects.toThrow(
        "Conflicting PostgreSQL evidence",
      );
      expect(await readSourcePages(db)).toEqual({
        "@demo/button": { url: "https://demo.test/newer", level: "reviewed" },
      });
      expect(await readDocument(db, "source-page-index-meta")).toEqual({ version: 3 });
    } finally {
      await db.close();
    }
  });

  it("restores only missing records and is idempotent", async () => {
    const db = await testRouteDatabase();
    try {
      await replaceSourcePages(db, { "@demo/button": recovered["@demo/button"] });
      const first = await reconcileSourceEvidence(db, recovered, documents, true);
      expect(first).toMatchObject({
        missingSourcePages: 1,
        missingDocuments: ["source-page-index-meta"],
        conflictingSourcePages: [],
        conflictingDocuments: [],
        mode: "apply",
      });
      expect(await readSourcePages(db)).toEqual(recovered);
      expect(await readDocument(db, "source-page-index-meta")).toEqual({ version: 2 });
      const second = await reconcileSourceEvidence(db, recovered, documents, true);
      expect(second.missingSourcePages).toBe(0);
      expect(second.missingDocuments).toEqual([]);
    } finally {
      await db.close();
    }
  });
});

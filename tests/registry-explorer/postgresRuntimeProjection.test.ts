import { describe, expect, it } from "vitest";
// @ts-ignore Standalone ESM builder exports pure projection utilities.
import { projectRuntimePayloads, readRuntimePayloads } from "../../scripts/build-runtime-data.mjs";

describe("PostgreSQL static runtime projection", () => {
  it("reads all runtime tables under one read-only repeatable-read transaction", async () => {
    const answers = [
      [{ catalog: 1, details: 1 }],
      [
        { key: "registry_snapshot_meta", value: JSON.stringify({ registry_count: 1 }) },
        {
          key: "catalog_snapshot_meta",
          value: JSON.stringify({ registry_count: 1, item_count: 1 }),
        },
      ],
      [{ payload_json: JSON.stringify({ official: { name: "@demo" } }) }],
      [{ namespace: "@demo" }],
      [{ namespace: "@demo", payload_json: JSON.stringify({ name: "button" }) }],
      [],
      [],
      [],
      [],
      [{ namespace: "@demo", name: "button", payload_json: JSON.stringify({ name: "button" }) }],
    ];

    let queryIndex = 0;
    let finished = false;

    const client = {
      unsafe: async (): Promise<never> => {
        throw new Error("query outside snapshot transaction");
      },
      begin: async <T>(
        mode: string,
        callback: (tx: {
          unsafe: (query: string) => Promise<(typeof answers)[number]>;
        }) => Promise<T>,
      ) => {
        expect(mode.toLowerCase()).toContain("repeatable read");
        expect(mode.toLowerCase()).toContain("read only");

        const result = await callback({
          unsafe: async (_query: string) => answers[queryIndex++] ?? [],
        });

        finished = true;

        return result;
      },
    };

    const result = await readRuntimePayloads(client);
    expect(finished).toBe(true);
    expect(queryIndex).toBe(answers.length);
    expect(result.payloads.core.catalog.meta.item_count).toBe(1);
    expect(result.payloads.details["@demo/button"]).toEqual({ name: "button" });
  });

  it("preserves distinct catalog and detail identities without exposing database credentials", () => {
    const out = projectRuntimePayloads({
      registryMeta: JSON.stringify({ registry_count: 1 }),
      registryRows: [{ payload_json: JSON.stringify({ official: { name: "@demo" } }) }],
      catalogMeta: JSON.stringify({ registry_count: 2, item_count: 1 }),
      namespaceRows: [{ namespace: "@demo" }, { namespace: "@empty" }],
      catalogRows: [
        {
          namespace: "@demo",
          payload_json: JSON.stringify({ name: "button", type: "registry:ui" }),
        },
      ],
      documents: [
        { name: "catalog-taxonomy", payload_json: JSON.stringify({ version: "v1", roots: [] }) },
        { name: "catalog-kind-overrides", payload_json: "{}" },
        {
          name: "source-page-index-meta",
          payload_json: JSON.stringify({
            schema: "source-pages/v1",
            coverage: {
              distinctIndexed: 2,
              published: 1,
              reviewed: 0,
              sitemap: 1,
              pattern: 0,
              missing: 1,
            },
          }),
        },
      ],
      sourcePages: [
        {
          namespace: "@demo",
          slug: "icon",
          payload_json: JSON.stringify({
            url: "https://demo.test/docs/icon#icon",
            level: "observed",
            source: "documented-anchor",
          }),
        },
        {
          namespace: "@demo",
          slug: "button",
          payload_json: JSON.stringify({ url: "https://demo.test/components/button" }),
        },
      ],
      routes: [
        {
          namespace: "@demo",
          slug: "button",
          source_url: "https://demo.test/components/button",
          status: "verified",
        },
      ],
      patterns: [
        {
          namespace: "@demo",
          template: "https://demo.test/{name}",
          prefix: "",
          source: "verified",
          checked_at: null,
        },
      ],
      details: [
        {
          namespace: "@demo",
          name: "button",
          payload_json: JSON.stringify({ name: "button", dependencies: ["react"] }),
        },
      ],
    });

    expect(out.core.sourcePageManifest.coverage).toMatchObject({
      distinctIndexed: 2,
      published: 2,
      observed: 1,
      missing: 0,
    });
    expect(out.core.catalog.registries["@demo"]).toEqual([{ name: "button", type: "registry:ui" }]);
    expect(out.core.catalog.registries["@empty"]).toEqual([]);
    expect(out.core.sourcePageManifest.pages["@demo/button"].url).toBe(
      "https://demo.test/components/button",
    );
    expect(out.details["@demo/button"]).toEqual({ name: "button", dependencies: ["react"] });
    expect(JSON.stringify(out)).not.toContain("DATABASE_URL");
  });
});

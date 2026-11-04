import { describe, expect, it } from "vitest";
// @ts-ignore Standalone ESM builder exports pure projection utilities.
import { projectRuntimePayloads } from "../../scripts/build-runtime-data.mjs";

describe("PostgreSQL static runtime projection", () => {
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

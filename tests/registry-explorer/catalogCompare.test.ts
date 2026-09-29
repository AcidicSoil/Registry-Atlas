import { describe, expect, it } from "vitest";
import { buildCatalogComparison } from "../../src/registry-explorer/core/catalogCompare";
import type { Registry, RegistryCatalogIndex } from "../../src/registry-explorer/core/registry.schema";

function registry(name: string): Registry {
  return {
    name,
    url: "https://example.test",
    description: name,
    primary_focus: ["ai-chat"],
    component_tags: ["chatbot", "button"],
    atlas: {
      aliases: [],
      coverageStatus: "inferred",
      confidence: "medium",
      notes: "",
      catalogStatus: "available",
      comparisonEvidence: "catalog",
    },
    itemSummaries: [],
  };
}

function index(registries: RegistryCatalogIndex["registries"]): RegistryCatalogIndex {
  return {
    meta: {
      registry_count: Object.keys(registries).length,
      item_count: Object.values(registries).reduce((sum, items) => sum + items.length, 0),
    },
    registries,
  };
}

describe("buildCatalogComparison", () => {
  it("builds union/intersection rows from real item identities only", () => {
    const result = buildCatalogComparison(
      [registry("@a"), registry("@b")],
      index({
        "@a": [
          { name: "button", type: "registry:ui" },
          { name: "card", type: "registry:ui" },
        ],
        "@b": [
          { name: "button", type: "registry:ui" },
          { name: "dialog", type: "registry:ui" },
        ],
      }),
      ["@a", "@b"],
    );

    expect(result.unionCount).toBe(3);
    expect(result.intersectionCount).toBe(1);
    expect(result.rows.map(row => [row.slug, row.presentIn])).toEqual([
      ["button", ["@a", "@b"]],
      ["card", ["@a"]],
      ["dialog", ["@b"]],
    ]);
  });

  it("does not infer a row from registry component tags", () => {
    const result = buildCatalogComparison(
      [registry("@a"), registry("@b")],
      index({ "@a": [], "@b": [] }),
      ["@a", "@b"],
    );

    expect(result.unionCount).toBe(0);
    expect(result.rows).toEqual([]);
  });

  it("preserves nested component slugs and detail paths in present cells", () => {
    const result = buildCatalogComparison(
      [registry("@a"), registry("@b")],
      index({
        "@a": [{ name: "eve/browser-agent", type: "registry:component" }],
        "@b": [],
      }),
      ["@a", "@b"],
    );

    expect(result.rows[0]?.slug).toBe("eve/browser-agent");
    expect(result.rows[0]?.cells[0]).toMatchObject({
      namespace: "@a",
      present: true,
      routePath: "/Registry-Atlas/@a/components/eve/browser-agent",
    });
    expect(result.rows[0]?.cells[1]).toMatchObject({
      namespace: "@b",
      present: false,
    });
  });

  it("searches and paginates the real union", () => {
    const items = Array.from({ length: 70 }, (_, i) => ({
      name: `item-${String(i).padStart(2, "0")}`,
      type: "registry:component",
    }));
    const catalog = index({ "@a": items, "@b": items.slice(20) });
    const registries = [registry("@a"), registry("@b")];

    const page = buildCatalogComparison(registries, catalog, ["@a", "@b"], { page: 3, pageSize: 20 });
    expect(page.total).toBe(70);
    expect(page.rows[0]?.slug).toBe("item-40");

    const searched = buildCatalogComparison(registries, catalog, ["@a", "@b"], { search: "item-69" });
    expect(searched.rows.map(row => row.slug)).toEqual(["item-69"]);
  });
});

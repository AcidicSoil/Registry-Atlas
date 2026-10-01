import { describe, expect, it } from "vitest";
import {
  buildCatalogFacetSummary,
  queryCatalogComponents,
} from "../../src/registry-explorer/core/catalogQuery";
import type {
  Registry,
  RegistryCatalogIndex,
  RegistryItemSummary,
} from "../../src/registry-explorer/core/registry.schema";

function registry(name: string, itemSummaries: RegistryItemSummary[] = []): Registry {
  return {
    name,
    url: `https://example.test/${name.slice(1)}`,
    description: name === "@empty" ? "Chat components and aliases live here." : `${name} registry`,
    atlas: {
      aliases: name === "@empty" ? ["chat-kit"] : [],
      coverageStatus: "verified",
      confidence: "high",
      notes: "",
      catalogStatus: "available",
      comparisonEvidence: "catalog",
    },
    mirror: {
      officialName: name,
      registryUrlTemplate: `https://example.test/r/{name}.json`,
      sourceUrl: "https://example.test/registries.json",
      syncedAt: "2026-09-28T00:00:00.000Z",
      upstreamCount: 3,
      localCount: 3,
      warnings: [],
    },
    itemSummaries,
  };
}

function index(registries: RegistryCatalogIndex["registries"]): RegistryCatalogIndex {
  return {
    meta: {
      generated_at: "2026-09-28T00:00:00.000Z",
      registry_count: Object.keys(registries).length,
      item_count: Object.values(registries).reduce((count, items) => count + items.length, 0),
    },
    registries,
  };
}

describe("queryCatalogComponents", () => {
  it("browses real compact-index items with no search term", () => {
    const result = queryCatalogComponents(
      [registry("@alpha"), registry("@beta")],
      index({
        "@alpha": [
          { name: "button", type: "registry:ui" },
          { name: "card", type: "registry:component" },
        ],
        "@beta": [{ name: "contact-form", title: "Contact Form", type: "registry:block", categories: ["forms"] }],
      }),
      { pageSize: 10 },
    );

    expect(result.total).toBe(3);
    expect(result.items.map(item => item.id)).toEqual([
      "@alpha:button",
      "@alpha:card",
      "@beta:contact-form",
    ]);
    expect(result.page).toBe(1);
    expect(result.pageCount).toBe(1);
  });

  it("never turns registry metadata into a component result", () => {
    const result = queryCatalogComponents(
      [registry("@empty")],
      index({}),
      { search: "chat", pageSize: 10 },
    );

    expect(result.total).toBe(0);
    expect(result.items).toEqual([]);
  });

  it("overlays reviewed metadata only when the same real catalog item exists", () => {
    const reviewedButton: RegistryItemSummary = {
      name: "Reviewed Button",
      slug: "button",
      description: "Human-reviewed detail",
      source: "reviewed",
      provenance: "review fixture",
      catalogStatus: "available",
      confidence: "high",
      routeEligible: true,
    };
    const orphan: RegistryItemSummary = {
      name: "Orphan",
      slug: "not-in-index",
      source: "reviewed",
      provenance: "review fixture",
      catalogStatus: "available",
      routeEligible: true,
    };

    const result = queryCatalogComponents(
      [registry("@alpha", [reviewedButton, orphan])],
      index({ "@alpha": [{ name: "button", title: "Button", type: "registry:ui" }] }),
      { pageSize: 10 },
    );

    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      id: "@alpha:button",
      slug: "button",
      displayName: "Button",
      description: "Human-reviewed detail",
      reviewed: true,
    });
  });

  it("searches only concrete item fields and registry identity", () => {
    const registries = [registry("@alpha"), registry("@beta")];
    const catalog = index({
      "@alpha": [{ name: "button", type: "registry:ui", categories: ["controls"] }],
      "@beta": [{ name: "contact-form", title: "Contact Form", type: "registry:block", categories: ["forms"] }],
    });

    expect(queryCatalogComponents(registries, catalog, { search: "forms", pageSize: 10 }).items.map(item => item.id))
      .toEqual(["@beta:contact-form"]);
    expect(queryCatalogComponents(registries, catalog, { search: "@alpha", pageSize: 10 }).items.map(item => item.id))
      .toEqual(["@alpha:button"]);
  });

  it("filters and sorts using only real item facts plus reviewed enrichment", () => {
    const reviewed: RegistryItemSummary = {
      name: "Reviewed Zebra",
      slug: "zebra",
      source: "reviewed",
      provenance: "fixture",
      catalogStatus: "available",
      routeEligible: true,
    };
    const registries = [registry("@alpha", [reviewed]), registry("@beta")];
    const catalog = index({
      "@alpha": [
        { name: "zebra", type: "registry:ui", categories: ["forms"] },
        { name: "button", type: "registry:ui", categories: ["controls"] },
      ],
      "@beta": [
        { name: "accordion", type: "registry:block", categories: ["forms"] },
      ],
    });

    expect(queryCatalogComponents(registries, catalog, {
      itemTypes: ["registry:ui"],
      categories: ["forms"],
      reviewed: "reviewed",
      sort: "name",
      pageSize: 10,
    }).items.map(item => item.id)).toEqual(["@alpha:zebra"]);

    expect(queryCatalogComponents(registries, catalog, {
      sort: "name",
      pageSize: 10,
    }).items.map(item => item.id)).toEqual([
      "@beta:accordion",
      "@alpha:button",
      "@alpha:zebra",
    ]);

    expect(queryCatalogComponents(registries, catalog, {
      sort: "name-desc",
      pageSize: 10,
    }).items.map(item => item.id)).toEqual([
      "@alpha:zebra",
      "@alpha:button",
      "@beta:accordion",
    ]);
  });

  it("searches native description/author metadata and separates display labels from exact slugs", () => {
    const result = queryCatalogComponents(
      [registry("@alpha")],
      index({
        "@alpha": [{
          name: "collections/forms/contact-card",
          title: undefined,
          description: "A compact onboarding surface.",
          author: "Ada Example",
          type: "registry:block",
          categories: ["forms"],
          fileCount: 3,
        }],
      }),
      { search: "ada example", pageSize: 10 },
    );

    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      slug: "collections/forms/contact-card",
      displayName: "contact-card",
      description: "A compact onboarding surface.",
      author: "Ada Example",
      fileCount: 3,
    });
    expect(queryCatalogComponents(
      [registry("@alpha")],
      index({ "@alpha": [{
        name: "collections/forms/contact-card",
        description: "A compact onboarding surface.",
        author: "Ada Example",
        type: "registry:block",
      }] }),
      { search: "onboarding", pageSize: 10 },
    ).total).toBe(1);
  });

  it("paginates beyond the old 1,000-result materialization limit", () => {
    const items = Array.from({ length: 1105 }, (_, indexValue) => ({
      name: `item-${String(indexValue).padStart(4, "0")}`,
      type: "registry:component",
    }));

    const result = queryCatalogComponents(
      [registry("@large")],
      index({ "@large": items }),
      { page: 41, pageSize: 25 },
    );

    expect(result.total).toBe(1105);
    expect(result.pageCount).toBe(45);
    expect(result.items[0]?.slug).toBe("item-1000");
    expect(result.items.at(-1)?.slug).toBe("item-1024");
  });

  it("derives bounded facet counts from real indexed item facts", () => {
    const registries = [registry("@alpha"), registry("@beta")];
    const catalog = index({
      "@alpha": [
        { name: "button", type: "registry:ui", categories: ["controls"] },
        { name: "input", type: "registry:ui", categories: ["forms"] },
      ],
      "@beta": [
        { name: "hero", type: "registry:block", categories: ["marketing"] },
      ],
    });

    const facets = buildCatalogFacetSummary(registries, catalog);
    expect(facets.registries).toEqual([
      { value: "@alpha", count: 2 },
      { value: "@beta", count: 1 },
    ]);
    expect(facets.itemTypes).toEqual([
      { value: "registry:ui", count: 2 },
      { value: "registry:block", count: 1 },
    ]);
    expect(facets.categories).toEqual(expect.arrayContaining([
      { value: "controls", count: 1 },
      { value: "forms", count: 1 },
      { value: "marketing", count: 1 },
    ]));
  });

  it("supports a registry-scoped inventory without scanning other registries into the page", () => {
    const result = queryCatalogComponents(
      [registry("@alpha"), registry("@beta")],
      index({
        "@alpha": [{ name: "button", type: "registry:ui" }],
        "@beta": [{ name: "card", type: "registry:ui" }],
      }),
      { registryNames: ["@beta"], pageSize: 10 },
    );

    expect(result.total).toBe(1);
    expect(result.items.map(item => item.id)).toEqual(["@beta:card"]);
  });
});

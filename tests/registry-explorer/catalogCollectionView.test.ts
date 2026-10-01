import { describe, expect, it } from "vitest";
import type { CatalogQueryResult } from "../../src/registry-explorer/core/catalogQuery";
import type { Registry } from "../../src/registry-explorer/core/registry.schema";
import { renderCatalogCollection } from "../../src/registry-explorer/ui/catalogCollectionView";

describe("renderCatalogCollection", () => {
  it("marks template and theme collections with route-specific shared-grid variants", () => {
    const template = root();
    renderCatalogCollection(root(), template, result(), {
      eyebrow: "Community",
      title: "Templates",
      description: "Pages",
      routeKind: "template",
    });
    expect(template.innerHTML).toContain("catalog-collection-grid-template");
    expect(template.innerHTML).toContain("catalog-component-card-template");

    const theme = root();
    renderCatalogCollection(root(), theme, result(), {
      eyebrow: "Community",
      title: "Themes",
      description: "Themes",
      routeKind: "theme",
    });
    expect(theme.innerHTML).toContain("catalog-collection-grid-theme");
    expect(theme.innerHTML).toContain("catalog-component-card-theme");
  });
});

function root(): HTMLElement {
  return { innerHTML: "" } as HTMLElement;
}

function result(): CatalogQueryResult {
  const registry: Registry = {
    name: "@delta",
    url: "https://delta.example",
    description: "Delta",
    atlas: { aliases: [], coverageStatus: "verified", confidence: "high", notes: "", catalogStatus: "available" },
    itemSummaries: [],
  };
  return {
    items: [{
      id: "@delta:theme",
      namespace: "@delta",
      registry,
      slug: "theme",
      displayName: "Theme",
      type: "registry:theme",
      categories: ["theme"],
      reviewed: false,
      item: { name: "theme", type: "registry:theme", categories: ["theme"] },
      routePath: "/Registry-Atlas/@delta/components/theme",
    }],
    total: 1,
    page: 1,
    pageSize: 32,
    pageCount: 1,
    hasPreviousPage: false,
    hasNextPage: false,
  };
}

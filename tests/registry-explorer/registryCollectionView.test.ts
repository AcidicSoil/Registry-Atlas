import { describe, expect, it } from "vitest";
import type { CatalogQueryResult } from "../../src/registry-explorer/core/catalogQuery";
import type { Registry } from "../../src/registry-explorer/core/registry.schema";
import { renderRegistryCollection } from "../../src/registry-explorer/ui/registryCollectionView";

describe("renderRegistryCollection", () => {
  it("puts the real component inventory before secondary registry diagnostics", () => {
    const header = root();
    const body = root();

    renderRegistryCollection(header, body, registry(), result(), { coverage: "current" });

    expect(header.innerHTML).toContain("@registrydirectory");
    expect(header.innerHTML).toContain("13,544 indexed components");
    expect(header.innerHTML).toContain("Current catalog");
    expect(body.innerHTML).toContain("registry-profile-layout");
    expect(body.innerHTML).toContain("registry-profile-summary-rail");
    expect(body.innerHTML).toContain("registry-profile-inventory");
    expect(body.innerHTML).toContain("Catalog components");
    expect(body.innerHTML).toContain('data-view-item-slug="tree/menu-navigation-tree"');
    expect(body.innerHTML).not.toContain("Official shadcn facts");
    expect(body.innerHTML).not.toContain("Catalog not verified");
    expect(body.innerHTML).not.toContain("Copy install");
  });
});

function root(): HTMLElement {
  return { innerHTML: "" } as HTMLElement;
}

function registry(): Registry {
  return {
    name: "@registrydirectory",
    url: "https://registry.directory",
    description: "Registry directory.",
    atlas: {
      aliases: [],
      coverageStatus: "inferred",
      confidence: "medium",
      notes: "",
      catalogStatus: "available",
    },
    itemSummaries: [],
  };
}

function result(): CatalogQueryResult {
  const registryValue = registry();
  return {
    items: [{
      id: "@registrydirectory:tree/menu-navigation-tree",
      namespace: "@registrydirectory",
      registry: registryValue,
      slug: "tree/menu-navigation-tree",
      displayName: "Navigation tree",
      type: "registry:component",
      categories: ["navigation"],
      reviewed: false,
      item: { name: "tree/menu-navigation-tree", type: "registry:component", categories: ["navigation"] },
      routePath: "/Registry-Atlas/@registrydirectory/components/tree/menu-navigation-tree",
    }],
    total: 13544,
    page: 1,
    pageSize: 32,
    pageCount: 424,
    hasPreviousPage: false,
    hasNextPage: true,
  };
}

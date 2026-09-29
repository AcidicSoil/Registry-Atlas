import { describe, expect, it } from "vitest";
import {
  assetKindForCatalogItem,
  buildExploreCollectionOptions,
  filterCatalogItemsByAssetKind,
} from "../../src/registry-explorer/core/catalogCollections";
import type { RegistryCatalogItem } from "../../src/registry-explorer/core/registry.schema";

describe("catalogCollections", () => {
  it("classifies assets only from explicit item type/category facts", () => {
    expect(assetKindForCatalogItem({ name: "page", type: "registry:page" })).toBe("template");
    expect(assetKindForCatalogItem({ name: "theme", type: "registry:theme" })).toBe("theme");
    expect(assetKindForCatalogItem({ name: "icons", type: "registry:component", categories: ["icons"] })).toBe("icon");
    expect(assetKindForCatalogItem({ name: "icon-button", type: "registry:component" })).toBe("component");
  });

  it("filters typed collections without fuzzy name inference", () => {
    const items: RegistryCatalogItem[] = [
      { name: "landing", type: "registry:page" },
      { name: "icon-button", type: "registry:component" },
      { name: "glyphs", type: "registry:component", categories: ["icons"] },
    ];
    expect(filterCatalogItemsByAssetKind(items, "template").map(item => item.name)).toEqual(["landing"]);
    expect(filterCatalogItemsByAssetKind(items, "icon").map(item => item.name)).toEqual(["glyphs"]);
  });

  it("defines explore collections only with explicit category rules", () => {
    const options = buildExploreCollectionOptions(["AI", "forms", "marketing", "button"]);
    expect(options.map(option => option.slug)).toEqual(["ai", "forms", "marketing"]);
    expect(options.every(option => option.categories.length > 0)).toBe(true);
  });
});

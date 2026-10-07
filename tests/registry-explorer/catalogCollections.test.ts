import { describe, expect, it } from "vitest";
import {
  assetKindForCatalogItem,
  buildExploreCollectionOptions,
  filterCatalogItemsByAssetKind,
} from "../../src/registry-explorer/core/catalogCollections";
import type { RegistryCatalogItem } from "../../src/registry-explorer/core/registry.schema";

describe("catalogCollections", () => {
  it("normalizes structural kinds without collapsing blocks or pages", () => {
    expect(assetKindForCatalogItem({ name: "block", type: "registry:block" })).toBe("block");
    expect(assetKindForCatalogItem({ name: "component", type: "registry:component" })).toBe("component");
    expect(assetKindForCatalogItem({ name: "ui", type: "registry:ui" })).toBe("component");
    expect(assetKindForCatalogItem({ name: "item", type: "registry:item" })).toBe("component");
    expect(assetKindForCatalogItem({ name: "page", type: "registry:page" })).toBe("page");
    expect(assetKindForCatalogItem({ name: "style", type: "registry:style" })).toBe("theme");
    expect(assetKindForCatalogItem({ name: "theme", type: "registry:theme" })).toBe("theme");
    expect(assetKindForCatalogItem({ name: "icon", type: "registry:icon" })).toBe("icon");
    expect(assetKindForCatalogItem({ name: "mystery", type: "registry:unsupported" })).toBe("other");
  });

  it("uses an explicitly promoted kind before legacy fallback inference", () => {
    expect(assetKindForCatalogItem({
      name: "landing-template",
      type: "registry:page",
      kind: "template",
    })).toBe("template");
    expect(assetKindForCatalogItem({
      name: "block-with-icon-category",
      type: "registry:block",
      kind: "block",
      categories: ["icons"],
    })).toBe("block");
  });

  it("keeps reviewed icon-only registry exceptions through data-driven overrides", () => {
    expect(assetKindForCatalogItem({ name: "mastra", type: "registry:component" }, "@svgl")).toBe("icon");
    expect(assetKindForCatalogItem({ name: "arrow-up", type: "registry:component" }, "@heroicons-animated")).toBe("icon");
    expect(assetKindForCatalogItem({ name: "icon-button", type: "registry:component" }, "@not-icon-only")).toBe("component");
    expect(assetKindForCatalogItem({ name: "icons", type: "registry:component", categories: ["icons"] })).toBe("icon");
  });

  it("filters typed collections without fuzzy name inference", () => {
    const items: RegistryCatalogItem[] = [
      { name: "landing", type: "registry:page" },
      { name: "landing-template", type: "registry:page", kind: "template" },
      { name: "icon-button", type: "registry:component" },
      { name: "glyphs", type: "registry:component", categories: ["icons"] },
    ];
    expect(filterCatalogItemsByAssetKind(items, "page").map(item => item.name)).toEqual(["landing"]);
    expect(filterCatalogItemsByAssetKind(items, "template").map(item => item.name)).toEqual(["landing-template"]);
    expect(filterCatalogItemsByAssetKind(items, "icon").map(item => item.name)).toEqual(["glyphs"]);
  });

  it("defines explore collections only with explicit category rules", () => {
    const options = buildExploreCollectionOptions(["AI", "forms", "marketing", "button"]);
    expect(options.map(option => option.slug)).toEqual(["ai", "forms", "marketing"]);
    expect(options.every(option => option.categories.length > 0)).toBe(true);
  });
});

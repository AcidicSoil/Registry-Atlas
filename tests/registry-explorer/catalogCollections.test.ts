import { TEST_CATALOG_POLICY } from "./testCatalogPolicy";
import { describe, expect, it } from "vitest";
import {
  assetKindForCatalogItem,
  buildExploreCollectionOptions,
  filterCatalogItemsByAssetKind,
} from "../../src/registry-explorer/core/catalogCollections";
import type { RegistryCatalogItem } from "../../src/registry-explorer/core/registry.schema";

describe("catalogCollections", () => {
  it("normalizes structural kinds without collapsing blocks or pages", () => {
    expect(
      assetKindForCatalogItem({ name: "block", type: "registry:block" }, TEST_CATALOG_POLICY),
    ).toBe("block");
    expect(
      assetKindForCatalogItem(
        { name: "component", type: "registry:component" },
        TEST_CATALOG_POLICY,
      ),
    ).toBe("component");
    expect(assetKindForCatalogItem({ name: "ui", type: "registry:ui" }, TEST_CATALOG_POLICY)).toBe(
      "component",
    );
    expect(
      assetKindForCatalogItem({ name: "item", type: "registry:item" }, TEST_CATALOG_POLICY),
    ).toBe("component");
    expect(
      assetKindForCatalogItem({ name: "page", type: "registry:page" }, TEST_CATALOG_POLICY),
    ).toBe("page");
    expect(
      assetKindForCatalogItem({ name: "style", type: "registry:style" }, TEST_CATALOG_POLICY),
    ).toBe("theme");
    expect(
      assetKindForCatalogItem({ name: "theme", type: "registry:theme" }, TEST_CATALOG_POLICY),
    ).toBe("theme");
    expect(
      assetKindForCatalogItem({ name: "icon", type: "registry:icon" }, TEST_CATALOG_POLICY),
    ).toBe("icon");
    expect(
      assetKindForCatalogItem(
        { name: "mystery", type: "registry:unsupported" },
        TEST_CATALOG_POLICY,
      ),
    ).toBe("other");
  });

  it("uses exact source template categories and explicitly promoted kinds before fallback inference", () => {
    expect(
      assetKindForCatalogItem(
        {
          name: "landing-template",
          type: "registry:page",
          categories: ["templates"],
        },
        TEST_CATALOG_POLICY,
      ),
    ).toBe("template");
    expect(
      assetKindForCatalogItem(
        {
          name: "landing-template-promoted",
          type: "registry:page",
          kind: "template",
        },
        TEST_CATALOG_POLICY,
      ),
    ).toBe("template");
    expect(
      assetKindForCatalogItem(
        {
          name: "block-with-icon-category",
          type: "registry:block",
          kind: "block",
          categories: ["icons"],
        },
        TEST_CATALOG_POLICY,
      ),
    ).toBe("block");
  });

  it("keeps reviewed icon-only registry exceptions through data-driven overrides", () => {
    expect(
      assetKindForCatalogItem(
        { name: "mastra", type: "registry:component" },
        TEST_CATALOG_POLICY,
        "@svgl",
      ),
    ).toBe("icon");
    expect(
      assetKindForCatalogItem(
        { name: "arrow-up", type: "registry:component" },
        TEST_CATALOG_POLICY,
        "@heroicons-animated",
      ),
    ).toBe("icon");
    expect(
      assetKindForCatalogItem(
        { name: "icon-button", type: "registry:component" },
        TEST_CATALOG_POLICY,
        "@not-icon-only",
      ),
    ).toBe("component");
    expect(
      assetKindForCatalogItem(
        { name: "icons", type: "registry:component", categories: ["icons"] },
        TEST_CATALOG_POLICY,
      ),
    ).toBe("icon");
  });

  it("filters typed collections without fuzzy name inference", () => {
    const items: RegistryCatalogItem[] = [
      { name: "landing", type: "registry:page" },
      { name: "landing-template", type: "registry:page", kind: "template" },
      { name: "icon-button", type: "registry:component" },
      { name: "glyphs", type: "registry:component", categories: ["icons"] },
    ];

    expect(
      filterCatalogItemsByAssetKind(items, "page", TEST_CATALOG_POLICY).map((item) => item.name),
    ).toEqual(["landing"]);
    expect(
      filterCatalogItemsByAssetKind(items, "template", TEST_CATALOG_POLICY).map(
        (item) => item.name,
      ),
    ).toEqual(["landing-template"]);
    expect(
      filterCatalogItemsByAssetKind(items, "icon", TEST_CATALOG_POLICY).map((item) => item.name),
    ).toEqual(["glyphs"]);
  });

  it("defines explore collections only with explicit category rules", () => {
    const options = buildExploreCollectionOptions(["AI", "forms", "marketing", "button"]);
    expect(options.map((option) => option.slug)).toEqual(["ai", "forms", "marketing"]);
    expect(options.every((option) => option.categories.length > 0)).toBe(true);
  });
});

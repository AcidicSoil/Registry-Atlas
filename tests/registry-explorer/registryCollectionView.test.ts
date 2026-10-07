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
    expect(header.innerHTML).toContain("13,544 items");
    expect(header.innerHTML).toContain(">Current<");
    expect(header.innerHTML).not.toContain("Current catalog");
    expect(body.innerHTML).toContain("registry-profile-layout");
    expect(body.innerHTML).toContain("registry-profile-summary-rail");
    expect(body.innerHTML).toContain("registry-profile-inventory");
    expect(body.innerHTML).toContain("<h2>Items</h2>");
    expect(body.innerHTML).toContain('data-view-item-slug="tree/menu-navigation-tree"');
    expect(body.innerHTML).not.toContain("Official shadcn facts");
    expect(body.innerHTML).not.toContain("Catalog not verified");
    expect(body.innerHTML).not.toContain("Copy install");
    // The shell owns the single route-level homepage action, avoiding duplicate links.
    expect(header.innerHTML).not.toContain('>Visit registry homepage</a>');
  });

  it("keeps a promoted block on the legacy component detail route without requiring source categories", () => {
    const header = root();
    const body = root();
    const promoted = result();
    promoted.items = [{
      ...promoted.items[0]!,
      id: "@registrydirectory:app-shell",
      slug: "app-shell",
      displayName: "App Shell",
      categories: [],
      item: {
        name: "app-shell",
        title: "App Shell",
        type: "registry:block",
        kind: "block",
        canonical: {
          taxonomyVersion: "v1",
          primary: "application/app-shell",
          path: ["application", "application/app-shell"],
        },
      },
      routePath: "/Registry-Atlas/@registrydirectory/components/app-shell",
    }];
    promoted.total = 1;
    promoted.pageCount = 1;
    promoted.hasNextPage = false;

    renderRegistryCollection(header, body, registry(), promoted, {
      coverage: "current",
      controls: '<button data-catalog-canonical-value="application/app-shell">App Shell</button>',
    });

    expect(body.innerHTML).toContain('data-catalog-canonical-value="application/app-shell"');
    expect(body.innerHTML).toContain('href="/Registry-Atlas/@registrydirectory/components/app-shell"');
    expect(body.innerHTML).not.toContain('data-catalog-category-value');
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
      previewUrl: "https://registry.directory/previews/navigation-tree.png",
    }],
    total: 13544,
    page: 1,
    pageSize: 32,
    pageCount: 424,
    hasPreviousPage: false,
    hasNextPage: true,
  };
}

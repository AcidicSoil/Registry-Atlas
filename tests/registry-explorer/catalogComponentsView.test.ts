import { describe, expect, it } from "vitest";
import type { CatalogComponent, CatalogQueryResult } from "../../src/registry-explorer/core/catalogQuery";
import type { Registry } from "../../src/registry-explorer/core/registry.schema";
import {
  renderCatalogBrowseControls,
  renderCatalogComponentCard,
  renderCatalogComponents,
  renderCatalogRailControls,
} from "../../src/registry-explorer/ui/catalogComponentsView";

describe("renderCatalogComponents", () => {
  it("renders real component cards as action-light detail links", () => {
    const header = root();
    const body = root();

    renderCatalogComponents(header, body, result([component()]), { searchTerm: "" });

    expect(header.innerHTML).toContain("Components");
    expect(header.innerHTML).toContain("1 indexed component");
    expect(body.innerHTML).toContain("data-view-item-registry=\"@delta\"");
    expect(body.innerHTML).toContain("data-view-item-slug=\"code-block\"");
    expect(body.innerHTML).toContain("Code Block");
    expect(body.innerHTML).toContain("@delta");
    expect(body.innerHTML).not.toContain("Copy install");
    expect(body.innerHTML).not.toContain("Inspect first");
    expect(body.innerHTML).not.toContain("Add to queue");
  });

  it("renders evidence-backed discovery bands before the full component grid", () => {
    const body = root();
    renderCatalogComponents(root(), body, result([component()]), {
      searchTerm: "",
      discoveryBands: [{
        label: "Forms",
        routePath: "/Registry-Atlas/components/explore/forms",
        items: [component()],
      }],
    });

    expect(body.innerHTML).toContain('class="catalog-discovery-bands"');
    expect(body.innerHTML).toContain('class="catalog-discovery-band"');
    expect(body.innerHTML).toContain(">Forms<");
    expect(body.innerHTML).toContain('data-catalog-route="/Registry-Atlas/components/explore/forms"');
    expect(body.innerHTML.indexOf("catalog-discovery-bands")).toBeLessThan(
      body.innerHTML.indexOf("catalog-component-grid"),
    );
  });

  it("renders a trusted preview when present and an honest specimen when absent", () => {
    const withPreview = root();
    renderCatalogComponents(root(), withPreview, result([
      component({ previewUrl: "https://delta.example/preview.png" }),
    ]), { searchTerm: "" });
    expect(withPreview.innerHTML).toContain("<img");
    expect(withPreview.innerHTML).toContain("https://delta.example/preview.png");

    const withoutPreview = root();
    renderCatalogComponents(root(), withoutPreview, result([component()]), { searchTerm: "" });
    expect(withoutPreview.innerHTML).not.toContain("Preview not published");
    expect(withoutPreview.innerHTML).toContain("A real indexed component.");
    expect(withoutPreview.innerHTML).toContain("ui");
    expect(withoutPreview.innerHTML).not.toContain("<svg");
  });

  it("renders native theme swatches only in theme mode", () => {
    const themed = component({
      themePreview: {
        light: { background: "#ffffff", primary: "oklch(0.55 0.2 250)" },
        dark: { background: "#101010", primary: "#78a9ff" },
      },
    });

    const html = renderCatalogComponentCard(themed, "theme");
    expect(html).toContain("catalog-component-card-theme");
    expect(html).toContain("catalog-theme-swatches");
    expect(html).toContain("background-color:#ffffff");
    expect(html).toContain("background-color:#101010");

    const componentHtml = renderCatalogComponentCard(themed, "component");
    expect(componentHtml).not.toContain("catalog-theme-swatches");
  });

  it("splits browse dimensions into the rail and keeps the content toolbar compact", () => {
    const facets = {
      registries: [{ value: "@delta", count: 12 }],
      itemTypes: [{ value: "registry:ui", count: 10 }],
      categories: [{ value: "forms", count: 4 }],
      reviewedCount: 2,
      unreviewedCount: 10,
    };
    const state = {
      page: 2,
      sort: "type" as const,
      registryNames: ["@delta"],
      itemTypes: ["registry:ui"],
      categories: ["forms"],
      reviewed: "unreviewed" as const,
    };

    const rail = renderCatalogRailControls(facets, state);
    expect(rail).not.toContain('data-catalog-search');
    expect(rail).toContain('data-catalog-registry-value="@delta"');
    expect(rail).toContain('data-catalog-type-value="registry:ui"');
    expect(rail).toContain('data-catalog-category-value="forms"');
    expect(rail).toContain('aria-pressed="true"');
    expect(rail).toContain('>4<');

    const toolbar = renderCatalogBrowseControls(facets, state);
    expect(toolbar).not.toContain('data-catalog-filter="registry"');
    expect(toolbar).not.toContain('data-catalog-filter="type"');
    expect(toolbar).not.toContain('data-catalog-filter="category"');
    expect(toolbar).not.toContain('data-catalog-reviewed');
    expect(toolbar).toContain('data-catalog-sort');
    expect(toolbar).not.toContain('Reviewed first');
    expect(toolbar).toContain('<option value="type" selected>');
    expect(toolbar).toContain('data-catalog-clear');
  });

  it("keeps filters visible when a filter combination has no matches", () => {
    const body = root();
    renderCatalogComponents(root(), body, result([]), {
      searchTerm: "",
      facets: {
        registries: [{ value: "@delta", count: 1 }],
        itemTypes: [{ value: "registry:ui", count: 1 }],
        categories: [],
        reviewedCount: 0,
        unreviewedCount: 1,
      },
      browseState: {
        page: 1,
        sort: "name",
        registryNames: [],
        itemTypes: ["registry:block"],
        categories: [],
        reviewed: "all",
      },
    });

    expect(body.innerHTML).not.toContain('data-catalog-reviewed');
    expect(body.innerHTML).toContain('data-catalog-sort');
    expect(body.innerHTML).toContain('data-catalog-clear');
    expect(body.innerHTML).toContain('No indexed components are available');
  });

  it("renders truthful pagination over the full query result", () => {
    const body = root();
    renderCatalogComponents(root(), body, {
      ...result([component()]),
      total: 76520,
      page: 2,
      pageSize: 32,
      pageCount: 2392,
      hasPreviousPage: true,
      hasNextPage: true,
    }, { searchTerm: "" });

    expect(body.innerHTML).toContain("33–64 of 76,520");
    expect(body.innerHTML).toContain("Page 2 of 2,392");
    expect(body.innerHTML).toContain('data-discovery-page="1"');
    expect(body.innerHTML).toContain('data-discovery-page="3"');
  });
});

function root(): HTMLElement {
  return { innerHTML: "" } as HTMLElement;
}

function result(items: CatalogComponent[]): CatalogQueryResult {
  return {
    items,
    total: items.length,
    page: 1,
    pageSize: 32,
    pageCount: items.length ? 1 : 0,
    hasPreviousPage: false,
    hasNextPage: false,
  };
}

function component(options: {
  previewUrl?: string;
  themePreview?: CatalogComponent["themePreview"];
} = {}): CatalogComponent {
  return {
    id: "@delta:code-block",
    namespace: "@delta",
    registry: registry(),
    slug: "code-block",
    displayName: "Code Block",
    title: "Code Block",
    description: "A real indexed component.",
    type: "registry:ui",
    categories: ["code"],
    reviewed: false,
    item: { name: "code-block", title: "Code Block", type: "registry:ui", categories: ["code"] },
    routePath: "/Registry-Atlas/@delta/components/code-block",
    ...(options.previewUrl ? { previewUrl: options.previewUrl } : {}),
    ...(options.themePreview ? { themePreview: options.themePreview } : {}),
  };
}

function registry(): Registry {
  return {
    name: "@delta",
    url: "https://delta.example",
    description: "Delta",
    atlas: {
      aliases: [],
      coverageStatus: "verified",
      confidence: "high",
      notes: "",
      catalogStatus: "available",
    },
    itemSummaries: [],
  };
}

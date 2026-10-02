import { describe, expect, it } from "vitest";
import type { CatalogComponent, CatalogQueryResult } from "../../src/registry-explorer/core/catalogQuery";
import type { Registry } from "../../src/registry-explorer/core/registry.schema";
import {
  renderCatalogBrowseControls,
  renderAssetKindChips,
  renderCatalogComponentCard,
  renderCatalogComponents,
  renderCatalogRailControls,
} from "../../src/registry-explorer/ui/catalogComponentsView";

describe("renderCatalogComponents", () => {
  it("renders multi-selected asset type chips", () => {
    const html = renderAssetKindChips({component: 4, template: 2, theme: 1}, ["template", "theme"]);
    expect(html).toMatch(/data-asset-kind-value="template"\s+aria-pressed="true"/);
    expect(html).toMatch(/data-asset-kind-value="theme"\s+aria-pressed="true"/);
    expect(html).not.toContain('data-asset-kind-value="icon"');
  });
  it("keeps component records visible without claiming that an image is an interactive demo", () => {
    const shown = renderCatalogComponentCard(component({
      previewUrl: "/Registry-Atlas/data/previews/8bitcn/button.jpg",
    }));
    expect(shown).toContain('data-view-item-registry="@delta"');
    expect(shown).toContain("Interactive demo unavailable");
    expect(shown).not.toContain("<img");
    expect(shown).not.toContain("Open raw item");
    expect(shown).not.toContain("Source record");
    const withoutPreview = renderCatalogComponentCard(component());
    expect(withoutPreview).toContain("Interactive demo unavailable");
    expect(withoutPreview).toContain("catalog-component-open");
  });
  it("renders real component cards as action-light detail links", () => {
    const header = root();
    const body = root();

    renderCatalogComponents(header, body, result([component({ previewUrl: "https://delta.example/preview.png" })]), { searchTerm: "" });

    expect(header.innerHTML).toContain("Components");
    expect(header.innerHTML).toContain("1 component");
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
    renderCatalogComponents(root(), body, result([component({ previewUrl: "https://delta.example/preview.png" })]), {
      searchTerm: "",
      discoveryBands: [{
        label: "Forms",
        routePath: "/Registry-Atlas/components/explore/forms",
        items: [component({ previewUrl: "https://delta.example/preview.png" })],
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

  it("renders all catalog entries but labels absent functional previews accurately", () => {
    const withStaticImage = root();
    renderCatalogComponents(root(), withStaticImage, result([
      component({ previewUrl: "https://delta.example/preview.png" }),
    ]), { searchTerm: "" });
    expect(withStaticImage.innerHTML).not.toContain("<img");
    expect(withStaticImage.innerHTML).toContain("Interactive demo unavailable");
    expect(withStaticImage.innerHTML).toContain("catalog-component-open");

    const withoutPreview = root();
    renderCatalogComponents(root(), withoutPreview, result([component()]), { searchTerm: "" });
    expect(withoutPreview.innerHTML).toContain("catalog-component-open");
    expect(withoutPreview.innerHTML).toContain("Interactive demo unavailable");
    expect(withoutPreview.innerHTML).not.toContain("catalog-component-metadata-specimen");
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
      sort: "registry" as const,
      registryNames: ["@delta"],
      itemTypes: ["registry:ui"],
      categories: ["forms"],
      reviewed: "unreviewed" as const,
    };

    const rail = renderCatalogRailControls(facets, state);
    expect(rail).not.toContain('data-catalog-search');
    expect(rail).toContain('data-catalog-registry-value="@delta"');
    expect(rail).toContain('>Registry<');
    expect(rail).not.toContain('data-catalog-type-value');
    expect(rail).toContain('data-catalog-category-value="forms"');
    expect(rail).toContain('>Category<');
    expect(rail).not.toContain('>Item types<');

    const toolbar = renderCatalogBrowseControls(state);
    expect(toolbar).not.toContain('data-catalog-filter="registry"');
    expect(toolbar).not.toContain('data-catalog-filter="type"');
    expect(toolbar).not.toContain('data-catalog-filter="category"');
    expect(toolbar).not.toContain('data-catalog-reviewed');
    expect(toolbar).toContain('data-catalog-sort');
    expect(toolbar).not.toContain('Reviewed first');
    expect(toolbar).not.toContain('<option value="type"');
    expect(toolbar).toContain('<option value="name"');
    expect(toolbar).toContain('<option value="registry"');
  });

  it("keeps active asset filters clearable without duplicating the directory sorter", () => {
    const markup = renderCatalogBrowseControls({
      page: 1, sort: "name", registryNames: [], itemTypes: [], categories: [], reviewed: "all",
    }, {
      assetCounts: { component: 4, template: 2 },
      selectedAssetKinds: ["component"],
      hideSort: true,
    });
    expect(markup).toContain("<summary>Filters");
    expect(markup).toContain('data-asset-kind-value="component"');
    expect(markup).toContain('data-catalog-clear');
    expect(markup).not.toContain('data-catalog-sort');
  });

  it("keeps filters visible when a filter combination has no matches", () => {
    const body = root();
    renderCatalogComponents(root(), body, result([]), {
      searchTerm: "",
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
    expect(body.innerHTML).toContain('No components are available');
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
    description: "A component from the catalog.",
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

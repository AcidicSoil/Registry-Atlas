import { describe, expect, it } from "vitest";
import type { CatalogComponent, CatalogQueryResult } from "../../src/registry-explorer/core/catalogQuery";
import type { Registry } from "../../src/registry-explorer/core/registry.schema";
import { parseCatalogTaxonomy } from "../../src/registry-explorer/core/catalogTaxonomy";
import {
  renderCatalogBrowseControls,
  renderCatalogComponentCard,
  renderCatalogComponents,
} from "../../src/registry-explorer/ui/catalogComponentsView";

const TEST_TAXONOMY = parseCatalogTaxonomy({
  version: "v1",
  roots: [{
    id: "application",
    label: "Application",
    aliases: ["app"],
    what: "Application surfaces",
    notFor: [],
    examples: [],
    children: [{
      id: "application/app-shell",
      label: "App Shell",
      aliases: ["workspace shell"],
      what: "Application shell",
      notFor: [],
      examples: [],
      children: [],
    }],
  }],
});

describe("renderCatalogComponents", () => {
  it("deeplinks sitemap-backed component pages while preserving provenance metadata", () => {
    const html=renderCatalogComponentCard({...component(),
      sourcePage:{url:'https://delta.example/docs/code-block',
        level:'sitemap',source:'official-sitemap'}});
    expect(html).toContain('href="https://delta.example/docs/code-block"');
    expect(html).toContain('Source ↗');
    expect(html).toContain('data-source-level="sitemap"');
    expect(html).toContain('class="catalog-component-deeplink"');
    expect(html).toContain('href="/Registry-Atlas/@delta/components/code-block"');
    expect(html).toContain('View component');
    expect(html).not.toContain('View original ↗');
    expect(html).not.toContain('View item JSON');
  });
  it("uses the source component deeplink on cards and never exposes raw item JSON", () => {
    const base = component();
    const html = renderCatalogComponentCard({
      ...base,
      docsUrl: "https://delta.example/components/code-block",
      item: {
        ...base.item,
        rawItemUrl: "https://delta.example/r/code-block.json",
      },
    });
    expect(html).toContain('class="catalog-component-source-actions"');
    expect(html).toContain('class="catalog-component-deeplink"');
    expect(html).toContain('href="/Registry-Atlas/@delta/components/code-block"');
    expect(html).toContain("View component");
    expect(html).toContain('href="https://delta.example/components/code-block"');
    expect(html).toContain('Source ↗');
    expect(html).not.toContain('href="https://delta.example/r/code-block.json"');
    expect(html).not.toContain("View item JSON");
  });

  it("does not confuse a raw JSON route or another registry with a component page", () => {
    const raw = renderCatalogComponentCard({
      ...component(), docsUrl: "https://delta.example/r/code-block.json",
    });
    expect(raw).not.toContain('catalog-component-original');

    const external = renderCatalogComponentCard({
      ...component(), docsUrl: "https://another-registry.example/components/code-block",
    });
    expect(external).not.toContain("catalog-component-original");
  });

  it("does not substitute raw item JSON when no source component deeplink exists", () => {
    const base = component();
    const html = renderCatalogComponentCard({
      ...base,
      item: {
        ...base.item,
        rawItemUrl: "https://delta.example/r/new-york-v4/code-block.json",
      },
    } as CatalogComponent);
    expect(html).not.toContain('href="https://delta.example/r/new-york-v4/code-block.json"');
    expect(html).not.toContain("View item JSON");
    expect(html).not.toContain("catalog-component-original");
    expect(html).toContain('class="catalog-component-deeplink"');
    expect(html).toContain('href="/Registry-Atlas/@delta/components/code-block"');
  });

  it("keeps component records visible without fake preview surfaces", () => {
    const html = renderCatalogComponentCard(component());
    expect(html).toContain('data-view-item-registry="@delta"');
    expect(html).toContain("catalog-component-open");
    expect(html).not.toContain("Visual reference");
    expect(html).toContain("data-registry-icon-image");
    expect(html).not.toContain("catalog-component-preview-image");
    expect(html).not.toContain("<iframe");
    expect(html).not.toContain("data-component-demo");
  });

  it("renders real component cards as action-light detail links", () => {
    const header = root();
    const body = root();

    renderCatalogComponents(header, body, result([component()]), { searchTerm: "" });

    expect(header.innerHTML).toContain("<h1>Components</h1>");
    expect(header.innerHTML).toContain("1 item");
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

  it("renders all catalog entries as metadata cards without preview placeholders", () => {
    const body = root();
    renderCatalogComponents(root(), body, result([component()]), { searchTerm: "" });
    expect(body.innerHTML).toContain("catalog-component-open");
    expect(body.innerHTML).toContain("data-registry-icon-image");
    expect(body.innerHTML).not.toContain("catalog-component-preview-image");
    expect(body.innerHTML).not.toContain("Visual reference");
    expect(body.innerHTML).not.toContain("Preview not published");
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

  it("renders only the applied catalog scope in results, never a second control toolbar", () => {
    const state = {
      page: 2,
      sort: "registry" as const,
      registryNames: ["@delta"],
      itemTypes: [],
      categories: [],
      assetKinds: [],
      canonicalIds: [],
      access: ["free"] as Array<"free" | "paid">,
      reviewed: "unreviewed" as const,
    };

    const context = renderCatalogBrowseControls(state, {
      searchTerm: "button",
    });
    expect(context).toContain('Search: “button”');
    expect(context).toContain('Registry: @delta');
    expect(context).toContain('Access: Free');
    expect(context).toContain('data-catalog-clear');
    expect(context).not.toContain('data-catalog-search');
    expect(context).not.toContain('data-catalog-registry-select');
    expect(context).not.toContain('data-catalog-access-select');
    expect(context).not.toContain('data-catalog-sort');
    expect(context).not.toContain('<select');
    expect(context).not.toContain('<details');
  });

  it("renders selected asset type only as removable applied context", () => {
    const markup = renderCatalogBrowseControls({
      page: 1, sort: "name", registryNames: [], itemTypes: [], categories: [],
      assetKinds: ["component"], canonicalIds: [], access: [], reviewed: "all",
    }, {
      selectedAssetKinds: ["component"],
    });
    expect(markup).toContain('Asset type: Components');
    expect(markup).toContain('data-asset-kind-value="component"');
    expect(markup).toContain('data-catalog-clear');
    expect(markup).not.toContain('data-asset-kind-select');
  });

  it("keeps applied filter context visible when a filter combination has no matches", () => {
    const body = root();
    renderCatalogComponents(root(), body, result([]), {
      searchTerm: "",
      browseState: {
        page: 1,
        sort: "name",
        registryNames: [],
        itemTypes: ["registry:block"],
        categories: [],
        assetKinds: [],
        canonicalIds: [],
        access: [],
        reviewed: "all",
      },
    });

    expect(body.innerHTML).toContain('Type: block');
    expect(body.innerHTML).toContain('data-catalog-clear');
    expect(body.innerHTML).not.toContain('data-catalog-sort');
    expect(body.innerHTML).not.toContain('<select');
    expect(body.innerHTML).toContain('No catalog items are available');
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


describe("catalog applied-filter context", () => {
  const state = {
    page: 1,
    sort: "name" as const,
    registryNames: [],
    itemTypes: [],
    categories: [],
    assetKinds: ["block"] as const,
    canonicalIds: ["application/app-shell"],
    access: ["free"] as const,
    reviewed: "all" as const,
  };

  it("renders asset type as removable context with the same catalog vocabulary", () => {
    const html = renderCatalogBrowseControls(state as any, {
      selectedAssetKinds: ["block"],
    });
    expect(html).toContain('data-asset-kind-value="block"');
    expect(html).toContain('Asset type: Blocks');
    expect(html).not.toContain('data-asset-kind-select');
  });

  it("renders canonical and access state as removable context without duplicating selection controls", () => {
    const html = renderCatalogBrowseControls(state as any, {
      taxonomy: TEST_TAXONOMY,
    });
    expect(html).toMatch(/data-catalog-canonical-value="application\/app-shell"[\s\S]*Category: App Shell/);
    expect(html).toContain('data-catalog-access-value="free"');
    expect(html).toContain("Access: Free");
    expect(html).not.toContain('data-catalog-access-select');
    expect(html).not.toContain('data-catalog-canonical-checkbox');
    expect(html).not.toContain('<select');
  });

  it("omits access context when no access filter is active", () => {
    const html = renderCatalogBrowseControls({ ...state, access: [] } as any, {
      taxonomy: TEST_TAXONOMY,
    });
    expect(html).not.toContain('data-catalog-access-value');
    expect(html).not.toContain("Access: Free");
  });
});

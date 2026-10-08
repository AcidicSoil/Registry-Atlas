import { describe, expect, it } from "vitest";
import {
  buildCatalogFacetSummary,
  catalogItemCountForRegistry,
  catalogDistinctItemCount,
  queryCatalogComponents,
} from "../../src/registry-explorer/core/catalogQuery";
import type {
  Registry,
  RegistryCatalogIndex,
  RegistryItemSummary,
} from "../../src/registry-explorer/core/registry.schema";
import {
  configureDefaultCatalogTaxonomy,
  parseCatalogTaxonomy,
} from "../../src/registry-explorer/core/catalogTaxonomy";
import { configureCatalogKindOverrides } from "../../src/registry-explorer/core/catalogCollections";
import { readRepositoryDocument } from "./testAtlasDatabase";

configureDefaultCatalogTaxonomy(parseCatalogTaxonomy(readRepositoryDocument("catalog-taxonomy")));
configureCatalogKindOverrides(readRepositoryDocument("catalog-kind-overrides"));

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
  it("counts one exact identity once without collapsing nested names or other registries", () => {
    const catalog = index({
      "@alpha": [
        { name: "button", type: "registry:ui", categories: ["controls"] },
        { name: "button", type: "registry:ui", categories: ["controls", "experimental"] },
        { name: "forms/button", type: "registry:ui", categories: ["forms"] },
      ],
      "@beta": [{ name: "button", type: "registry:ui", categories: ["controls"] }],
    });
    const registries = [registry("@alpha"), registry("@beta")];
    const first = queryCatalogComponents(registries, catalog, { pageSize: 2 });
    expect(first.total).toBe(3);
    expect(first.pageCount).toBe(2);
    expect(queryCatalogComponents(registries, catalog, { pageSize: 4 })
      .items.map(item => item.id).sort()).toEqual([
        "@alpha:button", "@alpha:forms/button", "@beta:button",
      ]);
    expect(catalogItemCountForRegistry(catalog, "@alpha")).toBe(2);
    expect(catalogDistinctItemCount(catalog)).toBe(3);
    const facets = buildCatalogFacetSummary(registries, catalog);
    expect(facets.registries).toEqual(expect.arrayContaining([
      { value: "@alpha", count: 2 }, { value: "@beta", count: 1 },
    ]));
    expect(facets.categories.find(entry => entry.value === "controls")?.count).toBe(2);
    expect(facets.categories.find(entry => entry.value === "experimental")).toBeUndefined();
  });

  it("routes source-backed icon registries into the icon gallery without preview data", () => {
    const idx = index({ "@svgl": [
      { name: "mastra", type: "registry:component" },
    ] });
    const icons = queryCatalogComponents([registry("@svgl")], idx, { assetKinds: ["icon"] });
    expect(icons.total).toBe(1);
    expect(icons.items[0]?.slug).toBe("mastra");
    const components = queryCatalogComponents([registry("@svgl")], idx, { assetKinds: ["component"] });
    expect(components.total).toBe(0);
  });
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

  it('matches the author field exactly rather than guessing from title or description',()=>{
    const registries=[registry('@alpha')];
    const idx=index({'@alpha':[
      {name:'author-name',type:'registry:ui',title:'Alice Example',author:'Bob'},
      {name:'owned-item',type:'registry:ui',title:'Button',author:'Alice'},
      {name:'no-owner',type:'registry:ui',title:'Alice Option'},
    ]});
    expect(queryCatalogComponents(registries,idx,{author:'Alice',pageSize:10} as any)
      .items.map(x=>x.slug)).toEqual(['owned-item']);
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
      sort: "registry",
      pageSize: 10,
    }).items.map(item => item.id)).toEqual([
      "@alpha:button",
      "@alpha:zebra",
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


describe('canonical taxonomy catalog queries', () => {
  const canonicalCatalog = index({
    '@alpha': [
      {
        name: 'workspace-frame', title: 'Workspace Frame', type: 'registry:block', kind: 'block',
        categories: ['Layouts'],
        canonical: { taxonomyVersion: 'v1', primary: 'application/app-shell', path: ['application', 'application/app-shell'] },
        access: { normalized: 'free', sourceLabel: 'Free' },
      },
      {
        name: 'mystery', title: 'Mystery Surface', type: 'registry:component', kind: 'component',
        canonical: { taxonomyVersion: 'v1', primary: null, path: [] },
      },
    ],
    '@beta': [
      {
        name: 'product-frame', title: 'Product Frame', type: 'registry:block', kind: 'block',
        categories: ['Application'],
        canonical: { taxonomyVersion: 'v1', primary: 'application/app-shell', path: ['application', 'application/app-shell'] },
        access: { normalized: 'paid', sourceLabel: 'Pro' },
      },
      {
        name: 'ops-overview', title: 'Ops Overview', type: 'registry:block', kind: 'block',
        canonical: { taxonomyVersion: 'v1', primary: 'application/dashboard', path: ['application', 'application/dashboard'] },
      },
    ],
    '@gamma': [
      {
        name: 'assistant-thread', title: 'Assistant Thread', type: 'registry:block', kind: 'block',
        categories: ['Assistant'],
        canonical: { taxonomyVersion: 'v1', primary: 'ai/chat', path: ['ai', 'ai/chat'] },
      },
      {
        name: 'primary-action', title: 'Primary Action', type: 'registry:component', kind: 'component',
        canonical: { taxonomyVersion: 'v1', primary: 'controls/button', path: ['controls', 'controls/button'] },
      },
    ],
  });
  const canonicalRegistries = [registry('@alpha'), registry('@beta'), registry('@gamma')];

  it('filters equivalent cross-registry items by canonical id and accurate kind', () => {
    expect(queryCatalogComponents(canonicalRegistries, canonicalCatalog, {
      assetKinds: ['block'], canonicalIds: ['application/app-shell'], pageSize: 20,
    }).items.map(item => item.id)).toEqual(['@beta:product-frame', '@alpha:workspace-frame']);

    expect(queryCatalogComponents(canonicalRegistries, canonicalCatalog, {
      canonicalIds: ['ai/chat'], pageSize: 20,
    }).items.map(item => item.id)).toEqual(['@gamma:assistant-thread']);

    expect(queryCatalogComponents(canonicalRegistries, canonicalCatalog, {
      assetKinds: ['component'], canonicalIds: ['controls/button'], pageSize: 20,
    }).items.map(item => item.id)).toEqual(['@gamma:primary-action']);
  });

  it('matches parent canonical nodes by descendant path and ORs canonical selections', () => {
    expect(queryCatalogComponents(canonicalRegistries, canonicalCatalog, {
      canonicalIds: ['application'], pageSize: 20,
    }).items.map(item => item.id).sort()).toEqual([
      '@alpha:workspace-frame', '@beta:ops-overview', '@beta:product-frame',
    ]);
    expect(queryCatalogComponents(canonicalRegistries, canonicalCatalog, {
      canonicalIds: ['application/app-shell', 'ai/chat'], pageSize: 20,
    }).items.map(item => item.id).sort()).toEqual([
      '@alpha:workspace-frame', '@beta:product-frame', '@gamma:assistant-thread',
    ]);
  });

  it('ANDs registry, kind, canonical, and explicit access while keeping unclassified visible otherwise', () => {
    expect(queryCatalogComponents(canonicalRegistries, canonicalCatalog, {
      registryNames: ['@alpha'], assetKinds: ['block'], canonicalIds: ['application/app-shell'],
      access: ['free'], pageSize: 20,
    }).items.map(item => item.id)).toEqual(['@alpha:workspace-frame']);
    expect(queryCatalogComponents(canonicalRegistries, canonicalCatalog, {
      registryNames: ['@alpha'], access: ['paid'], pageSize: 20,
    }).total).toBe(0);
    expect(queryCatalogComponents(canonicalRegistries, canonicalCatalog, { pageSize: 20 })
      .items.some(item => item.id === '@alpha:mystery')).toBe(true);
    expect(queryCatalogComponents(canonicalRegistries, canonicalCatalog, {
      canonicalIds: ['application'], pageSize: 20,
    }).items.some(item => item.id === '@alpha:mystery')).toBe(false);
  });

  it('searches canonical labels and aliases without removing source-field search', () => {
    expect(queryCatalogComponents(canonicalRegistries, canonicalCatalog, {
      search: 'workspace shell', pageSize: 20,
    }).items.map(item => item.id).sort()).toEqual(['@alpha:workspace-frame', '@beta:product-frame']);
    expect(queryCatalogComponents(canonicalRegistries, canonicalCatalog, {
      search: 'assistant', pageSize: 20,
    }).items.map(item => item.id)).toEqual(['@gamma:assistant-thread']);
  });

  it('counts canonical ancestors and exposes access facets only when explicit metadata exists', () => {
    const facets = buildCatalogFacetSummary(canonicalRegistries, canonicalCatalog);
    expect(facets.canonical).toEqual(expect.arrayContaining([
      { value: 'application', count: 3 },
      { value: 'application/app-shell', count: 2 },
      { value: 'ai/chat', count: 1 },
      { value: 'controls/button', count: 1 },
    ]));
    expect(facets.access).toEqual([
      { value: 'free', count: 1 },
      { value: 'paid', count: 1 },
    ]);

    const noAccess = buildCatalogFacetSummary(
      [registry('@plain')],
      index({ '@plain': [{
        name: 'button', type: 'registry:ui', kind: 'component',
        canonical: { taxonomyVersion: 'v1', primary: 'controls/button', path: ['controls', 'controls/button'] },
      }] }),
    );
    expect(noAccess.access).toBeUndefined();
  });
});

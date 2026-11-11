import { buildCatalogFacetSummary } from "../core/catalogQuery";
import { catalogRoutePath, type CatalogRoute } from "../core/catalogRoutes";
import { assetKindForCatalogItem, type CatalogAssetKind } from "../core/catalogCollections";
import type { Registry, RegistryCatalogIndex } from "../core/registry.schema";
import type { CatalogPolicy } from "../core/catalogPolicy";
import {
  renderRegistryDirectorySidebar,
  type RegistryDirectoryLayout,
} from "./registryDirectoryView";
import { renderCatalogSidebarNavigation } from "./catalogSidebarNavigation";
import { escapeHtml } from "./renderSafety";
import type { AssetKindToken } from "./catalogComponentsView";
import type { AppState } from "./shellState";

type SectionsLookupContract = Readonly<Record<string, { label: string; route: CatalogRoute }>>;

type KindLookupContract = Readonly<Record<string, string>>;

interface SidebarDependencies {
  getState: () => AppState;
  roots: {
    aside: HTMLElement;
    sidebarContext?: HTMLElement;
    sidebarLayout?: HTMLElement;
    setupCount?: HTMLElement;
  };
  registries: readonly Registry[];
  catalogIndex: RegistryCatalogIndex;
  policy: CatalogPolicy;
  basePath: () => string;
}

/** Owns taxonomy expansion, registry asset counts, facets, and browse-rail rendering. */
export function createShellSidebar({
  getState,
  roots,
  registries,
  catalogIndex,
  policy,
  basePath,
}: SidebarDependencies) {
  const taxonomy = policy.taxonomy;
  const expandedCategoryIds = new Set<string>();
  const collapsedCategoryIds = new Set<string>();

  const emptyAssetCounts = (): Record<AssetKindToken, number> => ({
    component: 0,
    block: 0,
    page: 0,
    template: 0,
    theme: 0,
    icon: 0,
    other: 0,
  });

  const directoryAssetCounts = emptyAssetCounts();
  const registryAssetCounts = new Map<string, Record<AssetKindToken, number>>();

  for (const [namespace, items] of Object.entries(catalogIndex.registries)) {
    const counts = emptyAssetCounts();

    for (const item of items) {
      const kind = assetKindForCatalogItem(item, policy, namespace);
      counts[kind] += 1;
    }

    registryAssetCounts.set(namespace, counts);

    for (const kind of [
      "component",
      "block",
      "page",
      "template",
      "theme",
      "icon",
      "other",
    ] as const) {
      if (counts[kind] > 0) directoryAssetCounts[kind] += 1;
    }
  }

  const sidebarFacetCache = new Map<string, ReturnType<typeof buildCatalogFacetSummary>>();

  function routeAssetKinds(): CatalogAssetKind[] {
    const route = getState().route;

    if (route.kind === "registry-assets") return [route.assetKind];

    const byKind: Partial<Record<CatalogRoute["kind"], CatalogAssetKind>> = {
      components: "component",
      component: "component",
      explore: "component",
      blocks: "block",
      block: "block",
      pages: "page",
      page: "page",
      templates: "template",
      template: "template",
      themes: "theme",
      theme: "theme",
      icons: "icon",
      "icon-category": "icon",
      "icon-family": "icon",
    };

    const assetKind = byKind[route.kind];

    return assetKind ? [assetKind] : getState().catalogAssetKinds;
  }

  function facetsForSidebar(): ReturnType<typeof buildCatalogFacetSummary> {
    const route = getState().route;

    const namespace =
      route.kind === "registry" || route.kind === "registry-assets" ? route.namespace : null;

    return buildCatalogFacetSummary(registries, catalogIndex, {
      policy,
      search: getState().searchTerm,
      registryNames: namespace ? [namespace] : getState().catalogRegistryNames,
      assetKinds: routeAssetKinds(),
      access: getState().catalogAccess,
    });
  }

  function sidebarContextForRoute(route: CatalogRoute): { label: string; route: CatalogRoute } {
    const sections = {
      components: { label: "Components", route: { kind: "components" } },
      blocks: { label: "Blocks", route: { kind: "blocks" } },
      pages: { label: "Pages", route: { kind: "pages" } },
      templates: { label: "Templates", route: { kind: "templates" } },
      themes: { label: "Themes", route: { kind: "themes" } },
      icons: { label: "Icons", route: { kind: "icons" } },
      registries: { label: "Registries", route: { kind: "registries" } },
      authors: { label: "Authors", route: { kind: "authors" } },
      compare: { label: "Compare", route: { kind: "compare" } },
    } satisfies SectionsLookupContract;

    const kind = {
      component: "components",
      explore: "components",
      block: "blocks",
      page: "pages",
      template: "templates",
      theme: "themes",
      "theme-editor": "themes",
      "icon-category": "icons",
      "icon-family": "icons",
      registry: "registries",
      "registry-assets": "registries",
    } satisfies KindLookupContract;

    return (
      new Map(Object.entries(sections)).get(
        new Map(Object.entries(kind)).get(route.kind) ?? route.kind,
      ) ?? { label: "Home", route: { kind: "home" } }
    );
  }

  function renderSidebarContext(): void {
    if (!roots.sidebarContext) return;
    const context = sidebarContextForRoute(getState().route);
    const href = catalogRoutePath(context.route, basePath());
    roots.sidebarContext.innerHTML =
      '<a class="sidebar-context-link" href="' +
      escapeHtml(href) +
      '" data-catalog-route="' +
      escapeHtml(href) +
      '">' +
      '<span class="sidebar-context-icon" aria-hidden="true">' +
      '<svg viewBox="0 0 16 16" width="14" height="14" fill="none">' +
      '<rect x="2" y="2" width="5" height="5" rx="1" stroke="currentColor"></rect>' +
      '<rect x="9" y="2" width="5" height="5" rx="1" stroke="currentColor"></rect>' +
      '<rect x="2" y="9" width="5" height="5" rx="1" stroke="currentColor"></rect>' +
      '<rect x="9" y="9" width="5" height="5" rx="1" stroke="currentColor"></rect>' +
      "</svg>" +
      "</span>" +
      '<span class="sidebar-context-label">' +
      escapeHtml(context.label) +
      "</span>" +
      '<span class="sidebar-context-end" aria-hidden="true"></span>' +
      "</a>";
  }

  function supportsBrowseLayout(route: CatalogRoute): boolean {
    return [
      "components",
      "blocks",
      "pages",
      "templates",
      "themes",
      "icons",
      "explore",
      "registries",
      "registry",
      "registry-assets",
      "icon-category",
      "icon-family",
    ].includes(route.kind);
  }

  function renderBrowseLayoutToggle(layout: RegistryDirectoryLayout): string {
    return (
      '<div class="sidebar-layout-strip">' +
      '<div class="sidebar-layout-toggle" role="group" aria-label="Result layout">' +
      '<button type="button" data-browse-layout="grid" aria-pressed="' +
      String(layout === "grid") +
      '">Grid</button>' +
      '<button type="button" data-browse-layout="list" aria-pressed="' +
      String(layout === "list") +
      '">List</button>' +
      "</div>" +
      "</div>"
    );
  }

  function fixedSidebarNamespace(route: CatalogRoute): string | null {
    if (route.kind === "registry" || route.kind === "registry-assets") return route.namespace;

    if (route.kind === "icon-family") return "@" + route.family;

    return null;
  }

  function filteredSidebarNavigation(
    contextFacets: ReturnType<typeof buildCatalogFacetSummary>,
    globalFacets: ReturnType<typeof buildCatalogFacetSummary>,
  ): string {
    const route = getState().route;
    const fixedNamespace = fixedSidebarNamespace(route);
    const fixedRegistry = fixedNamespace !== null;

    return renderCatalogSidebarNavigation(
      {
        ...contextFacets,
        registries: globalFacets.registries,
      },
      {
        kind: route.kind,
        canonicalIds: getState().catalogCanonicalIds,
        registryNames: fixedRegistry ? [] : getState().catalogRegistryNames,
        sort: getState().catalogSort,
        access: getState().catalogAccess,
        assetKinds: getState().catalogAssetKinds,
      },
      taxonomy,
      {
        showRegistrySort: !fixedRegistry,
        expandedCategoryIds: [...expandedCategoryIds],
        collapsedCategoryIds: [...collapsedCategoryIds],
        assetCounts:
          route.kind === "registry" || route.kind === "registry-assets"
            ? registryAssetCounts.get(route.namespace)
            : undefined,
      },
    );
  }

  function sidebarNavigation(): string {
    if (getState().route.kind === "registries") {
      return renderRegistryDirectorySidebar({
        layout: getState().registryLayout,
        sort: getState().registrySort,
        registryCount: registries.length,
        assetCounts: directoryAssetCounts,
        selectedAssetKinds: getState().catalogAssetKinds,
      });
    }

    if (
      ![
        "components",
        "blocks",
        "pages",
        "templates",
        "themes",
        "icons",
        "explore",
        "registry",
        "registry-assets",
        "icon-category",
        "icon-family",
      ].includes(getState().route.kind)
    )
      return "";

    const contextFacets = facetsForSidebar();
    let globalFacets = sidebarFacetCache.get("all:registries");

    if (!globalFacets) {
      globalFacets = buildCatalogFacetSummary(registries, catalogIndex, { policy });
      sidebarFacetCache.set("all:registries", globalFacets);
    }

    return filteredSidebarNavigation(contextFacets, globalFacets);
  }

  function renderSidebar(queued: ReadonlySet<string>, _batchCommand: string | null): void {
    renderSidebarContext();

    if (roots.setupCount) roots.setupCount.textContent = String(queued.size);

    const navigation = sidebarNavigation();

    const layout =
      getState().route.kind === "registries" ? getState().registryLayout : getState().catalogLayout;

    const layoutMarkup = supportsBrowseLayout(getState().route)
      ? renderBrowseLayoutToggle(layout)
      : "";

    if (roots.sidebarLayout) roots.sidebarLayout.innerHTML = layoutMarkup;
    roots.aside.innerHTML =
      (roots.sidebarLayout ? "" : layoutMarkup) +
      '<div class="sidebar-scroll-pane"><div class="desktop-browse-rail">' +
      navigation +
      "</div></div>";
  }

  function rememberSidebarTaxonomyToggle(target: HTMLElement): void {
    const group = target.closest("summary.sidebar-taxonomy-summary")?.parentElement;

    if (!group) return;

    if (!(group instanceof HTMLDetailsElement)) return;
    const id = group.getAttribute("data-sidebar-taxonomy-group");

    if (!id) return;

    if (group.open) {
      expandedCategoryIds.delete(id);
      collapsedCategoryIds.add(id);
    } else {
      expandedCategoryIds.add(id);
      collapsedCategoryIds.delete(id);
    }
  }

  return {
    renderSidebar,
    rememberSidebarTaxonomyToggle,
    registryAssetCountsFor: (namespace: string) => registryAssetCounts.get(namespace),
  };
}

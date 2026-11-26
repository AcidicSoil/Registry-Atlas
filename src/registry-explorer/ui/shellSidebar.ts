import { actionClasses } from "./primitives/actionClasses";
import { buildCatalogFacetSummary } from "../core/catalogQuery";
import { catalogRoutePath, type CatalogRoute } from "../core/catalogRoutes";
import { assetKindForCatalogItem, type CatalogAssetKind } from "../core/catalogCollections";
import type { Registry, RegistryCatalogIndex } from "../core/registry.schema";
import { registryCatalogItemIdentity } from "../core/registryCatalogIndex";
import type { CatalogPolicy } from "../core/catalogPolicy";
import {
  renderRegistryDirectoryControls,
  type RegistryDirectoryLayout,
} from "./registryDirectoryView";
import {
  renderCatalogSidebarNavigation,
  renderCatalogToolbarControls,
} from "./catalogSidebarNavigation";
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
    browseToolbar?: HTMLElement;
    setupCount?: HTMLElement;
  };
  registries: readonly Registry[];
  catalogIndex: RegistryCatalogIndex;
  policy: CatalogPolicy;
  basePath: () => string;
}

function emptyAssetCounts(): Record<AssetKindToken, number> {
  return {
    component: 0,
    block: 0,
    page: 0,
    template: 0,
    theme: 0,
    icon: 0,
    other: 0,
  };
}

function countRegistryItems(
  namespace: string,
  items: RegistryCatalogIndex["registries"][string],
  policy: CatalogPolicy,
  libraryItemCounts: Record<AssetKindToken, number>,
): Record<AssetKindToken, number> {
  const counts = emptyAssetCounts();
  const seen = new Set<string>();

  for (const item of items) {
    const kind = assetKindForCatalogItem(item, policy, namespace);
    counts[kind] += 1;
    const identity = registryCatalogItemIdentity(item.name);

    if (!seen.has(identity)) libraryItemCounts[kind] += 1;
    seen.add(identity);
  }

  return counts;
}

function collectSidebarAssetCounts(catalogIndex: RegistryCatalogIndex, policy: CatalogPolicy) {
  const directoryAssetCounts = emptyAssetCounts();
  const libraryItemCounts = emptyAssetCounts();
  const registryAssetCounts = new Map<string, Record<AssetKindToken, number>>();

  for (const [namespace, items] of Object.entries(catalogIndex.registries)) {
    const counts = countRegistryItems(namespace, items, policy, libraryItemCounts);

    registryAssetCounts.set(namespace, counts);

    // SAFETY: countRegistryItems returns only AssetKindToken keys from emptyAssetCounts.
    for (const kind of Object.keys(counts) as AssetKindToken[]) {
      if (counts[kind] > 0) directoryAssetCounts[kind] += 1;
    }
  }

  return { directoryAssetCounts, libraryItemCounts, registryAssetCounts };
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

  const { directoryAssetCounts, libraryItemCounts, registryAssetCounts } =
    collectSidebarAssetCounts(catalogIndex, policy);

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
      '<a class="sidebar-context-link grid h-9 min-w-0 grid-cols-[20px_minmax(0,1fr)_20px] items-center gap-1 rounded-[var(--atlas-radius-button)] px-2 text-sm text-atlas-muted-foreground no-underline hover:bg-atlas-secondary hover:text-atlas-foreground focus-visible:bg-atlas-secondary focus-visible:text-atlas-foreground" href="' +
      escapeHtml(href) +
      '" data-catalog-route="' +
      escapeHtml(href) +
      '">' +
      '<span class="sidebar-context-icon grid size-4 place-items-center text-current" aria-hidden="true">' +
      '<svg viewBox="0 0 16 16" width="14" height="14" fill="none">' +
      '<rect x="2" y="2" width="5" height="5" rx="1" stroke="currentColor"></rect>' +
      '<rect x="9" y="2" width="5" height="5" rx="1" stroke="currentColor"></rect>' +
      '<rect x="2" y="9" width="5" height="5" rx="1" stroke="currentColor"></rect>' +
      '<rect x="9" y="9" width="5" height="5" rx="1" stroke="currentColor"></rect>' +
      "</svg>" +
      "</span>" +
      '<span class="sidebar-context-label min-w-0 truncate">' +
      escapeHtml(context.label) +
      "</span>" +
      '<span class="sidebar-context-end size-4" aria-hidden="true"></span>' +
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
      '<div class="browse-layout-strip flex-none">' +
      '<div class="browse-layout-toggle grid h-[34px] grid-cols-2 gap-0.5 rounded-[var(--atlas-radius-button)] border border-atlas-border bg-atlas-card p-0.5 [&>button]:h-[26px] [&>button]:min-w-0 [&>button]:cursor-pointer [&>button]:rounded [&>button]:border-0 [&>button]:bg-transparent [&>button]:px-2.5 [&>button]:text-sm [&>button]:text-atlas-muted-foreground [&>button:hover]:bg-atlas-secondary [&>button:hover]:text-atlas-foreground [&>button[aria-pressed=true]]:bg-atlas-background [&>button[aria-pressed=true]]:font-semibold [&>button[aria-pressed=true]]:text-atlas-foreground [&>button[aria-pressed=true]]:inset-ring [&>button[aria-pressed=true]]:inset-ring-atlas-border" role="group" aria-label="Result layout">' +
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

  function renderBrowseSurfaces() {
    const state = getState();
    const route = state.route;

    if (!supportsBrowseLayout(route)) return { navigation: "", controls: "" };

    if (route.kind === "registries") {
      return {
        navigation: "",
        controls: renderRegistryDirectoryControls({
          layout: state.registryLayout,
          sort: state.registrySort,
          registryCount: registries.length,
          assetCounts: directoryAssetCounts,
          selectedAssetKinds: state.catalogAssetKinds,
        }),
      };
    }

    const facets = facetsForSidebar();
    const fixedRegistry = fixedSidebarNamespace(route) !== null;

    const selection = {
      kind: route.kind,
      canonicalIds: state.catalogCanonicalIds,
      registryNames: fixedRegistry ? [] : state.catalogRegistryNames,
      sort: state.catalogSort,
      access: state.catalogAccess,
      assetKinds: state.catalogAssetKinds,
    };

    const options = {
      showRegistrySort: !fixedRegistry,
      expandedCategoryIds: [...expandedCategoryIds],
      collapsedCategoryIds: [...collapsedCategoryIds],
      assetCounts:
        route.kind === "registry" || route.kind === "registry-assets"
          ? registryAssetCounts.get(route.namespace)
          : undefined,
    };

    return {
      navigation: renderCatalogSidebarNavigation(facets, selection, taxonomy, options),
      controls: renderCatalogToolbarControls(facets, selection, options),
    };
  }

  function renderSidebar(queued: ReadonlySet<string>, _batchCommand: string | null): void {
    renderSidebarContext();

    for (const [kind, count] of Object.entries(libraryItemCounts)) {
      const node = roots.aside.parentElement?.querySelector<HTMLElement>(
        `[data-sidebar-asset-count="${kind}"]`,
      );

      if (node) node.textContent = count.toLocaleString();
    }

    if (roots.setupCount) roots.setupCount.textContent = String(queued.size);

    const { navigation, controls } = renderBrowseSurfaces();

    const layout =
      getState().route.kind === "registries" ? getState().registryLayout : getState().catalogLayout;

    const layoutMarkup = supportsBrowseLayout(getState().route)
      ? renderBrowseLayoutToggle(layout)
      : "";

    const clearMarkup = supportsBrowseLayout(getState().route)
      ? `<button class="link-button catalog-filter-clear min-h-[30px] ${actionClasses.link}" type="button" data-catalog-clear>Clear all</button>`
      : "";

    if (roots.browseToolbar)
      roots.browseToolbar.innerHTML =
        '<div class="browse-filter-group flex flex-wrap items-center gap-2" role="group" aria-label="Catalog filters">' +
        controls +
        "</div>" +
        clearMarkup +
        layoutMarkup;

    roots.aside.innerHTML =
      '<div class="sidebar-scroll-pane min-h-0 flex-auto overflow-visible overscroll-contain"><div class="desktop-browse-rail grid min-w-0 gap-0 pb-[18px]">' +
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

import type { Registry, RegistryCatalogIndex } from "../core/registry.schema";
import type { CatalogRoute } from "../core/catalogRoutes";
import { findRegistryCatalogItem } from "../core/registryCatalogIndex";
import { buildInstallQueueBatchState } from "../core/installQueue";
import { renderSetupView } from "./setupView";
import { renderEvidenceUnavailable } from "./catalogCollectionView";
import { renderCatalogBreadcrumbs } from "./catalogBreadcrumbs";
import { renderRegistryHomepageLink } from "./renderSafety";
import { isDetailRoute } from "./shellDetailViews";
import { renderCopyFeedback } from "./shellSetup";
import type { createShellSidebar } from "./shellSidebar";
import type { createShellCatalogViews } from "./shellCatalogViews";
import type { createShellDetailViews } from "./shellDetailViews";
import type { createBrowseFeedController } from "./shellBrowseFeed";
import type { createShellSetupController } from "./shellSetup";
import type { AppState } from "./shellState";

type KindLookupContract = Readonly<Record<string, string>>;

interface RendererDependencies {
  getState: () => AppState;
  roots: {
    contentHeader: HTMLElement;
    contentBody: HTMLElement;
    tabs: NodeListOf<Element>;
    sidebarCollectionCurrent?: HTMLElement;
  };
  registries: readonly Registry[];
  catalogIndex: RegistryCatalogIndex;
  basePath: () => string;
  sidebar: Pick<ReturnType<typeof createShellSidebar>, "renderSidebar">;
  views: ReturnType<typeof createShellCatalogViews>;
  detailViews: ReturnType<typeof createShellDetailViews>;
  feed: Pick<
    ReturnType<typeof createBrowseFeedController>,
    "updateFeedSemantics" | "observeNextPage"
  >;
  setup: Pick<ReturnType<typeof createShellSetupController>, "renderReplacementNotice">;
}

const ROUTE_PRIMARY_VIEWS = {
  home: "home",
  authors: "authors",
  components: "discover",
  component: "discover",
  explore: "discover",
  registries: "registries",
  registry: "registries",
  "registry-assets": "registries",
  blocks: "blocks",
  block: "blocks",
  pages: "pages",
  page: "pages",
  templates: "templates",
  template: "templates",
  themes: "themes",
  theme: "themes",
  "theme-editor": "themes",
  icons: "icons",
  "icon-family": "icons",
  "icon-category": "icons",
  compare: "compare",
} satisfies KindLookupContract;

function primaryViewForRoute(route: CatalogRoute): string | null {
  return new Map(Object.entries(ROUTE_PRIMARY_VIEWS)).get(route.kind) ?? null;
}

/** Owns route dispatch, app chrome, and render fallback; state mutations stay in shell. */
export function createShellRenderer({
  getState,
  roots,
  registries,
  catalogIndex,
  basePath,
  sidebar,
  views,
  detailViews,
  feed,
  setup,
}: RendererDependencies) {
  function renderLandingRoute(): boolean {
    const state = getState();

    switch (state.route.kind) {
      case "home":
        views.renderHome();

        return true;
      case "components":
        views.renderComponentsRoute();

        return true;
      case "blocks":
        views.renderTypedCollection(
          "block",
          "Blocks",
          "Composed blocks published by registries.",
          "block",
        );

        return true;
      case "pages":
        views.renderTypedCollection(
          "page",
          "Pages",
          "Full-page compositions published by registries.",
          "page",
        );

        return true;
      case "explore":
        views.renderExploreRoute();

        return true;
      default:
        return renderDirectoryLandingRoute();
    }
  }

  function renderDirectoryLandingRoute(): boolean {
    const state = getState();

    switch (state.route.kind) {
      case "authors":
        views.renderAuthorsRoute();

        return true;
      case "registries":
        views.renderRegistries();

        return true;
      case "registry":
        views.renderRegistryProfile(state.route.namespace);

        return true;
      case "registry-assets":
        views.renderRegistryProfile(state.route.namespace, state.route.assetKind);

        return true;
      default:
        return false;
    }
  }

  function renderDetailsAndThemes(queued: ReadonlySet<string>): boolean {
    const state = getState();

    if (isDetailRoute(state.route)) {
      detailViews.renderDetail(state.route, queued);

      return true;
    }

    switch (state.route.kind) {
      case "templates":
        views.renderTypedCollection(
          "template",
          "Templates",
          "Templates published by registries.",
          "template",
        );

        return true;
      case "themes":
        views.renderTypedCollection(
          "theme",
          "Themes",
          "Themes and styles published by registries.",
          "theme",
        );

        return true;
      case "theme-editor":
        renderEvidenceUnavailable(
          roots.contentHeader,
          roots.contentBody,
          "Theme editor",
          "Theme editor isn't available because registries use different token formats.",
          "Editing will stay disabled until Registry Atlas can read those formats consistently.",
        );

        return true;
      default:
        return false;
    }
  }

  function renderIconAndOtherRoute(): boolean {
    const state = getState();

    switch (state.route.kind) {
      case "icons":
        views.renderTypedCollection(
          "icon",
          "Icons",
          "Items identified as icons or grouped in icon categories. This is not a searchable glyph index.",
          "icon",
        );

        return true;
      case "icon-category":
        views.renderIconCategory(state.route.category);

        return true;
      case "icon-family":
        views.renderIconFamily(state.route.family);

        return true;
      case "compare":
        detailViews.renderCompare();

        return true;
      case "not-found":
        renderEvidenceUnavailable(
          roots.contentHeader,
          roots.contentBody,
          "Route not found",
          "This address doesn't match a Registry Atlas page.",
          "Check the URL or return home.",
        );

        return true;
      default:
        return false;
    }
  }

  function renderRouteContent(queued: ReadonlySet<string>): void {
    const state = getState();

    if (state.route.kind === "setup" || state.route.kind === "setup-review") {
      renderSetupView(
        roots.contentHeader,
        roots.contentBody,
        state.installQueue,
        state.setupInstructions,
        state.route.kind === "setup-review",
      );

      return;
    }

    if (renderLandingRoute()) return;

    if (renderDetailsAndThemes(queued)) return;
    renderIconAndOtherRoute();
  }

  function renderHeaderDecorations(): void {
    const state = getState();

    const breadcrumbTitle =
      "namespace" in state.route && "slug" in state.route
        ? findRegistryCatalogItem(catalogIndex, state.route.namespace, state.route.slug)?.title
        : undefined;

    roots.contentHeader.insertAdjacentHTML(
      "afterbegin",
      renderCatalogBreadcrumbs(state.route, basePath(), breadcrumbTitle),
    );

    // A registry homepage is one route-level action, not an item/source fallback.
    // Include it even when a known registry's item route is unavailable.
    const route = state.route;

    const registryForHeader = registryForHeaderRoute(route);

    const homepage = registryForHeader ? renderRegistryHomepageLink(registryForHeader.url) : "";

    if (
      homepage &&
      (!isDetailRoute(route) || !roots.contentHeader.innerHTML.includes("item-quick-links"))
    ) {
      roots.contentHeader.innerHTML += `<div class="registry-header-homepage-action">${homepage}</div>`;
    }

    roots.contentHeader.insertAdjacentHTML("beforeend", renderCopyFeedback(state.copyFeedback));

    setup.renderReplacementNotice(roots.contentHeader);
  }

  function registryForHeaderRoute(route: CatalogRoute): Registry | undefined {
    if (route.kind === "icon-family")
      return registries.find((registry) => registry.name.slice(1) === route.family);

    return "namespace" in route
      ? registries.find((registry) => registry.name === route.namespace)
      : undefined;
  }

  function render(): void {
    const state = getState();

    try {
      renderTabs();
      const queued = new Set(state.installQueue.map((entry) => entry.token));
      const batch = buildInstallQueueBatchState(state.installQueue);
      sidebar.renderSidebar(queued, batch.command);

      renderRouteContent(queued);

      renderHeaderDecorations();
      feed.updateFeedSemantics();
      feed.observeNextPage();
    } catch (error) {
      console.error("Registry Explorer: Render failed", error);
      roots.contentBody.innerHTML =
        '<div class="empty-state">Something went wrong while rendering this view.</div>';
    }
  }

  function renderTabs(): void {
    const state = getState();

    const active = primaryViewForRoute(state.route);

    const collectionNames = new Map([
      ["discover", "Components"],
      ["blocks", "Blocks"],
      ["pages", "Pages"],
      ["templates", "Templates"],
      ["themes", "Themes"],
      ["icons", "Icons"],
    ]);

    if (roots.sidebarCollectionCurrent) {
      roots.sidebarCollectionCurrent.textContent = collectionNames.get(active ?? "") ?? "";
    }

    roots.tabs.forEach((tab) => {
      const tabView = tab.getAttribute("data-view");
      tab.classList.toggle("nav-item-active", tabView === active);

      if (tabView === active) tab.setAttribute("aria-current", "page");
      else tab.removeAttribute("aria-current");
    });
  }

  return { render };
}

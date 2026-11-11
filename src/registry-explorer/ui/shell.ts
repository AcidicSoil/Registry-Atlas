/** Named map contract for dynamic keys in this module. */
type ReplacementsLookupContract = Readonly<Record<string, CatalogRoute>>;

import { isInputString } from "../core/inputChecks";
import type { Registry, RegistryCatalogIndex } from "../core/registry.schema";
import type { MirrorValidationIssue } from "../core/registryMirror";
import type { RegistryMirrorMeta } from "../data/loadRegistries";

import type { RegistryDirectorySort } from "../core/registryDirectory";
import type { CatalogRoute, CatalogSort } from "../core/catalogRoutes";
import { catalogTaxonomyNodeMap } from "../core/catalogTaxonomy";
import type { CatalogPolicy } from "../core/catalogPolicy";
import { createCatalogInteractions } from "./shellInteractions";
import { createBrowseFeedController } from "./shellBrowseFeed";
import { createShellSidebar } from "./shellSidebar";
import { createShellCatalogViews } from "./shellCatalogViews";
import { createShellDetailViews } from "./shellDetailViews";
import { createShellRenderer } from "./shellRenderer";
import { createShellSetupController } from "./shellSetup";
import { createFocusIdentity, type AppState, type FocusIdentity } from "./shellState";

import { formatBrowseRouteUrl, hydrateBrowseRouteState } from "./browseRouteState";

import { nextRegistryIconCandidate } from "./registryIdentity";
import { buildAuthorDirectory } from "../core/catalogAuthors";

export interface ShellOptions {
  registries: readonly Registry[];
  catalogIndex: RegistryCatalogIndex;
  policy: CatalogPolicy;
  mirrorMeta: RegistryMirrorMeta;
  mirrorWarnings: readonly MirrorValidationIssue[];
  fetchImpl?: typeof fetch;
  roots: {
    aside: HTMLElement;
    contentHeader: HTMLElement;
    contentBody: HTMLElement;
    tabs: NodeListOf<Element>;
    searchInput: HTMLInputElement;
    sidebarContext?: HTMLElement;
    sidebarLayout?: HTMLElement;
    sidebarCollectionCurrent?: HTMLElement;
    setupCount?: HTMLElement;
  };
}

function catalogBasePath(): string {
  const configured = import.meta.env.BASE_URL;

  if (configured && configured !== "/") return configured;

  return window.location.pathname === "/Registry-Atlas" ||
    window.location.pathname.startsWith("/Registry-Atlas/")
    ? "/Registry-Atlas/"
    : configured || "/";
}

export interface ShellController {
  dispose(): void;
}

export function initRegistryExplorer(options: ShellOptions): ShellController {
  const lifetime = new AbortController();

  const listen = (
    target: EventTarget,
    event: string,
    handler: EventListenerOrEventListenerObject,
    capture = false,
  ): void => {
    target.addEventListener(event, handler, { signal: lifetime.signal, capture });
  };

  const { registries, catalogIndex, roots, policy } = options;
  const taxonomy = policy.taxonomy;
  const taxonomyIds = new Set(catalogTaxonomyNodeMap(taxonomy).keys());
  const fetchImpl = options.fetchImpl ?? fetch;

  const authorRows = buildAuthorDirectory(catalogIndex);

  const setup = createShellSetupController({
    getState: () => state,
    setState: (partial) => setState(partial),
    navigate: (route, historyMode, extra) => navigate(route, historyMode, extra),
    render: () => renderer.render(),
  });

  const setupDraft = setup.readSavedSetup();

  setup.restorePendingReplacement(setupDraft.items);

  let state: AppState = {
    ...hydrateBrowseRouteState(
      window.location.pathname,
      window.location.search,
      catalogBasePath(),
      registries,
      policy,
    ),
    returnRoute: null,
    installQueue: setupDraft.items,
    setupInstructions: setupDraft.instructions,
    copyFeedback: null,
    facetSearchTerms: {},
  };

  roots.searchInput.value = state.searchTerm;

  const sidebar = createShellSidebar({
    getState: () => state,
    roots,
    registries,
    catalogIndex,
    policy,
    basePath: catalogBasePath,
  });

  const views = createShellCatalogViews({
    getState: () => state,
    roots,
    registries,
    catalogIndex,
    policy,
    authorRows,
    registryAssetCountsFor: sidebar.registryAssetCountsFor,
    basePath: catalogBasePath,
  });

  const detailViews = createShellDetailViews({
    getState: () => state,
    render: () => renderer.render(),
    roots,
    registries,
    catalogIndex,
    policy,
    fetchImpl,
    signal: lifetime.signal,
    basePath: catalogBasePath,
  });

  const feed = createBrowseFeedController({
    body: roots.contentBody,
    getPage: () => state.discoveryPage,
    setPage: (page) => {
      state.discoveryPage = page;
    },
    render: () => renderer.render(),
    signal: lifetime.signal,
  });

  const renderer = createShellRenderer({
    getState: () => state,
    roots,
    registries,
    catalogIndex,
    basePath: catalogBasePath,
    sidebar,
    views,
    detailViews,
    feed,
    setup,
  });

  const setState = (
    partial: Partial<AppState>,
    historyMode: "push" | "replace" = "replace",
    focusIdentity: FocusIdentity | null = null,
  ) => {
    if (lifetime.signal.aborted) return;
    applyStateUpdate(partial, historyMode, focusIdentity);
  };

  function applyStateUpdate(
    partial: Partial<AppState>,
    historyMode: "push" | "replace",
    focusIdentity: FocusIdentity | null,
  ): void {
    const routeChanged =
      partial.route !== undefined &&
      catalogRouteIdentity(partial.route) !== catalogRouteIdentity(state.route);

    if (routeChanged) feed.rememberBrowseRoute();

    state = { ...state, ...partial };

    if (partial.installQueue !== undefined || partial.setupInstructions !== undefined)
      setup.saveSetupDraft();

    if (routeChanged && partial.copyFeedback === undefined) state.copyFeedback = null;
    syncUrlState(state, policy, historyMode);
    renderer.render();

    if (focusIdentity) restoreControlFocus(focusIdentity);
  }

  function navigate(
    route: CatalogRoute,
    historyMode: "push" | "replace" = "push",
    extra: Partial<AppState> = {},
  ): void {
    setState(
      {
        route,
        discoveryPage: 1,
        copyFeedback: null,
        ...extra,
      },
      historyMode,
    );
  }

  function restoreControlFocus(identity: FocusIdentity): void {
    const candidates = [
      ...Array.from(roots.contentBody.querySelectorAll<HTMLElement>(identity.selector)),
      ...Array.from(roots.aside.querySelectorAll<HTMLElement>(identity.selector)),
    ];

    const equivalent = candidates.find((candidate) =>
      identity.attributes.every(([name, value]) => candidate.getAttribute(name) === value),
    );

    (equivalent ?? candidates[0])?.focus();
  }

  function isModifiedNavigationClick(click: MouseEvent): boolean {
    return click.button === 1 || click.ctrlKey || click.metaKey || click.shiftKey || click.altKey;
  }

  roots.tabs.forEach((tab) =>
    listen(tab, "click", (event) => {
      // SAFETY: Navigation click events originate from DOM click listeners attached to anchor controls.
      const click = event as MouseEvent;

      if (isModifiedNavigationClick(click)) return;
      event.preventDefault();
      const view = tab.getAttribute("data-view");

      // SAFETY: The UI event is dispatched by this controlled DOM node or the value was checked against this handler’s finite selection set.
      const resetBrowse = {
        searchTerm: "",
        catalogRegistryNames: [],
        catalogItemTypes: [],
        catalogCategories: [],
        catalogAssetKinds: [],
        catalogCanonicalIds: [],
        catalogAccess: [],
        catalogSort: "name" as CatalogSort,
        registrySort: "name" as RegistryDirectorySort,
      };

      const route = new Map<string, CatalogRoute>([
        ["home", { kind: "home" }],
        ["discover", { kind: "components" }],
        ["blocks", { kind: "blocks" }],
        ["pages", { kind: "pages" }],
        ["templates", { kind: "templates" }],
        ["themes", { kind: "themes" }],
        ["icons", { kind: "icons" }],
        ["registries", { kind: "registries" }],
        ["authors", { kind: "authors" }],
        ["compare", { kind: "compare" }],
      ]).get(view ?? "");

      if (route) {
        tab.closest?.("details")?.removeAttribute("open");
        navigate(route, "push", resetBrowse);
      }
    }),
  );

  function routeForGlobalSearch(route: CatalogRoute): CatalogRoute {
    const replacements = {
      home: { kind: "components" },
      "not-found": { kind: "components" },
      "theme-editor": { kind: "components" },
      component: { kind: "components" },
      block: { kind: "blocks" },
      page: { kind: "pages" },
      template: { kind: "templates" },
      theme: { kind: "themes" },
      "icon-category": { kind: "icons" },
      "icon-family": { kind: "icons" },
    } satisfies ReplacementsLookupContract;

    return new Map(Object.entries(replacements)).get(route.kind) ?? route;
  }

  listen(roots.searchInput, "input", () => {
    setState({
      route: routeForGlobalSearch(state.route),
      searchTerm: roots.searchInput.value,
      copyFeedback: null,
      discoveryPage: 1,
    });
  });

  listen(roots.contentBody, "click", (event) => {
    // SAFETY: This listener is attached to the owned content root; delegated clicks target its own controls.
    const target = event.target as HTMLElement | null;

    if (target?.closest?.("[data-scroll-load-more]")) feed.loadNextPage();
  });

  listen(roots.contentBody, "input", (event) => {
    // SAFETY: The current target belongs to the app-owned content surface.
    const edited = event.target as HTMLInputElement;

    if (edited.hasAttribute?.("data-setup-instructions")) {
      state.setupInstructions = edited.value.slice(0, 2000);
      setup.saveSetupDraft();

      return;
    }
    // SAFETY: The UI event is dispatched by this controlled DOM node or the value was checked against this handler’s finite selection set.

    const target = event.target as HTMLInputElement;
    const control = target.closest("[data-compare-search]");
    const dimension = control?.getAttribute("data-compare-search");

    if (!control || !dimension) return;
    const key = `compare:${dimension}`;
    const value = target.value;

    const focusIdentity = createFocusIdentity(control, "[data-compare-search]", [
      "data-compare-search",
    ]);

    setState(
      { facetSearchTerms: { ...state.facetSearchTerms, [key]: value }, discoveryPage: 1 },
      "replace",
      focusIdentity,
    );
  });

  function readRegistryIconCandidates(image: HTMLImageElement): string[] {
    try {
      const parsed: unknown = JSON.parse(
        image.getAttribute("data-registry-icon-candidates") ?? "[]",
      );

      return Array.isArray(parsed)
        ? parsed.filter((value): value is string => isInputString(value))
        : [];
    } catch {
      return [];
    }
  }

  function handleRegistryIconError(event: Event): void {
    // SAFETY: The UI event is dispatched by this controlled DOM node or the value was checked against this handler’s finite selection set.
    const image = event.target as HTMLImageElement | null;

    if (!image?.hasAttribute?.("data-registry-icon-image")) return;
    const candidates = readRegistryIconCandidates(image);
    const current = Number.parseInt(image.getAttribute("data-registry-icon-index") ?? "0", 10);
    const next = nextRegistryIconCandidate(candidates, Number.isFinite(current) ? current : 0);

    if (next) {
      image.setAttribute("data-registry-icon-index", String(next.index));
      image.src = next.src;

      return;
    }

    image.hidden = true;
    image.closest("[data-registry-icon]")?.setAttribute("data-registry-icon-failed", "true");
  }

  // Native details toggle events are asynchronous. Record intent synchronously
  // before a filter or sort action replaces the sidebar DOM.
  listen(roots.aside, "click", (event) => {
    // SAFETY: The aside owns all interactive targets passed to handleClick.
    const target = event.target as HTMLElement;
    sidebar.rememberSidebarTaxonomyToggle(target);

    // SAFETY: The app-owned sidebar dispatches clicks from its rendered controls.
    interactions.handleClick(event.target as HTMLElement);
  });

  // SAFETY: The controlled layout host contains the same trusted browse controls as the sidebar.
  if (roots.sidebarLayout)
    listen(roots.sidebarLayout, "click", (event) => {
      // SAFETY: Sidebar layout clicks originate from its owned browse controls.
      interactions.handleClick(event.target as HTMLElement);
    });
  listen(roots.contentHeader, "click", (event) => {
    // SAFETY: The UI event is dispatched by this controlled DOM node or the value was checked against this handler’s finite selection set.
    const target = event.target as HTMLElement;

    const link = target.closest<HTMLAnchorElement>(
      "a[data-catalog-route],a[data-profile-registry]",
    );

    // SAFETY: The UI event is dispatched by this controlled DOM node or the value was checked against this handler’s finite selection set.
    const mouse = event as MouseEvent;

    if (
      link &&
      mouse.button === 0 &&
      !mouse.ctrlKey &&
      !mouse.metaKey &&
      !mouse.shiftKey &&
      !mouse.altKey
    ) {
      event.preventDefault();
    }

    interactions.handleClick(target);
  });
  listen(roots.contentHeader, "error", handleRegistryIconError, true);
  listen(roots.contentBody, "error", handleRegistryIconError, true);
  listen(roots.contentBody, "click", (event) => {
    // SAFETY: The UI event is dispatched by this controlled DOM node or the value was checked against this handler’s finite selection set.
    const target = event.target as HTMLElement;

    const link = target.closest<HTMLAnchorElement>(
      "a[data-view-item-registry],a[data-profile-registry],a[data-catalog-route]",
    );

    if (link) {
      // SAFETY: The UI event is dispatched by this controlled DOM node or the value was checked against this handler’s finite selection set.
      const mouse = event as MouseEvent;

      if (mouse.button === 1 || mouse.ctrlKey || mouse.metaKey || mouse.shiftKey || mouse.altKey)
        return;
      event.preventDefault?.();
    }

    interactions.handleClick(target);
  });

  const interactions = createCatalogInteractions({
    getState: () => state,
    setState,
    navigate,
    handleInstall: setup.handleInstall,
    basePath: catalogBasePath,
    roots,
    taxonomyIds,
    authorRows,
  });

  listen(window, "popstate", () => {
    state = {
      ...state,
      ...hydrateBrowseRouteState(
        window.location.pathname,
        window.location.search,
        catalogBasePath(),
        registries,
        policy,
      ),
      returnRoute: null,
      copyFeedback: null,
    };
    roots.searchInput.value = state.searchTerm;
    renderer.render();
    feed.restoreBrowseState();
  });

  syncUrlState(state, policy);
  renderer.render();

  return {
    dispose(): void {
      if (lifetime.signal.aborted) return;
      lifetime.abort();
      feed.dispose();
    },
  };
}

function syncUrlState(
  state: AppState,
  policy: CatalogPolicy,
  historyMode: "push" | "replace" = "replace",
): void {
  const next = formatBrowseRouteUrl(state, catalogBasePath(), window.location.hash, policy);

  if (!next || next === window.location.pathname + window.location.search + window.location.hash)
    return;

  const history = historyMode === "push" ? window.history.pushState : window.history.replaceState;
  history.call(window.history, {}, "", next);
}

function catalogRouteIdentity(route: CatalogRoute): string {
  return JSON.stringify(route);
}

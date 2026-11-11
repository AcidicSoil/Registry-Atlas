import { parseCatalogRoute, type CatalogRoute } from "../core/catalogRoutes";
import type { CatalogAssetKind } from "../core/catalogCollections";
import {
  createFocusIdentity,
  type AppState,
  type NavigateShell,
  type SetShellState,
} from "./shellState";

interface CatalogInteractionDependencies {
  getState: () => AppState;
  setState: SetShellState;
  navigate: NavigateShell;
  handleInstall: (target: HTMLElement) => boolean;
  basePath: () => string;
  roots: { searchInput: HTMLInputElement };
  taxonomyIds: ReadonlySet<string>;
  authorRows: ReadonlyArray<{ name: string }>;
}

function toggle<T>(values: readonly T[], value: T): T[] {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

/** Delegated catalog interactions share the shell's single state transaction. */
export function createCatalogInteractions({
  getState,
  setState,
  navigate,
  handleInstall,
  basePath,
  roots,
  taxonomyIds,
  authorRows,
}: CatalogInteractionDependencies) {
  function handleCatalogRouteClick(target: HTMLElement): boolean {
    const directPath = target.closest("[data-catalog-route]")?.getAttribute("data-catalog-route");

    if (directPath) {
      const parsed = parseCatalogRoute(
        new URL(directPath, window.location.href).pathname,
        basePath(),
      );

      if (parsed)
        navigate(parsed, "push", {
          searchTerm: "",
          catalogRegistryNames: [],
          catalogItemTypes: [],
          catalogCategories: [],
          catalogAssetKinds: [],
          catalogCanonicalIds: [],
          catalogAccess: [],
          catalogSort: "name",
          catalogReviewed: "all",
        });

      return true;
    }

    if (target.closest("[data-catalog-clear]")) {
      roots.searchInput.value = "";
      setState(
        {
          searchTerm: "",
          catalogRegistryNames: [],
          catalogItemTypes: [],
          catalogCategories: [],
          catalogAssetKinds: [],
          catalogCanonicalIds: [],
          catalogAccess: [],
          catalogReviewed: "all",
          catalogSort: "name",
          discoveryPage: 1,
        },
        "push",
      );

      return true;
    }

    return false;
  }

  function handleCatalogFiltersClick(target: HTMLElement): boolean {
    const registryControl = target.closest("[data-catalog-registry-value]");

    if (registryControl) {
      const value = registryControl.getAttribute("data-catalog-registry-value") ?? "";
      setState(
        {
          catalogRegistryNames: value ? toggle(getState().catalogRegistryNames, value) : [],
          discoveryPage: 1,
        },
        "push",
        createFocusIdentity(registryControl, "[data-catalog-registry-value]", [
          "data-catalog-registry-value",
        ]),
      );

      return true;
    }

    return handleCanonicalFilterClick(target);
  }

  function handleCanonicalFilterClick(target: HTMLElement): boolean {
    const canonicalControl = target.closest("[data-catalog-canonical-value]");

    if (canonicalControl) {
      const value = canonicalControl.getAttribute("data-catalog-canonical-value") ?? "";

      if (value && !taxonomyIds.has(value)) return true;
      setState(
        {
          catalogCanonicalIds: value && getState().catalogCanonicalIds[0] !== value ? [value] : [],
          discoveryPage: 1,
        },
        "push",
        createFocusIdentity(canonicalControl, "[data-catalog-canonical-value]", [
          "data-catalog-canonical-value",
        ]),
      );

      return true;
    }

    return false;
  }

  function handleCatalogCategoryClick(target: HTMLElement): boolean {
    return handleCategorySelection(target) || handleAccessSelection(target);
  }

  function handleCategorySelection(target: HTMLElement): boolean {
    const categoryControl = target.closest("[data-catalog-category-value]");

    if (categoryControl) {
      const value = categoryControl.getAttribute("data-catalog-category-value") ?? "";
      setState(
        {
          catalogCategories: value ? toggle(getState().catalogCategories, value) : [],
          discoveryPage: 1,
        },
        "push",
        createFocusIdentity(categoryControl, "[data-catalog-category-value]", [
          "data-catalog-category-value",
        ]),
      );

      return true;
    }

    return false;
  }

  function handleAccessSelection(target: HTMLElement): boolean {
    const accessControl = target.closest("[data-catalog-access-value]");

    if (accessControl) {
      const value = accessControl.getAttribute("data-catalog-access-value") ?? "";

      if (value && value !== "free" && value !== "paid") return true;
      // SAFETY: The UI event is dispatched by this controlled DOM node or the value was checked against this handler’s finite selection set.
      setState(
        {
          catalogAccess:
            value && getState().catalogAccess[0] !== value ? [value as "free" | "paid"] : [],
          discoveryPage: 1,
        },
        "push",
        createFocusIdentity(accessControl, "[data-catalog-access-value]", [
          "data-catalog-access-value",
        ]),
      );

      return true;
    }

    return false;
  }

  function handleCatalogLayoutClick(target: HTMLElement): boolean {
    return (
      handleBrowseLayoutClick(target) ||
      handleCatalogSortClick(target) ||
      handleRegistrySortClick(target)
    );
  }

  function handleBrowseLayoutClick(target: HTMLElement): boolean {
    const browseLayoutControl = target.closest("[data-browse-layout]");

    if (browseLayoutControl) {
      const value = browseLayoutControl.getAttribute("data-browse-layout");

      if (value === "grid" || value === "list") {
        setState(
          {
            registryLayout: value,
            catalogLayout: value,
            discoveryPage: 1,
          },
          "push",
          createFocusIdentity(browseLayoutControl, "[data-browse-layout]", ["data-browse-layout"]),
        );
      }

      return true;
    }

    return false;
  }

  function handleCatalogSortClick(target: HTMLElement): boolean {
    const catalogSortControl = target.closest("[data-catalog-sort-value]");

    if (catalogSortControl) {
      const value = catalogSortControl.getAttribute("data-catalog-sort-value");

      if (value === "name" || value === "registry") {
        setState(
          { catalogSort: value, discoveryPage: 1 },
          "push",
          createFocusIdentity(catalogSortControl, "[data-catalog-sort-value]", [
            "data-catalog-sort-value",
          ]),
        );
      }

      return true;
    }

    return false;
  }

  function handleRegistrySortClick(target: HTMLElement): boolean {
    const registrySortControl = target.closest("[data-registry-sort-value]");

    if (registrySortControl) {
      const value = registrySortControl.getAttribute("data-registry-sort-value");

      if (value === "name" || value === "item-count-desc") {
        setState(
          { registrySort: value, discoveryPage: 1 },
          "push",
          createFocusIdentity(registrySortControl, "[data-registry-sort-value]", [
            "data-registry-sort-value",
          ]),
        );
      }

      return true;
    }

    return false;
  }

  function handleCatalogAssetsClick(target: HTMLElement): boolean {
    const values: Array<[selector: string, attribute: string]> = [
      ["[data-registry-asset-value]", "data-registry-asset-value"],
      ["[data-asset-kind-value]", "data-asset-kind-value"],
    ];

    for (const [selector, attribute] of values) {
      const control = target.closest(selector);

      if (!control) continue;
      const raw = control.getAttribute(attribute) ?? "";

      if (
        raw &&
        !["component", "block", "page", "template", "theme", "icon", "other"].includes(raw)
      )
        return true;
      // SAFETY: The UI event is dispatched by this controlled DOM node or the value was checked against this handler’s finite selection set.
      const value = raw as CatalogAssetKind | "";
      setState(
        {
          catalogAssetKinds: value && getState().catalogAssetKinds[0] !== value ? [value] : [],
          discoveryPage: 1,
        },
        "push",
        createFocusIdentity(control, selector, [attribute]),
      );

      return true;
    }

    return false;
  }

  function handleCatalogAuthorClick(target: HTMLElement): boolean {
    const authorSelected = target
      .closest("[data-author-select]")
      ?.getAttribute("data-author-select");

    if (authorSelected && authorRows.some((row) => row.name === authorSelected)) {
      setState({ authorIdentity: authorSelected, searchTerm: "", discoveryPage: 1 }, "push");

      return true;
    }

    if (target.closest("[data-author-clear]")) {
      setState({ authorIdentity: null, searchTerm: "", discoveryPage: 1 }, "push");

      return true;
    }

    return handleDiscoveryPageClick(target);
  }

  function handleDiscoveryPageClick(target: HTMLElement): boolean {
    const page = target.closest("[data-discovery-page]")?.getAttribute("data-discovery-page");

    if (page) {
      const nextPage = Number(page);

      if (Number.isInteger(nextPage) && nextPage > 0)
        setState({ discoveryPage: nextPage, copyFeedback: null }, "push");

      return true;
    }

    return false;
  }

  function handleComparisonClick(target: HTMLElement): boolean {
    const compareRegistry = target
      .closest("[data-compare-registry]")
      ?.getAttribute("data-compare-registry");

    if (compareRegistry) {
      const selected = getState().compareRegistryNames.includes(compareRegistry);

      if (!selected && getState().compareRegistryNames.length >= 4) return true;
      setState(
        {
          compareRegistryNames: toggle(getState().compareRegistryNames, compareRegistry),
          discoveryPage: 1,
        },
        "push",
        createFocusIdentity(target.closest("[data-compare-registry]"), "[data-compare-registry]", [
          "data-compare-registry",
        ]),
      );

      return true;
    }

    const profile = target
      .closest("[data-profile-registry]")
      ?.getAttribute("data-profile-registry");

    if (profile) {
      navigate({ kind: "registry", namespace: profile }, "push", {
        searchTerm: "",
        catalogCategories: [],
        catalogAssetKinds: [],
        catalogCanonicalIds: [],
        catalogAccess: [],
      });

      return true;
    }

    return false;
  }

  function handleCatalogItemClick(target: HTMLElement): boolean {
    return handleDetailSelection(target) || handleDetailReturn(target);
  }

  function handleDetailSelection(target: HTMLElement): boolean {
    const item = target.closest("[data-view-item-registry]");

    if (item) {
      const namespace = item.getAttribute("data-view-item-registry");
      const slug = item.getAttribute("data-view-item-slug");
      const kind = item.getAttribute("data-view-item-kind");

      if (!namespace || !slug) return true;
      const knownKinds = ["block", "page", "template", "theme"] as const;
      const routeKind = knownKinds.find((value) => value === kind) ?? "component";
      const route: CatalogRoute = { kind: routeKind, namespace, slug };
      setState({ route, returnRoute: getState().route, copyFeedback: null }, "push");

      return true;
    }

    return false;
  }

  function handleDetailReturn(target: HTMLElement): boolean {
    if (target.closest("[data-back-from-item]")) {
      navigate(getState().returnRoute ?? { kind: "components" }, "push", { returnRoute: null });

      return true;
    }

    if (target.closest("[data-back-to-results]")) {
      navigate({ kind: "registries" });
    }

    return false;
  }

  function handleClick(target: HTMLElement): void {
    const handlers = [
      handleInstall,
      handleCatalogRouteClick,
      handleCatalogFiltersClick,
      handleCatalogCategoryClick,
      handleCatalogLayoutClick,
      handleCatalogAssetsClick,
      handleCatalogAuthorClick,
      handleComparisonClick,
      handleCatalogItemClick,
    ];

    for (const handler of handlers) {
      if (handler(target)) return;
    }
  }

  return { handleClick };
}

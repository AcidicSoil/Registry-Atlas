import type { Registry } from "../core/registry.schema";
import type { CatalogPolicy } from "../core/catalogPolicy";
import {
  catalogRoutePath,
  parseCatalogBrowseQuery,
  parseCatalogRoute,
  serializeCatalogBrowseQuery,
  type CatalogBrowseQueryState,
  type CatalogReviewedFilter,
  type CatalogRoute,
  type CatalogSort,
} from "../core/catalogRoutes";
import type { CatalogAssetKind } from "../core/catalogCollections";
import type { RegistryCatalogCoverage, RegistryDirectorySort } from "../core/registryDirectory";
import type { RegistryDirectoryLayout } from "./registryDirectoryView";

export interface BrowseRouteState {
  route: CatalogRoute;
  authorIdentity: string | null;
  compareRegistryNames: string[];
  searchTerm: string;
  discoveryPage: number;
  catalogSort: CatalogSort;
  catalogRegistryNames: string[];
  catalogItemTypes: string[];
  catalogCategories: string[];
  catalogAssetKinds: CatalogAssetKind[];
  catalogCanonicalIds: string[];
  catalogAccess: Array<"free" | "paid">;
  catalogReviewed: CatalogReviewedFilter;
  registryCoverage: RegistryCatalogCoverage[];
  registrySort: RegistryDirectorySort;
  registryLayout: RegistryDirectoryLayout;
  catalogLayout: RegistryDirectoryLayout;
}

function routeFromLocation(
  params: URLSearchParams,
  pathname: string,
  basePath: string,
): CatalogRoute {
  if (params.has("view")) return legacyRoute(params);

  return (
    parseCatalogRoute(pathname, basePath) ?? {
      kind: "not-found",
      path: pathname,
    }
  );
}

function searchTermFromLocation(params: URLSearchParams, route: CatalogRoute): string {
  const query = params.get("q")?.trim();

  if (query) return query;

  if (route.kind === "components" && route.pathSearchTerm) return route.pathSearchTerm;

  if (params.has("view")) return params.get("component")?.trim() ?? "";

  return "";
}

function sortRegistriesFromLocation(params: URLSearchParams): RegistryDirectorySort {
  const sort = params.get("registrySort");

  return sort === "item-count-desc" || sort === "item-count-asc" ? "item-count-desc" : "name";
}

export function hydrateBrowseRouteState(
  pathname: string,
  search: string,
  basePath: string,
  registries: readonly Registry[],
  policy: CatalogPolicy,
): BrowseRouteState {
  const params = new URLSearchParams(search);
  const browse = parseCatalogBrowseQuery(params, policy);
  const route = routeFromLocation(params, pathname, basePath);
  const searchTerm = searchTermFromLocation(params, route);

  const registryCoverage = params
    .getAll("coverage")
    .filter((value): value is RegistryCatalogCoverage =>
      ["current", "stale", "empty", "failed"].includes(value),
    );

  const registrySort = sortRegistriesFromLocation(params);

  const browseLayout: RegistryDirectoryLayout = params.get("layout") === "list" ? "list" : "grid";

  const compareRegistryNames = [...new Set(params.getAll("compareRegistry"))]
    .filter((name) => registries.some((registry) => registry.name === name))
    .slice(0, 4);

  return {
    route,
    authorIdentity:
      route.kind === "authors" ? params.get("author")?.trim().slice(0, 256) || null : null,
    compareRegistryNames,
    searchTerm,
    discoveryPage: browse.page,
    catalogSort: browse.sort,
    catalogRegistryNames: browse.registryNames.filter((name) =>
      registries.some((registry) => registry.name === name),
    ),
    catalogItemTypes: browse.itemTypes,
    catalogCategories: browse.categories,
    catalogAssetKinds: browse.assetKinds,
    catalogCanonicalIds: browse.canonicalIds,
    catalogAccess: browse.access,
    catalogReviewed: browse.reviewed,
    registryCoverage,
    registrySort,
    registryLayout: browseLayout,
    catalogLayout: browseLayout,
  };
}

function legacyRoute(params: URLSearchParams): CatalogRoute {
  const view = params.get("view");
  const registry = params.get("registry")?.trim();
  const item = params.get("item")?.trim();

  if (view === "compare" || view === "matrix") return { kind: "compare" };

  if (view === "registries")
    return registry ? { kind: "registry", namespace: registry } : { kind: "registries" };

  if (view === "item" && registry && item)
    return { kind: "component", namespace: registry, slug: item };

  return { kind: "components" };
}

function catalogBrowseStateForUrl(state: BrowseRouteState): CatalogBrowseQueryState {
  return {
    page: state.discoveryPage,
    sort: state.catalogSort,
    registryNames: state.catalogRegistryNames,
    itemTypes: [],
    categories: state.catalogCategories,
    assetKinds: state.catalogAssetKinds,
    canonicalIds: state.catalogCanonicalIds,
    access: state.catalogAccess,
    reviewed: "all",
  };
}

const CATALOG_BROWSE_ROUTE_KINDS = new Set<CatalogRoute["kind"]>([
  "explore",
  "blocks",
  "pages",
  "templates",
  "themes",
  "icons",
  "icon-family",
  "icon-category",
]);

function searchAwareRoute(state: BrowseRouteState): CatalogRoute {
  const route = state.route;

  if (route.kind !== "components") return route;
  const search = state.searchTerm.trim();

  if (!search || state.searchTerm.includes("/")) return route;

  return { kind: "components", pathSearchTerm: search };
}

function paramsForBrowseRoute(
  route: CatalogRoute,
  state: BrowseRouteState,
  policy: CatalogPolicy,
): URLSearchParams | null {
  if (route.kind === "components") {
    const params = serializeCatalogBrowseQuery(
      {
        ...catalogBrowseStateForUrl(state),
        itemTypes: state.catalogItemTypes,
        reviewed: state.catalogReviewed,
      },
      policy,
    );

    if (!route.pathSearchTerm && state.searchTerm.trim()) params.set("q", state.searchTerm.trim());

    return params;
  }

  if (route.kind === "registry" || route.kind === "registry-assets") {
    const params = serializeCatalogBrowseQuery(
      {
        ...catalogBrowseStateForUrl(state),
        registryNames: [],
        itemTypes: state.catalogItemTypes,
        reviewed: state.catalogReviewed,
      },
      policy,
    );

    if (state.searchTerm.trim()) params.set("q", state.searchTerm.trim());

    return params;
  }

  if (!CATALOG_BROWSE_ROUTE_KINDS.has(route.kind)) return null;
  const params = serializeCatalogBrowseQuery(catalogBrowseStateForUrl(state), policy);

  if (state.searchTerm.trim()) params.set("q", state.searchTerm.trim());

  return params;
}

function appendDirectoryQuery(params: URLSearchParams, state: BrowseRouteState): void {
  if (state.discoveryPage > 1) params.set("page", String(state.discoveryPage));

  if (state.searchTerm.trim()) params.set("q", state.searchTerm.trim());
}

function paramsForOtherRoute(route: CatalogRoute, state: BrowseRouteState): URLSearchParams {
  const params = new URLSearchParams();

  if (route.kind === "authors") {
    if (state.authorIdentity) params.set("author", state.authorIdentity);
    appendDirectoryQuery(params, state);
  } else if (route.kind === "registries") {
    appendDirectoryQuery(params, state);
    state.catalogAssetKinds.forEach((value) => params.append("asset", value));

    if (state.registrySort !== "name") params.set("registrySort", state.registrySort);

    if (state.registryLayout !== "grid") params.set("layout", state.registryLayout);
  } else if (route.kind === "compare") {
    appendDirectoryQuery(params, state);
    state.compareRegistryNames.forEach((name) => params.append("compareRegistry", name));
  }

  return params;
}

export function formatBrowseRouteUrl(
  state: BrowseRouteState,
  basePath: string,
  hash: string,
  policy: CatalogPolicy,
): string | null {
  if (state.route.kind === "not-found") return null;
  const route = searchAwareRoute(state);
  const params = paramsForBrowseRoute(route, state, policy) ?? paramsForOtherRoute(route, state);

  if (
    state.catalogLayout === "list" &&
    route.kind !== "registries" &&
    [
      "components",
      "registry",
      "registry-assets",
      "explore",
      "blocks",
      "pages",
      "templates",
      "themes",
      "icons",
      "icon-family",
      "icon-category",
    ].includes(route.kind)
  )
    params.set("layout", "list");
  const pathname = catalogRoutePath(route, basePath);
  const query = params.toString();

  return pathname + (query ? "?" + query : "") + hash;
}

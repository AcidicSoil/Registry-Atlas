export type CatalogRoute =
  | { kind: "components"; lens?: "featured" | "newest"; pathSearchTerm?: string }
  | { kind: "registries" }
  | { kind: "registry"; namespace: string }
  | { kind: "component"; namespace: string; slug: string }
  | { kind: "compare" };

export type CatalogSort = "name" | "registry" | "type" | "reviewed";
export type CatalogReviewedFilter = "all" | "reviewed" | "unreviewed";

export interface CatalogBrowseQueryState {
  page: number;
  sort: CatalogSort;
  registryNames: string[];
  itemTypes: string[];
  categories: string[];
  reviewed: CatalogReviewedFilter;
}

const CATALOG_SORTS = new Set<CatalogSort>(["name", "registry", "type", "reviewed"]);
const CATALOG_REVIEWED_FILTERS = new Set<CatalogReviewedFilter>(["all", "reviewed", "unreviewed"]);
const CATALOG_ITEM_TYPES = new Set([
  "registry:block",
  "registry:component",
  "registry:ui",
  "registry:page",
  "registry:item",
]);

export function parseCatalogRoute(
  pathname: string,
  basePath = "/",
): CatalogRoute | null {
  const relative = stripBasePath(pathname, basePath);
  if (relative === null) return null;

  const rawSegments = relative.split("/").filter(Boolean);
  const segments = rawSegments.map(decodeSafeSegment);
  if (segments.some(segment => segment === null)) return null;
  const decoded = segments as string[];

  if (decoded.length === 0 || (decoded.length === 1 && decoded[0] === "components")) {
    return { kind: "components" };
  }
  if (decoded.length === 2 && decoded[0] === "components" && decoded[1] === "featured") {
    return { kind: "components", lens: "featured" };
  }
  if (decoded.length === 2 && decoded[0] === "components" && decoded[1] === "newest") {
    return { kind: "components", lens: "newest" };
  }
  if (decoded.length === 3 && decoded[0] === "components" && decoded[1] === "s") {
    return { kind: "components", pathSearchTerm: decoded[2] };
  }
  if (decoded.length === 1 && decoded[0] === "registries") return { kind: "registries" };
  if (decoded.length === 1 && decoded[0] === "compare") return { kind: "compare" };

  const namespace = decoded[0];
  if (!namespace || !isSafeNamespace(namespace)) return null;
  if (decoded.length === 1) return { kind: "registry", namespace };

  if (decoded[1] === "components" && decoded.length >= 3) {
    const slugSegments = decoded.slice(2);
    if (!slugSegments.every(isSafeItemSegment)) return null;
    return { kind: "component", namespace, slug: slugSegments.join("/") };
  }

  return null;
}

export function parseCatalogBrowseQuery(params: URLSearchParams): CatalogBrowseQueryState {
  const pageValue = Number(params.get("page"));
  const sortValue = params.get("sort");
  const reviewedValue = params.get("reviewed");

  return {
    page: Number.isInteger(pageValue) && pageValue > 0 ? pageValue : 1,
    sort: sortValue && CATALOG_SORTS.has(sortValue as CatalogSort)
      ? sortValue as CatalogSort
      : "name",
    registryNames: uniqueValues(params.getAll("registry").filter(isSafeNamespace)),
    itemTypes: uniqueValues(params.getAll("type").filter(value => CATALOG_ITEM_TYPES.has(value))),
    categories: uniqueValues(params.getAll("category").map(value => value.trim()).filter(isSafeFacetValue)),
    reviewed: reviewedValue && CATALOG_REVIEWED_FILTERS.has(reviewedValue as CatalogReviewedFilter)
      ? reviewedValue as CatalogReviewedFilter
      : "all",
  };
}

export function serializeCatalogBrowseQuery(state: CatalogBrowseQueryState): URLSearchParams {
  const params = new URLSearchParams();
  if (state.page > 1) params.set("page", String(state.page));
  if (state.sort !== "name") params.set("sort", state.sort);
  state.registryNames.forEach(value => {
    if (isSafeNamespace(value)) params.append("registry", value);
  });
  state.itemTypes.forEach(value => {
    if (CATALOG_ITEM_TYPES.has(value)) params.append("type", value);
  });
  state.categories.forEach(value => {
    if (isSafeFacetValue(value)) params.append("category", value.trim());
  });
  if (state.reviewed !== "all") params.set("reviewed", state.reviewed);
  return params;
}

export function catalogRoutePath(
  route: CatalogRoute,
  basePath = "/",
): string {
  const base = normalizeBasePath(basePath);

  if (route.kind === "components") {
    if (route.pathSearchTerm) return joinBase(base, `components/s/${encodeSegment(route.pathSearchTerm)}`);
    if (route.lens) return joinBase(base, `components/${route.lens}`);
    return joinBase(base, "components");
  }
  if (route.kind === "registries") return joinBase(base, "registries");
  if (route.kind === "compare") return joinBase(base, "compare");

  if (!isSafeNamespace(route.namespace)) {
    throw new Error(`Unsafe registry namespace: ${route.namespace}`);
  }
  const namespace = encodeNamespace(route.namespace);
  if (route.kind === "registry") return joinBase(base, namespace);

  const slugSegments = route.slug.split("/");
  if (slugSegments.length === 0 || !slugSegments.every(isSafeItemSegment)) {
    throw new Error(`Unsafe component slug: ${route.slug}`);
  }
  return joinBase(base, `${namespace}/components/${slugSegments.map(encodeSegment).join("/")}`);
}

function stripBasePath(pathname: string, basePath: string): string | null {
  const base = normalizeBasePath(basePath);
  const baseWithoutTrailing = base === "/" ? "" : base.slice(0, -1);
  if (baseWithoutTrailing && pathname === baseWithoutTrailing) return "";
  if (baseWithoutTrailing && !pathname.startsWith(base)) return null;
  return baseWithoutTrailing ? pathname.slice(base.length) : pathname.replace(/^\//, "");
}

function normalizeBasePath(basePath: string): string {
  const withLeading = basePath.startsWith("/") ? basePath : `/${basePath}`;
  return withLeading.endsWith("/") ? withLeading : `${withLeading}/`;
}
function joinBase(base: string, relative: string): string {
  return `${base}${relative}`.replace(/\/+/g, "/");
}

function decodeSafeSegment(value: string): string | null {
  try {
    const decoded = decodeURIComponent(value);
    return isSafePathSegment(decoded) ? decoded : null;
  } catch {
    return null;
  }
}

function isSafeNamespace(value: string): boolean {
  return /^@[A-Za-z0-9][A-Za-z0-9._-]*$/.test(value);
}

function isSafeItemSegment(value: string): boolean {
  return isSafePathSegment(value) && value !== "." && value !== "..";
}

function isSafePathSegment(value: string): boolean {
  return Boolean(value)
    && value !== "."
    && value !== ".."
    && !/[\\/\u0000-\u001f\u007f]/.test(value);
}

function uniqueValues(values: readonly string[]): string[] {
  return [...new Set(values)];
}

function isSafeFacetValue(value: string): boolean {
  return Boolean(value)
    && value.length <= 96
    && !/[\u0000-\u001f\u007f]/.test(value);
}

function encodeNamespace(value: string): string {
  return `@${encodeURIComponent(value.slice(1))}`;
}

function encodeSegment(value: string): string {
  if (!isSafeItemSegment(value)) throw new Error(`Unsafe path segment: ${value}`);
  return encodeURIComponent(value);
}

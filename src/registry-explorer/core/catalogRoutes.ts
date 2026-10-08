import type { CatalogAssetKind } from './catalogCollections';
import { isDefaultCatalogTaxonomyId } from './catalogTaxonomy';

export type CatalogRoute =
  | { kind: "home" }
  | { kind: "not-found"; path: string }
  | { kind: "components"; pathSearchTerm?: string }
  | { kind: "blocks" }
  | { kind: "pages" }
  | { kind: "explore"; collection: string }
  | { kind: "authors" }
  | { kind: "registries" }
  | { kind: "registry"; namespace: string }
  | { kind: "component"; namespace: string; slug: string }
  | { kind: "block"; namespace: string; slug: string }
  | { kind: "page"; namespace: string; slug: string }
  | { kind: "templates" }
  | { kind: "template"; namespace: string; slug: string }
  | { kind: "themes" }
  | { kind: "theme"; namespace: string; slug: string }
  | { kind: "theme-editor" }
  | { kind: "icons" }
  | { kind: "icon-family"; family: string }
  | { kind: "icon-category"; category: string }
  | { kind: "compare" };

export type CatalogSort = "name" | "registry";
export type CatalogReviewedFilter = "all" | "reviewed" | "unreviewed";

export interface CatalogBrowseQueryState {
  page: number;
  sort: CatalogSort;
  registryNames: string[];
  itemTypes: string[];
  categories: string[];
  assetKinds: CatalogAssetKind[];
  canonicalIds: string[];
  access: Array<'free' | 'paid'>;
  reviewed: CatalogReviewedFilter;
}

const CATALOG_SORTS = new Set<CatalogSort>(["name", "registry"]);
const CATALOG_ASSET_KINDS = new Set<CatalogAssetKind>([
  'component', 'block', 'page', 'template', 'theme', 'icon', 'other',
]);
const CATALOG_ACCESS_VALUES = new Set(['free', 'paid'] as const);

export function parseCatalogRoute(pathname: string, basePath = "/"): CatalogRoute | null {
  const relative = stripBasePath(pathname, basePath);
  if (relative === null) return null;

  const rawSegments = relative.split("/").filter(Boolean);
  const segments = rawSegments.map(decodeSafeSegment);
  if (segments.some(segment => segment === null)) return null;
  const decoded = segments as string[];

  if (decoded.length === 0) return { kind: "home" };
  if (decoded.length === 1 && decoded[0] === "components") return { kind: "components" };
  if (decoded.length === 1 && decoded[0] === "blocks") return { kind: "blocks" };
  if (decoded.length === 1 && decoded[0] === "pages") return { kind: "pages" };
  if (decoded.length === 3 && decoded[0] === "components" && decoded[1] === "s") {
    return { kind: "components", pathSearchTerm: decoded[2] };
  }
  if (decoded.length === 3 && decoded[0] === "components" && decoded[1] === "explore") {
    return { kind: "explore", collection: decoded[2] };
  }

  if (decoded.length === 1 && decoded[0] === "authors") return { kind: "authors" };
  if (decoded.length === 1 && decoded[0] === "registries") return { kind: "registries" };
  if (decoded.length === 1 && decoded[0] === "templates") return { kind: "templates" };
  if (decoded.length === 1 && decoded[0] === "themes") return { kind: "themes" };
  if (decoded.length === 2 && decoded[0] === "themes" && decoded[1] === "editor") {
    return { kind: "theme-editor" };
  }
  if (decoded.length === 1 && decoded[0] === "icons") return { kind: "icons" };
  if (decoded.length === 3 && decoded[0] === "icons" && decoded[1] === "c") {
    return { kind: "icon-category", category: decoded[2] };
  }
  if (decoded.length === 2 && decoded[0] === "icons") {
    return { kind: "icon-family", family: decoded[1] };
  }
  if (decoded.length === 1 && decoded[0] === "compare") return { kind: "compare" };

  const namespace = decoded[0];
  if (!namespace || !isSafeNamespace(namespace)) return null;
  if (decoded.length === 1) return { kind: "registry", namespace };

  if (decoded.length >= 3 && ["components", "blocks", "pages", "templates", "themes"].includes(decoded[1])) {
    const slugSegments = decoded.slice(2);
    if (!slugSegments.every(isSafeItemSegment)) return null;
    const slug = slugSegments.join("/");
    if (decoded[1] === "components") return { kind: "component", namespace, slug };
    if (decoded[1] === "blocks") return { kind: "block", namespace, slug };
    if (decoded[1] === "pages") return { kind: "page", namespace, slug };
    if (decoded[1] === "templates") return { kind: "template", namespace, slug };
    return { kind: "theme", namespace, slug };
  }

  return null;
}

export function parseCatalogBrowseQuery(params: URLSearchParams): CatalogBrowseQueryState {
  const pageValue = Number(params.get("page"));
  const sortValue = params.get("sort");
  return {
    page: Number.isInteger(pageValue) && pageValue > 0 ? pageValue : 1,
    sort: normalizeCatalogSort(sortValue),
    registryNames: uniqueValues(params.getAll("registry").filter(isSafeNamespace)),
    itemTypes: [],
    categories: uniqueValues(params.getAll("category").filter(isSafeFacetValue)),
    assetKinds: uniqueValues(params.getAll('asset').filter(isCatalogAssetKind)) as CatalogAssetKind[],
    canonicalIds: uniqueValues(params.getAll('canonical').filter(value =>
      isSafeFacetValue(value) && isDefaultCatalogTaxonomyId(value))),
    access: uniqueValues(params.getAll('access').filter(isCatalogAccess)) as Array<'free' | 'paid'>,
    reviewed: "all",
  };
}

export function serializeCatalogBrowseQuery(state: CatalogBrowseQueryState): URLSearchParams {
  const params = new URLSearchParams();
  if (state.page > 1) params.set("page", String(state.page));
  if (state.sort !== "name" && CATALOG_SORTS.has(state.sort)) params.set("sort", state.sort);
  state.registryNames.forEach(value => {
    if (isSafeNamespace(value)) params.append("registry", value);
  });
  state.categories.forEach(value => {
    if (isSafeFacetValue(value)) params.append("category", value);
  });
  state.assetKinds.forEach(value => {
    if (CATALOG_ASSET_KINDS.has(value)) params.append('asset', value);
  });
  state.canonicalIds.forEach(value => {
    if (isSafeFacetValue(value) && isDefaultCatalogTaxonomyId(value)) params.append('canonical', value);
  });
  state.access.forEach(value => {
    if (CATALOG_ACCESS_VALUES.has(value)) params.append('access', value);
  });
  return params;
}

export function catalogRoutePath(route: CatalogRoute, basePath = "/"): string {
  const base = normalizeBasePath(basePath);

  if (route.kind === "home") return base;
  if (route.kind === "not-found") return route.path;
  if (route.kind === "components") {
    if (route.pathSearchTerm) return joinBase(base, `components/s/${encodeSegment(route.pathSearchTerm)}`);
    return joinBase(base, "components");
  }
  if (route.kind === "blocks") return joinBase(base, "blocks");
  if (route.kind === "pages") return joinBase(base, "pages");
  if (route.kind === "explore") return joinBase(base, `components/explore/${encodeSegment(route.collection)}`);
  if (route.kind === "authors") return joinBase(base, "authors");
  if (route.kind === "registries") return joinBase(base, "registries");
  if (route.kind === "templates") return joinBase(base, "templates");
  if (route.kind === "themes") return joinBase(base, "themes");
  if (route.kind === "theme-editor") return joinBase(base, "themes/editor");
  if (route.kind === "icons") return joinBase(base, "icons");
  if (route.kind === "icon-family") return joinBase(base, `icons/${encodeSegment(route.family)}`);
  if (route.kind === "icon-category") return joinBase(base, `icons/c/${encodeSegment(route.category)}`);
  if (route.kind === "compare") return joinBase(base, "compare");

  if (!isSafeNamespace(route.namespace)) {
    throw new Error(`Unsafe registry namespace: ${route.namespace}`);
  }
  const namespace = encodeNamespace(route.namespace);
  if (route.kind === "registry") return joinBase(base, namespace);

  const slugSegments = route.slug.split("/");
  if (slugSegments.length === 0 || !slugSegments.every(isSafeItemSegment)) {
    throw new Error(`Unsafe catalog slug: ${route.slug}`);
  }
  const kindSegment = route.kind === "component" ? "components"
    : route.kind === "block" ? "blocks"
      : route.kind === "page" ? "pages"
        : route.kind === "template" ? "templates" : "themes";
  return joinBase(base, `${namespace}/${kindSegment}/${slugSegments.map(encodeSegment).join("/")}`);
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
  return Boolean(value) && value !== "." && value !== ".." && !/[\\/\u0000-\u001f\u007f]/.test(value);
}

function uniqueValues(values: readonly string[]): string[] {
  return [...new Set(values)];
}

function isSafeFacetValue(value: string): boolean {
  return Boolean(value) && value.length <= 96 && !/[\u0000-\u001f\u007f]/.test(value);
}

function isCatalogAssetKind(value: string): value is CatalogAssetKind {
  return CATALOG_ASSET_KINDS.has(value as CatalogAssetKind);
}

function isCatalogAccess(value: string): value is 'free' | 'paid' {
  return CATALOG_ACCESS_VALUES.has(value as 'free' | 'paid');
}

function normalizeCatalogSort(value: string | null): CatalogSort {
  if (value === 'registry' || value === 'registry-desc') return 'registry';
  return 'name';
}

function encodeNamespace(value: string): string {
  return `@${encodeURIComponent(value.slice(1))}`;
}

function encodeSegment(value: string): string {
  if (!isSafeItemSegment(value)) throw new Error(`Unsafe path segment: ${value}`);
  return encodeURIComponent(value);
}

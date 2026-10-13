/** Named map contract for dynamic keys in this module. */
type ITEMSEGMENTKINDSLookupContract = Readonly<Record<string, 'component' | 'block' | 'page' | 'template' | 'theme'>>;

/** Named map contract for dynamic keys in this module. */
type REGISTRYASSETSEGMENTSLookupContract = Readonly<Record<string, CatalogAssetKind>>;

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
  | { kind: "registry-assets"; namespace: string; assetKind: CatalogAssetKind }
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

export const REGISTRY_ASSET_SEGMENTS = {
  components: 'component', blocks: 'block', pages: 'page',
  templates: 'template', themes: 'theme', icons: 'icon', other: 'other',
} satisfies REGISTRYASSETSEGMENTSLookupContract;

const CATALOG_SORTS = new Set<CatalogSort>(["name", "registry"]);

const CATALOG_ASSET_KINDS = new Set<string>([
  'component', 'block', 'page', 'template', 'theme', 'icon', 'other',
]);

const CATALOG_ACCESS_VALUES = new Set<string>(['free', 'paid']);

type FlatRouteKind = 'components' | 'blocks' | 'pages' | 'authors' | 'registries'
  | 'templates' | 'themes' | 'icons' | 'compare';

function isFlatRouteKind(value: string): value is FlatRouteKind {
  return value === 'components' || value === 'blocks' || value === 'pages'
    || value === 'authors' || value === 'registries' || value === 'templates'
    || value === 'themes' || value === 'icons' || value === 'compare';
}

const ITEM_SEGMENT_KINDS = {
  components: 'component', blocks: 'block', pages: 'page',
  templates: 'template', themes: 'theme',
} satisfies ITEMSEGMENTKINDSLookupContract;

function routeForOneSegment(segment: string): CatalogRoute | null {
  if (isFlatRouteKind(segment)) {
    return { kind: segment };
  }

  return isSafeNamespace(segment) ? { kind: 'registry', namespace: segment } : null;
}

function routeForTwoSegments(first: string, second: string): CatalogRoute | null {
  if (first === 'themes' && second === 'editor') return { kind: 'theme-editor' };

  if (first === 'icons') return { kind: 'icon-family', family: second };

  if (!isSafeNamespace(first)) return null;
  const assetKind = new Map(Object.entries(REGISTRY_ASSET_SEGMENTS)).get(second);

  return assetKind ? { kind: 'registry-assets', namespace: first, assetKind } : null;
}

function specialRouteForThreeSegments(segments: string[]): CatalogRoute | null {
  if (segments.length !== 3) return null;
  const [first, second, third] = segments;

  if (first === 'components') {
    if (second === 's') return { kind: 'components', pathSearchTerm: third };

    if (second === 'explore') return { kind: 'explore', collection: third! };
  }

  if (first === 'icons' && second === 'c') return { kind: 'icon-category', category: third! };

  return null;
}

function routeForLongPath(segments: string[]): CatalogRoute | null {
  const special = specialRouteForThreeSegments(segments);

  if (special) return special;
  const [first, second] = segments;

  if (!first || !isSafeNamespace(first)) return null;
  const kind = new Map(Object.entries(ITEM_SEGMENT_KINDS)).get(second ?? '');

  if (!kind) return null;
  const slugSegments = segments.slice(2);

  if (slugSegments.length === 0 || !slugSegments.every(isSafeItemSegment)) return null;

  return { kind, namespace: first, slug: slugSegments.join('/') };
}

export function parseCatalogRoute(pathname: string, basePath = '/'): CatalogRoute | null {
  const relative = stripBasePath(pathname, basePath);

  if (relative === null) return null;
  const decoded: string[] = [];

  for (const segment of relative.split('/')) {
    if (!segment) continue;
    const value = decodeSafeSegment(segment);

    if (value === null) return null;
    decoded.push(value);
  }

  if (decoded.length === 0) return { kind: 'home' };

  if (decoded.length === 1) return routeForOneSegment(decoded[0]!);

  if (decoded.length === 2) return routeForTwoSegments(decoded[0]!, decoded[1]!);

  return routeForLongPath(decoded);
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
    assetKinds: uniqueValues(params.getAll('asset').filter(isCatalogAssetKind)),
    canonicalIds: uniqueValues(params.getAll('canonical').filter(value =>
      isSafeFacetValue(value) && isDefaultCatalogTaxonomyId(value))),
    access: uniqueValues(params.getAll('access').filter(isCatalogAccess)),
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

const FLAT_ROUTE_PATHS: Readonly<Record<FlatRouteKind, string>> = {
  components: 'components', blocks: 'blocks', pages: 'pages',
  authors: 'authors', registries: 'registries', templates: 'templates',
  themes: 'themes', icons: 'icons', compare: 'compare',
};

function relativeSimplePath(route: CatalogRoute): string | null {
  if (route.kind === 'components' && route.pathSearchTerm) {
    return `components/s/${encodeSegment(route.pathSearchTerm)}`;
  }

  if (isFlatRouteKind(route.kind)) {
    return FLAT_ROUTE_PATHS[route.kind] ?? null;
  }

  switch (route.kind) {
    case 'explore': return `components/explore/${encodeSegment(route.collection)}`;
    case 'theme-editor': return 'themes/editor';
    case 'icon-family': return `icons/${encodeSegment(route.family)}`;
    case 'icon-category': return `icons/c/${encodeSegment(route.category)}`;
    default: return null;
  }
}

function relativeRegistryPath(route: CatalogRoute): string {
  if (!('namespace' in route) || !isSafeNamespace(route.namespace)) {
    throw new Error('Unsafe registry namespace');
  }

  const namespace = encodeNamespace(route.namespace);

  if (route.kind === 'registry') return namespace;

  if (route.kind === 'registry-assets') {
    const segment = Object.entries(REGISTRY_ASSET_SEGMENTS).find(([, kind]) => kind === route.assetKind)?.[0];

    if (!segment) throw new Error(`Invalid registry asset kind: ${route.assetKind}`);

    return `${namespace}/${segment}`;
  }

  const segments = route.slug.split('/');

  if (segments.length === 0 || !segments.every(isSafeItemSegment)) {
    throw new Error(`Unsafe catalog slug: ${route.slug}`);
  }

  const kindSegment = {
    component: 'components', block: 'blocks', page: 'pages',
    template: 'templates', theme: 'themes',
  }[route.kind];

  return `${namespace}/${kindSegment}/${segments.map(encodeSegment).join('/')}`;
}

export function catalogRoutePath(route: CatalogRoute, basePath = '/'): string {
  const base = normalizeBasePath(basePath);

  if (route.kind === 'home') return base;

  if (route.kind === 'not-found') return route.path;
  const simple = relativeSimplePath(route);

  return joinBase(base, simple ?? relativeRegistryPath(route));
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
  return Boolean(value) && value !== "." && value !== ".." && !/[\\/]/.test(value) && !hasControlCharacter(value);
}

function uniqueValues<T extends string>(values: readonly T[]): T[] {
  return [...new Set(values)];
}

function isSafeFacetValue(value: string): boolean {
  return Boolean(value) && value.length <= 96 && !hasControlCharacter(value);
}

function isCatalogAssetKind(value: string): value is CatalogAssetKind {
  return CATALOG_ASSET_KINDS.has(value);
}

function isCatalogAccess(value: string): value is 'free' | 'paid' {
  return CATALOG_ACCESS_VALUES.has(value);
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

function hasControlCharacter(value: string): boolean {
  return Array.from(value).some(character => {
    const code = character.charCodeAt(0);

    return code < 32 || code === 127;
  });
}

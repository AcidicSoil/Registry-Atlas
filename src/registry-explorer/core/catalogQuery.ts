import {
  catalogRoutePath,
  type CatalogReviewedFilter,
  type CatalogSort,
} from "./catalogRoutes";
import { assetKindForCatalogItem, type CatalogAssetKind } from "./catalogCollections";
import { defaultCatalogTaxonomySearchValues } from "./catalogTaxonomy";
import { registryCatalogItemIdentity } from "./registryCatalogIndex";
import { resolveCatalogSourcePage } from './catalogSourcePage';
import type {
  Registry,
  RegistryCatalogIndex,
  RegistryCatalogItem,
  RegistryItemSummary,
  RegistrySourcePage,
} from "./registry.schema";

export interface CatalogComponent {
  id: string;
  namespace: string;
  registry: Registry;
  slug: string;
  displayName: string;
  title?: string;
  description?: string;
  author?: string;
  type: string;
  categories: readonly string[];
  fileCount?: number;
  themePreview?: RegistryCatalogItem['themePreview'];
  reviewed: boolean;
  reviewedSummary?: RegistryItemSummary;
  item: RegistryCatalogItem;
  routePath: string;
  sourcePage?: RegistrySourcePage;
  docsUrl?: string;
}

export interface CatalogQueryOptions {
  search?: string;
  author?: string;
  registryNames?: readonly string[];
  itemTypes?: readonly string[];
  categories?: readonly string[];
  assetKinds?: readonly CatalogAssetKind[];
  canonicalIds?: readonly string[];
  access?: readonly ('free' | 'paid')[];
  reviewed?: CatalogReviewedFilter;
  sort?: CatalogSort;
  page?: number;
  pageSize?: number;
  basePath?: string;
}

export interface CatalogQueryResult {
  items: CatalogComponent[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface CatalogFacetOption {
  value: string;
  count: number;
}

export interface CatalogFacetSummary {
  registries: CatalogFacetOption[];
  itemTypes: CatalogFacetOption[];
  categories: CatalogFacetOption[];
  canonical: CatalogFacetOption[];
  access?: CatalogFacetOption[];
  reviewedCount: number;
  unreviewedCount: number;
}

const DEFAULT_PAGE_SIZE = 32;

const MAX_PAGE_SIZE = 100;

interface CatalogMatch {
  registry: Registry;
  item: RegistryCatalogItem;
  reviewed?: RegistryItemSummary;
}

/** The raw import retains duplicate source rows for integrity reporting. */
function* distinctCatalogItems(items: readonly RegistryCatalogItem[]): Generator<RegistryCatalogItem> {
  const seen = new Set<string>();

  for (const item of items) {
    const key = registryCatalogItemIdentity(item.name);

    if (seen.has(key)) continue;
    seen.add(key);
    yield item;
  }
}

type CatalogFilters = {
  registryNames: ReadonlySet<string>;
  itemTypes: ReadonlySet<string>;
  categories: ReadonlySet<string>;
  assetKinds: ReadonlySet<CatalogAssetKind>;
  canonicalIds: ReadonlySet<string>;
  access: ReadonlySet<'free' | 'paid'>;
  reviewed: CatalogReviewedFilter;
  search: string;
};

function normalizedValues(values: readonly string[] | undefined, lowercase = false): Set<string> {
  return new Set((values ?? []).map(value => lowercase ? normalize(value) : value.trim()).filter(Boolean));
}

function queryFilters(options: CatalogQueryOptions): CatalogFilters {
  return {
    registryNames: normalizedValues(options.registryNames),
    itemTypes: normalizedValues(options.itemTypes, true),
    categories: normalizedValues(options.categories, true),
    assetKinds: new Set(options.assetKinds ?? []),
    canonicalIds: new Set(options.canonicalIds ?? []),
    access: new Set(options.access ?? []),
    reviewed: options.reviewed ?? 'all',
    search: normalize(options.search ?? ''),
  };
}

function registryCatalogMatches(
  registry: Registry,
  items: readonly RegistryCatalogItem[],
  filters: CatalogFilters,
  author: string | undefined,
): CatalogMatch[] {
  const reviewed = reviewedSummaryMap(registry);
  const matches: CatalogMatch[] = [];

  for (const item of distinctCatalogItems(items)) {
    if (author !== undefined && item.author?.trim() !== author) continue;
    const overlay = reviewed.get(registryCatalogItemIdentity(item.name));

    if (!matchesFilters(item, registry.name, filters, Boolean(overlay))) continue;
    matches.push({ registry, item, ...(overlay ? { reviewed: overlay } : {}) });
  }

  return matches;
}

function findCatalogMatches(
  registries: readonly Registry[],
  index: RegistryCatalogIndex,
  filters: CatalogFilters,
  author: string | undefined,
): CatalogMatch[] {
  const byRegistry = new Map(registries.map(registry => [registry.name, registry]));
  const matches: CatalogMatch[] = [];

  for (const namespace of Object.keys(index.registries).sort((a, b) => a.localeCompare(b))) {
    if (filters.registryNames.size && !filters.registryNames.has(namespace)) continue;
    const registry = byRegistry.get(namespace);

    if (!registry) continue;
    matches.push(...registryCatalogMatches(registry, index.registries[namespace] ?? [], filters, author));
  }

  return matches;
}

export function queryCatalogComponents(
  registries: readonly Registry[],
  index: RegistryCatalogIndex,
  options: CatalogQueryOptions = {},
): CatalogQueryResult {
  const requestedPage = positiveInteger(options.page, 1);
  const pageSize = Math.min(positiveInteger(options.pageSize, DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE);
  const matches = findCatalogMatches(registries, index, queryFilters(options), options.author);

  matches.sort((a, b) => compareCatalogMatches(a, b, options.sort ?? "name"));
  const total = matches.length;
  const pageCount = total === 0 ? 0 : Math.ceil(total / pageSize);
  const page = pageCount === 0 ? 1 : Math.min(requestedPage, pageCount);
  const start = (page - 1) * pageSize;

  const items = matches
    .slice(start, start + pageSize)
    .map(match => toCatalogComponent(
      match.registry,
      match.item,
      match.reviewed,
      options.basePath,
      resolveCatalogSourcePage(index, match.registry, match.item),
    ));

  return {
    items,
    total,
    page,
    pageSize,
    pageCount,
    hasPreviousPage: page > 1 && total > 0,
    hasNextPage: page < pageCount,
  };
}

type FacetCounts = {
  registries: Map<string, number>;
  types: Map<string, number>;
  categories: Map<string, number>;
  canonical: Map<string, number>;
  access: Map<string, number>;
  reviewed: number;
  unreviewed: number;
};

function createFacetCounts(): FacetCounts {
  return {
    registries: new Map(), types: new Map(), categories: new Map(),
    canonical: new Map(), access: new Map(), reviewed: 0, unreviewed: 0,
  };
}

function collectCatalogFacet(counts: FacetCounts, namespace: string, item: RegistryCatalogItem, reviewed: boolean): void {
  increment(counts.registries, namespace);
  increment(counts.types, item.type);

  for (const category of item.categories ?? []) increment(counts.categories, category);

  for (const id of item.canonical?.path ?? []) increment(counts.canonical, id);

  if (item.access) increment(counts.access, item.access.normalized);

  if (reviewed) counts.reviewed += 1;
  else counts.unreviewed += 1;
}

function includeCanonicalAndAccessFacet(
  item: RegistryCatalogItem,
  filters: Pick<CatalogFilters, 'canonicalIds' | 'access'>,
): boolean {
  if (filters.canonicalIds.size && !(item.canonical?.path ?? []).some(id => filters.canonicalIds.has(id))) return false;

  return !filters.access.size || (!!item.access && filters.access.has(item.access.normalized));
}

function includeCatalogFacet(
  item: RegistryCatalogItem,
  namespace: string,
  filters: Pick<CatalogFilters, 'assetKinds' | 'canonicalIds' | 'access' | 'search'>,
): boolean {
  if (filters.assetKinds.size && !filters.assetKinds.has(assetKindForCatalogItem(item, namespace))) return false;

  if (!includeCanonicalAndAccessFacet(item, filters)) return false;

  return !filters.search || matchesSearch(item, namespace, filters.search);
}

function facetSummaryFromCounts(counts: FacetCounts): CatalogFacetSummary {
  return {
    registries: facetOptions(counts.registries),
    itemTypes: facetOptions(counts.types),
    categories: facetOptions(counts.categories),
    canonical: facetOptions(counts.canonical),
    ...(counts.access.size ? { access: facetOptions(counts.access) } : {}),
    reviewedCount: counts.reviewed,
    unreviewedCount: counts.unreviewed,
  };
}

export function buildCatalogFacetSummary(
  registries: readonly Registry[],
  index: RegistryCatalogIndex,
  options: Pick<CatalogQueryOptions, "search" | "registryNames" | "assetKinds" | "canonicalIds" | "access"> = {},
): CatalogFacetSummary {
  const filters = queryFilters(options);
  const namespaces = new Map(registries.map(registry => [registry.name, registry]));
  const counts = createFacetCounts();

  for (const [namespace, items] of Object.entries(index.registries)) {
    if (filters.registryNames.size && !filters.registryNames.has(namespace)) continue;
    const registry = namespaces.get(namespace);

    if (!registry) continue;
    const reviewed = reviewedSummaryMap(registry);

    for (const item of distinctCatalogItems(items)) {
      if (!includeCatalogFacet(item, namespace, filters)) continue;
      collectCatalogFacet(counts, namespace, item,
        reviewed.has(registryCatalogItemIdentity(item.name)));
    }
  }

  return facetSummaryFromCounts(counts);
}

export function catalogDistinctItemCount(index: RegistryCatalogIndex): number {
  return Object.keys(index.registries).reduce(
    (count, namespace) => count + catalogItemCountForRegistry(index, namespace), 0,
  );
}

export function catalogItemCountForRegistry(
  index: RegistryCatalogIndex,
  namespace: string,
): number {
  return [...distinctCatalogItems(index.registries[namespace] ?? [])].length;
}

function catalogDisplayFields(item: RegistryCatalogItem, reviewed?: RegistryItemSummary) {
  return {
    ...(item.title ? { title: item.title } : {}),
    ...(item.description ?? reviewed?.description
      ? { description: item.description ?? reviewed?.description } : {}),
    ...(item.author ? { author: item.author } : {}),
  };
}

function catalogSupplementaryFields(item: RegistryCatalogItem, reviewed?: RegistryItemSummary) {
  return {
    ...(item.fileCount !== undefined ? { fileCount: item.fileCount } : {}),
    ...(item.themePreview ? { themePreview: item.themePreview } : {}),
    ...(reviewed?.docsUrl ? { docsUrl: reviewed.docsUrl } : {}),
  };
}

function toCatalogComponent(
  registry: Registry,
  item: RegistryCatalogItem,
  reviewed: RegistryItemSummary | undefined,
  basePath = "/Registry-Atlas/",
  sourcePage?: RegistrySourcePage,
): CatalogComponent {
  return {
    id: `${registry.name}:${item.name}`,
    namespace: registry.name,
    registry,
    slug: item.name,
    displayName: displayLabel(item),
    ...catalogDisplayFields(item, reviewed),
    ...catalogSupplementaryFields(item, reviewed),
    type: item.type,
    categories: item.categories ?? [],
    reviewed: Boolean(reviewed),
    ...(reviewed ? { reviewedSummary: reviewed } : {}),
    item,
    routePath: catalogRoutePath(
      { kind: "component", namespace: registry.name, slug: item.name },
      basePath,
    ),
    ...(sourcePage ? { sourcePage } : {}),
  };
}

function reviewedSummaryMap(registry: Registry): Map<string, RegistryItemSummary> {
  return new Map(
    (registry.itemSummaries ?? []).map(summary => [
      registryCatalogItemIdentity(summary.slug),
      summary,
    ]),
  );
}

function compareCatalogMatches(
  a: CatalogMatch,
  b: CatalogMatch,
  sort: CatalogSort,
): number {
  const aName = displayName(a);
  const bName = displayName(b);

  if (sort === "registry") {
    return a.registry.name.localeCompare(b.registry.name)
      || aName.localeCompare(bName)
      || a.item.name.localeCompare(b.item.name);
  }

  return aName.localeCompare(bName)
    || a.registry.name.localeCompare(b.registry.name)
    || a.item.name.localeCompare(b.item.name);
}

function displayName(match: CatalogMatch): string {
  return displayLabel(match.item);
}

function displayLabel(item: RegistryCatalogItem): string {
  if (item.title?.trim()) return item.title.trim();
  const segments = item.name.split('/').filter(Boolean);

  return segments.at(-1) ?? item.name;
}

function matchesCategoryAndAccess(
  item: RegistryCatalogItem,
  filters: CatalogFilters,
): boolean {
  if (filters.categories.size &&
    !(item.categories ?? []).map(normalize).some(category => filters.categories.has(category))) return false;

  if (filters.canonicalIds.size &&
    !(item.canonical?.path ?? []).some(id => filters.canonicalIds.has(id))) return false;

  return !filters.access.size || (!!item.access && filters.access.has(item.access.normalized));
}

function matchesReviewStatus(expected: CatalogReviewedFilter, actual: boolean): boolean {
  if (expected === 'reviewed') return actual;

  if (expected === 'unreviewed') return !actual;

  return true;
}

function matchesFilters(
  item: RegistryCatalogItem,
  namespace: string,
  filters: CatalogFilters,
  isReviewed: boolean,
): boolean {
  if (filters.itemTypes.size && !filters.itemTypes.has(normalize(item.type))) return false;

  if (filters.assetKinds.size && !filters.assetKinds.has(assetKindForCatalogItem(item, namespace))) return false;

  if (!matchesCategoryAndAccess(item, filters)) return false;

  if (!matchesReviewStatus(filters.reviewed, isReviewed)) return false;

  return !filters.search || matchesSearch(item, namespace, filters.search);
}

function matchesSearch(item: RegistryCatalogItem, namespace: string, query: string): boolean {
  const canonicalValues = item.canonical?.path?.length
    ? defaultCatalogTaxonomySearchValues(item.canonical.path)
    : [];

  return [
    item.name,
    item.title ?? "",
    item.description ?? "",
    item.author ?? "",
    item.type,
    namespace,
    ...(item.categories ?? []),
    ...canonicalValues,
  ].some(value => normalize(value).includes(query));
}

function increment(counts: Map<string, number>, value: string): void {
  const normalized = value.trim();

  if (!normalized) return;
  counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
}

function facetOptions(counts: ReadonlyMap<string, number>): CatalogFacetOption[] {
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
}

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase();
}

function positiveInteger(value: number | undefined, fallback: number): number {
  return Number.isInteger(value) && Number(value) > 0 ? Number(value) : fallback;
}

import {
  catalogRoutePath,
  type CatalogReviewedFilter,
  type CatalogSort,
} from "./catalogRoutes";
import { assetKindForCatalogItem, type CatalogAssetKind } from "./catalogCollections";
import { defaultCatalogTaxonomySearchValues } from "./catalogTaxonomy";
import { registryCatalogItemIdentity } from "./registryCatalogIndex";
import { resolveSourceItemRoute, type SourceItemKind } from "./sourceItemRoute";
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

export function queryCatalogComponents(
  registries: readonly Registry[],
  index: RegistryCatalogIndex,
  options: CatalogQueryOptions = {},
): CatalogQueryResult {
  const requestedPage = positiveInteger(options.page, 1);
  const pageSize = Math.min(positiveInteger(options.pageSize, DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE);
  const registryFilter = new Set(options.registryNames?.map(value => value.trim()).filter(Boolean) ?? []);
  const typeFilter = new Set(options.itemTypes?.map(normalize).filter(Boolean) ?? []);
  const categoryFilter = new Set(options.categories?.map(normalize).filter(Boolean) ?? []);
  const assetKindFilter = new Set(options.assetKinds ?? []);
  const canonicalFilter = new Set(options.canonicalIds ?? []);
  const accessFilter = new Set(options.access ?? []);
  const reviewedFilter = options.reviewed ?? "all";
  const sort = options.sort ?? "name";
  const query = normalize(options.search ?? "");
  const registryByName = new Map(registries.map(registry => [registry.name, registry]));
  const reviewedByRegistry = new Map(
    registries.map(registry => [registry.name, reviewedSummaryMap(registry)]),
  );

  const matches: CatalogMatch[] = [];
  const namespaces = Object.keys(index.registries).sort((a, b) => a.localeCompare(b));
  for (const namespace of namespaces) {
    if (registryFilter.size > 0 && !registryFilter.has(namespace)) continue;
    const registry = registryByName.get(namespace);
    if (!registry) continue;
    const reviewed = reviewedByRegistry.get(namespace) ?? new Map<string, RegistryItemSummary>();

    for (const item of distinctCatalogItems(index.registries[namespace] ?? [])) {
      if (options.author !== undefined && item.author?.trim() !== options.author) continue;
      const overlay = reviewed.get(registryCatalogItemIdentity(item.name));
      if (!matchesFilters(
        item,
        namespace,
        query,
        typeFilter,
        categoryFilter,
        assetKindFilter,
        canonicalFilter,
        accessFilter,
        reviewedFilter,
        Boolean(overlay),
      )) continue;
      matches.push({ registry, item, ...(overlay ? { reviewed: overlay } : {}) });
    }
  }

  matches.sort((a, b) => compareCatalogMatches(a, b, sort));
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
      index.sourcePages?.[`${match.registry.name}/${match.item.name}`],
      index.itemRoutes?.[`${match.registry.name}/${match.item.name}`],
      index.routePatterns?.[match.registry.name],
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

export function buildCatalogFacetSummary(
  registries: readonly Registry[],
  index: RegistryCatalogIndex,
  options: Pick<CatalogQueryOptions, "search" | "registryNames" | "assetKinds" | "canonicalIds" | "access"> = {},
): CatalogFacetSummary {
  const registryFilter = new Set(options.registryNames?.map(value => value.trim()).filter(Boolean) ?? []);
  const query = normalize(options.search ?? "");
  const assetKindFilter = new Set(options.assetKinds ?? []);
  const canonicalFilter = new Set(options.canonicalIds ?? []);
  const accessFilter = new Set(options.access ?? []);
  const registryByName = new Map(registries.map(registry => [registry.name, registry]));
  const reviewedByRegistry = new Map(
    registries.map(registry => [registry.name, reviewedSummaryMap(registry)]),
  );
  const registryCounts = new Map<string, number>();
  const typeCounts = new Map<string, number>();
  const categoryCounts = new Map<string, number>();
  const canonicalCounts = new Map<string, number>();
  const accessCounts = new Map<string, number>();
  let reviewedCount = 0;
  let unreviewedCount = 0;

  for (const [namespace, items] of Object.entries(index.registries)) {
    if (registryFilter.size > 0 && !registryFilter.has(namespace)) continue;
    if (!registryByName.has(namespace)) continue;
    const reviewed = reviewedByRegistry.get(namespace) ?? new Map<string, RegistryItemSummary>();

    for (const item of distinctCatalogItems(items)) {
      if (assetKindFilter.size > 0 && !assetKindFilter.has(assetKindForCatalogItem(item, namespace))) continue;
      if (canonicalFilter.size > 0
        && !(item.canonical?.path ?? []).some(id => canonicalFilter.has(id))) continue;
      if (accessFilter.size > 0
        && (!item.access || !accessFilter.has(item.access.normalized))) continue;
      if (query && !matchesSearch(item, namespace, query)) continue;
      increment(registryCounts, namespace);
      increment(typeCounts, item.type);
      for (const category of item.categories ?? []) increment(categoryCounts, category);
      for (const id of item.canonical?.path ?? []) increment(canonicalCounts, id);
      if (item.access) increment(accessCounts, item.access.normalized);
      if (reviewed.has(registryCatalogItemIdentity(item.name))) reviewedCount += 1;
      else unreviewedCount += 1;
    }
  }

  return {
    registries: facetOptions(registryCounts),
    itemTypes: facetOptions(typeCounts),
    categories: facetOptions(categoryCounts),
    canonical: facetOptions(canonicalCounts),
    ...(accessCounts.size > 0 ? { access: facetOptions(accessCounts) } : {}),
    reviewedCount,
    unreviewedCount,
  };
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
function toCatalogComponent(
  registry: Registry,
  item: RegistryCatalogItem,
  reviewed: RegistryItemSummary | undefined,
  basePath = "/Registry-Atlas/",
  sourcePage?: RegistrySourcePage,
  directRoute?: { url: string; status: string },
  routePatterns?: NonNullable<RegistryCatalogIndex['routePatterns']>[string],
): CatalogComponent {
  const assetKind = assetKindForCatalogItem(item, registry.name);
  const sourceKind: SourceItemKind = assetKind === 'other' ? 'component' : assetKind;
  const resolvedUrl = sourcePage ? null : resolveSourceItemRoute({
    homepage: registry.url,
    slug: item.name,
    kind: sourceKind,
    categories: item.categories ?? [],
    directRoute,
    patterns: routePatterns,
  });
  const resolvedSourcePage = sourcePage ?? (resolvedUrl ? {
    url: resolvedUrl,
    level: 'pattern' as const,
    source: 'verified-route-pattern' as const,
  } : undefined);

  return {
    id: `${registry.name}:${item.name}`,
    namespace: registry.name,
    registry,
    slug: item.name,
    displayName: displayLabel(item),
    ...(item.title ? { title: item.title } : {}),
    ...((item.description ?? reviewed?.description) ? { description: item.description ?? reviewed?.description } : {}),
    ...(item.author ? { author: item.author } : {}),
    type: item.type,
    categories: item.categories ?? [],
    ...(item.fileCount !== undefined ? { fileCount: item.fileCount } : {}),
    ...(item.themePreview ? { themePreview: item.themePreview } : {}),
    reviewed: Boolean(reviewed),
    ...(reviewed ? { reviewedSummary: reviewed } : {}),
    item,
    routePath: catalogRoutePath(
      { kind: "component", namespace: registry.name, slug: item.name },
      basePath,
    ),
    ...(resolvedSourcePage ? { sourcePage: resolvedSourcePage } : {}),
    ...(reviewed?.docsUrl ? { docsUrl: reviewed.docsUrl } : {}),
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

function matchesFilters(
  item: RegistryCatalogItem,
  namespace: string,
  query: string,
  typeFilter: ReadonlySet<string>,
  categoryFilter: ReadonlySet<string>,
  assetKindFilter: ReadonlySet<CatalogAssetKind>,
  canonicalFilter: ReadonlySet<string>,
  accessFilter: ReadonlySet<'free' | 'paid'>,
  reviewedFilter: CatalogReviewedFilter,
  isReviewed: boolean,
): boolean {
  if (typeFilter.size > 0 && !typeFilter.has(normalize(item.type))) return false;
  if (assetKindFilter.size > 0 && !assetKindFilter.has(assetKindForCatalogItem(item, namespace))) return false;
  const categories = (item.categories ?? []).map(normalize);
  if (categoryFilter.size > 0 && !categories.some(category => categoryFilter.has(category))) {
    return false;
  }
  if (canonicalFilter.size > 0
    && !(item.canonical?.path ?? []).some(id => canonicalFilter.has(id))) return false;
  if (accessFilter.size > 0
    && (!item.access || !accessFilter.has(item.access.normalized))) return false;
  if (reviewedFilter === "reviewed" && !isReviewed) return false;
  if (reviewedFilter === "unreviewed" && isReviewed) return false;
  if (!query) return true;

  return matchesSearch(item, namespace, query);
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

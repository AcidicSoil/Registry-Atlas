import {
  catalogRoutePath,
  type CatalogReviewedFilter,
  type CatalogSort,
} from "./catalogRoutes";
import { registryCatalogItemIdentity } from "./registryCatalogIndex";
import type {
  Registry,
  RegistryCatalogIndex,
  RegistryCatalogItem,
  RegistryItemSummary,
} from "./registry.schema";

export interface CatalogComponent {
  id: string;
  namespace: string;
  registry: Registry;
  slug: string;
  displayName: string;
  title?: string;
  description?: string;
  type: string;
  categories: readonly string[];
  reviewed: boolean;
  reviewedSummary?: RegistryItemSummary;
  item: RegistryCatalogItem;
  routePath: string;
  previewUrl?: string;
  docsUrl?: string;
}

export interface CatalogQueryOptions {
  search?: string;
  registryNames?: readonly string[];
  itemTypes?: readonly string[];
  categories?: readonly string[];
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

    for (const item of index.registries[namespace] ?? []) {
      const overlay = reviewed.get(registryCatalogItemIdentity(item.name));
      if (!matchesFilters(
        item,
        namespace,
        query,
        typeFilter,
        categoryFilter,
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
    .map(match => toCatalogComponent(match.registry, match.item, match.reviewed, options.basePath));

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
  options: Pick<CatalogQueryOptions, "search" | "registryNames"> = {},
): CatalogFacetSummary {
  const registryFilter = new Set(options.registryNames?.map(value => value.trim()).filter(Boolean) ?? []);
  const query = normalize(options.search ?? "");
  const registryByName = new Map(registries.map(registry => [registry.name, registry]));
  const reviewedByRegistry = new Map(
    registries.map(registry => [registry.name, reviewedSummaryMap(registry)]),
  );
  const registryCounts = new Map<string, number>();
  const typeCounts = new Map<string, number>();
  const categoryCounts = new Map<string, number>();
  let reviewedCount = 0;
  let unreviewedCount = 0;

  for (const [namespace, items] of Object.entries(index.registries)) {
    if (registryFilter.size > 0 && !registryFilter.has(namespace)) continue;
    if (!registryByName.has(namespace)) continue;
    const reviewed = reviewedByRegistry.get(namespace) ?? new Map<string, RegistryItemSummary>();

    for (const item of items) {
      if (query && !matchesSearch(item, namespace, query)) continue;
      increment(registryCounts, namespace);
      increment(typeCounts, item.type);
      for (const category of item.categories ?? []) increment(categoryCounts, category);
      if (reviewed.has(registryCatalogItemIdentity(item.name))) reviewedCount += 1;
      else unreviewedCount += 1;
    }
  }

  return {
    registries: facetOptions(registryCounts),
    itemTypes: facetOptions(typeCounts),
    categories: facetOptions(categoryCounts),
    reviewedCount,
    unreviewedCount,
  };
}

export function catalogItemCountForRegistry(
  index: RegistryCatalogIndex,
  namespace: string,
): number {
  return index.registries[namespace]?.length ?? 0;
}
function toCatalogComponent(
  registry: Registry,
  item: RegistryCatalogItem,
  reviewed: RegistryItemSummary | undefined,
  basePath = "/Registry-Atlas/",
): CatalogComponent {
  return {
    id: `${registry.name}:${item.name}`,
    namespace: registry.name,
    registry,
    slug: item.name,
    displayName: reviewed?.name ?? item.title ?? item.name,
    ...(item.title ? { title: item.title } : {}),
    ...(reviewed?.description ? { description: reviewed.description } : {}),
    type: item.type,
    categories: item.categories ?? [],
    reviewed: Boolean(reviewed),
    ...(reviewed ? { reviewedSummary: reviewed } : {}),
    item,
    routePath: catalogRoutePath(
      { kind: "component", namespace: registry.name, slug: item.name },
      basePath,
    ),
    ...(reviewed?.previewUrl ? { previewUrl: reviewed.previewUrl } : {}),
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
  if (sort === "type") {
    return a.item.type.localeCompare(b.item.type)
      || aName.localeCompare(bName)
      || a.registry.name.localeCompare(b.registry.name);
  }
  if (sort === "reviewed") {
    return Number(Boolean(b.reviewed)) - Number(Boolean(a.reviewed))
      || aName.localeCompare(bName)
      || a.registry.name.localeCompare(b.registry.name);
  }
  return aName.localeCompare(bName)
    || a.registry.name.localeCompare(b.registry.name)
    || a.item.name.localeCompare(b.item.name);
}

function displayName(match: CatalogMatch): string {
  return match.reviewed?.name ?? match.item.title ?? match.item.name;
}

function matchesFilters(
  item: RegistryCatalogItem,
  namespace: string,
  query: string,
  typeFilter: ReadonlySet<string>,
  categoryFilter: ReadonlySet<string>,
  reviewedFilter: CatalogReviewedFilter,
  isReviewed: boolean,
): boolean {
  if (typeFilter.size > 0 && !typeFilter.has(normalize(item.type))) return false;
  const categories = (item.categories ?? []).map(normalize);
  if (categoryFilter.size > 0 && !categories.some(category => categoryFilter.has(category))) {
    return false;
  }
  if (reviewedFilter === "reviewed" && !isReviewed) return false;
  if (reviewedFilter === "unreviewed" && isReviewed) return false;
  if (!query) return true;

  return matchesSearch(item, namespace, query);
}

function matchesSearch(item: RegistryCatalogItem, namespace: string, query: string): boolean {
  return [
    item.name,
    item.title ?? "",
    item.type,
    namespace,
    ...(item.categories ?? []),
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

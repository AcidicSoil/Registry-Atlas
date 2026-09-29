import { catalogRoutePath } from "./catalogRoutes";
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

const DEFAULT_PAGE_SIZE = 32;
const MAX_PAGE_SIZE = 100;

export function queryCatalogComponents(
  registries: readonly Registry[],
  index: RegistryCatalogIndex,
  options: CatalogQueryOptions = {},
): CatalogQueryResult {
  const page = positiveInteger(options.page, 1);
  const pageSize = Math.min(positiveInteger(options.pageSize, DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE);
  const start = (page - 1) * pageSize;
  const registryFilter = new Set(options.registryNames?.map(value => value.trim()).filter(Boolean) ?? []);
  const typeFilter = new Set(options.itemTypes?.map(normalize).filter(Boolean) ?? []);
  const categoryFilter = new Set(options.categories?.map(normalize).filter(Boolean) ?? []);
  const query = normalize(options.search ?? "");
  const registryByName = new Map(registries.map(registry => [registry.name, registry]));
  const reviewedByRegistry = new Map(
    registries.map(registry => [registry.name, reviewedSummaryMap(registry)]),
  );

  const items: CatalogComponent[] = [];
  let total = 0;

  const namespaces = Object.keys(index.registries).sort((a, b) => a.localeCompare(b));
  for (const namespace of namespaces) {
    if (registryFilter.size > 0 && !registryFilter.has(namespace)) continue;
    const registry = registryByName.get(namespace);
    if (!registry) continue;
    const bucket = [...(index.registries[namespace] ?? [])]
      .sort((a, b) => a.name.localeCompare(b.name) || (a.title ?? "").localeCompare(b.title ?? ""));
    const reviewed = reviewedByRegistry.get(namespace) ?? new Map<string, RegistryItemSummary>();

    for (const item of bucket) {
      if (!matchesFilters(item, namespace, query, typeFilter, categoryFilter)) continue;
      const matchIndex = total;
      total += 1;
      if (matchIndex < start || items.length >= pageSize) continue;

      const overlay = reviewed.get(registryCatalogItemIdentity(item.name));
      items.push(toCatalogComponent(registry, item, overlay, options.basePath));
    }
  }

  const pageCount = total === 0 ? 0 : Math.ceil(total / pageSize);
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
function matchesFilters(
  item: RegistryCatalogItem,
  namespace: string,
  query: string,
  typeFilter: ReadonlySet<string>,
  categoryFilter: ReadonlySet<string>,
): boolean {
  if (typeFilter.size > 0 && !typeFilter.has(normalize(item.type))) return false;
  const categories = (item.categories ?? []).map(normalize);
  if (categoryFilter.size > 0 && !categories.some(category => categoryFilter.has(category))) {
    return false;
  }
  if (!query) return true;

  return [
    item.name,
    item.title ?? "",
    item.type,
    namespace,
    ...(item.categories ?? []),
  ].some(value => normalize(value).includes(query));
}

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase();
}

function positiveInteger(value: number | undefined, fallback: number): number {
  return Number.isInteger(value) && Number(value) > 0 ? Number(value) : fallback;
}

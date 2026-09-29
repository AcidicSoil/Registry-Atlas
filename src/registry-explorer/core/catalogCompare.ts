import { catalogRoutePath } from "./catalogRoutes";
import { registryCatalogItemIdentity } from "./registryCatalogIndex";
import type { Registry, RegistryCatalogIndex, RegistryCatalogItem } from "./registry.schema";

export interface CatalogCompareCell {
  namespace: string;
  present: boolean;
  routePath?: string;
}

export interface CatalogCompareRow {
  identity: string;
  slug: string;
  displayName: string;
  presentIn: string[];
  cells: CatalogCompareCell[];
}

export interface CatalogCompareOptions {
  search?: string;
  page?: number;
  pageSize?: number;
  basePath?: string;
}

export interface CatalogCompareResult {
  selectedRegistryNames: string[];
  rows: CatalogCompareRow[];
  unionCount: number;
  intersectionCount: number;
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

interface UnionRecord {
  slug: string;
  displayName: string;
  itemsByNamespace: Map<string, RegistryCatalogItem>;
}

const DEFAULT_PAGE_SIZE = 40;

export function buildCatalogComparison(
  registries: readonly Registry[],
  index: RegistryCatalogIndex,
  registryNames: readonly string[],
  options: CatalogCompareOptions = {},
): CatalogCompareResult {
  const available = new Set(registries.map(registry => registry.name));
  const selectedRegistryNames = [...new Set(registryNames)]
    .filter(name => available.has(name))
    .slice(0, 4);
  const union = new Map<string, UnionRecord>();

  for (const namespace of selectedRegistryNames) {
    for (const item of index.registries[namespace] ?? []) {
      const identity = registryCatalogItemIdentity(item.name);
      const existing = union.get(identity) ?? {
        slug: item.name,
        displayName: item.title ?? item.name,
        itemsByNamespace: new Map<string, RegistryCatalogItem>(),
      };
      existing.itemsByNamespace.set(namespace, item);
      if (!existing.displayName && item.title) existing.displayName = item.title;
      union.set(identity, existing);
    }
  }

  const unionCount = union.size;
  const intersectionCount = selectedRegistryNames.length === 0
    ? 0
    : [...union.values()].filter(record => record.itemsByNamespace.size === selectedRegistryNames.length).length;
  const query = normalize(options.search ?? "");
  const matching = [...union.entries()]
    .filter(([, record]) => !query || normalize(record.slug).includes(query) || normalize(record.displayName).includes(query))
    .sort((a, b) => a[1].slug.localeCompare(b[1].slug));

  const page = positiveInteger(options.page, 1);
  const pageSize = Math.min(positiveInteger(options.pageSize, DEFAULT_PAGE_SIZE), 100);
  const total = matching.length;
  const pageCount = total === 0 ? 0 : Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  const rows = matching.slice(start, start + pageSize).map(([identity, record]) => {
    const presentIn = selectedRegistryNames.filter(namespace => record.itemsByNamespace.has(namespace));
    return {
      identity,
      slug: record.slug,
      displayName: record.displayName,
      presentIn,
      cells: selectedRegistryNames.map(namespace => {
        const item = record.itemsByNamespace.get(namespace);
        return item
          ? {
              namespace,
              present: true,
              routePath: catalogRoutePath(
                { kind: "component", namespace, slug: item.name },
                options.basePath ?? "/Registry-Atlas/",
              ),
            }
          : { namespace, present: false };
      }),
    };
  });

  return {
    selectedRegistryNames,
    rows,
    unionCount,
    intersectionCount,
    total,
    page,
    pageSize,
    pageCount,
  };
}

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase();
}

function positiveInteger(value: number | undefined, fallback: number): number {
  return Number.isInteger(value) && Number(value) > 0 ? Number(value) : fallback;
}

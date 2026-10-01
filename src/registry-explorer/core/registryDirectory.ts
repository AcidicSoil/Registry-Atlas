import type { Registry, RegistryCatalogIndex } from "./registry.schema";
import { assetKindForCatalogItem, type CatalogAssetKind } from "./catalogCollections";

export type RegistryCatalogCoverage = "current" | "stale" | "empty" | "failed";
export type RegistryDirectorySort = "name" | "item-count-asc" | "item-count-desc" | "name-desc";

export interface RegistryDirectoryEntry {
  registry: Registry;
  itemCount: number;
  coverage: RegistryCatalogCoverage;
}

export interface RegistryDirectoryOptions {
  search?: string;
  coverage?: readonly RegistryCatalogCoverage[];
  assetKinds?: readonly CatalogAssetKind[];
  sort?: RegistryDirectorySort;
  page?: number;
  pageSize?: number;
}

export interface RegistryDirectoryResult {
  entries: RegistryDirectoryEntry[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  coverageCounts: Record<RegistryCatalogCoverage, number>;
}

const DEFAULT_PAGE_SIZE = 32;
const MAX_PAGE_SIZE = 100;

export function registryCatalogCoverage(
  registry: Registry,
  index: RegistryCatalogIndex,
): RegistryCatalogCoverage {
  if (!Object.prototype.hasOwnProperty.call(index.registries, registry.name)) return "failed";
  if (registry.atlas?.comparisonEvidence === "stale-catalog") return "stale";
  return (index.registries[registry.name]?.length ?? 0) > 0 ? "current" : "empty";
}

export function buildRegistryDirectory(
  registries: readonly Registry[],
  index: RegistryCatalogIndex,
  options: RegistryDirectoryOptions = {},
): RegistryDirectoryResult {
  const query = (options.search ?? "").trim().toLocaleLowerCase();
  const requestedPage = positiveInteger(options.page, 1);
  const pageSize = Math.min(positiveInteger(options.pageSize, DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE);
  const coverageFilter = new Set(options.coverage ?? []);
  const assetFilter = new Set(options.assetKinds ?? []);
  const sort = options.sort ?? "name";

  const entries = registries
    .filter(registry => !query || [
      registry.name,
      registry.description,
      registry.url,
      ...(registry.atlas?.aliases ?? []),
    ].some(value => value.toLocaleLowerCase().includes(query)))
    .map(registry => ({
      registry,
      itemCount: index.registries[registry.name]?.length ?? 0,
      coverage: registryCatalogCoverage(registry, index),
    }))
    .filter(entry => coverageFilter.size === 0 || coverageFilter.has(entry.coverage))
    .filter(entry => assetFilter.size === 0 || (index.registries[entry.registry.name] ?? []).some(item => {
      const kind = assetKindForCatalogItem(item);
      return kind !== null && assetFilter.has(kind);
    }))
    .sort((a, b) => compareEntries(a, b, sort));

  const coverageCounts: Record<RegistryCatalogCoverage, number> = {
    current: 0,
    stale: 0,
    empty: 0,
    failed: 0,
  };
  entries.forEach(entry => {
    coverageCounts[entry.coverage] += 1;
  });

  const total = entries.length;
  const pageCount = total === 0 ? 0 : Math.ceil(total / pageSize);
  const page = pageCount === 0 ? 1 : Math.min(requestedPage, pageCount);
  const start = (page - 1) * pageSize;

  return {
    entries: entries.slice(start, start + pageSize),
    total,
    page,
    pageSize,
    pageCount,
    hasPreviousPage: page > 1 && total > 0,
    hasNextPage: page < pageCount,
    coverageCounts,
  };
}

function compareEntries(
  a: RegistryDirectoryEntry,
  b: RegistryDirectoryEntry,
  sort: RegistryDirectorySort,
): number {
  if (sort === "item-count-asc") {
    return a.itemCount - b.itemCount || a.registry.name.localeCompare(b.registry.name);
  }
  if (sort === "item-count-desc") {
    return b.itemCount - a.itemCount || a.registry.name.localeCompare(b.registry.name);
  }
  if (sort === "name-desc") return b.registry.name.localeCompare(a.registry.name);
  return a.registry.name.localeCompare(b.registry.name);
}

function positiveInteger(value: number | undefined, fallback: number): number {
  return Number.isInteger(value) && Number(value) > 0 ? Number(value) : fallback;
}

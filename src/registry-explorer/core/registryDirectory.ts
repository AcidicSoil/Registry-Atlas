import type { Registry, RegistryCatalogIndex } from "./registry.schema";

export type RegistryCatalogCoverage = "current" | "stale" | "empty" | "failed";

export interface RegistryDirectoryEntry {
  registry: Registry;
  itemCount: number;
  coverage: RegistryCatalogCoverage;
}

export interface RegistryDirectoryOptions {
  search?: string;
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
  const page = positiveInteger(options.page, 1);
  const pageSize = Math.min(positiveInteger(options.pageSize, DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE);

  const matches = registries
    .filter(registry => !query || [
      registry.name,
      registry.description,
      registry.url,
      ...(registry.atlas?.aliases ?? []),
    ].some(value => value.toLocaleLowerCase().includes(query)))
    .sort((a, b) => a.name.localeCompare(b.name));

  const total = matches.length;
  const pageCount = total === 0 ? 0 : Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  const coverageCounts: Record<RegistryCatalogCoverage, number> = {
    current: 0,
    stale: 0,
    empty: 0,
    failed: 0,
  };
  for (const registry of matches) {
    coverageCounts[registryCatalogCoverage(registry, index)] += 1;
  }
  const entries = matches.slice(start, start + pageSize).map(registry => ({
    registry,
    itemCount: index.registries[registry.name]?.length ?? 0,
    coverage: registryCatalogCoverage(registry, index),
  }));

  return {
    entries,
    total,
    page,
    pageSize,
    pageCount,
    hasPreviousPage: page > 1 && total > 0,
    hasNextPage: page < pageCount,
    coverageCounts,
  };
}

function positiveInteger(value: number | undefined, fallback: number): number {
  return Number.isInteger(value) && Number(value) > 0 ? Number(value) : fallback;
}

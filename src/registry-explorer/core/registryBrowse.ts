import { catalogCategoriesForRegistry } from './catalogTaxonomy.ts';
import { taxonomyTagsForValues } from './componentTaxonomy.ts';
import { filterRegistries } from './grouping.ts';
import { COMPONENT_TAG_VALUES } from './registry.schema.ts';
import type { CatalogCategory } from './catalogTaxonomy.ts';
import type { SelectedCatalogFacet } from './catalogFacets.ts';
import type { ComponentTag, CoverageStatus, Registry } from './registry.schema.ts';

export interface RegistryBrowseEntry {
  registry: Registry;
  knownItemCount: number;
  routeEligibleItemCount: number;
  categories: readonly CatalogCategory[];
  components: readonly ComponentTag[];
  coverageStatus: CoverageStatus;
}

const COMPONENT_SET = new Set<string>(COMPONENT_TAG_VALUES);

export function buildRegistryBrowseEntries(
  registries: readonly Registry[],
  searchTerm: string,
  selectedFacets: readonly SelectedCatalogFacet[],
): RegistryBrowseEntry[] {
  return filterRegistries(registries, searchTerm)
    .map(toBrowseEntry)
    .filter(entry => matchesContentFacets(entry, selectedFacets))
    .sort((a, b) => a.registry.name.localeCompare(b.registry.name));
}
function toBrowseEntry(registry: Registry): RegistryBrowseEntry {
  const itemSummaries = registry.itemSummaries ?? [];
  return {
    registry,
    knownItemCount: itemSummaries.length,
    routeEligibleItemCount: itemSummaries.filter(item => item.routeEligible).length,
    categories: catalogCategoriesForRegistry(registry),
    components: catalogComponentKeysForRegistry(registry),
    coverageStatus: registry.atlas?.coverageStatus ?? 'unverified',
  };
}

export function catalogComponentKeysForRegistry(registry: Registry): ComponentTag[] {
  const values = new Set<ComponentTag>(registry.component_tags);
  (registry.itemSummaries ?? []).forEach(item => {
    const raw = [
      ...(item.componentTagsExisting ?? []),
      ...(item.componentTagsProposed ?? []),
      item.category,
    ].filter((value): value is string => Boolean(value));
    raw.forEach(value => {
      if (COMPONENT_SET.has(value)) values.add(value as ComponentTag);
    });
    taxonomyTagsForValues(raw).forEach(tag => values.add(tag));
  });
  return [...values];
}
function matchesContentFacets(
  entry: RegistryBrowseEntry,
  selectedFacets: readonly SelectedCatalogFacet[],
): boolean {
  const registryValues = selectedFacets
    .filter(facet => facet.dimension === 'registry')
    .map(facet => facet.value);
  const categoryValues = selectedFacets
    .filter(facet => facet.dimension === 'category')
    .map(facet => facet.value);
  const componentValues = selectedFacets
    .filter(facet => facet.dimension === 'component')
    .map(facet => facet.value);

  const registryMatch = registryValues.length === 0
    || registryValues.includes(entry.registry.name);
  const categoryMatch = categoryValues.length === 0
    || categoryValues.some(value => entry.categories.includes(value as CatalogCategory));
  const componentMatch = componentValues.length === 0
    || componentValues.some(value => entry.components.includes(value as ComponentTag));

  return registryMatch && categoryMatch && componentMatch;
}

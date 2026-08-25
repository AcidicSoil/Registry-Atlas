import {
  CATALOG_CATEGORY_LABELS,
  catalogCategoriesForCandidate,
  catalogCategoriesForRegistry,
} from './catalogTaxonomy.ts';
import {
  componentTaxonomyEntry,
  taxonomyTagsForValues,
} from './componentTaxonomy.ts';
import { COMPONENT_TAG_VALUES } from './registry.schema.ts';
import type { CatalogCategory } from './catalogTaxonomy.ts';
import type { ComponentCandidate, ComponentTag, Registry, RegistryProfileItemRow } from './registry.schema.ts';

export type CatalogFacetDimension = 'category' | 'component' | 'registry';

export interface CatalogFacetOption {
  dimension: CatalogFacetDimension;
  value: string;
  label: string;
  count: number;
}

export interface CatalogFacetGroup {
  dimension: CatalogFacetDimension;
  label: string;
  options: readonly CatalogFacetOption[];
}

export interface SelectedCatalogFacet {
  dimension: CatalogFacetDimension;
  value: string;
  label: string;
}

const GROUP_LABELS: Record<CatalogFacetDimension, string> = {
  category: 'Category',
  component: 'Component',
  registry: 'Registry',
};

const COMPONENT_TAG_SET = new Set<string>(COMPONENT_TAG_VALUES);

export function buildCatalogFacetGroups(
  registries: readonly Registry[],
  candidates: readonly ComponentCandidate[],
): CatalogFacetGroup[] {
  const counts = new Map<CatalogFacetDimension, Map<string, number>>();

  if (candidates.length > 0) {
    candidates.forEach(candidate => {
      catalogCategoriesForCandidate(candidate).forEach(category => addValue(counts, 'category', category));
      candidateComponentTags(candidate).forEach(tag => addValue(counts, 'component', tag));
      addValue(counts, 'registry', candidate.registry.name);
    });
  } else {
    registries.forEach(registry => {
      catalogCategoriesForRegistry(registry).forEach(category => addValue(counts, 'category', category));
      registry.component_tags.forEach(tag => addValue(counts, 'component', tag));
      addValue(counts, 'registry', registry.name);
    });
  }

  return (Object.keys(GROUP_LABELS) as CatalogFacetDimension[]).map(dimension => ({
    dimension,
    label: GROUP_LABELS[dimension],
    options: toOptions(dimension, counts.get(dimension)),
  }));
}

export function applyCatalogFacetsToCandidates(
  candidates: readonly ComponentCandidate[],
  selected: readonly SelectedCatalogFacet[],
): ComponentCandidate[] {
  if (selected.length === 0) return [...candidates];

  const byDimension = new Map<CatalogFacetDimension, SelectedCatalogFacet[]>();
  for (const facet of selected) {
    byDimension.set(facet.dimension, [...(byDimension.get(facet.dimension) ?? []), facet]);
  }

  return candidates.filter(candidate => [...byDimension.entries()].every(([dimension, facets]) =>
    facets.some(facet => candidateMatchesCatalogFacet(candidate, dimension, facet.value)),
  ));
}

export function createSelectedCatalogFacet(
  groups: readonly CatalogFacetGroup[],
  dimension: string | null,
  value: string | null,
): SelectedCatalogFacet | null {
  const group = groups.find(item => item.dimension === dimension);
  const option = group?.options.find(item => item.value === value);
  return group && option
    ? { dimension: group.dimension, value: option.value, label: option.label }
    : null;
}

export function applyCatalogFacetsToProfileRows(rows: readonly RegistryProfileItemRow[], selected: readonly SelectedCatalogFacet[]): RegistryProfileItemRow[] {
  if (selected.length === 0) return [...rows];
  return rows.filter(row => selected.every(facet => {
    if (facet.dimension === 'registry') return true;
    if (facet.dimension === 'category') return row.taxonomyCategoryLabels?.some(label => CATALOG_CATEGORY_LABELS[facet.value as CatalogCategory] === label) ?? false;
    return [...(row.taxonomyTagLabels ?? []), ...(row.taxonomyCategoryLabels ?? [])].some(label => normalizeFacetValue(label) === normalizeFacetValue(facet.label));
  }));
}

function addValue(
  counts: Map<CatalogFacetDimension, Map<string, number>>,
  dimension: CatalogFacetDimension,
  value: string | undefined,
): void {
  const trimmed = value?.trim();
  if (!trimmed) return;
  const dimensionCounts = counts.get(dimension) ?? new Map<string, number>();
  dimensionCounts.set(trimmed, (dimensionCounts.get(trimmed) ?? 0) + 1);
  counts.set(dimension, dimensionCounts);
}

function toOptions(
  dimension: CatalogFacetDimension,
  values: Map<string, number> | undefined,
): CatalogFacetOption[] {
  return [...(values ?? new Map<string, number>()).entries()]
    .sort((a, b) => b[1] - a[1] || labelFor(dimension, a[0]).localeCompare(labelFor(dimension, b[0])))
    .map(([value, count]) => ({ dimension, value, label: labelFor(dimension, value), count }));
}

function labelFor(dimension: CatalogFacetDimension, value: string): string {
  if (dimension === 'category') return CATALOG_CATEGORY_LABELS[value as CatalogCategory] ?? value;
  if (dimension === 'registry') return value;
  const taxonomyLabel = componentTaxonomyEntry(value)?.label;
  return taxonomyLabel ?? titleCase(value);
}

function titleCase(value: string): string {
  return value.replace(/-/g, ' ').replace(/\b\w/g, character => character.toUpperCase());
}

function normalizeFacetValue(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function candidateMatchesCatalogFacet(
  candidate: ComponentCandidate,
  dimension: CatalogFacetDimension,
  value: string,
): boolean {
  if (dimension === 'category') {
    return catalogCategoriesForCandidate(candidate).includes(value as CatalogCategory);
  }
  if (dimension === 'registry') return candidate.registry.name === value;
  return candidateComponentTags(candidate).includes(value as ComponentTag);
}

function candidateComponentTags(candidate: ComponentCandidate): ComponentTag[] {
  const item = candidate.registry.itemSummaries?.find(summary => summary.slug === candidate.itemSlug);
  const values = [
    ...(item?.componentTagsExisting ?? []),
    ...(item?.componentTagsProposed ?? []),
    ...(candidate.componentTags ?? []),
    ...(candidate.taxonomyTagLabels ?? []),
  ];
  const tags = new Set<ComponentTag>();

  values.forEach(value => {
    if (COMPONENT_TAG_SET.has(value)) tags.add(value as ComponentTag);
    taxonomyTagsForValues([value]).forEach(tag => tags.add(tag));
  });

  if (tags.size === 0 && !item) {
    candidate.registry.component_tags.forEach(tag => tags.add(tag));
  }

  return [...tags];
}

import { CATALOG_CATEGORY_LABELS } from './catalogTaxonomy.ts';
import { componentTaxonomyEntry } from './componentTaxonomy.ts';
import {
  COMPONENT_TAG_VALUES,
  PRIMARY_FOCUS_VALUES,
} from './registry.schema.ts';
import type { CatalogSort } from './catalogSort.ts';
import type { CatalogCategory } from './catalogTaxonomy.ts';
import type {
  CatalogFacetDimension,
  SelectedCatalogFacet,
} from './catalogFacets.ts';
import type { ComponentTag, PrimaryFocus } from './registry.schema.ts';

export type RegistryExplorerView = 'discover' | 'registries' | 'compare' | 'item';

export interface ParsedRegistryExplorerUrlState {
  view: RegistryExplorerView;
  searchTerm: string;
  selectedFacets: SelectedCatalogFacet[];
  sort: CatalogSort;
  selectedProfileRegistryName: string | null;
  selectedCandidateId: string | null;
  selectedItemSlug: string | null;
  compareRegistryNames: string[];
  compareComponentKeys: ComponentTag[];
}

export interface SerializableRegistryExplorerUrlState extends ParsedRegistryExplorerUrlState {
  installQueue?: unknown;
  queue?: unknown;
  token?: unknown;
  install?: unknown;
}

const VALID_VIEWS: readonly RegistryExplorerView[] = ['discover', 'registries', 'compare', 'item'];
const VALID_SORTS: readonly CatalogSort[] = ['relevance', 'name'];
const CATEGORY_SET = new Set<string>(Object.keys(CATALOG_CATEGORY_LABELS));
const COMPONENT_SET = new Set<string>(COMPONENT_TAG_VALUES);
const PRIMARY_FOCUS_SET = new Set<string>(PRIMARY_FOCUS_VALUES);

const LEGACY_FOCUS_CATEGORY_MAP: Record<PrimaryFocus, CatalogCategory> = {
  'ai-chat': 'ai-and-chat',
  support: 'feedback-and-overlays',
  'buttons-and-primitives': 'buttons-and-controls',
  'dashboards-and-admin': 'data-display',
  'data-display-and-tables': 'data-display',
  'auth-and-user': 'auth-and-account',
  'forms-and-inputs': 'forms-and-inputs',
  navigation: 'navigation',
  'templates-and-layouts': 'layout-and-templates',
  'marketing-sections': 'marketing',
  ecommerce: 'ecommerce',
  'misc-utility': 'utilities',
};

export function parseRegistryExplorerUrlState(
  params: URLSearchParams,
): ParsedRegistryExplorerUrlState {
  const selectedFacets = parseSelectedFacets(params);
  appendLegacyFocusFacet(selectedFacets, params.get('view'), params.get('focus'));

  return {
    view: parseView(params.get('view')),
    searchTerm: params.get('q')?.trim() ?? '',
    selectedFacets,
    sort: parseSort(params.get('sort')),
    selectedProfileRegistryName: nullableParam(params.get('registry')),
    selectedCandidateId: nullableParam(params.get('candidate')),
    selectedItemSlug: nullableParam(params.get('item')),
    compareRegistryNames: uniqueNonEmpty(params.getAll('compareRegistry')),
    compareComponentKeys: uniqueNonEmpty(params.getAll('compareComponent'))
      .filter(value => COMPONENT_SET.has(value)) as ComponentTag[],
  };
}

export function serializeRegistryExplorerUrlState(
  state: SerializableRegistryExplorerUrlState,
): URLSearchParams {
  const params = new URLSearchParams();
  params.set('view', parseView(state.view));

  setNonEmpty(params, 'q', state.searchTerm);
  appendSelectedFacets(params, state.selectedFacets);
  if (state.sort === 'name') params.set('sort', 'name');
  setNonEmpty(params, 'registry', state.selectedProfileRegistryName);
  setNonEmpty(params, 'candidate', state.selectedCandidateId);
  setNonEmpty(params, 'item', state.selectedItemSlug);
  appendUnique(params, 'compareRegistry', state.compareRegistryNames);
  appendUnique(
    params,
    'compareComponent',
    state.compareComponentKeys.filter(value => COMPONENT_SET.has(value)),
  );

  return params;
}

function parseSelectedFacets(params: URLSearchParams): SelectedCatalogFacet[] {
  const facets: SelectedCatalogFacet[] = [];

  uniqueNonEmpty(params.getAll('category'))
    .filter(value => CATEGORY_SET.has(value))
    .forEach(value => facets.push({
      dimension: 'category',
      value,
      label: CATALOG_CATEGORY_LABELS[value as CatalogCategory],
    }));

  uniqueNonEmpty(params.getAll('component'))
    .filter(value => COMPONENT_SET.has(value))
    .forEach(value => facets.push({
      dimension: 'component',
      value,
      label: componentFacetLabel(value),
    }));

  uniqueNonEmpty(params.getAll('source')).forEach(value => facets.push({
    dimension: 'registry',
    value,
    label: value,
  }));

  return facets;
}

function appendLegacyFocusFacet(
  facets: SelectedCatalogFacet[],
  rawView: string | null,
  rawFocus: string | null,
): void {
  if (rawView !== 'focus') return;
  const focus = nullableParam(rawFocus);
  if (!focus || !PRIMARY_FOCUS_SET.has(focus)) return;
  const category = LEGACY_FOCUS_CATEGORY_MAP[focus as PrimaryFocus];
  if (facets.some(facet => facet.dimension === 'category' && facet.value === category)) return;
  facets.push({
    dimension: 'category',
    value: category,
    label: CATALOG_CATEGORY_LABELS[category],
  });
}

function appendSelectedFacets(
  params: URLSearchParams,
  facets: readonly SelectedCatalogFacet[],
): void {
  const dimensions: readonly CatalogFacetDimension[] = ['category', 'component', 'registry'];
  const keys: Record<CatalogFacetDimension, string> = {
    category: 'category',
    component: 'component',
    registry: 'source',
  };

  dimensions.forEach(dimension => {
    const values = facets
      .filter(facet => facet.dimension === dimension)
      .map(facet => facet.value)
      .filter(value => isValidFacetValue(dimension, value));
    appendUnique(params, keys[dimension], values);
  });
}

function isValidFacetValue(dimension: CatalogFacetDimension, value: string): boolean {
  const normalized = value.trim();
  if (!normalized) return false;
  if (dimension === 'category') return CATEGORY_SET.has(normalized);
  if (dimension === 'component') return COMPONENT_SET.has(normalized);
  return true;
}

function componentFacetLabel(value: string): string {
  return componentTaxonomyEntry(value)?.label
    ?? value.replace(/-/g, ' ').replace(/\b\w/g, character => character.toUpperCase());
}

function parseView(value: string | null): RegistryExplorerView {
  if (value === 'focus' || value === 'component') return 'discover';
  if (value === 'matrix') return 'compare';
  return value && VALID_VIEWS.includes(value as RegistryExplorerView)
    ? value as RegistryExplorerView
    : 'discover';
}

function parseSort(value: string | null): CatalogSort {
  return value && VALID_SORTS.includes(value as CatalogSort)
    ? value as CatalogSort
    : 'relevance';
}

function uniqueNonEmpty(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  values.forEach(value => {
    const normalized = value.trim();
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    result.push(normalized);
  });
  return result;
}

function appendUnique(
  params: URLSearchParams,
  key: string,
  values: readonly string[],
): void {
  uniqueNonEmpty(values).forEach(value => params.append(key, value));
}

function nullableParam(value: string | null): string | null {
  const normalized = value?.trim() ?? '';
  return normalized.length > 0 ? normalized : null;
}

function setNonEmpty(
  params: URLSearchParams,
  key: string,
  value: string | null,
): void {
  const normalized = value?.trim() ?? '';
  if (normalized.length > 0) params.set(key, normalized);
}

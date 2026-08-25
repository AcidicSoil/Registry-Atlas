import {
  COMPONENT_TAXONOMY_CATEGORIES,
  componentTaxonomyEntry,
  taxonomyTagsForValues,
} from './componentTaxonomy.ts';
import { COMPONENT_TAG_VALUES } from './registry.schema.ts';
import type {
  ComponentCandidate,
  ComponentTag,
  PrimaryFocus,
  Registry,
  RegistryItemSummary,
} from './registry.schema.ts';
import type { ComponentTaxonomyCategory } from './componentTaxonomy.ts';

export type CatalogCategory =
  | 'ai-and-chat' | 'auth-and-account' | 'buttons-and-controls'
  | 'data-display' | 'developer-tools' | 'ecommerce'
  | 'feedback-and-overlays' | 'forms-and-inputs'
  | 'layout-and-templates' | 'marketing' | 'media'
  | 'navigation' | 'utilities';

export const CATALOG_CATEGORY_LABELS: Record<CatalogCategory, string> = {
  'ai-and-chat': 'AI & Chat',
  'auth-and-account': 'Auth & Account',
  'buttons-and-controls': 'Buttons & Controls',
  'data-display': 'Data Display',
  'developer-tools': 'Developer Tools',
  ecommerce: 'Ecommerce',
  'feedback-and-overlays': 'Feedback & Overlays',
  'forms-and-inputs': 'Forms & Inputs',
  'layout-and-templates': 'Layout & Templates',
  marketing: 'Marketing',
  media: 'Media',
  navigation: 'Navigation',
  utilities: 'Utilities',
};

const CATALOG_CATEGORY_ORDER = Object.keys(CATALOG_CATEGORY_LABELS) as CatalogCategory[];
const CATALOG_CATEGORY_INDEX = new Map(CATALOG_CATEGORY_ORDER.map((category, index) => [category, index]));

const FOCUS_CATEGORY_MAP: Record<PrimaryFocus, CatalogCategory> = {
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

const TAXONOMY_CATEGORY_MAP: Record<ComponentTaxonomyCategory, CatalogCategory> = {
  'ai-and-chat': 'ai-and-chat',
  'badges-and-chips': 'data-display',
  'buttons-and-controls': 'buttons-and-controls',
  'callouts-and-alerts': 'feedback-and-overlays',
  'carousels-and-swipers': 'media',
  'code-and-markdown': 'developer-tools',
  'data-display-and-document': 'data-display',
  'data-generation': 'utilities',
  'feedback-and-progress': 'feedback-and-overlays',
  'form-controls': 'forms-and-inputs',
  'maps-and-location': 'utilities',
  'media-and-comparison': 'media',
  'media-and-images': 'media',
  'styles-and-themes': 'utilities',
};

const COMPONENT_TAG_SET = new Set<string>(COMPONENT_TAG_VALUES);

export function catalogCategoriesForRegistry(registry: Registry): CatalogCategory[] {
  const categories = new Set<CatalogCategory>();

  registry.primary_focus.forEach(focus => categories.add(FOCUS_CATEGORY_MAP[focus]));
  addCategoriesForTags(categories, registry.component_tags);
  (registry.itemSummaries ?? []).forEach(item => addItemCategories(categories, item));

  return sortCategories(categories);
}

export function catalogCategoriesForCandidate(candidate: ComponentCandidate): CatalogCategory[] {
  const specificCategories = new Set<CatalogCategory>();
  const item = candidate.registry.itemSummaries?.find(summary => summary.slug === candidate.itemSlug);

  addItemCategories(specificCategories, item);
  addCategoryForTaxonomyValue(specificCategories, candidate.itemCategory);
  addCategoriesForTags(specificCategories, candidate.componentTags ?? []);
  addCategoriesForTags(specificCategories, candidate.taxonomyTagLabels ?? []);
  addCategoriesForTaxonomyLabels(specificCategories, candidate.taxonomyCategoryLabels);

  return sortCategories(specificCategories.size > 0
    ? specificCategories
    : new Set(catalogCategoriesForRegistry(candidate.registry)));
}

function addItemCategories(categories: Set<CatalogCategory>, item: RegistryItemSummary | undefined): void {
  if (!item) return;
  addCategoryForTaxonomyValue(categories, item.category);
  addCategoriesForTags(categories, [
    ...(item.componentTagsExisting ?? []),
    ...(item.componentTagsProposed ?? []),
  ]);
}

function addCategoriesForTags(categories: Set<CatalogCategory>, values: readonly (string | undefined)[]): void {
  const canonicalTags = values.flatMap(value => {
    if (!value) return [];
    if (COMPONENT_TAG_SET.has(value)) return [value as ComponentTag];
    return taxonomyTagsForValues([value]);
  });

  canonicalTags.forEach(tag => {
    const taxonomyCategory = componentTaxonomyEntry(tag)?.category;
    if (taxonomyCategory) categories.add(TAXONOMY_CATEGORY_MAP[taxonomyCategory]);
  });
}

function addCategoriesForTaxonomyLabels(categories: Set<CatalogCategory>, values: readonly string[] | undefined): void {
  if (!values) return;
  values.forEach(value => addCategoryForTaxonomyValue(categories, value));
}

function addCategoryForTaxonomyValue(categories: Set<CatalogCategory>, value: string | undefined): void {
  if (!value) return;
  const taxonomyCategory = Object.keys(COMPONENT_TAXONOMY_CATEGORIES).find(category =>
    category === value || COMPONENT_TAXONOMY_CATEGORIES[category as ComponentTaxonomyCategory] === value,
  ) as ComponentTaxonomyCategory | undefined;
  if (taxonomyCategory) categories.add(TAXONOMY_CATEGORY_MAP[taxonomyCategory]);
}

function sortCategories(categories: Set<CatalogCategory>): CatalogCategory[] {
  return [...categories].sort((a, b) => (CATALOG_CATEGORY_INDEX.get(a) ?? 0) - (CATALOG_CATEGORY_INDEX.get(b) ?? 0));
}

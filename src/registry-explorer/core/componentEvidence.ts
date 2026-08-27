import {
  normalizeTaxonomySearchTerm,
  taxonomyTagsForValues,
} from './componentTaxonomy.ts';
import { COMPONENT_TAG_VALUES } from './registry.schema.ts';
import type { ComponentTag, Registry, RegistryItemSummary } from './registry.schema.ts';

const COMPONENT_BY_NORMALIZED = new Map<string, ComponentTag>(
  COMPONENT_TAG_VALUES.map(tag => [normalizeTaxonomySearchTerm(tag), tag]),
);

export function componentTagsForItemEvidence(item: RegistryItemSummary): ComponentTag[] {
  return componentTagsForEvidenceValues([
    ...(item.componentTagsExisting ?? []),
    ...(item.componentTagsProposed ?? []),
    item.name,
    item.slug,
    item.title,
    item.category,
  ]);
}

export function componentTagsForEvidenceValues(
  values: readonly (string | undefined)[],
): ComponentTag[] {
  const tags = new Set<ComponentTag>();
  const normalizedValues = values
    .filter((value): value is string => Boolean(value))
    .map(normalizeTaxonomySearchTerm)
    .filter(Boolean);

  normalizedValues.forEach(value => {
    const exact = COMPONENT_BY_NORMALIZED.get(value);
    if (exact) tags.add(exact);

    const padded = `-${value}-`;
    COMPONENT_BY_NORMALIZED.forEach((tag, normalizedTag) => {
      if (padded.includes(`-${normalizedTag}-`)) tags.add(tag);
    });
  });

  taxonomyTagsForValues(values).forEach(tag => tags.add(tag));
  return [...tags].sort((a, b) => a.localeCompare(b));
}

export function catalogComponentKeysForRegistry(registry: Registry): ComponentTag[] {
  const tags = new Set<ComponentTag>(registry.component_tags);
  (registry.itemSummaries ?? []).forEach(item => {
    componentTagsForItemEvidence(item).forEach(tag => tags.add(tag));
  });
  return [...tags].sort((a, b) => a.localeCompare(b));
}

import type { ComponentTag, Registry, RegistryItemSummary } from './registry.schema.ts';
import {
  componentTaxonomyCategoryLabel,
  componentTaxonomyEntry,
  componentTaxonomyLabel,
  taxonomyTagsForValues,
} from './componentTaxonomy.ts';

export type RelatedComponentMatchReason = 'Shared type' | 'Shared category' | 'Shared tags' | 'Visual available';

export interface RelatedComponent {
  id: string;
  registryName: string;
  itemSlug: string;
  title: string;
  previewUrl: string | null;
  componentPageUrl: string | null;
  type: string | null;
  category: string | null;
  matchReasons: readonly RelatedComponentMatchReason[];
}

export function buildRelatedComponents(
  registries: readonly Registry[],
  current: { registryName: string; itemSlug: string },
  limit = 6,
): RelatedComponent[] {
  const currentItem = findItem(registries, current.registryName, current.itemSlug);
  if (!currentItem) return [];

  const currentTags = taxonomyLabels(currentItem.summary);

  return registries.flatMap(registry => (registry.itemSummaries ?? []).map(summary => ({ registry, summary })))
    .filter(item => item.registry.name !== current.registryName || item.summary.slug !== current.itemSlug)
    .map(item => toRelated(item.registry, item.summary, currentItem.summary, currentTags))
    .filter((item): item is RelatedComponent & { score: number } => item !== null && item.score > 0)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, limit)
    .map(({ score: _score, ...item }) => item);
}

function findItem(
  registries: readonly Registry[],
  registryName: string,
  itemSlug: string,
): { registry: Registry; summary: RegistryItemSummary } | null {
  const registry = registries.find(item => item.name === registryName);
  const summary = registry?.itemSummaries?.find(item => item.slug === itemSlug);
  return registry && summary ? { registry, summary } : null;
}

function toRelated(
  registry: Registry,
  summary: RegistryItemSummary,
  current: RegistryItemSummary,
  currentTags: readonly string[],
): (RelatedComponent & { score: number }) | null {
  const reasons: RelatedComponentMatchReason[] = [];
  let score = 0;

  if (summary.type && current.type && summary.type === current.type) {
    reasons.push('Shared type');
    score += 4;
  }
  if (summary.category && current.category && summary.category === current.category) {
    reasons.push('Shared category');
    score += 3;
  }
  const tags = taxonomyLabels(summary);
  if (tags.some(tag => currentTags.includes(tag))) {
    reasons.push('Shared tags');
    score += 2;
  }
  if (summary.previewUrl) {
    reasons.push('Visual available');
    score += 1;
  }

  if (score === 0) return null;

  return {
    id: `${registry.name}:${summary.slug}`,
    registryName: registry.name,
    itemSlug: summary.slug,
    title: summary.title ?? summary.name,
    previewUrl: summary.previewUrl ?? null,
    componentPageUrl: summary.previewUrl ?? summary.docsUrl ?? summary.rawItemUrl ?? null,
    type: summary.type ?? null,
    category: summary.category ?? null,
    matchReasons: reasons,
    score,
  };
}

function taxonomyLabels(item: RegistryItemSummary): readonly string[] {
  const tags = taxonomyTagsForValues([
    item.category,
    ...(item.componentTagsExisting ?? []),
    ...(item.componentTagsProposed ?? []),
  ]);
  return [...new Set([
    ...tags.map((tag: ComponentTag) => componentTaxonomyLabel(tag)),
    ...tags
      .map(tag => componentTaxonomyEntry(tag)?.category)
      .filter((category): category is NonNullable<ReturnType<typeof componentTaxonomyEntry>>['category'] => Boolean(category))
      .map(category => componentTaxonomyCategoryLabel(category)),
  ])];
}

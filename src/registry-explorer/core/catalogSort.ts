import type { ComponentCandidate } from './registry.schema.ts';

export type CatalogSort = 'relevance' | 'name';

export function sortCatalogCandidates(
  candidates: readonly ComponentCandidate[],
  sort: CatalogSort,
): ComponentCandidate[] {
  if (sort === 'relevance') return [...candidates];

  return [...candidates].sort((a, b) =>
    a.matchedLabel.localeCompare(b.matchedLabel)
    || a.registry.name.localeCompare(b.registry.name)
    || (a.itemSlug ?? '').localeCompare(b.itemSlug ?? ''),
  );
}

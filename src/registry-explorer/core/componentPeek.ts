import type { ComponentCandidate, RegistryProfileItemRow } from './registry.schema.ts';

export interface ComponentPeekViewModel {
  id: string;
  registryName: string;
  itemSlug: string;
  title: string;
  previewUrl: string | null;
  componentPageUrl: string | null;
  visualStatus: 'available' | 'unavailable';
}

export function buildComponentPeekFromCandidate(candidate: ComponentCandidate): ComponentPeekViewModel | null {
  if (!candidate.routeEligible || !candidate.itemSlug) return null;
  return {
    id: `${candidate.registry.name}:${candidate.itemSlug}`,
    registryName: candidate.registry.name,
    itemSlug: candidate.itemSlug,
    title: candidate.itemName ?? candidate.matchedLabel,
    previewUrl: candidate.previewUrl ?? null,
    componentPageUrl: candidate.componentPageUrl ?? candidate.docsUrl ?? candidate.route ?? null,
    visualStatus: candidate.previewUrl ? 'available' : 'unavailable',
  };
}

export function buildComponentPeekFromProfileRow(
  registryName: string,
  row: RegistryProfileItemRow,
): ComponentPeekViewModel | null {
  if (!row.routeEligible) return null;
  return {
    id: `${registryName}:${row.slug}`,
    registryName,
    itemSlug: row.slug,
    title: row.name,
    previewUrl: row.previewUrl ?? null,
    componentPageUrl: row.componentPageUrl ?? row.docsUrl ?? row.route ?? null,
    visualStatus: row.previewUrl ? 'available' : 'unavailable',
  };
}

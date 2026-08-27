import type { ComponentCandidate, RegistryProfileItemRow } from './registry.schema.ts';

export interface ComponentPeekViewModel {
  id: string;
  registryName: string;
  itemSlug: string;
  title: string;
  previewUrl: string;
  componentPageUrl: string | null;
  visualStatus: 'available';
}

export function buildComponentPeekFromCandidate(candidate: ComponentCandidate): ComponentPeekViewModel | null {
  if (!candidate.routeEligible || !candidate.itemSlug || !isRenderablePreviewUrl(candidate.previewUrl)) return null;
  return {
    id: `${candidate.registry.name}:${candidate.itemSlug}`,
    registryName: candidate.registry.name,
    itemSlug: candidate.itemSlug,
    title: candidate.itemName ?? candidate.matchedLabel,
    previewUrl: candidate.previewUrl,
    componentPageUrl: candidate.componentPageUrl ?? candidate.docsUrl ?? null,
    visualStatus: 'available',
  };
}

export function buildComponentPeekFromProfileRow(
  registryName: string,
  row: RegistryProfileItemRow,
): ComponentPeekViewModel | null {
  if (!row.routeEligible || !isRenderablePreviewUrl(row.previewUrl)) return null;
  return {
    id: `${registryName}:${row.slug}`,
    registryName,
    itemSlug: row.slug,
    title: row.name,
    previewUrl: row.previewUrl,
    componentPageUrl: row.componentPageUrl ?? row.docsUrl ?? null,
    visualStatus: 'available',
  };
}

function isRenderablePreviewUrl(value: string | undefined): value is string {
  if (!value) return false;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return false;
    return !url.pathname.toLocaleLowerCase().endsWith('.json');
  } catch {
    return false;
  }
}

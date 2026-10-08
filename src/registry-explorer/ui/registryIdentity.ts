import { resolveRegistryItemRoute } from '../core/itemRoutes';
import type { Registry } from '../core/registry.schema';
import { escapeHtml } from './renderSafety';
import { verifiedRegistryHomepage } from './sourcePageLink';

const REGISTRY_ICON_PATHS = [
  '/favicon.ico',
  '/favicon.svg',
  '/icon.svg',
  '/icon.png',
  '/apple-touch-icon.png',
] as const;

export function registryIconCandidates(homepage: string, preferredIconUrl?: string): string[] {
  const verified = verifiedRegistryHomepage(homepage);
  if (!verified) return [];
  const conventional = REGISTRY_ICON_PATHS.map(path => new URL(path, verified).href);
  const preferred = verifiedRegistryIconUrl(preferredIconUrl);
  return preferred
    ? [preferred, ...conventional.filter(candidate => candidate !== preferred)]
    : conventional;
}

export function registryFaviconUrl(homepage: string): string | null {
  return registryIconCandidates(homepage)[0] ?? null;
}

export function nextRegistryIconCandidate(
  candidates: readonly string[],
  currentIndex: number,
): { index: number; src: string } | null {
  const index = currentIndex + 1;
  const src = candidates[index];
  return src ? { index, src } : null;
}

export function renderRegistryIcon(
  registry: Pick<Registry, 'name' | 'url' | 'iconUrl'>,
  className = 'registry-icon',
): string {
  const fallback = registry.name.replace(/^@/, '').trim().charAt(0).toUpperCase() || 'R';
  const candidates = registryIconCandidates(registry.url, registry.iconUrl);
  const favicon = candidates[0];
  const encodedCandidates = escapeHtml(JSON.stringify(candidates));
  return `<span class="${escapeHtml(className)}" aria-hidden="true">
    <span class="registry-icon-fallback">${escapeHtml(fallback)}</span>
    ${favicon ? `<img src="${escapeHtml(favicon)}" alt="" data-registry-icon-image
      data-registry-icon-index="0" data-registry-icon-candidates="${encodedCandidates}"
      loading="lazy" decoding="async" referrerpolicy="no-referrer" />` : ''}
  </span>`;
}

function verifiedRegistryIconUrl(candidate?: string): string | null {
  if (!candidate || candidate.trim().startsWith('//')) return null;
  try {
    const url = new URL(candidate);
    const host = url.hostname.toLowerCase().replace(/\.$/, '');
    if (url.protocol !== 'https:' || url.username || url.password || url.port
      || !host || !host.includes('.') || host === 'localhost'
      || host.endsWith('.localhost') || host.endsWith('.local')
      || host.endsWith('.internal') || /^\d+(?:\.\d+){3}$/.test(host)) return null;
    return url.href;
  } catch {
    return null;
  }
}

export function registryItemSourceUrl(
  registry: Registry,
  slug: string,
  rawItemUrl?: string,
): string | null {
  const route = resolveRegistryItemRoute(
    registry.name,
    registry.mirror?.registryUrlTemplate ?? '',
    slug,
    rawItemUrl,
  );
  return route.status === 'available' ? route.url : null;
}

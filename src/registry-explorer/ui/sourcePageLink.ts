/** A component documentation page is distinct from its installable registry JSON. */
const trimTrailingSlashes = (path: string): string => path.replace(/\/+$/, '');

export function verifiedSourcePageUrl(
  candidate: string | null | undefined,
  registryHomepage: string,
): string | null {
  if (!candidate || !registryHomepage || candidate.startsWith('//')) return null;
  try {
    const page = new URL(candidate);
    const homepage = new URL(registryHomepage);
    if (page.protocol !== 'https:' || !['https:', 'http:'].includes(homepage.protocol)
      || page.username || page.password || page.port
      || page.hostname !== homepage.hostname
      || page.hostname === 'localhost' || page.hostname.endsWith('.local')
      || page.hostname.endsWith('.internal')
      || /^\d+(?:\.\d+){3}$/.test(page.hostname)
      || !page.hostname.includes('.')
      || trimTrailingSlashes(page.pathname).toLowerCase().endsWith('.json')
      || (trimTrailingSlashes(page.pathname) === trimTrailingSlashes(homepage.pathname)
        && !page.search)) return null;
    return page.href;
  } catch {
    return null;
  }
}

export function verifiedRegistryHomepage(candidate: string): string | null {
  try {
    const homepage = new URL(candidate);
    if (homepage.protocol !== 'https:' || homepage.username || homepage.password
      || homepage.port || !homepage.hostname.includes('.')
      || homepage.hostname === 'localhost'
      || homepage.hostname.endsWith('.local')
      || homepage.hostname.endsWith('.internal')
      || /^\d+(?:\.\d+){3}$/.test(homepage.hostname)) return null;
    return homepage.href;
  } catch {
    return null;
  }
}

import type { RegistrySourcePage } from '../core/registry.schema';

/** Prefer separately reviewed pages; never describe sitemap-only links as verified. */
export function sourcePageNavigation(
  homepage: string,
  candidates: {
    docsUrl?: string | null;
    sourcePage?: RegistrySourcePage;
  },
): { url: string; label: string; level: 'reviewed' | 'sitemap' | 'pattern' | 'observed' } | null {
  const reviewed = verifiedSourcePageUrl(candidates.docsUrl, homepage);
  if (reviewed) return { url: reviewed, label: 'View original', level: 'reviewed' };
  const page = candidates.sourcePage;
  if (!page) return null;
  const url = verifiedSourcePageUrl(page.url, homepage);
  if (!url) return null;
  return page.level === 'reviewed'
    ? { url, label: 'View original', level: 'reviewed' }
    : page.level === 'sitemap'
      ? { url, label: 'View sitemap-listed page', level: 'sitemap' }
      : page.level === 'pattern'
        ? { url, label: 'View pattern-matched page', level: 'pattern' }
        : null;
}

/**
 * Exact, observed anchors for individual Space UI demos on a grouped documentation
 * page. Recorded from public HTML at www.spaceui.one/primitives/aspect-ratio,
 * 2026-10-12. Do not extrapolate to unobserved slugs.
 */
const SPACEUI_ASPECT_RATIO_ANCHORS: Readonly<Record<string, string>> = {
  'demo-p-aspect-ratio-02': 'example-43-standard-aspect-ratio',
  'demo-p-aspect-ratio-03': 'example-11-square-aspect-ratio',
  'demo-p-aspect-ratio-04': 'example-219-ultrawide-aspect-ratio',
  'demo-p-aspect-ratio-05': 'example-916-portrait-aspect-ratio',
  'demo-p-aspect-ratio-06': 'example-32-classic-photography-aspect-ratio',
  'demo-p-aspect-ratio-07': 'example-45-social-media-portrait-aspect-ratio',
  'demo-p-aspect-ratio-08': 'example-1610-computer-monitor-aspect-ratio',
};

/** Shared source resolver. Never substitute an Atlas route or install JSON. */
export function sourcePageNavigationForItem(
  namespace: string,
  slug: string,
  homepage: string,
  candidates: { docsUrl?: string | null; sourcePage?: RegistrySourcePage },
): ReturnType<typeof sourcePageNavigation> {
  const indexed = sourcePageNavigation(homepage, candidates);
  if (indexed) return indexed;
  if (namespace !== '@spaceui') return null;
  const anchor = SPACEUI_ASPECT_RATIO_ANCHORS[slug];
  if (!anchor) return null;
  const verifiedHomepage = verifiedRegistryHomepage(homepage);
  if (!verifiedHomepage) return null;
  const hostname = new URL(verifiedHomepage).hostname;
  if (hostname !== 'www.spaceui.one' && hostname !== 'spaceui.one') return null;
  const url = verifiedSourcePageUrl(
    `https://${hostname}/primitives/aspect-ratio#${anchor}`,
    verifiedHomepage,
  );
  return url ? { url, label: 'View documented example', level: 'observed' } : null;
}

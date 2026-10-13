import { verifiedSourcePageUrl, verifiedRegistryHomepage } from '../core/sourcePageValidation';

export { verifiedSourcePageUrl, verifiedRegistryHomepage } from '../core/sourcePageValidation';

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

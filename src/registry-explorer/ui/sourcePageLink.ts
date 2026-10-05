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
    referenceUrl?: string | null;
    docsUrl?: string | null;
    demoUrl?: string | null;
    sourcePage?: RegistrySourcePage;
  },
): { url: string; label: string; level: 'reviewed' | 'sitemap' } | null {
  const reviewed = [candidates.referenceUrl, candidates.docsUrl, candidates.demoUrl]
    .map(url => verifiedSourcePageUrl(url, homepage)).find(Boolean);
  if (reviewed) return { url: reviewed, label: 'View original', level: 'reviewed' };
  const page = candidates.sourcePage;
  if (!page) return null;
  const url = verifiedSourcePageUrl(page.url, homepage);
  if (!url) return null;
  return page.level === 'reviewed'
    ? { url, label: 'View original', level: 'reviewed' }
    : page.level === 'sitemap'
      ? { url, label: 'View sitemap-listed page', level: 'sitemap' }
      : null;
}

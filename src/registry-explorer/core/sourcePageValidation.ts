/** Validation shared by canonical data imports and UI link rendering. */
const trimTrailingSlashes = (path: string): string => path.replace(/\/+$/, '');

function isPublicHostname(hostname: string): boolean {
  return hostname.includes('.')
    && hostname !== 'localhost'
    && !hostname.endsWith('.local')
    && !hostname.endsWith('.internal')
    && !/^\d+(?:\.\d+){3}$/.test(hostname);
}

function hasNoCredentialsOrPort(url: URL): boolean {
  return !url.username && !url.password && !url.port;
}

function hasAcceptableSourceOrigin(page: URL, homepage: URL): boolean {
  return page.protocol === 'https:'
    && ['http:', 'https:'].includes(homepage.protocol)
    && hasNoCredentialsOrPort(page)
    && page.hostname === homepage.hostname
    && isPublicHostname(page.hostname);
}

function isDisplayableSourcePath(page: URL, homepage: URL): boolean {
  const path = trimTrailingSlashes(page.pathname);
  if (path.toLowerCase().endsWith('.json')) return false;
  return path !== trimTrailingSlashes(homepage.pathname) || !!page.search;
}

export function verifiedSourcePageUrl(
  candidate: string | null | undefined,
  registryHomepage: string,
): string | null {
  if (!candidate || !registryHomepage || candidate.startsWith('//')) return null;
  try {
    const page = new URL(candidate);
    const homepage = new URL(registryHomepage);
    if (!hasAcceptableSourceOrigin(page, homepage)) return null;
    if (!isDisplayableSourcePath(page, homepage)) return null;
    return page.href;
  } catch {
    return null;
  }
}

export function verifiedRegistryHomepage(candidate: string): string | null {
  try {
    const homepage = new URL(candidate);
    return homepage.protocol === 'https:'
      && hasNoCredentialsOrPort(homepage)
      && isPublicHostname(homepage.hostname)
        ? homepage.href
        : null;
  } catch {
    return null;
  }
}

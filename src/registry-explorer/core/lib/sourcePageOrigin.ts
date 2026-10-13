/** Private URL-origin and path rules. Import through ../sourcePageValidation outside core. */
export const trimTrailingSlashes = (path: string): string => path.replace(/\/+$/, '');

export function isPublicHostname(hostname: string): boolean {
  return hostname.includes('.')
    && hostname !== 'localhost'
    && !hostname.endsWith('.local')
    && !hostname.endsWith('.internal')
    && !/^\d+(?:\.\d+){3}$/.test(hostname);
}

export function hasNoCredentialsOrPort(url: URL): boolean {
  return !url.username && !url.password && !url.port;
}

export function hasAcceptableSourceOrigin(page: URL, homepage: URL): boolean {
  return page.protocol === 'https:'
    && ['http:', 'https:'].includes(homepage.protocol)
    && hasNoCredentialsOrPort(page)
    && page.hostname === homepage.hostname
    && isPublicHostname(page.hostname);
}

export function isDisplayableSourcePath(page: URL, homepage: URL): boolean {
  const path = trimTrailingSlashes(page.pathname);
  if (path.toLowerCase().endsWith('.json')) return false;
  return path !== trimTrailingSlashes(homepage.pathname) || !!page.search;
}

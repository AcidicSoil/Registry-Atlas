/** Validated human-facing source links exported at the core module boundary. */
import { hasAcceptableSourceOrigin, hasNoCredentialsOrPort, isPublicHostname, isDisplayableSourcePath } from './lib/sourcePageOrigin';

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

const UNSUPPORTED_URL_COPY = 'Link unavailable: unsupported URL protocol.';

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function toSafeExternalUrl(value: string): URL | null {
  if (value.trim().startsWith('//')) {
    return null;
  }

  try {
    const url = new URL(value);

    return url.protocol === 'https:' || url.protocol === 'http:' ? url : null;
  } catch {
    return null;
  }
}

export function renderExternalLink(
  url: string,
  label: string,
  className = 'registry-url'
): string {
  const safeUrl = toSafeExternalUrl(url);

  if (!safeUrl) {
    return UNSUPPORTED_URL_COPY;
  }

  return `<a href="${escapeHtml(safeUrl.href)}" class="${escapeHtml(className)}" target="_blank" rel="noreferrer">${escapeHtml(label)}</a>`;
}

/** Homepage links are navigation only: never render raw registry endpoints as replacements. */
export function renderRegistryHomepageLink(
  homepage: string,
  className = 'link-button registry-homepage-link',
  label = 'Visit registry homepage',
): string {
  const url = toSafeExternalUrl(homepage);
  if (!url || url.username || url.password) return '';
  const host = url.hostname.toLowerCase().replace(/\.$/, '');
  if (!host || host === 'localhost' || host.endsWith('.localhost')
    || host.endsWith('.local') || host.endsWith('.internal')
    || host.includes(':') || /^\d+(?:\.\d+){3}$/.test(host)) return '';
  return renderExternalLink(url.href, label, className);
}

export function renderSafeExternalImage(
  url: string,
  alt: string,
  className = 'external-image',
): string {
  const safeUrl = toSafeExternalUrl(url);
  if (!safeUrl) return '';
  return `<img src="${escapeHtml(safeUrl.href)}" alt="${escapeHtml(alt)}" class="${escapeHtml(className)}" loading="lazy" decoding="async" referrerpolicy="no-referrer" />`;
}

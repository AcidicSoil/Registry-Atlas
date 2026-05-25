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

    return url.protocol === 'https:' ? url : null;
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

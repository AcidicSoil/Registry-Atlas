import type { RegistryVisualReference } from '../core/registry.schema';
import { escapeHtml } from './renderSafety';

const LOCAL_IMAGE = /^\/Registry-Atlas\/data\/previews\/[a-z0-9-]+(?:\/[a-z0-9-]+)*\.(?:jpg|jpeg|png|webp)$/i;
const REMOTE_IMAGE = /\.(?:jpg|jpeg|png|webp|svg)$/i;

export function verifiedVisualReference(
  candidate: RegistryVisualReference | undefined,
): RegistryVisualReference | null {
  if (!candidate) return null;
  try {
    const page = new URL(candidate.officialPage);
    if (page.protocol !== 'https:' || page.username || page.password
      || !page.hostname.includes('.') || page.hostname === 'localhost'
      || page.hostname.endsWith('.local') || page.hostname.endsWith('.internal')
      || page.hostname.includes(':')
      || /^\d+(?:\.\d+){3}$/.test(page.hostname)) return null;
    if (LOCAL_IMAGE.test(candidate.imageUrl)) {
      return { imageUrl: candidate.imageUrl, officialPage: page.href };
    }
    const image = new URL(candidate.imageUrl);
    if (image.protocol !== 'https:' || image.origin !== page.origin
      || image.username || image.password || image.search || image.hash
      || !REMOTE_IMAGE.test(image.pathname)) return null;
    return { imageUrl: image.href, officialPage: page.href };
  } catch { return null; }
}

export function renderVisualReferenceImage(reference: RegistryVisualReference, title: string,
  className = 'catalog-component-preview-image'): string {
  return `<img src="${escapeHtml(reference.imageUrl)}" alt="${escapeHtml(title)} visual reference"
    class="${escapeHtml(className)}" loading="lazy" decoding="async" referrerpolicy="no-referrer" />`;
}

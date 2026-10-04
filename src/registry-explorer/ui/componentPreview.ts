import { escapeHtml } from './renderSafety';
import manifest from '../data/component-demo-manifest.json';

export type DemoKind = 'upstream-built';
export interface ReviewedDemo {
  namespace: string;
  slug: string;
  kind: DemoKind;
  status: 'interaction-verified';
  path: string;
  source: { docsUrl: string; registryItemUrl: string };
  reviewedAt: string;
  verifiedAt: string;
  sourceSha256?: string;
}

const PATH_PATTERN = /^\/Registry-Atlas\/component-demos\/[a-z0-9-]+(?:\/[a-z0-9-]+)*\/index\.html$/;
const TOKEN_PATTERN = /^@[a-z0-9][a-z0-9-]*$/;
const SCHEMA = 'registry-atlas-component-demos/v1';

function isRenderable(entry: unknown): entry is ReviewedDemo {
  if (!entry || typeof entry !== 'object') return false;
  const demo = entry as Record<string, unknown>;
  if (typeof demo.namespace !== 'string' || !TOKEN_PATTERN.test(demo.namespace)
      || typeof demo.slug !== 'string' || !demo.slug || demo.slug.includes('..')
      || demo.kind !== 'upstream-built'
      || demo.status !== 'interaction-verified'
      || typeof demo.path !== 'string' || !PATH_PATTERN.test(demo.path)
      || typeof demo.reviewedAt !== 'string' || !Number.isFinite(Date.parse(demo.reviewedAt))
      || typeof demo.verifiedAt !== 'string' || !Number.isFinite(Date.parse(demo.verifiedAt))) return false;
  if (demo.kind === 'upstream-built'
      && (typeof demo.sourceSha256 !== 'string' || !/^[a-f0-9]{64}$/.test(demo.sourceSha256)
        || !/^\/Registry-Atlas\/component-demos\/generated\/[a-f0-9]{64}\/index\.html$/.test(demo.path))) return false;
  const source = demo.source;
  if (!source || typeof source !== 'object') return false;
  const record = source as Record<string, unknown>;
  return typeof record.docsUrl === 'string'
    && /^https:\/\/[^/]+\/.+/.test(record.docsUrl)
    && typeof record.registryItemUrl === 'string'
    && /^https:\/\/[^/]+\/.+\.json$/.test(record.registryItemUrl);
}

function verifiedManifestItems(): ReadonlyMap<string, ReviewedDemo | null> {
  const output = new Map<string, ReviewedDemo | null>();
  if (manifest.schema !== SCHEMA || !Array.isArray(manifest.items)) return output;
  for (const candidate of manifest.items as unknown[]) {
    if (!isRenderable(candidate)) continue;
    const key = candidate.namespace + '/' + candidate.slug;
    output.set(key, output.has(key) ? null : candidate);
  }
  return output;
}

const verified = verifiedManifestItems();
const reviewedNamespaces = new Set([...verified.values()]
  .filter((entry): entry is ReviewedDemo => entry !== null)
  .map(entry => entry.namespace));
export const isReviewedSourceNamespace = (namespace: string): boolean =>
  reviewedNamespaces.has(namespace);

export function verifiedComponentDemo(namespace: string, slug: string): ReviewedDemo | null {
  return verified.get(namespace + '/' + slug) ?? null;
}

export function renderComponentPreview(
  namespace: string,
  slug: string,
  mode: 'card' | 'detail',
): string | null {
  const demo = verifiedComponentDemo(namespace, slug);
  if (!demo) return null;
  const src = demo.path + '?item=' + encodeURIComponent(slug) + '&mode=' + mode;
  return `<iframe
    class="component-demo-frame component-demo-frame-${mode}"
    data-component-demo="${escapeHtml(namespace + '/' + slug)}"
    src="${escapeHtml(src)}"
    title="${escapeHtml(slug)} interactive component example"
    sandbox="allow-scripts"
    referrerpolicy="no-referrer"
    loading="${mode === 'card' ? 'lazy' : 'eager'}"></iframe>`;
}

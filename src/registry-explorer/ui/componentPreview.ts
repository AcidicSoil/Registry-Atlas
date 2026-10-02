import { escapeHtml } from './renderSafety';

// Reviewed, sandboxed interaction fixtures. These are not a general-purpose
// executor for arbitrary remote registry code.
const LIVE_COMPONENTS = new Set([
  '@8bitcn/button',
  '@8bitcn/card',
  '@8bitcn/input',
]);

export function renderComponentPreview(
  namespace: string,
  slug: string,
  mode: 'card' | 'detail',
): string | null {
  if (!LIVE_COMPONENTS.has(namespace + '/' + slug)) return null;
  const src = '/Registry-Atlas/component-demos/8bitcn/index.html'
    + '?item=' + encodeURIComponent(slug)
    + '&mode=' + mode;
  return `<iframe
    class="component-demo-frame component-demo-frame-${mode}"
    data-component-demo="${escapeHtml(namespace + '/' + slug)}"
    src="${escapeHtml(src)}"
    title="${escapeHtml(slug)} interactive component example"
    sandbox="allow-scripts"
    referrerpolicy="no-referrer"
    loading="${mode === 'card' ? 'lazy' : 'eager'}"></iframe>`;
}

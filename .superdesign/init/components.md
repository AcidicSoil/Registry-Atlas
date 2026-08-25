# Shared UI components

Registry Atlas uses vanilla TypeScript DOM renderers rather than a component library. The reusable visual primitive below is the existing component peek renderer.

## componentPeekView.ts
```ts
import type { ComponentPeekViewModel } from '../core/componentPeek.ts';
import { escapeHtml, renderExternalLink } from './renderSafety.ts';

export function renderComponentPeek(peek: ComponentPeekViewModel): string {
  const visual = peek.previewUrl
    ? `
      <div class="component-peek-visual" aria-label="Component preview available">
        ${renderExternalLink(peek.previewUrl, 'Open component page', 'install-button install-button-primary')}
      </div>
    `
    : `
      <div class="component-peek-placeholder">
        <strong>Preview not available yet</strong>
        ${peek.componentPageUrl
          ? renderExternalLink(peek.componentPageUrl, 'Open component page', 'install-button install-button-primary')
          : '<span class="muted">Open the component page to inspect it.</span>'}
      </div>
    `;

  return `
    <div class="component-peek-popover" role="dialog" aria-label="Component preview" data-component-peek-popover="${escapeHtml(peek.id)}">
      <div class="component-peek-title">${escapeHtml(peek.title)}</div>
      ${visual}
    </div>
  `;
}

```

## renderSafety.ts
```ts
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

```

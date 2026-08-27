import type { ComponentPeekViewModel } from '../core/componentPeek.ts';
import { escapeHtml, renderExternalLink, toSafeExternalUrl } from './renderSafety.ts';

export function componentPeekDomId(id: string): string {
  return `component-peek-${encodeURIComponent(id)}`;
}

export function renderComponentPeek(peek: ComponentPeekViewModel): string {
  const previewUrl = peek.previewUrl ? toSafeExternalUrl(peek.previewUrl)?.href ?? null : null;
  const componentPageUrl = peek.componentPageUrl ? toSafeExternalUrl(peek.componentPageUrl)?.href ?? null : null;
  const visual = previewUrl
    ? `
      <div class="component-peek-visual" aria-label="Component preview available">
        ${renderExternalLink(previewUrl, 'Open preview', 'install-button install-button-primary')}
        ${componentPageUrl && componentPageUrl !== previewUrl
          ? renderExternalLink(componentPageUrl, 'Open component page', 'secondary-link')
          : ''}
      </div>
    `
    : `
      <div class="component-peek-unavailable">
        <strong>Preview not available yet</strong>
        ${componentPageUrl
          ? renderExternalLink(componentPageUrl, 'Open component page', 'install-button install-button-primary')
          : '<span class="muted">Preview unavailable</span>'}
      </div>
    `;

  return `
    <div class="component-peek-inline" id="${escapeHtml(componentPeekDomId(peek.id))}" role="region" aria-label="Component preview" data-component-peek-popover="${escapeHtml(peek.id)}">
      <div class="component-peek-title">${escapeHtml(peek.title)}</div>
      ${visual}
    </div>
  `;
}

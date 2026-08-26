import type { ComponentPeekViewModel } from '../core/componentPeek.ts';
import { escapeHtml, renderExternalLink } from './renderSafety.ts';

export function componentPeekDomId(id: string): string {
  return `component-peek-${id.replace(/[^a-zA-Z0-9@_-]/g, '-')}`;
}

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
    <div class="component-peek-popover" id="${componentPeekDomId(peek.id)}" aria-label="Component preview" data-component-peek-popover="${escapeHtml(peek.id)}">
      <div class="component-peek-title">${escapeHtml(peek.title)}</div>
      ${visual}
      <button class="link-button" type="button" data-view-item-registry="${escapeHtml(peek.registryName)}" data-view-item-slug="${escapeHtml(peek.itemSlug)}">View details</button>
    </div>
  `;
}

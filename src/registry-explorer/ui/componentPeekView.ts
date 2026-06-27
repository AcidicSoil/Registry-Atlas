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

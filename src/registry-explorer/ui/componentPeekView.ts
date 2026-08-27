import type { ComponentPeekViewModel } from '../core/componentPeek.ts';
import { escapeHtml, renderExternalLink, renderSafeExternalImage } from './renderSafety.ts';

export function componentPeekDomId(id: string): string {
  return `component-peek-${encodeURIComponent(id)}`;
}

export function renderComponentPeek(peek: ComponentPeekViewModel): string {
  const image = renderSafeExternalImage(peek.previewUrl, `${peek.title} preview`, 'component-peek-image');
  if (!image) return '';

  return `
    <div class="component-peek-inline" id="${escapeHtml(componentPeekDomId(peek.id))}" role="region" aria-label="${escapeHtml(peek.title)} preview" data-component-peek-popover="${escapeHtml(peek.id)}">
      <div class="component-peek-title">${escapeHtml(peek.title)}</div>
      <div class="component-peek-visual">
        ${image}
        ${peek.componentPageUrl ? renderExternalLink(peek.componentPageUrl, 'Open component page', 'secondary-link') : ''}
      </div>
    </div>
  `;
}

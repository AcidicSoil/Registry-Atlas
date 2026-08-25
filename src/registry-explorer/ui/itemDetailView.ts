import { buildInstallAgentPrompt, buildInspectionPrompt } from '../core/itemPrompts.ts';
import type { RegistryItemDetailResult, RegistryItemDetail } from '../core/registryItemDetail.ts';
import {
  buildRelatedComponents,
  buildRelatedRegistries,
  type RelatedComponent,
  type RelatedRegistry,
} from '../core/relatedComponents.ts';
import type { InstallActionState, Registry, RegistryItemSummaryFile } from '../core/registry.schema.ts';
import { escapeHtml, renderExternalLink, renderSafeExternalImage } from './renderSafety.ts';

export function renderItemDetailView(
  headerRoot: HTMLElement,
  bodyRoot: HTMLElement,
  result: RegistryItemDetailResult,
  queuedTokens: ReadonlySet<string>,
  registries: readonly Registry[] = [],
): void {
  const detail = result.detail;
  const related = detail ? buildRelatedComponents(registries, { registryName: detail.namespace, itemSlug: detail.slug }) : [];
  const relatedRegistries = detail ? buildRelatedRegistries(registries, { registryName: detail.namespace, itemSlug: detail.slug }) : [];
  headerRoot.innerHTML = renderHeader(detail, result.status);
  bodyRoot.innerHTML = detail ? renderDetailBody(detail, result, queuedTokens, related, relatedRegistries) : renderMissingBody(result);
}

function renderHeader(detail: RegistryItemDetail | null, status: RegistryItemDetailResult['status']): string {
  if (!detail) {
    return `
      <div>
        <button class="link-button" type="button" data-back-from-item>← Back to results</button>
        <h1>Component details unavailable</h1>
        <p>Atlas could not find this component in the selected registry.</p>
      </div>
    `;
  }

  return `
    <div>
      <button class="link-button" type="button" data-back-from-item>← Back to results</button>
      <h1>${escapeHtml(detail.title)}</h1>
      <p>${escapeHtml(detail.namespace)} · ${escapeHtml(detail.slug)}</p>
      <div class="profile-chips">
        <span class="status-chip status-${escapeHtml(detail.catalogStatus)}">${escapeHtml(statusLabel(detail, status))}</span>
        <span class="confidence-chip">${escapeHtml(detail.confidence)} confidence</span>
        ${detail.type ? `<span>${escapeHtml(detail.type)}</span>` : ''}
        ${detail.category ? `<span>${escapeHtml(detail.category)}</span>` : ''}
      </div>
    </div>
  `;
}

function renderDetailBody(
  detail: RegistryItemDetail,
  result: RegistryItemDetailResult,
  queuedTokens: ReadonlySet<string>,
  related: readonly RelatedComponent[],
  relatedRegistries: readonly RelatedRegistry[],
): string {
  const fallback = result.status === 'loaded' || result.status === 'summary-only'
    ? ''
    : renderFallback(result);

  return `
    <article class="item-detail-page">
      <section class="item-detail-hero">
        ${renderPreview(detail)}
        <div class="item-detail-summary">
          ${detail.description ? `<p>${escapeHtml(detail.description)}</p>` : '<p class="muted">No component description is available yet.</p>'}
          <div class="item-action-row">
            ${renderComponentPageAction(detail)}
            ${renderInstallActions(detail.installAction, detail, queuedTokens)}
          </div>
          ${renderPromptActions(detail)}
          ${renderEvaluationLabels(detail)}
          ${renderTaxonomy(detail.taxonomyLabels)}
          ${fallback}
        </div>
      </section>
      ${renderRelatedComponents(related)}
      ${renderRelatedRegistries(relatedRegistries)}
      <section class="item-detail-cards" aria-label="Component details">
        ${renderListCard('Dependencies', detail.dependencies)}
        ${renderListCard('Dev dependencies', detail.devDependencies)}
        ${renderListCard('Registry dependencies', detail.registryDependencies)}
        ${renderFilesCard(detail.files)}
        ${renderSourceCard(detail)}
      </section>
    </article>
  `;
}

function renderMissingBody(result: RegistryItemDetailResult): string {
  return `
    <div class="empty-state">
      <div class="empty-state-icon">⌕</div>
      <h2>Component details unavailable</h2>
      <p>${escapeHtml(result.message ?? 'Atlas could not load this item yet.')} Open the component page or registry source to inspect it outside Atlas.</p>
    </div>
  `;
}

function renderPreview(detail: RegistryItemDetail): string {
  if (detail.previewUrl) {
    const image = renderSafeExternalImage(detail.previewUrl, `${detail.title} preview`, 'item-preview-image');
    if (image) {
      return `
        <div class="item-preview-panel">
          ${image}
          ${renderExternalLink(detail.previewUrl, 'Open preview', 'secondary-link')}
        </div>
      `;
    }
  }

  return `
    <div class="item-preview-panel item-preview-placeholder">
      <strong>Preview unavailable</strong>
      <span>No verified visual preview is available in the current catalog data.</span>
      ${detail.componentPageUrl ? renderExternalLink(detail.componentPageUrl, 'Open component page', 'install-button install-button-primary') : ''}
    </div>
  `;
}

function renderComponentPageAction(detail: RegistryItemDetail): string {
  if (detail.componentPageUrl) {
    return renderExternalLink(detail.componentPageUrl, 'Open component page', 'install-button install-button-primary');
  }

  if (detail.registry.url) {
    return renderExternalLink(detail.registry.url, 'Open registry homepage', 'install-button install-button-primary');
  }

  return '<span class="muted">Component page unavailable</span>';
}

function renderInstallActions(action: InstallActionState, detail: RegistryItemDetail, queuedTokens: ReadonlySet<string>): string {
  if (action.status === 'disabled') {
    return `
      <div class="install-actions install-actions-disabled" aria-label="Install actions unavailable">
        <button class="install-button" type="button" disabled>Copy install</button>
        <button class="install-button" type="button" disabled>Inspect first</button>
        <span class="install-disabled-reason">${escapeHtml(action.disabledReason)}</span>
      </div>
    `;
  }

  const queued = queuedTokens.has(action.token);
  const queueButton = queued
    ? `<button class="install-button" type="button" data-queue-remove="${escapeHtml(action.token)}">Remove from queue</button>`
    : `<button class="install-button" type="button" data-queue-add="${escapeHtml(action.token)}" data-queue-label="${escapeHtml(detail.title)}" data-queue-registry="${escapeHtml(detail.namespace)}" data-queue-item="${escapeHtml(detail.slug)}" data-queue-install="${escapeHtml(action.installCommand)}" data-queue-inspect="${escapeHtml(action.inspectCommand)}" data-queue-route="${escapeHtml(action.route)}">Add to queue</button>`;

  return `
    <div class="install-actions" aria-label="Install actions for ${escapeHtml(detail.title)}">
      <code class="install-token">${escapeHtml(action.token)}</code>
      <button class="install-button" type="button" data-copy-text="${escapeHtml(action.inspectCommand)}" data-copy-label="Inspect command copied">Inspect first</button>
      <button class="install-button install-button-primary" type="button" data-copy-text="${escapeHtml(action.installCommand)}" data-copy-label="Install command copied">Copy install</button>
      ${queueButton}
      <span class="install-safety-note">Copy-only. Review source before installing third-party registry code.</span>
    </div>
  `;
}

function renderPromptActions(detail: RegistryItemDetail): string {
  const agentPrompt = buildInstallAgentPrompt(detail);
  const inspectionPrompt = buildInspectionPrompt(detail);
  return `
    <div class="item-prompt-actions" aria-label="Copy component context">
      ${agentPrompt ? `<button class="install-button" type="button" data-copy-text="${escapeHtml(agentPrompt)}" data-copy-label="Agent prompt copied">Copy agent prompt</button>` : ''}
      ${inspectionPrompt ? `<button class="install-button" type="button" data-copy-text="${escapeHtml(inspectionPrompt)}" data-copy-label="Inspection prompt copied">Copy inspection prompt</button>` : ''}
      <button class="install-button" type="button" data-copy-current-url>Copy link</button>
    </div>
  `;
}

function renderTaxonomy(labels: readonly string[]): string {
  if (labels.length === 0) return '';
  return `
    <div class="item-taxonomy" aria-label="Alternate terminology">
      <strong>Alternate terminology</strong>
      <div class="discovery-item-meta">${labels.slice(0, 4).map(label => `<span class="taxonomy-tag-chip">${escapeHtml(label)}</span>`).join('')}</div>
    </div>
  `;
}

function renderEvaluationLabels(detail: RegistryItemDetail): string {
  const labels = [
    `${detail.dependencies.length} dependencies`,
    `${detail.registryDependencies.length} registry deps`,
    `${detail.files.length} files`,
    detail.visualStatus === 'available' ? 'visual available' : 'preview unavailable',
    detail.catalogStatus === 'available' ? 'catalog-backed' : detail.catalogStatus,
  ];
  return `<div class="discovery-item-meta" aria-label="Component evaluation context">${labels.map(label => `<span>${escapeHtml(label)}</span>`).join('')}<span>Review third-party registry code before installing.</span></div>`;
}

function renderRelatedComponents(related: readonly RelatedComponent[]): string {
  if (related.length === 0) {
    return `
      <section class="related-components" aria-label="Related components">
        <h2>Similar patterns</h2>
        <p class="muted">No similar components in this data set yet.</p>
      </section>
    `;
  }

  return `
    <section class="related-components" aria-label="Related components">
      <div>
        <h2>Similar patterns</h2>
        <p class="muted">Matched by shared type, category, or tags.</p>
      </div>
      <div class="related-component-list">
        ${related.map(item => `
          <article class="related-component-card">
            <div class="related-preview-placeholder">${item.previewUrl ? 'View' : 'No visual'}</div>
            <div>
              <strong>${escapeHtml(item.title)}</strong>
              <div class="muted">${escapeHtml(item.registryName)} · ${escapeHtml(item.matchReasons.join(', '))}</div>
            </div>
            <button class="link-button" type="button" data-view-item-registry="${escapeHtml(item.registryName)}" data-view-item-slug="${escapeHtml(item.itemSlug)}">View component</button>
          </article>
        `).join('')}
      </div>
    </section>
  `;
}

function renderRelatedRegistries(related: readonly RelatedRegistry[]): string {
  if (related.length === 0) return '';
  return `
    <section class="related-registries" aria-label="Related registries">
      <h2>Related registries</h2>
      <div class="related-registry-list">
        ${related.map(item => `
          <article class="related-registry-card">
            <strong>${escapeHtml(item.registryName)}</strong>
            <span>${escapeHtml(item.matchReasons.join(', '))}</span>
            <span>${escapeHtml(item.matchedItems.join(', '))}</span>
            <button class="link-button" type="button" data-profile-registry="${escapeHtml(item.registryName)}">View registry</button>
          </article>
        `).join('')}
      </div>
    </section>
  `;
}

function renderListCard(title: string, items: readonly string[]): string {
  return `
    <section class="item-detail-card">
      <h2>${escapeHtml(title)}</h2>
      ${items.length ? `<div class="item-dependency-list">${items.map(item => `<code>${escapeHtml(item)}</code>`).join('')}</div>` : '<p class="muted">None listed.</p>'}
    </section>
  `;
}

function renderFilesCard(files: readonly RegistryItemSummaryFile[]): string {
  return `
    <section class="item-detail-card">
      <h2>Files</h2>
      ${files.length ? `<div class="item-file-list">${files.map(file => `
        <div>
          <code>${escapeHtml(file.path)}</code>
          <span>${escapeHtml(file.type)}${file.target ? ` → ${escapeHtml(file.target)}` : ''}</span>
        </div>
      `).join('')}</div>` : '<p class="muted">No files listed.</p>'}
    </section>
  `;
}

function renderSourceCard(detail: RegistryItemDetail): string {
  const links = [
    detail.docsUrl ? renderExternalLink(detail.docsUrl, 'Docs', 'secondary-link') : '',
    detail.evidenceUrl ? renderExternalLink(detail.evidenceUrl, 'Evidence', 'secondary-link') : '',
    renderExternalLink(detail.registry.url, 'Registry homepage', 'secondary-link'),
  ].filter(Boolean).slice(0, 3).join(' ');

  return `
    <section class="item-detail-card">
      <h2>Source context</h2>
      <dl class="profile-facts">
        <div class="profile-fact"><dt>Source</dt><dd>${escapeHtml(detail.source)}</dd></div>
        <div class="profile-fact"><dt>Provenance</dt><dd>${escapeHtml(detail.provenance)}</dd></div>
        ${detail.warnings.length ? `<div class="profile-fact"><dt>Warnings</dt><dd>${escapeHtml(detail.warnings.join(', '))}</dd></div>` : ''}
      </dl>
      <div class="secondary-links">${links}</div>
    </section>
  `;
}

function renderFallback(result: RegistryItemDetailResult): string {
  if (result.status === 'fetch-error') {
    return '<div class="partial-data-note">Atlas could not load this item from the registry. You can still open the component page or inspect the source outside Atlas.</div>';
  }
  if (result.status === 'invalid-json' || result.status === 'invalid-schema') {
    return '<div class="partial-data-note">Atlas could not read this registry item safely. The component page may still be available from the registry.</div>';
  }
  return `<div class="partial-data-note">${escapeHtml(result.message ?? 'Component details unavailable.')}</div>`;
}

function statusLabel(detail: RegistryItemDetail, status: RegistryItemDetailResult['status']): string {
  if (status === 'loaded') return 'catalog-backed detail';
  if (status === 'summary-only') return detail.catalogStatus === 'available' ? 'catalog-backed summary' : detail.catalogStatus;
  return 'detail unavailable';
}

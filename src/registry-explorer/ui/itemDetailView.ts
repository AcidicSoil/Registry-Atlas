import type { RegistryItemDetailResult, RegistryItemDetail } from '../core/registryItemDetail.ts';
import type { InstallActionState, RegistryItemSummaryFile } from '../core/registry.schema.ts';
import { escapeHtml, renderExternalLink } from './renderSafety.ts';

export function renderItemDetailView(
  headerRoot: HTMLElement,
  bodyRoot: HTMLElement,
  result: RegistryItemDetailResult,
  queuedTokens: ReadonlySet<string>,
): void {
  const detail = result.detail;
  headerRoot.innerHTML = renderHeader(detail, result.status);
  bodyRoot.innerHTML = detail ? renderDetailBody(detail, result, queuedTokens) : renderMissingBody(result);
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
          ${renderTaxonomy(detail.taxonomyLabels)}
          ${fallback}
        </div>
      </section>
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
    return `
      <div class="item-preview-panel">
        ${renderExternalLink(detail.previewUrl, 'Open component page', 'install-button install-button-primary')}
      </div>
    `;
  }

  return `
    <div class="item-preview-panel item-preview-placeholder">
      <strong>Preview not available in Atlas yet</strong>
      <span>Open the component page to see the live example.</span>
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
      <button class="install-button" type="button" data-copy-command="${escapeHtml(action.inspectCommand)}">Inspect first</button>
      <button class="install-button install-button-primary" type="button" data-copy-command="${escapeHtml(action.installCommand)}">Copy install</button>
      ${queueButton}
      <span class="install-safety-note">Copy-only. Review source before installing third-party registry code.</span>
    </div>
  `;
}

function renderTaxonomy(labels: readonly string[]): string {
  if (labels.length === 0) return '';
  return `<div class="discovery-item-meta">${labels.slice(0, 4).map(label => `<span class="taxonomy-tag-chip">${escapeHtml(label)}</span>`).join('')}</div>`;
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

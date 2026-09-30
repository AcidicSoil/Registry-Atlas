import { buildInstallAgentPrompt, buildInspectionPrompt } from '../core/itemPrompts.ts';
import type { RegistryItemDetailResult, RegistryItemDetail } from '../core/registryItemDetail.ts';
import type { InstallActionState, RegistryItemSummaryFile } from '../core/registry.schema.ts';
import { escapeHtml, renderExternalLink, renderSafeExternalImage, toSafeExternalUrl } from './renderSafety.ts';

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
        <h1>Item details unavailable</h1>
        <p>Registry Atlas could not find this item in the selected registry.</p>
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
        ${detail.type ? `<span>${escapeHtml(detail.type.replace(/^registry:/, ''))}</span>` : ''}
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
  const previewUrl = detail.previewUrl ? toSafeExternalUrl(detail.previewUrl)?.href ?? null : null;

  return `
    <article class="item-detail-page">
      <section class="item-detail-hero">
        ${renderPreview(detail, previewUrl)}
        <div class="item-detail-summary">
          ${detail.description ? `<p>${escapeHtml(detail.description)}</p>` : '<p class="muted">No description is available.</p>'}
          <div class="item-action-row">
            ${renderComponentPageAction(detail, detail.installAction.status === 'enabled')}
            ${renderOpenInV0Action(detail)}
            ${renderInstallActions(detail.installAction, detail, queuedTokens)}
          </div>
          ${renderPromptActions(detail)}
          ${renderEvaluationLabels(detail, previewUrl !== null)}
          ${fallback}
        </div>
      </section>
      <section class="item-detail-cards" aria-label="Item details">
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
      <h2>Item details unavailable</h2>
      <p>${escapeHtml(result.message ?? 'Registry Atlas could not load this item.')} Open the item page or registry source to inspect it outside Registry Atlas.</p>
    </div>
  `;
}

function renderPreview(detail: RegistryItemDetail, previewUrl: string | null): string {
  if (previewUrl) {
    const image = renderSafeExternalImage(previewUrl, `${detail.title} preview`, 'item-preview-image');
    if (image) {
      return `
        <div class="item-preview-panel">
          ${image}
          ${renderExternalLink(previewUrl, 'Open preview', 'secondary-link')}
        </div>
      `;
    }
  }

  const facts = [
    detail.author ? `By ${detail.author}` : '',
    `${detail.files.length} ${detail.files.length === 1 ? 'file' : 'files'}`,
    `${detail.dependencies.length} ${detail.dependencies.length === 1 ? 'dependency' : 'dependencies'}`,
  ].filter(Boolean);

  return `
    <div class="item-preview-metadata">
      <div class="catalog-eyebrow">Item details</div>
      <code>${escapeHtml((detail.type ?? 'registry:item').replace(/^registry:/, ''))}</code>
      <h2>${escapeHtml(detail.title)}</h2>
      <p>${escapeHtml(detail.description ?? 'No preview image is published for this item.')}</p>
      <div class="item-preview-metadata-facts">
        ${facts.map(fact => `<span>${escapeHtml(fact)}</span>`).join('')}
      </div>
      <div class="item-preview-metadata-status">No preview image</div>
      ${detail.componentPageUrl ? renderExternalLink(detail.componentPageUrl, 'Open component page', 'secondary-link') : ''}
    </div>
  `;
}

function renderComponentPageAction(detail: RegistryItemDetail, installationEnabled: boolean): string {
  const className = installationEnabled ? 'secondary-link' : 'install-button install-button-primary';
  if (detail.componentPageUrl) {
    return renderExternalLink(detail.componentPageUrl, 'Open component page', className);
  }

  if (detail.route.status === 'available') {
    return renderExternalLink(detail.route.url, 'Open raw item', className);
  }

  if (detail.registry.url) {
    return renderExternalLink(detail.registry.url, 'Open registry homepage', className);
  }

  return '<span class="muted">Item source unavailable</span>';
}

function renderOpenInV0Action(detail: RegistryItemDetail): string {
  if (detail.route.status !== 'available') return '';
  const rawItemUrl = toSafeExternalUrl(detail.route.url);
  if (!rawItemUrl || rawItemUrl.protocol !== 'https:') return '';
  const openUrl = `https://v0.dev/chat/api/open?url=${encodeURIComponent(rawItemUrl.href)}`;
  return renderExternalLink(openUrl, 'Open in v0', 'secondary-link');
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
    </div>
  `;
}

function renderPromptActions(detail: RegistryItemDetail): string {
  const agentPrompt = buildInstallAgentPrompt(detail);
  const inspectionPrompt = buildInspectionPrompt(detail);
  return `
    <div class="item-prompt-actions" aria-label="Copy component context">
      ${agentPrompt ? `<button class="install-button" type="button" data-copy-text="${escapeHtml(agentPrompt)}" data-copy-label="Agent prompt copied">Copy install-agent prompt</button>` : ''}
      ${inspectionPrompt ? `<button class="install-button" type="button" data-copy-text="${escapeHtml(inspectionPrompt)}" data-copy-label="Inspection prompt copied">Copy inspection prompt</button>` : ''}
      <button class="install-button" type="button" data-copy-current-url>Copy link</button>
    </div>
  `;
}

function renderEvaluationLabels(detail: RegistryItemDetail, previewAvailable: boolean): string {
  const labels = [
    `${detail.dependencies.length} dependencies`,
    `${detail.registryDependencies.length} registry dependencies`,
    `${detail.files.length} files`,
    previewAvailable ? 'Preview' : 'No preview',
  ];
  return `<div class="discovery-item-meta" aria-label="Item summary">${labels.map(label => `<span>${escapeHtml(label)}</span>`).join('')}</div>`;
}

function renderListCard(title: string, items: readonly string[]): string {
  if (items.length === 0) return '';
  return `
    <section class="item-detail-card">
      <h2>${escapeHtml(title)}</h2>
      <div class="item-dependency-list">${items.map(item => `<code>${escapeHtml(item)}</code>`).join('')}</div>
    </section>
  `;
}

function renderFilesCard(files: readonly RegistryItemSummaryFile[]): string {
  if (files.length === 0) return '';
  return `
    <section class="item-detail-card">
      <h2>Files</h2>
      <div class="item-file-list">${files.map(file => `
        <div>
          <code>${escapeHtml(file.path)}</code>
          <span>${escapeHtml(file.type)}${file.target ? ` → ${escapeHtml(file.target)}` : ''}</span>
        </div>
      `).join('')}</div>
    </section>
  `;
}

function renderSourceCard(detail: RegistryItemDetail): string {
  const links = [
    detail.docsUrl ? renderExternalLink(detail.docsUrl, 'Docs', 'secondary-link') : '',
    detail.route.status === 'available' ? renderExternalLink(detail.route.url, 'Open raw item', 'secondary-link') : '',
    detail.evidenceUrl ? renderExternalLink(detail.evidenceUrl, 'Source record', 'secondary-link') : '',
    renderExternalLink(detail.registry.url, 'Registry homepage', 'secondary-link'),
  ].filter(Boolean).slice(0, 4).join(' ');

  return `
    <section class="item-detail-card">
      <h2>Source</h2>
      <dl class="profile-facts">
        <div class="profile-fact"><dt>Source</dt><dd>${escapeHtml(detail.source)}</dd></div>
        <div class="profile-fact"><dt>Imported from</dt><dd>${escapeHtml(detail.provenance)}</dd></div>
        ${detail.warnings.length ? `<div class="profile-fact"><dt>Warnings</dt><dd>${escapeHtml(detail.warnings.join(', '))}</dd></div>` : ''}
      </dl>
      <div class="secondary-links">${links}</div>
    </section>
  `;
}

function renderFallback(result: RegistryItemDetailResult): string {
  if (result.status === 'fetch-error') {
    return '<div class="partial-data-note">Full item details could not be loaded. Showing the saved summary.</div>';
  }
  if (result.status === 'invalid-json' || result.status === 'invalid-schema') {
    return '<div class="partial-data-note">Atlas could not read this registry item safely. The component page may still be available from the registry.</div>';
  }
  return `<div class="partial-data-note">${escapeHtml(result.message ?? 'Component details unavailable.')}</div>`;
}

function statusLabel(detail: RegistryItemDetail, status: RegistryItemDetailResult['status']): string {
  if (status === 'loaded') return 'Full details';
  if (
    status === 'summary-only'
    || status === 'fetch-error'
    || status === 'invalid-json'
    || status === 'invalid-schema'
  ) {
    return detail.catalogStatus === 'available' ? 'Summary' : detail.catalogStatus;
  }
  return 'Details unavailable';
}

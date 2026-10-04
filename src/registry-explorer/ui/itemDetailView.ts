import { buildInstallAgentPrompt, buildInspectionPrompt } from '../core/itemPrompts.ts';
import type { RegistryItemDetailResult, RegistryItemDetail } from '../core/registryItemDetail.ts';
import type { InstallActionState, RegistryItemSummaryFile } from '../core/registry.schema.ts';
import type { CatalogComponent } from '../core/catalogQuery.ts';
import { escapeHtml } from './renderSafety.ts';
import { renderComponentPreview, verifiedComponentDemo } from './componentPreview.ts';
import { verifiedVisualReference, renderVisualReferenceImage } from './visualReference.ts';

export function renderItemDetailView(
  headerRoot: HTMLElement,
  bodyRoot: HTMLElement,
  result: RegistryItemDetailResult,
  queuedTokens: ReadonlySet<string>,
  relatedItems: readonly CatalogComponent[] = [],
): void {
  const detail = result.detail;
  headerRoot.innerHTML = renderHeader(detail, result.status);
  bodyRoot.innerHTML = detail ? renderDetailBody(detail, result, queuedTokens, relatedItems) : renderMissingBody(result);
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
  relatedItems: readonly CatalogComponent[] = [],
): string {
  const fallback = result.status === 'loaded' || result.status === 'summary-only'
    ? ''
    : renderFallback(result);
  // A published image is not an executable component demo. Do not promote it as one.

  return `
    <article class="item-detail-page">
      <section class="item-detail-hero">
        ${renderPreview(detail)}
        <div class="item-detail-summary">
          ${detail.description ? `<p>${escapeHtml(detail.description)}</p>` : '<p class="muted">No description is available.</p>'}
          <div class="item-action-row">
            ${renderInstallActions(detail.installAction, detail, queuedTokens)}
          </div>
          ${renderPromptActions(detail)}
          ${renderEvaluationLabels(detail, Boolean(verifiedVisualReference(detail.visualReference)))}
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
      ${renderRelatedComponentLinks(relatedItems,detail.namespace,detail.slug)}
    </article>
  `;
}

export function renderRelatedComponentLinks(
  items: readonly CatalogComponent[],
  namespace: string,
  currentSlug: string,
): string {
  const related=items.filter(item=>item.namespace===namespace&&item.slug!==currentSlug).slice(0,8);
  if(!related.length)return '';
  return `<section class="item-related-section" aria-label="More from the same registry">
    <div class="item-related-heading">
      <h2>More from ${escapeHtml(namespace)}</h2>
      <span>${related.length} items</span>
    </div>
    <div class="item-related-list">
      ${related.map(item=>{
        const reference=verifiedVisualReference(item.visualReference);
        return `<a class="item-related-link" href="${escapeHtml(item.routePath)}"
          data-view-item-registry="${escapeHtml(item.namespace)}"
          data-view-item-slug="${escapeHtml(item.slug)}"
          data-view-item-kind="component"
          aria-label="View ${escapeHtml(item.displayName)} from ${escapeHtml(namespace)}">
          ${reference ? renderVisualReferenceImage(reference,item.displayName,'item-related-image')
            : '<span class="item-related-empty" aria-hidden="true">▧</span>'}
          <span class="item-related-title">${escapeHtml(item.displayName)}</span>
          <span class="item-related-arrow" aria-hidden="true">↗</span>
        </a>`;
      }).join('')}
    </div>
  </section>`;
}

function renderMissingBody(result: RegistryItemDetailResult): string {
  return `
    <div class="empty-state">
      <div class="empty-state-icon">⌕</div>
      <h2>Item details unavailable</h2>
      <p>${escapeHtml(result.message ?? 'Registry Atlas could not load this item.')}</p>
    </div>
  `;
}

function renderPreview(detail: RegistryItemDetail): string {
  const reference = verifiedVisualReference(detail.visualReference);
  const visual = reference ? `
    <figure class="item-preview-reference">
      <div class="catalog-eyebrow">Visual reference</div>
      <a class="item-preview-reference-image" href="${escapeHtml(reference.officialPage)}"
        target="_blank" rel="noreferrer noopener" aria-label="View original ${escapeHtml(detail.title)} component">
        ${renderVisualReferenceImage(reference, detail.title, 'item-preview-reference-img')}
      </a>
      <figcaption>Captured from the official registry page.
        <a href="${escapeHtml(reference.officialPage)}" target="_blank"
          rel="noreferrer noopener">View original component ↗</a>
      </figcaption>
    </figure>` : null;
  const liveDemo = renderComponentPreview(detail.namespace, detail.slug, 'detail');
  const localBuild = renderLocalBuildOption(detail.namespace, detail.slug);
  const sandboxPreview = renderLocalSandboxOption(detail.namespace, detail.slug, detail.type);
  if (liveDemo) return `
    <div class="item-preview-combined">
      <section class="item-preview-live" aria-label="Interactive component example">
        <div class="catalog-eyebrow">Interactive example</div>
        ${liveDemo}
        <p class="muted">${verifiedComponentDemo(detail.namespace, detail.slug)?.kind === 'upstream-built' ? 'Approved upstream React source, running in an isolated preview.' : 'Source-informed interaction example; upstream source is not executed.'}</p>
      </section>
      ${visual ?? ''}
    </div>`;
  if (visual) return `${visual}${localBuild}${sandboxPreview}`;
  // Images are not live components. Preserve discoverability without pretending otherwise.

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
      <p>${escapeHtml(detail.description ?? 'Component information has not been verified.')}</p>
      <div class="item-preview-metadata-facts">
        ${facts.map(fact => `<span>${escapeHtml(fact)}</span>`).join('')}
      </div>
      <div class="item-preview-metadata-status">Visual reference not yet available</div>
      ${localBuild}
      ${sandboxPreview}
    </div>
  `;
}

export function renderLocalSandboxOption(
  namespace: string, slug: string, type: string | null,
  hostname = typeof window === 'undefined' ? '' : window.location?.hostname ?? '',
): string {
  if (!['127.0.0.1', 'localhost'].includes(hostname)
    || !/^@[a-z0-9][a-z0-9-]*$/.test(namespace)
    || !/^[a-z0-9][a-z0-9._/-]*$/.test(slug)
    || slug.split('/').some(part => part === '.' || part === '..')
    || !['registry:ui', 'registry:component', 'registry:block', 'registry:page', 'registry:item'].includes(type ?? '')) return '';
  return `<section class="item-preview-live" data-source-sandbox-root aria-label="Source preview">
    <button class="install-button" type="button"
      data-source-sandbox-registry="${escapeHtml(namespace.slice(1))}"
      data-source-sandbox-slug="${escapeHtml(slug)}">Try live source preview</button>
    <p class="muted" data-source-sandbox-status role="status">
      Loads original registry code into an external CodeSandbox runtime. Local preview only;
      generated examples are not author demos or verified interactions.</p>
    <div data-source-sandbox-mount></div>
  </section>`;
}

export function renderLocalBuildOption(
  namespace:string, slug:string,
  hostname=typeof window==='undefined' ? '' : (window.location?.hostname??''),
): string {
  if(namespace!=='@8bitcn'||!/^[a-z0-9][a-z0-9-]*$/.test(slug)
    ||!['127.0.0.1','localhost'].includes(hostname))return '';
  return `<section class="item-preview-live" data-local-preview-root aria-label="Local source preview">
    <button class="install-button" type="button" data-local-build-preview="${escapeHtml(slug)}">
      Build source preview locally
    </button>
    <p class="muted" data-local-preview-status role="status">Runs approved upstream source in an isolated frame.
      Local builds are not automatically interaction-verified.</p>
  </section>`;
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
  return `
    <section class="item-detail-card">
      <h2>Source</h2>
      <dl class="profile-facts">
        <div class="profile-fact"><dt>Source</dt><dd>${escapeHtml(detail.source)}</dd></div>
        <div class="profile-fact"><dt>Imported from</dt><dd>${escapeHtml(detail.provenance)}</dd></div>
        ${detail.warnings.length ? `<div class="profile-fact"><dt>Warnings</dt><dd>${escapeHtml(detail.warnings.join(', '))}</dd></div>` : ''}
      </dl>
    </section>
  `;
}

function renderFallback(result: RegistryItemDetailResult): string {
  if (result.status === 'fetch-error') {
    return '<div class="partial-data-note">Full item details could not be loaded. Showing the saved summary.</div>';
  }
  if (result.status === 'invalid-json' || result.status === 'invalid-schema') {
    return '<div class="partial-data-note">Atlas could not read this registry item safely. A functional demo is unavailable.</div>';
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

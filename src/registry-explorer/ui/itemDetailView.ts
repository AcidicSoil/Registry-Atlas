import { buildInstallAgentPrompt, buildInspectionPrompt } from '../core/itemPrompts.ts';
import type { RegistryItemDetailResult, RegistryItemDetail } from '../core/registryItemDetail.ts';
import type { InstallActionState, RegistryItemSummaryFile } from '../core/registry.schema.ts';
import type { CatalogComponent } from '../core/catalogQuery.ts';
import { assetKindForCatalogItem } from '../core/catalogCollections.ts';
import { catalogRoutePath } from '../core/catalogRoutes.ts';
import { escapeHtml } from './renderSafety.ts';
import { sourcePageNavigation, verifiedRegistryHomepage } from './sourcePageLink.ts';
import { registryItemSourceUrl, renderRegistryIcon } from './registryIdentity.ts';

export function renderItemDetailView(
  headerRoot: HTMLElement,
  bodyRoot: HTMLElement,
  result: RegistryItemDetailResult,
  queuedTokens: ReadonlySet<string>,
  relatedItems: readonly CatalogComponent[] = [],
): void {
  const detail = result.detail;
  headerRoot.innerHTML = renderHeader(detail, result.status);
  bodyRoot.innerHTML = detail
    ? renderDetailBody(detail, result, queuedTokens, relatedItems)
    : renderMissingBody(result);
}

function renderHeader(
  detail: RegistryItemDetail | null,
  status: RegistryItemDetailResult['status'],
): string {
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
    <div class="item-detail-header">
      <button class="link-button" type="button" data-back-from-item>← Back to results</button>
      <div class="item-detail-title-row">
        ${renderRegistryIcon(detail.registry, 'registry-icon registry-icon-detail')}
        <div>
          <h1>${escapeHtml(detail.title)}</h1>
          <p>${escapeHtml(detail.namespace)} · ${escapeHtml(detail.slug)}</p>
        </div>
      </div>
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
  relatedItems: readonly CatalogComponent[],
): string {
  const fallback = result.status === 'loaded' || result.status === 'summary-only'
    ? '' : renderFallback(result);

  return `
    <article class="item-detail-page">
      <section class="item-detail-hero">
        <div class="item-detail-summary">
          ${detail.description
            ? `<p>${escapeHtml(detail.description)}</p>`
            : '<p class="muted">No description is available.</p>'}
          <div class="item-action-row">
            ${renderInstallActions(detail.installAction, detail, queuedTokens)}
          </div>
          ${renderPromptActions(detail)}
          ${renderEvaluationLabels(detail)}
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
      ${renderRelatedComponentLinks(relatedItems, detail.namespace, detail.slug)}
    </article>
  `;
}

export function renderRelatedComponentLinks(
  items: readonly CatalogComponent[],
  namespace: string,
  currentSlug: string,
): string {
  const related = items
    .filter(item => item.namespace === namespace && item.slug !== currentSlug)
    .slice(0, 8);
  if (!related.length) return '';

  return `<section class="item-related-section" aria-label="More from the same registry">
    <div class="item-related-heading">
      <h2>More from ${escapeHtml(namespace)}</h2>
      <span>${related.length} items</span>
    </div>
    <div class="item-related-list">
      ${related.map(item => {
        const routeKind = routeKindForItem(item);
        const basePath = item.routePath.slice(0, item.routePath.indexOf(item.namespace));
        const routePath = routeKind === 'component'
          ? item.routePath
          : catalogRoutePath(
              { kind: routeKind, namespace: item.namespace, slug: item.slug },
              basePath,
            );
        const original = sourcePageNavigation(item.registry.url, {
          docsUrl: item.docsUrl,
          sourcePage: item.sourcePage,
        });
        const itemJson = registryItemSourceUrl(
          item.registry,
          item.slug,
          item.reviewedSummary?.rawItemUrl,
        );
        return `<div class="item-related-entry">
          <a class="item-related-link" href="${escapeHtml(routePath)}"
            data-view-item-registry="${escapeHtml(item.namespace)}"
            data-view-item-slug="${escapeHtml(item.slug)}"
            data-view-item-kind="${routeKind}"
            aria-label="View ${escapeHtml(item.displayName)} from ${escapeHtml(namespace)}">
            ${renderRegistryIcon(item.registry, 'registry-icon registry-icon-related')}
            <span class="item-related-title">${escapeHtml(item.displayName)}</span>
            <span class="item-related-arrow" aria-hidden="true">↗</span>
          </a>
          <div class="item-related-source-actions">
            ${original ? `<a class="item-related-original" href="${escapeHtml(original.url)}"
              target="_blank" rel="noreferrer noopener">${escapeHtml(original.label)} ↗</a>` : ''}
            ${itemJson && itemJson !== original?.url ? `<a class="item-related-original"
              href="${escapeHtml(itemJson)}" target="_blank" rel="noreferrer noopener">Item JSON ↗</a>` : ''}
          </div>
        </div>`;
      }).join('')}
    </div>
  </section>`;
}

function routeKindForItem(
  item: CatalogComponent,
): 'component' | 'block' | 'page' | 'template' | 'theme' {
  const kind = assetKindForCatalogItem(item.item, item.namespace);
  if (kind === 'block') return 'block';
  if (kind === 'page') return 'page';
  if (kind === 'template') return 'template';
  if (kind === 'theme') return 'theme';
  return 'component';
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

function renderInstallActions(
  action: InstallActionState,
  detail: RegistryItemDetail,
  queuedTokens: ReadonlySet<string>,
): string {
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
    : `<button class="install-button" type="button" data-queue-add="${escapeHtml(action.token)}"
        data-queue-label="${escapeHtml(detail.title)}"
        data-queue-registry="${escapeHtml(detail.namespace)}"
        data-queue-item="${escapeHtml(detail.slug)}"
        data-queue-install="${escapeHtml(action.installCommand)}"
        data-queue-inspect="${escapeHtml(action.inspectCommand)}"
        data-queue-route="${escapeHtml(action.route)}">Add to queue</button>`;

  return `
    <div class="install-actions" aria-label="Install actions for ${escapeHtml(detail.title)}">
      <code class="install-token">${escapeHtml(action.token)}</code>
      <button class="install-button" type="button"
        data-copy-text="${escapeHtml(action.inspectCommand)}"
        data-copy-label="Inspect command copied">Inspect first</button>
      <button class="install-button install-button-primary" type="button"
        data-copy-text="${escapeHtml(action.installCommand)}"
        data-copy-label="Install command copied">Copy install</button>
      ${queueButton}
    </div>
  `;
}

function renderPromptActions(detail: RegistryItemDetail): string {
  const agentPrompt = buildInstallAgentPrompt(detail);
  const inspectionPrompt = buildInspectionPrompt(detail);
  return `
    <div class="item-prompt-actions" aria-label="Copy item context">
      ${agentPrompt ? `<button class="install-button" type="button"
        data-copy-text="${escapeHtml(agentPrompt)}"
        data-copy-label="Agent prompt copied">Copy install-agent prompt</button>` : ''}
      ${inspectionPrompt ? `<button class="install-button" type="button"
        data-copy-text="${escapeHtml(inspectionPrompt)}"
        data-copy-label="Inspection prompt copied">Copy inspection prompt</button>` : ''}
      <button class="install-button" type="button" data-copy-current-url>Copy link</button>
    </div>
  `;
}

function renderEvaluationLabels(detail: RegistryItemDetail): string {
  const labels = [
    `${detail.dependencies.length} dependencies`,
    `${detail.registryDependencies.length} registry dependencies`,
    `${detail.files.length} files`,
  ];
  return `<div class="discovery-item-meta" aria-label="Item summary">
    ${labels.map(label => `<span>${escapeHtml(label)}</span>`).join('')}
  </div>`;
}

function renderListCard(title: string, items: readonly string[]): string {
  if (!items.length) return '';
  return `
    <section class="item-detail-card">
      <h2>${escapeHtml(title)}</h2>
      <div class="item-dependency-list">
        ${items.map(item => `<code>${escapeHtml(item)}</code>`).join('')}
      </div>
    </section>
  `;
}

function renderFilesCard(files: readonly RegistryItemSummaryFile[]): string {
  if (!files.length) return '';
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
  const homepage = verifiedRegistryHomepage(detail.registry.url);
  const original = sourcePageNavigation(detail.registry.url, {
    docsUrl: detail.componentPageUrl,
    sourcePage: detail.sourcePage,
  });
  const itemJson = registryItemSourceUrl(
    detail.registry,
    detail.slug,
    detail.summary.rawItemUrl,
  );
  return `
    <section class="item-detail-card">
      <h2>Source</h2>
      <div class="item-source-links">
        ${original ? `<a href="${escapeHtml(original.url)}" target="_blank"
          rel="noreferrer noopener">${escapeHtml(
            original.level === 'reviewed' ? 'View original component' : original.label,
          )} ↗</a>` : ''}
        ${itemJson && itemJson !== original?.url ? `<a href="${escapeHtml(itemJson)}"
          target="_blank" rel="noreferrer noopener">View item JSON ↗</a>` : ''}
        ${homepage ? `<a href="${escapeHtml(homepage)}" target="_blank"
          rel="noreferrer noopener">View registry ↗</a>` : ''}
      </div>
      <dl class="profile-facts">
        <div class="profile-fact"><dt>Source</dt><dd>${escapeHtml(detail.source)}</dd></div>
        <div class="profile-fact"><dt>Imported from</dt><dd>${escapeHtml(detail.provenance)}</dd></div>
        ${detail.warnings.length
          ? `<div class="profile-fact"><dt>Warnings</dt><dd>${escapeHtml(detail.warnings.join(', '))}</dd></div>`
          : ''}
      </dl>
    </section>
  `;
}

function renderFallback(result: RegistryItemDetailResult): string {
  if (result.status === 'fetch-error') {
    return '<div class="partial-data-note">Full item details could not be loaded. Showing the saved summary.</div>';
  }
  if (result.status === 'invalid-json' || result.status === 'invalid-schema') {
    return '<div class="partial-data-note">Atlas could not read this registry item safely. Showing the saved summary.</div>';
  }
  return `<div class="partial-data-note">${escapeHtml(result.message ?? 'Item details unavailable.')}</div>`;
}

function statusLabel(
  detail: RegistryItemDetail,
  status: RegistryItemDetailResult['status'],
): string {
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

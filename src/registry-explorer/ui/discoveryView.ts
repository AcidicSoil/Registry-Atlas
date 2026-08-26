import type {
  BatchInstallCommandState,
  ComponentCandidate,
  DiscoveryOverview,
  InstallActionState,
  InstallQueueEntry,
} from '../core/registry.schema';
import type {
  CatalogFacetGroup,
  SelectedCatalogFacet,
} from '../core/catalogFacets';
import type { CatalogSort } from '../core/catalogSort';
import { buildComponentPeekFromCandidate } from '../core/componentPeek';
import { renderComponentPeek } from './componentPeekView';
import {
  escapeHtml,
  renderExternalLink,
  renderSafeExternalImage,
} from './renderSafety';

export interface CopyFeedback {
  message: string;
  status: 'success' | 'error';
  command?: string;
}

export interface DiscoveryQueuePanel {
  entries: readonly InstallQueueEntry[];
  batch: BatchInstallCommandState;
  feedback: CopyFeedback | null;
}

export interface DiscoveryContentOptions {
  searchTerm: string;
  facetGroups: readonly CatalogFacetGroup[];
  selectedFacets: readonly SelectedCatalogFacet[];
  sort: CatalogSort;
  queuedTokens: ReadonlySet<string>;
  activePeekId: string | null;
  selectedCandidateId?: string | null;
}

export function renderDiscoveryAside(
  root: HTMLElement,
  overview: DiscoveryOverview,
  selectedCandidateId: string | null,
  queuePanel: DiscoveryQueuePanel,
): void {
  root.innerHTML = `
    <div class="aside-section-title">Discover</div>
    <div class="aside-summary">
      <strong>${overview.knownItemCount}</strong> known items<br />
      <strong>${overview.routeEligibleItemCount}</strong> installable routes<br />
      <strong>${overview.totalRegistries}</strong> registries
    </div>
    <div class="aside-hint">${escapeHtml(selectedCandidateId ? 'Component selected' : 'Search by component, capability, or registry.')}</div>
    ${renderInstallQueuePanel(queuePanel)}
  `;
}

export function renderDiscoveryContent(
  headerRoot: HTMLElement,
  bodyRoot: HTMLElement,
  candidates: readonly ComponentCandidate[],
  overview: DiscoveryOverview,
  options: DiscoveryContentOptions,
): void {
  headerRoot.innerHTML = `
    <div>
      <h1>Discover components</h1>
      <p>Search components and registries across ${overview.totalRegistries} mirrored sources.</p>
      <button class="link-button" type="button" data-copy-current-url data-copy-label="Search link copied">Copy search link</button>
    </div>
  `;

  const partial = candidates.some(candidate =>
    candidate.coverageStatus !== 'verified'
    || candidate.catalogStatus === 'unavailable'
    || candidate.catalogStatus === 'unverified',
  );

  const emptyCopy = options.searchTerm.trim() || options.selectedFacets.length
    ? 'No components match this search and filter combination.'
    : 'No component results are available yet.';

  bodyRoot.innerHTML = `
    ${renderCatalogToolbar(options.facetGroups, options.selectedFacets, options.sort)}
    ${partial ? '<div class="partial-data-note">Some registry metadata is incomplete or unverified.</div>' : ''}
    ${candidates.length
      ? `<div class="discovery-grid">${candidates.map(candidate => renderCandidate(candidate, options)).join('')}</div>`
      : `<div class="empty-state"><h2>${escapeHtml(emptyCopy)}</h2><p>Try a component name, capability, or registry namespace.</p></div>`}
  `;
}

function renderCatalogToolbar(
  groups: readonly CatalogFacetGroup[],
  selected: readonly SelectedCatalogFacet[],
  sort: CatalogSort,
): string {
  const facets = groups.map(group => `
    <details class="catalog-facet">
      <summary>${escapeHtml(group.label)}</summary>
      <div class="catalog-facet-options">
        ${group.options.map(option => `
          <button type="button" class="catalog-facet-option"
            data-facet-add-dimension="${escapeHtml(option.dimension)}"
            data-facet-add-value="${escapeHtml(option.value)}"
            aria-pressed="${selected.some(facet => facet.dimension === option.dimension && facet.value === option.value)}">
            ${escapeHtml(option.label)} <span>${option.count}</span>
          </button>
        `).join('')}
      </div>
    </details>
  `).join('');

  const chips = selected.map(facet => `
    <button type="button" class="active-filter"
      data-facet-remove-dimension="${escapeHtml(facet.dimension)}"
      data-facet-remove-value="${escapeHtml(facet.value)}"
      aria-label="Remove ${escapeHtml(facet.label)} filter">
      ${escapeHtml(facet.label)} ×
    </button>
  `).join('');

  return `
    <section class="catalog-toolbar" aria-label="Catalog controls">
      <div class="catalog-facets">${facets}</div>
      <div class="catalog-sort" aria-label="Sort results">
        <span>Sort</span>
        <button type="button" data-sort="relevance" aria-pressed="${sort === 'relevance'}">Relevance</button>
        <button type="button" data-sort="name" aria-pressed="${sort === 'name'}">Name A-Z</button>
      </div>
      <div class="active-filter-list">
        ${chips}
        ${selected.length ? '<button type="button" class="filter-reset" data-facet-clear>Clear all</button>' : ''}
      </div>
    </section>
  `;
}

function renderCandidate(candidate: ComponentCandidate, options: DiscoveryContentOptions): string {
  const selected = candidate.id === options.selectedCandidateId;
  const itemSlug = candidate.itemSlug ?? '';
  const itemLabel = candidate.itemName ?? candidate.matchedLabel;
  const preview = candidate.previewUrl
    ? renderSafeExternalImage(candidate.previewUrl, `${itemLabel} preview`, 'discovery-preview-image')
    : '';
  const specimen = preview || '<div class="discovery-preview-unavailable">Preview unavailable</div>';
  const peek = buildComponentPeekFromCandidate(candidate);
  const peekMarkup = peek && options.activePeekId === peek.id ? renderComponentPeek(peek) : '';
  const peekAction = peek
    ? `<button class="link-button component-peek-trigger" type="button" data-component-peek-id="${escapeHtml(peek.id)}">Quick preview</button>`
    : '';
  const details = candidate.routeEligible && itemSlug
    ? `<button class="link-button discovery-route" type="button"
        data-view-item-registry="${escapeHtml(candidate.registry.name)}"
        data-view-item-slug="${escapeHtml(itemSlug)}">View details</button>`
    : '<span class="muted">Details unavailable</span>';
  const docs = candidate.docsUrl ? renderExternalLink(candidate.docsUrl, 'Docs', 'secondary-link') : '';
  const homepage = renderExternalLink(candidate.registry.url, 'Registry homepage', 'secondary-link');

  return `
    <article class="discovery-card ${selected ? 'selected' : ''}" data-candidate-id="${escapeHtml(candidate.id)}">
      <div class="discovery-specimen">${specimen}</div>
      <div class="discovery-card-body">
        <div class="discovery-title">${escapeHtml(candidate.matchedLabel)}</div>
        <button class="registry-namespace" type="button" data-profile-registry="${escapeHtml(candidate.registry.name)}">
          ${escapeHtml(candidate.registry.name)}
        </button>
        ${candidate.itemDescription ? `<p class="discovery-description">${escapeHtml(candidate.itemDescription)}</p>` : ''}
        <div class="discovery-reason"><strong>Why this matched:</strong> ${escapeHtml(candidate.matchReasons[0] ?? candidate.matchedField)}</div>
        ${renderInstallActions(candidate.installAction, {
          label: itemLabel,
          registry: candidate.registry.name,
          item: itemSlug || 'unknown',
          queued: candidate.installAction.status === 'enabled' && options.queuedTokens.has(candidate.installAction.token),
        })}
        <div class="discovery-actions">${peekAction}${details}${peekMarkup}</div>
        <div class="secondary-links">${docs} ${homepage}</div>
      </div>
    </article>
  `;
}

function renderInstallActions(
  action: InstallActionState,
  context: { label: string; registry: string; item: string; queued: boolean },
): string {
  if (action.status === 'disabled') {
    return `
      <div class="install-actions install-actions-disabled" aria-label="Install actions unavailable">
        <button class="install-button install-button-primary" type="button" disabled>Copy install</button>
        <button class="install-button" type="button" disabled>Inspect first</button>
        <button class="install-button" type="button" disabled>Add to queue</button>
        <span class="install-disabled-reason">${escapeHtml(action.disabledReason)}</span>
      </div>
    `;
  }

  const queueButton = context.queued
    ? `<button class="install-button" type="button" data-queue-remove="${escapeHtml(action.token)}">Remove from queue</button>`
    : `<button class="install-button" type="button" data-queue-add="${escapeHtml(action.token)}" data-queue-label="${escapeHtml(context.label)}" data-queue-registry="${escapeHtml(context.registry)}" data-queue-item="${escapeHtml(context.item)}" data-queue-install="${escapeHtml(action.installCommand)}" data-queue-inspect="${escapeHtml(action.inspectCommand)}" data-queue-route="${escapeHtml(action.route)}">Add to queue</button>`;

  return `
    <div class="install-actions" aria-label="Install actions for ${escapeHtml(context.label)}">
      <code class="install-token">${escapeHtml(action.token)}</code>
      <button class="install-button install-button-primary" type="button" data-copy-text="${escapeHtml(action.installCommand)}" data-copy-label="Install command copied">Copy install</button>
      <button class="install-button" type="button" data-copy-text="${escapeHtml(action.inspectCommand)}" data-copy-label="Inspect command copied">Inspect first</button>
      ${queueButton}
      <span class="install-safety-note">Copy-only. Review third-party registry code before installing.</span>
    </div>
  `;
}

function renderInstallQueuePanel(panel: DiscoveryQueuePanel): string {
  const entries = panel.entries.map(entry => `
    <div class="queue-entry">
      <code>${escapeHtml(entry.token)}</code>
      <button class="queue-remove" type="button" data-queue-remove="${escapeHtml(entry.token)}">Remove</button>
    </div>
  `).join('');
  const command = panel.batch.command ?? '';
  const feedback = panel.feedback ? `
    <div class="copy-feedback copy-feedback-${escapeHtml(panel.feedback.status)}" role="status" aria-live="polite">
      <span>${escapeHtml(panel.feedback.message)}</span>
      ${panel.feedback.command ? `<code>${escapeHtml(panel.feedback.command)}</code>` : ''}
    </div>
  ` : '';

  return `
    <section class="install-queue-panel" aria-label="Local install queue">
      <div class="queue-heading"><span>Install queue</span><strong>${panel.entries.length}</strong></div>
      <div class="queue-entries">${panel.entries.length ? entries : '<span class="muted">Add installable items from results.</span>'}</div>
      <code class="batch-command">${command ? escapeHtml(command) : escapeHtml(panel.batch.disabledReason ?? 'Queue is empty.')}</code>
      <div class="queue-controls">
        <button class="install-button install-button-primary" type="button" data-copy-text="${escapeHtml(command)}" data-copy-label="Batch command copied" ${command ? '' : 'disabled'}>Copy batch</button>
        <button class="install-button" type="button" data-queue-clear ${panel.entries.length ? '' : 'disabled'}>Clear</button>
      </div>
      ${feedback}
    </section>
  `;
}

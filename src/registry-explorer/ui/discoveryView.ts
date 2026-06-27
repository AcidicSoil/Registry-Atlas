import type {
  BatchInstallCommandState,
  ComponentCandidate,
  DiscoveryOverview,
  InstallActionState,
  InstallQueueEntry,
} from '../core/registry.schema';
import { buildComponentPeekFromCandidate } from '../core/componentPeek';
import type { ComponentFilterGroup, SelectedComponentFilter } from '../core/componentFilters';
import { activeFilterLabel } from '../core/componentFilters';
import { renderComponentPeek } from './componentPeekView';
import { escapeHtml, renderExternalLink } from './renderSafety';

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

export function renderDiscoveryAside(
  root: HTMLElement,
  overview: DiscoveryOverview,
  selectedCandidateId: string | null,
  queuePanel: DiscoveryQueuePanel,
): void {
  root.innerHTML = `
    <div class="aside-section-title">Component-first discovery</div>
    <div class="aside-summary">
      <strong>${overview.knownItemCount}</strong> known item summaries<br />
      <strong>${overview.routeEligibleItemCount}</strong> route-eligible items<br />
      <strong>${overview.totalRegistries}</strong> mirrored registries
    </div>
    <div class="aside-hint">${escapeHtml(selectedCandidateId ? 'Profile selection ready' : 'Search for button, card, upload, chat, namespace, or alias.')}</div>
    ${renderInstallQueuePanel(queuePanel)}
  `;
}

export function renderDiscoveryContent(
  headerRoot: HTMLElement,
  bodyRoot: HTMLElement,
  candidates: readonly ComponentCandidate[],
  overview: DiscoveryOverview,
  searchTerm: string,
  selectedCandidateId: string | null,
  queuedTokens: ReadonlySet<string>,
  filterGroups: readonly ComponentFilterGroup[] = [],
  selectedFilters: readonly SelectedComponentFilter[] = [],
  activePeekId: string | null = null,
): void {
  headerRoot.innerHTML = `
    <div>
      <h1>Discover components first</h1>
      <p>Search components, items, registries, or aliases across ${overview.totalRegistries} mirrored registries.</p>
    </div>
  `;

  if (candidates.length === 0) {
    bodyRoot.innerHTML = selectedFilters.length > 0
      ? `
        ${renderFilterBar(filterGroups, selectedFilters)}
        <div class="empty-state"><h2>No components match these filters. Reset filters to see all results.</h2></div>
      `
      : `
        <div class="empty-state">
          <div class="empty-state-icon">⌕</div>
          <h2>${searchTerm.trim() ? 'No registry or component matches found. Try a component name, capability, namespace, or focus tag.' : 'No verified item matches yet'}</h2>
          <p>Some registries do not expose a verified item catalog. Results may include inferred or unverified coverage.</p>
        </div>
      `;
    return;
  }

  const partial = candidates.some(candidate =>
    candidate.coverageStatus !== 'verified' || candidate.catalogStatus === 'unavailable' || candidate.catalogStatus === 'unverified'
  );

  bodyRoot.innerHTML = `
    ${partial ? '<div class="partial-data-note">Some registries do not expose a verified item catalog. Results may include inferred or unverified coverage.</div>' : ''}
    ${renderFilterBar(filterGroups, selectedFilters)}
    ${selectedFilters.length > 0 && candidates.length === 0 ? '<div class="empty-state"><h2>No components match these filters. Reset filters to see all results.</h2></div>' : ''}
    <div class="discovery-list">
      ${candidates.map(candidate => renderCandidate(candidate, candidate.id === selectedCandidateId, queuedTokens, activePeekId)).join('')}
    </div>
  `;
}


function renderChipList(labels: readonly string[] | undefined, className: string): string {
  return (labels ?? [])
    .map(label => `<span class="${className}">${escapeHtml(label)}</span>`)
    .join('');
}

function renderFilterBar(
  groups: readonly ComponentFilterGroup[],
  selected: readonly SelectedComponentFilter[],
): string {
  if (groups.length === 0) return '';
  const options = groups.map(group => `
    <div class="filter-group">
      <span class="filter-group-label">${escapeHtml(group.label)}</span>
      ${group.options.map(option => `
        <button class="filter-option" type="button" data-filter-add-dimension="${escapeHtml(option.dimension)}" data-filter-add-value="${escapeHtml(option.value)}">
          ${escapeHtml(option.label)} <span>${option.count}</span>
        </button>
      `).join('')}
    </div>
  `).join('');
  const badges = selected.map(filter => `
    <button class="active-filter" type="button" data-filter-remove-dimension="${escapeHtml(filter.dimension)}" data-filter-remove-value="${escapeHtml(filter.value)}" aria-label="Remove ${escapeHtml(activeFilterLabel(filter))}">
      ${escapeHtml(activeFilterLabel(filter))} ×
    </button>
  `).join('');

  return `
    <div class="filter-bar" aria-label="Component filters">
      <details class="filter-menu">
        <summary>+ Filter</summary>
        <div class="filter-menu-panel">${options}</div>
      </details>
      <div class="active-filter-list">
        ${badges}
        ${selected.length ? '<button class="filter-reset" type="button" data-filter-reset>Reset filters</button>' : ''}
      </div>
    </div>
  `;
}

function renderCandidate(
  candidate: ComponentCandidate,
  selected: boolean,
  queuedTokens: ReadonlySet<string>,
  activePeekId: string | null,
): string {
  const itemSlug = candidate.itemSlug ? candidate.itemSlug : 'Item slug unknown';
  const itemLabel = candidate.itemName ?? candidate.matchedLabel;
  const peek = buildComponentPeekFromCandidate(candidate);
  const componentAction = candidate.routeEligible && candidate.itemSlug
    ? `<button class="link-button discovery-route component-peek-trigger" type="button" data-component-peek-id="${escapeHtml(peek?.id ?? candidate.id)}" data-view-item-registry="${escapeHtml(candidate.registry.name)}" data-view-item-slug="${escapeHtml(candidate.itemSlug)}" data-candidate-id="${escapeHtml(candidate.id)}">View component</button>`
    : `<span class="discovery-route muted">${candidate.catalogStatus === 'unverified' || candidate.catalogStatus === 'unavailable' ? 'Catalog not verified' : 'Component unavailable'}</span>`;
  const peekMarkup = peek && activePeekId === peek.id ? renderComponentPeek(peek) : '';
  const docs = candidate.docsUrl
    ? renderExternalLink(candidate.docsUrl, 'Docs', 'secondary-link')
    : '';
  const homepage = renderExternalLink(candidate.registry.url, 'Registry homepage', 'secondary-link');

  return `
    <article class="discovery-row ${selected ? 'selected' : ''}" data-candidate-id="${escapeHtml(candidate.id)}">
      <div class="discovery-main">
        <div class="discovery-title">${escapeHtml(candidate.matchedLabel)}</div>
        <div class="discovery-registry">${escapeHtml(candidate.registry.name)} · ${escapeHtml(candidate.registry.description)}</div>
        <div class="discovery-item-meta">
          <span>${escapeHtml(itemSlug)}</span>
          ${candidate.itemType ? `<span>${escapeHtml(candidate.itemType)}</span>` : ''}
          ${candidate.itemCategory ? `<span>${escapeHtml(candidate.itemCategory)}</span>` : ''}
          ${renderChipList(candidate.taxonomyCategoryLabels?.slice(0, 1), 'taxonomy-category-chip')}
          ${renderChipList(candidate.taxonomyTagLabels?.slice(0, 2), 'taxonomy-tag-chip')}
          <span class="catalog-${escapeHtml(candidate.catalogStatus)}" title="${escapeHtml(candidate.statusExplanation ?? '')}">${escapeHtml(candidate.statusDisplayLabel ?? (candidate.catalogStatus === 'available' ? 'catalog-backed' : candidate.catalogStatus))}</span>
        </div>
        ${candidate.itemDescription ? `<p class="discovery-description">${escapeHtml(candidate.itemDescription)}</p>` : ''}
        <div class="discovery-reason"><strong>Why this matched</strong>: ${escapeHtml(candidate.matchReasons[0] ?? candidate.matchedField)}</div>
        ${renderInstallActions(candidate.installAction, {
          label: itemLabel,
          registry: candidate.registry.name,
          item: itemSlug,
          queued: candidate.installAction.status === 'enabled' && queuedTokens.has(candidate.installAction.token),
        })}
      </div>
      <div class="discovery-actions">
        <span class="status-chip status-${escapeHtml(candidate.coverageStatus)}">${escapeHtml(candidate.coverageLabel)}</span>
        ${componentAction}
        ${peekMarkup}
        <button class="link-button" type="button" data-profile-registry="${escapeHtml(candidate.registry.name)}" data-candidate-id="${escapeHtml(candidate.id)}">View profile</button>
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
      <button class="install-button install-button-primary" type="button" data-copy-command="${escapeHtml(action.installCommand)}">Copy install</button>
      <button class="install-button" type="button" data-copy-command="${escapeHtml(action.inspectCommand)}">Inspect first</button>
      ${queueButton}
      <span class="install-safety-note">Copy-only. Review source before installing third-party registry code.</span>
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
      <div class="queue-heading">
        <span>Install queue</span>
        <strong>${panel.entries.length}</strong>
      </div>
      <p>Copy-only commands for route-eligible items. Registry Atlas has not audited community code.</p>
      <div class="queue-entries">
        ${panel.entries.length ? entries : '<span class="muted">Add validated items from results.</span>'}
      </div>
      <code class="batch-command">${command ? escapeHtml(command) : escapeHtml(panel.batch.disabledReason ?? 'Queue is empty.')}</code>
      <div class="queue-controls">
        <button class="install-button install-button-primary" type="button" data-copy-command="${escapeHtml(command)}" ${command ? '' : 'disabled'}>Copy batch</button>
        <button class="install-button" type="button" data-queue-clear ${panel.entries.length ? '' : 'disabled'}>Clear</button>
      </div>
      ${feedback}
    </section>
  `;
}

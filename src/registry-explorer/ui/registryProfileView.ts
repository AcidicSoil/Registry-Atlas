import type { InstallActionState, RegistryProfile, RegistryProfileFact, RegistryProfileItemRow } from '../core/registry.schema';
import { buildComponentPeekFromProfileRow } from '../core/componentPeek';
import type { ComponentFilterGroup, SelectedComponentFilter } from '../core/componentFilters';
import { activeFilterLabel } from '../core/componentFilters';
import { renderComponentPeek } from './componentPeekView';
import { escapeHtml, renderExternalLink } from './renderSafety';

export function renderRegistryProfile(
  headerRoot: HTMLElement,
  bodyRoot: HTMLElement,
  profile: RegistryProfile,
  queuedTokens: ReadonlySet<string>,
  filterGroups: readonly ComponentFilterGroup[] = [],
  selectedFilters: readonly SelectedComponentFilter[] = [],
  activePeekId: string | null = null,
): void {
  const registry = profile.registry;
  headerRoot.innerHTML = `
    <div>
      <button class="link-button" type="button" data-back-to-results>← Back to results</button>
      <h1>${escapeHtml(registry.name)}</h1>
      <p>${escapeHtml(registry.description)}</p>
      <div class="profile-chips">
        <span class="status-chip status-${escapeHtml(registry.atlas?.coverageStatus ?? 'unverified')}">${escapeHtml(profileCoverage(profile))}</span>
        <span class="confidence-chip">${escapeHtml(registry.atlas?.confidence ?? 'unknown')} confidence</span>
        <span>${escapeHtml(String(registry.mirror?.warnings.length ?? 0))} warning(s)</span>
      </div>
    </div>
  `;

  bodyRoot.innerHTML = `
    <div class="profile-sections">
      ${profile.sections.map(section => `
        <section class="profile-section">
          <h2>${escapeHtml(section.name)}</h2>
          ${section.facts ? renderFacts(section.facts) : ''}
          ${section.items ? `${renderFilterBar(filterGroups, selectedFilters)}${renderItems(section.items, queuedTokens, registry.name, activePeekId, selectedFilters.length > 0)}` : ''}
        </section>
      `).join('')}
    </div>
  `;
}

function profileCoverage(profile: RegistryProfile): string {
  const fact = profile.sections
    .find(section => section.name === 'Registry Atlas enrichment')
    ?.facts?.find(item => item.label === 'Coverage status');
  return String(fact?.value ?? 'Unverified coverage');
}

function renderFacts(facts: readonly RegistryProfileFact[]): string {
  return `<dl class="profile-facts">${facts.map(fact => `
    <div class="profile-fact">
      <dt>${escapeHtml(fact.label)}</dt>
      <dd>${fact.url ? renderExternalLink(fact.url, String(fact.value), 'secondary-link') : escapeHtml(formatValue(fact.value))}</dd>
    </div>
  `).join('')}</dl>`;
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

function renderItems(
  items: readonly RegistryProfileItemRow[],
  queuedTokens: ReadonlySet<string>,
  registryName: string,
  activePeekId: string | null,
  filtered: boolean,
): string {
  if (items.length === 0) {
    return filtered
      ? '<div class="empty-state"><h2>No components match these filters. Reset filters to see all results.</h2></div>'
      : '<p class="muted">Catalog not verified</p>';
  }
  return `<div class="profile-items">${items.map(item => {
    const peek = buildComponentPeekFromProfileRow(registryName, item);
    const componentAction = item.routeEligible
      ? `<button class="link-button discovery-route component-peek-trigger" type="button" data-component-peek-id="${escapeHtml(peek?.id ?? `${registryName}:${item.slug}`)}" data-view-item-registry="${escapeHtml(registryName)}" data-view-item-slug="${escapeHtml(item.slug)}">View component</button>`
      : `<span class="discovery-route muted">${escapeHtml(item.routeLabel === 'Open item route' ? 'Component unavailable' : item.routeLabel)}</span>`;
    const peekMarkup = peek && activePeekId === peek.id ? renderComponentPeek(peek) : '';
    const docs = item.docsUrl ? renderExternalLink(item.docsUrl, 'Docs', 'secondary-link') : '';

    return `
    <div class="profile-item-row">
      <div>
        <strong>${escapeHtml(item.name)}</strong>
        <div class="discovery-item-meta">
          <span>${escapeHtml(item.slug)}</span>
          ${item.type ? `<span>${escapeHtml(item.type)}</span>` : ''}
          ${item.category ? `<span>${escapeHtml(item.category)}</span>` : ''}
          ${renderChipList(item.taxonomyCategoryLabels?.slice(0, 1), 'taxonomy-category-chip')}
          ${renderChipList(item.taxonomyTagLabels?.slice(0, 2), 'taxonomy-tag-chip')}
          <span class="catalog-${escapeHtml(item.catalogStatus)}" title="${escapeHtml(item.statusExplanation ?? '')}">${escapeHtml(item.statusDisplayLabel ?? (item.catalogStatus === 'available' ? 'catalog-backed' : item.catalogStatus))}</span>
        </div>
        ${item.description ? `<p class="discovery-description">${escapeHtml(item.description)}</p>` : ''}
        <div class="secondary-links">${docs}</div>
        ${renderInstallActions(item.installAction, {
          label: item.name,
          registry: item.installAction.status === 'enabled' ? item.installAction.token.split('/')[0] : '',
          item: item.slug,
          queued: item.installAction.status === 'enabled' && queuedTokens.has(item.installAction.token),
        })}
      </div>
      <div>${componentAction}${peekMarkup}</div>
    </div>
  `}).join('')}</div>`;
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

function formatValue(value: string | number | readonly string[]): string {
  return Array.isArray(value) ? value.join(', ') : String(value);
}

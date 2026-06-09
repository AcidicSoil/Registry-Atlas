import type { InstallActionState, RegistryProfile, RegistryProfileFact, RegistryProfileItemRow } from '../core/registry.schema';
import { escapeHtml, renderExternalLink } from './renderSafety';

export function renderRegistryProfile(
  headerRoot: HTMLElement,
  bodyRoot: HTMLElement,
  profile: RegistryProfile,
  queuedTokens: ReadonlySet<string>,
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
          ${section.items ? renderItems(section.items, queuedTokens) : ''}
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

function renderItems(items: readonly RegistryProfileItemRow[], queuedTokens: ReadonlySet<string>): string {
  if (items.length === 0) {
    return '<p class="muted">Catalog not verified</p>';
  }
  return `<div class="profile-items">${items.map(item => `
    <div class="profile-item-row">
      <div>
        <strong>${escapeHtml(item.name)}</strong>
        <div class="discovery-item-meta">
          <span>${escapeHtml(item.slug)}</span>
          ${item.type ? `<span>${escapeHtml(item.type)}</span>` : ''}
          ${item.category ? `<span>${escapeHtml(item.category)}</span>` : ''}
          <span class="catalog-${escapeHtml(item.catalogStatus)}">${escapeHtml(item.catalogStatus)}</span>
          <span>${escapeHtml(item.source)}</span>
          <span>${escapeHtml(item.provenance)}</span>
          <span>${item.routeEligible ? 'route eligible' : 'route unavailable'}</span>
        </div>
        ${renderInstallActions(item.installAction, {
          label: item.name,
          registry: item.installAction.status === 'enabled' ? item.installAction.token.split('/')[0] : '',
          item: item.slug,
          queued: item.installAction.status === 'enabled' && queuedTokens.has(item.installAction.token),
        })}
      </div>
      <div>${item.route ? renderExternalLink(item.route, 'Open raw item route', 'discovery-route') : escapeHtml(item.routeLabel)}</div>
    </div>
  `).join('')}</div>`;
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

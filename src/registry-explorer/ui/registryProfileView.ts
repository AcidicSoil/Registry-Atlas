import type { RegistryProfile, RegistryProfileFact, RegistryProfileItemRow } from '../core/registry.schema';
import { escapeHtml, renderExternalLink } from './renderSafety';

export function renderRegistryProfile(
  headerRoot: HTMLElement,
  bodyRoot: HTMLElement,
  profile: RegistryProfile,
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
          ${section.items ? renderItems(section.items) : ''}
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

function renderItems(items: readonly RegistryProfileItemRow[]): string {
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
      </div>
      <div>${item.route ? renderExternalLink(item.route, 'Open item route', 'discovery-route') : escapeHtml(item.routeLabel)}</div>
    </div>
  `).join('')}</div>`;
}

function formatValue(value: string | number | readonly string[]): string {
  return Array.isArray(value) ? value.join(', ') : String(value);
}

import type { ComponentCandidate, DiscoveryOverview } from '../core/registry.schema';
import { escapeHtml, renderExternalLink } from './renderSafety';

export function renderDiscoveryAside(
  root: HTMLElement,
  overview: DiscoveryOverview,
  selectedCandidateId: string | null,
): void {
  root.innerHTML = `
    <div class="aside-section-title">Component-first discovery</div>
    <div class="aside-summary">
      <strong>${overview.knownItemCount}</strong> known item summaries<br />
      <strong>${overview.routeEligibleItemCount}</strong> route-eligible items<br />
      <strong>${overview.totalRegistries}</strong> mirrored registries
    </div>
    <div class="aside-hint">${escapeHtml(selectedCandidateId ? 'Profile selection ready' : 'Search for button, card, upload, chat, namespace, or alias.')}</div>
  `;
}

export function renderDiscoveryContent(
  headerRoot: HTMLElement,
  bodyRoot: HTMLElement,
  candidates: readonly ComponentCandidate[],
  overview: DiscoveryOverview,
  searchTerm: string,
  selectedCandidateId: string | null,
): void {
  headerRoot.innerHTML = `
    <div>
      <h1>Discover components first</h1>
      <p>Search components, items, registries, or aliases across ${overview.totalRegistries} mirrored registries.</p>
    </div>
  `;

  if (candidates.length === 0) {
    bodyRoot.innerHTML = `
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
    <div class="discovery-list">
      ${candidates.map(candidate => renderCandidate(candidate, candidate.id === selectedCandidateId)).join('')}
    </div>
  `;
}

function renderCandidate(candidate: ComponentCandidate, selected: boolean): string {
  const route = candidate.route
    ? renderExternalLink(candidate.route, 'Open item route', 'discovery-route')
    : `<span class="discovery-route muted">${candidate.catalogStatus === 'unverified' || candidate.catalogStatus === 'unavailable' ? 'Catalog not verified' : 'Item route unavailable'}</span>`;
  const itemSlug = candidate.itemSlug ? candidate.itemSlug : 'Item slug unknown';
  const homepage = renderExternalLink(candidate.registry.url, 'Registry homepage', 'secondary-link');
  const source = candidate.registry.mirror?.sourceUrl
    ? renderExternalLink(candidate.registry.mirror.sourceUrl, 'Official source', 'secondary-link')
    : '';

  return `
    <article class="discovery-row ${selected ? 'selected' : ''}" data-candidate-id="${escapeHtml(candidate.id)}">
      <div class="discovery-main">
        <div class="discovery-title">${escapeHtml(candidate.matchedLabel)}</div>
        <div class="discovery-registry">${escapeHtml(candidate.registry.name)} · ${escapeHtml(candidate.registry.description)}</div>
        <div class="discovery-item-meta">
          <span>${escapeHtml(itemSlug)}</span>
          ${candidate.itemType ? `<span>${escapeHtml(candidate.itemType)}</span>` : ''}
          ${candidate.itemCategory ? `<span>${escapeHtml(candidate.itemCategory)}</span>` : ''}
          ${candidate.itemSource ? `<span>${escapeHtml(candidate.itemSource)}</span>` : ''}
          ${candidate.itemProvenance ? `<span>${escapeHtml(candidate.itemProvenance)}</span>` : ''}
          <span class="catalog-${escapeHtml(candidate.catalogStatus)}">${escapeHtml(candidate.catalogStatus)}</span>
        </div>
        <div class="discovery-reason"><strong>Why this matched</strong>: ${escapeHtml(candidate.matchReasons[0] ?? candidate.matchedField)}</div>
      </div>
      <div class="discovery-actions">
        <span class="status-chip status-${escapeHtml(candidate.coverageStatus)}">${escapeHtml(candidate.coverageLabel)}</span>
        <span class="confidence-chip">${escapeHtml(candidate.confidence)} confidence</span>
        ${route}
        <button class="link-button" type="button" data-profile-registry="${escapeHtml(candidate.registry.name)}" data-candidate-id="${escapeHtml(candidate.id)}">View profile</button>
        <div class="secondary-links">${homepage} ${source}</div>
      </div>
    </article>
  `;
}

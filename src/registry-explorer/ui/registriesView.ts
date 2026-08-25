import { CATALOG_CATEGORY_LABELS } from '../core/catalogTaxonomy.ts';
import { coverageStatusLabel } from '../core/coverageStatus.ts';
import type { CatalogFacetGroup, SelectedCatalogFacet } from '../core/catalogFacets.ts';
import type { RegistryBrowseEntry } from '../core/registryBrowse.ts';
import { escapeHtml, renderExternalLink } from './renderSafety.ts';

export function renderRegistriesContent(
  headerRoot: HTMLElement,
  bodyRoot: HTMLElement,
  entries: readonly RegistryBrowseEntry[],
  facetGroups: readonly CatalogFacetGroup[],
  selectedFacets: readonly SelectedCatalogFacet[],
): void {
  headerRoot.innerHTML = `
    <div>
      <h1>Registries</h1>
      <p>Browse registry sources, their known items, and current catalog coverage.</p>
    </div>
  `;

  bodyRoot.innerHTML = `
    ${renderFacetBar(facetGroups, selectedFacets)}
    ${entries.length ? `<div class="registry-browser-list">${entries.map(renderEntry).join('')}</div>`
      : '<div class="empty-state"><h2>No registries match this search and filter combination.</h2></div>'}
  `;
}

function renderEntry(entry: RegistryBrowseEntry): string {
  const registry = entry.registry;
  return `
    <article class="registry-browser-card">
      <div class="registry-browser-main">
        <h2>${escapeHtml(registry.name)}</h2>
        <p>${escapeHtml(registry.description)}</p>
        <div class="registry-browser-meta">
          <span>${entry.knownItemCount} known items</span>
          <span>${entry.routeEligibleItemCount} route-eligible</span>
          <span>${escapeHtml(coverageStatusLabel(entry.coverageStatus))}</span>
        </div>
        <div class="registry-browser-tags">
          ${entry.categories.slice(0, 3).map(category =>
            `<span class="taxonomy-category-chip">${escapeHtml(CATALOG_CATEGORY_LABELS[category])}</span>`
          ).join('')}
        </div>
      </div>
      <div class="registry-browser-actions">
        <button class="link-button" type="button" data-profile-registry="${escapeHtml(registry.name)}">View registry</button>
        ${renderExternalLink(registry.url, 'Source', 'secondary-link')}
      </div>
    </article>
  `;
}

function renderFacetBar(
  groups: readonly CatalogFacetGroup[],
  selected: readonly SelectedCatalogFacet[],
): string {
  const allowedGroups = groups.filter(group => group.dimension !== 'registry');
  if (allowedGroups.length === 0 && selected.length === 0) return '';

  const controls = allowedGroups.map(group => `
    <div class="facet-group">
      <span class="facet-group-label">${escapeHtml(group.label)}</span>
      ${group.options.map(option => `
        <button class="facet-option" type="button"
          data-facet-add-dimension="${escapeHtml(option.dimension)}"
          data-facet-add-value="${escapeHtml(option.value)}"
          aria-pressed="${selected.some(facet => facet.dimension === option.dimension && facet.value === option.value)}">
          ${escapeHtml(option.label)} <span>${option.count}</span>
        </button>
      `).join('')}
    </div>
  `).join('');

  const chips = selected
    .filter(facet => facet.dimension !== 'registry')
    .map(facet => `
      <button class="active-filter" type="button"
        data-facet-remove-dimension="${escapeHtml(facet.dimension)}"
        data-facet-remove-value="${escapeHtml(facet.value)}"
        aria-label="Remove ${escapeHtml(facet.label)} filter">
        ${escapeHtml(facet.label)} ×
      </button>
    `).join('');

  return `
    <div class="catalog-facet-bar" aria-label="Registry filters">
      <div class="catalog-facet-groups">${controls}</div>
      <div class="active-filter-list">
        ${chips}
        ${selected.length ? '<button class="filter-reset" type="button" data-facet-clear>Clear all</button>' : ''}
      </div>
    </div>
  `;
}

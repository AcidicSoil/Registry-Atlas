import type { CatalogFacetSummary, CatalogFacetOption } from '../core/catalogQuery';
import type { CatalogRoute } from '../core/catalogRoutes';
import type { CatalogTaxonomy, CatalogTaxonomyNode } from '../core/catalogTaxonomy';
import { escapeHtml } from './renderSafety';

export interface SidebarNavigationState {
  canonicalIds: readonly string[];
  registry: string | null;
  kind: CatalogRoute['kind'];
  canonicalSearch: string;
  registrySearch: string;
}

function registryOption(item: CatalogFacetOption, state: SidebarNavigationState): string {
  const selected = state.registry === item.value;
  const value = escapeHtml(item.value);
  return `<button type="button" class="sidebar-browser-item"
    data-sidebar-search-label="${escapeHtml(item.value.toLowerCase())}"
    data-profile-registry="${value}" ${selected ? 'aria-current="page"' : ''}>
    <span class="sidebar-browser-label">${value}</span>
    <span class="sidebar-browser-count">${item.count.toLocaleString()}</span>
  </button>`;
}

function canonicalNodeMarkup(
  node: CatalogTaxonomyNode,
  counts: ReadonlyMap<string, number>,
  state: SidebarNavigationState,
): string {
  const count = counts.get(node.id) ?? 0;
  const childMarkup = node.children
    .map(child => canonicalNodeMarkup(child, counts, state))
    .filter(Boolean)
    .join('');
  const selected = state.canonicalIds.includes(node.id);
  if (count === 0 && !selected && !childMarkup) return '';
  const searchLabel = [node.label, ...node.aliases].join(' ').toLowerCase();
  const hasChildren = Boolean(childMarkup);
  const button = `<button type="button" class="sidebar-browser-item sidebar-browser-canonical depth-${node.id.split('/').length - 1}"
    data-sidebar-search-label="${escapeHtml(searchLabel)}"
    data-catalog-canonical-value="${escapeHtml(node.id)}"
    aria-pressed="${selected}"${hasChildren ? ' aria-expanded="true"' : ''}>
    <span class="sidebar-browser-label">${escapeHtml(node.label)}</span>
    <span class="sidebar-browser-count">${count.toLocaleString()}</span>
  </button>`;
  if (!hasChildren) return button;
  return `<div class="sidebar-canonical-family">
    ${button}
    <div class="sidebar-canonical-children" role="group" aria-label="${escapeHtml(node.label)} subcategories">
      ${childMarkup}
    </div>
  </div>`;
}

export function renderCatalogSidebarNavigation(
  facets: CatalogFacetSummary,
  state: SidebarNavigationState,
  taxonomy: CatalogTaxonomy,
): string {
  const canonicalCounts = new Map(facets.canonical.map(item => [item.value, item.count]));
  const canonicalItems = taxonomy.roots
    .map(root => canonicalNodeMarkup(root, canonicalCounts, state))
    .filter(Boolean)
    .join('');
  const canonical = canonicalItems ? `
    <section class="sidebar-browse-section" aria-label="Browse canonical categories">
      <div class="sidebar-browse-heading">
        <h2>Canonical category</h2><span>${facets.canonical.length.toLocaleString()}</span>
      </div>
      <label class="sidebar-browse-search">
        <span class="sr-only">Find a canonical category</span>
        <input type="search" autocomplete="off" data-sidebar-canonical-search
          data-sidebar-search-root="canonical" aria-label="Find a canonical category"
          placeholder="Find a category" value="${escapeHtml(state.canonicalSearch)}" />
      </label>
      <div class="sidebar-browser-list sidebar-canonical-tree" role="group"
        aria-label="Canonical categories" data-sidebar-list="canonical">
        <button type="button" class="sidebar-browser-item sidebar-browser-all"
          data-catalog-canonical-value="" data-sidebar-search-label="all categories"
          aria-pressed="${state.canonicalIds.length === 0}">
          <span>All categories</span>
        </button>
        ${canonicalItems}
      </div>
      <p class="sidebar-browser-no-results" data-sidebar-search-empty="canonical" hidden>No matching categories</p>
    </section>` : '';

  const libraries = `
    <details class="sidebar-browse-section sidebar-browse-libraries"
      ${state.kind === 'registry' ? 'open' : ''}>
      <summary class="sidebar-browse-heading"><span>Registries</span>
        <span class="sidebar-browser-count">${facets.registries.length.toLocaleString()}</span>
      </summary>
      <label class="sidebar-browse-search">
        <span class="sr-only">Find a registry</span>
        <input type="search" autocomplete="off" data-sidebar-registry-search
          data-sidebar-search-root="registry" aria-label="Find a registry"
          placeholder="Find a registry" value="${escapeHtml(state.registrySearch)}" />
      </label>
      <div class="sidebar-browser-list" role="group" aria-label="Registries"
        data-sidebar-list="registry">
        ${[...facets.registries].sort((a,b)=>a.value.localeCompare(b.value))
          .map(item=>registryOption(item,state)).join('')}
      </div>
      <p class="sidebar-browser-no-results" data-sidebar-search-empty="registry" hidden>No matching registries</p>
    </details>`;

  return `<nav class="sidebar-browse-navigation" aria-label="Browse catalog">
    ${canonical}${libraries}
  </nav>`;
}

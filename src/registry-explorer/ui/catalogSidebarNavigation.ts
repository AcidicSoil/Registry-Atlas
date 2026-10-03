import type { CatalogFacetSummary, CatalogFacetOption } from '../core/catalogQuery';
import type { CatalogRoute } from '../core/catalogRoutes';
import { escapeHtml } from './renderSafety';

export interface SidebarNavigationState {
  categories: readonly string[];
  registry: string | null;
  kind: CatalogRoute['kind'];
  categorySearch: string;
  registrySearch: string;
}

function navigationOption(
  item: CatalogFacetOption,
  type: 'category' | 'registry',
  state: SidebarNavigationState,
): string {
  const selected = type === 'category'
    ? state.categories.includes(item.value)
    : state.registry === item.value;
  const value = escapeHtml(item.value);
  const label = type === 'registry' ? item.value : item.value.replace(/-/g, ' ');
  const attribute = type === 'category'
    ? `data-catalog-category-value="${value}" data-sidebar-category-link`
    : `data-profile-registry="${value}"`;
  const active = type === 'category'
    ? `aria-pressed="${selected}"`
    : (selected ? 'aria-current="page"' : '');
  return `<button type="button" class="sidebar-browser-item"
    data-sidebar-search-label="${escapeHtml(label.toLowerCase())}"
    ${attribute} ${active}>
    <span class="sidebar-browser-label">${escapeHtml(label)}</span>
    <span class="sidebar-browser-count">${item.count.toLocaleString()}</span>
  </button>`;
}

function optionsMarkup(items: readonly CatalogFacetOption[], type:'category'|'registry',
  state: SidebarNavigationState): string {
  return [...items].sort((a,b)=>type==='category'
    ? b.count-a.count || a.value.localeCompare(b.value)
    : a.value.localeCompare(b.value))
    .map(item=>navigationOption(item,type,state)).join('');
}

export function renderCatalogSidebarNavigation(
  facets: CatalogFacetSummary,
  state: SidebarNavigationState,
): string {
  const hasCategories = facets.categories.length > 0;
  const categories = hasCategories ? `
    <section class="sidebar-browse-section" aria-label="Browse component categories">
      <div class="sidebar-browse-heading">
        <h2>Categories</h2><span>${facets.categories.length.toLocaleString()}</span>
      </div>
      <label class="sidebar-browse-search">
        <span class="sr-only">Find a category</span>
        <input type="search" autocomplete="off" data-sidebar-category-search
          data-sidebar-search-root="category" aria-label="Find a category"
          placeholder="Find a category" value="${escapeHtml(state.categorySearch)}" />
      </label>
      <div class="sidebar-browser-list" role="group" aria-label="Component categories"
        data-sidebar-list="category">
        <button type="button" class="sidebar-browser-item sidebar-browser-all"
          data-catalog-category-value="" data-sidebar-category-link
          data-sidebar-search-label="all categories"
          aria-pressed="${state.categories.length===0}">
          <span>All categories</span>
        </button>
        ${optionsMarkup(facets.categories,'category',state)}
      </div>
      <p class="sidebar-browser-no-results" data-sidebar-search-empty="category" hidden>No matching categories</p>
    </section>` : '';
  const libraries = `
    <details class="sidebar-browse-section sidebar-browse-libraries"
      ${state.kind==='registry' ? 'open' : ''}>
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
        ${optionsMarkup(facets.registries,'registry',state)}
      </div>
      <p class="sidebar-browser-no-results" data-sidebar-search-empty="registry" hidden>No matching registries</p>
    </details>`;
  return `<nav class="sidebar-browse-navigation" aria-label="Browse catalog">
    ${categories}${libraries}
  </nav>`;
}

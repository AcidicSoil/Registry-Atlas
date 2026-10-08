import type { CatalogFacetSummary } from '../core/catalogQuery';
import type { CatalogRoute, CatalogSort } from '../core/catalogRoutes';
import type { CatalogTaxonomy, CatalogTaxonomyNode } from '../core/catalogTaxonomy';
import type { CatalogAssetKind } from '../core/catalogCollections';
import { escapeHtml } from './renderSafety';

export interface SidebarNavigationState {
  canonicalIds: readonly string[];
  registryNames: readonly string[];
  kind: CatalogRoute['kind'];
  sort: CatalogSort;
  access: readonly ('free' | 'paid')[];
  assetKinds?: readonly CatalogAssetKind[];
}

export interface CatalogSidebarNavigationOptions {
  showCanonical?: boolean;
  showAccess?: boolean;
  showRegistrySort?: boolean;
  assetCounts?: Readonly<Partial<Record<CatalogAssetKind, number>>>;
  sourceLabel?: string;
  sourceCount?: number;
}

const ASSET_KIND_LABELS: Readonly<Record<CatalogAssetKind, string>> = {
  component: 'Components',
  block: 'Blocks',
  page: 'Pages',
  template: 'Templates',
  theme: 'Themes',
  icon: 'Icons',
  other: 'Other',
};

function sidebarIcon(kind: string): string {
  const root = kind.split('/')[0] ?? kind;
  const paths: Record<string, string> = {
    source: '<circle cx="8" cy="8" r="5"></circle><path d="M3 8h10M8 3c1.6 1.5 2.4 3.2 2.4 5S9.6 11.5 8 13M8 3C6.4 4.5 5.6 6.2 5.6 8s.8 3.5 2.4 5"></path>',
    foundation: '<rect x="3" y="3" width="10" height="10" rx="1.5"></rect><path d="M6 6h4v4H6z"></path>',
    controls: '<path d="M3 5h10M3 11h10M6 3v4M10 9v4"></path>',
    navigation: '<circle cx="8" cy="8" r="5"></circle><path d="m10.5 5.5-1.6 3.4-3.4 1.6 1.6-3.4 3.4-1.6Z"></path>',
    layout: '<rect x="2.5" y="3" width="11" height="10" rx="1.5"></rect><path d="M6 3v10M6 7h7"></path>',
    application: '<rect x="2.5" y="2.5" width="11" height="11" rx="1.5"></rect><path d="M2.5 6h11M6.5 6v7.5"></path>',
    ai: '<path d="M8 2.5c.5 2 1.5 3 3.5 3.5-2 .5-3 1.5-3.5 3.5-.5-2-1.5-3-3.5-3.5 2-.5 3-1.5 3.5-3.5ZM11.5 9.5c.3 1.1.9 1.7 2 2-.1.1-.2.1-.3.1-.9.3-1.4.9-1.7 1.9-.3-1.1-.9-1.7-2-2 1.1-.3 1.7-.9 2-2Z"></path>',
    auth: '<circle cx="6" cy="7" r="2.5"></circle><path d="M8.2 8.8 13 13M10.7 11l1.4-1.4"></path>',
    marketing: '<path d="M3 8h2l5-3v6l-5-3H3V8Z"></path><path d="M5 8v4"></path>',
    data: '<path d="M3 12V8M8 12V4M13 12V6"></path>',
    feedback: '<path d="M3 3.5h10v7H7l-3 2v-2H3v-7Z"></path>',
    'content-media': '<rect x="2.5" y="3" width="11" height="10" rx="1.5"></rect><circle cx="6" cy="6.5" r="1"></circle><path d="m4 11 2.5-2.5L8.5 10l1.5-1.5 2 2.5"></path>',
    component: '<rect x="3" y="3" width="4" height="4" rx="1"></rect><rect x="9" y="3" width="4" height="4" rx="1"></rect><rect x="3" y="9" width="4" height="4" rx="1"></rect><rect x="9" y="9" width="4" height="4" rx="1"></rect>',
    block: '<rect x="2.5" y="3" width="11" height="10" rx="1.5"></rect><path d="M2.5 6.5h11M6.5 6.5V13"></path>',
    page: '<path d="M4 2.5h6l2 2V13.5H4z"></path><path d="M10 2.5V5h2"></path>',
    template: '<path d="M3 3h10v10H3zM3 6h10"></path>',
    theme: '<circle cx="8" cy="8" r="5"></circle><path d="M8 3a5 5 0 0 0 0 10c-1.5-1.2-2.2-2.9-2.2-5S6.5 4.2 8 3Z"></path>',
    icon: '<path d="M8 2.5 9.6 6l3.9.4-2.9 2.6.8 3.8L8 10.9l-3.4 1.9.8-3.8-2.9-2.6L6.4 6 8 2.5Z"></path>',
    other: '<circle cx="5" cy="8" r="1"></circle><circle cx="8" cy="8" r="1"></circle><circle cx="11" cy="8" r="1"></circle>',
    free: '<path d="M4 8.5 6.8 11 12 5"></path>',
    paid: '<circle cx="8" cy="8" r="5"></circle><path d="M9.8 5.8H7.2a1.4 1.4 0 1 0 0 2.8h1.6a1.4 1.4 0 1 1 0 2.8H6M8 4.5v7"></path>',
  };
  return `<svg class="sidebar-nav-icon-svg" viewBox="0 0 16 16" aria-hidden="true">${paths[root] ?? paths.other}</svg>`;
}

function rowButton(options: {
  attribute: string;
  value: string;
  label: string;
  count?: number;
  selected?: boolean;
  icon?: string;
}): string {
  return `<button type="button" class="sidebar-nav-row${options.selected ? ' sidebar-nav-row-active' : ''}"
    ${options.attribute}="${escapeHtml(options.value)}"
    aria-pressed="${options.selected ? 'true' : 'false'}">
    ${options.icon ? `<span class="sidebar-nav-row-icon" aria-hidden="true">${sidebarIcon(options.icon)}</span>` : ''}
    <span class="sidebar-nav-row-label">${escapeHtml(options.label)}</span>
    ${options.count === undefined ? '' : `<span class="sidebar-nav-row-count">${options.count.toLocaleString()}</span>`}
  </button>`;
}

function sourceRow(label: string, count: number): string {
  return `<div class="sidebar-nav-row sidebar-nav-row-active sidebar-source-row" aria-current="page">
    <span class="sidebar-nav-row-icon sidebar-source-icon" aria-hidden="true">${sidebarIcon('source')}</span>
    <span class="sidebar-nav-row-label">${escapeHtml(label)}</span>
    <span class="sidebar-nav-row-count">${count.toLocaleString()}</span>
  </div>`;
}

function renderSort(state: SidebarNavigationState, showRegistrySort: boolean): string {
  const options: Array<{ value: CatalogSort; label: string }> = [
    { value: 'name', label: 'Name' },
    ...(showRegistrySort ? [{ value: 'registry' as const, label: 'Registry' }] : []),
  ];
  return `<section class="sidebar-nav-section" aria-labelledby="catalog-sort-heading">
    <p class="sidebar-nav-section-label" id="catalog-sort-heading">Sort</p>
    ${options.map(option => rowButton({
      attribute: 'data-catalog-sort-value',
      value: option.value,
      label: option.label,
      selected: state.sort === option.value,
    })).join('')}
  </section>`;
}

function topLevelCanonical(
  nodes: readonly CatalogTaxonomyNode[],
  counts: ReadonlyMap<string, number>,
): Array<{ id: string; label: string; count: number }> {
  return nodes
    .map(node => ({ id: node.id, label: node.label, count: counts.get(node.id) ?? 0 }))
    .filter(row => row.count > 0);
}

function renderCanonical(
  facets: CatalogFacetSummary,
  state: SidebarNavigationState,
  taxonomy: CatalogTaxonomy,
): string {
  const counts = new Map(facets.canonical.map(item => [item.value, item.count]));
  const rows = topLevelCanonical(taxonomy.roots, counts);
  if (!rows.length) return '';
  const selected = state.canonicalIds[0] ?? '';

  return `<section class="sidebar-nav-section" aria-labelledby="catalog-categories-heading">
    <p class="sidebar-nav-section-label" id="catalog-categories-heading">Categories</p>
    ${rows.map(row => rowButton({
      attribute: 'data-catalog-canonical-value',
      value: row.id,
      label: row.label,
      count: row.count,
      selected: selected === row.id || selected.startsWith(row.id + '/'),
      icon: row.id,
    })).join('')}
  </section>`;
}

function renderAssetKinds(
  counts: Readonly<Partial<Record<CatalogAssetKind, number>>> | undefined,
  state: SidebarNavigationState,
): string {
  if (!counts) return '';
  const selected = state.assetKinds?.[0] ?? '';
  const rows = (Object.keys(ASSET_KIND_LABELS) as CatalogAssetKind[])
    .filter(kind => Boolean(counts[kind]) || selected === kind);
  if (!rows.length) return '';

  return `<section class="sidebar-nav-section" aria-labelledby="catalog-types-heading">
    <p class="sidebar-nav-section-label" id="catalog-types-heading">Categories</p>
    ${rows.map(kind => rowButton({
      attribute: 'data-asset-kind-value',
      value: kind,
      label: ASSET_KIND_LABELS[kind],
      count: counts[kind] ?? 0,
      selected: selected === kind,
      icon: kind,
    })).join('')}
  </section>`;
}

function renderAccess(
  facets: CatalogFacetSummary,
  state: SidebarNavigationState,
): string {
  if (!facets.access?.length) return '';
  const counts = new Map(facets.access.map(option => [option.value, option.count]));
  const selected = state.access[0] ?? '';
  const rows = (['free', 'paid'] as const)
    .filter(value => counts.has(value) || selected === value);
  if (!rows.length) return '';

  return `<section class="sidebar-nav-section" aria-labelledby="catalog-access-heading">
    <p class="sidebar-nav-section-label" id="catalog-access-heading">Access</p>
    ${rows.map(value => rowButton({
      attribute: 'data-catalog-access-value',
      value,
      label: value === 'free' ? 'Free' : 'Paid',
      count: counts.get(value) ?? 0,
      selected: selected === value,
      icon: value,
    })).join('')}
  </section>`;
}

export function renderCatalogSidebarNavigation(
  facets: CatalogFacetSummary,
  state: SidebarNavigationState,
  taxonomy: CatalogTaxonomy,
  options: CatalogSidebarNavigationOptions = {},
): string {
  const showCanonical = options.showCanonical !== false;
  const showAccess = options.showAccess !== false;
  const showRegistrySort = options.showRegistrySort !== false;
  const sourceLabel = options.sourceLabel ?? 'shadcn directory';
  const sourceCount = options.sourceCount ?? facets.registries.length;

  return `<nav class="sidebar-browse-navigation" aria-label="Browse catalog">
    ${sourceRow(sourceLabel, sourceCount)}
    ${renderSort(state, showRegistrySort)}
    ${showCanonical ? renderCanonical(facets, state, taxonomy) : ''}
    ${renderAssetKinds(options.assetCounts, state)}
    ${showAccess ? renderAccess(facets, state) : ''}
  </nav>`;
}

import type {
  CatalogComponent,
  CatalogFacetOption,
  CatalogFacetSummary,
  CatalogQueryResult,
} from "../core/catalogQuery";
import type {
  CatalogBrowseQueryState,
  CatalogSort,
} from "../core/catalogRoutes";
import type { RegistryThemeSwatch } from "../core/registry.schema";
import { escapeHtml } from "./renderSafety";
import { renderComponentPreview } from './componentPreview';
import { verifiedVisualReference, renderVisualReferenceImage } from './visualReference';

const COMMON_CATEGORIES = new Set(["ai", "forms", "form", "dashboard", "marketing", "navigation", "charts"]);

export interface CatalogDiscoveryBand {
  label: string;
  routePath: string;
  items: readonly CatalogComponent[];
}

export interface CatalogComponentsViewOptions {
  searchTerm: string;
  browseState?: CatalogBrowseQueryState;
  browseControls?: string;
  discoveryBands?: readonly CatalogDiscoveryBand[];
}

export function renderCatalogComponents(
  headerRoot: HTMLElement,
  bodyRoot: HTMLElement,
  result: CatalogQueryResult,
  options: CatalogComponentsViewOptions,
): void {
  const countLabel = result.total === 1 ? "1 component" : `${result.total.toLocaleString()} components`;
  headerRoot.innerHTML = `
    <div class="catalog-page-heading">
      <div class="catalog-eyebrow">Registry Atlas</div>
      <h1>Components</h1>
      <p>${escapeHtml(countLabel)} across published registries.</p>
    </div>
    <button class="link-button" type="button" data-copy-current-url data-copy-label="Component catalog link copied">Copy link</button>
  `;

  const emptyCopy = options.searchTerm.trim()
    ? `No components match “${escapeHtml(options.searchTerm.trim())}”.`
    : "No components are available.";

  const controls = options.browseControls ?? (options.browseState
    ? renderCatalogBrowseControls(options.browseState)
    : "");

  bodyRoot.innerHTML = `
    ${controls}
    ${renderDiscoveryBands(options.discoveryBands ?? [])}
    ${result.items.length
      ? `
        ${renderResultMeta(result)}
        <div class="catalog-component-grid catalog-collection-grid-component">
          ${result.items.map(item => renderCatalogComponentCard(item)).join("")}
        </div>
        ${renderPagination(result)}
      `
      : `<div class="empty-state"><h2>${emptyCopy}</h2><p>Try a different component name or registry.</p></div>`}
  `;
}

function renderDiscoveryBands(bands: readonly CatalogDiscoveryBand[]): string {
  const visible = bands.filter(band => band.items.length > 0);
  if (!visible.length) return "";

  return `
    <section class="catalog-discovery-bands" aria-label="Component discovery collections">
      ${visible.map(band => `
        <section class="catalog-discovery-band">
          <div class="catalog-discovery-band-heading">
            <h2>${escapeHtml(band.label)}</h2>
            <button type="button" class="link-button" data-catalog-route="${escapeHtml(band.routePath)}">View collection</button>
          </div>
          <div class="catalog-discovery-row">
            ${band.items.slice(0, 6).map(item => renderCatalogComponentCard(item)).join("")}
          </div>
        </section>
      `).join("")}
    </section>
  `;
}

export function renderCatalogBrowseControls(
  state: CatalogBrowseQueryState,
  options: { showRegistrySort?: boolean; facets?: CatalogFacetSummary; assetCounts?: Readonly<Partial<Record<AssetKindToken, number>>>; selectedAssetKinds?: readonly AssetKindToken[]; showRegistries?: boolean; showCategories?: boolean; showItemTypes?: boolean; hideSort?: boolean } = {},
): string {
  const visibleSort: CatalogSort = state.sort;
  const active = state.registryNames.length > 0
    || state.itemTypes.length > 0
    || state.categories.length > 0
    || (options.selectedAssetKinds?.length ?? 0) > 0
    || visibleSort !== "name";

  const facets = options.facets
    ? renderCatalogRailControls(options.facets, state, {
        showRegistries: options.showRegistries,
        showCategories: options.showCategories,
        showItemTypes: options.showItemTypes,
      }) : "";
  const assetKinds = options.assetCounts
    ? renderAssetKindChips(options.assetCounts, options.selectedAssetKinds ?? []) : "";
  const filters = facets + assetKinds;
  const activeFilters = [
    ...state.registryNames.map(value => ({
      attribute:'data-catalog-registry-value',value,label:'Registry: '+value,
    })),
    ...state.categories.map(value => ({
      attribute:'data-catalog-category-value',value,label:'Category: '+value,
    })),
  ];
  return `
    <div class="catalog-filter-bar catalog-filter-bar-compact" role="group" aria-label="Catalog filters and sorting">
      ${activeFilters.length ? `<div class="catalog-applied-filters" role="group" aria-label="Active filters">
        ${activeFilters.map(entry=>`<button type="button" class="catalog-applied-filter" ${entry.attribute}="${escapeHtml(entry.value)}"
          aria-label="Remove ${escapeHtml(entry.label)} filter">${escapeHtml(entry.label)} <span aria-hidden="true">×</span></button>`).join('')}
      </div>` : ''}
      ${filters ? `<details class="catalog-filter-menu"><summary>Filters${state.registryNames.length + state.itemTypes.length + state.categories.length + (options.selectedAssetKinds?.length ?? 0) ? ` <span class="catalog-filter-count">${state.registryNames.length + state.itemTypes.length + state.categories.length + (options.selectedAssetKinds?.length ?? 0)}</span>` : ''}</summary><div class="catalog-filter-panel">${filters}</div></details>` : ""}
      ${options.hideSort ? '' : `<label class="catalog-filter-control">
        <span>Sort</span>
        <select data-catalog-sort>
          ${sortOption("name", "Name A–Z", visibleSort)}
          ${sortOption("name-desc", "Name Z–A", visibleSort)}
          ${options.showRegistrySort === false ? "" : sortOption("registry", "Registry A–Z", visibleSort)}
          ${options.showRegistrySort === false ? "" : sortOption("registry-desc", "Registry Z–A", visibleSort)}
        </select>
      </label>`}
      ${active ? '<button class="link-button catalog-filter-clear" type="button" data-catalog-clear>Clear filters</button>' : ""}
    </div>
  `;
}

export type AssetKindToken = "component" | "template" | "theme" | "icon";

const ASSET_KIND_LABELS: Readonly<Record<AssetKindToken, string>> = {
  component: "Components",
  template: "Templates",
  theme: "Themes",
  icon: "Icon-related",
};

export function renderAssetKindChips(
  counts: Readonly<Partial<Record<AssetKindToken, number>>>,
  selected: readonly AssetKindToken[],
): string {
  const kinds = (Object.keys(ASSET_KIND_LABELS) as AssetKindToken[])
    .filter(kind => Boolean(counts[kind]) || selected.includes(kind));
  if (!kinds.length) return "";
  return `
    <section class="catalog-rail-facet-group" aria-label="Asset type filter">
      <div class="aside-section-title">Asset type</div>
      <div class="catalog-category-list" role="group" aria-label="Asset type">
        <button type="button" class="catalog-category-option" data-asset-kind-value=""
          aria-pressed="${selected.length === 0}">All types</button>
        ${kinds.map(kind => `
          <button type="button" class="catalog-category-option" data-asset-kind-value="${kind}"
            aria-pressed="${selected.includes(kind)}">
            <span>${ASSET_KIND_LABELS[kind]}</span>
            <span class="catalog-category-count">${(counts[kind] ?? 0).toLocaleString()}</span>
          </button>
        `).join("")}
      </div>
    </section>
  `;
}

export interface CatalogRailOptions {
  showRegistries?: boolean;
  showCategories?: boolean;
  showItemTypes?: boolean;
}

export function renderCatalogRailControls(
  facets: CatalogFacetSummary,
  state: CatalogBrowseQueryState,
  options: CatalogRailOptions = {},
): string {
  const showRegistries = options.showRegistries ?? true;
  const showCategories = options.showCategories ?? true;
  const groups = [
    showRegistries ? renderRailFacetGroup(
      "Registry", "registry", boundedFacetOptions(facets.registries, state.registryNames, 12),
      state.registryNames, "All registries",
    ) : "",
    showCategories ? renderRailFacetGroup(
      "Category", "category", boundedFacetOptions(
        facets.categories.filter(option =>
          COMMON_CATEGORIES.has(option.value) && option.value === option.value.toLowerCase()),
        state.categories, 8,
      ), state.categories, "All categories",
    ) : "",
    options.showItemTypes ? renderRailFacetGroup(
      "Item type", "type", boundedFacetOptions(facets.itemTypes, state.itemTypes, 8),
      state.itemTypes, "All item types",
    ) : "",
  ].filter(Boolean);

  return groups.length
    ? `<section class="catalog-sidebar-filters" aria-label="Browse filters">${groups.join("")}</section>`
    : "";
}

export function renderCatalogComponentCard(
  component: CatalogComponent,
  routeKind: 'component' | 'template' | 'theme' = 'component',
): string {
  const reference = verifiedVisualReference(component.visualReference);
  const visual = reference ? renderVisualReferenceImage(reference, component.displayName) : null;
  const liveDemo = !visual && routeKind === 'component'
    ? renderComponentPreview(component.namespace, component.slug, 'card')
    : null;
  const preview = visual ?? liveDemo
    ?? (routeKind === 'theme' && component.themePreview
      ? renderCatalogThemeSpecimen(component)
      : '<div class="catalog-component-unavailable" role="img" aria-label="Visual reference not yet available"><span class="catalog-component-unavailable-icon" aria-hidden="true">▧</span></div>');
  const routePath = routeKind === 'component' ? component.routePath
    : component.routePath.replace('/components/', `/${routeKind}s/`);
  const linkAttributes = `href="${escapeHtml(routePath)}"
    data-view-item-registry="${escapeHtml(component.namespace)}"
    data-view-item-slug="${escapeHtml(component.slug)}"
    data-view-item-kind="${routeKind}"
    aria-label="Open ${escapeHtml(component.displayName)} from ${escapeHtml(component.namespace)}"`;
  const copy = `<div class="catalog-component-card-copy">
    <strong>${escapeHtml(component.displayName)}</strong>
    <span class="catalog-component-registry">${escapeHtml(component.namespace)}</span>
  </div>`;
  return `
    <article class="catalog-component-card catalog-component-card-${routeKind}${liveDemo ? ' catalog-component-card-live' : ''}">
      ${liveDemo
        ? `<div class="catalog-component-specimen">${preview}</div>
           <a class="catalog-component-open catalog-component-open-live" ${linkAttributes}>${copy}</a>`
        : `<a class="catalog-component-open" ${linkAttributes}>
             <div class="catalog-component-specimen">${preview}</div>${copy}
           </a>`}
      ${reference ? `<a class="catalog-component-original" href="${escapeHtml(reference.officialPage)}"
        target="_blank" rel="noreferrer noopener">View original ↗</a>` : ''}
    </article>
  `;
}

const THEME_SWATCH_KEYS: readonly RegistryThemeSwatch[] = [
  "background",
  "foreground",
  "primary",
  "secondary",
  "accent",
];

function renderCatalogThemeSpecimen(component: CatalogComponent): string {
  const groups: ReadonlyArray<{
    label: string;
    values: Readonly<Partial<Record<RegistryThemeSwatch, string>>> | undefined;
  }> = [
    { label: "Light", values: component.themePreview?.light },
    { label: "Dark", values: component.themePreview?.dark },
  ];
  const visible = groups.filter(group =>
    group.values && THEME_SWATCH_KEYS.some(key => Boolean(group.values?.[key])),
  );
  if (!visible.length) return renderCatalogMetadataSpecimen(component);

  return `
    <div class="catalog-theme-swatches" aria-label="${escapeHtml(component.displayName)} theme swatches">
      ${visible.map(group => `
        <div class="catalog-theme-swatch-group">
          <span>${escapeHtml(group.label)}</span>
          <div class="catalog-theme-swatch-row">
            ${THEME_SWATCH_KEYS.map(name => {
              const value = group.values?.[name];
              if (!value) return "";
              const color = safeCssColor(value);
              return `<span class="catalog-theme-swatch" title="${escapeHtml(name)}: ${escapeHtml(value)}"${color ? ` style="background-color:${escapeHtml(color)}"` : ""}></span>`;
            }).join("")}
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

function safeCssColor(value: string): string | null {
  const candidate = value.trim();
  if (/^#[0-9a-f]{3,8}$/i.test(candidate)) return candidate;
  if (/^(?:rgb|rgba|hsl|hsla|oklch|oklab|lab|lch)\([0-9a-z.%+\-\s,\/]+\)$/i.test(candidate)) return candidate;
  return null;
}

function renderCatalogMetadataSpecimen(component: CatalogComponent): string {
  const facts = [
    component.author ? `By ${component.author}` : "",
    component.fileCount !== undefined ? `${component.fileCount.toLocaleString()} ${component.fileCount === 1 ? "file" : "files"}` : "",
    component.type.replace(/^registry:/, ""),
  ].filter(Boolean);

  return `
    <div class="catalog-component-metadata-specimen">
      <p>${escapeHtml(component.description ?? `From ${component.namespace}.`)}</p>
      <div class="catalog-component-specimen-facts">
        ${facts.map(fact => `<span>${escapeHtml(fact)}</span>`).join("")}
      </div>
    </div>
  `;
}

function renderRailFacetGroup(
  label: string,
  dimension: "registry" | "category" | "type",
  options: readonly CatalogFacetOption[],
  selected: readonly string[],
  allLabel: string,
): string {
  if (!options.length && !selected.length) return "";
  const attribute = `data-catalog-${dimension}-value`;
  return `
    <div class="catalog-rail-facet-group">
      <div class="aside-section-title">${escapeHtml(label)}</div>
      <div class="catalog-category-list" role="group" aria-label="${escapeHtml(label)}">
        <button type="button" class="catalog-category-option" ${attribute}=""
          aria-pressed="${selected.length === 0}">${escapeHtml(allLabel)}</button>
        ${options.map(option => `
          <button type="button" class="catalog-category-option"
            ${attribute}="${escapeHtml(option.value)}"
            aria-pressed="${selected.includes(option.value)}">
            <span>${escapeHtml(dimension === "type" ? option.value.replace(/^registry:/, "") : option.value)}</span>
            <span class="catalog-category-count">${option.count.toLocaleString()}</span>
          </button>
        `).join("")}
      </div>
    </div>
  `;
}

function renderResultMeta(result: CatalogQueryResult): string {
  const start = (result.page - 1) * result.pageSize + 1;
  const end = Math.min(result.page * result.pageSize, result.total);
  return `<div class="catalog-result-meta">Showing ${start.toLocaleString()}–${end.toLocaleString()} of ${result.total.toLocaleString()}</div>`;
}

function renderPagination(result: CatalogQueryResult): string {
  if (result.pageCount <= 1) return "";
  return `
    <nav class="catalog-pagination" aria-label="Component catalog pages">
      <button type="button" data-discovery-page="${result.page - 1}" ${result.hasPreviousPage ? "" : "disabled"}>Previous</button>
      <span>Page ${result.page.toLocaleString()} of ${result.pageCount.toLocaleString()}</span>
      <button type="button" data-discovery-page="${result.page + 1}" ${result.hasNextPage ? "" : "disabled"}>Next</button>
    </nav>
  `;
}


function boundedFacetOptions(
  options: readonly CatalogFacetOption[],
  selected: readonly string[],
  limit: number,
): CatalogFacetOption[] {
  const bounded = options.slice(0, limit);
  for (const value of selected) {
    if (!bounded.some(option => option.value === value)) {
      bounded.push(options.find(option => option.value === value) ?? { value, count: 0 });
    }
  }
  return bounded;
}

function sortOption(value: CatalogSort, label: string, selected: CatalogSort): string {
  return `<option value="${value}"${value === selected ? " selected" : ""}>${escapeHtml(label)}</option>`;
}

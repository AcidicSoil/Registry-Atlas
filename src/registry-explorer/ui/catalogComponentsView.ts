import type {
  CatalogComponent,
  CatalogQueryResult,
} from "../core/catalogQuery";
import {
  catalogRoutePath,
  type CatalogBrowseQueryState,
} from "../core/catalogRoutes";
import type { CatalogAssetKind } from "../core/catalogCollections";
import { catalogTaxonomyNodeMap, type CatalogTaxonomy } from "../core/catalogTaxonomy";
import type { RegistryThemeSwatch } from "../core/registry.schema";
import { escapeHtml } from "./renderSafety";
import { sourcePageNavigation } from './sourcePageLink';
import { renderRegistryIcon } from './registryIdentity';

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
  layout?: "grid" | "list";
}

export function renderCatalogComponents(
  headerRoot: HTMLElement,
  bodyRoot: HTMLElement,
  result: CatalogQueryResult,
  options: CatalogComponentsViewOptions,
): void {
  const countLabel = result.total === 1 ? "1 item" : `${result.total.toLocaleString()} items`;
  headerRoot.innerHTML = `
    <div class="catalog-page-heading">
      <div class="catalog-eyebrow">Explore</div>
      <h1>Components</h1>
      <p>${escapeHtml(countLabel)} across published registries.</p>
    </div>
    <button class="link-button" type="button" data-copy-current-url data-copy-label="Catalog link copied">Copy link</button>
  `;

  const emptyCopy = options.searchTerm.trim()
    ? `No catalog items match “${escapeHtml(options.searchTerm.trim())}”.`
    : "No catalog items are available.";

  const controls = options.browseControls ?? (options.browseState
    ? renderCatalogBrowseControls(options.browseState)
    : "");

  bodyRoot.innerHTML = `
    ${controls}
    ${renderDiscoveryBands(options.discoveryBands ?? [])}
    ${result.items.length
      ? `
        ${renderResultMeta(result)}
        <div class="catalog-component-grid catalog-component-grid-${options.layout ?? "grid"} catalog-collection-grid-component">
          ${result.items.map(item => renderCatalogComponentCard(item)).join("")}
        </div>
        ${renderPagination(result)}
      `
      : `<div class="empty-state"><h2>${emptyCopy}</h2><p>Try a different item name, category, kind, or registry.</p></div>`}
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
  options: {
    taxonomy?: CatalogTaxonomy;
    selectedAssetKinds?: readonly AssetKindToken[];
    searchTerm?: string;
  } = {},
): string {
  const canonicalIds = state.canonicalIds ?? [];
  const access = state.access ?? [];
  const selectedAssetKinds = options.selectedAssetKinds ?? state.assetKinds ?? [];
  const taxonomyMap = options.taxonomy ? catalogTaxonomyNodeMap(options.taxonomy) : null;
  const activeFilters = [
    ...state.registryNames.map(value => ({
      attribute:'data-catalog-registry-value',value,label:'Registry: '+value,
    })),
    ...state.itemTypes.map(value => ({
      attribute:'data-catalog-type-value',value,label:'Type: '+value.replace(/^registry:/, ''),
    })),
    ...state.categories.map(value => ({
      attribute:'data-catalog-category-value',value,label:'Source: '+value,
    })),
    ...selectedAssetKinds.map(value => ({
      attribute:'data-asset-kind-value',value,label:'Asset type: '+ASSET_KIND_LABELS[value],
    })),
    ...canonicalIds.map(value => ({
      attribute:'data-catalog-canonical-value',
      value,
      label:'Category: '+(taxonomyMap?.get(value)?.label ?? value),
    })),
    ...access.map(value => ({
      attribute:'data-catalog-access-value',
      value,
      label:'Access: '+value[0]!.toUpperCase()+value.slice(1),
    })),
  ];
  const query = options.searchTerm?.trim() ?? '';
  const active = Boolean(query) || activeFilters.length > 0;
  if (!active) return '';

  return `<div class="catalog-results-context" aria-label="Current catalog scope">
    ${query ? `<span class="catalog-search-context">Search: “${escapeHtml(query)}”</span>` : ''}
    ${activeFilters.length ? `<div class="catalog-applied-filters" role="group" aria-label="Active filters">
      ${activeFilters.map(entry=>`<button type="button" class="catalog-applied-filter" ${entry.attribute}="${escapeHtml(entry.value)}"
        aria-label="Remove ${escapeHtml(entry.label)} filter">${escapeHtml(entry.label)} <span aria-hidden="true">×</span></button>`).join('')}
    </div>` : ''}
    <button class="link-button catalog-filter-clear" type="button" data-catalog-clear>Clear all</button>
  </div>`;
}

export type AssetKindToken = CatalogAssetKind;

const ASSET_KIND_LABELS: Readonly<Record<AssetKindToken, string>> = {
  component: "Components",
  block: "Blocks",
  page: "Pages",
  template: "Templates",
  theme: "Themes",
  icon: "Icons",
  other: "Other",
};

export function renderCatalogComponentCard(
  component: CatalogComponent,
  routeKind: 'component' | 'block' | 'page' | 'template' | 'theme' | 'icon' = 'component',
): string {
  const homepage = component.registry?.url ?? '';
  const original = sourcePageNavigation(homepage, {
    docsUrl: component.docsUrl,
    sourcePage: component.sourcePage,
  });
  const routePath = routeKind === 'component'
    ? component.routePath
    : routeKind === 'icon'
      ? catalogRoutePath(
          { kind: 'component', namespace: component.namespace, slug: component.slug },
          component.routePath.slice(0, component.routePath.indexOf(component.namespace)),
        )
      : catalogRoutePath(
        { kind: routeKind, namespace: component.namespace, slug: component.slug },
        component.routePath.slice(0, component.routePath.indexOf(component.namespace)),
      );
  const kindLabel = routeKind === 'component' ? component.type.replace(/^registry:/, '')
    : routeKind;
  const supportingCopy = component.description?.trim()
    || (component.categories.length ? component.categories.slice(0, 3).join(' · ') : kindLabel);
  const themeData = routeKind === 'theme' && component.themePreview
    ? renderCatalogThemeSpecimen(component) : '';

  return `
    <article class="catalog-component-card catalog-component-card-${routeKind}">
      <a class="catalog-component-open"
        href="${escapeHtml(routePath)}"
        data-view-item-registry="${escapeHtml(component.namespace)}"
        data-view-item-slug="${escapeHtml(component.slug)}"
        data-view-item-kind="${routeKind}"
        aria-label="Open ${escapeHtml(component.displayName)} from ${escapeHtml(component.namespace)}">
        <div class="catalog-component-card-heading">
          <div class="catalog-component-library">
            ${renderRegistryIcon(component.registry)}
            <div class="catalog-component-card-copy">
              <strong>${escapeHtml(component.displayName)}</strong>
              <span class="catalog-component-registry">${escapeHtml(component.namespace)}</span>
            </div>
          </div>
          <span class="catalog-component-kind">${escapeHtml(kindLabel)}</span>
        </div>
        <p class="catalog-component-description">${escapeHtml(supportingCopy)}</p>
        ${themeData}
      </a>
      ${original ? `<div class="catalog-component-source-actions" aria-label="Source links">
        <a class="catalog-component-original" href="${escapeHtml(original.url)}"
          data-source-level="${escapeHtml(original.level)}"
          target="_blank" rel="noreferrer noopener"
          aria-label="${escapeHtml(sourceActionLabel(routeKind))} on source registry">${escapeHtml(sourceActionLabel(routeKind))} ↗</a>
      </div>` : ''}
    </article>
  `;
}

function sourceActionLabel(
  routeKind: 'component' | 'block' | 'page' | 'template' | 'theme' | 'icon',
): string {
  return 'View ' + routeKind;
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

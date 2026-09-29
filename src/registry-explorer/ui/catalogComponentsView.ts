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
import { escapeHtml, renderSafeExternalImage } from "./renderSafety";

export interface CatalogDiscoveryBand {
  label: string;
  routePath: string;
  items: readonly CatalogComponent[];
}

export interface CatalogComponentsViewOptions {
  searchTerm: string;
  facets?: CatalogFacetSummary;
  browseState?: CatalogBrowseQueryState;
  discoveryBands?: readonly CatalogDiscoveryBand[];
}

export function renderCatalogComponents(
  headerRoot: HTMLElement,
  bodyRoot: HTMLElement,
  result: CatalogQueryResult,
  options: CatalogComponentsViewOptions,
): void {
  const countLabel = result.total === 1 ? "1 indexed component" : `${result.total.toLocaleString()} indexed components`;
  headerRoot.innerHTML = `
    <div class="catalog-page-heading">
      <div class="catalog-eyebrow">Registry Atlas</div>
      <h1>Components</h1>
      <p>${escapeHtml(countLabel)} from real registry catalog records.</p>
    </div>
    <button class="link-button" type="button" data-copy-current-url data-copy-label="Component catalogue link copied">Copy link</button>
  `;

  const emptyCopy = options.searchTerm.trim()
    ? `No indexed components match “${escapeHtml(options.searchTerm.trim())}”.`
    : "No indexed components are available.";

  const controls = options.facets && options.browseState
    ? renderCatalogBrowseControls(options.facets, options.browseState)
    : "";

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
      : `<div class="empty-state"><h2>${emptyCopy}</h2><p>Try another real component name, category, type, or registry.</p></div>`}
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
  facets: CatalogFacetSummary,
  state: CatalogBrowseQueryState,
  options: { includeDimensions?: boolean; includeRegistry?: boolean } = {},
): string {
  const visibleSort: Exclude<CatalogSort, "reviewed"> = state.sort === "reviewed" ? "name" : state.sort;
  const active = state.registryNames.length > 0
    || state.itemTypes.length > 0
    || state.categories.length > 0
    || visibleSort !== "name";
  const includeDimensions = options.includeDimensions ?? false;
  const includeRegistry = options.includeRegistry ?? true;

  return `
    <div class="catalog-filter-bar catalog-filter-bar-compact" aria-label="Catalog sort controls">
      ${includeDimensions && includeRegistry ? renderFilterSelect(
        "Registry",
        "registry",
        boundedFacetOptions(facets.registries, state.registryNames[0] ?? "", 100),
        state.registryNames[0] ?? "",
        "All registries",
      ) : ""}
      ${includeDimensions ? renderFilterSelect(
        "Type",
        "type",
        boundedFacetOptions(facets.itemTypes, state.itemTypes[0] ?? "", 20),
        state.itemTypes[0] ?? "",
        "All item types",
        value => value.replace(/^registry:/, ""),
      ) : ""}
      ${includeDimensions ? renderFilterSelect(
        "Category",
        "category",
        boundedFacetOptions(facets.categories, state.categories[0] ?? "", 100),
        state.categories[0] ?? "",
        "All categories",
      ) : ""}
      <label class="catalog-filter-control">
        <span>Sort</span>
        <select data-catalog-sort>
          ${sortOption("name", "Name", visibleSort)}
          ${sortOption("registry", "Registry", visibleSort)}
          ${sortOption("type", "Item type", visibleSort)}
        </select>
      </label>
      ${active ? '<button class="link-button catalog-filter-clear" type="button" data-catalog-clear>Clear filters</button>' : ""}
    </div>
  `;
}

export function renderCatalogRailControls(
  facets: CatalogFacetSummary,
  state: CatalogBrowseQueryState,
): string {
  return `
    <section class="catalog-sidebar-filters" aria-label="Component browse filters">
      ${renderRailFacetGroup(
        "Sources",
        "registry",
        boundedFacetOptions(facets.registries, state.registryNames[0] ?? "", 10),
        state.registryNames[0] ?? "",
        "All sources",
      )}
      ${renderRailFacetGroup(
        "Item types",
        "type",
        boundedFacetOptions(facets.itemTypes, state.itemTypes[0] ?? "", 12),
        state.itemTypes[0] ?? "",
        "All item types",
        value => value.replace(/^registry:/, ""),
      )}
      ${renderRailFacetGroup(
        "Categories",
        "category",
        boundedFacetOptions(facets.categories, state.categories[0] ?? "", 12),
        state.categories[0] ?? "",
        "All categories",
      )}
    </section>
  `;
}

export function renderCatalogComponentCard(
  component: CatalogComponent,
  routeKind: 'component' | 'template' | 'theme' = 'component',
): string {
  const preview = component.previewUrl
    ? renderSafeExternalImage(
        component.previewUrl,
        `${component.displayName} preview`,
        "catalog-component-preview-image",
      )
    : routeKind === "theme" && component.themePreview
      ? renderCatalogThemeSpecimen(component)
      : renderCatalogMetadataSpecimen(component);
  const categories = component.categories.slice(0, 2)
    .map(category => `<span>${escapeHtml(category)}</span>`)
    .join("");

  return `
    <article class="catalog-component-card catalog-component-card-${routeKind}">
      <button
        class="catalog-component-open"
        type="button"
        data-view-item-registry="${escapeHtml(component.namespace)}"
        data-view-item-slug="${escapeHtml(component.slug)}"
        data-view-item-kind="${routeKind}"
        aria-label="Open ${escapeHtml(component.displayName)} from ${escapeHtml(component.namespace)}">
        <div class="catalog-component-specimen">${preview}</div>
        <div class="catalog-component-card-copy">
          <strong>${escapeHtml(component.displayName)}</strong>
          ${component.displayName !== component.slug
            ? `<code class="catalog-component-slug">${escapeHtml(component.slug)}</code>`
            : ""}
          <span class="catalog-component-registry">${escapeHtml(component.namespace)}</span>
          <div class="catalog-component-card-meta">
            <span>${escapeHtml(component.type.replace(/^registry:/, ""))}</span>
            ${categories}
          </div>
        </div>
      </button>
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
      <p>${escapeHtml(component.description ?? `Catalog item from ${component.namespace}.`)}</p>
      <div class="catalog-component-specimen-facts">
        ${facts.map(fact => `<span>${escapeHtml(fact)}</span>`).join("")}
      </div>
    </div>
  `;
}

function renderRailFacetGroup(
  label: string,
  dimension: "registry" | "type" | "category",
  options: readonly CatalogFacetOption[],
  selected: string,
  allLabel: string,
  labelFor: (value: string) => string = value => value,
): string {
  const dataAttribute = dimension === "registry"
    ? "data-catalog-registry-value"
    : dimension === "type"
      ? "data-catalog-type-value"
      : "data-catalog-category-value";
  return `
    <div class="catalog-rail-facet-group">
      <div class="aside-section-title">${escapeHtml(label)}</div>
      <div class="catalog-category-list">
        <button
          type="button"
          class="catalog-category-option"
          ${dataAttribute}=""
          aria-pressed="${selected === ""}">
          <span>${escapeHtml(allLabel)}</span>
        </button>
        ${options.map(option => `
          <button
            type="button"
            class="catalog-category-option"
            ${dataAttribute}="${escapeHtml(option.value)}"
            aria-pressed="${option.value === selected}">
            <span>${escapeHtml(labelFor(option.value))}</span>
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
    <nav class="catalog-pagination" aria-label="Component catalogue pages">
      <button type="button" data-discovery-page="${result.page - 1}" ${result.hasPreviousPage ? "" : "disabled"}>Previous</button>
      <span>Page ${result.page.toLocaleString()} of ${result.pageCount.toLocaleString()}</span>
      <button type="button" data-discovery-page="${result.page + 1}" ${result.hasNextPage ? "" : "disabled"}>Next</button>
    </nav>
  `;
}

function renderFilterSelect(
  label: string,
  dimension: "registry" | "type" | "category",
  options: readonly CatalogFacetOption[],
  selected: string,
  allLabel: string,
  labelFor: (value: string) => string = value => value,
): string {
  const visibleOptions = selected && !options.some(option => option.value === selected)
    ? [...options, { value: selected, count: 0 }]
    : options;
  return `
    <label class="catalog-filter-control">
      <span>${escapeHtml(label)}</span>
      <select data-catalog-filter="${dimension}">
        <option value="">${escapeHtml(allLabel)}</option>
        ${visibleOptions.map(option => `
          <option value="${escapeHtml(option.value)}"${option.value === selected ? " selected" : ""}>
            ${escapeHtml(labelFor(option.value))} (${option.count.toLocaleString()})
          </option>
        `).join("")}
      </select>
    </label>
  `;
}

function boundedFacetOptions(
  options: readonly CatalogFacetOption[],
  selected: string,
  limit: number,
): CatalogFacetOption[] {
  const bounded = options.slice(0, limit);
  if (!selected || bounded.some(option => option.value === selected)) return bounded;
  const selectedOption = options.find(option => option.value === selected);
  return [...bounded, selectedOption ?? { value: selected, count: 0 }];
}

function sortOption(value: CatalogSort, label: string, selected: CatalogSort): string {
  return `<option value="${value}"${value === selected ? " selected" : ""}>${escapeHtml(label)}</option>`;
}

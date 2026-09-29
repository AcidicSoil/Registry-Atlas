import type {
  CatalogComponent,
  CatalogFacetOption,
  CatalogFacetSummary,
  CatalogQueryResult,
} from "../core/catalogQuery";
import type {
  CatalogBrowseQueryState,
  CatalogReviewedFilter,
  CatalogSort,
} from "../core/catalogRoutes";
import { escapeHtml, renderSafeExternalImage } from "./renderSafety";

export interface CatalogComponentsViewOptions {
  searchTerm: string;
  facets?: CatalogFacetSummary;
  browseState?: CatalogBrowseQueryState;
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
    ${result.items.length
      ? `
        ${renderResultMeta(result)}
        <div class="catalog-component-grid">
          ${result.items.map(item => renderCatalogComponentCard(item)).join("")}
        </div>
        ${renderPagination(result)}
      `
      : `<div class="empty-state"><h2>${emptyCopy}</h2><p>Try another real component name, category, type, or registry.</p></div>`}
  `;
}

export function renderCatalogBrowseControls(
  facets: CatalogFacetSummary,
  state: CatalogBrowseQueryState,
  options: { includeDimensions?: boolean; includeRegistry?: boolean } = {},
): string {
  const active = state.registryNames.length > 0
    || state.itemTypes.length > 0
    || state.categories.length > 0
    || state.reviewed !== "all"
    || state.sort !== "name";
  const includeDimensions = options.includeDimensions ?? false;
  const includeRegistry = options.includeRegistry ?? true;

  return `
    <div class="catalog-filter-bar catalog-filter-bar-compact" aria-label="Catalog review and sort controls">
      ${includeDimensions && includeRegistry ? renderFilterSelect(
        "Registry",
        "registry",
        facets.registries,
        state.registryNames[0] ?? "",
        "All registries",
      ) : ""}
      ${includeDimensions ? renderFilterSelect(
        "Type",
        "type",
        facets.itemTypes,
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
        <span>Reviewed</span>
        <select data-catalog-reviewed>
          ${selectOption("all", "All items", state.reviewed)}
          ${selectOption("reviewed", `Reviewed (${facets.reviewedCount.toLocaleString()})`, state.reviewed)}
          ${selectOption("unreviewed", `Not reviewed (${facets.unreviewedCount.toLocaleString()})`, state.reviewed)}
        </select>
      </label>
      <label class="catalog-filter-control">
        <span>Sort</span>
        <select data-catalog-sort>
          ${sortOption("name", "Name", state.sort)}
          ${sortOption("registry", "Registry", state.sort)}
          ${sortOption("type", "Item type", state.sort)}
          ${sortOption("reviewed", "Reviewed first", state.sort)}
        </select>
      </label>
      ${active ? '<button class="link-button catalog-filter-clear" type="button" data-catalog-clear>Clear filters</button>' : ""}
    </div>
  `;
}

export function renderCatalogRailControls(
  facets: CatalogFacetSummary,
  state: CatalogBrowseQueryState,
  searchTerm: string,
): string {
  const selectedCategory = state.categories[0] ?? "";
  const categories = boundedFacetOptions(facets.categories, selectedCategory, 12);

  return `
    <section class="catalog-sidebar-filters" aria-label="Component browse filters">
      <label class="catalog-rail-search-control">
        <span>Search</span>
        <input
          type="search"
          data-catalog-search
          value="${escapeHtml(searchTerm)}"
          placeholder="Search components"
          autocomplete="off" />
      </label>
      ${renderFilterSelect(
        "Registry",
        "registry",
        facets.registries,
        state.registryNames[0] ?? "",
        "All registries",
      )}
      ${renderFilterSelect(
        "Type",
        "type",
        facets.itemTypes,
        state.itemTypes[0] ?? "",
        "All item types",
        value => value.replace(/^registry:/, ""),
      )}
      <div class="catalog-category-filter">
        <div class="aside-section-title">Categories</div>
        <div class="catalog-category-list">
          <button
            type="button"
            class="catalog-category-option"
            data-catalog-category-value=""
            aria-pressed="${selectedCategory === ""}">
            <span>All categories</span>
          </button>
          ${categories.map(option => `
            <button
              type="button"
              class="catalog-category-option"
              data-catalog-category-value="${escapeHtml(option.value)}"
              aria-pressed="${option.value === selectedCategory}">
              <span>${escapeHtml(option.value)}</span>
              <span class="catalog-category-count">${option.count.toLocaleString()}</span>
            </button>
          `).join("")}
        </div>
      </div>
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
    : `
      <div class="catalog-component-placeholder">
        <code>${escapeHtml(component.type)}</code>
        <span>Preview not published</span>
      </div>
    `;
  const categories = component.categories.slice(0, 2)
    .map(category => `<span>${escapeHtml(category)}</span>`)
    .join("");

  return `
    <article class="catalog-component-card">
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
  return selectedOption ? [...bounded, selectedOption] : bounded;
}

function selectOption(
  value: CatalogReviewedFilter,
  label: string,
  selected: CatalogReviewedFilter,
): string {
  return `<option value="${value}"${value === selected ? " selected" : ""}>${escapeHtml(label)}</option>`;
}

function sortOption(value: CatalogSort, label: string, selected: CatalogSort): string {
  return `<option value="${value}"${value === selected ? " selected" : ""}>${escapeHtml(label)}</option>`;
}

import type { CatalogComponent, CatalogQueryResult } from "../core/catalogQuery";
import { escapeHtml, renderSafeExternalImage } from "./renderSafety";

export interface CatalogComponentsViewOptions {
  searchTerm: string;
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

  bodyRoot.innerHTML = result.items.length
    ? `
      ${renderResultMeta(result)}
      <div class="catalog-component-grid">
        ${result.items.map(renderCatalogComponentCard).join("")}
      </div>
      ${renderPagination(result)}
    `
    : `<div class="empty-state"><h2>${emptyCopy}</h2><p>Try another real component name, category, type, or registry.</p></div>`;
}

export function renderCatalogComponentCard(component: CatalogComponent): string {
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

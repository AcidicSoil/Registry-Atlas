import type { CatalogQueryResult } from "../core/catalogQuery";
import { renderCatalogComponentCard } from "./catalogComponentsView";
import { escapeHtml } from "./renderSafety";

export interface CatalogCollectionViewOptions {
  eyebrow: string;
  title: string;
  description: string;
  routeKind?: 'component' | 'template' | 'theme';
  emptyTitle?: string;
  emptyBody?: string;
}

export function renderCatalogCollection(
  headerRoot: HTMLElement,
  bodyRoot: HTMLElement,
  result: CatalogQueryResult,
  options: CatalogCollectionViewOptions,
): void {
  headerRoot.innerHTML = `
    <div class="catalog-page-heading">
      <div class="catalog-eyebrow">${escapeHtml(options.eyebrow)}</div>
      <h1>${escapeHtml(options.title)}</h1>
      <p>${escapeHtml(options.description)}</p>
    </div>
    <button class="link-button" type="button" data-copy-current-url>Copy link</button>
  `;

  if (!result.items.length) {
    bodyRoot.innerHTML = `
      <div class="empty-state collection-empty">
        <h2>${escapeHtml(options.emptyTitle ?? "No matching items.")}</h2>
        <p>${escapeHtml(options.emptyBody ?? "Try a different search or filter.")}</p>
      </div>
    `;
    return;
  }

  const start = (result.page - 1) * result.pageSize + 1;
  const end = Math.min(result.page * result.pageSize, result.total);
  bodyRoot.innerHTML = `
    <div class="catalog-result-meta">Showing ${start.toLocaleString()}–${end.toLocaleString()} of ${result.total.toLocaleString()}</div>
    <div class="catalog-component-grid catalog-collection-grid-${options.routeKind ?? "component"}">
      ${result.items.map(item => renderCatalogComponentCard(item, options.routeKind ?? "component")).join("")}
    </div>
    ${result.pageCount > 1 ? `
      <nav class="catalog-pagination" aria-label="${escapeHtml(options.title)} pages">
        <button type="button" data-discovery-page="${result.page - 1}" ${result.hasPreviousPage ? "" : "disabled"}>Previous</button>
        <span>Page ${result.page.toLocaleString()} of ${result.pageCount.toLocaleString()}</span>
        <button type="button" data-discovery-page="${result.page + 1}" ${result.hasNextPage ? "" : "disabled"}>Next</button>
      </nav>
    ` : ""}
  `;
}

export function renderEvidenceUnavailable(
  headerRoot: HTMLElement,
  bodyRoot: HTMLElement,
  title: string,
  description: string,
  detail: string,
): void {
  headerRoot.innerHTML = `
    <div class="catalog-page-heading">
      <div class="catalog-eyebrow">Registry Atlas</div>
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(description)}</p>
    </div>
    <button class="link-button" type="button" data-copy-current-url>Copy link</button>
  `;
  bodyRoot.innerHTML = `
    <div class="evidence-unavailable">
      <div class="catalog-eyebrow">Not available</div>
      <h2>This view is not available yet.</h2>
      <p>${escapeHtml(detail)}</p>
    </div>
  `;
}

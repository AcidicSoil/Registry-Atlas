import type { CatalogFacetSummary, CatalogQueryResult } from "../core/catalogQuery";
import type { CatalogBrowseQueryState } from "../core/catalogRoutes";
import type { RegistryCatalogCoverage } from "../core/registryDirectory";
import type { Registry } from "../core/registry.schema";
import {
  renderCatalogBrowseControls,
  renderCatalogComponentCard,
} from "./catalogComponentsView";
import { escapeHtml, renderExternalLink } from "./renderSafety";

export function renderRegistryCollection(
  headerRoot: HTMLElement,
  bodyRoot: HTMLElement,
  registry: Registry,
  result: CatalogQueryResult,
  options: {
    facets?: CatalogFacetSummary;
    browseState?: CatalogBrowseQueryState;
    coverage?: RegistryCatalogCoverage;
  } = {},
): void {
  const count = result.total === 1 ? "1 indexed component" : `${result.total.toLocaleString()} indexed components`;
  headerRoot.innerHTML = `
    <div class="registry-collection-heading">
      <button class="link-button" type="button" data-back-to-results>← Registries</button>
      <div class="catalog-eyebrow">Registry</div>
      <h1>${escapeHtml(registry.name)}</h1>
      <p>${escapeHtml(registry.description)}</p>
      <div class="registry-collection-meta">
        <strong>${escapeHtml(count)}</strong>
        ${options.coverage ? `<span class="catalog-coverage catalog-coverage-${escapeHtml(options.coverage)}">${escapeHtml(coverageLabel(options.coverage))}</span>` : ""}
        ${renderExternalLink(registry.url, "Open source", "secondary-link")}
      </div>
    </div>
    <button class="link-button" type="button" data-copy-current-url data-copy-label="Registry link copied">Copy link</button>
  `;

  bodyRoot.innerHTML = `
    <section class="registry-collection-components">
      <div class="section-heading-row">
        <div>
          <h2>Catalog components</h2>
          <p>Real component records from this registry's indexed catalog.</p>
        </div>
      </div>
      ${options.facets && options.browseState
        ? renderCatalogBrowseControls(options.facets, options.browseState, { includeRegistry: false })
        : ""}
      ${result.items.length
        ? `
          ${renderMeta(result)}
          <div class="catalog-component-grid">${result.items.map(renderCatalogComponentCard).join("")}</div>
          ${renderPagination(result)}
        `
        : renderEmptyRegistryInventory(options.coverage)}
    </section>
  `;
}

function coverageLabel(coverage: RegistryCatalogCoverage): string {
  if (coverage === "current") return "Current catalog";
  if (coverage === "stale") return "Stale catalog";
  if (coverage === "empty") return "No supported items";
  return "Catalog unavailable";
}

function renderEmptyRegistryInventory(coverage: RegistryCatalogCoverage | undefined): string {
  if (coverage === "failed") {
    return '<div class="empty-state"><h2>Catalog unavailable.</h2><p>The upstream registry catalog could not be fetched, so Registry Atlas does not invent component results.</p></div>';
  }
  if (coverage === "empty") {
    return '<div class="empty-state"><h2>No supported component items.</h2><p>The catalog was fetched successfully but contained no supported browse item types.</p></div>';
  }
  if (coverage === "stale") {
    return '<div class="empty-state"><h2>No stale indexed items remain.</h2><p>The last successful catalog evidence is stale and contains no supported browse items.</p></div>';
  }
  return '<div class="empty-state"><h2>No indexed components are available for this registry.</h2><p>This is a catalog coverage gap, not an inferred empty component set.</p></div>';
}

function renderMeta(result: CatalogQueryResult): string {
  if (result.total === 0) return "";
  const start = (result.page - 1) * result.pageSize + 1;
  const end = Math.min(result.page * result.pageSize, result.total);
  return `<div class="catalog-result-meta">Showing ${start.toLocaleString()}–${end.toLocaleString()} of ${result.total.toLocaleString()}</div>`;
}

function renderPagination(result: CatalogQueryResult): string {
  if (result.pageCount <= 1) return "";
  return `
    <nav class="catalog-pagination" aria-label="Registry component pages">
      <button type="button" data-discovery-page="${result.page - 1}" ${result.hasPreviousPage ? "" : "disabled"}>Previous</button>
      <span>Page ${result.page.toLocaleString()} of ${result.pageCount.toLocaleString()}</span>
      <button type="button" data-discovery-page="${result.page + 1}" ${result.hasNextPage ? "" : "disabled"}>Next</button>
    </nav>
  `;
}

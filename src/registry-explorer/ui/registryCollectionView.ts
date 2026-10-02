import type { CatalogQueryResult } from "../core/catalogQuery";
import { assetKindForCatalogItem } from "../core/catalogCollections";
import type { RegistryCatalogCoverage } from "../core/registryDirectory";
import type { Registry } from "../core/registry.schema";
import { renderCatalogComponentCard } from "./catalogComponentsView";
import { escapeHtml, renderExternalLink, toSafeExternalUrl } from "./renderSafety";

export function renderRegistryCollection(
  headerRoot: HTMLElement,
  bodyRoot: HTMLElement,
  registry: Registry,
  result: CatalogQueryResult,
  options: {
    coverage?: RegistryCatalogCoverage;
    controls?: string;
  } = {},
): void {
  const count = result.total === 1 ? "1 item" : `${result.total.toLocaleString()} items`;
  const url = toSafeExternalUrl(registry.url);
  const homepage = url && !url.username && !url.password
    ? renderExternalLink(url.href, "Visit registry homepage", "secondary-link") : "";
  headerRoot.innerHTML = `
    <div class="registry-collection-heading">
      <button class="link-button" type="button" data-back-to-results>← Registries</button>
      <div class="catalog-eyebrow">Registry</div>
      <h1>${escapeHtml(registry.name)}</h1>
      <p>${escapeHtml(registry.description)}</p>
      <div class="registry-collection-meta">
        <strong>${escapeHtml(count)}</strong>
        ${options.coverage ? `<span class="catalog-coverage catalog-coverage-${escapeHtml(options.coverage)}">${escapeHtml(coverageLabel(options.coverage))}</span>` : ""}
        ${homepage}
      </div>
    </div>
    <button class="link-button" type="button" data-copy-current-url data-copy-label="Registry link copied">Copy link</button>
  `;

  bodyRoot.innerHTML = `
    <div class="registry-profile-layout">
      <section class="registry-profile-summary-rail" aria-label="Registry summary">
        <div class="catalog-eyebrow">Registry summary</div>
        <h2>${escapeHtml(registry.name)}</h2>
        <p>${escapeHtml(registry.description)}</p>
        <div class="registry-profile-summary-facts">
          <span><strong>${result.total.toLocaleString()}</strong> items</span>
          ${options.coverage ? `<span class="catalog-coverage catalog-coverage-${escapeHtml(options.coverage)}">${escapeHtml(coverageLabel(options.coverage))}</span>` : ""}
        </div>
      </section>
      <section class="registry-profile-inventory registry-collection-components">
        <div class="section-heading-row">
          <div>
            <h2>Items</h2>
            <p>Items published by this registry.</p>
          </div>
        </div>

        ${options.controls ?? ""}
        ${result.items.length
          ? `
            ${renderMeta(result)}
            <div class="catalog-component-grid">${result.items.map(item => renderCatalogComponentCard(item, assetKindForCatalogItem(item.item) === "theme" ? "theme" : assetKindForCatalogItem(item.item) === "template" ? "template" : "component")).join("")}</div>
            ${renderPagination(result)}
          `
          : renderEmptyRegistryInventory(options.coverage)}
      </section>
    </div>
  `;
}

function coverageLabel(coverage: RegistryCatalogCoverage): string {
  if (coverage === "current") return "Current";
  if (coverage === "stale") return "Stale";
  if (coverage === "empty") return "No items";
  return "Unavailable";
}

function renderEmptyRegistryInventory(coverage: RegistryCatalogCoverage | undefined): string {
  if (coverage === "failed") {
    return '<div class="empty-state"><h2>Catalog unavailable.</h2><p>This registry could not be loaded during the latest sync.</p></div>';
  }
  if (coverage === "empty") {
    return '<div class="empty-state"><h2>No components found.</h2><p>This registry catalog does not contain component items we can display.</p></div>';
  }
  if (coverage === "stale") {
    return '<div class="empty-state"><h2>No components found.</h2><p>The last successful catalog snapshot does not contain component items.</p></div>';
  }
  return '<div class="empty-state"><h2>No components are available for this registry.</h2></div>';
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

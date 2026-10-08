import type { CatalogCompareResult } from "../core/catalogCompare";
import { escapeHtml } from "./renderSafety";
import { sourcePageNavigation } from "./sourcePageLink";

const REGISTRY_PICKER_LIMIT = 10;

export function renderCatalogCompare(
  headerRoot: HTMLElement,
  bodyRoot: HTMLElement,
  result: CatalogCompareResult,
  availableRegistryNames: readonly string[],
  registrySearch = "",
): void {
  headerRoot.innerHTML = `
    <div class="catalog-page-heading">
      <div class="catalog-eyebrow">Registry Atlas</div>
      <h1>Compare</h1>
      <p>Compare component availability across registries.</p>
    </div>
    <button class="link-button" type="button" data-copy-current-url data-copy-label="Comparison link copied">Copy link</button>
  `;

  bodyRoot.innerHTML = `
    ${renderRegistryPicker(result.selectedRegistryNames, availableRegistryNames, registrySearch)}
    ${result.selectedRegistryNames.length >= 2
      ? `${renderSummary(result)}${renderTable(result)}${renderPagination(result)}`
      : renderEmpty(result.selectedRegistryNames.length)}
  `;
}

function renderRegistryPicker(
  selectedNames: readonly string[],
  availableRegistryNames: readonly string[],
  search: string,
): string {
  const selected = new Set(selectedNames);
  const query = search.trim().toLocaleLowerCase();
  const candidates = availableRegistryNames
    .filter(name => !selected.has(name) && (!query || name.toLocaleLowerCase().includes(query)))
    .slice(0, REGISTRY_PICKER_LIMIT);
  const full = selected.size >= 4;

  return `
    <section class="catalog-compare-picker" aria-label="Compare registries">
      <div class="section-heading-row">
        <div>
          <h2>Registries</h2>
          <p>${selected.size} of 4 selected. Choose at least 2.</p>
        </div>
      </div>
      ${selectedNames.length ? `
        <div class="compare-selected-list" aria-label="Selected registries">
          ${selectedNames.map(name => `
            <button class="compare-selected-chip" type="button" data-compare-registry="${escapeHtml(name)}" aria-pressed="true" aria-label="Remove ${escapeHtml(name)} from comparison">
              ${escapeHtml(name)} <span aria-hidden="true">×</span>
            </button>
          `).join("")}
        </div>
      ` : ""}
      <label class="compare-search-label">
        <span>Find a registry</span>
        <input type="search" data-compare-search="registry" value="${escapeHtml(search)}" placeholder="Search registry names">
      </label>
      <div class="compare-picker-results" aria-label="Registry search results">
        ${candidates.length
          ? candidates.map(name => `
              <button class="compare-picker-result" type="button" data-compare-registry="${escapeHtml(name)}" aria-pressed="false" ${full ? "disabled" : ""}>
                <span>${escapeHtml(name)}</span><span aria-hidden="true">+</span>
              </button>
            `).join("")
          : `<span class="muted">${full ? "Remove a registry to choose another." : "No registries match this search."}</span>`}
      </div>
    </section>
  `;
}

function renderSummary(result: CatalogCompareResult): string {
  const shared = result.intersectionCount === 1 ? "1 shared component" : `${result.intersectionCount.toLocaleString()} shared components`;
  return `
    <div class="catalog-compare-summary">
      <strong>${escapeHtml(shared)}</strong>
      <span>${result.unionCount.toLocaleString()} unique components</span>
      <span>${result.total.toLocaleString()} rows matching the current search</span>
    </div>
  `;
}

function renderTable(result: CatalogCompareResult): string {
  if (result.rows.length === 0) {
    return '<div class="empty-state"><h2>No components match this comparison search.</h2></div>';
  }

  const headers = result.selectedRegistryNames
    .map(name => `<th scope="col">${escapeHtml(name)}</th>`)
    .join("");
  const rows = result.rows.map(row => `
    <tr>
      <th scope="row"><code>${escapeHtml(row.slug)}</code></th>
      ${row.cells.map(cell => {
        if (!cell.present) return '<td><span class="muted">Not listed</span></td>';
        const original = sourcePageNavigation(cell.registryHomepage ?? '', {
          docsUrl: cell.docsUrl,
          sourcePage: cell.sourcePage,
        });
        return `<td><button class="compare-presence-link" type="button"
          data-view-item-registry="${escapeHtml(cell.namespace)}" data-view-item-slug="${escapeHtml(row.slug)}">Present</button>
          ${original ? `<a class="compare-source-link" href="${escapeHtml(original.url)}"
            target="_blank" rel="noreferrer noopener">${escapeHtml(original.label)} ↗</a>` : ''}
          </td>`;
      }).join("")}
    </tr>
  `).join("");

  return `
    <div class="compare-table-scroll" tabindex="0" role="region" aria-label="Component comparison">
      <table class="compare-table catalog-compare-table">
        <thead><tr><th scope="col">Component</th>${headers}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function renderPagination(result: CatalogCompareResult): string {
  if (result.pageCount <= 1) return "";
  return `
    <nav class="catalog-pagination" aria-label="Comparison pages">
      <button type="button" data-discovery-page="${result.page - 1}" ${result.page > 1 ? "" : "disabled"}>Previous</button>
      <span>Page ${result.page.toLocaleString()} of ${result.pageCount.toLocaleString()}</span>
      <button type="button" data-discovery-page="${result.page + 1}" ${result.page < result.pageCount ? "" : "disabled"}>Next</button>
    </nav>
  `;
}

function renderEmpty(selectedCount: number): string {
  return `
    <div class="compare-empty-state">
      <strong>Choose 2–4 registries to compare.</strong>
      <span>${selectedCount === 0 ? "Start by searching for a registry above." : "Choose one more registry to compare components."}</span>
    </div>
  `;
}

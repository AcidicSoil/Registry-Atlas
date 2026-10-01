import type {
  RegistryCatalogCoverage,
  RegistryDirectoryEntry,
  RegistryDirectoryResult,
  RegistryDirectorySort,
} from "../core/registryDirectory";
import { escapeHtml, renderExternalLink } from "./renderSafety";

const COVERAGE_LABELS: Record<RegistryCatalogCoverage, string> = {
  current: "Current",
  stale: "Stale",
  empty: "No items",
  failed: "Unavailable",
};

export interface RegistryDirectoryViewOptions {
  searchTerm?: string;
  sort?: RegistryDirectorySort;
}

export function renderRegistryDirectory(
  headerRoot: HTMLElement,
  bodyRoot: HTMLElement,
  result: RegistryDirectoryResult,
  options: RegistryDirectoryViewOptions = {},
): void {
  headerRoot.innerHTML = `
    <div class="catalog-page-heading">
      <div class="catalog-eyebrow">Registry directory</div>
      <h1>Registries</h1>
      <p>${result.total.toLocaleString()} registries.</p>
    </div>
    <button class="link-button" type="button" data-copy-current-url data-copy-label="Registry directory link copied">Copy link</button>
  `;

  const sort = options.sort ?? "name";
  bodyRoot.innerHTML = `
    <div class="registry-directory-controls" aria-label="Registry directory controls">
      <label>
        <span>Sort</span>
        <select data-registry-sort>
          ${sortOption("name", "Name A–Z", sort)}
          ${sortOption("name-desc", "Name Z–A", sort)}
          ${sortOption("item-count-desc", "Most items", sort)}
          ${sortOption("item-count-asc", "Fewest items", sort)}
        </select>
      </label>
    </div>
    ${result.entries.length
      ? `${renderMeta(result)}<div class="registry-directory-grid">${result.entries.map(renderEntry).join("")}</div>${renderPagination(result)}`
      : '<div class="empty-state"><h2>No registries match these controls.</h2><p>Try another search or asset type.</p></div>'}
  `;
}

function sortOption(value: RegistryDirectorySort, label: string, selected: string): string {
  return `<option value="${value}"${value === selected ? " selected" : ""}>${escapeHtml(label)}</option>`;
}

function renderEntry(entry: RegistryDirectoryEntry): string {
  const count = entry.itemCount === 1 ? "1 item" : `${entry.itemCount.toLocaleString()} items`;
  return `
    <article class="registry-directory-card">
      <div class="registry-directory-copy">
        <div class="registry-directory-heading">
          <h2>${escapeHtml(entry.registry.name)}</h2>
          <span class="catalog-coverage catalog-coverage-${escapeHtml(entry.coverage)}">${escapeHtml(COVERAGE_LABELS[entry.coverage])}</span>
        </div>
        <p>${escapeHtml(entry.registry.description)}</p>
        <div class="registry-directory-meta"><strong>${escapeHtml(count)}</strong></div>
      </div>
      <div class="registry-directory-actions">
        <button class="link-button" type="button" data-profile-registry="${escapeHtml(entry.registry.name)}">View registry</button>
        ${renderExternalLink(entry.registry.url, "Source", "secondary-link")}
      </div>
    </article>
  `;
}

function renderMeta(result: RegistryDirectoryResult): string {
  const start = (result.page - 1) * result.pageSize + 1;
  const end = Math.min(result.page * result.pageSize, result.total);
  return `<div class="catalog-result-meta">Showing ${start.toLocaleString()}–${end.toLocaleString()} of ${result.total.toLocaleString()} registries</div>`;
}

function renderPagination(result: RegistryDirectoryResult): string {
  if (result.pageCount <= 1) return "";
  return `
    <nav class="catalog-pagination" aria-label="Registry directory pages">
      <button type="button" data-discovery-page="${result.page - 1}" ${result.hasPreviousPage ? "" : "disabled"}>Previous</button>
      <span>Page ${result.page.toLocaleString()} of ${result.pageCount.toLocaleString()}</span>
      <button type="button" data-discovery-page="${result.page + 1}" ${result.hasNextPage ? "" : "disabled"}>Next</button>
    </nav>
  `;
}

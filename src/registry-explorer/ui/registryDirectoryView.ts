import type {
  RegistryCatalogCoverage,
  RegistryDirectoryEntry,
  RegistryDirectoryResult,
  RegistryDirectorySort,
} from "../core/registryDirectory";
import type { CatalogAssetKind } from "../core/catalogCollections";
import { escapeHtml, renderRegistryHomepageLink } from "./renderSafety";
import { catalogRoutePath } from "../core/catalogRoutes";
import { renderRegistryIcon } from "./registryIdentity";

const COVERAGE_LABELS: Record<RegistryCatalogCoverage, string> = {
  current: "Current",
  stale: "Stale",
  empty: "No items",
  failed: "Unavailable",
};

const ASSET_LABELS: Record<CatalogAssetKind, string> = {
  component: "Components",
  block: "Blocks",
  page: "Pages",
  template: "Templates",
  theme: "Themes",
  icon: "Icons",
  other: "Other",
};

export type RegistryDirectoryLayout = "grid" | "list";

export interface RegistryDirectoryViewOptions {
  layout?: RegistryDirectoryLayout;
  controls?: string;
}

export interface RegistryDirectorySidebarOptions {
  layout: RegistryDirectoryLayout;
  sort: RegistryDirectorySort;
  registryCount: number;
  assetCounts: Record<CatalogAssetKind, number>;
  selectedAssetKinds: readonly CatalogAssetKind[];
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

  const layout = options.layout ?? "grid";
  const controls = options.controls ?? "";
  bodyRoot.innerHTML = result.entries.length
    ? `${controls}${renderMeta(result)}
      <div class="registry-directory-grid registry-directory-grid-${layout}">
        ${result.entries.map(renderEntry).join("")}
      </div>
      ${renderPagination(result)}`
    : '<div class="empty-state"><h2>No registries match this view.</h2><p>Try another search or category.</p></div>';
}

export function renderRegistryDirectorySidebar(
  options: RegistryDirectorySidebarOptions,
): string {
  const assetKinds = (Object.keys(ASSET_LABELS) as CatalogAssetKind[])
    .filter(kind => options.assetCounts[kind] > 0);
  const selectedKind = options.selectedAssetKinds[0] ?? "";

  return `
    <nav class="registry-library-sidebar sidebar-browse-navigation" aria-label="Registry directory controls">
      <div class="sidebar-nav-row sidebar-nav-row-active sidebar-source-row" aria-current="page">
        <span class="sidebar-nav-row-icon sidebar-source-icon" aria-hidden="true"></span>
        <span class="sidebar-nav-row-label">shadcn directory</span>
        <span class="sidebar-nav-row-count">${options.registryCount.toLocaleString()}</span>
      </div>

      <section class="sidebar-nav-section" aria-labelledby="registry-sort-heading">
        <p class="sidebar-nav-section-label" id="registry-sort-heading">Sort</p>
        ${sortRow("item-count-desc", "Most items", options.sort)}
        ${sortRow("name", "Name", options.sort)}
      </section>

      <section class="sidebar-nav-section" aria-labelledby="registry-categories-heading">
        <p class="sidebar-nav-section-label" id="registry-categories-heading">Categories</p>
        ${assetKinds.map(kind => assetRow(
          kind,
          ASSET_LABELS[kind],
          options.assetCounts[kind],
          selectedKind === kind,
        )).join("")}
      </section>
    </nav>
  `;
}

function sortRow(
  value: RegistryDirectorySort,
  label: string,
  selected: RegistryDirectorySort,
): string {
  return `<button type="button" class="sidebar-nav-row${value === selected ? " sidebar-nav-row-active" : ""}"
    data-registry-sort-value="${value}" aria-pressed="${value === selected ? "true" : "false"}">
    <span class="sidebar-nav-row-label">${escapeHtml(label)}</span>
  </button>`;
}

function assetRow(
  value: CatalogAssetKind,
  label: string,
  count: number,
  selected: boolean,
): string {
  return `<button type="button" class="sidebar-nav-row${selected ? " sidebar-nav-row-active" : ""}"
    data-registry-asset-value="${value}" aria-pressed="${selected ? "true" : "false"}">
    <span class="sidebar-nav-row-icon" aria-hidden="true"></span>
    <span class="sidebar-nav-row-label">${escapeHtml(label)}</span>
    <span class="sidebar-nav-row-count">${count.toLocaleString()}</span>
  </button>`;
}

function renderEntry(entry: RegistryDirectoryEntry): string {
  const count = entry.itemCount === 1 ? "1 item" : `${entry.itemCount.toLocaleString()} items`;
  const homepage = renderRegistryHomepageLink(entry.registry.url, "registry-directory-homepage", "Homepage ↗");
  const route = catalogRoutePath({kind:"registry",namespace:entry.registry.name},
    "/Registry-Atlas/");
  return `
    <article class="registry-directory-card">
      <a class="registry-directory-copy registry-directory-open"
        href="${escapeHtml(route)}" data-profile-registry="${escapeHtml(entry.registry.name)}"
        aria-label="Open registry ${escapeHtml(entry.registry.name)}">
        <div class="registry-directory-heading">
          <div class="registry-directory-identity">
            ${renderRegistryIcon(entry.registry, 'registry-icon registry-icon-directory')}
            <div>
              <h2>${escapeHtml(entry.registry.name)}</h2>
              <span class="registry-directory-item-count">${escapeHtml(count)}</span>
            </div>
          </div>
        </div>
        <p>${escapeHtml(entry.registry.description)}</p>
      </a>
      <div class="registry-directory-meta">
        <span class="registry-directory-status registry-directory-status-${escapeHtml(entry.coverage)}">${escapeHtml(COVERAGE_LABELS[entry.coverage])}</span>
        ${homepage}
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

import { emptyStateClasses } from "./primitives/emptyStateClasses";
import { catalogPresentationClasses } from "./primitives/catalogPresentationClasses";
import { cn } from "./primitives/cn";
import { sidebarNavigationStyles } from "./sidebarNavigation.classes";
import { directoryStyles } from "./registryDirectory.classes";
import { renderBrowseFacetPopover } from "./browseFacetPopover";
import { renderInfiniteScrollControl } from "./infiniteScrollControl";
import type {
  RegistryCatalogCoverage,
  RegistryDirectoryEntry,
  RegistryDirectoryResult,
  RegistryDirectorySort,
} from "../core/registryDirectory";
import type { CatalogAssetKind } from "../core/catalogCollections";
import { escapeHtml, renderRegistryHomepageLink, renderClassAttribute } from "./renderSafety";
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
    <div class="catalog-page-heading ${catalogPresentationClasses.pageHeading}">
      <div class="catalog-eyebrow ${catalogPresentationClasses.eyebrow}">Registry directory</div>
      <h1>Registries</h1>
      <p>${result.total.toLocaleString()} registries.</p>
    </div>
  `;

  const layout = options.layout ?? "grid";
  const controls = options.controls ?? "";
  bodyRoot.innerHTML = result.entries.length
    ? `${controls}${renderMeta(result)}
      <div${renderClassAttribute(
        cn(
          directoryStyles.grid,
          layout === "list" ? directoryStyles.gridList : directoryStyles.gridColumns,
        ),
      )} data-directory-grid data-directory-layout="${layout}">
        ${result.entries.map((entry) => renderEntry(entry, layout)).join("")}
      </div>
      ${renderInfiniteScrollControl(result.page, result.pageCount)}`
    : `<div class="empty-state ${emptyStateClasses}"><h2>No registries match this view.</h2><p>Try another search or category.</p></div>`;
}

export function renderRegistryDirectoryControls(options: RegistryDirectorySidebarOptions): string {
  // SAFETY: The keys come directly from the typed asset label table, which lists only supported asset kinds.
  const assetKinds = (Object.keys(ASSET_LABELS) as CatalogAssetKind[]).filter(
    (kind) => options.assetCounts[kind] > 0,
  );

  const selectedKind = options.selectedAssetKinds[0] ?? "";

  return (
    renderBrowseFacetPopover(
      "Asset types",
      assetKinds
        .map((kind) =>
          assetRow(kind, ASSET_LABELS[kind], options.assetCounts[kind], selectedKind === kind),
        )
        .join(""),
      selectedKind ? ASSET_LABELS[selectedKind] : undefined,
    ) +
    renderBrowseFacetPopover(
      "Sort",
      sortRow("item-count-desc", "Most items", options.sort) +
        sortRow("name", "Name", options.sort),
      options.sort === "name" ? "Name" : "Most items",
    )
  );
}

function sortRow(
  value: RegistryDirectorySort,
  label: string,
  selected: RegistryDirectorySort,
): string {
  return `<button type="button" class="${cn("sidebar-nav-row", sidebarNavigationStyles.row, sidebarNavigationStyles.rowWithoutIcon, value === selected && "sidebar-nav-row-active", value === selected && sidebarNavigationStyles.rowActive)}"
    data-registry-sort-value="${value}" aria-pressed="${value === selected ? "true" : "false"}">
    <span class="sidebar-nav-row-label ${cn(sidebarNavigationStyles.label, value === selected && "font-semibold")}">${escapeHtml(label)}</span>
  </button>`;
}

function assetRow(
  value: CatalogAssetKind,
  label: string,
  count: number,
  selected: boolean,
): string {
  return `<button type="button" class="${cn("sidebar-nav-row", sidebarNavigationStyles.row, sidebarNavigationStyles.rowWithIcon, selected && "sidebar-nav-row-active", selected && sidebarNavigationStyles.rowActive)}"
    data-registry-asset-value="${value}" aria-pressed="${selected ? "true" : "false"}">
    <span class="sidebar-nav-row-icon ${sidebarNavigationStyles.icon}" aria-hidden="true"></span>
    <span class="sidebar-nav-row-label ${cn(sidebarNavigationStyles.label, selected && "font-semibold")}">${escapeHtml(label)}</span>
    <span class="sidebar-nav-row-count ${sidebarNavigationStyles.count}">${count.toLocaleString()}</span>
  </button>`;
}

function renderEntry(entry: RegistryDirectoryEntry, layout: RegistryDirectoryLayout): string {
  const count = entry.itemCount === 1 ? "1 item" : `${entry.itemCount.toLocaleString()} items`;

  const homepage = renderRegistryHomepageLink(
    entry.registry.url,
    directoryStyles.homepage,
    "Homepage",
  );

  const route = catalogRoutePath(
    { kind: "registry", namespace: entry.registry.name },
    "/Registry-Atlas/",
  );

  const openAttributes = cn(directoryStyles.open, layout === "list" && directoryStyles.openList);

  return `
    <article${renderClassAttribute(
      cn(directoryStyles.card, layout === "list" && directoryStyles.cardList),
    )} data-directory-card>
      <a${renderClassAttribute(openAttributes)} data-directory-open data-directory-copy
        href="${escapeHtml(route)}" data-profile-registry="${escapeHtml(entry.registry.name)}"
        aria-label="Open registry ${escapeHtml(entry.registry.name)}">
        <div${renderClassAttribute(cn(directoryStyles.heading))}>
          <div${renderClassAttribute(cn(directoryStyles.identity))}>
            ${renderRegistryIcon(entry.registry, "directory")}
            <div${renderClassAttribute(cn(directoryStyles.identityCopy))}>
              <h2${renderClassAttribute(cn(directoryStyles.headingTitle))}>${escapeHtml(entry.registry.name)}</h2>
              <span${renderClassAttribute(cn(directoryStyles.itemCount))}>${escapeHtml(count)}</span>
            </div>
          </div>
        </div>
        <p${renderClassAttribute(cn(directoryStyles.description))}>${escapeHtml(entry.registry.description)}</p>
      </a>
      <div${renderClassAttribute(
        cn(directoryStyles.meta, layout === "list" && directoryStyles.metaList),
      )}>
        <span${renderClassAttribute(cn(directoryStyles.status))} data-directory-coverage="${escapeHtml(entry.coverage)}">${escapeHtml(COVERAGE_LABELS[entry.coverage])}</span>
        ${homepage}
      </div>
    </article>
  `;
}

function renderMeta(result: RegistryDirectoryResult): string {
  const start = (result.page - 1) * result.pageSize + 1;
  const end = Math.min(result.page * result.pageSize, result.total);

  return `<div class="catalog-result-meta ${catalogPresentationClasses.resultMeta}">Showing ${start.toLocaleString()}–${end.toLocaleString()} of ${result.total.toLocaleString()} registries</div>`;
}

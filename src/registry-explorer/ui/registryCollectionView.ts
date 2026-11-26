import { controlIcon } from "./primitives/controlIcon";
import { emptyStateClasses } from "./primitives/emptyStateClasses";
import { actionClasses } from "./primitives/actionClasses";
import { catalogPresentationClasses } from "./primitives/catalogPresentationClasses";
import { renderCatalogGridAttributes } from "./catalogGrid";
import { renderInfiniteScrollControl } from "./infiniteScrollControl";
import type { CatalogQueryResult } from "../core/catalogQuery";
import { assetKindForCatalogItem, type CatalogAssetKind } from "../core/catalogCollections";
import type { CatalogPolicy } from "../core/catalogPolicy";
import { catalogRoutePath } from "../core/catalogRoutes";
import type { RegistryCatalogCoverage } from "../core/registryDirectory";
import type { Registry } from "../core/registry.schema";
import { renderCatalogComponentCard } from "./catalogComponentsView";
import { escapeHtml } from "./renderSafety";

export function renderRegistryCollection(
  headerRoot: HTMLElement,
  bodyRoot: HTMLElement,
  registry: Registry,
  result: CatalogQueryResult,
  options: {
    policy: CatalogPolicy;
    coverage?: RegistryCatalogCoverage;
    controls?: string;
    layout?: "grid" | "list";
    assetCounts?: Partial<Record<CatalogAssetKind, number>>;
    selectedKind?: CatalogAssetKind;
    basePath?: string;
  },
): void {
  const count = result.total === 1 ? "1 item" : `${result.total.toLocaleString()} items`;
  const basePath = options.basePath ?? "/Registry-Atlas/";
  const rootRoute = catalogRoutePath({ kind: "registry", namespace: registry.name }, basePath);

  const assetLabels: Array<[CatalogAssetKind, string]> = [
    ["component", "Components"],
    ["block", "Blocks"],
    ["page", "Pages"],
    ["template", "Templates"],
    ["theme", "Themes"],
    ["icon", "Icons"],
    ["other", "Other"],
  ];

  headerRoot.innerHTML = `
    <div class="registry-collection-heading grid min-w-0 gap-2 [&>p]:m-0 [&>p]:max-w-[68ch] [&>p]:text-sm [&>p]:text-atlas-muted-foreground [&_.link-button]:mb-2">
      <button class="link-button ${actionClasses.link}" type="button" data-back-to-results>${controlIcon("arrow-left")} Registries</button>
      <div class="catalog-eyebrow ${catalogPresentationClasses.eyebrow}">Registry</div>
      <h1>${escapeHtml(registry.name)}</h1>
      <p>${escapeHtml(registry.description)}</p>
      <div class="registry-collection-meta flex min-w-0 flex-wrap items-center justify-start gap-3 text-xs text-atlas-muted-foreground">
        <strong>${escapeHtml(count)}</strong>
        ${renderRegistryCoverageBadge(options.coverage)}
      </div>
    </div>
  `;

  bodyRoot.innerHTML = `
    <div class="registry-profile-layout grid grid-cols-1 items-start gap-8 min-[861px]:grid-cols-[var(--registry-summary-width,280px)_14px_minmax(0,1fr)] min-[861px]:gap-0 min-[861px]:group-data-[profile-summary-collapsed=true]/shell:grid-cols-[0_14px_minmax(0,1fr)]">
      <section id="registryProfileSummary" class="registry-profile-summary-rail static grid gap-3 rounded-[var(--atlas-radius-card)] border border-atlas-input bg-atlas-card p-4 min-[861px]:sticky min-[861px]:top-5 [&>p]:m-0 [&>p]:text-sm [&>p]:text-atlas-muted-foreground min-[861px]:min-w-0 min-[861px]:max-h-[calc(100dvh-155px)] min-[861px]:overflow-y-auto min-[861px]:group-data-[profile-summary-collapsed=true]/shell:invisible min-[861px]:group-data-[profile-summary-collapsed=true]/shell:pointer-events-none min-[861px]:group-data-[profile-summary-collapsed=true]/shell:overflow-hidden min-[861px]:group-data-[profile-summary-collapsed=true]/shell:p-0 min-[861px]:group-data-[profile-summary-collapsed=true]/shell:border-0" aria-label="Registry summary">
        <div class="catalog-eyebrow ${catalogPresentationClasses.eyebrow}">Registry summary</div>
        <h2>${escapeHtml(registry.name)}</h2>
        <p>${escapeHtml(registry.description)}</p>
        <div class="registry-profile-summary-facts grid gap-2 text-xs text-atlas-muted-foreground [&_strong]:text-atlas-foreground">
          <span><strong>${result.total.toLocaleString()}</strong> items</span>
          ${renderRegistryCoverageBadge(options.coverage)}
        </div>
      </section>
      <div class="registry-profile-divider flex min-w-0 flex-col items-center max-[860px]:hidden" aria-label="Registry summary panel controls">
        <button type="button" class="registry-profile-toggle grid place-items-center min-h-[26px] w-3.5 cursor-pointer border-0 bg-transparent p-0 text-atlas-muted-foreground hover:bg-atlas-secondary hover:text-atlas-foreground focus-visible:bg-atlas-secondary focus-visible:text-atlas-foreground" data-profile-rail-toggle aria-label="Collapse registry summary" aria-controls="registryProfileSummary" aria-expanded="true">${controlIcon("chevron-left", "[[aria-expanded=false]_&]:[transform:rotate(180deg)]")}</button>
        <div class="grid min-h-[35px] w-full flex-1 cursor-col-resize touch-none place-items-center before:h-7 before:w-0.5 before:rounded before:bg-atlas-muted-foreground before:opacity-50 before:content-['']" role="separator" tabindex="0" data-profile-rail-resize
          aria-label="Resize registry summary and inventory" aria-controls="registryProfileSummary"
          aria-orientation="vertical" aria-valuemin="200" aria-valuemax="400" aria-valuenow="280"></div>
      </div>
      <section class="registry-profile-inventory registry-collection-components min-w-0 grid gap-3 min-[861px]:pl-5">
        <div class="section-heading-row ${catalogPresentationClasses.sectionHeading}">
          <div>
            <h2>Items</h2>
            <p>Browse all items in this library or filter by type.</p>
          </div>
        </div>
        <nav class="registry-asset-navigation flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-1.5 pb-3 max-[640px]:gap-y-1" aria-label="Browse library by type">
          <a class="registry-asset-link inline-flex items-center gap-1.5 border-b-2 border-transparent px-0.5 py-[7px] text-xs text-atlas-muted-foreground no-underline hover:text-atlas-foreground focus-visible:text-atlas-foreground aria-[current=page]:border-current aria-[current=page]:font-semibold aria-[current=page]:text-atlas-foreground [&>span]:text-xs [&>span]:tabular-nums${!options.selectedKind ? " is-active" : ""}"
            href="${escapeHtml(rootRoute)}" data-catalog-route="${escapeHtml(rootRoute)}"
            ${!options.selectedKind ? 'aria-current="page"' : ""}>All items</a>
          ${assetLabels
            .flatMap(([kind, label]) => {
              if ((options.assetCounts?.[kind] ?? 0) <= 0) return [];

              const path = catalogRoutePath(
                { kind: "registry-assets", namespace: registry.name, assetKind: kind },
                basePath,
              );

              return [
                `<a class="registry-asset-link inline-flex items-center gap-1.5 border-b-2 border-transparent px-0.5 py-[7px] text-xs text-atlas-muted-foreground no-underline hover:text-atlas-foreground focus-visible:text-atlas-foreground aria-[current=page]:border-current aria-[current=page]:font-semibold aria-[current=page]:text-atlas-foreground [&>span]:text-xs [&>span]:tabular-nums${options.selectedKind === kind ? " is-active" : ""}"
              href="${escapeHtml(path)}" data-catalog-route="${escapeHtml(path)}"
              ${options.selectedKind === kind ? 'aria-current="page"' : ""}>${label} <span>${options.assetCounts?.[kind]?.toLocaleString()}</span></a>`,
              ];
            })
            .join("")}
        </nav>

        ${options.controls ?? ""}
        ${
          result.items.length
            ? `
            ${renderMeta(result)}
            <div${renderCatalogGridAttributes({ layout: options.layout })}>${result.items.map((item) => renderCatalogComponentCard(item, legacyCardRouteKind(item, options.policy), { layout: options.layout })).join("")}</div>
            ${renderInfiniteScrollControl(result.page, result.pageCount)}
          `
            : renderEmptyRegistryInventory(options.coverage)
        }
      </section>
    </div>
  `;
}

function renderRegistryCoverageBadge(coverage: RegistryCatalogCoverage | undefined): string {
  if (!coverage) return "";

  return `<span class="catalog-coverage catalog-coverage-${escapeHtml(coverage)} flex-none rounded-[var(--atlas-radius-badge)] border border-atlas-border px-2 py-1 text-xs text-atlas-muted-foreground ${coverage === "current" ? "border-atlas-primary/45 text-atlas-foreground" : coverage === "stale" || coverage === "empty" || coverage === "failed" ? "border-dashed" : ""}">${escapeHtml(coverageLabel(coverage))}</span>`;
}

function coverageLabel(coverage: RegistryCatalogCoverage): string {
  if (coverage === "current") return "Current";

  if (coverage === "stale") return "Stale";

  if (coverage === "empty") return "No items";

  return "Unavailable";
}

function renderEmptyRegistryInventory(coverage: RegistryCatalogCoverage | undefined): string {
  if (coverage === "failed") {
    return `<div class="empty-state ${emptyStateClasses}"><h2>Catalog unavailable.</h2><p>This registry could not be loaded during the latest sync.</p></div>`;
  }

  if (coverage === "empty") {
    return `<div class="empty-state ${emptyStateClasses}"><h2>No components found.</h2><p>This registry catalog does not contain component items we can display.</p></div>`;
  }

  if (coverage === "stale") {
    return `<div class="empty-state ${emptyStateClasses}"><h2>No components found.</h2><p>The last successful catalog snapshot does not contain component items.</p></div>`;
  }

  return `<div class="empty-state ${emptyStateClasses}"><h2>No components are available for this registry.</h2></div>`;
}

function renderMeta(result: CatalogQueryResult): string {
  if (result.total === 0) return "";
  const start = (result.page - 1) * result.pageSize + 1;
  const end = Math.min(result.page * result.pageSize, result.total);

  return `<div class="catalog-result-meta ${catalogPresentationClasses.resultMeta}">Showing ${start.toLocaleString()}–${end.toLocaleString()} of ${result.total.toLocaleString()}</div>`;
}

function legacyCardRouteKind(
  item: CatalogQueryResult["items"][number],
  policy: CatalogPolicy,
): "component" | "block" | "page" | "template" | "theme" | "icon" {
  const kind = assetKindForCatalogItem(item.item, policy, item.namespace);

  if (kind === "block") return "block";

  if (kind === "page") return "page";

  if (kind === "theme") return "theme";

  if (kind === "template") return "template";

  if (kind === "icon") return "icon";

  return "component";
}

import { renderInfiniteScrollControl } from './infiniteScrollControl';
import type { CatalogQueryResult } from "../core/catalogQuery";
import { assetKindForCatalogItem, type CatalogAssetKind } from "../core/catalogCollections";
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
    coverage?: RegistryCatalogCoverage;
    controls?: string;
    layout?: 'grid' | 'list';
    assetCounts?: Partial<Record<CatalogAssetKind, number>>;
    selectedKind?: CatalogAssetKind;
    basePath?: string;
  } = {},
): void {
  const count = result.total === 1 ? "1 item" : `${result.total.toLocaleString()} items`;
  const basePath = options.basePath ?? '/Registry-Atlas/';
  const rootRoute = catalogRoutePath({ kind: 'registry', namespace: registry.name }, basePath);

  const assetLabels: Array<[CatalogAssetKind, string]> = [['component', 'Components'], ['block','Blocks'],
    ['page','Pages'], ['template','Templates'], ['theme','Themes'], ['icon','Icons'], ['other','Other']];

  headerRoot.innerHTML = `
    <div class="registry-collection-heading">
      <button class="link-button" type="button" data-back-to-results>← Registries</button>
      <div class="catalog-eyebrow">Registry</div>
      <h1>${escapeHtml(registry.name)}</h1>
      <p>${escapeHtml(registry.description)}</p>
      <div class="registry-collection-meta">
        <strong>${escapeHtml(count)}</strong>
        ${options.coverage ? `<span class="catalog-coverage catalog-coverage-${escapeHtml(options.coverage)}">${escapeHtml(coverageLabel(options.coverage))}</span>` : ""}
      </div>
    </div>
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
            <p>Browse all items in this library or filter by type.</p>
          </div>
        </div>
        <nav class="registry-asset-navigation" aria-label="Browse library by type">
          <a class="registry-asset-link${!options.selectedKind ? ' is-active' : ''}"
            href="${escapeHtml(rootRoute)}" data-catalog-route="${escapeHtml(rootRoute)}"
            ${!options.selectedKind ? 'aria-current="page"' : ''}>All items</a>
          ${assetLabels.flatMap(([kind, label]) => {
            if ((options.assetCounts?.[kind] ?? 0) <= 0) return [];
            const path = catalogRoutePath({ kind: 'registry-assets', namespace: registry.name, assetKind: kind }, basePath);

            return [`<a class="registry-asset-link${options.selectedKind === kind ? ' is-active' : ''}"
              href="${escapeHtml(path)}" data-catalog-route="${escapeHtml(path)}"
              ${options.selectedKind === kind ? 'aria-current="page"' : ''}>${label} <span>${options.assetCounts?.[kind]?.toLocaleString()}</span></a>`];
          }).join('')}
        </nav>

        ${options.controls ?? ""}
        ${result.items.length
          ? `
            ${renderMeta(result)}
            <div class="catalog-component-grid catalog-component-grid-${options.layout ?? "grid"}">${result.items.map(item => renderCatalogComponentCard(item, legacyCardRouteKind(item))).join("")}</div>
            ${renderInfiniteScrollControl(result.page, result.pageCount)}
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

function legacyCardRouteKind(
  item: CatalogQueryResult['items'][number],
): 'component' | 'block' | 'page' | 'template' | 'theme' | 'icon' {
  const kind = assetKindForCatalogItem(item.item, item.namespace);

  if (kind === 'block') return 'block';

  if (kind === 'page') return 'page';

  if (kind === 'theme') return 'theme';

  if (kind === 'template') return 'template';

  if (kind === 'icon') return 'icon';

  return 'component';
}

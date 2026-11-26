import { emptyStateClasses } from "./primitives/emptyStateClasses";
import { catalogPresentationClasses } from "./primitives/catalogPresentationClasses";
import { renderCatalogGridAttributes } from "./catalogGrid";
import { renderInfiniteScrollControl } from "./infiniteScrollControl";
import type { CatalogQueryResult } from "../core/catalogQuery";
import { renderCatalogComponentCard } from "./catalogComponentsView";
import { escapeHtml } from "./renderSafety";

export interface CatalogCollectionViewOptions {
  eyebrow: string;
  title: string;
  description: string;
  routeKind?: "component" | "block" | "page" | "template" | "theme" | "icon";
  controls?: string;
  layout?: "grid" | "list";
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
    <div class="catalog-page-heading ${catalogPresentationClasses.pageHeading}">
      <div class="catalog-eyebrow ${catalogPresentationClasses.eyebrow}">${escapeHtml(options.eyebrow)}</div>
      <h1>${escapeHtml(options.title)}</h1>
      <p>${escapeHtml(options.description)}</p>
    </div>
  `;

  if (!result.items.length) {
    bodyRoot.innerHTML = `
      ${options.controls ?? ""}
      <div class="empty-state collection-empty ${emptyStateClasses}">
        <h2>${escapeHtml(options.emptyTitle ?? "No matching items.")}</h2>
        <p>${escapeHtml(options.emptyBody ?? "Try a different search or filter.")}</p>
      </div>
    `;

    return;
  }

  const start = (result.page - 1) * result.pageSize + 1;
  const end = Math.min(result.page * result.pageSize, result.total);
  bodyRoot.innerHTML = `
    ${options.controls ?? ""}
    <div class="catalog-result-meta ${catalogPresentationClasses.resultMeta}">Showing ${start.toLocaleString()}–${end.toLocaleString()} of ${result.total.toLocaleString()}</div>
    <div${renderCatalogGridAttributes({ layout: options.layout, kind: options.routeKind ?? "component" })}>
      ${result.items.map((item) => renderCatalogComponentCard(item, options.routeKind ?? "component", { layout: options.layout, context: (options.routeKind ?? "component") === "component" ? "collection" : undefined })).join("")}
    </div>
    ${renderInfiniteScrollControl(result.page, result.pageCount)}
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
    <div class="catalog-page-heading ${catalogPresentationClasses.pageHeading}">
      <div class="catalog-eyebrow ${catalogPresentationClasses.eyebrow}">Registry Atlas</div>
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(description)}</p>
    </div>
  `;
  bodyRoot.innerHTML = `
    <div class="evidence-unavailable max-w-[720px] rounded-[var(--atlas-radius-card)] border border-dashed border-atlas-input bg-white/[0.018] p-6 [&>p]:m-0 [&>p]:max-w-[62ch] [&>p]:text-atlas-muted-foreground">
      <div class="catalog-eyebrow ${catalogPresentationClasses.eyebrow}">Not available</div>
      <h2>This view is not available yet.</h2>
      <p>${escapeHtml(detail)}</p>
    </div>
  `;
}

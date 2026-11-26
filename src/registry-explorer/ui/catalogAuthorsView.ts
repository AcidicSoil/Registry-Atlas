import { emptyStateClasses } from "./primitives/emptyStateClasses";
import { catalogPresentationClasses } from "./primitives/catalogPresentationClasses";
import { cn } from "./primitives/cn";
import { renderCatalogGridAttributes } from "./catalogGrid";
import { cardStyles } from "./catalogCard.classes";
import { renderInfiniteScrollControl } from "./infiniteScrollControl";
import type { CatalogAuthor } from "../core/catalogAuthors";
import { escapeHtml, renderClassAttribute, toSafeExternalUrl } from "./renderSafety";

export function renderCatalogAuthors(
  headerRoot: HTMLElement,
  bodyRoot: HTMLElement,
  authors: readonly CatalogAuthor[],
  { search = "", page = 1 }: { search?: string; page?: number } = {},
): void {
  const found = authors.filter((row) =>
    row.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()),
  );

  const pageCount = Math.max(1, Math.ceil(found.length / 24));
  const currentPage = Math.max(1, Math.min(page, pageCount));
  const visible = found.slice((currentPage - 1) * 24, currentPage * 24);
  headerRoot.innerHTML = `
    <div class="catalog-page-heading ${catalogPresentationClasses.pageHeading}">
      <div class="catalog-eyebrow ${catalogPresentationClasses.eyebrow}">Registry Atlas · Catalog attribution</div>
      <h1>Authors</h1>
      <p>${authors.length.toLocaleString()} distinct names attributed by registry item metadata.
        Not 21st.dev account profiles or popularity rankings.</p>
    </div>
  `;
  bodyRoot.innerHTML = visible.length
    ? `
    <div class="catalog-result-meta ${catalogPresentationClasses.resultMeta}">Showing ${(currentPage - 1) * 24 + 1}–${Math.min(currentPage * 24, found.length)} of ${found.length} attributed names</div>
    <div${renderCatalogGridAttributes()}>
      ${visible.map(renderAuthorCard).join("")}
    </div>
    ${renderInfiniteScrollControl(currentPage, pageCount)}
  `
    : `<div class="empty-state ${emptyStateClasses}"><h2>No attributed components</h2><p>
    ${search ? "No named contributors match this search." : "This registry catalog provides no named component authors."}
    </p></div>`;
}

/** Display-only interpretation; the source attribution remains the selection identity. */
export function authorAttributionLabel(attribution: string) {
  const match = /^(.+?)\s+<([^<>\s]+)>$/.exec(attribution);

  if (!match) return { name: attribution, source: null };
  const source = toSafeExternalUrl(match[2]);

  if (!source || source.username || source.password) return { name: attribution, source: null };

  return { name: match[1], source: source.href };
}

function renderAuthorCard(author: CatalogAuthor): string {
  const label = authorAttributionLabel(author.name);

  return `<article${renderClassAttribute(cn(cardStyles.card))} data-catalog-card>
    <button${renderClassAttribute(cn(cardStyles.open))} type="button" data-catalog-open
    data-author-select="${escapeHtml(author.name)}"
    aria-label="View catalog items attributed to ${escapeHtml(label.name)}">
      <div${renderClassAttribute(cn(cardStyles.copy))} data-catalog-copy>
        <strong${renderClassAttribute(cn(cardStyles.name))}>${escapeHtml(label.name)}</strong>
        ${label.source ? `<span class="truncate text-xs text-atlas-muted-foreground" title="${escapeHtml(label.source)}">${escapeHtml(label.source)}</span>` : ""}
        <span${renderClassAttribute(cn(cardStyles.registry))} data-catalog-registry>${author.componentCount.toLocaleString()} attributed component items</span>
      </div>
    </button></article>`;
}

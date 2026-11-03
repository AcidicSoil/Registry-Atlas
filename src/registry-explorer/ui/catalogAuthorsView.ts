import { renderCatalogGridAttributes } from "./catalogGrid";
import * as stylex from "@stylexjs/stylex";
import { cardMarker, cardStyles } from "./catalogCard.stylex";
import { renderInfiniteScrollControl } from "./infiniteScrollControl";
import type { CatalogAuthor } from "../core/catalogAuthors";
import { escapeHtml, renderStyleXAttributes } from "./renderSafety";

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
    <div class="catalog-page-heading">
      <div class="catalog-eyebrow">Registry Atlas · Catalog attribution</div>
      <h1>Authors</h1>
      <p>${authors.length.toLocaleString()} distinct names attributed by registry item metadata.
        Not 21st.dev account profiles or popularity rankings.</p>
    </div>
  `;
  bodyRoot.innerHTML = visible.length
    ? `
    <div class="catalog-result-meta">Showing ${(currentPage - 1) * 24 + 1}–${Math.min(currentPage * 24, found.length)} of ${found.length} attributed names</div>
    <div${renderCatalogGridAttributes()}>
      ${visible
        .map(
          (
            author,
          ) => `<article${renderStyleXAttributes(stylex.attrs(cardStyles.card, cardMarker))} data-catalog-card>
        <button${renderStyleXAttributes(stylex.attrs(cardStyles.open))} type="button" data-catalog-open
        data-author-select="${escapeHtml(author.name)}"
        aria-label="View catalog items attributed to ${escapeHtml(author.name)}">
        <div${renderStyleXAttributes(stylex.attrs(cardStyles.copy))} data-catalog-copy>
          <strong${renderStyleXAttributes(stylex.attrs(cardStyles.name))}>${escapeHtml(author.name)}</strong>
          <span${renderStyleXAttributes(stylex.attrs(cardStyles.registry))} data-catalog-registry>${author.componentCount.toLocaleString()} attributed component items</span>
        </div>
      </button></article>`,
        )
        .join("")}
    </div>
    ${renderInfiniteScrollControl(currentPage, pageCount)}
  `
    : `<div class="empty-state"><h2>No attributed components</h2><p>
    ${search ? "No named contributors match this search." : "This registry catalog provides no named component authors."}
    </p></div>`;
}

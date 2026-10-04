import type { CatalogAuthor } from '../core/catalogAuthors';
import { escapeHtml } from './renderSafety';

export function renderCatalogAuthors(
  headerRoot: HTMLElement, bodyRoot: HTMLElement, authors: readonly CatalogAuthor[],
  {search = '', page = 1}: {search?: string; page?: number} = {},
): void {
  const found = authors.filter(row => row.name.toLocaleLowerCase()
    .includes(search.trim().toLocaleLowerCase()));
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
    <button class="link-button" type="button" data-copy-current-url>Copy link</button>
  `;
  bodyRoot.innerHTML = visible.length ? `
    <div class="catalog-result-meta">Showing ${(currentPage - 1) * 24 + 1}–${Math.min(currentPage * 24,found.length)} of ${found.length} attributed names</div>
    <div class="catalog-component-grid catalog-author-grid">
      ${visible.map(author=>`<article class="catalog-component-card"><button type="button" class="catalog-component-open"
        data-author-select="${escapeHtml(author.name)}"
        aria-label="View catalog items attributed to ${escapeHtml(author.name)}">
        <div class="catalog-component-card-copy">
          <strong>${escapeHtml(author.name)}</strong>
          <span class="catalog-component-registry">${author.componentCount.toLocaleString()} attributed component items</span>
        </div>
      </button></article>`).join('')}
    </div>
    ${pageCount > 1 ? `<nav class="catalog-pagination" aria-label="Authors pages">
      <button type="button" data-discovery-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''}>Previous</button>
      <span>Page ${currentPage} of ${pageCount}</span>
      <button type="button" data-discovery-page="${currentPage + 1}" ${currentPage === pageCount ? 'disabled' : ''}>Next</button>
    </nav>` : ''}
  ` : `<div class="empty-state"><h2>No attributed components</h2><p>
    ${search ? 'No named contributors match this search.' : 'This registry catalog provides no named component authors.'}
    </p></div>`;
}

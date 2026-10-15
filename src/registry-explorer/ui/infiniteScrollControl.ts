/** A visible fallback remains usable when IntersectionObserver is unavailable. */
export function renderInfiniteScrollControl(page: number, pageCount: number): string {
  if (page >= pageCount) return '';

  return `
    <div class="catalog-scroll-loader">
      <button type="button" class="catalog-load-more" data-scroll-load-more>Load more items</button>
      <div data-scroll-sentinel aria-hidden="true"></div>
    </div>
  `;
}

/** Keep screen-reader item positions accurate after incremental DOM insertion. */
export function markAccessibleFeed(list: Element | null, resultLabel: string): void {
  if (!list || list.tagName === 'TBODY') return;

  const number = / of ([0-9,]+)/.exec(resultLabel)?.[1];
  const total = number ? Number(number.replaceAll(',', '')) : -1;

  list.setAttribute('role', 'feed');
  list.setAttribute('aria-label', 'Catalog results');
  list.setAttribute('aria-busy', 'false');

  for (const [index, item] of Array.from(list.children).entries()) {
    item.setAttribute('aria-posinset', String(index + 1));
    item.setAttribute('aria-setsize', String(total));
  }
}

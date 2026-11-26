/** A visible fallback remains usable when IntersectionObserver is unavailable. */
export function renderInfiniteScrollControl(page: number, pageCount: number): string {
  if (page >= pageCount) return "";

  return `
    <div class="grid min-h-[72px] place-items-center gap-1.5 pt-4 pb-7" data-scroll-loader>
      <button type="button" class="cursor-pointer rounded-[var(--atlas-radius-button)] border border-atlas-border bg-atlas-card px-[18px] py-2.5 text-atlas-foreground hover:border-atlas-input focus-visible:outline-2 focus-visible:outline-atlas-focus focus-visible:outline-offset-[3px]" data-scroll-load-more>Load more items</button>
      <div class="h-px w-full" data-scroll-sentinel aria-hidden="true"></div>
    </div>
  `;
}

/** The minimal DOM contract needed to mark a progressive result feed. */
export interface FeedElement {
  tagName: string;
  children: ArrayLike<{ setAttribute(name: string, value: string): void }>;
  setAttribute(name: string, value: string): void;
}

/** Keep screen-reader item positions accurate after incremental DOM insertion. */
export function markAccessibleFeed(list: FeedElement | null, resultLabel: string): void {
  if (!list || list.tagName === "TBODY") return;

  const number = / of ([0-9,]+)/.exec(resultLabel)?.[1];
  const total = number ? Number(number.replaceAll(",", "")) : -1;

  list.setAttribute("role", "feed");
  list.setAttribute("aria-label", "Catalog results");
  list.setAttribute("aria-busy", "false");

  for (const [index, item] of Array.from(list.children).entries()) {
    item.setAttribute("aria-posinset", String(index + 1));
    item.setAttribute("aria-setsize", String(total));
    item.setAttribute("tabindex", "0");
  }
}

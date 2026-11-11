import { markAccessibleFeed } from "./infiniteScrollControl";
import { readBrowseSnapshot, saveBrowseSnapshot, type BrowseSnapshot } from "./browseHistory";

interface BrowseFeedDependencies {
  body: HTMLElement;
  getPage: () => number;
  setPage: (page: number) => void;
  render: () => void;
}

/** Owns progressive feed composition and session browse-position restoration. */
export function createBrowseFeedController({
  body,
  getPage,
  setPage,
  render,
}: BrowseFeedDependencies) {
  const browsedHistory = new Map<string, BrowseSnapshot>();
  const currentHistoryKey = () => window.location.pathname + window.location.search;

  function rememberBrowseRoute(): void {
    const route = currentHistoryKey();

    const snapshot = {
      pages: getPage(),
      scrollY: body.parentElement?.scrollTop ?? window.scrollY ?? 0,
    };

    browsedHistory.set(route, snapshot);

    saveBrowseSnapshot(route, snapshot, () => window.sessionStorage);
  }

  let scrollObserver: IntersectionObserver | null = null;
  let expandingResults = false;

  function activeResultList(): Element | null {
    return (
      body.querySelector?.(
        "[data-catalog-grid], [data-directory-grid], .catalog-compare-table tbody",
      ) ?? null
    );
  }

  function loadNextPage(): void {
    if (expandingResults || !body.querySelector?.("[data-scroll-load-more]")) return;

    const previousList = activeResultList();

    if (!previousList) return;

    const earlier = Array.from(previousList.children);
    const page = getPage();

    expandingResults = true;
    previousList.setAttribute("aria-busy", "true");
    scrollObserver?.disconnect();
    setPage(page + 1);
    render();

    const nextList = activeResultList();

    if (!nextList) {
      setPage(page);
      render();
      expandingResults = false;

      return;
    }

    nextList.prepend(...earlier);

    announceVisibleResults(nextList);
    updateFeedSemantics();

    expandingResults = false;
  }

  function announceVisibleResults(list: Element): void {
    const totalShown = list.children.length;
    const meta = body.querySelector?.(".catalog-result-meta");

    if (meta?.textContent) {
      meta.textContent = meta.textContent.replace(
        /^Showing [^]*? of /,
        `Showing 1–${totalShown.toLocaleString()} of `,
      );
    }

    const status = document.getElementById?.("catalogScrollStatus");

    if (status) status.textContent = `Showing ${totalShown.toLocaleString()} items`;
  }

  function updateFeedSemantics(): void {
    const list = activeResultList();
    const label = body.querySelector?.(".catalog-result-meta")?.textContent ?? "";

    markAccessibleFeed(list, label);
  }

  function observeNextPage(): void {
    scrollObserver?.disconnect();

    const sentinel = body.querySelector?.("[data-scroll-sentinel]");

    if (!sentinel || !("IntersectionObserver" in window)) return;

    scrollObserver = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) loadNextPage();
      },
      { rootMargin: "250px 0px" },
    );
    scrollObserver.observe(sentinel);
  }

  function restoreBrowseState(): void {
    const snapshot =
      browsedHistory.get(currentHistoryKey()) ??
      readBrowseSnapshot(currentHistoryKey(), () => window.sessionStorage);

    if (!snapshot || getPage() !== 1) return;

    for (let page = 1; page < snapshot.pages; page += 1) {
      if (!body.querySelector?.("[data-scroll-load-more]")) break;

      loadNextPage();
    }

    window.requestAnimationFrame?.(() => {
      const scrollContainer = body.parentElement;

      if (scrollContainer) scrollContainer.scrollTop = snapshot.scrollY;
      else window.scrollTo?.({ top: snapshot.scrollY, behavior: "instant" });
    });
  }

  return {
    rememberBrowseRoute,
    loadNextPage,
    updateFeedSemantics,
    observeNextPage,
    restoreBrowseState,
  };
}

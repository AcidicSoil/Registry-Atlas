/** Browser-only snapshot of a hydrated, visible catalog route. */
export function captureRefactorBaseline() {
  const selectors = {
    document: "html",
    application: "#app-main",
    sidebar: "#appSidebar",
    header: "#contentHeader",
    content: "#contentBody",
    catalogGrid: "[data-catalog-grid]",
    catalogCard: "[data-catalog-card]",
    cardLink: "[data-catalog-open]",
    layoutToggle: '[data-browse-layout="list"]',
  };

  const geometry = Object.fromEntries(
    Object.entries(selectors).map(([name, selector]) => {
      const element = document.querySelector(selector);

      if (!(element instanceof HTMLElement)) return [name, null];

      const box = element.getBoundingClientRect();
      const css = getComputedStyle(element);
      const round = (value: number) => Math.round(value * 100) / 100;

      return [
        name,
        {
          rect: {
            x: round(box.x),
            y: round(box.y),
            width: round(box.width),
            height: round(box.height),
          },
          display: css.display,
          gridTemplateColumns: css.gridTemplateColumns,
          gap: css.gap,
          overflowX: css.overflowX,
          overflowY: css.overflowY,
          backgroundColor: css.backgroundColor,
          color: css.color,
          fontSize: css.fontSize,
          borderRadius: css.borderRadius,
          outlineStyle: css.outlineStyle,
          outlineColor: css.outlineColor,
        },
      ];
    }),
  );

  // SAFETY: Navigation entries originate from the browser Navigation Timing API.
  const navigation = performance.getEntriesByType("navigation")[0] as
    | PerformanceNavigationTiming
    | undefined;

  const resources = performance
    .getEntriesByType("resource")
    .filter((resource) => resource.name.includes("/data/registry-"))
    .map((resource) => {
      // SAFETY: These entries were returned by the browser resource-timing API.
      const entry = resource as PerformanceResourceTiming;

      return {
        path: new URL(entry.name).pathname,
        durationMs: Math.round(entry.duration * 100) / 100,
        responseEndMs: Math.round(entry.responseEnd * 100) / 100,
        transferSizeBytes: entry.transferSize,
        encodedBodySizeBytes: entry.encodedBodySize,
        decodedBodySizeBytes: entry.decodedBodySize,
      };
    });

  const paints = performance
    .getEntriesByType("paint")
    .map((entry) => ({ name: entry.name, startTimeMs: Math.round(entry.startTime) }));

  // SAFETY: Chromium may expose optional heap counters on the native Performance object.
  const runtime = performance as Performance & {
    memory?: { usedJSHeapSize?: number; totalJSHeapSize?: number };
  };

  return {
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio,
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    },
    pathname: window.location.pathname,
    query: window.location.search,
    catalogCardCount: document.querySelectorAll("[data-catalog-card]").length,
    catalogGridColumns: getComputedStyle(
      document.querySelector("[data-catalog-grid]")!,
    ).gridTemplateColumns.split(" ").length,
    captureAfterNavigationMs: Math.round(performance.now()),
    domContentLoadedEndMs: navigation ? Math.round(navigation.domContentLoadedEventEnd) : null,
    loadEventEndMs: navigation ? Math.round(navigation.loadEventEnd) : null,
    paints,
    resources,
    usedJSHeapSizeBytes: runtime.memory?.usedJSHeapSize ?? null,
    totalJSHeapSizeBytes: runtime.memory?.totalJSHeapSize ?? null,
    geometry,
  };
}

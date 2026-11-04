# Phase 4 behavioral baseline

**Status:** Recorded 2026-11-03 against clean implementation revision `aa7893e`. Documentation, test, and evidence additions are the only changes. Implementation refactoring has **not started**.

**Runtime:** Ubuntu under WSL2, Node v24.22.2, pnpm 12.16.1, Chromium 153.0.8010.12, Vite 7.3.7, `e2e@0.20.0`. Browser runner uses the freshly built `vite preview` application. The selected viewport configurations are in `e2e.config.ts` and `e2e.mobile.config.ts`.

## Baseline behavior to preserve

1. **Catalog correctness.** The runtime files contain 91,716 catalog items and an equal number of detail records. Names, namespaces, source-page identities, classifications, coverage status, and exact route paths remain grounded in the local source snapshot.
2. **Routes and history.** A catalog card opens its canonical item path. Directory and catalog list/grid selection affect visible layout and the route query. Back navigation restores the prior route and paged catalog state.
3. **Paging.** Initial components and directory records render 32 items and append more on demand or intersection; existing items are retained. Accessible feed semantics are maintained.
4. **Setup and mobile navigation.** Setup draft state is bounded and parsed; the native mobile dialog dismisses on backdrop/Escape and restores focus, with grouped filters remaining navigable.
5. **Styling.** Document-level CSS and compiled StyleX coexist. The catalog uses three desktop columns and one mobile column, without document horizontal overflow. Preserve card geometry, contrast, focus, hover and state behavior before deleting any legacy selectors.
6. **Input failures.** A fetch failure and an incomplete snapshot both reject rather than rendering a catalog from fabricated fallback data. The latter is pinned by a new characterization test in `tests/registry-explorer/registryLoader.test.ts`. Phase 5B may improve the diagnostic, but must retain rejection.

## Tests and outcomes

| Check                                             | Baseline result                                        | Reproduction                                                                                                                                                                                           |
| ------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Focused Vitest regression suite                   | **146 passed across 20 files** (145 before added case) | `.design/evidence/refactor-phase4/focused-vitest.log`                                                                                                                                                  |
| New incomplete-envelope regression                | 1 pass; loader suite 6/6                               | `pnpm exec vitest run tests/registry-explorer/registryLoader.test.ts --testTimeout 30000`                                                                                                              |
| StyleX and CSS lint                               | Both pass                                              | `pnpm lint:stylex`; `pnpm lint:styles`                                                                                                                                                                 |
| Source/test TypeScript                            | Both pass                                              | `pnpm typecheck`; `pnpm typecheck:test`                                                                                                                                                                |
| Production build                                  | Pass; 171 modules; JS 274.78 KB, CSS 52.02 KB          | `pnpm build`                                                                                                                                                                                           |
| Desktop combined route/navigation/layout tests    | **5 passed, 2 failed** among 7 browser tests           | `pnpm exec e2e run tests/refactor-baseline.e2e.ts tests/stylex-catalog-grid.e2e.ts tests/stylex-directory-layout.e2e.ts tests/infinite-scroll.e2e.ts tests/catalog-navigation.e2e.ts`                  |
| Registry-directory infinite-scroll isolated rerun | Pass, 1/1                                              | `pnpm exec e2e run tests/infinite-scroll.e2e.ts --grep 'scrolling the registry directory automatically loads additional records'`                                                                      |
| Browse history/infinite-scroll isolated rerun     | Pass, 1/1                                              | `pnpm exec e2e run tests/infinite-scroll.e2e.ts --grep 'back navigation restores previously appended catalog results'`                                                                                 |
| Mobile navigation, grouping, layout and capture   | Pass, 6/6 tests in 4 files                             | `pnpm exec e2e run --config e2e.mobile.config.ts tests-mobile/refactor-baseline.e2e.ts tests-mobile/stylex-catalog-grid.e2e.ts tests-mobile/native-sidebar.e2e.ts tests-mobile/grouped-sidebar.e2e.ts` |
| Standalone desktop capture rerun                  | Pass, 1/1                                              | `pnpm exec e2e run tests/refactor-baseline.e2e.ts`                                                                                                                                                     |

**Unresolved existing browser test failures:** In the combined desktop run, `tests/infinite-scroll.e2e.ts:55` and `:77` timed out after 20 seconds while polling the initial element counts; both last observed zero. The other catalog paging test passed and the dedicated StyleX directory test passed in that combined run. Each failed case passed when run alone. This establishes inconsistent behavior under different test-order/load conditions, **not** its cause. Do not loosen the assertions or claim that production paging is fixed. The browser driver's trace additionally records late `browser.evaluate` operations under `STEP_NOT_AWAITED` after the assertion timeout. Repeat with controlled catalog load, screenshots and network/CPU traces before modifying lifecycle code.

The original combined-run output and isolated rerun results are retained at:

- `.design/evidence/refactor-phase4/desktop-combined-e2e.log`
- `.design/evidence/refactor-phase4/directory-isolated-e2e.log`
- `.design/evidence/refactor-phase4/back-isolated-e2e.log`
- `.design/evidence/refactor-phase4/mobile-e2e.log`
- `.design/evidence/refactor-phase4/desktop-capture-e2e.log`

## Browser measurements

The capture tests always assert catalog geometry, but only rewrite evidence when explicitly requested:

```bash
ATLAS_CAPTURE_REFACTOR_BASELINE=1 pnpm exec e2e run tests/refactor-baseline.e2e.ts
ATLAS_CAPTURE_REFACTOR_BASELINE=1 pnpm exec e2e run --config e2e.mobile.config.ts tests-mobile/refactor-baseline.e2e.ts
```

After capture, copy the corresponding redacted screenshots from `.e2e/results/<test>/attempt-1/screenshots/` into the durable `.design/evidence/refactor-phase4/` directory. Ordinary E2E runs do not overwrite tracked measurements or screenshots.

**Source:** `tests/support/browserRefactorBaseline.ts`, run through `tests/refactor-baseline.e2e.ts` and `tests-mobile/refactor-baseline.e2e.ts`. Full selector rectangles, computed styles, resource entries, and navigation metrics are in `.design/evidence/refactor-phase4/desktop.json` and `mobile.json`. Reproducible redacted browser screenshots are saved as `desktop.png` and `mobile.png` in that directory.

| Measurement                          | Desktop 1440 × 900 | Mobile 390 × 844 |
| ------------------------------------ | -----------------: | ---------------: |
| Measured after-navigation snapshot   |           5,715 ms |         6,947 ms |
| First contentful paint               |           2,924 ms |         2,804 ms |
| Main catalog resource responseEnd    |         3,005.4 ms |       2,945.7 ms |
| Main catalog compressed transfer     |    4,095,927 bytes |  4,095,927 bytes |
| Main catalog decoded bytes           |   39,864,438 bytes | 39,864,438 bytes |
| Approximate browser-reported JS heap |             109 MB |           103 MB |
| Initial cards rendered               |                 32 |               32 |
| Computed grid columns                |                  3 |                1 |
| Catalog grid width                   |           1,148 px |           360 px |
| First card width                     |          382.33 px |           359 px |
| Document horizontal overflow         | None, 1440/1440 px | None, 390/390 px |

**Observed variability:** The later, read-only desktop baseline test took 28.06 seconds in the E2E runner versus 6.04 seconds in the prior captured desktop run; the read-only mobile test took 9.11 seconds versus 5.25 seconds during capture. Both still rendered correctly and left evidence checksums unchanged. This reinforces the need for controlled repeated measurements rather than treating one number as an SLA.

**Measurement limitations:** These are one-off local browser samples, not budgets or statistically significant benchmarks. `captureAfterNavigationMs` is the time when the poll observed a hydrated catalog, an **upper bound** on catalog readiness, not an instrumented exact mutation timestamp. First contentful paint may be the loading indicator, **not** first usable catalog content. `performance.memory` is a Chromium-only approximate heap counter, not precise process memory. Cache, CPU load, browser process scheduling, and E2E fixture startup can change results. Re-measure the same routes and environment after each migration; report several samples before claiming an improvement.

The browser rendered the desktop shell as a 240 px sidebar, 16 px separator, and 1166 px remaining content track. On mobile the sidebar is initially outside the viewport; both modes retain the same 150 px first-card height. The entire computed geometry and style map is in the JSON artifacts, rather than hard-coding each pixel as a fragile acceptance threshold.

## Baseline caveats and implementation gate

- No production `src/`, `scripts/`, `public/`, database tables, dependencies, tooling configuration or build logic changed in phase 4.
- No full unit suite, production-database write, migration, upstream sync or deployment ran.
- The PPM prework check remains **blocked** on changed-stack feature-map evidence and stale `policy:design-document` review. Neither is an automated test failure; approval must come from real independent review evidence.
- Phase 5 should address the high-impact architecture findings in `docs/refactor/plan.md`, but should treat the two combined-run infinite-scroll timeouts as a test-order/performance investigation, not a silently solved issue. UI-changing work remains subject to project standards.

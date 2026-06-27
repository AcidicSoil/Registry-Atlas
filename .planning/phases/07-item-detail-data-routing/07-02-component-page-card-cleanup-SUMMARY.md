---
phase: 07-item-detail-data-routing
plan: 07-02-component-page-card-cleanup
subsystem: ui-routing
tags: [typescript, ui, item-detail-page, card-cleanup, render-safety]
requires:
  - phase: 07-item-detail-data-routing
    provides: route detail loader and item URL state from 07-01
provides:
  - component-first item detail page
  - compact discovery/profile card summaries
  - item detail renderer tests
  - item route shell integration
affects: [phase-08-peek-ui, phase-08-alternatives]
tech-stack:
  added: []
  patterns: [component-first-renderer, compact-card-summary, safe-fallback-ui]
key-files:
  created:
    - src/registry-explorer/ui/itemDetailView.ts
    - tests/registry-explorer/itemDetailView.test.ts
  modified:
    - src/registry-explorer/ui/shell.ts
    - src/registry-explorer/ui/discoveryView.ts
    - src/registry-explorer/ui/registryProfileView.ts
    - public/styles/registry-explorer.css
    - tests/registry-explorer/registryItemDetail.test.ts
key-decisions:
  - "Discovery/profile cards are summary entry points, not detail pages."
  - "Normal user UI uses component language and removes `Open raw item route` from card actions."
  - "The item page leads with component identity, visual placeholder, component page link, and copy-only actions."
patterns-established:
  - "Item detail UI receives a typed detail result and renders loaded/summary/error states safely."
  - "Cards route users to `View component` instead of exposing raw item routes."
requirements-completed: [ITEM-03, ITEM-04, ITEM-05, ITEM-06]
duration: 22 min
completed: 2026-06-27
---

# Phase 07 Plan 02: Component Page and Card Cleanup Summary

**Component-first item detail route with compact discovery/profile cards and no raw JSON user UI**

## Performance

- **Duration:** 22 min
- **Started:** 2026-06-27T13:18:00Z
- **Completed:** 2026-06-27T13:40:00Z
- **Tasks:** 6
- **Files modified:** 7

## Accomplishments

- Added `renderItemDetailView` for component-first item route rendering.
- Wired `currentView: 'item'` through the app shell so item routes render inside the existing Atlas frame.
- Changed discovery/profile item cards from crowded raw-route/detail clusters into compact summaries with `View component` actions.
- Added CSS for item detail hero, preview placeholder, action row, and detail cards using existing Atlas variables.
- Added item detail view tests covering component-first copy, escaping, fallback states, and no raw JSON/raw route labels.

## Task Commits

1. **Tasks 1-6: Item page, shell route, card cleanup, CSS, and tests** - `67b48f6` (feat)
2. **Verification repair: test fixture typecheck compatibility** - `abbdf9b` (test)

**Plan metadata:** this SUMMARY commit.

## Files Created/Modified

- `src/registry-explorer/ui/itemDetailView.ts` - Component-first item detail renderer with visual placeholder, copy-only actions, technical detail cards, and safe fallbacks.
- `tests/registry-explorer/itemDetailView.test.ts` - Tests for item detail rendering, escaping, fallback copy, and no raw JSON labels.
- `src/registry-explorer/ui/shell.ts` - Item route rendering and `data-view-item-*` click handling.
- `src/registry-explorer/ui/discoveryView.ts` - Compact card summaries with `View component` instead of raw item route links.
- `src/registry-explorer/ui/registryProfileView.ts` - Compact profile item rows with `View component` and reduced secondary link clutter.
- `public/styles/registry-explorer.css` - Item detail hero, preview placeholder, action row, cards, and responsive layout styles.
- `tests/registry-explorer/registryItemDetail.test.ts` - Test fixture type fixes for test typecheck compatibility.

## Decisions Made

- Kept runtime item page rendering summary-backed for now while the typed loader and result states are available for future detail hydration.
- Prioritized the user’s screenshot feedback by removing visible `Open raw item route` labels from normal cards.
- Kept source/docs/evidence links lower priority and limited card link clusters to avoid repeating the overcrowded-card problem.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Test-only fixture types failed `tsconfig.test.json`**
- **Found during:** Full `pnpm verify`.
- **Issue:** Two tests used `code-and-markdown` as a `primary_focus` fixture value, which is a component category concept rather than a valid `PrimaryFocus`; one mocked `Response` needed an `unknown` cast for strict test typecheck.
- **Fix:** Replaced fixture focus with `support` and adjusted the mock `Response` cast.
- **Files modified:** `tests/registry-explorer/itemDetailView.test.ts`, `tests/registry-explorer/registryItemDetail.test.ts`
- **Verification:** `pnpm verify` passed.
- **Committed in:** `abbdf9b`

---

**Total deviations:** 1 auto-fixed (1 blocking).
**Impact on plan:** Test-only type compatibility repair. No production scope change.

## Issues Encountered

- None beyond the test fixture typecheck repair documented above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Phase 8 can build peeks/alternatives on a stable component-first item route and compact card entry points.

---
*Phase: 07-item-detail-data-routing*
*Completed: 2026-06-27*

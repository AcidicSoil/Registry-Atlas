---
phase: 02-official-mirror-data-pipeline
plan: 03
subsystem: runtime-data
tags: [runtime-loader, shadcn-directory, mirror-status, ui]

requires:
  - phase: 02-official-mirror-data-pipeline
    provides: Validated official shadcn registry mirror artifacts
provides:
  - Runtime mirror JSON loader
  - Async app bootstrap
  - Visible mirror freshness/count/status UI
affects: [official-mirror, component-discovery, install-actions]

tech-stack:
  added: []
  patterns:
    - Static JSON fetched from Vite base path
    - Runtime conversion boundary from mirror records to display registries

key-files:
  created:
    - src/registry-explorer/data/loadRegistries.ts
    - tests/registry-explorer/registryLoader.test.ts
  modified:
    - src/registry-explorer/core/registry.schema.ts
    - src/registry-explorer/entry.ts
    - src/registry-explorer/ui/shell.ts
    - src/registry-explorer/ui/focusView.ts
    - src/registry-explorer/ui/componentView.ts
    - src/registry-explorer/ui/renderSafety.ts
    - public/styles/registry-explorer.css
  deleted: []

key-decisions:
  - "The browser app fetches `${import.meta.env.BASE_URL}data/registries.json` instead of importing the legacy TypeScript dataset."
  - "Display registry names keep canonical `@` namespaces to match the official shadcn directory."
  - "Official `http:` links are rendered as valid external links; warning context is shown separately."

patterns-established:
  - "`loadRegistries` returns `{ registries, meta, warnings }` so UI code does not parse mirror JSON directly."
  - "Mirror metadata is appended to existing content headers rather than redesigning the app shell."

requirements-completed: [MIRR-02, MIRR-05]
requirements-progress: [MIRR-06, HARD-01]

duration: 20min
completed: 2026-05-25
---

# Phase 2 Plan 03 Summary

**Runtime official mirror loading with visible source, freshness, counts, and neutral warning status**

## Performance

- **Started:** 2026-05-25T18:00:00Z
- **Completed:** 2026-05-25T18:20:10Z
- **Tasks:** 3
- **Files modified:** 9

## Accomplishments

- Added `loadRegistries` to fetch `data/registries.json` from the Vite base path.
- Converted normalized mirror records into the existing `Registry` shape while preserving mirror metadata and per-registry warnings.
- Changed `entry.ts` to async bootstrap with loading and data-unavailable states.
- Added a compact UI status area showing `Official shadcn directory`, source link, synced timestamp, upstream count, local count, mirror count match, and warning count.
- Added warning chips to focus and component registry rows without hiding valid records.
- Updated external link rendering to allow official `http:` links while still rejecting non-HTTP protocols and malformed/protocol-relative URLs.

## Task Commits

1. **Tasks 1-3: Runtime loader, async bootstrap, and mirror status UI** - `39e3973` (feat)

## Files Created/Modified

- `src/registry-explorer/data/loadRegistries.ts` - Runtime mirror fetch and conversion boundary.
- `tests/registry-explorer/registryLoader.test.ts` - Mock-fetch loader tests.
- `src/registry-explorer/core/registry.schema.ts` - Optional mirror metadata on display registries.
- `src/registry-explorer/entry.ts` - Async runtime data loading and unavailable state.
- `src/registry-explorer/ui/shell.ts` - Mirror metadata/status rendering.
- `src/registry-explorer/ui/focusView.ts` - Warning chips in registry cards.
- `src/registry-explorer/ui/componentView.ts` - Warning chips in component rows.
- `src/registry-explorer/ui/renderSafety.ts` - Allows `http:` and `https:` external links.
- `public/styles/registry-explorer.css` - Mirror status and warning chip styles.

## Decisions Made

- Kept the canonical official namespace as the displayed registry name because the product goal is to mirror the shadcn directory and install commands use `@registry` namespaces.
- Kept loader validation at runtime for malformed generated artifacts, but only warning-level HTTP facts are shown as review items.
- Appended mirror status into the existing dense explorer header rather than creating a new top-level page or card layout.

## Deviations from Plan

### Auto-fixed Issues

**1. Link safety aligned with official HTTP policy**
- **Found during:** Task 3 (Show mirror warnings)
- **Issue:** Existing external-link rendering allowed only HTTPS, which conflicted with the Phase 2 policy that official HTTP fields are valid but warning-level.
- **Fix:** Updated `toSafeExternalUrl` to allow `http:` and `https:` while continuing to reject scriptable, malformed, and protocol-relative URLs.
- **Files modified:** `src/registry-explorer/ui/renderSafety.ts`
- **Verification:** `pnpm typecheck`, `pnpm typecheck:test`, and `pnpm build` passed.
- **Committed in:** `39e3973`

---

**Total deviations:** 1 auto-fixed.
**Impact on plan:** Required to honor the approved Phase 2 security wording; no additional feature scope.

## Issues Encountered

None.

## Verification

Passed:

```bash
PATH=/tmp/registry-atlas-bin:$PATH pnpm test -- --run tests/registry-explorer/registryLoader.test.ts
PATH=/tmp/registry-atlas-bin:$PATH pnpm typecheck
PATH=/tmp/registry-atlas-bin:$PATH pnpm typecheck:test
PATH=/tmp/registry-atlas-bin:$PATH pnpm build
```

## User Setup Required

None.

## Next Phase Readiness

Plan 02-04 can wire validation and sync into maintainer verification so generated mirror artifacts, runtime loading, and status display are checked together.

## Self-Check: PASSED

All plan acceptance criteria were checked and passed.

---

*Phase: 02-official-mirror-data-pipeline*
*Completed: 2026-05-25*

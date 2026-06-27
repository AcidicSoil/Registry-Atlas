---
phase: 06-component-search-and-taxonomy
plan: 06-01-taxonomy-vocabulary-data
subsystem: taxonomy
tags: [taxonomy, generated-data, validation, labels]
requires:
  - phase: 05-expanded-component-catalog
    provides: imported catalog data with proposed item tags
provides:
  - researched component taxonomy metadata
  - expanded controlled component tag vocabulary
  - explicit taxonomy labels and category labels
  - registry-level component tag derivation from imported item summaries
  - validation for item-level component tag arrays
affects: [phase-06, discovery, registry-profile, generated-data]
tech-stack:
  added: []
  patterns: [controlled-taxonomy, generated-data-normalization, core-label-helpers]
key-files:
  created:
    - src/registry-explorer/core/componentTaxonomy.ts
    - tests/registry-explorer/componentTaxonomy.test.ts
  modified:
    - src/registry-explorer/core/registry.schema.ts
    - src/registry-explorer/core/labels.ts
    - scripts/sync-shadcn-registries.mjs
    - src/registry-explorer/core/registryMirror.ts
    - data/shadcn/registry-items.json
    - data/shadcn/registries.raw.json
    - data/shadcn/sync-report.json
    - public/data/registries.json
    - tests/registry-explorer/registryData.test.ts
key-decisions:
  - "Accepted all researched proposed tags backed by imported item examples."
  - "Kept taxonomy metadata in a pure core module instead of renderer logic."
  - "Derived registry-level component tags from item-level existing/proposed tags during sync."
patterns-established:
  - "componentTaxonomy.ts owns tag labels, category labels, reasons, and example item references."
  - "sync-shadcn-registries merges item summary tags into atlas.component_tags for imported registries."
requirements-completed: [DISC-01, DISC-02, DISC-03, DISC-05]
duration: 8 min
completed: 2026-06-27
---

# Phase 06 Plan 01: Taxonomy Vocabulary Data Summary

**Researched taxonomy tags are now first-class, labeled, categorized, validated, and surfaced in generated registry data**

## Performance

- **Duration:** 8 min
- **Started:** 2026-06-27T11:27:00Z
- **Completed:** 2026-06-27T11:35:00Z
- **Tasks:** 3
- **Files modified:** 11

## Accomplishments

- Added `src/registry-explorer/core/componentTaxonomy.ts` with 23 researched taxonomy entries, category labels, reasons, and imported example references.
- Expanded `COMPONENT_TAG_VALUES` with researched tags such as `theme`, `status-pill`, `decision-pill`, `otp-input`, `code-block`, `ai-chat`, `map-pointer`, `angle-slider`, `color-swatch`, `compare-slider`, and `cropper`.
- Updated `componentLabel()` to use explicit taxonomy labels before falling back to hyphen replacement.
- Updated sync generation so registry-level `atlas.component_tags` includes accepted item-level existing/proposed tags from imported item summaries.
- Updated mirror validation so item-level `component_tags_existing` and `component_tags_proposed` must be accepted component tags.
- Added taxonomy and generated-data tests proving labels, categories, vocabulary alignment, and imported registry tags.

## Task Commits

1. **Tasks 1-3: Taxonomy metadata, vocabulary, generated-data normalization, and tests** - `e2b1318` (feat)

## Files Created/Modified

- `src/registry-explorer/core/componentTaxonomy.ts` - First-class taxonomy metadata and helper functions.
- `tests/registry-explorer/componentTaxonomy.test.ts` - Vocabulary, label, category, and fallback tests.
- `src/registry-explorer/core/registry.schema.ts` - Expanded controlled component tag vocabulary.
- `src/registry-explorer/core/labels.ts` - Uses taxonomy labels for component tags.
- `scripts/sync-shadcn-registries.mjs` - Derives registry-level tags from imported item summaries.
- `src/registry-explorer/core/registryMirror.ts` - Validates item-level component tag arrays against the controlled vocabulary.
- `public/data/registries.json` - Regenerated runtime data with imported taxonomy tags surfaced at registry level.
- `tests/registry-explorer/registryData.test.ts` - Asserts imported registry-level researched tags.

## Decisions Made

- Treated the imported proposed taxonomy as the source for Phase 6 vocabulary instead of inventing a new taxonomy.
- Added all researched tags with imported examples rather than a tiny subset.
- Kept the layout unchanged in this plan; only data and label foundations changed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added `ai-chat` to component tags despite existing as a primary focus**
- **Found during:** Task 3 (`pnpm validate:data`)
- **Issue:** The script that expanded `COMPONENT_TAG_VALUES` initially skipped `ai-chat` because it already appeared in `PRIMARY_FOCUS_VALUES`. Runtime data then failed validation for `@delta` item/tag metadata.
- **Fix:** Added `ai-chat` explicitly to `COMPONENT_TAG_VALUES` while preserving its existing primary-focus role.
- **Files modified:** `src/registry-explorer/core/registry.schema.ts`
- **Verification:** `pnpm validate:data` passed with 0 errors.
- **Committed in:** `e2b1318`

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** No scope change; it corrected the focus-vs-component-tag distinction required by the researched taxonomy.

## Issues Encountered

- `pnpm validate:data` initially failed on `@delta` because `ai-chat` was not accepted as a component tag. Fixed and re-ran verification.
- `pnpm import:catalog` updated only the generated import-report timestamp; that timestamp-only change was reverted after the implementation commit to avoid unrelated churn.

## Verification

- `pnpm import:catalog` — passed.
- `pnpm sync:registries` — passed.
- `pnpm validate:data` — passed with 0 errors and 4 existing HTTP warnings.
- `pnpm typecheck` — passed.
- `pnpm typecheck:test` — passed.
- `pnpm test -- tests/registry-explorer/componentTaxonomy.test.ts tests/registry-explorer/registryData.test.ts tests/registry-explorer/matrixColumns.test.ts` — passed.
- `git diff --check` — passed before implementation commit.

## User Setup Required

None.

## Next Phase Readiness

Ready for `06-02-search-alias-category-matching`. The taxonomy metadata and generated tags are now available for search/ranking/category helpers.

---
*Phase: 06-component-search-and-taxonomy*
*Completed: 2026-06-27*

---
phase: 05-expanded-component-catalog
plan: 05-02-rich-item-schema-validation
subsystem: data
tags: [schema, validation, registry-items, routes]
requires:
  - phase: 05-expanded-component-catalog
    provides: normalized imported catalog data and generated item summaries
provides:
  - rich RegistryItemSummary model
  - loader mapping for imported item metadata
  - validation for rich item fields and unsafe commands/URLs
  - unresolved-template route guard with raw item URL fallback
affects: [phase-05, phase-06, component-discovery, registry-profile]
tech-stack:
  added: []
  patterns: [optional-rich-schema, backward-compatible-validation, route-template-safety]
key-files:
  created: []
  modified:
    - src/registry-explorer/core/registry.schema.ts
    - src/registry-explorer/core/registryMirror.ts
    - src/registry-explorer/core/itemRoutes.ts
    - src/registry-explorer/core/installActions.ts
    - src/registry-explorer/data/loadRegistries.ts
    - tests/registry-explorer/registryMirror.test.ts
    - tests/registry-explorer/registryLoader.test.ts
    - tests/registry-explorer/itemRoutes.test.ts
key-decisions:
  - "Rich item metadata is optional so v1.0 item summaries remain valid."
  - "Unresolved URL template placeholders are rejected unless a validated raw item URL is provided."
  - "Imported command strings are validated as copy-only shadcn add/view commands with @registry/item tokens."
patterns-established:
  - "Snake_case generated JSON maps to camelCase runtime models at loadRegistries()."
  - "Rich item field validation lives in registryMirror.ts and reuses existing validation issue reporting."
requirements-completed: [CAT-03, CAT-04, CAT-05, CAT-06]
duration: 8 min
completed: 2026-06-27
---

# Phase 05 Plan 02: Rich Item Schema Validation Summary

**Rich imported registry item metadata now survives loading and is guarded by URL, token, command, array, file, and route-template validation**

## Performance

- **Duration:** 8 min
- **Started:** 2026-06-27T10:00:30Z
- **Completed:** 2026-06-27T10:08:30Z
- **Tasks:** 4
- **Files modified:** 8

## Accomplishments

- Extended `RegistryItemSummary` with optional rich fields for title, description, confidence, evidence/source URLs, raw item URL, install/view/add command metadata, dependencies, registry dependencies, files, proposed/existing tags, and warnings.
- Added `RegistryItemSummaryFile` for file path/type/target metadata.
- Updated `loadRegistries()` so generated snake_case item fields map into camelCase runtime models.
- Hardened mirror validation for rich item fields, including optional URLs, confidence, install tokens, command strings, dependency arrays, proposed/existing tags, warnings, and file records.
- Updated route resolution to reject unresolved templates such as `/r/{style}/{name}.json` unless a valid raw item URL is provided.
- Added tests for rich item validation, loader mapping, and unresolved-template route safety.

## Task Commits

1. **Tasks 1-4: Schema, loader, validation, route safety, and tests** - `46e2d72` (feat)

## Files Created/Modified

- `src/registry-explorer/core/registry.schema.ts` - Adds rich item summary fields and file metadata type.
- `src/registry-explorer/data/loadRegistries.ts` - Maps richer runtime JSON fields into camelCase item summaries.
- `src/registry-explorer/core/registryMirror.ts` - Validates rich item URLs, tokens, commands, arrays, files, and confidence values.
- `src/registry-explorer/core/itemRoutes.ts` - Rejects unresolved route templates and supports raw item URL fallback.
- `src/registry-explorer/core/installActions.ts` - Passes optional raw item URLs into route resolution for command eligibility.
- `tests/registry-explorer/registryMirror.test.ts` - Adds rich item summary accept/reject tests.
- `tests/registry-explorer/registryLoader.test.ts` - Verifies raw/evidence URL, dependency, registry dependency, and file mapping.
- `tests/registry-explorer/itemRoutes.test.ts` - Verifies unresolved placeholder rejection and raw URL fallback.

## Decisions Made

- Kept all rich fields optional to avoid forcing placeholder data into old v1.0 item summaries.
- Treated explicit raw item URLs as the safe way to support imported registries whose official URL templates have unresolved placeholders.
- Validated imported command strings, but kept Phase 4 command generation helpers as the authority for UI copy actions.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Updated install action input to support raw item URL fallback**
- **Found during:** Task 3 (route safety)
- **Issue:** `resolveRegistryItemRoute()` could accept a raw item URL, but `getInstallActionState()` had no way to pass that URL through for command eligibility.
- **Fix:** Added optional `rawItemUrl` to `InstallActionInput` and passed it to `resolveRegistryItemRoute()`.
- **Files modified:** `src/registry-explorer/core/installActions.ts`
- **Verification:** Existing install action tests still pass in the targeted Vitest run; source typecheck passes.
- **Committed in:** `46e2d72`

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** The change was required to make the route fallback usable by downstream discovery/profile code. No scope creep beyond route/action plumbing.

## Issues Encountered

None beyond the documented missing raw URL plumbing deviation.

## Verification

- `pnpm test -- tests/registry-explorer/registryMirror.test.ts tests/registry-explorer/registryLoader.test.ts tests/registry-explorer/itemRoutes.test.ts` — passed; Vitest run reported 14 files / 80 tests passing.
- `pnpm validate:data` — passed with 0 errors and 4 existing HTTP warnings.
- `pnpm typecheck` — passed.
- `pnpm typecheck:test` — passed.
- `git diff --check` — passed before production commit.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Ready for `05-03-expanded-catalog-discovery-profile`. The runtime model now preserves rich item metadata and can safely distinguish raw item URLs from unresolved official route templates.

---
*Phase: 05-expanded-component-catalog*
*Completed: 2026-06-27*

---
phase: 02-official-mirror-data-pipeline
plan: 02
subsystem: data-validation
tags: [validation, shadcn-directory, generated-data, tests]

requires:
  - phase: 02-official-mirror-data-pipeline
    provides: Official shadcn registry mirror artifacts
provides:
  - Local registry mirror validation command
  - Shared mirror validation helpers
  - Generated mirror artifact invariant tests
affects: [official-mirror, runtime-loading, install-actions]

tech-stack:
  added: []
  patterns:
    - Shared TypeScript validation helpers imported by the Node validation CLI
    - Validation result with separate errors and warnings

key-files:
  created:
    - scripts/validate-registry-data.mjs
    - src/registry-explorer/core/registryMirror.ts
    - tests/registry-explorer/registryMirror.test.ts
  modified:
    - package.json
    - tests/registry-explorer/registryData.test.ts
    - tsconfig.test.json
  deleted: []

key-decisions:
  - "HTTP official directory fields are warnings, not errors, under the default policy."
  - "Validation fails scriptable protocols, malformed URLs, protocol-relative URLs, missing `{name}` template tokens, duplicate namespaces, de-prefixed namespaces, and invalid Atlas enrichment values."
  - "Production data tests now validate `public/data/registries.json` instead of the legacy TypeScript array."

patterns-established:
  - "`validateRegistryMirror` returns stable `errors` and `warnings` arrays for CLI and test consumers."
  - "`pnpm validate:data` validates local artifacts only and performs no network fetch."

requirements-completed: [MIRR-03, MIRR-04, MIRR-06, HARD-01]

duration: 14min
completed: 2026-05-25
---

# Phase 2 Plan 02 Summary

**Local validation gate for official shadcn mirror artifacts with neutral HTTP warnings**

## Performance

- **Started:** 2026-05-25T17:41:00Z
- **Completed:** 2026-05-25T17:55:20Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments

- Added `src/registry-explorer/core/registryMirror.ts` with namespace, URL, registry template, count, raw artifact, and Atlas enrichment validation.
- Added `pnpm validate:data` through `scripts/validate-registry-data.mjs`.
- Refactored production data tests to validate `public/data/registries.json` metadata and normalized `@` namespaces.
- Added focused validation tests for duplicate namespaces, de-prefixed namespaces, missing URL fields, `javascript:`/`data:` protocols, HTTP warnings, missing `{name}` tokens, and invalid vocabulary values.
- Preserved the project decision that official HTTP fields are warning-level transport facts, not unsafe/malicious labels.

## Task Commits

1. **Tasks 1-3: Mirror validation helpers, CLI, and generated data tests** - `f1a5a5f` (feat)

## Files Created/Modified

- `src/registry-explorer/core/registryMirror.ts` - Shared mirror validation helpers and issue model.
- `scripts/validate-registry-data.mjs` - Local validation CLI for raw and runtime mirror artifacts.
- `tests/registry-explorer/registryMirror.test.ts` - Focused validation rule tests.
- `tests/registry-explorer/registryData.test.ts` - Runtime mirror artifact invariants.
- `package.json` - Added `validate:data`.
- `tsconfig.test.json` - Enabled JSON module imports for generated artifact tests.

## Decisions Made

- Used one validation issue model with separate `errors` and `warnings` arrays so later UI phases can display official HTTP facts without disabling otherwise valid registry actions.
- Kept validation local-only; freshness remains the responsibility of `pnpm sync:registries`.
- Imported the TypeScript validation helper from the Node CLI using the local Node runtime’s type-stripping support instead of introducing a new runner dependency.

## Deviations from Plan

### Auto-fixed Issues

**1. Test config support for generated JSON imports**
- **Found during:** Task 3 (Update production data tests)
- **Issue:** The plan allowed reading JSON from disk if needed, but the cleaner Vitest path was to import the generated JSON artifact directly.
- **Fix:** Added `resolveJsonModule` to `tsconfig.test.json`.
- **Files modified:** `tsconfig.test.json`
- **Verification:** `pnpm typecheck:test` passed.
- **Committed in:** `f1a5a5f`

---

**Total deviations:** 1 auto-fixed.
**Impact on plan:** No scope change; the config update keeps generated artifact tests type-checked.

## Issues Encountered

- The first CLI run could not resolve the extensionless TypeScript import chain under direct Node execution. The shared helper import was updated to use a `.ts` specifier, which works for Node and still passes TypeScript checks.

## Verification

Passed:

```bash
PATH=/tmp/registry-atlas-bin:$PATH pnpm test -- --run tests/registry-explorer/registryMirror.test.ts
PATH=/tmp/registry-atlas-bin:$PATH pnpm validate:data
PATH=/tmp/registry-atlas-bin:$PATH pnpm typecheck
PATH=/tmp/registry-atlas-bin:$PATH pnpm typecheck:test
PATH=/tmp/registry-atlas-bin:$PATH pnpm test -- --run tests/registry-explorer/registryData.test.ts tests/registry-explorer/registryMirror.test.ts
```

`pnpm validate:data` reported `errors: 0` and `warnings: 4`. The warnings are the current official directory HTTP fields for `@shadcn-map` and `@wandry-ui`.

## User Setup Required

None.

## Next Phase Readiness

Plan 02-03 can now wire runtime loading and UI warning display against a validated generated mirror. The validation gate is available before any future sync artifact is accepted.

## Self-Check: PASSED

All plan acceptance criteria were checked and passed.

---

*Phase: 02-official-mirror-data-pipeline*
*Completed: 2026-05-25*

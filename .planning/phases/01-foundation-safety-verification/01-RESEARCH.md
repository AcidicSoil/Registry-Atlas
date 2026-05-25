# Phase 1 Research: Foundation Safety & Verification

**Phase:** 1 - Foundation Safety & Verification
**Researched:** 2026-05-25
**Status:** Ready for planning

## Executive Summary

Phase 1 should make the existing vanilla TypeScript/Vite app safe to evolve before the official shadcn directory mirror imports broader third-party metadata. The implementation should stay narrow and foundational: make tests runnable, protect imported strings and URLs, remove stale deployable app surfaces, and eliminate vocabulary drift by deriving types from canonical arrays.

The current app already has useful pure core tests under `tests/registry-explorer/`, but `package.json` has no `test` script and no Vitest dependency. The UI currently renders template strings through `innerHTML` with duplicated `escapeHtml` helpers that only escape `&`, `<`, and `>`. The schema duplicates controlled vocabularies as union types and runtime arrays. `public/index.legacy.html` and Vite starter files create confusion about the canonical app surface.

Planning should split Phase 1 into small, independently verifiable foundation plans that protect later phases without implementing the Phase 2 mirror pipeline.

## Required Outcomes

| Requirement | Planning Implication |
|-------------|----------------------|
| `FOUND-01` | Add Vitest-backed `test` script and document the verification command. |
| `FOUND-02` | Extend tests to cover grouping/search assumptions, production data vocabulary validity, safe helpers, and future command/helper boundaries where useful. |
| `FOUND-03` | Remove or archive stale deployable surfaces and starter remnants; update docs to name canonical app files. |
| `FOUND-04` | Add shared safe text/link helpers and route dynamic rendering/error fallback through them. |
| `FOUND-05` | Refactor `PrimaryFocus` and `ComponentTag` to const arrays deriving union types; add tests for duplicates and validity. |

## Recommended Technical Approach

### 1. Runnable Verification Baseline

Add `vitest` as a dev dependency and add package scripts that are explicit:

- `test`: run the test suite once.
- `test:watch`: optional watch mode if desired.
- `typecheck`: run `tsc --noEmit` for source.
- `typecheck:test`: either run `tsc --noEmit -p tsconfig.test.json` or use a root config that includes tests without breaking Vite source compilation.
- `verify`: optional combined gate such as `pnpm typecheck && pnpm typecheck:test && pnpm test && pnpm build`.

Keep `build` as the production output check. Do not overload it with every developer verification step unless the plan explicitly explains the tradeoff.

Recommended files:
- `package.json`
- `pnpm-lock.yaml`
- `tsconfig.json`
- `tsconfig.test.json` if separate test type-checking is used
- `tests/registry-explorer/*.test.ts`

Acceptance checks should include:
- `pnpm test` exits 0.
- Existing tests still pass.
- Test files are type-checked through an explicit command.
- `pnpm build` exits 0.

### 2. Safe Rendering and URL Helpers

Add a small shared helper module rather than rewriting every renderer to DOM APIs immediately. The helper should support:

- Text escaping for string-rendered HTML contexts, escaping at least `&`, `<`, `>`, `"`, and `'`.
- URL parsing with `new URL(value)`.
- Protocol allow-listing with `https:` as the default allowed external protocol.
- Rendering fallback text for invalid/missing/unsupported URLs.
- Safe external anchor attributes: `target="_blank"` and `rel="noreferrer"`.

Good candidate file:
- `src/registry-explorer/ui/safeRender.ts` or `src/registry-explorer/ui/renderSafety.ts`

Apply helpers to touched renderers:
- `src/registry-explorer/ui/focusView.ts`
- `src/registry-explorer/ui/componentView.ts`
- `src/registry-explorer/ui/matrixView.ts` where relevant
- `src/registry-explorer/ui/shell.ts` render error fallback

The render error fallback should not interpolate raw `error.message` into `innerHTML`. Visible UI should use the approved UI-SPEC copy, while detailed exception data stays in `console.error`.

Acceptance checks should include tests for:
- Escaping quotes and apostrophes, not only angle brackets.
- Rejecting `javascript:`, `data:`, protocol-relative surprises if applicable, and malformed URLs.
- Accepting valid `https:` URLs.
- Rendering invalid links as non-clickable unavailable text.

### 3. Canonical App Surface Cleanup

The canonical app surface is:

- `index.html`
- `public/styles/registry-explorer.css`
- `src/registry-explorer/entry.ts`
- `src/registry-explorer/core/**`
- `src/registry-explorer/ui/**`
- `src/registry-explorer/data/**`

Remove or move files that can be served but are not part of this surface:

- `public/index.legacy.html` should not remain deployable.
- `public/vite.svg` should be removed if unused.
- Vite starter files such as `src/main.ts`, `src/counter.ts`, `src/style.css`, and `src/typescript.svg` should be removed if unused.

Update docs to keep contributors pointed at the canonical app surface:

- `README.md`
- `docs/registry-explorer-data.md` if its maintenance workflow references stale entry points.

Generated `dist/` policy should be explicit if `dist/` is tracked. If it is not tracked, no plan should add it. If it is tracked, planning should include a drift-prevention verification command.

### 4. Vocabulary Source of Truth

Refactor vocabularies to const arrays first, derived types second:

```ts
export const PRIMARY_FOCUS_VALUES = [
  'ai-chat',
  // ...
] as const;

export type PrimaryFocus = (typeof PRIMARY_FOCUS_VALUES)[number];
```

Do the same for `COMPONENT_TAG_VALUES` and `ComponentTag`.

Do not redesign or significantly expand the taxonomy in this phase. Major taxonomy work belongs with Phase 3 component discovery.

Tests should verify:

- No duplicate values in `PRIMARY_FOCUS_VALUES` and `COMPONENT_TAG_VALUES`.
- `MATRIX_COLUMNS` entries are all valid component tags.
- Every production registry record uses allowed `primary_focus` and `component_tags` values.
- Required existing known tags remain present if current tests already assert that.

## Security Threat Model

Phase 1 does not execute installs, fetch third-party metadata in the browser, or add third-party UI blocks. Its primary security concern is preparing the UI for untrusted strings and URLs.

### Threats

| Threat | Severity | Mitigation |
|--------|----------|------------|
| Third-party metadata introduces XSS through string-rendered HTML | High | Shared escaping helper, expanded escaping coverage, tests, avoid raw `innerHTML` for errors |
| Malicious registry URL creates clickable `javascript:` or `data:` link | High | `new URL()` parsing, `https:` allow-list, invalid link fallback |
| UI implies registry safety or approval | Medium | Neutral copy from UI-SPEC, no approval badges, provenance/status language only |
| Stale legacy page bypasses safety fixes | Medium | Remove/move `public/index.legacy.html` from deployed surface |
| Vocabulary drift causes invalid generated data to pass local type checks | Medium | Const-array-derived types and production data validation tests |

Every plan should include a `<threat_model>` block or equivalent security section because security enforcement is enabled.

## Suggested Plan Shape

Coarse but executable plan split:

1. **Verification and Type-Check Foundation**
   - Add Vitest, scripts, test type-check config, and ensure existing tests run.
   - Covers `FOUND-01`, part of `FOUND-02`.

2. **Vocabulary and Data Invariant Tests**
   - Refactor vocabularies to const arrays deriving types.
   - Add duplicate/value/production-data invariant tests.
   - Covers `FOUND-05`, part of `FOUND-02`.

3. **Safe Rendering and URL Boundary**
   - Add shared safe rendering/link helpers.
   - Replace duplicated helpers or route them through shared implementation.
   - Fix render error fallback.
   - Covers `FOUND-04`, part of `FOUND-02`.

4. **Canonical Surface Cleanup and Docs**
   - Remove/archive legacy/starter deployable artifacts.
   - Update README/docs to name canonical files.
   - Verify build still succeeds.
   - Covers `FOUND-03`.

Parallelization:
- Plans 1 and 2 can run early and mostly independently.
- Plan 3 should read current renderers and tests; it may depend on Plan 1 if it adds tests.
- Plan 4 can run in parallel with Plan 3 if file touch sets are kept disjoint, but final build verification should happen after all changes.

## Files Likely Touched

- `package.json`
- `pnpm-lock.yaml`
- `tsconfig.json`
- `tsconfig.test.json` (new, if used)
- `tests/registry-explorer/grouping.test.ts`
- `tests/registry-explorer/matrixColumns.test.ts`
- `tests/registry-explorer/registryData.test.ts` (new, likely)
- `tests/registry-explorer/renderSafety.test.ts` (new, likely)
- `src/registry-explorer/core/registry.schema.ts`
- `src/registry-explorer/core/matrixColumns.ts`
- `src/registry-explorer/data/registries.data.ts` (read for tests; avoid data churn unless invalid data is found)
- `src/registry-explorer/ui/renderSafety.ts` or `safeRender.ts` (new)
- `src/registry-explorer/ui/focusView.ts`
- `src/registry-explorer/ui/componentView.ts`
- `src/registry-explorer/ui/matrixView.ts`
- `src/registry-explorer/ui/shell.ts`
- `public/index.legacy.html` (remove/move)
- `public/vite.svg` (remove if unused)
- `src/main.ts`, `src/counter.ts`, `src/style.css`, `src/typescript.svg` (remove if unused)
- `README.md`
- `docs/registry-explorer-data.md`

## Verification Commands

Planner should require final verification with:

```bash
pnpm test
pnpm build
```

If a separate type-check script is added:

```bash
pnpm typecheck
pnpm typecheck:test
```

If a combined script is added:

```bash
pnpm verify
```

## Planner Guidance

- Keep actions concrete and avoid broad refactors unrelated to Phase 1.
- Do not implement Phase 2 sync scripts or official directory fetching yet.
- Do not add Tailwind, shadcn initialization, React, or a new component library.
- Respect the UI-SPEC: preserve existing visual direction, layout breakpoints, typography roles, and color roles.
- Treat deletion of stale deployable files as product safety cleanup, not cosmetic cleanup.
- Include acceptance criteria that prove the stale surface is gone, tests are runnable, unsafe URLs are rejected, and vocabulary drift is structurally impossible.

## Open Questions (RESOLVED)

- RESOLVED in `01-01-PLAN.md`: use `tsconfig.test.json` for explicit test type-checking without broadening the production `tsconfig.json`.
- RESOLVED in `01-03-PLAN.md`: name the shared helper `renderSafety.ts` to match its escaping and URL-validation boundary.
- RESOLVED in `01-04-PLAN.md`: keep `dist/` untracked generated output, document regeneration through `pnpm build`, and do not commit generated output.

---

## RESEARCH COMPLETE

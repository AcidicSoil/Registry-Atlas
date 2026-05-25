# Phase 1: Foundation Safety & Verification - Context

**Gathered:** 2026-05-25
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase makes the existing Registry Atlas app safe, runnable, and canonical before broader third-party shadcn registry metadata is imported. It covers the test/verification baseline, stale deployed surfaces, safe text/link rendering boundaries, and controlled vocabulary source-of-truth cleanup.

It does not implement the official shadcn registry mirror pipeline, component-first discovery, install command copying, batch queue, or URL share state. Those belong to later roadmap phases.

</domain>

<decisions>
## Implementation Decisions

### Verification Baseline
- **D-01:** Phase 1 should establish a real `test` script backed by Vitest, not just rely on `pnpm build`.
- **D-02:** The baseline verification should cover the existing core tests and add targeted tests for foundation risks that later phases depend on: generated-data assumptions, grouping/search behavior, safe URL handling, safe text escaping/rendering helpers, and future command-token helper boundaries where useful.
- **D-03:** Planning should include test type-checking explicitly. Current `tsconfig.json` only includes `src`, so the planner should either add a test TypeScript config or otherwise ensure tests are type-checked as part of normal verification.
- **D-04:** `build` remains the production validation gate, but Phase 1 should make `test` the developer-facing test gate and make any combined validation script explicit instead of hidden.

### Canonical App Surface
- **D-05:** Prefer removing stale deployed artifacts over preserving them. If a file is not part of the canonical Registry Atlas app and can be served by Vite/GitHub Pages, it should be deleted or moved outside `public/`.
- **D-06:** `public/index.legacy.html` should not remain deployable in Phase 1. Archive only if there is a concrete historical reason; otherwise remove it.
- **D-07:** Vite starter remnants such as `src/main.ts`, `src/counter.ts`, `src/style.css`, `src/typescript.svg`, and `public/vite.svg` should be removed when unused, and docs should point contributors to `index.html`, `public/styles/registry-explorer.css`, and `src/registry-explorer/entry.ts` as the canonical app surface.
- **D-08:** If `dist/` is committed or generated locally, Phase 1 planning should make its policy explicit: either stop tracking generated output or add a validation/release rule that prevents drift from source. Do not let stale generated output coexist silently.

### Safe Rendering Boundary
- **D-09:** Phase 1 should centralize rendering safety before Phase 2 imports broader third-party metadata. Add shared helpers for text escaping and URL validation/normalization rather than keeping per-view `escapeHtml` copies.
- **D-10:** The minimum safety bar is: escape `&`, `<`, `>`, `"`, and `'` for HTML text/attribute contexts when string rendering remains, validate links with `new URL()`, allow only `https:` by default, and keep `rel="noreferrer"` / safe target behavior on external links.
- **D-11:** Do not require a full rewrite from string renderers to `document.createElement` in Phase 1 unless the planner finds a low-risk path. The practical default is a shared safety helper plus focused refactors where dynamic links or error messages are currently unsafe.
- **D-12:** The render error fallback in `src/registry-explorer/ui/shell.ts` should stop interpolating `error.message` directly into `innerHTML`; use a safe helper or DOM `textContent`.

### Vocabulary Source of Truth
- **D-13:** Use const arrays as the canonical source for controlled vocabularies, then derive TypeScript union types with `(typeof VALUES)[number]`. This applies to `PrimaryFocus` and `ComponentTag`.
- **D-14:** Keep human-facing labels in `src/registry-explorer/core/labels.ts`; do not move labels into data records or duplicate label strings across views.
- **D-15:** Tests should assert vocabulary invariants that matter for later phases: matrix columns are valid component tags, no duplicate values exist, required known tags remain present, and every production record uses allowed vocabulary values.
- **D-16:** Do not expand the vocabulary significantly in Phase 1. Major taxonomy expansion belongs with Phase 3 component discovery; Phase 1 should remove drift risk without prematurely designing the future taxonomy.

### the agent's Discretion
- The user explicitly authorized the agent to choose best defaults and correct prior work if needed to improve the end product. Downstream planner should use the decisions above as locked defaults and should not pause to re-ask these foundation choices.
- If implementation reveals a conflict between preserving old artifacts and removing confusion, prefer the cleaner canonical app surface.
- If implementation reveals a conflict between narrow tests and future safety, prefer tests that protect the later mirror/import work.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Scope
- `.planning/PROJECT.md` — Product direction, core value, active requirements, and constraints for Registry Atlas.
- `.planning/REQUIREMENTS.md` — Phase 1 requirement IDs `FOUND-01` through `FOUND-05` and full v1 traceability.
- `.planning/ROADMAP.md` — Phase 1 goal, MVP mode, success criteria, dependencies, and boundaries.
- `.planning/STATE.md` — Current project position and phase focus.

### Codebase Maps
- `.planning/codebase/TESTING.md` — Current test state, missing Vitest dependency/script, and coverage gaps.
- `.planning/codebase/CONVENTIONS.md` — Current naming, module, import, linting, and source organization conventions.
- `.planning/codebase/CONCERNS.md` — Known risks this phase is meant to address: unsafe string rendering, missing tests, stale legacy artifacts, vocabulary drift, and deployment drift.

### Research
- `.planning/research/SUMMARY.md` — Research-backed phase ordering and rationale for doing foundation safety before mirror/import work.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `tests/registry-explorer/grouping.test.ts` — Existing Vitest-style core tests; use as the starting pattern for runnable test setup.
- `tests/registry-explorer/matrixColumns.test.ts` — Existing vocabulary/config consistency tests; extend for stronger vocabulary invariants.
- `src/registry-explorer/core/grouping.ts` — Pure grouping/filtering logic suitable for DOM-free tests.
- `src/registry-explorer/core/registry.schema.ts` — Current controlled vocabulary and registry schema location; needs const-array-derived types.
- `src/registry-explorer/core/labels.ts` — Existing label mapping location; keep as display-label source.
- `src/registry-explorer/ui/focusView.ts`, `src/registry-explorer/ui/componentView.ts`, `src/registry-explorer/ui/matrixView.ts` — Current renderers with duplicated local escaping.
- `src/registry-explorer/ui/shell.ts` — State/render orchestration and render error fallback; target for safe error-message handling.

### Established Patterns
- Core behavior is kept pure under `src/registry-explorer/core/` and tested separately from DOM rendering.
- UI renderers use named `render*` functions and currently emit template strings into DOM roots.
- Source uses two-space indentation, single-quoted TypeScript strings, named exports, relative imports, and top-level `tests/registry-explorer/` files.
- `pnpm build` currently runs `tsc && vite build`; `package.json` has no `test` script and no Vitest dependency.

### Integration Points
- `package.json` scripts and devDependencies are the entry point for making tests runnable.
- `tsconfig.json` or a dedicated test TypeScript config should define how tests are type-checked.
- `public/` controls files copied directly into deployed output; stale files here can become user-facing.
- `index.html`, `public/styles/registry-explorer.css`, and `src/registry-explorer/entry.ts` are the canonical app shell and bootstrap path.
- `vite.config.ts` controls the GitHub Pages base path and should stay aligned with the canonical deployed app policy.

</code_context>

<specifics>
## Specific Ideas

- The user wants best defaults chosen by the agent where they improve the end product.
- Phase 1 should correct prior setup/work if it makes later phases safer, especially the known mismatch between existing Vitest-style tests and missing test tooling.
- The foundation work should prioritize later official-directory import safety over preserving current implementation quirks.

</specifics>

<deferred>
## Deferred Ideas

- Official shadcn directory sync, raw/normalized generated data, and sync reports belong to Phase 2.
- Component-first search, registry profiles, coverage confidence states, and matrix/focus secondary discovery refinements belong to Phase 3.
- Copyable `add`/`view` commands, batch queue, URL state, CI release hardening, and accessibility verification expansion belong to Phase 4 unless a minimal foundation hook is needed in Phase 1.

</deferred>

---

*Phase: 1-Foundation Safety & Verification*
*Context gathered: 2026-05-25*

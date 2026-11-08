# Verification

Registry Atlas uses local verification as the authoritative project gate. Run verification from the canonical checkout or from the worktree whose changes you are validating; do not use GitHub Actions as a substitute for the repository's local checks.

## Full gate

```bash
mise run verify
```

The full gate runs source type-checking, test type-checking, the Vitest suite, generated registry-data validation, and the production build using the Node and pnpm versions pinned in `mise.toml`. It validates the current generated mirror but does not refresh registry data.

For a narrower test-only check:

```bash
mise run test
```

The underlying `pnpm verify` and `pnpm test` scripts remain available; mise is the preferred project entrypoint so local and CI toolchains stay aligned.

## Gradual quality cleanup

`pnpm lint:styles` runs Stylelint on remaining authored CSS; `pnpm lint:stylex` runs the **official StyleX ESLint rules and token policy** against `src/**/*.stylex.ts`; `pnpm lint:unused` runs Knip on the project/CLI/test entrypoints. All three gates run in `pnpm lint`, `pnpm check`, `pnpm verify`, `pnpm verify:local`, and deploy CI (`.github/workflows/deploy.yml`). `pnpm lint` delegates to `pnpm lint:deps && pnpm check`, preserving dependency-cruiser test coverage while using the canonical quality/formatting gate without duplicate execution. TypeScript/HTML renderers remain subject to Oxlint.

`pnpm audit:dependencies` is also mandatory: the workspace pins patched `zod@4.6.6` and transitive `fast-uri@3.1.9` through `pnpm-workspace.yaml` overrides. This prevents vulnerable versions from resurfacing in E2E or CSS tooling dependency trees. Regenerate and audit `pnpm-lock.yaml` when those overrides change.

The checked-in `.design/quality-debt-baseline.json` records zero accepted findings. Direct Stylelint and Knip commands now enforce zero actionable issues; `node scripts/check-quality-debt.mjs all` retains the optional historical baseline check. The Knip configuration explicitly identifies installed, non-npm CLI binaries; the dev-only React Grab/React peer pair loaded by `index.html`; and generated vendor declarations outside authored source. These are documented tooling boundaries, not globally disabled rules. Any intentional new baseline requires `node scripts/check-quality-debt.mjs all --update-baseline` and reviewer evidence. Historical findings and repairs are recorded in `.design/stale-code-cleanup-2026-10-29.md`.

## Package scripts

The root `package.json` exposes the frequent development and verification entrypoints. Infrequent operations use grouped commands instead of one npm script per action:

```bash
pnpm db status                   # setup | up | down | status | backup
pnpm db restore-check /path/to/backup.dump
pnpm db reconcile-source-evidence
pnpm sync registries              # registries | catalog-evidence | registry-icons

pnpm test:e2e tests/smoke.e2e.ts
pnpm test:e2e --config e2e.mobile.config.ts
```

`pnpm db --help` and `pnpm sync --help` list supported actions. `mise run sync:registries` and the other documented mise sync tasks remain compatibility entrypoints. Existing database and catalog scripts are reused unchanged; selecting a database subcommand does not automatically start PostgreSQL, and synchronizations require an explicit `sync` subcommand. E2E options go directly after `pnpm test:e2e` (do not insert an extra `--` separator). The normal `pnpm verify` gate retains the mandatory quality checks.

## Git worktree isolation

Root Vitest discovery intentionally excludes `**/.worktrees/**` through `vitest.config.ts`. This keeps verification for one checkout from silently collecting tests from sibling development worktrees stored beneath the repository.

This boundary matters when multiple implementation or documentation lanes are active at once: a test file that exists only in another `.worktrees/...` checkout is not part of the current checkout's test result. Validate each worktree from inside that worktree when its changes need verification.

The exclusion was added after canonical root discovery was shown to collect a duplicate test surface from an active sibling worktree. The regression check confirmed that a deliberately failing test under `.worktrees/` was excluded while the canonical test set still ran normally.

## Data refresh is separate

Verification does not mutate or refresh the generated registry mirror. When intentionally reviewing upstream registry changes, use the documented refresh sequence:

```bash
mise run import:catalog
mise run sync:registries
mise run validate:data
mise run verify
```

Review the generated reports and runtime mirror before accepting regenerated data. See `docs/registry-explorer-data.md` for the data authority and maintenance workflow.

## Phase 5A catalog-policy verification (2026-11-04)

`data/loadRegistries.ts` returns one validated `LoadedRegistryData.policy` which `entry.ts` passes into the application shell. All policy-dependent core queries, route/query serialization, registry comparisons, source-page resolution, item detail loads and renderers take explicit `CatalogPolicy`. Shared mutable catalog configuration APIs were removed. `tests/registry-explorer/testCatalogPolicy.ts` builds the test policy from the existing PostgreSQL-backed reference fixtures.

The 14 directly affected unit-test files passed (148 tests). Source and test TypeScript checks, `pnpm check`, and a fresh `pnpm build` passed. Browser verification against that build passed 3/3 desktop navigation/grid/directory tests, 3/3 mobile sidebar/grid tests and 3/3 isolated infinite-scroll tests. The earlier combined-run infinite-scroll timing variance remains an open baseline risk; isolated green tests do not resolve it. Formal independent PPM design-review and stale stack/feature-map evidence remain separately outstanding. See `docs/refactor/plan.md` and `docs/refactor/baseline.md`.

## Phase 5B runtime boundary verification (2026-11-04)

`data/runtimeJson.ts` parses decoded JSON through a caller-supplied validating callback; the main snapshot loader checks required object envelopes and validates the mirror before traversing records. The lazy details loader checks for an object map and clears rejected cache promises. `registryLoader.test.ts` covers missing/malformed top-level data, malformed mirror registries, invalid route-map shapes, successful gzip loading, and recovery after invalid detail payloads. `registryItemDetail.test.ts` retains item-detail fallback coverage. The PostgreSQL and compressed asset formats are unchanged. The impact-scoped verification passed 170/170 unit tests across 17 files, both TypeScript checks, `pnpm check`, the production build, three desktop browser checks, and three mobile browser checks. No full test suite was run. See `docs/refactor/plan.md` for remaining phases and certification blockers.

## Browser release checks

Automated verification does not replace the maintained browser/accessibility release smoke. Use `.planning/phases/04-install-actions-release-hardening/04-BROWSER-A11Y-SMOKE.md` when release-level browser behavior needs validation.

## Updated PPM bootstrap (2026-11-02)

`project_bootstrap.py --project . --write` applied the Stackforge TypeScript, CSS, StyleX and Shadcn setups, generated mise tasks and Oxfmt 0.74.0. Its next preview has zero failures and reports unchanged mise/Oxfmt setup. StyleX is active through matching `@stylexjs/stylex@0.19.1` runtime and `@stylexjs/unplugin@0.19.1` Vite compiler, with native `*.stylex.ts` components and a first-party StyleX lint gate. Only Shadcn/Tailwind-v4 lint remains staged because the application does not use Tailwind. React Doctor scans the application but excludes backend maintenance scripts via `doctor.config.json`; the strict anti-slop Oxlint gate still checks authored scripts.

The approved Oxfmt 0.74.0 migration resolved **288 formatting differences**. `pnpm format:check` and the combined `pnpm check` both pass. The deterministic `scripts/verify-oxfmt-migration.mjs` compares the changed code against the pre-migration commit using TypeScript AST nodes, CSS selectors/declarations, and parsed configuration values. Only five machine-owned historical evidence artifacts are excluded from formatting by explicit paths in `.oxfmtrc.json`; review approvals are not excluded. Oxlint's spacing autofixer and Stylelint's rule-spacing fixer restore mandatory readability without changing formatter settings or weakening rules. Source-linked PPM evidence hashes are refreshed only after their affected checks pass, without manufacturing new approvals.

For a later replay, run `node scripts/verify-oxfmt-migration.mjs c81d56c` to compare current code with the pre-migration baseline.

## StyleX-native UI verification

**Authority:** https://stylexjs.com/docs/llm-resources. For this project, official StyleX APIs and compiler behavior override local skill examples or generic CSS-to-StyleX conventions. No Tailwind runtime or React rewrite is involved.

- `src/registry-explorer/ui/tokens.stylex.ts` owns shared semantic values via `stylex.defineVars`, compiled into stable document-level custom properties so remaining global CSS consumes the same source of truth.
- `vite.config.ts` applies `@stylexjs/unplugin` to the HTML-entry Vite build. `vitest.config.ts` shares the same plugin, and the Vite test-specific hook disables only unnecessary long-lived CSS-update middleware so the tests exit reliably.
- Every migrated renderer uses official `stylex.attrs()` with `renderStyleXAttributes()` for escaped HTML-string output. Behavior uses `data-*`, ARIA and native element semantics, never generated atomic class names.
- Converted component CSS is deleted as each owner migrates; remaining `*.css` is still checked by Stylelint. Source-tree tests `stylexArchitecture.test.ts`, `stylexAttributes.test.ts`, and `stylexTokenLint.test.mjs` plus browser tests `stylex-registry-icon.e2e.ts`, `stylex-directory-layout.e2e.ts`, and desktop/mobile `stylex-catalog-grid.e2e.ts` cover integration, token validation, layout variants and stable browser output.
- **Not yet converted:** remaining global document/shell/navigation/setup CSS is intentionally still loaded until the corresponding markup/state ownership moves into StyleX. Migrated UI is not evidence that the entire application is StyleX-only. Historical design-review approval in `.design/standards.json` remains independently gated.

## Component-specific hover-preview redesign (2026-11-04)

The prior 236-entry URL image mapping is retired: 227 entries were from Aceternity, and the browser acceptance test only proved a .NET logo. The approved replacement uses three publisher-supplied component screenshots, manually reviewed for component-specific content and copied into `public/data/component-previews/`. The versioned `component-previews.json` records original item identity/source, publisher screenshot URL, verified timestamp and SHA-256. `componentPreviews.ts` accepts only local reviewed screenshots for exact source links; no icon/direct-image fallback, inferred OG image, iframe or new crawler remains. Missing evidence shows nothing. See `docs/architecture/component-visual-previews.md` for the actual data/provenance contract, pilot identities and limitations.

```bash
pnpm exec vitest run tests/registry-explorer/componentPreviews.test.ts tests/registry-explorer/catalogLinkPreview.test.ts
pnpm typecheck
pnpm typecheck:test
pnpm check
pnpm build
pnpm exec e2e run tests/catalog-link-preview.e2e.ts
```

### Current pilot verification

The production build and both TypeScript checks passed. `pnpm check` passed anti-slop Oxlint, Stylelint, StyleX ESLint, Knip, dependency-cruiser, React Doctor, complexity and Oxfmt gates. Impact-scoped Vitest passed **26/26 tests** across `componentPreviews`, `catalogLinkPreview`, and `itemDetailView`. The production browser run passed **4/4 tests**: exact local previews for `@aceternity/animated-testimonials` (Components), `@reui/sheet-16` (Blocks), and `@shadcnblocks/about1` (item detail), plus a negative logo case. Each test checked the original source `href`, local image path, successful image decoding/visible paint and Escape dismissal. Screenshots were examined visually; they show actual UI specimens, not icons. Source identity and exact SHA-256 of all three tracked WebP files were checked against the runtime snapshot. This verifies the pilot, **not** broad catalog coverage or live interactive demonstrations.

The independent PPM project-standards closing check is **not** globally compliant: it reports a stale project stack/feature-map baseline and a missing independent source-linked `designReview` assessment. Those approval/evidence tasks were not rewritten or bypassed by this pilot.

### Earlier baseline (not remediated in this preview change)

The previous source navigation/database work passed 86 relevant unit tests and two browser tests, but those browser tests did **not** establish non-icon preview quality. `pnpm check:product-contract` had five outstanding failures: four brittle shell/navigation source-text assertions and 432 stale reviewed-overlay input fingerprints in local canonical data. They are not part of the current component-preview change. The project also already had 41 package scripts against an existing limit of 40; this change does not add scripts or alter that test limit. Do not claim either the product-contract gate or the full suite is green without new evidence.

### Runtime source-coverage reconciliation

The local push hook opted into the full suite independently of this feature-scoped test plan. It uncovered a stale three-tier assertion in `sourcePageArtifact.test.ts`, now corrected for the new `observed` evidence level. `build-runtime-data.mjs` now recomputes source-page coverage from exported PostgreSQL rows and includes `observed` counts, rather than publishing the older coverage document unchanged after independently reviewed source-row additions. An impact-scoped projection test and generated-snapshot test pass.

The hook also reported the existing `projectTasks.test.ts` package-script limit failure: **41** scripts against a limit of **40**. The obsolete media collector is now removed, and no new package alias was introduced. Resolving this baseline remains separate.

## Approved refactor continuation verification (2026-11-04)

- The 5C route codec and browser-history separation has focused tests in `browseRouteState.test.ts` and `browseHistory.test.ts`. Earlier in this session, routing/history/shell tests passed **56/56**, production navigation and infinite scrolling passed **4/4** browser tests against a fresh build, and TypeScript and project quality gates passed.
- The approved 5E importer change was developed against a failing regression test and then passed **12/12** tests in `registryCatalogImport.test.ts` and `postgresStorage.test.ts`, including isolated PostgreSQL rollback on a failing provenance write; test TypeScript passed.
- No production PostgreSQL writes, reviewer decision resets, classification-hash rewrites, schema migration, or full-suite run accompanied these changes. The original read-only source reconciliation reported 46,397 source pages and zero proposed changes.
- The remaining 432 stale classifications and 131 missing review identities, 5D StyleX work, multi-asset atomic publication, and independent PPM design/standards review remain **open** until evidenced and verified separately. Source-evidence conflict protection was added separately on November 6.

## Phase 5E: read-only snapshot consistency verification (2026-11-04)

`readRuntimePayloads` now executes every PostgreSQL source query inside a single repeatable-read, read-only transaction. The focused regression test failed first when the function was absent, then passed with the transaction implementation. The actual local PostgreSQL export and static artifact integrity check passed for 118,643 catalog and detail records; **7/7** related projection, runtime flow and source-page artifact tests passed. The transaction provides a coherent database read generation but does not make the two output files an atomic publication unit. No database mutations, migration or full-suite run occurred.

## Complete lint gate remediation (2026-11-07)

`pnpm lint` now runs `pnpm lint:deps && pnpm check`. This preserves dependency-cruiser coverage of `src` and `tests`, and runs the canonical Oxlint/anti-slop, Stylelint, StyleX ESLint, Knip, dependency-boundary, React Doctor, CCCC, and Oxfmt gates without recursively calling lint. The script contract in `projectTasks.test.ts` asserts this wiring.

The project CCCC policy remains strict at **maximum cognitive 10** and **maximum cyclomatic 8**, without exceptions. Source-backed refactors in `src/registry-explorer/core/`, `data/`, `entry.ts`, and `ui/` resolved **42 existing per-function threshold violations** through named validation, route, rendering, and event-handler helpers. The current CCCC report covers 61 files and 723 functions, with maximum cognitive **10**, maximum cyclomatic **8**, and zero parser errors. `qualityToolingContract.test.ts` now asserts these configured limits rather than the superseded 15/10 baseline.

Verified: `pnpm lint` exited **0**, including the no-issues React Doctor run; source and test TypeScript checks passed. Impact-scoped Vitest suites were run throughout the core, data, and shell refactor, including the shell's sidebar disclosure and focus behavior. The refreshed production build and test TypeScript check passed. Six browser E2E checks passed across catalog navigation, card navigation/copy controls, grouped sidebar and setup cart (4 files, 6 tests). The old 15/10 contract assertion in `qualityToolingContract.test.ts` was updated to 10/8 and its three focused tests passed. The full unit suite then passed **638 tests** (94 files passed, 1 file skipped; 8 live tests intentionally skipped) with zero failures. The package build, including runtime-data validation and SBOM generation, passed. The independent PPM design assessment and reviewed classification fingerprints remain outside the scope of the lint gate and are not represented as certified.

## Repowise-generated guidance and formatting ownership (2026-11-07)

The installed Repowise post-commit hook refreshes `AGENTS.md` and `.github/copilot-instructions.md`, including the indexed commit and its generated Markdown structure. Oxfmt reformatted those managed sections differently, so the next post-commit regeneration immediately reintroduced pre-push `format:check` failures. `.oxfmtrc.json` now excludes only those two Repowise-owned outputs; it continues checking project source, tests, and hand-written documentation. The quality-tooling contract asserts these exclusions. No source lint, complexity, type-check, test, or build gates were relaxed.

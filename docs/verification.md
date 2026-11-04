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

`pnpm lint:styles` runs Stylelint on remaining authored CSS; `pnpm lint:stylex` runs the **official StyleX ESLint rules and token policy** against `src/**/*.stylex.ts`; `pnpm lint:unused` runs Knip on the project/CLI/test entrypoints. All three gates run in `pnpm lint`, `pnpm check`, `pnpm verify`, `pnpm verify:local`, and deploy CI (`.github/workflows/deploy.yml`). TypeScript/HTML renderers remain subject to Oxlint.

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

## Provider-neutral source-media migration (2026-11-04)

The preview reader is sourced from `public/data/source-media.json`; the generated manifest is validated at load, and missing/invalid media fails closed without blocking catalog rendering. The initial migration preserved 227 exact source/image records and nine verified legacy URL-rule fixtures (236 entries). The seven observed documentation anchors were migrated into the PostgreSQL source-page table and surfaced by a fresh runtime export. The first 12 generic collector requests produced zero accepted images and 12 `unreadable-page` rejections. Coverage numbers refer only to the published evidence, not the full catalog. Impact-scoped unit tests validate manifest boundaries, media metadata extraction, original-link provenance, component preview rendering and fallback; selected browser tests should run against a freshly built production bundle.

```bash
pnpm exec vitest run tests/registry-explorer/sourceMedia.test.ts tests/registry-explorer/sourceMediaCollector.test.ts tests/registry-explorer/sourcePageLink.test.ts tests/registry-explorer/catalogLinkPreview.test.ts
pnpm typecheck
pnpm typecheck:test
pnpm check
pnpm build
```

Do not infer successful visual verification from image URL patterns, HTTP status alone, or registry-wide counts. Independent source image rendering, broader provider coverage, and PPM design certification remain separate evidence gates.

### Current evidence and outstanding baseline checks

The affected source-media, loader, link, card, item-detail, compare, and PostgreSQL projection tests passed **86/86 across 10 files**. Both TypeScript checks, `pnpm check`, and `pnpm build` passed; the production build generated an SBOM for 653 pinned dependencies. `tests/catalog-link-preview.e2e.ts` and `tests/catalog-navigation.e2e.ts` passed **2/2** against a fresh production preview; the preview browser test also checks the actual upstream SVG image decodes.

`pnpm check:product-contract` is **not green**: its original-page resolver assertion was updated for `sourcePageNavigation`, leaving five independently outstanding failures: unsupported route not-found state in `ui/shell.ts`; Libraries, Components, and Templates navigation link assertions in `index.html`; and 432 stale reviewed-overlay input fingerprints in the local canonical data. These unchanged files/data are outside this approved source-media task. No claim of a clean full product-contract gate or full test suite is made.

### Runtime source-coverage reconciliation

The local push hook opted into the full suite independently of this feature-scoped test plan. It uncovered a stale three-tier assertion in `sourcePageArtifact.test.ts`, now corrected for the new `observed` evidence level. `build-runtime-data.mjs` now recomputes source-page coverage from exported PostgreSQL rows and includes `observed` counts, rather than publishing the older coverage document unchanged after independently reviewed source-row additions. An impact-scoped projection test and generated-snapshot test pass.

The hook also reported the existing `projectTasks.test.ts` package-script limit failure: the prior baseline already contained **41** scripts against a limit of **40**. This task removes its proposed additional package alias and documents direct `node scripts/collect-source-media.mjs --max-pages=50` invocation, preserving the pre-existing 41-script surface. Resolving that unrelated package-script baseline remains outstanding; do not weaken the cap or remove unrelated scripts as a silent side effect.

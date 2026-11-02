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

`pnpm lint:styles` runs Stylelint with the source-backed CSS ownership/size rules; `pnpm lint:unused` runs Knip against the explicit project/CLI/test entrypoints. Both commands are part of `pnpm lint`, `pnpm verify`, `pnpm verify:local`, and deploy CI.

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

## Browser release checks

Automated verification does not replace the maintained browser/accessibility release smoke. Use `.planning/phases/04-install-actions-release-hardening/04-BROWSER-A11Y-SMOKE.md` when release-level browser behavior needs validation.

## Updated PPM bootstrap (2026-11-02)

`project_bootstrap.py --project . --write` applied the Stackforge TypeScript, CSS, StyleX and Shadcn setups, generated mise tasks and Oxfmt 0.74.0. Its next preview has zero failures and reports unchanged mise/Oxfmt setup. StyleX/Shadcn plugins are staged only; there is no authored StyleX or Tailwind-v4 UI code. React Doctor scans the application but excludes backend maintenance scripts via `doctor.config.json`; the strict anti-slop Oxlint gate still checks authored scripts.

The approved Oxfmt 0.74.0 migration resolved **288 formatting differences**. `pnpm format:check` and the combined `pnpm check` both pass. The deterministic `scripts/verify-oxfmt-migration.mjs` compares the changed code against the pre-migration commit using TypeScript AST nodes, CSS selectors/declarations, and parsed configuration values. Only five machine-owned historical evidence artifacts are excluded from formatting by explicit paths in `.oxfmtrc.json`; review approvals are not excluded. Oxlint's spacing autofixer and Stylelint's rule-spacing fixer restore mandatory readability without changing formatter settings or weakening rules. Source-linked PPM evidence hashes are refreshed only after their affected checks pass, without manufacturing new approvals.

For a later replay, run `node scripts/verify-oxfmt-migration.mjs c81d56c` to compare current code with the pre-migration baseline.

# Mandatory quality-tooling certification evidence

Status: **all four quality gates verified; remaining project standards still require assessment**. Updated 2026-10-13.
Scope: Registry Atlas canonical workspace root.

## User authorization
The user explicitly granted standing approval (“always”) to install and configure anti-slop TypeScript, dependency-cruiser, cccc, and React Doctor, including normal verification and pass–fail–pass proof. The project records the user's decision here. PAO correlates conversations and project work; it does not grant tooling approval.

## Verified gates
- **dependency-cruiser 18.6.0** is pinned and enforced in `pnpm lint:deps` (delegates to `pnpm lint:boundaries`). Per the installed `setup-ts-deep-modules` skill, the configuration scans both application and test files, prohibits cross-module imports into nested implementation paths, prevents tests importing private internals and production imports from test fixtures, prohibits cycles, and retains core/data/UI layering. `pnpm test:boundaries` verifies five clean → deliberate violation → clean scenarios. A real `core/lib/sourcePageOrigin.ts` file is private and consumed via public `core/sourcePageValidation.ts`.
- **React Doctor 0.9.18** is pinned and scoped to authored `src/` with `--blocking warning --no-telemetry`. The earlier clean → injected await-in-loop error → clean proof succeeded; keep its independent root gate active.
- **cccc 1.8.0** is pinned in `mise.toml` via the official prebuilt `github:moznion/cccc` release. The official `cccc.toml` uses the ECMAScript language setting, fixed **cognitive ≤15** and **cyclomatic ≤10** per-function limits, four workers, cached results and tabular output. No baseline exemptions, no threshold increases. A fresh official-config scan passes: **41 files, 609 functions; maximum cognitive 12, maximum cyclomatic 10**. `pnpm test:complexity-gate` proves clean → deliberately failing function → clean with the same TOML file. This resolves the prior 44 recorded source violations through semantic refactoring of routing, UI, catalog filtering, data validation, and load-time provenance checks.
- All four gates are invoked by the root `pnpm verify`; `mise tasks validate --errors-only` confirms their task mappings.


## Anti-slop TypeScript

Stackforge applied the official vendored `anti-slop/typescript` setup to the
canonical Registry Atlas root on 2026-10-13. The setup added `oxlint.config.ts`,
the first-party vendored plugin source in `tools/oxlint/anti-slop/`,
pinned `oxlint` and `@oxlint/plugins` at 1.87.0 in the root dependency lockfile,
and the `pnpm lint:anti-slop` command.

The full-scope `oxlint .` gate was inserted before dependency-cruiser in
`pnpm verify`, with a corresponding mise task. No policy rule was disabled and
no grandfathered error limit was introduced. Machine-local Stackforge run
metadata is excluded from Git, while vendored plugin code is versioned.

First scan: **4,173 errors** (plus 18 warnings), including 3,582 missing
blank-line failures. After safe autofix, the remaining **593 strict-rule
findings** were resolved through explicit TypeScript/JavaScript refactors,
named input contracts, and schema-backed boundary validation. The
unchanged root command `pnpm lint:anti-slop` now reports **0 errors and
0 warnings**, scanning **173 authored files under 117 active rules**.

The original violation breakdown and the resolved scan are preserved in
`.design/anti-slop-remediation.json`. `pnpm test:anti-slop-gate` confirms
**clean → deliberately injected TypeScript violation rejected → clean
after removal**. The proof is stored in
`scripts/verify-anti-slop-gate.mjs`.

The standalone registry-data validator now imports the real project TypeScript
module instead of copying a partial module tree into a temporary directory.
This retains the boundary schemas and supports native Node 24 module loading.

**Anti-slop technical remediation is complete.** Tooling compliance depends on installed configuration, checks and failure-detection evidence, not on a PAO approval receipt.

## Independent code checks

Source URL, canonical taxonomy, catalog integrity, navigation, sidebar focus, install action, theme preview, data-loading and catalog query targeted tests pass after refactoring. TypeScript checks and all individual quality tools pass. `pnpm test:boundaries` passed all five adversarial checks.

The complete `pnpm verify` run finished with **exit 0** again after anti-slop remediation and the standalone validator fix on 2026-10-13. Vitest: **552 passed across 70 passing files**, with 8 live System One tests skipped (1 skipped file). PostgreSQL contract: **91,716 catalog rows and 91,716 detail rows**, 0 missing/extra, writer constraints valid. Data validation: **0 errors, 4 existing official HTTP URL warnings**. Vite production build succeeded (120 modules). Local PPM browser acceptance also passed for the mobile Components route and a desktop nested-component route. Generated static data and build artifacts are ignored.

## Remaining global certification work

- The anti-slop error queue is closed and the deliberate failure-detection proof passed. No anti-slop technical violations remain.
- Close remaining PPM/OrchestKit rules with rule-specific implementation and evidence. The four required tooling gates are compliant without PAO approval references. Retain independent user decisions for actual replacement or exception requests; PAO check-ins remain optional work provenance. Frontend provenance exceptions retain their separately defined approval procedure.

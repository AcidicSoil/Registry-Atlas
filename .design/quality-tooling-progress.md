# Mandatory quality-tooling certification evidence

Status: **three requested tool gates verified; global PPM certification still pending**. Updated 2026-10-13.
Scope: Registry Atlas canonical workspace root.

## User authorization
The user explicitly granted standing approval (“always”) to install and configure anti-slop TypeScript, dependency-cruiser, cccc, and React Doctor, including normal verification and pass–fail–pass proof. This is an authorization to perform work, not a fabricated PPM/PAO receipt; policy records retain their unresolved formal PAO reference where required.

## Verified gates
- **dependency-cruiser 18.6.0** is pinned and enforced in `pnpm lint:deps` (delegates to `pnpm lint:boundaries`). Per the installed `setup-ts-deep-modules` skill, the configuration scans both application and test files, prohibits cross-module imports into nested implementation paths, prevents tests importing private internals and production imports from test fixtures, prohibits cycles, and retains core/data/UI layering. `pnpm test:boundaries` verifies five clean → deliberate violation → clean scenarios. A real `core/lib/sourcePageOrigin.ts` file is private and consumed via public `core/sourcePageValidation.ts`.
- **React Doctor 0.9.18** is pinned and scoped to authored `src/` with `--blocking warning --no-telemetry`. The earlier clean → injected await-in-loop error → clean proof succeeded; keep its independent root gate active.
- **cccc 1.8.0** is pinned in `mise.toml` via the official prebuilt `github:moznion/cccc` release. The official `cccc.toml` uses the ECMAScript language setting, fixed **cognitive ≤15** and **cyclomatic ≤10** per-function limits, four workers, cached results and tabular output. No baseline exemptions, no threshold increases. A fresh official-config scan passes: **41 files, 609 functions; maximum cognitive 12, maximum cyclomatic 10**. `pnpm test:complexity-gate` proves clean → deliberately failing function → clean with the same TOML file. This resolves the prior 44 recorded source violations through semantic refactoring of routing, UI, catalog filtering, data validation, and load-time provenance checks.
- All three gates are invoked by the root `pnpm verify`; `mise tasks validate --errors-only` confirms their task mappings.


## Anti-slop TypeScript
Stackforge source `anti-slop` is already available locally. The prescribed setup apply/dry-run command was blocked by the execution safety layer before execution, so its root Oxlint integration is **not installed or certified**. Do not substitute an unrelated lint rule set or describe the setup as complete.

## Independent code checks

Source URL, canonical taxonomy, catalog integrity, navigation, sidebar focus, install action, theme preview, data-loading and catalog query targeted tests pass after refactoring. TypeScript checks and all individual quality tools pass. `pnpm test:boundaries` passed all five adversarial checks.

The complete `pnpm verify` run finished with **exit 0** on 2026-10-13. Vitest: **552 passed across 70 passing files**, with 8 live System One tests skipped (1 skipped file). PostgreSQL contract: **91,716 catalog rows and 91,716 detail rows**, 0 missing/extra, writer constraints valid. Data validation: **0 errors, 4 existing official HTTP URL warnings**. Vite production build succeeded (43 modules). Local PPM browser acceptance also passed for the mobile Components route and a desktop nested-component route. Generated static data and build artifacts are ignored.

## Remaining global certification work

- Apply and validate the separately approved Stackforge anti-slop TypeScript setup when the execution safety layer permits. Its Oxlint root setup is still not installed; do not claim certification.
- Close independent PPM/OrchestKit conformance standards with real evidence and PAO references, never fabricated approvals. This is separate from the three quality gates addressed here.

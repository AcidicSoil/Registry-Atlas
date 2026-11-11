# Script ownership

Registry Atlas is one application, not a workspace of independent packages. The root `scripts/` directory contains its operational commands.

## Entry points

Keep commands used by `package.json`, CI, and `scripts/project-tasks.mjs` at their existing paths until their callers are migrated together. A root script is an executable entry point, not an appropriate home for reusable domain logic.

Use package scripts for supported workflows, such as `pnpm build` and `pnpm prepare:runtime-data`.

## Source audits

`scripts/audits/` owns five commands:

- `audit-21st-reference.mjs` collects reference-site route evidence.
- `audit-21st-interactions.mjs` verifies observed interactions against that evidence.
- `audit-component-links.mjs` reviews component-link evidence before approved updates.
- `report-classification-drift.mjs` lists changed and missing reviewed identities without updating the database.
- `reconcile-catalog-queue.mjs` reconciles all affected current-source registries, verifies deterministic decisions, and retires obsolete or unverified approvals atomically. Dry-run is the default.

The existing `.d.mts` declarations remain beside their matching implementations. The tests in `tests/registry-explorer/` import the modules directly. The commands are not exposed by `package.json` or CI; run them using their new `scripts/audits/` paths.

The source audits reuse the existing browser and persistence utilities from `scripts/` and `scripts/lib/`. Do not duplicate those utilities or introduce forwarding wrappers at the old script paths.

## Registry discovery

`scripts/discovery/` groups the six directly related discovery commands: `discover-registry-components.mjs`, `discover-registry-routes.mjs`, `schedule-registry-discovery.mjs`, `crawl-component-links.mjs`, `derive-registry-traversal-patterns.mjs`, and `recover-item-evidence.mjs`. Their shared browser and database utilities remain in `scripts/` and `scripts/lib/`.

The root-level discovery commands remain in place where package scripts, mise tasks, or operator documentation depend on their paths. Run the six moved commands under `scripts/discovery/` when invoking them directly. Tests remain in `tests/registry-explorer/`; no compatibility wrappers were added.

## Classification implementation

`scripts/lib/classification/` owns five private modules: `state.mjs` normalizes classification inputs, `classifier.mjs` resolves categories and fingerprints, `overlay.mjs` projects reviewed decisions, `reconciliation.mjs` plans current-source changes, and `approval-storage.mjs` persists retirement and revalidation evidence. The shared taxonomy and PostgreSQL adapter stay at their existing paths in `scripts/lib/`.

Operational commands remain in `scripts/` and `scripts/audits/`. Existing `tests/registry-explorer/` placement is retained; there are no old-path re-export wrappers. Old historical planning files still describe the paths that existed when those plans were written.

## Reviewed root commands (2026-11-10)

All **33** root `scripts/*.mjs` entrypoints were inventoried against package commands, mise tasks, CI workflow references, active script imports, tests, and operator documentation. This is an **ownership/caller audit**, not a claim that every operational command has been executed against a live service. Do not rehome entrypoints solely to shorten the root: the root path is part of the invocation contract for package, CI, operator, or recovery workflows.

| Ownership                           | Root commands                                                                                                                                                                                                                                                                                                                                             | Decision                                                                                                                                                                         |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Database and recovery (4)           | `manage-local-postgres`, `migrate-postgres-schema`, `migrate-sqlite-to-postgres`, `import-registry-catalog`                                                                                                                                                                                                                                               | Retain root CLI boundaries. SQLite migration is intentional one-time recovery, **not** an active store or runtime fallback.                                                      |
| Publication and synchronization (6) | `build-runtime-data`, `create-pages-spa-fallback`, `generate-sbom`, `reconcile-runtime-source-evidence`, `sync-shadcn-registries`, `sync-registry-catalog-evidence`                                                                                                                                                                                       | Keep source-aware generation and synchronization commands stable; data/persistence reuse belongs in `scripts/lib/`.                                                              |
| Classification (3)                  | `classify-registry-catalog`, `evaluate-catalog-classifications`, `promote-catalog-classifications`                                                                                                                                                                                                                                                        | Preserve distinct evaluation and reviewed-promotion gates; domain logic already lives in `scripts/lib/classification/`.                                                          |
| Discovery and evidence (6)          | `build-source-page-index`, `collect-browser-link-evidence`, `discover-registry-icons`, `import-official-sitemap-surveys`, `survey-registry-catalog-structure`, `survey-registry-sitemaps`                                                                                                                                                                 | Retain operator entrypoints and share discovery utilities with `scripts/discovery/`; the browser collector has active audit/discovery callers.                                   |
| Validation and quality (14)         | `check-browser-acceptance`, `check-commit-message`, `check-postgres`, `check-product-contract`, `check-quality-debt`, `check-runtime-data`, `project-tasks`, `validate-registry-data`, `verify-anti-slop-gate`, `verify-complexity-gate`, `verify-component-pages`, `verify-deep-module-boundaries`, `verify-oxfmt-migration`, `verify-registry-patterns` | Keep package/CI/test-adapter paths stable. `check-browser-acceptance` needs explicitly configured PinchTab server/tab; quality and migration checks remain separately invocable. |

**Findings:** No root CLI was proven dead or duplicate solely from its file location. The historical SQLite import remains a recovery command; removing it would discard a restoration path. The documented `scripts/audits/` and `scripts/discovery/` groupings already provide private-domain separation without breaking entrypoints. Reuse the existing modules and test contracts rather than adding aliases or a second script manifest.

Recheck ownership with `find scripts -maxdepth 1 -name '*.mjs' -print`, `rg -F '<entrypoint>.mjs' package.json mise.toml .github scripts tests docs`, and the relevant scoped tests before changing any command path.

## Remaining work

The root-command ownership review is complete. Any future move requires a concrete duplicated implementation, dependency violation, or broken contract, plus caller migration and scoped regression coverage; a directory's file count is not sufficient evidence. This does not certify each command's external provider behavior or refresh historical PPM standards inventories.

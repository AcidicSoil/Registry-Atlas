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

## Remaining work

Other operational entry points remain in `scripts/` until each domain group has a verified dependency map. Candidate groups include database maintenance, release generation, and quality checks. Moving a command requires updating its callers, its declaration file if present, import paths, documentation, and scoped tests in the same change.

This reorganization does not change the historical implementation plans in `docs/superpowers/` or the PPM standards inventory.

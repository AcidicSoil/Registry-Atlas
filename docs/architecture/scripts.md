# Script ownership

Registry Atlas is one application, not a workspace of independent packages. The root `scripts/` directory contains its operational commands.

## Entry points

Keep commands used by `package.json`, CI, and `scripts/project-tasks.mjs` at their existing paths until their callers are migrated together. A root script is an executable entry point, not an appropriate home for reusable domain logic.

Use package scripts for supported workflows, such as `pnpm build` and `pnpm prepare:runtime-data`.

## Source audits

`scripts/audits/` owns three commands:

- `audit-21st-reference.mjs` collects reference-site route evidence.
- `audit-21st-interactions.mjs` verifies observed interactions against that evidence.
- `audit-component-links.mjs` reviews component-link evidence before approved updates.

Their `.d.mts` declarations remain beside their implementations. The tests in `tests/registry-explorer/` import the modules directly. The commands are not exposed by `package.json` or CI; run them using their new `scripts/audits/` paths.

The source audits reuse the existing browser and persistence utilities from `scripts/` and `scripts/lib/`. Do not duplicate those utilities or introduce forwarding wrappers at the old script paths.

## Remaining work

Other operational entry points remain in `scripts/` until each domain group has a verified dependency map. Candidate groups include catalog classification, discovery, database maintenance, release generation, and quality checks. Moving a command requires updating its callers, its declaration file if present, import paths, documentation, and scoped tests in the same change.

This reorganization does not change the historical implementation plans in `docs/superpowers/` or the PPM standards inventory.

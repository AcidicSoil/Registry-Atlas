# Registry Atlas data

**PostgreSQL is the only authoritative database.** The Neon project is `Registry Atlas` (ID `jolly-scene-27028293`), schema `atlas`. It contains 23 imported tables, including catalog items, item details, taxonomy, classification state, verified source pages, and crawled evidence.

## Website data

GitHub Pages is static. The build queries PostgreSQL using a server-side `DATABASE_URL` and creates two disposable compressed JSON assets in `public/data/`:

- `registry-atlas.json.gz` has the compact catalog, taxonomy, registry mirror, and source-page links.
- `registry-details.json.gz` has item detail payloads; browsers fetch this only when viewing an item.

The generated assets do **not** use SQLite or expose database credentials. Files in `public/data/` are ignored by Git.

## Local commands

```sh
pnpm install
pnpm check:postgres
pnpm prepare:runtime-data
pnpm dev
pnpm verify
```

Store the Postgres URL in `DATABASE_URL` or the ignored, mode-600 `.instance/neon-database-url`. For deployed builds, the GitHub Actions secret `REGISTRY_ATLAS_DATABASE_URL` uses a read-only PostgreSQL role.

The builder also generates `.instance/atlas-test-documents.json` for deterministic test fixtures. This is a disposable test output, not a second database.

## Important: legacy maintenance commands

The existing crawler, route verifier, catalog classification, and synchronization writers still use the old SQLite API. **Do not use those writers against an empty local SQLite cache**. They have not been ported to PostgreSQL; their output will not update the authoritative Neon database.

The old SQLite schema and migration utilities are retained only as reference and import tooling. They do not run in normal development, website builds, or deployment. A local SQLite recovery source remains in the ignored `.instance/` directory, and previous Git commits contain original snapshots.

Migrating every legacy writer and restoring the deeper SQLite-specific validations is outstanding work. Do not classify that maintenance workflow as complete.

## Storage and recovery

There is no Git LFS file in the current tree and no canonical database in Git. PostgreSQL provides transactions and managed backup/recovery options. Keep independent exports when required by the project's recovery policy, and test restores before deleting the last known-good source. No new shadow JSON database or release-asset publication system is required.

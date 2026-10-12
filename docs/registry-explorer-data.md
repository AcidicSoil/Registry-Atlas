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

## PostgreSQL maintenance

Maintenance commands use the PostgreSQL data layer `scripts/lib/atlas-postgres.mjs`
with normal PostgreSQL transactions. CLI scripts update the canonical database for:

- registry directory and catalog synchronization, catalog imports, and icon discovery
- registry route patterns, crawler observations, and component URL verification
- classification batches, decision outcomes, evaluated overlays, and promotion
- exact source-page evidence and linked operational reports

Run `pnpm migrate:postgres-schema` to apply route uniqueness, foreign keys,
ID sequences, and defaults after an initial import. Run
`pnpm check:postgres`, `pnpm check:product-contract`, and `pnpm validate:data`
to check authoritative data before building the site.

Use writable database credentials only in the maintenance environment.
GitHub Actions uses a read-only `REGISTRY_ATLAS_DATABASE_URL` secret for site
generation and a separate, isolated writable test database
(`REGISTRY_ATLAS_TEST_DATABASE_URL`) for database integration tests.
Tests create and remove disposable PostgreSQL schemas; they must not modify
production catalog records.

The SQLite import utility remains for one-time import of historical snapshots.
It does not participate in current updates or website builds.

## Storage and recovery

There is no Git LFS file in the current tree and no canonical database in Git. PostgreSQL provides transactions and managed backup/recovery options. Keep independent exports when required by the project's recovery policy, and test restores before deleting the last known-good source. No new shadow JSON database or release-asset publication system is required.

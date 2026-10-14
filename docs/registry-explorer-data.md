# Registry Atlas data

**PostgreSQL is the only authoritative database.** The Neon project is `Registry Atlas` (ID `jolly-scene-27028293`), schema `atlas`. It contains 23 imported tables, including catalog items, item details, taxonomy, classification state, verified source pages, and crawled evidence.

## Website data

GitHub Pages is static. An explicit runtime refresh queries PostgreSQL using a server-side `DATABASE_URL` and creates two disposable compressed JSON assets in `public/data/`:

- `registry-atlas.json.gz` has the compact catalog, taxonomy, registry mirror, and source-page links.
- `registry-details.json.gz` has item detail payloads; browsers fetch this only when viewing an item.

The generated assets do **not** use SQLite or expose database credentials. Files in `public/data/` are ignored by Git.

## Local commands

```sh
pnpm install
pnpm dev                    # Use existing local runtime assets; no database connection
pnpm verify:local           # Local snapshots, non-database tests, and build without Neon
pnpm prepare:runtime-data   # Explicitly refresh the runtime assets from PostgreSQL
pnpm verify                 # Refresh once, then run all local and database checks
```

Store the Postgres URL in `DATABASE_URL` or the ignored, mode-600 `.instance/neon-database-url`. For deployed builds, the GitHub Actions secret `REGISTRY_ATLAS_DATABASE_URL` uses a read-only PostgreSQL role.

The builder also generates `.instance/atlas-test-documents.json` for deterministic test fixtures. This is a disposable test output, not a second database.

The `predev`, `pretest`, and `prebuild` hooks validate these three existing files instead of exporting the entire remote database on every invocation. They fail with an explicit missing/corrupt-artifact error rather than silently using incomplete files. The checked-in repository does not contain these ignored snapshots, so the first setup and CI still require one explicit refresh from PostgreSQL. The deployment workflow invokes `pnpm verify`, which refreshes **once** and runs the database gates. When the remote database quota is exhausted, local development and `pnpm verify:local` can continue using a valid previously generated snapshot. The local verification command intentionally excludes the database-integration test suites and the database-backed product-contract/data-validation checks; it cannot certify authoritative PostgreSQL state; `pnpm verify` still runs those suites and the database checks. Remote validation and deployment remain blocked until the database is available again.

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

### Fresh original-page discovery

1. Start the approved `registry-atlas-source-audit` profile and inspect its **current** instance URL. Do not reuse an old port or tab ID.
2. Run `node scripts/survey-registry-sitemaps.mjs --profile registry-atlas-source-audit --server <current-instance-url> --output-dir "$PWD/.instance/source-sitemaps" --max-registries 408`. Continue from its reported `nextCursor` until every currently eligible official registry has been surveyed. Use `--registry @namespace` to refresh one source.
3. Review survey errors and results. Run `node scripts/import-official-sitemap-surveys.mjs "$PWD/.instance/source-sitemaps" --dry-run`, then omit `--dry-run` to atomically import only eligible official URLs. Conflicting older URLs are held for investigation. It **never** erases route patterns, redoes the SQLite migration, or promotes a sitemap candidate to individually verified status.
4. Run `node scripts/build-source-page-index.mjs`, then `pnpm prepare:runtime-data` to rebuild the disposable static assets.

The importer stores a separate current sitemap catalog fingerprint in PostgreSQL so newer sitemap evidence does not incorrectly revalidate historic route-pattern observations. Official `https://www.` canonical redirects may be followed only when the origin responds with a permanent 308 to the identical sitemap path; the published same-origin link remains a provisional sitemap link. If a source does not publish an item-level page, keep it unresolved. Its installable registry JSON is **not** a human-readable source page.

The SQLite import utility remains for one-time import of historical snapshots.
It does not participate in current updates or website builds.

## Storage and recovery

There is no Git LFS file in the current tree and no canonical database in Git. PostgreSQL provides transactions and managed backup/recovery options. Keep independent exports when required by the project's recovery policy, and test restores before deleting the last known-good source. No new shadow JSON database or release-asset publication system is required.

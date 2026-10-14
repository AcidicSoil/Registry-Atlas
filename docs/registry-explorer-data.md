# Registry Atlas data

**The authoritative database is self-hosted PostgreSQL 18.** The service runs under Docker Compose on this machine, bound only to `127.0.0.1:55432`. All 23 Atlas tables, classification records and evidence are stored in a persistent Docker volume. No managed database or paid provider is used by any supported command.

## Runtime assets

The website is static. An explicit PostgreSQL export produces two compressed JSON files in `public/data/`:

- `registry-atlas.json.gz` contains the registry mirror, catalog, taxonomy, and source-page evidence.
- `registry-details.json.gz` contains exact item details, loaded lazily by the browser.

These files are ignored by Git and contain no credentials. The builder also creates `.instance/atlas-test-documents.json` for tests. Browser routes do not connect to PostgreSQL.

## Common commands

```sh
pnpm db:setup              # Create owner-only local credentials if needed
pnpm db:up                 # Start the local PostgreSQL container
pnpm db:status             # Check container health
pnpm dev                   # Start Vite using existing local assets
pnpm prepare:runtime-data  # Explicit refresh from local PostgreSQL
pnpm verify:local          # Offline subset: local assets, non-DB tests, build
pnpm verify                # Full local PostgreSQL checks, all tests, and build
pnpm db:backup             # Produce and verify a timestamped PostgreSQL dump
pnpm db:down               # Stop container without deleting its volume
```

The PostgreSQL URLs are stored in ignored, mode-600 files under `.instance/`: `local-postgres-url` for the authoritative database and `local-postgres-test-url` for the isolated test database. All database entrypoints reject non-loopback connections. Legacy provider credential files are ignored and never read.

The local test database must contain the same schema as the authoritative database, but no production records. A fresh machine can create it after restoring the authoritative database:

```sh
docker exec registry-atlas-local-database-1 createdb -U atlas -O atlas atlas_test
docker exec registry-atlas-local-database-1 pg_dump -U atlas -d atlas --schema=atlas --schema-only --no-owner | docker exec -i registry-atlas-local-database-1 psql -v ON_ERROR_STOP=1 -U atlas -d atlas_test
```

## Recovery and backups

Historical, pre-provider SQLite files can be extracted from commit `42f3c2a^`. The one-time SQLite importer accepts separate core and detail files in `.instance/legacy-recovery/` and refuses to overwrite an existing `atlas` schema. The local recovered PostgreSQL database was reconciled against the latest available runtime snapshot using `scripts/reconcile-runtime-source-evidence.mjs`, with a dry-run before `--apply`.

The two regenerated compressed runtime files match the previous runtime files byte-for-byte. The recovered database contains 91,716 catalog/detail pairs and 46,390 source-page records. Historical operational records outside those runtime files cannot be independently compared with the former provider while it is unavailable.

`pnpm db:backup` writes a custom-format `pg_dump` to `.instance/backups/`, verifies the dump structure, and never deletes earlier backups. Verify that a backup is restorable with `pnpm db:restore-check -- /absolute/path/to/backup.dump`; this restores into a temporary database, checks record counts, then removes only that temporary database. Override the backup location with `ATLAS_BACKUP_DIR` for an external disk.

**A backup stored only on the same WSL disk is not disaster recovery.** Schedule external/off-device copies and regularly test those copies before relying on the restored database for permanent writes. The workstation has limited available free storage; monitor it and do not enable unbounded local data accumulation.

## CI and publishing

The public repository's hosted CI runs code-quality checks without accessing local PostgreSQL. Automatic Pages deployment is paused while a trusted release path is configured. The last successfully deployed site remains online. Do **not** put the database credentials or an unrestricted self-hosted runner into a public pull-request workflow. GitHub's security guidance warns that self-hosted runners in public repositories can be compromised by untrusted PR code.

A future trusted publisher must build from the local authoritative database, validate the generated artifacts, and publish the static `dist/` output without exposing PostgreSQL. The site's hosting provider may impose limits even though the database itself has none.

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

Maintenance connects only to the loopback-bound PostgreSQL service. Database integration tests use the separate local `atlas_test` database, create temporary schemas there, and remove them after each suite. They must not modify production catalog records. Public GitHub-hosted CI does not connect to the workstation database.

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

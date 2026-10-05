# Registry Atlas — SQLite route-pattern verification and repair

**Status:** Implementation specification and operations guide, 2026-10-04. **Owner:** `scripts/verify-registry-patterns.mjs`. **Parent:** `2026-10-04-component-catalog-and-deep-links.md`. **Worktree:** existing `atlas-catalog-source-links`.

## Data ownership

The versioned **`data/shadcn/registry-patterns.sqlite`** is the durable route-pattern authority. Node 24 built-in `node:sqlite` is used without another database service or dependency. The historical 3.8 MB `registry-traversal-patterns.json`, the intermediate `verified-registry-pattern-links.json`, and the old committed unverified report have been imported and removed. SQLite has `sources`, `route_patterns`, `examples`, `pattern_checks`, `item_routes`, `sitemap_links`, and `metadata` tables.

**`public/data/component-page-links.json` stays:** Registry Atlas is a static Vite application. This one generated delivery artifact contains links and evidence tiers, never the SQLite database. Run `mise run source-pages` to regenerate it directly from the database. Source item JSON, the catalog, and verified visual evidence are separate upstream datasets; do not delete them as part of the route-pattern migration. A transient `.instance/registry-patterns.sqlite` was the initial migration scratch database, not the new source of truth.

Track the SQLite file in Git. Ignore `*.sqlite-wal` and `*.sqlite-shm`. Keep transactions short; do not run multiple writers. Commit a verified DB snapshot and the matching runtime generated link artifact together. Git binary diff size is the trade-off for versioning this file as requested; move the mutable DB to managed storage and publish a versioned snapshot if write concurrency or storage growth becomes significant.

## Verification loop

Use route patterns from real official navigation or sitemap evidence. For each registry, verify representative pages *per pattern family* (default two) instead of every catalog item. A page must be HTTPS, on the official origin, and show the expected item heading/title. Do not accept a raw install JSON, generic homepage, redirect or item from another registry.

Statuses distinguish `verified` route patterns, `pattern-observed` exact examples, `pattern-inferred` generated item URLs, and `unverified` unresolved item identities. An inferred URL is **not** an individually loaded page. Keep separate `reviewed`/ `sitemap`/ `pattern` evidence tiers in the static catalog and never label inferred destinations individually verified.

The repair logic is resumable in SQLite:
1. Select pending and expired patterns; when `--repair-failed` is supplied, also select prior failures below the attempt cap.
2. Check sample URLs through HTTP. For `identity-mismatch`, open the **same actual URL** with the authorized managed source browser; check the final URL, official origin and rendered heading after bounded hydration.
3. Record each result and failure in `pattern_checks`. Promote a family only when all samples pass, then resolve compatible identities. Multiple competing pattern families remain unverified unless exact observed evidence picks one.
4. For redirects, missing pages, multiple patterns, missing examples and persistent identity failures, publish a structured repair queue with strategy, homepage and representative URLs. A browsing agent or local LLM can propose a *new observed route family*; the deterministic verifier must still accept it. Do not transform repeated 404s into success.
5. Repeat up to `--passes`, `--max-registries`, `--max-attempts`, and `--delay-ms`. Exit when no eligible jobs remain. Recheck verified patterns when their 30-day evidence expires. Respect site rate limits and access policies; avoid mass requests to all 84k individual component pages.

## Commands

Run from the existing Registry Atlas worktree:

```bash
# Regenerate the static, checked source-link projection from SQLite.
mise run source-pages

# Export the current unresolved-registry list AND categorized pattern failures,
# without any network calls:
node scripts/verify-registry-patterns.mjs \
  --db data/shadcn/registry-patterns.sqlite --report-only \
  --report .instance/registry-pattern-unverified.json \
  --repair-report .instance/registry-pattern-repair-queue.json

# Automated bounded retry, using the authorized source-audit PinchTab profile:
node scripts/verify-registry-patterns.mjs \
  --db data/shadcn/registry-patterns.sqlite --verify-only --repair-failed \
  --profile registry-atlas-source-audit \
  --browser-server http://127.0.0.1:9877 \
  --browser-tab "$SOURCE_AUDIT_TAB" \
  --samples 2 --max-registries 5 --passes 10 \
  --max-attempts 3 --delay-ms 1200 \
  --report .instance/registry-pattern-unverified.json \
  --repair-report .instance/registry-pattern-repair-queue.json

# Then update the delivered static link bundle and verify app behavior:
mise run source-pages
mise run verify
```

Obtain `SOURCE_AUDIT_TAB` from the active `registry-atlas-source-audit` managed profile. Do not hard-code a tab in the product or relax the profile's allowed domains. The `--report-only` option is safe for inspection by a local decision model; a model is not authorized to mark a pattern verified.

## Current baseline and honest completion definition

The initial database migration recorded **408 registries, 938 patterns and 17,398 observed examples**. Before this repair increment, **364 patterns** were marked verified; **518 failed**, including **512 identity mismatches** that deserve browser fallback rather than repeated identical HTTP checks; **56** were pending/insufficient. The item-route table contained **20,169 observed or inferred assignments** and **63,976 unresolved**. A pattern failure may be caused by a JavaScript-hydrated page, a different visible title, an expired upstream page, a mislabeled source identity, or an access restriction; these cases require different remediation.

**Completion requires no unresolved valid item identities and no expired required patterns.** Inaccessible sources and changed/removed items must remain explicitly marked blocked or invalid rather than being counted as successful. Full destination-by-destination monitoring is separate from verification of registry URL templates. The runtime static JSON is an export, not a second source of truth.

## Verification and rollback

Tests cover nested and prefixed slugs, same-name different registries, ambiguous families, redirects, off-origin routes, JS-hydrated fallback with actual browser URL and heading checks, import idempotency, stale invalidation, failed retry caps, and SQLite artifact reproducibility. Run `mise run verify` and managed browser acceptance after changing published links.

To roll back, restore the prior versioned SQLite snapshot and regenerate `public/data/component-page-links.json`. Do not revert the underlying indexed catalog or erase audit failures merely because the source registry changes.

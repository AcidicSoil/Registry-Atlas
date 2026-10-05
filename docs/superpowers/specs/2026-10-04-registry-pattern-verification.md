# Registry Atlas — pattern verification and unresolved source routes

**Status:** Implemented in the existing `atlas-catalog-source-links` worktree. This note extends `docs/superpowers/specs/2026-10-04-component-catalog-and-deep-links.md`, without creating a new application, crawler, or worktree.

## Goal

Stop treating the 3.8 MB traversal-pattern JSON as the mutable authority. Import its one-time discovery facts into a persistent local SQLite database, verify *representative routes per pattern*, resolve the indexed component URLs that match exactly one verified pattern, and publish a smaller static link projection for the Vite catalog.

A verified **pattern** is not proof that every inferred destination was loaded. Keep the UI label `View pattern-matched page`, and retain individual reviewed or sitemap-listed links as stronger, distinct evidence.

## Implementation

The owner is `scripts/verify-registry-patterns.mjs`, using Node 24's built-in `node:sqlite`. No server or package dependency is introduced. The SQLite tables are:

- `sources`: official namespace, HTTPS homepage, catalog identity fingerprint;
- `route_patterns`: exact per-registry URL template, optional catalog-name prefix, provenance, verification status, check time, failure reason;
- `examples`: exact publicly published URL examples matched to indexed identities;
- `sitemap_links`: exact official-sitemap links, observed time and source identity; the legacy traversal JSON is migrated once rather than consulted on normal publications;
- `metadata`: original source snapshot timestamp for reproducible exports;
- `pattern_checks`: stored representative HTTP/content/identity checks;
- `item_routes`: one record per exact namespace + full slug, with a URL only when the pattern assignment is unambiguous.

Repeated imports preserve verified patterns when their source inputs match. Changed catalog fingerprints or example sets reset the affected verification status; generated URLs are recomputed in transactions. A failed check is retained instead of blocking future registries. Network checks have a bounded timeout and reject redirects, non-HTML replies, unexpected rendered page identities, foreign HTTPS origins and raw JSON.

The verifier uses at least two representative examples by default. A registry may have several route families: `/components/{slug}`, `/docs/{slug}/`, `/blocks/{slug}`, or `/docs/{leaf}` with a catalog-specific prefix. It verifies each family separately. **Ambiguous item-to-pattern assignments remain unresolved.** It does not paste an arbitrary pattern over every component.

## Commands

Run from the project checkout (or its existing worktree), using its managed Node installation:

```bash
node scripts/verify-registry-patterns.mjs \
  --db .instance/registry-patterns.sqlite \
  --inventory data/shadcn/registry-traversal-patterns.json \
  --catalog public/data/registry-catalog-items.json \
  --raw data/shadcn/registries.raw.json \
  --import-only \
  --report data/shadcn/registry-pattern-unverified.json \
  --links data/shadcn/verified-registry-pattern-links.json

# All later batches read SQLite directly; legacy JSON is no longer needed for verification.
node scripts/verify-registry-patterns.mjs \
  --db .instance/registry-patterns.sqlite --verify-only \
  --max-registries 20 --samples 2 \
  --report data/shadcn/registry-pattern-unverified.json \
  --links data/shadcn/verified-registry-pattern-links.json

mise run source-pages
mise run verify
```

A single registry can be retried with `--verify-only --registry @name`. The initial `--import-only` is an explicit one-time migration or a refresh after upstream catalog changes; later `--verify-only` runs use the database without reparsing the legacy traversal JSON. The source-page generator also reads exact sitemap links from the SQLite export, not the legacy file. It falls back to the legacy file only when no SQLite export exists. The automatic queue skips fresh verified and failed patterns, as well as patterns with fewer than two exact examples; it rechecks verified patterns when their 30-day evidence window expires. A failed pattern requires explicit retry after examining the stored failure reason. The process can restart from its SQLite file rather than revisit successful patterns. Keep the SQLite file and its WAL under the ignored `.instance/` directory, not in Vite's public assets.

`data/shadcn/verified-registry-pattern-links.json` and `public/data/component-page-links.json` are **derived publication artifacts**, not the durable authority. The loader validates every published URL against the originating official registry. Pages with no safe evidence remain navigable internally and have no fabricated source link.

## Remaining automation queue

`data/shadcn/registry-pattern-unverified.json` lists each registry still needing route coverage, with its homepage, pattern count and unresolved item count. The inspected batch verified 364 of 938 recorded patterns and left 56 without enough examples and 518 with failed checks. Counts change as sources are verified or renewed. It is intentionally a structured handoff for a managed browsing agent or local-LLM-assisted discovery.

For each unresolved registry:

1. Open the official homepage in the authorized source-audit browser. Observe the actual menu/link to its components, docs, blocks or registry listing.
2. Find one or more exact indexed component links in the page DOM or official sitemap. Group observed links by URL template and catalog-name prefix. An LLM may propose the family, but **cannot mark it verified**.
3. Submit at least two different examples for deterministic destination checking. Accept the template only when the final HTTPS origin and rendered component heading/title match the exact indexed identity.
4. Store the confirmed pattern and example evidence in SQLite. Recompute only that registry's compatible item routes. Where a registry uses multiple equally applicable patterns, observe the category/route mapping or leave those identities unresolved.
5. Requeue timeouts, anti-bot pages, ambiguous patterns and mixed-source conflicts with explicit reasons. Use bounded work batches and source-site access policy. Do not silently treat failure as deletion.

**Completion criterion:** no unresolved catalog identities remain and every published external URL is either individually reviewed, source-listed, or generated from a currently verified unambiguous routing family. This does not require HTTP-loading all 84k pages. Full per-page validity would be a separate monitoring/spot-check contract, not evidence obtained from the pattern check alone.

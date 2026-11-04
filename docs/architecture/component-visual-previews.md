# Component visual previews

**Implementation:** Provider-neutral source media (2026-11-04). Visual evidence is an optional static artifact; it is not a source of navigation or catalog identity.

## Ownership

| Source                                           | Responsibility                                                          |
| ------------------------------------------------ | ----------------------------------------------------------------------- |
| PostgreSQL `atlas_source_pages`, `item_routes`   | Authoritative item-specific original-page URLs                          |
| `scripts/build-runtime-data.mjs`                 | Export PostgreSQL source evidence to `registry-atlas.json.gz`           |
| `scripts/collect-source-media.mjs`               | Bounded offline retrieval and image validation from current source URLs |
| `scripts/lib/source-media.mjs`                   | Provider-independent public URL, image metadata and response checks     |
| `public/data/source-media.json`                  | Published, versioned, exact source URL → image evidence                 |
| `src/registry-explorer/ui/sourceMedia.ts`        | Validate the media manifest and expose exact URL lookup                 |
| `src/registry-explorer/ui/catalogLinkPreview.ts` | Responsive pointer/focus tooltip, with unchanged anchor navigation      |
| `src/registry-explorer/ui/sourcePageLink.ts`     | Validated original-page navigation and truthful provenance labels       |

The old provider-specific `upstreamVisualPatterns.ts`, `aceternityVisualEvidence.ts`, and `collect-aceternity-visuals.mjs` have been removed. There is no hostname switch or provider-specific URL formula in the frontend or collector.

## Evidence flow

```text
PostgreSQL source-page and route evidence
    → explicit runtime snapshot export
    → offline collector (bounded page requests)
    → upstream og:image / twitter:image candidate
    → exact item-slug comparison + image response checks
    → deduplicate shared assets
    → versioned source-media.json
    → browser exact URL lookup
    → verified image or no preview
```

`source-media.json` has `schemaVersion: 1` and `previews` keyed by **canonical source URL**. Each entry stores `mediaUrl`, `method` (`page-metadata` or `verified-legacy`), and `checkedAt`. Invalid or duplicated image references are excluded at browser load. The browser only fetches the manifest and chosen image; it does not crawl upstream websites or call a database, model, or screenshot service on hover.

## Refresh

```bash
pnpm prepare:runtime-data
pnpm collect:source-media --max-pages=50
# To recheck previously accepted pages:
pnpm collect:source-media --max-pages=50 --refresh
```

The default budget is 50 source pages, six concurrent requests, ten seconds per page request and eight seconds per image check. The collector validates HTTPS public hostnames, refuses redirects, bounds HTML to 2 MiB and images to 5 MiB, verifies image MIME, rejects unmatched slugs and shared image URLs, and writes per-run rejection counts to ignored `.instance/source-media-audit.json`. It retains accepted evidence when a refresh fails and drops media entries whose source URLs no longer appear in the runtime snapshot. Passing slug and MIME checks is evidence of an item-specific _candidate_, not independent screenshot/pixel verification.

If `content-length` is absent, a bounded image GET is used to confirm actual bytes; unknown or oversized responses are rejected. Some upstream websites block metadata collection and some images may disappear later; absence or load failure must remain a normal no-preview state. The existing collector intentionally prioritizes correctness over coverage.

## Preserved legacy evidence

Migration retained 227 exact source/image records from the former Aceternity evidence table, and nine previously tested URL-rule examples after live image-response checks: **236 records** in the initial published manifest. The seven individually observed Space UI documentation anchors were added to `atlas_source_pages` in PostgreSQL as `level: observed`, `source: documented-anchor`; they are now resolved by the same generic source-navigation path as any other registry.

Previously inferred image formulas do **not** automatically become verified rows. This intentionally reduces preview coverage until more source pages have been checked. The first 12 generic collection attempts returned `unreadable-page` and added zero images; this does not establish that those items have no images. The collector must be run explicitly when refreshing coverage, and its report must distinguish examined, accepted, rejected, deduplicated, and unexamined sources.

## UI and security contracts

- A source link keeps its original `href`; no media lookup rewrites navigation.
- Unknown, missing, rejected, unsafe, duplicated, and failed-loading imagery produces no tooltip.
- Focus and pointer hover share a visual; Escape, scroll, focus loss and mouseout dismiss it.
- Narrow/touch layouts avoid floating pointer previews. The tooltip never intercepts link clicks.
- Remote SVG content is loaded only through `<img>`, never injected as raw HTML.
- Collector input is upstream, untrusted data. Its hostname checks are not a complete guarantee against DNS rebinding; the collector is an explicit local maintenance command, not a publicly reachable URL-fetch endpoint.

## Verification

Run the impact-scoped tests: `sourceMedia.test.ts`, `sourceMediaCollector.test.ts`, `catalogLinkPreview.test.ts`, `sourcePageLink.test.ts`, `sourcePageLoader.test.ts`, `catalogSourcePage.test.ts`, relevant catalog render tests and selected browser tests after a fresh production build. Inspect `source-media-audit.json` before stating coverage numbers. The complete provider corpus has **not** been independently visually verified.

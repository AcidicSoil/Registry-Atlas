# Registry Atlas component catalog and verified upstream deep links

**Status:** Implementation specification, 2026-10-04. **Parent:** `2026-10-03-observed-reference-and-route-parity.md`. **Execution:** `docs/superpowers/plans/2026-10-03-observed-reference-and-route-parity.md` and the separate corrective implementation plan discussed with the requester. This specification consolidates their compatible requirements; it does not supersede the broader full-parity goal.

**Subsequent scope decision (2026-10-04):** The requester explicitly extended this first-slice contract to all applicable item routes and approved a persistent SQLite registry-pattern database. The earlier restrictions below against a database and against publishing non-individually-reviewed links apply only to the original first slice. The controlling extension is `2026-10-04-registry-pattern-verification.md`: separately label reviewed, official-sitemap, and pattern-matched destinations. Never represent pattern-matched pages as individually page-verified.

## Purpose and source authority

Improve the existing Registry Atlas catalog, rather than build a second application, registry crawler, database or preview host. The current shadcn directory, exact catalog identities, same-origin bundles, evidence journals, capture pipeline, isolated demo compiler and vanilla TypeScript/Vite interface remain authoritative.

An original component page is a different resource from an installable registry item JSON. Both may be useful, but neither can substitute for the other. Never produce a documentation URL by concatenating a registry homepage, category and slug. Preserve source facts and disclose evidence gaps.

## User stories

1. As a visitor, I want to browse real components by registry and source-backed category so I can find appropriate assets.
2. As a visitor, I want a gallery card to open the correct Registry Atlas detail route so I can inspect a component without leaving Atlas.
3. As a visitor, I want a separate **View original component** action when its exact upstream page is verified so I can inspect its presentation on its home registry.
4. As a visitor, I want a distinct **View registry** action so I can navigate to its source library even if a component page remains unverified.
5. As a visitor, I want the source JSON and install command to remain separate from the human-facing component page so I do not mistake raw data for a rendered demo.
6. As a visitor, I want the same original-page destination on a gallery card and its detail page so navigation is consistent across Home, Components, collections and registry profiles.
7. As a visitor, I want unverified, missing, stale and blocked pages represented truthfully rather than linked to a guessed route.
8. As a visitor, I want image-only examples to remain distinct from interaction-verified upstream demos.
9. As a maintainer, I want exact namespace and full-slug lookups, including nested slugs, so another registry's matching component name cannot contaminate an item.
10. As a maintainer, I want audited URL evidence published through a bounded, deterministic artifact so verified source-page coverage can grow without altering raw catalog identity.
11. As a maintainer, I want source-category labels and author strings preserved without invented creator accounts, rankings or inferred family membership.
12. As a maintainer, I want duplicate rows and failed source refreshes reported without inflated browse totals or loss of last-known good entries.

## Existing architecture and boundaries

The main index is `public/data/registry-catalog-items.json`, loaded by `data/loadRegistries.ts`. The canonical identity is `namespace + '/' + full item.name`. Navigation is owned by `core/catalogRoutes.ts`, `core/catalogQuery.ts` and `ui/shell.ts`. The card owner is `ui/catalogComponentsView.ts`; it is reused by Home, Components, collection and registry routes. The detail owner is `core/registryItemDetail.ts` plus `ui/itemDetailView.ts`. Source link review already exists in `scripts/audit-component-links.mjs` and `data/shadcn/registry-component-url-patterns.json`. Do not duplicate these as competing authoritative stores.

The local catalog contains 408 directory registries and 84,153 indexed rows at the inspected commit `4bb18cd`. Counts describe that snapshot, not current verification coverage. `src/registry-explorer/data/component-demo-manifest.json` contained 26 upstream-built, interaction-verified records. The image manifest had seven rows. The evidence ledger remains the authority for validity, freshness and current per-item verification.

## Contract A: exact original-page links

**Identity:** `{ namespace: string; slug: string }`, preserving full nested slugs. Never use title or final path segment as the lookup key.

**Source preference:** prefer a reviewer-confirmed exact page URL from a dedicated evidence map, then an exact original-page URL from a current reviewed visual reference, then an explicit reviewed summary `docsUrl`, then the exact original-page URL in a reviewed upstream-built demo manifest. A source-provided JSON item route is not a documentation-page URL. If two independently valid records disagree, block the link and report the conflict for review rather than choosing an arbitrary winner.

**Validation:** every candidate must be absolute public HTTPS without credentials, nonstandard ports or unsafe hosts. The rendered destination must belong to the corresponding official registry's approved site origin or a documented reviewed exception. It must not be the registry's generic homepage or a raw JSON route. A reviewed match requires an observed final URL and the original page's matching component identity; HTTP status or sitemap candidate alone is insufficient. Recheck stale evidence before publishing. An image may be shown only when its separate visual evidence allows it.

**Publication:** a compact, versioned source-page index may be produced *only from reviewed items*, with one entry per exact identity and checked URL; include the evidence source, observed date and registry homepage. No duplicate, orphan, ambiguous or unsafe record is publishable. The loader treats missing index files as an empty optional enhancement. Preserve previously verified items when refreshing unrelated registries; a failed refresh does not imply deletion. Do not copy private browser captures into the client artifact.

**Gallery:** internal card navigation is unchanged. A distinct `View original` link appears only for a verified documentation page; a `View registry` link may use a validated official homepage. A verified upstream source JSON route may appear as `View item JSON` only where appropriate, distinctly labeled. Component preview controls and nested external links never activate the internal card route. Follow `rel="noreferrer noopener"` and open verified originals separately.

**Detail:** show the verified original page as a named separate link, even when no image exists. The official registry homepage remains accessible in the detail's Source section. Distinguish `Official component page`, `Registry homepage` and `Installable item JSON`. Do not emit an empty or disabled fake link when documentation is unresolved. Retain copy/install behavior.

**Deep-link scope:** every existing route that reuses `renderCatalogComponentCard` gets the same external-link contract. Registry-profile inventory and related-item cards should expose the matching verified page, when present. Add no new unreviewed source-page route to the public catalog.

## Contract B: catalog integrity and taxonomy

Deduplicate for public counts by `(namespace, full item.name)`, preserving raw duplicates in the integrity report. Do not silently choose conflicting source metadata. Keep category facts separate from UI presentation labels. A small reviewed mapping may group explicitly tagged blocks into Marketing Blocks and UI Components; untagged items remain discoverable. Facet union is OR within a dimension and AND across dimensions. Category and author counts refer to distinct catalog identities, not previews or raw source rows. Maintain URL round trips, deterministic ordering, pagination, keyboard and mobile navigation.

## Contract C: actual examples and safe previews

Source discovery -> reviewed license and dependency policy -> immutable isolated source build -> component-specific browser gesture -> interaction-verified manifest. A published screenshot, source-informed fixture or successful build does not satisfy functional verification. Keep preview bundles isolated with the existing CSP, no network and sandbox without `allow-same-origin`. Do not promote source hashes, source URLs or screenshots into runnable status without direct evidence. Preserve verified items when new batches fail.

## Contract D: search, source sync and route parity

Reuse `core/catalogQuery.ts` and existing on-device lexical index. First improve exact identity matching and duplicate counting, then measure queries before adding another search service. Reuse existing fetch/merge and journal processes; legitimate empty catalogs differ from transient errors. Current product contract retires unsupported Featured/Newest rankings. Preserve that rule until an explicit editor-selection or upstream publication-time source changes it. Authors means named source attributions, not publisher accounts. Account, bookmark, commerce, theme editor and unsupported framework parity remain separate independently approved work.

## Release gates

- Failing-before-fix tests cover exact reviewed link in card and detail, nested slug, different registries sharing the slug, malicious URL, mismatched homepage, raw JSON destination, missing evidence, conflicting evidence, source link without an image and internal card activation.
- Test category counts and duplicate projection against fixtures; no existing indexed row is removed from raw evidence.
- Run focused Vitest files and `mise run verify` through the project toolchain. No automatic live upstream sync during tests.
- Run managed `registry-atlas` browser journeys for Home -> Components -> registry profile -> detail -> original link -> browser Back/Forward/reload at desktop and 390px mobile, checking focus, console and network.
- Publish a coverage ledger separating indexed, page-observed, image-verified, built-unverified, interaction-verified, stale and blocked. Never claim all 84,000+ items have live previews because a sample works.
- Verify `git diff --check`, no unrelated worktree changes, and PAO completion. Commit independently testable slices, not a broad speculative rewrite.

## Out of scope for the first executable slice

No database migration, generic crawler, automatic guessed documentation links, source-code execution without review, new dependency resolver, new user accounts, fake trending metadata, icon-only catalog, universal theme editor or copied 21st.dev private data. Existing broad route/preview parity remains open until the separate per-feature and per-identity gates pass.

## Ownership and rollback

Deep-link link resolution stays near the existing query/detail projection; rendering stays in existing card and detail views. Adding an optional manifest requires a versioned loader and a no-manifest fallback. Revert the new resolver/view changes to restore previous route behavior without rewriting catalog identities or deleting existing verified preview data.
## Implementation checkpoint

At the first independently testable increment, the following behavior is implemented in branch `feat/atlas-catalog-source-links`:

- Existing Home, Components, collection and registry-profile cards show an original-page link when an exact source-record link matches the official registry hostname; item-detail Source panels and related-item cards use the same rule. Source JSON remains separately labeled.
- Public query, facet, Home and registry-directory counts deduplicate by exact namespace and full item name. The imported index still preserves every raw row for provenance and integrity reporting.
- URLs reject raw JSON, generic homepages, external origins, unsafe protocols, credentials and nonstandard ports. Routes with no eligible page do not invent one.
- At this checkpoint, `mise run verify` passes 57 test files and 459 tests, and `mise run browser:acceptance` passes 40 route/viewport checks using the managed Registry Atlas profile against the isolated worktree.

The remaining parent-plan requirements are **not** satisfied by this increment: exhaustive independent official-page URL verification, conflict reconciliation between distinct reviewed sources, all-registry visual coverage, broader reviewed dependency policies, certified interactive examples beyond the existing manifests, additional category hierarchy and asset-specific presentation, source freshness management, and every feature of the wider reference-site parity goal. Each needs its own evidence, tests and separately reviewed execution task. Do not promote 17,295 sitemap candidates into verified URLs or interpret 26 previously reviewed component demos as comprehensive catalog coverage.

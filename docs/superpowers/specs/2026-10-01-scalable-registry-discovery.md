# Scalable, evidence-based registry discovery — implementation specification

**Date:** 2026-10-01
**Status:** User-approved architecture; implementation staged and evidence-gated.
**Parent contract:** `docs/superpowers/specs/2026-10-01-authentic-component-previews-and-coverage.md`.
**Existing plan:** `docs/superpowers/plans/2026-10-01-authentic-component-previews-and-coverage.md` Tasks 4–6.
**Repository:** `registry-atlas`.

## Objective and design choice

Discover each registry's actual navigation/listing structure once, enumerate its observed component links, and match those pages against exact Atlas catalog identities without one-off registry crawlers. The 408 raw registries remain addressable even if a site has no index or is unreachable. The three existing source-informed fixtures remain the only verified interactive examples until separately reviewed upstream builds pass source, isolation and browser gates.

**Chosen:** one bounded discovery orchestrator with reusable, evidence-producing adapters (official structured index where observed; browser-rendered semantic navigation and DOM anchors); a separate resolver matches exact catalog keys; a versioned append-only ledger enables resuming and invalidating stale results. Site-family adapters are allowed only for demonstrated, reusable structural differences. A registry-specific override must record an exceptional decision, never silently invent URLs.

**Rejected:** generated `/docs/components/{slug}` guesses, unrestricted LLM navigation, manually coding one scraper for each registry, treating HTTP 200/title alone as identity proof, and auto-running third-party component code in Atlas. A heuristic route pattern is a candidate hint, never verification.

## Public contract

`discoverRegistry({registry, indexedItems, browser, ledger, limit, maxPages, maxLinks, maxDepth, delayMs, checkedAt})` yields a serializable summary with exact `namespace`, observed listing routes, per-item documentation evidence, unresolved reasons and a checkpoint cursor. Browser is a managed PinchTab adapter exposing only `url`, `snap`, `attr`, `domLinks`, `nav`. No anonymous second browser is opened. Pure tests supply a fake adapter.

The exact canonical item identity is `namespace + '/' + item.name`, preserving slashes and case. Duplicate catalog entries with the same identity are deduplicated; two different identities with equal display names are **never merged**.

Discovery evidence contains the homepage origin, listing URL, observed link URL, link text, navigation source, visited page URL, rendered heading, time, strategy and catalog fingerprint. `page-observed` attests **only** observed documentation identity, not upstream source authenticity. A raw registry JSON, demo composition, dependencies, license and runnable preview require separate independent proof under the parent specification.

## Registry discovery strategy contract

1. Validate official homepage and approved managed source profile; reject private/loopback/link-local literal hosts, credentials, non-HTTPS and cross-origin destinations. Never follow discovered external navigation.
2. On the homepage enumerate observed semantic links plus observed DOM anchors; find actual directory/listing routes using reusable names and URL features (`components`, `primitives`, `ui`, `patterns`, `blocks`, `docs`, `library`, `catalog`, `elements`).
3. Traverse observed listing/category links breadth-first, within `maxPages`, `maxLinks`, `maxDepth` and a per-domain minimum delay; record the selected route and its observation. A change of destination, missing link, stale observation, redirect off origin or exhaustion produces an explicit unresolved reason. Never derive routes solely from slugs.
4. Enumerate component anchors once per visited listing; correlate against **all** indexed names. Prefer full-name match of observed link/heading, allow only unique unambiguous leaf-name matches when full name is unavailable; ambiguous leaf names or multiple destinations are unresolved.
5. Reopen each candidate destination in the managed browser, independently verify the final origin, URL and rendered heading. A matching title alone without an observed linking page and a distinct catalog identity is insufficient.
6. Use structured official index URLs when explicitly observed and proven safe; do not execute an arbitrary fetched script or guess `registry.json` locations. A structured index may enumerate identities, but docs links and source remain separate evidence stages.
7. Store observations and unresolved outcomes; retries use bounded backoff and source freshness rules rather than repeating every source visit indiscriminately.

## Ledger, batching and reproducibility

Use an append-only `registry-atlas-discovery/v1` JSONL record per registry observation and per exact component identity, keyed by namespace/item; latest matching fingerprint wins. Store `catalogFingerprint` over sorted exact item names and official registry homepage. Invalidate stale records on fingerprint change and let a new observation generation replace old outcomes without rewriting source catalogs. Commit a discovery snapshot before visiting its item pages so an interrupted worker can resume from the observed candidates. Persist each attempted item independently, including unresolved and blocked states; a re-run must not duplicate or falsely promote previously reported records.

CLI requires a chosen `--registry`, explicit managed `--profile`, `--server` and `--tab`, an absolute `--journal`, and a finite per-run `--limit`. A sibling exclusive `.lock` file prevents multiple CLI processes from writing the same journal simultaneously; an interrupted worker leaves the lock for explicit operator inspection before removal. Process only source-approved registry domains, throttle requests, bound navigation and link counts, and print structured progress/counts. Never mutate `data/shadcn`, `public/data`, reviewed demo manifests or arbitrary catalog files as a side effect. Reconciler must distinguish `not-visited`, `page-observed`, `ambiguous`, `blocked`, `source-verified`, `build-verified` and `browser-verified`.

## Component preview handoff and security

Discovery may enqueue **candidates**, not approved builds. To promote, the existing `assessReviewedPreviewCandidate` gate must receive independently reviewed source bytes, exact source SHA-256, provenance, demo composition, pinned dependency closure, license approval and isolated runtime policy. Do not treat route discovery, catalog indexing or a successful npm install as proof of a working demo. Never execute registry code in the Atlas parent, import site-provided scripts, or expose raw source links/screenshots as the preview.

## Resilience and negative evidence

An empty raw registry, unavailable homepage, site requiring auth, soft-404, duplicate link, category trap, name mismatch, nested name and JS-only navigation are first-class fixture cases. Failed navigation must not poison evidence for other registries. Preserve journal identity and prior successful observations when retrying transient errors, but invalidate stale fingerprints. Browser actions are read-only; pause on login, form submissions, downloads or unapproved remote code. Source-site rate limits and anti-bot restrictions are respected, not bypassed.

## Acceptance and implementation slices

**Slice A — deterministic discovery core:** two distinct listing structures (flat and multi-level) pass through the same public function; nonmatching docs URL slugs resolve only with observed link plus matching rendered title; nested and duplicate-name ambiguity are not silently accepted; no made-up links; untrusted hosts rejected.

**Slice B — resumable evidence ledger and CLI:** discovery snapshot and per-item checkpoints survive interruption, `--limit` and cursor preserve identity, old fingerprint is invalidated, failures remain explicit; tests show a second run does not repeat verified pages. Managed PinchTab source profile is mandatory for live execution.

**Slice C — integration:** route existing crawler through the new module only when the current crawler owner has approved the file; remove `@animate-ui` special handling and old slug-only assumptions, preserve previous vetted records and test equivalence against official raw index.

**Slice D — full catalog:** schedule bounded per-registry jobs for all 408 raw registries, independently reconcile preview/source statuses, sample source routes and browsers, publish truthful attempted/verified/blocked/pending counts. No claim of 84k built previews until every actual build and interaction passes its separate evidence gates.

## Coordination

Use PPM `pinchtab-project-work` PAO ownership before writing; read `pinchtab-profile-manager-frontend` and use the intended managed profile for all browser checks. Preserve inherited dirty `scripts/crawl-component-links.mjs` and item-detail/UI edits until their owner releases those surfaces. Do not relax the no-external-source-link product contract.
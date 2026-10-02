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

`discoverRegistry({registry, indexedItems, browser, ledger, limit, maxPages, maxLinks, maxDepth, delayMs, checkedAt})` yields a serializable summary with exact `namespace`, observed listing routes, per-item documentation evidence, unresolved reasons and a journal-backed restart position. The journal tracks per-identity outcomes; the bounded cross-registry scheduler adds an exclusive registry-name cursor. The managed PinchTab adapter exposes `url`, `snap`, `attr`, `domLinks`, `nav`, bounded `waitForLinks`, and same-origin `structuredIndex` reads. No anonymous second browser is opened. Pure tests supply a fake adapter.

The exact canonical item identity is `namespace + '/' + item.name`, preserving slashes and case. Duplicate catalog entries with the same identity are deduplicated; two different identities with equal display names are **never merged**.

Discovery evidence contains the homepage origin, listing URL, observed link URL, link text, navigation source, visited page URL, rendered heading, time, strategy and catalog fingerprint. `page-observed` attests **only** observed documentation identity, not upstream source authenticity. A raw registry JSON, demo composition, dependencies, license and runnable preview require separate independent proof under the parent specification.

## Registry discovery strategy contract

1. Validate official homepage and approved managed source profile; reject private/loopback/link-local literal hosts, credentials, non-HTTPS and cross-origin destinations. Never follow discovered external navigation.
2. On the homepage enumerate observed semantic links plus observed DOM anchors; find actual directory/listing routes using reusable names and URL features (`components`, `primitives`, `ui`, `patterns`, `blocks`, `docs`, `library`, `catalog`, `elements`).
3. Traverse observed listing/category links breadth-first, within `maxPages`, `maxLinks`, `maxDepth` and a per-domain minimum delay; record the selected route and its observation. A change of destination, missing link, stale observation, redirect off origin or exhaustion produces an explicit unresolved reason. Never derive routes solely from slugs.
4. Enumerate component anchors once per visited listing; correlate against **all** indexed names. Prefer exact full-name matches, then observed complete-path matches when a site's catalog flattens nested component names (e.g. `components-animate-avatar-group` versus `/docs/components/animate/avatar-group`). Reject loose prefixes such as `Alert` matching `Alert Dialog`. Where a catalog name is reused on unrelated block cards, a unique *observed* link ending in that exact component path may disambiguate; otherwise preserve an unresolved result. Never fabricate a destination from the item name.
5. Reopen each candidate destination in the managed browser, independently verify the final origin, URL and rendered heading. A matching title alone without an observed linking page and a distinct catalog identity is insufficient.
6. Use only observed same-origin official JSON index anchors. The bounded, no-credentials JSON reader checks response MIME type, redirects, timeout and total bytes. Only exact catalog identity matches with an explicitly declared safe documentation URL become navigation candidates; independently verify the rendered destination. Source JSON file URLs do not become documentation links.
7. If an immediately rendered page contains no usable same-origin links, wait for a bounded browser DOM condition requiring at least one actual same-origin link, and reobserve. Continued emptiness is a navigation error, not proof that a registry has no components. Persist observations and unresolved outcomes; transient navigation errors retry on subsequent runs while successful page observations remain cached. Other retries use source freshness and a discovery-algorithm revision marker. A larger crawl budget may retry budget-exhausted records; each new matching revision must independently reverify identities. Exponential retry/backoff beyond the existing per-domain minimum delay remains future work.

## Ledger, batching and reproducibility

Use an append-only `registry-atlas-discovery/v1` JSONL record per registry observation and per exact component identity, keyed by namespace/item; latest matching fingerprint wins. Store `catalogFingerprint` over sorted exact item names and official registry homepage. Invalidate stale records on fingerprint change and let a new observation generation replace old outcomes without rewriting source catalogs. Commit a discovery snapshot before visiting its item pages so an interrupted worker can resume from the observed candidates. Persist each attempted item independently, including unresolved and blocked states; a re-run must not duplicate or falsely promote previously reported records.

CLI requires a chosen `--registry`, explicit managed `--profile`, `--server` and `--tab`, an absolute `--journal`, and a finite per-run `--limit`. A sibling exclusive `.lock` file prevents multiple CLI processes from writing the same journal simultaneously; an interrupted worker leaves the lock for explicit operator inspection before removal. Process only source-approved registry domains, throttle requests, bound navigation and link counts, and print structured progress/counts. Never mutate `data/shadcn`, `public/data`, reviewed demo manifests or arbitrary catalog files as a side effect. Reconciliation separates `notVisited`, `pageObserved`, `stale`, `ambiguous`, `blocked`, `unresolved`, `fixtureVerified`, `upstreamBuiltVerified`, and `previewPending`; page-observed records are never promoted into source/build/browser verification.

## Component preview handoff and security

Discovery may enqueue **candidates**, not approved builds. To promote, the existing `assessReviewedPreviewCandidate` gate must receive independently reviewed source bytes, exact source SHA-256, provenance, demo composition, pinned dependency closure, license approval and isolated runtime policy. Do not treat route discovery, catalog indexing or a successful npm install as proof of a working demo. Never execute registry code in the Atlas parent, import site-provided scripts, or expose raw source links/screenshots as the preview.

## Resilience and negative evidence

An empty raw registry, unavailable homepage, site requiring auth, soft-404, duplicate link, category trap, name mismatch, nested name and JS-only navigation are first-class fixture cases. Failed navigation must not poison evidence for other registries. Preserve journal identity and prior successful observations when retrying transient errors, but invalidate stale fingerprints. Browser actions are read-only; pause on login, form submissions, downloads or unapproved remote code. Source-site rate limits and anti-bot restrictions are respected, not bypassed.

## Acceptance and implementation slices

**Slice A — deterministic discovery core:** two distinct listing structures (flat and multi-level) pass through the same public function; nonmatching docs URL slugs resolve only with observed link plus matching rendered title; nested and duplicate-name ambiguity are not silently accepted; no made-up links; untrusted hosts rejected.

**Slice B — resumable evidence ledger and CLI:** discovery snapshot and per-item checkpoints survive interruption; `--limit` and latest matching journal rows preserve identities; changed fingerprints and discovery revisions invalidate stale evidence. Tests show a second run does not repeat verified pages. The cross-registry scheduler supports an exclusive `--cursor`; single-registry ledgers resume by checkpoint. Managed PinchTab source profile is mandatory for live execution.

**Slice C — integration:** the legacy source-verification crawler now runs the shared discovery strategy through a source-fact-gated adapter. The previous `@animate-ui`-only route walker was removed after bridge tests covered flat routes, nested identifiers and two same-titled destinations. Existing crawler journal, independently verified official item facts, destination rechecks and guarded source publishing remain intact; no documentation observation alone can authorize publishing.

**Slice D — full catalog:** schedule bounded per-registry jobs for all 408 raw registries, independently reconcile preview/source statuses, sample source routes and browsers, publish truthful attempted/verified/blocked/pending counts. No claim of 84k built previews until every actual build and interaction passes its separate evidence gates.

## Live validation and implementation boundary

2026-10-02: The initial managed `registry-atlas-source-audit` runs observed real `www.8bitcn.com` and `animate-ui.com` documentation routes. A reusable official JSON-index reader is implemented and tested using witnessed-index fixtures, but no tested live page exposed an index anchor; its successful real-site evidence remains outstanding. A bounded scheduler ran against both allowed source domains: a sampled `@8bitcn` batch recorded one observed documentation page and one budget-exhausted identity; a sampled `@animate-ui` batch recovered from an initial empty-navigation failure and verified two documentation pages. Live JSONL journals are under `/tmp/registry-atlas-discovery-batches-20261002` and are **not** published catalog rows. The current source profile allows two sites, leaving 406 source registries profile-blocked. Reconciliation counts all 408 registry identities, 84,145 distinct catalog items, 3 source-informed fixture demos, 0 upstream-built demos, and 84,142 preview-pending identities. This is not a whole-registry crawl, a license review, an executable upstream preview, or a full runtime rollout.

## Coordination

Use PPM `pinchtab-project-work` PAO ownership before writing; read `pinchtab-profile-manager-frontend` and use the intended managed profile for all browser checks. The earlier crawler and visual overlay changes were integrated only after acquiring PAO ownership; keep the older crawler's independently verified evidence separate from the new discovery journal until the output contracts are bridged. The Atlas UI still omits external component-detail source links while keeping the user-requested official registry homepage links on directory/profile pages. Do not relax the no-external-source-link product contract.
## Operator runbook and rollout gates

Run from the repository root. Do not use Atlas's localhost-only frontend profile to browse external registries. The source profile and tab must already exist and be managed by PPM:

```bash
pinchtab-profile-manager registry-atlas-source-audit status --json
pinchtab --server http://127.0.0.1:9877 tab --json

# Count all registries and show a bounded, profile-allowed next batch without browsing.
node scripts/schedule-registry-discovery.mjs --profile registry-atlas-source-audit \
  --server http://127.0.0.1:9877 --journal-dir /tmp/registry-atlas-discovery-batches-20261002 \
  --max-registries 2 --dry-run

# Run one bounded batch on an explicit tab belonging to that same profile.
node scripts/schedule-registry-discovery.mjs --profile registry-atlas-source-audit \
  --server http://127.0.0.1:9877 --tab '<managed-source-tab-id>' \
  --journal-dir /tmp/registry-atlas-discovery-batches-20261002 \
  --max-registries 1 --per-registry-limit 20 --delay-ms 1000

# Use an exclusive --cursor @namespace to advance through registry-name order.
# Reconcile actual saved documentation and reviewed visual/functional status separately.
node scripts/reconcile-component-preview-coverage.mjs \
  --journal-dir /tmp/registry-atlas-discovery-batches-20261002
```

Keep each registry's JSONL journal and exclusive lock outside published data. A successful run may still report unresolved or budget-exhausted items; resume with increased limits and do not treat `processedThisRun` as `fullyVerified`. A profile domain block requires a separately approved manager configuration, not a silent unrestricted browser fallback. Neither the snapshot, a structured index, nor a screenshot satisfies the review-gated original-source build and independent interaction-verification contracts.

The review-gated upstream build runtime and comprehensive site-permission rollout remain unfinished. The legacy crawler and discovery engine share navigation and identity resolution, but the audited crawler's `--apply` step remains a separate, explicit operation requiring independent official-source verification. No bulk data promotion was performed. Never claim coverage of all 84,145 previews until every identity actually passes its own original-source, license, dependency, isolation and browser evidence checks.

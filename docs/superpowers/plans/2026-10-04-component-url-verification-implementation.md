# Component URL discovery and verification plan

**Owner:** Registry Atlas
**Branch:** `feat/atlas-catalog-source-links`
**Persistent source of truth:** `data/shadcn/registry-patterns.sqlite`
**Generated operator report:** `.instance/component-verification-queue.json`

## Goal

For every indexed component, find its exact original page on the official registry site when that page exists.

Do not manually discover tens of thousands of URLs. Discover a registry's route family from real navigation or sitemap evidence, verify the route family, apply it to matching component slugs, and then check the generated component pages automatically.

A URL is not verified merely because a model guessed it, a route pattern generated it, or a server returned HTTP 200.

## Current checkpoint

The numbers below are only the checkpoint from this implementation session. Regenerate the SQLite/report totals before using them for later work.

Before the new direct-discovery test:

- 84,145 exact component identities in SQLite.
- 32,862 had one source-backed or testable URL candidate.
- 51,283 did not yet have one unique candidate URL.
- 46 identities had conflicting route assignments.
- 16 individual pages had been verified in the first URL-check sample.
- 2 sampled URLs were confirmed missing.
- 2 sampled pages had unresolved identity mismatches.

Live discovery then tested `@basecn`, which previously had 56 identities with no candidate. The workflow discovered 53 matching navigation links, derived and verified one route family, created candidates for that registry, and individually verified 3 generated pages. The global candidate count moved from 32,862 to 32,918.

## Implemented pieces

- [x] SQLite stores sources, route patterns, examples, sitemap links, item identities, pattern checks, and individual component-page checks.
- [x] The current registry catalog reconciles into SQLite without reviving the deleted traversal JSON.
- [x] Exact sitemap pages and verified route patterns generate component-page candidates.
- [x] A uniquely applicable unverified route pattern can be tested as a hypothesis without publishing it first.
- [x] Individual pages are checked against the component slug or published title.
- [x] 404/410 pages are recorded as missing and suppressed from public original-page links.
- [x] Redirects, unrelated pages, generic shells, foreign origins, and ambiguous identity checks fail closed.
- [x] JavaScript-rendered identity checks can use the authorized managed source browser.
- [x] Individually verified pages become reviewed original-page links.
- [x] One registry-grouped report contains unresolved slugs, candidate URLs, patterns, observed examples, states, and failure reasons.
- [x] The existing evidence-based browser discovery engine is reused instead of creating a second crawler.
- [x] Browser discovery can now feed newly observed route families directly into SQLite with `scripts/discover-registry-routes-to-sqlite.mjs`.
- [x] Generic entry links such as “Get Started” can be followed when the *observed same-site URL* enters a docs/components path and ends in a known component identity.
- [x] Newly discovered patterns remain unverified until representative real pages pass the existing deterministic verifier.
- [x] Once a route family is verified, compatible unresolved slugs receive generated candidates and enter the individual URL checker.
- [x] Completed checks survive restarts.

## Route-discovery loop for the unresolved identities

Run this loop registry by registry.

### 1. Select a registry

Query SQLite for registries with unresolved component identities, prioritizing:

1. many identities with no candidate,
2. no verified route family,
3. a public HTTPS official homepage,
4. no recent terminal “moved/blocked/unavailable” result.

Do not select components individually when one registry-level discovery can resolve many of them.

### 2. Inspect official evidence

Start from the official homepage stored in SQLite.

Use only observed same-origin evidence:

- visible links and DOM anchors,
- documentation/component navigation,
- an observed official structured index that explicitly supplies documentation URLs,
- an official XML sitemap,
- component pages reached through observed navigation.

Do not manufacture common paths such as `/docs/{slug}` and call them discovered.

### 3. Traverse bounded navigation

Follow observed documentation/category links with limits on:

- pages visited,
- traversal depth,
- links inspected,
- per-site delay,
- components checked per run.

A generic label such as “Get Started” is valid only because its actual observed URL provides the navigation evidence.

### 4. Derive route families

Group observed component links into route families such as:

```text
/docs/components/{slug}
/components/{slug}
/blocks/{slug}
/docs/animate/{leaf}
```

Keep separate families separate.

A route family proposal must include actual observed examples. A local model is not allowed to invent the examples.

### 5. Save proposals to SQLite

Write the newly observed route family and examples directly to SQLite.

Do not recreate the old traversal JSON as an authority.

Existing verified patterns must not be deleted simply because a bounded discovery run did not encounter them again.

### 6. Verify the route family

Use the existing pattern verifier on representative examples, normally at least two pages.

For each representative page require:

- expected official origin,
- expected final URL,
- no unapproved redirect,
- HTML page rather than registry JSON,
- rendered/static identity matching the expected component.

If static HTML is insufficient, use the managed source browser on the same exact URL.

Only then mark the route family verified.

### 7. Generate component candidates

Apply the verified route family to compatible component slugs.

If exactly one verified family applies, create the candidate.

If multiple families can apply and there is no exact evidence choosing one, leave the component unresolved.

### 8. Verify generated component pages

Run the individual component-page checker.

Persist each result as:

- `verified`,
- `missing`,
- `unresolved`,
- `transient`,
- or `pending`.

A generated candidate is not itself proof.

### 9. Rebuild the public link data

After SQLite changes:

```bash
mise run source-pages
mise run verify
```

Only individually verified pages are promoted to the reviewed original-page evidence level.

### 10. Repeat

Regenerate the unresolved report and move to the next registry.

Stop retrying unchanged terminal failures. Route them to the appropriate exception path below.

## Exception handling

### Registry homepage moved to another domain

Do not silently trust the redirect.

Record the registry as needing source-metadata review. Confirm the new official homepage independently, update the registry source, invalidate old route evidence, then rediscover.

**Live proof:** `@retroui` currently redirects from the stored `retroui.dev` homepage to `neobrutalism.com`. The discovery run correctly saved no new pattern.

### Same-site canonical redirect

A canonical redirect may be accepted only after explicitly proving the destination is the same registry and updating the stored official homepage/origin. Do not weaken same-origin checks globally.

### Multiple possible route families

Keep the slug unresolved until observed navigation, sitemap evidence, or an exact checked page identifies the correct family.

### JavaScript-only navigation

Use the managed source browser. Wait for actual link/heading conditions with bounded timeouts. Do not replace rendered evidence with an LLM assertion.

### Search, menus, or interactive-only component directories

If passive link traversal cannot reach the component index, add a site-agnostic interaction step that uses accessible controls already observed on the page. Keep it bounded and tested. Site-specific selectors should be an exception, not the default crawler design.

### No documentation page exists

Record the item as unavailable/no-original-page when official evidence establishes that condition. Do not keep retrying a fabricated URL forever.

### Network/rate-limit failure

Keep it transient and retry later with the existing attempt limits and delays.

## Local-model fallback

A local open-source model with browser access is an **exception investigator**, not a verifier.

Use it only after deterministic discovery cannot resolve a registry.

It may:

- inspect the official site's observed navigation,
- identify likely component-directory controls,
- propose which observed links should be followed,
- propose a route family from observed URLs,
- explain likely source metadata changes.

It may not:

- write `verified` directly,
- invent unseen URLs,
- override same-origin rules,
- accept a page without the deterministic/browser identity checks.

Every model proposal must come back through the same SQLite merge + representative pattern verification + individual page verification pipeline.

## Automation still to add

These items were missing from the previous plan and are now explicit:

- [ ] Add a **batch scheduler** that queries SQLite for unresolved registries and invokes `discover-registry-routes-to-sqlite.mjs` serially with a cursor/resume point. The current new bridge handles one exact registry per run.
- [ ] Persist a registry-level terminal reason for moved homepage, blocked source, no documentation pages, or discovery exhausted, so batch scheduling does not repeatedly retry unchanged cases.
- [ ] Add the optional local open-source model fallback for unresolved browser interaction/navigation cases.
- [ ] Add deterministic support for observed interactive directory entry points when links are hidden behind menus/search and normal link traversal cannot reach them.
- [ ] Add a summary command showing how many unresolved identities were converted to candidates/verified pages per run.
- [ ] After those pieces exist, run the batch scheduler against the remaining registry queue until every identity is either verified, confirmed unavailable/missing, transiently blocked, or has a specific unresolved reason requiring manual/source correction.

## Tests

### Automated end-to-end proof

`tests/registry-explorer/registryDiscoverySqlite.test.ts` proves:

1. an unresolved registry starts with no route family,
2. browser discovery observes real navigation links,
3. two observed component URLs become one route family,
4. the route family is written to SQLite,
5. representative URLs verify the route family,
6. another unresolved slug gets an inferred candidate,
7. the individual URL checker verifies that generated page.

It also proves that unrelated navigation creates **no** route family and that a generic “Get Started” link can enter a component directory only from its actual observed URL.

The existing discovery tests continue to cover stale refs, structured indexes, nested routes, ambiguous leaves, false headings, freshness, budgets, hydration, sitemap candidates, and restart behavior.

### Live proof

Two real unresolved registries were exercised with the managed source-audit browser:

**`@retroui` — negative case**

- Stored homepage redirected to another domain.
- No route pattern was written.
- This proves moved-source protection remains active.

**`@basecn` — positive case**

- Started with 56 identities lacking candidates.
- Homepage exposed “Get Started” → an observed component docs URL.
- Discovery visited 2 listing/navigation pages.
- It found 53 matching component links.
- It observed 3 component pages in the bounded sample.
- It derived 1 route family.
- SQLite accepted 1 new route family with 6 observed examples.
- Representative verification passed the route family.
- Candidate generation added 56 candidates globally in this checkpoint.
- 3 generated component pages were individually checked and all 3 verified.

This is the required real-world proof that the discovery → SQLite → pattern verification → candidate generation → page verification path works.

## Commands

One exact unresolved registry:

```bash
node scripts/discover-registry-routes-to-sqlite.mjs \
  --db data/shadcn/registry-patterns.sqlite \
  --registry @basecn \
  --profile registry-atlas-source-audit \
  --server http://127.0.0.1:9877 \
  --tab "$SOURCE_AUDIT_TAB" \
  --limit 20 --max-pages 40 --max-depth 4 --max-links 1500 \
  --delay-ms 1200 --samples 2 --component-checks 5
```

Then:

```bash
mise run source-pages
mise run verify
```

For ordinary individual candidate verification after route discovery:

```bash
mise run verify:component-pages
```

For the long-running individual URL drain after enough route families exist:

```bash
node scripts/verify-component-pages.mjs \
  --db data/shadcn/registry-patterns.sqlite \
  --all --delay-ms 1200 \
  --report .instance/component-verification-queue.json
```

## Completion definition

The work is data-complete only when each indexed identity is in one explicit state:

- individually verified original page,
- confirmed missing/unavailable,
- registry/source metadata requires correction,
- transiently blocked with retry policy,
- or a specific unresolved exception that cannot be resolved automatically.

“Pattern generated a URL” is not completion.

“HTTP 200” is not completion.

“Local model thinks this is the right page” is not completion.

The deterministic checks and stored source evidence remain authoritative.

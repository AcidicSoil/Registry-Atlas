# Component URL verification — merge-readiness implementation plan

**Owner:** Registry Atlas; same worktree and branch `feat/atlas-catalog-source-links`.
**Scope:** Complete the component URL verifier without replacing existing catalog or preview systems.

## Implementation checklist

- [x] Import the exact item identities into SQLite and retain the original registry-pattern/sitemap provenance.
- [x] Generate candidate URLs from exact sitemap records and verified unambiguous route patterns.
- [x] Probe uniquely applicable unverified patterns as **hypotheses**, never as published links until the individual component passes.
- [x] Implement bounded HTML/URL verification against the published slug **or** title; reject 404/410, off-origin changes, redirects, generic pages and unrelated components.
- [x] Persist each outcome by exact namespace and full slug; reset stale evidence only if the candidate URL, evidence source or published title changes.
- [x] Honor rate limits through serial bounded requests and per-registry caps, retry transient errors with limits, support explicit full-drain mode `--all`.
- [x] Support the existing authorized source browser for JavaScript-hydrated identity checks without trusting HTTP status alone.
- [x] Publish current individually verified component pages as reviewed source links on all existing item-bearing routes; suppress confirmed 404 targets even if old sitemaps list them.
- [x] Generate **one** registry-grouped unresolved report containing every slug, candidate URL, pattern family, observed examples, check state and failure reason.
- [x] Preserve the static frontend's generated link bundle; SQLite is the persistent authority.
- [x] Test route collisions, prefix and nested slugs, title matching, 404/soft 404, retry/resumption, stale evidence, conflicts and artifact reproducibility.

## Release checks

- [x] `mise run verify` passes after the final code changes: 62 test files, 507 tests; production build and data validation pass.
- [x] `mise run browser:acceptance` passed 40 desktop/mobile route checks against the exact isolated worktree.
- [x] Real sampled URLs produced 16 individually verified pages, two 404s and two unresolved identity mismatches; the reviewed link manifest grew from 38 to 52, and the two confirmed missing links were suppressed. Manual browser checks also confirmed the verified and missing detail states.
- [x] `git diff --check` and SQLite `PRAGMA integrity_check` pass; SQLite compacted from 49 MB to 33 MB without changing the 84,145 component records. Confirm a clean branch after the commit.
**Session closeout:** perform PAO terminal check-out after committing the verified work. Do not mutate `main`, push or deploy without explicit request.

## Full-catalog verification loop

Run `mise run verify:component-pages` for a normal bounded batch. For all currently eligible candidates, run:

```bash
node scripts/verify-component-pages.mjs \
  --db data/shadcn/registry-patterns.sqlite --all --delay-ms 1200 \
  --report .instance/component-verification-queue.json
mise run source-pages
mise run verify
```

An interrupted run is safe to restart: successful, missing, and terminal unresolved results remain in SQLite. Per-page URL checks do **not** claim that an unobserved destination is verified. Identity mismatches can be checked with the authorized source browser and published titles. An identity with **no unique URL candidate** needs additional source evidence (observed navigation links or a clarified per-category pattern); it cannot be solved by repeating a request to a nonexistent path. The report includes the unresolved slugs for that discovery process.

At this checkpoint SQLite indexes 84,145 exact identities (including 12 curated-only records), 32,862 source-backed or testable hypothesis URLs, 16 individually verified destinations, 2 confirmed missing URLs and 2 unresolved checked identity mismatches. There are 32,842 untested candidate URLs and 51,283 identities without unique candidates (including 46 conflicting assignments). The UI's distinct *indexed* population is 84,133. **The code merge gate and complete source-data coverage are separate milestones.**

The full drain may require many hours at source-friendly request rates; a finite integration/merge validation run is not a claim that every upstream component across 408 registries has been browsed. Do not turn the all-registry job into thousands of parallel uncontrolled requests merely to make a progress counter reach zero.

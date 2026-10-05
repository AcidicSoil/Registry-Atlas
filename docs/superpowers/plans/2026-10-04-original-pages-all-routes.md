# Recover missing original-page links across Registry Atlas routes

**Status:** Approved scope from 2026-10-04 conversation. **Parent:** `docs/superpowers/specs/2026-10-04-component-catalog-and-deep-links.md`. Implementation uses existing shadcn registry inventory, source evidence, and route renderers.

## Problem and verified baseline

The component catalog contains about 84k identities. The existing traversal inventory records 17,295 exact official-sitemap URL candidates across 130 source registries, but only five individually verified live page observations. More than 66k indexed identities have no official sitemap match in this snapshot. Treat official sitemap publication as an independently useful but *non-verified* navigation source. A sitemap listing is not an assurance that a component is still available or safe.

Currently only reviewed summary URLs, visual references, and selected demo records reach the UI. Browse cards share one renderer, but Compare is a separate item renderer. Some nested detail links use existing summaries rather than a centralized source-page lookup.

## Invariants

- Keys are **exact namespace + full slug**, never final slug alone.
- An exact, currently sourced URL is eligible for navigation, but its label discloses its evidence tier. `reviewed` means an independently reviewed component page; `sitemap` means an official-sitemap listing that may be stale.
- Do not derive an undocumented URL from a namespace, slug, route template or homepage. Do not promote sitemap-only candidates to verified without a destination-page identity check.
- Only public HTTPS URLs on the registry's *actual official origin* are eligible. Reject homepage-only targets, raw JSON/assets, protocol tricks, credentials, ports, path traversal and multiple competing URLs. Reject stale/rebound sitemap snapshots and unknown catalog identities.
- Existing reviewed URLs, image references, installable JSON routes and live demos remain distinct. If sitemap and independently reviewed URLs disagree, do not silently replace the reviewed URL; record the conflict.
- Keep raw catalog rows unchanged; only publish a compact, build-generated URL-evidence index.
- One optional same-origin URL manifest is the catalog's common source. Its absence or failure cannot break browsing. All applicable routes project from this index, including Home, Components/search/explore/authors, registry profiles, templates, themes, icon listings/families/categories, details, related items and Compare.
- Registry directory and Compare registry picker show *registry homepages* when relevant; there is no component item identity for a generic registry-only or unavailable route.

## Implementation steps

1. **Source extraction and coverage**: add a deterministic generator that reads current official registry directory, compact index, existing visual references, reviewed summaries and traversal inventory. Validate exact identity, origin, evidence tier, source timestamp/fingerprint and ambiguous duplicates; emit a public compact `sourcePages` manifest and a coverage report with rejected reasons.
2. **Optional loader**: read this same-origin manifest without blocking catalog loading. Validate shape and registry/identity again when consuming; no unsafe URL is renderable.
3. **Shared projection**: add optional evidence to `CatalogComponent` and `RegistryItemDetail`. Prefer an exact reviewed URL over sitemap-only evidence. UI labels are `View original` and `View sitemap-listed page`; do not use the word verified on provisional links.
4. **Complete route coverage**: reuse the shared card on all existing item-grid views; extend Compare presence cells, source-detail panel, image references and related links with the same destination policy. Preserve internal routes and per-asset route types.
5. **Future verification**: reuse `scripts/crawl-component-links.mjs` with a correctly authorized managed source browser. Promotion requires exact final URL and rendered item identity. Maintain a bounded queue and explicit statuses; do not run an uncontrolled 84k-page crawl or alter domain permissions.
6. **Regression and browser verification**: TDD for exact/nested/collision/unsafe/ambiguous/stale links and each route family; full `mise run verify`; managed desktop/mobile browser acceptance. Record actual eligible and unresolved counts; do not claim full registry coverage.

## Release definition

The shipped browser exposes all eligible source-page links on all routes and calls sitemap-only URLs *provisional*. The remaining unmatched identities and unverified sitemap targets are visible in an auditable coverage report for subsequent bounded discovery/verification. This does not imply the entirety of the larger preview or visual-parity plan is complete.

## Implemented checkpoint — source-page recovery

The source-evidence generator is `scripts/build-source-page-index.mjs`. Run `mise run source-pages` after changing reviewed item summaries, component demo evidence, visual references or the official traversal inventory. It generates `public/data/component-page-links.json` and `data/shadcn/component-page-link-coverage.json`. The exact output is reproducible from tracked source data; the tests fail if it drifts. The loader treats this index as optional and ignores expired, unsafe or unknown entries.

At the 2026-10-04 local check, the output contained **17,330** published exact source pages over **84,133** distinct compact catalog identities: **38 reviewed** and **17,292 official-sitemap-listed** links. **66,803** identities remain unmatched in this snapshot. The 30-day sitemap validity policy is checked at index generation and at runtime. These figures count destination evidence, not successful live destination-page visits.

The already-configured `registry-atlas-source-audit` profile supplies the authorized upstream browser. Run `scripts/crawl-component-links.mjs` with its *currently resolved* manager instance URL and explicit owned tab ID, a registry name, a bounded `--max-items`, and a durable per-batch journal. First run without `--apply`, inspect every verified/unresolved record, then invoke `--apply` against the same snapshot only after verified evidence is accepted. Never infer manager ports/tab IDs from old documents. The existing crawler checks matching source identity and final destination before promotion. Rebuild the public page index and rerun tests after approved changes.

A bounded live crawl confirmed `@8bitcn/input-otp` at `https://www.8bitcn.com/docs/components/input-otp` and applied only that verified record. The rest of the missing identity backlog requires further authorized, rate-limited discovery in separate batches.

**All-route presentation:** the shared gallery cards cover Home, Components/search/explore, Authors, registry profiles, Templates, Themes, and icon listings. Compare cells have their own source actions. Item details and same-registry related links use the same tier-aware policy. Registry-only routes link to the registry homepage rather than a nonexistent component. Unsupported and not-found routes invent no links.

**Not completed:** 66,803 missing source identities, browser-level identity verification for the 17,293 sitemap-only destinations, full runnable previews, and any wider 21st-style parity work. Do not report these as complete.

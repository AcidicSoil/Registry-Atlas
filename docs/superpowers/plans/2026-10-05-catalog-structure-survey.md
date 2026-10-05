# Catalog Classification and Filtering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Build the complete catalog-classification feature: survey every Registry Atlas registry, derive reliable `kind`, source-defined `groups[]`, and `access`, validate the full-run quality, promote approved classifications into generated runtime catalog data, and expose them as usable filters in the Registry Atlas UI.

**Architecture:** Pure library modules own surface planning, structure extraction, kind/access projection, and membership resolution. A bounded local SystemOne adapter owns optional Clef Choice. A survey CLI owns managed-browser validation, batching/cursor behavior, SQLite reads, navigation, and atomic per-registry evidence. A deterministic promotion step turns only reviewed, non-stale survey results into generated catalog fields. Existing catalog query/route/UI layers then expose `kind`, `access`, and source-defined `groups[]` as first-class facets without reusing upstream `categories`.

**Tech Stack:** Node.js ESM, Node 24 built-in `node:sqlite`, Vitest, managed PinchTab CLI, llama.cpp `/v1/systemone`.

**Spec:** `docs/superpowers/specs/2026-10-05-catalog-structure-survey.md`

## Global Constraints

- Tasks 1–6 are read-only with respect to `data/shadcn`, `public/data`, and `data/shadcn/registry-patterns.sqlite`.
- Promotion tasks may update generated runtime catalog data only through a deterministic, tested generator; never hand-edit generated classifications.
- Do not create registry-specific category maps or guessed routes.
- Preserve exact source group labels.
- Clef choices are exact observed labels plus `NONE`; deterministic direct membership bypasses Clef.
- Access is `free | paid | unknown`; absence from `Free` never implies paid.
- Live browser work uses the running `registry-atlas-source-audit` managed profile, explicit server, and explicit tab.
- Tests make no network calls.
- Keep one reusable implementation; retire the one-off evaluation scripts after the new harness covers their useful cases.

## Review Focus

- Large semantic containers that contain unrelated FAQ/help headings must not turn those headings into groups.
- Flat catalogs must return zero groups rather than one broad page heading.
- Repeated leaf names and nested item names must not be assigned to the wrong identity.
- Category-index pages and direct item-list pages must both preserve exact source labels.
- A failed/unavailable Clef call must leave ambiguous membership unresolved, not silently choose a group.

---

### Task 1: Pure catalog structure discovery

**Files:**
- Create: `scripts/lib/catalog-structure-discovery.mjs`
- Create: `tests/registry-explorer/catalogStructureDiscovery.test.ts`

**Interfaces:**
- Produces: `discoverCatalogGroups(observation, context)`
- Produces: `resolveDirectMembership(assetId, groups)`
- Produces: `classifyObservedAccess({groups, markers})`
- Produces: `normalizeCatalogKind(rawType)`

- [x] **Step 1: Write failing fixture tests** for semantic sidebar groups, hard-negative FAQ headings, heading ranges, category cards, category-link collections, flat catalogs, nested identities, and multi-group membership.
- [x] **Step 2: Run the focused test and confirm RED.**
- [x] **Step 3: Implement the smallest generic structural extractor** by moving the useful generic logic from the exploratory v6 harness into the library without registry-name branches.
- [x] **Step 4: Run focused tests until GREEN.**
- [x] **Step 5: Run existing `registryDiscovery.test.ts` to ensure the new library has not changed discovery behavior.**

### Task 2: Surface planning from existing evidence

**Files:**
- Modify: `scripts/lib/catalog-structure-discovery.mjs`
- Modify: `tests/registry-explorer/catalogStructureDiscovery.test.ts`

**Interfaces:**
- Produces: `deriveCatalogSurfaceCandidates({homepage, routePatterns, examples, itemRoutes, sitemapLinks})`

- [x] **Step 1: Add failing tests** for route-template parent derivation, same-origin filtering, deduplication, homepage fallback, and no item-slug URL fabrication.
- [x] **Step 2: Run focused test and confirm RED.**
- [x] **Step 3: Implement surface planning** using existing observed/verified SQLite evidence only.
- [x] **Step 4: Run focused tests until GREEN.**

### Task 3: Bounded Clef group-choice adapter

**Files:**
- Create: `scripts/lib/systemone-group.mjs`
- Create: `tests/registry-explorer/systemOneGroup.test.ts`

**Interfaces:**
- Produces: `chooseObservedGroup({state, groups, endpoint?, timeoutMs?, fetchImpl?})`

- [x] **Step 1: Write failing tests** for exact choices + `NONE`, duplicate labels, invalid endpoint, invalid choice, invalid probability/confidence, timeout, and successful response.
- [x] **Step 2: Run focused test and confirm RED.**
- [x] **Step 3: Implement local-only SystemOne Choice adapter** using the validated shape already proven by `systemone-identity.mjs`.
- [x] **Step 4: Run focused tests until GREEN.**

### Task 4: Survey core and CLI

**Files:**
- Create: `scripts/lib/catalog-structure-survey.mjs`
- Create: `scripts/survey-registry-catalog-structure.mjs`
- Create: `tests/registry-explorer/catalogStructureSurvey.test.ts`

**Interfaces:**
- Produces: `planCatalogStructureSurvey(...)`
- Produces: `surveyRegistryCatalogStructure(...)`
- CLI writes `registry-atlas-catalog-structure-survey/v1` per-registry JSON and enforces a bounded minimum delay between live source-page navigations.

- [x] **Step 1: Write failing tests** with fake browser/page observations for batching, cursor, atomic output model, flat catalogs, direct membership bypassing Clef, ambiguous membership invoking Clef, Clef failure -> unresolved, and kind/access counts.
- [x] **Step 2: Run focused test and confirm RED.**
- [x] **Step 3: Implement survey core** with dependency-injected page observer and decision function.
- [x] **Step 4: Implement CLI boundary** that validates managed profile/server/tab, opens no second browser, reads SQLite read-only, navigates selected surfaces, and writes only the explicit output directory.
- [x] **Step 5: Run focused tests until GREEN.**
- [x] **Step 6: Run source/test typechecks.**

### Task 5: Full-inventory dry plan and bounded live smoke

**Files:**
- Modify only if a test exposes a real defect in Tasks 1–4.
- Output: `/tmp/registry-atlas-catalog-structure-survey-<run>/`

- [x] **Step 1: Run report/dry planning across all local registries** and confirm every authoritative namespace is addressable without network mutation.
- [x] **Step 2: Use the managed `registry-atlas-source-audit` browser** to run a bounded heterogeneous live batch including grouped and flat sites.
- [x] **Step 3: With Clef running locally, verify at least one ambiguous decision is constrained to observed labels + `NONE`; verify direct structural assignments skip Clef.**
- [x] **Step 4: Inspect written per-registry artifacts and summary counts.**
- [x] **Step 5: Stop any Clef server started by this task if it was not already running before the task.**

### Task 6: Retire experimental harnesses and verify

**Files:**
- Delete: `scripts/evaluate-source-group-discovery*.mjs` created by the smoke-test work, after useful fixtures are represented in permanent tests.
- Preserve: `scripts/lib/systemone-identity.mjs` and its tests.

- [x] **Step 1: Remove superseded one-off evaluation scripts.**
- [x] **Step 2: Run focused catalog structure + SystemOne tests.**
- [x] **Step 3: Run `pnpm typecheck`, `pnpm typecheck:test`, relevant discovery tests, and `pnpm build`.**
- [x] **Step 4: Run `git diff --check`.**
- [x] **Step 5: Review the diff against the spec; no public/generated catalog mutation is allowed.**


### Task 7: Full survey, aggregate report, and quality gate

**Files:**
- Create: `scripts/aggregate-registry-catalog-structure.mjs`
- Create: `tests/registry-explorer/catalogStructureAggregate.test.ts`
- Reuse: `scripts/survey-registry-catalog-structure.mjs`

**Outputs:**
- Per-registry survey JSON under the selected run directory.
- `summary.json` with whole-run counts.
- `review.json` ordered by failed/no-surface/high-unresolved/high-Clef/high-group-count registries.

- [ ] **Step 1: Write failing aggregate tests** for completed/failed/flat/grouped/no-surface counts, item assignment totals, kind/access totals, Clef outcomes, stale fingerprints, and review ordering.
- [ ] **Step 2: Implement deterministic aggregation** over per-registry artifacts; aggregation must not browse or call Clef.
- [ ] **Step 3: Run the complete 408-registry survey in resumable batches** and persist the run directory rather than treating `/tmp` batch summaries as the final product.
- [ ] **Step 4: Generate `summary.json` and `review.json`; inspect the highest-risk registries and fix generic discovery defects rather than registry-name exceptions.**
- [ ] **Step 5: Rerun affected registries after generic fixes and regenerate the aggregate report.**
- [ ] **Step 6: Record an explicit promotion gate** identifying which artifacts are current, reviewed, and eligible for runtime promotion.

### Task 8: Promote approved classification into generated catalog data

**Files:**
- Create: `scripts/promote-registry-catalog-structure.mjs`
- Modify: `src/registry-explorer/core/registry.schema.ts`
- Modify: `src/registry-explorer/core/registryCatalogIndex.ts`
- Modify the generator/sync path that owns `public/data/registry-catalog-items.json`
- Create: `tests/registry-explorer/catalogStructurePromotion.test.ts`
- Modify: `tests/registry-explorer/registryCatalogIndex.test.ts` if present, otherwise add equivalent parser coverage.

**Runtime item fields:**
- `kind`
- `groups[]`
- `access: "free" | "paid" | "unknown"`
- provenance/fingerprint metadata sufficient to reject stale promotion.

- [ ] **Step 1: Write failing promotion tests** proving raw `type` and upstream `categories` are preserved while the three new fields remain separate.
- [ ] **Step 2: Reject unresolved, stale, mismatched, or unreviewed survey rows.**
- [ ] **Step 3: Preserve exact group labels and deterministic multi-group membership; do not normalize source labels into existing categories.**
- [ ] **Step 4: Preserve block/page/template distinctions instead of collapsing `registry:block` into component or `registry:page` into template.**
- [ ] **Step 5: Integrate promotion into the generated catalog build/sync path so regenerated catalog data is reproducible from authoritative inputs plus approved survey evidence.**
- [ ] **Step 6: Validate generated counts and fingerprints before accepting the promoted catalog.**

### Task 9: Add kind, access, and group query facets

**Files:**
- Modify: `src/registry-explorer/core/catalogCollections.ts`
- Modify: `src/registry-explorer/core/catalogQuery.ts`
- Modify: `src/registry-explorer/core/catalogRoutes.ts`
- Modify: `tests/registry-explorer/catalogCollections.test.ts`
- Modify: `tests/registry-explorer/catalogQuery.test.ts`
- Modify: `tests/registry-explorer/catalogRoutes.test.ts`

**Interfaces:**
- `CatalogComponent.kind`
- `CatalogComponent.groups`
- `CatalogComponent.access`
- query options for `kinds`, `groups`, and `access`
- facet summaries for those fields
- URL parameters for shareable filter state.

- [ ] **Step 1: Write failing query tests** for kind, access, exact group matching, multi-group membership, and combined registry + kind + access + group filtering.
- [ ] **Step 2: Use OR semantics within each multi-select facet and AND semantics across different facets.**
- [ ] **Step 3: Count facets from the promoted fields without mixing source groups into existing `categories`.**
- [ ] **Step 4: Extend browse query parsing/serialization** so kind/access/group selections survive copy-link, refresh, back, and forward navigation.
- [ ] **Step 5: Keep existing category behavior intact for upstream categories.**

### Task 10: Expose the filters in the Registry Atlas UI

**Files:**
- Modify: `src/registry-explorer/ui/catalogComponentsView.ts`
- Modify: `src/registry-explorer/ui/catalogSidebarNavigation.ts`
- Modify: `src/registry-explorer/ui/registryCollectionView.ts`
- Modify: `src/registry-explorer/ui/shell.ts`
- Modify the relevant catalog styles only if needed.
- Modify: `tests/registry-explorer/catalogComponentsView.test.ts`
- Modify: `tests/registry-explorer/catalogSidebarNavigation.test.ts`
- Modify: `tests/registry-explorer/registryCollectionView.test.ts`
- Modify: `tests/registry-explorer/shell.test.ts`

- [ ] **Step 1: Add a global Kind filter** using the promoted catalog kinds, including block/page/template/theme/icon where present.
- [ ] **Step 2: Add a global Access filter** for Free, Paid, and Unknown.
- [ ] **Step 3: Add a Group filter** backed only by promoted source-defined `groups[]`.
- [ ] **Step 4: On a selected registry/registry page, show that registry's exact group labels and counts.**
- [ ] **Step 5: On flat registries, omit the Group filter entirely rather than rendering an empty control.**
- [ ] **Step 6: In cross-registry browsing, allow exact-label group matching while labeling the facet as source-defined groups, not a universal category taxonomy.**
- [ ] **Step 7: Render active filter chips and clear behavior for kind/access/group consistently with the existing registry/category controls.**
- [ ] **Step 8: Verify keyboard/ARIA behavior and responsive layout for the new controls.**

### Task 11: End-to-end product verification

**Files:**
- Modify only when verification exposes a real defect.

- [ ] **Step 1: Run focused promotion/query/route/UI tests.**
- [ ] **Step 2: Run the full test suite, `pnpm typecheck`, `pnpm typecheck:test`, `pnpm build`, product-contract checks, data validation, and `git diff --check`.**
- [ ] **Step 3: Browser-verify representative UI flows** through the normal Registry Atlas interface:
  - free blocks;
  - themes only;
  - selected registry + Pricing group;
  - cross-registry Navigation group;
  - flat registry with no Group control;
  - combined registry + kind + access + group.
- [ ] **Step 4: Confirm copied URLs reproduce the same filters after reload.**
- [ ] **Step 5: Confirm no UI facet is sourced from unresolved/stale survey evidence.**
- [ ] **Step 6: Review the final diff against the product goal: the survey is evidence infrastructure; the shipped outcome is usable catalog filtering.**

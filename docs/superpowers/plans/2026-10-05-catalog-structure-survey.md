# Catalog Structure Survey Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a reusable, read-only catalog structure survey that can address every Registry Atlas registry, discover source-defined groups structurally, assign obvious memberships deterministically, and use Clef only for ambiguous membership among observed labels.

**Architecture:** Pure library modules own surface planning, structure extraction, kind/access projection, and membership resolution. A bounded local SystemOne adapter owns optional Clef Choice. A CLI owns managed-browser validation, batching/cursor behavior, SQLite reads, navigation, and atomic per-registry survey artifacts. Existing Registry Atlas catalog and route-pattern data remain read-only inputs.

**Tech Stack:** Node.js ESM, Node 24 built-in `node:sqlite`, Vitest, managed PinchTab CLI, llama.cpp `/v1/systemone`.

**Spec:** `docs/superpowers/specs/2026-10-05-catalog-structure-survey.md`

## Global Constraints

- Do not mutate `data/shadcn`, `public/data`, or `data/shadcn/registry-patterns.sqlite`.
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

- [ ] **Step 1: Write failing fixture tests** for semantic sidebar groups, hard-negative FAQ headings, heading ranges, category cards, category-link collections, flat catalogs, nested identities, and multi-group membership.
- [ ] **Step 2: Run the focused test and confirm RED.**
- [ ] **Step 3: Implement the smallest generic structural extractor** by moving the useful generic logic from the exploratory v6 harness into the library without registry-name branches.
- [ ] **Step 4: Run focused tests until GREEN.**
- [ ] **Step 5: Run existing `registryDiscovery.test.ts` to ensure the new library has not changed discovery behavior.**

### Task 2: Surface planning from existing evidence

**Files:**
- Modify: `scripts/lib/catalog-structure-discovery.mjs`
- Modify: `tests/registry-explorer/catalogStructureDiscovery.test.ts`

**Interfaces:**
- Produces: `deriveCatalogSurfaceCandidates({homepage, routePatterns, examples, itemRoutes, sitemapLinks})`

- [ ] **Step 1: Add failing tests** for route-template parent derivation, same-origin filtering, deduplication, homepage fallback, and no item-slug URL fabrication.
- [ ] **Step 2: Run focused test and confirm RED.**
- [ ] **Step 3: Implement surface planning** using existing observed/verified SQLite evidence only.
- [ ] **Step 4: Run focused tests until GREEN.**

### Task 3: Bounded Clef group-choice adapter

**Files:**
- Create: `scripts/lib/systemone-group.mjs`
- Create: `tests/registry-explorer/systemOneGroup.test.ts`

**Interfaces:**
- Produces: `chooseObservedGroup({state, groups, endpoint?, timeoutMs?, fetchImpl?})`

- [ ] **Step 1: Write failing tests** for exact choices + `NONE`, duplicate labels, invalid endpoint, invalid choice, invalid probability/confidence, timeout, and successful response.
- [ ] **Step 2: Run focused test and confirm RED.**
- [ ] **Step 3: Implement local-only SystemOne Choice adapter** using the validated shape already proven by `systemone-identity.mjs`.
- [ ] **Step 4: Run focused tests until GREEN.**

### Task 4: Survey core and CLI

**Files:**
- Create: `scripts/lib/catalog-structure-survey.mjs`
- Create: `scripts/survey-registry-catalog-structure.mjs`
- Create: `tests/registry-explorer/catalogStructureSurvey.test.ts`

**Interfaces:**
- Produces: `planCatalogStructureSurvey(...)`
- Produces: `surveyRegistryCatalogStructure(...)`
- CLI writes `registry-atlas-catalog-structure-survey/v1` per-registry JSON and enforces a bounded minimum delay between live source-page navigations.

- [ ] **Step 1: Write failing tests** with fake browser/page observations for batching, cursor, atomic output model, flat catalogs, direct membership bypassing Clef, ambiguous membership invoking Clef, Clef failure -> unresolved, and kind/access counts.
- [ ] **Step 2: Run focused test and confirm RED.**
- [ ] **Step 3: Implement survey core** with dependency-injected page observer and decision function.
- [ ] **Step 4: Implement CLI boundary** that validates managed profile/server/tab, opens no second browser, reads SQLite read-only, navigates selected surfaces, and writes only the explicit output directory.
- [ ] **Step 5: Run focused tests until GREEN.**
- [ ] **Step 6: Run source/test typechecks.**

### Task 5: Full-inventory dry plan and bounded live smoke

**Files:**
- Modify only if a test exposes a real defect in Tasks 1–4.
- Output: `/tmp/registry-atlas-catalog-structure-survey-<run>/`

- [ ] **Step 1: Run report/dry planning across all local registries** and confirm every authoritative namespace is addressable without network mutation.
- [ ] **Step 2: Use the managed `registry-atlas-source-audit` browser** to run a bounded heterogeneous live batch including grouped and flat sites.
- [ ] **Step 3: With Clef running locally, verify at least one ambiguous decision is constrained to observed labels + `NONE`; verify direct structural assignments skip Clef.**
- [ ] **Step 4: Inspect written per-registry artifacts and summary counts.**
- [ ] **Step 5: Stop any Clef server started by this task if it was not already running before the task.**

### Task 6: Retire experimental harnesses and verify

**Files:**
- Delete: `scripts/evaluate-source-group-discovery*.mjs` created by the smoke-test work, after useful fixtures are represented in permanent tests.
- Preserve: `scripts/lib/systemone-identity.mjs` and its tests.

- [ ] **Step 1: Remove superseded one-off evaluation scripts.**
- [ ] **Step 2: Run focused catalog structure + SystemOne tests.**
- [ ] **Step 3: Run `pnpm typecheck`, `pnpm typecheck:test`, relevant discovery tests, and `pnpm build`.**
- [ ] **Step 4: Run `git diff --check`.**
- [ ] **Step 5: Review the diff against the spec; no public/generated catalog mutation is allowed.**

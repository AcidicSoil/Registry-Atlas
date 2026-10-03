# Complete 21st.dev Experience and Functional Component Parity Implementation Plan

> **For agentic workers:** Use the host's available task-by-task implementation workflow. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring Registry Atlas's complete observable navigation, route content, controls and per-item interactive demonstrations to the 21st.dev quality bar, while scaling official registry discovery across its full catalog.

**Architecture:** First make a revisioned live-reference feature census and reconcile existing worker-owned branch changes. Then reuse observed official-site route patterns, publish verified images as an interim state, introduce safe per-item functional preview runtimes, and apply the reference's route-specific UI structure and interactions. Track every item and feature through independent evidence gates so a missing demo, route or action cannot be reported as finished.

**Tech Stack:** Node 24, vanilla TypeScript, Vite, Vitest, JSON/JSONL, managed PinchTab, PPM, PAO, Webcmd Design and existing Registry Atlas source/data tooling.

## Global Constraints

- Authoritative spec: `docs/superpowers/specs/2026-10-03-observed-reference-and-route-parity.md`. Reference evidence: `docs/research/2026-10-03-21st-route-interaction-audit.md`. Earlier image-only preview acceptance is superseded by the latest demand for **working** components; images remain interim evidence.
- All source URLs and exact `namespace/item.name` matches must be observed and verified; no fabricated navigation or guessed URLs. Keep distinct candidate, page-observed, visual-published, interactive-rendered, interaction-verified and blocked states.
- Full-card click opens an Atlas detail; a component's own controls must work without triggering card navigation. Official item and registry homepage links remain separately accessible.
- Do not copy proprietary source/assets or fabricate unavailable 21st.dev numbers. For auth, commerce, publishing and editor features, create genuine data/service behavior or report a continuing parity gap.
- Do not execute fetched third-party source in the parent application; isolate permitted embeds and approved, pinned upstream builds. Verify permissions, network, sandbox, source revisions and real user gestures.
- Read `pinchtab-project-work`, `pinchtab-profile-manager-frontend`, local PPM skill directory and browser-work guide. Authenticate/record a separate PAO run and claim for each implementation owner. Preserve all inherited dirt in `.worktrees/frontend-reference-navigation`, all commits in `.worktrees/registry-traversal-patterns`, and the separate visual worktree. No forced integration or shared-daemon restart.
- The **present operation is documentation planning**. No task below is marked implemented by writing this plan. Each task uses focused failing tests before behavior changes, then a passing test and repository/browser gates before a limited commit.

---

## Track A — Reference inventory and official-registry coverage

### Task 1: Exhaustively inventory 21st.dev routes, sidebar contents and actions

**Files:** Create proposed `scripts/audit-21st-reference.mjs` and `tests/registry-explorer/referenceAudit.test.ts`; update `docs/research/2026-10-03-21st-route-interaction-audit.md`; save raw dated evidence under `~/.local/state/registry-atlas/research/`, not inside the public application bundle.

**Interfaces:** Consume an existing PPM `design-ui-ux` instance, exact tab ID, seed routes and bounded `--max-routes`/`--cursor`; produce `registry-atlas-reference-census/v1` containing route, sidebar hierarchy/order/label/count, control, interaction outcome, viewport, timestamp, source URL, evidence and Atlas parity mapping.

- [ ] Write failing pure tests for deduplicated route canonicalization, nested category discovery, closed/open sidebar contents, bounded traversal, resume, redirects and unknown/blocked routes. Verify expected failures with `mise exec -- pnpm exec vitest run tests/registry-explorer/referenceAudit.test.ts`.
- [ ] Implement a read-only census that follows observed site links and records page/content/control families. Do not modify 21st accounts, save/bookmark content, submit publish/report forms, purchase anything or crawl private pages. Do not reuse the source-audit profile for 21st.dev or alter the account state of the design profile.
- [ ] Traverse all discoverable reference families: home; Components root/categories/featured/newest; Templates; Themes/editor; Icons; Shaders; Gradients; ASCII; Libraries; Authors; item/profile/details; global search, filter, sort, overlay and keyboard/menu states. Record actual contents of every sidebar group, not just its outer width.
- [ ] Interact with representative controls per **behavior family** on desktop 1920px, mobile 390px and an intermediate width. Log before/after state, URL, focus/hover, keyboard, history/reload and failures. Add a stable per-feature checklist for controls that require authenticated services.
- [ ] Verify focused test pass and inspect 5 different route families manually against logged evidence. Commit the census code/observations only after correct provenance and no prohibited account mutations.

### Task 2: Reconcile existing sitemap/traversal-pattern work

**Files (currently owned by `feat/registry-traversal-patterns`):** `scripts/survey-registry-sitemaps.mjs`, `scripts/derive-registry-traversal-patterns.mjs`, `scripts/lib/registry-discovery.mjs`, `scripts/schedule-registry-discovery.mjs`, `data/shadcn/registry-traversal-patterns.json`.
**Tests:** `tests/registry-explorer/surveyRegistrySitemaps.test.ts`; `tests/registry-explorer/registryTraversalPatterns.test.ts`; `tests/registry-explorer/registryDiscovery.test.ts`.

**Interfaces:** Consume registry raw catalog, observed sitemap links and current discovery JSONL; produce revisioned, evidence-backed registry navigation templates without promoting candidates into verified items.

- [ ] Check PAO claims and compare exact overlap with main and other workers before editing. Review the committed `1b7263a` tree, generated inventory size and regeneration instructions. Do not reset or edit its original worktree.
- [ ] Add failing fixture tests for sitemap-only guesses, nested paths, name collisions, off-origin redirects, stale fingerprints and observed valid links; run the three focused test files.
- [ ] Integrate the owner-approved source through the supported git flow; keep candidate/observed/verified states distinct and retain protected source-crawler publish gates. Avoid duplicating the pattern collector in a new module.
- [ ] Run `mise run verify` and a bounded managed-source-browser sample for flat, nested and JS-rendered categories. An unapproved or inaccessible origin stays blocked. Commit/push a reviewed integration slice when its owner releases the overlap.

### Task 3: Make 408-registry discovery and image capture truly resumable

**Files:** Existing `scripts/schedule-registry-discovery.mjs`, `scripts/discover-registry-components.mjs`, `scripts/schedule-visual-captures.mjs`, `scripts/capture-component-visuals.mjs`, `scripts/reconcile-component-preview-coverage.mjs`.
**Tests:** `tests/registry-explorer/registryDiscoverySchedule.test.ts`; `tests/registry-explorer/captureComponentVisuals.test.ts`; `tests/registry-explorer/scheduleVisualCaptures.test.ts`.

**Interfaces:** Input current catalog/fingerprints + a valid `registry-atlas-source-audit` PPM server/tab; output per-registry exact route candidates, independently rechecked pages, item-level visual captures and a cursor with durable failure reasons. Preserve `public/data/component-previews.json` as reviewed-image output.

- [ ] Add failing tests for interrupted batches, stale sitemap candidate, matched exact item with no image, wrong component screenshot, external redirect, blocked source, duplicate identity and resume after changed source.
- [ ] Reuse observed-link/index/sitemap families and record all attempt states; limit per-domain navigation, retry and storage. Capture only an independently checked actual component surface or known matching official media, never an arbitrary banner.
- [ ] Reconcile page coverage, visual coverage and missing pages separately. Require a valid output image before atomic manifest publish; missing visuals leave a navigable factual card.
- [ ] Execute a bounded profile-authorized sample in two structurally different registries and reproduce ledger summaries; run `mise run verify`, then commit/push the passing increment. Do not call it all-registry or functional-demo completion.

---

## Track B — Component execution and verified interaction

### Task 4: Establish a gated live-embed resolver and hosted-demo identity

**Files (proposed):** `src/registry-explorer/core/functionalPreview.ts`, `src/registry-explorer/ui/functionalPreview.ts`, `src/registry-explorer/data/functional-preview-manifest.json`; tests `tests/registry-explorer/functionalPreview.test.ts`. Integrate with existing `src/registry-explorer/ui/visualReference.ts`.

**Interfaces:** `resolveFunctionalPreview(namespace:string, slug:string): VerifiedEmbed | ReviewedBuild | null`. Inputs are exact approved catalog identity, official component URL, permitted embed source, origin, revision and tested capabilities. Outputs are a fixed safe iframe or explicit pending/blocked status; no free-form UI URL input.

- [ ] Add failing tests for wrong identity, unapproved iframe origin, stale preview, broken URL, iframe loading without actual user control, sandbox/navigation escape, blocked cookies and untrusted postMessage. Assert visual fallback does **not** count as functional.
- [ ] Use only observed official preview/embed URLs with allowed origin and independently verified matching title/demo. Enforce cross-origin isolation, CSP/sandbox and explicit reviewed capabilities, no parent tokens or ambient auth.
- [ ] Add browser tests for a working tabs/button/input example that actually changes after a click/typing. Test nonrenderable iframe and wrong component as failures; keep exact page and per-identity diagnostics.
- [ ] Run focused tests, `mise run verify` and managed Atlas browser interaction proof before committing. An iframe HTTP 200 alone is not a pass.

### Task 5: Provide a reviewed isolated-build fallback for nonembeddable components

**Files:** Existing `scripts/build-reviewed-component-demo.mjs` admission gate; proposed `tools/component-preview-host/` and `tests/registry-explorer/buildReviewedComponentDemo.test.ts`. Use Task 4's functional manifest for published output.

**Interfaces:** `buildReviewedDemo({identity, officialSource, sourceSha256, licenseDecision, pinnedDependencies, demoEntry, permissions}) -> {status,artifactPath,artifactHash,evidence}`. No automatic fetched-source execution while surveying a registry.

- [ ] Add failing tests for denied/unknown licenses, stale source hash, SSR-only runtime, unpinned package, external fetch, unreviewed script, build timeout and missing interaction fixture.
- [ ] Build one representative permitted React/Tailwind/shadcn example inside a disposable limited build host, with CSP, restricted network, no Atlas cookies and versioned artifacts. Separate source license/auth checks from image discovery.
- [ ] Prove a real action in the managed browser; compare behavior to the upstream reference. Build success without interaction is `interactive-rendered`, not `interaction-verified`.
- [ ] Add adapter support for each additional encountered framework only with a real test and source dependency review. Run focused tests, `mise run verify` and browser acceptance before each new supported adapter is published.

### Task 6: Connect real component interactions to cards and detail

**Files (currently overlapping the dirty frontend worktree):** `src/registry-explorer/ui/catalogComponentsView.ts`, `src/registry-explorer/ui/itemDetailView.ts`, `src/registry-explorer/ui/componentPreview.ts`, `src/registry-explorer/ui/visualReference.ts`, `public/styles/registry-explorer.css`.
**Tests:** `tests/registry-explorer/catalogComponentsView.test.ts`, `tests/registry-explorer/itemDetailView.test.ts`, `tests/registry-explorer/referenceCardUX.test.ts` (currently in that worktree), and proposed `tests/registry-explorer/functionalCardNavigation.test.ts`.

**Interfaces:** The same exact `namespace/item.name` functional-preview entry is passed to card/detail with responsive mode, identity-safe View original link, and separate internal route anchor.

- [ ] Resolve the frontend branch owner/PAO claim; read and preserve all 11 inherited source/test files. Do not overwrite or independently reimplement its sidebar/card/detail work.
- [ ] Add failing tests: full-card internal click, click-on-demo stays put, keyboard activation, middle/modified click, correct source link, matching card/detail preview, empty/error/reload and rendered interaction-state retention where applicable.
- [ ] Wire verified embed or approved build into both contexts with lazy card hydration and bounded concurrent runtimes. Display source-backed image while demo loads and honest pending status when impossible.
- [ ] Test working button, tab, form input, dialog, drag/slider and animation cases against their actual behavior; mark the signature-pad synthetic gesture unverified until a compatible pointer test passes.
- [ ] Run focused tests, `mise run verify`, full browser acceptance and correct-source visual review before committing the owner-integrated slice.

---

## Track C — Every route, sidebar group, detail and service-backed action

### Task 7: Complete navigation hierarchy and route content

**Files:** `src/registry-explorer/ui/shell.ts`, `catalogLandingView.ts`, `registryDirectoryView.ts`, `registryCollectionView.ts`, proposed/owned `catalogSidebarNavigation.ts` and `public/styles/registry-explorer.css`.
**Tests:** `tests/registry-explorer/shell.test.ts`, `tests/registry-explorer/registryDirectoryView.test.ts`, `tests/registry-explorer/catalogSidebarNavigation.test.ts` (in dirty frontend branch), `tests/registry-explorer/visualContract.test.ts`.

**Interfaces:** Consume the completed Task 1 reference census and real Atlas route/data model; output a proper route-specific sidebar schema with group, displayed child items, counts, active URL, search target, keyboard controls and mobile disclosure. Source-backed categories are the only ones advertised as populated.

- [ ] Add failing route-map tests for every inventoried reference family and each Atlas counterpart; explicitly list unimplemented page families as parity gaps rather than silently skipping them.
- [ ] Implement home marketing/discovery shell; component marketing/UI hierarchy; library directory and registry summaries; separate template/theme/icon/shader/gradient/ASCII/author route shells where data exists. Preserve Atlas-specific compare behavior.
- [ ] Add desktop persistent rail and compact utility header; responsive mobile navigation, filter sheet and keyboard focus/escape/scroll restoration. Preserve original homepage deep links in every pertinent route header.
- [ ] Verify every sidebar item navigates to a non-dead route and exposes correct selected state and item counts, including empty/no-data routes. Run focused tests and browser desktop/mobile/reload/Back checks.
- [ ] Integrate through the original frontend worker or after explicit handoff; run `mise run verify` and commit only passing changed route/shell files.

### Task 8: Implement every browse/filter/sort/card interaction

**Files:** `src/registry-explorer/ui/catalogComponentsView.ts`, `catalogCollectionView.ts`, `registryDirectoryView.ts`, `src/registry-explorer/core/catalogQuery.ts` (inspect exact export before modifications), `public/styles/registry-explorer.css`.
**Tests:** `tests/registry-explorer/catalogComponentsView.test.ts`, `tests/registry-explorer/catalogQuery.test.ts`, `tests/registry-explorer/registryDirectoryView.test.ts` and proposed `tests/registry-explorer/referenceBrowseJourneys.test.ts`.

**Interfaces:** Query state stores supported filter fields, active sorting, search, page/cursor and selected category in shareable URL. Control actions update both visible results and URL consistently; unsupported source dimensions require real catalog enrichment before exposure.

- [ ] Write failing tests for each discovered filter group and its options, combined filters, clear, sort order, search, zero results, pager, query persistence and mobile return flow.
- [ ] Reconcile user-visible 21st choices (e.g. category/time/library/license/author, Recommended/Most downloaded/Most bookmarked/Newest) against **actual Atlas data**. Add trustworthy metadata ingestion or a tracked gap for a missing dimension, never fabricated ranks.
- [ ] Implement visible grouped filter disclosure, compact sort hierarchy, selected-facet counts, accessible search, grid/list toggles where applicable, complete card hover/click and previews. Remove duplicate global/local filter bars.
- [ ] Verify mouse/keyboard/mobile, URL history, direct refresh, no horizontal overflow and scroll; run `mise run verify` and managed-browser route matrix, then commit the passing slice.

### Task 9: Finish each distinct asset, detail and account-backed workflow

**Files:** `src/registry-explorer/ui/itemDetailView.ts`, `catalogCollectionView.ts`, `registryCollectionView.ts`, `catalogCompareView.ts`; proposed dedicated views only if their data/interaction contracts differ and existing route conventions support them.
**Tests:** `tests/registry-explorer/itemDetailView.test.ts`, `tests/registry-explorer/catalogCollectionView.test.ts` and proposed `tests/registry-explorer/referenceAssetJourneys.test.ts`.

**Interfaces:** Each asset family has typed identity, truthful metadata, appropriate specimen/preview and a mapped action set. Authentication and persistence services are separate code modules specified after inventory, not fictional controls in the renderer.

- [ ] Add failing behavior tests for component variants and Preview/Code/Info; template live preview and reload; theme mode/real palette; icon SVG/copy; library contents/category navigation; owner/source metadata; related items; install/copy actions and failure states.
- [ ] Implement corresponding real page structures and working action handlers. Add safe source-backed asset data for shaders/gradients/ASCII/icons when present rather than painting generic component cards with an icon badge.
- [ ] For accounts, bookmarks, profiles, publishing, editor, remix, report and paid actions: inventory the real reference journey and define exact data/storage/auth/permission interfaces before implementation. Ship only persisted/tested equivalents; use a visible parity gap and honest state for missing service decisions.
- [ ] Exercise each detail family at 1920px/390px through the managed browser, including direct link, Back/Forward, copy feedback, functional specimen, error and reload. Run focused suite plus `mise run verify`; commit independent working family slices.

---

## Track D — Exhaustive QA, coverage and release

### Task 10: Operate the full resumable catalog program and honest parity ledger

**Files:** Extend `scripts/reconcile-component-preview-coverage.mjs` and `scripts/plan-component-previews.mjs`; proposed `tests/registry-explorer/functionalParityCoverage.test.ts` and proposed dated evidence reports under `docs/qa/`, following the repository's existing QA report naming convention.

**Interfaces:** Current catalog and branch-integrated discovery/image/runtime evidence yield `{rawRegistries,distinctItems,referenceFeatures,routeObserved,visualPublished,interactiveRendered,interactionVerified,blocked,pending,missingFeatures,nextCursor}`. Per-item and per-feature evidence is queryable without collapsing unrelated counts.

- [ ] Add failing tests for omitted registry, duplicate key, stale source revision, iframe only, action that does not change state, URL and demo with different identity, missing route, missing sidebar section and feature advertised with no actual persisted service.
- [ ] Run bounded source, image and functional-preview batches with durable source journals, stable cursor, rate controls, no private-domain bypass and no unauthorized code execution.
- [ ] Count **every** current identity and site feature independently. Do not call all components functional when any identity remains pending, blocked or unverified; continue until every allowed component passes or each external barrier is demonstrably recorded.
- [ ] Save versioned coverage and blocker reports, source fingerprints and review evidence; rerun focused tests and `mise run verify` before each published batch.

### Task 11: Side-by-side live parity acceptance and integration

**Files:** Update `tests/registry-explorer/visualContract.test.ts`, `tests/registry-explorer/shell.test.ts`, the existing managed `mise run browser:acceptance` runner and `docs/research/2026-10-03-21st-route-interaction-audit.md` with actual evidence.

**Interfaces:** A repeatable route/control/demonstration matrix for site × Atlas at desktop 1920px, mobile 390px and a mid-width viewport, with actual inputs, expected outcomes, screenshot/console/network artifacts, route identity and result.

- [ ] Visit each audited route/control on both sites. Cover category/sidebar content, filters/sorting/search, grids, card hover/link and preview action, detail code/info/variants, mobile sheet, icon-specific control, template and theme, libraries/authors, global search, history and refresh. Enumerate every unimplemented 21st.dev feature as a reported delta.
- [ ] Verify **representative gestures for every component behavior family** and an exact action proof for every item promoted to `interaction-verified`; a single working Tabs example does not certify the other catalog identities.
- [ ] Fail acceptance for fake metrics, unresponsive button, incorrect preview/component pairing, raw-source link replacing navigation, broken official-homepage link, console errors, screen overflow, keyboard trap, unexpected iframe permissions or lost query state.
- [ ] Run `mise run verify` and `mise run browser:acceptance` from the integrated source; review current PAO claims and `git diff --check`, then commit/push independently accepted slices. Update the parity ledger with every unresolved feature rather than claiming a complete clone.

## Dependencies and integration order

1. Task 1 independently establishes the full **reference** inventory; it can run in parallel with reviewed Task 2 owner reconciliation and Task 3 source/visual batching.
2. Task 4 makes a genuine hosted demo possible; Task 5 adds reviewed build fallback; Task 6 connects actual demos to existing cards/details and **must** coordinate the dirty frontend worker.
3. Tasks 7–9 cover the rest of the reference's page families and actions; no route/control is implicitly removed from scope because Atlas lacks it today.
4. Tasks 10–11 measure item-level and feature-level parity until the user-demanded “everything” quality bar is demonstrated. Passing one workstream never implies a completed 408-registry rollout.
5. No cross-branch overwrite. Each worker performs its PAO check-in, verifies and publishes owned files, and checks out/releases its claim.

## Existing evidence versus future work

**Observed now:** 15 sampled 21st route/states, a category Filter click, separate remote demo frames, a code-tab switch, a working hosted animated-tabs action and an ink-color selection. The synthetic signature-drawing action was inconclusive. These samples informed the plan; no task above is marked implemented by this document.

**Current blockers/decisions to resolve per task:** 21st-only metadata and account/commerce services, upstream source permissions and embeddability, per-framework pinned runtime support, plus ownership of the inherited Atlas feature worktrees. These are explicit **gaps**, not permission to fake complete functional parity.

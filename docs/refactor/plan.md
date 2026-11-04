# Registry Atlas refactor plan

**Status:** Architecture approved; phase 4 baseline recorded; phases 5A and 5B implemented. The source-media workflow was superseded by a reviewed component-capture pilot; phases 5C–5E, independent design certification and stale stack/feature-map evidence remain outstanding.

**Source revision:** `aa7893e` on `main`, checked 2026-11-03. The checkout was clean at inspection and two commits ahead of `origin/main`.

**Scope:** Registry Atlas frontend, domain logic, offline PostgreSQL pipeline, generated browser data, tests, tooling, and source-backed documentation. No agents were spawned.

## Goal and completion criteria

Reduce the architectural cost of changing Registry Atlas without changing its public behavior. Preserve exact upstream registry identities, explicit evidence/coverage states, stable deep links, the current HTML-string rendering architecture, the PostgreSQL source of truth, and native StyleX component styling.

The refactor is complete only when:

1. Catalog taxonomy and kind classification are explicit inputs, not process-wide mutable defaults.
2. Routing, browser state, rendering, and asynchronous UI lifecycle have clear owners. Existing routes, pagination, back/forward navigation, setup drafts, focus, and mobile controls remain equivalent.
3. The generated runtime-data envelope is validated before any nested fields are accessed. Existing mirror, catalog, detail, and provenance validation still rejects the same unsafe data.
4. A component has one styling owner. Official StyleX rules govern component styles; remaining CSS is reserved for actual global/document behavior or a verified not-yet-migrated component.
5. The offline PostgreSQL export and evidence-preserving import workflows remain correct, idempotent where already required, and protected by existing transaction boundaries.
6. Focused unit, browser, lint, type, build, security, data-contract, and relevant performance comparisons pass. Existing PPM design-review blockers must be resolved by real independent evidence, not assertions in this plan.
7. Source-backed docs match the verified implementation. Obsolete APIs, selectors, or instructions are deleted in the same migration wave as their callers.

## What exists today

### Architecture and ownership

```text
scripts/ (source discovery, crawling, verification, classification, imports)
  -> scripts/lib/atlas-storage.mjs, atlas-postgres.mjs (local PostgreSQL)
  -> scripts/build-runtime-data.mjs (explicit snapshot export)
  -> public/data/registry-atlas.json.gz and registry-details.json.gz
  -> src/registry-explorer/data/runtimeJson.ts, loadRegistries.ts
  -> src/registry-explorer/core/ (routes, catalog, taxonomy, validation, provenance)
  -> src/registry-explorer/entry.ts (boot and DOM roots)
  -> src/registry-explorer/ui/shell.ts (UI state, navigation, rendering, listeners)
  -> feature renderers and .stylex.ts modules (HTML strings, CSS classes)
  -> browser
```

- **Authoritative state:** Local PostgreSQL 18 in Docker, not the generated JSON files. The export produces two disposable compressed files. Refer to `docs/registry-explorer-data.md`, `scripts/lib/atlas-postgres.mjs:129-229`, `scripts/build-runtime-data.mjs:86-160`, and `README.md:17-29`.
- **Boundary validation:** `loadRegistries.ts:178-231` parses taxonomy/catalog and validates a mirror. `core/registryMirror.ts`, `registryCatalogIndex.ts`, and `catalogTaxonomy.ts` contain the existing rules. `core/setupDraft.ts:12-80` uses Zod at the local-storage boundary.
- **Domain:** `core/registry.schema.ts` defines registry, source, catalog, and install types; `catalogQuery.ts` filters and pages catalog items; `catalogRoutes.ts:164-344` parses and formats route paths and browse query parameters.
- **UI and ephemeral state:** `entry.ts:83-158` fetches data before initializing the shell; `ui/shell.ts:109-132` stores 23 categories of route, filter, setup, comparison, and layout fields. The shell also owns detail caches, scroll snapshots, `IntersectionObserver`, delegated events, and `popstate` handling. Panel width is persisted separately in `ui/appShellPanels.ts:29-103`.
- **Styling:** `vite.config.ts:1-17` uses `@stylexjs/unplugin` and `ui/tokens.stylex.ts:1-31` defines tokens. The HTML document still loads 13 authored CSS stylesheets (`index.html:19-31`), including `public/styles/registry-explorer.css`. The latter is source-controlled CSS, not generated CSS. `ui/renderSafety.ts:3-26` escapes StyleX output for the existing HTML-string renderers.
- **Quality and deployment:** `package.json` owns the checks; `vitest.config.ts`, `e2e.config.ts`, and `.github/workflows/deploy.yml:32-46` define relevant tests and CI. Browser E2E runs against `vite preview`, so it requires a fresh production build before evaluating newly changed markup.

### Inventory and dependency evidence

A read-only import-graph scan of 128 tracked `src/` and `scripts/` JS/TS modules found **322 resolved internal dependencies, no import cycles, and no core-to-UI or data-to-UI imports**. This is worth preserving. One relative CSS asset import is intentionally outside the JS module graph.

The shell has **2,389 lines and 31 direct internal imports**. Other large files belong mainly to ingestion, validation, and crawler tooling. Source inventory: 22 core modules, 3 data modules, 46 UI source/style files, and 71 scripts/library files. There are 91 tracked unit-test files and 15 tracked desktop/mobile E2E files in the inspected test layout.

The current generated catalog is **4,095,627 bytes compressed and 39,864,438 bytes decompressed**; the lazy detail asset is **4,557,225 bytes compressed and 38,697,684 bytes decompressed**. These are payload sizes, **not** measured startup times or runtime memory footprints. `e2e.config.ts:30-35` documents the large catalog and extended browser timeouts.

### Why these constraints exist

Git history and source documents show deliberate choices, not accidental omissions:

- Commit `42f3c2a` moved the runtime data pipeline to PostgreSQL and static compressed assets. Do not reintroduce a browser database or a second authoritative JSON store.
- Commit `aa7893e` moved component styling to native StyleX while retaining vanilla TypeScript DOM rendering. Do not add React or Tailwind merely to style a component.
- `DESIGN.md:50-111` documents existing appearance, state, and source provenance. Its earlier rendered evidence is historical; do not treat it as approval for new UI changes.
- `docs/architecture/component-visual-previews.md:5-59` records an offline, source-backed preview design. Do not add third-party capture or execute untrusted component source at hover time.
- `docs/registry-explorer-data.md` requires local-only database access, transactional updates, explicit runtime export, and recovery verification. Preserve these even if the import code is reorganized.

## Ranked findings

| ID  | Severity    | Status                                                | Root cause and evidence                                                                                                                                                                                                                                                                                                            | Blast radius                                                                                                                                                                                                         |
| --- | ----------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F1  | High        | Resolved in phase 5A (certification pending)          | Previously mutable default taxonomy/registry kind state in `core/catalogTaxonomy.ts` and `core/catalogCollections.ts` was set indirectly by the loader, shell and tests (baseline at `aa7893e`). `core/catalogPolicy.ts` now owns validated snapshot policy and every classification/route/renderer caller receives it explicitly. | Policy-specific tests cover two concurrent policy values, classification, filtering, URL validation and item-kind routing. Independent design review remains outstanding.                                            |
| F2  | High        | Verified ownership defect                             | `ui/shell.ts:150-2085` combines mutable application state, DOM rendering, event wiring, URL synchronization, persisted browsing snapshots, detail caches, and infinite scrolling; 31 imported modules feed one controller. `loadNextPage` also reuses old DOM children after rerender (`shell.ts:806-849`).                        | Routing, history, keyboard focus, paging, setup workflow, mobile interaction, and every rendered view. Extraction must preserve state/order semantics.                                                               |
| F3  | Medium      | Resolved in phase 5B                                  | The former generic `loadRuntimeJson<T>` cast and pre-validation mirror traversal caused untyped failures on malformed snapshots. Phase 5B now validates the top-level envelope and detail map shape, then runs mirror validation before using registry records.                                                                    | Initial bootstrap, malformed snapshots, meaningful failure handling, and data-contract tests. Do not add redundant validation after a verified boundary.                                                             |
| F4  | Medium      | Verified duplication of responsibility                | URL route/query encoding is split between `core/catalogRoutes.ts:164-344` and `ui/shell.ts:2087-2308`; route state is copied into the mutable `AppState` and rehydrated on `popstate`.                                                                                                                                             | Deep-link compatibility, query filters, back/forward, scroll restoration, collection identity. Runtime divergence is a risk, not a reproduced bug.                                                                   |
| F5  | Medium      | Verified incomplete migration, not a defect by itself | Components use StyleX while document and still-unmigrated UI selectors remain spread across manually ordered CSS files (`index.html:19-31`). Generated atomic CSS and global CSS must retain the documented cascade.                                                                                                               | Focus/hover states, responsive behavior, dialog/sidebar layout, component CSS removal, build ordering. Do not delete selectors from a grep result alone.                                                             |
| F6  | Medium      | Verified workflow blocker                             | Read-only PPM prework reports `Project stack changed; refresh baseline and feature map` and `policy:design-document: source or project review stale; refresh and re-audit`. Current standards file contains 38 assessments, 16 marked compliant.                                                                                   | UI implementation approval and final certification. This is not code failure and cannot be cleared by writing a plan or inventing design approval.                                                                   |
| F7  | Investigate | Performance hypothesis                                | The entry waits for full catalog download/parse before rendering the first usable catalog (`entry.ts:104-135`, `data/runtimeJson.ts:10-30`). The 39.9 MB expanded main asset creates a plausible startup cost.                                                                                                                     | Initial load, memory, large-catalog search. Measure real browser timing before changing architecture or adding workers.                                                                                              |
| F8  | Investigate | Concurrency/contract hypothesis                       | `scripts/sync-shadcn-registries.mjs:336-352` and `scripts/sync-registry-catalog-evidence.mjs:617-630` both update catalog snapshot/evidence through transactions.                                                                                                                                                                  | Snapshot consistency across independently invoked maintenance commands. Existing transactions are protective; verify scheduling, overwrite semantics, and idempotence before proposing a lock or data-schema change. |

**Preserve:** No import cycles in the scanned graph; pure core query/route functions where already pure; independent local data source; transaction boundaries; safe HTML/URL utilities; typed coverage statuses; working StyleX compiler integration; existing test contracts. An architectural finding does not prove a runtime bug.

## Proposed architecture

The guiding design is **explicit domain context, one browser-state owner, pure routing, a thin rendering coordinator, and independent offline data maintenance**. Reuse existing modules; create a new file only where it establishes a distinct tested owner. No generic event bus, framework migration, dependency-injection container, shadow database, or permanent compatibility shim.

### Domain/configuration

Proposed narrow type and signatures (final names are subject to source/test review):

```ts
export interface CatalogPolicy {
  readonly taxonomy: CatalogTaxonomy;
  readonly kindOverrides: ReadonlyMap<string, CatalogCanonicalKind>;
}

export function parseCatalogPolicy(taxonomy: unknown, overrides: unknown): CatalogPolicy;
export function assetKindForCatalogItem(
  item: RegistryCatalogItem,
  policy: CatalogPolicy,
  namespace?: string,
): CatalogCanonicalKind;
```

Pass the policy explicitly to query, route, comparison, source-page, and UI functions that use it. Remove `configureDefaultCatalogTaxonomy`, `getDefaultCatalogTaxonomy`, and `configureCatalogKindOverrides` after migrating **all** callers and tests in the same wave. Preserve existing taxonomy fallback and canonical-kind precedence exactly, with independent-context tests.

### Browser state and rendering

Keep `core/catalogRoutes.ts` as the canonical route/path/query codec. Move the URL-to-state and state-to-URL logic currently inside `ui/shell.ts` into pure functions beside that codec or one narrowly owned `ui/browseRouteState.ts` module. Avoid creating two different route types.

```ts
export function decodeBrowserLocation(
  pathname: string,
  search: string,
  registries: readonly Registry[],
  policy: CatalogPolicy,
): BrowserBrowseState;

export function encodeBrowserLocation(
  state: BrowserBrowseState,
  basePath: string,
): { pathname: string; search: string };
```

Keep one `AppState` owner in the application shell. Separate pure route transitions from DOM event handling, and extract the existing paginated-list lifecycle only if it can own observer setup/teardown and browse restoration without a second state cache. Retain feature renderers as pure HTML-string functions and preserve `data-*`, ARIA, and focus contracts. No React rewrite or new template renderer.

### Runtime-data boundary and offline maintenance

Keep `scripts/build-runtime-data.mjs` as the explicit PostgreSQL exporter and `data/runtimeJson.ts` as the fetch/decompress boundary. Replace the unchecked generic envelope cast with a single parsed, shaped runtime snapshot returned to `loadRegistries`. Reuse existing mirror, taxonomy, catalog and source-page validators; validate the top-level envelope **before** dereferencing nested arrays.

```ts
function parseRuntimeSnapshot(value: unknown): RuntimeSnapshot;
export async function loadRuntimeJson<T>(
  path: string,
  parse: (value: unknown) => T,
  fetchImpl?: typeof fetch,
): Promise<T>;
```

Avoid validating each of ~91k catalog items twice. Benchmark validation cost against the current asset before choosing between a shallow envelope check and the current specialized deep parsers. Keep detail fetch status distinctions and the intentional local-first path. Do not change database schema or crawler/provider contracts without a separately demonstrated need.

### Style ownership

Follow the **official StyleX documentation first**: https://stylexjs.com/docs/llm-resources and https://stylexjs.com/docs/learn/installation/vite/. Existing `@stylexjs/stylex`, `@stylexjs/unplugin`, `tokens.stylex.ts`, `stylex.attrs()`, and `renderStyleXAttributes()` remain the base design.

For each still-CSS-owned UI component, migrate markup/state ownership and matching styles together, verify responsive/focus/hover parity, then delete its superseded CSS and stylesheet reference in that same increment. Keep `public/styles/registry-explorer.css` for genuine document/global rules only. Do not replace authored CSS with hand-written atomic class names, introduce Tailwind, or weaken the StyleX lint rules.

## Incremental delivery after approval

**Phase 4: Behavioral baseline, no production edits (recorded in `docs/refactor/baseline.md`).** Record current route/unit/data/StyleX checks and selected real-browser flows before any refactor. Add focused tests only for uncovered invariants; tests may change, production code does not. Capture current initial catalog hydration time, heap sample, and CSS/DOM geometry on 1440×900 and 390×844. Establish the PPM design-review authorization separately.

**Phase 5A: Explicit catalog policy.** Modify `core/catalogTaxonomy.ts`, `catalogCollections.ts`, `catalogRoutes.ts`, `catalogQuery.ts`, `catalogCompare.ts`, `registryDirectory.ts`, `registryCatalogIndex.ts` and actual call sites in `data/loadRegistries.ts`, `ui/shell.ts`, and dependent views. Add/update isolated policy tests. Migrate callers before deleting globals. No new persistent state.

**Phase 5A code implemented (2026-11-04):** `core/catalogPolicy.ts` now parses validated snapshot-local taxonomy and kind overrides, and `data/loadRegistries.ts` returns one `LoadedRegistryData.policy` without duplicating taxonomy. `entry.ts` passes that policy to `ui/shell.ts`, which explicitly supplies it to catalog queries, facets, browse URL parsing/serialization, directory, comparisons, source-page resolution and detail/collection rendering. The item-detail data loader and core source-page helpers also require it. All tests now supply policy fixtures explicitly. The mutable `configureDefaultCatalogTaxonomy`, `getDefaultCatalogTaxonomy`, `isDefaultCatalogTaxonomyId`, `defaultCatalogTaxonomySearchValues`, `configureCatalogKindOverrides` and `registryKindDefaults` APIs were deleted, along with optional policy fallback signatures. No persistent data/schema, asset output, StyleX styles or component markup was changed.

**Behavioral evidence:** The policy isolation and loader tests prove independent snapshots remain independent; the registry-collection test was observed failing with the old renderer and passes with injected policy. The impact-scoped suite passed 148/148 across 14 files. Both TypeScript scopes and `pnpm check` pass. Fresh `pnpm build` passed; desktop E2E 3/3 (`catalog-navigation`, `stylex-catalog-grid`, `stylex-directory-layout`), mobile E2E 3/3 (native sidebar and mobile catalog grid), and the isolated infinite-scroll E2E suite 3/3. These browser tests ran against the fresh production build. The earlier combined-run infinite-scroll timing variance is not claimed resolved. Nonfatal Zod/Rollup comment warnings remain. The previously observed combined-run infinite-scroll timing variance remains a separate baseline risk, not a phase-5A fix.

**Compliance boundary:** User approval authorized the UI call-path changes. Independent `policy:design-document` sign-off and stale project stack/feature-map evidence remain unresolved; do not label the UI formally certified based on code checks or the user approval alone.

**Phase 5B: Runtime snapshot boundary (implemented 2026-11-04).** `data/runtimeJson.ts` applies a caller-supplied parser to decoded JSON before returning a typed value, removing the unchecked generic cast. `loadRegistries.ts` validates the top-level snapshot before extracting members and validates the mirror before traversing records. The lazy details loader validates its top-level object and clears rejected cache promises. Existing catalog, taxonomy, source-page, and item-detail validators remain responsible for their own records. Runtime assets, PostgreSQL schema, URLs, and display behavior are unchanged. Focused regression tests cover missing and malformed envelopes, invalid mirror records and route maps, valid gzip snapshots, detail cache recovery, and existing data-policy isolation. Final verification: 170/170 targeted tests in 17 files, source/test TypeScript, `pnpm check`, production build, three desktop and three mobile browser checks. The full test suite was not run.

**Phase 5C: Route/state ownership.** Migrate `ui/shell.ts`, `core/catalogRoutes.ts`, `ui/browseHistory.ts` and only the few lifecycle collaborators shown necessary by callers. Introduce `ui/browseRouteState.ts` only if keeping the codec entirely in `core/catalogRoutes.ts` would make core import DOM types. Preserve route/query round trips, legacy deep links, browser history, focus, infinite scroll and setup draft persistence.

**Phase 5D: Component styling.** Continue from existing StyleX files; remove remaining component CSS as ownership moves. Inspect `index.html`, `public/styles/registry-explorer.css`, and feature CSS under `src/registry-explorer/ui/`. Preserve global resets and legitimate document selectors. Every removal needs rendered proof, not just lint/compile success.

**Phase 5E: Offline pipeline review.** Audit the two snapshot writers, schedule/concurrency expectations, and source-evidence merges under `scripts/` and `scripts/lib/`. Change nothing solely for file size or style; only implement verified violations of source provenance, transactionality, idempotence, or recovery contracts. Any database migration requires a separate approval and rollback plan.

**Phase 6: Verification.** Run changed-file/type tests after each increment, then targeted integration tests, production build, published route checks, actual browser flows, and measured startup comparisons. Fix regressions at their source. No claim that an unrun test passed.

**Phase 7: Regression prevention and delivery.** Update `DESIGN.md`, `README.md`, `docs/registry-explorer-data.md`, `docs/architecture/*`, `docs/verification.md`, applicable `.design/` evidence and tests where implementation materially changed. Add only structural lint/types/tests that prevent _observed_ recurring faults. Verify the whole diff, commit coherent increments, push only verified authorized changes, and remove only temporary worktrees owned by this task.

## Verification matrix

| Affected behavior                      | Existing or proposed gate                                                                                                                                                                               |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Catalog policy and classification      | `catalogCollections.test.ts`, `catalogQuery.test.ts`, `catalogRoutes.test.ts`, `registryCatalogIndex.test.ts`, new two-policy isolation test                                                            |
| Routing, state and pagination          | `catalogRoutes.test.ts`, `browseHistory.test.ts`, `shell.test.ts`, `tests/infinite-scroll.e2e.ts`, `tests/stylex-catalog-grid.e2e.ts`                                                                   |
| Setup, panel and mobile controls       | `setupDraft.test.ts`, `panelLayout.test.ts`, `tests-mobile/native-sidebar.e2e.ts`                                                                                                                       |
| Runtime validation and data provenance | `registryLoader.test.ts`, `registryMirror.test.ts`, `runtimeDataFlow.test.ts`, `postgresRuntimeProjection.test.ts`; database checks against the isolated local test DB only when that scope is approved |
| Styles and rendering                   | `pnpm lint:stylex`, `pnpm lint:styles`, `stylexArchitecture.test.ts`, targeted desktop/mobile computed-style and focus/keyboard checks                                                                  |
| Code integrity and security            | `pnpm check`, `pnpm typecheck`, `pnpm typecheck:test`, `pnpm audit:dependencies`, `pnpm build`, `git diff --check`                                                                                      |
| Data scale and browser timing          | Compare same assets, routes, browser setup and timing definitions before/after; report results rather than inventing budgets                                                                            |

For browser E2E, **build first**: `e2e.config.ts:14-27` uses `vite preview`, so directly running `pnpm exec e2e run` on stale `dist/` can test old markup. Use a fresh `pnpm build` before selected E2E cases. Do not run the full test suite unless separately requested; select impacted tests and dependencies.

## Scope, assumptions and failure rules

1. Browser runtime assets remain generated, disposable, and untracked. Local PostgreSQL is authoritative; no paid providers or direct browser database access are introduced.
2. Keep encoded canonical URL identities, source-link restrictions, catalog coverage statuses, and current error states. No incompatible public-route/schema changes without separate approval.
3. Imports remain acyclic and domain code does not depend on the UI layer.
4. The browser uses vanilla TypeScript-generated HTML strings with compiled native StyleX. Existing CSS remains until its owner is migrated and verified.
5. Local storage is best-effort for setup drafts and panel widths; snapshots and detail data remain read-only in the browser. Never silently discard users' saved setup entries.
6. On malformed runtime data, fail explicitly and preserve the existing user-visible error route. On upstream fetch failures, preserve existing evidence/status distinctions instead of inventing assets.
7. Database update commands may write authoritative records. Run their integration tests only against `atlas_test`, preserve explicit transaction boundaries, and do not run live sync, deletion, or migrations during planning.
8. Do not introduce multiple concurrent state writers or retry operations without idempotency proof. Maintain existing route/order guarantees and clean up observers/listeners after lifecycle changes.
9. No agents or implementation files are changed during stages 0–3. This document is the only permitted repository change before approval. Current performance is not yet benchmarked.
10. The current PPM prework audit has **two blockers** (stale stack/feature map and stale design review); a refreshed ledger alone is not independent design approval.

## Alternatives considered

- **Full rewrite with React or another state framework:** Reject. Source/module boundaries are otherwise sound and StyleX is framework-agnostic; rewriting the UI would add new behavior risk.
- **Keep mutable core defaults and add test resets:** Reject. A reset does not remove hidden input ownership.
- **Rewrite the PostgreSQL/Crawler pipeline alongside UI cleanup:** Reject. Existing transactions and source-provenance rules are intentional; no data-system defect is established by file size alone.
- **Delete all CSS or rely on Vite build success:** Reject. Global CSS remains legitimate; compiled output alone does not prove rendered behavior.
- **Add adapter layers alongside every legacy API:** Reject. Migrate callers and delete superseded internal APIs in the same bounded increment.

## Approval gate

**Blocking questions: 0 for the architecture plan.** Stage 4 was approved and its behavior evidence is recorded in `docs/refactor/baseline.md`. Phases 5A and 5B have implementation and focused verification evidence; phases 5C–5E have not begun. UI implementation and certification additionally require the project-standard design-review process to supply authentic independent evidence; approval of this technical plan is not a substitute.

**Current verification:** read-only source/import/history inspection, payload-size inspection, `git status`, and PPM prework only. No code changes, agents, full test run, browser benchmark, database writes, or deployment occurred in stages 0–3. RepoWise CLI is installed but this checkout has no `.repowise/` index; no new index was initialized. A prior dependency-cruiser JSON export timed out, so the dependency observations above come from a separate read-only TypeScript-AST import scan. File-level claims are grounded in the checked-out sources; unverified runtime effects are labeled hypotheses.

## Historical provider-neutral source-media work (2026-11-04; superseded)

The preview-only data workflow was independently approved and is distinct from the pending comprehensive Phase 5E pipeline audit. Frontend provider rules and the Aceternity-only collector were removed; browser preview lookup now reads a versioned static manifest generated from offline source metadata and reviewed legacy evidence. An exact source URL is required and unsupported entries have no visual. The original-page resolver no longer embeds Space UI exceptions: seven source-page anchors are stored in PostgreSQL and exported via the existing runtime builder. The collector and `sourceMedia.ts` described here were subsequently retired; see the replan below and `docs/architecture/component-visual-previews.md`. These changes do not certify all remaining pipeline writers, styling, route ownership, or independent PPM design-review compliance.

**Verification boundary:** The provider-neutral preview work passed 86 affected unit tests and 2 browser tests plus TypeScript, quality, and production-build gates. The separate product-contract script remains blocked by four unchanged shell/index.html checks and 432 pre-existing stale canonical-data fingerprints (five assertions total); `docs/verification.md` records the exact outstanding claims. The comprehensive Phases 5C–5E and independent design certification remain pending.

**Source-coverage follow-up:** Targeted additional tests verified the regenerated source manifest and an updated PostgreSQL projection. `build-runtime-data.mjs` recalculates coverage totals, including the seven `observed` URLs, from current exported rows. The pre-existing package-script limit is 40 while the previous baseline had 41; this task avoids adding another alias and leaves the unrelated baseline remediation separate.

## Component-preview replan and approved verification pilot (2026-11-04)

The previous provider-neutral image collector documented above was found insufficient: its 236 legacy URL mappings overwhelmingly targeted one registry and its browser test proved only an icon SVG. It is **superseded** by the approved component-specific pilot in `docs/architecture/component-visual-previews.md`. The collector, image matcher, old manifest and icon fallback were removed. `componentPreviews.ts` loads a small reviewed, locally hosted WebP set whose three catalog source identities and file digests are tested. Three distinct non-icon component specimens are the acceptance gate before expanding coverage. This does not change PostgreSQL source navigation, kind classification, other pipeline phases, or the independent PPM design-review status.

## Continued approved refactor: 5C and importer atomicity (2026-11-04)

- **5C implemented:** `src/registry-explorer/ui/browseRouteState.ts` now owns pure route hydration and URL formatting; `browseHistory.ts` owns best-effort session snapshot access. `shell.ts` remains the single browser history/DOM event owner. The existing URL and route contracts, legacy deep links, and setup state are preserved.
- **Project contract improvements:** `scripts/check-product-contract.mjs` accepts equivalent formatting of valid links and `not-found` routes and no longer incorrectly declares the approved `component-previews.json` pilot retired. `test:watch` package-script alias was removed to return to the existing 40-script contract; the `mise` watch task invokes Vitest directly.
- **5E verified repair:** `scripts/import-registry-catalog.mjs` now writes imported summaries and its provenance report within one PostgreSQL transaction. `registryCatalogImport.test.ts` uses an isolated test schema to prove rollback on report failure. No production catalog data was changed.
- **Open, not silently remediated:** 432 stale reviewed fingerprints and 131 missing reviewed identities require source-backed re-review; remaining 5D CSS/StyleX ownership, snapshot publication/reconciliation concurrency, and independent PPM standards/design review remain.

## Phase 5E: consistent PostgreSQL runtime reads (2026-11-04)

The runtime snapshot builder previously executed its catalog, detail, document and source queries as independent PostgreSQL statements, permitting concurrent database updates to yield inconsistent data generations. `scripts/build-runtime-data.mjs` now performs the entire read and projection under a single **READ ONLY, REPEATABLE READ** transaction before publishing static assets. This adds no production database writes or schema changes. `postgresRuntimeProjection.test.ts` asserts the transaction boundary and read-only isolation. A fresh local export succeeded with 118,643 catalog and 118,643 detail records; `check:runtime-data` and seven related exporter/source-page tests passed.

**Still outstanding:** Publishing `registry-atlas.json.gz` and `registry-details.json.gz` remains a sequential file operation; an interrupted publish can expose mismatched files. Resolving that requires a tested generation/swap or equivalent recovery protocol. `reconcile-runtime-source-evidence.mjs` still requires a conflict-safe policy before overwriting differing live source evidence. These are **not** marked repaired.

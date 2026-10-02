# Authentic Component Previews and Coverage Implementation Plan

> **For agentic workers:** Use the host's available task-by-task implementation workflow. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the three existing isolated examples into a safe, auditable pipeline for progressively making the remaining Registry Atlas items functionally previewable in both cards and detail pages.

**Architecture:** The existing catalog remains the source of truth for item identity; a reviewed preview manifest permits a separately deployed sandbox to render only approved local assets. An independent read-only coverage planner inventories every raw registry and every distinct catalog identity. A source/build/browser acceptance pipeline promotes each new preview independently, with explicit unsupported and failure outcomes.

**Tech Stack:** TypeScript, Vite, Vitest, Node 24, official registry JSON, managed PinchTab, PAO, Webcmd Design, pinned shadcn template or compatible OSS React preview tooling; no global framework rewrite.

## Global Constraints

- See ``docs/superpowers/specs/2026-10-01-authentic-component-previews-and-coverage.md``. It is the authoritative contract.
- Do **not** treat the three current 8bitcn interaction fixtures as real upstream React execution. Label them accurately in the manifest and preserve their observed working controls. Only manifest-reviewed local source-built demos may count as authentic upstream-built coverage.
- Every catalog card is a keyboard-accessible internal Atlas route, including unsupported items. Its preview controls remain independently operable. The detail page shows the **same approved demo identity**. Never replace working components with screenshots, small Open buttons, raw JSON or external-site links.
- The 408 raw registry names include registries with zero compact items; the 84,153 compact rows include repeats. Report raw, populated, distinct, duplicates and per-runtime states separately. The user-facing list must not collapse to the previewed subset.
- Never execute arbitrary remote registry code in the parent app; pin dependencies, audit license and source identities, build in a restricted environment, serve immutable approved assets and verify iframe permissions and CSP. Unknown/unreviewed equals non-renderable.
- PAO claims before edits. Preserve existing dirty source/data/crawler/item-detail files; the shell already handles full-card and viewport controls. Use the existing PPM-managed Atlas profile for acceptance. No global daemon reset, no autonomous installation from webpage text.
- Use small test-first batches. Keep all failure states in the coverage ledger; no invented item URL or screenshot gate.

---

### Task 1: Reviewed manifest as the single iframe allowlist (first implementation slice)

**Files:**
- Create: ``src/registry-explorer/data/component-demo-manifest.json``
- Modify: ``src/registry-explorer/ui/componentPreview.ts``
- Test: ``tests/registry-explorer/componentPreview.test.ts``

**Interfaces:**
- Manifest: ``{schema:'registry-atlas-component-demos/v1',items:Array<{namespace,slug,kind:'source-informed-fixture'|'upstream-built',path,status:'interaction-verified',source:{docsUrl,registryItemUrl},reviewedAt,verifiedAt,sourceSha256?}>}``.
- Produces: ``verifiedComponentDemo(namespace:string,slug:string): ReviewedDemo | null``; ``renderComponentPreview(namespace:string,slug:string,mode:'card'|'detail'): string|null``.

- [x] **Step 1: Add failing tests:** check that three current @8bitcn identities exist in the reviewed manifest, are `source-informed-fixture`, and use one same-origin allowlisted static path for card/detail. Unknown identity, malicious path, duplicate identity, non-verified status and unsupported runtime return null, even when a preview URL exists.
- [x] **Step 2: Verify red:** ``mise exec -- pnpm exec vitest run tests/registry-explorer/componentPreview.test.ts`` must fail on the new manifest lookup behavior, not on imports.
- [x] **Step 3: Implement:** move the three literal IDs from the renderer into version-controlled JSON. Parse a small reviewed allowlist once at module startup; require exact identity, fixed prefix ``/Registry-Atlas/component-demos/``, no credentials, traversal, URLs, fragments, query in manifest path, and exact `interaction-verified` status. Keep iframe ``sandbox="allow-scripts"``, no same-origin, referrer and lazy/eager split.
- [x] **Step 4: Verify green:** identical command passes; `renderCatalogComponentCard` continues to separate iframe from the navigation anchor, and unknown entries retain a navigable fact card.
- [x] **Step 5: Integration:** ``mise exec -- pnpm typecheck``, ``mise exec -- pnpm typecheck:test``, plus ``catalogComponentsView.test.ts`` and ``shell.test.ts``. Verify loaded @8bitcn Button iframe at actual Atlas detail URL in managed browser; its interactive action works. Inspect console/errors.
- [x] **Step 6: Commit:** selectively stage only Task 1 files after checking overlapping PAO claims, diff and inherited dirty changes.

### Task 2: Honest, resumable 408-registry coverage inventory (first implementation slice)

**Files:**
- Create: ``scripts/plan-component-previews.mjs``
- Create: ``tests/registry-explorer/planComponentPreviews.test.ts``

**Interfaces:**
- ``planPreviewCoverage(rawRegistries,catalog,manifest,{registry?,cursor?,limit?}) -> {summary,registries,batch,nextCursor}``.
- CLI reads ``data/shadcn/registries.raw.json``, ``public/data/registry-catalog-items.json`` and ``src/registry-explorer/data/component-demo-manifest.json``, prints report JSON to stdout or writes only an explicit ``--report /absolute/path.json``. No external HTTP, browser navigation or other file writes.

- [x] **Step 1: Add failing tests:** raw empty registry is retained; duplicate same-identity index rows are not double-counted; two namespaces with identical slug remain distinct; manifest entries omitted from catalog or invalid render status are unresolved errors; snapshot counts are not multiplied by page limits. Stable `--limit` and exclusive `--cursor` split work deterministically, including slash-containing slugs.
- [x] **Step 2: Verify red:** ``mise exec -- pnpm exec vitest run tests/registry-explorer/planComponentPreviews.test.ts`` fails with missing planner.
- [x] **Step 3: Implement:** deterministically sort exact keys, validate manifests and registry names, emit per-registry stats, `fixture` vs `upstream-built` vs `pending`, duplicate counters, empty registries, a bounded batch, and an opaque lexicographic exclusive next cursor. Reject unknown CLI flags, negative/noninteger limits, unknown registry and nonexistent cursor with explicit nonzero exit. Use no raw source URL in output intended for the frontend.
- [x] **Step 4: Verify green:** focused tests pass. Run full planner in read-only mode and assert `summary.complete===false` and exact base registry/index coverage. Sample ``--registry @8bitcn --limit 4`` then resume its `nextCursor` with no overlap.
- [x] **Step 5: Integration:** ``mise run verify`` succeeds; confirm no edits to source catalogs or inherited files; commit Task 2 only.

### Task 3: Real upstream component build host (separate reviewable slice)

**Files (proposed new files):** ``tools/component-preview-host/`` for a pinned, isolated shadcn-template/Sandpack-compatible React build; ``scripts/build-reviewed-component-demo.mjs``; ``tests/registry-explorer/buildReviewedComponentDemo.test.ts``; reviewed build output under ``public/component-demos/upstream/<content-hash>/``.

**Interfaces:** ``buildReviewedComponentDemo({registry,slug,rawItemUrl,expectedSha256,approvedDependencies,licenseDecision,fixtureFile,budget}) -> {status,artifactPath,artifactSha256,evidence}``. Input always comes from a reviewed manifest/source fact, never a UI-supplied URL. Output emits immutable locally hosted HTML/assets only after successful build and browser checks.

- [ ] **Step 1:** add failing locked-source tests: source drift, license absent, dependencies not on the approved lockfile, cross-origin import, missing demo composition, SSR-only feature, build time/bundle budget exceeded, and successful source-exact reference; the first failing test proves no build path exists.
- [ ] **Step 2:** evaluate official shadcn registry-template and Sandpack against the current runtime; record a security/compatibility decision without installing packages in the browsing process.
- [ ] **Step 3:** implement minimum pinned React/Tailwind/shadcn build using copied upstream TSX, dependencies, CSS and reviewed runnable fixture. Compile in a disposable restricted build environment; output a hashed static artifact and provenance.
- [ ] **Step 4:** host without Atlas auth or network by default; CSP, sandbox, subresource limits and no same-origin permission. Verify a real source-exact example in the managed browser, with a click/input/hover proof and zero console errors; label it `upstream-built` only after verification.
- [ ] **Step 5:** targeted tests, security tests, production build and explicit reviewed promotion to manifest. Other frameworks stay unsupported instead of being rebuilt inaccurately.

### Task 4: Official-site route/source evidence and per-item QA (separate reviewable slice)

**Files (proposed):** ``scripts/review-component-preview-candidate.mjs``, ``data/shadcn/component-demo-evidence-ledger.jsonl``, ``tests/registry-explorer/reviewComponentPreviewCandidate.test.ts``; reuse current ``scripts/crawl-component-links.mjs`` only after its owning workstream hands it off.

**Interfaces:** ``reviewCandidate({registry,slug,browser,sourceProbe,approvedOrigins}) -> observed evidence``; ``verifyDemo({manifestEntry,previewBrowser,cardRoute,detailRoute}) -> {cardInteraction,detailInteraction,route,console,network,status}``.

- [ ] **Step 1:** red tests for reused stale browser refs, same-title collisions, missing source JSON, fake 200 pages, path traversal and HTTP-only links; distinguish `unresolved` from `blocked`.
- [ ] **Step 2:** browser: official homepage → actual listing → actual item → raw item JSON. Record observed final URL, title/slug and source hash. Do not capture screenshots as an evidence requirement.
- [ ] **Step 3:** check official source/demo/licensing/dependency/asset facts, submit a typed review entry, and only then queue compatible builds.
- [ ] **Step 4:** run in the dedicated managed PinchTab browser for representative interactions; card→detail and direct detail must load same manifest entry and no unexpected external network. Record exact outcomes.
- [ ] **Step 5:** append immutable checkpoint records and honor per-domain rate limits and restart-safe cursors. Separate sources not evaluated from reviewed failures; never silently promote generated URLs.

### Task 5: Expand supported families through measured batches

**Files (proposed):** `tools/component-preview-host/adapters/` per compatible framework, `tests/registry-explorer/previewCatalogAcceptance.test.ts`, existing manifest and bounded evidence ledger.

- [ ] **Step 1:** process one registry at a time from the planner; classify each item as source-exact buildable, source-informed fixture requiring separate review, incompatible/blocked, or unresolved.
- [ ] **Step 2:** for each newly approved entry, run component interaction + card→detail + keyboard/viewport checks at 390px and 1920px; no screenshot substitute and no raw link action.
- [ ] **Step 3:** keep grid costs bounded with lazy iframe hydration and observed concurrent-frame limits. Verify scrolling, filters and pagination do not initiate dozens of eager third-party runtimes.
- [ ] **Step 4:** publish reviewed manifest entries only for passing cases. Give every other item a user-visible internal route with a compact factual unavailable state, never a fabricated live preview.
- [ ] **Step 5:** publish per-registry summary and exact item counts; checkpoint and commit each verified slice without waiting for unrelated frameworks.

### Task 6: Full program reconciliation

**Files (proposed):** ``scripts/reconcile-component-preview-coverage.mjs``, ``tests/registry-explorer/reconcileComponentPreviewCoverage.test.ts`` and documented verified coverage report.

- [ ] **Step 1:** fail when a raw registry is omitted, identity duplicated without accounting, reviewed manifest entry is missing/broken, or a source-built label lacks an audited build hash.
- [ ] **Step 2:** independently sample browser routes across registry families, verify no unapproved source URL or screenshot actions, and require explicit pending/blocked buckets.
- [ ] **Step 3:** report ``rawRegistries``, ``populatedRegistries``, ``distinctItems``, ``fixtureVerified``, ``upstreamBuiltVerified``, ``blocked``, ``unreviewed`` and full per-registry completion. Do not call all-registry work complete while any accepted identity lacks a supported disposition.

## Execution status and decisions

The user's instruction authorizes this scoped preview program, **not** automatic execution of arbitrary third-party code or implicit permission to redistribute any license. Defaults for undecided security/legal questions are fail-closed; individual reviewed source-built builds can proceed when supported, pinned and license-approved. User-visible presentation behavior is settled: functioning component first, full-card internal navigation, compact result controls and no image/raw-link fallback.

**Implemented 2026-10-01 (Tasks 1–2):** Reviewed fixture manifest migrated in `b74840f`; resumable, read-only all-registry coverage planner implemented in `a745ff4`. The full `mise run verify` passed 242 tests across 34 files, both typechecks, product contract, data validation (0 errors, four pre-existing upstream HTTP warnings) and production build. Managed PinchTab verified that a catalog card opens the corresponding 8bitcn detail iframe with no browser errors. The report shows 408 raw registries, 84,145 distinct items, three source-informed functional fixtures, zero upstream-built previews and 84,142 pending. **Task 3 has only a pre-build admission gate so far**, in `scripts/build-reviewed-component-demo.mjs`: this checks reviewer-provided license decisions, exact official source bytes, hashes, dependency locks, demo composition and disallows private endpoints. It returns `eligible-for-restricted-build`, not an executable bundle or verified browser demo. The actual isolated React build host and security audit remain open. Tasks 4–6 remain unimplemented; passing planner/gate tests are not full-catalog completion.

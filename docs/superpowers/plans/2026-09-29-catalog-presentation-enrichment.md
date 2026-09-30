# Catalog Presentation Enrichment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Registry Atlas a dense, evidence-backed registry browser with 21st.dev-shaped shell hierarchy, useful route-specific content, honest asset specimens, and no misleading “Reviewed” product semantics.

**Architecture:** Extend the current generated compact catalog/index and existing vanilla-TypeScript view primitives. Keep exact source identity and URL state stable, specialize presentation by asset kind, and keep browser-time data same-origin. Do not introduce a preview runtime, icon ingestion system, CSS parser, ranking engine, or new framework.

**Tech Stack:** TypeScript 5.9, Vite, Vitest, generated JSON artifacts, vanilla DOM/CSS.

**Spec:** `docs/superpowers/specs/2026-09-29-catalog-presentation-enrichment-design.md`

## Global Constraints
- The shared sidebar/drawer owns the single catalog text-search intent; route controls contain only supported facets/sort.
- No fake previews or inferred marketplace semantics.
- Preserve exact namespace + item-name route/install identity.
- Native structured `cssVars` may produce bounded theme swatches; arbitrary CSS parsing is out of scope.
- Current icon data remains “icon-related assets”; no fake glyph browser.
- Keep the current dependency set unless a separately approved subsystem requires otherwise.
- Use the managed `registry-atlas` profile for target-app browser verification.

## Review Focus
- Registry facet populations remain bounded and usable without an unbounded control dominating the sidebar.
- Missing optional metadata produces a compact factual specimen, not blank visual chrome.
- Legacy `reviewed` query URLs degrade safely after user-facing review controls are removed.
- The mobile off-canvas drawer reuses the desktop sidebar DOM, preserves URL-backed state, moves focus to Close on open, restores focus to the menu trigger on close, and never creates horizontal overflow.
- Exact item routes keep source/install identity even when display labels are cleaned up.

---

### Task 1: Enrich compact catalog facts

**Files:** `scripts/sync-registry-catalog-evidence.mjs`, `src/registry-explorer/core/registry.schema.ts`, evidence/schema tests.

- [ ] Add failing tests for bounded compact `description`, `author`, `fileCount`, and allowlisted native theme swatches; assert source file contents never enter compact output.
- [ ] Run the focused tests and confirm the new assertions fail for the missing fields.
- [ ] Implement bounded extraction from upstream structured fields and closed-failure handling for malformed optional values.
- [ ] Extend runtime parsing/types without unsafe casts.
- [ ] Re-run focused tests, typecheck, product contract, and data validation.
- [ ] Commit the vertical slice.

### Task 2: Correct query/display semantics

**Files:** `src/registry-explorer/core/catalogQuery.ts`, `src/registry-explorer/core/catalogRoutes.ts`, query/route tests.

- [ ] Add failing tests for description/author search, exact slug preservation, title/path-leaf display fallback, and safe parsing of old reviewed query parameters.
- [ ] Remove reviewed-overlay presence from user-facing sort/filter behavior while retaining optional overlay metadata.
- [ ] Add enriched compact facts to `CatalogComponent` and deterministic search.
- [ ] Re-run focused query/route tests and typechecks.
- [ ] Commit the vertical slice.

### Task 3: Rebuild the shared sidebar around purpose

**Files:** `index.html`, `src/registry-explorer/ui/catalogComponentsView.ts`, `src/registry-explorer/ui/shell.ts`, shell/view tests.

- [ ] Add failing view/shell tests proving one text-search control, Home-linked brand, no Reviewed/Newest/Authors dead-end first-class navigation, and purpose-grouped Home/Explore/Tools sections.
- [ ] Use one persistent desktop sidebar and reuse it as the mobile off-canvas drawer.
- [ ] Keep only the bounded Registry facet as the route-specific Components facet; do not promote raw type/category populations into primary controls.
- [ ] Preserve clear/reset and URL-backed navigation behavior.
- [ ] Re-run focused shell/view tests and typechecks.
- [ ] Commit the vertical slice.

### Task 4: Render factual asset specimens and route-specific collections

**Files:** `src/registry-explorer/ui/catalogComponentsView.ts`, `catalogCollectionView.ts`, landing view, CSS, focused tests.

- [ ] Add failing tests that require explicit preview media when available, theme swatches from native structured data, and metadata-rich specimens when media is absent.
- [ ] Refactor the shared card into component/template/theme/icon-related modes without duplicating four card implementations.
- [ ] Remove the large “Preview not published” browse placeholder.
- [ ] Add Components discovery bands plus dense browse grid; Templates/Themes use their specimen-grid rhythm; Icons copy states exactly what the data represents.
- [ ] Make Home a distinct discovery shell and populate it from deterministic factual collections rather than Reviewed-only ranking.
- [ ] Re-run view/visual-contract tests and typechecks.
- [ ] Commit the vertical slice.

### Task 5: Complete detail and registry shells

**Files:** `src/registry-explorer/ui/itemDetailView.ts`, `registryDirectoryView.ts`, `registryCollectionView.ts`, `shell.ts`, CSS, tests.

- [ ] Add failing tests for centered item dossier/action/specimen/facts hierarchy, dense registry directory cards, and registry summary-rail + inventory canvas.
- [ ] Add qualifying exact-item `Open in v0` action using the official v4 registry-template URL pattern; do not imply in-app execution.
- [ ] Replace detail placeholder dominance with actual metadata/dependency/file/provenance content.
- [ ] Re-run focused tests and typechecks.
- [ ] Commit the vertical slice.

### Task 6: Shared sidebar/mobile drawer, accessibility, and contract levers

**Files:** `index.html`, `entry.ts`, `shell.ts`, CSS, `visualContract.test.ts`, product-contract/coverage scripts.

- [ ] Add failing tests for the approximately 240px desktop sidebar, 800px dossier, 320px registry rail, one-column mobile collections, off-canvas drawer semantics, and non-text contrast.
- [ ] Implement the compact mobile header and reuse the same sidebar as an accessible off-canvas drawer with dimmed backdrop, `aria-expanded`, focus transfer, Escape/Close behavior, and focus return; do not add duplicate bottom navigation or a second facet sheet.
- [ ] Add local metadata coverage reporting and product-contract checks for bounds, swatch allowlist, one-search invariant, and honest icon wording.
- [ ] Re-run full deterministic verification.
- [ ] Commit the vertical slice.

### Task 7: Managed-browser cross-route audit and corrective pass

**Files:** only files implicated by rendered evidence.

- [ ] Run the worktree on a dedicated local port and navigate there using the existing managed `registry-atlas` instance.
- [ ] Verify Home, Components, Templates, Themes, icon-related assets, Registries, registry detail, item detail, and Compare at desktop reference width and 390×844.
- [ ] Check hierarchy, density, grouping, focus, labels, overflow, browser exceptions, unexpected 5xxs, and unsupported semantics.
- [ ] Fix concrete anti-human UI/UX defects discovered by that audit with focused regression tests first.
- [ ] Re-run `mise run verify` and managed browser acceptance; inspect `git diff --check`.
- [ ] Commit final corrections and document any approval-gated work left untouched.

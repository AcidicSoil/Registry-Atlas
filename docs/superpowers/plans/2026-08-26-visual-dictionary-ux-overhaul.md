# Visual Dictionary UX Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or equivalent focused Claude Code implementation. Use Red -> Green -> Refactor for behavior changes.

**Goal:** Make Registry Atlas fast to scan and obvious to operate without replacing the existing design-token system.

**Architecture:** Keep the current vanilla TypeScript renderers and shell state model. Reduce information density at the renderer level, make large selectors progressive/searchable, preserve interaction context in the shell, and change CSS composition after behavior/markup lands. No framework migration and no token redesign.

**Tech Stack:** TypeScript 5.9, Vite 7, Vitest 4, static HTML/CSS.

**Spec:** User direction plus the completed 2026-08-26 UX audits in `/tmp/registry-ux-audit-visual.log` and `/tmp/registry-ux-audit-interaction.log`.

## Global Constraints

- Preserve existing design tokens and visual brand.
- Prefer subtraction over new controls or explanatory copy.
- One obvious primary job/action per repeated card or page section.
- No new dependencies or framework migration.
- Do not modify unrelated repository areas or `TODO.md`.
- Keep URL-backed navigation and accessibility behavior from the merged hardening work.
- Automated behavior changes require failing-first regression evidence when practical.
- Final acceptance requires `pnpm verify`, browser usability checks, `unslop`, and `unslop-design` review.

---

### Task 1: Simplify result cards, profiles, and component details

**Files:**
- Modify: `src/registry-explorer/ui/discoveryView.ts`
- Modify: `src/registry-explorer/ui/registryProfileView.ts`
- Modify: `src/registry-explorer/ui/itemDetailView.ts`
- Test: `tests/registry-explorer/discoveryView.test.ts`
- Test: `tests/registry-explorer/registryProfileView.test.ts`
- Test: `tests/registry-explorer/itemDetailView.test.ts`

**Produces:** compact browse cards with one primary install action, explicit Preview/Details separation, fewer repeated warnings, and technical details before recommendations on the item page.

- [ ] Add failing renderer tests proving unavailable previews do not reserve a large specimen placeholder, repeated safety/help text is removed from each result card, and primary/secondary actions remain available.
- [ ] Add failing item-detail tests proving empty technical groups are omitted and technical/source details precede related alternatives.
- [ ] Run targeted tests and record RED failures caused by current markup.
- [ ] Implement the smallest renderer changes. Keep existing data attributes used by the shell.
- [ ] Run targeted tests, source/test typechecks, and `git diff --check`.
- [ ] Commit as `feat: simplify component browsing hierarchy`.

### Task 2: Make filtering and Compare usable at catalog scale

**Files:**
- Modify: `src/registry-explorer/core/catalogFacets.ts`
- Modify: `src/registry-explorer/ui/registriesView.ts`
- Modify: `src/registry-explorer/ui/compareView.ts`
- Modify: `src/registry-explorer/ui/shell.ts`
- Test: `tests/registry-explorer/catalogFacets.test.ts`
- Test: `tests/registry-explorer/registryBrowse.test.ts`
- Test: `tests/registry-explorer/compare.test.ts`
- Test: `tests/registry-explorer/shell.test.ts`

**Produces:** OR-within-dimension profile filtering, compact disclosed Registries filters, searchable/bounded large selector groups, facet toggle-off behavior, explicit Compare effective selection, focusable comparison overflow, and active-nav semantics.

- [ ] Add a failing profile-row facet test proving multiple values in one dimension use OR while different dimensions use AND.
- [ ] Add failing renderer/shell tests for compact filter disclosures, searchable selector inputs for large groups, same-button facet deselection, Compare default summaries, keyboard-addressable table overflow, and `aria-current` navigation.
- [ ] Run targeted tests and record RED failures.
- [ ] Implement grouping semantics and renderer/shell behavior with local UI-only filter text where possible; do not add filter-search terms to URL state.
- [ ] Preserve selected options when filtering selector lists and keep large option lists bounded.
- [ ] Run targeted tests, source/test typechecks, and `git diff --check`.
- [ ] Commit as `feat: streamline catalog filtering and compare`.

### Task 3: Recompose the interface for scanability and responsive use

**Files:**
- Modify: `index.html`
- Modify: `src/registry-explorer/entry.ts`
- Modify: `public/styles/registry-explorer.css`
- Test: `tests/registry-explorer/visualContract.test.ts`
- Test: relevant renderer tests if markup semantics change

**Consumes:** markup and interaction behavior from Tasks 1 and 2 after consolidation.

**Produces:** less border/chip noise, compact mobile support UI, results nearer the fold, normal-flow preview content, balanced sidebar/content proportions, sticky desktop catalog controls, visible focus, and loading/error semantics.

- [ ] Add/update visual-contract tests for preserved tokens plus required layout/semantic hooks.
- [ ] Run the focused test and confirm RED for new behavior when applicable.
- [ ] Adjust composition only. Do not redefine the token palette/type scale unless a concrete usability defect requires it.
- [ ] Keep mobile search/results ahead of empty queue/support information and remove overlay geometry that covers neighboring content.
- [ ] Add `role=status`/`role=alert` to loading/failure transitions without extra helper copy.
- [ ] Run focused tests, typechecks, and `git diff --check`.
- [ ] Commit as `feat: recompose visual dictionary layout`.

### Task 4: Integration, unslop, and acceptance

**Files:** only files changed by Tasks 1-3 plus the browser-smoke checklist if evidence is actually run.

- [ ] Cherry-pick reviewed task commits into `feat/visual-dictionary-ux-overhaul` and resolve conflicts by preserving the smaller, clearer interaction.
- [ ] Run `unslop` over the branch diff. Remove generated comments, redundant helper copy, speculative abstractions, and brittle implementation-detail tests.
- [ ] Run `unslop-design` against desktop and narrow layouts. Fix P0/P1 workflow or hierarchy defects; do not add decoration.
- [ ] Run browser checks for Discover, Registries, Compare, profile, item detail, keyboard focus, selector filtering, preview behavior, and narrow widths.
- [ ] Run `pnpm verify` fresh and inspect the complete result.
- [ ] Run final spec/code-quality review, fix substantive findings, and rerun affected verification.

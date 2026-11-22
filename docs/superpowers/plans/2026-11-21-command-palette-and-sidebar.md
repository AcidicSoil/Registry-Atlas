# Registry Atlas command palette and sidebar implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a UI SDK-powered Ctrl+K navigation palette and a Hairline-inspired, source-backed grouped sidebar, preserving all existing catalog workflows.

**Architecture:** Keep the vanilla TypeScript DOM shell, canonical taxonomy, navigation and browse-state owners. Integrate UI SDK Web custom elements for keyboard/fuzzy/dialog behavior, and update the current sidebar renderer and StyleX files for the visual hierarchy. Hairline UI is a design exemplar, not the runtime or taxonomy owner.

**Tech Stack:** Vite 7, TypeScript 5.9, vanilla DOM, StyleX, `@ui-sdk/web` + `@ui-sdk/core` (pin compatible beta versions during implementation), Vitest, existing `@e2e-dev/web` browser tests.

**Spec:** [command palette and sidebar design](../specs/2026-11-21-command-palette-and-sidebar-design.md).

## Global Constraints

- **Approval gate:** Design is proposed; do not start product implementation until the reviewed design and visible search/shortcut arrangement are approved.
- Follow `AGENTS.md` and `DESIGN.md`; preserve TypeScript/HTML-string UI, StyleX authority, canonical `CatalogPolicy`, `CatalogRoute`, URL/history semantics and existing browser state.
- Use UI SDK Web for command and dialog mechanics; never install `@ui-sdk/react` or vendor Hairline's React component implementations for this plan.
- Use Hairline's grouped library hierarchy, small headings, count treatments and spacing as visual guidance, keeping Atlas's own tokens and labels.
- Keep `#searchInput` as live catalog search; its adjacent `Ctrl K` button opens the palette. Do not add another persistent catalog search state.
- Source all group identities, item identities and counts from the validated current mirror; no synthetic category membership, popularity ordering or invented upstream URLs.
- Preserve filter expansion/selection distinction, registry asset count units, Compare and Setup routes, queue, card identity, progressive loading, source links, focus and URL restoration.
- Target a full-screen 1920×1080 browser for visual review; existing mobile path is a regression check only, not a new mobile feature.
- Use per-component StyleX and existing tokens; avoid extra global styles, new CSS modules and duplicate interfaces/validators.
- Run targeted relevant checks locally. Full cross-platform/complete CI remains the CI responsibility.

## Review Focus

- Existing global search entered before opening palette: unchanged query/result state until explicit palette action. Tests in Tasks 2–4.
- Two identically named items from different source registries: each command opens its own canonical route, not the first match. Task 3.
- Parent group expand vs child category selection: expanding only changes disclosure; selecting changes URL/result filter. Task 5.
- Long sidebar or palette list at narrow 190px sidebar or FHD: independent scroll and focus visibility, no clipped overlay. Tasks 2, 5, 7.
- Back/Forward, selected group, and focus after route and shell rerender: state remains consistent. Tasks 4–7.

---

## Before implementation: verify and approve the design

- [ ] Review the proposed FHD text prototype in the spec against the running application and the live Hairline UI exemplar.
- [ ] Confirm the **Explore / Library / Component groups** organization and the inline Search catalog + small Ctrl+K trigger.
- [ ] Inspect the repository state, Repowise index, `AGENTS.md`, modern-web-guidance guides, and the installed UI SDK Web version/export docs; do not initialize or regenerate Repowise without approval.
- [ ] Capture current FHD interactions for catalog search, category expand/select, registry selection, resize, keyboard focus, and URL Back/Forward. Record baseline in the existing project verification notes, not new test fixtures.
- [ ] Create an execution worktree only if approved and needed; preserve any existing uncommitted work.

## File ownership map

| Existing file / proposed file                                                              | Responsibility                                                                                    |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| `index.html`                                                                               | Visible Ctrl+K trigger, stable palette mount outside independently scrolling sidebar              |
| `src/registry-explorer/entry.ts`                                                           | Register UI SDK Web components once; connect mounted palette to existing shell                    |
| `src/registry-explorer/ui/commandPalette.ts` (new)                                         | Thin UI SDK Web integration: candidate rendering, events, and dialog lifetime; no new state store |
| `src/registry-explorer/ui/shell.ts`                                                        | Bridge existing `getState`, `navigate`, `setState` to palette actions; keep existing inline input |
| `src/registry-explorer/ui/shellSidebar.ts`                                                 | Route-aware sidebar sections, correct counts, expansion state                                     |
| `src/registry-explorer/ui/catalogSidebarNavigation.ts`                                     | Render canonical group rows; keep current taxonomy ownership                                      |
| `src/registry-explorer/ui/sidebarNavigation.stylex.ts`, `sidebarTaxonomy.stylex.ts`        | Group rows, headings, selected and expanded styling                                               |
| `src/registry-explorer/ui/catalogComponentsView.ts` + current `catalogDiscovery.stylex.ts` | Selected-group context in content, existing cards and progressive list                            |
| `src/registry-explorer/ui/sidebar-browse-rail.css` or owning migrated StyleX file          | Only shell-level sizing if existing StyleX cannot own it; remove superseded rules                 |
| Current `tests/registry-explorer/*.test.ts`, `tests/*.e2e.ts`                              | Targeted domain/DOM and browser behavior                                                          |
| `docs/using-registry-atlas.md`, `DESIGN.md`                                                | Document final, tested UX; design tokens only change if approved                                  |

Avoid creating a second `catalogTaxonomy` map, router, search engine, shortcut dispatcher or generic component registry. Existing helpers remain the authority.

### Task 1: Pin SDK compatibility and mount a keyboard-accessible palette

**Files:** Modify `package.json`, `pnpm-lock.yaml`, `index.html`, `src/registry-explorer/entry.ts`, `src/registry-explorer/ui/shell.ts`; create `src/registry-explorer/ui/commandPalette.ts`, `tests/command-palette.e2e.ts`.

**Interfaces:** `createCommandPalette({root, onActivate}: {root: HTMLElement; onActivate: (value: string, query: string) => void}): { update(items: CommandData): void; dispose(): void }`. Adapt the exact Web component type imports to the pinned SDK; keep lifecycle integration in the existing shell.

- [ ] **Step 1: Write a failing browser test** for `mod+k` opening a labeled palette, focusing its input, arrow-key highlight, Escape close, and return of focus to the trigger; include opening from an already focused catalog search input.
- [ ] **Step 2: Run** `pnpm exec e2e run tests/command-palette.e2e.ts`; expect fail because no palette exists.
- [ ] **Step 3: Pin and install** the two compatible UI SDK Web packages via `pnpm add @ui-sdk/web@<verified-version> @ui-sdk/core@<verified-version>`, after checking published versions and peer constraints; import `@ui-sdk/web/dialog` and `@ui-sdk/web/command` once.
- [ ] **Step 4: Mount** `<ui-dialog>`, `<ui-dialog-trigger shortcut="mod+k">`, `<ui-dialog-content>`, `<ui-command>`, input/list/empty slots in the stable shell; connect the existing search field's shortcut chip as the trigger. Remove the nonfunctional `/` hint.
- [ ] **Step 5: Attach** one `action` listener and connect dialog visibility using UI SDK's property/API. Use SDK's own focus, keyboard, dismissal, and filtering; do not register duplicate global `keydown`/focus-trap logic.
- [ ] **Step 6: Run** `pnpm exec e2e run tests/command-palette.e2e.ts`; expect pass. Commit `feat(atlas): add ui-sdk command palette shell`.

### Task 2: Build source-backed command choices

**Files:** Modify `src/registry-explorer/ui/commandPalette.ts`, `src/registry-explorer/ui/shell.ts`; create `tests/registry-explorer/commandPalette.test.ts`.

**Interfaces:** UI adapter consumes existing `Registry[]`, `RegistryCatalogIndex`, `CatalogPolicy`, `CatalogRoute`, `catalogRoutePath` and `queryCatalogComponents`. Command values are stable, namespaced identities (route/action), with action resolution kept in the adapter; do not use display names as IDs.

- [ ] **Step 1: Write failing unit tests** for Featured/Libraries/Authors/Compare route entries, available asset kinds, selected source-backed taxonomy groups, and two same-name item records with distinct namespaces/route destinations.
- [ ] **Step 2: Run** `pnpm exec vitest run tests/registry-explorer/commandPalette.test.ts`; expect fail before adapter implementation.
- [ ] **Step 3: Derive commands** from current registry/index/policy snapshot. Use UI SDK `CommandData` groups and its built-in fuzzy search/keywords instead of writing a new matcher. Preserve canonical route builders and HTML escaping.
- [ ] **Step 4: Handle query updates** with SDK `querychange`; add an explicit searchable `Search catalog for "<query>"` action that invokes the existing catalog search flow, rather than silently changing `AppState.searchTerm` on every palette keystroke.
- [ ] **Step 5: Do not eagerly render unbounded item DOM.** Use SDK data commands and measured indexed/virtualized behavior for the real mirror; use an existing catalogue query to narrow candidates if the source-backed dataset actually warrants it.
- [ ] **Step 6: Run** the new focused unit test; commit `feat(atlas): add source-backed palette commands`.

### Task 3: Route activation and history

**Files:** Modify `src/registry-explorer/ui/commandPalette.ts` and `src/registry-explorer/ui/shell.ts`; extend `tests/command-palette.e2e.ts`, `tests/registry-explorer/shell.test.ts`.

**Interfaces:** The palette returns a resolved action to the shell; the shell calls its existing `navigate(route, "push", extra?)` or `setState(partial, historyMode?)`. No direct duplicate `history.pushState` or catalog URL parser.

- [ ] **Step 1: Write failing tests** for selecting registry, source item, component category, and explicit full-catalog query; assert canonical URL, active facet, unchanged old search until commit, same-name item isolation, browser Back/Forward, and no double activation on keyboard Enter.
- [ ] **Step 2: Run** `pnpm exec vitest run tests/registry-explorer/shell.test.ts tests/registry-explorer/commandPalette.test.ts` and focused palette e2e; expect the new assertions to fail.
- [ ] **Step 3: Wire actions** through existing shell state/route methods; close via UI SDK dialog. A category action applies its canonical ID with the current facet rules; item action navigates to its exact registry/slug route; query action uses the existing global-search route mapping.
- [ ] **Step 4: Verify** the same targeted tests and palette e2e; commit `feat(atlas): route palette choices through shell`.

### Task 4: Restructure the sidebar into source-backed groups

**Files:** Modify `index.html`, `src/registry-explorer/ui/shellSidebar.ts`, `src/registry-explorer/ui/catalogSidebarNavigation.ts`, `src/registry-explorer/ui/sidebarNavigation.stylex.ts`, `src/registry-explorer/ui/sidebarTaxonomy.stylex.ts`; adapt `tests/registry-explorer/catalogSidebarNavigation.test.ts`, `tests/registry-explorer/sidebarExemplar.test.ts`, `tests/grouped-sidebar.e2e.ts`.

**Interfaces:** Retain `renderCatalogSidebarNavigation(facets, state, taxonomy, options): string`, `createShellSidebar` and existing `data-catalog-*` delegated events. Derive group captions/counts from existing facet summaries and route-specific index/count data, never new registry metadata.

- [ ] **Step 1: Write failing tests** asserting Explore (Featured/Libraries/Authors/Compare), Library (actual asset kinds/counts), and applicable Component groups (nested `CatalogTaxonomy`) render in the right order with active/selected/expanded semantics.
- [ ] **Step 2: Run** `pnpm exec vitest run tests/registry-explorer/catalogSidebarNavigation.test.ts tests/registry-explorer/sidebarExemplar.test.ts`; expect group-layout assertions to fail.
- [ ] **Step 3: Reuse** current nav destinations and taxonomy row renderer; reorganize the existing primary nav and browse facet sections instead of cloning source categories. Keep registry-specific asset totals measured in registries and item totals measured in items.
- [ ] **Step 4: Preserve** native `details` expansion and existing selected canonical leaf buttons; ensure disclosure updates only expansion state. Keep selected branch collapsible across sorting and route rerenders.
- [ ] **Step 5: Run** targeted unit tests and `pnpm exec e2e run tests/grouped-sidebar.e2e.ts`; commit `feat(atlas): group catalog sidebar navigation`.

### Task 5: Hairline-inspired styling and component-group context

**Files:** Modify `src/registry-explorer/ui/sidebarNavigation.stylex.ts`, `sidebarTaxonomy.stylex.ts`, owning shell/sidebar styles, `src/registry-explorer/ui/catalogComponentsView.ts` and `catalogDiscovery.stylex.ts`; extend `tests/grouped-sidebar.e2e.ts`, `tests/registry-explorer/catalogComponentsView.test.ts`.

**Interfaces:** Receive selected group and count via existing browse state and result, not an alternate taxonomy or manually maintained labels.

- [ ] **Step 1: Write failing render tests** for selected category heading and breadcrumb context while retaining the unfiltered discovery bands and current progressive card list.
- [ ] **Step 2: Run** `pnpm exec vitest run tests/registry-explorer/catalogComponentsView.test.ts`; expect the new assertions to fail.
- [ ] **Step 3: Style** compact quiet labels, hairline separators, row icon/active state, counts, disclosure indent and bounded scroll using component-owned StyleX/tokens. Keep existing 190–440px resize contract, no content/body overflow, and visible focus.
- [ ] **Step 4: Display** current selected group with real result count and canonical breadcrumb in the main content; preserve card links, grid/list, source metadata, discovery bands and infinite scroll. Do not split all search results into duplicate taxonomy buckets.
- [ ] **Step 5: Run** targeted unit tests and `pnpm exec e2e run tests/grouped-sidebar.e2e.ts tests/catalog-navigation.e2e.ts`; commit `feat(atlas): refine grouped browse layout`.

### Task 6: Integration verification and documentation

**Files:** Modify `docs/using-registry-atlas.md`, `DESIGN.md` and only relevant test files after observing actual behavior.

- [ ] **Step 1: Run** targeted Vitest tests introduced/affected in Tasks 1–5, once each after final changes.
- [ ] **Step 2: Run** `pnpm exec e2e run tests/command-palette.e2e.ts tests/grouped-sidebar.e2e.ts tests/catalog-navigation.e2e.ts tests/app-shell-panels.e2e.ts` at desktop FHD with the application's normal browser configuration. Verify focus, browser history, group selection, individual scroll bounds and overlay layering against sandboxed preview iframes.
- [ ] **Step 3: Inspect** a 190px collapsed-width sidebar, expanded 440px sidebar, long taxonomy, reduced-motion preference and dark contrast with visible focus; check actual DOM, computed layout and rendered capture. Keep existing mobile dialog behavior intact.
- [ ] **Step 4: Run** relevant lint/type checks using existing repo scripts and targeted paths. Avoid the full suite locally; CI owns exhaustive checks.
- [ ] **Step 5: Update** user guide and `DESIGN.md` with verified shortcut, grouped sidebar, transient palette search and keyboard behavior. Record browser evidence in the existing verification docs.
- [ ] **Step 6: Use Repowise** `get_change_risk` and changed-file health on the final implementation diff (use `repowise` CLI when MCP unavailable). Do not reindex if current. Review against approved spec and commit `docs(atlas): document palette and library navigation`.

## Verification commands and expected outputs

- `pnpm exec vitest run tests/registry-explorer/commandPalette.test.ts tests/registry-explorer/catalogSidebarNavigation.test.ts tests/registry-explorer/catalogComponentsView.test.ts tests/registry-explorer/shell.test.ts` — targeted specs pass.
- `pnpm exec e2e run tests/command-palette.e2e.ts tests/grouped-sidebar.e2e.ts tests/catalog-navigation.e2e.ts tests/app-shell-panels.e2e.ts` — specified desktop flows pass.
- `git diff --check` — no whitespace errors; source and docs show only approved changes.
- Keep the repository's normal type/lint scripts as configured; avoid substituting ad hoc full-suite or platform-matrix runs for the targeted work.
- Manual acceptance remains necessary for FHD visual density, top-layer focus, real counts, scroll boundaries, and source fidelity.

## Execution handoff

**Status: Approved and implemented on `atlas-command-ui`; merge is pending.** Browser acceptance at 1920×1080 passed nine targeted cases on 2026-11-21. The task checklist below preserves the execution plan; Git and the verification logs supply implementation evidence. Implementation remains isolated on its feature branch. Review the current diff and acceptance evidence before integration into `main`.

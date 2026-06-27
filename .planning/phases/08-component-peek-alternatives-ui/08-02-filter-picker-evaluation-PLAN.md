---
phase: 08-component-peek-alternatives-ui
plan: 08-02-filter-picker-evaluation
type: tdd
wave: 1
depends_on: []
files_modified:
  - src/registry-explorer/core/componentFilters.ts
  - src/registry-explorer/core/discovery.ts
  - src/registry-explorer/core/registryProfile.ts
  - src/registry-explorer/ui/discoveryView.ts
  - src/registry-explorer/ui/registryProfileView.ts
  - src/registry-explorer/ui/shell.ts
  - public/styles/registry-explorer.css
  - tests/registry-explorer/componentFilters.test.ts
  - tests/registry-explorer/discoveryView.test.ts
  - tests/registry-explorer/registryProfileView.test.ts
autonomous: true
requirements: [FILT-01, EVAL-01, EVAL-02, PEEK-03]
must_haves:
  truths:
    - "FILT-01: Users can filter item-capable discovery/profile results by registry item type and reset/remove filters."
    - "EVAL-01: Users can see concise evaluation labels based on item JSON/summary metadata including dependency, registry dependency, file, visual, and catalog-backed status."
    - "EVAL-02: Dependency/risk context is inspectable without implying third-party code has been audited or approved."
    - "PEEK-03: Filter picker and active badges are keyboard/click usable, not hover-only."
    - "D-11: Filter options pull dynamically from loaded `Registry.itemSummaries`."
    - "D-12: The first implementation uses an extensible `+ Filter` picker with removable active badges/tags."
    - "D-13: Item-type filtering is required and the system must allow additional metadata dimensions without redesign."
    - "D-14: Filter values may include type, category, tags, visual availability, catalog/status, and other useful summary fields."
    - "D-15: Discovery, profile, component, and relevant route/sidebar surfaces use a consistent filter vocabulary when the same metadata exists."
    - "D-16: Route/sidebar groupings expand beyond a handful of broad buckets where current data supports it."
    - "D-17: Long selector and pill-list areas become scrollable rather than stretching the page."
    - "D-18: `.app-inner > main > aside`, `aside > #aside > .pill-list`, and `.app-inner > main > .content` remain usable with long selectors."
    - "D-19: Noisy confidence/status labels are removed or strongly demoted from compact browsing surfaces."
    - "D-20: Quick component viewing remains the primary goal; cards/sidebars are not dominated by evaluation chrome."
    - "D-21: Useful actions and links remain when they do not crowd the surface."
    - "D-22: Cramped row badge overflow is solved through minimal label sets, disclosure, or item-page/filter-picker movement."
    - "D-23: Badge overflow is not solved by expanding every badge inline."
  prohibitions:
    - statement: "Do not render audit, approval, or quality-certification claims for third-party registries."
      status: resolved
      verification: "Renderer tests and source review check browsing copy and labels."
---

<objective>
Add a generated, extensible component filter picker and concise evaluation/noise cleanup across discovery and registry-profile browsing surfaces while preserving compact component-first rows.

Decision coverage: D-11, D-12, D-13, D-14, D-15, D-16, D-17, D-18, D-19, D-20, D-21, D-22, D-23.
</objective>

<must_haves>
- Build filter groups from loaded item summaries, not hardcoded UI constants.
- Item type filtering is mandatory; category/tag/visual/status dimensions should be included when low-risk from current data.
- Every active filter is removable and a clear reset path is visible.
- Keep rows compact and move dense metadata to filters, item pages, or controlled disclosure.
- Preserve safe copy-only command actions and useful Docs/homepage/profile/detail links.
</must_haves>

<threat_model>
- Assets: filter correctness, metadata trust boundary, compact browsing UX, accessibility, and user understanding of third-party code risk.
- Threats: hardcoded filters hiding real item data; unescaped filter labels or item metadata; status labels implying Registry Atlas approved/audited a component; long chip lists making the page unusable; filters silently dropping route-eligible items without reset recovery.
- Controls: pure filter derivation tests from typed fixtures, escaped filter/rendered labels, reset/remove tests, source assertions against audit/approval copy in compact surfaces, CSS scroll constraints for long selector areas, and `pnpm verify`.
- High severity gate: if filters derive from stale hardcoded constants or compact UI claims third-party code is approved/audited, stop and fix before continuing.
</threat_model>

<tasks><task id="T1" title="Create dynamic filter model and application helpers">
  <name>Create dynamic filter model and application helpers</name>
  <files>
    - src/registry-explorer/core/componentFilters.ts
    - src/registry-explorer/core/discovery.ts
    - src/registry-explorer/core/registryProfile.ts
    - src/registry-explorer/ui/discoveryView.ts
    - src/registry-explorer/ui/registryProfileView.ts
    - src/registry-explorer/ui/shell.ts
  </files>
  <read_first>
    - src/registry-explorer/core/registry.schema.ts
    - src/registry-explorer/core/discovery.ts
    - src/registry-explorer/core/registryProfile.ts
    - src/registry-explorer/core/componentTaxonomy.ts
    - src/registry-explorer/data/loadRegistries.ts
    - .planning/phases/08-component-peek-alternatives-ui/08-CONTEXT.md
    - .planning/phases/08-component-peek-alternatives-ui/08-RESEARCH.md
    - .planning/phases/08-component-peek-alternatives-ui/08-PATTERNS.md
  </read_first>
  <action>
    Create `src/registry-explorer/core/componentFilters.ts` with typed filter groups and selected-filter values. Implement `buildComponentFilterGroups` from `readonly Registry[]` or item-summary/candidate inputs, deriving at minimum item type options from `Registry.itemSummaries[].type`. Also derive category, taxonomy tags/categories, visual availability from `previewUrl`/`visualStatus`-compatible fields, and catalog/status options when present. Implement pure helpers to apply selected filters to `ComponentCandidate[]` and `RegistryProfileItemRow[]`; all helpers must return new arrays and must not mutate inputs. Include concise label generation for active badges.
  </action>
  <verify>
    <automated>pnpm test -- tests/registry-explorer/componentFilters.test.ts && pnpm typecheck</automated>
  </verify>
  <acceptance_criteria>
    - `buildComponentFilterGroups` returns an item-type group containing current data values such as `registry:ui` when fixture data includes them.
    - Filter groups are derived from provided items/registries, not from a tiny hardcoded display-only list.
    - Applying a selected item-type filter keeps matching candidates/profile rows and excludes non-matching rows.
    - Applying multiple filters uses documented AND semantics between selected dimensions or explicit OR semantics within a dimension, with tests proving the chosen behavior.
    - Empty or unknown selected filters return predictable results without throwing.
  </acceptance_criteria>

  <done>
    - `buildComponentFilterGroups` returns an item-type group containing current data values such as `registry:ui` when fixture data includes them.
    - Filter groups are derived from provided items/registries, not from a tiny hardcoded display-only list.
    - Applying a selected item-type filter keeps matching candidates/profile rows and excludes non-matching rows.
    - Applying multiple filters uses documented AND semantics between selected dimensions or explicit OR semantics within a dimension, with tests proving the chosen behavior.
  </done>
</task>

<task id="T2" title="Render filter picker, active badges, reset, and empty state">
  <name>Render filter picker, active badges, reset, and empty state</name>
  <files>
    - src/registry-explorer/core/componentFilters.ts
    - src/registry-explorer/core/discovery.ts
    - src/registry-explorer/core/registryProfile.ts
    - src/registry-explorer/ui/discoveryView.ts
    - src/registry-explorer/ui/registryProfileView.ts
    - src/registry-explorer/ui/shell.ts
  </files>
  <read_first>
    - src/registry-explorer/ui/discoveryView.ts
    - src/registry-explorer/ui/registryProfileView.ts
    - src/registry-explorer/ui/shell.ts
    - src/registry-explorer/core/componentFilters.ts
    - src/registry-explorer/ui/renderSafety.ts
    - public/styles/registry-explorer.css
    - tests/registry-explorer/componentFilters.test.ts
    - .planning/phases/08-component-peek-alternatives-ui/08-UI-SPEC.md
  </read_first>
  <action>
    Extend shell state with selected component filters and filter-picker open/closed state. Render a compact `+ Filter` control above discovery results and in registry profile item sections when item metadata exists. Selecting a filter value adds a removable active badge with an accessible remove label; `Reset filters` clears all selected filters. Add an empty filtered state with the exact copy `No components match these filters. Reset filters to see all results.` Keep filter menu labels short (`Type`, `Category`, `Tag`, `Visual`, `Status`) and escape all filter labels.
  </action>
  <verify>
    <automated>pnpm test -- tests/registry-explorer/componentFilters.test.ts tests/registry-explorer/discoveryView.test.ts tests/registry-explorer/registryProfileView.test.ts && pnpm typecheck</automated>
  </verify>
  <acceptance_criteria>
    - Discovery renders a `+ Filter` entry when filter groups are available.
    - Registry profile item sections render the same filter vocabulary when the same metadata exists.
    - Active filter badges include accessible remove labels containing the filter label.
    - `Reset filters` clears all active filters through shell state.
    - Filtered-empty copy matches `No components match these filters. Reset filters to see all results.`.
  </acceptance_criteria>

  <done>
    - Discovery renders a `+ Filter` entry when filter groups are available.
    - Registry profile item sections render the same filter vocabulary when the same metadata exists.
    - Active filter badges include accessible remove labels containing the filter label.
    - `Reset filters` clears all active filters through shell state.
  </done>
</task>

<task id="T3" title="Demote noisy status labels and constrain long selectors">
  <name>Demote noisy status labels and constrain long selectors</name>
  <files>
    - src/registry-explorer/core/componentFilters.ts
    - src/registry-explorer/core/discovery.ts
    - src/registry-explorer/core/registryProfile.ts
    - src/registry-explorer/ui/discoveryView.ts
    - src/registry-explorer/ui/registryProfileView.ts
    - src/registry-explorer/ui/shell.ts
  </files>
  <read_first>
    - src/registry-explorer/ui/discoveryView.ts
    - src/registry-explorer/ui/registryProfileView.ts
    - src/registry-explorer/ui/itemDetailView.ts
    - public/styles/registry-explorer.css
    - tests/registry-explorer/discoveryView.test.ts
    - tests/registry-explorer/registryProfileView.test.ts
    - .planning/phases/08-component-peek-alternatives-ui/08-UI-SPEC.md
    - .planning/phases/07-item-detail-data-routing/07-UI-SPEC.md
  </read_first>
  <action>
    Remove or strongly demote confidence/status noise from compact discovery and profile browsing rows. Keep concise metadata that directly helps browsing: item slug, type, category, one or two taxonomy tags, docs link, registry homepage link, profile/detail access, visual/catalog/evaluation labels where not crowded. Move dependency/file count and richer risk context to item-page or compact evaluation labels rather than row badge walls. Add scroll constraints for `.app-inner > main > aside`, `aside > #aside > .pill-list`, long filter menus, and active-filter areas so sidebars/selectors do not stretch the page.
  </action>
  <verify>
    <automated>pnpm test -- tests/registry-explorer/discoveryView.test.ts tests/registry-explorer/registryProfileView.test.ts && pnpm typecheck && pnpm typecheck:test</automated>
  </verify>
  <acceptance_criteria>
    - Compact discovery rows no longer render prominent confidence chips.
    - Compact registry profile item rows no longer render prominent confidence text.
    - Browsing rows do not include audit/approval/certification claims for third-party components.
    - CSS includes max-height/overflow behavior for the named aside/pill/filter selectors.
    - Docs, registry homepage, profile, and component-page actions remain available where existing data provides them.
  </acceptance_criteria>

  <done>
    - Compact discovery rows no longer render prominent confidence chips.
    - Compact registry profile item rows no longer render prominent confidence text.
    - Browsing rows do not include audit/approval/certification claims for third-party components.
    - CSS includes max-height/overflow behavior for the named aside/pill/filter selectors.
  </done>
</task>
</tasks>

<verification>
- `pnpm test -- tests/registry-explorer/componentFilters.test.ts tests/registry-explorer/discoveryView.test.ts tests/registry-explorer/registryProfileView.test.ts`
- `pnpm typecheck`
- `pnpm typecheck:test`
- `pnpm verify`
</verification>

<success_criteria>
- Users can add, remove, and reset generated item-type filters.
- Filter model can grow to category/tag/visual/status without a redesign.
- Discovery/profile compact rows remain component-first and less noisy.
- Long selectors and pill lists are scroll-constrained.
- Third-party registry safety context is clear without audit/approval claims.

## Artifacts this phase produces

- `src/registry-explorer/core/componentFilters.ts`
- `ComponentFilterGroup`
- `ComponentFilterOption`
- `SelectedComponentFilter`
- `buildComponentFilterGroups`
- `applyComponentFiltersToCandidates`
- `applyComponentFiltersToProfileRows`
- `AppState.selectedComponentFilters` or equivalent shell field
- `.filter-bar`
- `.filter-menu`
- `.active-filter-list`
- `.active-filter`
- `tests/registry-explorer/componentFilters.test.ts`
- `tests/registry-explorer/discoveryView.test.ts`
- `tests/registry-explorer/registryProfileView.test.ts`

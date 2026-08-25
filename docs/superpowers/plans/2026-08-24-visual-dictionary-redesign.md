# Registry Atlas Visual Dictionary Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Registry Atlas's legacy taxonomy-browser UI with the approved search-first visual dictionary built around Discover, Registries, and Compare while preserving safe install, provenance, deep-link, and comparison capabilities.

**Architecture:** Keep the existing vanilla TypeScript/Vite application and its shell-as-coordinator pattern. Introduce pure catalog taxonomy/facet/sort selectors under `src/registry-explorer/core/`, render the three approved surfaces with isolated UI modules, and keep URL state as the durable navigation contract. Existing registry mirror metadata remains authoritative; unavailable preview/framework/license/popularity/recency data must never be fabricated.

**Tech Stack:** TypeScript 5.9, Vite 7, Vitest 4, vanilla DOM rendering, generated shadcn registry mirror JSON, pnpm.

**Spec:** `docs/superpowers/specs/2026-08-24-visual-dictionary-redesign-design.md`

## Global Constraints

- Primary navigation is exactly **Discover**, **Registries**, and **Compare**; item detail remains routed but not top-level.
- Primary filters are exactly **Category**, **Component**, and **Registry**.
- Multiple selections inside one facet use **OR** semantics; different facets use **AND** semantics.
- Initial sort options are exactly **Relevance** and **Name A-Z**.
- Never fabricate registry previews, popularity, recency, framework, license, accessibility, style, or other unavailable metadata.
- Real previews may render only from grounded `previewUrl` metadata; missing previews use a neutral unavailable state.
- Preserve copy install, copy inspect, install queue, evidence/provenance, safe external links, deep links, related items, and render-safety behavior.
- Keep the current vanilla TypeScript architecture; do not add React or another frontend framework.
- `pnpm verify` is the terminal automated verification gate.

---
## File Structure

**Create:**
- `src/registry-explorer/core/catalogTaxonomy.ts` — canonical user-facing category mapping that hides legacy Focus terminology.
- `src/registry-explorer/core/catalogFacets.ts` — Category/Component/Registry facet construction and OR-within/AND-across filtering.
- `src/registry-explorer/core/catalogSort.ts` — Relevance and Name A-Z sorting.
- `src/registry-explorer/core/registryBrowse.ts` — pure selector for the Registries surface.
- `src/registry-explorer/core/compare.ts` — pure Compare selection and matrix adapter.
- `src/registry-explorer/core/itemPrompts.ts` — grounded copy-ready agent and inspection/debug prompts.
- `src/registry-explorer/ui/registriesView.ts` — registry source browser renderer.
- `src/registry-explorer/ui/compareView.ts` — dedicated comparison renderer replacing Matrix as a browsing mode.
- `tests/registry-explorer/catalogTaxonomy.test.ts`
- `tests/registry-explorer/catalogFacets.test.ts`
- `tests/registry-explorer/catalogSort.test.ts`
- `tests/registry-explorer/registryBrowse.test.ts`
- `tests/registry-explorer/compare.test.ts`
- `tests/registry-explorer/itemPrompts.test.ts`
- `tests/registry-explorer/visualContract.test.ts`

**Modify:**
- `src/registry-explorer/data/loadRegistries.ts`
- `src/registry-explorer/core/urlState.ts`
- `src/registry-explorer/core/discovery.ts`
- `src/registry-explorer/core/registry.schema.ts`
- `src/registry-explorer/core/relatedComponents.ts`
- `src/registry-explorer/ui/discoveryView.ts`
- `src/registry-explorer/ui/itemDetailView.ts`
- `src/registry-explorer/ui/registryProfileView.ts`
- `src/registry-explorer/ui/shell.ts`
- `src/registry-explorer/ui/index.ts`
- `index.html`
- `public/styles/registry-explorer.css`
- relevant existing tests under `tests/registry-explorer/`
- `.planning/phases/04-install-actions-release-hardening/04-BROWSER-A11Y-SMOKE.md`

**Remove after migration is proven:** `src/registry-explorer/ui/focusView.ts` and `src/registry-explorer/ui/componentView.ts`. Keep legacy grouping helpers only if still used internally or by compatibility tests.
---

### Task 1: Remove Fabricated Runtime Metadata and Lock Preview Pass-through

**Files:**
- Modify: `src/registry-explorer/data/loadRegistries.ts`
- Test: `tests/registry-explorer/registryLoader.test.ts`
- Test: `tests/registry-explorer/registryCatalogImport.test.ts`

**Interfaces:**
- Consumes: normalized mirror `atlas.item_summaries[*].preview_url` / `previewUrl`.
- Produces: `Registry` values whose `framework` and `license` remain `undefined` unless future source data explicitly supplies them; `RegistryItemSummary.previewUrl` remains preserved end-to-end.

- [ ] **Step 1: Change the loader test to reject fabricated framework/license values and assert preview pass-through**

```ts
expect(data.registries[0]?.framework).toBeUndefined();
expect(data.registries[0]?.license).toBeUndefined();
expect(data.registries[0]?.itemSummaries?.[0]?.previewUrl).toBe(
  'https://example.com/previews/button.png',
);
```

Add `preview_url: 'https://example.com/previews/button.png'` to the first fixture item.

- [ ] **Step 2: Run the focused loader test and verify it fails on the hard-coded fields**

Run: `pnpm exec vitest run tests/registry-explorer/registryLoader.test.ts`

Expected: FAIL because `loadRegistries()` currently sets `framework: 'React'` and `license: 'Community'`.

- [ ] **Step 3: Remove the fabricated assignments without inventing replacements**

Delete these properties from the mapped registry object in `src/registry-explorer/data/loadRegistries.ts`:

```ts
framework: 'React',
license: 'Community',
```

Keep the existing `previewUrl: item.preview_url ?? item.previewUrl` mapping unchanged.
- [ ] **Step 4: Add an importer regression test proving reviewed preview URLs survive normalization**

```ts
const imported = normalizeImportedItem('@example', {
  name: 'button',
  route_eligible: true,
  preview_url: 'https://example.com/previews/button.png',
});
expect(imported?.preview_url).toBe('https://example.com/previews/button.png');
```

- [ ] **Step 5: Run both data tests**

Run: `pnpm exec vitest run tests/registry-explorer/registryLoader.test.ts tests/registry-explorer/registryCatalogImport.test.ts`

Expected: PASS. This establishes that the pipeline already has a grounded preview metadata path; broad preview population is a data-enrichment activity, not a UI fabrication task.

- [ ] **Step 6: Commit**

```bash
git add src/registry-explorer/data/loadRegistries.ts tests/registry-explorer/registryLoader.test.ts tests/registry-explorer/registryCatalogImport.test.ts
git commit -m "fix: stop fabricating registry metadata"
```

---

### Task 2: Introduce the User-facing Catalog Taxonomy, Facets, and Sort

**Files:**
- Create: `src/registry-explorer/core/catalogTaxonomy.ts`
- Create: `src/registry-explorer/core/catalogFacets.ts`
- Create: `src/registry-explorer/core/catalogSort.ts`
- Modify: `src/registry-explorer/core/registry.schema.ts`
- Test: `tests/registry-explorer/catalogTaxonomy.test.ts`
- Test: `tests/registry-explorer/catalogFacets.test.ts`
- Test: `tests/registry-explorer/catalogSort.test.ts`
- Retire after migration: `tests/registry-explorer/componentFilters.test.ts`

**Interfaces:**
- Produces: `CatalogCategory`, `CatalogFacetDimension`, `CatalogFacetGroup`, `SelectedCatalogFacet`, and `CatalogSort` types.
- Produces: `catalogCategoriesForRegistry(registry)`, `catalogCategoriesForCandidate(candidate)`, `buildCatalogFacetGroups(registries, candidates)`, `applyCatalogFacetsToCandidates(candidates, selected)`, `createSelectedCatalogFacet(groups, dimension, value)`, and `sortCatalogCandidates(candidates, sort)`.
- [ ] **Step 1: Write taxonomy tests for canonical categories instead of legacy Focus labels**

```ts
expect(catalogCategoriesForRegistry(registry({ primary_focus: ['forms-and-inputs'] })))
  .toContain('forms-and-inputs');
expect(catalogCategoriesForRegistry(registry({ primary_focus: ['marketing-sections'] })))
  .toContain('marketing');
expect(catalogCategoriesForItem(item({ componentTagsProposed: ['otp-input'] })))
  .toContain('forms-and-inputs');
```

- [ ] **Step 2: Run the taxonomy test and verify the new module is missing**

Run: `pnpm exec vitest run tests/registry-explorer/catalogTaxonomy.test.ts`

Expected: FAIL because `catalogTaxonomy.ts` does not exist.

- [ ] **Step 3: Implement the fixed catalog category vocabulary and mappings**

```ts
export type CatalogCategory =
  | 'ai-and-chat' | 'auth-and-account' | 'buttons-and-controls'
  | 'data-display' | 'developer-tools' | 'ecommerce'
  | 'feedback-and-overlays' | 'forms-and-inputs'
  | 'layout-and-templates' | 'marketing' | 'media'
  | 'navigation' | 'utilities';

export const CATALOG_CATEGORY_LABELS: Record<CatalogCategory, string> = {
  'ai-and-chat': 'AI & Chat',
  'auth-and-account': 'Auth & Account',
  'buttons-and-controls': 'Buttons & Controls',
  'data-display': 'Data Display',
  'developer-tools': 'Developer Tools',
  ecommerce: 'Ecommerce',
  'feedback-and-overlays': 'Feedback & Overlays',
  'forms-and-inputs': 'Forms & Inputs',
  'layout-and-templates': 'Layout & Templates',
  marketing: 'Marketing',
  media: 'Media',
  navigation: 'Navigation',
  utilities: 'Utilities',
};
```

Map `PrimaryFocus` and `ComponentTaxonomyCategory` values deterministically into this vocabulary. Do not expose the word `Focus` in returned labels.
Use this exact legacy-to-catalog mapping:

```ts
const FOCUS_CATEGORY_MAP: Record<PrimaryFocus, CatalogCategory> = {
  'ai-chat': 'ai-and-chat',
  support: 'feedback-and-overlays',
  'buttons-and-primitives': 'buttons-and-controls',
  'dashboards-and-admin': 'data-display',
  'data-display-and-tables': 'data-display',
  'auth-and-user': 'auth-and-account',
  'forms-and-inputs': 'forms-and-inputs',
  navigation: 'navigation',
  'templates-and-layouts': 'layout-and-templates',
  'marketing-sections': 'marketing',
  ecommerce: 'ecommerce',
  'misc-utility': 'utilities',
};
```

Map component-taxonomy categories as follows: AI/chat → AI & Chat; badges/data/progress → Data Display or Feedback & Overlays as appropriate; buttons → Buttons & Controls; callouts → Feedback & Overlays; forms → Forms & Inputs; code/markdown → Developer Tools; carousel/media/image/comparison → Media; maps/data-generation/themes → Utilities.

- [ ] **Step 4: Write facet tests that prove the approved OR/AND semantics**

```ts
const selected = [
  facet('component', 'button'),
  facet('component', 'input'),
  facet('registry', '@delta'),
];
const result = applyCatalogFacetsToCandidates(candidates, selected);
expect(result.map(item => item.id)).toEqual([
  '@delta:button',
  '@delta:input',
]);
```

Also assert that `buildCatalogFacetGroups()` returns exactly `category`, `component`, and `registry` groups and never `type`, `tag`, `visual`, or `status`.

- [ ] **Step 5: Run the facet test and verify it fails**

Run: `pnpm exec vitest run tests/registry-explorer/catalogFacets.test.ts`

Expected: FAIL because the new facet module is missing.
- [ ] **Step 6: Implement the facet contract**

```ts
export type CatalogFacetDimension = 'category' | 'component' | 'registry';

export interface SelectedCatalogFacet {
  dimension: CatalogFacetDimension;
  value: string;
  label: string;
}

export function applyCatalogFacetsToCandidates(
  candidates: readonly ComponentCandidate[],
  selected: readonly SelectedCatalogFacet[],
): ComponentCandidate[] {
  const byDimension = new Map<CatalogFacetDimension, SelectedCatalogFacet[]>();
  for (const facet of selected) {
    byDimension.set(facet.dimension, [...(byDimension.get(facet.dimension) ?? []), facet]);
  }
  return candidates.filter(candidate => [...byDimension.entries()].every(([dimension, facets]) =>
    facets.some(facet => candidateMatchesCatalogFacet(candidate, dimension, facet.value))
  ));
}
```

`candidateMatchesCatalogFacet()` must use canonical catalog-category membership, concrete component tags/taxonomy, and `candidate.registry.name`. Never match raw `type`, preview availability, or catalog status as a primary facet.

- [ ] **Step 7: Write sort tests before implementation**

```ts
expect(sortCatalogCandidates(candidates, 'relevance').map(x => x.id))
  .toEqual(candidates.map(x => x.id));
expect(sortCatalogCandidates(candidates, 'name').map(x => x.matchedLabel))
  .toEqual(['Button', 'Input', 'Table']);
```

- [ ] **Step 8: Implement `CatalogSort = 'relevance' | 'name'`**

`relevance` returns a shallow copy in the incoming discovery order. `name` sorts by `matchedLabel`, then registry namespace, then item slug for deterministic ties.

- [ ] **Step 9: Run all new taxonomy/facet/sort tests**

Run: `pnpm exec vitest run tests/registry-explorer/catalogTaxonomy.test.ts tests/registry-explorer/catalogFacets.test.ts tests/registry-explorer/catalogSort.test.ts`

Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add src/registry-explorer/core/catalogTaxonomy.ts src/registry-explorer/core/catalogFacets.ts src/registry-explorer/core/catalogSort.ts src/registry-explorer/core/registry.schema.ts tests/registry-explorer/catalogTaxonomy.test.ts tests/registry-explorer/catalogFacets.test.ts tests/registry-explorer/catalogSort.test.ts
git commit -m "feat: add catalog discovery facets"
```
---

### Task 3: Replace Legacy View/URL State with Discover, Registries, Compare, Facets, and Sort

**Files:**
- Modify: `src/registry-explorer/core/urlState.ts`
- Test: `tests/registry-explorer/urlState.test.ts`

**Interfaces:**
- Produces: `RegistryExplorerView = 'discover' | 'registries' | 'compare' | 'item'`.
- Produces URL fields: repeated `category`, repeated `component`, repeated `source`, `sort`, repeated `compareRegistry`, repeated `compareComponent`, plus existing `q`, `registry`, `candidate`, and `item` route fields.
- Legacy migration: `focus` → Discover + mapped Category; `component` view → Discover + Component facet; `matrix` → Compare.

- [ ] **Step 1: Rewrite URL-state tests around the new contract**

```ts
const state = parseRegistryExplorerUrlState(new URLSearchParams(
  'view=discover&q=button&category=forms-and-inputs&component=button&source=%40delta&sort=name'
));
expect(state.view).toBe('discover');
expect(state.selectedFacets.map(f => [f.dimension, f.value])).toEqual([
  ['category', 'forms-and-inputs'],
  ['component', 'button'],
  ['registry', '@delta'],
]);
expect(state.sort).toBe('name');
```
Add compatibility tests:

```ts
expect(parseRegistryExplorerUrlState(new URLSearchParams(
  'view=focus&q=button&focus=forms-and-inputs'
))).toMatchObject({ view: 'discover', searchTerm: 'button' });

expect(parseRegistryExplorerUrlState(new URLSearchParams(
  'view=component&component=button'
))).toMatchObject({ view: 'discover' });

expect(parseRegistryExplorerUrlState(new URLSearchParams('view=matrix')))
  .toMatchObject({ view: 'compare' });
```

The first two cases must migrate the valid legacy selection into the equivalent new facet when mapping is possible.

- [ ] **Step 2: Run the URL-state test and verify the old view model fails**

Run: `pnpm exec vitest run tests/registry-explorer/urlState.test.ts`

Expected: FAIL because the parser still returns `focus`, `component`, and `matrix` views and has no facet/sort/compare state.

- [ ] **Step 3: Implement the new parsed/serializable state types and allowlists**

Use `URLSearchParams.getAll()` for repeated facets/comparison selections, de-duplicate values while preserving stable order, and allow only `relevance`/`name` sort values. Keep queue/install-token values excluded exactly as today.
- [ ] **Step 4: Serialize in a deterministic order**

Serialization order must be:

```text
view, q, category*, component*, source*, sort, registry, candidate, item, compareRegistry*, compareComponent*
```

Omit `sort=relevance` to keep default links concise. Omit empty arrays/strings.

- [ ] **Step 5: Run URL-state tests**

Run: `pnpm exec vitest run tests/registry-explorer/urlState.test.ts`

Expected: PASS, including legacy migration and queue/install exclusion tests.

- [ ] **Step 6: Commit**

```bash
git add src/registry-explorer/core/urlState.ts tests/registry-explorer/urlState.test.ts
git commit -m "feat: migrate catalog URL state"
```

---

### Task 4: Rebuild Discover as the Search-first Visual Catalog

**Files:**
- Modify: `src/registry-explorer/core/discovery.ts`
- Modify: `src/registry-explorer/ui/discoveryView.ts`
- Modify: `src/registry-explorer/ui/renderSafety.ts`
- Test: `tests/registry-explorer/discovery.test.ts`
- Test: `tests/registry-explorer/discoveryView.test.ts`
- Test: `tests/registry-explorer/renderSafety.test.ts`
**Interfaces:**
- `searchComponentCandidates()` remains the relevance-ranked search source and keeps alias/capability/namespace matching.
- `renderDiscoveryContent()` receives already-filtered/sorted candidates plus catalog facet groups and selected facets; it does not own filtering logic.
- `renderSafeExternalImage(url, alt, className)` renders only `http:`/`https:` preview metadata with `loading="lazy"`, `decoding="async"`, and `referrerpolicy="no-referrer"`.

- [ ] **Step 1: Preserve search behavior with an explicit rough-description regression test**

Add a fixture description such as `"A searchable command palette for keyboard workflows"`, query `keyboard command`, and assert the known item ranks before fallback registry matches.

- [ ] **Step 2: Rewrite the renderer tests for the approved Discover contract**

```ts
renderDiscoveryContent(header, body, [candidateFixture()], overviewFixture(), {
  searchTerm: '',
  facetGroups,
  selectedFacets: [],
  sort: 'relevance',
  queuedTokens: new Set(),
  activePeekId: null,
});
expect(body.innerHTML).toContain('Category');
expect(body.innerHTML).toContain('Component');
expect(body.innerHTML).toContain('Registry');
expect(body.innerHTML).toContain('Relevance');
expect(body.innerHTML).toContain('Name A-Z');
expect(body.innerHTML).not.toContain('Type');
expect(body.innerHTML).not.toContain('Visual');
expect(body.innerHTML).not.toContain('Status');
```
Add two specimen tests:

```ts
expect(renderedCandidate(withPreview('https://example.com/button.png')))
  .toContain('<img');
expect(renderedCandidate(withoutPreview()))
  .toContain('Preview unavailable');
expect(renderedCandidate(withoutPreview()))
  .not.toContain('<svg');
```

The unavailable state must be text/neutral chrome only; it must not draw a fake component specimen.

- [ ] **Step 3: Add safe preview-image rendering tests**

```ts
expect(renderSafeExternalImage('javascript:alert(1)', 'Button', 'specimen'))
  .not.toContain('<img');
expect(renderSafeExternalImage('https://example.com/button.png', '<Button>', 'specimen'))
  .toContain('alt="&lt;Button&gt;"');
```

- [ ] **Step 4: Run Discover/render-safety tests and verify failures**

Run: `pnpm exec vitest run tests/registry-explorer/discovery.test.ts tests/registry-explorer/discoveryView.test.ts tests/registry-explorer/renderSafety.test.ts`

Expected: FAIL because the current renderer is a row list with the legacy filter menu and no safe image helper.

- [ ] **Step 5: Implement the new Discover renderer**

Render, in order: search/result heading, conventional facet/sort toolbar, active-filter chips + Clear all, partial-data note when needed, responsive result-card grid, and empty state. Keep install actions secondary on cards; the primary card action is `View details`.
Use data attributes that shell orchestration can consume later:

```text
data-facet-add-dimension / data-facet-add-value
data-facet-remove-dimension / data-facet-remove-value
data-facet-clear
data-sort
data-view-item-registry / data-view-item-slug
data-profile-registry
data-copy-text / data-copy-label
```

Keep all remote strings passed through `escapeHtml()` and all external URLs through render-safety helpers.

- [ ] **Step 6: Run focused Discover tests**

Run: `pnpm exec vitest run tests/registry-explorer/discovery.test.ts tests/registry-explorer/discoveryView.test.ts tests/registry-explorer/renderSafety.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/registry-explorer/core/discovery.ts src/registry-explorer/ui/discoveryView.ts src/registry-explorer/ui/renderSafety.ts tests/registry-explorer/discovery.test.ts tests/registry-explorer/discoveryView.test.ts tests/registry-explorer/renderSafety.test.ts
git commit -m "feat: rebuild component discovery catalog"
```

---

### Task 5: Add the Registries Source-browser Surface

**Files:**
- Create: `src/registry-explorer/core/registryBrowse.ts`
- Create: `src/registry-explorer/ui/registriesView.ts`
- Modify: `src/registry-explorer/ui/registryProfileView.ts`
- Test: `tests/registry-explorer/registryBrowse.test.ts`
- Modify test: `tests/registry-explorer/registryProfileView.test.ts`
**Interfaces:**
- Produces `RegistryBrowseEntry` with `registry`, `knownItemCount`, `routeEligibleItemCount`, `categories`, `components`, and coverage status.
- Produces `buildRegistryBrowseEntries(registries, searchTerm, selectedFacets)`.
- Registries uses Category and Component facets; a Registry facet is intentionally omitted on this page because the page itself is the registry selector.

- [ ] **Step 1: Write selector tests for registry search and content facets**

```ts
const entries = buildRegistryBrowseEntries(registries, 'delta', []);
expect(entries.map(entry => entry.registry.name)).toEqual(['@delta']);

const filtered = buildRegistryBrowseEntries(registries, '', [
  { dimension: 'component', value: 'button', label: 'Button' },
]);
expect(filtered.every(entry => entry.components.includes('button'))).toBe(true);
```

Also assert `knownItemCount` and `routeEligibleItemCount` come from real `itemSummaries`, not registry-level guesses.

- [ ] **Step 2: Run the selector test and verify it fails**

Run: `pnpm exec vitest run tests/registry-explorer/registryBrowse.test.ts`

Expected: FAIL because `registryBrowse.ts` does not exist.

- [ ] **Step 3: Implement the pure registry browse selector**

Reuse `filterRegistries()` for text matching, `catalogCategoriesForRegistry()` for categories, and concrete registry/item component tags for Component matching. Sort registry entries by namespace A-Z after filtering.

```ts
export function buildRegistryBrowseEntries(
  registries: readonly Registry[],
  searchTerm: string,
  selectedFacets: readonly SelectedCatalogFacet[],
): RegistryBrowseEntry[] {
  return applyRegistryContentFacets(filterRegistries(registries, searchTerm), selectedFacets)
    .map(registry => ({
      registry,
      knownItemCount: registry.itemSummaries?.length ?? 0,
      routeEligibleItemCount: registry.itemSummaries?.filter(item => item.routeEligible).length ?? 0,
      categories: catalogCategoriesForRegistry(registry),
      components: catalogComponentKeysForRegistry(registry),
      coverageStatus: registry.atlas?.coverageStatus ?? 'unverified',
    }))
    .sort((a, b) => a.registry.name.localeCompare(b.registry.name));
}
```
- [ ] **Step 4: Add renderer/profile tests before UI implementation**

Create a render assertion that a registry row/card contains namespace, description, real known-item count, coverage label, and `View registry` action, but does not show `Focus cluster`, fabricated framework, or fabricated license.

Update `registryProfileView.test.ts` so the profile exposes known items and source/evidence facts without legacy Focus wording.

- [ ] **Step 5: Implement `registriesView.ts` and simplify registry profile presentation**

`renderRegistriesContent()` should accept already-built entries and selected Category/Component facets. Render a searchable source catalog with compact registry cards/rows; do not recreate the old left-side focus cluster browser.

- [ ] **Step 6: Run registry browsing/profile tests**

Run: `pnpm exec vitest run tests/registry-explorer/registryBrowse.test.ts tests/registry-explorer/registryProfile.test.ts tests/registry-explorer/registryProfileView.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/registry-explorer/core/registryBrowse.ts src/registry-explorer/ui/registriesView.ts src/registry-explorer/ui/registryProfileView.ts tests/registry-explorer/registryBrowse.test.ts tests/registry-explorer/registryProfileView.test.ts
git commit -m "feat: add registry source browser"
```

---

### Task 6: Reframe Matrix as a Deliberate Compare Surface

**Files:**
- Create: `src/registry-explorer/core/compare.ts`
- Create: `src/registry-explorer/ui/compareView.ts`
- Modify: `src/registry-explorer/core/matrixColumns.ts`
- Test: `tests/registry-explorer/compare.test.ts`
- Reuse: `tests/registry-explorer/matrixColumns.test.ts`
**Interfaces:**
- Produces `CompareSelection { registryNames: readonly string[]; componentKeys: readonly ComponentTag[] }`.
- Produces `buildCompareModel(registries, searchTerm, selection)` returning selected rows/columns plus available registry/component options.
- Default Compare uses the existing representative `MATRIX_COLUMNS` when no explicit component selection exists.

- [ ] **Step 1: Write compare-model tests**

```ts
const model = buildCompareModel(registries, '', {
  registryNames: ['@alpha', '@delta'],
  componentKeys: ['button', 'table'],
});
expect(model.rows.map(row => row.registry.name)).toEqual(['@alpha', '@delta']);
expect(model.columns).toEqual(['button', 'table']);
```

Also test that unknown selections are ignored safely and that an empty explicit selection falls back to representative matrix columns rather than breaking rendering.

- [ ] **Step 2: Run compare tests and verify failure**

Run: `pnpm exec vitest run tests/registry-explorer/compare.test.ts tests/registry-explorer/matrixColumns.test.ts`

Expected: FAIL because `compare.ts` does not exist.

- [ ] **Step 3: Implement `buildCompareModel()` as a thin adapter over existing matrix logic**

Reuse `buildMatrixRows()` rather than duplicating coverage semantics. Filter rows by selected registry names before rendering and keep each cell's existing verification-aware status/label.

```ts
export function buildCompareModel(
  registries: readonly Registry[],
  searchTerm: string,
  selection: CompareSelection,
): CompareModel {
  const columns = selection.componentKeys.length ? selection.componentKeys : MATRIX_COLUMNS;
  const selected = selection.registryNames.length
    ? registries.filter(registry => selection.registryNames.includes(registry.name))
    : registries;
  return { rows: buildMatrixRows(selected, searchTerm, columns), columns };
}
```
- [ ] **Step 4: Add Compare renderer assertions**

Extend `compare.test.ts` with lightweight roots or add a renderer section that asserts:

```ts
expect(body.innerHTML).toContain('Compare registries');
expect(body.innerHTML).toContain('Verification');
expect(body.innerHTML).toContain('@alpha');
expect(body.innerHTML).not.toContain('Matrix axes');
```

- [ ] **Step 5: Implement `compareView.ts`**

Render selection controls above the table, a concise comparison summary, and the verification-aware table. Provide data attributes `data-compare-registry` and `data-compare-component` for shell state changes. On narrow screens, keep the table horizontally scrollable rather than squeezing columns unreadably.

- [ ] **Step 6: Run Compare tests**

Run: `pnpm exec vitest run tests/registry-explorer/compare.test.ts tests/registry-explorer/matrixColumns.test.ts tests/registry-explorer/grouping.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/registry-explorer/core/compare.ts src/registry-explorer/ui/compareView.ts src/registry-explorer/core/matrixColumns.ts tests/registry-explorer/compare.test.ts
git commit -m "feat: add dedicated compare surface"
```

---

### Task 7: Expand Component Details with Grounded Agent/Debug Prompts and Related Registries

**Files:**
- Create: `src/registry-explorer/core/itemPrompts.ts`
- Modify: `src/registry-explorer/core/relatedComponents.ts`
- Modify: `src/registry-explorer/ui/itemDetailView.ts`
- Test: `tests/registry-explorer/itemPrompts.test.ts`
- Modify test: `tests/registry-explorer/relatedComponents.test.ts`
- Modify test: `tests/registry-explorer/itemDetailView.test.ts`
**Interfaces:**
- Produces `buildInstallAgentPrompt(detail): string | null`.
- Produces `buildInspectionPrompt(detail): string | null`.
- Extends related-item logic with `buildRelatedRegistries(registries, current, limit)` using only shared grounded component/category metadata.

- [ ] **Step 1: Write prompt tests with exact grounding requirements**

```ts
const prompt = buildInstallAgentPrompt(detailFixture());
expect(prompt).toContain('@delta/code-block');
expect(prompt).toContain('npx shadcn@latest view @delta/code-block');
expect(prompt).toContain('npx shadcn@latest add @delta/code-block');
expect(prompt).toContain('Review third-party registry code before applying changes.');
```

For a disabled install action, expect `buildInstallAgentPrompt()` to return `null` rather than inventing a command.

For the inspection prompt, assert it includes only available dependencies/files/warnings/evidence and returns `null` when no grounding fields exist.

- [ ] **Step 2: Run prompt tests and verify failure**

Run: `pnpm exec vitest run tests/registry-explorer/itemPrompts.test.ts`

Expected: FAIL because `itemPrompts.ts` does not exist.

- [ ] **Step 3: Implement deterministic prompt builders**

Use short line-oriented prose assembled from `RegistryItemDetail`. Never mention packages, files, dependencies, framework, or commands absent from the detail object.

```ts
export function buildInstallAgentPrompt(detail: RegistryItemDetail): string | null {
  if (detail.installAction.status !== 'enabled') return null;
  return [
    `Use ${detail.title} from ${detail.namespace}.`,
    `Inspect first: ${detail.installAction.inspectCommand}`,
    `Install if appropriate: ${detail.installAction.installCommand}`,
    'Review third-party registry code before applying changes.',
  ].join('\n');
}
```
- [ ] **Step 4: Add related-registry tests before implementation**

```ts
const related = buildRelatedRegistries(registries, {
  registryName: '@delta',
  itemSlug: 'code-block',
});
expect(related[0]).toEqual(expect.objectContaining({
  registryName: '@gamma',
  matchReasons: expect.arrayContaining(['Shared component']),
}));
```

Group the already-grounded related-component matches by registry; do not create a second speculative similarity algorithm.

- [ ] **Step 5: Expand item detail renderer tests**

Assert the detail page includes `Copy agent prompt`, conditionally includes `Copy inspection prompt`, shows alternate terminology from real taxonomy labels, renders related registries, and includes `Copy link`. Keep existing safe-fallback, dependency, file escaping, install, and inspect assertions.

- [ ] **Step 6: Update `itemDetailView.ts`**

Render: real preview image or neutral unavailable state; canonical name/source; alternate terminology; install/inspect controls; agent/inspection prompt copy buttons; dependencies/files; provenance/evidence/warnings; related components; related registries; and copy-link control.

Use `data-copy-text` for prompt text and `data-copy-current-url` for the live deep link so the shell can use one generalized clipboard path.

- [ ] **Step 7: Run detail/related tests**

Run: `pnpm exec vitest run tests/registry-explorer/itemPrompts.test.ts tests/registry-explorer/relatedComponents.test.ts tests/registry-explorer/itemDetailView.test.ts`

Expected: PASS.
- [ ] **Step 8: Commit**

```bash
git add src/registry-explorer/core/itemPrompts.ts src/registry-explorer/core/relatedComponents.ts src/registry-explorer/ui/itemDetailView.ts tests/registry-explorer/itemPrompts.test.ts tests/registry-explorer/relatedComponents.test.ts tests/registry-explorer/itemDetailView.test.ts
git commit -m "feat: enrich component detail actions"
```

---

### Task 8: Rewire the Shell and Static Application IA

**Files:**
- Modify: `src/registry-explorer/ui/shell.ts`
- Modify: `src/registry-explorer/ui/index.ts`
- Modify: `src/registry-explorer/entry.ts`
- Modify: `index.html`
- Test: `tests/registry-explorer/urlState.test.ts`
- Test: `tests/registry-explorer/discoveryView.test.ts`
- Add focused shell tests only if event logic cannot remain pure enough to cover through existing core/renderer tests.

**Interfaces:**
- `AppState.currentView` becomes `discover | registries | compare | item`.
- `AppState` adds `selectedFacets: SelectedCatalogFacet[]`, `sort: CatalogSort`, `compareRegistryNames: string[]`, and `compareComponentKeys: ComponentTag[]`.
- `AppState` removes user-facing `selectedFocus` and standalone `selectedComponent` state.
- Clipboard handling becomes generic text-copy feedback instead of command-only handling.
- [ ] **Step 1: Change `index.html` navigation before shell wiring**

Replace the four legacy tabs with exactly three controls:

```html
<nav class="primary-nav" aria-label="Primary navigation">
  <button class="nav-item nav-item-active" data-view="discover">Discover</button>
  <button class="nav-item" data-view="registries">Registries</button>
  <button class="nav-item" data-view="compare">Compare</button>
</nav>
```

Keep one global search input. Remove the legacy `Interactive SPA · Local data only` ornament and old per-tab badges.

- [ ] **Step 2: Update state hydration/render routing**

In `shell.ts`, hydrate `selectedFacets`, sort, and Compare selection from `parseRegistryExplorerUrlState()`. Route renders as:

```ts
if (state.currentView === 'item') { /* detail */ }
else if (state.selectedProfileRegistryName) { /* profile */ }
else if (state.currentView === 'discover') { /* search -> facets -> sort -> Discover */ }
else if (state.currentView === 'registries') { /* registry browse */ }
else { /* Compare */ }
```

The Discover branch must call `searchComponentCandidates()` once, then `buildCatalogFacetGroups()`, `applyCatalogFacetsToCandidates()`, and `sortCatalogCandidates()` in that order.
- [ ] **Step 3: Replace legacy filter/focus/component event handlers**

Handle the new data attributes only:

```ts
[data-facet-add-dimension]
[data-facet-remove-dimension]
[data-facet-clear]
[data-sort]
[data-compare-registry]
[data-compare-component]
```

When adding a facet, use `createSelectedCatalogFacet()` and refuse duplicates. Clearing facets does not clear the search term. Navigation changes clear route-specific item/profile state but preserve the current search term.

- [ ] **Step 4: Generalize clipboard handling**

Replace command-only `copyCommand()` with:

```ts
async function copyText(text: string, successMessage: string): Promise<void>
```

`data-copy-command` may remain supported as a compatibility alias during this task, but new UI uses `data-copy-text` and `data-copy-current-url`. Clipboard failure must retain the existing manual-copy fallback feedback.

- [ ] **Step 5: Serialize every supported state change through the new URL contract**

`syncUrlState()` must include facets, sort, profile/item route state, and Compare selections. Install queue and transient copy feedback remain session-local and never enter the URL.
- [ ] **Step 6: Run source type-check plus state/renderer tests**

Run:

```bash
pnpm typecheck
pnpm exec vitest run tests/registry-explorer/urlState.test.ts tests/registry-explorer/discoveryView.test.ts tests/registry-explorer/registryProfileView.test.ts tests/registry-explorer/itemDetailView.test.ts tests/registry-explorer/compare.test.ts
```

Expected: PASS with no imports from `focusView.ts`, `componentView.ts`, or `matrixView.ts` in `shell.ts`.

- [ ] **Step 7: Commit**

```bash
git add index.html src/registry-explorer/entry.ts src/registry-explorer/ui/index.ts src/registry-explorer/ui/shell.ts
git commit -m "feat: switch registry atlas navigation"
```

---

### Task 9: Apply the Approved Name That UI-inspired Visual System and Accessibility Contract

**Files:**
- Modify: `public/styles/registry-explorer.css`
- Create: `tests/registry-explorer/visualContract.test.ts`
- Modify renderer tests where class/ARIA contract changes are intentional.

**Interfaces:**
- CSS variables encode the approved palette/radii/spacing; renderers continue to own semantic HTML and data attributes.
- No runtime JavaScript is added solely for decoration.
- [ ] **Step 1: Write a CSS design-contract test before rewriting styles**

```ts
const css = readFileSync('public/styles/registry-explorer.css', 'utf8').toLowerCase();
expect(css).toContain('--background: #0b0c0e');
expect(css).toContain('--card: #121316');
expect(css).toContain('--primary: #4ea1ff');
expect(css).toContain('--radius-button: 11px');
expect(css).toContain('--radius-card: 14px');
expect(css).not.toContain('#ffd95e');
expect(css).not.toContain('#65d4ff');
expect(css).not.toContain('#8b6cff');
expect(css).not.toContain('fractalnoise');
```

- [ ] **Step 2: Run the visual-contract test and verify it fails against the legacy stylesheet**

Run: `pnpm exec vitest run tests/registry-explorer/visualContract.test.ts`

Expected: FAIL on missing approved tokens and legacy yellow/cyan/purple styling.

- [ ] **Step 3: Replace the legacy visual system, not just its colors**

Define `--background`, `--foreground`, `--card`, `--popover`, `--secondary`, `--muted-foreground`, `--border`, `--input`, `--primary`, `--radius-button`, and `--radius-card`. Use a 4/8/12/16/20/24px spacing rhythm. Remove the app-within-a-card outer shell, ambient grid, noise texture, glow halos, and heavy shadows.

```css
:root {
  --background: #0b0c0e;
  --foreground: #edeef0;
  --card: #121316;
  --popover: #16181c;
  --secondary: #1a1c20;
  --muted-foreground: #8a8f98;
  --border: rgba(255, 255, 255, 0.08);
  --input: rgba(255, 255, 255, 0.12);
  --primary: #4ea1ff;
  --radius-button: 11px;
  --radius-card: 14px;
}
```
- [ ] **Step 4: Implement responsive and accessibility states in CSS**

Requirements:
- Desktop Discover uses a 3-column specimen grid when width permits, 2 columns at medium widths, 1 column on narrow screens.
- Filter controls wrap without truncating selected values.
- Compare remains horizontally scrollable on narrow screens.
- Every interactive element has a visible `:focus-visible` outline using `#4EA1FF` plus sufficient offset.
- Disabled install controls remain visibly disabled without relying on color alone.
- Reduced-motion users do not receive nonessential transitions.

- [ ] **Step 5: Run visual-contract + renderer + build checks**

Run:

```bash
pnpm exec vitest run tests/registry-explorer/visualContract.test.ts tests/registry-explorer/discoveryView.test.ts tests/registry-explorer/itemDetailView.test.ts
pnpm build
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add public/styles/registry-explorer.css tests/registry-explorer/visualContract.test.ts
git commit -m "style: apply visual dictionary design system"
```

---

### Task 10: Remove Stranded Legacy UI, Update Browser Smoke Coverage, and Run Final Verification

**Files:**
- Remove: `src/registry-explorer/ui/focusView.ts`
- Remove: `src/registry-explorer/ui/componentView.ts`
- Remove: `src/registry-explorer/ui/matrixView.ts` after Compare fully replaces it
- Modify: `src/registry-explorer/ui/index.ts`
- Retire/replace: `tests/registry-explorer/componentFilters.test.ts` once `catalogFacets.test.ts` covers the new contract
- Modify: `.planning/phases/04-install-actions-release-hardening/04-BROWSER-A11Y-SMOKE.md`
- Modify docs only where user-facing navigation/filter names are stale.
**Interfaces:**
- No public imports may point at the removed legacy renderers.
- Browser smoke is the release-level behavioral proof for the new IA in addition to unit tests and `pnpm verify`.

- [ ] **Step 1: Prove the old renderers are unused before deleting them**

Run:

```bash
rg "focusView|componentView|matrixView|renderFocus|renderComponent|renderMatrix" src tests
```

Expected: no runtime imports from `shell.ts` or `ui/index.ts`. Any remaining test/docs matches must be intentionally migrated before deletion.

- [ ] **Step 2: Delete only the stranded legacy UI files and retire the legacy primary-filter test**

Remove the three old renderers only after Step 1 is clean. Do not delete `PrimaryFocus`, `buildFocusGroups()`, or component-grouping helpers merely because they are no longer user-facing; keep them if enrichment, compatibility, or tests still consume them.

- [ ] **Step 3: Update the browser smoke checklist for the new product flow**

The checklist must cover `/Registry-Atlas/` with: default Discover route; rough-language search; Category/Component/Registry multi-select; OR-within and AND-across behavior; removable chips/Clear all; Relevance/Name A-Z; deep-link reload; item detail; preview unavailable; install/inspect/prompt/link copy feedback; queue; Registries search/profile; Compare selection/reload; keyboard navigation; visible focus; Escape behavior; safe external links; narrow-screen Discover and horizontally scrollable Compare.
- [ ] **Step 4: Run the complete automated gate**

Run:

```bash
pnpm verify
```

Expected: source type-check PASS, test type-check PASS, all Vitest tests PASS, generated data validation PASS, production build PASS.

- [ ] **Step 5: Run the updated browser smoke against the production base path**

Start the production preview using the repository's documented workflow, navigate through the checklist, and record any failure before claiming completion. Do not use GitHub Actions as the verification path; this project is verified locally.

- [ ] **Step 6: Run a final stale-copy search**

```bash
rg "By Focus|By Component|Matrix axes|Type: registry:ui|Visual available|Interactive SPA · Local data only" index.html src public docs .planning
```

Expected: no user-facing stale legacy navigation/filter copy. Internal historical/spec references are acceptable only when clearly contextual.

- [ ] **Step 7: Commit the cleanup and release checks**

```bash
git add -A src/registry-explorer/ui tests/registry-explorer .planning docs index.html
git commit -m "chore: finalize visual dictionary migration"
```

---

## Execution Notes

At implementation start, use `superpowers:using-git-worktrees` to create an isolated worktree from the branch containing this spec and plan. Execute tasks in order; each task assumes the committed interfaces from earlier tasks. Do not combine the ten commits into one during development because each task is an independent review/rollback boundary.
# Grouped taxonomy navigation

**Source:** user-provided sidebar screenshot, PPM `catalogs.dev/?start=all` Filter interaction, existing Registry Atlas canonical taxonomy.

## Interaction

On `/components` a user opens Navigation and sees the real canonical subtypes: Navbar, Sidebar, Tabs, Breadcrumb, Pagination and any other children with matching catalog counts. Merely expanding Navigation must not change results or URL. Choosing a subtype applies the existing `canonical` query parameter, highlights the child and keeps the family expanded. "All Navigation" selects the parent node and matches descendants. Native `details` allows pointer and keyboard interaction. Groups deeper in the taxonomy expand progressively rather than rendering the full tree at once.

The primary search, Grid/List selector, sort, and setup cart remain independent. The app-owned taxonomy, not a copied exemplar list, defines labels, identifiers, and counts. On mobile, choosing a result filter closes the navigation dialog so the new results are visible.

## Architecture and alternatives

Option A was a single parent filter click plus an expanding second button. It mixes two distinct actions and repeats controls. Option B uses a native disclosure summary and explicit child filter buttons. **Chosen: B** for predictable keyboard behavior and one owner per action.

- `catalogSidebarNavigation.ts`: pure recursive taxonomy markup based on current facets. It does not change search/filter state.
- `shell.ts`: owns ephemeral expanded group IDs. Existing `data-catalog-canonical-value` selection controls the filter, URL, and rerender. A selected child opens its ancestor automatically.
- `entry.ts`: mobile dialog closes after a real category/filter selection; it does not close when expanding a group.
- `registry-explorer.css`: compact rows, nested guide line, focus ring, disclosure chevron, and reduced-motion support.

## Verification

`tests/registry-explorer/catalogSidebarNavigation.test.ts` proves grouping, count-derived rows, escaping, and that opening a category does not select it. `tests/grouped-sidebar.e2e.ts` proves the full desktop open, sort/rerender, filter, URL, active row, and keyboard flow. `tests-mobile/grouped-sidebar.e2e.ts` proves mobile closes the drawer after filtering; `tests-mobile/native-sidebar.e2e.ts` checks existing native dialog behavior. PPM screenshot: `.design/evidence/grouped-filters/navigation-expanded.png`.

No chat, model selection, unrelated Workbench packages or registry provider changes are part of this feature.

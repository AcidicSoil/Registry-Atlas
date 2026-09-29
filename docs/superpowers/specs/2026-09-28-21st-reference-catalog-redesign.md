# Registry Atlas 21st.dev Reference Catalog Redesign

## Status

Implementation-authoritative replacement specification for Registry Atlas component browsing.

This specification supersedes the reviewed-summary-first browsing rules in `2026-09-28-remaining-backlog-completion-design.md` wherever the two conflict.

## Problem

Registry Atlas currently has substantially more real catalog data than the frontend exposes. The generated mirror contains 392 registries and the compact catalog contains more than 76,000 discoverable upstream items, but the default Discover surface, registry cards, registry profiles, and comparison model still depend heavily on 34 reviewed item summaries and inferred taxonomy metadata.

That creates objectively incorrect states. A registry with thousands of indexed items can render as `0 known items` and its profile can say `Catalog not verified`. Discover also creates registry-level fallback candidates that look like components even though no component record backs them.

The clarified product vision is a catalogue experience modeled closely on the public browsing model of 21st.dev: real components are the primary browse unit; registry/library and author-like pages are collection lenses over those records; component detail has a stable shareable URL; nested component paths are first-class.

## Reference audit

Live 21st.dev was inspected on 2026-09-28. Viewport and full-page screenshots plus a route/link manifest are stored outside git at:

`~/.local/share/registry-atlas/reference/21st-dev-2026-09-28/`

The audit covered these route families:
- `/`: marketing/entry surface.
- `/community/components`: component catalogue with category navigation and dense visual cards.
- `/community/components/featured` and `/community/components/newest`: catalogue ordering lenses.
- `/community/components/s/<category>`: category-filtered component grid.
- `/community/authors` and `/@<author>`: creator list/profile.
- `/community/libraries` and `/community/<owner>/library/<library>`: library list/detail.
- `/@<author>/components/<component...>`: component detail.
- Nested component examples such as `/@originui/components/tree/menu-navigation-tree` and `/@jahed/components/flip-countdown/plain`.
- Templates, themes/editor, and icon family/category routes were captured to understand shared navigation and grid/detail patterns; Registry Atlas does not need to clone unrelated commerce/publishing features.

The reference pattern relevant to Atlas is:
1. browse pages show concrete component records, never library-level pseudo-components;
2. cards are visually dense but action-light;
3. component detail owns installation/copy/source actions;
4. library/profile pages enumerate their concrete component inventory;
5. category/search pages are URL-addressable;
6. component paths may contain multiple nested segments.

## Product intent

Registry Atlas should feel like a registry-native counterpart to 21st.dev: open a catalogue, see real components from many registries, filter/search them, open a registry collection, then open a component detail route and copy/inspect/install it.

Atlas-specific differences remain explicit: Registry Atlas is sourced from shadcn-compatible registries, preserves source provenance, does not invent previews, and may have incomplete upstream coverage.

## Non-negotiable data invariant

A visible component result MUST correspond to a real item in `registry-catalog-items.json` or to a reviewed summary that can be matched to a real catalog item identity.

Registry metadata, aliases, primary-focus values, curated component tags, descriptions, or inferred taxonomy MUST NOT create component candidates.

Reviewed summaries are enrichment overlays only. They may add description, docs, preview, dependencies, files, provenance, or stronger confidence to a real indexed item.

If a registry catalog cannot be read, Atlas shows that registry's coverage gap. It does not synthesize generic components from registry metadata.
## User stories

1. As a component consumer, I want the default catalogue to browse real indexed components, so that I can discover the actual inventory without knowing a search term.
2. As a component consumer, I want every component card to link to a stable component URL, so that I can share or revisit it.
3. As a component consumer, I want nested item names to remain addressable, so that registry items containing path segments are not flattened or lost.
4. As a component consumer, I want search to match real item names, titles, upstream categories, types, and registry names, so that results never depend on inferred pseudo-components.
5. As a component consumer, I want category/filter routes to be shareable, so that a filtered catalogue can be bookmarked.
6. As a component consumer, I want a component detail page to expose source, registry, install/inspect commands, upstream metadata, and trusted preview evidence when available.
7. As a component consumer, I want browse cards to stay visually simple, so that catalogue scanning is not dominated by install controls.
8. As a registry consumer, I want a registry page to enumerate the real indexed components in that registry, so that a registry with 13,000 items never appears empty.
9. As a registry consumer, I want registry cards to show indexed item counts and catalogue availability, so that coverage is truthful.
10. As a registry consumer, I want registry lists paginated or windowed, so that all registries are reachable without rendering hundreds of large cards at once.
11. As a comparator, I want comparisons to use exact indexed component identities, so that presence/absence is backed by catalog data rather than inferred tags.
12. As a maintainer, I want reviewed metadata to overlay indexed data deterministically, so that richer records win without duplicating components.
13. As a maintainer, I want failed registries surfaced separately from successful empty registries, so that acquisition gaps are measurable.
14. As a maintainer, I want one rerunnable audit to prove visible inventory/counts derive from the compact index, so that the old 34-summary regression is detectable.
15. As a keyboard/mobile user, I want all catalogue, profile, detail, filter, pagination, and navigation controls usable at narrow widths without horizontal page overflow.

## Information architecture

Registry Atlas adopts a path-based catalogue contract under the configured Vite base path.

Canonical route families:
- `/components` — default real-component catalogue.
- `/components/featured` — reserved for future evidence-backed ranking; until ranking evidence exists it aliases the default deterministic catalogue.
- `/components/newest` — only enabled when trustworthy item timestamps exist; otherwise it is not shown.
- `/components/s/<term>` — shareable component/category search lens.
- `/registries` — all registries/libraries.
- `/@<namespace>` — registry profile/library page.
- `/@<namespace>/components/<item...>` — component detail, with all remaining path segments forming the item slug.
- `/compare` — Atlas-specific real-catalog comparison.

Query parameters remain available for secondary state such as text search, sorting, selected upstream item types, registry filter, and page number.

Legacy `?view=...` URLs remain readable and redirect/replace to the canonical path shape rather than breaking existing links.
## GitHub Pages routing

The app remains a static Vite SPA under `/Registry-Atlas/`.

Direct nested routes must survive refresh on GitHub Pages. The build therefore includes a Pages-compatible SPA fallback that preserves the requested path/query and returns users to the index entrypoint before client routing.

The fallback must be deterministic, same-origin only, and must not accept arbitrary external redirect targets.

## Catalogue query module

Introduce one deep catalogue query module as the public seam for browse/profile/compare inventory.

Inputs:
- the loaded `RegistryCatalogIndex`;
- registries;
- optional query text;
- optional registry namespaces;
- optional upstream item types/categories;
- deterministic sort;
- page/offset and limit.

Outputs:
- real catalog-backed component records;
- total matching count;
- page metadata;
- coverage metadata needed by the renderer.

The query scans the compact index without creating registry fallback candidates. It overlays reviewed summaries by `namespace + normalized item slug`.

Default catalogue pagination must make the full 76k+ inventory reachable without constructing 76k DOM cards. A page size around 24–40 is acceptable; the exact value is an implementation decision constrained by rendered performance.

The old 1,000 materialization cap may remain as a defensive search-work bound only if pagination can continue beyond it truthfully. It must not make later matches unreachable.

## Search and filters

Component search is open-vocabulary and data-backed.

Searchable component fields:
- item `name`;
- optional `title`;
- upstream `categories`;
- item `type`;
- registry namespace.

No curated alias or inferred component taxonomy participates in deciding whether a component matches.

The left navigation may still present useful category shortcuts, but shortcuts must be derived from actual indexed values or explicit stable product groupings over upstream item types. They cannot manufacture component membership.

Registry search may use registry name, description, homepage, and explicit registry metadata because it is searching registries, not components.

## Discover / Components view

Replace the current default Discover candidate model with the real catalogue query.

Visual structure follows the reference:
- persistent compact left rail for Components, Registries, Compare, search, and data-backed category/type shortcuts;
- a dense multi-column component grid;
- simple cards whose primary interaction is opening component detail;
- preview image only when trusted preview evidence exists;
- otherwise an honest no-preview/metadata specimen rather than a fabricated UI rendering;
- component title/name and registry identity below or adjacent to the specimen;
- no install queue or three-button install cluster on every browse card.

The page header shows truthful inventory counts from the index, not the reviewed-summary count.

The empty install queue is hidden. Queue functionality may remain accessible from detail/actions and appears only when it contains items.
## Component detail

Component detail is the action-heavy surface.

It must show:
- component name/title;
- registry namespace with link to the registry page;
- stable canonical URL;
- actual upstream item type/categories;
- reviewed description/docs/preview where present;
- machine-readable source/provenance;
- install token and Copy install;
- Inspect first;
- optional queue action;
- raw item/component page links when available;
- dependencies/files after raw detail resolves;
- clear unavailable state when the raw item cannot be fetched.

Nested slugs are preserved exactly after normalization/safety validation. A component such as `browser-agent/example` maps to `/@namespace/components/browser-agent/example`, not a flattened encoded pseudo-slug.

## Registry list and registry profile

The registry list uses compact-index bucket counts.

Each registry entry shows:
- namespace/name;
- description/homepage;
- real indexed item count;
- coverage state: current, stale, failed/unavailable, or successful-with-zero-discoverable-items;
- no `0 known items` when indexed records exist.

The registry list is paginated/windowed.

The registry profile is modeled after the reference library page:
- concise registry identity/sidebar/header;
- real component grid/list as the dominant content;
- local search/filter within that registry;
- pagination for large registries;
- reviewed metadata overlays on matching items;
- source/provenance/coverage facts available in a secondary details area, not before the component inventory;
- no giant inferred Components text dump.

Global mirror facts such as total upstream/local counts are app-level diagnostics and are removed from every registry profile.

## Compare

The current closed `ComponentTag` matrix is removed from product behavior.

Compare uses exact normalized real item identities from the compact index for the selected registries.

The comparison surface provides:
- selected registry counts;
- intersection/union summary;
- searchable/paginated component-name rows;
- presence/absence per selected registry;
- links from present cells to that registry's component detail route.

No `Verified/Inferred` component presence is derived from registry-level tags. Stale registry buckets can be labeled stale, but their item presence is still the last known real catalog evidence.

## Coverage and failure semantics

Catalogue coverage is explicit:
- `current`: latest sync succeeded and produced discoverable items;
- `empty`: latest sync succeeded but produced zero supported discoverable items;
- `stale`: latest sync failed but prior compact items were preserved;
- `failed`: latest sync failed and no prior compact inventory exists.

The UI surfaces aggregate catalogue coverage such as `342 / 392 catalogues fetched` and total indexed items. Internal strings such as `Review: not_run` are not user-facing product copy.

The existing 50 catalog failures remain a separate acquisition backlog. This redesign must make those gaps visible but does not fabricate their contents.
## Visual/UI correction contract

The target is a close structural analogue of the audited 21st.dev catalogue, adapted to Registry Atlas data.

Required corrections:
- left rail becomes the primary browse/navigation affordance;
- component cards are visually dominant and action-light;
- registry/profile component inventory appears before diagnostic facts;
- technical mirror metadata moves out of every view header;
- empty install queue consumes no permanent sidebar space;
- search/filter controls use bounded popovers/lists and preserve keyboard focus;
- grid density scales from roughly four columns on wide desktop to one column on narrow screens;
- card/detail hierarchy uses consistent spacing, borders, type scale, and muted metadata;
- pages have no horizontal document overflow at narrow viewport widths.

Do not clone 21st.dev branding, logos, proprietary copy, popularity metrics, bookmarking, paid templates, publishing, auth, or fabricated previews.

## Data model decisions

`RegistryCatalogIndex` is the inventory source of truth for browseable components.

`Registry.itemSummaries` remains an enrichment dataset.

The implementation should expose a normalized `CatalogComponent`/equivalent view model containing the union of compact facts plus optional reviewed enrichment, rather than forcing every UI surface to understand both sources independently.

Registry-level `component_tags`, `primary_focus`, and inferred coverage fields may remain in stored data for compatibility/research, but product component browse/search/compare paths must not consume them.

The component taxonomy modules may remain temporarily for legacy URL migration/tests, but new browse behavior must not depend on them.

## Testing decisions

Use public/core seams rather than private helpers.

Required deterministic tests:
- default catalogue returns real compact-index items with no query;
- zero registry-level fallback candidates exist;
- reviewed summary overlays a matching compact item rather than creating a duplicate;
- pagination can reach items beyond the first 1,000 matches;
- registry browse counts equal compact-index bucket counts;
- registry profile enumerates compact-index items and supports pagination/search;
- nested component slugs round-trip through canonical path parsing/serialization;
- legacy query URLs migrate to canonical paths;
- compare matrix derives presence from actual compact item identities;
- failed/stale/empty coverage states are distinguished;
- browse cards do not render install-action clusters;
- component detail retains install/inspect actions;
- narrow viewport has no horizontal page overflow in managed-browser verification.
## Acceptance criteria

The redesign is complete when:
1. Opening Components with no query shows real indexed components immediately.
2. The UI no longer reports `34 known items` as the catalogue inventory.
3. No registry metadata can create a component result without a real catalog item.
4. A registry with indexed items reports the correct indexed count and lists those items on its profile.
5. `@registrydirectory` no longer renders as `0 known items` while its compact bucket contains thousands of items.
6. Every visible component card links to a canonical `/@namespace/components/<item...>` route.
7. A nested item path survives direct navigation, copy-link, refresh fallback, and back/forward navigation.
8. Search/category lenses are shareable and operate only on real component records.
9. All 392 registries remain reachable through the Registries surface without rendering 392 full cards at once.
10. Compare uses real catalog identities rather than `ComponentTag` inference.
11. Catalogue coverage reports fetched/stale/failed states truthfully and removes internal `not_run` copy.
12. Browse cards are action-light; install/inspect controls live primarily on detail.
13. Managed-browser verification covers Components, filtered Components, Registries, a large registry profile, a normal component detail, a nested component detail, Compare, and narrow viewport.
14. `mise run verify` and `git diff --check` pass.

## Out of scope

- Copying 21st.dev branding, source code, authentication, bookmarks, social metrics, paid commerce, author publishing, templates marketplace, theme editor, or icon catalogue.
- Inventing visual previews when upstream registries do not publish trusted preview evidence.
- Popularity/newest ranking without trustworthy source data.
- Browser scraping as a runtime product feature.
- Automatically resolving all 50 currently failing registry catalog endpoints inside this UI redesign.
- Reviving the rejected entity/relationship prototype tracked separately in issue #3.

## Implementation order

1. Add canonical path routing and nested-slug tests.
2. Add the real-catalog query/view-model seam and remove fallback candidate generation.
3. Switch default Components to paginated real catalog inventory and simplify cards.
4. Switch Registries and registry profiles to compact-index counts/inventory.
5. Replace inferred Compare with real item-identity comparison.
6. Apply the 21st.dev-modeled navigation/layout cleanup and coverage copy.
7. Add the rerunnable inventory/UI contract audit.
8. Run focused tests, full verification, then managed-browser acceptance against the audited route set.

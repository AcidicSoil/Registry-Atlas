# Registry Atlas 21st.dev-Reference Browse Redesign

**Date:** 2026-09-28  
**Status:** Proposed replacement specification  
**Supersedes where conflicting:** `2026-09-28-remaining-backlog-completion-design.md`

## Problem

Registry Atlas now has a substantially larger machine-readable component inventory than the frontend exposes. The current generated data contains hundreds of registries and tens of thousands of discoverable registry items, but the product still behaves as though the small reviewed-summary set is the primary catalog.

That mismatch produces incorrect and confusing behavior:

- registry cards can report zero known items even when thousands of indexed items exist;
- registry profiles can say a catalog is not verified while a catalog index is present;
- Discover defaults to reviewed summaries plus registry-level fallback candidates instead of the actual item inventory;
- inferred `ComponentTag` values and registry-level pseudo-results can appear as though they are real components;
- Compare describes inferred capabilities rather than exact catalog inventory;
- all-registry and component browsing is not organized like a first-class catalog product;
- internal maintenance state is exposed more prominently than useful inventory information.

The intended product vision is much closer to 21st.dev: a component-first visual catalog where libraries/registries are browseable collections, real components have durable detail routes, and search/category/library routes lead to real item grids.

## Product intent

Registry Atlas will adopt 21st.dev's **information architecture, route grammar, browse/detail hierarchy, density, and interaction model** as the reference product shape, adapted to Registry Atlas data and actions.

This is a structural reference, not a brand or asset copy. Registry Atlas must not copy 21st.dev logos, marketing text, proprietary preview assets, or other protected brand material.

The core domain rule is:

> **The compact registry catalog index is the authoritative browse inventory. Reviewed summaries enrich indexed items; they do not decide whether an item exists.**

The inverse model used by the current frontend is retired.

## Reference audit

A live reference audit of 21st.dev was performed on 2026-09-28 with viewport and full-page screenshots plus DOM route manifests.

Local evidence directory:

`/home/user/.local/share/registry-atlas/reference/21st-dev-2026-09-28`

Captured public route families include:

| Reference route family | Captured example | Product pattern |
| --- | --- | --- |
| Home | `/` | visual catalog landing page |
| Components | `/community/components` | primary component browse surface |
| Component category/search | `/community/components/s/button` | category-specific real item grid |
| Featured | `/community/components/featured` | curated item grid |
| Newest | `/community/components/newest` | chronologically grouped real items |
| Newest period | observed `/community/components/newest/YYYY-Www` | nested date browse |
| Authors | `/community/authors` | creator collection |
| Author profile | `/@designali-in` | identity + authored item grid |
| Libraries | `/community/libraries` | library collection |
| Library category | observed `/community/libraries/s/:category` | filtered library collection |
| Library detail | `/@originui/library/origin-ui` | metadata rail + real item grid |
| Component detail | `/@designali-in/components/vercel-hero` | first-class item route |
| Component family | observed `/@originui/components/tree` | component with examples |
| Component nested example | `/@originui/components/tree/menu-navigation-tree` | multi-segment item/example path |
| Component variant | `/@jahed/components/flip-countdown/plain` | variant/example route |
| Explore collection | `/community/components/explore/react-21` | themed item collection |
| Templates | `/community/templates` | typed asset catalog |
| Template detail | `/@lyanchouss/templates/...` | typed asset detail |
| Themes | `/community/themes` | typed asset catalog |
| Theme detail | `/@serafimcloud/themes/vercel` | typed asset detail |
| Theme editor | `/community/themes/editor` | specialized tool surface |
| Icons | `/community/icons` | family/category browser |
| Icon family | `/community/icons/lucide` | family-scoped browser |
| Icon category | `/community/icons/c/layout` | category-scoped browser |

### Reference visual hierarchy

The captured 21st.dev component experience consistently uses these patterns:

- a compact global header;
- a component-browser sidebar with search, route shortcuts, and category counts;
- large preview-first item tiles arranged in a dense grid;
- browse pages composed from actual items, never generic library fallback cards pretending to be items;
- clear library/author routes separate from item routes;
- library detail pages with metadata in a narrow rail and the majority of the viewport devoted to the item grid;
- component detail pages with title/owner, a concise action row, a large preview or specimen area, then source/dependencies/related content;
- meaningful nested URLs for libraries, components, variants, and category searches;
- secondary actions visually subordinate to the primary browse/detail task.

Registry Atlas should reproduce those structural relationships with Registry Atlas data.

## Current data facts

At specification time the generated Registry Atlas data contains:

- 392 current mirrored registries;
- 342 successfully fetched registry catalogs in the latest evidence report;
- 335 current registries with at least one discoverable compact-index item;
- approximately 76.5k discoverable compact-index items;
- only 34 rich reviewed item summaries;
- 50 current catalog fetch failures;
- a small number of stale preserved catalog-evidence records.

Exact values are generated-data facts and may change on later syncs. The UI must derive counts from runtime data rather than hardcode them.

## Domain model

### Registry

A registry is a real upstream shadcn registry from the official mirrored directory.

A registry may have:

- official directory metadata;
- a registry URL template;
- a compact item index;
- catalog evidence/freshness state;
- reviewed Registry Atlas enrichment;
- zero or more catalog failures.

A registry is not a component candidate.

### Catalog item

A catalog item is a real upstream item found in the machine-readable registry catalog and retained in `public/data/registry-catalog-items.json`.

Primary identity:

`namespace + exact item name`

Identity comparisons must preserve punctuation and path segments. `foo/bar` and `foo-bar` are different items.

Discoverable item types remain:

- `registry:block`
- `registry:component`
- `registry:ui`
- `registry:page`
- `registry:item`

### Reviewed item enrichment

A reviewed item summary is optional metadata for a real catalog item.

When namespace + exact item name match, reviewed facts may enrich:

- display title;
- direct documentation URL;
- explicit preview/specimen URL;
- richer description/category information;
- reviewed provenance.

A reviewed record must not create a browse item that is absent from both the live/retained compact index and an explicit reviewed source intentionally kept as a real known item.

### No inferred component inventory

The inferred component system is retired from product behavior.

The following must no longer determine whether an item exists or appears in Discover, Registry Profile, counts, filters, or Compare:

- registry-level `component_tags`;
- inferred `ComponentTag` candidates;
- fallback candidates synthesized from registry capabilities;
- generic item names synthesized from taxonomy;
- registry-level pseudo-results shown as component results.

Historical inferred fields may remain temporarily in generated data for compatibility while migration is in progress, but they are not a product data source and must be removed from active browse/search/filter/compare logic.

## Canonical Registry Atlas route model

Registry Atlas will move from query-parameter-first navigation to readable path routes modeled after 21st.dev.

The GitHub Pages base remains `/Registry-Atlas/`.

### Primary routes

| Route | Purpose |
| --- | --- |
| `/` | component-first landing/browse entry; may internally render the Components experience |
| `/components` | all real discoverable catalog items |
| `/components/s/:category` | real items carrying that explicit upstream category |
| `/components?search=:query` | text search over real item and registry facts |
| `/registries` | all real registries/libraries |
| `/@:namespace` | registry/library profile |
| `/@:namespace/components/*itemName` | canonical Registry Atlas component detail |
| `/compare` | explicit exact-data comparison tool |

Namespace paths preserve the upstream `@` convention. Item paths may contain multiple safe path segments.

Example:

`/Registry-Atlas/@agentcn/components/eve/browser-agent`

### Compatibility redirects

Existing URL forms such as `?view=discover`, `?view=registries`, registry query state, and item query state must remain parseable during migration. On load they should canonicalize to the new path form with `history.replaceState` when enough information exists.

Old links must not silently open the wrong surface.

### Static GitHub Pages deep links

The Vite production build must emit a Pages-compatible SPA fallback so a direct request to a nested path renders Registry Atlas instead of a dead 404 page.

The preferred implementation is a generated `dist/404.html` equivalent of the application shell using the existing absolute base path. The router must read the original pathname directly.

No server dependency is introduced.

## Components / Discover experience

### Inventory

`/components` renders only real catalog items.

There are no registry-level fallback cards.

The default page must be useful without a search term. It must browse the real catalog inventory.

### Scale and pagination

The UI must not materialize 76k DOM nodes.

The browse model must support deterministic pagination or windowed paging over the complete result set.

Requirements:

- every matching item is reachable;
- counts reflect the complete result set, not the current rendered page;
- a page-size bound keeps DOM/render cost controlled;
- page state is shareable in the URL;
- filters/search reset or safely clamp the page index;
- no hard 1,000-result ceiling may make later matches unreachable.

A 1,000-result internal search-materialization guard may remain only if a higher-level paging/index mechanism still makes all matching items reachable.

### Search

Search uses real facts only:

- exact item name;
- item title;
- explicit upstream categories;
- registry namespace;
- registry display name/description where useful.

Search does not expand using inferred component taxonomy.

### Facets

Initial facets are limited to real facts:

- Registry
- Item type
- Explicit upstream category
- Reviewed/enriched status
- Catalog freshness/availability where useful as a maintenance filter

Do not invent category membership.

### Sort

Only support sort orders backed by available data.

Safe initial sorts:

- Name
- Registry
- Item type
- Reviewed metadata first

Do not expose Popular, Trending, Newest, quality score, recency, or usage rankings unless those facts are acquired from a trustworthy source.

### Component tiles

The 21st.dev reference is preview-first, but Registry Atlas currently cannot guarantee a visual preview for every upstream registry item.

A component tile therefore has two supported states.

**Preview available**

- show the explicit reviewed/upstream preview;
- show title/name and registry;
- entire tile opens the canonical component detail route.

**Preview unavailable**

- render a deliberate neutral specimen shell;
- clearly state that preview evidence is unavailable;
- show the real item name/title, registry, type, and optional explicit categories;
- never substitute a generic Button/Card/etc. preview;
- entire tile still opens the canonical component detail route.

The lack of a preview must not hide the component.

### Tile actions

Browse tiles remain browse-first.

Primary action:

- open component detail.

Secondary actions should be limited and visually quiet:

- copy install command when valid;
- optionally add to install queue.

Do not place Copy install, Inspect, Queue, Details, Homepage, Docs, Preview and other equal-weight actions on every tile.

## Component detail

Canonical path:

`/@:namespace/components/*itemName`

The component detail page is modeled after 21st.dev's component-detail hierarchy.

### Header

Show:

- real title/name;
- registry identity linking back to the registry profile;
- item type;
- explicit categories when available;
- reviewed/enrichment indicator where relevant.

### Primary actions

Supported actions:

- Copy install command;
- Inspect first / copy inspect command;
- Open raw upstream item route when available;
- Open verified documentation when available;
- Add to install queue.

Actions that do not have real evidence are omitted or explicitly disabled with a reason.

### Preview/specimen

If an explicit preview/specimen exists, show it prominently.

Otherwise show a purposeful “Preview unavailable” state and retain the full detail experience.

Do not fabricate a preview from inferred type or taxonomy.

### Raw item data and static detail bundles

A static GitHub Pages client cannot depend on direct browser fetches to arbitrary registry item URLs because upstream CORS policies vary. Live acceptance confirmed a valid upstream item route can still fail in the browser with `net::ERR_FAILED`.

Registry sync therefore generates one compact, same-origin safe detail bundle per successfully fetched registry under `public/data/registry-item-details/`.

Each bundle contains only normalized facts needed by detail UI:

- exact item name;
- optional title/description;
- real item type and explicit categories;
- dependencies;
- dev dependencies;
- registry dependencies;
- file path/type/target metadata.

The bundles must not copy source-code contents or arbitrary unreviewed HTML.

Measured 2026-09-28 sizing for this shape across roughly 76k discoverable items was about 23.1 MiB raw / 3.08 MiB gzip total, with the largest registry bundle about 2.3 MiB raw / 0.32 MiB gzip. Because detail fetches only the selected registry bundle, this is acceptable for the static architecture and avoids both a 23 MiB startup payload and tens of thousands of tiny files.

If a registry refresh fails transiently, preserve its prior detail bundle alongside the stale compact index.

Component detail lazily fetches the selected registry's same-origin detail bundle, then selects the exact item identity. The resolved upstream item URL remains available as provenance/action context. A direct upstream browser fetch may be attempted only as an optional fallback when same-origin detail metadata is unavailable; product correctness must not depend on third-party CORS.

Display safe normalized facts such as:

- dependencies;
- dev dependencies;
- registry dependencies;
- files;
- source/provenance and the resolved upstream raw-item URL.

### Related items

Related items may be computed only from real facts, for example:

1. same registry;
2. shared explicit upstream category;
3. same real item type;
4. reviewed direct relationships when explicitly present.

Do not use inferred component tags to manufacture similarity.

## Registries / Libraries experience

The 21st.dev Libraries route is the reference for Registry Atlas Registries.

### Registry list

`/registries` shows all mirrored registries with:

- registry name;
- official description;
- actual discoverable catalog-item count;
- catalog fetch/freshness status;
- homepage link when available;
- high-level real item-type/category summary where derivable from indexed items.

Do not show `itemSummaries.length` as “known items.”

### Registry-list scale

Do not render all registries as one undifferentiated long DOM.

Provide:

- search;
- status filters;
- item-count sort;
- pagination/windowing;
- truthful total count.

### Registry profile

`/@:namespace` is modeled after a 21st.dev library detail page.

The page prioritizes:

1. registry identity and useful upstream metadata;
2. real indexed item count and catalog status;
3. search/filter inside this registry;
4. a large real item grid.

The existing design that devotes substantial space to global mirror facts and inferred component text must be removed.

Global facts such as “392 / 392 mirrored” belong in a global data-status surface, not repeated on every registry.

If a registry has indexed items, the profile must not say “Catalog not verified” solely because there are no reviewed summaries.

### Missing catalogs

When a registry's catalog could not be fetched and no stale compact index exists:

- the registry profile still exists;
- catalog state is shown explicitly as unavailable/failing;
- the UI does not invent components;
- retry/maintenance evidence may be shown in a restrained status area.

When stale preserved data exists:

- render the stale real items;
- disclose that the catalog inventory is stale.

## Compare

The current closed-taxonomy “default capabilities” model is not the desired product.

Compare remains secondary to browse/detail and is rewritten around exact data.

Supported comparison modes:

### Registry comparison

Compare selected registries using real facts:

- indexed item count;
- exact item-name overlap;
- explicit categories;
- item types;
- catalog freshness;
- reviewed metadata coverage.

### Exact component comparison

A component comparison searches for an exact component/item identity across registries.

It must not expand an inferred “button capability” into registries that do not have a real matching item.

If fuzzy/name-family comparison is later desired, it needs a separate evidence-backed specification.

Remove wording such as “known component coverage” when it actually means inferred taxonomy capability.

## Navigation and shell

### Global navigation

The shell should be simplified around primary catalog tasks:

- Components
- Registries
- Compare
- Search
- Install queue indicator

A permanent empty install-queue panel is not part of the default layout.

### Install queue

When empty, show only a compact queue control/badge.

When populated, open a drawer/panel with:

- selected exact items;
- deduplication;
- bulk install command;
- remove/clear controls.

### Component browser sidebar

The Components route may use a 21st.dev-style left rail containing:

- component search;
- real explicit category counts;
- registry/type facets;
- navigation shortcuts.

The sidebar must not contain inferred component families.

### Responsive behavior

Desktop should preserve a dense multi-column browse grid.

Narrow widths must:

- collapse or drawer the component sidebar;
- avoid horizontal document overflow;
- keep item cards readable;
- keep detail actions accessible;
- preserve path/search state.

## Visual direction

Use the 21st.dev capture as the structural reference:

- dark neutral application chrome;
- restrained borders rather than heavy cards;
- dense preview grid;
- minimal header;
- prominent content canvas;
- metadata subordinate to the preview/item grid;
- one clear primary action at a time.

Registry Atlas branding, typography, labels, icons, and copy remain original.

The implementation should simplify the current interface rather than layering the new browse model on top of all existing panels.

## Data coverage and maintenance

The product cannot be considered complete merely because unsupported registries are silently empty.

The sync/maintenance backlog remains part of this redesign.

### Catalog failure audit

The latest evidence contains approximately 50 catalog failures.

The implementation phase must classify failures by reason, including:

- 404/not-found templates;
- 403/authorization;
- 429/rate limiting;
- malformed/non-JSON responses;
- timeouts/network failures;
- unsupported URL shapes;
- registries that successfully return a catalog with no discoverable item types.

For each class:

- determine whether a machine-readable alternate endpoint can be derived safely;
- add deterministic handling when an upstream pattern is documented/observable;
- preserve stale data on transient failure;
- do not add browser crawling to normal runtime.

The UI exposes incomplete coverage honestly.

## Frontend audit fixes included in this scope

The following previously identified issues are implementation requirements, not optional polish:

1. Registry cards must use actual indexed item counts.
2. Registry profiles must use actual indexed items.
3. Default Components/Discover must browse actual indexed items.
4. All registry/component lists need bounded rendering plus complete pagination/windowing.
5. Internal labels such as `Review: not_run` must not appear as primary user-facing content.
6. Global mirror facts must not be repeated on every registry profile.
7. Giant inferred “Components” taxonomy dumps are removed.
8. Empty install queue chrome is collapsed.
9. Component-card action density is reduced.
10. Terminology distinguishes indexed items, reviewed enrichment, stale catalog data and unavailable catalog data.
11. Compare is rewritten to exact-data semantics.
12. Narrow/mobile layouts are audited for overflow and interaction density.
13. Search/filter/result counts must refer to the complete matching set.
14. Loading/error/empty states must distinguish “no matching real items” from “catalog unavailable.”
15. All existing pseudo-result and generic-component code paths are deleted or made unreachable.

## User stories

1. As a component browser, I want the default Components page to show real registry items, so that every result corresponds to an upstream component or item.
2. As a component browser, I want to page through the full real catalog, so that items beyond an arbitrary render cap are reachable.
3. As a component browser, I want to search names, titles, registries and explicit categories, so that discovery uses facts rather than inferred taxonomy.
4. As a component browser, I want a stable URL for every item, so that I can share and return to a component directly.
5. As a component browser, I want nested upstream item names preserved in URLs, so that items such as `eve/browser-agent` remain distinct and routable.
6. As a component browser, I want cards without previews to remain visible and clearly marked, so that missing visual evidence does not erase real components.
7. As a component browser, I want component detail to show install/inspect/raw-route actions only when valid, so that I do not receive fabricated actions.
8. As a component browser, I want raw item metadata loaded on detail demand, so that browse pages remain fast while detail remains useful.
9. As a registry browser, I want all mirrored registries in a bounded searchable list, so that I can navigate the full registry directory.
10. As a registry browser, I want registry cards to report real indexed item counts, so that large registries are not shown as empty.
11. As a registry browser, I want each registry profile to show its real component inventory, so that I can browse a library in one place.
12. As a registry browser, I want failed/stale catalog status to be explicit, so that I can distinguish missing data from an empty registry.
13. As a user comparing registries, I want exact inventory overlap, so that comparison does not claim inferred capabilities as real components.
14. As a user with queued installs, I want a compact queue that expands only when useful, so that empty chrome does not consume the browsing layout.
15. As a user opening an old Registry Atlas URL, I want it migrated to the canonical route, so that existing bookmarks continue to work.
16. As a user opening a deep link on GitHub Pages, I want the SPA to render that route directly, so that shared component links work after refresh.
17. As a mobile user, I want component browsing and detail routes to avoid horizontal overflow, so that the catalog remains usable on a narrow viewport.
18. As a maintainer, I want catalog failures classified and surfaced, so that incomplete registry coverage is measurable rather than hidden.
19. As a maintainer, I want reviewed summaries to enrich exact indexed items, so that manual curation improves quality without shrinking inventory.
20. As a maintainer, I want pseudo-result generation removed, so that future UI work cannot accidentally reintroduce fake components.

## Module/interface decisions

The redesign should deepen the catalog boundary rather than teach every view how to merge compact and reviewed records independently.

### Catalog browse module

Introduce or evolve a narrow catalog interface that owns:

- exact item identity;
- reviewed-enrichment merge;
- full-result counting;
- deterministic paging;
- real-fact search;
- real-fact facets;
- per-registry item enumeration;
- safe canonical component paths.

UI modules consume browse-page results and counts from this interface.

They do not assemble fallback candidates themselves.

### Registry browse module

Registry browse derives item counts/status from the catalog interface and catalog evidence.

It does not use reviewed-summary count as inventory count.

### Router

Create one route parser/serializer that owns path + query state.

Views do not hand-assemble URLs.

The router supports:

- current canonical path routes;
- old query-param migration;
- base-path awareness;
- multi-segment item names;
- safe encoding/decoding;
- Pages deep-link fallback.

### Detail module

Detail resolution accepts exact namespace + exact item name and merges:

1. compact index identity;
2. reviewed enrichment;
3. lazily loaded same-origin safe detail metadata from the generated per-registry bundle.

The module keeps upstream raw-item URLs as evidence/actions but does not require cross-origin browser access to render full normalized detail.

## Testing decisions

Prefer behavior tests at the existing public seams.

Required automated coverage includes:

### Catalog behavior

- default browse returns real compact-index items without a query;
- no registry fallback candidates are returned;
- reviewed enrichment overrides only matching exact identities;
- punctuation/path-distinct identities remain separate;
- complete result count differs from page size correctly;
- later pages make items beyond the first render window reachable;
- search uses name/title/category/registry facts;
- inferred `ComponentTag` values do not make items appear;
- registry item enumeration uses the compact index;
- stale namespace data remains browseable with stale status.

### Routing

- canonical component route round-trips namespace and multi-segment item name;
- registry profile route round-trips namespace;
- search/page/filter state round-trips;
- old query-param URLs canonicalize correctly;
- unsafe path segments are rejected;
- base-path handling works under `/Registry-Atlas/`.

### UI

- Components default renders real indexed cards;
- a registry with thousands of indexed items and zero reviewed summaries displays the correct count;
- that registry profile lists real indexed items;
- preview-unavailable cards are explicit and still clickable;
- no generic fallback item is rendered;
- pagination changes visible inventory and retains truthful total count;
- empty queue does not occupy the permanent sidebar;
- component detail exposes expected route/install actions;
- indexed-only detail loads normalized metadata from the generated same-origin registry detail bundle;
- detail still renders safely when the upstream raw route is not CORS-accessible;
- stale catalog refresh preserves the previous same-origin detail bundle;
- compare uses exact-data overlap;
- no internal `not_run` status leaks into primary UI.

### Generated data

- current compact index validates declared namespace/item counts;
- all current registry namespaces are reconciled against catalog evidence;
- failure report totals are consistent with registry coverage.

### Browser acceptance

Using the project-managed PinchTab profile, verify at desktop and narrow viewport:

1. `/components`;
2. a real category/filter state;
3. `/registries`;
4. a large registry profile with no reviewed summaries;
5. a simple component detail;
6. a nested-name component detail;
7. Compare;
8. queue-empty and queue-populated states;
9. direct deep-link reload behavior.

Acceptance requires:

- no application exceptions;
- no unexpected 5xx responses;
- no horizontal document overflow at the narrow viewport;
- every displayed component corresponds to a real indexed identity;
- full counts remain truthful under paging/search/filtering.

## Migration strategy

This redesign is a replacement of the current discovery model, not an additive layer.

Recommended tracer order:

1. Catalog browse interface and exact paging.
2. Canonical path router and compatibility migration.
3. Components page using only real catalog items.
4. Component detail canonical routes.
5. Registries list + registry profile using catalog inventory.
6. Shell/navigation/queue simplification.
7. Exact-data Compare.
8. Coverage/failure audit and UI status cleanup.
9. Desktop/narrow visual polish against 21st.dev reference captures.

At each stage, remove the replaced pseudo-result path instead of retaining parallel behavior indefinitely.

## Acceptance criteria

The redesign is complete only when all of the following are true:

1. The default Components route visibly browses real indexed items without requiring search.
2. No registry-level fallback candidate or inferred generic component appears as a component result.
3. Every indexed item in a successful/stale catalog is reachable through deterministic browse paging or search.
4. Every visible item has a canonical Registry Atlas detail URL.
5. Multi-segment item names remain distinct and routable.
6. Registry cards and profiles use real indexed counts/inventory.
7. A registry with 13k+ indexed items and zero reviewed summaries no longer reports zero known items.
8. Preview absence never removes a real item and never produces a fabricated preview.
9. Search/facets use real data fields only.
10. Compare no longer presents inferred taxonomy as exact component coverage.
11. The permanent empty queue panel is removed.
12. Old query-param links remain compatible through canonical migration.
13. Nested paths reload under the GitHub Pages build.
14. Catalog failure/stale coverage is visible and internally consistent.
15. Full automated verification passes.
16. Managed-browser acceptance passes for desktop and narrow viewport.
17. The final rendered hierarchy is recognizably modeled on the audited 21st.dev browse/library/detail structure while retaining original Registry Atlas branding and copy.

## Out of scope

The following are explicitly not required by this implementation:

- copying 21st.dev branding, wording, logos or proprietary preview media;
- user accounts, authentication, bookmarks or social features;
- popularity/bookmark/view metrics not present in Registry Atlas data;
- “Featured,” “Trending” or “Newest” rankings without trustworthy source data;
- templates/themes/icons as new Registry Atlas product types unless registry data already exposes them as normal discoverable registry items;
- executing untrusted registry component code in-browser to synthesize previews;
- browser crawling as part of normal catalog sync/runtime;
- the separate GitHub issue #3 entity/relationship redesign;
- publishing/re-enabling the GitHub Pages deployment before the user decides the product is ready.

## Reference artifacts

Reference screenshots and manifests are intentionally kept outside the repository because they are third-party rendered content used for design study.

Directory:

`/home/user/.local/share/registry-atlas/reference/21st-dev-2026-09-28`

The directory contains paired viewport/full-page screenshots and route manifests for the audited page families above.

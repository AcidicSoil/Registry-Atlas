# Registry Atlas 21st.dev parity corrective design

Date: 2026-09-28
Status: implementation-authoritative corrective specification

## Purpose

Registry Atlas should use the audited 21st.dev product shape as its structural reference, not merely borrow a dark shell and card grid. The application must provide a component-first visual catalog, distinct collection routes, registry/library pages, durable asset detail paths, and route-specific empty/unavailable states.

This spec corrects scope drift in `2026-09-28-21st-reference-registry-atlas-redesign.md`. Where the two specs conflict, this spec wins. Requirements from the earlier spec remain in force when they are compatible with this document.

The reference is structural. Registry Atlas keeps its own branding, copy, data, install workflow, and product identity. It must not copy 21st.dev proprietary media, logos, or account/social features.

## Non-negotiable data rule

Every rendered catalog item must correspond to real upstream evidence.

Registry Atlas must not create product inventory from:

- inferred `component_tags`;
- a closed component taxonomy;
- registry-level capability guesses;
- name-family expansion;
- generic fallback candidates;
- popularity, recency, author, or quality claims that are not present in trustworthy source data.
Reviewed enrichment may improve a real item but may not create an item that is absent from the catalog index.

When a 21st.dev-shaped route requires data that Registry Atlas does not have, the route still exists and renders a deliberate evidence-unavailable state. It must not silently redirect to Components or fabricate substitute content.

## Reference evidence

The audited 21st.dev captures are stored outside the repository at:

`/home/user/.local/share/registry-atlas/reference/21st-dev-2026-09-28`

The post-push Registry Atlas audit is stored at:

`/home/user/.local/share/registry-atlas/audit/postpush-2026-09-28`

The current audit proves four corrective requirements:

1. the broader route family was audited but scoped out of implementation;
2. same-origin item-detail bundles were specified but never generated;
3. the registry directory lacks required status filtering and item-count sorting;
4. legacy inference code remains in the repository after the active Components path moved to real catalog data.

## Product route model

All routes are base-path aware under `/Registry-Atlas/`.

| Route | Registry Atlas meaning |
| --- | --- |
| `/` | dedicated catalog landing page |
| `/components` | all real component-like catalog items |
| `/components/featured` | reviewed/enriched real items; no popularity implication |
| `/components/newest` | real items ordered only by explicit upstream item timestamp |
| `/components/newest/:period` | timestamp-backed period slice when timestamps exist |
| `/components/s/:category` | exact real category/search browse |
| `/components/explore/:collection` | named collection backed by explicit category/type rules |
| `/authors` | explicit upstream author/publisher identities only |
| `/@:namespace` | registry/library profile |
| `/registries` | registry/library directory |
| `/@:namespace/components/*itemName` | component detail |
| `/templates` | explicit template assets |
| `/@:namespace/templates/*itemName` | template detail |
| `/themes` | explicit theme/style assets |
| `/@:namespace/themes/*itemName` | theme detail |
| `/themes/editor` | theme inspector/editor only when real theme-token data exists |
| `/icons` | explicit icon assets/categories |
| `/icons/:family` | explicit icon family scope |
| `/icons/c/:category` | explicit icon category scope |
| `/compare` | exact catalog comparison |

Unknown supported-family paths must render a route-specific not-found/unavailable view. They must not canonicalize to `/components`.

## Evidence-backed asset classification

Classification is a deterministic mapping from explicit catalog facts. It is not taxonomy inference.

- Component: `registry:block`, `registry:component`, `registry:ui`, or `registry:item`.
- Template: `registry:page`.
- Theme: `registry:style` or `registry:theme` when those upstream types are present.
- Icon: an explicit icon item type when present, or an item whose explicit upstream category is one of the configured icon categories.
The initial icon category allow-list may include only categories observed in generated data, such as `icons`, `icon-stack`, and `morph-icon`. Do not classify an item as an icon because its name contains "icon".

The compact catalog sync must retain all item types needed by these routes. Unsupported item types may remain excluded from primary browse, but the exclusion must be intentional and tested.

## Honest semantics for incomplete route families

### Featured

`/components/featured` is the reviewed/enriched subset of real component items. The UI labels the basis explicitly, for example "Reviewed components". It does not claim popularity or community ranking.

### Newest

Newest requires an explicit per-item timestamp from upstream data. Sync may retain a timestamp only when the upstream item provides one directly.

If no trustworthy item timestamp is available, `/components/newest` renders an evidence-unavailable state explaining that Registry Atlas cannot order items by publication time yet. It must not use registry sync time as item publication time.

### Authors

Authors require explicit author/publisher metadata. Registry namespaces are not silently re-labeled as people.

Until the source provides author identity, `/authors` renders a first-class unavailable state and links to Registries as the available publisher/library directory.

### Explore collections

Explore collections are configuration-backed combinations of exact item types and explicit upstream categories. Every collection definition contains its evidence rule. A collection may not use inferred component tags or fuzzy name matching.
Initial collections should be limited to high-signal explicit categories already present in the generated index, such as AI, forms, dashboard, marketing, navigation, and charts. Unknown collection slugs render not-found.

## Dedicated landing page

The root route is no longer an alias for Components.

The landing page uses the reference hierarchy:

1. compact global header;
2. original Registry Atlas hero and catalog totals;
3. evidence-backed browse shortcuts;
4. one or more preview-first strips/grids drawn from real reviewed items and explicit collections;
5. registry/library discovery;
6. restrained data-coverage disclosure.

The landing page must not present fake trending/popular/newest labels.

## Components visual hierarchy

Desktop Components uses a persistent left browse rail similar to the reference:

- search;
- Featured and Newest route shortcuts;
- Registries/Libraries shortcut;
- Explore collection shortcuts;
- explicit category counts;
- real type/registry filters.

The main canvas prioritizes the item grid. Filter controls that do not fit the rail may appear in a compact toolbar. The existing five-wide select form must not dominate the content header.

Preview-backed cards make the preview the largest visual element. Preview-unavailable cards stay reachable but use a smaller deliberate specimen state so missing previews do not visually overwhelm the catalog.

Mobile collapses the browse rail into a compact drawer/control and keeps one-column readable cards without horizontal overflow.
## Registry directory and library profile

`/registries` must support:

- search;
- coverage-status filter: current, stale, empty, unavailable;
- sort by name and indexed item count;
- deterministic pagination;
- truthful totals and coverage counts.

State must round-trip through the URL.

Registry profiles continue to use real compact-index inventory. The profile layout follows the 21st.dev library pattern: a narrow metadata/identity area and a dominant item grid.

## Same-origin item detail bundles

The catalog sync generates one safe normalized detail bundle per successfully fetched registry under:

`public/data/registry-item-details/`

A bundle contains:

- exact item name;
- title and description when present;
- real item type;
- explicit categories;
- dependencies;
- dev dependencies;
- registry dependencies;
- file path/type/target metadata;
- optional explicit upstream timestamp/author fields when present.

The bundle must not contain source-code contents or arbitrary upstream HTML.

Bundle filenames derive deterministically from safe normalized namespaces. The loader must use `import.meta.env.BASE_URL` and fetch the same-origin bundle first. It then selects the exact item identity.
The upstream raw-item URL remains an action/provenance link. A third-party fetch may be an optional fallback only when the local bundle is absent. Product correctness must not depend on CORS.

On transient catalog failure, sync preserves the prior compact index and prior detail bundle for that registry. Stale status remains visible.

## Legacy inference retirement

The old inferred component system is deleted from active product architecture, not merely bypassed.

Implementation must migrate remaining callers and then remove obsolete modules/types/tests whose purpose is the inferred taxonomy path, including the old discovery/grouping/matrix/component-evidence stack when no longer needed.

The runtime registry model must stop exposing `component_tags` as product state. The sync pipeline must stop generating inferred component tags for runtime behavior. Historical source data may remain in archived/raw fixtures only when required for provenance.

Legacy query-parameter compatibility may parse old URLs, but it must translate them into real catalog search/category state without importing or consulting the old taxonomy.

A repository check must fail if active source reintroduces imports of the retired inference modules.

## Detail and typed asset pages

Component, template, and theme detail pages share one deep detail module and one safe detail-data loader.

The route decides the asset kind; the detail resolver verifies that the exact indexed item belongs to that kind. A mismatched typed route renders not-found rather than coercing the item.

The page hierarchy follows the reference:

- identity/title;
- publisher/registry link;
- concise action row;
- large preview/specimen region;
- normalized dependency/file/source facts;
- related real items when explicit evidence supports them.

Theme editor is a separate tool surface. It becomes interactive only when real theme token data is present. Before that, it renders an evidence-unavailable state rather than a fake editor.

## Visual parity target

Registry Atlas should be recognizably shaped like the audited reference at a glance:

- compact top chrome;
- left navigation/browse rails where the reference uses them;
- dense preview-first grids;
- low-card-chrome borders;
- minimal duplicated metadata;
- route-specific headings and breadcrumbs;
- content canvas larger than controls;
- specialized layouts for registry, author, template, theme, and icon families.

Parity does not mean copying proprietary content. Original Registry Atlas colors, typography, labels, and actions remain.

## Architecture

### Catalog domain

Introduce one catalog-domain API that owns:

- exact identities;
- asset-kind classification;
- exact category/type filtering;
- reviewed enrichment;
- pagination;
- optional explicit timestamp/author fields;
- route-safe item lookup.

Views do not classify items themselves.

### Router

One discriminated `CatalogRoute` union owns every route family above. Parsing and serialization are exhaustive and base-path aware. Unsupported paths remain distinguishable from Components.
### Registry directory model

Directory options become a typed object with search, coverage filter, sort, page, and page size. Coverage and sorting operate before pagination.

### Detail bundle generator

Catalog sync returns compact items and normalized detail items from the same fetched registry payload. A deterministic writer produces detail bundle files and preserves prior files for failed namespaces.

### UI composition

Split route-specific rendering out of the current monolithic shell where doing so lowers reader load. The shell owns navigation/history/state coordination; page modules own page models and markup.

## Testing contract

Add or update deterministic tests for:

- every route parse/serialize round trip, including nested item paths;
- unknown route families not falling back to Components;
- Featured containing only reviewed real items;
- Newest unavailable without timestamps;
- explicit asset-kind classification;
- Explore collections using only configured explicit facts;
- registry search/status/sort/page URL round trips;
- same-origin detail bundle generation and stale preservation;
- loader preferring the local detail bundle and succeeding when upstream CORS fails;
- typed detail routes rejecting mismatched item kinds;
- no active source imports from retired inference modules;
- root rendering a dedicated landing model;
- mobile layouts remaining overflow-free.

## Browser acceptance

Use the managed `registry-atlas` PinchTab profile. Capture desktop and 390px evidence for:

1. `/`;
2. `/components`;
3. `/components/featured`;
4. `/components/newest`;
5. `/components/s/button`;
6. one Explore collection;
7. `/authors`;
8. `/registries` with search/filter/sort state;
9. a large registry profile;
10. a simple component detail;
11. a nested-name component detail;
12. `/templates` and a template detail;
13. `/themes` and `/themes/editor`;
14. `/icons` plus family/category paths;
15. `/compare`.

Acceptance requires no application exceptions, no unexpected 5xx responses, no narrow horizontal document overflow, no silent unsupported-route fallback, and no displayed item without exact catalog identity.

## Completion criteria

The corrective implementation is complete only when:

1. the root is a dedicated landing page;
2. all audited route families have first-class route handling;
3. unsupported evidence states are explicit instead of redirected or fabricated;
4. active browse and typed collections use real indexed facts only;
5. same-origin detail bundles are generated and used;
6. registry search/status/sort/page behavior is implemented and shareable;
7. the old inferred taxonomy/discovery/matrix product path is removed from active source;
8. the rendered browse/library/detail hierarchy is materially closer to the stored 21st.dev captures;
9. full automated verification passes;
10. fresh managed-browser desktop/mobile evidence passes.

## Implementation order

1. Delete/migrate legacy inference callers and establish the new route/domain types.
2. Add same-origin detail generation and loading.
3. Complete registry directory controls.
4. Add first-class landing and missing route-family page models.
5. Apply reference-shaped navigation/grid/detail styling.
6. Add the rerunnable contract check and browser acceptance pass.

## Out of scope

This corrective spec still does not require:

- copying 21st.dev branding, proprietary screenshots, or account/social features;
- inventing popularity/bookmark/view metrics;
- claiming item publication recency without explicit source timestamps;
- claiming human authorship without explicit source author metadata;
- executing arbitrary third-party registry code in the browser;
- browser crawling as a normal runtime data source;
- re-enabling public deployment before the user chooses to publish.

The absence of trustworthy data is a product state, not permission to infer it.

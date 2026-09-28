# Registry Atlas Remaining Backlog Completion

## Status

Implementation-authoritative design for the remaining concrete Registry Atlas backlog after the visual-dictionary redesign and UX-overhaul work landed.

## Product intent

Registry Atlas should expose the component inventory that already exists in connected shadcn registries without requiring Atlas maintainers to pre-enumerate every component name in a closed taxonomy.

The current crawler already reaches most machine-readable registry catalogs, but the generated runtime only preserves aggregate counts and a closed set of inferred tags. The remaining work is to retain a compact searchable index of real catalog items, make those indexed items discoverable and actionable, and keep the default static app fast.

## Reconciled backlog

Repository evidence shows these old TODOs are already complete and should no longer remain active:
- GitHub Pages base/deployment configuration.
- The Discover / Registries / Compare visual-dictionary redesign.
- The August 26 UI/UX cleanup and comparison pass.
- Rendering real previews when a trusted preview URL exists.

The active backlog is:
- Pin the local package-manager/runtime toolchain and make CI consume the same project configuration.
- Preserve item-level catalog facts already fetched by the registry sync.
- Let search and the Component facet discover item names that are not in the ComponentTag vocabulary.
- Keep indexed results installable/inspectable and able to open item detail through the registry route.
- Reconcile TODO.md and stale docs/todo/ files with current reality.

Open issue #3 remains a separate product/domain question. This work must not claim that an extensible entity/relationship model has been accepted.

## Evidence and constraints

As of the September 23 generated data:
- 382 registries are mirrored.
- Catalog sync fetched 334 registries and reported 48 failures.
- The crawler observed more than 80,000 upstream catalog items.
- Only 34 reviewed rich item summaries across six registries reach the current runtime.
- No reviewed item currently has a preview URL.

A live sizing probe found 76,044 entries of user-facing registry types (registry:block, registry:component, registry:ui, registry:page, registry:item). A minimal name/type/title/category index is about 5.2 MB raw and about 0.68 MB gzip. A richer row shape with descriptions would be about 14.5 MB raw.

The app remains a static Vite SPA deployed to GitHub Pages. No backend, database, runtime crawler, or frontend-framework migration is introduced.

## Design

### 1. One project-owned toolchain

Commit mise.toml as the repository toolchain/task entrypoint. Pin Node 24.21.0 and pnpm 11.24.0, matching the verified local toolchain.

Add packageManager: "pnpm@11.24.0" to package.json.

The Pages workflow should use jdx/mise-action@v4 to install the versions from mise.toml, then execute mise run install and mise run verify. Existing Pages deployment steps remain otherwise unchanged.

### 2. Generated compact catalog index

Extend the existing catalog-evidence sync instead of adding a second crawler.

Generate public/data/registry-catalog-items.json with:
- metadata: source/sync timestamp, registry count, discoverable item count;
- a registry-keyed map of compact item entries;
- only real upstream values needed for discovery: name, type, optional title, and optional upstream categories.

Only the five user-facing registry item types above enter the index. Infrastructure/theme/font/lib/hook/file/style/base/internal records remain available through source registries but do not become primary component-search results.

The index must not store copied source code, dependencies, file bodies, generated preview claims, popularity, quality scores, or other speculative enrichment.

Fresh catalog data replaces the prior namespace. If a namespace fails during a later sync, preserve its prior compact entries and mark its catalog evidence stale, matching the existing evidence-preservation behavior.

Reviewed rich entries in data/shadcn/registry-items.json remain the higher-authority enrichment source.

### 3. Open-vocabulary discovery

Add a runtime RegistryCatalogIndex contract separate from Registry.itemSummaries.

The loader fetches the normal registry mirror and compact catalog index together. The existing 34 reviewed item summaries remain attached to Registry and remain the default visual catalog.

Indexed records are materialized into normal RegistryItemSummary/candidate behavior only when:
- the global Discover query is non-empty; or
- the user selects an open-vocabulary Component facet value.

This prevents the default page from constructing and sorting tens of thousands of candidates.

Search matching uses real item name and optional title. The existing curated taxonomy continues to provide aliases/categories for known concepts, but it no longer determines whether an upstream item is discoverable.

A compact indexed match receives:
- registry namespace from the containing index bucket;
- slug = name;
- catalog status available;
- high confidence for the fact that the catalog item exists;
- source/provenance pointing to the machine-readable registry catalog;
- route eligibility when the registry URL template resolves that item.

If a reviewed rich summary exists for the same namespace/slug, the reviewed summary wins.

Search results from the compact index must support the same install/inspect commands and raw-item detail route as reviewed results. Full detail continues to come from the existing raw item JSON fetch path; the compact index is not a duplicate detail store.

### 4. Component facet behavior

The Component facet keeps curated taxonomy options when its local facet-search box is empty.

When the user types into the Component facet search, append matching open-vocabulary item identities from the compact index. Render only the existing bounded option window; do not place all ~66,000 unique names into the DOM.

A selected raw component identity uses the same OR-within-Component and AND-across-facets semantics already used by the catalog. Registry/category facets keep their existing meaning.

Registry browse filtering may recognize open-vocabulary component selections through the compact index, but the registry list must remain one row per registry.

### 5. Bounded result materialization

Indexed search must have a deterministic upper bound to avoid pathological broad-query work. Materialize at most 1,000 compact-index candidates per render pass.

When the index contains more matches than the bound, the Discover surface must state that results are truncated rather than presenting 1,000 as the total universe. Existing pagination continues to page the materialized set.

### 6. Backlog and documentation hygiene

Rewrite TODO.md so completed redesign/deployment work is not presented as unfinished.

Remove the two completed docs/todo/00_* deployment task files.

Keep these future items explicitly deferred:
- browser-assisted/manual research for the registries whose machine-readable catalogs fail or use unsupported templates;
- acquisition of trustworthy preview/specimen URLs or generated static screenshot evidence;
- the open issue #3 entity/relationship domain-model rethink.

docs/future-enhancements.md should stop proposing a registry-level docBaseUrl as though item detail links do not exist. Document the current item-route/docs behavior and leave only genuinely unsupported direct-documentation discovery as future work.

## Failure behavior

- A failed catalog refresh must not erase previously indexed items for that namespace.
- A missing/malformed runtime compact index fails the bootstrap rather than silently claiming full item coverage.
- Invalid or unsupported item types are ignored by the compact discovery index.
- Indexed items with an unresolvable route remain searchable but expose the existing disabled install/inspect reason.
- No result may imply a real visual preview unless a trusted preview URL exists.

## Testing

Add deterministic coverage for:
- compact item extraction and filtering by allowed item type;
- stale compact-index preservation after a failed refresh;
- loader validation/mapping of the new runtime index;
- open-vocabulary search by item name/title;
- reviewed-summary precedence over compact indexed data;
- bounded indexed result materialization and truthful truncation state;
- Component facet lookup/selection for a value outside ComponentTag;
- indexed install/detail route behavior;
- unchanged default Discover behavior when query and raw component selection are empty;
- project toolchain/workflow configuration through executable mise tasks.

## Acceptance criteria

The work is complete when:
- mise.toml is tracked and local/CI verification use its pinned Node/pnpm versions.
- Sync emits a compact runtime catalog index from the same catalogs already fetched for evidence.
- Temporary per-registry fetch failures retain prior index entries.
- Discover can find a real upstream item that is absent from the curated ComponentTag vocabulary and absent from the 34 reviewed summaries.
- The Component facet can surface/select that same open-vocabulary identity without rendering the entire index.
- Indexed results produce the existing safe install/inspect actions and can resolve their raw item detail route.
- The empty/default Discover view remains bounded to the reviewed/default catalog rather than materializing the full index.
- Broad indexed searches cap at 1,000 materialized results and clearly disclose truncation.
- TODO.md and docs/todo/ no longer report completed work as pending.
- Issue #3 remains open/deferred; no rejected domain-model prototype is revived.
- mise run verify and git diff --check pass.
- If user-visible indexed discovery behavior changes, the managed-browser smoke verifies search, an indexed result, detail navigation, and no browser console/errors on the production base path.

## Non-goals

- A general web-browsing agent inside the product.
- A backend search service.
- Automatic browser scraping of the 48 current catalog failures.
- A new taxonomy ontology or accepted entity/relationship domain model.
- Fabricated previews or screenshot generation without a separate reviewed evidence workflow.
- Popularity, recency, quality, accessibility, or license scoring without source data.
- Replacing the reviewed rich catalog; the compact index complements it.

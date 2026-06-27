# v1.2 Research: Architecture

**Milestone:** v1.2 Component Peek & Alternatives Foundation
**Date:** 2026-06-27

## Question

How should component peek and item detail capabilities integrate with the existing Registry Atlas architecture?

## Current architecture anchors

- Core logic lives under `src/registry-explorer/core/`.
- Data loading lives under `src/registry-explorer/data/`.
- Renderers live under `src/registry-explorer/ui/` and must escape imported text.
- `shell.ts` coordinates state, URL state, selection, queue, and rendering.
- `public/data/registries.json` is the runtime generated data source.
- `RegistryItemSummary` already has route, command, dependency, registry dependency, file, evidence, docs, preview, and status fields.

## Recommended integration

### 1. Route and state layer

Extend URL/view state to support:

- `view=item`
- `registry=<namespace>`
- `item=<slug>`
- optional return context: search/profile/focus can remain existing state.

Implementation likely touches:

- `src/registry-explorer/core/urlState.ts`
- `src/registry-explorer/ui/shell.ts`
- tests for URL parsing/serialization.

### 2. Detail loading layer

Add a data/core boundary for item detail loading:

- `loadRegistryItemDetail(registry, itemSummary)` or equivalent.
- Fetch route-eligible `rawItemUrl`/resolved route.
- Validate/normalize into `RegistryItemDetail`.
- Return a discriminated result: `loaded`, `unavailable`, `fetch-error`, `invalid-json`, `invalid-schema`, `cors-blocked` if detectable.

The static app can fetch public JSON routes, but some third-party URLs may fail due CORS or network availability. Those failures must become UI states, not app crashes.

### 3. Detail model

`RegistryItemDetail` should include:

- summary linkage: namespace, slug, install token, catalog status.
- item JSON fields: name, title, description, type, dependencies, devDependencies, registryDependencies, files.
- visual fields: previewImageUrl, screenshotUrl, previewUrl, docsUrl, visualStatus, visualSource.
- computed fields: dependency counts, registry dependency counts, file counts, risk/evaluation badges.
- raw JSON string/object for display.

### 4. Peek UI layer

Add a peek card renderer that can be reused from discovery rows and profile rows.

Interaction requirements:

- Mouse hover and keyboard focus should reveal peek affordance.
- Click/tap should open/pin the detail route or card.
- Escape/back should close/return.
- The peek should not rely on iframe availability.

### 5. Related components layer

Add a pure function that finds related components by:

- same taxonomy tag
- same taxonomy category
- same component type
- same/overlapping dependency or registry dependency metadata as later signal

It should label these as “related” or “similar alternatives,” not “better.”

### 6. Verification architecture

Tests should cover:

- URL state parsing/serialization for item routes.
- route resolution and failure states.
- detail JSON validation/normalization.
- peek/detail view model escaping and fallback copy.
- related component selection behavior.
- filter behavior.

## Suggested build order

1. Item route state and shell/view routing.
2. Detail model + loader + validation + tests.
3. Item detail page renderer with raw/details/actions/failure states.
4. Peek card renderer and route-eligible actions.
5. Related component alternatives foundation.
6. Type filters and final polish.

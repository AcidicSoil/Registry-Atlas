# Phase 7: Item Detail Data & Routing - Research

**Researched:** 2026-06-27
**Status:** Complete

## Research Goal

Answer: what do downstream planners need to know to plan Phase 7 well?

Phase 7 must add internal item routes and typed item-detail loading while preserving the user’s locked product decision: the route should feel like a component page, not a JSON inspector. Registry item JSON is required as data infrastructure, but raw JSON should not appear in the normal user UI.

## Source Inputs

- `.planning/phases/07-item-detail-data-routing/07-CONTEXT.md`
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
- `.planning/research/SUMMARY.md`
- `.planning/research/ARCHITECTURE.md`
- `src/registry-explorer/core/urlState.ts`
- `src/registry-explorer/core/itemRoutes.ts`
- `src/registry-explorer/core/registry.schema.ts`
- `src/registry-explorer/core/installActions.ts`
- `src/registry-explorer/data/loadRegistries.ts`
- `src/registry-explorer/ui/shell.ts`
- Official shadcn registry docs, checked 2026-06-27:
  - `https://ui.shadcn.com/docs/registry/registry-item-json`
  - `https://ui.shadcn.com/docs/registry/registry-json`
  - `https://ui.shadcn.com/docs/registry/namespace`
  - `https://ui.shadcn.com/docs/registry/registry-index`
  - `https://ui.shadcn.com/docs/changelog/2026-05-registry-include`

## Summary

Phase 7 should be planned as two implementation slices:

1. **Item route + detail data model** — extend URL state to accept `view=item`, `registry`, and `item`; resolve route-eligible summaries; fetch/normalize registry item JSON; return explicit result states.
2. **Component-first item page** — render a user-facing item page that starts with component identity, visual/preview placeholder/link, description, status/actions, and then concise technical evaluation details. Do not render raw JSON as a normal UI section.

The highest-risk planning issue is a wording conflict: earlier ROADMAP/REQUIREMENTS text mentions showing escaped raw JSON, but the Phase 7 context now locks the opposite UI decision. Planners should treat CONTEXT.md as the newer and more specific user decision. The implementation can still preserve raw JSON internally for agents/tests/maintainers, but the normal user page should not display it.

## External Registry Findings

### Registry item JSON shape

The current shadcn `registry-item.json` docs confirm that registry items carry a `type`, and can include `dependencies`, `devDependencies`, `registryDependencies`, and `files`. `files` entries have `path`, `type`, and optional `target`, with `target` required for some file/page-style cases. This maps directly to Registry Atlas’s existing `RegistryItemSummary` fields and the desired Phase 7 `RegistryItemDetail` fields.

### Registry index and route expectations

The current shadcn `registry.json` docs describe the root registry file as the registry entry point with metadata and an `items` array. The registry directory requirements say public directory registries are expected to be valid schema JSON and flat enough that `/registry.json` and item JSON files are addressable at the root. This supports the current `registryUrlTemplate` / `rawItemUrl` route-resolution approach.

### Namespace and command semantics

Current shadcn namespace docs describe namespaced registries as multiple resource sources and use the `@registry/item` format. The CLI/changelog docs confirm namespaced installs such as `shadcn add @acme/button`. Existing Registry Atlas copy-only `add` / `view` command helpers should remain the command source of truth.

### Validation trajectory

The May 2026 registry include/validate changelog says shadcn now validates root registry files, included registry files, item schema errors, duplicate item names, include rules, and local item file paths. Phase 7 does not need to add shadcn CLI validation, but planning should preserve clear loader/result states because the broader ecosystem is moving toward stronger registry validation.

## Codebase Findings

### URL state

`src/registry-explorer/core/urlState.ts` currently allows only `discover`, `focus`, `component`, and `matrix`. It serializes `view`, `q`, `registry`, `candidate`, `focus`, and `component`.

Planning implication:

- Extend `RegistryExplorerView` to include `item`.
- Add an `item` URL parameter for item slug/token.
- Keep existing `registry` semantics but validate that the registry exists and the item belongs to that registry.
- Update `tests/registry-explorer/urlState.test.ts` with happy path and unsafe/stale param fallback cases.

### Route resolution

`src/registry-explorer/core/itemRoutes.ts` already validates item slugs, namespace shape, template presence, unresolved placeholders, absolute URL parsing, and `http/https` protocols. It prioritizes `rawItemUrl` when present.

Planning implication:

- Reuse this module for detail loader eligibility.
- Do not duplicate URL validation in UI renderers.
- Add tests for detail route resolution and loader result states around unavailable route reasons.

### Existing item summary schema

`RegistryItemSummary` already has most Phase 7 data inputs:

- `name`, `slug`, `title`, `description`, `type`, `category`
- `componentTagsExisting`, `componentTagsProposed`
- `source`, `provenance`, `catalogStatus`, `confidence`
- `routeEligible`, `installToken`, `viewCommand`, `installCommand`, `rawItemUrl`
- `docsUrl`, `previewUrl`, `evidenceUrl`, `evidenceNote`
- `dependencies`, `devDependencies`, `registryDependencies`, `files`, `warnings`

Planning implication:

- Add a detail model that links a summary to fetched item JSON rather than replacing the summary.
- The detail model should keep raw JSON/object internally only. Do not expose a raw JSON UI renderer in the normal item page.
- Computed display fields should be derived in core/view-model functions, not ad hoc in DOM event handlers.

### Existing app shell

`src/registry-explorer/ui/shell.ts` owns state, URL hydration/sync, render routing, profile routing, tab state, search, copy command behavior, queue actions, and back-to-results behavior.

Planning implication:

- Add item view routing in `shell.ts` without introducing a separate routing framework.
- Reuse existing delegated click patterns: `data-copy-command`, `data-profile-registry`, `data-back-to-results`, etc.
- Add an item open action such as `data-view-item-registry` + `data-view-item-slug` or a single token attribute, but planner should choose exact attribute names.
- Keep queue state local; do not persist queued installs in item URLs.

### Rendering safety

`src/registry-explorer/ui/renderSafety.ts` provides `escapeHtml` and safe external link rendering. Existing views consistently use escaping for third-party fields.

Planning implication:

- Item detail renderer must use the same helpers.
- Third-party registry JSON text, titles, descriptions, file paths, dependency strings, warnings, and URLs are untrusted.
- Do not use `innerHTML` with unescaped third-party strings.

## Recommended Design Constraints for Planning

### 1. Treat raw JSON as infrastructure, not UI

Required by user decision. Plans should include loader validation and raw data retention only as implementation details. The normal item page must not include a raw JSON tab/section/card/action.

Acceptable:

- Internal raw object/string stored on a result model for tests or agents.
- Source/raw item URL retained as maintainer metadata.
- Tests that prove bad raw strings are escaped when mapped into user-visible fields.

Not acceptable:

- A “Raw JSON” section in the item page.
- A prominent “Open raw JSON” button as the primary fallback.
- Making users inspect JSON to understand a component.

### 2. Component-first top-of-page layout

The item page should lead with:

1. Component name/title and registry namespace.
2. Visual/preview area or honest placeholder.
3. Short description.
4. Component/item/docs/demo link if available.
5. Copy-only `view` / `add` actions.
6. Status/evaluation details.
7. Dependency/file technical details.

Phase 8 will improve peeks, but Phase 7 should already avoid a data-first page.

### 3. Explicit loader result states

Use a discriminated result shape rather than throwing UI-facing errors. Suggested statuses:

- `loaded`
- `summary-only`
- `route-unavailable`
- `not-found`
- `fetch-error`
- `network-or-cors-blocked` (if detectable; otherwise fold into fetch-error copy)
- `invalid-json`
- `invalid-schema`

Each state should map to a component-first fallback message and action. The fallback should send users to component/docs/demo/source pages when available, not raw JSON.

### 4. Keep commands copy-only

Use existing `installActions.ts` command state where possible. The item detail page can expose copy install and inspect/view command buttons. It must not execute commands in the browser.

### 5. MVP mode: vertical slices

The phase roadmap marks Mode: mvp. Plans should be vertical slices:

- Slice 1: URL route + loader/model + tests.
- Slice 2: item page renderer + actions/fallbacks + tests.

Avoid a purely horizontal plan that creates many model files before any route can render.

## Suggested Plan Breakdown

### Plan 07-01: Item Route State and Detail Loader

Purpose: add the internal routing/data foundation.

Likely files:

- `src/registry-explorer/core/urlState.ts`
- `src/registry-explorer/core/itemRoutes.ts`
- `src/registry-explorer/core/registry.schema.ts`
- new `src/registry-explorer/core/registryItemDetail.ts` or similar
- maybe `src/registry-explorer/data/loadRegistryItemDetail.ts`
- tests under `tests/registry-explorer/`

Must cover:

- ITEM-01
- ITEM-02
- ITEM-06

### Plan 07-02: Component-First Item Page

Purpose: render the item route as a component page, not JSON UI.

Likely files:

- `src/registry-explorer/ui/shell.ts`
- new `src/registry-explorer/ui/itemDetailView.ts`
- `src/registry-explorer/ui/discoveryView.ts`
- `src/registry-explorer/ui/registryProfileView.ts`
- `public/styles/registry-explorer.css`
- tests under `tests/registry-explorer/`

Must cover:

- ITEM-03
- ITEM-04, interpreted through the Phase 7 context: technical details yes, raw JSON not in normal UI
- ITEM-05
- ITEM-06

## Validation Architecture

Verification should include:

1. `pnpm typecheck`
2. `pnpm typecheck:test`
3. `pnpm test`
4. `pnpm validate:data`
5. `pnpm build`
6. Full gate: `pnpm verify`

Focused tests to require in plans:

- URL parsing/serialization supports `view=item&registry=@delta&item=code-block`.
- Invalid/stale item route params fall back safely without crashing.
- Detail loader returns `loaded` for a route-eligible summary with valid registry item JSON.
- Detail loader returns explicit unavailable/error states for missing route, invalid JSON, failed fetch, and invalid schema.
- Item page rendering starts with component identity/visual placeholder and does not render a raw JSON UI section.
- Copy install/view actions remain copy-only and reuse existing command-state semantics.
- Third-party detail strings and links are escaped/safely rendered.

## Planning Warnings

- **UI-SPEC gate:** This phase has clear UI work and the project has `workflow.ui_safety_gate=true`. No `07-UI-SPEC.md` exists yet at research time. The normal plan-phase workflow should stop and request `$gsd-ui-phase 7` unless invoked with `--skip-ui`.
- **Requirement wording conflict:** `ITEM-04` and the roadmap success criteria still mention raw JSON. The newer Phase 7 context explicitly rejects raw JSON in the normal user UI. Planner should not create a raw JSON page section. If requirements are edited later, align them to “technical details from item JSON” rather than “raw JSON display.”
- **Runtime fetch risk:** Fetching third-party item JSON at runtime may fail due network/CORS. This is acceptable if represented through explicit result states and component-first fallback copy.
- **Scope boundary:** Do not implement Phase 8 peek cards, type filters, or alternatives UI in Phase 7.
- **Security boundary:** Do not execute registry component code. Treat registry item JSON as untrusted data.

## Research Complete

Phase 7 is ready for UI-SPEC generation before detailed PLAN.md creation.

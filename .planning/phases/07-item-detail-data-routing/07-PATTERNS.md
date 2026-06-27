# Phase 07: Item Detail Data & Routing - Pattern Map

**Mapped:** 2026-06-27
**Status:** Ready for planning

## Purpose

Extract existing code patterns that Phase 7 plans should reuse. This keeps item detail routing/component-page work aligned with the current static Registry Atlas architecture.

## Files and Closest Analogs

### URL State

- Target: `src/registry-explorer/core/urlState.ts`
- Analog: existing pure parse/serialize flow for `discover`, `focus`, `component`, `matrix`.
- Pattern to reuse: extend union types and serializer rather than adding a separate router.
- Tests: `tests/registry-explorer/urlState.test.ts`.

### Route Resolution

- Target: `src/registry-explorer/core/itemRoutes.ts`
- Analog: `resolveRegistryItemRoute(namespace, registryUrlTemplate, itemSlug, rawItemUrl)`.
- Pattern to reuse: discriminated result with explicit unavailable reasons; URL validation in core, not UI.
- Tests: existing item route assertions in route/action tests.

### Registry Detail/Data Model

- Target: `src/registry-explorer/core/registry.schema.ts`
- Analog: `RegistryItemSummary`, `ComponentCandidate`, `RegistryProfileItemRow`, `InstallActionState`.
- Pattern to reuse: typed interfaces with readonly arrays and explicit status unions.
- New likely artifacts: `RegistryItemDetail`, `RegistryItemDetailResult`, `RegistryItemDetailErrorStatus`, `ItemDetailViewModel`.

### Data Loading/Normalization

- Target: new loader near `src/registry-explorer/data/` or pure normalizer near `src/registry-explorer/core/`.
- Analog: `src/registry-explorer/data/loadRegistries.ts` normalizes generated registry data and snake/camel fields.
- Pattern to reuse: normalize once at data boundary; return explicit fallbacks rather than crashing render.

### Copy-Only Commands

- Target: `src/registry-explorer/core/installActions.ts`, `src/registry-explorer/ui/shell.ts`.
- Analog: existing `data-copy-command`, `copyCommand`, queue add/remove delegation.
- Pattern to reuse: browser only copies `view` and `add`; never executes shell commands.

### Discovery/Profile Card Cleanup

- Target: `src/registry-explorer/ui/discoveryView.ts`, `src/registry-explorer/ui/registryProfileView.ts`, `public/styles/registry-explorer.css`.
- Analog: current result/profile cards, but Phase 7 must reduce density.
- Pattern to preserve: safe escaping, concise chips, existing `.install-actions`, `.secondary-link`, `.link-button` selectors.
- Pattern to change: remove raw route/link clusters from cards; route to item page instead of expanding details inline.

### Item Detail Rendering

- Target: new `src/registry-explorer/ui/itemDetailView.ts` plus `shell.ts` integration.
- Analog: `renderRegistryProfile` accepts a typed profile view model and renders header/body.
- Pattern to reuse: renderer receives prepared data; all third-party strings go through `escapeHtml`; external links through `renderExternalLink`.

### Shell Routing

- Target: `src/registry-explorer/ui/shell.ts`
- Analog: selected registry profile routing and `hydrateStateFromUrl` / `syncUrlState`.
- Pattern to reuse: closure-local `AppState`; `setState()` syncs URL then re-renders; delegated click handlers set state.
- New likely fields: `selectedItemRegistryName`, `selectedItemSlug`, `previousView` or enough state to return via back controls.

### Render Safety

- Target: `src/registry-explorer/ui/renderSafety.ts`
- Analog: `escapeHtml`, `renderExternalLink`.
- Pattern to reuse: no unescaped third-party text in `innerHTML`.
- Tests: `tests/registry-explorer/renderSafety.test.ts` plus UI tests for escaped detail content.

## Cross-Cutting Constraints

- The item page is component-first, not JSON-first.
- Discovery/profile cards are summaries, not detail pages.
- Raw JSON must not appear as a normal user-facing section, tab, card, or primary action.
- Runtime item fetch failures are expected and must map to explicit safe UI states.
- Preserve static app/GitHub Pages compatibility.
- Preserve copy-only command behavior.
- Do not implement Phase 8 peek cards, alternatives, filters, or screenshot automation in Phase 7.

# Phase 8: Component Peek & Alternatives UI - Patterns

**Mapped:** 2026-06-27
**Status:** Complete
**Agent contract:** gsd-pattern-mapper inline pass (no subagent tool exposed in this session)

## Source Map

| Concern | Existing pattern | Files |
|---|---|---|
| App state and routing | `initRegistryExplorer` owns closure-local `AppState`, URL hydration/sync, delegated clicks, copy actions, and render routing. Extend this instead of adding a state library. | `src/registry-explorer/ui/shell.ts` |
| Discovery candidate derivation | Pure functions build `ComponentCandidate` from `Registry.itemSummaries`, taxonomy labels, route eligibility, status display, and copy-only install actions. Add filters before render. | `src/registry-explorer/core/discovery.ts` |
| Registry profile rows | Pure `buildRegistryProfile` maps selected registry and related candidates into profile sections/items. Add profile-compatible filters here or in a shared filter core. | `src/registry-explorer/core/registryProfile.ts` |
| Item detail model | `RegistryItemDetail` already exposes preview/component page URLs, visual status, dependencies, files, taxonomy labels, source context, and safe result statuses. Reuse for item-page related navigation. | `src/registry-explorer/core/registryItemDetail.ts` |
| Rendering safety | Renderers use template strings and must escape text/link inputs through shared helpers. | `src/registry-explorer/ui/renderSafety.ts` |
| Copy-only commands | Install/view actions are buttons with `data-copy-command`, `data-queue-*`, and shell delegation; never execute CLI commands. | `src/registry-explorer/ui/discoveryView.ts`, `src/registry-explorer/ui/registryProfileView.ts`, `src/registry-explorer/ui/itemDetailView.ts`, `src/registry-explorer/ui/shell.ts` |
| UI density | Existing card rows are compact after Phase 7; Phase 8 should add popovers/filters outside rows rather than stuffing row metadata. | `src/registry-explorer/ui/discoveryView.ts`, `src/registry-explorer/ui/registryProfileView.ts`, `public/styles/registry-explorer.css` |

## Implementation Seams

### Shared filter core

Recommended new file: `src/registry-explorer/core/componentFilters.ts`.

Responsibilities:
- Define `ComponentFilterGroup`, `ComponentFilterOption`, and `SelectedComponentFilter` or equivalent typed model.
- Build filter groups from readonly `Registry[]` / `RegistryItemSummary[]` data.
- Include at minimum item `type`, plus category, taxonomy tag/category, visual availability, and catalog/status when present.
- Apply selected filters to `ComponentCandidate[]` and `RegistryProfileItemRow[]` without mutating inputs.
- Return active badge labels and empty-state metadata for renderers.

Tests: `tests/registry-explorer/componentFilters.test.ts`.

### Peek rendering/state seam

Recommended new files:
- `src/registry-explorer/core/componentPeek.ts` for pure state/view-model helpers if needed.
- `src/registry-explorer/ui/componentPeekView.ts` for escaped popover markup.

Responsibilities:
- Model active peek by candidate/profile item route identity, registry namespace, item slug, trigger source, and open reason (`hover`, `focus`).
- Render one compact popover: optional tiny title, preview image/link if trusted URL field exists, otherwise `Preview not available yet` + `Open component page`.
- Exclude dependencies, files, raw JSON/source labels, confidence dumps, full action clusters, and full card clones.
- Shell handles `pointerenter`/`pointerleave` or delegated mouseover/out, `focusin`/`focusout`, `keydown` `Escape`, outside pointer, and click-to-route.

Tests: `tests/registry-explorer/componentPeek.test.ts` and source assertions for forbidden prominent copy.

### Related components seam

Recommended new file: `src/registry-explorer/core/relatedComponents.ts`.

Responsibilities:
- Define `RelatedComponent` and `buildRelatedComponents` or equivalent.
- Score/count only similarity signals: same type, same category, overlapping taxonomy tags/categories, and shared item metadata.
- Exclude the current item and cap visible results for density.
- Surface `matchReasons` such as `Shared type`, `Shared category`, or `Shared tags`; never emit `best`, `better`, `production-grade`, or quality-ranked wording.

UI integration:
- Add a related strip to `itemDetailView.ts` below hero/summary or near evaluation area.
- Related cards use tiny preview/placeholder + name/registry + click-to-item route.

Tests: `tests/registry-explorer/relatedComponents.test.ts`, `tests/registry-explorer/itemDetailView.test.ts` if renderer helpers are exported.

## Existing Noisy Labels To Target

- `discoveryView.ts` currently renders `<span class="confidence-chip">${candidate.confidence} confidence</span>` in each discovery row.
- `registryProfileView.ts` currently renders profile header confidence and item row confidence.
- `itemDetailView.ts` currently renders detail header confidence.

Phase 8 should remove or demote these from compact browsing surfaces per D-19/D-20 and UI-SPEC forbidden prominent copy. If the item detail page keeps any technical confidence/status context, place it in a lower-priority section and avoid `high confidence` / `verified item` wording.

## CSS Seams

Add or adjust classes in `public/styles/registry-explorer.css`:
- `.component-peek-popover`, `.component-peek-title`, `.component-peek-visual`, `.component-peek-placeholder`.
- `.filter-bar`, `.filter-menu`, `.active-filter-list`, `.active-filter`, `.filter-reset`.
- Scroll constraints for `.app-inner > main > aside`, `aside > #aside > .pill-list`, and long picker lists.
- `.related-components`, `.related-component-card`, `.related-preview-placeholder`.

Keep accent use limited to focus outline, active filters, primary component action, and selected related item.

## Verification Hooks

- Plan tasks should run targeted Vitest files plus `pnpm typecheck` after source signatures change.
- Final wave gate: `pnpm verify`.
- Manual smoke is needed for popover placement and long-list scroll behavior.

## PATTERN MAPPING COMPLETE

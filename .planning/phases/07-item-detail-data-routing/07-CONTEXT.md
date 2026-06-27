# Phase 7: Item Detail Data & Routing - Context

**Gathered:** 2026-06-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 7 adds the internal item route and item-detail data foundation for v1.2. It should let users open a route-eligible registry item inside Registry Atlas, load and validate the real registry item JSON behind the scenes, and present a component-first item page with safe fallback states and copy-only shadcn actions.

This phase does **not** build the hover/peek card UI, item type filters, related alternatives UI, dynamic matrix, full registry crawling, or AI-powered swap recommendations. Those remain Phase 8 or later milestones. Phase 7 may prepare data/model seams that Phase 8 will use, but its shipped user surface should stay focused on the item route and component page.

</domain>

<decisions>
## Implementation Decisions

### Component Page, Not JSON Inspector

- **D-01:** The internal item route should feel like a component page, not a registry JSON inspector. When a user opens an item, the page should answer: “What is this component, what does it look like, and can I use it?”
- **D-02:** Loading registry item JSON is still required behind the scenes because agents, maintainers, validation, and typed view models need it. The loaded JSON should power the UI; it should not become the UI.
- **D-03:** The first visible experience should be the component identity and any available visual/preview signal, not raw data or schema fields.

### Detail Content Priority

- **D-04:** The item page should lead with visual/component-first content: component name, visual/preview/screenshot area or placeholder, short description, then use/status/actions.
- **D-05:** Technical detail such as dependencies, registry dependencies, files, targets, and source metadata can appear after the primary component area, but should support evaluation rather than dominate the page.
- **D-06:** The page should preserve the v1.2 product direction: users are browsing/evaluating components from one place so they do not have to open every registry site manually.

### Loading and Fallback States

- **D-07:** If Registry Atlas cannot show the component visual or full item content yet, the fallback should point users to the component/item page or docs/demo/source page, not raw JSON.
- **D-08:** Failure states should be honest and specific, but not feel like a dead end. They can explain preview/item detail availability and then offer the best user-facing next action.
- **D-09:** Invalid JSON, fetch failure, CORS/network blocks, missing item route, and unavailable catalog states should render safe user-facing messages without crashing the app or implying Registry Atlas has audited the component.

### Command and Action Placement

- **D-10:** Split actions by user intent. User-facing component actions should live near the top of the item page, close to the component identity/visual area.
- **D-11:** User-facing actions include copy install, inspect/view command, open component/docs/demo page when available, and any safe item/source link that helps the user see the component.
- **D-12:** Developer/source/maintainer details should be lower priority. Do not let raw/developer affordances crowd the main component browsing path.

### Raw JSON Policy

- **D-13:** Do not show raw JSON in the normal user UI. The user explicitly does not want JSON taking up space or cluttering the interface.
- **D-14:** Raw JSON is for agents, maintainers, validation, tests, internal loading, and debugging paths. It should not be a normal item-page section, tab, or prominent action.
- **D-15:** The planner may preserve a raw item/source URL internally or in maintainable metadata, but the user-facing item route should not require users to read or click around JSON to understand the component.

### the agent's Discretion

- Choose whether the item route is implemented as a full main-content page, route-specific content area, or other static-app-compatible pattern, as long as it feels like a component page and supports URL state/back navigation cleanly.
- Choose the exact typed `RegistryItemDetail` shape and loader file split, as long as route/error states are explicit, testable, and do not leak unsafe third-party content into the DOM.
- Choose the exact visual placeholder copy and metadata ordering, as long as visual/component identity remains first and raw JSON remains out of the normal user UI.
- Choose how much of the item detail model is prepared for Phase 8 peek cards, while avoiding Phase 8 UI scope creep.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 7 Planning Scope

- `.planning/ROADMAP.md` — Phase 7 goal, success criteria, phase dependency, canonical refs, and Phase 8 boundary.
- `.planning/REQUIREMENTS.md` — ITEM-01 through ITEM-06 requirements for route state, typed item detail loading, detail content, copy-only commands, and safe failure states.
- `.planning/PROJECT.md` — v1.2 milestone goal, component peek/product direction, constraints, and key decisions about non-embed-first previews and alternatives groundwork.
- `.planning/STATE.md` — Current milestone/phase state and resume pointer.

### v1.2 Research

- `.planning/research/SUMMARY.md` — v1.2 research synthesis covering component peeks, item routes, visual fallback model, static app constraints, and recommendation to keep raw data secondary.
- `.planning/research/ARCHITECTURE.md` — Recommended route/state layer, detail loader, detail model, failure states, and integration points.
- `.planning/research/FEATURES.md` — User-language feature expectations for visual peeks, item route behavior, visual fallback, item detail content, and alternatives foundation.
- `.planning/research/PITFALLS.md` — Risks to avoid: embed-first previews, executing third-party code, hover-only UX, preview overclaiming, CORS crashes, fake ranking, and raw-data leakage.

### Imported Improvement Bundle

- `registry-altas-improvement-phase/gpt-agent-outputs/(original-seed-idea)registry-atlas-continued-improvements.md` — Original product note that the app skeleton exists but actual component/item viewing is shallow.
- `registry-altas-improvement-phase/gpt-agent-outputs/registry-catalog.normalized.json` — Source data with raw item URLs, commands, route eligibility, dependencies, files, and item metadata for `@delego`, `@delta`, and `@diceui`.
- `registry-altas-improvement-phase/gpt-agent-outputs/update-plan.md` — Earlier plan items for item detail fields, view commands, route resolution, UI metadata, validation, and tests.

### Prior Phase Decisions

- `.planning/phases/06-component-search-and-taxonomy/06-CONTEXT.md` — Taxonomy/search/status decisions, including status wording and deferring item-detail viewer to v1.2.
- `.planning/phases/05-expanded-component-catalog/05-CONTEXT.md` — Catalog-backed item scope, route eligibility, rich item summary metadata, and copy-only behavior.
- `.planning/phases/04-install-actions-release-hardening/04-CONTEXT.md` — Copy-only shadcn command behavior, route-eligible action rules, URL state boundaries, and release/accessibility baseline.

### Code and Codebase Maps

- `.planning/codebase/ARCHITECTURE.md` — Static SPA architecture, UI shell/state boundary, pure core logic, renderers, data flow, and anti-patterns.
- `.planning/codebase/STACK.md` — Static Vite/vanilla TypeScript stack, GitHub Pages deployment model, and no backend/runtime service baseline.
- `.planning/codebase/INTEGRATIONS.md` — Current lack of runtime external API calls and outbound-link-only integration model.
- `src/registry-explorer/core/urlState.ts` — Existing shareable URL state parser/serializer to extend for `view=item`, `registry`, and `item` route state.
- `src/registry-explorer/core/itemRoutes.ts` — Existing registry item route resolution logic to reuse for detail loading eligibility and raw/source URL resolution.
- `src/registry-explorer/core/registry.schema.ts` — Types for registries, item summaries, candidates, commands, and future `RegistryItemDetail` additions.
- `src/registry-explorer/core/installActions.ts` — Existing pure copy-only `add` / `view` command eligibility and command-state logic.
- `src/registry-explorer/data/loadRegistries.ts` — Runtime generated data loader boundary and item summary normalization.
- `src/registry-explorer/ui/shell.ts` — App state, URL state hydration/sync, event delegation, and render routing integration point.
- `src/registry-explorer/ui/discoveryView.ts` — Discovery rows where item page entry actions may originate later.
- `src/registry-explorer/ui/registryProfileView.ts` — Registry profile item rows where item page entry actions may originate later.
- `src/registry-explorer/ui/renderSafety.ts` — Escaping and safe external link helpers for all third-party item data.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `src/registry-explorer/core/urlState.ts` already parses and serializes `view`, search, registry, candidate, focus, and component URL parameters. Phase 7 should extend this rather than invent a separate router.
- `src/registry-explorer/core/itemRoutes.ts` already resolves route-eligible item URLs from registry templates or `rawItemUrl` values.
- `src/registry-explorer/core/installActions.ts` already gates copy-only `add` and `view` commands on namespace, slug, route eligibility, and valid route source.
- `src/registry-explorer/data/loadRegistries.ts` already maps generated snake_case/camelCase item summary fields, including `routeEligible`, `viewCommand`, `installCommand`, and `rawItemUrl`.
- `src/registry-explorer/core/discovery.ts` and `src/registry-explorer/core/registryProfile.ts` already derive item metadata, status labels, dependency counts, registry dependency counts, file counts, raw item URLs, and action state for route-eligible item summaries.
- `src/registry-explorer/ui/renderSafety.ts` provides `escapeHtml` and `renderExternalLink`; every item detail string/link should continue using these safe rendering helpers.

### Established Patterns

- Keep route parsing, detail loading, validation, status derivation, command generation, and view-model building in pure/testable core or data modules.
- Keep DOM rendering in `src/registry-explorer/ui/*` renderers; renderers should receive prepared view models and avoid business logic.
- Preserve closure-local shell state in `src/registry-explorer/ui/shell.ts`; do not add a global state library.
- Preserve static GitHub Pages compatibility. Runtime fetches may be attempted for public JSON routes, but failures must be first-class UI states.
- Treat all third-party registry data as untrusted. Escape text, validate URLs, and do not execute registry code.
- Preserve copy-only shadcn behavior. The browser may copy `view` / `add` commands but never execute them.

### Integration Points

- Extend `RegistryExplorerUrlState` and tests in `tests/registry-explorer/urlState.test.ts` for `view=item`, `registry`, and `item` behavior.
- Add a detail loader/model near `src/registry-explorer/core/` or `src/registry-explorer/data/` depending on whether it fetches directly or normalizes loader results.
- Add item detail rendering through `src/registry-explorer/ui/shell.ts` with a new renderer module if needed.
- Reuse existing action/copy delegation in `shell.ts` for item detail buttons.
- Add tests near existing `registryLoader`, `itemRoutes`, `installActions`, `registryProfile`, and render-safety tests.

</code_context>

<specifics>
## Specific Ideas

- The user clarified that “inspect it” means seeing the component/item, not seeing JSON.
- The user explicitly rejected raw JSON in the user interface: “JSON is for agents and shit. I don't need to see that.”
- The user emphasized that raw JSON would take up space, clutter the interface, and add noise that does not help component browsing.
- The item route should prioritize component identity, visual/preview area, short description, component/item link, and user-facing actions.
- If Atlas cannot show the component visual or content yet, fallback should guide the user to the component/item page or docs/demo/source page, not to registry JSON.

</specifics>

<deferred>
## Deferred Ideas

- Hover/focus/tap component peek cards are Phase 8.
- Related/similar alternatives and item type filters are Phase 8.
- Dynamic matrix columns, tag picker, and matrix presets remain v1.3.
- Systematic registry crawling, broader catalog hydration, browser/manual research automation, and screenshot capture pipelines remain v1.4 or later.
- Evidence-backed “better component swap” recommendations remain a future recommendation milestone after visual/detail foundations exist.

</deferred>

---

*Phase: 7-Item Detail Data & Routing*
*Context gathered: 2026-06-27*

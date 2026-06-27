# Phase 8: Component Peek & Alternatives UI - Context

**Gathered:** 2026-06-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 8 turns the Phase 7 item route/detail foundation into faster component browsing. It should add lightweight visual peeks from discovery/profile/item surfaces, an extensible filter picker driven by loaded item metadata, concise route/sidebar cleanup, and a small related-component navigation seam that prepares future production-pattern upgrades.

This phase does **not** execute third-party component code, build iframe-first previews, claim Registry Atlas has audited components, implement evidence-backed ranking, or redesign the dynamic matrix. It may prepare metadata seams for future recommendation and matrix work, but Phase 8 must stay focused on quick component viewing, minimal visual peeks, metadata-driven filters, and safe related/similar browsing.

</domain>

<decisions>
## Implementation Decisions

### Peek Interaction Shape

- **D-01:** Route-eligible items should expose a quick peek that opens on hover and keyboard focus, while click/tap opens the stable Phase 7 item page.
- **D-02:** The peek should be a small anchored popover near the triggering card/action. Avoid side panels or inline card expansion that would crowd the existing layout.
- **D-03:** Peeks should dismiss naturally: mouse leave, blur, `Esc`, or outside click/tap. Do not require an explicit close button as the only dismissal path.
- **D-04:** Click/tap from the peek or trigger should route to the existing item page rather than pinning the peek first or sending users directly to an external docs page.
- **D-05:** Peek behavior must not be hover-only. Keyboard focus and click/tap paths are first-class requirements.

### Peek Content and Fallback

- **D-06:** The peek is visual-first. Ideally it shows only the component visual, screenshot, thumbnail, or preview area.
- **D-07:** At most, the peek may show a tiny title/name above the visual. Do not recreate the item card inside the peek.
- **D-08:** Avoid metadata in the peek when a visual exists. Metadata, details, files, dependencies, actions, and source context belong on the item page or compact surrounding UI, not inside the quick visual peek.
- **D-09:** When no screenshot or preview image exists, show a minimal preview placeholder with wording such as `Preview not available yet` and a clear `Open component page` path.
- **D-10:** Placeholder peeks should stay minimal. Do not add long explanations, status dumps, JSON/source wording, or dense metadata just because the visual is missing.

### Extensible Filters and Route/Sidebar Cleanup

- **D-11:** Filters should pull dynamically from loaded item summaries, not from a tiny hardcoded UI list. The source path is `public/data/registries.json` loaded by `src/registry-explorer/data/loadRegistries.ts`, normalized into `Registry.itemSummaries`, and then used by discovery/profile/item view models.
- **D-12:** The first implementation should use an extensible `+ Filter` picker / command-menu style selector. Selecting a filter adds a removable active badge/tag; users need an obvious reset path.
- **D-13:** Phase 8 must at least satisfy item-type filtering, but the filter system should be shaped so other available metadata dimensions can be added without a redesign.
- **D-14:** Useful filter values include item type, category, tags, visual availability, catalog/status, and other fields already present in item summaries. If a value exists in current data and is useful for component browsing, it should be eligible for the picker.
- **D-15:** Do not show one route with rich filter options and another route with none when the same metadata exists. Discovery, profile, component, and relevant sidebar/route surfaces should use a consistent filter vocabulary and behavior where applicable.
- **D-16:** Existing route/sidebar groupings are too broad and inconsistent. Expand beyond a handful of broad buckets where current data supports it, especially for component/category/tag selectors.
- **D-17:** Long selector/pill-list areas must become scrollable once they exceed a reasonable height. They should not stretch the page or bury primary content.
- **D-18:** The selectors called out during discussion are important cleanup targets: `.app-inner > main > aside`, `aside > #aside > .pill-list`, and `.app-inner > main > .content`.

### Labels, Badges, and Noise Reduction

- **D-19:** Remove or strongly demote noisy labels such as `verified item` and `high confidence`. The user called this status/confidence wording distracting and not useful for the core browsing goal.
- **D-20:** The primary goal is quick component viewing. Cards and sidebars should not be dominated by confidence/status/evaluation noise.
- **D-21:** Keep useful actions and links: `View component`, profile/detail access, Docs, and Registry homepage are acceptable when they do not crowd the surface.
- **D-22:** A few badges/details can remain where they clarify the component, but badges in “registries by component” and other cramped rows need a better overflow/disclosure pattern or should be removed from that area.
- **D-23:** Do not solve overflow by expanding every badge inline. Either show a minimal label set, add controlled disclosure, or move detail into the item page/filter picker.

### Related Components and Future Upgrade Paths

- **D-24:** Related/similar components should appear as a small strip or navigator on item/peek detail surfaces, not as alternatives inside every discovery card.
- **D-25:** Alternatives should support component-to-component browsing: click a component, see related alternatives, click an alternative, then continue browsing from that item.
- **D-26:** The related strip should be minimal and visual when possible: tiny visual/placeholder plus component name/registry is enough. Avoid full metadata cards.
- **D-27:** Phase 8 relatedness should be based on shared type, category, tags, and available item metadata. It should not claim quality ranking.
- **D-28:** The long-term product concept is production pattern upgrades: helping users move from generic/generated UI patterns toward more complete, intentional, production-ready component patterns.
- **D-29:** Phase 8 should preserve metadata seams for future evidence-backed upgrade recommendations, but the visible Phase 8 UI should use safer wording such as `Similar patterns` or `Related components` until Registry Atlas has enough evidence/signals.
- **D-30:** Do not use `better`, `best`, `correct`, `polished`, `production-grade`, or similar claims in Phase 8 user-facing labels unless the implementation adds real evidence to justify them.

### the agent's Discretion

- Choose the exact DOM/event implementation for hover/focus/click/tap peeks, as long as it remains accessible, static-SPA compatible, and does not introduce a UI framework.
- Choose whether the initial filter picker is a custom popover/menu or an existing simple DOM pattern, as long as it is extensible, removable-badge based, and tested.
- Choose the exact safe visible label for related browsing: `Similar patterns`, `Related components`, or another non-ranking phrase that does not overclaim.
- Choose which existing metadata dimensions to expose in Phase 8 beyond item type when low-risk, but do not turn this into a full matrix/search-redesign phase.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 8 Scope and Requirements

- `.planning/ROADMAP.md` — Phase 8 goal, success criteria, dependency on Phase 7, canonical refs, and cross-cutting constraints.
- `.planning/REQUIREMENTS.md` — PEEK-01 through PEEK-04, FILT-01, EVAL-01/EVAL-02, and ALT-01 through ALT-03.
- `.planning/PROJECT.md` — v1.2 product direction, static app/security constraints, peek-first direction, and long-term alternatives/product-upgrade direction.
- `.planning/STATE.md` — Current milestone state and resume pointer.

### v1.2 Research

- `.planning/research/SUMMARY.md` — Research synthesis for component peeks, visual fallback model, item route/detail foundation, type filters, and related/similar alternatives.
- `.planning/research/FEATURES.md` — User-language feature expectations for peeks, visual source fallback, item type filters, and alternatives foundation.
- `.planning/research/PITFALLS.md` — Risks to avoid: iframe/embed-first peeks, third-party code execution, hover-only UX, preview overclaiming, fake ranking, scope creep into matrix/research automation.

### Phase 7 Foundation and Decisions

- `.planning/phases/07-item-detail-data-routing/07-CONTEXT.md` — Locked decisions: component page not JSON inspector, compact cards, raw JSON out of normal UI, visual/component-first content.
- `.planning/phases/07-item-detail-data-routing/07-UI-SPEC.md` — Card density rules, raw route label removal, visual placeholder direction, and UI constraints Phase 8 must preserve.
- `.planning/phases/07-item-detail-data-routing/07-01-route-detail-loader-SUMMARY.md` — Item route URL state, detail model/loader, explicit safe result states.
- `.planning/phases/07-item-detail-data-routing/07-02-component-page-card-cleanup-SUMMARY.md` — Component-first item page, discovery/profile card cleanup, copy-only action behavior.
- `.planning/phases/07-item-detail-data-routing/07-VERIFICATION.md` — Verification evidence that Phase 7 behavior and no-raw-JSON UI passed.
- `.planning/phases/07-item-detail-data-routing/07-SECURITY.md` — Security verification for untrusted registry data, escaped rendering, safe links, copy-only commands, and raw JSON exclusion.

### Codebase Maps

- `.planning/codebase/CONVENTIONS.md` — TypeScript/rendering conventions, escaping expectations, pure-core/testable logic patterns.
- `.planning/codebase/STRUCTURE.md` — Where to add new core transformations, UI renderers, shell state/event handling, styles, and tests.
- `.planning/codebase/STACK.md` — Static Vite/vanilla TypeScript SPA constraints, no runtime backend baseline, strict TypeScript/build expectations.

### Data and Core Sources

- `src/registry-explorer/data/loadRegistries.ts` — Loads `public/data/registries.json` and maps `atlas.item_summaries` into `Registry.itemSummaries`; filter options should derive from this loaded data.
- `src/registry-explorer/core/registry.schema.ts` — Registry, item summary, candidate, profile row, action, and item metadata types.
- `src/registry-explorer/core/componentTaxonomy.ts` — Existing taxonomy/category/tag label source for component grouping and relatedness.
- `src/registry-explorer/core/discovery.ts` — Discovery candidate derivation, item type/category/tag/status/count metadata, and likely filter integration point.
- `src/registry-explorer/core/registryProfile.ts` — Registry profile item row derivation and likely profile-filter integration point.
- `src/registry-explorer/core/registryItemDetail.ts` — Item detail model with preview URL, component page URL, visual status, taxonomy labels, dependencies, files, and safe result statuses.

### UI Integration Points

- `src/registry-explorer/ui/shell.ts` — App state, URL sync, delegated click/copy events, item route rendering, and likely peek/filter event orchestration point.
- `src/registry-explorer/ui/discoveryView.ts` — Discovery rows where peek triggers, view-component actions, filter bar, and compact row cleanup may originate.
- `src/registry-explorer/ui/registryProfileView.ts` — Registry profile item rows where peek triggers, filter behavior, and badge overflow cleanup may originate.
- `src/registry-explorer/ui/itemDetailView.ts` — Component-first item detail surface where related/similar navigator and visual fallback behavior can appear.
- `src/registry-explorer/ui/renderSafety.ts` — Escaping and safe external link helpers; all third-party strings/links in peeks and related strips must continue using this.
- `public/styles/registry-explorer.css` — Existing dark Atlas CSS, item detail selectors, pill lists, card layout, and responsive behavior to extend.

### User-Referenced Selectors

- `.app-inner > main > aside` — Existing aside/sidebar surface that needs scrollable, less noisy, more complete selector behavior.
- `aside > #aside > .pill-list` — Current pill-list pattern that should not become an unbounded wall of broad/incomplete badges.
- `.app-inner > main > .content` — Main content surface where peek/filter/related behavior must not crowd component browsing.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `loadRegistries.ts` already maps generated registry data into typed `Registry.itemSummaries`; Phase 8 filters should derive options from these loaded summaries instead of hardcoded UI constants.
- `registryItemDetail.ts` already derives `previewUrl`, `componentPageUrl`, `visualStatus`, taxonomy labels, dependencies, registry dependencies, files, and result status. Peeks and related strips can reuse this model where appropriate.
- `discovery.ts` and `registryProfile.ts` already expose item type, category, taxonomy labels, dependency count, registry dependency count, file count, catalog status, confidence, route eligibility, and install action state.
- `discoveryView.ts` and `registryProfileView.ts` already render compact `View component` entry points and can host peek triggers without reintroducing raw route labels.
- `itemDetailView.ts` already contains the visual placeholder language and component-first item page structure that Phase 8 can reuse or refine.
- `renderSafety.ts` provides `escapeHtml` and `renderExternalLink`; peeks, filters, and related strips must keep using these helpers for untrusted registry data.
- `shell.ts` already has delegated event handling for item view, back navigation, copy-only commands, queue behavior, and URL state; Phase 8 should extend this rather than add a global state library.

### Established Patterns

- Keep metadata derivation, filter option generation, and relatedness calculations in pure core modules with tests.
- Keep DOM rendering in `src/registry-explorer/ui/*` renderers that receive prepared view models.
- Preserve static GitHub Pages compatibility and avoid backend/runtime preview services in Phase 8.
- Treat third-party registry strings and links as untrusted. Escape all text, normalize/safely render external links, and never execute component code.
- Use copy-only behavior for shadcn commands and existing shell copy delegation.
- Use `pnpm verify` as the final release gate.

### Integration Points

- Add a pure filter model near `src/registry-explorer/core/` that can build available filter groups from current results/item summaries and apply selected filters.
- Add UI state in `shell.ts` for active filters and active peek, while keeping URL/state scope deliberate. Planner should decide whether filters belong in shareable URL state or local UI state.
- Add peek rendering in a new UI module or alongside discovery/profile renderers, with event hooks for hover/focus/click/tap and `Esc`/outside dismiss.
- Add related/similar component derivation in core using type/category/tag/metadata overlap, then render it on item/detail or peek-adjacent surfaces.
- Extend CSS for anchored peek popovers, scrollable pill/filter areas, active filter badges, and related component strips without adding a new UI framework.
- Add tests for filter option derivation, selected-filter application, relatedness derivation, safe rendering, no noisy labels, and no raw JSON/raw route regressions.

</code_context>

<specifics>
## Specific Ideas

- The peek should be the view. The user wants the component visual itself, preferably with no metadata and at most a tiny title/name above it.
- If no visual exists, the fallback should be minimal: `Preview not available yet` and `Open component page`.
- The user rejected recreating a detail card inside the peek; that would bring back the overcrowding problem Phase 7 just fixed.
- Filters should feel extensible: click `+ Filter`, choose a value, and see a removable active badge/tag.
- Filter values should come from loaded item metadata, including broad and specific categories/tags where available. The user specifically called out that current groupings are too broad and show only a handful in some places.
- Long sidebars/pill lists need scrolling once they grow; they should not stretch the whole layout.
- The user called the current `verified item` / `high confidence` style labels garbage/noise. Remove or demote them in favor of quick component browsing.
- Docs and registry homepage links are useful. Profile/details and view component actions are useful when they do not distract.
- Registries-by-component badge displays need an overflow/disclosure rethink. Do not simply expand all badges inline.
- Related browsing should become an alternative navigator: click a component, see its related components, then click through to continue browsing.
- Long-term product direction: production pattern upgrades. Registry Atlas should eventually help users replace generic/generated UI patterns with more complete, intentional component patterns based on evidence.

</specifics>

<deferred>
## Deferred Ideas

- Interactive matrix redesign with complete dynamic component/tag coverage belongs to v1.3 Dynamic Coverage Matrix unless Phase 8 planning identifies a small preparatory cleanup that does not expand scope.
- Evidence-backed production pattern upgrades / upgrade paths for replacing generic AI-generated UI belong to a future recommendation milestone after Registry Atlas has enough examples and signals.
- Automated screenshot capture pipelines remain v1.4 or later unless static/generated visual data already exists and can be consumed safely in Phase 8.
- Quality-ranked “better/best/correct” recommendations remain deferred until Registry Atlas has real ranking evidence.

</deferred>

---

*Phase: 8-Component Peek & Alternatives UI*
*Context gathered: 2026-06-27*

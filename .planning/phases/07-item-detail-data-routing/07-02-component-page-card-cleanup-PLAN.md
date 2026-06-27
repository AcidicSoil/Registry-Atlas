---
phase: 07-item-detail-data-routing
plan: 07-02-component-page-card-cleanup
type: implementation
wave: 2
depends_on: [07-01-route-detail-loader]
files_modified:
  - src/registry-explorer/ui/shell.ts
  - src/registry-explorer/ui/itemDetailView.ts
  - src/registry-explorer/ui/discoveryView.ts
  - src/registry-explorer/ui/registryProfileView.ts
  - src/registry-explorer/ui/renderSafety.ts
  - public/styles/registry-explorer.css
  - tests/registry-explorer/itemDetailView.test.ts
  - tests/registry-explorer/discovery.test.ts
  - tests/registry-explorer/registryProfile.test.ts
  - tests/registry-explorer/renderSafety.test.ts
autonomous: true
requirements: [ITEM-03, ITEM-04, ITEM-05, ITEM-06]
must_haves:
  truths:
    - "ITEM-03: Item page shows overview data including title, description, registry namespace, item slug, type, category, taxonomy labels, visual status, and catalog status."
    - "ITEM-04: Technical details from item JSON are available as component-evaluation details, but raw JSON is not shown in the normal UI because CONTEXT D-16 supersedes the older raw JSON wording."
    - "ITEM-05: Item detail surface provides copy-only shadcn `view` and `add` commands without executing either command."
    - "ITEM-06: Safe failure states render for unavailable route, failed fetch, invalid JSON/schema, blocked loading, and missing catalogs."
    - "D-04: The item page leads with visual/component-first content."
    - "D-07: Discovery/profile cards are compact summaries, not crowded detail pages."
    - "D-08: Technical/source/detail content moves out of cards and into the item page."
    - "D-09: `Open raw item route` is removed from normal card action clusters."
    - "D-16: Raw JSON does not appear in the normal user UI."
---

<objective>
Render the internal item route as a component-first page and de-clutter existing discovery/profile cards so cards become compact summaries that route users into the item page for detail.

Decision coverage: D-03, D-04, D-05, D-06, D-07, D-08, D-09, D-10, D-13, D-14, D-15, D-16, D-17, D-18.
</objective>

<must_haves>
- The item route must feel like a component page, not a JSON inspector.
- Existing discovery/profile cards must stop showing raw route labels and crowded metadata/link clusters.
- Component/action language must use `View component`, `Open component`, or `Open component page`, not `Open raw item route` in normal UI.
- Raw JSON must not appear as a normal section, tab, card, primary action, or result-card link.
- Copy/install/view actions remain copy-only and reuse existing shell copy feedback behavior.
- Every third-party string must be escaped; every external link must be rendered safely.
</must_haves>

<threat_model>
- Assets: component browsing clarity, user trust, safe rendering, copy-only action boundary, and non-cluttered UI.
- Threats: detail page still looking like raw data; result cards remaining unreadable at narrow widths; raw route/source links crowding primary action areas; unsafe imported strings rendered into item detail HTML; UI implying Registry Atlas audited third-party code; copy buttons executing commands instead of copying.
- Controls: UI-SPEC density limits, dedicated item detail page, card action cleanup, `escapeHtml`, `renderExternalLink`, existing copy-button delegation, render-safety tests, and full `pnpm verify`.
- High severity gate: if normal user UI contains a visible raw JSON section/tab/card/primary action or a card still contains `Open raw item route`, stop and fix before continuing.
</threat_model>

<tasks>
<task id="T1" title="Wire item view into shell state and navigation">
  <read_first>
    - src/registry-explorer/ui/shell.ts
    - src/registry-explorer/core/urlState.ts
    - src/registry-explorer/core/registry.schema.ts
    - src/registry-explorer/core/registryItemDetail.ts
    - src/registry-explorer/data/loadRegistryItemDetail.ts
    - .planning/phases/07-item-detail-data-routing/07-UI-SPEC.md
  </read_first>
  <action>
    Extend `AppState` in `shell.ts` to support item route state using `currentView: 'item'`, selected registry namespace, and selected item slug. Update hydration to accept `view=item&registry=@delta&item=code-block` only when the registry exists and the item slug can be resolved or safely represented as unavailable. Update `syncUrlState` so item view serializes `view=item`, `registry`, and `item`. Add delegated click handling for item-card entry controls such as `data-view-item-registry` and `data-view-item-slug`. Add a back control that returns users to discovery/profile context when possible and never clears the install queue.
  </action>
  <verify>
    Run `pnpm test -- tests/registry-explorer/urlState.test.ts tests/registry-explorer/itemDetailView.test.ts` and `pnpm typecheck`.
  </verify>
  <acceptance_criteria>
    - Direct URL `?view=item&registry=@delta&item=code-block` renders the item route path rather than discover/focus/component/matrix.
    - Clicking a `View component`/`Open component` control from discovery or profile sets item view state.
    - Back control returns out of item view without clearing local install queue state.
    - Invalid registry/item params render a safe item unavailable state or fall back safely without throwing.
  </acceptance_criteria>
</task>

<task id="T2" title="Render component-first item detail page">
  <read_first>
    - src/registry-explorer/ui/itemDetailView.ts
    - src/registry-explorer/ui/renderSafety.ts
    - src/registry-explorer/ui/registryProfileView.ts
    - src/registry-explorer/ui/discoveryView.ts
    - src/registry-explorer/core/registry.schema.ts
    - public/styles/registry-explorer.css
    - .planning/phases/07-item-detail-data-routing/07-UI-SPEC.md
  </read_first>
  <action>
    Create `src/registry-explorer/ui/itemDetailView.ts` with a renderer that receives `RegistryItemDetailResult` or an item-detail view model and writes header/body HTML. The top of the page must show back control, component/item title, registry namespace, status/confidence chips, visual/preview panel or placeholder, short description, and primary user actions. The visual placeholder copy must include `Preview not available in Atlas yet` and prefer `Open component page` when a docs/demo/preview URL exists. Render dependency/dev dependency/registry dependency/file details in compact lower cards. Do not render raw JSON as a section, tab, card, code block, or primary action.
  </action>
  <verify>
    Run `pnpm test -- tests/registry-explorer/itemDetailView.test.ts tests/registry-explorer/renderSafety.test.ts` and `pnpm typecheck`.
  </verify>
  <acceptance_criteria>
    - Item detail header contains component/item name, registry namespace, catalog/status label, and confidence when available.
    - Visual area exists even when no screenshot/preview is available.
    - Empty visual state uses `Preview not available in Atlas yet`.
    - User-facing fallback action says `Open component page` when docs/demo/preview URL exists.
    - Dependency, dev dependency, registry dependency, and file details render below primary component/action content.
    - Rendered normal UI output does not contain `Raw JSON`, `Registry JSON`, or `Open raw item route`.
    - Imported title/description/dependency/file strings are escaped.
  </acceptance_criteria>
</task>

<task id="T3" title="De-clutter discovery and registry profile cards">
  <read_first>
    - src/registry-explorer/ui/discoveryView.ts
    - src/registry-explorer/ui/registryProfileView.ts
    - src/registry-explorer/core/discovery.ts
    - src/registry-explorer/core/registryProfile.ts
    - src/registry-explorer/ui/renderSafety.ts
    - public/styles/registry-explorer.css
    - .planning/phases/07-item-detail-data-routing/07-UI-SPEC.md
    - tests/registry-explorer/discovery.test.ts
    - tests/registry-explorer/registryProfile.test.ts
  </read_first>
  <action>
    Refactor discovery result cards and registry profile item rows into compact summaries. Remove normal-card `Open raw item route` links and crowded secondary link clusters. Replace route entry labels with `View component` or `Open component` for internal item routes. Keep at most two visible metadata rows before the action row: one concise status/type/taxonomy chip row and one short description/reason row. Move long description, source/provenance/evidence links, full dependency/file detail, and raw/source route wording to the item detail page or lower-priority detail areas. Preserve copy-only install/inspect actions only where they fit without crowding; otherwise make `View component` the clear card action.
  </action>
  <verify>
    Run `pnpm test -- tests/registry-explorer/discovery.test.ts tests/registry-explorer/registryProfile.test.ts tests/registry-explorer/renderSafety.test.ts` and `pnpm typecheck`.
  </verify>
  <acceptance_criteria>
    - Discovery result cards use `View component` or `Open component` for item route entry.
    - Registry profile item rows use `View component` or `Open component` for item route entry.
    - Discovery/profile card HTML no longer contains the visible text `Open raw item route`.
    - Discovery/profile cards do not render more than two source/docs/evidence-style secondary links in a single visible link cluster.
    - Long technical data is not rendered inline in result/profile cards when an item route is available.
    - Existing install queue behavior still works for route-eligible items.
  </acceptance_criteria>
</task>

<task id="T4" title="Render explicit safe fallback states">
  <read_first>
    - src/registry-explorer/ui/itemDetailView.ts
    - src/registry-explorer/core/registryItemDetail.ts
    - src/registry-explorer/ui/renderSafety.ts
    - public/styles/registry-explorer.css
    - tests/registry-explorer/itemDetailView.test.ts
    - .planning/phases/07-item-detail-data-routing/07-CONTEXT.md
  </read_first>
  <action>
    Map every `RegistryItemDetailResult` non-loaded status to a safe item-page state. Use component-first copy: `Component details unavailable`, `Atlas could not load this item yet. Open the component page or registry source to inspect it outside Atlas.`, `Atlas could not load this item from the registry. You can still open the component page or inspect the source outside Atlas.`, and `Atlas could not read this registry item safely. The component page may still be available from the registry.` Avoid developer-only terms such as `CORS`, `schema`, and `JSON` in prominent user-facing copy unless displayed as low-priority diagnostics. Prefer component/docs/demo/source page links over raw JSON links.
  </action>
  <verify>
    Run `pnpm test -- tests/registry-explorer/itemDetailView.test.ts tests/registry-explorer/renderSafety.test.ts`.
  </verify>
  <acceptance_criteria>
    - `route-unavailable`, `not-found`, `fetch-error`, `invalid-json`, and `invalid-schema` all render safe fallback states.
    - Fallback states do not throw when registry/item/details are missing.
    - Primary fallback action is `Open component page` when component/docs/demo URL exists.
    - Fallback UI does not expose raw JSON as the primary path.
  </acceptance_criteria>
</task>

<task id="T5" title="Style item page and compact cards within existing Atlas CSS">
  <read_first>
    - public/styles/registry-explorer.css
    - src/registry-explorer/ui/itemDetailView.ts
    - src/registry-explorer/ui/discoveryView.ts
    - src/registry-explorer/ui/registryProfileView.ts
    - .planning/phases/07-item-detail-data-routing/07-UI-SPEC.md
  </read_first>
  <action>
    Add minimal CSS selectors for `.item-detail-page`, `.item-detail-hero`, `.item-preview-panel`, `.item-preview-placeholder`, `.item-action-row`, `.item-detail-cards`, `.item-detail-card`, `.item-dependency-list`, and `.item-file-list` or equivalent names chosen during implementation. Use existing variables: `--bg`, `--bg-elevated`, `--bg-soft`, `--bg-softer`, `--accent`, `--accent-secondary`, `--text-main`, `--text-muted`, `--text-softer`, `--radius-lg`, `--radius-md`, and existing button/chip styles. Keep cards readable at narrow widths: no crowded horizontal link clusters, no sticky sidebar, no raw/debug/source wording in primary card areas.
  </action>
  <verify>
    Run `pnpm build` and `pnpm test -- tests/registry-explorer/itemDetailView.test.ts tests/registry-explorer/discovery.test.ts tests/registry-explorer/registryProfile.test.ts`.
  </verify>
  <acceptance_criteria>
    - Item page uses existing dark Atlas visual system and CSS variables.
    - Result/profile cards remain readable at narrow widths by design: compact metadata, concise actions, and no long secondary link row.
    - No new UI framework, icon library, or component dependency is added to `package.json`.
    - Production build exits 0.
  </acceptance_criteria>
</task>

<task id="T6" title="Run full verification and document user-facing behavior if needed">
  <read_first>
    - README.md
    - package.json
    - .planning/phases/07-item-detail-data-routing/07-CONTEXT.md
    - .planning/phases/07-item-detail-data-routing/07-UI-SPEC.md
    - .planning/phases/07-item-detail-data-routing/07-RESEARCH.md
  </read_first>
  <action>
    Add concise documentation only if needed to explain the item route, copy-only command boundary, component-first fallback behavior, and non-endorsement policy. Do not document raw JSON as a user-facing item-page feature. Run the full verification suite.
  </action>
  <verify>
    Run `pnpm verify`.
  </verify>
  <acceptance_criteria>
    - `pnpm verify` exits 0.
    - Any docs added describe component-first item pages and copy-only actions.
    - Docs do not claim Registry Atlas audits or endorses third-party registry code.
    - Docs do not instruct normal users to inspect raw JSON to evaluate a component.
  </acceptance_criteria>
</task>
</tasks>

<verification>
- `pnpm typecheck`
- `pnpm typecheck:test`
- `pnpm test -- tests/registry-explorer/itemDetailView.test.ts tests/registry-explorer/discovery.test.ts tests/registry-explorer/registryProfile.test.ts tests/registry-explorer/renderSafety.test.ts`
- `pnpm validate:data`
- `pnpm build`
- `pnpm verify`
</verification>

<success_criteria>
- Internal item routes render component-first item pages.
- Result/profile cards become compact summaries and no longer show raw route clutter.
- Copy-only install/view actions remain safe and functional.
- Failure states are safe, specific, and user-facing.
- Raw JSON remains out of normal user UI.
- Full verification passes.

## Artifacts this phase produces

- `src/registry-explorer/ui/itemDetailView.ts`
- `renderItemDetailView` or equivalent renderer
- item detail route handling in `initRegistryExplorer`
- item route card entry data attributes such as `data-view-item-registry` and `data-view-item-slug`
- compact discovery/profile card UI
- item detail CSS selectors for hero, preview placeholder, actions, and detail cards
- `tests/registry-explorer/itemDetailView.test.ts`

---
phase: 08-component-peek-alternatives-ui
plan: 08-01-peek-popover
type: tdd
wave: 1
depends_on: []
files_modified:
  - src/registry-explorer/core/componentPeek.ts
  - src/registry-explorer/ui/componentPeekView.ts
  - src/registry-explorer/ui/discoveryView.ts
  - src/registry-explorer/ui/registryProfileView.ts
  - src/registry-explorer/ui/shell.ts
  - public/styles/registry-explorer.css
  - tests/registry-explorer/componentPeek.test.ts
autonomous: true
requirements: [PEEK-01, PEEK-02, PEEK-03, PEEK-04]
must_haves:
  truths:
    - "PEEK-01: Route-eligible discovery/profile items expose a quick component peek without leaving the current browsing context."
    - "PEEK-02: Peek content uses the best available visual/fallback order and clearly distinguishes unavailable visuals."
    - "PEEK-03: Mouse, keyboard focus, and click/tap paths all work; the feature is not hover-only."
    - "PEEK-04: The peek never presents docs links, raw metadata, or unavailable visuals as real screenshots."
    - "D-01: Hover and keyboard focus show the quick peek; click/tap opens the stable Phase 7 item page."
    - "D-02: The peek is a small anchored popover, not a side panel or inline expansion."
    - "D-03: Peeks dismiss through mouse leave, blur, Escape, or outside click/tap."
    - "D-04: Trigger and peek click/tap routes to the existing item page."
    - "D-05: Keyboard focus and click/tap paths are first-class."
    - "D-06: The peek is visual-first."
    - "D-07: Peek text is limited to at most a tiny title/name."
    - "D-08: Metadata/details/files/dependencies/actions stay out of the quick peek."
    - "D-09: Missing visuals show a minimal unavailable-preview placeholder and component-page path."
    - "D-10: Placeholder peeks stay minimal and avoid source/status dumps."
  prohibitions:
    - statement: "Do not iframe or execute third-party component code in Atlas."
      status: resolved
      verification: "Source review confirms no iframe or runtime component execution is added."
---

<objective>
Add the Phase 8 quick peek foundation for route-eligible discovery and registry-profile items: compact visual-first anchored popovers, accessible hover/focus behavior, click/tap item-page routing, and safe minimal fallbacks.

Decision coverage: D-01, D-02, D-03, D-04, D-05, D-06, D-07, D-08, D-09, D-10, D-21.
</objective>

<must_haves>
- Keep popovers transient and compact: target width 260–360px with no card clone.
- Reuse `escapeHtml` and `renderExternalLink` for all rendered registry/item fields.
- Do not add React, Radix, shadcn blocks, iframes, an icon library, or a new style framework.
- Preserve copy-only shadcn command behavior; peek actions route or copy through existing shell paths only.
</must_haves>

<threat_model>
- Assets: browsing trust, third-party registry data boundary, keyboard accessibility, existing item routing, static-SPA reliability.
- Threats: untrusted item names/descriptions/URLs reaching popover HTML unescaped; hover-only behavior excluding keyboard/touch users; popovers implying a docs link is a real visual; external component code being embedded or executed; click/tap breaking Phase 7 item routing.
- Controls: render-safety helpers, pure peek view-model tests, explicit shell event tests for focus/Escape/outside dismissal, route-trigger data attributes reused from Phase 7, and source assertions against iframe/code-execution additions.
- High severity gate: if any peek renderer interpolates unescaped registry/item fields or adds iframe/runtime execution for third-party components, stop and fix before continuing.
</threat_model>

<tasks><task id="T1" title="Create tested peek view model and renderer">
  <name>Create tested peek view model and renderer</name>
  <files>
    - src/registry-explorer/core/componentPeek.ts
    - src/registry-explorer/ui/componentPeekView.ts
    - src/registry-explorer/ui/discoveryView.ts
    - src/registry-explorer/ui/registryProfileView.ts
    - src/registry-explorer/ui/shell.ts
    - public/styles/registry-explorer.css
  </files>
  <read_first>
    - src/registry-explorer/core/registry.schema.ts
    - src/registry-explorer/core/registryItemDetail.ts
    - src/registry-explorer/ui/renderSafety.ts
    - src/registry-explorer/ui/itemDetailView.ts
    - .planning/phases/08-component-peek-alternatives-ui/08-CONTEXT.md
    - .planning/phases/08-component-peek-alternatives-ui/08-UI-SPEC.md
    - .planning/phases/08-component-peek-alternatives-ui/08-RESEARCH.md
  </read_first>
  <action>
    Create `src/registry-explorer/core/componentPeek.ts` with a `ComponentPeekViewModel` and builder that accepts route-eligible item metadata from a `ComponentCandidate` or `RegistryProfileItemRow`. The view model must contain registry name, item slug, display title, optional `previewUrl`, optional component page/docs URL, visual status, and a safe route identity. Create `src/registry-explorer/ui/componentPeekView.ts` that renders a compact popover with optional tiny title, one visual/link area when `previewUrl` or component page URL exists, or the exact fallback heading `Preview not available yet` plus `Open component page`. Per D-06 through D-10, do not include dependency lists, file lists, long metadata, source dumps, raw JSON/source labels, queue controls, or full item-card markup in this renderer.
  </action>
  <verify>
    <automated>pnpm test -- tests/registry-explorer/componentPeek.test.ts && pnpm typecheck</automated>
  </verify>
  <acceptance_criteria>
    - `src/registry-explorer/core/componentPeek.ts` exports a typed peek view-model builder.
    - `src/registry-explorer/ui/componentPeekView.ts` exports a renderer that uses `escapeHtml` or `renderExternalLink` for every item/registry field.
    - Placeholder output contains `Preview not available yet` and `Open component page`.
    - Renderer tests prove the popover does not contain dependency, file-list, raw-data, source-dump, or queue-control markup.
    - No `iframe` element or third-party component execution hook is introduced in the peek renderer.
  </acceptance_criteria>

  <done>
    - `src/registry-explorer/core/componentPeek.ts` exports a typed peek view-model builder.
    - `src/registry-explorer/ui/componentPeekView.ts` exports a renderer that uses `escapeHtml` or `renderExternalLink` for every item/registry field.
    - Placeholder output contains `Preview not available yet` and `Open component page`.
    - Renderer tests prove the popover does not contain dependency, file-list, raw-data, source-dump, or queue-control markup.
  </done>
</task>

<task id="T2" title="Add peek triggers to discovery and profile rows">
  <name>Add peek triggers to discovery and profile rows</name>
  <files>
    - src/registry-explorer/core/componentPeek.ts
    - src/registry-explorer/ui/componentPeekView.ts
    - src/registry-explorer/ui/discoveryView.ts
    - src/registry-explorer/ui/registryProfileView.ts
    - src/registry-explorer/ui/shell.ts
    - public/styles/registry-explorer.css
  </files>
  <read_first>
    - src/registry-explorer/ui/discoveryView.ts
    - src/registry-explorer/ui/registryProfileView.ts
    - src/registry-explorer/core/discovery.ts
    - src/registry-explorer/core/registryProfile.ts
    - tests/registry-explorer/componentPeek.test.ts
    - .planning/phases/07-item-detail-data-routing/07-02-component-page-card-cleanup-SUMMARY.md
    - .planning/phases/08-component-peek-alternatives-ui/08-PATTERNS.md
  </read_first>
  <action>
    Update route-eligible `View component` controls in discovery/profile rows so they can act as peek triggers and item-route controls. Add stable data attributes for registry namespace, item slug, candidate/profile source, and peek id while preserving `data-view-item-registry` and `data-view-item-slug` click routing. Use the visible label `View component` unless adding a separate `Peek` label is less crowded. Per D-21, keep Docs and Registry homepage links available when they fit, but do not add a dense action cluster inside each row.
  </action>
  <verify>
    <automated>pnpm test -- tests/registry-explorer/componentPeek.test.ts && pnpm typecheck</automated>
  </verify>
  <acceptance_criteria>
    - Discovery route-eligible rows expose data needed to open a peek and still contain `data-view-item-registry` plus `data-view-item-slug` for item routing.
    - Registry profile route-eligible rows expose the same peek trigger data vocabulary as discovery rows.
    - Ineligible rows render a muted unavailable state and no active peek trigger.
    - Existing click routing to `view=item` remains available for route-eligible rows.
  </acceptance_criteria>

  <done>
    - Discovery route-eligible rows expose data needed to open a peek and still contain `data-view-item-registry` plus `data-view-item-slug` for item routing.
    - Registry profile route-eligible rows expose the same peek trigger data vocabulary as discovery rows.
    - Ineligible rows render a muted unavailable state and no active peek trigger.
    - Existing click routing to `view=item` remains available for route-eligible rows.
  </done>
</task>

<task id="T3" title="Wire accessible transient peek state in the shell and CSS">
  <name>Wire accessible transient peek state in the shell and CSS</name>
  <files>
    - src/registry-explorer/core/componentPeek.ts
    - src/registry-explorer/ui/componentPeekView.ts
    - src/registry-explorer/ui/discoveryView.ts
    - src/registry-explorer/ui/registryProfileView.ts
    - src/registry-explorer/ui/shell.ts
    - public/styles/registry-explorer.css
  </files>
  <read_first>
    - src/registry-explorer/ui/shell.ts
    - src/registry-explorer/ui/componentPeekView.ts
    - src/registry-explorer/ui/discoveryView.ts
    - src/registry-explorer/ui/registryProfileView.ts
    - public/styles/registry-explorer.css
    - tests/registry-explorer/componentPeek.test.ts
    - .planning/phases/08-component-peek-alternatives-ui/08-UI-SPEC.md
  </read_first>
  <action>
    Extend `AppState` in `shell.ts` with transient active-peek state and delegated handlers for pointer/focus/keyboard dismissal. Show the peek on hover and `focusin` for route-eligible triggers. Dismiss on trigger mouse leave, focus leaving the trigger/popover region, `Escape`, and outside pointer interaction. Preserve click/tap behavior so clicking the trigger or `Open component page` path navigates to the Phase 7 item page rather than pinning the peek. Add CSS classes for anchored compact popovers, visual panels, placeholder state, focus outlines, and responsive max width per the UI spec.
  </action>
  <verify>
    <automated>pnpm test -- tests/registry-explorer/componentPeek.test.ts && pnpm typecheck && pnpm typecheck:test</automated>
  </verify>
  <acceptance_criteria>
    - Shell state can represent no active peek and one active peek by route identity.
    - `Escape` clears the active peek state.
    - Outside pointer interaction clears the active peek state.
    - Trigger click still routes to `view=item&registry=<namespace>&item=<slug>`.
    - CSS includes compact max-width behavior for `.component-peek-popover` and does not require a side panel.
  </acceptance_criteria>

  <done>
    - Shell state can represent no active peek and one active peek by route identity.
    - `Escape` clears the active peek state.
    - Outside pointer interaction clears the active peek state.
    - Trigger click still routes to `view=item&registry=<namespace>&item=<slug>`.
  </done>
</task>
</tasks>

<verification>
- `pnpm test -- tests/registry-explorer/componentPeek.test.ts`
- `pnpm typecheck`
- `pnpm typecheck:test`
- `pnpm verify`
</verification>

<success_criteria>
- Route-eligible discovery and profile items expose safe, accessible quick peeks.
- Peeks are visual-first, minimal, transient, and not hover-only.
- Click/tap routing continues to open the Phase 7 item page.
- Third-party registry data remains escaped and no third-party component code executes in Atlas.

## Artifacts this phase produces

- `src/registry-explorer/core/componentPeek.ts`
- `ComponentPeekViewModel`
- `buildComponentPeekViewModel`
- `src/registry-explorer/ui/componentPeekView.ts`
- `renderComponentPeek`
- `AppState.activePeek` or equivalent shell state field
- `.component-peek-popover`
- `.component-peek-placeholder`
- `tests/registry-explorer/componentPeek.test.ts`

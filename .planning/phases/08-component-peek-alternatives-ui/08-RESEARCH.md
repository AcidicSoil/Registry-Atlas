# Phase 8: Component Peek & Alternatives UI - Research

**Researched:** 2026-06-27
**Status:** Complete
**Agent contract:** gsd-phase-researcher inline pass (no subagent tool exposed in this session)

## User Constraints

### Locked decisions from CONTEXT.md

- D-01: Route-eligible items expose a quick peek on hover and keyboard focus; click/tap opens the stable Phase 7 item page. [VERIFIED: .planning/phases/08-component-peek-alternatives-ui/08-CONTEXT.md]
- D-02: The peek is a small anchored popover, not a side panel or inline card expansion. [VERIFIED: .planning/phases/08-component-peek-alternatives-ui/08-CONTEXT.md]
- D-03: Peeks dismiss through mouse leave, blur, `Esc`, or outside click/tap. [VERIFIED: .planning/phases/08-component-peek-alternatives-ui/08-CONTEXT.md]
- D-04: Click/tap from trigger or peek routes to the Phase 7 item page. [VERIFIED: .planning/phases/08-component-peek-alternatives-ui/08-CONTEXT.md]
- D-05: Peek behavior must not be hover-only. [VERIFIED: .planning/phases/08-component-peek-alternatives-ui/08-CONTEXT.md]
- D-06 through D-10: Peek content is visual-first, at most tiny title/name, with minimal `Preview not available yet` fallback and `Open component page`; do not recreate item cards or dense metadata in the peek. [VERIFIED: .planning/phases/08-component-peek-alternatives-ui/08-CONTEXT.md]
- D-11 through D-18: Filters derive dynamically from `Registry.itemSummaries`, use an extensible `+ Filter` picker with removable badges/reset, expose item type at minimum, support category/tag/visual/status when low-risk, and constrain long aside/pill-list surfaces with scroll behavior. [VERIFIED: .planning/phases/08-component-peek-alternatives-ui/08-CONTEXT.md]
- D-19 through D-23: Remove or strongly demote noisy `verified item` / `high confidence` labels, keep useful component/docs/profile/homepage actions when not crowded, and solve badge overflow without expanding every badge inline. [VERIFIED: .planning/phases/08-component-peek-alternatives-ui/08-CONTEXT.md]
- D-24 through D-30: Related/similar components appear as a small item/detail navigator based on shared type/category/tags/metadata; use safe labels such as `Similar patterns` or `Related components`; do not claim better/best/production-grade quality. [VERIFIED: .planning/phases/08-component-peek-alternatives-ui/08-CONTEXT.md]

### Deferred ideas

- Do not build v1.3 dynamic matrix redesign in Phase 8. [VERIFIED: .planning/phases/08-component-peek-alternatives-ui/08-CONTEXT.md]
- Do not build evidence-backed production upgrade recommendations, automated screenshot capture pipelines, or quality ranking in Phase 8. [VERIFIED: .planning/phases/08-component-peek-alternatives-ui/08-CONTEXT.md]

## Project Constraints from AGENTS.md

- Preserve the static Vite/vanilla TypeScript SPA and GitHub Pages deployment model. [VERIFIED: AGENTS.md]
- Community registries are third-party code; UI must not imply Registry Atlas has audited or endorsed them. [VERIFIED: AGENTS.md]
- Browser behavior remains copy-only for shadcn CLI commands; do not execute installs from the app. [VERIFIED: AGENTS.md]
- Keep business/domain logic in pure `src/registry-explorer/core/*` modules and DOM rendering in `src/registry-explorer/ui/*` renderers. [VERIFIED: AGENTS.md]
- Escape untrusted registry/item strings before interpolating into `innerHTML`; use `escapeHtml` and `renderExternalLink` from `renderSafety.ts` where links/text are rendered. [VERIFIED: AGENTS.md]
- Final validation gate for current project scripts is `pnpm verify`, which runs source/test typecheck, Vitest, data validation, and build. [VERIFIED: package.json]

## Standard Stack

- Use existing vanilla TypeScript and DOM event delegation; no React/Radix/shadcn component dependency is needed for Phase 8. [VERIFIED: .planning/phases/08-component-peek-alternatives-ui/08-UI-SPEC.md]
- Use existing Vitest test infrastructure; `package.json` now defines `test`, `typecheck`, `typecheck:test`, `validate:data`, and `verify`. [VERIFIED: package.json]
- Use `public/styles/registry-explorer.css` for all Phase 8 visual behavior; do not add CSS to `src/style.css`. [VERIFIED: .planning/codebase/STRUCTURE.md]

## Architecture Patterns

- Add pure filtering and relatedness derivation under `src/registry-explorer/core/`, then pass prepared view models into UI renderers. [VERIFIED: .planning/phases/08-component-peek-alternatives-ui/08-CONTEXT.md]
- `Registry.itemSummaries` already carries type, category, taxonomy labels, route eligibility, preview URL, dependencies, registry dependencies, files, catalog status, confidence, and warnings; Phase 8 should derive filter options and evaluation labels from this model rather than hardcoding tiny lists. [VERIFIED: src/registry-explorer/core/registry.schema.ts]
- `discovery.ts` and `registryProfile.ts` already expose candidate/profile row metadata and route/action state; filter application should occur before rendering and should not duplicate item-summary normalization in renderers. [VERIFIED: src/registry-explorer/core/discovery.ts; src/registry-explorer/core/registryProfile.ts]
- `registryItemDetail.ts` already computes `previewUrl`, `componentPageUrl`, `visualStatus`, taxonomy labels, dependencies, files, and safe result states; related and peek surfaces can reuse these field names and fallback semantics. [VERIFIED: src/registry-explorer/core/registryItemDetail.ts]
- `shell.ts` owns app state, URL sync, delegated click/copy events, item route rendering, and selected candidate/profile/item state; add active filter and transient peek state there instead of introducing a state library. [VERIFIED: src/registry-explorer/ui/shell.ts]

## Don't Hand-Roll

- Do not hand-roll HTML escaping or external-link attributes in new renderers; use `escapeHtml` and `renderExternalLink`. [VERIFIED: src/registry-explorer/ui/renderSafety.ts]
- Do not introduce iframe/embed previews or remote code execution for community registry components. [VERIFIED: .planning/phases/08-component-peek-alternatives-ui/08-UI-SPEC.md]
- Do not implement ranking/scoring language for alternatives; similarity is metadata-overlap only. [VERIFIED: .planning/phases/08-component-peek-alternatives-ui/08-CONTEXT.md]
- Do not solve item filtering with hardcoded `registry:ui`-only chips; derive filter groups from loaded summaries and make item type the required first dimension. [VERIFIED: .planning/phases/08-component-peek-alternatives-ui/08-CONTEXT.md]

## Common Pitfalls

- Hover-only peeks fail PEEK-03; focus, `Esc`, outside click, and click/tap routing need explicit shell event handling or state modeling. [VERIFIED: .planning/REQUIREMENTS.md]
- Recreating a full item card inside a peek reverses Phase 7 card cleanup and violates the UI spec. [VERIFIED: .planning/phases/08-component-peek-alternatives-ui/08-UI-SPEC.md]
- Rendering `high confidence`, `verified item`, `Raw JSON`, or `Open raw item route` prominently in browsing surfaces violates Phase 8 copy constraints. [VERIFIED: .planning/phases/08-component-peek-alternatives-ui/08-UI-SPEC.md]
- Adding related alternatives inside every discovery/profile card risks row overcrowding; keep related navigation on item/detail surfaces. [VERIFIED: .planning/phases/08-component-peek-alternatives-ui/08-CONTEXT.md]
- Generic file-wide negative greps in plan verification can self-trigger if plan prose contains the forbidden string; region-scope or use source assertions carefully. [VERIFIED: .codex/agents/gsd-planner.md]

## Code Examples

- Existing route trigger pattern: `button.discovery-route` with `data-view-item-registry` and `data-view-item-slug` in `discoveryView.ts` and `registryProfileView.ts`. [VERIFIED: src/registry-explorer/ui/discoveryView.ts; src/registry-explorer/ui/registryProfileView.ts]
- Existing profile item metadata pattern: profile rows render slug, type, category, taxonomy category/tag chips, catalog status, description, docs, copy-only install actions, and `View component`. Phase 8 should shrink/demote noisy status/confidence chips here. [VERIFIED: src/registry-explorer/ui/registryProfileView.ts]
- Existing detail preview fallback: `renderPreview` displays an `item-preview-panel`, with placeholder text and component-page link when no preview URL is present. Phase 8 peek and related visuals should reuse or align with this fallback vocabulary. [VERIFIED: src/registry-explorer/ui/itemDetailView.ts]

## Validation Architecture

- Unit tests should cover pure filter-option generation, selected-filter application, and relatedness derivation without DOM. [VERIFIED: .planning/phases/08-component-peek-alternatives-ui/08-UI-SPEC.md]
- Renderer tests should assert peek markup excludes raw JSON, long metadata, dependency/file lists, and full card clones; if DOM test infrastructure is too heavy, render-string tests against exported UI helpers are acceptable. [VERIFIED: .planning/phases/08-component-peek-alternatives-ui/08-UI-SPEC.md]
- Shell/event behavior should be covered where practical through pure state helpers or delegated handler tests; `Esc`, outside click, focus/blur, and click/tap routing are the risk points. [VERIFIED: .planning/phases/08-component-peek-alternatives-ui/08-UI-SPEC.md]
- Full phase verification remains `pnpm verify`; targeted task commands should include `pnpm test -- tests/registry-explorer/<new>.test.ts`, `pnpm typecheck`, and `pnpm typecheck:test`. [VERIFIED: package.json]

## Package Legitimacy Audit

No new runtime or dev packages are recommended for Phase 8. [VERIFIED: package.json]

## Open Questions / Planner Discretion

- Whether active filters are shareable URL state or local UI state is left to the planner/executor. Favor deliberate scope: current Phase 4 decision excluded install queue from URL state, but discovery URL state already exists for browsing context. [VERIFIED: .planning/phases/08-component-peek-alternatives-ui/08-CONTEXT.md]
- Exact filter picker DOM implementation is discretionary as long as it remains accessible, extensible, removable-badge based, and static-SPA compatible. [VERIFIED: .planning/phases/08-component-peek-alternatives-ui/08-CONTEXT.md]

## RESEARCH COMPLETE

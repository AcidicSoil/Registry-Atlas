# Phase 4: Install Actions & Release Hardening - Context

**Gathered:** 2026-06-08T22:16:59Z
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase lets users safely act on validated registry/item choices and gives maintainers release confidence. It covers copyable shadcn `add` / `view` commands, valid source/raw links, a deduped install queue, URL state for shareable discovery context, CI/release checks, and a documented accessibility/browser-smoke baseline.

It does not execute installs in the browser, certify third-party registry safety, add package-manager variants, add accounts/reviews/ratings, or introduce a backend.

</domain>

<decisions>
## Implementation Decisions

### Command + Copy Behavior
- **D-01:** Only validated namespace + item pairs with a known route are eligible for copyable install/inspect actions.
- **D-02:** Single-item install command syntax is exactly `npx shadcn@latest add @<registry>/<item>`.
- **D-03:** Single-item inspect command syntax is exactly `npx shadcn@latest view @<registry>/<item>`.
- **D-04:** Inferred, unavailable, incomplete, or invalid candidates must show disabled actions with a clear reason instead of producing guessed commands.
- **D-05:** Command-generation logic must be pure and tested independently from DOM rendering.

### Queue + Batch Command UX
- **D-06:** Queue only validated route-eligible items.
- **D-07:** Deduplicate queued items by the full install token: `@<registry>/<item>`.
- **D-08:** Batch command format is `npx shadcn@latest add @foo/button @bar/card` with deduped tokens after `add`.
- **D-09:** The queue should appear as a compact action panel in the Discover flow, with add/remove/clear/copy affordances.
- **D-10:** Queue controls must not imply Registry Atlas has audited third-party code; source/inspect-before-install affordances remain available.

### URL State + Sharing
- **D-11:** Persist shareable discovery state in the URL: selected view/tab, search query, and selected profile/registry where relevant.
- **D-12:** Do not persist queued install items in the URL for v1. Queue state remains local UI state.
- **D-13:** URL state parsing/serialization should be pure and tested so invalid or stale params fall back safely.

### Release + Accessibility Baseline
- **D-14:** `pnpm verify` remains the local release gate.
- **D-15:** CI must verify typecheck, test typecheck, Vitest, data validation, and production build before release/deploy.
- **D-16:** Add targeted tests for command generation, queue dedupe, URL state parsing/serialization, and disabled copy/queue reasons.
- **D-17:** Browser smoke checks must cover copy buttons, disabled states, queue flow, tab/search URL restoration, and profile/discovery link behavior.
- **D-18:** Accessibility baseline must cover keyboard-reachable controls, visible focus, button labels, and visible or announced copy feedback.

### Claude's Discretion
Planner/executor may choose exact module names, DOM placement details, and styling refinements as long as they preserve the decisions above and the existing vanilla TypeScript/static SPA architecture.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product and Phase Scope
- `.planning/ROADMAP.md` — Phase 4 goal, requirements, success criteria, and dependency on Phase 3.
- `.planning/REQUIREMENTS.md` — Install Actions and Hardening requirements: INST-01 through INST-06, HARD-02, HARD-05, HARD-06.
- `.planning/PROJECT.md` — Core value, constraints, static app bias, security posture, and install behavior.
- `.planning/STATE.md` — Current project position and prior warning that Phase 4 must verify shadcn CLI behavior before final copy text.

### Prior Phase Outputs
- `.planning/phases/03-component-first-discovery/03-SUMMARY.md` — Phase 3 completion context and discovery/profile surfaces that Phase 4 extends.
- `.planning/phases/03-component-first-discovery/03-UI-REVIEW.md` — Visual review notes, including the non-blocking warning that Phase 4 should revisit action hierarchy when install/copy actions are added.

### Codebase Maps
- `.planning/codebase/STACK.md` — Static Vite/vanilla TypeScript architecture, GitHub Pages target, and CI/build stack.
- `.planning/codebase/ARCHITECTURE.md` — UI shell, renderer/core layering, state boundaries, and static-data flow.
- `.planning/codebase/CONVENTIONS.md` — TypeScript naming, pure-core placement, render naming, escaping, and strict build conventions.
- `.planning/codebase/TESTING.md` — Existing test organization and expected Vitest patterns.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/registry-explorer/core/itemRoutes.ts` and related Phase 3 route eligibility helpers can anchor command eligibility.
- `src/registry-explorer/core/coverageStatus.ts` can inform disabled-state reasons for verified/inferred/partial/unavailable/unverified items.
- `src/registry-explorer/core/discovery.ts` and `src/registry-explorer/core/registryProfile.ts` provide the derived data used by Discover and profile views.
- `src/registry-explorer/ui/discoveryView.ts` and `src/registry-explorer/ui/registryProfileView.ts` are the primary UI integration points for copy, queue, source, and disabled-state affordances.
- `public/styles/registry-explorer.css` contains the current dark visual system and should receive new queue/copy/action classes rather than inline styles.
- `.github/workflows/deploy.yml`, `package.json`, and existing validation scripts are the release-gate integration points.

### Established Patterns
- Keep command-generation, URL-state, queue dedupe, eligibility, and disabled-reason logic in pure core modules with tests.
- Keep DOM rendering in `src/registry-explorer/ui/*View.ts`; renderers should receive derived state and emit semantic class names.
- Preserve safe string/URL rendering; community registry data is untrusted and must not produce unsafe links or unescaped markup.
- Preserve static GitHub Pages compatibility; do not add backend or runtime API requirements.

### Integration Points
- `src/registry-explorer/ui/shell.ts` owns local app state and event delegation. It is the likely place to add queue state and URL-state hydration/sync boundaries.
- `index.html` provides stable app roots and tabs; avoid direct root lookups outside bootstrap unless new roots are explicitly injected.
- `tests/registry-explorer/` should receive focused tests matching new core modules and any DOM-safe renderer behavior if needed.
- Browser verification should run against the Vite app at the GitHub Pages base path `/Registry-Atlas/`.

</code_context>

<specifics>
## Specific Ideas

- Keep queue local in v1; do not encode queued install items in the URL.
- Use disabled actions with explicit reasons rather than warning-powered guessed commands.
- Treat inspect-before-install as a first-class action next to install copy because community registry code is third-party.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 4-Install Actions & Release Hardening*
*Context gathered: 2026-06-08T22:16:59Z*

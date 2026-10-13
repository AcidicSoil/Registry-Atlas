# Registry Atlas — observed frontend design contract

**Status:** Project implementation inventory, reviewed against current source on 2026-10-12. This records *existing conventions*, not a new user approval. Standards and accessibility compliance are assessed separately in `.design/standards.json`.

## Technology and boundaries

- Vite + TypeScript static web application. Its production entry in `src/registry-explorer/entry.ts` uses DOM APIs and `initRegistryExplorer`, not a React root. React, Sandpack and React Grab are package dependencies; do not assume React-specific UI conventions apply to first-party views without source evidence.
- The UI is assembled in `src/registry-explorer/ui/`, with routes in `src/registry-explorer/core/catalogRoutes.ts` and data loading in `src/registry-explorer/data/`. The established dependency direction is **core → data → UI**: core must not import data or UI; data must not import UI. Dependency-cruiser checks this invariant. Persistent catalog content and projections originate from the canonical PostgreSQL workflow; client production assets are generated snapshots.
- Reuse the existing HTML/CSS/TypeScript surfaces and established data bindings. Do not add a second global styling or component system merely to implement a feature.

## Visual tokens and information architecture

- Existing dark UI uses the CSS variables in `public/styles/registry-explorer.css`: background `#0b0c0e`, foreground `#edeef0`, accent `#4ea1ff`, dark cards and muted secondary text. Existing spacing units run from 4 to 24px; button/card corner radii are 11/14px. Font stack prefers Inter then system sans. These are *observed*, not new color contrast approvals.
- Navigation uses one primary sidebar, one global catalog search, contextual browse/filter rows and content surfaces. Internal canonical links must preserve the established route structure and browser history. Breadcrumbs express `Home → Registries → Library → Asset kind → Item`, with valid parent links.
- Library pages show all indexed library items and type-specific inventory routes (`components`, `blocks`, `pages`, `templates`, `themes`, `icons` when populated). A detail page offers an explicit **Browse library** internal action.
- In a detail page's **registry · component** identity row, registry names link to the **external official registry homepage**. Component names link to a **verified/observed original upstream page**; if none exists, render text rather than an internal self-link or an invented upstream URL.
- Original source links are distinct from internal Atlas routes. Never expose `item.json` / raw registry JSON navigation as user-facing actions; JSON may still be used internally for catalog import and inspection.
- Keep important links near the start of the detail view; use brief labels and visible keyboard focus indicators. Do not duplicate controls in a second toolbar.

## Interaction and responsive behavior

- Use semantic anchors for navigation, buttons for actions, structured headings and breadcrumb `nav`; preserve keyboard reachability and `:focus-visible` outlines defined in CSS. Provide a first-focus **Skip to main content** link to a focusable content-header target. **These implementation choices do not establish WCAG conformance.**
- The mobile menu is `position: fixed` under 860px and must not consume document space when closed. The menu supports close button, backdrop click, Escape, and focus restoration. The desktop sidebar remains sticky.
- Validate at mobile width around 390px and desktop width around 1440px, including no horizontal overflow, correct destination URLs, and usable focus/interaction states.
- Preference motion handling is present in CSS; motion behavior and contrast still require rule-by-rule inspection and browser tests.

## Verification and unresolved decisions

- Existing gates: `pnpm audit:dependencies` (rejects moderate or higher dependency advisories), `pnpm typecheck`, `pnpm typecheck:test`, `pnpm test`, `pnpm check:postgres`, `pnpm check:product-contract`, `pnpm validate:data`, and `pnpm build`, chained by `pnpm verify`. Browser interactions are independently verified in PPM `registry-atlas`.
- Existing automated checks are not proof of every accessibility, security or UX standard. Scope, test evidence and exceptions for individual OrchestKit rules live in `.design/standards.json`. A standard with insufficient evidence stays unverified.
- No general exception, third-party tooling replacement, or novel design language is approved by this document. Any required migration must be proposed and separately approved through the project workflow.

## Quality gates under certification

- Pinned React Doctor 0.9.18 and dependency-cruiser 18.6.0 run from the root verification command. Their isolated pass–fail–pass proofs are recorded in `.design/quality-tooling-progress.md`.
- cccc 1.8.0 is pinned through mise’s official GitHub release backend; complexity limits are cognitive 15 / cyclomatic 10. The previous 44 threshold violations were resolved without changing the limits. The full `pnpm verify` suite now passes; formal PPM/PAO certification remains separate.
- Stackforge anti-slop TypeScript is installed at the root with all 117 rules active. The scan passes at zero errors and warnings, and its deliberate failure-detection proof passes. Formal PPM/PAO certification remains pending. Full PPM/OrchestKit certification is not complete.

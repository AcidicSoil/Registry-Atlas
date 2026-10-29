---
version: alpha
name: Registry Atlas
description: Observed design system for the Vite and TypeScript registry catalog
colors:
  background: "#0b0c0e"
  foreground: "#edeef0"
  card: "#121316"
  popover: "#16181c"
  secondary: "#1a1c20"
  muted: "#8a8f98"
  primary: "#4ea1ff"
typography:
  body:
    fontFamily: "Inter"
    fontSize: 14px
    lineHeight: 1.5
  heading2:
    fontSize: 1.05rem
    lineHeight: 1.2
spacing:
  xsmall: 4px
  small: 8px
  medium: 12px
  large: 16px
  xlarge: 20px
  xxlarge: 24px
rounded:
  button: 11px
  card: 14px
  catalogCard: 0px
components:
  page:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
  catalogCard:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.catalogCard}"
  search:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.button}"
  popover:
    backgroundColor: "{colors.popover}"
  metadata:
    textColor: "{colors.muted}"
  link:
    textColor: "{colors.primary}"
---
# Registry Atlas design contract

**Status:** Documentation of the **existing, currently running UI**, not a proposed redesign. The CSS values below were compared against live headed-Chromium captures at 1440×900 and 390×844 on 2026-10-29. Evidence: `.design/evidence/design-current/browser-observations.json` and matching screenshots. Approval of this documentation remains a separate decision; accessibility and standards assessments remain in `.design/standards.json`.

## Overview

Registry Atlas is a dense, dark catalog for finding registries and their published UI assets. Optimize for search, navigation, and source provenance, not promotional illustrations. The Vite and TypeScript entry uses DOM rendering through `src/registry-explorer/entry.ts` and `src/registry-explorer/ui/`. Retain the existing core/data/UI boundaries and reuse the project's HTML and CSS rather than installing another component system.

## Colors

- Page background is `#0b0c0e`; primary text is `#edeef0`. Cards use `#121316`, popovers `#16181c`, and secondary surfaces `#1a1c20`.
- `#4ea1ff` marks actionable links and keyboard focus. Muted metadata uses `#8a8f98`. These values are defined by the corresponding CSS custom properties under `:root`.
- Keep dark surface boundaries distinct through existing borders. Contrast and forced-color support require separate rendered checks; the listed colors are not WCAG certification.

## Typography

- Body copy uses `14px`, `line-height: 1.5`, and `--font-sans` (Inter, followed by system sans-serif fallbacks).
- The `h1` uses `clamp(1.5rem, 2vw, 2rem)`; `h2` uses `1.05rem`. Both use `line-height: 1.2`.
- Catalog names use stronger weight than source metadata. Truncate only where the component can still expose the full identity through its link or accessible label.

## Layout

- The catalog grid displays three columns by default, two at a maximum viewport width of `1080px`, and one at `700px`. Grid and list controls represent distinct views of the same catalog.
- Desktop left navigation can resize between `190px` and `440px`; the collection summary rail can resize between `200px` and `400px`. Each panel owns its scroll region. The content region scrolls independently.
- Below `860px`, the navigation is a native modal `<dialog>`, not a desktop panel. Check layout at approximately `390px` and `1440px`, including horizontal overflow and link overlap.
- Use the source-backed `--space-1` through `--space-6` scale, corresponding to `4px`, `8px`, `12px`, `16px`, `20px`, and `24px`.

## Elevation & Depth

- Catalog cards use solid dark fills and visible borders, with hover border changes rather than animated lift. The current card implementation removes hover box-shadow and transforms.
- Sidebar and popover surfaces use the existing dark layers. Do not add glows, glass effects, or large decorative shadows absent from the current components.

## Shapes

- Shared `--radius-button` is `11px`; shared `--radius-card` is `14px`. The base `.catalog-component-card` rule declares `12px`, but component collection grids use the more specific `.catalog-collection-grid-component .catalog-component-card` override, so the **current rendered collection cards have square `0px` corners** at both 1440px and 390px. The `catalogCard` token above records this effective collection style, not the overridden base rule.
- The global focus-visible rule defines `2px` blue outlines with a `3px` offset. The existing `.catalog-component-open:focus-visible` override explicitly removes the inner card anchor outline; the surrounding card also has `tabindex="0"`. This is an observed exception, not evidence of complete keyboard-accessibility conformance.

## Components

- **Catalog card:** a keyboard-focusable main anchor opens the internal item route. A separate **View component** (or corresponding asset kind) deeplink opens the same route. **Registry homepage** opens the verified external registry home; **Source** opens a verified upstream item page. Do not restore a redundant **Inspect** action or link to raw `item.json` data.
- **Browse controls:** one global search, grouped taxonomy filters, and independent Grid/List and sort controls. Expanding a taxonomy group does not change the filter until a category is selected. Preserve selected state and browser history.
- **Navigation:** primary sidebar, breadcrumb hierarchy (`Home → Registries → Library → Asset kind → Item`), and the `Browse library` action on item detail pages. Both Registry Atlas brand anchors navigate home.
- **Dialog:** mobile sidebar closes on Escape, backdrop dismissal, or a filter selection, then restores focus appropriately. The desktop sidebar remains outside the modal behavior.
- **Focus and states:** semantic anchors for routes, buttons for actions, a first-focus Skip to main content link, and accessible labels when visual text is shortened. The global `:focus-visible` rule is subject to component overrides (including the inner catalog-card link). Preserve hover, active/selected, and disabled states already implemented; independently test keyboard focus instead of assuming every control displays the global outline.

## Do's and Don'ts

- Do preserve verified upstream URL identity, internal canonical routes, keyboard interaction, and semantic navigation.
- Do keep styling within the owning component or feature; share tokens without adding new global override layers.
- Do test mobile and desktop rendered behavior after modifying card positioning or responsive rules.
- Don't invent external component pages, expose registry JSON as navigation, duplicate card actions, or add nonfunctional interface controls.
- Don't treat a successful build or design lint result as independent visual or accessibility approval.

## Verification and unresolved decisions

The relevant checks are `pnpm audit:dependencies`, `pnpm typecheck`, `pnpm typecheck:test`, `pnpm test`, `pnpm check:postgres`, `pnpm check:product-contract`, `pnpm validate:data`, and `pnpm build`, composed by `pnpm verify`. Browser interaction verification is separate. The build emits a CycloneDX dependency inventory. Existing project-wide or deferred standards findings remain open until separately verified and approved.

## Quality gates under certification

React Doctor `0.9.18` and dependency-cruiser `18.6.0` are pinned. The cccc complexity gate uses cognitive `15` and cyclomatic `10`. Stackforge anti-slop TypeScript checks use the root Oxlint configuration. See `.design/quality-tooling-progress.md` for earlier check evidence; passing checks do not imply PPM/PAO certification.

## Application shell and grouped navigation

The desktop app shell has draggable and keyboard-operated panel separators, persistent sidebar width, and independently collapsible rails. Registry collections have an auxiliary summary panel. Infinite-scroll catalog results append bounded batches, retain a visible Load more fallback, and restore browser Back position through session storage; the result count is announced politely.

Grouped taxonomy navigation expands and collapses parent branches without filtering; selecting a child filters by its taxonomy ID. An explicit All-family action includes descendants. The selected branch stays expanded; choosing a filter in the mobile dialog dismisses the dialog. See `.design/grouped-filter-navigation-2026-10-23.md` and `.design/frontend-work-brief.md` for source-backed flow evidence, along with `tests/registry-explorer/appShellBranding.test.ts`, `tests/registry-explorer/panelLayout.test.ts`, `tests/card-navigation-actions.e2e.ts`, and `tests-mobile/card-navigation-actions.e2e.ts`.

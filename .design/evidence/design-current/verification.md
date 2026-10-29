# Registry Atlas: current-UI verification

Verified against the **existing running application**, not a proposed design. The app source was not changed.

## Direct observation

Captured in the already-running PPM `registry-atlas` headed Chromium profile at `/Registry-Atlas/components/s/.NET%20logo`. Measurements and interaction results are in `browser-observations.json`; adjacent PNGs are actual browser screenshots.

| Current behavior | Desktop, 1440×900 | Mobile, 390×844 |
| --- | --- | --- |
| Colors | Background `#0b0c0e`; foreground `#edeef0`; blue `#4ea1ff` | Same CSS variables |
| Typography | Body Inter-first, 14px, 21px line-height | Same body scale |
| Component grid | 3 columns | 1 column |
| Collection card corners | **0px**, due to collection-grid selector | **0px** |
| Card navigation | Clickable internal card link, View component, optional verified Source, external Registry homepage | Same |
| Inspect action | Absent | Absent |
| Horizontal overflow | None measured | None measured |
| Mobile navigation | Hidden drawer/dialog | Native modal opens; Escape closes; trigger focus restored |

## Documentation corrections

| Earlier DESIGN.md claim | Verified current implementation and correction |
| --- | --- |
| Catalog card corners are 12px | Base CSS declares 12px, but `.catalog-collection-grid-component .catalog-component-card` overrides to **0px** in the observed collection grid. Documentation now records effective 0px corners. |
| All interactive links have visible focus outlines | Global `:focus-visible` styles exist, but `.catalog-component-open:focus-visible { outline: none; }` overrides the inner card anchor. Documentation now names this exception and does not assert complete accessibility. |
| Approval scope could imply a redesigned UI | Documentation and proposed review now explicitly concern **accuracy of the current UI description only**. No visual redesign is proposed. |

## Boundaries

This capture covers the specified routes, component states, colors, typography, responsive widths, and mobile Escape behavior. It does not prove all WCAG requirements, screen-reader behavior, or every catalog page. `DESIGN.md` passes Google-format lint and the PPM semantic audit; certification remains unapproved pending a separate explicit decision and source-attested standards evidence.

## Source and proof

- UI code: `src/registry-explorer/ui/catalogComponentsView.ts`, `src/registry-explorer/ui/shell.ts`
- CSS: `public/styles/registry-explorer.css`
- Browser capture: `browser-observations.json`
- Screenshots: `desktop-1440.png`, `mobile-390.png`, `mobile-navigation-open.png`
- Targeted existing regression tests: `tests/card-navigation-actions.e2e.ts`, `tests-mobile/card-navigation-actions.e2e.ts`, `tests-mobile/native-sidebar.e2e.ts`

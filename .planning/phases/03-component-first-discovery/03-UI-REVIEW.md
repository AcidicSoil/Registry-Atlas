---
status: complete
phase: 03
depth: visual-browser-audit
reviewed_at: 2026-06-08T21:36:51Z
overall_score: 21
scores:
  copywriting: 4
  visuals: 3
  color: 3
  typography: 3
  spacing: 4
  experience_design: 4
findings:
  critical: 0
  warning: 0
  info: 2
needs_human_review: false
---

# Phase 03 UI Review — Component-First Discovery

## Scope

Retroactive UI audit for Phase 03 surfaces that were added or touched:

- `index.html`
- `public/styles/registry-explorer.css`
- `src/registry-explorer/ui/discoveryView.ts`
- `src/registry-explorer/ui/registryProfileView.ts`
- `src/registry-explorer/ui/focusView.ts`
- `src/registry-explorer/ui/componentView.ts`
- `src/registry-explorer/ui/matrixView.ts`
- `src/registry-explorer/ui/shell.ts`

Baseline: `.planning/phases/03-component-first-discovery/03-UI-SPEC.md`.

## Browser verification

Local app served with:

```bash
pnpm dev --host 127.0.0.1
```

Browser-checked:

- Discover default surface at `http://127.0.0.1:5173/Registry-Atlas/`
- First result profile via `View profile`
- Computed CSS for discovery/profile cards, links, status chips, and header typography

## Verification command

```bash
pnpm verify
```

Result:

- Typecheck passed.
- Test typecheck passed.
- Vitest passed: 10 files, 54 tests.
- Data validation passed: 0 errors, 4 official HTTP warnings.
- Vite build passed.

## Original regression found and fixed

The first browser audit found a real UI regression matching the concern that “something was off”:

- Discovery rows and profile sections rendered as light gray panels on a dark app shell.
- Links inside those panels used browser/default blue.
- Text hierarchy mixed white text with muted blue-gray on a light surface, creating inconsistent contrast and a visually out-of-place light-theme island.
- Status chips used generic green/blue/orange backgrounds instead of the Phase 3 status color contract.
- New Phase 3 headings/profile facts inherited browser-scale typography instead of the specified compact 14px/12px system.

Fix applied in `public/styles/registry-explorer.css`:

- Restored dark card/profile surfaces using `#101320` / `#0b0d15`-aligned backgrounds.
- Set safe link colors to `#65d4ff` and validated item route color to `#ffd95e`.
- Set status colors to the Phase 3 contract:
  - verified: accent yellow
  - inferred: secondary cyan
  - partial: dashed cyan
  - unavailable: muted dashed
  - unverified: low-emphasis muted
- Constrained new Phase 3 headings, facts, links, rows, chips, and notes to the UI spec typography and spacing scale.

## Six-pillar assessment

| Pillar | Score | Assessment |
|--------|-------|------------|
| Copywriting | 4/4 | Required labels are present and neutral. No install/copy/queue language remains in visible Phase 3 UI. |
| Visuals | 3/4 | Final browser check shows coherent dark scan-first rows/profile sections. Minor note: dense two-column action area is functional but visually busy. |
| Color | 3/4 | Blocking light-card/default-blue regression is fixed. Status/link colors now align to the UI spec. |
| Typography | 3/4 | New Phase 3 surfaces now use compact heading/body/label sizing. Existing app chrome still has pre-existing larger/uppercase treatments. |
| Spacing | 4/4 | Rows, chips, notes, and profile facts use 4px-multiple spacing and remain compact. |
| Experience Design | 4/4 | Default surface is component-first, profile affordance works, official facts vs Atlas enrichment are separated, and source/item links remain distinct. |

## Findings

### Info 1 — Dense action column could be refined later

**Surface:** Discover result rows.

The right-side action stack is now readable and on-brand, but it is dense: status chips, route link, profile button, and source links all compete in a narrow column. This is acceptable for Phase 3’s scan-first comparison goal and not a blocker.

**Recommendation:** In Phase 4, when copy/queue actions are added, revisit row action hierarchy so install/view actions do not crowd profile/source links.

### Info 2 — Existing app chrome still carries larger legacy display treatments

**Surface:** Header/navigation/sidebar shell.

The Phase 3-specific content now follows the compact UI spec. Some pre-existing shell treatments remain more expressive: all-caps tabs, large brand spacing, and the persistent split layout. These were existing app patterns and are not a Phase 3 blocker.

**Recommendation:** Leave for a broader design-system pass unless Phase 4 needs to change navigation density.

## Conclusion

No blocking UI regressions remain visible after the CSS fixes. The concrete regression was the accidental light-theme card/profile styling; it has been corrected and re-verified in the browser. Phase 3 UI is safe to proceed into Phase 4 from a visual standpoint.

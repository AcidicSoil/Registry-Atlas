# Grouped navigation feature standards review

Scope: Navigation and sidebars only. Passing the targeted evidence check does not certify unrelated project-wide rules or unverified manual accessibility tests.

| Rule | Applicability | Compliance | Grounded reason |
| --- | --- | --- | --- |
| `SKILL.md` | applicable | unevaluated | This skill entrypoint covers more than a single grouped filter interaction; complete domain assessment remains open. |
| `a11y-antipatterns-static.md` | applicable | compliant | Native semantic groups replace clickable noninteractive elements; anti-slop static gate passes. |
| `aria-components.md` | not-applicable | unevaluated | This feature uses native HTML details, summary and buttons, not a React Aria widget. |
| `aria-forms.md` | not-applicable | unevaluated | This change has no React Aria form control; the existing catalog search is unchanged. |
| `focus-keyboard-nav.md` | applicable | compliant | Desktop production E2E exercises Enter on category summary, focus and retained selection. |
| `pour-exit-criteria.md` | applicable | unevaluated | Full WCAG POUR manual exit criteria were not independently verified. |
| `wcag-color-contrast.md` | applicable | unevaluated | No fresh contrast-ratio measurement was performed for nested row and selected states. |
| `wcag-native-html-first.md` | applicable | compliant | Native details/summary are used for category disclosure; mobile dialog uses native HTML showModal. |
| `wcag-semantic-html.md` | applicable | compliant | Navigation uses nav/section/details/summary/buttons with labels, aria-pressed and visible focus ring. |
| `wcag-testing.md` | applicable | unevaluated | No fresh axe-core scan and manual screen-reader audit was performed on this change. |
| `wcag-user-preferences.md` | applicable | unevaluated | Reduced-motion handling exists, but high-contrast, zoom and forced-colors coverage is not fully verified. |
| `SKILL.md` | applicable | unevaluated | This skill entrypoint covers more than a single grouped filter interaction; complete domain assessment remains open. |
| `interaction-cognitive-load-thresholds.md` | applicable | compliant | Only a root category is visible until expanded; filters present bounded nested matches. |
| `interaction-drag-drop.md` | not-applicable | unevaluated | No drag-and-drop control is part of grouped category selection. |
| `interaction-form-ux.md` | not-applicable | unevaluated | No form submission, validation or field workflow was changed. |
| `interaction-infinite-scroll.md` | applicable | compliant | Existing incremental catalog results still work; full integration tests preserve sort/Back state. |
| `interaction-modal-drawer-inline.md` | applicable | compliant | Mobile native navigation dialog closes after a filter selection or Escape, E2E verified. |
| `interaction-persuasion-ethics.md` | not-applicable | unevaluated | This filter change does not include persuasion, nudges or marketing conversions. |
| `interaction-progressive-disclosure.md` | applicable | compliant | Opening a family reveals only its relevant children and does not change query state. |
| `interaction-skeleton-loading.md` | not-applicable | unevaluated | The new category disclosure is local and synchronous; no new pending network view was introduced. |
| `interaction-tabs-overflow.md` | not-applicable | unevaluated | Category disclosures are not tabs; Grid/List uses an existing button group, not tab overflow. |
| `interaction-toast-notifications.md` | not-applicable | unevaluated | Category selection does not show transient notifications. |
| `SKILL.md` | applicable | unevaluated | This skill entrypoint covers more than a single grouped filter interaction; complete domain assessment remains open. |
| `animation-motion.md` | applicable | compliant | Taxonomy disclosure chevron honors prefers-reduced-motion and uses a short transform only. |
| `animation-scroll.md` | not-applicable | unevaluated | No CSS scroll-driven animation is part of this disclosure. |
| `css-intrinsic-responsive.md` | applicable | compliant | Nested category controls use flexible min-width grids within the existing responsive sidebar. |
| `css-patterns.md` | applicable | compliant | Existing layout uses desktop and mobile breakpoints with responsive widths and overflow. |
| `css-subgrid.md` | not-applicable | unevaluated | Nested categories use a simple indented grid; no subgrid alignment requirement exists. |
| `pwa-offline.md` | not-applicable | unevaluated | No offline or app-install behavior changed for the new filters. |
| `pwa-service-worker.md` | not-applicable | unevaluated | No caching, service-worker or offline feature was added. |
| `react-patterns.md` | not-applicable | unevaluated | Registry Atlas category UI is native DOM rather than React component rendering. |
| `responsive-foldables.md` | not-applicable | unevaluated | The user requested desktop and narrow mobile behavior; no foldable dual-screen layout exists. |
| `touch-interaction.md` | applicable | compliant | Native summary and button actions are usable by pointer/tap in mobile E2E tests. |
| `policy:adaptive-panel-surfaces` | applicable | compliant | Existing shared resize/collapse panel controls remain unchanged and are covered by app-shell E2E. |
| `policy:collapsible-sidebar-navigation` | applicable | compliant | Navigation disclosures work with pointer and keyboard; parent sidebar remains collapsible. |
| `policy:light-dismiss` | applicable | compliant | Mobile modal closes on Escape and after filter selection; close state verified in mobile E2E. |
| `policy:logo-home-navigation` | applicable | compliant | Existing branded home links are unchanged; app-shell E2E verifies home routing. |
| `policy:shared-app-shell-interactions` | not-applicable | unevaluated | User explicitly excluded chat/model/workbench composition for this existing native-DOM catalog; related shell mechanics remain applicable under separate policies. |

Browser proof: `tests/grouped-sidebar.e2e.ts`, `tests-mobile/grouped-sidebar.e2e.ts`, and `.design/evidence/grouped-filters/navigation-expanded.png`. No unrelated Workbench chat/model UI was added.

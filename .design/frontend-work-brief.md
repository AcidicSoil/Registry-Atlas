# Registry Atlas app-shell acceptance

Status: Implementation verified in scripted browser; final policy certification depends on the latest complete test run and current PPM baseline review.

## Shell surfaces

| Surface | Route/view | Scroll | Resize | Collapse | Narrow-screen behavior |
| --- | --- | --- | --- | --- | --- |
| Primary left navigation | All catalog routes | `.sidebar-body-scroll` independently scrolls beyond viewport | Shared `#appPanelResize`, pointer and keyboard 190–440 px | `#toggleSidebarPanel` on the sidebar boundary | Native `#mobileSidebarDialog` with open/close and Escape |
| Main content | All catalog routes | `#appContent .content-body` scrolls independently, clipped to viewport | Shared boundary changes available content width | `#toggleContentPanel` on its boundary | Main content remains readable without the desktop separator |
| Registry summary auxiliary panel | `/@logoforge` and other registry collection routes | Summary owns overflow when long | `[data-profile-rail-resize]`, pointer and keyboard 200–400 px | `[data-profile-rail-toggle]` on summary boundary | Summary stacks above inventory; desktop controls hidden |

No separate bottom navigation panel exists in the inspected HTML shell. The nested sidebar **Collections** disclosure is a real `<details>/<summary>` that does not navigate on expand and retains six actual destination links. Search and Grid/List browse controls remain above the scrollable navigation region.

## Acceptance criteria and evidence

1. **Collapsible nested sidebar navigation:** Home/Featured, Authors, Libraries, Collections destinations, Compare navigate via real anchors. Collections expands/collapses with pointer/keyboard; desktop sidebar collapse/reopen keeps navigation reachable. Mobile native dialog opens, dismisses by close/Escape and navigation, returns to app. Evidence: `tests/app-shell-panels.e2e.ts`, `tests-mobile/native-sidebar.e2e.ts`, `tests/registry-explorer/appShellBranding.test.ts`.
2. **Adaptive panel surfaces:** At desktop 1440×900 test shared sidebar/content separator keyboard ArrowRight, 190–440 px clamp, independent collapse and restore; test content and sidebar scrolling separately. Test registry-summary separator 200–400 px and collapse/restore on `/@logoforge`. On mobile 390×844 test drawer. Preserve existing desktop sidebar width across navigation/reload using `localStorage`. Evidence: `tests/registry-explorer/panelLayout.test.ts`, `tests/registry-explorer/registrySummaryPanel.test.ts`, `tests/app-shell-panels.e2e.ts`.
3. **Logo-to-home:** From `/compare`, activate Registry Atlas brand anchor, land at `/Registry-Atlas/`. Keyboard activation uses the same native anchor. Evidence: `tests/registry-explorer/appShellBranding.test.ts`, `tests/app-shell-panels.e2e.ts`.
4. **Browser favicon:** Existing project-owned icon PNG and ICO assets are linked in `index.html`, with description and theme color metadata. Vite rewrites `/registry-atlas/favicon-32x32.png` correctly under `/Registry-Atlas/` (do **not** double-prefix base). Verify actual served URL/MIME and loaded Chromium tab logo. Evidence: `tests/registry-explorer/appShellBranding.test.ts`, `tests/app-shell-panels.e2e.ts`, `.design/evidence/app-shell/ppm-browser-tab-favicon.png`.

Tested independently using project-local deterministic `e2e` runner on the production preview and the existing PPM `registry-atlas` profile. Saved traces under `.e2e/proof/` remain machine-local and ignored. Screenshot evidence is versioned under `.design/evidence/app-shell/`; it does not replace interaction assertions.

## Remaining coverage

Manual assistive-technology/screen-reader verification, full zoom/reflow checks, and baseline's broader 277 applicable OrchestKit rules require further assessment. Four recorded historical remediations need their own current rule-specific disposition; project-wide compliance is not implied by these app-shell tests.

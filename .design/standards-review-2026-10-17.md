# Registry Atlas standards evidence update, 2026-10-17

This review records current project-owned evidence. **It does not certify the whole project.** It supersedes the prior report only for the individually listed controls.

## Verified implementation

- **Nested sidebar navigation:** `index.html` has the correct primary routes and native Collections `<details>/<summary>`, and `src/registry-explorer/entry.ts` uses a native `HTMLDialogElement.showModal()` at mobile widths. Desktop and mobile E2E tests verify navigation, collapse/reopen, and modal close behavior.
- **Panel sizing:** `appShellPanels.ts` and `registryProfilePanel.ts` implement separately collapsible, scrollable navigation/content and registry-summary surfaces. Pointer drag was verified in the dedicated PPM Chromium profile on the shared separator; keyboard resizing, both collapses and restoration passed in `tests/app-shell-panels.e2e.ts`. Narrow screens use a modal navigation equivalent. Existing sidebar width persistence is tested.
- **Brand links:** Both brand links target `/Registry-Atlas/`. A production E2E test navigates from Compare to home.
- **Favicons:** Project-owned PNG/ICO files resolve under the Vite base URL; the production E2E verifies asset response and path. A captured managed Chromium tab proves that the intended blue application icon rendered: `.design/evidence/app-shell/ppm-browser-tab-favicon.png`.
- **Native HTML:** Native mobile `<dialog>` plus `showModal()` replaces a previous custom modal/focus trap in current runtime. `tests-mobile/native-sidebar.e2e.ts` confirms modal semantics, Escape/click closure, and route navigation. The old helper file exists for regression compatibility but is not used by `entry.ts`.
- **Accessible incremental catalog loading:** `infiniteScrollControl.ts` supplies visible Load more fallback, role=feed, positions and set size; `shell.ts` supplies sentinel auto loading, polite result count, and stored Back-navigation restoration in `browseHistory.ts`. `tests/infinite-scroll.e2e.ts` verifies expansion, auto-load, absence of numeric pagination, feed metadata, and session-stored/restored scroll offset.

## Test results

- `pnpm verify`: **599 passing, 8 optional skips**, zero known dependency vulnerabilities, zero data-validation errors, production build passed (completed during the app-shell implementation).
- Current full desktop browser run: **11 of 11 passing** across six E2E files, including the non-payment setup-cart route and upstream SVG preview.
- Current mobile browser run: **1 of 1 passing**, native dialog/route flow.
- Follow-up targeted browser run after strengthening hydration and Back restoration checks: **4 of 4 passing**.
- Current screenshots: `.design/evidence/app-shell/ppm-desktop-registries.png`, `.design/evidence/app-shell/ppm-browser-tab-favicon.png`, `.design/evidence/app-shell/ppm-mobile-850.png`.
- Browser traces: `.e2e/proof/desktop-full-20261017/`, `.e2e/proof/mobile-20261017/`, `.e2e/proof/setup-scroll-corrected-20261017/` (local ignored runtime artifacts, not version-controlled).

## Unresolved areas

- New shared-workbench parity policy requires a user-facing scope decision. See `.design/workbench-shell-gap-2026-10-17.md`; do not claim parity or invent approval.
- A fresh scan using `scripts/check-commit-message.mjs` rejects 83 of 308 historic non-merge commits (including current pushed HEAD for its long subject). GitHub Actions validates future commit subjects, but shared history must not be rewritten without a separate user decision.
- `pnpm audit --audit-level low` reports zero known vulnerabilities and the production build generates a CycloneDX SBOM for 553 pinned dependencies. The independent trusted publisher is not configured, so actual release provenance/attestation cannot yet be verified.
- The 277 other applicable OrchestKit rules have not received fresh rule-by-rule behavioral reviews. Accessiblity assistive-technology and full zoom/reflow audits remain unverified.
- React Grab is not a first-party DOM inspection verifier: `DESIGN.md` and `src/registry-explorer/entry.ts` document that this app mounts its UI through native DOM APIs instead of a React root. Mere installation does not show working React element selection.

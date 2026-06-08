---
phase: 04-install-actions-release-hardening
plan: 04-04-release-hardening-smoke
type: implementation
wave: 4
depends_on: [04-03-url-state]
files_modified:
  - .github/workflows/deploy.yml
  - package.json
  - .planning/phases/04-install-actions-release-hardening/04-BROWSER-A11Y-SMOKE.md
  - README.md
autonomous: true
requirements: [HARD-02, HARD-05, HARD-06, INST-01, INST-02, INST-03, INST-04, INST-05, INST-06]
must_haves:
  truths:
    - "D-14: `pnpm verify` remains the local release gate."
    - "D-15: CI must verify typecheck, test typecheck, Vitest, data validation, and production build before release/deploy."
    - "D-16: Add targeted tests for command generation, queue dedupe, URL state parsing/serialization, and disabled copy/queue reasons."
    - "D-17: Browser smoke checks must cover copy buttons, disabled states, queue flow, tab/search URL restoration, and profile/discovery link behavior."
    - "D-18: Accessibility baseline must cover keyboard-reachable controls, visible focus, button labels, and visible or announced copy feedback."

---

<objective>
Harden the release path by making `pnpm verify` the CI deploy gate, documenting and executing browser/accessibility smoke checks for install actions, queue, URL state, safe links, disabled states, and static GitHub Pages assumptions.
</objective>

<must_haves>
- D-14: `pnpm verify` remains the local release gate.
- D-15: CI verifies typecheck, test typecheck, Vitest, data validation, and production build before release/deploy.
- D-16: Targeted tests exist for command generation, queue dedupe, URL state parsing/serialization, and disabled copy/queue reasons.
- D-17: Browser smoke checks cover copy buttons, disabled states, queue flow, tab/search URL restoration, and profile/discovery link behavior.
- D-18: Accessibility baseline covers keyboard-reachable controls, visible focus, button labels, and visible or announced copy feedback.
- Static Vite/GitHub Pages deployment under `/Registry-Atlas/` remains the target; no backend or browser-executed installs.
- Community registry code remains third-party; docs and UI must not claim audit, certification, approval, or safety endorsement.
</must_haves>

<threat_model>
- Assets: release integrity, deployed GitHub Pages artifact, user safety when copying commands, accessibility baseline, and neutral third-party provenance posture.
- Threats: CI deploying untested code; release docs omitting manual smoke causing broken copy/queue/URL state; a11y regressions in keyboard/copy feedback; docs implying Registry Atlas audits community code; stale shadcn CLI command syntax; static base path regressions.
- Controls: deploy workflow runs `pnpm verify`; documentation lists exact smoke scenarios and neutral wording; final local `pnpm verify` and browser smoke against `/Registry-Atlas/`; optional CLI help recheck before changing command syntax; no extra trust badges.
- High severity gate: if CI can deploy without `pnpm verify`, if browser smoke reveals wrong command text, or if UI/docs imply third-party safety certification, block release until fixed.
</threat_model>

<tasks>
<task id="T1" title="Make GitHub Pages deploy run the full release gate">
  <read_first>
    - .github/workflows/deploy.yml
    - package.json
    - pnpm-lock.yaml
    - .planning/phases/04-install-actions-release-hardening/04-RESEARCH.md
    - .planning/codebase/STACK.md
  </read_first>
  <action>
    Update `.github/workflows/deploy.yml` so the deploy job runs `pnpm verify` after `pnpm install --frozen-lockfile` and before `actions/configure-pages`/`actions/upload-pages-artifact`. Since `pnpm verify` ends with `pnpm build`, keep artifact upload path `./dist`. Add clear step names if helpful. Keep Node 20 and pnpm 9 compatibility. Only modify `package.json` if adding a small documented smoke script is chosen; do not replace `verify` with a weaker script.
  </action>
  <verify>
    Run a YAML/source assertion such as inspecting `.github/workflows/deploy.yml`, then run `pnpm verify` locally.
  </verify>
  <acceptance_criteria>
    - `.github/workflows/deploy.yml` contains `pnpm verify` before Pages artifact upload/deploy.
    - There is no deploy path that only runs `pnpm build` without tests/data validation/typechecks.
    - `package.json` still defines `verify` as typecheck, test typecheck, Vitest, data validation, and build.
    - `pnpm verify` passes locally before phase completion, or blockers are documented with exact failing output.
  </acceptance_criteria>
</task>

<task id="T2" title="Document release browser and accessibility smoke baseline">
  <read_first>
    - .planning/phases/04-install-actions-release-hardening/04-RESEARCH.md
    - .planning/phases/04-install-actions-release-hardening/04-CONTEXT.md
    - .planning/phases/03-component-first-discovery/03-UI-REVIEW.md
    - README.md
    - package.json
    - public/styles/registry-explorer.css
  </read_first>
  <action>
    Create `.planning/phases/04-install-actions-release-hardening/04-BROWSER-A11Y-SMOKE.md` with exact smoke checklist, setup commands, expected command strings, static base path `/Registry-Atlas/`, and accessibility assertions. Include scenarios for copy install/view, disabled reasons, duplicate queue dedupe, remove/clear/copy batch, profile row behavior, safe homepage/source/raw item links, URL restoration, queue non-restoration, keyboard reachability, focus visibility, specific accessible labels, and visible/announced copy feedback. Update `README.md` only if it already has a release/verification section or a concise pointer is appropriate.
  </action>
  <verify>
    Read the created smoke document and confirm every D-17/D-18 scenario is listed with objective expected results.
  </verify>
  <acceptance_criteria>
    - Smoke doc includes exact expected examples for `npx shadcn@latest add @<registry>/<item>` and `npx shadcn@latest view @<registry>/<item>`.
    - Smoke doc explicitly says Registry Atlas does not audit/certify third-party registry code and does not execute installs in the browser.
    - Smoke doc lists `/Registry-Atlas/` as the browser path for Vite dev/preview verification.
    - Smoke doc covers all listed D-17 and D-18 checks with pass/fail observable outcomes.
  </acceptance_criteria>
</task>

<task id="T3" title="Run final automated release verification">
  <read_first>
    - package.json
    - src/registry-explorer/core/installActions.ts
    - src/registry-explorer/core/installQueue.ts
    - src/registry-explorer/core/urlState.ts
    - tests/registry-explorer/installActions.test.ts
    - tests/registry-explorer/installQueue.test.ts
    - tests/registry-explorer/urlState.test.ts
    - .github/workflows/deploy.yml
  </read_first>
  <action>
    Run the automated release gate and targeted commands: `pnpm typecheck`, `pnpm typecheck:test`, `pnpm test`, `pnpm validate:data`, `pnpm build`, and `pnpm verify`. If command syntax changed from the Phase 04 decisions, rerun `npm view shadcn version`, `npm exec shadcn@latest -- add --help`, and `npm exec shadcn@latest -- view --help`; otherwise document that the research-confirmed syntax remains unchanged.
  </action>
  <verify>
    Capture command output in the execution summary or final phase summary. Do not fabricate passing output; if a command fails, fix or document the blocker with exact output.
  </verify>
  <acceptance_criteria>
    - All automated checks pass locally, including `pnpm verify`, or exact blockers are recorded.
    - Test suite includes coverage for command generation, queue dedupe, URL state parse/serialize, and disabled reasons.
    - Production build emits `dist/` for Pages upload.
  </acceptance_criteria>
</task>

<task id="T4" title="Execute browser smoke and record results">
  <read_first>
    - .planning/phases/04-install-actions-release-hardening/04-BROWSER-A11Y-SMOKE.md
    - vite.config.ts
    - index.html
    - public/styles/registry-explorer.css
    - src/registry-explorer/ui/shell.ts
    - src/registry-explorer/ui/discoveryView.ts
    - src/registry-explorer/ui/registryProfileView.ts
  </read_first>
  <action>
    Serve the app with `pnpm dev --host 127.0.0.1` or build then `pnpm preview --host 127.0.0.1`. Open the app at `/Registry-Atlas/` and execute every scenario in `04-BROWSER-A11Y-SMOKE.md`. Record results in the smoke document or a final phase summary, including command text observed/copied, disabled reason examples, queue dedupe result, URL restoration URLs, safe-link observations, keyboard/focus findings, and copy feedback behavior.
  </action>
  <verify>
    Confirm the browser smoke checklist is fully checked or each failed item has a linked fix/blocker. Re-run relevant automated checks after fixes.
  </verify>
  <acceptance_criteria>
    - Browser smoke confirms copy install/view command strings match exact Phase 04 syntax for at least one real route-eligible item.
    - Browser smoke confirms disabled copy/queue reasons for at least one fallback/unavailable candidate.
    - Browser smoke confirms duplicate queue item dedupes to one batch token and queue does not restore from URL/reload.
    - Browser smoke confirms homepage/source/raw item links behave safely and profile/discovery action behavior matches.
    - Keyboard-only and copy-feedback a11y baseline checks pass or blockers are explicitly recorded before release.
  </acceptance_criteria>
</task>
</tasks>

<verification>
- Source assertion: `.github/workflows/deploy.yml` runs `pnpm verify` before Pages upload/deploy.
- `pnpm typecheck`
- `pnpm typecheck:test`
- `pnpm test`
- `pnpm validate:data`
- `pnpm build`
- `pnpm verify`
- Browser/a11y smoke documented in `.planning/phases/04-install-actions-release-hardening/04-BROWSER-A11Y-SMOKE.md` against `/Registry-Atlas/`.
</verification>

<success_criteria>
- CI deploy path is no weaker than local release gate.
- Maintainers have documented browser/a11y smoke coverage for install actions, queue, URL state, safe links, and accessibility baseline.
- Final verification proves build, tests, validation, deployment assumptions, URL state, and accessibility baseline are release-ready.
</success_criteria>

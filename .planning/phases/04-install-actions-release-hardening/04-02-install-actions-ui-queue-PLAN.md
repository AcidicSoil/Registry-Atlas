---
phase: 04-install-actions-release-hardening
plan: 04-02-install-actions-ui-queue
type: implementation
wave: 2
depends_on: [04-01-install-action-core]
files_modified:
  - src/registry-explorer/ui/discoveryView.ts
  - src/registry-explorer/ui/registryProfileView.ts
  - src/registry-explorer/ui/shell.ts
  - src/registry-explorer/ui/renderSafety.ts
  - public/styles/registry-explorer.css
  - tests/registry-explorer/renderSafety.test.ts
autonomous: true
requirements: [INST-01, INST-02, INST-03, INST-04, INST-05, INST-06, HARD-06]
must_haves:
  truths:
    - "D-01: UI consumes only core action state for route eligibility and does not synthesize commands from display labels."
    - "D-04: Disabled action UI shows clear unavailable reasons instead of guessed commands."
    - "D-06: Queue only validated route-eligible items."
    - "D-07: Deduplicate queued items by the full install token: `@<registry>/<item>`."
    - "D-08: Batch command format is `npx shadcn@latest add @foo/button @bar/card` with deduped tokens after `add`."
    - "D-09: The queue appears as a compact action panel in the Discover flow, with add/remove/clear/copy affordances."
    - "D-10: Queue controls must not imply Registry Atlas has audited third-party code; source/inspect-before-install affordances remain available."

---

<objective>
Render safe copy/install/inspect actions, explicit disabled reasons, safe homepage/source/raw item links, and a compact local install queue in the Discover/profile UI while preserving the vanilla TypeScript shell/render architecture.
</objective>

<must_haves>
- D-01 through D-05 remain enforced by consuming only core action state from Plan 04-01; UI must not synthesize commands from display labels.
- D-06: Add-to-queue affordances only appear enabled for validated route-eligible action states.
- D-07: Queue UI uses full install token as its identity.
- D-08: Batch copy uses the core batch command format exactly.
- D-09: Queue appears as a compact action panel in the Discover flow with add/remove/clear/copy affordances.
- D-10: Queue/copy UI must not imply Registry Atlas has audited third-party code; inspect-before-install and source/profile links stay visible.
- All external links use `renderExternalLink()`/`toSafeExternalUrl()` or equivalent safe helpers; unsupported protocols render as non-clickable unavailable copy.
- No browser execution of shadcn installs; actions copy strings only.
</must_haves>

<threat_model>
- Assets: generated command text, clipboard writes, URL/link targets, and user trust in third-party registry code.
- Threats: XSS through unescaped commands/tokens/reasons in `innerHTML`; unsafe `javascript:`/protocol-relative links; clipboard failures causing silent wrong state; crowded UI hiding inspect/source warnings; disabled controls becoming clickable spans; implied endorsement of community code.
- Controls: escape every data attribute/text insertion with `escapeHtml`, render anchors only through safe link helpers, use real `<button>` elements with `disabled`, keep command text visible/announced on copy failure, keep inspect/source links near install actions, avoid trust/audit wording.
- High severity gate: if any untrusted registry/item/source value reaches an unescaped HTML context or unsafe anchor, stop and fix before shipping.
</threat_model>

<tasks>
<task id="T1" title="Render candidate/profile install action controls from core state">
  <read_first>
    - src/registry-explorer/core/installActions.ts
    - src/registry-explorer/core/discovery.ts
    - src/registry-explorer/core/registryProfile.ts
    - src/registry-explorer/ui/discoveryView.ts
    - src/registry-explorer/ui/registryProfileView.ts
    - src/registry-explorer/ui/renderSafety.ts
    - public/styles/registry-explorer.css
    - .planning/phases/03-component-first-discovery/03-UI-REVIEW.md
  </read_first>
  <action>
    Update `renderDiscoveryContent()`/`renderCandidate()` and `renderRegistryProfile()`/`renderItems()` to render action groups for eligible core action states: Copy install, Copy view, Add to queue or Remove from queue, profile, homepage/source, and raw item route. Disabled action states must render visible disabled buttons plus adjacent reason text. Use data attributes such as `data-copy-command`, `data-queue-add`, `data-queue-remove`, and escaped token/label metadata. Keep item route as the raw item link; do not render unresolved `registryUrlTemplate` as an anchor.
  </action>
  <verify>
    Run `pnpm typecheck`; visually inspect generated markup in browser or via DOM string assertions if tests are added.
  </verify>
  <acceptance_criteria>
    - Eligible discovery candidates and profile item rows render real buttons for copy install, copy view, and queue add/remove.
    - Ineligible/fallback/unavailable rows render disabled buttons with a visible reason string and no copy/queue data-command that could be invoked.
    - Homepage, official source, and raw item route links are clickable only when `toSafeExternalUrl()` accepts them.
    - The action hierarchy keeps status/inspect/source/profile information visible and does not remove Phase 3 coverage/confidence/status indicators.
  </acceptance_criteria>
</task>

<task id="T2" title="Own local queue state and clipboard side effects in shell">
  <read_first>
    - src/registry-explorer/core/installQueue.ts
    - src/registry-explorer/core/installActions.ts
    - src/registry-explorer/ui/shell.ts
    - src/registry-explorer/ui/discoveryView.ts
    - src/registry-explorer/ui/registryProfileView.ts
    - public/styles/registry-explorer.css
  </read_first>
  <action>
    Extend `AppState` in `src/registry-explorer/ui/shell.ts` with local queue entries and copy feedback. Add delegated handlers in `roots.contentBody` and/or `roots.aside` for `data-copy-command`, `data-queue-add`, `data-queue-remove`, `data-queue-clear`, and batch copy. Clipboard writes use `navigator.clipboard.writeText` when available and render visible or `aria-live` success/failure feedback; on failure, keep the command text visible for manual copy. Pass queue state and batch command state into `renderDiscoveryAside()` or a new compact queue panel renderer in `discoveryView.ts`.
  </action>
  <verify>
    Run `pnpm typecheck` and manual browser smoke for add duplicate, remove, clear, copy batch, and clipboard failure fallback if possible.
  </verify>
  <acceptance_criteria>
    - Queue entries persist while navigating Discover/profile tabs in the same page session but are not stored outside shell state.
    - Adding a duplicate token does not create duplicate visible chips/rows or duplicate batch command tokens.
    - Batch copy is disabled or shows no command when queue is empty; enabled queue renders exact core batch command when non-empty.
    - Copy success/failure feedback is visible and/or announced with `aria-live="polite"`, and command strings remain available for manual copy.
  </acceptance_criteria>
</task>

<task id="T3" title="Style action, disabled, queue, focus, and feedback states">
  <read_first>
    - public/styles/registry-explorer.css
    - src/registry-explorer/ui/discoveryView.ts
    - src/registry-explorer/ui/registryProfileView.ts
    - .planning/phases/03-component-first-discovery/03-UI-REVIEW.md
  </read_first>
  <action>
    Add semantic CSS classes for install action groups, primary/secondary copy buttons, disabled action reasons, queue panel, queue token chips, batch command display, copy feedback, and visible focus states. Preserve the dark compact visual system and responsive row behavior. Ensure all interactive buttons/links have visible focus indicators in the dark theme.
  </action>
  <verify>
    Run `pnpm build`; perform browser visual check at `/Registry-Atlas/` for desktop and narrow viewport layouts.
  </verify>
  <acceptance_criteria>
    - `public/styles/registry-explorer.css` contains no inline-style-dependent requirements for new controls.
    - Buttons, links, search, tabs, and queue controls have visible focus styles.
    - Discovery rows and profile item rows remain readable at max-width below 760px with actions stacked below content.
    - Disabled reasons are legible and not color-only; disabled controls are visibly distinct from enabled controls.
  </acceptance_criteria>
</task>

<task id="T4" title="Verify safe link behavior for install-adjacent links">
  <read_first>
    - src/registry-explorer/ui/renderSafety.ts
    - tests/registry-explorer/renderSafety.test.ts
    - src/registry-explorer/ui/discoveryView.ts
    - src/registry-explorer/ui/registryProfileView.ts
  </read_first>
  <action>
    Add or update tests around `toSafeExternalUrl()`/`renderExternalLink()` as needed for source/homepage/raw item link use cases, including protocol-relative URLs and unsupported protocols. Keep raw catalog behavior explicit: unresolved templates are displayed as facts, not anchors; raw item links are resolved route URLs only.
  </action>
  <verify>
    Run `pnpm test -- tests/registry-explorer/renderSafety.test.ts` and `pnpm verify` after UI integration is complete.
  </verify>
  <acceptance_criteria>
    - Tests prove `javascript:`, `data:`, and `//host/path` inputs do not render anchors.
    - Valid `http:` and `https:` source/homepage/raw item route URLs render anchors with escaped href/label and `rel="noreferrer"`.
    - No renderer creates an external `<a>` tag without calling `renderExternalLink()` or a reviewed equivalent helper.
  </acceptance_criteria>
</task>
</tasks>

<verification>
- `pnpm typecheck`
- `pnpm test -- tests/registry-explorer/renderSafety.test.ts tests/registry-explorer/installActions.test.ts tests/registry-explorer/installQueue.test.ts`
- `pnpm build`
- Browser smoke at `/Registry-Atlas/`: copy install/view, disabled reasons, add duplicate/remove/clear/copy queue, homepage/source/raw item links, profile item actions, keyboard tab order/focus.
</verification>

<success_criteria>
- Users can copy exact single-item add/view commands, add validated items to a deduped local queue, and copy a batch command.
- Users see clear reasons for disabled copy/queue actions.
- Users can open safe homepage/source/raw item links from discovery and profile views without unsafe protocols or invented raw catalog links.
- UI satisfies the targeted HARD-06 baseline for keyboard-reachable real controls, visible focus, specific button labels, and copy feedback.
</success_criteria>

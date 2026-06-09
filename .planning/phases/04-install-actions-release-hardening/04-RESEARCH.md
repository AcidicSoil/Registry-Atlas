# Phase 04 Research — Install Actions & Release Hardening

## Scope and inputs reviewed

Reviewed Phase 04 context, requirements, state, roadmap, current app code, tests, deploy workflow, Vite config, CSS, and Phase 03 UI review. Also checked current shadcn CLI help with `npm exec shadcn@latest -- --help`, `add --help`, and `view --help`.

CLI check result: latest published `shadcn` is `4.11.0`; commands include `add [components...]` and `view <items...>`, where arguments are item addresses. This supports the phase-decided command shapes:

```bash
npx shadcn@latest add @<registry>/<item>
npx shadcn@latest view @<registry>/<item>
```

For this repo, registry names in runtime data already include the leading `@`, so token generation must normalize to exactly one leading `@`.

## Requirements mapping

| Requirement | Planner needs to account for |
|---|---|
| INST-01 | Add pure command generation for single install commands only when namespace + item slug + route eligibility are validated. UI copy action should use exactly `npx shadcn@latest add @<registry>/<item>`. |
| INST-02 | Same eligibility boundary as INST-01, but command is exactly `npx shadcn@latest view @<registry>/<item>`. Treat inspect-before-install as a first-class action, not a secondary afterthought, because registries are third-party code. |
| INST-03 | Current UI already links homepage, official source, and item route in some places. Phase 04 should make source/homepage/raw catalog/raw item links explicit, safe, and available from Discover and profile views. Do not render unsupported URL protocols as anchors. |
| INST-04 | Queue state should live in `src/registry-explorer/ui/shell.ts` local state for v1; pure queue helpers should dedupe by full install token and produce `npx shadcn@latest add <token...>`. Do not persist queue in URL. |
| INST-05 | Add pure disabled-reason logic for invalid namespace, missing/invalid slug, missing template/source URL, unavailable route, unverified/inferred/fallback candidate, and unsafe URL. UI must show a clear disabled reason instead of guessed commands. |
| INST-06 | Keep all command/token/eligibility/queue/URL-state logic in `src/registry-explorer/core/` with Vitest coverage independent from DOM. Renderers should receive derived action state. |
| HARD-02 | `.github/workflows/deploy.yml` currently runs only `pnpm build`. It needs a release-gate step equivalent to `pnpm verify` so CI covers typecheck, test typecheck, Vitest, data validation, and production build before upload/deploy. Consider Pages/static base assumptions in the build check. |
| HARD-05 | Add pure URL-state parse/serialize for selected view/tab, query, selected profile/registry, and relevant focus/component selection. Hydrate initial shell state from `window.location`, update with `history.replaceState`, and safely ignore stale/invalid params. Queue must remain local only. |
| HARD-06 | Add/document targeted a11y/browser smoke checks for search, tabs, copy buttons, disabled states, links, and queue controls. The current repo has no Playwright/Cypress/axe dependency, so the planner should decide whether to document manual smoke only or add a minimal automated smoke script. |

## Existing code insights and integration points

### Command generation and route eligibility

- `src/registry-explorer/core/itemRoutes.ts` already validates item route prerequisites:
  - slug exists and matches `^[a-z0-9]+(?:-[a-z0-9]+)*$`;
  - namespace starts with `@`;
  - registry URL template includes `{name}`;
  - resolved URL is absolute `http:` or `https:` and not protocol-relative.
- `searchComponentCandidates()` in `src/registry-explorer/core/discovery.ts` only resolves `candidate.route` when `item.routeEligible && registry.mirror` and the resolved route is available.
- `buildRegistryProfile()` in `src/registry-explorer/core/registryProfile.ts` repeats item route resolution for profile rows.
- New command action logic should reuse `resolveRegistryItemRoute()` rather than duplicate URL/template validation. A likely new module is `src/registry-explorer/core/installActions.ts` with functions such as:
  - `buildInstallToken(namespace, itemSlug)`;
  - `getInstallActionState({ namespace, itemSlug, routeEligible, route })`;
  - `buildSingleInstallCommand(token)`;
  - `buildInspectCommand(token)`;
  - `buildBatchInstallCommand(tokens)`.
- Eligibility should be stricter than “has item-like text”: fallback candidates from tag/alias/focus/namespace/description are not command-eligible.

### Disabled reasons

Current UI disabled messaging is coarse:

- Discover fallback route text is either `Catalog not verified` or `Item route unavailable`.
- Profile item rows show `Catalog not verified` for all unavailable routes.

Phase 04 needs reason-specific states, ideally produced by pure core logic and rendered consistently. Useful reasons to represent:

- missing namespace;
- namespace missing `@` or malformed after normalization;
- missing item slug;
- invalid item slug;
- missing registry mirror/template;
- invalid route/template/URL from `resolveRegistryItemRoute()`;
- catalog/item not route eligible;
- candidate is inferred/fallback rather than a validated item;
- unsupported/unsafe source URL for link rendering.

### Queue state

- `src/registry-explorer/ui/shell.ts` owns all app state in the closure-local `AppState` and handles event delegation. It is the right integration point for queue state and copy handlers.
- Queue should be local state only, likely as an array of install action items or tokens. Deduping should happen in pure core (`dedupeInstallTokens()` or `addToInstallQueue()`), keyed by full token (`@registry/item`), not by candidate ID.
- The compact queue panel can be rendered in the Discover aside or as a small panel above Discover results. The Phase 04 context explicitly prefers the Discover flow. If rendered in the aside, `renderDiscoveryAside()` needs queue view-model input and shell click delegation for add/remove/clear/copy.
- Queue actions should not be added to focus/matrix rows unless the planner explicitly expands scope; they lack validated item slugs in most cases.

### URL state

- Existing initial state in `shell.ts` defaults to Discover with empty search and no selected profile.
- There is no URL state currently. Browser state integration should be a boundary in `shell.ts`, with pure parsing/serialization in a new core module, e.g. `src/registry-explorer/core/urlState.ts`.
- Suggested URL params:
  - `view=discover|focus|component|matrix`;
  - `q=<search>`;
  - `registry=@namespace` when a profile is selected;
  - `candidate=<id>` only if the planner accepts candidate IDs as stable enough; otherwise omit and derive profile without selected candidate context;
  - `focus=<primary_focus>` and `component=<component_tag>` for secondary view selections.
- `roots.searchInput.value` must be set during hydration so DOM and state stay aligned.
- Use `history.replaceState` on state updates to avoid creating a history entry for every keystroke; no queue data in URL.

### Links and raw URLs

- `src/registry-explorer/ui/renderSafety.ts` provides `toSafeExternalUrl()` and `renderExternalLink()` and rejects protocol-relative/unsupported protocols.
- Discover currently renders:
  - item route when available;
  - registry homepage;
  - official source URL from mirror metadata.
- Profile currently renders homepage/source facts and item route links.
- “Raw catalog” can be represented by the registry URL template as a fact, but it is not directly openable until `{name}` is replaced. For item rows/candidates, the raw item link is the resolved item route. Planner should avoid opening unresolved templates as links unless there is a separate catalog URL in data.
- `RegistryItemSummary` has `source` and `provenance` strings, not source URL fields. Do not invent item source links from these labels.

### UI renderers and event delegation

Likely renderer changes:

- `src/registry-explorer/ui/discoveryView.ts`
  - receive an action state map or candidate action view models;
  - render Copy install, Copy view, Add to queue buttons for eligible item candidates;
  - render disabled buttons with visible reason for ineligible candidates;
  - keep source/profile links lower in hierarchy to avoid crowding noted by Phase 03 UI review.
- `src/registry-explorer/ui/registryProfileView.ts`
  - add install/view/copy/queue affordances to profile item rows;
  - include link actions for homepage, official source, and raw item route where available;
  - keep official facts vs Atlas enrichment boundary visible.
- `src/registry-explorer/ui/shell.ts`
  - hydrate/sync URL state;
  - own queue state;
  - handle `data-copy-command`, `data-queue-add`, `data-queue-remove`, `data-queue-clear`, and back/profile/search delegation;
  - render visible or announced copy feedback.
- `public/styles/registry-explorer.css`
  - add semantic classes for install actions, disabled reasons, copy feedback, queue panel, and focus states; avoid inline styles.

### CI/release hardening

- `package.json` already has `pnpm verify` with the intended local release gate: `typecheck`, `typecheck:test`, `test`, `validate:data`, `build`.
- `.github/workflows/deploy.yml` currently installs and runs only `pnpm build`; it does not run tests, test typecheck, or data validation before deploy.
- Recommended minimal change: replace the `pnpm build` step with `pnpm verify` before `configure-pages`; since `verify` ends with build, `dist` will still exist for upload.
- Consider a job name/step label that makes the release gate obvious. The existing Pages permissions/deploy steps can stay.
- CI uses Node 20 and pnpm 9. Local environment may be newer (`node -v` reported v24.15.0 and pnpm 11.1.3), so do not rely on Node 24-only APIs in app/scripts.

### Tests

Current tests are DOM-free Vitest tests under `tests/registry-explorer/`, focused on pure core modules. Add new tests in the same style:

- `installActions.test.ts`
  - exact install/view command strings;
  - namespace normalization to exactly one leading `@`;
  - invalid namespace/slug/template/route disabled states;
  - no commands for fallback/inferred/non-route-eligible items;
  - batch command order and dedupe by full token.
- `installQueue.test.ts` if queue is separate from actions;
  - add/remove/clear;
  - dedupe by `@registry/item`;
  - batch command disabled when empty.
- `urlState.test.ts`
  - parse valid params;
  - serialize state;
  - invalid/stale view/focus/component/registry params fall back safely;
  - queue params are ignored/not serialized.
- Existing `discovery.test.ts`, `registryProfile.test.ts`, and `itemRoutes.test.ts` may need updates to include action-state fields if view models change.

## Recommended approach / plan decomposition

### Wave 1 — Pure install action primitives

Dependencies: none beyond existing `itemRoutes.ts` and schema types.

Deliverables:

- New core module(s) for install token validation, command generation, eligibility, disabled reasons, and batch queue dedupe.
- Unit tests for INST-01, INST-02, INST-05, INST-06, and part of INST-04.
- Optional refactor so discovery/profile builders expose shared action state instead of renderers inferring eligibility.

Why first: reduces risk before touching the dense DOM/UI layer and preserves pure-core-first architecture.

### Wave 2 — Discover/profile UI actions and local queue

Dependencies: Wave 1 action view models.

Deliverables:

- Discover row action hierarchy with copy install, copy view, add/remove queue, source/profile links, and disabled reason display.
- Profile item-row action affordances matching Discover eligibility.
- Local queue state in `shell.ts`, compact queue panel, deduped batch command copy, remove/clear controls.
- Clipboard handler with visible/announced feedback and fallback behavior when `navigator.clipboard` is unavailable or rejected.
- CSS for action layout, disabled controls, queue panel, and focus states.

Why second: UI needs stable action states and queue primitives.

### Wave 3 — URL state and shareable discovery context

Dependencies: stable shell state shape from Wave 2.

Deliverables:

- Pure URL state module and tests.
- Hydrate initial app state from URL before first render.
- Sync view/search/selection/profile state back to URL with safe fallback.
- Ensure queue never serializes to URL.

Why third: queue should stay local and the final state model should be known before URL serialization is locked.

### Wave 4 — Release hardening, docs, and smoke verification

Dependencies: all behavior implemented.

Deliverables:

- Update `.github/workflows/deploy.yml` to run `pnpm verify` before Pages upload/deploy.
- Add or update documentation for release/browser/a11y smoke checks.
- Run `pnpm verify` locally.
- Browser smoke against `/Registry-Atlas/` with Vite dev or preview:
  - copy install/view buttons;
  - disabled states/reasons;
  - add/remove/clear/copy queue flow;
  - tab/search/profile URL restoration;
  - homepage/source/raw item links;
  - keyboard reachability and focus visibility.

Why fourth: CI/docs should reflect final scripts and UI surfaces.

## Validation architecture

### Automated commands to require before phase completion

```bash
pnpm typecheck
pnpm typecheck:test
pnpm test
pnpm validate:data
pnpm build
pnpm verify
```

`pnpm verify` should remain the local release gate and become the deploy workflow gate. If CI runs `pnpm verify`, a separate `pnpm build` step is redundant unless retained for clearer logs after `verify`.

### CLI behavior check

The research run confirmed current `shadcn@latest` exposes `add [components...]` and `view <items...>`. Final implementation should not execute install commands in the browser. If copy text changes late in the phase, rerun:

```bash
npm view shadcn version
npm exec shadcn@latest -- add --help
npm exec shadcn@latest -- view --help
```

### Browser smoke checks

Run the static app at the GitHub Pages base path. Either of these are appropriate:

```bash
pnpm dev --host 127.0.0.1
# open http://127.0.0.1:5173/Registry-Atlas/
```

or after build:

```bash
pnpm build
pnpm preview --host 127.0.0.1
# open the preview URL under /Registry-Atlas/
```

Smoke scenarios to document/execute:

1. Search for a known route-eligible item such as `button`; copy install command; confirm copied/rendered command is `npx shadcn@latest add @8bitcn/button` or another exact available token.
2. Copy inspect command for the same item; confirm `npx shadcn@latest view @8bitcn/button`.
3. Add multiple items to queue, add a duplicate, verify one deduped batch command.
4. Remove one queued item and clear queue.
5. Search/select a fallback or unavailable candidate and verify buttons are disabled with a reason, not absent or guessed.
6. Open registry profile and verify profile item rows have the same eligibility behavior.
7. Verify homepage, official source, and raw item route links are anchors only when safe.
8. Change tab/search/profile state, reload/share URL, and verify restoration. Confirm queue is not restored from URL.
9. Keyboard-only pass: Tab reaches search, tabs, copy buttons, disabled controls, queue controls, profile/back links; visible focus is present.
10. Screen-reader baseline: copy buttons have action-specific accessible labels; copy feedback is visible or announced via an `aria-live` region.

### A11y baseline details

HARD-06 does not require a full automated accessibility suite, but the planner should require a documented baseline. Minimum acceptance:

- All interactive elements are real `<button>` or `<a>` elements.
- Disabled actions use `disabled` plus adjacent/associated visible reason text; avoid clickable spans.
- Copy buttons include specific labels, e.g. `Copy install command for @8bitcn/button`.
- Queue count and copy result have visible text and/or `aria-live="polite"` feedback.
- Tab buttons maintain keyboard reachability; if using `role="tab"`, consider `aria-selected` alignment with `.tab-active`.
- Focus indicators are visible in the dark theme for buttons, links, search, and queue controls.

## Risks and landmines specific to this repo

- **Namespace double-`@` risk:** runtime registry names include `@`; command token building must not produce `@@registry/item`.
- **Inferred/fallback candidates:** many search results come from tags/aliases/metadata and do not have an actual item slug. Generating commands from matched labels would violate phase decisions.
- **Route eligibility vs catalog status:** `routeEligible` is the current explicit item-level flag. Do not treat `catalogStatus: partial` or `coverageStatus: inferred` alone as command-eligible.
- **Raw catalog ambiguity:** data has `registry_url_template` and resolved item routes, but no separate per-registry raw catalog URL. Avoid inventing unresolved catalog links.
- **Clipboard API fragility:** clipboard writes can fail outside secure contexts or due to permissions. Always render the command text or provide failure feedback.
- **Dense action column:** Phase 03 UI review already warned that Discover row actions were dense before adding copy/queue. Plan UI hierarchy carefully.
- **Unsafe link rendering:** all URL-derived anchors must go through `renderExternalLink()` / `toSafeExternalUrl()` or equivalent; community registry data is untrusted.
- **CI currently under-gates deploy:** only `pnpm build` runs in Pages deploy. HARD-02 is not satisfied until tests and data validation are included.
- **Codebase docs are partially stale:** `.planning/codebase/ARCHITECTURE.md` still describes static TS data as the primary source, while current code fetches `public/data/registries.json` via `loadRegistries()`. Trust current code over older codebase map details.
- **No DOM/E2E test harness:** current tests are pure Vitest without jsdom/Playwright. Keep core logic tested; if automated browser/a11y tests are desired, that is additional tooling scope.
- **Node version mismatch:** CI is Node 20; local tool output showed Node 24. Avoid APIs unavailable in Node 20.

## Planning recommendations

- Plan Phase 04 as four waves: pure action core, UI/queue, URL state, release/a11y hardening.
- Keep command, queue, disabled-reason, and URL-state logic in `src/registry-explorer/core/`; shell should orchestrate state and clipboard side effects; renderers should only render action view models.
- Do not add package-manager variants, browser execution, security/audit badges, accounts, or backend features.
- Make inspect-before-install equally prominent with install copy to avoid endorsement implications.
- Use exact CLI command text from Phase 04 decisions, backed by the CLI help check above.
- Treat `pnpm verify` passing plus documented browser/a11y smoke as the phase completion gate.
- Update the deploy workflow early enough that final verification includes the actual release path.

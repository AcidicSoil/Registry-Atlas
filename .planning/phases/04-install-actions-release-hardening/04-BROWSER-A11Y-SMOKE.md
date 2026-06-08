---
phase: 04-install-actions-release-hardening
artifact: browser-a11y-smoke
status: passed
base_path: /Registry-Atlas/
last_run: 2026-06-08T18:22:00Z
---

# Phase 04 Browser + Accessibility Smoke

## Setup

```bash
pnpm install
pnpm verify
pnpm dev --host 127.0.0.1
```

Open `http://127.0.0.1:5173/Registry-Atlas/`. The production/static Pages base path remains `/Registry-Atlas/`.

Registry Atlas is copy-only for install actions. It does not execute installs in the browser and does not audit, certify, approve, or endorse third-party community registry code.

## Required smoke checklist

### 1. Release gate and deploy path

- [x] `.github/workflows/deploy.yml` runs `pnpm verify` after `pnpm install --frozen-lockfile` and before Pages artifact upload/deploy.
- [x] `package.json` defines `pnpm verify` as source typecheck, test typecheck, Vitest, data validation, and production build.
- [x] `pnpm verify` passed locally.

Expected deploy invariant: there is no GitHub Pages deploy path that only runs `pnpm build` without tests, data validation, and typechecks.

### 2. Copy install and inspect-first commands

Route-eligible example: `@8bitcn/button`.

Expected:

- Copy install command: `npx shadcn@latest add @8bitcn/button`
- Inspect-first command: `npx shadcn@latest view @8bitcn/button`
- Raw item route link: `https://www.8bitcn.com/r/button.json`
- Browser never executes either command.
- UI keeps visible copy-only warning: `Copy-only. Review source before installing third-party registry code.`

Observed:

- [x] `Copy install` exposes `npx shadcn@latest add @8bitcn/button`.
- [x] `Inspect first` exposes `npx shadcn@latest view @8bitcn/button`.
- [x] Raw item route opens as an external link with safe `http(s)` handling.
- [x] Clipboard-unavailable fallback displayed manual-copy feedback instead of failing silently.

### 3. Disabled states and fallback reasons

Fallback example from `?view=discover&q=button`: `@better-upload` component-tag fallback.

Expected:

- Copy install disabled.
- Inspect first disabled.
- Add to queue disabled.
- Reason visible: `Inferred/fallback candidate; install command unavailable.`
- No route/install command is synthesized for fallback candidates.

Observed:

- [x] Disabled controls were present for fallback candidates.
- [x] Disabled reason text was visible.
- [x] Fallback candidates did not enter the install queue.

### 4. Queue flow and dedupe

Expected with `@8bitcn/button` and `@8bitcn/card`:

- Adding one item shows queue count `1` and batch command `npx shadcn@latest add @8bitcn/button`.
- Adding a second item shows queue count `2` and batch command `npx shadcn@latest add @8bitcn/button @8bitcn/card`.
- A queued row changes from `Add to queue` to `Remove from queue`.
- Removing an item updates count and command.
- Clear empties queue and disables batch copy.
- Duplicate queue items dedupe to one token.

Observed:

- [x] Queue count changed to `1` after adding `@8bitcn/button`.
- [x] Batch command rendered as `npx shadcn@latest add @8bitcn/button`.
- [x] Earlier two-item smoke rendered `npx shadcn@latest add @8bitcn/button @8bitcn/card`.
- [x] Queued result action changed to `Remove from queue`.
- [x] Core queue dedupe is covered by `tests/registry-explorer/installQueue.test.ts`.

### 5. Profile/discovery behavior and safe links

Expected:

- `View profile` opens the selected registry profile without losing local queue state.
- Profile item rows show copy install, inspect-first, and queue actions for route-eligible items.
- `Back to results` returns to discovery results.
- Homepage, official source, and raw item links are rendered through safe `http(s)` URL handling and use new-tab external link behavior.

Observed:

- [x] Profile for `@8bitcn` opened from discovery.
- [x] Profile rows for Button/Card/Input showed install actions.
- [x] Queued Button/Card profile rows showed `Remove from queue` when queue state was present.
- [x] Homepage/source/raw route links rendered as external links.

### 6. URL restoration and queue non-restoration

Expected URLs:

- `/Registry-Atlas/?view=discover&q=button`
- `/Registry-Atlas/?view=discover&q=button&registry=@8bitcn`
- `/Registry-Atlas/?view=focus&focus=buttons-and-primitives&q=button`
- `/Registry-Atlas/?view=component&component=file-upload&q=upload`

Expected behavior:

- Search input hydrates from `q` before first render.
- View/tab hydrates from `view`.
- Valid profile registry opens profile.
- Valid focus/component selection hydrates relevant view.
- `queue`, install-token, and install params are ignored and removed by canonical URL sync.
- Reloading or opening a URL with queue params does not restore queue entries.

Observed:

- [x] `?view=discover&q=button&registry=@8bitcn&queue=@bad/button` hydrated profile/search and canonicalized to `?view=discover&q=button&registry=%408bitcn`.
- [x] `?view=focus&focus=buttons-and-primitives&q=button` hydrated focus/search state.
- [x] `?view=component&component=file-upload&q=upload&queue=@bad/button` hydrated component/search and canonicalized to `?view=component&q=upload&component=file-upload`.
- [x] Queue state did not restore from URL params.

### 7. Accessibility baseline

Expected:

- Controls are keyboard-reachable: search, tabs, queue buttons, install buttons, profile buttons, and links.
- Focus-visible styling is obvious.
- Buttons have visible labels.
- Copy feedback is visible and announced through a status region.
- Disabled controls remain understandable through nearby visible disabled-reason text.

Observed:

- [x] Keyboard Tab from the search input reached the Discover tab.
- [x] Focus-visible outline was computed as `2px solid` on the active tab.
- [x] Install buttons, queue controls, and profile controls have visible text labels.
- [x] Copy feedback rendered as `role="status" aria-live="polite"` with manual-copy command text when clipboard access was unavailable.
- [x] Disabled fallback controls show visible reason text.

## Automated verification output

Latest local release gate:

```txt
pnpm verify
- tsc --noEmit: passed
- tsc --noEmit -p tsconfig.test.json: passed
- vitest: 13 files passed, 69 tests passed
- validate-registry-data: 0 errors, 4 existing official HTTP warnings
- vite build: passed, dist emitted
```

The 4 validation warnings are official-directory HTTP URL warnings for `@shadcn-map` and `@wandry-ui`; they are existing data provenance warnings, not Phase 04 release blockers.

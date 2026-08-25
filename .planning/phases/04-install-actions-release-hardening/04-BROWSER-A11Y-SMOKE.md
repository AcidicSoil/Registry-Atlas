---
phase: 04-install-actions-release-hardening
artifact: browser-a11y-smoke
status: pending
base_path: /Registry-Atlas/
last_run:
---

# Phase 04 Browser + Accessibility Smoke

This is the release-level browser checklist for the current Registry Atlas information architecture. Run it against the production preview at `/Registry-Atlas/`; record failures before claiming release readiness.

## Setup

```bash
pnpm install
pnpm verify
pnpm build
pnpm preview
```

Open `http://127.0.0.1:4173/Registry-Atlas/` (or the port reported by `pnpm preview`). The app is copy-only: it never executes install commands in the browser and does not audit, certify, approve, or endorse third-party registry code.

## Required smoke checklist

### 1. Discover route and search

- [ ] `/Registry-Atlas/` loads the default **Discover** route with the Discover tab active.
- [ ] Search accepts rough or natural-language wording, such as `stuff for uploading files`, and returns relevant component candidates or a clear empty state.
- [ ] Search text remains visible when moving between Discover, Registries, and Compare.
- [ ] Discover result cards show the match reason, registry namespace, and available details/action state.

### 2. Discover facets, filtering, and sorting

- [ ] **Category**, **Component**, and **Registry** facet controls support selecting multiple values in each dimension.
- [ ] Multiple values within one dimension use OR semantics: selecting either value keeps matches for either value.
- [ ] Selections across dimensions use AND semantics: a result must match every selected dimension.
- [ ] Each active facet is represented by a removable chip.
- [ ] Removing one chip changes results without removing the other selections.
- [ ] **Clear all** removes every active facet and returns the unfiltered result set.
- [ ] **Relevance** and **Name A-Z** sorting visibly change the result order and persist through a reload/deep link.

### 3. Discover details, previews, and copy feedback

- [ ] An eligible result opens its item detail route and the detail view can return to the originating discovery state.
- [ ] An item without a verified visual shows `Preview unavailable` (or equivalent explanatory copy) without a broken image or empty interactive region.
- [ ] `Copy install` copies a copy-only shadcn command and shows visible success/fallback feedback.
- [ ] `Inspect first` copies the inspect command and shows visible feedback.
- [ ] `Copy prompt` copies the supported inspection/install prompt and shows visible feedback.
- [ ] `Copy search link` / current-route link copies the URL and reports success or manual-copy fallback.
- [ ] Clipboard denial/unavailability produces visible manual-copy feedback rather than a silent failure.
- [ ] Inferred or fallback candidates keep install, inspect, prompt, and queue actions disabled with a visible reason.

### 4. Install queue

- [ ] Adding an eligible item shows it in the local install queue and updates the queue count.
- [ ] Adding a second eligible item produces the batch command containing both tokens in queue order.
- [ ] A queued result changes to `Remove from queue`; removing it updates the count and batch command.
- [ ] Duplicate additions do not create duplicate queue entries.
- [ ] `Clear` empties the queue and disables the batch-copy action.
- [ ] Queue state is local UI state, not executable browser behavior, and is not restored from URL parameters after reload.

### 5. Registries browse and profile

- [ ] The **Registries** tab opens the registry source browser.
- [ ] Registry search filters sources by name/description and shows a clear no-results state when appropriate.
- [ ] Registry Category, Component, and Registry filters can be selected and removed as applicable to the source browser.
- [ ] Opening a registry profile shows its source facts, coverage status, known items, and item actions.
- [ ] `Back to results`/equivalent navigation returns to the previous browsing context without losing queue state.

### 6. Compare route

- [ ] The **Compare** tab opens the comparison surface and does not present the legacy Matrix navigation label.
- [ ] Multiple registries and multiple components can be selected for comparison.
- [ ] The comparison table shows coverage plus verification/status information for each cell.
- [ ] Copying the comparison link and reloading it restores the selected registries/components and table state.
- [ ] A comparison with no matching rows shows a clear empty state.

### 7. Deep links and reloads

- [ ] Reloading a Discover URL restores search, selected facets, sort, and selected item/profile state.
- [ ] Reloading a Registries URL restores registry search/filter state and an opened profile when present.
- [ ] Reloading a Compare URL restores selected registries and components.
- [ ] Unsupported legacy `focus`, `component`, or `matrix` view parameters fall back to the current Discover or Compare route without exposing legacy navigation labels.

### 8. Keyboard, focus, and Escape behavior

- [ ] Search, primary tabs, facet controls, sort controls, result actions, queue actions, profile actions, and links are reachable with `Tab`/`Shift+Tab`.
- [ ] Every focused control has a clearly visible focus indicator against the surrounding surface.
- [ ] `Enter`/`Space` activates the focused tab, facet, chip, sort, queue, copy, and profile controls as appropriate.
- [ ] `Escape` closes an open facet menu, detail/preview popover, or other dismissible overlay and returns focus to its trigger.
- [ ] Focus is not lost behind a closed overlay, and the document remains keyboard navigable after dismissal.
- [ ] Copy feedback is visible and announced through a status region; disabled actions remain understandable through nearby reason text.

### 9. Links and responsive layout

- [ ] Homepage, source, docs, raw item, and component-page links accept only safe `http(s)` destinations, open externally where intended, and use safe external-link attributes.
- [ ] The narrow-screen Discover layout remains usable without clipped controls or inaccessible actions.
- [ ] The narrow-screen Compare table stays readable in a horizontally scrollable container; the page itself does not require horizontal scrolling to reach unrelated controls.

## Run record

Record the date, browser/viewport, production-preview URL, and any failed checklist item here before changing `status` to `passed`.

```txt
date:
browser:
viewport:
preview_url:
result: pending
failures:
```

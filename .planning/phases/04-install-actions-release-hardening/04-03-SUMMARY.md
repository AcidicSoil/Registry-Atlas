---
phase: 04-install-actions-release-hardening
plan: 04-03-url-state
status: complete
completed_at: 2026-06-08T18:19:00Z
---

# 04-03 URL State Summary

## Implemented

- Added pure URL parse/serialize helpers in `src/registry-explorer/core/urlState.ts`.
- Added allowlisted URL params for `view`, `q`, `registry`, `candidate`, `focus`, and `component`.
- Explicitly ignored queue/install-token-style params; queue state remains local UI state only.
- Re-exported URL state helpers from `src/registry-explorer/core/index.ts`.
- Hydrated shell state from `window.location.search` before first render.
- Populated the search input from hydrated URL state.
- Validated profile registries, focus keys, and component keys against loaded app data/vocabularies.
- Synced URL state with `history.replaceState` after shell state changes.
- Serialized relevant state only: profile/candidate when a profile is open, focus only for focus view, component only for component view.

## Verification

- `pnpm typecheck` passed.
- `pnpm typecheck:test` passed.
- `pnpm test -- tests/registry-explorer/urlState.test.ts tests/registry-explorer/installQueue.test.ts` passed; Vitest reported 13 files / 69 tests passing under current config.
- `pnpm verify` passed:
  - typecheck
  - test typecheck
  - full Vitest suite: 13 files / 69 tests
  - registry data validation: 0 errors, 4 existing official HTTP warnings
  - production build
- Browser smoke passed:
  - `/Registry-Atlas/?view=discover&q=button&registry=@8bitcn&queue=@bad/button` hydrated search/profile state and canonicalized URL to remove `queue`.
  - `/Registry-Atlas/?view=focus&focus=buttons-and-primitives&q=button` hydrated focus view/search state.
  - `/Registry-Atlas/?view=component&component=file-upload&q=upload&queue=@bad/button` hydrated component view/search state and canonicalized URL to remove `queue`.

## Notes

- URL state is shareable discovery/profile context only.
- Install queues are not persisted, parsed, or serialized.

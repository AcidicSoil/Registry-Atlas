---
phase: 04-install-actions-release-hardening
plan: 04-03-url-state
type: implementation
wave: 3
depends_on: [04-02-install-actions-ui-queue]
files_modified:
  - src/registry-explorer/core/urlState.ts
  - src/registry-explorer/core/registry.schema.ts
  - src/registry-explorer/core/index.ts
  - src/registry-explorer/ui/shell.ts
  - tests/registry-explorer/urlState.test.ts
autonomous: true
requirements: [HARD-05, INST-04, INST-06]
must_haves:
  truths:
    - "D-11: Persist shareable discovery state in the URL: selected view/tab, search query, and selected profile/registry where relevant."
    - "D-12: Do not persist queued install items in the URL for v1. Queue state remains local UI state."
    - "D-13: URL state parsing/serialization should be pure and tested so invalid or stale params fall back safely."

---

<objective>
Add pure URL-state parse/serialize helpers and shell hydration/sync so users can share or revisit discovery state for selected view/tab, search query, selected profile/registry, focus, and component selection while keeping install queue state local only.
</objective>

<must_haves>
- D-11: Persist shareable discovery state in the URL: selected view/tab, search query, and selected profile/registry where relevant.
- D-12: Do not persist queued install items in the URL for v1; queue remains local UI state.
- D-13: URL parsing/serialization is pure and tested; invalid or stale params fall back safely.
- URL sync must use `history.replaceState` rather than adding browser history entries for every search keystroke.
- Hydration must update both shell state and `roots.searchInput.value` before or during first render so DOM and state match.
- URL state must not expand project scope to backend persistence, accounts, browser install execution, or queued command sharing.
</must_haves>

<threat_model>
- Assets: page state integrity, user privacy around queue contents, app availability, and safe rendering of URL-derived values.
- Threats: XSS or attribute injection via query params; stale/invalid params crashing render; queue tokens leaking into shared URLs; history spam from search typing; profile selection spoofing to nonexistent registries; invalid focus/component names selecting hidden state.
- Controls: pure allowlist parsing, registry/focus/component existence checks in shell, escaped renderer output, `replaceState`, explicit ignore/drop of any queue params, fallback to default Discover state for invalid params.
- High severity gate: if any URL param can be rendered unescaped, crash the app, or serialize queued install items, stop implementation and fix before proceeding.
</threat_model>

<tasks>
<task id="T1" title="Implement pure URL-state parse and serialize helpers">
  <read_first>
    - .planning/phases/04-install-actions-release-hardening/04-CONTEXT.md
    - .planning/phases/04-install-actions-release-hardening/04-RESEARCH.md
    - src/registry-explorer/ui/shell.ts
    - src/registry-explorer/core/registry.schema.ts
    - tests/registry-explorer/itemRoutes.test.ts
  </read_first>
  <action>
    Create `src/registry-explorer/core/urlState.ts` with exported pure functions such as `parseRegistryExplorerUrlState(searchParams)` and `serializeRegistryExplorerUrlState(state)`. Allow only `view=discover|focus|component|matrix`, `q`, `registry`, `focus`, and `component`; optionally allow `candidate` only as best-effort/stale-safe if the executor chooses. Explicitly ignore `queue`, `token`, `install`, or similar queued-item params and never serialize them. Re-export through `src/registry-explorer/core/index.ts` if project patterns require.
  </action>
  <verify>
    Run `pnpm typecheck` and `pnpm test -- tests/registry-explorer/urlState.test.ts` after tests exist.
  </verify>
  <acceptance_criteria>
    - Valid params parse to expected state fields without DOM/global dependencies.
    - Invalid view falls back to `discover`; empty/unknown focus/component/registry/candidate values are null or omitted.
    - Serialize includes selected view, non-empty query, selected profile registry, selected focus, and selected component where relevant.
    - Serialize never emits queue/install token data even if present in input-like objects.
  </acceptance_criteria>
</task>

<task id="T2" title="Add URL state unit coverage">
  <read_first>
    - src/registry-explorer/core/urlState.ts
    - tests/registry-explorer/itemRoutes.test.ts
    - tests/registry-explorer/discovery.test.ts
    - .planning/codebase/TESTING.md
  </read_first>
  <action>
    Create `tests/registry-explorer/urlState.test.ts` with DOM-free Vitest tests covering valid parse, invalid/stale fallbacks, serialization order/contents, percent-encoded search terms, registry names containing `@`, and queue-param ignoring/non-serialization.
  </action>
  <verify>
    Run `pnpm test -- tests/registry-explorer/urlState.test.ts` and `pnpm typecheck:test`.
  </verify>
  <acceptance_criteria>
    - Tests assert URL state is pure by constructing `URLSearchParams` directly and not using `window`.
    - Tests cover `view`, `q`, `registry`, `focus`, and `component` params.
    - Tests prove `queue=@foo/button` and similar install-token params do not survive parse/serialize.
  </acceptance_criteria>
</task>

<task id="T3" title="Hydrate and sync shell state through the URL boundary">
  <read_first>
    - src/registry-explorer/core/urlState.ts
    - src/registry-explorer/ui/shell.ts
    - src/registry-explorer/core/grouping.ts
    - src/registry-explorer/core/discovery.ts
    - src/registry-explorer/core/registryProfile.ts
  </read_first>
  <action>
    Update `initRegistryExplorer()` in `src/registry-explorer/ui/shell.ts` to hydrate initial `AppState` from `window.location.search` before the first render. Validate parsed registry/focus/component values against loaded registries/groups where possible; drop stale selections safely. Set `roots.searchInput.value` from hydrated `searchTerm`. In `setState()` or a dedicated sync function, call `history.replaceState` with serialized URL state after state changes. Preserve queue state from Plan 04-02 as local-only and excluded from serialization.
  </action>
  <verify>
    Run `pnpm typecheck`, `pnpm test -- tests/registry-explorer/urlState.test.ts`, and browser smoke by visiting `/Registry-Atlas/?view=discover&q=button&registry=@8bitcn` plus secondary view URLs.
  </verify>
  <acceptance_criteria>
    - Loading a URL with `q=button` populates the search input and renders filtered results on first render.
    - Loading a valid profile registry param opens the profile or safely falls back when the registry is absent.
    - Changing tabs/search/profile/focus/component updates the URL via `replaceState` without queue tokens.
    - Reloading after adding queue items does not restore the queue from the URL.
  </acceptance_criteria>
</task>
</tasks>

<verification>
- `pnpm typecheck`
- `pnpm typecheck:test`
- `pnpm test -- tests/registry-explorer/urlState.test.ts tests/registry-explorer/installQueue.test.ts`
- Browser smoke at `/Registry-Atlas/?view=discover&q=button`, `/Registry-Atlas/?view=focus&focus=<valid-focus>`, `/Registry-Atlas/?view=component&component=<valid-component>`, and a URL containing `queue=@foo/button` to confirm queue is ignored.
</verification>

<success_criteria>
- Users can share/revisit filtered discovery/profile/tab state through URL parameters.
- URL parsing/serialization remains pure and tested independently from the DOM.
- Queue state remains local and is neither parsed from nor serialized into URLs.
</success_criteria>

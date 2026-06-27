---
phase: 07-item-detail-data-routing
plan: 07-01-route-detail-loader
type: implementation
wave: 1
depends_on: []
files_modified:
  - src/registry-explorer/core/urlState.ts
  - src/registry-explorer/core/itemRoutes.ts
  - src/registry-explorer/core/registry.schema.ts
  - src/registry-explorer/core/registryItemDetail.ts
  - src/registry-explorer/data/loadRegistryItemDetail.ts
  - tests/registry-explorer/urlState.test.ts
  - tests/registry-explorer/itemRoutes.test.ts
  - tests/registry-explorer/registryItemDetail.test.ts
autonomous: true
requirements: [ITEM-01, ITEM-02, ITEM-06]
must_haves:
  truths:
    - "ITEM-01: URL state can represent and restore `view=item&registry=@delta&item=code-block`."
    - "ITEM-02: Item detail loading uses a typed RegistryItemDetail model backed by real registry item JSON when available."
    - "ITEM-06: Unavailable routes, failed fetches, invalid JSON, invalid schema, CORS/network failures, and missing registries map to explicit safe result states."
    - "D-01: The route must support a component page, not a JSON inspector."
    - "D-02: Registry item JSON powers the UI internally but does not become the UI."
    - "D-10: Missing/full item content fallbacks should point users toward component/docs/source pages, not raw JSON."
---

<objective>
Create the Phase 7 route and typed detail-loading foundation: `view=item` URL state, route-eligible summary resolution, registry item JSON fetch/normalization, and explicit loader result states for safe item-page rendering.

Decision coverage: D-01, D-02, D-03, D-10, D-11, D-12, D-16, D-17, D-18.
</objective>

<must_haves>
- Extend existing URL-state utilities; do not introduce a routing framework.
- Keep item JSON as internal data only. Do not add raw JSON UI in this plan.
- Use explicit discriminated result states instead of throwing render-facing errors.
- Preserve static GitHub Pages compatibility; runtime fetch failures must be safe states.
- Treat all registry item JSON as untrusted data.
</must_haves>

<threat_model>
- Assets: route integrity, user safety, static-app reliability, third-party registry data boundary, and future item-page correctness.
- Threats: malformed query params selecting the wrong item; untrusted JSON strings being treated as safe UI; runtime fetch/CORS failures crashing the app; raw JSON leaking into normal user UI; command strings being generated from invalid routes.
- Controls: strict URL param normalization, route eligibility checks through `itemRoutes.ts`, typed result unions, schema/shape guards, no command execution, explicit tests for error states, and no normal raw JSON renderer.
- High severity gate: if malformed route params, invalid JSON, or fetch failures can crash rendering or cause unescaped item fields to reach UI models, stop and fix before continuing.
</threat_model>

<tasks>
<task id="T1" title="Extend URL state for item routes">
  <read_first>
    - src/registry-explorer/core/urlState.ts
    - tests/registry-explorer/urlState.test.ts
    - .planning/phases/07-item-detail-data-routing/07-CONTEXT.md
    - .planning/phases/07-item-detail-data-routing/07-UI-SPEC.md
  </read_first>
  <action>
    Add `item` to `RegistryExplorerView`. Add a nullable `selectedItemSlug` field to parsed/serializable URL state. Parse and serialize the query parameter named `item`. Ensure `parseRegistryExplorerUrlState(new URLSearchParams('view=item&registry=@delta&item=code-block'))` returns `view: 'item'`, `selectedProfileRegistryName: '@delta'`, and `selectedItemSlug: 'code-block'`. Preserve existing `q`, `registry`, `candidate`, `focus`, and `component` behavior.
  </action>
  <verify>
    Run `pnpm test -- tests/registry-explorer/urlState.test.ts` and `pnpm typecheck`.
  </verify>
  <acceptance_criteria>
    - `RegistryExplorerView` includes the literal `'item'`.
    - Parsed URL state includes `selectedItemSlug: string | null`.
    - Serializing item state emits `view=item`, `registry=@delta`, and `item=code-block`.
    - Blank `item` query values normalize to `selectedItemSlug: null`.
    - Existing discover/focus/component/matrix URL tests still pass.
  </acceptance_criteria>
</task>

<task id="T2" title="Add typed item detail model and result states">
  <read_first>
    - src/registry-explorer/core/registry.schema.ts
    - src/registry-explorer/core/itemRoutes.ts
    - src/registry-explorer/core/installActions.ts
    - src/registry-explorer/core/registryProfile.ts
    - src/registry-explorer/core/discovery.ts
    - .planning/phases/07-item-detail-data-routing/07-RESEARCH.md
    - .planning/phases/07-item-detail-data-routing/07-PATTERNS.md
  </read_first>
  <action>
    Add typed item-detail interfaces in `registry.schema.ts` or a new `src/registry-explorer/core/registryItemDetail.ts`. Define a `RegistryItemDetail` shape that links the selected `Registry`, `RegistryItemSummary`, resolved item route, title/name, description, namespace, slug, type/category, taxonomy labels, catalog/status/confidence fields, docs/preview/evidence/source links, dependencies, devDependencies, registryDependencies, files, warnings, and copy-only install action state. Define a discriminated `RegistryItemDetailResult` union with statuses including `loaded`, `summary-only`, `route-unavailable`, `not-found`, `fetch-error`, `invalid-json`, and `invalid-schema`. Keep any raw source JSON/object internal to the result model and mark it as not for normal UI rendering.
  </action>
  <verify>
    Run `pnpm typecheck` and `pnpm typecheck:test`.
  </verify>
  <acceptance_criteria>
    - A typed detail result union exists and has explicit non-loaded statuses for unavailable route, not found, fetch error, invalid JSON, and invalid schema.
    - `RegistryItemDetail` includes dependency, dev dependency, registry dependency, and file metadata fields.
    - Detail model types do not require raw JSON to be rendered by normal UI.
    - Existing summary/candidate/profile interfaces remain compatible with current tests.
  </acceptance_criteria>
</task>

<task id="T3" title="Implement item detail resolution and loader">
  <read_first>
    - src/registry-explorer/core/itemRoutes.ts
    - src/registry-explorer/core/installActions.ts
    - src/registry-explorer/core/registry.schema.ts
    - src/registry-explorer/data/loadRegistries.ts
    - registry-altas-improvement-phase/gpt-agent-outputs/registry-catalog.normalized.json
    - tests/registry-explorer/registryLoader.test.ts
    - tests/registry-explorer/installActions.test.ts
  </read_first>
  <action>
    Implement a detail resolver/loader in `src/registry-explorer/core/registryItemDetail.ts` and, if runtime fetch code is separated, `src/registry-explorer/data/loadRegistryItemDetail.ts`. The resolver must find the selected registry by namespace, find the selected item summary by slug, verify route eligibility through `resolveRegistryItemRoute`, reuse `buildInstallActionState` or equivalent existing command-state logic, fetch/read registry item JSON when a resolved route is available, normalize known shadcn item fields (`name`, `type`, `title`, `description`, `dependencies`, `devDependencies`, `registryDependencies`, `files`), and return `summary-only` or error states when full item JSON cannot be safely loaded. The loader must not execute item code or commands.
  </action>
  <verify>
    Run `pnpm test -- tests/registry-explorer/registryItemDetail.test.ts tests/registry-explorer/itemRoutes.test.ts tests/registry-explorer/installActions.test.ts` and `pnpm typecheck`.
  </verify>
  <acceptance_criteria>
    - Route-eligible `@delta` / `code-block`-style summaries can produce a `loaded` or `summary-only` result without crashing.
    - Unknown registry returns `not-found` or equivalent explicit missing-registry state.
    - Unknown item slug returns `not-found`.
    - Route-ineligible summary returns `route-unavailable` with a safe reason.
    - Failed fetch rejects into `fetch-error`, not an uncaught exception.
    - Invalid JSON returns `invalid-json`.
    - Invalid item shape returns `invalid-schema`.
    - Loader result includes copy-only `view` / `add` command state only when existing install action rules allow it.
  </acceptance_criteria>
</task>

<task id="T4" title="Add focused tests for detail loader safety">
  <read_first>
    - tests/registry-explorer/urlState.test.ts
    - tests/registry-explorer/itemRoutes.test.ts
    - tests/registry-explorer/registryItemDetail.test.ts
    - tests/registry-explorer/renderSafety.test.ts
    - package.json
  </read_first>
  <action>
    Add or extend tests for item route parsing, item detail resolution, fetch failure, invalid JSON, invalid schema, route unavailable, missing registry, missing item, and preservation of copy-only command behavior. Include a regression assertion that the detail loader/model does not require normal UI to expose a raw JSON section.
  </action>
  <verify>
    Run `pnpm test -- tests/registry-explorer/urlState.test.ts tests/registry-explorer/itemRoutes.test.ts tests/registry-explorer/registryItemDetail.test.ts tests/registry-explorer/renderSafety.test.ts`.
  </verify>
  <acceptance_criteria>
    - New `registryItemDetail.test.ts` exists.
    - Tests cover all explicit loader result statuses implemented in T2/T3.
    - Tests prove `view=item&registry=@delta&item=code-block` round-trips through URL state.
    - Tests prove copy commands are returned as strings for copy use only and are never executed in test code.
  </acceptance_criteria>
</task>
</tasks>

<verification>
- `pnpm typecheck`
- `pnpm typecheck:test`
- `pnpm test -- tests/registry-explorer/urlState.test.ts tests/registry-explorer/itemRoutes.test.ts tests/registry-explorer/registryItemDetail.test.ts tests/registry-explorer/installActions.test.ts`
- `pnpm validate:data`
- `pnpm verify`
</verification>

<success_criteria>
- URL state can restore an internal item route.
- A typed detail loader returns explicit loaded/unavailable/error states.
- Runtime item JSON/fetch failures do not crash UI consumers.
- Raw JSON remains internal data, not normal user UI.
- Full verification passes.

## Artifacts this phase produces

- `RegistryExplorerView` value `'item'`
- `ParsedRegistryExplorerUrlState.selectedItemSlug`
- `SerializableRegistryExplorerUrlState.selectedItemSlug`
- `RegistryItemDetail`
- `RegistryItemDetailResult`
- `RegistryItemDetailErrorStatus` or equivalent union
- `resolveRegistryItemDetail` or equivalent core resolver
- `loadRegistryItemDetail` or equivalent data loader
- `tests/registry-explorer/registryItemDetail.test.ts`

# Registry Atlas 21st.dev parity corrective implementation plan

Spec: `docs/superpowers/specs/2026-09-28-21st-parity-corrective-design.md`

## Delivery strategy

Work in tracer slices. Each task starts with a failing behavior test, implements the smallest production change, then runs the focused test before moving on. Keep the existing real-catalog browse behavior green throughout.

## File map

Primary existing files:

- `src/registry-explorer/core/catalogRoutes.ts`: canonical route union/parser/serializer.
- `src/registry-explorer/core/catalogQuery.ts`: real catalog query and facets.
- `src/registry-explorer/core/registryDirectory.ts`: registry list model.
- `src/registry-explorer/core/registryItemDetail.ts`: exact item detail resolution.
- `src/registry-explorer/data/loadRegistryItemDetail.ts`: detail loading.
- `src/registry-explorer/ui/shell.ts`: history, route dispatch, shared state.
- `scripts/sync-registry-catalog-evidence.mjs`: upstream catalog sync.
- `public/styles/registry-explorer.css`: application layout and visual hierarchy.

New focused modules:

- `src/registry-explorer/core/catalogCollections.ts`: evidence-backed asset kinds and Explore collections.
- `src/registry-explorer/ui/catalogLandingView.ts`: dedicated root landing.
- `src/registry-explorer/ui/catalogCollectionView.ts`: Featured/Newest/Authors/Templates/Themes/Icons states.
- `scripts/check-product-contract.mjs`: rerunnable route/legacy-inference guard.
## Task 1: Replace the route model and remove active legacy URL dependencies

Tests:
- extend `tests/registry-explorer/catalogRoutes.test.ts` for every route family;
- add unknown-route assertions;
- update `tests/registry-explorer/shell.test.ts` so root is distinct from Components.

Implementation:
- expand the discriminated `CatalogRoute` union;
- add typed asset-detail route variants;
- make unsupported paths return an explicit not-found route/state;
- move old-query compatibility into a narrow translator that does not import taxonomy modules;
- migrate `shell.ts` to the new route types.

Then delete active imports of `urlState.ts` taxonomy compatibility where possible.

Verification:
`pnpm vitest run tests/registry-explorer/catalogRoutes.test.ts tests/registry-explorer/shell.test.ts`

## Task 2: Establish evidence-backed asset kinds and collections

Tests:
- add `catalogCollections.test.ts`;
- prove templates come only from `registry:page`;
- prove icons require explicit icon type/category evidence;
- prove Featured requires reviewed enrichment;
- prove Newest is unavailable without explicit timestamps;
- prove Explore collections use configured explicit categories only.

Implementation:
- add `catalogCollections.ts`;
- extend compact `RegistryCatalogItem` with optional explicit timestamp/author fields;
- add query helpers that reuse `catalogQuery.ts` rather than duplicate identity/paging logic.
## Task 3: Generate and load same-origin detail bundles

Tests:
- extend `registryCatalogEvidence.test.ts` for normalized detail output and stale preservation;
- extend `registryItemDetail.test.ts` and loader tests for local-first loading;
- prove detail succeeds when the upstream fetch fails.

Implementation:
- make catalog fetch return both compact items and safe detail items;
- write one deterministic bundle per namespace under `public/data/registry-item-details/`;
- preserve prior namespace bundles on transient failures;
- add bundle metadata and exact item identity;
- update `loadRegistryItemDetail.ts` to fetch the bundle through `import.meta.env.BASE_URL` first.

Do not store source-code file contents.

Verification:
`pnpm vitest run tests/registry-explorer/registryCatalogEvidence.test.ts tests/registry-explorer/registryItemDetail.test.ts`

## Task 4: Finish registry directory controls

Tests:
- extend `registryDirectory.test.ts` for coverage filter and item-count sort;
- extend `registryDirectoryView.test.ts` for controls;
- extend route/query tests for URL round trips.

Implementation:
- add coverage filter and sort to `RegistryDirectoryOptions`;
- filter/sort before pagination;
- render search/status/sort controls;
- wire them through shell state and URL query state.

Verification:
`pnpm vitest run tests/registry-explorer/registryDirectory.test.ts tests/registry-explorer/registryDirectoryView.test.ts tests/registry-explorer/catalogRoutes.test.ts`
## Task 5: Add the missing first-class route surfaces

Tests:
- add focused view tests for landing and collection surfaces;
- assert missing evidence renders an unavailable state rather than Components;
- assert typed detail routes reject mismatched kinds.

Implementation:
- dedicated `/` landing page;
- `/components/featured`;
- `/components/newest` and period route with honest unavailable behavior when no timestamp data exists;
- `/components/explore/:collection`;
- `/authors` with explicit unavailable behavior until author evidence exists;
- `/templates` plus template detail;
- `/themes`, theme detail, and theme-editor unavailable/tool state;
- `/icons`, icon family, and icon category.

Reuse one generic evidence-backed collection renderer where semantics match.

Verification:
run the new focused view tests plus `shell.test.ts`.

## Task 6: Retire the inferred product system

Tests:
- add contract test/script assertions that active source does not import retired modules;
- update generated-data tests so runtime behavior no longer depends on `component_tags`.

Implementation:
- migrate any remaining live callers;
- remove obsolete discovery/grouping/matrix/component-evidence/taxonomy modules and their tests;
- stop sync from generating inferred component tags for runtime product state;
- remove obsolete exports/types and dead compatibility code.

Keep only raw/historical fields that are required for source provenance.
## Task 7: Move the rendered hierarchy toward the reference

Implementation:
- make primary navigation route-based;
- add browse rail shortcuts and explicit category counts;
- reduce header filter dominance;
- add landing-page preview strips;
- make preview-backed cards image-first;
- reduce preview-unavailable card height and chrome;
- specialize registry/library and typed collection layouts;
- preserve original Registry Atlas branding.

Responsive:
- collapse the browse rail at narrow widths;
- keep all controls reachable;
- prevent horizontal document overflow.

Verification:
project tests first, then managed-browser desktop and 390px screenshots.

## Task 8: Add the rerunnable contract lever

Create `scripts/check-product-contract.mjs` and a package/mise task.

The script must fail when:
- a required route family is absent from the canonical parser;
- active source imports a retired inference module;
- the detail bundle directory is absent after generated-data sync fixtures run;
- unsupported route handling silently resolves to Components.

Add it to `pnpm verify`.

## Task 9: Full verification and review

Run:
- `pnpm verify`;
- `git diff --check`;
- `scripts/check-product-contract.mjs`;
- managed profile browser acceptance for all routes listed in the spec;
- fresh desktop and 390px screenshots;
- console errors and 5xx network checks.

Then review the diff against the corrective spec before any merge/push.

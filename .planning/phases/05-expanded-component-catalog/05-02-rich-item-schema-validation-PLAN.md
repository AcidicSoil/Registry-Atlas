---
phase: 05-expanded-component-catalog
plan: 05-02-rich-item-schema-validation
type: implementation
wave: 2
depends_on: [05-01-import-normalized-catalog]
files_modified:
  - src/registry-explorer/core/registry.schema.ts
  - src/registry-explorer/core/registryMirror.ts
  - src/registry-explorer/core/itemRoutes.ts
  - src/registry-explorer/data/loadRegistries.ts
  - scripts/validate-registry-data.mjs
  - tests/registry-explorer/registryMirror.test.ts
  - tests/registry-explorer/registryLoader.test.ts
  - tests/registry-explorer/itemRoutes.test.ts
autonomous: true
requirements: [CAT-03, CAT-04, CAT-05, CAT-06]
must_haves:
  truths:
    - "CAT-03: Registry records preserve metadata from researched catalog records where known."
    - "CAT-04: Item summaries preserve route, command, dependency, file, source, and evidence metadata."
    - "CAT-05: Validation distinguishes catalog-backed item data from inferred or unavailable data."
    - "CAT-06: Existing v1.0 official mirror data remains valid and usable."
---

<objective>
Extend Registry Atlas item summary types, runtime loading, route resolution, and mirror validation so richer imported catalog records survive from generated JSON into app view models without breaking v1.0-style records.


Decision coverage: D-05, D-07, D-08, D-09, D-11.
</objective>

<must_haves>
- Preserve old item summary records that only have name, slug, source, provenance, catalog_status, and route_eligible.
- Add optional richer item fields in TypeScript and runtime mapping: title, description, confidence, evidenceUrl, evidenceNote, rawItemUrl, docsUrl, previewUrl, installToken, viewCommand, installCommand, dependencies, devDependencies, registryDependencies, files, proposed/existing tags, and warnings.
- Validate optional URL fields through the existing URL policy helpers or equivalent absolute URL checks.
- Validate optional command/token fields so unsafe strings cannot become copyable commands.
- Support explicit raw item URLs for imported records when the official registry URL template cannot produce a valid item route.
- Keep route eligibility honest when templates contain unresolved placeholders such as `{style}`.
</must_haves>

<context_decisions>
- D-05: This plan preserves item-level metadata where available: slug/name, title/description, type, category/tags, dependencies, dev dependencies, registry dependencies, files, targets, raw item URL, install token, view command, install command, and catalog/source status.
- D-07: This plan uses status language to avoid misleading users and to distinguish catalog-backed, inferred, unavailable, and manual-follow-up data.
- D-08: This plan ensures catalog-backed items may expose stronger metadata/actions only when the app has concrete route/item source data, while inferred/unavailable items do not pretend to be installable.
- D-09: This plan preserves the boundary that Registry Atlas does not audit, endorse, or certify third-party registry code.
- D-11: This plan preserves the copy-only command posture: new items may get view/add command strings only when namespace/item/token/route data is valid, and the browser never executes them.
</context_decisions>

<threat_model>
- Assets: type-safe runtime data, command generation, raw item/source links, and catalog status accuracy.
- Threats: optional imported fields bypassing validation; unresolved route template placeholders being treated as valid URLs; malicious command strings in imported JSON; unsafe external URL protocols; existing v1.0 data failing after schema expansion.
- Controls: optional-field validation, token regex reuse, route resolver unresolved-placeholder check, URL protocol checks, loader tests for old and new shapes, and `pnpm validate:data` release gate.
- High severity gate: if a route-eligible item can produce a URL with unresolved `{placeholder}` text, unsafe protocol, or a command token that fails `@namespace/item` validation, stop and fix before proceeding.
</threat_model>

<tasks>
<task id="T1" title="Extend item summary and file metadata types">
  <read_first>
    - src/registry-explorer/core/registry.schema.ts
    - .planning/phases/05-expanded-component-catalog/05-CONTEXT.md
    - .planning/phases/05-expanded-component-catalog/05-RESEARCH.md
    - registry-altas-improvement-phase/gpt-agent-outputs/registry-catalog.normalized.json
  </read_first>
  <action>
    Update `RegistryItemSummary` in `src/registry-explorer/core/registry.schema.ts` with optional fields for `title`, `description`, `confidence`, `evidenceUrl`, `evidenceNote`, `rawItemUrl`, `docsUrl`, `previewUrl`, `installToken`, `viewCommand`, `installCommand`, `dependencies`, `devDependencies`, `registryDependencies`, `files`, `componentTagsExisting`, `componentTagsProposed`, and `warnings`. Add a `RegistryItemSummaryFile` interface with `path`, `type`, and optional `target`. Add profile/candidate fields only where needed by downstream plans, keeping names camelCase in TypeScript.
  </action>
  <verify>
    Run `pnpm typecheck` after loader and validation tasks are complete.
  </verify>
  <acceptance_criteria>
    - `RegistryItemSummary` includes optional camelCase fields for every richer imported metadata group listed in the action.
    - `RegistryItemSummaryFile` exists and supports `path`, `type`, and optional `target`.
    - Existing test fixtures that omit the richer fields compile without adding placeholder values.
  </acceptance_criteria>
</task>

<task id="T2" title="Map richer runtime JSON into display models">
  <read_first>
    - src/registry-explorer/data/loadRegistries.ts
    - src/registry-explorer/core/registry.schema.ts
    - tests/registry-explorer/registryLoader.test.ts
  </read_first>
  <action>
    Extend `RegistryMirrorRecord.atlas.item_summaries[]` in `src/registry-explorer/data/loadRegistries.ts` to accept snake_case fields from generated JSON and update `mapItemSummaries()` to map them into the new camelCase `RegistryItemSummary` fields. Preserve existing mappings for `catalog_status`/`catalogStatus` and `route_eligible`/`routeEligible`.
  </action>
  <verify>
    Run `pnpm test -- tests/registry-explorer/registryLoader.test.ts` and `pnpm typecheck`.
  </verify>
  <acceptance_criteria>
    - Loader tests prove `raw_item_url` maps to `rawItemUrl`.
    - Loader tests prove `evidence_url` maps to `evidenceUrl`.
    - Loader tests prove `registryDependencies`, `dependencies`, and `files[].target` are preserved.
    - Existing loader tests with old item summaries still pass unchanged or with only explicit fixture additions needed for new assertions.
  </acceptance_criteria>
</task>

<task id="T3" title="Harden validation for richer imported item summaries">
  <read_first>
    - src/registry-explorer/core/registryMirror.ts
    - src/registry-explorer/core/installActions.ts
    - src/registry-explorer/core/itemRoutes.ts
    - tests/registry-explorer/registryMirror.test.ts
    - tests/registry-explorer/itemRoutes.test.ts
  </read_first>
  <action>
    Extend `src/registry-explorer/core/registryMirror.ts` with issue codes and validators for optional rich item fields: absolute URL fields (`raw_item_url`, `docs_url`, `preview_url`, `evidence_url`), install/view command strings, install token strings, dependency arrays, registry dependency arrays, file arrays, confidence values, and warnings arrays. Update `src/registry-explorer/core/itemRoutes.ts` so `resolveRegistryItemRoute()` rejects resolved URLs that still contain unresolved `{...}` placeholders; add optional support for explicit `rawItemUrl` only if the caller provides a validated raw URL for a specific imported item.
  </action>
  <verify>
    Run `pnpm test -- tests/registry-explorer/registryMirror.test.ts tests/registry-explorer/itemRoutes.test.ts` and `pnpm validate:data`.
  </verify>
  <acceptance_criteria>
    - `validateRegistryMirror()` accepts old v1.0 item summary fixtures.
    - `validateRegistryMirror()` accepts a rich fixture with dependencies, registryDependencies, files, raw item URL, evidence URL, and install token.
    - Invalid optional URL protocols produce validation errors.
    - Invalid install tokens or command strings produce validation errors or prevent command exposure.
    - `resolveRegistryItemRoute('@diceui', 'https://diceui.com/r/{style}/{name}.json', 'action-bar')` does not return an available route unless unresolved placeholder handling is explicitly resolved by another validated path.
  </acceptance_criteria>
</task>

<task id="T4" title="Update data validation release gate">
  <read_first>
    - scripts/validate-registry-data.mjs
    - src/registry-explorer/core/registryMirror.ts
    - public/data/registries.json
    - package.json
  </read_first>
  <action>
    Ensure `scripts/validate-registry-data.mjs` reports richer item-summary validation issues from `validateRegistryMirror()` without suppressing warnings. If the script currently only checks high-level errors, add output for new rich-field issue codes so generated data failures are visible during `pnpm validate:data` and `pnpm verify`.
  </action>
  <verify>
    Run `pnpm validate:data` and `pnpm verify` after all Phase 5 plans are complete.
  </verify>
  <acceptance_criteria>
    - `pnpm validate:data` exits non-zero for invalid rich item-summary fields in a fixture or direct validator test.
    - `pnpm validate:data` exits 0 for refreshed generated data after Phase 5 import/sync.
    - Validation output includes issue `code`, `namespace`, and `field` for rich item summary failures.
  </acceptance_criteria>
</task>
</tasks>

<verification>
- `pnpm typecheck`
- `pnpm typecheck:test`
- `pnpm test -- tests/registry-explorer/registryMirror.test.ts tests/registry-explorer/registryLoader.test.ts tests/registry-explorer/itemRoutes.test.ts`
- `pnpm validate:data`
</verification>

<success_criteria>
- Rich imported item metadata survives from generated JSON into TypeScript display models.
- Validation remains backward-compatible with v1.0 item summaries.
- Route/template mismatches and unsafe command/link fields cannot become enabled copy actions.
- Existing official mirror data still validates after schema expansion.

## Artifacts this phase produces

- `RegistryItemSummaryFile` interface
- `RegistryItemSummary.rawItemUrl`
- `RegistryItemSummary.evidenceUrl`
- `RegistryItemSummary.installToken`
- `RegistryItemSummary.files`
- Rich item-summary validation issue codes in `registryMirror.ts`
- unresolved-placeholder route rejection in `resolveRegistryItemRoute()`

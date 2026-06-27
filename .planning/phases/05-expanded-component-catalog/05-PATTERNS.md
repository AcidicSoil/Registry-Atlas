# Phase 5: Expanded Component Catalog - Pattern Map

## Purpose

Extract existing Registry Atlas patterns that Phase 5 plans must reuse.

## Closest Existing Analogues

### Generated catalog data

- `data/shadcn/registry-items.json`
  - Current source for Atlas item summary enrichment keyed by namespace.
  - Shape is intentionally compact and merged into the official mirror by `scripts/sync-shadcn-registries.mjs`.
  - Phase 5 should extend this source or generate it from the imported normalized catalog rather than hand-editing `public/data/registries.json`.

- `public/data/registries.json`
  - Runtime artifact loaded by the browser.
  - Should be generated/reviewable, not the only source of new catalog data.

### Sync/import path

- `scripts/sync-shadcn-registries.mjs`
  - Reads the official registry directory and merges previous/legacy enrichment plus `data/shadcn/registry-items.json`.
  - Key functions/patterns:
    - `readJsonIfExists(filePath)` for optional JSON inputs.
    - `writeJson(filePath, value)` for deterministic pretty JSON output.
    - `normalizeNamespace(value)` for `@namespace` canonicalization.
    - `normalizeItemSummary(item)` for source item summaries.
    - `normalizeOfficialRegistry(...)` for official + Atlas merged runtime records.
  - Phase 5 should add importer logic either in a new script or small helper functions, keeping deterministic JSON output.

### Runtime validation

- `src/registry-explorer/core/registryMirror.ts`
  - Central mirror validation path used by `loadRegistries()`.
  - Existing validation uses explicit issue codes and `MirrorValidationIssue` objects.
  - Pattern: add new issue codes, validate optional fields only when present, preserve v1.0 valid records.
  - Existing URL validation helpers should be reused for raw item, docs, preview, and evidence URLs where possible.

### Runtime loading

- `src/registry-explorer/data/loadRegistries.ts`
  - Maps runtime JSON snake_case to camelCase domain models.
  - Pattern: local `RegistryMirrorRecord` interface mirrors JSON shape; `mapItemSummaries()` performs item conversion.
  - Phase 5 should extend `RegistryMirrorRecord.atlas.item_summaries[]` and `mapItemSummaries()`.

### Discovery and actions

- `src/registry-explorer/core/discovery.ts`
  - Builds item candidates from item summaries first, then fallback candidates from tags/aliases/focus/namespace/description.
  - Pattern: item candidates can be route/install eligible; fallback candidates must stay disabled.
  - Phase 5 should extend `matchesItem()` and candidate fields without changing command eligibility rules.

- `src/registry-explorer/core/installActions.ts`
  - Owns exact `npx shadcn@latest add` and `npx shadcn@latest view` strings.
  - Phase 5 should not duplicate command-generation logic.

### Registry profile

- `src/registry-explorer/core/registryProfile.ts`
  - Builds profile sections and item rows as pure view models.
  - Phase 5 should add richer facts/item-row fields here before UI rendering.

- `src/registry-explorer/ui/registryProfileView.ts`
  - Renders item rows and install actions with escaped HTML and safe external links.
  - Pattern: all user/catalog text goes through `escapeHtml`; URLs use `renderExternalLink`.

### UI contract

- `public/styles/registry-explorer.css`
  - Manual dark dense visual system, no shadcn components, no Tailwind.
  - Phase 5 should reuse existing classes/patterns and add minimal selectors for metadata/source chips if needed.

## Test Patterns

- `tests/registry-explorer/registryMirror.test.ts`
  - Validation unit tests use `createMirror()` / `createRecord()` fixtures.
  - Extend this file for richer item summary validation.

- `tests/registry-explorer/registryLoader.test.ts`
  - Loader tests use a fake `fetchImpl` and `jsonResponse()`.
  - Extend fixture to prove richer fields map correctly.

- `tests/registry-explorer/discovery.test.ts`
  - Pure discovery tests assert candidate ordering, match field, install action, and fallback behavior.
  - Add tests for imported item search by title/description/dependency/source metadata only if Phase 5 extends matching.

- `tests/registry-explorer/registryProfile.test.ts`
  - Profile tests assert section names/facts/item rows.
  - Add tests for richer item metadata and source links.

- `tests/registry-explorer/registryData.test.ts`
  - Artifact-level tests already assert allowed focus/tag values.
  - Add assertions that `@delego`, `@delta`, and `@diceui` have expected imported item summaries after sync.

## File Roles for Plans

### Likely created files

- `scripts/import-registry-catalog.mjs` — deterministic converter from imported normalized catalog to Atlas source JSON/report.
- `tests/registry-explorer/registryCatalogImport.test.ts` — importer/conversion tests if the script exports pure helpers.
- `data/shadcn/registry-catalog-import-report.json` — optional review report summarizing imported registries/items/warnings.

### Likely modified files

- `data/shadcn/registry-items.json`
- `scripts/sync-shadcn-registries.mjs`
- `scripts/validate-registry-data.mjs`
- `public/data/registries.json`
- `src/registry-explorer/core/registry.schema.ts`
- `src/registry-explorer/core/registryMirror.ts`
- `src/registry-explorer/data/loadRegistries.ts`
- `src/registry-explorer/core/discovery.ts`
- `src/registry-explorer/core/registryProfile.ts`
- `src/registry-explorer/ui/discoveryView.ts`
- `src/registry-explorer/ui/registryProfileView.ts`
- `tests/registry-explorer/*.test.ts`

## Planning Guidance

- Keep plans coarse but executable.
- Every plan should have a strong verification command.
- Do not allow UI renderers to infer safety or eligibility; use core model fields.
- Do not let Phase 5 become the v1.2 item-detail viewer.
- Treat generated data changes as outputs of scripts/source fixtures, not hand-maintained final truth.

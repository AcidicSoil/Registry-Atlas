---
phase: 05-expanded-component-catalog
plan: 05-01-import-normalized-catalog
type: implementation
wave: 1
depends_on: []
files_modified:
  - scripts/import-registry-catalog.mjs
  - scripts/sync-shadcn-registries.mjs
  - data/shadcn/registry-items.json
  - data/shadcn/registry-catalog-import-report.json
  - public/data/registries.json
  - tests/registry-explorer/registryCatalogImport.test.ts
  - tests/registry-explorer/registryData.test.ts
autonomous: true
requirements: [CAT-01, CAT-02, CAT-03, CAT-05, CAT-06]
must_haves:
  truths:
    - "CAT-01: Users can discover component items from @delego, @delta, and @diceui after generated data is refreshed."
    - "CAT-02: Maintainers can import normalized researched data without manually retyping records."
    - "CAT-03: Registry records preserve useful metadata such as homepage/source, catalog availability, framework, license, and route eligibility."
    - "CAT-05: Catalog-backed records are distinct from inferred or unavailable records."
    - "CAT-06: Existing v1.0 official mirror data remains valid and usable."
---

<objective>
Create a deterministic import path from `registry-altas-improvement-phase/gpt-agent-outputs/registry-catalog.normalized.json` into Registry Atlas source/generated data so `@delego`, `@delta`, and `@diceui` items can enter the existing static catalog without manual retyping or direct-only edits to `public/data/registries.json`.


Decision coverage: D-01, D-02, D-04, D-06, D-10, D-12.
</objective>

<must_haves>
- Read the normalized research catalog from `registry-altas-improvement-phase/gpt-agent-outputs/registry-catalog.normalized.json`.
- Emit Atlas item summaries keyed by namespace into `data/shadcn/registry-items.json`.
- Preserve available item fields needed by later plans: name, slug, title, description, type, category, existing/proposed tags, source, provenance, catalog status, confidence, route eligibility, install token, view command, install command, raw item URL, docs URL, preview URL, evidence URL, dependencies, devDependencies, registryDependencies, files, and warnings.
- Produce a reviewable import report that lists imported namespaces, item counts, warnings, skipped records, and route/template mismatches.
- Do not make `@7ovr`, `@devl`, or other manual-follow-up registries route-eligible in this plan.
- Keep the official shadcn directory as the registry membership source; the imported catalog enriches existing official namespace records.
</must_haves>

<context_decisions>
- D-01: This plan serves the product goal of getting more components into Registry Atlas, not creating a standalone evidence-management feature.
- D-02: This plan uses the imported research bundle directly so the user does not need to re-explain existing documents.
- D-04: This plan treats `@delego`, `@delta`, and `@diceui` as the first catalog expansion set.
- D-06: This plan keeps manual-follow-up registries such as `@7ovr` and `@devl` out of v1.1 generated route-eligible implementation.
- D-10: This plan imports/stages normalized data from `registry-catalog.normalized.json` instead of manually retyping records.
- D-12: This plan fits the existing static app and generated data pipeline and does not add a backend.
</context_decisions>

<threat_model>
- Assets: generated catalog data, copyable command strings, user trust in route/source metadata, and release pipeline integrity.
- Threats: imported research silently overriding official registry membership; malformed install tokens producing unsafe commands; route/template mismatches enabling broken raw links; hand-edited runtime data being overwritten by sync; third-party code being implied as audited.
- Controls: deterministic importer, namespace filtering against official mirror output, strict token/slug validation, import report warnings, no browser execution, no security endorsement copy, and `pnpm validate:data` / `pnpm verify` release gates.
- High severity gate: if imported data can create command strings containing whitespace, shell metacharacters, URL text in command tokens, or namespace/item pairs outside the official directory, stop and fix before continuing.
</threat_model>

<tasks>
<task id="T1" title="Add normalized catalog importer">
  <read_first>
    - .planning/phases/05-expanded-component-catalog/05-CONTEXT.md
    - .planning/phases/05-expanded-component-catalog/05-RESEARCH.md
    - .planning/phases/05-expanded-component-catalog/05-PATTERNS.md
    - registry-altas-improvement-phase/gpt-agent-outputs/registry-catalog.normalized.json
    - scripts/sync-shadcn-registries.mjs
    - data/shadcn/registry-items.json
  </read_first>
  <action>
    Create `scripts/import-registry-catalog.mjs` with exported pure helpers for `normalizeNamespace`, `normalizeImportedItem`, `buildRegistryItemsByNamespace`, and `buildImportReport`, plus a CLI entrypoint that reads `registry-altas-improvement-phase/gpt-agent-outputs/registry-catalog.normalized.json` by default and writes `data/shadcn/registry-items.json` and `data/shadcn/registry-catalog-import-report.json`. The importer must map source item arrays under `registries[].items[]` into the namespace-keyed object shape consumed by `scripts/sync-shadcn-registries.mjs`.
  </action>
  <verify>
    Run `node scripts/import-registry-catalog.mjs --dry-run` after adding dry-run support or run the importer against a temp output path in tests.
  </verify>
  <acceptance_criteria>
    - `scripts/import-registry-catalog.mjs` exists and exports `buildRegistryItemsByNamespace` and `buildImportReport`.
    - Importing the normalized catalog returns namespace keys `@delego`, `@delta`, and `@diceui`.
    - The importer maps at least one known source item for each namespace: `delego-theme`, `input-otp`, and `action-bar` when present in the source JSON.
    - The importer preserves `raw_item_url`, `evidence_url`, `install_token`, `view_command`, `install_command`, dependency arrays, registry dependency arrays, and file arrays when present.
    - The importer report contains `registry_count`, `item_count`, `namespaces`, `warnings`, and `skipped` fields.
  </acceptance_criteria>
</task>

<task id="T2" title="Wire importer into generated data refresh">
  <read_first>
    - scripts/import-registry-catalog.mjs
    - scripts/sync-shadcn-registries.mjs
    - package.json
    - data/shadcn/registry-items.json
    - public/data/registries.json
  </read_first>
  <action>
    Update the local data refresh workflow so maintainers can run the importer before the existing official directory sync. Add a package script named `import:catalog` with command `node scripts/import-registry-catalog.mjs`. Ensure `scripts/sync-shadcn-registries.mjs` preserves richer item fields from `data/shadcn/registry-items.json` instead of truncating them to the old v1.0 item summary fields. Refresh `data/shadcn/registry-items.json`, `data/shadcn/registry-catalog-import-report.json`, and `public/data/registries.json` from the importer + sync path.
  </action>
  <verify>
    Run `pnpm import:catalog`, then `pnpm sync:registries`, then `pnpm validate:data`.
  </verify>
  <acceptance_criteria>
    - `package.json` contains script `"import:catalog": "node scripts/import-registry-catalog.mjs"`.
    - `data/shadcn/registry-items.json` contains non-empty arrays for `@delego`, `@delta`, and `@diceui`.
    - `public/data/registries.json` contains non-empty `atlas.item_summaries` arrays for `@delego`, `@delta`, and `@diceui` after sync.
    - Existing namespaces from v1.0 such as `@8bitcn`, `@assistant-ui`, and `@better-upload` remain present in `public/data/registries.json`.
    - `pnpm validate:data` exits 0 after the refresh.
  </acceptance_criteria>
</task>

<task id="T3" title="Add importer and artifact tests">
  <read_first>
    - scripts/import-registry-catalog.mjs
    - tests/registry-explorer/registryData.test.ts
    - tests/registry-explorer/registryMirror.test.ts
    - registry-altas-improvement-phase/gpt-agent-outputs/registry-catalog.normalized.json
    - public/data/registries.json
  </read_first>
  <action>
    Add `tests/registry-explorer/registryCatalogImport.test.ts` for the importer helpers and extend `tests/registry-explorer/registryData.test.ts` with artifact assertions for imported catalog namespaces and route/action metadata. Tests should prove the import is deterministic and that generated data includes the three v1.1 sample registries without dropping existing v1.0 registry data.
  </action>
  <verify>
    Run `pnpm test -- tests/registry-explorer/registryCatalogImport.test.ts tests/registry-explorer/registryData.test.ts` and `pnpm typecheck:test`.
  </verify>
  <acceptance_criteria>
    - Importer tests assert namespace keys exactly include `@delego`, `@delta`, and `@diceui` for the source catalog.
    - Importer tests assert known item slugs are preserved for each namespace.
    - Artifact tests assert `public/data/registries.json` has route-eligible catalog-backed item summaries for imported records where route data is valid.
    - Artifact tests assert existing v1.0 seeded item summaries still exist for at least one previously seeded namespace.
  </acceptance_criteria>
</task>
</tasks>

<verification>
- `pnpm import:catalog`
- `pnpm sync:registries`
- `pnpm validate:data`
- `pnpm test -- tests/registry-explorer/registryCatalogImport.test.ts tests/registry-explorer/registryData.test.ts`
- `pnpm typecheck:test`
</verification>

<success_criteria>
- Normalized researched catalog data is imported without manual retyping.
- `@delego`, `@delta`, and `@diceui` have generated item summaries in runtime data.
- Generated data remains aligned with the official shadcn directory and existing v1.0 records.
- Maintainers get a review report for item counts, warnings, skipped records, and route/template mismatches.

## Artifacts this phase produces

- `scripts/import-registry-catalog.mjs`
- `buildRegistryItemsByNamespace()`
- `buildImportReport()`
- `normalizeImportedItem()`
- `data/shadcn/registry-catalog-import-report.json`
- `package.json` script `import:catalog`
- `tests/registry-explorer/registryCatalogImport.test.ts`

---
phase: 06-component-search-and-taxonomy
plan: 06-01-taxonomy-vocabulary-data
type: implementation
wave: 1
depends_on: []
files_modified:
  - src/registry-explorer/core/registry.schema.ts
  - src/registry-explorer/core/componentTaxonomy.ts
  - src/registry-explorer/core/labels.ts
  - scripts/import-registry-catalog.mjs
  - scripts/sync-shadcn-registries.mjs
  - src/registry-explorer/core/registryMirror.ts
  - data/shadcn/registry-items.json
  - public/data/registries.json
  - tests/registry-explorer/componentTaxonomy.test.ts
  - tests/registry-explorer/registryData.test.ts
autonomous: true
requirements: [DISC-01, DISC-02, DISC-03, DISC-05]
must_haves:
  truths:
    - "DISC-01: Users can search/filter newly added components by proposed tag and category-backed metadata."
    - "DISC-02: New categories from the research bundle are discoverable."
    - "DISC-03: Proposed component tags from component-taxonomy.proposed.json are added where they expose actual cataloged items."
    - "DISC-05: Taxonomy behavior is covered by tests and verify."
---

<objective>
Add the researched component taxonomy as a first-class, reviewable core vocabulary so imported catalog items can carry user-facing tags, labels, and categories without bypassing Registry Atlas controlled-data patterns.

Decision coverage: D-01, D-02, D-03, D-04, D-05, D-06.
</objective>

<must_haves>
- Read `registry-altas-improvement-phase/gpt-agent-outputs/component-taxonomy.proposed.json` and support all useful proposed tags backed by imported item examples for `@delego`, `@delta`, and `@diceui`.
- Add accepted proposed tags to `COMPONENT_TAG_VALUES` or an equivalent controlled taxonomy layer that is validated and tested.
- Add a core taxonomy metadata module for tag labels, category IDs/labels, reasons, and example item references.
- Preserve existing v1.0 tags and Phase 5 imported data.
- Keep uncertain/harder-to-get coverage honest; do not treat unsupported tags as catalog-backed without item evidence.
</must_haves>

<threat_model>
- Assets: controlled component vocabulary, generated catalog data, user-facing taxonomy labels, and trust/status semantics.
- Threats: proposed tags bypassing validation; registry-level tags drifting from item-level tags; unsupported/manual-follow-up tags becoming catalog-backed; awkward labels becoming hard-coded layout debt.
- Controls: single core taxonomy module, vocabulary alignment tests, importer/sync normalization tests, validation for proposed tag values, and generated-data artifact tests.
- High severity gate: if generated runtime data can contain a proposed tag that is not accepted by the app vocabulary/taxonomy validators, stop and fix before continuing.
</threat_model>

<tasks>
<task id="T1" title="Add taxonomy metadata core module">
  <read_first>
    - .planning/phases/06-component-search-and-taxonomy/06-CONTEXT.md
    - .planning/phases/06-component-search-and-taxonomy/06-RESEARCH.md
    - registry-altas-improvement-phase/gpt-agent-outputs/component-taxonomy.proposed.json
    - src/registry-explorer/core/registry.schema.ts
    - src/registry-explorer/core/labels.ts
  </read_first>
  <action>
    Create `src/registry-explorer/core/componentTaxonomy.ts` with a typed list of accepted proposed taxonomy entries. Each entry should include `tag`, `label`, `category`, `categoryLabel`, `reason`, and `exampleItems`. Include all proposed tags backed by imported sample items. Add helpers such as `componentTaxonomyEntry(tag)`, `componentTaxonomyLabel(tag)`, `componentTaxonomyCategory(tag)`, and `componentTaxonomyCategoryLabel(category)`.
  </action>
  <verify>
    Run `pnpm test -- tests/registry-explorer/componentTaxonomy.test.ts` after tests are added.
  </verify>
  <acceptance_criteria>
    - `componentTaxonomy.ts` exists and exports accepted taxonomy entries.
    - Entries include researched tags such as `theme`, `status-pill`, `decision-pill`, `otp-input`, `code-block`, `ai-chat`, `map-pointer`, `angle-slider`, `color-picker`, `compare-slider`, and `cropper`.
    - Each accepted taxonomy entry has a non-empty label and category label.
    - Example item references use imported namespaces and slugs where available.
  </acceptance_criteria>
</task>

<task id="T2" title="Promote researched tags into controlled vocabulary and labels">
  <read_first>
    - src/registry-explorer/core/registry.schema.ts
    - src/registry-explorer/core/labels.ts
    - src/registry-explorer/core/componentTaxonomy.ts
    - tests/registry-explorer/matrixColumns.test.ts
  </read_first>
  <action>
    Add accepted researched tags to `COMPONENT_TAG_VALUES` or wire `ComponentTag` to include them through the taxonomy module. Update `componentLabel()` to use explicit taxonomy labels before falling back to hyphen replacement. Keep `ai-chat` valid as a component tag while preserving its existing role as a primary focus value.
  </action>
  <verify>
    Run `pnpm typecheck` and `pnpm test -- tests/registry-explorer/componentTaxonomy.test.ts tests/registry-explorer/matrixColumns.test.ts`.
  </verify>
  <acceptance_criteria>
    - Accepted proposed tags type-check as `ComponentTag` values.
    - `componentLabel('qr-code')` returns `QR code`, not just `qr code`.
    - Existing matrix column tests still pass.
    - Existing v1.0 component tags remain valid.
  </acceptance_criteria>
</task>

<task id="T3" title="Normalize generated data with first-class taxonomy tags">
  <read_first>
    - scripts/import-registry-catalog.mjs
    - scripts/sync-shadcn-registries.mjs
    - src/registry-explorer/core/registryMirror.ts
    - data/shadcn/registry-items.json
    - public/data/registries.json
    - tests/registry-explorer/registryData.test.ts
  </read_first>
  <action>
    Update import/sync/validation so accepted proposed item tags can be validated and, where useful, reflected into registry-level component tags for the imported sample registries. Avoid duplicating unsupported/manual-follow-up tags as catalog-backed. Regenerate `data/shadcn/registry-items.json` and `public/data/registries.json` through `pnpm import:catalog` and `pnpm sync:registries`.
  </action>
  <verify>
    Run `pnpm import:catalog`, `pnpm sync:registries`, `pnpm validate:data`, and `pnpm test -- tests/registry-explorer/registryData.test.ts tests/registry-explorer/componentTaxonomy.test.ts`.
  </verify>
  <acceptance_criteria>
    - `public/data/registries.json` exposes accepted researched tags for imported registries where item summaries have those tags.
    - `@delego` exposes tags such as `theme`, `status-pill`, `decision-pill`, `receipt`, or `audit` when backed by imported items.
    - `@delta` exposes tags such as `otp-input`, `code-block`, `qr-code`, `ai-chat`, or `map-pointer` when backed by imported items.
    - `@diceui` exposes tags such as `angle-slider`, `color-picker`, `compare-slider`, or `cropper` when backed by imported items.
    - `pnpm validate:data` exits 0 after regeneration.
  </acceptance_criteria>
</task>
</tasks>

<verification>
- `pnpm import:catalog`
- `pnpm sync:registries`
- `pnpm validate:data`
- `pnpm typecheck`
- `pnpm test -- tests/registry-explorer/componentTaxonomy.test.ts tests/registry-explorer/registryData.test.ts tests/registry-explorer/matrixColumns.test.ts`
</verification>

<success_criteria>
- The researched proposed taxonomy is represented in core code and generated data.
- Labels/categories are explicit and tested.
- Imported registries expose catalog-backed taxonomy tags where item evidence exists.
- Existing v1.0 tags and Phase 5 generated catalog behavior continue to work.

## Artifacts this phase produces

- `src/registry-explorer/core/componentTaxonomy.ts`
- taxonomy/category helper functions
- expanded `COMPONENT_TAG_VALUES`
- taxonomy alignment tests
- regenerated data with imported researched tags surfaced safely

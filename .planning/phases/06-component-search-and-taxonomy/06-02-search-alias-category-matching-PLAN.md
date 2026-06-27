---
phase: 06-component-search-and-taxonomy
plan: 06-02-search-alias-category-matching
type: implementation
wave: 2
depends_on: [06-01-taxonomy-vocabulary-data]
files_modified:
  - src/registry-explorer/core/componentTaxonomy.ts
  - src/registry-explorer/core/discovery.ts
  - src/registry-explorer/core/registry.schema.ts
  - src/registry-explorer/core/grouping.ts
  - src/registry-explorer/core/registryProfile.ts
  - tests/registry-explorer/discovery.test.ts
  - tests/registry-explorer/grouping.test.ts
  - tests/registry-explorer/componentTaxonomy.test.ts
autonomous: true
requirements: [DISC-01, DISC-02, DISC-03, DISC-04, DISC-05]
must_haves:
  truths:
    - "DISC-01: User can search/filter by registry namespace, proposed tag, category, and useful aliases."
    - "DISC-02: New categories from the research bundle are discoverable."
    - "DISC-03: Proposed tags are used to expose actual cataloged items."
    - "DISC-04: Search/profile behavior preserves status semantics."
    - "DISC-05: Search behavior is tested and part of verify."
---

<objective>
Improve core discovery/search so the expanded catalog can be found through simple aliases and taxonomy categories without adding a heavy search engine or redesigning the UI.

Decision coverage: D-07, D-10, D-11, D-12, D-13, D-14.
</objective>

<must_haves>
- Keep alias behavior simple and maintainable: derived aliases from tags/slugs/titles/categories are acceptable; a small curated alias table is acceptable where clearer.
- Search should find imported items by category concepts such as AI/chat, code/markdown, OTP/forms, badges/pills, color/media, map/location, receipt/audit, and theme.
- Keep exact item/tag matches ranked above broad category/metadata matches.
- Fallback candidates must remain disabled for install/view actions.
- Do not add a third-party search library or backend.
</must_haves>

<threat_model>
- Assets: search relevance, status honesty, install action safety, and user trust in matched results.
- Threats: broad aliases producing noisy or misleading matches; inferred/category matches enabling commands; category values being confused with security claims; exact item matches being buried under broad matches.
- Controls: pure-core alias expansion, explicit match reasons, ranking tests, fallback disabled-action tests, and status label preservation.
- High severity gate: if a non-item fallback/category/alias match can enable a copy install/view action without route-eligible item metadata, stop and fix before continuing.
</threat_model>

<tasks>
<task id="T1" title="Add simple taxonomy alias expansion">
  <read_first>
    - src/registry-explorer/core/componentTaxonomy.ts
    - src/registry-explorer/core/discovery.ts
    - tests/registry-explorer/componentTaxonomy.test.ts
    - .planning/phases/06-component-search-and-taxonomy/06-CONTEXT.md
  </read_first>
  <action>
    Add taxonomy alias helpers such as `componentTaxonomyAliases(tag)`, `expandComponentSearchTerms(value)`, or an equivalent simple API. Cover obvious aliases like `qrcode` -> `qr-code`, `chat` -> `ai-chat` / `chat-interface`, `map` -> `map-pointer`, `otp` -> `otp-input`, `code` -> `code-block`, `syntax` -> `syntax-highlighting`, `receipt` -> `receipt` / `audit`, and `color` -> `color-picker` / `color-swatch`.
  </action>
  <verify>
    Run `pnpm test -- tests/registry-explorer/componentTaxonomy.test.ts`.
  </verify>
  <acceptance_criteria>
    - Alias helper tests cover `qr`, `qrcode`, `otp`, `code`, `chat`, `map`, `receipt`, `audit`, `color`, and `crop` search terms.
    - Alias behavior is deterministic and does not require external dependencies.
  </acceptance_criteria>
</task>

<task id="T2" title="Use taxonomy aliases/categories in discovery matching and ranking">
  <read_first>
    - src/registry-explorer/core/discovery.ts
    - src/registry-explorer/core/componentTaxonomy.ts
    - src/registry-explorer/core/registry.schema.ts
    - tests/registry-explorer/discovery.test.ts
  </read_first>
  <action>
    Update `searchComponentCandidates()` and item/fallback matching to compare normalized queries against taxonomy aliases, category IDs, category labels, explicit tag labels, item tags, registry tags, item slugs/titles, and namespace. Add clear match reasons such as `Taxonomy tag match`, `Taxonomy category match`, or `Alias match`. Preserve ranking so exact item/tag matches outrank broad category matches.
  </action>
  <verify>
    Run `pnpm test -- tests/registry-explorer/discovery.test.ts` and `pnpm typecheck`.
  </verify>
  <acceptance_criteria>
    - Searching `qrcode` or `qr code` finds the imported QR code item.
    - Searching `ai chat` finds the imported chat item.
    - Searching `map` finds the imported map pointer item.
    - Searching `color` finds Dice UI color picker/swatch items.
    - Searching `receipt` or `audit` finds Delego signed receipt.
    - Broad category/alias matches do not enable actions unless a concrete route-eligible item candidate is matched.
  </acceptance_criteria>
</task>

<task id="T3" title="Expose category concepts in grouping/profile view models">
  <read_first>
    - src/registry-explorer/core/grouping.ts
    - src/registry-explorer/core/registryProfile.ts
    - src/registry-explorer/core/componentTaxonomy.ts
    - tests/registry-explorer/grouping.test.ts
    - tests/registry-explorer/registryProfile.test.ts
  </read_first>
  <action>
    Add derived taxonomy category metadata to component groups and/or registry profile item rows where it improves discovery without layout redesign. This can be a category label on item rows, a category field in `ComponentCandidate`, or category grouping data used by existing component group UI. Keep derived data in core view models, not renderers.
  </action>
  <verify>
    Run `pnpm test -- tests/registry-explorer/grouping.test.ts tests/registry-explorer/registryProfile.test.ts tests/registry-explorer/discovery.test.ts`.
  </verify>
  <acceptance_criteria>
    - Core tests prove categories such as `AI & Chat`, `Code & Markdown`, `Forms`, `Badges & Chips`, `Maps & Location`, and `Media & Images` can be derived from accepted taxonomy tags.
    - Registry profile rows can expose category labels for item tags where present.
    - Renderers are not required to infer category semantics themselves.
  </acceptance_criteria>
</task>
</tasks>

<verification>
- `pnpm typecheck`
- `pnpm typecheck:test`
- `pnpm test -- tests/registry-explorer/componentTaxonomy.test.ts tests/registry-explorer/discovery.test.ts tests/registry-explorer/grouping.test.ts tests/registry-explorer/registryProfile.test.ts`
</verification>

<success_criteria>
- Users can find imported items through obvious aliases and category concepts.
- Exact and catalog-backed item matches remain prioritized over broad fallback matches.
- Fallback/category-only matches do not enable install/view actions.
- Alias/category behavior is small, deterministic, and tested.

## Artifacts this phase produces

- taxonomy alias helper(s)
- taxonomy category helper(s)
- richer discovery match reasons
- tests for category/alias search behavior

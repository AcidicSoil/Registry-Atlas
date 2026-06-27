---
phase: 06-component-search-and-taxonomy
plan: 06-03-status-aware-taxonomy-ui
type: implementation
wave: 3
depends_on: [06-01-taxonomy-vocabulary-data, 06-02-search-alias-category-matching]
files_modified:
  - src/registry-explorer/ui/discoveryView.ts
  - src/registry-explorer/ui/registryProfileView.ts
  - src/registry-explorer/core/discovery.ts
  - src/registry-explorer/core/registryProfile.ts
  - public/styles/registry-explorer.css
  - README.md
  - tests/registry-explorer/discovery.test.ts
  - tests/registry-explorer/registryProfile.test.ts
  - tests/registry-explorer/renderSafety.test.ts
autonomous: true
requirements: [DISC-01, DISC-02, DISC-04, DISC-05]
must_haves:
  truths:
    - "DISC-01: Users can see why taxonomy/search matches occurred."
    - "DISC-02: New categories are discoverable in current UI surfaces."
    - "DISC-04: Search and profile UI clearly communicate catalog-backed, inferred, unavailable, and manual-follow-up states."
    - "DISC-05: UI/search behavior is tested and verify passes."
---

<objective>
Surface taxonomy/category/status information in the existing discovery and registry profile UI using concise, safe labels while deferring the broader layout audit and item-detail viewer.

Decision coverage: D-07, D-08, D-09, D-13, D-14, D-15.
</objective>

<must_haves>
- Keep UI incremental: no new route, no full redesign, no raw item viewer.
- Use simple status wording: catalog-backed, inferred, unavailable, manual follow-up where appropriate.
- Show concise taxonomy/category information where it helps users understand search results.
- Keep imported text escaped and external links safe.
- Keep docs clear that Registry Atlas does not audit or endorse third-party registry code.
</must_haves>

<threat_model>
- Assets: user understanding, status honesty, safe rendering, and future layout flexibility.
- Threats: UI implying audit/trust; category/status labels becoming misleading; long taxonomy reasons cluttering dense result rows; layout changes making future audit harder; unsafe imported strings rendered as HTML.
- Controls: concise chips/labels, escaped render helpers, no trust language, docs note, render safety tests, and `pnpm verify`.
- High severity gate: if imported taxonomy reasons/provenance are rendered unescaped or UI copy implies safety/audit/endorsement, stop and fix before continuing.
</threat_model>

<tasks>
<task id="T1" title="Add taxonomy/status fields to view models">
  <read_first>
    - src/registry-explorer/core/discovery.ts
    - src/registry-explorer/core/registryProfile.ts
    - src/registry-explorer/core/componentTaxonomy.ts
    - src/registry-explorer/core/registry.schema.ts
    - tests/registry-explorer/discovery.test.ts
    - tests/registry-explorer/registryProfile.test.ts
  </read_first>
  <action>
    Add concise taxonomy/category/status fields to `ComponentCandidate` and `RegistryProfileItemRow` as needed: category label, matched taxonomy tag label, status display label, and simple status explanation. Keep derivation in core view-model functions.
  </action>
  <verify>
    Run `pnpm test -- tests/registry-explorer/discovery.test.ts tests/registry-explorer/registryProfile.test.ts` and `pnpm typecheck`.
  </verify>
  <acceptance_criteria>
    - Candidates can expose category labels and tag labels for taxonomy matches.
    - Profile item rows can expose category labels for imported item tags.
    - Status display labels are derived consistently from existing catalog/coverage status fields.
  </acceptance_criteria>
</task>

<task id="T2" title="Render taxonomy/category/status chips safely">
  <read_first>
    - src/registry-explorer/ui/discoveryView.ts
    - src/registry-explorer/ui/registryProfileView.ts
    - src/registry-explorer/ui/renderSafety.ts
    - public/styles/registry-explorer.css
    - tests/registry-explorer/renderSafety.test.ts
  </read_first>
  <action>
    Update discovery/profile renderers to show concise taxonomy category/tag chips and simple status labels. Reuse existing chip/list patterns and add only minimal CSS selectors if needed. Escape all imported labels and do not render long taxonomy reasons in result rows.
  </action>
  <verify>
    Run `pnpm test -- tests/registry-explorer/renderSafety.test.ts tests/registry-explorer/discovery.test.ts tests/registry-explorer/registryProfile.test.ts`.
  </verify>
  <acceptance_criteria>
    - Discovery/profile UI can display labels such as `Code & Markdown`, `AI & Chat`, `Badges & Chips`, and `catalog-backed`.
    - Imported text is escaped through existing helpers.
    - UI does not contain raw item JSON tabs, item-detail route behavior, or broad layout audit changes.
  </acceptance_criteria>
</task>

<task id="T3" title="Document taxonomy/search maintenance and run full verification">
  <read_first>
    - README.md
    - .planning/phases/06-component-search-and-taxonomy/06-CONTEXT.md
    - .planning/phases/06-component-search-and-taxonomy/06-RESEARCH.md
    - package.json
  </read_first>
  <action>
    Add concise docs only if needed to explain taxonomy/search maintenance, accepted proposed tags, fallback/manual-follow-up behavior, and the non-endorsement boundary. Keep docs scoped to current data maintenance and discovery behavior.
  </action>
  <verify>
    Run `pnpm verify`.
  </verify>
  <acceptance_criteria>
    - `pnpm verify` exits 0.
    - Docs mention the taxonomy/search behavior only if implementation changes require maintenance guidance.
    - Docs do not claim Registry Atlas audits or endorses third-party registry code.
  </acceptance_criteria>
</task>
</tasks>

<verification>
- `pnpm typecheck`
- `pnpm typecheck:test`
- `pnpm test -- tests/registry-explorer/componentTaxonomy.test.ts tests/registry-explorer/discovery.test.ts tests/registry-explorer/registryProfile.test.ts tests/registry-explorer/renderSafety.test.ts`
- `pnpm validate:data`
- `pnpm verify`
</verification>

<success_criteria>
- Users can understand taxonomy/category/status search results in current UI surfaces.
- Status language is simple, honest, and revisable.
- UI changes are incremental and safe.
- Full verification passes.

## Artifacts this phase produces

- taxonomy/category display fields in core view models
- concise taxonomy/status UI chips
- render safety coverage for taxonomy/status labels
- maintenance docs if needed

---
phase: 05-expanded-component-catalog
plan: 05-03-expanded-catalog-discovery-profile
type: implementation
wave: 3
depends_on: [05-01-import-normalized-catalog, 05-02-rich-item-schema-validation]
files_modified:
  - src/registry-explorer/core/discovery.ts
  - src/registry-explorer/core/registryProfile.ts
  - src/registry-explorer/core/registry.schema.ts
  - src/registry-explorer/ui/discoveryView.ts
  - src/registry-explorer/ui/registryProfileView.ts
  - public/styles/registry-explorer.css
  - tests/registry-explorer/discovery.test.ts
  - tests/registry-explorer/registryProfile.test.ts
  - tests/registry-explorer/renderSafety.test.ts
autonomous: true
requirements: [CAT-01, CAT-03, CAT-04, CAT-05, CAT-06]
must_haves:
  truths:
    - "CAT-01: Users can discover newly researched component items in Registry Atlas."
    - "CAT-03: Registry metadata from the research bundle is visible where useful."
    - "CAT-04: Item summaries expose route, command, dependency, file, source, and evidence metadata where available."
    - "CAT-05: UI distinguishes catalog-backed data from inferred, unavailable, or manual-follow-up data."
    - "CAT-06: v1.0 discovery/profile behavior remains usable."
---

<objective>
Expose the expanded catalog in existing discovery and registry profile surfaces so users can find `@delego`, `@delta`, and `@diceui` items, understand catalog-backed vs inferred status, and copy/open route/source actions without introducing the v1.2 raw item-detail viewer.


Decision coverage: D-01, D-03, D-07, D-08, D-09, D-11, D-13.
</objective>

<must_haves>
- Preserve the Phase 4 copy-only command posture.
- Keep fallback matches disabled for install/view actions.
- Add richer match/search fields for imported catalog items without pulling in Phase 6 dynamic taxonomy UI.
- Show concise metadata in dense rows; avoid dumping long provenance strings into primary result content.
- Use UI-SPEC copy: “catalog-backed”, “inferred”, “manual follow-up”, “Copy install command”, “Inspect first”, and “Open raw item route”.
- Do not render third-party component source code or raw item JSON in Phase 5.
</must_haves>

<context_decisions>
- D-01: This plan makes more components easier to discover in Registry Atlas.
- D-03: This plan keeps the internal component/item viewer out of Phase 5 and leaves it for the next milestone.
- D-07: This plan surfaces practical status language so users can distinguish catalog-backed, inferred, unavailable, and manual-follow-up records.
- D-08: This plan exposes stronger metadata/actions only for catalog-backed records and keeps inferred/unavailable actions disabled.
- D-09: This plan avoids copy or UI that implies Registry Atlas audits or endorses third-party registry code.
- D-11: This plan keeps commands copy-only and never executes shadcn CLI commands in the browser.
- D-13: This plan focuses on enough discovery/profile exposure to make new components visible and defers raw item JSON rendering to v1.2.
</context_decisions>

<threat_model>
- Assets: discovery accuracy, command safety, source-link safety, and user understanding of third-party registry status.
- Threats: users mistaking inferred records for catalog-backed items; route/source links being rendered unsafely; long provenance text causing visual noise; UI enabling copy commands for invalid records; accidental implementation of v1.2 item viewer scope.
- Controls: core eligibility state, escaped HTML, `renderExternalLink`, status chips, disabled reasons, source/action labels from UI-SPEC, and tests for enabled vs disabled action states.
- High severity gate: if a discovery/profile renderer enables install/view actions without an enabled `InstallActionState`, or renders imported text/URLs without escaping/safe-link helpers, stop and fix before proceeding.
</threat_model>

<tasks>
<task id="T1" title="Expand discovery matching for richer catalog summaries">
  <read_first>
    - src/registry-explorer/core/discovery.ts
    - src/registry-explorer/core/registry.schema.ts
    - tests/registry-explorer/discovery.test.ts
    - .planning/phases/05-expanded-component-catalog/05-UI-SPEC.md
  </read_first>
  <action>
    Update discovery item matching so catalog-backed items can match on `name`, `slug`, `title`, `description`, `type`, `category`, `componentTagsExisting`, `componentTagsProposed`, `dependencies`, and `registryDependencies`. Extend `ComponentCandidate` only as needed to expose concise rich metadata such as description/title, raw item URL, docs URL, evidence URL, dependency counts, file counts, and catalog-backed status. Keep fallback candidate logic disabled for commands and preserve existing candidate sorting rules unless tests require a deterministic tie-break for richer item matches.
  </action>
  <verify>
    Run `pnpm test -- tests/registry-explorer/discovery.test.ts` and `pnpm typecheck`.
  </verify>
  <acceptance_criteria>
    - Searching `input-otp` finds the imported `@delta/input-otp` item when the generated fixture is loaded.
    - Searching `code-block` finds a catalog-backed item by slug/proposed tag/title where present.
    - Searching a dependency term such as `lucide-react` can match an imported item that lists it in `dependencies`.
    - Fallback candidates from aliases/tags/focus still have disabled install actions.
    - Existing Phase 3/4 discovery tests for exact item matches and fallback ordering still pass.
  </acceptance_criteria>
</task>

<task id="T2" title="Expose richer item metadata in registry profile view models">
  <read_first>
    - src/registry-explorer/core/registryProfile.ts
    - src/registry-explorer/core/registry.schema.ts
    - tests/registry-explorer/registryProfile.test.ts
    - .planning/phases/05-expanded-component-catalog/05-UI-SPEC.md
  </read_first>
  <action>
    Extend `RegistryProfileItemRow` and `itemRow()` so profile item rows expose concise rich metadata: title/description fallback, dependency count, registry dependency count, file count, raw item URL, docs URL, evidence URL, confidence, and warnings where present. Keep route/action eligibility driven by core route/install helpers and do not infer commands in the renderer.
  </action>
  <verify>
    Run `pnpm test -- tests/registry-explorer/registryProfile.test.ts` and `pnpm typecheck:test`.
  </verify>
  <acceptance_criteria>
    - Profile tests assert a rich item row includes dependency count, file count, raw item URL, and evidence URL when present.
    - Profile tests assert disabled route/action state for an item that is not route eligible.
    - Existing profile section names remain `Official shadcn facts`, `Registry Atlas enrichment`, `Item discovery status`, and optional `Why this matched`.
  </acceptance_criteria>
</task>

<task id="T3" title="Render catalog-backed metadata and source actions safely">
  <read_first>
    - src/registry-explorer/ui/discoveryView.ts
    - src/registry-explorer/ui/registryProfileView.ts
    - src/registry-explorer/ui/renderSafety.ts
    - public/styles/registry-explorer.css
    - tests/registry-explorer/renderSafety.test.ts
    - .planning/phases/05-expanded-component-catalog/05-UI-SPEC.md
  </read_first>
  <action>
    Update discovery and profile renderers to show concise catalog-backed metadata from the extended view models: status/confidence chips, dependency/file count chips, raw item/source/docs/evidence links when present, and disabled reasons for unavailable routes. Use existing `escapeHtml` and `renderExternalLink` helpers for all imported text/URLs. Add minimal CSS selectors only if required for metadata/source chips, following the UI-SPEC spacing/color contract.
  </action>
  <verify>
    Run `pnpm test -- tests/registry-explorer/renderSafety.test.ts tests/registry-explorer/discovery.test.ts tests/registry-explorer/registryProfile.test.ts` and `pnpm typecheck`.
  </verify>
  <acceptance_criteria>
    - Rendered discovery/profile HTML contains the copy `catalog-backed` or equivalent status label for catalog-backed imported items.
    - Rendered links for raw item/docs/evidence use `renderExternalLink` or equivalent safe escaping.
    - Rendered metadata for dependencies/files is concise, e.g. count chips, not full source dumps.
    - The UI does not include a raw JSON tab, item detail route, or component source renderer in Phase 5.
    - Copy/install/inspect buttons remain disabled when `InstallActionState.status` is `disabled`.
  </acceptance_criteria>
</task>

<task id="T4" title="Run full phase verification and update docs notes">
  <read_first>
    - README.md
    - package.json
    - .planning/phases/05-expanded-component-catalog/05-RESEARCH.md
    - .planning/phases/05-expanded-component-catalog/05-UI-SPEC.md
    - .planning/REQUIREMENTS.md
  </read_first>
  <action>
    Add or update concise maintainer documentation only if needed to explain `pnpm import:catalog`, the generated import report, and the difference between catalog-backed, inferred, unavailable, and manual-follow-up records. Keep documentation scoped to Phase 5 and point item-detail viewing to the future v1.2 milestone if mentioned.
  </action>
  <verify>
    Run `pnpm verify`.
  </verify>
  <acceptance_criteria>
    - `pnpm verify` exits 0.
    - Documentation, if changed, mentions `pnpm import:catalog` and `data/shadcn/registry-catalog-import-report.json`.
    - Documentation does not claim Registry Atlas audits or endorses third-party registry code.
  </acceptance_criteria>
</task>
</tasks>

<verification>
- `pnpm typecheck`
- `pnpm typecheck:test`
- `pnpm test -- tests/registry-explorer/discovery.test.ts tests/registry-explorer/registryProfile.test.ts tests/registry-explorer/renderSafety.test.ts`
- `pnpm validate:data`
- `pnpm verify`
</verification>

<success_criteria>
- Users can find imported `@delego`, `@delta`, and `@diceui` items through discovery/profile surfaces.
- Rich metadata improves confidence without overwhelming dense result rows.
- Catalog-backed, inferred, unavailable, and manual-follow-up states remain visibly distinct.
- The v1.2 item-detail viewer scope remains deferred.

## Artifacts this phase produces

- Extended `ComponentCandidate` metadata fields for rich item summaries
- Extended `RegistryProfileItemRow` metadata fields for rich item summaries
- Discovery matching over rich item summary fields
- Safe rendered source/evidence/docs/raw-item link affordances
- Minimal metadata chip CSS for expanded catalog rows, if needed

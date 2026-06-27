# Phase 6: Component Search & Taxonomy - Context

**Gathered:** 2026-06-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 6 makes the Phase 5 expanded catalog easier to find. It should apply the already-prepared taxonomy/search research to the imported `@delego`, `@delta`, and `@diceui` component set, adding tags, categories, aliases, and simple status-aware display behavior so users can discover the new catalog-backed components by need.

This phase does **not** build the v1.2 item-detail viewer, redesign the whole layout, implement dynamic matrix modes, or start browser-assisted research automation. Those remain later milestones/phases.

</domain>

<decisions>
## Implementation Decisions

### Use the Existing Research, Do Not Re-plan the Product Goal

- **D-01:** Treat the original improvement bundle and Phase 5 outputs as the planning base. The user has already done deep research and wants downstream agents to keep following those context docs instead of re-asking the same product questions.
- **D-02:** Phase 6 should implement the taxonomy/search direction that is already present in `component-taxonomy.proposed.json`, `registry-coverage-matrix.json`, `update-plan.md`, and the Phase 5 context/summaries.
- **D-03:** Keep the goal product-facing: help users find more components from the expanded catalog. Do not turn this into a taxonomy theory exercise.

### Taxonomy Admission and Fallback

- **D-04:** The plan is to support all useful proposed tags/categories from the research bundle for the imported `@delego`, `@delta`, and `@diceui` component set, not just a tiny hand-picked subset.
- **D-05:** Tags should still be grounded in actual available data. If a proposed tag cannot be backed by the imported item summaries or clear source metadata, keep the fallback behavior honest: make it searchable only through inferred/manual-follow-up status, or leave it staged for later rather than pretending it is catalog-backed.
- **D-06:** Harder-to-get components/registries should use the existing fallback path: unavailable/manual-follow-up/inferred states, source notes, and later research automation/manual collection. Do not block the whole phase waiting for complete coverage.

### Category and Layout Shape

- **D-07:** Expand on the current UI patterns for now. Use existing discovery/profile/category surfaces and simple grouped labels rather than doing a full layout redesign in this phase.
- **D-08:** A broader layout audit is probably needed because the layout could make more sense, but it has not been thought through enough yet. Record it as deferred; do not make it a Phase 6 dependency.
- **D-09:** Categories should be useful enough to guide discovery now, but should remain easy to change later when the team has a better layout/search model.

### Alias and Search Behavior

- **D-10:** Keep aliases/search simple for now. Prefer the easier, maintainable option unless research/planning finds a clearly better and still low-risk path.
- **D-11:** It is acceptable to derive obvious aliases from current item metadata, slugs, titles, and proposed tags when that is easier than maintaining a large curated alias table. If a small curated map is simpler for specific cases, use that instead.
- **D-12:** Search should remain pragmatic: users should find items by item name, registry namespace, proposed tag, category, useful alias, and obvious terms from title/description/dependencies where available.

### Status Wording and User Honesty

- **D-13:** The exact status wording is not fully settled. Do the best practical version for now and keep it easy to revise later.
- **D-14:** Continue using the clear status concepts from Phase 5: catalog-backed, inferred, unavailable, and manual follow-up. Avoid implying that Registry Atlas audits or endorses third-party registry code.
- **D-15:** Prefer simple wording in search/profile UI over detailed provenance dumps. Long explanations belong in docs, reports, or later detail views.

### the agent's Discretion

- Choose the simplest implementation that covers the researched tags/categories for the current imported component set and keeps `pnpm verify` passing.
- Use the current static app and generated-data pipeline. Do not add a backend, external search engine, or new state system.
- Planner/researcher may decide whether a derived-alias approach or a small curated-alias map is easier, as long as behavior is tested and maintainable.
- Planner/researcher may decide the exact field/file split for taxonomy metadata, but should keep source data reviewable and avoid hard-to-maintain duplication.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 6 Roadmap and Requirements

- `.planning/ROADMAP.md` — Phase 6 goal, success criteria, phase dependency, and canonical references.
- `.planning/REQUIREMENTS.md` — DISC-01 through DISC-05 requirements for search, taxonomy, categories, status-aware UI, and tests.
- `.planning/PROJECT.md` — v1.1 milestone goal, product-first direction, static app constraints, and future milestone split.
- `.planning/STATE.md` — Current project state and Phase 5 completion state.

### Imported Research Bundle

- `registry-altas-improvement-phase/gpt-agent-outputs/component-taxonomy.proposed.json` — Proposed tags, labels, categories, reasons, and example items for Phase 6.
- `registry-altas-improvement-phase/gpt-agent-outputs/registry-coverage-matrix.json` — Sample coverage columns/rows for the imported registry set; useful reference but not a Phase 6 dynamic matrix requirement.
- `registry-altas-improvement-phase/gpt-agent-outputs/update-plan.md` — Original update plan covering taxonomy, route commands, profile metadata, search ranking/filtering, docs, and tests.
- `registry-altas-improvement-phase/gpt-agent-outputs/registry-research-report.md` — Registry/component categories and sample registry details for `@delego`, `@delta`, and `@diceui`.

### Phase 5 Outputs

- `.planning/phases/05-expanded-component-catalog/05-CONTEXT.md` — Locked decisions for imported catalog scope, status language, generated-data path, and copy-only behavior.
- `.planning/phases/05-expanded-component-catalog/05-RESEARCH.md` — Research findings for imported catalog data, official shadcn registry behavior, code targets, validation, and risks.
- `.planning/phases/05-expanded-component-catalog/05-PATTERNS.md` — Existing patterns for generated data, sync/import, runtime validation, loader mapping, discovery/actions, and profile UI.
- `.planning/phases/05-expanded-component-catalog/05-01-SUMMARY.md` — Deterministic importer and generated item-summary source data.
- `.planning/phases/05-expanded-component-catalog/05-02-SUMMARY.md` — Rich item schema, loader, validation, and route-template safety.
- `.planning/phases/05-expanded-component-catalog/05-03-SUMMARY.md` — Current discovery/profile exposure for rich imported item metadata.

### Codebase Maps

- `.planning/codebase/ARCHITECTURE.md` — Static SPA architecture, pure core logic boundary, renderers, data flow, and anti-patterns.
- `.planning/codebase/CONVENTIONS.md` — TypeScript naming, controlled vocabulary, pure-core, renderer escaping, and test conventions.
- `.planning/codebase/TESTING.md` — Test organization and verification expectations.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `src/registry-explorer/core/registry.schema.ts` — Owns controlled vocabularies such as `COMPONENT_TAG_VALUES`, `ComponentTag`, and rich `RegistryItemSummary` fields added in Phase 5.
- `src/registry-explorer/core/labels.ts` — Current component labels are generated by replacing hyphens; Phase 6 can add richer label/category mapping if needed.
- `src/registry-explorer/core/discovery.ts` — Current search already matches item names, slugs, title/description, proposed/existing tags, dependencies, dev dependencies, and registry dependencies.
- `src/registry-explorer/core/registryProfile.ts` — Builds profile view models and should remain the place to derive profile metadata before rendering.
- `src/registry-explorer/ui/discoveryView.ts` and `src/registry-explorer/ui/registryProfileView.ts` — Render current catalog-backed metadata/status/source links. Keep renderers focused on display.
- `scripts/import-registry-catalog.mjs` and `data/shadcn/registry-items.json` — Generated/imported item summaries now preserve proposed tags and rich metadata for `@delego`, `@delta`, and `@diceui`.
- `tests/registry-explorer/discovery.test.ts`, `registryProfile.test.ts`, `registryData.test.ts`, `matrixColumns.test.ts` — Existing test homes for search, profile, data vocabulary, and matrix/tag consistency.

### Established Patterns

- Keep search/taxonomy behavior in pure core modules so it can be tested without DOM setup.
- Preserve controlled vocabularies when adding component tags; update labels/tests alongside schema changes.
- Renderers must escape imported text and use safe link helpers; do not dump raw provenance or source JSON into dense rows.
- Generated/runtime data flows through `pnpm import:catalog` then `pnpm sync:registries`, and verification ends with `pnpm verify`.
- Status language must stay honest and practical: catalog-backed, inferred, unavailable, manual follow-up.

### Integration Points

- Add accepted component tags to `COMPONENT_TAG_VALUES` and related tests.
- Add taxonomy labels/categories either near `labels.ts` or a small new core taxonomy module, depending on planning preference.
- Ensure imported `component_tags_proposed` values are either accepted by the controlled vocabulary or normalized before being treated as user-facing tags.
- Search/profile UI should reuse existing Phase 5 metadata fields and avoid adding a new route.
- Any matrix reference in this phase should remain preparatory; dynamic matrix modes belong to a later milestone.

</code_context>

<specifics>
## Specific Ideas

- The user clarified that Phase 6 should use the already-created deep research and context docs rather than restart from first principles.
- The user wants the plan to include all applicable researched items/tags for the imported sample set, especially the `@delego`, `@delta`, and `@diceui` work. Harder-to-get data should fall back to honest unavailable/manual-follow-up/inferred handling.
- The user is open to expanding the existing layout/search/profile surfaces for now, but noted that a layout audit would probably be valuable later because the current layout may not make the most sense long term.
- The user prefers simple alias/status handling for now and is comfortable with the agent choosing the easier maintainable option during planning.
- The proposed taxonomy includes useful tags/categories such as `theme`, `status-pill`, `decision-pill`, `otp-input`, `code-block`, `syntax-highlighting`, `utility-button`, `zoomable-image`, `card-deck`, `admonition`, `qr-code`, `chat-interface`, `ai-chat`, `map-pointer`, `angle-slider`, `circular-progress`, `color-picker`, `color-swatch`, `compare-slider`, and `cropper`.

</specifics>

<deferred>
## Deferred Ideas

- Full layout audit/redesign for discovery/profile/taxonomy navigation. The user suspects the layout could be better, but the team has not thought it through enough yet.
- Internal item-detail viewer with raw item JSON, tabs, files/dependencies, and first-class item inspection remains v1.2.
- Dynamic coverage matrix modes/presets remain v1.3.
- Browser-assisted/manual research automation for harder registries remains v1.4.

</deferred>

---

*Phase: 06-Component Search & Taxonomy*
*Context gathered: 2026-06-27*

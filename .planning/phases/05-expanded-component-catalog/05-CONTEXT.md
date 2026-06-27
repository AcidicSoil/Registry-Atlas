# Phase 5: Expanded Component Catalog - Context

**Gathered:** 2026-06-27
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase adds more real component items to Registry Atlas from the imported `registry-altas-improvement-phase` research bundle. The purpose is product-facing: users should be able to discover more actual shadcn-compatible components, especially from `@delego`, `@delta`, and `@diceui`, with useful route, command, dependency, file, source, and catalog-status metadata where available.

This phase does **not** build the internal item-detail viewer yet. It prepares the expanded component catalog that the viewer will use in v1.2.

</domain>

<decisions>
## Implementation Decisions

### Product Goal

- **D-01:** The goal is not a standalone “planning evidence” feature. The goal is to get more components into Registry Atlas and make them easier to discover.
- **D-02:** The imported research bundle should be used because it already contains researched registry/component data, update steps, taxonomy proposals, and user intent. Do not ask the user to re-explain the same material.
- **D-03:** v1.1 should focus on the expanded component catalog. The internal component/item viewer is important, but belongs to the next milestone after the catalog foundation exists.

### Registry and Item Scope

- **D-04:** Treat `@delego`, `@delta`, and `@diceui` as the first catalog expansion set because the imported research includes normalized data for those registries.
- **D-05:** Include item-level metadata where available: slug/name, title/description, type, category/tags, dependencies, dev dependencies, registry dependencies, files, targets, raw item URL, install token, view command, install command, and catalog/source status.
- **D-06:** Keep manual-follow-up registries such as `@7ovr` and `@devl` out of v1.1 implementation unless their data is already concrete enough to import safely. Preserve them for the later research automation/manual collection milestone.

### Trust and Status Language

- **D-07:** Use status language only to avoid misleading users, not to create an abstract evidence workflow. The practical statuses should tell users whether a component is catalog-backed, inferred, unavailable, or needs manual follow-up.
- **D-08:** Catalog-backed items may expose stronger actions and metadata because the app has a concrete route/item source. Inferred or unavailable items must not pretend to have installable item detail.
- **D-09:** Registry Atlas must continue to avoid implying that third-party registry code is audited, endorsed, or safe. It can show source, metadata, commands, and warnings.

### Data and UX Shape

- **D-10:** Prefer importing/staging normalized data from `registry-catalog.normalized.json` over manually retyping records.
- **D-11:** The app should preserve the existing copy-only command posture from Phase 4. New items may get copyable `view` and `add` commands when namespace/item/token/route data is valid, but the browser never executes them.
- **D-12:** The expanded catalog should fit the existing static app and generated data pipeline. Do not add a backend for this phase.
- **D-13:** Keep Phase 5 focused on data/model/validation and enough UI/profile exposure to make new components visible. Deeper UI work for fetching/rendering raw item JSON is v1.2.

### the agent's Discretion

- Choose the simplest data shape that lets `@delego`, `@delta`, and `@diceui` items appear in discovery without breaking v1.0 official mirror records.
- Keep names and fields close to the imported research where possible, but normalize into existing Registry Atlas conventions.
- Prefer tests around pure data conversion, validation, route eligibility, and command token generation before UI wiring.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Imported Improvement Bundle

- `registry-altas-improvement-phase/gpt-agent-outputs/(original-seed-idea)registry-atlas-continued-improvements.md` — Core user/product direction: actual component layer is shallow, add item view route, fetch real item JSON, expose view commands, dynamic matrix, and registry index hydration.
- `registry-altas-improvement-phase/gpt-agent-outputs/update-plan.md` — Concrete update plan for adding researched registries, extending taxonomy, updating item summary fields, route resolution, UI metadata, search, docs, and tests.
- `registry-altas-improvement-phase/gpt-agent-outputs/registry-research-report.md` — Research summary for `@delego`, `@delta`, `@diceui`, manual-follow-up registries, and observed component categories.
- `registry-altas-improvement-phase/gpt-agent-outputs/registry-catalog.normalized.json` — Normalized sample catalog for the first expansion set.
- `registry-altas-improvement-phase/gpt-agent-outputs/component-taxonomy.proposed.json` — Proposed tags/categories that Phase 6 should use after Phase 5 adds the data foundation.
- `registry-altas-improvement-phase/gpt-agent-outputs/registry-coverage-matrix.json` — Sample matrix/coverage data to preserve for later matrix work.

### Current Planning

- `.planning/PROJECT.md` — Current milestone goal, constraints, key decisions, and future milestone split.
- `.planning/REQUIREMENTS.md` — v1.1 requirements for expanded catalog and future requirements for item viewer, matrix, and automation.
- `.planning/ROADMAP.md` — Phase 5 scope, success criteria, dependency on Phase 4, and Phase 6 follow-up.
- `.planning/STATE.md` — Current milestone state.

### Prior Phase Decisions

- `.planning/phases/04-install-actions-release-hardening/04-CONTEXT.md` — Copy-only command behavior, route-eligible queue/action rules, URL state boundaries, and release gate decisions.
- `.planning/phases/03-component-first-discovery/03-CONTEXT.md` — Component-first search, coverage confidence/status language, direct item route modeling, and registry profile requirements.
- `.planning/phases/02-official-mirror-data-pipeline/02-CONTEXT.md` — Official vs Atlas enrichment boundary, sync/report artifacts, runtime validation, and static deployment constraints.

### Codebase Maps

- `.planning/codebase/STACK.md` — Static Vite/vanilla TypeScript stack, GitHub Pages deployment, and verification commands.
- `.planning/codebase/STRUCTURE.md` — Where to add schema, data, core transformations, UI rendering, tests, and docs.
- `.planning/codebase/CONVENTIONS.md` — Naming, import, pure-core, rendering, and testing conventions.
- `.planning/codebase/TESTING.md` — Test organization and release gate expectations.

### Official shadcn Registry References

- Official shadcn registry docs: `registry.json` is the registry entry point and defines the items in a registry.
- Official shadcn registry item docs: item JSON can carry `dependencies`, `devDependencies`, `registryDependencies`, and `files` metadata.
- Official shadcn registry directory docs: the registry index is used by CLI search/add flows for open source registries.
- Official shadcn CLI docs/changelog: namespaced registry items can be searched, viewed, and added through the CLI.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `src/registry-explorer/core/registry.schema.ts` — Primary place to extend registry/item summary types and controlled vocabularies.
- `src/registry-explorer/core/itemRoutes.ts` — Existing route eligibility/resolution logic should anchor valid item routes for imported records.
- `src/registry-explorer/core/installCommands.ts` or equivalent Phase 4 command helpers — Copy-only `add` and `view` command generation should be reused rather than duplicated.
- `src/registry-explorer/data/loadRegistries.ts` — Runtime data loading boundary for generated public data.
- `public/data/registries.json` and `scripts/sync-shadcn-registries.mjs` — Existing generated data and sync pipeline likely need extension for imported catalog records.
- `scripts/validate-registry-data.mjs` — Validation gate should be extended for new fields/statuses.
- `src/registry-explorer/ui/registryProfileView.ts` and discovery/profile renderers — Initial UI exposure for richer item metadata and catalog-backed status.

### Established Patterns

- Keep pure conversion, search, validation, route, and command logic out of DOM renderers.
- Preserve the static GitHub Pages app model; generated data files are acceptable, backend services are not needed for v1.1.
- Keep third-party registry data escaped and safe; source URLs and raw item URLs must pass existing URL-safety rules.
- Use `pnpm verify` as the release gate after code changes.
- Status language must remain honest and practical: catalog-backed / inferred / unavailable / manual-follow-up.

### Integration Points

- Data import/sync scripts should absorb the imported normalized catalog or a transformed fixture from it.
- Validation should fail or warn on missing source/evidence for records that claim catalog-backed status.
- Discovery/profile data derivation should expose new item metadata without requiring the v1.2 item-detail page.
- Tests should cover sample records for `@delego`, `@delta`, and `@diceui` plus existing v1.0 official mirror records.

</code_context>

<specifics>
## Specific Ideas

- The user clarified that the real goal is “get more components” and “be able to view components.” Phase 5 handles the first part; v1.2 handles the second part.
- The seed doc explicitly says the current app has the right skeleton but the “actual component” layer is still shallow.
- The update plan says to add `@delego`, `@delta`, and `@diceui`, update taxonomy, preserve richer metadata, improve route/command generation, update UI metadata, and add tests/docs.
- Official shadcn registry behavior supports this direction: registries have catalog/index JSON, registry-item JSON includes dependencies/files, and namespaced items can be searched/viewed/added through CLI flows.

</specifics>

<deferred>
## Deferred Ideas

- Internal `view=item` route, raw item JSON rendering, files/dependencies tabs, and in-app component inspection belong to v1.2 Component Item Viewer.
- Dynamic matrix column modes/presets belong to v1.3 Dynamic Coverage Matrix.
- Browser-use/local-model registry exploration and manual docs scraping for `@7ovr`, `@devl`, and broader registries belong to v1.4 Registry Research Automation.
- Scheduled or PR-based upstream sync automation belongs to a later automation milestone.

</deferred>

---

*Phase: 05-Expanded Component Catalog*
*Context gathered: 2026-06-27*

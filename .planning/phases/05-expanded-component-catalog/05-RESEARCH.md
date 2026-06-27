# Phase 5: Expanded Component Catalog - Research

## RESEARCH COMPLETE

**Phase:** 05 - Expanded Component Catalog
**Question:** What do we need to know to plan this phase well?
**Date:** 2026-06-27

## Summary

Phase 5 should be a data-first expansion of the existing Registry Atlas component catalog. The current app already has the right static Vite/vanilla TypeScript skeleton: official registry mirror data, item summaries, route eligibility, copy-only `add` / `view` commands, discovery results, registry profiles, validation, and `pnpm verify`. The missing layer is that newly researched real registry items are not yet imported into the generated data path, and the item summary model does not preserve enough metadata from the normalized research catalog.

The safest plan is to keep Phase 5 focused on expanded catalog data and shallow UI exposure. It should not fetch/render raw registry item JSON in-app yet; that is v1.2 Component Item Viewer. Phase 5 should make `@delego`, `@delta`, and `@diceui` catalog-backed items discoverable, command-capable when route eligible, and visibly distinct from inferred/unavailable/manual-follow-up records.

## Standard Stack

- App: Vite + vanilla TypeScript SPA.
- Data: generated/static JSON under `public/data/registries.json`, sourced from official shadcn registry directory plus Atlas enrichment.
- Existing source-of-truth import path: `scripts/sync-shadcn-registries.mjs` reads `data/shadcn/registry-items.json` and merges item summaries into official registry records.
- Validation: `scripts/validate-registry-data.mjs` and `src/registry-explorer/core/registryMirror.ts` gate runtime data.
- Tests: Vitest under `tests/registry-explorer/` plus source/test type-check.
- Release gate: `pnpm verify`.

## Official Registry Findings

- The shadcn registry docs describe a root `registry.json` catalog that defines custom component registry items.
- The shadcn registry getting-started docs describe namespace URL templates where `{name}` resolves to item JSON, e.g. `@acme/button` -> `/r/button.json`, while `/r/registry.json` remains the separate catalog endpoint.
- The registry item schema supports item-level fields that Phase 5 should preserve in summaries where available: `dependencies`, `devDependencies`, `registryDependencies`, and `files`.
- The shadcn CLI supports viewing namespaced registry items before installing, and supports multiple `view` targets at once. Phase 5 should keep using copyable command strings only; browser execution remains out of scope.
- The registry directory docs warn that community registries are third-party code and users should review code before installation. Registry Atlas should not imply audit/endorsement.

## Imported Research Findings

Primary source files:

- `registry-altas-improvement-phase/gpt-agent-outputs/(original-seed-idea)registry-atlas-continued-improvements.md`
- `registry-altas-improvement-phase/gpt-agent-outputs/update-plan.md`
- `registry-altas-improvement-phase/gpt-agent-outputs/registry-research-report.md`
- `registry-altas-improvement-phase/gpt-agent-outputs/registry-catalog.normalized.json`

The normalized catalog has three concrete registries:

1. `@delego`
   - Catalog URL: `https://raw.githubusercontent.com/Delego-Dev/registry/main/public/r/registry.json`
   - Item URL template: `https://raw.githubusercontent.com/Delego-Dev/registry/main/public/r/{name}.json`
   - Useful categories/tags include theme, button, protocol/decision/status/receipt-style components.

2. `@delta`
   - Catalog URL: `https://deltacomponents.dev/r/registry.json`
   - Item URL template: `https://deltacomponents.dev/r/{name}.json`
   - Useful components include OTP input, code block, syntax highlighting, media/image, AI/chat, map, and dashboard/landing-page style entries.

3. `@diceui`
   - Catalog URL: `https://diceui.com/r/registry.json`
   - Item URL template in research: `https://diceui.com/r/{name}.json`
   - Current official mirror data has `https://diceui.com/r/{style}/{name}.json`, so Phase 5 must handle or explicitly preserve this mismatch instead of silently enabling invalid item routes.
   - Useful components include action bar, angle slider, color picker, compare slider, cropper, and other primitive/media controls.

The update plan explicitly asks for:

- adding newly cataloged registries/items,
- extending item summary fields,
- using install tokens to generate `view` / `add` commands,
- supporting GitHub raw URLs and external registry domains,
- exposing metadata in detail/profile surfaces,
- adding docs/tests,
- keeping `@7ovr` and `@devl` as manual follow-up.

## Current Code Findings

### Data pipeline

- `scripts/sync-shadcn-registries.mjs` already reads `data/shadcn/registry-items.json` and merges item summaries by namespace.
- It currently normalizes only `name`, `slug`, `type`, `category`, `source`, `provenance`, `catalog_status`, and `route_eligible`.
- It currently sets registry coverage/confidence to `verified`/`high` when any item summaries exist.
- It currently uses the official directory registry URL template, not research `registry_url_template`, which is usually good because the official directory is the root registry membership source.

### Schema and validation

- `src/registry-explorer/core/registry.schema.ts` already defines `RegistryItemSummary`, `Registry`, `ComponentCandidate`, install action state, registry profile rows, and catalog/coverage statuses.
- `RegistryItemSummary` is too shallow for Phase 5: it lacks title/description, confidence, evidence URL, install token, view/install commands, raw item URL, docs/preview URLs, dependencies, devDependencies, registryDependencies, files, and warnings.
- `src/registry-explorer/core/registryMirror.ts` validates summary shape, slug, source/provenance, catalog status, and route eligibility. It must be extended to validate optional richer fields without breaking v1.0-style records.
- `src/registry-explorer/data/loadRegistries.ts` maps runtime snake_case JSON to camelCase display models. It must map new optional fields.

### Discovery/profile UI

- `src/registry-explorer/core/discovery.ts` currently matches item summaries by name/slug/type/category and exposes install actions through existing Phase 4 helpers.
- Search does not yet include dependencies, registry dependencies, description/title, proposed tags, source URL, docs URL, or install token fields.
- `src/registry-explorer/core/registryProfile.ts` and `src/registry-explorer/ui/registryProfileView.ts` show item rows, route links, and install actions, but they do not expose richer metadata such as dependencies/files/source URLs.
- `src/registry-explorer/ui/discoveryView.ts` already has copy-only actions and partial-data notes. Phase 5 should extend rather than redesign this surface.

## Architecture Recommendation

Plan Phase 5 as three coarse, executable plans:

1. **Catalog import tooling and generated data**
   - Add a deterministic importer from `registry-catalog.normalized.json` to `data/shadcn/registry-items.json` plus a review report.
   - Update generated runtime data through the existing sync path.
   - Preserve `@delego`, `@delta`, and `@diceui` item summaries without manual retyping.

2. **Schema, loader, and validation metadata**
   - Extend TypeScript interfaces and runtime validation to preserve optional richer item fields.
   - Keep v1.0 records valid.
   - Validate only what the app needs to safely expose commands/routes and source links.

3. **Discovery/profile exposure and tests**
   - Search and display the expanded catalog items.
   - Add richer item metadata rows/chips and source links without building the v1.2 raw item viewer.
   - Ensure copy-only command behavior remains unchanged.

## Plan Constraints

- Do not create a backend.
- Do not execute shadcn CLI commands in browser code or tests.
- Do not render third-party component source code in Phase 5.
- Do not treat research-only/manual-follow-up registries as route-eligible install candidates.
- Keep `@7ovr` and `@devl` out of the generated catalog unless concrete machine-readable item records exist.
- Preserve official directory membership and official registry URL templates unless a registry-specific mismatch must be documented/disabled.
- Use `pnpm verify` as the final gate.

## Validation Architecture

Phase 5 verification should cover four layers:

1. Importer/generator layer
   - Unit or CLI tests prove the importer reads `registry-catalog.normalized.json` and emits deterministic `data/shadcn/registry-items.json` shape for `@delego`, `@delta`, and `@diceui`.
   - Generated records include expected counts and known sample slugs such as `delego-theme`, `input-otp`, `code-block`, `action-bar`, and `angle-slider` when present in source.

2. Schema/validation layer
   - `validateRegistryMirror()` accepts v1.0 item summaries and richer v1.1 item summaries.
   - Invalid optional URLs, invalid install tokens, non-array dependency fields, invalid file records, and route-eligible records with invalid slugs/templates produce errors or warnings.

3. Loader/model layer
   - `loadRegistries()` maps snake_case runtime fields to camelCase `RegistryItemSummary` fields.
   - Existing loader fixtures continue to pass without richer fields.

4. Discovery/profile layer
   - Search finds imported items by name, slug, title/description, category, dependencies, registry dependency, and source/proposed tags where mapped.
   - Profile rows expose route/source/metadata without breaking install queue behavior.
   - Copy-only install/view commands remain exact strings from Phase 4 helpers.

## Risks and Landmines

- `@diceui` currently has an official mirror route template with `{style}` and `{name}` while research uses `/r/{name}.json`. If the app cannot resolve `{style}`, item routes must remain disabled or a deterministic supported style must be introduced explicitly.
- Adding many proposed tags in Phase 5 could accidentally pull in Phase 6 scope. Phase 5 should only add enough item metadata to support later tag/search work; broad taxonomy UX belongs to Phase 6.
- If generated `public/data/registries.json` is edited directly, the next sync may overwrite changes. Plans should prefer source data/import tooling plus sync output.
- Provenance strings from the imported research include citation artifacts and long text. The UI should avoid dumping those verbatim into dense result rows; keep detailed provenance available but concise.
- The official shadcn registry ecosystem can change. This phase should validate current local data and imported artifacts, not promise exhaustive ecosystem coverage.

## Ready for Planning

The phase is ready for planning with MVP mode active. The planner should produce coarse vertical plans that each include data/source changes, validation, and tests where needed.

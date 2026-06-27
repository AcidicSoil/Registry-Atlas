# Phase 6: Component Search & Taxonomy - Research

## RESEARCH COMPLETE

**Phase:** 06 - Component Search & Taxonomy
**Question:** What do we need to know to plan this phase well?
**Date:** 2026-06-27

## Summary

Phase 6 should not restart product discovery. Phase 5 already imported concrete component items for `@delego`, `@delta`, and `@diceui`, preserved rich item metadata, and made those item summaries visible in discovery/profile surfaces. Phase 6 should formalize the proposed taxonomy and search behavior around that imported data so users can find components by tag, category, alias, and simple status language.

The main implementation insight is that much of the raw searchable data already exists. `data/shadcn/registry-items.json` and `public/data/registries.json` now include `component_tags_existing` and `component_tags_proposed` for imported item summaries. `src/registry-explorer/core/discovery.ts` already searches item names, slugs, titles, descriptions, proposed/existing tags, dependencies, dev dependencies, and registry dependencies. Phase 6 should build on that rather than replacing it.

## Research Inputs

### Existing planning/context

- `.planning/phases/06-component-search-and-taxonomy/06-CONTEXT.md` locks the user intent: use the already-prepared deep research, support all applicable researched tags/categories for the imported component set, keep aliases/status simple, and defer layout audit.
- `.planning/phases/05-expanded-component-catalog/05-01-SUMMARY.md` confirms the imported catalog data path and `pnpm import:catalog` workflow.
- `.planning/phases/05-expanded-component-catalog/05-02-SUMMARY.md` confirms rich item metadata and validation exist.
- `.planning/phases/05-expanded-component-catalog/05-03-SUMMARY.md` confirms discovery/profile surfaces already expose rich imported metadata.

### Imported taxonomy

`registry-altas-improvement-phase/gpt-agent-outputs/component-taxonomy.proposed.json` contains 23 proposed tags with labels, categories, reasons, and example items. Proposed tags include:

- `theme`
- `status-pill`
- `decision-pill`
- `pill`
- `receipt`
- `audit`
- `otp-input`
- `code-block`
- `syntax-highlighting`
- `utility-button`
- `zoomable-image`
- `card-deck`
- `admonition`
- `qr-code`
- `chat-interface`
- `ai-chat`
- `map-pointer`
- `angle-slider`
- `circular-progress`
- `color-picker`
- `color-swatch`
- `compare-slider`
- `cropper`

The JSON categories are useful as a first pass and should be treated as user-facing enough to guide discovery, but not as a final permanent IA/layout model.

### Coverage matrix reference

`registry-altas-improvement-phase/gpt-agent-outputs/registry-coverage-matrix.json` has sample columns for `button`, `badge`, `pill`, `receipt`, `field`, `code-block`, `card-deck`, `admonition`, `tabs`, `qr-code`, `chat`, and `map`. This is useful as a reference for categories/search expectations, but dynamic matrix modes are explicitly deferred to v1.3.

## Current Code Findings

### Taxonomy/vocabulary

- `src/registry-explorer/core/registry.schema.ts` owns `COMPONENT_TAG_VALUES` and `ComponentTag`.
- Current `COMPONENT_TAG_VALUES` already includes some proposed or related values such as `color-picker`, `slider`, `progress`, `carousel`, `badge`, `button`, `input`, `tabs`, and `toolbar`.
- Many proposed tags are not yet part of `COMPONENT_TAG_VALUES`, so generated `component_tags_proposed` fields cannot safely become first-class user-facing tags without extending the controlled vocabulary or adding a separate taxonomy layer.
- `src/registry-explorer/core/labels.ts` currently labels component tags by replacing hyphens with spaces. This is acceptable for basic tags but insufficient for proposed labels such as `QR code`, `Pill/Chip`, `Receipt / Audit record`, and category labels such as `AI & Chat`.

### Generated/imported data

- `scripts/import-registry-catalog.mjs` preserves `component_tags_existing` and `component_tags_proposed` from imported research.
- `scripts/sync-shadcn-registries.mjs` preserves those fields into runtime data.
- `public/data/registries.json` currently has top-level `atlas.component_tags` values that are mostly official/legacy tags; Phase 6 may need to derive or enrich registry-level tags from item summaries so component group/fallback views can discover the imported taxonomy without relying only on item-level search.
- For `@delego` and `@delta`, registry-level `component_tags` may be empty or too shallow even though item summaries carry rich proposed tags.

### Discovery/search

- `searchComponentCandidates()` already searches proposed item tags, dependencies, title/description, and registry dependencies.
- Fallback candidate search only looks at registry-level `component_tags`, aliases, focus, namespace, and description.
- The exact match/relevance model is simple. Phase 6 can improve it without a new search engine.
- Useful next step: a taxonomy core module that maps tag/category/alias metadata and helper functions such as `expandSearchTerms`, `componentTaxonomyEntry`, `componentCategoryLabel`, and `deriveComponentAliases`.

### Registry profile/UI

- Discovery/profile UI already shows catalog-backed labels, dependency/file count chips, and safe raw/docs/evidence links.
- Phase 6 should add concise category/tag labels or a richer `Why this matched` explanation, but should avoid a full layout redesign.
- Any broad layout audit belongs later.

### Tests

- Existing relevant tests:
  - `tests/registry-explorer/discovery.test.ts`
  - `tests/registry-explorer/registryProfile.test.ts`
  - `tests/registry-explorer/registryData.test.ts`
  - `tests/registry-explorer/matrixColumns.test.ts`
  - `tests/registry-explorer/registryCatalogImport.test.ts`
- Phase 6 should add focused taxonomy tests instead of relying only on artifact tests.

## Architecture Recommendation

Plan Phase 6 as three coarse MVP plans:

1. **Taxonomy vocabulary and data normalization**
   - Add researched proposed tags to the controlled vocabulary where they are backed by imported item examples.
   - Add a taxonomy metadata module for tag labels, category IDs/labels, category grouping, and example/source references.
   - Ensure import/sync/generated data can elevate proposed item tags into first-class searchable/validated tags without breaking v1.0 records.

2. **Search aliases and category matching**
   - Add simple derived/curated alias expansion around tags, slugs, categories, and known examples.
   - Improve discovery matching/reasons/ranking so users can search by category concepts like “AI chat”, “code block”, “QR code”, “map”, “receipt”, “color”, “cropper”, and “OTP”.
   - Keep implementation simple and testable in pure core.

3. **Status-aware UI polish and verification**
   - Surface taxonomy/category/status in discovery/profile without redesigning the whole layout.
   - Keep wording simple: catalog-backed, inferred, unavailable, manual follow-up.
   - Add docs/test coverage and run `pnpm verify`.

## Plan Constraints

- Do not add backend search, external search services, or client-side indexing libraries.
- Do not build the v1.2 item-detail viewer.
- Do not implement dynamic matrix modes/presets.
- Do not block on hard-to-get registries; use honest fallback states.
- Do not claim third-party registry code is audited or endorsed.
- Keep `pnpm verify` passing.

## Risks and Landmines

- Adding tags to `COMPONENT_TAG_VALUES` without labels/tests can break vocabulary consistency or make UI labels awkward.
- Top-level registry `component_tags` and item-level `componentTagsProposed` can drift unless the data normalization path is clear.
- Over-indexing every string could make search noisy. Search should still rank exact item/tag/category matches above broad metadata matches.
- `ai-chat` currently exists as both a primary focus and a proposed component tag. This is allowed, but code/tests must be clear about whether a value is a focus or component tag in each context.
- The layout is known to need future review. Phase 6 should not make it harder to redesign later.

## Ready for Planning

The phase is ready for planning in MVP mode. Plans should be coarse, implementation-ready, and tied to DISC-01 through DISC-05.

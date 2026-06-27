# Phase 6: Component Search & Taxonomy - Pattern Map

## Purpose

Map existing Registry Atlas patterns that Phase 6 should reuse for taxonomy and search work.

## Closest Existing Analogues

### Controlled vocabularies

- `src/registry-explorer/core/registry.schema.ts`
  - `COMPONENT_TAG_VALUES` and `ComponentTag` are the current source of truth for component tags.
  - Pattern: add controlled values in one array, then update tests and labels.
  - Landmine: values used by generated data must be accepted by validation/tests.

### Labels

- `src/registry-explorer/core/labels.ts`
  - `focusLabel()` uses explicit mapping.
  - `componentLabel()` currently uses hyphen replacement.
  - Phase 6 can expand this pattern with explicit taxonomy labels and category labels.

### Search/discovery

- `src/registry-explorer/core/discovery.ts`
  - Pure search logic and candidate ranking.
  - Already searches item name, slug, title, description, type, category, proposed/existing tags, dependencies, dev dependencies, and registry dependencies.
  - Pattern: build view-model candidates in core; renderers display fields only.

### Registry profile

- `src/registry-explorer/core/registryProfile.ts`
  - Builds profile facts and item rows before rendering.
  - Phase 6 should add taxonomy/category fields here if profile UI needs them.

### Generated data path

- `scripts/import-registry-catalog.mjs`
  - Preserves proposed/existing item tags from imported research.
  - Good place to normalize/derive registry-level component tags if Phase 6 needs imported tags to appear in component group/fallback surfaces.

- `scripts/sync-shadcn-registries.mjs`
  - Merges source item summaries into runtime data.
  - Preserves rich item fields and top-level registry tags.

### Runtime loading and validation

- `src/registry-explorer/data/loadRegistries.ts`
  - Maps generated JSON into runtime models.
  - Already maps `component_tags_existing` / `component_tags_proposed` into item summary fields.

- `src/registry-explorer/core/registryMirror.ts`
  - Validates rich item fields and arrays.
  - Can validate proposed tag values if Phase 6 promotes them to controlled vocabulary.

### UI rendering

- `src/registry-explorer/ui/discoveryView.ts`
- `src/registry-explorer/ui/registryProfileView.ts`
  - Use `escapeHtml` and safe external link helpers.
  - Phase 6 should keep taxonomy/status display concise, not dump long provenance.

## Likely Created Files

- `src/registry-explorer/core/componentTaxonomy.ts` — proposed place for tag/category metadata, labels, aliases, and helpers.
- `tests/registry-explorer/componentTaxonomy.test.ts` — tests for tag metadata, categories, aliases, and vocabulary alignment.

## Likely Modified Files

- `src/registry-explorer/core/registry.schema.ts`
- `src/registry-explorer/core/labels.ts`
- `src/registry-explorer/core/discovery.ts`
- `src/registry-explorer/core/registryProfile.ts`
- `src/registry-explorer/ui/discoveryView.ts`
- `src/registry-explorer/ui/registryProfileView.ts`
- `scripts/import-registry-catalog.mjs`
- `scripts/sync-shadcn-registries.mjs`
- `src/registry-explorer/core/registryMirror.ts`
- `tests/registry-explorer/*.test.ts`
- `README.md` or focused data docs if maintenance behavior changes.

## Planning Guidance

- Prefer pure-core helpers and small data tables over UI-renderer logic.
- Keep Phase 6 incremental. Do not redesign the layout.
- Treat taxonomy labels/categories as useful now but changeable later.
- Use data-backed tags for catalog-backed items and fallback/manual-follow-up states for uncertain coverage.
- Test vocabulary alignment and search behavior directly.

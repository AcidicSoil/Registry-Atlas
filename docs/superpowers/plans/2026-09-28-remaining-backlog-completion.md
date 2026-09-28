# Registry Atlas Remaining Backlog Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Finish the concrete Registry Atlas backlog by aligning the toolchain, preserving a compact open-vocabulary catalog index, exposing indexed items through existing discovery/detail flows, and removing stale TODOs.

**Architecture:** Keep reviewed rich item summaries as the default catalog and add a separate compact generated index for the much larger upstream inventory. Search/facet interactions materialize indexed items on demand through existing RegistryItemSummary/ComponentCandidate seams, while raw item detail remains fetched from the registry route. Reuse the existing catalog-evidence crawler and static GitHub Pages architecture.

**Tech Stack:** TypeScript 5.9, Node 24.21.0, pnpm 11.24.0, Vite 7, Vitest 4, mise, static JSON.

**Spec:** docs/superpowers/specs/2026-09-28-remaining-backlog-completion-design.md

## Global Constraints

- Keep the static Vite/GitHub Pages architecture.
- Do not add a browser agent, backend service, database, or frontend framework.
- The compact index includes only registry:block, registry:component, registry:ui, registry:page, and registry:item.
- Reviewed rich summaries override compact indexed facts for the same namespace/slug.
- The default empty-query Discover surface must not materialize the full upstream item index.
- Indexed candidate materialization is capped at 1,000 per render pass and truncation is disclosed.
- Never fabricate preview, popularity, recency, quality, framework, license, or accessibility data.
- Preserve prior compact entries when a later catalog fetch fails.
- Keep issue #3 as a deferred domain-model decision.

## Review Focus

- Very broad search terms must not freeze the SPA or misstate a truncated result count.
- A compact indexed item whose name collides with a curated taxonomy tag must still dedupe correctly and retain reviewed metadata when available.
- A failed refresh of one registry must preserve only that registry's previous index entries without retaining removed entries after a successful fetch.
- Malformed compact-index JSON must fail safely rather than silently shrinking catalog coverage.
- Raw/open-vocabulary Component selections must keep OR-within-facet and AND-across-facet semantics.

---

### Task 1: Align project toolchain and CI

**Files:**
- Add: mise.toml
- Modify: package.json
- Modify: .github/workflows/deploy.yml

**Interfaces:**
- Produces: mise tasks install, dev, test, typecheck, validate:data, verify, build, preview, import/sync tasks.
- Produces: packageManager pin pnpm@11.24.0.
- Produces: Pages verification executed through project-owned mise configuration.

- [ ] Add packageManager to package.json without changing dependency versions.
- [ ] Replace separate CI Node/pnpm setup with jdx/mise-action@v4; keep existing Pages deployment actions and permissions.
- [ ] Change CI install/verify commands to mise run install and mise run verify.
- [ ] Run mise exec -- node --version and mise exec -- pnpm --version; expect v24.21.0 and 11.24.0.
- [ ] Run mise run install and git diff --check.

### Task 2: Generate and preserve the compact catalog index

**Files:**
- Modify: scripts/sync-registry-catalog-evidence.mjs
- Modify: scripts/sync-shadcn-registries.mjs
- Test: tests/registry-explorer/registryCatalogEvidence.test.ts
- Generate: public/data/registry-catalog-items.json
- Modify: data/shadcn/registry-catalog-evidence-report.json when sync is run.

**Interfaces:**
- Produces: DISCOVERABLE_REGISTRY_ITEM_TYPES.
- Produces: buildCompactCatalogItems(namespace, template, catalog).
- Produces: syncCatalogEvidenceForRegistries(...).itemsByNamespace and report.discoverable_item_count.
- Produces: compact runtime JSON { meta, registries }.

- [ ] Write failing tests proving only allowed item types are retained with name/type/title/categories.
- [ ] Write a failing test proving a failed namespace keeps previous compact entries while a successful namespace replaces its prior entries.
- [ ] Run only registryCatalogEvidence.test.ts and confirm RED.
- [ ] Implement compact extraction and stale merge inside the existing crawler.
- [ ] Wire both sync entrypoints to read prior public/data/registry-catalog-items.json and rewrite it with metadata plus registry buckets.
- [ ] Run the focused test and script import/type checks; keep the full network sync for the phase boundary.

### Task 3: Load and search open-vocabulary catalog items

**Files:**
- Create: src/registry-explorer/core/registryCatalogIndex.ts
- Modify: src/registry-explorer/core/registry.schema.ts
- Modify: src/registry-explorer/data/loadRegistries.ts
- Modify: src/registry-explorer/core/discovery.ts
- Modify: src/registry-explorer/core/registryItemDetail.ts
- Test: tests/registry-explorer/registryLoader.test.ts
- Test: tests/registry-explorer/discovery.test.ts
- Test: tests/registry-explorer/registryItemDetail.test.ts

**Interfaces:**
- Produces: RegistryCatalogItem, RegistryCatalogIndex, RegistryCatalogSearchResult.
- Produces: searchRegistryCatalog(index, query, componentValues, limit=1000).
- Produces: compactCatalogItemToSummary(registry, item).
- LoadedRegistryData gains catalogIndex.
- searchComponentCandidates accepts optional catalog index/component selections and returns bounded search metadata while preserving reviewed-summary precedence.

- [ ] Write failing loader tests for valid and malformed compact-index data.
- [ ] Write failing search tests for an item name/title outside ComponentTag, reviewed-summary precedence, empty-query bounded default behavior, and >1,000 truncation.
- [ ] Write a failing detail test proving a compact item summary resolves through the registry URL template.
- [ ] Run the focused tests and confirm RED for the new behavior.
- [ ] Implement validation, lookup/search helpers, dedupe, and conversion into existing summary/candidate contracts.
- [ ] Keep query-less behavior unchanged unless an open component selection requires index materialization.
- [ ] Run the three focused test files and source/test typechecks.

### Task 4: Wire open-vocabulary facets and truthful result rendering

**Files:**
- Modify: src/registry-explorer/core/catalogFacets.ts
- Modify: src/registry-explorer/core/registryBrowse.ts
- Modify: src/registry-explorer/ui/shell.ts
- Modify: src/registry-explorer/ui/discoveryView.ts
- Test: tests/registry-explorer/catalogFacets.test.ts
- Test: tests/registry-explorer/registryBrowse.test.ts
- Test: tests/registry-explorer/discoveryView.test.ts
- Test: tests/registry-explorer/shell.test.ts

**Interfaces:**
- Component facet values become strings, not a closed ComponentTag-only gate.
- Facet option lookup can append compact-index name matches only when the local Component facet search is non-empty.
- Discover renderer receives indexed total/truncation metadata.

- [ ] Write failing tests for a raw component value absent from ComponentTag, including OR/AND semantics.
- [ ] Write a failing renderer test for truthful truncation copy.
- [ ] Write a shell test showing a selected raw component value materializes indexed candidates.
- [ ] Run focused tests and confirm RED.
- [ ] Implement string-valued component matching while preserving taxonomy labels/categories for known tags.
- [ ] Pass catalogIndex and selected component values through shell search/facet construction.
- [ ] Keep facet DOM bounded to the existing visible option limit.
- [ ] Run focused tests plus source/test typechecks.

### Task 5: Reconcile backlog documentation and generated data

**Files:**
- Modify: TODO.md
- Delete: docs/todo/00_github_workflow_pages.md
- Delete: docs/todo/00_verification-step.md
- Modify: docs/future-enhancements.md
- Modify: docs/registry-explorer-data.md
- Modify: docs/verification.md
- Generate/update: public/data/registry-catalog-items.json and sync reports.

**Interfaces:**
- Maintainer docs name mise as the preferred task entrypoint while preserving package-script equivalence.
- TODO contains only active/deferred work, with issue #3 explicitly separate.

- [ ] Rewrite TODO.md from current evidence; remove completed deployment/redesign entries.
- [ ] Remove the two completed deployment task files.
- [ ] Update data docs for compact-index generation, stale preservation, item-type scope, and reviewed-summary precedence.
- [ ] Update future-enhancements.md so direct docs links are described as an enrichment gap rather than a missing item-detail mechanism.
- [ ] Run mise run sync:registries once as the network phase boundary and inspect item counts/file size/report failures.
- [ ] Run mise run validate:data and git diff --check.

### Task 6: Acceptance, browser smoke, and review

**Files:** only files changed by Tasks 1-5.

- [ ] Run mise run verify fresh; require zero test/type/build/data-validation errors.
- [ ] Start/reuse the project-managed PinchTab profile and production-base-path dev/preview server per the generated frontend guide.
- [ ] Verify default Discover stays bounded, search finds an indexed-only item, install/detail affordances are present, detail navigation resolves, narrow viewport remains usable, and console/errors are clean.
- [ ] Review the branch diff against AGENTS.md and the spec on separate standards/spec axes.
- [ ] Fix substantive findings and rerun the smallest affected checks, then the full verification gate once.
- [ ] Commit coherent implementation changes and leave the worktree clean.

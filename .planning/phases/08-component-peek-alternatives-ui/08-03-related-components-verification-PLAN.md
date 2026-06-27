---
phase: 08-component-peek-alternatives-ui
plan: 08-03-related-components-verification
type: tdd
wave: 2
depends_on: [08-01-peek-popover, 08-02-filter-picker-evaluation]
files_modified:
  - src/registry-explorer/core/relatedComponents.ts
  - src/registry-explorer/core/registryItemDetail.ts
  - src/registry-explorer/ui/itemDetailView.ts
  - src/registry-explorer/ui/componentPeekView.ts
  - src/registry-explorer/ui/shell.ts
  - public/styles/registry-explorer.css
  - tests/registry-explorer/relatedComponents.test.ts
  - tests/registry-explorer/itemDetailView.test.ts
  - tests/registry-explorer/componentPeek.test.ts
autonomous: true
requirements: [ALT-01, ALT-02, ALT-03, EVAL-01, EVAL-02, PEEK-02, PEEK-04]
must_haves:
  truths:
    - "ALT-01: Peek/detail surfaces show related or similar components from shared taxonomy tag, category, item type, or registry item metadata."
    - "ALT-02: Related components are similarity-based alternatives, not quality-ranked recommendations."
    - "ALT-03: Phase 8 preserves visual/evaluation metadata seams for later recommendations without AI ranking or fake quality scores."
    - "EVAL-01: Evaluation labels expose dependency/file/visual/catalog-backed context concisely."
    - "EVAL-02: Dependency/risk context does not imply Registry Atlas audited or approved third-party code."
    - "PEEK-02: Visual fallback remains clear when related/peek cards lack a real visual."
    - "PEEK-04: User can distinguish real visual previews from links, raw metadata, or unavailable visuals."
    - "D-24: Related/similar components appear as a small strip or navigator on item/peek detail surfaces, not in every discovery card."
    - "D-25: Component-to-component browsing works through related items."
    - "D-26: Related strip content is minimal and visual when possible."
    - "D-27: Relatedness is based on shared type, category, tags, and available item metadata, not quality ranking."
    - "D-28: The future production-pattern-upgrade direction is preserved as a metadata seam only."
    - "D-29: Visible labels use safe non-ranking language such as `Similar patterns` or `Related components`."
    - "D-30: Phase 8 user-facing labels do not claim better/best/correct/polished/production-grade quality."
  prohibitions:
    - statement: "Do not present related components as better, best, correct, polished, approved, audited, or production-grade."
      status: resolved
      verification: "Relatedness tests and renderer source assertions check non-ranking copy."
---

<objective>
Add related/similar component navigation to item/detail and peek-adjacent surfaces, driven by safe metadata overlap, plus final verification that peeks, filters, evaluation labels, and related components satisfy Phase 8 without unsupported quality or audit claims.

Decision coverage: D-24, D-25, D-26, D-27, D-28, D-29, D-30 plus cross-plan verification for D-01 through D-23.
</objective>

<must_haves>
- Relatedness is metadata similarity only: same type, category, taxonomy tags/categories, and available item metadata overlap.
- Related strip lives on item/detail or peek-adjacent surfaces, not inside every discovery card.
- Use `Similar patterns` or `Related components` and `Matched by shared type, category, or tags.` copy.
- Every rendered related item uses escaped text and existing item-route navigation.
- Final verification must cover all Phase 8 requirements and must run `pnpm verify`.
</must_haves>

<threat_model>
- Assets: user trust in alternatives, future recommendation seam integrity, third-party registry safety, and item-route correctness.
- Threats: similarity UI being interpreted as quality ranking; related links routing to the wrong registry/item; untrusted related item fields being rendered unescaped; dense related cards recreating card-overcrowding; future recommendation wording leaking into Phase 8 before evidence exists.
- Controls: pure relatedness tests, explicit exclusion of current item, non-ranking copy assertions, escaped renderer tests, item-route data attributes, capped result count, and final `pnpm verify` gate.
- High severity gate: if related UI claims an item is better/best/approved/audited/production-grade or routes to the wrong item slug/registry, stop and fix before continuing.
</threat_model>

<tasks><task id="T1" title="Create related component derivation core">
  <name>Create related component derivation core</name>
  <files>
    - src/registry-explorer/core/relatedComponents.ts
    - src/registry-explorer/core/registryItemDetail.ts
    - src/registry-explorer/ui/itemDetailView.ts
    - src/registry-explorer/ui/componentPeekView.ts
    - src/registry-explorer/ui/shell.ts
    - public/styles/registry-explorer.css
  </files>
  <read_first>
    - src/registry-explorer/core/registry.schema.ts
    - src/registry-explorer/core/componentTaxonomy.ts
    - src/registry-explorer/core/discovery.ts
    - src/registry-explorer/core/registryItemDetail.ts
    - src/registry-explorer/core/componentFilters.ts
    - tests/registry-explorer/componentFilters.test.ts
    - .planning/phases/08-component-peek-alternatives-ui/08-CONTEXT.md
    - .planning/phases/08-component-peek-alternatives-ui/08-RESEARCH.md
    - .planning/phases/08-component-peek-alternatives-ui/08-PATTERNS.md
  </read_first>
  <action>
    Create `src/registry-explorer/core/relatedComponents.ts` with a `RelatedComponent` model and `buildRelatedComponents` helper. The helper must accept the current item identity plus loaded registries/item summaries, exclude the current registry+slug, score/count similarity only from shared item type, shared category, overlapping taxonomy tags/categories, route eligibility, and available visual metadata, and return a capped ordered list with non-ranking `matchReasons`. Do not include quality labels, recommendation labels, or future production-upgrade claims in the returned model.
  </action>
  <verify>
    <automated>pnpm test -- tests/registry-explorer/relatedComponents.test.ts && pnpm typecheck</automated>
  </verify>
  <acceptance_criteria>
    - `buildRelatedComponents` excludes the current registry/item pair.
    - Shared type/category/tag fixture items rank ahead of unrelated items by similarity count only.
    - `matchReasons` include sourceable phrases such as `Shared type`, `Shared category`, or `Shared tags`.
    - Returned related models include registry namespace, slug, display title/name, optional visual URL, and item-route data needed for navigation.
    - Unit tests assert the related model does not emit quality-ranking labels.
  </acceptance_criteria>

  <done>
    - `buildRelatedComponents` excludes the current registry/item pair.
    - Shared type/category/tag fixture items rank ahead of unrelated items by similarity count only.
    - `matchReasons` include sourceable phrases such as `Shared type`, `Shared category`, or `Shared tags`.
    - Returned related models include registry namespace, slug, display title/name, optional visual URL, and item-route data needed for navigation.
  </done>
</task>

<task id="T2" title="Render related/similar navigator on item detail and peek surfaces">
  <name>Render related/similar navigator on item detail and peek surfaces</name>
  <files>
    - src/registry-explorer/core/relatedComponents.ts
    - src/registry-explorer/core/registryItemDetail.ts
    - src/registry-explorer/ui/itemDetailView.ts
    - src/registry-explorer/ui/componentPeekView.ts
    - src/registry-explorer/ui/shell.ts
    - public/styles/registry-explorer.css
  </files>
  <read_first>
    - src/registry-explorer/ui/itemDetailView.ts
    - src/registry-explorer/ui/componentPeekView.ts
    - src/registry-explorer/ui/shell.ts
    - src/registry-explorer/core/registryItemDetail.ts
    - src/registry-explorer/core/relatedComponents.ts
    - src/registry-explorer/ui/renderSafety.ts
    - public/styles/registry-explorer.css
    - tests/registry-explorer/relatedComponents.test.ts
    - tests/registry-explorer/itemDetailView.test.ts
    - .planning/phases/08-component-peek-alternatives-ui/08-UI-SPEC.md
  </read_first>
  <action>
    Extend item detail rendering to accept related components and render a small navigator below the main visual/summary area or near concise evaluation context. Use the heading `Similar patterns` or `Related components`, include the note `Matched by shared type, category, or tags.`, and use the empty state `No similar components in this data set yet.`. Each related item should render a tiny visual/placeholder, component name, registry namespace, and click route data for the item page. If the peek renderer includes any related-adjacent path, keep it minimal and avoid alternatives inside every discovery card. Escape all related names, registries, slugs, and match reasons.
  </action>
  <verify>
    <automated>pnpm test -- tests/registry-explorer/relatedComponents.test.ts tests/registry-explorer/itemDetailView.test.ts tests/registry-explorer/componentPeek.test.ts && pnpm typecheck</automated>
  </verify>
  <acceptance_criteria>
    - Item detail output contains either `Similar patterns` or `Related components` when related items are provided.
    - Empty related output contains `No similar components in this data set yet.`.
    - Related item buttons/links carry registry namespace and item slug data for item route navigation.
    - Renderer tests prove related copy does not use quality-ranking, audit, or approval wording.
    - Related cards do not render dependency lists, file lists, install queues, or full discovery card clones.
  </acceptance_criteria>

  <done>
    - Item detail output contains either `Similar patterns` or `Related components` when related items are provided.
    - Empty related output contains `No similar components in this data set yet.`.
    - Related item buttons/links carry registry namespace and item slug data for item route navigation.
    - Renderer tests prove related copy does not use quality-ranking, audit, or approval wording.
  </done>
</task>

<task id="T3" title="Add concise evaluation labels and final phase regression tests">
  <name>Add concise evaluation labels and final phase regression tests</name>
  <files>
    - src/registry-explorer/core/relatedComponents.ts
    - src/registry-explorer/core/registryItemDetail.ts
    - src/registry-explorer/ui/itemDetailView.ts
    - src/registry-explorer/ui/componentPeekView.ts
    - src/registry-explorer/ui/shell.ts
    - public/styles/registry-explorer.css
  </files>
  <read_first>
    - src/registry-explorer/core/registryItemDetail.ts
    - src/registry-explorer/core/relatedComponents.ts
    - src/registry-explorer/ui/itemDetailView.ts
    - src/registry-explorer/ui/discoveryView.ts
    - src/registry-explorer/ui/registryProfileView.ts
    - src/registry-explorer/ui/componentPeekView.ts
    - tests/registry-explorer/componentPeek.test.ts
    - tests/registry-explorer/componentFilters.test.ts
    - tests/registry-explorer/relatedComponents.test.ts
    - .planning/phases/08-component-peek-alternatives-ui/08-VALIDATION.md
  </read_first>
  <action>
    Add or refine concise evaluation labels on item/detail surfaces for dependency count, registry dependency count, file count, visual availability, and catalog-backed/manual status. Keep labels factual and low-noise; pair risk context with the safety note `Review third-party registry code before installing.`. Add final regression tests that peeks exclude raw-data/source dumps, filters are generated/removable/resettable, related components are non-ranking, compact browsing surfaces avoid noisy confidence/status dominance, and `pnpm verify` remains the release gate.
  </action>
  <verify>
    <automated>pnpm test -- tests/registry-explorer/componentPeek.test.ts tests/registry-explorer/componentFilters.test.ts tests/registry-explorer/relatedComponents.test.ts tests/registry-explorer/itemDetailView.test.ts tests/registry-explorer/discoveryView.test.ts tests/registry-explorer/registryProfileView.test.ts && pnpm verify</automated>
  </verify>
  <acceptance_criteria>
    - Item/detail evaluation labels expose dependency count, registry dependency count, file count, visual availability, and catalog/catalog-backed context when data exists.
    - Safety note text includes `Review third-party registry code before installing.`.
    - Tests cover all Phase 8 requirement groups: PEEK, FILT, EVAL, and ALT.
    - `pnpm verify` exits 0 after Phase 8 implementation.
    - No Phase 8 browsing UI presents related items as quality-ranked recommendations.
  </acceptance_criteria>

  <done>
    - Item/detail evaluation labels expose dependency count, registry dependency count, file count, visual availability, and catalog/catalog-backed context when data exists.
    - Safety note text includes `Review third-party registry code before installing.`.
    - Tests cover all Phase 8 requirement groups: PEEK, FILT, EVAL, and ALT.
    - `pnpm verify` exits 0 after Phase 8 implementation.
  </done>
</task>
</tasks>

<verification>
- `pnpm test -- tests/registry-explorer/relatedComponents.test.ts tests/registry-explorer/itemDetailView.test.ts tests/registry-explorer/componentPeek.test.ts tests/registry-explorer/componentFilters.test.ts tests/registry-explorer/discoveryView.test.ts tests/registry-explorer/registryProfileView.test.ts`
- `pnpm typecheck`
- `pnpm typecheck:test`
- `pnpm validate:data`
- `pnpm verify`
</verification>

<success_criteria>
- Item/detail surfaces show related/similar components by shared metadata.
- Related navigation enables component-to-component browsing through internal item routes.
- Labels and related copy are factual, concise, non-ranking, and non-auditing.
- All Phase 8 requirements are represented in tests and final verification.

## Artifacts this phase produces

- `src/registry-explorer/core/relatedComponents.ts`
- `RelatedComponent`
- `buildRelatedComponents`
- `RelatedComponentMatchReason`
- `renderRelatedComponents` or equivalent item-detail renderer helper
- `.related-components`
- `.related-component-card`
- `.related-preview-placeholder`
- `tests/registry-explorer/relatedComponents.test.ts`
- `tests/registry-explorer/itemDetailView.test.ts`

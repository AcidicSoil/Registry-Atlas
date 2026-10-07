# Canonical Catalog Taxonomy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Classify every Registry Atlas catalog item into a stable structural kind and Registry Atlas-owned canonical taxonomy so users can search, group, sort, and filter equivalent items across registries despite inconsistent source naming.

**Architecture:** A versioned repository taxonomy is the only source of canonical semantic labels. Local catalog metadata is converted into bounded classification state; exact curated aliases bypass System One, while unresolved items use hierarchical System One `Choice` with beam width 2. Classifications remain a generated shadow overlay until a gold-set evaluation is explicitly reviewed, after which the existing registry sync applies the reviewed overlay into runtime catalog data. Source categories/groups remain separate evidence, and access metadata is optional/source-specific.

**Tech Stack:** TypeScript, Node.js ESM, Vitest, Vite, JSON repository data, local llama.cpp `/v1/systemone` endpoint, existing Registry Atlas catalog/query/UI modules.

**Spec:** `docs/superpowers/specs/2026-10-06-canonical-catalog-taxonomy-design.md`

## Global Constraints

- The taxonomy is Registry Atlas-owned, versioned repository data; System One may never create or rename taxonomy nodes.
- Canonical classification must run from local catalog metadata without requiring browser/source discovery.
- Preserve raw `type` and existing source `categories`; canonical taxonomy is stored separately.
- Canonical `kind` values are `component | block | page | template | theme | icon | other`; blocks and pages must not be collapsed into components/templates.
- Exact curated aliases may bypass System One only when they resolve unambiguously to one node.
- Hierarchical System One classification uses bounded `Choice`, beam width `2`, and a length-normalized geometric mean path score.
- Root decisions include `UNCLASSIFIED`; non-leaf child decisions include `THIS_CATEGORY`.
- Record probabilities/confidence for evaluation; do not introduce an acceptance threshold without labeled calibration.
- Source categories/groups are optional evidence, never the global taxonomy.
- Access metadata is optional; omit it when no explicit source commercial/access distinction exists.
- Browser observations may enrich source hints but may not block or determine whether canonical classification can run.
- Promotion into runtime data must be deterministic and gated by an explicitly reviewed evaluation artifact.
- No registry-name conditionals in classifier code; reviewed source-specific exceptions belong in data/configuration, not branches.
- Leave the existing untracked `systemone-identity` experiment untouched throughout this plan.

## Review Focus

- **Alias collisions:** the same normalized alias must never silently map to two canonical nodes; Task 1 pins validation and Task 3 pins deterministic fallback behavior.
- **Sync durability:** `pnpm sync:registries` must preserve reviewed canonical classifications rather than overwrite them; Task 7 owns the overlay contract and regression test.
- **Browser independence:** a registry with zero source-page observations must still classify from local title/name/description/type; Tasks 3 and 5 test this directly.
- **Kind compatibility:** expanding kind from the legacy component/template/theme/icon set must not break existing detail routes or icon behavior; Tasks 2, 8, and 9 cover route/query compatibility.
- **Facet semantics:** selecting a parent taxonomy node must include descendants while missing access metadata creates no `Unknown` facet bucket; Tasks 8 and 9 own these tests.

---

### Task 1: Add the versioned canonical taxonomy and validation contract

**Files:**
- Create: `data/catalog-taxonomy/v1.json`
- Create: `scripts/lib/catalog-taxonomy.mjs`
- Create: `tests/registry-explorer/catalogTaxonomy.test.ts`

**Interfaces:**
- Produces: `validateCatalogTaxonomy(value) -> CatalogTaxonomy`
- Produces: `flattenCatalogTaxonomy(taxonomy) -> TaxonomyNodeRecord[]`
- Produces: `taxonomyNodeMap(taxonomy) -> Map<string, TaxonomyNodeRecord>`
- Produces: `taxonomyDescendantIds(taxonomy, id) -> string[]`
- Taxonomy JSON shape: `{ version: string, roots: CatalogTaxonomyNode[] }`

- [ ] **Step 1: Write failing taxonomy validation tests**

Cover:
- unique path-like node IDs;
- parent/child IDs form a valid hierarchy;
- normalized aliases are unique unless they belong to the same node;
- no cycles/duplicate nodes;
- required `label`, `what`, `notFor`, `examples`, `aliases`, and `children` fields;
- descendant lookup includes all recursive children but not unrelated branches;
- the required v1 families/leaves from the spec exist, including `application/app-shell`, `ai/chat`, `controls/button`, `foundation/color`, and `foundation/typography`.

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `pnpm exec vitest run tests/registry-explorer/catalogTaxonomy.test.ts`
Expected: FAIL because taxonomy data/validator do not exist.

- [ ] **Step 3: Add `data/catalog-taxonomy/v1.json`**

Implement exactly the approved v1 taxonomy in the spec. Keep canonical IDs stable and definitions contrastive; aliases are source vocabulary hints, not generated strings.

- [ ] **Step 4: Implement `scripts/lib/catalog-taxonomy.mjs`**

Validate the JSON contract, flatten the hierarchy, build an ID map, and compute descendants without introducing application/UI dependencies.

- [ ] **Step 5: Run focused tests**

Run: `pnpm exec vitest run tests/registry-explorer/catalogTaxonomy.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add data/catalog-taxonomy/v1.json scripts/lib/catalog-taxonomy.mjs tests/registry-explorer/catalogTaxonomy.test.ts
git commit -m "feat: add canonical catalog taxonomy"
```

### Task 2: Make structural kind a first-class, accurate catalog field

**Files:**
- Create: `data/catalog-taxonomy/kind-overrides.json`
- Modify: `src/registry-explorer/core/registry.schema.ts`
- Modify: `src/registry-explorer/core/catalogCollections.ts`
- Modify: `tests/registry-explorer/catalogCollections.test.ts`
- Create: `tests/registry-explorer/registryCatalogIndex.test.ts`

**Interfaces:**
- Produces: `CatalogCanonicalKind = "component" | "block" | "page" | "template" | "theme" | "icon" | "other"`
- Produces/updates: `assetKindForCatalogItem(item, namespace?) -> CatalogCanonicalKind`
- `RegistryCatalogItem.kind?: CatalogCanonicalKind`
- `kind-overrides.json` stores reviewed source exceptions as data; code contains no namespace-specific branches.

- [ ] **Step 1: Write failing kind tests**

Assert:
- `registry:block -> block`;
- `registry:component|registry:ui|registry:item -> component`;
- `registry:page -> page`;
- `registry:style|registry:theme -> theme`;
- `registry:icon -> icon`;
- unsupported type -> `other`;
- explicit promoted `item.kind` wins over legacy fallback logic;
- existing icon-only exceptions remain correct through reviewed data/configuration rather than hardcoded namespace checks.

- [ ] **Step 2: Run focused tests and verify failure**

Run: `pnpm exec vitest run tests/registry-explorer/catalogCollections.test.ts tests/registry-explorer/registryCatalogIndex.test.ts`
Expected: FAIL on missing kinds/schema.

- [ ] **Step 3: Extend the runtime schema**

Add `CatalogCanonicalKind`, canonical/access interfaces from the spec, and optional fields on `RegistryCatalogItem` while preserving raw `type` and source `categories` unchanged.

- [ ] **Step 4: Update kind normalization**

Replace the legacy four-kind assumption with the approved seven-kind contract. Move any required reviewed source exception into `kind-overrides.json`; do not add new registry-name conditionals.

- [ ] **Step 5: Extend catalog-index parsing tests**

Prove valid canonical/access fields parse, malformed paths/kinds/access objects reject, and old catalog items without new fields remain backward-compatible.

- [ ] **Step 6: Run focused tests and typecheck**

Run: `pnpm exec vitest run tests/registry-explorer/catalogCollections.test.ts tests/registry-explorer/registryCatalogIndex.test.ts && pnpm typecheck`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add data/catalog-taxonomy/kind-overrides.json src/registry-explorer/core/registry.schema.ts src/registry-explorer/core/catalogCollections.ts tests/registry-explorer/catalogCollections.test.ts tests/registry-explorer/registryCatalogIndex.test.ts
git commit -m "feat: normalize catalog asset kinds"
```

### Task 3: Build compact classification state and deterministic alias classification

**Files:**
- Create: `scripts/lib/catalog-classification-state.mjs`
- Create: `scripts/lib/catalog-classifier.mjs`
- Create: `tests/registry-explorer/catalogClassifier.test.ts`

**Interfaces:**
- Produces: `buildCatalogClassificationState({ namespace, item, sourceHints? }) -> CatalogClassificationState`
- Produces: `findDeterministicAliasClassification(state, taxonomy) -> ClassificationResult | null`
- `ClassificationResult` includes `taxonomyVersion`, `primary`, `path`, `method`, `inputFingerprint`.

- [ ] **Step 1: Write failing state/alias tests**

Cover:
- local `name/title/description/kind` is enough to build state with no browser evidence;
- empty source hints are omitted;
- text is whitespace-normalized and bounded;
- source navigation or arbitrary page dumps are not accepted as classifier state;
- exact `App Shell -> application/app-shell`;
- exact `AI Chat -> ai/chat`;
- exact `Button -> controls/button` when the curated alias is unambiguous;
- ambiguous alias collision returns `null` and falls through to System One;
- deterministic result includes the full ancestor path and stable input fingerprint.

- [ ] **Step 2: Run the test and verify failure**

Run: `pnpm exec vitest run tests/registry-explorer/catalogClassifier.test.ts`
Expected: FAIL because the classifier modules do not exist.

- [ ] **Step 3: Implement compact state construction**

Use only semantic item fields plus optional trusted source hints. Browser observations remain optional enrichment and are never required.

- [ ] **Step 4: Implement deterministic alias lookup**

Only exact normalized aliases/titles/categories can bypass System One, and only when one taxonomy node owns that alias.

- [ ] **Step 5: Run focused tests**

Run: `pnpm exec vitest run tests/registry-explorer/catalogClassifier.test.ts`
Expected: PASS for state and deterministic cases; System One-specific cases remain for Task 4.

- [ ] **Step 6: Commit**

```bash
git add scripts/lib/catalog-classification-state.mjs scripts/lib/catalog-classifier.mjs tests/registry-explorer/catalogClassifier.test.ts
git commit -m "feat: add deterministic catalog classification"
```

### Task 4: Implement hierarchical System One classification with beam width 2

**Files:**
- Create: `scripts/lib/systemone-taxonomy.mjs`
- Modify: `scripts/lib/catalog-classifier.mjs`
- Create: `tests/registry-explorer/systemOneTaxonomy.test.ts`
- Modify: `tests/registry-explorer/catalogClassifier.test.ts`

**Interfaces:**
- Produces: `chooseTaxonomyOption({ state, node, options, endpoint, timeoutMs, fetchImpl })`
- Produces: `classifyCatalogItem({ state, taxonomy, choose, beamWidth = 2 }) -> CatalogCanonicalClassification`
- Choice options at root: direct root IDs + `UNCLASSIFIED`.
- Choice options below root: direct child IDs + `THIS_CATEGORY`.
- Path score: `exp(mean(log(edgeProbability)))`.

- [ ] **Step 1: Write failing adapter tests**

Assert the request:
- targets only local `/v1/systemone`;
- sends compact item state once;
- criteria are generated only from taxonomy-owned `what`, `notFor`, `examples`, and aliases;
- rejects invented choices, missing/extra probabilities, invalid confidence, duplicate options, bad endpoints, and timeouts;
- never exposes free-form label generation.

- [ ] **Step 2: Write failing beam-search tests**

Fixtures must prove:
- deterministic alias bypasses `choose` entirely;
- root `UNCLASSIFIED` yields `primary: null`;
- `THIS_CATEGORY` stops at the current parent;
- beam width is exactly `2` by default;
- a runner-up branch can overtake the initially highest root branch after deeper evidence;
- geometric-mean scoring does not unfairly penalize deeper paths;
- complete probability distributions and retained-path decisions are recorded;
- no probability/confidence threshold rejects a valid bounded choice.

- [ ] **Step 3: Run focused tests and verify failure**

Run: `pnpm exec vitest run tests/registry-explorer/systemOneTaxonomy.test.ts tests/registry-explorer/catalogClassifier.test.ts`
Expected: FAIL on missing System One hierarchy behavior.

- [ ] **Step 4: Implement `chooseTaxonomyOption`**

Keep endpoint validation/failure semantics from the existing local System One adapter, but replace source-group-specific state/options with taxonomy-node decisions.

- [ ] **Step 5: Implement beam-width-2 hierarchical traversal**

Expand only direct children, carry cumulative log probability/count, retain two best frontier paths, terminate on leaf/`THIS_CATEGORY`/`UNCLASSIFIED`, then emit the best final path and runner-up metrics.

- [ ] **Step 6: Run focused tests**

Run: `pnpm exec vitest run tests/registry-explorer/systemOneTaxonomy.test.ts tests/registry-explorer/catalogClassifier.test.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add scripts/lib/systemone-taxonomy.mjs scripts/lib/catalog-classifier.mjs tests/registry-explorer/systemOneTaxonomy.test.ts tests/registry-explorer/catalogClassifier.test.ts
git commit -m "feat: classify catalog taxonomy with system one"
```

### Task 5: Add a browser-independent resumable classification runner

**Files:**
- Create: `scripts/classify-registry-catalog.mjs`
- Create: `tests/registry-explorer/catalogClassificationCli.test.ts`

**Interfaces:**
- CLI inputs: taxonomy path, catalog path, output directory, registry cursor/batch size, decision URL, deterministic-only flag, all-batches/resume flags.
- Output: one classification artifact per registry plus `_batches/batch-NNNN.json` and `_state.json`.
- The runner reads local catalog data only; no PinchTab/profile/tab arguments exist.

- [ ] **Step 1: Write failing CLI argument/batch tests**

Cover:
- dry planning enumerates all local catalog registries;
- default batch size is bounded;
- `--all-batches` follows cursors;
- `--resume` starts from last completed batch;
- deterministic-only mode leaves unresolved model-required items explicitly unclassified rather than failing;
- no browser/profile/tab flag is recognized;
- taxonomy/input fingerprints are persisted.

- [ ] **Step 2: Write failing artifact tests**

Each item artifact must include namespace/name, kind, taxonomy version, canonical result, method, input fingerprint, model/decision trace when applicable, and generated timestamp.

- [ ] **Step 3: Run focused tests and verify failure**

Run: `pnpm exec vitest run tests/registry-explorer/catalogClassificationCli.test.ts`
Expected: FAIL because the CLI does not exist.

- [ ] **Step 4: Implement the local runner**

Reuse the proven atomic batch-state pattern from the survey runner, but do not import browser navigation/discovery code.

- [ ] **Step 5: Run a deterministic-only dry/full fixture pass**

Run the test fixture through all batches without a System One server. Expected: every item has a kind; exact aliases classify; remaining items are explicitly unclassified/pending decision with no browser failure state.

- [ ] **Step 6: Run focused tests**

Run: `pnpm exec vitest run tests/registry-explorer/catalogClassificationCli.test.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add scripts/classify-registry-catalog.mjs tests/registry-explorer/catalogClassificationCli.test.ts
git commit -m "feat: batch canonical catalog classification"
```

### Task 6: Add the reviewed gold set, evaluation report, and explicit promotion gate

**Files:**
- Create: `data/catalog-taxonomy/gold.json`
- Create: `scripts/evaluate-catalog-classifications.mjs`
- Create: `data/catalog-taxonomy/promotion-review.example.json`
- Create: `tests/registry-explorer/catalogClassificationEvaluation.test.ts`

**Interfaces:**
- Gold fixture records contain registry/item semantic state plus expected `kind` and expected canonical primary/path or explicit unclassified.
- Evaluation output includes exact primary accuracy, top-family accuracy, ancestor-path accuracy, unclassified precision/recall, confusion pairs, by-kind/source breakdown, greedy-vs-beam comparison, and probability/separation distributions.
- Promotion review schema references taxonomy version, classification-run fingerprint, evaluation-report fingerprint, reviewer identity, and approval timestamp.

- [ ] **Step 1: Create failing evaluation tests**

Use fixtures proving:
- differently named App Shell examples converge on `application/app-shell`;
- reviewed AI Chat/Chat Starter gold rows with expected primary `ai/chat` classify to `ai/chat`, while at least one reviewed non-chat AI row proves there is no `AI* -> ai/chat` shortcut;
- Button examples converge on `controls/button`;
- foundation Color/Typography map correctly;
- explicit unclassified examples are measured correctly;
- greedy and beam-width-2 metrics are both reported.

- [ ] **Step 2: Populate the reviewed gold fixture**

Include representative cases from the approved sources: 7Ovr, Efferd, Bencho, BoardUI, 8bitcn, Aceternity, plus flat-registry cases. Do not copy unreviewed old survey group assignments into expected canonical labels.

- [ ] **Step 3: Implement evaluation**

Evaluation consumes classification output plus gold expectations and emits deterministic JSON; it does not modify runtime catalog data.

- [ ] **Step 4: Add promotion-review schema/example**

Promotion must later require a concrete reviewed file matching the exact taxonomy/run/evaluation fingerprints. Do not auto-approve based on accuracy.

- [ ] **Step 5: Run focused tests**

Run: `pnpm exec vitest run tests/registry-explorer/catalogClassificationEvaluation.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add data/catalog-taxonomy/gold.json data/catalog-taxonomy/promotion-review.example.json scripts/evaluate-catalog-classifications.mjs tests/registry-explorer/catalogClassificationEvaluation.test.ts
git commit -m "feat: evaluate canonical catalog classifications"
```

### Task 7: Promote reviewed classifications as a durable sync overlay and normalize optional access

**Files:**
- Create: `data/catalog-taxonomy/access-rules.json`
- Create: `scripts/lib/catalog-classification-overlay.mjs`
- Create: `scripts/promote-catalog-classifications.mjs`
- Modify: `scripts/sync-shadcn-registries.mjs`
- Modify: `src/registry-explorer/core/registryCatalogIndex.ts`
- Create: `tests/registry-explorer/catalogClassificationPromotion.test.ts`
- Modify: `tests/registry-explorer/registryCatalogIndex.test.ts`

**Interfaces:**
- Reviewed overlay source: `data/catalog-taxonomy/classifications.json`.
- Runtime taxonomy copy: `public/data/catalog-taxonomy.json`.
- `applyCatalogClassificationOverlay(itemsByNamespace, overlay, accessRules)` preserves raw item fields and adds only `kind`, `canonical`, optional `sourceGroups`, optional `access`.
- Promotion CLI refuses mismatched taxonomy/run/evaluation fingerprints or absent explicit review.

- [ ] **Step 1: Write failing promotion tests**

Prove:
- unreviewed classification runs cannot promote;
- stale taxonomy/input/evaluation fingerprints cannot promote;
- raw `type`, title, description, and `categories` are byte-equivalent after overlay application;
- canonical paths come only from validated taxonomy IDs;
- source groups stay separate;
- explicit reviewed `Free` maps to `{ normalized: "free", sourceLabel: "Free" }`;
- explicit reviewed `Pro`/`Premium` maps to paid;
- a registry with no access rule/evidence gets no `access` field;
- no `unknown` access bucket is generated.

- [ ] **Step 2: Implement reviewed access rules as data**

Only registries/labels with explicit reviewed source semantics belong in `access-rules.json`. No inference from absence of `Free`.

- [ ] **Step 3: Implement promotion**

Validate review fingerprints and write the reviewed overlay source file; do not directly hand-edit `public/data/registry-catalog-items.json`.

- [ ] **Step 4: Integrate overlay application into `sync-shadcn-registries.mjs`**

After source catalog sync and before writing `public/data/registry-catalog-items.json`, load/validate the reviewed overlay and merge classification fields. Also publish the validated taxonomy to `public/data/catalog-taxonomy.json`.

- [ ] **Step 5: Extend runtime parser validation**

`parseRegistryCatalogIndex` accepts promoted fields and rejects malformed/unrecognized canonical paths/access values.

- [ ] **Step 6: Prove sync durability**

Run a fixture sync twice and assert canonical fields survive identical upstream refresh while changed source item fingerprints cause stale/missing overlay entries to be omitted/rejected rather than blindly reused.

- [ ] **Step 7: Run focused tests**

Run: `pnpm exec vitest run tests/registry-explorer/catalogClassificationPromotion.test.ts tests/registry-explorer/registryCatalogIndex.test.ts`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add data/catalog-taxonomy/access-rules.json scripts/lib/catalog-classification-overlay.mjs scripts/promote-catalog-classifications.mjs scripts/sync-shadcn-registries.mjs src/registry-explorer/core/registryCatalogIndex.ts tests/registry-explorer/catalogClassificationPromotion.test.ts tests/registry-explorer/registryCatalogIndex.test.ts
git commit -m "feat: promote reviewed catalog classifications"
```

### Task 8: Add canonical taxonomy and optional access to query, search, facets, and URL state

**Files:**
- Create: `src/registry-explorer/core/catalogTaxonomy.ts`
- Modify: `src/registry-explorer/data/loadRegistries.ts`
- Modify: `src/registry-explorer/core/catalogQuery.ts`
- Modify: `src/registry-explorer/core/catalogRoutes.ts`
- Modify: `tests/registry-explorer/catalogQuery.test.ts`
- Modify: `tests/registry-explorer/catalogRoutes.test.ts`
- Create: `tests/registry-explorer/catalogTaxonomyRuntime.test.ts`

**Interfaces:**
- `LoadedRegistryData.taxonomy` contains validated runtime taxonomy.
- `CatalogQueryOptions.canonicalIds?: readonly string[]`
- `CatalogQueryOptions.access?: readonly ("free" | "paid")[]`
- `CatalogFacetSummary.canonical` and optional `CatalogFacetSummary.access`.
- `CatalogBrowseQueryState.canonicalIds`, `assetKinds`, and `access` round-trip through URL params.

- [ ] **Step 1: Write runtime taxonomy-loading tests**

Validate `public/data/catalog-taxonomy.json`, build ID/ancestor/descendant lookups, and fail clearly on malformed runtime taxonomy.

- [ ] **Step 2: Write query/filter tests**

Cover:
- `kind=block + canonical=application/app-shell` across multiple registries;
- `canonical=ai/chat` independent of source category names;
- `kind=component + canonical=controls/button`;
- selecting parent `application` includes descendant paths;
- OR within canonical multi-select and AND across registry/kind/canonical/access;
- unclassified items remain visible with no canonical filter and do not match a canonical filter;
- text search matches canonical label/alias without deleting existing source-field search;
- access facet is absent/empty when no result has explicit access metadata.

- [ ] **Step 3: Write URL round-trip tests**

Use stable canonical IDs in `canonical=` params and explicit `asset=`/`access=` params. Unsafe/unknown canonical IDs are ignored or rejected against the loaded taxonomy at the application boundary.

- [ ] **Step 4: Implement runtime taxonomy/query support**

Do not merge canonical paths into existing `categories`. Existing category behavior remains source/upstream behavior until UI retirement decisions are made separately.

- [ ] **Step 5: Preserve legacy detail-route compatibility**

Blocks/pages receive accurate `kind` even where existing detail URLs still use legacy component/template route families; route validation must accept the accurate canonical kind without silently rewriting it.

- [ ] **Step 6: Run focused tests and typecheck**

Run: `pnpm exec vitest run tests/registry-explorer/catalogTaxonomyRuntime.test.ts tests/registry-explorer/catalogQuery.test.ts tests/registry-explorer/catalogRoutes.test.ts && pnpm typecheck`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/registry-explorer/core/catalogTaxonomy.ts src/registry-explorer/data/loadRegistries.ts src/registry-explorer/core/catalogQuery.ts src/registry-explorer/core/catalogRoutes.ts tests/registry-explorer/catalogTaxonomyRuntime.test.ts tests/registry-explorer/catalogQuery.test.ts tests/registry-explorer/catalogRoutes.test.ts
git commit -m "feat: query canonical catalog taxonomy"
```

### Task 9: Expose hierarchical canonical filtering in the UI

**Files:**
- Modify: `src/registry-explorer/ui/catalogComponentsView.ts`
- Modify: `src/registry-explorer/ui/catalogSidebarNavigation.ts`
- Modify: `src/registry-explorer/ui/registryCollectionView.ts`
- Modify: `src/registry-explorer/ui/shell.ts`
- Modify: `public/styles/registry-explorer.css`
- Modify: `tests/registry-explorer/catalogComponentsView.test.ts`
- Modify: `tests/registry-explorer/catalogSidebarNavigation.test.ts`
- Modify: `tests/registry-explorer/registryCollectionView.test.ts`
- Modify: `tests/registry-explorer/shell.test.ts`

**Interfaces:**
- Global primary filters: Search, Registry, Kind, Canonical Category, conditional Access.
- Canonical filter renders taxonomy hierarchy and uses node IDs as state; labels are presentation only.
- Source categories/groups may remain registry-local metadata but are not the global semantic facet.

- [ ] **Step 1: Write failing UI rendering/state tests**

Assert:
- hierarchical families such as Application/AI/Controls render from taxonomy data;
- selecting `Application > App Shell` writes the canonical node ID to state/URL;
- parent selection shows descendant result counts;
- Kind includes block/page without relabeling them as component/template;
- Access is omitted when the current result/facet set contains no explicit access values;
- active filter chips clear canonical/access values correctly;
- flat/source-ungrouped registries still show canonical classifications.

- [ ] **Step 2: Replace global source-category emphasis with canonical taxonomy**

Keep source categories only where existing registry-local UX benefits from provenance. Do not show source categories as if they are cross-registry equivalents.

- [ ] **Step 3: Wire shell state and navigation**

Pass loaded taxonomy into facet rendering/query construction and preserve back/forward/reload behavior.

- [ ] **Step 4: Verify accessibility/responsiveness**

Keyboard activation, `aria-pressed`/expanded hierarchy state, focus preservation after filter changes, and existing narrow-layout behavior must remain functional.

- [ ] **Step 5: Run focused UI tests**

Run: `pnpm exec vitest run tests/registry-explorer/catalogComponentsView.test.ts tests/registry-explorer/catalogSidebarNavigation.test.ts tests/registry-explorer/registryCollectionView.test.ts tests/registry-explorer/shell.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/registry-explorer/ui/catalogComponentsView.ts src/registry-explorer/ui/catalogSidebarNavigation.ts src/registry-explorer/ui/registryCollectionView.ts src/registry-explorer/ui/shell.ts public/styles/registry-explorer.css tests/registry-explorer/catalogComponentsView.test.ts tests/registry-explorer/catalogSidebarNavigation.test.ts tests/registry-explorer/registryCollectionView.test.ts tests/registry-explorer/shell.test.ts
git commit -m "feat: browse canonical catalog categories"
```

### Task 10: Retire source-group classification as the primary path and perform end-to-end verification

**Files:**
- Modify: `docs/superpowers/specs/2026-10-05-catalog-structure-survey.md`
- Modify: `docs/superpowers/plans/2026-10-05-catalog-structure-survey.md`
- Leave survey runtime behavior unchanged; migration is enforced by documentation plus product/data validation that rejects survey `groups[]` as canonical taxonomy input.
- Modify: `scripts/check-product-contract.mjs` to require taxonomy/runtime canonical-field parity after promotion.
- Modify: `scripts/validate-registry-data.mjs` to validate taxonomy, reviewed overlay fingerprints, and runtime canonical paths.

**Interfaces:**
- Old survey output is evidence-only and cannot be promoted into global canonical categories.
- Product-contract/data validation checks the reviewed taxonomy/overlay/runtime relationship.

- [ ] **Step 1: Add migration/product-contract regressions**

Prove:
- old `groups[]` artifacts cannot be consumed as canonical classification input without explicit reviewed source-hint conversion;
- site navigation labels such as Docs/Privacy/License cannot become canonical nodes;
- browser/source failure does not make local canonical classification impossible;
- sync output contains only taxonomy-valid canonical IDs.

- [ ] **Step 2: Mark the old survey docs as superseded for primary classification**

Keep the historical discovery design, but point readers to `2026-10-06-canonical-catalog-taxonomy-design.md` and state that source groups are supplemental evidence only.

- [ ] **Step 3: Run gold evaluation with local Clef**

Run the reviewed gold set through both greedy and beam-width-2 classification. Inspect confusion pairs and probability/separation distributions. Do not create an acceptance threshold.

- [ ] **Step 4: Obtain explicit promotion review**

Create the real promotion-review file only after the evaluation report has been reviewed. Its fingerprints must match the taxonomy and classification run exactly.

- [ ] **Step 5: Promote classifications and regenerate runtime data**

Run promotion, then `pnpm sync:registries` or the repository-supported local sync path. Confirm the generated catalog contains canonical fields without altering raw source categories/type.

- [ ] **Step 6: Browser-verify the core product queries**

Verify through the normal Registry Atlas interface:
- all `application/app-shell` blocks across registries;
- all `ai/chat` items;
- `controls/button` with `kind=component`;
- broad parent `application` including descendants;
- foundation Color/Typography;
- registry + kind + canonical combined filter;
- Access appears for an explicitly classified commercial registry and is absent for a registry without access semantics;
- copied URLs reproduce the same canonical filters after reload.

- [ ] **Step 7: Run the full repository gate**

Run:

```bash
pnpm typecheck
pnpm typecheck:test
pnpm test
pnpm check:product-contract
pnpm validate:data
pnpm build
git diff --check
```

Expected: all commands pass; build may retain only previously accepted warnings.

- [ ] **Step 8: Review final diff against the product goal**

Confirm the shipped result answers cross-registry semantic queries from Registry Atlas-owned labels and does not depend on recovering each website's taxonomy first.

- [ ] **Step 9: Commit verification/migration docs and gates**

```bash
git add docs/superpowers/specs/2026-10-05-catalog-structure-survey.md docs/superpowers/plans/2026-10-05-catalog-structure-survey.md scripts/check-product-contract.mjs scripts/validate-registry-data.mjs
git commit -m "docs: retire source groups as primary taxonomy"
```

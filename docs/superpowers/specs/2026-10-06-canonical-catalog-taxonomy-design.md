# Registry Atlas — Canonical Catalog Taxonomy and Classification

**Status:** Design approved; written specification awaiting review
**Date:** 2026-10-06
**Supersedes as primary architecture:** `2026-10-05-catalog-structure-survey.md`

## 1. Problem

Registry Atlas aggregates items from registries that use inconsistent names and structures.

The same concept can appear under different source vocabularies:

- a source can call a block `App Shell`;
- another can place equivalent items under `App / Dashboard`;
- another can expose only item titles and no useful category structure;
- a source can call something `AI Chat`, `Chat Starter`, `Multi-agent Chat`, or a similar source-specific name;
- a base component such as a button can appear under `Base`, `Components`, `Controls`, or no source group at all.

Registry Atlas must make these items comparable across registries.

The primary product requirement is:

> Given a semantic concept X and an asset kind Y, find the relevant items across all registries even when each source uses different names and categories.

Examples:

- all `application/app-shell` items where `kind = block`;
- all `ai/chat` items where `kind = block`;
- all `controls/button` items where `kind = component`;
- all items under the broad `foundation` category;
- all `data/table` items across blocks, components, pages, and templates.

Source-defined categories remain useful evidence and provenance, but they are not the global taxonomy.

## 2. Product goals

Registry Atlas SHALL:

1. own a versioned canonical taxonomy;
2. assign each catalog item a normalized structural `kind`;
3. assign each classifiable item one canonical primary taxonomy node;
4. make parent taxonomy nodes match all descendants;
5. preserve original source categories and groups separately when they are available and trustworthy;
6. support global filtering and grouping by canonical taxonomy independent of source vocabulary;
7. support cross-registry queries such as `kind=block + canonical=application/app-shell`;
8. classify items from existing catalog metadata without requiring browser discovery to succeed;
9. use System One only for narrow semantic classification decisions;
10. record probabilities and classification paths for evaluation and later calibration;
11. keep commercial/access metadata optional and source-specific;
12. version taxonomy and classification output so stale classifications can be detected and regenerated.

## 3. Non-goals

This feature does NOT:

- require every registry to expose categories;
- require every registry to distinguish free from paid;
- invent a universal mapping from every source category to another source category;
- treat source navigation as canonical taxonomy;
- make source-group scraping a prerequisite for classification;
- ask System One to discover taxonomy labels;
- ask System One to generate free-form category names;
- use an arbitrary probability or confidence threshold before calibration;
- collapse blocks into components or pages into templates;
- implement semantic vector search in the first release;
- introduce secondary multi-label semantic tagging in the first release;
- execute third-party registry code to classify an item.

## 4. Authoritative System One guidance

The implementation SHALL follow the TypeSafe documentation as the authoritative guide for System One design.

Relevant principles:

- code owns control flow and deterministic rules;
- System One handles narrow semantic judgments over structured state;
- `Choice` is used when one option from a known set should win;
- broad judgments are decomposed into smaller judgments;
- state contains only the information needed for the current question;
- Choice criteria should contrast options with definitions, exclusions, and examples where useful;
- probabilities and confidence are observable outputs, not excuses to invent uncalibrated thresholds;
- hierarchical classification is implemented as repeated bounded Choice decisions over taxonomy children;
- beam search can preserve multiple plausible paths when an early decision is ambiguous;
- large candidate sets can use progressive disclosure: rank broadly, then inspect a smaller candidate set with richer evidence.

Authoritative references:

- https://docs.typesafe.ai/concepts/use-case-map
- https://docs.typesafe.ai/primitives
- https://docs.typesafe.ai/concepts/state
- https://docs.typesafe.ai/concepts/system-one
- https://docs.typesafe.ai/concepts/how-to-build-with-system-one
- https://docs.typesafe.ai/cookbooks/hierarchical_classification
- https://docs.typesafe.ai/cookbooks/skill_suggestion
- https://docs.typesafe.ai/primitives/score
- https://docs.typesafe.ai/patterns/composite-scoring
- https://docs.typesafe.ai/cookbooks
- https://docs.typesafe.ai/patterns

Community examples can inform evaluation and use cases, but they do not override the TypeSafe documentation.

## 5. User stories

1. As a Registry Atlas user, I want to filter all registries for `application/app-shell` blocks so that source naming differences do not hide relevant blocks.
2. As a Registry Atlas user, I want to find `ai/chat` items across registries so that `AI Chat`, `Chat Starter`, and similar names can be discovered together.
3. As a Registry Atlas user, I want to filter `controls/button` plus `kind=component` so that I can compare base buttons across registries.
4. As a Registry Atlas user, I want a broad category such as `application` to include all descendant categories so that I can browse a family without selecting every leaf.
5. As a Registry Atlas user, I want source-specific labels preserved on item and registry views so that I can see how the original registry organized the item.
6. As a Registry Atlas user, I do not want source labels from one registry treated as a universal taxonomy for all registries.
7. As a Registry Atlas user, I want flat registries to participate in canonical filtering even when they expose no source categories.
8. As a Registry Atlas user, I want access filters only when explicit source access information exists so that registries without a commercial distinction do not display meaningless `unknown` values.
9. As a Registry Atlas user, I want canonical filters encoded in the browse URL so that a query can be shared and restored.
10. As a Registry Atlas maintainer, I want taxonomy versions recorded with every classification so that taxonomy changes can invalidate stale results.
11. As a Registry Atlas maintainer, I want deterministic exact-alias matches to bypass System One so that obvious cases remain cheap and inspectable.
12. As a Registry Atlas maintainer, I want ambiguous classifications to expose the System One decision path and probability distributions so that errors can be analyzed.
13. As a Registry Atlas maintainer, I want an item to remain unclassified rather than be forced into a category that does not fit.
14. As a Registry Atlas maintainer, I want a reviewed gold fixture set so that taxonomy and model changes can be measured against stable expected labels.
15. As a Registry Atlas maintainer, I want classification to run from local catalog data without a live browser so that source-site outages do not prevent a complete classification pass.
16. As a Registry Atlas maintainer, I want browser observations to enrich classification state only when they are available and trustworthy.
17. As a Registry Atlas maintainer, I want source access labels such as `Free`, `Pro`, or `Premium` normalized only when explicitly observed.
18. As a Registry Atlas maintainer, I want old source-group survey artifacts kept separate from canonical classifications so that flawed source-group inference cannot silently become global taxonomy.

## 6. Domain model

### 6.1 Structural kind

`kind` answers: **What structural kind of catalog asset is this?**

The canonical kind set for v1 is:

```ts
type CatalogCanonicalKind =
  | "component"
  | "block"
  | "page"
  | "template"
  | "theme"
  | "icon"
  | "other";
```

`kind` is separate from semantic classification.

Examples:

- a Button can be `kind=component`, `canonical=controls/button`;
- an App Shell can be `kind=block`, `canonical=application/app-shell`;
- an AI Chat page can be `kind=template`, `canonical=ai/chat`.

Raw source type is preserved separately.

Deterministic raw-type mapping is preferred:

- `registry:block` -> `block`;
- `registry:component`, `registry:ui`, `registry:item` -> `component`;
- `registry:page` -> `page`;
- `registry:style`, `registry:theme` -> `theme`;
- `registry:icon` -> `icon`.

A source can provide explicit evidence that an item is a `template`; otherwise `page` MUST NOT be silently renamed to `template`.

### 6.2 Canonical taxonomy node

The taxonomy is Registry Atlas-owned, versioned data.

Each node has:

```ts
interface CatalogTaxonomyNode {
  id: string;                // stable path-like id, e.g. "application/app-shell"
  label: string;             // display label
  aliases: readonly string[];
  what: string;              // positive definition
  notFor: readonly string[]; // contrastive exclusions
  examples: readonly string[];
  children: readonly CatalogTaxonomyNode[];
}
```

Node IDs are stable product contracts.

Changing a label or alias does not require changing the ID.

Deleting, splitting, merging, or re-parenting a node requires a taxonomy version increment and classification regeneration.

### 6.3 Item canonical classification

```ts
interface CatalogCanonicalClassification {
  taxonomyVersion: string;
  primary: string | null;
  path: readonly string[];
  method: "deterministic-alias" | "system-one" | "unclassified";
  inputFingerprint: string;

  systemOne?: {
    model: string;
    beamWidth: number;
    decisions: readonly CatalogTaxonomyDecision[];
    finalPathScore: number;
    runnerUpPathScore?: number;
    separation?: number;
  };
}
```

`primary` is the most specific selected taxonomy node.

`path` contains every ancestor from the root family through `primary`.

A parent filter matches an item when that parent ID appears in `path`.

`primary = null` means the item is unclassified.

### 6.4 Source metadata

Source metadata is preserved independently:

```ts
interface CatalogSourceClassificationEvidence {
  categories?: readonly string[];
  verifiedGroups?: readonly string[];
  breadcrumbs?: readonly string[];
  pathHints?: readonly string[];
}
```

These values may help classification.

They never become canonical labels automatically unless a curated deterministic alias rule maps them unambiguously.

### 6.5 Optional access metadata

Access is not a required property.

```ts
interface CatalogAccess {
  normalized: "free" | "paid";
  sourceLabel: string;
  evidence: {
    sourceUrl?: string;
    observedAt?: string;
  };
}
```

Rules:

- omit `access` when a registry does not expose a commercial/access distinction;
- omit `access` when evidence is insufficient;
- never write global `unknown` simply because no access evidence exists;
- normalize only explicit source evidence such as `Free`, `Pro`, `Premium`, or equivalent reviewed labels;
- access classification is independent from canonical semantic classification.

## 7. Canonical taxonomy v1

The first taxonomy SHALL be a curated repository file, not model output.

The initial required families and high-value leaves are:

```text
foundation
  color
  typography
  spacing
  tokens
  iconography

controls
  button
  button-group
  input
  textarea
  select
  checkbox-radio
  switch
  slider
  date-time
  file-upload
  otp

navigation
  navbar
  sidebar
  tabs
  breadcrumb
  pagination
  command-menu

layout
  container
  grid
  stack
  divider
  aspect-ratio

application
  app-shell
  dashboard
  settings
  profile
  project-board
  kanban
  calendar
  search

ai
  chat
  agent
  composer
  generation
  tool-output
  web-search

auth
  sign-in
  sign-up
  account

marketing
  hero
  features
  pricing
  testimonials
  call-to-action
  header
  footer
  blog
  contact
  logo-cloud

data
  table
  data-grid
  chart
  stats
  timeline

feedback
  dialog
  popover
  tooltip
  notification
  loading-progress
  empty-state
  error-state

content-media
  card
  carousel
  gallery
  image
  video
  audio
```

This seed is deliberately smaller than the combined source vocabularies.

New nodes are added only through reviewed taxonomy changes.

The classifier cannot invent nodes to accommodate one source.

## 8. Classification evidence

Canonical classification SHALL be able to operate from local Registry Atlas data.

The baseline decision state is built from:

```ts
interface CatalogClassificationState {
  item: {
    name: string;
    title?: string;
    description?: string;
    kind: CatalogCanonicalKind;
  };

  sourceHints?: {
    categories?: readonly string[];
    verifiedGroups?: readonly string[];
    breadcrumbs?: readonly string[];
    pathHints?: readonly string[];
  };
}
```

Rules:

- omit empty fields;
- normalize whitespace;
- bound individual text fields;
- do not send raw HTML;
- do not send full page dumps;
- do not send unrelated site navigation;
- do not require a browser result;
- do not include commercial/access labels unless they are semantically relevant to a separate access question;
- browser observations can enrich `sourceHints`, but local title/name/description/kind are sufficient to run the canonical classifier.

## 9. Classification pipeline

```text
registry catalog item
        |
        v
deterministic kind normalization
        |
        v
build compact semantic evidence
        |
        +--> exact curated alias match? ---- yes ---> deterministic classification
        |
        no
        v
hierarchical System One classifier
        |
        v
canonical primary + taxonomy path
        |
        v
optional source access normalization
        |
        v
classification artifact
        |
        v
quality review / promotion
        |
        v
runtime catalog + query facets
```

### 9.1 Deterministic alias fast path

The taxonomy owns curated aliases.

Examples:

- `App Shell` -> `application/app-shell`;
- `AI Chat` -> `ai/chat`;
- `Hero Sections` -> `marketing/hero`;
- `Logo Cloud` -> `marketing/logo-cloud`.

An alias fast path may classify an item only when:

1. normalized evidence matches exactly one curated node alias;
2. no competing curated alias maps the same text to another node;
3. the match is based on an item title or trusted source category/group;
4. the input fingerprint records the evidence used.

Fuzzy string matching is not a deterministic classification.

### 9.2 Hierarchical System One classification

System One is used only when deterministic classification does not resolve the item.

Each taxonomy node is a bounded `Choice`.

At the root, options are top-level taxonomy families plus `UNCLASSIFIED`.

At a non-leaf node, options are:

- each direct child;
- `THIS_CATEGORY`, meaning the current category fits but none of its children is more specific.

A leaf terminates the path.

Choice criteria are generated from the taxonomy node records:

```text
what
not_for
examples
aliases
```

The item evidence remains in `state`.

Taxonomy definitions remain in `criteria`.

The model never receives permission to create or rename an option.

### 9.3 Beam search

Canonical classification v1 uses beam width `K = 2`.

Path scoring follows the TypeSafe hierarchical-classification pattern:

```text
path_score = exp(mean(log(edge_probabilities)))
```

At each level:

1. evaluate each retained frontier path;
2. expand child probabilities;
3. retain the two highest-scoring paths;
4. continue until both retained paths terminate;
5. select the highest final path score.

Record:

- every Choice distribution;
- retained paths;
- final path score;
- runner-up path score;
- separation ratio when a runner-up exists.

No probability threshold is used to accept or reject a classification in v1.

Thresholds may be introduced only after calibration against the reviewed gold set.

### 9.4 Unclassified result

The root Choice includes `UNCLASSIFIED`.

If it wins the best path, the item is stored as:

```text
primary = null
method = unclassified
```

The classifier MUST prefer an explicit unclassified result over inventing a new taxonomy node.

## 10. Source categories and the existing survey

The existing source-group survey becomes supplemental evidence infrastructure.

It is no longer the primary classification engine.

Rules:

- deterministic, verified source groups can populate `sourceHints.verifiedGroups`;
- unverified `category-link` discoveries MUST NOT be promoted into canonical taxonomy;
- source groups can be displayed on registry-specific detail pages;
- source groups do not define global browse facets;
- canonical classification does not wait for source-group discovery;
- a flat registry is fully classifiable;
- a source-site outage does not block canonical classification when local catalog metadata exists.

The existing 2026-10-05 survey artifacts remain evidence only.

Their `groups[]` output is not eligible for direct promotion into global canonical classification.

## 11. Access behavior

Access metadata is a separate optional pipeline.

Examples of registries that explicitly expose a commercial distinction can contribute:

```text
Free -> free
Pro -> paid
Premium -> paid
```

The mapping is source-evidence driven.

A registry with no commercial taxonomy contributes no `access` field.

UI behavior:

- a global Access facet appears only when the current result set contains explicit access metadata;
- a registry-specific Access facet appears only when that registry contains explicit access metadata;
- missing access metadata is not rendered as an `Unknown` bucket by default.

## 12. Persistence and provenance

The taxonomy is stored as versioned repository data.

Recommended ownership:

```text
data/catalog-taxonomy/
  v1.json
  gold.json
```

Classification artifacts are generated data, separate from source catalog data until approved.

Each classification record SHALL contain:

- registry namespace;
- item ID/name;
- normalized `kind`;
- taxonomy version;
- canonical result;
- method;
- input fingerprint;
- source evidence fingerprint;
- System One model identifier when applicable;
- decision trace when applicable;
- generated timestamp.

Promotion into runtime catalog data is deterministic.

A changed taxonomy version, changed semantic input, or changed classifier contract makes the prior classification stale.

## 13. Runtime catalog contract

The runtime catalog item gains separate canonical fields without destroying source fields:

```ts
interface RegistryCatalogItem {
  name: string;
  type: string; // raw source type, unchanged

  title?: string;
  description?: string;
  categories?: readonly string[]; // existing source/upstream data

  kind?: CatalogCanonicalKind;

  canonical?: {
    taxonomyVersion: string;
    primary: string | null;
    path: readonly string[];
  };

  sourceGroups?: readonly string[];

  access?: {
    normalized: "free" | "paid";
    sourceLabel: string;
  };
}
```

Source categories and canonical taxonomy are never merged into one array.

## 14. Query semantics

Canonical taxonomy becomes a first-class query facet.

Supported logical facets:

- registry;
- kind;
- canonical category;
- optional access;
- existing text search.

Semantics:

- OR within one multi-select facet;
- AND across different facets;
- selecting a parent canonical node matches all descendants;
- selecting a leaf matches that exact canonical path;
- unclassified items remain visible when no canonical filter is active;
- unclassified items do not match a canonical filter.

Examples:

```text
kind=block
canonical=application/app-shell
```

returns App Shell blocks across all registries.

```text
canonical=ai/chat
```

returns AI chat items regardless of whether the source calls them `AI Chat`, `Chat Starter`, or another equivalent name.

```text
kind=component
canonical=controls/button
```

returns button components across registries.

## 15. Search behavior

Existing text search remains available.

Canonical taxonomy adds controlled semantic discovery:

- taxonomy node labels are searchable;
- aliases are searchable;
- matching an alias resolves to the canonical node;
- canonical search results can combine with `kind`, `registry`, and `access`.

Semantic reranking of arbitrary natural-language queries is out of scope for v1.

It can later use the TypeSafe progressive-disclosure pattern: broad candidate ranking followed by a small shortlist evaluation.

## 16. UI behavior

The primary cross-registry filters become:

```text
Search
Registry
Kind
Canonical category
Access (only when present)
```

The canonical category control is hierarchical.

Examples:

```text
Application
  App Shell
  Dashboard
  Settings
  Profile
```

and:

```text
AI
  Chat
  Agent
  Composer
  Generation
```

Registry-specific source categories can be shown as metadata or a registry-local secondary control, but they do not replace the canonical category facet.

Active filters and URL state SHALL preserve canonical node IDs, not display labels.

## 17. Gold set and evaluation

Before canonical classifications are promoted into runtime data, maintainers SHALL create a reviewed gold set.

The gold set must include:

- multiple registries with source categories;
- flat registries;
- registries with different naming for the same concept;
- components, blocks, pages/templates, themes, and icons where applicable;
- high-priority examples for App Shell, AI Chat, Button, foundations, tables, dashboards, auth, marketing sections, and navigation;
- explicit `unclassified` examples.

Initial representative sources should include structurally different registries such as:

- 7Ovr;
- Efferd;
- Bencho;
- BoardUI;
- 8bitcn;
- Aceternity;
- additional registries already present in Registry Atlas.

Evaluation reports SHALL include:

- exact primary classification accuracy;
- top-level family accuracy;
- ancestor-path accuracy;
- unclassified precision/recall;
- confusion pairs;
- accuracy by `kind`;
- accuracy by source registry;
- greedy vs beam-width-2 comparison;
- probability/confidence distributions;
- separation ratio vs correctness.

No runtime confidence threshold is added until these measurements support one.

Promotion from shadow classifications to runtime data requires explicit review of the evaluation report.

## 18. Failure handling

### Local item lacks enough semantic content

Run the classifier with the available state.

`UNCLASSIFIED` is valid.

### Browser/source evidence unavailable

Continue using local catalog metadata.

Do not mark the canonical classification run failed merely because a website cannot be browsed.

### System One unavailable

Record classification failure for affected items.

Do not silently substitute a different model.

Do not promote incomplete generated classifications as complete.

### Taxonomy has no fitting node

Return `UNCLASSIFIED`.

Do not add a node automatically.

### Taxonomy version changes

Mark prior classifications stale and regenerate.

### Source access evidence unavailable

Omit `access`.

Canonical classification is unaffected.

## 19. Testing decisions

Tests should use the highest stable public seam practical for each behavior.

Required coverage:

### Taxonomy validation

- unique IDs;
- stable parent-child paths;
- unique aliases after normalization unless explicitly disambiguated;
- no cycles;
- all required fields present;
- version required.

### Kind normalization

- blocks remain blocks;
- pages remain pages;
- themes/styles normalize to theme;
- icons normalize to icon;
- unsupported raw types become `other`.

### Deterministic alias classification

- exact `App Shell` -> `application/app-shell`;
- exact `AI Chat` -> `ai/chat`;
- ambiguous alias does not classify deterministically;
- source groups cannot introduce new canonical IDs.

### Hierarchical classifier

- root Choice contains only taxonomy children plus `UNCLASSIFIED`;
- child Choice contains direct children plus `THIS_CATEGORY`;
- no model-generated label can enter output;
- beam width is exactly two;
- path score is length-normalized geometric mean;
- `UNCLASSIFIED` terminates correctly;
- `THIS_CATEGORY` terminates at the current parent;
- probabilities and decision paths are retained.

### Cross-registry behavior

Fixtures must prove that differently named items converge on the same canonical node.

Examples:

- 7Ovr App Shell and Efferd App Shell -> `application/app-shell`;
- BoardUI AI Chat/Chat Starter-like items -> `ai/chat` when semantically appropriate;
- source `Button` items -> `controls/button`;
- BoardUI Color -> `foundation/color`;
- BoardUI Typography -> `foundation/typography`.

### Query behavior

- `kind=block + canonical=application/app-shell`;
- `canonical=ai/chat`;
- parent category includes descendants;
- registry + kind + canonical;
- optional access combined with canonical;
- URL round-trip.

### Access behavior

- source explicit `Free` -> free;
- source explicit `Pro` -> paid;
- registry without access distinction -> no access field;
- missing item evidence -> no fabricated `unknown` runtime bucket.

### Regression against old survey failure modes

- site navigation such as Docs/Privacy/License is never a canonical category;
- item links such as Button, Diagram, or Tool Call do not become canonical taxonomy simply because they appear in navigation;
- zero browser observations do not prevent local canonical classification;
- source-group extraction errors cannot alter taxonomy definitions.

## 20. Migration from the source-group survey

The current survey branch contains useful infrastructure but its product role changes.

Keep or adapt:

- raw type normalization;
- catalog inventory loading;
- input fingerprinting;
- resumable generated artifacts;
- local System One endpoint adapter;
- deterministic verified source evidence;
- batch reporting.

Replace:

- source-group membership as the primary classification target;
- global `groups[]` as the main browse taxonomy;
- required `access: free | paid | unknown`;
- dependence on browser discovery for every item.

Do not promote the paused 2026-10-05 survey `groups[]` into runtime canonical categories.

Those outputs can be used to identify useful source hints and gold-set examples only after review.

## 21. Acceptance criteria

The feature is ready for runtime promotion when all of the following are true:

1. A versioned canonical taxonomy exists in repository data.
2. Taxonomy validation tests pass.
3. Every catalog item receives a deterministic normalized `kind`.
4. Every item can be classified or explicitly left unclassified without browser access.
5. Exact curated aliases bypass System One.
6. Ambiguous items use bounded hierarchical Choice over taxonomy-owned options only.
7. Beam search uses width two and records its full decision path.
8. No model output can create taxonomy labels.
9. Source categories/groups remain separate from canonical taxonomy.
10. Access is optional and appears only from explicit source evidence.
11. A reviewed gold set exists and an evaluation report has been produced.
12. The evaluation compares greedy and beam-width-2 behavior and reports confusion/error distributions.
13. Maintainers explicitly approve the evaluation before runtime promotion.
14. Runtime catalog items expose `kind` and canonical taxonomy fields.
15. Global query supports Registry + Kind + Canonical Category.
16. Parent canonical filters include descendants.
17. App Shell blocks can be found across differently named registries.
18. AI Chat items can be found across differently named registries.
19. Base Button components can be found across registries.
20. Foundation items such as Color and Typography can be grouped canonically.
21. Existing text search continues to work.
22. URL state preserves canonical filters.
23. Flat registries participate in canonical classification.
24. Browser/source failures do not collapse an entire registry to all-unresolved canonical output.
25. Full tests, source/test typechecks, build, product-contract checks, and data validation pass.

## 22. Out of scope for this specification

- automatic taxonomy generation;
- free-form model-generated tags;
- embeddings/vector database introduction;
- semantic reranking of arbitrary search text;
- secondary multi-label semantic tagging;
- automatic confidence threshold selection without labeled evaluation;
- registry-specific hardcoded classification branches;
- commercial/access inference from absence of `Free`;
- using source navigation as canonical taxonomy;
- deleting source categories already present in Registry Atlas.

## 23. Design consequence

The primary Registry Atlas classification architecture becomes:

```text
source catalog item
    |
    +--> raw/source metadata -----------------------+
    |                                               |
    v                                               |
deterministic kind                                  |
    |                                               |
    v                                               |
Registry Atlas canonical taxonomy                   |
    |                                               |
    +--> deterministic alias match                  |
    |                                               |
    +--> hierarchical System One Choice             |
    |                                               |
    v                                               |
canonical primary + ancestor path                   |
    |                                               |
    +<------ optional reviewed source hints --------+
    |
    +--> optional explicit access metadata
    |
    v
generated runtime catalog
    |
    v
cross-registry search / sort / group / filter
```

The taxonomy is the product contract.

Source organization is evidence.

System One is a bounded semantic classifier inside code-controlled traversal.

The browser is optional enrichment, not the foundation of the classifier.

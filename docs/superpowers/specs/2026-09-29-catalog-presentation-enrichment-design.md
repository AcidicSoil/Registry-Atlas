# Registry Atlas catalog presentation and evidence enrichment design

Date: 2026-09-29

Research basis:
`docs/research/2026-09-29-catalog-presentation-reuse-research.md`

## Status and approval model

This design is **reuse-first**.

After this written spec is reviewed and approved, the implementation plan may schedule only
the **approved adaptation scope** below. Items labeled **approval required** need a separate
explicit user decision before implementation even if the base spec is approved.

This prevents “make it more like 21st.dev” from silently becoming a third-party code
execution engine, a new parser stack, an unrelated icon corpus, or a bespoke ranking policy.

## Problem

Registry Atlas has the correct real-catalog foundation and canonical route structure, but
its browse experience still throws away useful upstream facts and visually flattens distinct
asset classes into one placeholder-heavy card.

Current symptoms:

- the compact index discards descriptions already present in upstream registry items;
- cards without explicit preview media spend most of their area on “Preview not published”;
- Templates, Themes, and icon-related assets share essentially the same presentation;
- Components has two search controls for one `searchTerm`;
- path-shaped aggregator item names are poor scan labels;
- theme/style records may already carry structured shadcn `cssVars`, but browse cards do
  not use them;
- borders and control outlines are too subtle for a robust non-text boundary.

The goal is to make browsing materially more informative and asset-specific **without
reintroducing inference** and without building new subsystems where an existing contract or
implementation already solves the problem.

## Product principles

1. **Source facts first.** Use explicit upstream fields before enrichment or inference.
2. **Identity stays exact.** Display formatting never changes the exact
   `namespace + item.name` identity used for routes, install commands, or provenance.
3. **No fake preview.** A visual preview requires explicit preview media or a separately
   approved sandbox execution path.
4. **One shared presentation system.** Asset variants may change specimen and metadata
   treatment, but Components/Templates/Themes/Icon-related assets do not fork into four
   unrelated card implementations.
5. **Absence is compact.** Missing preview media becomes a metadata specimen, not a large
   empty panel.
6. **One search intent.** Global catalog search owns text search; the browse rail owns
   facets.
7. **Progressive specialization.** A route specializes only as far as its evidence allows.

## Architecture

### 1. Enrich the existing compact catalog item contract

Extend `RegistryCatalogItem` with bounded native fields:

```ts
export interface RegistryCatalogItem {
  name: string;
  type: string;
  title?: string;
  description?: string;
  author?: string;
  categories?: readonly string[];
  fileCount?: number;
  themePreview?: RegistryThemePreview;
}

export interface RegistryThemePreview {
  light?: Readonly<Record<RegistryThemeSwatch, string>>;
  dark?: Readonly<Record<RegistryThemeSwatch, string>>;
}

export type RegistryThemeSwatch =
  | 'background'
  | 'foreground'
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'muted'
  | 'card';
```

Rules:

- `description` comes only from explicit upstream `item.description`.
- compact descriptions have a documented maximum length; the full description remains in
  the same-origin detail bundle.
- `author` comes only from explicit upstream `item.author`.
- `fileCount` is a count of explicit upstream files and implies nothing about quality.
- `themePreview` exists only for theme/style items with structured upstream shadcn
  `cssVars`.
- `themePreview` is a bounded allowlist of recognized swatch keys, not the whole CSS
  payload.
- arbitrary `meta` keys are not promoted into product semantics.
- timestamps remain unavailable unless a future source contract establishes a trustworthy
  explicit timestamp field.

The full same-origin detail bundle additionally preserves:
- author;
- structured `cssVars` when present;
- existing description/categories/dependency/file metadata.

It must continue to exclude source file contents.

### 2. Extend the existing query model, not the search stack

Keep `queryCatalogComponents` and its deterministic local filtering.

Search includes:
- exact item name;
- explicit title;
- explicit description;
- explicit author;
- type;
- namespace;
- categories.

Do not add Fuse.js, MiniSearch, semantic embeddings, or server-side search before measured
evidence shows the current deterministic search is the bottleneck.

### 3. Separate display label from exact identity

Use one deterministic display helper:

1. explicit `title` when present;
2. otherwise the final path segment for path-shaped item names;
3. otherwise `item.name` unchanged.

When the display label differs from the exact slug, keep the complete slug visible as
secondary provenance. The complete slug remains the only route/install identity.

Do not title-case, translate, summarize, or infer a human name.

### 4. Adapt the existing card into shared asset variants

Refactor the existing `renderCatalogComponentCard` into one shared card primitive with
presentation variants:

```ts
type CatalogCardVariant =
  | 'component'
  | 'template'
  | 'theme'
  | 'icon-related';
```

Common information:
- display label;
- namespace;
- exact slug when different from display label;
- type;
- up to two explicit categories;
- bounded description when available;
- explicit author when available.

Specimen precedence:

1. **Explicit trusted preview URL:** use the current safe external-image path.
2. **Theme/style with native `themePreview`:** render light/dark swatches using the
   established tweakcn-style pattern.
3. **No visual evidence:** render a compact metadata specimen using description/type/file
   facts. Do not reserve a large visual frame only to say “Preview not published.”

Preview-unavailable wording may remain as a small detail-page status, but it must not
dominate browse-card area.

### 5. Asset-specific browse treatment through shared primitives

#### Components

Use the shared card in `component` mode.

The rail keeps registry/type/category facets. The duplicate rail text-search field is
removed; the global header search remains canonical.

#### Templates

Use the shared card in `template` mode.

Emphasize:
- title/display label;
- description;
- categories;
- page/file-count metadata;
- explicit preview media if published.

Do not invent page screenshots or execute arbitrary page source.

#### Themes

Use the shared card in `theme` mode.

When native shadcn `cssVars` provide recognized swatches, render a bounded light/dark
swatch specimen adapted from the established tweakcn pattern. Otherwise render the metadata
specimen.

The Theme Editor remains unavailable unless separately approved token/editor work is
implemented.

#### Icon-related assets

Reframe the current route and copy to state exactly what the data contains: explicit icon
items and explicitly categorized icon-related registry assets.

Do not present the current icon-related component records as a universal icon-glyph catalog.

A real cross-registry glyph/family browser is **approval required** because research did
not identify a universal third-party registry glyph contract.

### 6. Search consolidation

The header search is the canonical text-search control.

Remove `data-catalog-search` from the browse rail and its duplicate event handling. The
rail contains facets only.

Requirements:
- desktop and mobile expose one text-search intent;
- existing path/query URL behavior remains shareable;
- search still moves Home into Components as today;
- facet state remains independent.

### 7. Accessibility token correction

Raise interactive/card boundary contrast through existing design tokens, not route-specific
border overrides.

Acceptance:
- relevant component boundaries intended to communicate shape target at least 3:1
  non-text contrast against adjacent backgrounds where WCAG 1.4.11 applies;
- focus-visible states remain distinct from static borders;
- text contrast does not regress.

The implementation plan must include a deterministic contrast calculation/test rather than
eyeballing alpha values.

### 8. Landing page

The landing page continues to use existing reviewed/evidence-backed query behavior.

No new source-diversity ranking algorithm is authorized in the base scope. Existing
deterministic sorts remain the source of truth.

A new balanced/ranked discovery policy is approval-gated below.

## Explicit approval gates

These items must not appear in product code or an implementation plan unless the user
separately approves them.

### A. Live arbitrary component/page previews

Existing candidate: CodeSandbox Sandpack.

Approval is required because it:
- executes third-party React/npm code;
- adds dependency resolution and iframe/bundler behavior;
- needs trust, network, resource, and failure policies;
- materially changes the runtime/security boundary.

Without approval, Registry Atlas uses explicit preview media or metadata specimens only.

### B. CSS-source fallback theme parsing

Existing candidate: tweakcn's Apache-2.0 CSS-variable parser.

Approval is required because it reads source text rather than structured registry metadata
and introduces a parser/normalization contract.

Without approval, theme swatches use native shadcn `cssVars` only.

### C. True cross-registry icon-glyph ingestion

Research found shadcn's own `icons/index.json`, but not a universal third-party registry
glyph index.

Approval is required because this would need registry-specific adapters, another source
contract, or an unrelated external icon corpus.

Without approval, the route is explicitly “icon-related assets.”

### D. New discovery/source-balancing ranking

No existing Registry Atlas primitive or registry standard was found that defines the desired
balanced ordering.

Approval is required because any round-robin/diversity/relevance algorithm becomes a new
visibility policy.

Without approval, existing deterministic sorts remain authoritative.

### E. Standalone renderers outside the shared card/view primitives

If implementation discovers that Templates, Themes, or Icon-related assets cannot be
expressed as variants/compositions of the existing shared views, stop and request approval
before creating a new standalone renderer system.

## Generated-data and verification lever

Extend the existing rerunnable product-contract approach rather than rely on hand review.

Add one small local coverage report/check that can answer:
- compact items with description;
- compact items with author;
- theme/style items with native structured theme swatches;
- items with explicit preview URLs through existing trusted enrichment;
- distribution by asset kind and registry;
- promoted values that exceed their bounded shape/size contract.

The check reads generated local artifacts only; it performs no network requests.

Extend the product contract so regressions fail when:
- compact description/author values violate bounds;
- `themePreview` contains non-allowlisted keys;
- browse search stops considering description/author;
- the duplicate rail search returns;
- the icon-related route claims a universal glyph catalog without a supporting source
  contract.

## Data flow

```text
upstream registry.json
        |
        v
sync-registry-catalog-evidence.mjs
        |
        +--> compact item index
        |      name / exact type / title
        |      bounded description / author
        |      categories / fileCount
        |      bounded native-cssVars themePreview
        |
        +--> same-origin detail bundles
               full description / author
               native structured cssVars
               dependencies / file paths
        |
        v
catalogQuery.ts
  exact filters + deterministic search/sort
        |
        v
shared asset card
  component | template | theme | icon-related
```

No new browser-time third-party data fetch is introduced.

## Failure and stale-data behavior

Keep the current sync behavior:

- transient upstream failures preserve prior generated namespace data;
- generated artifacts remain the runtime source;
- absent optional fields remain absent;
- items without description/author/cssVars remain valid;
- malformed optional enrichment is dropped or rejected without inventing replacement data.

Theme swatch extraction fails closed: unknown or malformed values produce the metadata
specimen, not a guessed color.

## Testing strategy

### Data contract

Extend registry catalog evidence tests for:
- compact description/author preservation;
- description bounds;
- fileCount derivation;
- allowed native theme swatches;
- no source file content in compact/detail outputs;
- absence preservation.

Extend schema/index tests for the new optional fields.

### Query

Extend catalog query tests for:
- description/author search;
- explicit title precedence;
- path-leaf display fallback while route slug stays exact;
- unchanged registry/type/category/review filtering.

### Views

Extend catalog view tests for:
- explicit preview URL precedence;
- theme swatches only from native structured `themePreview`;
- metadata specimen replacing the large no-preview placeholder;
- shared template/theme/icon-related variants;
- one rendered text-search control.

### Accessibility

Add a deterministic contrast assertion for changed boundary tokens.

### Managed browser

Use only the managed `registry-atlas` profile and exact instance.

Inspect at 1920×1080 and 390×844:
- landing;
- Components;
- Templates;
- Themes, including a native-cssVars specimen if the generated data has one;
- Icon-related assets;
- one registry;
- one exact detail page.

Verify:
- no horizontal overflow;
- one canonical text-search control;
- clear boundaries/focus;
- no fabricated preview media;
- stable exact routes;
- no browser exceptions or unexpected 5xx responses.

## Acceptance criteria

The base pass is complete when:

1. compact catalog records preserve bounded native description and author;
2. native theme/style cssVars can produce bounded swatch metadata without parsing source;
3. search uses description/author;
4. exact route/install identity is unchanged by display formatting;
5. no-preview browse cards no longer devote most of the card to an empty placeholder;
6. Templates and Themes communicate their asset class through shared variants;
7. the current Icons surface is honestly labeled as icon-related unless true glyph evidence
   exists;
8. duplicate rail search is removed;
9. relevant non-text contrast is measured rather than guessed;
10. the generated-data/product-contract lever covers the new metadata;
11. full repository verification and managed-browser desktop/mobile verification pass;
12. no approval-gated subsystem is introduced without separate approval.

## Non-goals for the base pass

- arbitrary React/npm execution;
- Sandpack/WebContainer integration;
- browser crawling for previews;
- screenshot synthesis;
- CSS source parsing;
- a theme editor;
- unrelated third-party icon catalogs;
- source-balanced/relevance ranking;
- inferred author/popularity/recency;
- another routing rewrite;
- re-enabling deployment.

## Expected implementation surface

Likely existing files after implementation-plan approval:

- `scripts/sync-registry-catalog-evidence.mjs`
- `src/registry-explorer/core/registry.schema.ts`
- `src/registry-explorer/core/catalogQuery.ts`
- `src/registry-explorer/ui/catalogComponentsView.ts`
- `src/registry-explorer/ui/catalogCollectionView.ts`
- `src/registry-explorer/ui/shell.ts`
- `public/styles/registry-explorer.css`
- focused tests under `tests/registry-explorer/`
- existing product-contract script plus one small local coverage-report/check lever

If implementation requires a materially broader file set or any new runtime/framework
dependency, stop and re-evaluate the approval boundary before proceeding.

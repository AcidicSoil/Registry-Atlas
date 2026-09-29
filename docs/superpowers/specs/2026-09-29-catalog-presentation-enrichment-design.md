# Registry Atlas catalog presentation and evidence enrichment design

Date: 2026-09-29

Research basis:
- `docs/research/2026-09-29-catalog-presentation-reuse-research.md`
- `docs/research/2026-09-29-21st-layout-exemplar-audit.md`

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
- borders and control outlines are too subtle for a robust non-text boundary;
- the current shell/layout still treats Home, collection routes, registry profiles, and item
  details too uniformly compared with the measured exemplar composition.

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
8. **Shared primitives do not mean identical layouts.** Data/card primitives should be
   reused, while Components, Templates, Themes, Libraries, item detail, and registry detail
   use route-specific composition supported by the exemplar.
9. **Measured layout parity is explicit.** The 1920×1080 and 390×844 exemplar measurements
   are acceptance contracts, not vague inspiration.
10. **Reuse the current shadcn authoring contract.** Treat the Tailwind v4
    `shadcn-ui/registry-template` and documented `shadcn/registry` / `shadcn/schema` APIs
    as the reference boundary for registry authoring/build integration.

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

The current shadcn v4 registry template previews items by importing source owned by the
registry authoring application. That makes it a useful future preview-host scaffold, but not
an arbitrary remote-preview contract for Registry Atlas.

### 4A. Reuse the official Open in v0 action

For exact item details with a public HTTPS raw registry-item URL, add an optional external
`Open in v0` action using the same pattern as the current shadcn v4 registry template.

Rules:

- use the exact public raw item JSON URL already represented by the detail model;
- URL-encode it as the v0 `url` parameter;
- open it in a new tab and label it as an external action;
- omit it when the raw route is unavailable, non-HTTPS, or otherwise not public;
- do not proxy the item through Registry Atlas solely for this action;
- do not label this action as an in-product preview or proof that every item executes.

This is adaptation of an existing official shadcn pattern and does not require a new runtime.

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

### 6A. Review semantics and rail information architecture

The existing user-facing `Reviewed` label is not a quality, security, or compatibility review. It only means an exact catalog item also has a Registry Atlas `itemSummaries` enrichment overlay. Presenting that as a primary browse destination, filter, or ranking signal overstates what the data proves.

For this pass:
- remove the `Reviewed` top-level browse destination and reviewed-first sort from user-facing navigation;
- do not use reviewed/enrichment presence as the landing-page definition of “featured”;
- preserve the overlay internally as optional factual metadata/provenance where it adds description, preview, docs, or exact display copy;
- remove the reviewed-only browse filter unless a future product requirement introduces a clearly named enrichment/provenance facet;
- group the desktop rail by purpose: asset destinations first, then route-specific facets, then bounded evidence-backed category collections;
- category/facet groups may nest or disclose, but they must not expose an unbounded hundreds-option control as the primary interaction;
- unavailable evidence routes such as Newest/Authors/Theme Editor must not occupy first-class persistent navigation when they cannot perform useful work.

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

### 9. Measured exemplar layout contract

The fresh live audit in
`docs/research/2026-09-29-21st-layout-exemplar-audit.md` is the layout authority for this
pass. Copy the composition hierarchy, not unsupported marketplace/account metrics.

Shared data/card primitives do **not** require identical route geometry.

#### 9.1 Root landing uses a distinct discovery shell

The root route must not render as the Components application shell with a hero attached.

At desktop it should use:
- no persistent 240px catalog rail;
- a slim top product navigation;
- a left-aligned hero/copy region rather than a centered dashboard card;
- multiple curated, evidence-backed discovery bands;
- compact category/collection links above relevant bands;
- a Libraries/Registries section later in the page;
- a footer that repeats supported primary destinations.

Discovery bands may reuse the same item-card primitive, but must use real Registry Atlas
lenses such as reviewed items and explicit category collections. Do not copy exemplar
"Popular", bookmark counts, or recency labels unless Registry Atlas has direct evidence.

Horizontal discovery bands should use native CSS horizontal overflow/snap behavior rather
than introducing a carousel dependency.

#### 9.2 Desktop collection shell

At a 1920×1080 reference viewport:
- persistent left rail target: approximately 240px;
- top utility/header target: approximately 40px;
- collection content begins around x=260, leaving ~20px inset after the rail;
- content uses the full remaining viewport width rather than a centered max-width page;
- rail and utility/header region remain visually persistent while collection content scrolls;
- route controls remain compact: roughly 28–32px tall with 6–8px corner radii;
- desktop rail owns navigation/facets; the utility header owns the single global search.

These are target proportions, not pixel-perfect hardcoding. Browser tests should allow small
token-driven tolerances while proving the hierarchy and approximate dimensions.

#### 9.3 Components composition

Components uses two complementary browse modes:

1. **sectioned discovery bands** near the top for evidence-backed lenses/collections;
2. **dense catalog grid** for full browsing.

Discovery-band contract:
- small section heading;
- optional right-aligned "View all" route link;
- horizontally scrollable preview row;
- no custom carousel runtime is required.

Dense-grid contract at wide desktop:
- 4 columns in the remaining collection canvas;
- border-connected cells with hairline boundaries rather than widely separated floating
  cards;
- effectively zero inter-cell gap at the grid layer;
- preview/specimen remains visually dominant;
- title/registry/provenance metadata remains attached to the cell.

The exemplar measured ~409.75px cells across a ~1640px content canvas at 1920px. Registry
Atlas should achieve the same four-column density at that viewport without hardcoding that
exact cell width.

#### 9.4 Templates composition

Templates uses the collection shell but a spacious specimen grid rather than the
border-connected Components grid.

Wide-desktop target:
- 4 columns;
- approximately 24px horizontal gap;
- approximately 32px vertical gap;
- approximately 392px card width in a ~1640px content canvas;
- large visual/metadata specimen first;
- title and factual source metadata immediately below.

Use an approximately 8:5 specimen aspect ratio where explicit preview/specimen content
exists. When no preview exists, the metadata specimen occupies that same visual role without
pretending to be a screenshot.

Do not copy exemplar price/access badges unless source data explicitly supplies equivalent
facts.

#### 9.5 Themes composition

Themes uses the same 4-column / 24px-by-32px grid rhythm as Templates, but its specimen is
theme-specific.

When native structured theme data exists:
- large theme-colored specimen surface;
- compact swatch row near the upper-left;
- theme name inside or directly adjacent to the specimen;
- factual source/author metadata below.

The theme route must not look like Components with a "theme" type badge.

If structured theme data is absent, use the shared metadata specimen. Do not parse arbitrary
CSS source in the base pass.

#### 9.6 Registries/Libraries directory composition

The Registries route adapts the exemplar Libraries information-density pattern.

Desktop target:
- persistent collection rail for search/facets/sort;
- 3-column metadata-card grid in the content canvas;
- relatively short cards that repeat quickly down the page;
- registry name/identity, description, explicit item count, and real catalog coverage facts
  prioritized over decorative preview chrome.

Do not copy exemplar views, popularity, bookmark counts, or update-age labels unless those
facts are explicitly available in Registry Atlas.

#### 9.7 Icon-related route

The fresh exemplar confirms that a true Icons product is a different interaction model:
border-connected glyph matrix, family/category rail, and floating style/size/stroke/copy
controls.

The base Registry Atlas pass must **not** imitate that matrix with its current icon-related
component records. Keep the current route honestly labeled/reframed as icon-related assets
and use shared evidence-backed cards.

If a true glyph source is approved later, the exemplar target is:
- desktop family/category rail;
- dense border-connected glyph matrix;
- mobile centered 4-column matrix with ~80px cells;
- floating icon controls above mobile bottom navigation.

That future glyph browser remains approval-gated.

#### 9.8 Item-detail shell

Exact component/template/theme detail routes leave the collection-rail layout and use a
centered dossier.

Wide-desktop target:
- primary dossier max-width approximately 800px;
- at 1920px, centered around the measured ~798px exemplar column;
- title/description/provenance first;
- compact action row directly below;
- one dominant preview/specimen region;
- detailed facts after the specimen;
- related/evidence-backed items later.

Component-detail exemplar measurements:
- outer specimen ~798px;
- inner preview ~782px;
- factual metadata uses a two-column desktop grid with roughly 40px column gap.

Registry Atlas actions remain its own real actions. The base pass additionally adds the
official-template-style `Open in v0` action when the exact public item URL qualifies.

When no live/explicit preview exists, the same dossier area uses the richer metadata
specimen; it must not fabricate a runtime.

#### 9.9 Theme-detail hierarchy

Theme details specialize the dossier only where data exists:

1. title/source;
2. action row;
3. Preview/specimen;
4. Colors;
5. Typography if explicit;
6. Tokens if explicit;
7. related themes/assets.

Absent token or typography evidence produces an unavailable/omitted section, not inferred
values.

#### 9.10 Registry-detail shell

A registry profile uses a distinct two-pane shell rather than the generic collection page.

Wide-desktop target:
- top utility bar remains compact;
- sticky registry summary column approximately 320px wide;
- summary begins near the left page gutter;
- wide inventory canvas fills the remaining space;
- inventory can use a dense multi-column card grid;
- registry identity, description, install/source actions, catalog coverage, and exact item
  count live in the sticky summary;
- long-form provenance/about/related factual sections appear below the inventory only when
  data exists.

This is an adaptation of the existing `registryCollectionView`/shell, not authorization to
build a second registry-profile application from scratch.

#### 9.11 Mobile collection shell

At 390×844, the desktop rail is replaced, not squeezed.

Mobile shell:
- compact top bar with menu trigger on the left and route identity centered;
- no unsupported sign-in/account affordance;
- collection content uses roughly 12–20px side gutters depending on route;
- fixed bottom navigation target height approximately 57px;
- bottom navigation uses only supported Registry Atlas destinations/actions.

Base bottom-nav mapping:
- Home → root landing;
- Search → focus/open the canonical global search and route results to Components;
- Registries → registry directory;
- Compare → compare route.

Components mobile:
- Filters pill approximately 32px high;
- horizontally scrollable quick category chips;
- one-column, border-connected component cells;
- roughly 12px outer gutters.

Templates/Themes mobile:
- one-column specimen list;
- roughly 20px outer gutters;
- preserve the desktop grid's visual rhythm with approximately 32px vertical spacing.

#### 9.12 Mobile facet sheet

Reuse the current mobile browse/facet disclosure state rather than adding a new modal
library. Restyle/adapt it into a bottom sheet.

Required behavior:
- modal-like bottom sheet with dimmed backdrop;
- rounded top corners and drag/handle affordance;
- facet groups use the same URL-backed state as desktop;
- only supported Registry Atlas dimensions appear;
- fixed sheet footer contains Reset and a primary Apply/Show results action.

Initial supported groups:
- Registry;
- Type;
- Category;
- Reviewed;
- Sort.

Do not copy exemplar Time, primitive-library, Tailwind-version, author, or other filters
unless Registry Atlas has explicit data and a reviewed product requirement.

If the existing disclosure cannot support this accessibly without a new interaction
subsystem, stop and request approval before introducing a dependency.

#### 9.13 Responsive invariants

Across these shells:
- no horizontal document overflow at 390px or 1920px;
- the mobile bottom nav never covers actionable content without reserved bottom padding;
- sticky/fixed desktop regions collapse cleanly on mobile;
- only one canonical text-search intent is exposed;
- focus order remains logical when rail controls move into the mobile facet sheet;
- route identity remains visible even when the desktop h1 becomes visually compact.

## Explicit approval gates

These items must not appear in product code or an implementation plan unless the user
separately approves them.

### A. Live arbitrary component/page previews

Existing reuse candidates:
- CodeSandbox Sandpack for browser-side sandbox execution;
- the current shadcn v4 `registry-template` as a build-time preview-host scaffold.

Do not build a custom preview runtime or preview-host application from scratch before
evaluating those existing implementations.

Approval is still required because either approach:
- executes third-party registry code;
- needs dependency/materialization rules;
- needs build/browser isolation, caching, timeouts, networking, and failure policies;
- materially changes the runtime/security/trust boundary.

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

### F. Arbitrary public GitHub source-registry expansion

Current shadcn supports public GitHub repositories as source registries using a root
`registry.json`, including composition through `include`. Registry Atlas therefore does
not need a custom registry-server protocol if this source class is added later.

This expansion is approval-gated because it changes the source universe beyond the official
shadcn directory and requires explicit decisions about:
- opt-in versus curated versus discoverable GitHub sources;
- exact identity/deduplication against official namespace registries;
- refresh and caching behavior;
- provenance labeling.

If approved, use documented shadcn source-registry semantics and the stable
`shadcn/registry` / `shadcn/schema` APIs instead of inventing a parallel source format.

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

### Views and layout contracts

Extend catalog/view tests for:
- explicit preview URL precedence;
- theme swatches only from native structured `themePreview`;
- metadata specimen replacing the large no-preview placeholder;
- shared template/theme/icon-related card primitives;
- one rendered text-search control;
- Home omitting the desktop collection rail;
- collection shell exposing separate rail, utility-header, and content-canvas regions;
- Components rendering discovery-band and dense-grid structures;
- Templates/Themes rendering route-specific specimen-grid classes from shared card data;
- Registries rendering the dense directory-card grid structure;
- item detail rendering a dossier/action/specimen/facts hierarchy;
- registry detail rendering summary-rail + inventory-canvas regions;
- mobile shell exposing bottom navigation and facet-sheet trigger while the desktop rail is
  absent.

Extend `visualContract.test.ts` (or the existing equivalent visual-contract test) with
token/geometry contracts rather than exact screenshot hashes:
- desktop rail token near 240px;
- compact utility-bar token near 40px;
- four-column wide collection grid breakpoint;
- Templates/Themes 24px column / 32px row gap tokens;
- registry-directory three-column breakpoint;
- item-detail max-width near 800px;
- registry-profile summary rail near 320px;
- mobile bottom-nav reserved height near 57px;
- icon-related base route must not claim/render the true-glyph matrix class without a glyph
  source contract.

### Accessibility

Add deterministic assertions for:
- changed boundary-token contrast;
- focus-visible contrast remaining distinct from static borders;
- mobile facet sheet dialog/disclosure naming and focus behavior;
- bottom navigation labels and current-route state.

### Managed browser

Use only the managed `registry-atlas` project profile and its exact instance for target-app
verification. Use the separate design/reference profile only for exemplar comparison.

At 1920×1080 verify:
- landing has no collection rail and uses the distinct discovery shell;
- Components rail is approximately 240px and content starts roughly 20px after it;
- Components reaches four-column dense-grid behavior without horizontal overflow;
- Templates/Themes reach four-column specimen grids with the intended gap rhythm;
- Registries reaches a three-column metadata grid;
- exact item detail uses a centered ~800px dossier;
- registry detail uses a sticky ~320px summary region plus wide inventory canvas;
- only one canonical text-search control is exposed;
- qualifying exact item details expose Open in v0;
- no fabricated preview media appears.

At 390×844 verify:
- desktop rail is absent;
- compact route header remains visible;
- bottom navigation is fixed and content reserves enough bottom space;
- Components exposes quick chips plus the facet-sheet trigger;
- facet sheet opens with dimmed backdrop, supported groups, Reset, and Apply/Show results;
- Components becomes one column;
- Templates/Themes become one-column specimen lists;
- no horizontal document overflow;
- focus returns logically when the facet sheet closes.

Across all checked routes:
- stable exact routes and history behavior;
- no browser exceptions;
- no unexpected 5xx responses;
- no unlabeled visible controls;
- no unsupported exemplar semantics such as fabricated bookmarks, popularity, pricing, or
  recency.

## Acceptance criteria

The base pass is complete when:

1. compact catalog records preserve bounded native description and author;
2. native theme/style cssVars can produce bounded swatch metadata without parsing source;
3. search uses description/author;
4. exact route/install identity is unchanged by display formatting;
5. no-preview browse cards no longer devote most of the card to an empty placeholder;
6. qualifying exact item details expose the official shadcn-v4-template-style Open in v0
   action without introducing a preview runtime;
7. the root landing uses the distinct discovery shell and does not retain the desktop
   collection rail;
8. desktop collection routes use the approximately 240px rail / 40px utility-header
   hierarchy and full remaining canvas;
9. Components provides evidence-backed discovery bands plus the dense four-column
   border-connected browse grid at the wide reference viewport;
10. Templates and Themes use the four-column specimen-grid rhythm and communicate their
    asset class through shared primitives rather than identical generic cards;
11. Registries uses the dense three-column directory rhythm with factual metadata;
12. exact item detail uses the centered ~800px dossier hierarchy;
13. registry detail uses the sticky ~320px summary region plus a wide inventory canvas;
14. the current Icons surface is honestly labeled as icon-related and does not imitate a
    true glyph matrix unless a glyph source is separately approved;
15. desktop exposes one canonical text-search intent and duplicate rail search is removed;
16. mobile replaces the desktop rail with the compact header, quick controls, supported
    bottom navigation, and accessible facet bottom sheet;
17. mobile collection layouts match their route-specific one-column or approved glyph-grid
    behavior without horizontal overflow;
18. relevant non-text contrast is measured rather than guessed;
19. the generated-data/product-contract and visual-contract levers cover the new metadata
    and layout invariants;
20. full repository verification and managed-browser desktop/mobile verification pass;
21. no approval-gated subsystem is introduced without separate approval.

## Non-goals for the base pass

- arbitrary React/npm execution;
- Sandpack/WebContainer integration;
- a custom preview-host application when the current shadcn v4 registry template has not
  first been evaluated;
- arbitrary public GitHub registry discovery/ingestion without separate approval;
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
- `src/registry-explorer/ui/catalogLandingView.ts`
- `src/registry-explorer/ui/catalogComponentsView.ts`
- `src/registry-explorer/ui/catalogCollectionView.ts`
- `src/registry-explorer/ui/registryDirectoryView.ts`
- `src/registry-explorer/ui/registryCollectionView.ts`
- `src/registry-explorer/ui/itemDetailView.ts`
- `src/registry-explorer/ui/shell.ts`
- `public/styles/registry-explorer.css`
- focused tests under `tests/registry-explorer/`, including the existing visual contract
- existing product-contract/browser-acceptance scripts plus one small local
  coverage-report/check lever

If implementation requires a materially broader file set or any new runtime/framework
dependency, stop and re-evaluate the approval boundary before proceeding.

# 21st.dev exemplar layout audit

Date: 2026-09-29

Purpose: re-inspect the current live 21st.dev exemplar specifically for layout/composition details that were underspecified in the Registry Atlas corrective spec.

This is a layout reference, not a data-model contract. Registry Atlas must preserve its own exact registry evidence and must not copy unsupported marketplace, popularity, bookmark, or account semantics.

## Evidence

Live routes inspected through the dedicated `design-ui-ux` managed browser profile:

- https://21st.dev/
- https://21st.dev/community/components
- https://21st.dev/community/templates
- https://21st.dev/community/themes
- https://21st.dev/community/icons
- https://21st.dev/community/libraries
- https://21st.dev/@arunachalam/components/scroll-expansion-hero
- https://21st.dev/@lyanchouss/templates/dali-ai-agency-agent-studio-site
- https://21st.dev/@serafimcloud/themes/vercel
- https://21st.dev/@manuarora700/library/aceternity-ui

Desktop viewport: 1920x1080.
Mobile viewport: 390x844.

Durable captures:
`/home/user/.local/share/registry-atlas/reference/21st-dev-2026-09-29-layout-pass/`

The mobile component-detail capture remained in a loading/skeleton state and is not used as a layout authority below.

## 1. The product has multiple shells, not one universal shell

### Marketing home shell

The homepage does **not** use the community collection sidebar.

Observed composition:

- slim marketing top navigation;
- large left-aligned hero over a full-width blue/black gradient field;
- headline and supporting copy occupy a bounded column rather than a centered dashboard card;
- category/navigation chips sit inline above preview bands;
- discovery is organized into multiple visual bands rather than one monolithic grid;
- large horizontal preview strips intentionally clip/continue past the viewport edge;
- a dense Libraries section appears later in the page;
- footer repeats the primary product destinations.

Implication for Registry Atlas: the root landing page should be visually distinct from the catalog application shell. It may reuse catalog cards/data, but it should not simply be the Components page with a hero inserted above it.

### Community collection shell

At 1920px, Components/Templates/Themes/Icons use a common application frame:

- left rail: approximately 240px wide;
- top utility bar: approximately 40px high;
- content pane begins after the rail;
- primary content begins around x=260, leaving roughly 20px content inset after the 240px rail;
- collection routes use the full remaining viewport width rather than a centered page max-width;
- the rail and top utility controls remain visually stationary while the content surface scrolls;
- route headings are frequently visually represented by the top bar/rail and an sr-only h1 rather than a large page hero;
- rail search/navigation controls are compact: 28–32px high, 6–8px corner radii, and small one-pixel-ish vertical spacing;
- the shell prioritizes asset density over decorative whitespace.

Registry Atlas does not need to duplicate 21st's exact overflow implementation, but desktop collection routes should preserve the same behavioral hierarchy: persistent navigation/filter region, persistent utility/header region, independently scrollable/dense content.

## 2. Components layout

Desktop source: `components-desktop.png`.

Observed:

- 240px persistent rail with:
  - Featured;
  - Newest;
  - Authors;
  - Libraries;
  - long category groups and counts;
- 40px utility bar with centered route identity and right-side search/actions;
- collection body is preview-first;
- top content is organized into named bands such as Newest, Popular, Shaders, each with a small section heading and a right-aligned "View all";
- those bands use horizontally dense preview rows/carousels;
- lower collection behavior uses a border-connected grid rather than isolated floating cards;
- measured lower grid at 1920px:
  - x ~= 260;
  - width ~= 1640;
  - 4 columns ~= 409.75px each;
  - effectively no inter-column gap;
  - hairline grid borders define cells;
- each item still carries author/title/action metadata even when the preview dominates the visible surface.

The important pattern is **sectioned discovery + dense grid**, not "one filter toolbar + one endless card grid."

## 3. Templates layout

Desktop source: `templates-desktop.png`.

Observed shell:

- same 240px rail / 40px top utility bar;
- rail owns:
  - template search;
  - All Templates;
  - Included in Plan;
  - Free;
  - Buy on 21st;
  - Verified;
  - categorized template types.

Observed grid at 1920px:

- starts around x=260;
- width ~= 1640;
- 4 columns;
- each card/link width ~= 392px;
- horizontal gap ~= 24px;
- row gap ~= 32px;
- top row starts around y=90;
- whole card/link height ~= 289px;
- large visual preview first;
- title and source/author/type metadata sit immediately below the preview;
- price/access badges overlay the upper-right of the preview.

Registry Atlas must not copy unsupported price/access semantics, but the **page/template visual hierarchy** is clear: large specimen first, compact metadata below, regular 4-column rhythm.

## 4. Themes layout

Desktop source: `themes-desktop.png`.

Observed shell:

- same 240px rail / 40px top utility bar;
- rail includes a prominent Create theme action, All themes, and style/tag counts.

Observed grid:

- x ~= 260;
- width ~= 1640;
- 4 columns of ~= 392px;
- gap ~= 24px columns / 32px rows;
- card/link height ~= 289px.

Theme specimen anatomy is purpose-built:

- large theme-colored panel;
- 4 small color swatches in the upper-left;
- theme name inside the specimen near the lower-left;
- repeated title + author/source metadata below the specimen.

This is not a generic component preview with a theme badge. Registry Atlas theme cards should communicate palette/theme identity visually whenever structured source data permits it.

## 5. Icons layout

Desktop source: `icons-desktop.png`.
Mobile source: `icons-mobile.png`.

The icon surface is a separate interaction model, not a card-grid variant.

Desktop:

- 240px rail with:
  - Browse all count;
  - Animated count;
  - icon families;
  - semantic categories;
- content is a border-connected glyph matrix;
- cells are compact, square, and visually uniform;
- a floating control bar remains near the bottom of the viewport for:
  - style;
  - size;
  - stroke;
  - copy target/framework.

Mobile measurement:

- content matrix width ~= 320px;
- centered around x ~= 35;
- exactly 4 columns;
- each cell ~= 80x80px;
- the control bar remains floating above the bottom navigation.

Implication: Registry Atlas should **not** pretend its current icon-related registry components are visually equivalent to this glyph browser. If/when a true glyph data source is approved, this matrix/control layout is the correct exemplar.

## 6. Libraries collection layout

Desktop source: `libraries-desktop.png`.

Observed rail:

- library search;
- Grid/List toggle;
- source split (On 21st / shadcn directory);
- sort controls;
- category counts.

Observed content:

- dense 3-column information-card grid;
- cards emphasize metadata rather than screenshots:
  - logo/avatar;
  - library name;
  - owner;
  - description;
  - component count;
  - views/update metadata where available;
- cards have a low visual height and repeat quickly down the page.

Registry Atlas should adapt the **information density and 3-column library directory rhythm**, but only with factual metadata it actually owns. Do not fabricate views, popularity, or recency.

## 7. Component detail layout

Desktop source: `component-detail-desktop.png`.

This route leaves the collection sidebar model and uses a centered article/detail column.

Measured:

- main content column ~= 798px wide;
- x ~= 561 on a 1920px viewport;
- h1 begins near x=565, y=64;
- action row appears directly below summary/author metadata;
- primary preview section:
  - outer width ~= 798px;
  - inner preview ~= 782px;
  - live iframe observed ~= 782x734px;
- preview controls sit inside/above the specimen rather than in a disconnected global toolbar;
- detail metadata below uses a two-column grid at desktop:
  - ~= 375px + 375px;
  - ~= 40px column gap;
- similar components appear later as a related-content section.

Observed actions include Copy prompt, Save, Remix, CLI, Report. Registry Atlas should map only actions it truthfully supports; the layout principle is a compact action row followed by one dominant preview/specimen.

## 8. Template detail layout

Desktop source: `template-detail-desktop.png`.

Uses the same centered ~798px article column as component detail.

Measured:

- h1 near x=565, y=64;
- large description before actions;
- actions immediately above the preview;
- preview outer width ~= 798px;
- live iframe ~= 782x488px;
- post-preview sections are narrow, text-oriented blocks (Tags, Install, Details).

The route feels like a single asset dossier, not a collection page.

## 9. Theme detail layout

Desktop source: `theme-detail-desktop.png`.

Also uses the centered ~798px detail column.

Observed sequence:

1. title/author;
2. primary actions;
3. Preview section;
4. Colors section;
5. Typography;
6. Tokens;
7. Similar themes.

The preview is a real themed UI specimen, followed by actual token/palette explanation. This is stronger than simply showing a swatch card enlarged.

Registry Atlas can reproduce the hierarchy only to the extent structured theme data exists. Missing token data must stay unavailable rather than inferred.

## 10. Library detail layout

Desktop source: `library-detail-desktop.png`.

This route has a third shell distinct from collection pages and asset detail pages.

Observed:

- global top bar remains ~40px;
- sticky summary column on the left:
  - x ~= 20;
  - width ~= 320px;
  - starts near y=58;
- wide content region:
  - x ~= 372;
  - width ~= 1496px;
- a small sticky subheader/utility strip sits above the content region;
- component inventory appears as a wide 4-column media grid;
- observed preview cells are roughly 333x250px;
- deep sections later cover About, related registry material, dependencies/utilities, recent additions, similar registries, and related libraries.

This is the closest exemplar for Registry Atlas's registry profile: **sticky registry summary + wide inventory canvas**, not a generic narrow page.

## 11. Mobile collection shell

Viewport: 390x844.

Across Components/Templates/Themes/Icons:

- desktop rail disappears;
- top bar becomes compact:
  - hamburger/open-sidebar control on the left;
  - route title centered;
  - Sign in on the right in the exemplar;
- collection routes use a fixed bottom navigation about 57px high;
- exemplar bottom nav contains Home, Search, Bookmarks, Profile.

Registry Atlas should adapt the pattern to its real route set rather than copy unsupported account/bookmark features. A suitable mapping can use existing routes/actions only.

### Components mobile

Source: `components-mobile.png`.

Measured:

- content side gutters ~= 12px;
- Filters pill ~= 88x32px;
- quick category chips sit in a horizontally scrollable row;
- grid width ~= 366px;
- one column;
- border-connected item treatment is retained.

### Components mobile filter sheet

Source: `components-mobile-filters-open.png`.

Observed:

- bottom sheet anchored to the lower viewport;
- rounded top corners and drag handle;
- backdrop dims content behind it;
- Category and Sort visible immediately;
- additional accordion sections:
  - Time;
  - Primitive library;
  - Tailwind version;
  - License;
  - Library;
  - Built with;
  - Author;
  - Tags;
- fixed sheet footer with Reset and primary Show results actions.

Registry Atlas should not copy unsupported filter dimensions, but mobile facets should use this **bottom-sheet disclosure pattern** rather than expanding the entire desktop rail inline.

### Templates/Themes mobile

Sources: `templates-mobile.png`, `themes-mobile.png`.

Measured:

- ~20px side gutters;
- one-column content width ~= 350px;
- same ~24px horizontal / 32px vertical grid rhythm collapses naturally to one column;
- preview/specimen remains dominant, metadata immediately follows.

### Icons mobile

Source: `icons-mobile.png`.

Measured:

- 4x80px glyph matrix inside a ~320px centered canvas;
- floating icon control bar remains visible above the bottom nav.

## 12. Layout contracts Registry Atlas should carry forward

These are the exemplar-derived contracts that were missing or too vague in the earlier spec:

1. Home uses a distinct marketing/discovery shell without the persistent collection rail.
2. Desktop collection surfaces use a persistent ~240px rail and ~40px utility bar.
3. Collection pages use the full remaining canvas rather than a centered narrow container.
4. Components uses sectioned discovery bands before/alongside dense grid browsing.
5. Templates and Themes use spacious 4-column specimen grids with ~24/32px gaps at 1920px.
6. Libraries use a dense 3-column metadata-card grid.
7. True Icons use a border-connected glyph matrix, not general asset cards.
8. Asset detail routes use a centered ~800px dossier layout with actions above one dominant specimen.
9. Registry/library detail uses a sticky ~320px summary rail plus a wide multi-column inventory canvas.
10. Mobile collection navigation is replaced, not merely squeezed:
    - compact top bar;
    - quick chips/pills;
    - filter bottom sheet;
    - fixed bottom navigation using only supported Registry Atlas destinations/actions.
11. Mobile collection grids become one-column specimen lists, except true icon glyphs which remain a compact 4-column matrix.
12. Persistent controls and route hierarchy matter more than exact class names or internal overflow implementation.

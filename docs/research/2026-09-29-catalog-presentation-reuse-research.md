# Registry Atlas catalog presentation reuse research

Date: 2026-09-29

## Question

Before changing Registry Atlas browse/presentation behavior, identify existing standards and
open-source implementations that can be adapted instead of building new catalog, preview,
theme, search, or asset-browser subsystems from scratch.

This note separates verified source facts from Registry Atlas recommendations.

## Executive conclusion

Most of the next pass does **not** require a new subsystem. Registry Atlas already fetches
shadcn-compatible registry records; its compact index currently discards useful fields that
upstream sources already publish.

The reuse-first path is:

1. preserve more of the native shadcn item contract;
2. follow the proven slim-view/cross-registry-index pattern used by registry.directory;
3. adapt the existing Registry Atlas card into presentation variants instead of creating
   separate card systems;
4. use native structured theme variables for swatches;
5. keep arbitrary third-party code execution out of the base pass.

Live universal previews, fallback CSS-source parsing, a true cross-registry icon-glyph
browser, and a new source-diversity ranking algorithm remain approval-gated.

## Verified primary-source findings

### 1. shadcn already defines the enrichment fields

The official shadcn item schema includes page, theme, style, item, base, and font types.
Its common item schema includes optional `title`, `author`, `description`,
dependencies, files, and structured `cssVars`; `cssVars` supports `theme`,
`light`, and `dark` maps.

Primary source:
- https://github.com/shadcn-ui/ui/blob/db2db460a26fa84fb65c8d903b213925fbdee9ed/packages/shadcn/src/registry/schema.ts#L80-L149

The official API forwards dynamic registry search parameters for query, types, limit, and
offset.

Primary source:
- https://github.com/shadcn-ui/ui/blob/db2db460a26fa84fb65c8d903b213925fbdee9ed/packages/shadcn/src/registry/api.ts#L49-L100

**Recommendation:** preserve native shadcn metadata before creating parallel enrichment
fields. Description, author, and structured theme variables are source facts when present.

### 2. registry.directory already implements the relevant indexing pattern

registry.directory is MIT licensed and solves a closely related cross-registry directory
problem.

Its item index flattens real registry items into a searchable shape containing `name`,
`type`, `description`, `categories`, and registry identity. It derives that index
from committed registry views rather than maintaining a second independent data source.

Primary sources:
- https://github.com/rbadillap/registry.directory/blob/5467cd6051ff8a845b3bb81e664438935d10980f/apps/web/lib/registry-items.ts#L9-L66
- https://github.com/rbadillap/registry.directory/blob/5467cd6051ff8a845b3bb81e664438935d10980f/apps/web/lib/catalog.ts#L15-L42
- https://github.com/rbadillap/registry.directory/blob/5467cd6051ff8a845b3bb81e664438935d10980f/apps/web/lib/catalog.ts#L96-L139
- https://github.com/rbadillap/registry.directory/blob/5467cd6051ff8a845b3bb81e664438935d10980f/LICENSE

Its local indexer writes slim views containing description, categories, dependencies,
cssVars, font metadata, and file paths while explicitly avoiding file contents.

Primary source:
- https://github.com/rbadillap/registry.directory/blob/5467cd6051ff8a845b3bb81e664438935d10980f/apps/web/scripts/README.md#L26-L62

It also ships an IDE/source viewer using normalized registry metadata and Shiki.

Primary source:
- https://github.com/rbadillap/registry.directory/blob/5467cd6051ff8a845b3bb81e664438935d10980f/apps/web/components/viewer/code-viewer.tsx#L1-L40

**Recommendation:** adapt this proven “generated slim view + local cross-registry search”
shape. Registry Atlas already has the same architectural seam.

### 3. 21st.dev treats preview media/demo code as explicit published assets

The current open-source 21st registry CLI documents a component + demo + optional
`preview.png` publishing convention. The preview is explicitly supplied.

Primary source:
- https://github.com/21st-dev/registry/blob/93d686812df081cca6532f07bcb145ad22cc5d72/README.md#L45-L105

An earlier open-source 21st.dev codebase documented demos with `preview.png` and optional
video, and noted Sandpack support for npm dependencies.

Primary source:
- https://github.com/ProfFeynman/21st-Dev/blob/main/README.md#L33-L104

**Recommendation:** Registry Atlas should render real preview media only when it is
explicitly published/trusted, unless the user separately approves a sandbox execution
system.

### 4. Existing theme products already implement structured swatch previews

tweakcn is Apache-2.0 licensed. Its theme cards render light/dark swatches from structured
theme values. It also has an allowlist-oriented parser for `:root` and `.dark` CSS
variables.

Primary sources:
- https://github.com/jnsahaj/tweakcn/blob/a3b47b37cba97dd637de517aab52c45ec0f83456/app/ai/components/community-theme-card.tsx#L12-L83
- https://github.com/jnsahaj/tweakcn/blob/a3b47b37cba97dd637de517aab52c45ec0f83456/utils/parse-css-input.ts#L1-L62
- https://github.com/jnsahaj/tweakcn/blob/a3b47b37cba97dd637de517aab52c45ec0f83456/LICENSE#L1-L18

**Recommendation:** adapt the swatch-preview pattern for native shadcn `cssVars`.
Parsing arbitrary CSS source as a fallback is a separate parser surface and remains
approval-gated.

### 5. Sandpack already solves live React execution

Sandpack provides a framework-agnostic client that coordinates with a bundler iframe plus
React components for browser sandboxes.

Primary source:
- https://github.com/codesandbox/sandpack/blob/7d60a4334980eef304d53b1c3df371ed6dbcf491/sandpack-client/README.md
- https://github.com/codesandbox/sandpack/blob/7d60a4334980eef304d53b1c3df371ed6dbcf491/README.md
- https://github.com/codesandbox/sandpack/blob/7d60a4334980eef304d53b1c3df371ed6dbcf491/LICENSE

**Recommendation:** do not invent a preview runtime. If live execution is desired later,
evaluate Sandpack as the starting point. Integration still changes Registry Atlas's
security/runtime boundary and therefore requires explicit approval.

### 6. No universal third-party icon-glyph contract was found

The shadcn CLI has an `iconsSchema` and fetches its own `icons/index.json`, but the
common third-party registry item schema does not define a universal glyph-family index.

Primary sources:
- https://github.com/shadcn-ui/ui/blob/db2db460a26fa84fb65c8d903b213925fbdee9ed/packages/shadcn/src/registry/api.ts
- https://github.com/shadcn-ui/ui/blob/db2db460a26fa84fb65c8d903b213925fbdee9ed/packages/shadcn/src/registry/schema.ts#L80-L101

**Recommendation:** do not import an unrelated Lucide/Iconify catalog just to fill the
Icons route. The current surface should describe exact registry-backed icon-related data.
A real glyph browser needs a separately approved ingestion contract.

### 7. The current shadcn v4 registry template is directly relevant

The correct current reference is `shadcn-ui/registry-template`, which explicitly uses
Tailwind v4. The separate `registry-template-v3` repository is legacy and is not used for
this design.

Primary sources:
- https://github.com/shadcn-ui/registry-template
- https://ui.shadcn.com/docs/registry
- https://ui.shadcn.com/docs/registry/getting-started

The v4 template establishes several reusable patterns:

1. A source `registry.json` is the authoring source of truth.
2. `shadcn build` generates installable item JSON under `public/r/[name].json`.
3. The author-facing preview page renders local registry source directly by importing it
   into the application.
4. Each preview can expose the official `Open in v0` action by passing the public
   registry-item JSON URL to v0.
5. Built items remain standard shadcn CLI-compatible registry items.

Pinned source examples:
- README:
  https://github.com/shadcn-ui/registry-template/blob/906f859db0125965cba71c51da1707c0a4c6d045/README.md
- registry definition:
  https://github.com/shadcn-ui/registry-template/blob/906f859db0125965cba71c51da1707c0a4c6d045/registry.json
- author preview page:
  https://github.com/shadcn-ui/registry-template/blob/906f859db0125965cba71c51da1707c0a4c6d045/app/page.tsx
- Open in v0 action:
  https://github.com/shadcn-ui/registry-template/blob/906f859db0125965cba71c51da1707c0a4c6d045/components/open-in-v0-button.tsx

The preview behavior is important: the template can render live previews because the
authoring application owns the source and imports it at build time. The registry JSON does
not define a universal remote preview runtime for arbitrary third-party items.

Therefore the template is useful as an existing **preview-host scaffold**, not as proof that
Registry Atlas can safely execute every remote item. If a live preview subsystem is approved
later, evaluate the current v4 registry template as the build-time host before creating a
custom preview app. Materializing remote items, resolving dependencies, isolating builds,
caching output, networking, and failure handling remain new subsystem work and require
explicit approval.

The immediate reuse opportunity does not require a runtime: exact item-detail pages with a
public HTTPS raw item URL can expose the same `Open in v0` external action.

The current shadcn docs also support public GitHub source registries with a root
`registry.json`, composition through `include`, and documented `shadcn/registry` /
`shadcn/schema` programmatic APIs.

Primary sources:
- https://ui.shadcn.com/docs/registry/github
- https://ui.shadcn.com/docs/registry/api-reference
- https://ui.shadcn.com/docs/registry/registry-json
- https://ui.shadcn.com/docs/registry/registry-item-json

**Recommendation:** use the current v4 template as the authoritative authoring/build/action
reference. Reuse its Open in v0 pattern in the base pass. Keep arbitrary GitHub
source-registry discovery and live preview execution approval-gated because both materially
change Registry Atlas's source/trust boundary.

## Current Registry Atlas gap

Inspection of the current branch confirms:

- `buildCompactCatalogItems` preserves only name, type, optional title, and categories.
- `buildRegistryItemDetailBundle` already preserves description, categories, dependency
  lists, and file path/type/target metadata.
- the compact index therefore discards descriptions already received from upstream;
- native author and structured cssVars are discarded;
- `catalogQuery.ts` only gets description from the small reviewed overlay set;
- search currently considers name/title/type/namespace/categories, not description/author;
- `renderCatalogComponentCard` renders a large generic “Preview not published” specimen
  whenever reviewed enrichment lacks a preview URL;
- Templates, Themes, and Icons all reuse that same card.

Inspected local files:
- `scripts/sync-registry-catalog-evidence.mjs`
- `src/registry-explorer/core/registry.schema.ts`
- `src/registry-explorer/core/catalogQuery.ts`
- `src/registry-explorer/ui/catalogComponentsView.ts`
- `src/registry-explorer/ui/catalogCollectionView.ts`

## Reuse decisions

### Safe adaptations after spec and implementation-plan approval

- Preserve bounded native description and author in the compact index.
- Preserve native structured cssVars in detail data and derive a small bounded theme swatch
  specimen for theme/style cards.
- Extend the existing local search to description/author; do not add a search library
  without measured need.
- Adapt the existing card into shared asset variants rather than create separate UI stacks.
- When preview media is absent, use real metadata instead of a large empty preview panel.
- Keep the global search as the single search intent; leave the rail for facets.
- Improve existing border/input tokens using measured contrast.
- Use explicit title where available and exact-path leaf display as a formatting fallback,
  while retaining the complete exact slug as provenance.
- Reuse the current shadcn v4 registry-template `Open in v0` pattern for exact public item
  URLs instead of inventing a preview runtime for that interaction.

### Approval required before implementation

- Live third-party component execution, whether via Sandpack/WebContainer or a generated
  preview host based on the current shadcn v4 registry template.
- CSS-source fallback parsing for registries without native structured cssVars.
- New icon-glyph ingestion adapters or an unrelated icon corpus.
- A new registry-balanced/relevance ranking algorithm.
- Any standalone asset renderer that cannot be expressed through existing shared primitives.
- Expansion from the official shadcn directory into arbitrary public GitHub source registries.

## Recommendation

Start with native-data preservation and shared-card adaptation. This recovers facts Registry
Atlas already receives, improves scanability without executing third-party code, and follows
both shadcn's native contract and registry.directory's proven slim-view pattern.

Do not add a sandbox runtime, arbitrary CSS parser, or icon-ingestion subsystem in the base
pass.

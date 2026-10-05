# Registry Atlas

A component-first explorer for the [shadcn/ui community registry](https://ui.shadcn.com/docs/directory) ecosystem.

Registry Atlas mirrors real upstream registry catalogs into a local, evidence-backed index so you can browse exact component identities, inspect registry libraries, open canonical item routes, compare coverage, and distinguish missing evidence from unavailable data without synthesized fallback components.

<p>
<img src="https://github.com/acidicsoil/registry-atlas/raw/HEAD/public/screenshots/ss-0.png" alt="Registry Atlas landing page showing the full-width catalog dashboard" />
</p>

<p>
<img src="https://github.com/acidicsoil/registry-atlas/raw/HEAD/public/screenshots/ss-1.png" alt="Registry Atlas component catalog with registry filtering and deterministic sorting" />
</p>

<p>
<img src="https://github.com/acidicsoil/registry-atlas/raw/HEAD/public/screenshots/ss-2.png" alt="Registry Atlas registry directory with catalog coverage and indexed item counts" />
</p>

## Features

- **Components**: Search real catalog items, select multiple registries and common categories as chips, sort by name or registry in either direction, and share filtered URLs.
- **Collections**: Explore explicit category collections, templates, themes, and registry-backed icon-related assets without inventing popularity, recency, author, or review rankings.
- **Registries**: Filter by asset type (components, templates, themes, or icon-related items), sort alphabetically or by item count, and open each registry's catalog. Sync status remains informational, not a primary filter.
- **Original registry pages on every item route**: Home, Components, filtered collections, Authors, registry inventories, template/theme/icon listings, item details, related items and Compare use exact identity-backed upstream URLs. Reviewed pages show **View original**; links seen only in the official sitemap show **View sitemap-listed page**, not a verification claim. Official homepages and installable item JSON remain distinct, and Atlas never constructs documentation links from guessed slugs.
- **Compare**: Compare exact catalog identities across registries rather than inferred component families.
- **Authors and unavailable routes**: Authors lists exact attribution names published in source item metadata, not inferred creator accounts. Featured and Newest remain retired because Atlas does not invent popularity or publication-time rankings. The theme editor explains why editing is not yet supported.
- **Responsive catalog UI**: Full-width desktop layout with a persistent navigation sidebar, compact content controls, and a mobile off-canvas drawer with no horizontal document overflow.

## Original-page pattern database

The source registry URL-pattern store is the versioned SQLite database at `data/shadcn/registry-patterns.sqlite`, using Node 24's built-in SQLite API. The former traversal-pattern JSON and intermediate pattern-link JSON have been removed after migration. The frontend still loads `public/data/component-page-links.json`, which is a **generated static projection**, not the source of truth.

Run `mise run source-pages` to regenerate the public link bundle from SQLite. To inspect unresolved registry sources without visiting upstream pages, use:

```bash
node scripts/verify-registry-patterns.mjs --db data/shadcn/registry-patterns.sqlite \\
  --report-only --report .instance/registry-pattern-unverified.json \\
  --repair-report .instance/registry-pattern-repair-queue.json
```

For repeatable, bounded verification and browser-assisted repair, see [registry-pattern verification](docs/superpowers/specs/2026-10-04-registry-pattern-verification.md). Verified route patterns can generate matching URLs but do **not** establish that every individual destination has been loaded.

## Getting Started

### Prerequisites

- mise

The project pins Node 24.21.0 and pnpm 11.24.0 in `mise.toml`.

### Installation

```bash
mise run install
```

### Running Locally

Start the Vite development server:

```bash
mise run dev
```

Visit `http://localhost:5173` in your browser.

### Verification

Validate generated registry data:

```bash
mise run validate:data
```

Run the test suite:

```bash
mise run test
```

Check the canonical product contract:

```bash
mise run check:product-contract
```

Type-check source and tests:

```bash
mise run typecheck
mise run typecheck:test
```

Run the full maintainer verification gate:

```bash
mise run verify
```

`mise run verify` runs source/test type-checking, the complete test suite, the product contract, data validation, and the production build. It does not refresh upstream registry data.

The managed browser acceptance matrix is exposed as:

```bash
mise run browser:acceptance
```

It exercises the canonical route family at desktop and 390px mobile widths and checks route identity, expected unavailable/not-found states, exact catalog items, horizontal overflow, basic accessible labeling, browser exceptions, and unexpected 5xx responses.

### Refreshing Registry Data

Registry Atlas mirrors the official shadcn directory and its reachable registry catalogs into generated local artifacts. Refresh them explicitly when you want to review upstream changes:

```bash
mise run import:catalog
mise run sync:registries
mise run validate:data
mise run verify
```

`mise run import:catalog` refreshes the curated Atlas item-summary enrichment sample in `data/shadcn/registry-items.json`.

`mise run sync:registries` refreshes:

- the official directory mirror;
- catalog coverage evidence;
- the compact real-item index in `public/data/registry-catalog-items.json`;
- safe same-origin detail bundles in `public/data/registry-item-details/`;
- the runtime registry mirror in `public/data/registries.json`.

The active runtime intentionally does **not** use the retired inferred component taxonomy. Asset classification is based on explicit catalog item types/categories, and missing signals remain unavailable rather than being guessed.

Review `data/shadcn/registry-catalog-import-report.json`, `data/shadcn/sync-report.json`, `data/shadcn/registry-catalog-evidence-report.json`, `public/data/registries.json`, `public/data/registry-catalog-items.json`, and the generated detail-bundle directory before accepting regenerated data. Registry Atlas surfaces third-party metadata and copyable commands, but it does not audit or endorse community registry code.

### Building for Production

`mise run build` type-checks source files and builds the Vite bundle. The generated `dist/` directory is ignored; regenerate it instead of editing or committing build output.

```bash
mise run build
mise run preview
```

## Architecture

Registry Atlas uses modular vanilla TypeScript with generated JSON artifacts and no heavy frontend framework.

The canonical browser surface is:

- `index.html` — static shell loaded by Vite and production builds.
- `public/styles/registry-explorer.css` — application layout and visual system.
- `src/registry-explorer/entry.ts` — bootstrap and runtime data loading.
- `src/registry-explorer/ui/shell.ts` — route/history/state coordination.

### Directory Structure

```txt
src/registry-explorer/
├── core/
│   ├── registry.schema.ts       # Runtime catalog/registry/install contracts
│   ├── catalogRoutes.ts         # Canonical route parser/serializer
│   ├── catalogQuery.ts          # Exact identity search/filter/sort/pagination
│   ├── catalogCollections.ts    # Evidence-backed asset kinds and collections
│   ├── catalogCompare.ts        # Exact catalog comparison
│   ├── registryCatalogIndex.ts  # Compact index parsing/lookups
│   ├── registryDirectory.ts     # Registry search/status/sort/pagination
│   └── registryItemDetail.ts    # Safe exact-item detail resolution
├── data/
│   ├── loadRegistries.ts
│   └── loadRegistryItemDetail.ts
├── ui/
│   ├── shell.ts
│   ├── catalogLandingView.ts
│   ├── catalogComponentsView.ts
│   ├── catalogCollectionView.ts
│   ├── registryDirectoryView.ts
│   ├── registryCollectionView.ts
│   ├── catalogCompareView.ts
│   └── itemDetailView.ts
└── entry.ts
```

### Core Concepts

- **Exact catalog identity**: every browse result maps to a real upstream `namespace + item name`.
- **Canonical routes**: landing, components, collections, registries, typed assets, exact details, and Compare are represented by one route model rather than catch-all fallback behavior.
- **Evidence-backed classification**: Components/Templates/Themes/Icons are derived only from explicit item type/category facts.
- **Same-origin detail bundles**: safe normalized item metadata is generated during sync so detail correctness does not depend on third-party browser CORS.
- **Explicit coverage state**: registries distinguish current, stale, empty, and unavailable catalogs.
- **No inferred inventory**: the retired component taxonomy/discovery/matrix stack is not part of the active runtime contract.

## Maintenance

### Maintaining Registry Data

The official shadcn directory is the source for registry membership. Use the generated mirror workflow instead of manually editing runtime artifacts:

1. Run `mise run import:catalog` to refresh curated Atlas item-summary enrichment.
2. Run `mise run sync:registries` to refresh directory/catalog evidence, compact items, detail bundles, and the runtime mirror.
3. Review the generated reports and artifacts.
4. Run `mise run validate:data`.
5. Run `mise run verify`.
6. Run the managed browser acceptance matrix before release/deployment changes.

For more details, see [docs/registry-explorer-data.md](https://github.com/acidicsoil/registry-atlas/blob/HEAD/docs/registry-explorer-data.md).

---

Built with [![Gemini CLI](https://img.shields.io/badge/Gemini%20CLI-1A73E8)](https://github.com/google-gemini/gemini-cli) & [claude-task-master](https://github.com/eyaltoledano/claude-task-master)

---

## License

MIT

# Registry Atlas

A component-first explorer for the [shadcn/ui community registry](https://ui.shadcn.com/docs/directory) ecosystem.

Registry Atlas mirrors real upstream registry catalogs into a local, evidence-backed index so you can browse exact component identities, inspect registry libraries, open canonical item routes, compare coverage, and distinguish missing evidence from unavailable data without synthesized fallback components.


## Features

- **Components**: Search real catalog items, select multiple registries and common categories as chips, sort by name or registry in either direction, and share filtered URLs.
- **Collections**: Explore explicit category collections, templates, themes, and registry-backed icon-related assets without inventing popularity, recency, author, or review rankings.
- **Registries**: Filter by asset type (components, templates, themes, or icon-related items), sort alphabetically or by item count, and open each registry's catalog. Sync status remains informational, not a primary filter.
- **Original registry pages on every item route**: Home, Components, filtered collections, Authors, registry inventories, template/theme/icon listings, item details, related items and Compare use exact identity-backed upstream URLs. Reviewed pages show **View original**; links seen only in the official sitemap show **View sitemap-listed page**, not a verification claim. Official homepages and installable item JSON remain distinct, and Atlas never constructs documentation links from guessed slugs.
- **Compare**: Compare exact catalog identities across registries rather than inferred component families.
- **Authors and unavailable routes**: Authors lists exact attribution names published in source item metadata, not inferred creator accounts. Featured and Newest remain retired because Atlas does not invent popularity or publication-time rankings. The theme editor explains why editing is not yet supported.
- **Responsive catalog UI**: Full-width desktop layout with a persistent navigation sidebar, compact content controls, and a mobile off-canvas drawer with no horizontal document overflow.

## PostgreSQL and original-page evidence

Registry Atlas stores authoritative catalog, registry, classification, item-detail, source-page,
and route verification records in PostgreSQL (Neon project `Registry Atlas`, schema `atlas`).
No SQLite database or Git LFS file is committed. PostgreSQL transactions protect updates.

GitHub Pages is a static website. During `pnpm dev` or `pnpm build`, the server-side
`pnpm prepare:runtime-data` task exports disposable compressed assets:
`public/data/registry-atlas.json.gz` (catalog and metadata) and
`public/data/registry-details.json.gz` (lazy-loaded item details).
Neither is authoritative, and database credentials never go to the browser.

For reviewed, source-backed links, run `mise run verify:component-pages` and
`mise run source-pages`. A generic HTTP 200 is not evidence of component identity.
See [data operations](docs/registry-explorer-data.md).

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

Visit `http://localhost:5173/Registry-Atlas/` in your browser.

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

Configure a writable PostgreSQL `DATABASE_URL` (or the ignored
`.instance/neon-database-url`) for local maintenance. CI builds use a
separate read-only role.

```bash
mise run import:catalog
mise run sync:registries
mise run validate:data
mise run verify
```

`sync:registries` updates the official directory, catalog evidence, classification
projection, registry snapshots, and exact item details in PostgreSQL.
`pnpm prepare:runtime-data` regenerates the two ignored browser assets from the
database. Route patterns, component URL checks, and classification run state
are also maintained in PostgreSQL.

### Building for Production

`mise run build` type-checks source files and builds the Vite bundle. The generated `dist/` directory is ignored; regenerate it instead of editing or committing build output.

```bash
mise run build
mise run preview
```

## Architecture

Registry Atlas uses modular vanilla TypeScript with PostgreSQL-backed static runtime data and no heavy frontend framework.

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
- **Same-origin detail data**: safe normalized item metadata is generated during sync and loaded lazily from the compressed runtime detail JSON asset, so detail correctness does not depend on third-party browser CORS.
- **Explicit coverage state**: registries distinguish current, stale, empty, and unavailable catalogs.
- **No inferred inventory**: the retired component taxonomy/discovery/matrix stack is not part of the active runtime contract.

## Maintenance

Use `pnpm migrate:postgres-schema` to apply the idempotent PostgreSQL route
constraints and sequences to a newly imported database. The initial SQLite import
utility is retained only to read legacy snapshots; it is not an active data writer.

Changes to crawled data are made in PostgreSQL, not edited into runtime files.
After imports or synchronization, run `pnpm verify` and managed browser acceptance
before deployment.

See [PostgreSQL data and maintenance](docs/registry-explorer-data.md).

---

Built with [![Gemini CLI](https://img.shields.io/badge/Gemini%20CLI-1A73E8)](https://github.com/google-gemini/gemini-cli) & [claude-task-master](https://github.com/eyaltoledano/claude-task-master)

---

## License

MIT

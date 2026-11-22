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

## Data architecture and original-page evidence

**Self-hosted PostgreSQL 18** is authoritative for registry directories, catalogs, item details, classifications, and source-page evidence. The `atlas` schema runs on a loopback-only Docker Compose service. Neither the database nor its credentials are committed or accessible from GitHub Actions.

GitHub Pages serves a **static export**, not a live database connection. `mise run build:prepare-runtime-data` publishes a matching catalog and detail pair in `public/data/generations/<sha256>/` and atomically updates `public/data/runtime-manifest.json`. The browser loads the generation selected by that manifest. These `.json.gz` assets are disposable database exports, not a second source of truth.

The public CI and Pages workflows restore the versioned, sanitized `tests/fixtures/ci-runtime.tar` fixture; they do not connect to PostgreSQL. Site updates are **manual**, not automatic after every push.

For reviewed, source-backed original-page links, run `mise run test:component-pages` and `mise run build:source-pages`. An HTTP 200 alone does not establish component identity. See [data operations](docs/registry-explorer-data.md).

## Getting Started

### Prerequisites

- mise

The project configures Node LTS and pnpm through `mise.toml`.

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
mise run build:validate-data
```

Run the test suite:

```bash
mise run test
```

Check the canonical product contract:

```bash
mise run test:contract
```

Type-check source and tests:

```bash
mise run typecheck
```

Run the full maintainer verification gate:

```bash
mise run verify
```

`mise run verify` refreshes the local static export from PostgreSQL, runs lint, test TypeScript checks, the unit suite, database and product contracts, runtime-data validation, and the production build. It does not fetch upstream registries. CI instead runs `mise run verify:local` with the pinned public fixture; database-backed checks run only on the trusted workstation.

The managed browser acceptance matrix is exposed as:

```bash
mise run test:browser
```

It exercises the canonical route family at desktop and 390px mobile widths and checks route identity, expected unavailable/not-found states, exact catalog items, horizontal overflow, basic accessible labeling, browser exceptions, and unexpected 5xx responses.

### Refreshing Registry Data

Start local PostgreSQL with `mise run db:up` and use the ignored `.instance/local-postgres-url` connection file (or a loopback-only `DATABASE_URL`). No managed database credentials are supported.

```bash
mise run db:backup             # Back up authoritative PostgreSQL before changes
mise run sync                  # Refresh official directory, catalogs, and icons
mise run db:check
mise run build:prepare-runtime-data
mise run build:check-runtime-data
```

`mise run sync` first refreshes registry catalogs and then discovers registry icons. It preserves earlier catalog evidence when an **existing** registry is temporarily unavailable, but removes evidence for registries no longer in the official directory. The catalog sync follows published item URL templates (including supported style variants); it does not invent alternative catalog paths. Missing or invalid upstream indexes remain reported as failures.

Icon discovery prefers explicit website links and linked web manifests, then checks the same-origin `/favicon.ico` path for a valid ICO file. An HTML fallback with HTTP 200 does not count as an icon. Registries publishing no verifiable asset remain marked missing.

For approved, reviewed imports, use `mise run sync:import --source /path/to/catalog.json`. Route patterns, component URLs, and classification runs are also kept in PostgreSQL. See [data operations](docs/registry-explorer-data.md) for reconciliation, error handling, and backup details.

### Building for Production

`mise run build` type-checks source files and builds the Vite bundle. The generated `dist/` directory is ignored; regenerate it instead of editing or committing build output.

```bash
mise run build
mise run dev:preview
```

### Publishing GitHub Pages

The site is available at [Registry Atlas on GitHub Pages](https://acidicsoil.github.io/Registry-Atlas/). Production deployments run **only** when the [Deploy GitHub Pages](https://github.com/AcidicSoil/Registry-Atlas/actions/workflows/deploy-pages.yml) workflow is manually dispatched on `main`.

To publish a new database snapshot from the trusted workstation:

```bash
mise run build:prepare-runtime-data # Export the current PostgreSQL snapshot
mise run ci:fixture                 # Refresh the reviewed public CI fixture
# Review and commit tests/fixtures/ci-runtime.tar, then push main.
gh workflow run deploy-pages.yml --ref main
```

The workflow restores that fixture, runs offline verification, builds `dist/`, and publishes it with GitHub Pages. Pushing to `main` runs CI but does not deploy. A fresh runtime export alone does not change the live website. See [release workflow](docs/architecture/pages-release.md).

## Architecture

Registry Atlas uses modular vanilla TypeScript with PostgreSQL-backed static runtime data and no heavy frontend framework.

The canonical browser surface is:

- `index.html` — static shell loaded by Vite and production builds.
- `public/styles/registry-explorer.css` — application layout and visual system.
- `src/registry-explorer/entry.ts` — bootstrap and runtime data loading.
- `src/registry-explorer/ui/shell.ts` — composition root for state transitions, navigation, and delegated DOM events.

### Shell Ownership

The shell composes focused controllers through typed dependencies. **`shell.ts` is the sole application-state owner**; extracted modules do not maintain competing route state or separate application entrypoints.

- `shellState.ts` — shared state and focus identity contracts.
- `shellInteractions.ts` — delegated catalog controls and selection.
- `shellBrowseFeed.ts` — pagination, observers, and scroll restoration.
- `shellSetup.ts` — queue, replacement, draft persistence, and clipboard.
- `shellSidebar.ts` — sidebar counts, facets, and taxonomy expansion.
- `shellCatalogViews.ts` — catalog landing, collections, profiles, and icons.
- `shellDetailViews.ts` — item-detail loading and comparisons.
- `shellRenderer.ts` — route dispatch, headers, tabs, and render fallback.

The public bootstrap remains `initRegistryExplorer` from `ui/shell.ts`. It returns an idempotent `dispose()` controller for UI teardown: attached listeners and scroll observers are released, and pending detail responses cannot render after disposal. Shell tests dispose instances before restoring mocked browser globals. CSS and rendered markup are unchanged. Run `pnpm exec vitest run tests/registry-explorer/shell.test.ts tests/registry-explorer/shellDomContract.test.ts tests/registry-explorer/shellInteractions.test.ts tests/registry-explorer/shellSetup.test.ts` for focused coverage; use the existing browser tests for route, sidebar, setup, and infinite-scroll behavior.

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

Use `mise run db:migrate` to apply the idempotent PostgreSQL route
constraints and sequences to a newly imported database. The initial SQLite import
utility is retained only to read legacy snapshots; it is not an active data writer.

Changes to crawled data are made in PostgreSQL, not edited into runtime files.
After imports or synchronization, run `mise run verify` and the managed browser acceptance checks before publishing a new fixture and dispatching a release.

See [PostgreSQL data and maintenance](docs/registry-explorer-data.md).

## License

MIT

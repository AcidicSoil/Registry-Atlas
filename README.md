# Registry Atlas

A modular, interactive explorer for the [shadcn/ui community registry](https://ui.shadcn.com/docs/directory) ecosystem.

Registry Atlas provides a structured way to discover and compare community registries based on their primary focus (e.g., AI Chat, Admin Dashboards) or specific component availability (e.g., specific table implementations, authentication forms).

<p>
<img src="https://github.com/acidicsoil/registry-atlas/raw/HEAD/public/screenshots/ss-0.png" alt="" />
</p>

<p>
<img src="https://github.com/acidicsoil/registry-atlas/raw/HEAD/public/screenshots/ss-1.png" alt="" />
</p>

<p>
<img src="https://github.com/acidicsoil/registry-atlas/raw/HEAD/public/screenshots/ss-2.png" alt="" />
</p>

## Features

- **Focus View**: Browse registries clustered by their dominant use-case (e.g., "AI & Chatbot", "Marketing Sections").
- **Component View**: Find registries that provide specific components (e.g., "Who ships a `data-grid`?").
- **Matrix View**: A dense table view comparing coverage of key component families across all registries.
- **Real-time Filtering**: Instantly filter by name, description, tags, or framework across all views.

## Getting Started

### Prerequisites

- Node.js (Latest LTS recommended)
- pnpm (or npm/yarn)

### Installation

```bash
pnpm install
```

### Running Locally

Start the Vite development server:

```bash
pnpm dev
```

Visit `http://localhost:5173` in your browser.

### Verification

Validate the generated registry mirror data:

```bash
pnpm validate:data
```

Run the test suite:

```bash
pnpm test
```

Type-check the test files and source files together:

```bash
pnpm typecheck:test
```

Run the full maintainer verification gate:

```bash
pnpm verify
```

`pnpm verify` runs source type-checking, test type-checking, tests, data validation, and the production build. It does not refresh generated registry data.

For release browser checks, use `.planning/phases/04-install-actions-release-hardening/04-BROWSER-A11Y-SMOKE.md`. It covers install-command copy behavior, disabled states, queue flow, URL restoration, safe links, and the keyboard/focus baseline against the `/Registry-Atlas/` base path.

### Refreshing Registry Data

Registry Atlas mirrors the official shadcn directory into generated local artifacts. Refresh them explicitly when you want to review upstream changes:

```bash
pnpm import:catalog
pnpm sync:registries
pnpm validate:data
pnpm verify
```

`pnpm import:catalog` imports the reviewed v1.1 sample catalog into `data/shadcn/registry-items.json` and writes `data/shadcn/registry-catalog-import-report.json`. `pnpm sync:registries` then merges that Atlas item-summary enrichment with the official shadcn directory mirror.

Review `data/shadcn/registry-catalog-import-report.json`, `data/shadcn/sync-report.json`, and `public/data/registries.json` before accepting regenerated data. Registry Atlas surfaces third-party metadata and copyable commands, but it does not audit or endorse community registry code.

### Building for Production

`pnpm build` remains the production output check. It type-checks source files and builds the Vite bundle.
The generated `dist/` directory is ignored by `.gitignore`; regenerate it with `pnpm build` instead of editing or committing generated output.

```bash
pnpm build
pnpm preview
```

## Architecture

This project uses a modular vanilla TypeScript architecture, avoiding heavy frontend frameworks to maintain a lightweight footprint while ensuring type safety and testability.

The canonical browser app surface is:

- `index.html` - Static shell loaded by Vite and production builds.
- `public/styles/registry-explorer.css` - App stylesheet copied as a public asset.
- `src/registry-explorer/entry.ts` - TypeScript bootstrap that mounts the Registry Atlas explorer.

### Directory Structure

```txt
src/registry-explorer/
├── core/               # Pure domain logic and types
│   ├── registry.schema.ts  # Type definitions & vocabularies
│   ├── grouping.ts         # Pure functions for filtering/grouping
│   ├── labels.ts           # UI label mappers
│   └── matrixColumns.ts    # Configuration for Matrix view
├── data/
│   ├── loadRegistries.ts   # Runtime loader for generated registry mirror JSON
│   └── registries.data.ts  # Legacy enrichment seed used by sync tooling
├── ui/                 # DOM rendering modules
│   ├── shell.ts            # State management & event orchestration
│   ├── focusView.ts        # Renderer for Focus view
│   ├── componentView.ts    # Renderer for Component view
│   └── matrixView.ts       # Renderer for Matrix view
└── entry.ts            # Application bootstrap
```

### Core Concepts

- **Registry**: The fundamental unit of data, defined in `src/registry-explorer/core/registry.schema.ts`.
- **Pure Logic**: All filtering, grouping, and metrics calculations are pure functions located in `src/registry-explorer/core/grouping.ts`. This ensures logic is easily testable independent of the UI.
- **State Management**: The `shell.ts` module implements a simple state store pattern to manage the current view, search term, and active selections, coordinating updates across the isolated view modules.

## Maintenance

### Maintaining Registry Data

The official shadcn directory is the source for registry membership. Use the generated mirror workflow instead of manually editing the runtime catalog:

1.  Run `pnpm import:catalog` to refresh reviewed Atlas item-summary enrichment.
2.  Run `pnpm sync:registries` to merge that enrichment with the official shadcn directory mirror.
3.  Review `data/shadcn/registry-catalog-import-report.json`, `data/shadcn/registries.raw.json`, `data/shadcn/sync-report.json`, and `public/data/registries.json`.
4.  Run `pnpm validate:data`.
5.  Run `pnpm verify`.

For more details, see [docs/registry-explorer-data.md](https://github.com/acidicsoil/registry-atlas/blob/HEAD/docs/registry-explorer-data.md).

---

Built with [![Gemini CLI](https://img.shields.io/badge/Gemini%20CLI-1A73E8)](https://github.com/google-gemini/gemini-cli) & [claude-task-master](https://github.com/eyaltoledano/claude-task-master)

---

## License

MIT

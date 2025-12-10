# Registry Atlas

A modular, interactive explorer for the shadcn/ui community registry ecosystem.

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

### Building for Production

```bash
pnpm build
pnpm preview
```

## Architecture

This project uses a modular vanilla TypeScript architecture, avoiding heavy frontend frameworks to maintain a lightweight footprint while ensuring type safety and testability.

### Directory Structure

```txt
src/registry-explorer/
├── core/               # Pure domain logic and types
│   ├── registry.schema.ts  # Type definitions & vocabularies
│   ├── grouping.ts         # Pure functions for filtering/grouping
│   ├── labels.ts           # UI label mappers
│   └── matrixColumns.ts    # Configuration for Matrix view
├── data/
│   └── registries.data.ts  # Static database of registries
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

### Adding a Registry

To add a new community registry to the explorer:

1.  Open `src/registry-explorer/data/registries.data.ts`.
2.  Add a new entry to the `registries` array matching the `Registry` interface.
3.  Use the controlled vocabularies for `primary_focus` and `component_tags` (intellisense will guide you).

For more details, see [docs/registry-explorer-data.md](docs/registry-explorer-data.md).

## License

MIT

<!-- GSD:project-start source:PROJECT.md -->
## Project

**Registry Atlas**

Registry Atlas is a fast discovery layer for the shadcn/ui registry ecosystem. It should mirror the official shadcn registry directory and make it quick and painless to choose UI components without manually opening every community registry site and sifting through each one.

The current app already provides a static explorer with focus, component, matrix, and search views. The next milestone turns that explorer into a reliable shadcn directory companion: synced from the official source, searchable by component need, and able to give users practical install actions.

**Core Value:** Users can quickly find the right shadcn-compatible registry or component and act on it without manually browsing dozens of registry sites.

### Constraints

- **Source alignment**: The official shadcn directory is the source to mirror — the app should not drift into an unrelated curated catalog.
- **Data freshness**: The current directory count is 198 registries — sync and validation should make mismatches visible.
- **Static app bias**: Preserve the lightweight Vite/vanilla TypeScript SPA unless a concrete sync or data-delivery requirement justifies adding infrastructure.
- **Security**: Community registries are third-party code — links, commands, and metadata should avoid implying that Registry Atlas has audited or endorsed them.
- **Install behavior**: Use copyable shadcn CLI commands and source links — do not execute installs from the browser.
- **Maintainability**: Data imports and generated output need tests or validation so a future refresh does not silently break search, grouping, URLs, or install commands.
- **Compatibility**: Keep the app deployable as a static GitHub Pages site.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- TypeScript 5.9.3 - Application source, domain types, DOM rendering, and tests in `src/registry-explorer/` and `tests/registry-explorer/`.
- HTML - Static shell and Vite entry mounting in `index.html`.
- CSS - Global explorer styling in `public/styles/registry-explorer.css` and starter Vite styling in `src/style.css`.
- YAML - GitHub Pages deployment workflow in `.github/workflows/deploy.yml`.
- Markdown - Product, maintenance, and data documentation in `README.md` and `docs/`.
## Runtime
- Browser DOM runtime - The app is a client-side single page application bootstrapped by `index.html` and `src/registry-explorer/entry.ts`.
- Node.js 20 - CI build runtime configured in `.github/workflows/deploy.yml`.
- Node.js latest LTS - Development prerequisite documented in `README.md`.
- pnpm 9 - CI uses `pnpm/action-setup@v2` with `version: 9` in `.github/workflows/deploy.yml`.
- pnpm 10.23.0 - Current local tool version detected during analysis.
- Lockfile: present at `pnpm-lock.yaml` with lockfile version `9.0`.
## Frameworks
- Vite 7.2.7 - Development server and production bundler configured by `vite.config.ts`; declared as `^7.2.4` in `package.json` and resolved in `pnpm-lock.yaml`.
- Vanilla TypeScript DOM modules - No React, Vue, Svelte, Next.js, or other frontend framework dependency is declared in `package.json`.
- Static SPA architecture - `index.html` loads `/src/registry-explorer/entry.ts`, which initializes the explorer with local registry data from `src/registry-explorer/data/registries.data.ts`.
- Vitest - Test files import `describe`, `it`, and `expect` from `vitest` in `tests/registry-explorer/grouping.test.ts` and `tests/registry-explorer/matrixColumns.test.ts`.
- Test runner dependency/config: Not detected in `package.json`, `pnpm-lock.yaml`, or `vite.config.ts`; no `test` script is defined in `package.json`.
- TypeScript compiler 5.9.3 - `pnpm build` runs `tsc && vite build` from `package.json`.
- Vite dev server - `pnpm dev` runs `vite` from `package.json`; README points local users to `http://localhost:5173`.
- Vite preview server - `pnpm preview` runs `vite preview` from `package.json`.
- codefetch 2.2.0 - Developer utility exposed by `pnpm code` in `package.json` to generate `src.md` from `src/`.
## Key Dependencies
- `vite` 7.2.7 - Bundles and serves the static SPA; configured with `base: '/Registry-Atlas/'` in `vite.config.ts` for repository-scoped GitHub Pages hosting.
- `typescript` 5.9.3 - Enforces strict type checks and no-emission builds through `tsconfig.json`.
- `@vitejs` internal ecosystem through Vite dependencies - Build pipeline only; no direct application imports.
- `codefetch` 2.2.0 - Source export utility for development workflows; not used by runtime code.
- GitHub Actions - CI/CD workflow in `.github/workflows/deploy.yml` installs pnpm, builds the project, uploads `dist`, and deploys to GitHub Pages.
## Configuration
- Runtime configuration is static and code-driven; no runtime environment variables are referenced in `src/`, `index.html`, `vite.config.ts`, or `package.json`.
- `.env.example` file present - contains environment configuration examples; contents intentionally not read during this audit.
- Vite client env access (`import.meta.env` / `VITE_`) is not detected in application code.
- `package.json` defines `dev`, `build`, `preview`, and `code` scripts.
- `tsconfig.json` targets `ES2022`, uses `moduleResolution: "bundler"`, includes DOM libs, enables strict mode, and includes only `src`.
- `vite.config.ts` sets `base: '/Registry-Atlas/'` for GitHub Pages repository deployment.
- `.github/workflows/deploy.yml` builds on `ubuntu-latest` using Node 20 and pnpm 9, then deploys `./dist` to GitHub Pages.
- `index.html` links `public/styles/registry-explorer.css` through `/styles/registry-explorer.css` and loads `/src/registry-explorer/entry.ts`.
## Platform Requirements
- Install dependencies with `pnpm install` as documented in `README.md`.
- Run locally with `pnpm dev`; the Vite dev server serves the app at `http://localhost:5173`.
- Build with `pnpm build`, which type-checks `src/` before Vite emits `dist`.
- Keep new browser code compatible with the DOM APIs used in `src/registry-explorer/entry.ts` and `src/registry-explorer/ui/`.
- Static hosting target: GitHub Pages via `.github/workflows/deploy.yml`.
- Build artifact: `dist` uploaded through `actions/upload-pages-artifact@v3`.
- Production base path: `/Registry-Atlas/` from `vite.config.ts`.
- No server runtime, serverless functions, database, queue, or background worker is part of the deployed application.
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Naming Patterns
- Use domain-oriented camelCase TypeScript module names for app code: `src/registry-explorer/core/grouping.ts`, `src/registry-explorer/core/matrixColumns.ts`, `src/registry-explorer/ui/focusView.ts`, `src/registry-explorer/ui/componentView.ts`, `src/registry-explorer/ui/matrixView.ts`.
- Use `.schema.ts` for shared type vocabularies and interfaces: `src/registry-explorer/core/registry.schema.ts`.
- Use `.data.ts` for static typed datasets: `src/registry-explorer/data/registries.data.ts`.
- Use `.test.ts` for unit tests in the parallel `tests/` tree: `tests/registry-explorer/grouping.test.ts`, `tests/registry-explorer/matrixColumns.test.ts`.
- Avoid adding new runtime code to deprecated scaffold files: `src/main.ts` and `src/counter.ts` are empty or deprecated placeholders.
- Use camelCase named functions with direct exports for reusable behavior: `filterRegistries`, `buildFocusGroups`, `buildComponentGroups`, `buildMatrixRows`, and `computeMetrics` in `src/registry-explorer/core/grouping.ts`.
- Use `render*` prefixes for DOM rendering functions: `renderFocusAside`, `renderFocusContent`, `renderComponentAside`, `renderComponentContent`, `renderMatrixAside`, and `renderMatrixContent` in `src/registry-explorer/ui/`.
- Use `init*` for app bootstrap/orchestration entry points: `initRegistryExplorer` in `src/registry-explorer/ui/shell.ts`.
- Use local helpers for module-private implementation details: `escapeHtml` in `src/registry-explorer/ui/focusView.ts`, `src/registry-explorer/ui/componentView.ts`, and `src/registry-explorer/ui/matrixView.ts`.
- Use camelCase for local variables and object properties that are app-owned: `searchTerm`, `selectedFocus`, `selectedComponent`, `contentHeader`, `contentBody` in `src/registry-explorer/entry.ts` and `src/registry-explorer/ui/shell.ts`.
- Preserve source-data snake_case fields in the `Registry` data model: `primary_focus` and `component_tags` in `src/registry-explorer/core/registry.schema.ts` and `src/registry-explorer/data/registries.data.ts`.
- Use uppercase snake case for exported constant vocabularies and matrix configuration: `PRIMARY_FOCUS_VALUES`, `COMPONENT_TAG_VALUES`, and `MATRIX_COLUMNS` in `src/registry-explorer/core/`.
- Use concise collection names for derived view data: `groups`, `rows`, `metrics`, `filtered`, and `registries` in `src/registry-explorer/core/grouping.ts` and `src/registry-explorer/ui/shell.ts`.
- Use PascalCase for type aliases and interfaces: `PrimaryFocus`, `ComponentTag`, `Registry`, `FocusGroup`, `ComponentGroup`, `MatrixRow`, and `RegistryExplorerMetrics` in `src/registry-explorer/core/registry.schema.ts`.
- Use discriminated string-union vocabularies for controlled data values instead of free-form strings: `PrimaryFocus` and `ComponentTag` in `src/registry-explorer/core/registry.schema.ts`.
- Use `readonly` array inputs for pure logic that should not mutate callers: `readonly Registry[]` and `readonly ComponentTag[]` in `src/registry-explorer/core/grouping.ts`.
- Use local interfaces for module-specific API surfaces: `ShellOptions` and `AppState` in `src/registry-explorer/ui/shell.ts`.
## Code Style
- No Prettier, EditorConfig, Biome, or formatter config is present. Formatting is maintained by TypeScript/Vite defaults and local convention.
- Use two-space indentation in TypeScript and JSON, matching `src/registry-explorer/core/grouping.ts`, `src/registry-explorer/ui/shell.ts`, `package.json`, and `tsconfig.json`.
- Use single quotes for TypeScript string literals and import specifiers in source and tests: `src/registry-explorer/entry.ts`, `src/registry-explorer/core/grouping.ts`, and `tests/registry-explorer/grouping.test.ts`.
- Keep trailing commas in multiline import/type lists and object literals where the surrounding file already uses them: `src/registry-explorer/core/grouping.ts`, `src/registry-explorer/ui/shell.ts`, and `src/registry-explorer/core/registry.schema.ts`.
- HTML-rendering modules build template strings and assign `innerHTML`; escape user/data-derived strings with the local `escapeHtml` helper before interpolation, as in `src/registry-explorer/ui/focusView.ts`, `src/registry-explorer/ui/componentView.ts`, and `src/registry-explorer/ui/matrixView.ts`.
- No ESLint config is present.
- TypeScript compiler strictness is the primary static quality gate in `tsconfig.json`.
- `tsconfig.json` enables `strict`, `noUnusedLocals`, `noUnusedParameters`, `erasableSyntaxOnly`, `noFallthroughCasesInSwitch`, and `noUncheckedSideEffectImports`.
- `tsconfig.json` includes only `src`, so source files are type-checked by `pnpm build` but tests under `tests/` are not included in the configured TypeScript program.
- `package.json` defines `pnpm build` as `tsc && vite build`; use that command as the configured validation gate for production code.
## Import Organization
- No path aliases are configured in `tsconfig.json` or `vite.config.ts`.
- Use relative imports inside `src/registry-explorer/`: `./ui`, `./data/registries.data`, `../core/grouping`, and `../core/labels`.
- Tests use relative imports back to source files: `../../src/registry-explorer/core/grouping` and `../../src/registry-explorer/core/registry.schema` in `tests/registry-explorer/grouping.test.ts`.
## Error Handling
- Keep core functions pure and non-throwing for normal empty/filter cases: `filterRegistries`, `buildFocusGroups`, `buildComponentGroups`, `buildMatrixRows`, and `computeMetrics` in `src/registry-explorer/core/grouping.ts`.
- Catch bootstrap failures at the entry boundary and log contextual messages: `src/registry-explorer/entry.ts` wraps DOM initialization in `try/catch` and logs `Registry Explorer: Initialization failed`.
- Detect missing DOM roots explicitly before initializing the shell: `src/registry-explorer/entry.ts` logs `Registry Explorer: Missing DOM roots`.
- Catch render failures inside the shell render loop and show an inline empty/error state: `src/registry-explorer/ui/shell.ts`.
- Use optional chaining in tests and lookups where a result might not exist: `aiGroup?.count`, `supportGroup?.registries[0].name`, and `alphaRow?.coverage` in `tests/registry-explorer/grouping.test.ts`.
## Logging
- Use `console.error` only at app boundaries where failures affect initialization or rendering: `src/registry-explorer/entry.ts` and `src/registry-explorer/ui/shell.ts`.
- Include a stable subsystem prefix in log messages: `Registry Explorer: Missing DOM roots`, `Registry Explorer: Initialization failed`, and `Registry Explorer: Render failed`.
- Do not log inside pure data transformation modules: `src/registry-explorer/core/grouping.ts`, `src/registry-explorer/core/labels.ts`, and `src/registry-explorer/core/matrixColumns.ts`.
## Comments
- Prefer comments for short section markers inside orchestration/rendering code: `// Initial State`, `// State Update Logic`, `// Render Loop`, `// Tabs`, and `// Search` in `src/registry-explorer/ui/shell.ts`.
- Use comments to explain non-obvious assumptions or historical intent: `src/registry-explorer/ui/shell.ts` notes why aside event delegation attaches to `roots.aside`.
- Avoid comments for straightforward pure transformations unless they clarify output shape; examples exist in `tests/registry-explorer/grouping.test.ts` for expected group and coverage behavior.
- Keep data-maintenance guidance in docs rather than source comments: `docs/registry-explorer-data.md`.
- Not used in source files.
- Public contracts are expressed through TypeScript interfaces and type aliases in `src/registry-explorer/core/registry.schema.ts` and `src/registry-explorer/ui/shell.ts`.
## Function Design
## Module Design
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## System Overview
```text
```
## Component Responsibilities
| Component | Responsibility | File |
|-----------|----------------|------|
| Static document shell | Defines the app container, search input, tab controls, aside root, and content roots used by the TypeScript app. | `index.html` |
| Registry Explorer bootstrap | Waits for DOM readiness, resolves required DOM roots, imports the static registry dataset, and calls `initRegistryExplorer`. | `src/registry-explorer/entry.ts` |
| UI shell | Owns in-memory app state, event listeners, tab activation, render routing, and render error fallback. | `src/registry-explorer/ui/shell.ts` |
| Focus view renderer | Renders focus-group aside pills and registry cards for the selected focus cluster. | `src/registry-explorer/ui/focusView.ts` |
| Component view renderer | Renders component-type aside pills and registry rows for the selected component group. | `src/registry-explorer/ui/componentView.ts` |
| Matrix view renderer | Renders representative component columns and registry coverage table. | `src/registry-explorer/ui/matrixView.ts` |
| Grouping core | Filters registries, builds focus groups, component groups, matrix rows, and metrics using pure functions. | `src/registry-explorer/core/grouping.ts` |
| Schema core | Defines controlled vocabularies and typed data contracts for registries, groups, matrix rows, and metrics. | `src/registry-explorer/core/registry.schema.ts` |
| Label core | Maps controlled vocabulary keys to human-readable UI labels. | `src/registry-explorer/core/labels.ts` |
| Matrix configuration | Defines the representative component columns shown in the matrix view. | `src/registry-explorer/core/matrixColumns.ts` |
| Local dataset | Stores the static list of 85 registry records that drives all views. | `src/registry-explorer/data/registries.data.ts` |
| Visual system | Provides the layout, responsive behavior, cards, chips, matrix table, and interaction styling for the app. | `public/styles/registry-explorer.css` |
| Core tests | Verifies filtering, grouping, metrics, matrix rows, and matrix column validity. | `tests/registry-explorer/grouping.test.ts`, `tests/registry-explorer/matrixColumns.test.ts` |
## Pattern Overview
- Keep app behavior under `src/registry-explorer/`; `index.html` supplies static DOM roots and loads `src/registry-explorer/entry.ts`.
- Keep business rules in pure functions under `src/registry-explorer/core/` so tests can exercise filtering, grouping, and matrix behavior without the browser DOM.
- Keep view modules as renderers that receive already-derived data and write HTML into provided root elements.
- Keep state local to `initRegistryExplorer` in `src/registry-explorer/ui/shell.ts`; there is no external state library or persistence layer.
- Keep registry content in the typed `registries` array at `src/registry-explorer/data/registries.data.ts`; there is no runtime API call.
## Layers
- Purpose: Provide the app frame and stable DOM anchors.
- Location: `index.html`
- Contains: Header, search input, tab buttons with `data-view`, aside root `#aside`, content header root `#contentHeader`, content body root `#contentBody`, CSS link, and module script.
- Depends on: `public/styles/registry-explorer.css`, `src/registry-explorer/entry.ts`
- Used by: Browser runtime and Vite dev/build.
- Purpose: Bridge static HTML to the TypeScript app.
- Location: `src/registry-explorer/entry.ts`
- Contains: DOM readiness handling, DOM root lookup, missing-root diagnostics, and `initRegistryExplorer` invocation.
- Depends on: `src/registry-explorer/ui/index.ts`, `src/registry-explorer/data/registries.data.ts`
- Used by: `index.html`
- Purpose: Own local state, user event handlers, selected view routing, and render-cycle error handling.
- Location: `src/registry-explorer/ui/shell.ts`
- Contains: `ShellOptions`, `AppState`, `setState`, `render`, tab click handlers, search input handler, and delegated aside click handling.
- Depends on: `src/registry-explorer/core/grouping.ts`, `src/registry-explorer/core/matrixColumns.ts`, `src/registry-explorer/ui/focusView.ts`, `src/registry-explorer/ui/componentView.ts`, `src/registry-explorer/ui/matrixView.ts`
- Used by: `src/registry-explorer/entry.ts`
- Purpose: Convert view-specific data structures into DOM markup.
- Location: `src/registry-explorer/ui/`
- Contains: `renderFocusAside`, `renderFocusContent`, `renderComponentAside`, `renderComponentContent`, `renderMatrixAside`, and `renderMatrixContent`.
- Depends on: `src/registry-explorer/core/registry.schema.ts`, `src/registry-explorer/core/labels.ts`
- Used by: `src/registry-explorer/ui/shell.ts`
- Purpose: Provide typed vocabularies, pure transformations, display labels, metrics, and matrix configuration.
- Location: `src/registry-explorer/core/`
- Contains: Schema types, value lists, label mappers, filtering/grouping functions, metrics, and matrix columns.
- Depends on: No DOM APIs; `src/registry-explorer/core/grouping.ts` depends only on sibling core modules.
- Used by: `src/registry-explorer/ui/`, `src/registry-explorer/data/registries.data.ts`, `tests/registry-explorer/`
- Purpose: Store the registry catalog as application data.
- Location: `src/registry-explorer/data/registries.data.ts`
- Contains: `ReadonlyArray<Registry>` records with `name`, `url`, `description`, `primary_focus`, `component_tags`, `framework`, and `license`.
- Depends on: `src/registry-explorer/core/registry.schema.ts`
- Used by: `src/registry-explorer/entry.ts`
- Purpose: Exercise pure core behavior and configuration validity.
- Location: `tests/registry-explorer/`
- Contains: Vitest suites for grouping, filtering, metrics, matrix row coverage, and matrix column vocabulary membership.
- Depends on: `src/registry-explorer/core/grouping.ts`, `src/registry-explorer/core/matrixColumns.ts`, `src/registry-explorer/core/registry.schema.ts`
- Used by: Developer verification workflows.
## Data Flow
### Primary Request Path
### Tab Switch Flow
### Search Flow
### Component Group Flow
### Matrix Flow
- Use the closure-local `state` variable in `src/registry-explorer/ui/shell.ts:35` for UI state.
- Mutate state only through `setState` in `src/registry-explorer/ui/shell.ts:42`.
- Do not store application state in DOM attributes except for static intent markers such as `data-view`, `data-focus`, and `data-component` in `index.html` and rendered view markup.
## Key Abstractions
- Purpose: The catalog item displayed and grouped by the app.
- Examples: `src/registry-explorer/core/registry.schema.ts`, `src/registry-explorer/data/registries.data.ts`
- Pattern: Typed record with controlled `primary_focus` and `component_tags` arrays.
- Purpose: Keep focus and component grouping stable across data, UI, tests, and matrix configuration.
- Examples: `src/registry-explorer/core/registry.schema.ts`, `src/registry-explorer/core/labels.ts`, `src/registry-explorer/core/matrixColumns.ts`
- Pattern: String-literal union plus matching `readonly` value array.
- Purpose: Convert raw `Registry[]` into structures that renderers can display directly.
- Examples: `FocusGroup`, `ComponentGroup`, `MatrixRow`, and `RegistryExplorerMetrics` in `src/registry-explorer/core/registry.schema.ts`
- Pattern: Pure transformation functions in `src/registry-explorer/core/grouping.ts`.
- Purpose: Make `initRegistryExplorer` independent of direct global root lookup.
- Examples: `src/registry-explorer/ui/shell.ts`
- Pattern: Dependency injection of dataset and DOM roots from `src/registry-explorer/entry.ts`.
- Purpose: Keep markup for each view separated from state and event orchestration.
- Examples: `src/registry-explorer/ui/focusView.ts`, `src/registry-explorer/ui/componentView.ts`, `src/registry-explorer/ui/matrixView.ts`
- Pattern: `renderX(root, data, selection)` functions that write `innerHTML`.
- Purpose: Provide planning/execution agents with repo structure, placement rules, and architecture constraints.
- Examples: `.codex/skills/gsd-map-codebase/SKILL.md`, `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/STRUCTURE.md`
- Pattern: Generated Markdown reference files under `.planning/codebase/`.
## Entry Points
- Location: `index.html`
- Triggers: Browser document load through Vite dev server, production static hosting, or GitHub Pages artifact.
- Responsibilities: Provide static document layout, link `public/styles/registry-explorer.css`, and load `src/registry-explorer/entry.ts`.
- Location: `src/registry-explorer/entry.ts`
- Triggers: Module script execution from `index.html`.
- Responsibilities: Wait for DOM readiness, validate required roots, and start the app with the local dataset.
- Location: `src/main.ts`
- Triggers: Not referenced by `index.html`.
- Responsibilities: Contains only a pointer comment to use `src/registry-explorer/entry.ts`.
- Location: `vite.config.ts`
- Triggers: `pnpm dev`, `pnpm build`, `pnpm preview`.
- Responsibilities: Defines the Vite base path `/Registry-Atlas/` for hosted assets.
- Location: `.github/workflows/deploy.yml`
- Triggers: Push to `main` or manual workflow dispatch.
- Responsibilities: Install dependencies with pnpm, run `pnpm build`, upload `dist`, and deploy to GitHub Pages.
## Architectural Constraints
- **Threading:** Single-threaded browser event loop; no web workers are used in `src/registry-explorer/`.
- **Global state:** No module-level mutable app state is used in `src/registry-explorer/`; app state is closure-local in `src/registry-explorer/ui/shell.ts`.
- **Data source:** Registry data is compile-time static in `src/registry-explorer/data/registries.data.ts`; adding remote data requires a new boundary before `initRegistryExplorer`.
- **Circular imports:** Not detected in `src/registry-explorer/`; imports flow from `entry.ts` to `ui/` and `data/`, from `ui/` to `core/`, and from `data/` to `core/registry.schema.ts`.
- **Type strictness:** `tsconfig.json` enables strict TypeScript, unused checks, bundler module resolution, and `noEmit`; implementation files under `src/registry-explorer/` must remain type-clean.
- **CSS boundary:** App styling is in `public/styles/registry-explorer.css`, linked from `index.html`; view modules emit class names that depend on this stylesheet.
- **Deployment base path:** `vite.config.ts` uses `base: '/Registry-Atlas/'`; absolute public asset references and route assumptions must account for GitHub Pages hosting.
- **GSD mapping artifacts:** `.codex/skills/gsd-map-codebase/SKILL.md` defines `.planning/codebase/` as the target for architecture and structure maps; keep these docs committed as planning inputs.
## Anti-Patterns
### Putting Business Logic in Renderers
### Bypassing Controlled Vocabularies
### Direct Root Lookup Outside Bootstrap
### Expanding Matrix Columns in Render Code
## Error Handling
- Bootstrap wraps root resolution and initialization in `try/catch` and logs missing roots or initialization errors in `src/registry-explorer/entry.ts:5`.
- Render work is wrapped in `try/catch`; failures are logged and replaced with an inline empty-state style error message in `src/registry-explorer/ui/shell.ts:49`.
- Empty filtered states render user-facing empty-state markup in `src/registry-explorer/ui/focusView.ts`, `src/registry-explorer/ui/componentView.ts`, and `src/registry-explorer/ui/matrixView.ts`.
- External links are rendered with `target="_blank"` and `rel="noreferrer"` in `src/registry-explorer/ui/focusView.ts` and `src/registry-explorer/ui/componentView.ts`.
## Cross-Cutting Concerns
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->

<!-- BEGIN serena-gsd-bridge -->
## serena-gsd-bridge

This project may use `serena-gsd-bridge`, a Serena runtime/configuration bridge for operating under `gsd-core`-style constraints.

- Start bridge diagnostics with `gsd-serena-bridge bootstrap --format markdown`.
- Treat native `/gsd:*` workflows as native-owned when native GSD evidence such as `.gsd/`, `.claude/commands/gsd/`, or `.githooks/` is present.
- Do not mix native workflow mutation with bridge prepare/execute/transition mutation unless an explicit coexistence mode allows it.
- Preserve bridge-owned files under `.agents/gsd-serena/**`, Serena bridge setup under `.serena/**`, and bridge evidence under `.planning/.bridge/**`.
<!-- END serena-gsd-bridge -->

<!-- refreshed: 2026-05-25 -->
# Architecture

**Analysis Date:** 2026-05-25

## System Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                      Static HTML Shell                       │
│  `index.html` + `public/styles/registry-explorer.css`        │
└───────────────────────────────┬─────────────────────────────┘
                                │ loads module / supplies roots
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                    Application Bootstrap                     │
│              `src/registry-explorer/entry.ts`                │
└───────────────────────────────┬─────────────────────────────┘
                                │ passes DOM roots + data
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                     UI Shell / State                         │
│              `src/registry-explorer/ui/shell.ts`             │
├──────────────────┬──────────────────┬───────────────────────┤
│   Focus View     │ Component View    │     Matrix View       │
│ `ui/focusView.ts`│`ui/componentView.ts`│ `ui/matrixView.ts`  │
└────────┬─────────┴────────┬─────────┴──────────┬────────────┘
         │                  │                     │
         ▼                  ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│                      Pure Core Logic                         │
│ `core/grouping.ts`, `core/labels.ts`, `core/matrixColumns.ts`│
│ `core/registry.schema.ts`                                    │
└───────────────────────────────┬─────────────────────────────┘
                                │ reads typed local dataset
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                       Static Registry Data                   │
│              `src/registry-explorer/data/registries.data.ts` │
└─────────────────────────────────────────────────────────────┘
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

**Overall:** Modular vanilla TypeScript single-page app with static data, pure domain functions, and DOM rendering modules.

**Key Characteristics:**
- Keep app behavior under `src/registry-explorer/`; `index.html` supplies static DOM roots and loads `src/registry-explorer/entry.ts`.
- Keep business rules in pure functions under `src/registry-explorer/core/` so tests can exercise filtering, grouping, and matrix behavior without the browser DOM.
- Keep view modules as renderers that receive already-derived data and write HTML into provided root elements.
- Keep state local to `initRegistryExplorer` in `src/registry-explorer/ui/shell.ts`; there is no external state library or persistence layer.
- Keep registry content in the typed `registries` array at `src/registry-explorer/data/registries.data.ts`; there is no runtime API call.

## Layers

**Document Shell:**
- Purpose: Provide the app frame and stable DOM anchors.
- Location: `index.html`
- Contains: Header, search input, tab buttons with `data-view`, aside root `#aside`, content header root `#contentHeader`, content body root `#contentBody`, CSS link, and module script.
- Depends on: `public/styles/registry-explorer.css`, `src/registry-explorer/entry.ts`
- Used by: Browser runtime and Vite dev/build.

**Bootstrap:**
- Purpose: Bridge static HTML to the TypeScript app.
- Location: `src/registry-explorer/entry.ts`
- Contains: DOM readiness handling, DOM root lookup, missing-root diagnostics, and `initRegistryExplorer` invocation.
- Depends on: `src/registry-explorer/ui/index.ts`, `src/registry-explorer/data/registries.data.ts`
- Used by: `index.html`

**UI Orchestration:**
- Purpose: Own local state, user event handlers, selected view routing, and render-cycle error handling.
- Location: `src/registry-explorer/ui/shell.ts`
- Contains: `ShellOptions`, `AppState`, `setState`, `render`, tab click handlers, search input handler, and delegated aside click handling.
- Depends on: `src/registry-explorer/core/grouping.ts`, `src/registry-explorer/core/matrixColumns.ts`, `src/registry-explorer/ui/focusView.ts`, `src/registry-explorer/ui/componentView.ts`, `src/registry-explorer/ui/matrixView.ts`
- Used by: `src/registry-explorer/entry.ts`

**View Renderers:**
- Purpose: Convert view-specific data structures into DOM markup.
- Location: `src/registry-explorer/ui/`
- Contains: `renderFocusAside`, `renderFocusContent`, `renderComponentAside`, `renderComponentContent`, `renderMatrixAside`, and `renderMatrixContent`.
- Depends on: `src/registry-explorer/core/registry.schema.ts`, `src/registry-explorer/core/labels.ts`
- Used by: `src/registry-explorer/ui/shell.ts`

**Core Domain Logic:**
- Purpose: Provide typed vocabularies, pure transformations, display labels, metrics, and matrix configuration.
- Location: `src/registry-explorer/core/`
- Contains: Schema types, value lists, label mappers, filtering/grouping functions, metrics, and matrix columns.
- Depends on: No DOM APIs; `src/registry-explorer/core/grouping.ts` depends only on sibling core modules.
- Used by: `src/registry-explorer/ui/`, `src/registry-explorer/data/registries.data.ts`, `tests/registry-explorer/`

**Static Data:**
- Purpose: Store the registry catalog as application data.
- Location: `src/registry-explorer/data/registries.data.ts`
- Contains: `ReadonlyArray<Registry>` records with `name`, `url`, `description`, `primary_focus`, `component_tags`, `framework`, and `license`.
- Depends on: `src/registry-explorer/core/registry.schema.ts`
- Used by: `src/registry-explorer/entry.ts`

**Tests:**
- Purpose: Exercise pure core behavior and configuration validity.
- Location: `tests/registry-explorer/`
- Contains: Vitest suites for grouping, filtering, metrics, matrix row coverage, and matrix column vocabulary membership.
- Depends on: `src/registry-explorer/core/grouping.ts`, `src/registry-explorer/core/matrixColumns.ts`, `src/registry-explorer/core/registry.schema.ts`
- Used by: Developer verification workflows.

## Data Flow

### Primary Request Path

1. Browser loads static HTML, CSS, and the module script from `index.html:11` and `index.html:71`.
2. `bootstrap()` resolves `#aside`, `#contentHeader`, `#contentBody`, `#searchInput`, and `.tab` roots in `src/registry-explorer/entry.ts:5`.
3. `bootstrap()` passes `registries` and DOM roots into `initRegistryExplorer` in `src/registry-explorer/entry.ts:13`.
4. `initRegistryExplorer` initializes local `AppState` with `currentView: 'focus'`, empty selections, and empty search in `src/registry-explorer/ui/shell.ts:31`.
5. Initial `render()` computes metrics with `computeMetrics(registries, state.searchTerm)` in `src/registry-explorer/ui/shell.ts:61`.
6. For the focus view, `render()` calls `buildFocusGroups`, selects the first group when none is selected, and delegates to `renderFocusAside` and `renderFocusContent` in `src/registry-explorer/ui/shell.ts:65`.
7. `buildFocusGroups` filters, groups by `primary_focus`, labels each group, and sorts by count in `src/registry-explorer/core/grouping.ts:34`.
8. `renderFocusContent` writes registry cards into the content body in `src/registry-explorer/ui/focusView.ts:45`.

### Tab Switch Flow

1. Tab buttons expose `data-view="focus"`, `data-view="component"`, and `data-view="matrix"` in `index.html:40`.
2. `src/registry-explorer/ui/shell.ts:118` listens for tab clicks and writes the selected view into `AppState`.
3. `setState` merges the partial state and calls `render()` in `src/registry-explorer/ui/shell.ts:42`.
4. `render()` toggles the `tab-active` class in `src/registry-explorer/ui/shell.ts:51`.
5. `render()` delegates to focus, component, or matrix renderers in `src/registry-explorer/ui/shell.ts:64`.

### Search Flow

1. The search field is defined as `#searchInput` in `index.html:31`.
2. The input handler stores the current search value as `state.searchTerm` in `src/registry-explorer/ui/shell.ts:127`.
3. `filterRegistries` normalizes the search term and matches across registry name, description, framework, license, focus keys, and component tags in `src/registry-explorer/core/grouping.ts:12`.
4. All derived structures and metrics are recomputed for the filtered dataset in `src/registry-explorer/ui/shell.ts:61`.

### Component Group Flow

1. Component view rendering calls `buildComponentGroups` in `src/registry-explorer/ui/shell.ts:80`.
2. `buildComponentGroups` groups filtered registries by each `component_tags` value in `src/registry-explorer/core/grouping.ts:66`.
3. `renderComponentAside` emits `data-component` buttons in `src/registry-explorer/ui/componentView.ts:11`.
4. The delegated aside click handler reads `data-component` and updates `selectedComponent` in `src/registry-explorer/ui/shell.ts:148`.
5. `renderComponentContent` renders the selected group rows in `src/registry-explorer/ui/componentView.ts:46`.

### Matrix Flow

1. `MATRIX_COLUMNS` defines 14 representative component tags in `src/registry-explorer/core/matrixColumns.ts:3`.
2. Matrix view rendering calls `buildMatrixRows(registries, state.searchTerm, MATRIX_COLUMNS)` in `src/registry-explorer/ui/shell.ts:94`.
3. `buildMatrixRows` sorts registries by name and maps each row to a boolean coverage array in `src/registry-explorer/core/grouping.ts:98`.
4. `renderMatrixAside` renders the column legend and `renderMatrixContent` renders the matrix table in `src/registry-explorer/ui/matrixView.ts:11` and `src/registry-explorer/ui/matrixView.ts:42`.

**State Management:**
- Use the closure-local `state` variable in `src/registry-explorer/ui/shell.ts:35` for UI state.
- Mutate state only through `setState` in `src/registry-explorer/ui/shell.ts:42`.
- Do not store application state in DOM attributes except for static intent markers such as `data-view`, `data-focus`, and `data-component` in `index.html` and rendered view markup.

## Key Abstractions

**Registry:**
- Purpose: The catalog item displayed and grouped by the app.
- Examples: `src/registry-explorer/core/registry.schema.ts`, `src/registry-explorer/data/registries.data.ts`
- Pattern: Typed record with controlled `primary_focus` and `component_tags` arrays.

**Controlled Vocabularies:**
- Purpose: Keep focus and component grouping stable across data, UI, tests, and matrix configuration.
- Examples: `src/registry-explorer/core/registry.schema.ts`, `src/registry-explorer/core/labels.ts`, `src/registry-explorer/core/matrixColumns.ts`
- Pattern: String-literal union plus matching `readonly` value array.

**Derived View Models:**
- Purpose: Convert raw `Registry[]` into structures that renderers can display directly.
- Examples: `FocusGroup`, `ComponentGroup`, `MatrixRow`, and `RegistryExplorerMetrics` in `src/registry-explorer/core/registry.schema.ts`
- Pattern: Pure transformation functions in `src/registry-explorer/core/grouping.ts`.

**ShellOptions:**
- Purpose: Make `initRegistryExplorer` independent of direct global root lookup.
- Examples: `src/registry-explorer/ui/shell.ts`
- Pattern: Dependency injection of dataset and DOM roots from `src/registry-explorer/entry.ts`.

**Render Functions:**
- Purpose: Keep markup for each view separated from state and event orchestration.
- Examples: `src/registry-explorer/ui/focusView.ts`, `src/registry-explorer/ui/componentView.ts`, `src/registry-explorer/ui/matrixView.ts`
- Pattern: `renderX(root, data, selection)` functions that write `innerHTML`.

**GSD Codebase Map Documents:**
- Purpose: Provide planning/execution agents with repo structure, placement rules, and architecture constraints.
- Examples: `.codex/skills/gsd-map-codebase/SKILL.md`, `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/STRUCTURE.md`
- Pattern: Generated Markdown reference files under `.planning/codebase/`.

## Entry Points

**Browser App:**
- Location: `index.html`
- Triggers: Browser document load through Vite dev server, production static hosting, or GitHub Pages artifact.
- Responsibilities: Provide static document layout, link `public/styles/registry-explorer.css`, and load `src/registry-explorer/entry.ts`.

**Registry Explorer Bootstrap:**
- Location: `src/registry-explorer/entry.ts`
- Triggers: Module script execution from `index.html`.
- Responsibilities: Wait for DOM readiness, validate required roots, and start the app with the local dataset.

**Legacy Vite Starter Stub:**
- Location: `src/main.ts`
- Triggers: Not referenced by `index.html`.
- Responsibilities: Contains only a pointer comment to use `src/registry-explorer/entry.ts`.

**Build Configuration:**
- Location: `vite.config.ts`
- Triggers: `pnpm dev`, `pnpm build`, `pnpm preview`.
- Responsibilities: Defines the Vite base path `/Registry-Atlas/` for hosted assets.

**GitHub Pages Deploy:**
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

**What happens:** View modules such as `src/registry-explorer/ui/focusView.ts` should render already-derived groups and registry lists, not compute grouping rules.
**Why it's wrong:** Grouping logic belongs in `src/registry-explorer/core/grouping.ts`, where tests in `tests/registry-explorer/grouping.test.ts` can verify behavior without DOM setup.
**Do this instead:** Add filtering, grouping, sorting, metrics, or matrix row logic to `src/registry-explorer/core/grouping.ts`, then pass the result through `src/registry-explorer/ui/shell.ts`.

### Bypassing Controlled Vocabularies

**What happens:** New `primary_focus` or `component_tags` values can be added directly to `src/registry-explorer/data/registries.data.ts` without schema support.
**Why it's wrong:** `src/registry-explorer/core/registry.schema.ts`, `src/registry-explorer/core/labels.ts`, and `src/registry-explorer/core/matrixColumns.ts` rely on stable vocabulary keys.
**Do this instead:** Add new vocabulary values to `src/registry-explorer/core/registry.schema.ts`, add focus labels to `src/registry-explorer/core/labels.ts`, and update tests in `tests/registry-explorer/`.

### Direct Root Lookup Outside Bootstrap

**What happens:** UI modules could call `document.getElementById` directly.
**Why it's wrong:** `src/registry-explorer/entry.ts` centralizes root lookup and passes roots into `src/registry-explorer/ui/shell.ts`, making dependencies explicit.
**Do this instead:** Add new DOM anchors to `index.html`, include them in `ShellOptions` in `src/registry-explorer/ui/shell.ts`, and pass them from `src/registry-explorer/entry.ts`.

### Expanding Matrix Columns in Render Code

**What happens:** Matrix columns could be hard-coded in `src/registry-explorer/ui/matrixView.ts`.
**Why it's wrong:** `src/registry-explorer/core/matrixColumns.ts` is the configuration boundary, and `tests/registry-explorer/matrixColumns.test.ts` verifies that configured columns are valid component tags.
**Do this instead:** Update `src/registry-explorer/core/matrixColumns.ts` and its tests when changing matrix coverage.

## Error Handling

**Strategy:** Fail visibly in developer diagnostics and keep the UI from crashing the whole page during render failures.

**Patterns:**
- Bootstrap wraps root resolution and initialization in `try/catch` and logs missing roots or initialization errors in `src/registry-explorer/entry.ts:5`.
- Render work is wrapped in `try/catch`; failures are logged and replaced with an inline empty-state style error message in `src/registry-explorer/ui/shell.ts:49`.
- Empty filtered states render user-facing empty-state markup in `src/registry-explorer/ui/focusView.ts`, `src/registry-explorer/ui/componentView.ts`, and `src/registry-explorer/ui/matrixView.ts`.
- External links are rendered with `target="_blank"` and `rel="noreferrer"` in `src/registry-explorer/ui/focusView.ts` and `src/registry-explorer/ui/componentView.ts`.

## Cross-Cutting Concerns

**Logging:** Use `console.error` for bootstrap and render failures in `src/registry-explorer/entry.ts` and `src/registry-explorer/ui/shell.ts`.
**Validation:** Type-level validation comes from `Registry`, `PrimaryFocus`, and `ComponentTag` in `src/registry-explorer/core/registry.schema.ts`; test-level validation for matrix columns is in `tests/registry-explorer/matrixColumns.test.ts`.
**Authentication:** Not applicable; the app is a static public explorer with local data only in `src/registry-explorer/data/registries.data.ts`.
**Security:** Renderers escape registry-provided string content through local `escapeHtml` helpers in `src/registry-explorer/ui/focusView.ts`, `src/registry-explorer/ui/componentView.ts`, and `src/registry-explorer/ui/matrixView.ts`.
**Styling:** Use existing classes and custom properties in `public/styles/registry-explorer.css`; TypeScript view modules should emit semantic class names rather than inline layout styles.
**Deployment:** GitHub Pages deployment is defined in `.github/workflows/deploy.yml`; Vite base path is defined in `vite.config.ts`.

---

*Architecture analysis: 2026-05-25*

1. Overview

---

### Problem Statement

The current Component Registry Explorer (“Registry Atlas”) is implemented as a single `index.html` file that combines schema, data, grouping logic, DOM rendering, and styling in one module.  This violates the project’s “no god modules” rule and makes it hard to:

* Swap demo registries for real shadcn/ui community registries.
* Evolve grouping logic or views without editing a megafile.
* Add tests around core data transformations.

A separate written survey of real shadcn/ui community registries already exists but is not used as the live data source. Users still see a small, fake dataset instead of the real landscape of community registries.

The system needs a modular, testable feature that:

* Uses the real registry catalog as a single source of truth.
* Keeps data, core logic, UI, and styling in small, responsibility-focused files.

### Target Users

Primary personas:

* Library explorers / component consumers

  * Frontend engineers evaluating which shadcn/ui-based registries to use for AI chat, forms, dashboards, etc.
  * Needs: quickly answer “who ships chatbot components?”, “which registries have tables + auth?”, “what’s a full-design-system vs narrow set?”

* Internal curators / maintainers

  * People maintaining the registry catalog and taxonomies.
  * Needs: add/update registries in one place, keep tags consistent, avoid touching UI code.

* Project maintainers

  * Contributors enforcing the “no god modules” rule and shared architectural norms.
  * Needs: clean feature slice, clear dependencies, unit-testable logic.

### Success Metrics

Functional:

* 100% of registries from the “Community registry overview” document are encoded as `Registry` entries with `name`, `url`, `description`, `primary_focus`, `component_tags` at minimum.
* All three views (“By Focus”, “By Component”, “Matrix”) operate on the real dataset with:

  * Search and filtering working as before or better.
  * Chip counts and metrics computed from the real data.

Maintainability:

* Adding/updating a registry requires edits in a single data/config module; no UI or logic changes.
* `index.html` contains no large inline data arrays, core logic, or styles; it only bootstraps and wires the feature.
* No new god modules; each new file has a single clear responsibility, consistent with system rules.

Quality:

* Unit test coverage (core functions) ≥ 80% line + branch for grouping/matrix/search modules.
* At least one documented maintenance flow (`docs/registry-explorer-data.md`) explaining how to extend the dataset.

Scope:

* MVP: smallest end-to-end path where real registries power all three views via modular code and tests on core data transformations.

2. Capability Tree (Functional Decomposition)

---

### Capability: Registry Data Modeling

Defines the schema and vocabularies for registries and their classification.

#### Feature: Registry schema definition (MVP)

* **Description**: Define the `Registry` type and related enums (`PrimaryFocus`, `ComponentTag`) as the canonical model.
* **Inputs**: None at runtime (TypeScript types imported by other modules).
* **Outputs**: Type definitions, TypeScript enums/string unions, optional runtime validators.
* **Behavior**:

  * Provide `Registry` with required fields: `name`, `url`, `description`, `primary_focus`, `component_tags`; optional `framework`, `license`, etc.
  * Ensure vocabularies for `primary_focus` and `component_tags` are centralized and re-used.
  * Provide type guards or runtime validation helpers for JSON-encoded registries.

#### Feature: Vocabulary management (MVP)

* **Description**: Maintain the controlled vocabularies for `PrimaryFocus` and `ComponentTag` separately from data and logic.
* **Inputs**: None at runtime; imported where needed.
* **Outputs**: Enumerations or const arrays of allowed focus keys and component tag keys.
* **Behavior**:

  * Expose lists such as `PRIMARY_FOCUS_VALUES`, `COMPONENT_TAG_VALUES`.
  * Allow downstream code to reference these for validation, UI labels, and matrix column selection.
  * Prevent accidental typo-based divergence in tags.

#### Feature: Registry data validation (non-MVP, but planned)

* **Description**: Optionally validate registry data at runtime (development), ensuring all entries conform to the schema and vocabularies.
* **Inputs**: Raw registry data (e.g., from `registries.data.ts` or JSON), vocabulary constants.
* **Outputs**: Validation result with error list or a narrowed typed collection.
* **Behavior**:

  * Iterate over entries, verify required fields, and ensure all focus and component tags are within vocabularies.
  * Throw or log structured errors in development.

---

### Capability: Registry Dataset Management

Stores and maintains the catalog of real shadcn/ui community registries.

#### Feature: Real registry dataset extraction (MVP)

* **Description**: Encode all real registries from the overview document into structured `Registry` objects.
* **Inputs**: “Community registry overview” source document (manual authorship), `Registry` type.
* **Outputs**: `registries: Registry[]` data constant.
* **Behavior**:

  * For each registry: set `name`, `url`, `description`, and map narrative categories to `primary_focus` and `component_tags`.
  * Ensure consistent usage of vocabularies from `registry.schema`.
  * Contain no logic, only data.

#### Feature: Data access as configuration (MVP)

* **Description**: Provide a single importable data module for the registry list.
* **Inputs**: No runtime inputs beyond module import.
* **Outputs**: Named export `registries` of type `ReadonlyArray<Registry>`.
* **Behavior**:

  * Expose `registries` as a read-only array.
  * Avoid any DOM or rendering concerns.
  * Ensure consumers can treat it as configuration-only.

---

### Capability: Grouping, Indexing, and Metrics

Pure functions to derive focus groups, component groups, and coverage matrices.

#### Feature: Focus grouping (MVP)

* **Description**: Create focus-based groupings from the registry list and search input.
* **Inputs**: `registries: Registry[]`, `searchTerm: string`.
* **Outputs**: Data structure: `FocusGroup[]` where each contains `focusKey`, `label`, `registries: Registry[]`, and counts.
* **Behavior**:

  * Filter registries by search (name, description, framework, license, focus, tags).
  * Build groups keyed by `primary_focus` values.
  * Compute per-focus registry counts and sort groups and registries deterministically.

#### Feature: Component grouping (MVP)

* **Description**: Build an index of components → registries.
* **Inputs**: `registries: Registry[]`, `searchTerm: string`.
* **Outputs**: `ComponentGroup[]` where each contains `componentKey`, `label`, `registries: Registry[]`, and counts.
* **Behavior**:

  * Filter registries by search.
  * For each component tag, compute the set of registries that include it.
  * Sort components (e.g., by popularity/count then label).

#### Feature: Matrix coverage computation (MVP)

* **Description**: Compute a rectangular matrix of registries vs selected component tags.
* **Inputs**: `registries: Registry[]`, `searchTerm: string`, `columns: ComponentTag[]`.
* **Outputs**:

  * `MatrixRow[]` where each row holds a registry reference and `boolean[]` coverage per column.
* **Behavior**:

  * Filter registries by search.
  * For each registry, mark a boolean for each column based on presence in `component_tags`.
  * Keep rows sorted by registry name or richness (count of `true` flags).

#### Feature: Shared search/filter pipeline (MVP)

* **Description**: Provide a consistent mechanism for filtering registries by search term across all views.
* **Inputs**: `registries: Registry[]`, `searchTerm: string`.
* **Outputs**: Filtered `Registry[]`.
* **Behavior**:

  * Normalize search term to lowercase.
  * Match against name, description, framework, license, focus keys, and component tags (similar to existing SPA behavior).
  * Return a new array; no mutations.

#### Feature: Metrics derivation (MVP)

* **Description**: Compute derived metrics (e.g., total registries, focus groups count, component types count) for display.
* **Inputs**: `registries: Registry[]`, `searchTerm: string`.
* **Outputs**: Metrics object(s) with counts.
* **Behavior**:

  * Use same search pipeline.
  * Compute summary stats per view.

---

### Capability: Labeling and Presentation Mapping

Converts internal keys to human-readable labels for UI.

#### Feature: Focus label mapping (MVP)

* **Description**: Map `PrimaryFocus` keys to human-readable labels (e.g., `ai-chat` → “AI & Chatbot”).
* **Inputs**: `focusKey: PrimaryFocus`.
* **Outputs**: `label: string`.
* **Behavior**:

  * Use a central mapping dictionary.
  * Default to echoing key if missing.

#### Feature: Component label mapping (MVP)

* **Description**: Map `ComponentTag` keys to human-readable labels (e.g., `auth-form` → “auth form”).
* **Inputs**: `componentKey: ComponentTag`.
* **Outputs**: `label: string`.
* **Behavior**:

  * Replace hyphens with spaces; optionally apply capitalization rules.
  * Use central mapping as needed.

---

### Capability: SPA UI Views and Shell

Responsible for DOM rendering and UI wiring (no static data).

#### Feature: Shell initialization and wiring (MVP)

* **Description**: Manage state for current view, search term, selected focus/component, and coordinate view renders.
* **Inputs**: `registries: Registry[]`, references to root DOM nodes (`aside`, `contentHeader`, `contentBody`, `tabs`, `searchInput`).
* **Outputs**: Rendered UI; event handlers attached.
* **Behavior**:

  * Initialize default state.
  * Wire tab switching, search input, pill clicks.
  * Call grouping and view-render functions to update DOM.

#### Feature: Focus view rendering (MVP)

* **Description**: Render the “By Focus” aside and main card grid from precomputed focus groups.
* **Inputs**: `FocusGroup[]`, selection state, metrics.
* **Outputs**: `aside` HTML and main content HTML (cards).
* **Behavior**:

  * Render focus pills with counts and selected state.
  * Render registry cards with focus chips, tech/license chips, and truncated component tags.
  * Render empty states when no results.

#### Feature: Component view rendering (MVP)

* **Description**: Render “By Component” aside and registry lists.
* **Inputs**: `ComponentGroup[]`, selected component, metrics.
* **Outputs**: `aside` HTML and list layout in content body.
* **Behavior**:

  * Render component pills with counts.
  * For selected component, render registry list rows including focus and other component chips.
  * Render empty states as needed.

#### Feature: Matrix view rendering (MVP)

* **Description**: Render table of registry vs component coverage.
* **Inputs**: `MatrixRow[]`, `columns: ComponentTag[]`, metrics.
* **Outputs**: `<table>` markup wrapped in scrollable container.
* **Behavior**:

  * Render header row of component labels.
  * Render rows with registry names and presence indicators.
  * Use existing visual style for filled/empty cells.

#### Feature: Accessibility and keyboard navigation (non-MVP, but planned)

* **Description**: Ensure basic keyboard support for tabs and pills.
* **Inputs**: DOM refs and event handlers.
* **Outputs**: Keyboard-accessible interaction patterns.
* **Behavior**:

  * Tab key order logical.
  * Arrow or tab navigation across pills and tabs.
  * Visible focus outlines.

---

### Capability: Styling and Theming

Extract and maintain SPA design as reusable CSS.

#### Feature: Stylesheet extraction (MVP)

* **Description**: Move all SPA-specific CSS from `index.html` inline `<style>` to a dedicated CSS file.
* **Inputs**: Existing CSS in `index.html`.
* **Outputs**: `public/styles/registry-explorer.css`.
* **Behavior**:

  * Preserve class names and visual aesthetics.
  * Remove style block from `index.html` once wired.

#### Feature: Responsive and layout integrity (MVP)

* **Description**: Ensure layout remains responsive after modularization.
* **Inputs**: Existing breakpoints and layout CSS.
* **Outputs**: Same behavior in external CSS.
* **Behavior**:

  * Maintain grid layout, scroll regions, and small-screen behavior.

---

### Capability: Entry Wiring and Integration

Connect HTML shell to modular JS/TS app.

#### Feature: Entry module (MVP)

* **Description**: Provide a single entry point that bootstraps the Registry Explorer in the page.
* **Inputs**: `document`, DOM root nodes, `registries` data.
* **Outputs**: Initialized feature (shell + views).
* **Behavior**:

  * Locate shell DOM containers.
  * Call `initRegistryExplorer({ registries, rootNodes })`.
  * Export a single function for reuse or testing as needed.

#### Feature: Lightweight `index.html` shell (MVP)

* **Description**: Refactor `index.html` to contain only static markup, CSS link, and entry script reference.
* **Inputs**: Existing `index.html` structure.
* **Outputs**: Updated `index.html`, plus `index.legacy.html` or git tag for rollback.
* **Behavior**:

  * Remove inline script and style.
  * Reference built entry JS (e.g., `registry-explorer.entry.js`) with `<script type="module">`.

---

### Capability: Testing and Documentation

#### Feature: Core logic unit tests (MVP)

* **Description**: Add unit tests for grouping, search, and matrix functions.
* **Inputs**: `grouping.ts`, `matrixColumns.ts`, sample `Registry[]`.
* **Outputs**: Test files and passing test suite.
* **Behavior**:

  * Validate happy paths, edge cases, and search behavior.
  * Use deterministic sample data.

#### Feature: Maintenance documentation (MVP)

* **Description**: Document schema, vocabularies, and maintenance workflow for registries.
* **Inputs**: Schema, dataset, grouping behavior.
* **Outputs**: `docs/registry-explorer-data.md`.
* **Behavior**:

  * Explain how to add/update registries.
  * Describe vocabularies and their effect on views.
  * Clarify where logic lives and how to run tests.

3. Repository Structure + Module Definitions (Structural Decomposition)

---

### Proposed Repository Structure (feature slice)

```txt
project-root/
├── public/
│   ├── index.html                    # Shell; no data/logic
│   └── styles/
│       └── registry-explorer.css     # Extracted SPA styles (MVP)
├── src/
│   └── registry-explorer/
│       ├── core/
│       │   ├── registry.schema.ts    # Types + vocab (MVP)
│       │   ├── labels.ts             # Key → label mapping (MVP)
│       │   ├── grouping.ts           # Focus & component & search (MVP)
│       │   ├── matrixColumns.ts      # Matrix column configuration (MVP)
│       │   └── index.ts              # Core exports
│       ├── data/
│       │   └── registries.data.ts    # Real registry list (MVP)
│       ├── ui/
│       │   ├── focusView.ts          # “By Focus” view rendering (MVP)
│       │   ├── componentView.ts      # “By Component” view (MVP)
│       │   ├── matrixView.ts         # Matrix view (MVP)
│       │   ├── shell.ts              # State + wiring + event handlers (MVP)
│       │   └── index.ts              # UI exports
│       └── entry.ts                  # Bootstraps feature into DOM (MVP)
├── tests/
│   └── registry-explorer/
│       ├── grouping.test.ts          # Unit tests for grouping (MVP)
│       └── matrixColumns.test.ts     # Unit tests for matrix config (MVP)
└── docs/
    └── registry-explorer-data.md     # Maintenance doc (MVP)
```

### Module Definitions

#### Module: `src/registry-explorer/core/registry.schema.ts`

* **Maps to capability**: Registry Data Modeling.
* **Responsibility**: Define domain types and vocabularies for registries.
* **File structure**: single file.
* **Exports**:

  * `type PrimaryFocus = 'ai-chat' | 'forms-and-inputs' | ...`
  * `type ComponentTag = 'button' | 'chatbot' | 'table' | ...`
  * `interface Registry { ... }`
  * `const PRIMARY_FOCUS_VALUES: readonly PrimaryFocus[]`
  * `const COMPONENT_TAG_VALUES: readonly ComponentTag[]`
  * Optional: `isPrimaryFocus(value: string): value is PrimaryFocus`
  * Optional: `isComponentTag(value: string): value is ComponentTag`

#### Module: `src/registry-explorer/core/labels.ts`

* **Maps to capability**: Labeling and Presentation Mapping.
* **Responsibility**: Translate focus and component keys into human-readable labels.
* **Exports**:

  * `focusLabel(focus: PrimaryFocus): string`
  * `componentLabel(tag: ComponentTag): string`

#### Module: `src/registry-explorer/core/grouping.ts`

* **Maps to capability**: Grouping, Indexing, and Metrics.
* **Responsibility**: Pure derivation of focus groups, component groups, filtered list, and metrics from `Registry[]`.
* **Exports**:

  * `filterRegistries(registries: Registry[], search: string): Registry[]`
  * `buildFocusGroups(registries: Registry[], search: string): FocusGroup[]`
  * `buildComponentGroups(registries: Registry[], search: string): ComponentGroup[]`
  * `buildMatrixRows(registries: Registry[], search: string, columns: ComponentTag[]): MatrixRow[]`
  * `computeMetrics(registries: Registry[], search: string): RegistryExplorerMetrics`
* **Notes**:

  * No DOM imports.
  * No reference to global `document` or UI class names.
  * Stateless and deterministic.

#### Module: `src/registry-explorer/core/matrixColumns.ts`

* **Maps to capability**: Grouping, Indexing, and Metrics.
* **Responsibility**: Define curated list of `ComponentTag` values used as matrix columns.
* **Exports**:

  * `const MATRIX_COLUMNS: readonly ComponentTag[]`

#### Module: `src/registry-explorer/core/index.ts`

* **Maps to capability**: Core convenience exports.
* **Responsibility**: Re-export core types and functions for easier imports.
* **Exports**:

  * Re-exports from `registry.schema`, `labels`, `grouping`, `matrixColumns`.

---

#### Module: `src/registry-explorer/data/registries.data.ts`

* **Maps to capability**: Registry Dataset Management.
* **Responsibility**: Hold the real registry dataset as typed configuration.
* **Exports**:

  * `const registries: readonly Registry[]`
* **Notes**:

  * No functions beyond possibly shallow helper for development validation.
  * No DOM or view logic.

---

#### Module: `src/registry-explorer/ui/focusView.ts`

* **Maps to capability**: SPA UI Views and Shell (Focus view).
* **Responsibility**: Render focus aside and main registry cards using provided group data.
* **Exports**:

  * `renderFocusAside(root: HTMLElement, groups: FocusGroup[], selectedFocus: PrimaryFocus | null): void`
  * `renderFocusContent(root: HTMLElement, group: FocusGroup | null, metrics: RegistryExplorerMetrics): void`
* **Notes**:

  * No direct access to `registries.data` or grouping functions.
  * Uses label helpers only via arguments (or imports if necessary).

#### Module: `src/registry-explorer/ui/componentView.ts`

* **Maps to capability**: SPA UI Views and Shell (Component view).
* **Responsibility**: Render component-based aside and registry listing.
* **Exports**:

  * `renderComponentAside(root: HTMLElement, groups: ComponentGroup[], selectedComponent: ComponentTag | null): void`
  * `renderComponentContent(root: HTMLElement, group: ComponentGroup | null, metrics: RegistryExplorerMetrics): void`

#### Module: `src/registry-explorer/ui/matrixView.ts`

* **Maps to capability**: SPA UI Views and Shell (Matrix view).
* **Responsibility**: Render coverage matrix table and aside legend.
* **Exports**:

  * `renderMatrixAside(root: HTMLElement, columns: ComponentTag[], metrics: RegistryExplorerMetrics): void`
  * `renderMatrixContent(root: HTMLElement, rows: MatrixRow[], columns: ComponentTag[], metrics: RegistryExplorerMetrics): void`

#### Module: `src/registry-explorer/ui/shell.ts`

* **Maps to capability**: Shell initialization and wiring.
* **Responsibility**: Orchestrate state, event listeners, and coordinated renders across views.
* **Exports**:

  * `type ShellOptions = { registries: Registry[]; roots: { aside: HTMLElement; contentHeader: HTMLElement; contentBody: HTMLElement; tabs: NodeListOf<HTMLButtonElement>; searchInput: HTMLInputElement; }; }`
  * `initRegistryExplorer(options: ShellOptions): void`
* **Notes**:

  * Owns UI state: `currentView`, `selectedFocus`, `selectedComponent`, `searchTerm`.
  * Delegates derivations to `grouping.ts`.
  * Delegates markup generation to view modules.

#### Module: `src/registry-explorer/ui/index.ts`

* **Maps to capability**: Aggregated UI exports.
* **Responsibility**: Re-export `initRegistryExplorer`.
* **Exports**:

  * `initRegistryExplorer`.

---

#### Module: `src/registry-explorer/entry.ts`

* **Maps to capability**: Entry Wiring and Integration.
* **Responsibility**: Glue between `index.html` and feature shell.
* **Exports**:

  * (Optionally) `bootstrapRegistryExplorer(): void` for testability.
* **Behavior**:

  * On load, query for DOM nodes:

    * `#aside`, `#contentHeader`, `#contentBody`, tab buttons, and search input (matching current HTML structure).
  * Import `registries` and `initRegistryExplorer`.
  * Call `initRegistryExplorer` with DOM refs and data.

---

#### Module: `public/styles/registry-explorer.css`

* **Maps to capability**: Styling and Theming.
* **Responsibility**: Hold all CSS previously inline in `index.html`.
* **Exports**: N/A (static asset).
* **Behavior**:

  * Preserve existing look/feel.

---

#### Module: `tests/registry-explorer/grouping.test.ts`

* **Maps to capability**: Testing and Documentation.
* **Responsibility**: Unit tests for `grouping.ts`.
* **Exports**: N/A (test module).
* **Behavior**:

  * Cover focus grouping, component grouping, matrix rows, and search filtering.

#### Module: `tests/registry-explorer/matrixColumns.test.ts`

* **Responsibility**: Ensure `MATRIX_COLUMNS` is consistent with `ComponentTag` and expectations.

---

#### Module: `docs/registry-explorer-data.md`

* **Responsibility**: Maintenance documentation for registry data and vocabularies.
* **Content**:

  * Schema description.
  * Vocab lists.
  * How to add/edit registries.
  * How views derive from data.

4. Dependency Chain

---

### Foundation Layer (Phase 0)

No dependencies.

* **`registry.schema`**

  * Provides: `Registry`, `PrimaryFocus`, `ComponentTag`, vocab arrays.
* **`labels`**

  * Provides: `focusLabel`, `componentLabel` using `PrimaryFocus` and `ComponentTag`.
* **`matrixColumns`**

  * Provides: `MATRIX_COLUMNS: ComponentTag[]`.

### Data Layer (Phase 1)

Depends only on foundation types.

* **`registries.data`**

  * Depends on: `registry.schema`.
  * Provides: `registries: Registry[]`.

### Core Logic Layer (Phase 2)

Pure computation.

* **`grouping`**

  * Depends on: `registry.schema`, `labels`, `matrixColumns` (for types and columns).
  * Provides: `filterRegistries`, `buildFocusGroups`, `buildComponentGroups`, `buildMatrixRows`, `computeMetrics`.

### UI View Layer (Phase 3)

Render-only modules.

* **`focusView`**

  * Depends on: `labels` (for label helpers), `registry.schema` (types), and `grouping` types.
* **`componentView`**

  * Depends on: `labels`, `registry.schema`.
* **`matrixView`**

  * Depends on: `labels`, `registry.schema`, `matrixColumns`.

### Shell / Orchestration Layer (Phase 4)

* **`ui/shell`**

  * Depends on: `grouping`, `matrixColumns`, `labels`, `registry.schema`, and view modules (`focusView`, `componentView`, `matrixView`).
  * Provides: `initRegistryExplorer`.

* **`ui/index`**

  * Depends on: `ui/shell`.
  * Provides: re-exported `initRegistryExplorer`.

### Entry & Asset Layer (Phase 5)

* **`entry`**

  * Depends on: `registries.data`, `ui/index`.
  * Provides: bootstrap behavior for `index.html`.

* **`public/styles/registry-explorer.css`**

  * Used by: `public/index.html`.

* **`public/index.html`**

  * Depends on: build output of `entry` (e.g., `registry-explorer.entry.js`), `public/styles/registry-explorer.css`.

### Test Layer

* **`grouping.test`**

  * Depends on: `grouping`, `registry.schema`.
* **`matrixColumns.test`**

  * Depends on: `matrixColumns`, `registry.schema`.

5. Development Phases

---

### Phase 0: Core Types and Styles Extraction

**Goal**: Establish schema, vocabularies, and move CSS out of `index.html` without changing behavior.

**Entry Criteria**: Existing SPA `index.html` compiles and runs with demo data.

**Tasks**:

* [ ] Implement `registry.schema.ts` (depends on: none)

  * Acceptance criteria:

    * `Registry`, `PrimaryFocus`, `ComponentTag` types defined.
    * Vocab arrays match currently implied focuses/tags in demo data.
  * Test strategy:

    * TS compilation only (no runtime tests yet).

* [ ] Extract inline CSS into `public/styles/registry-explorer.css` (depends on: none)

  * Acceptance criteria:

    * All SPA-specific styles removed from `index.html` and present in CSS file.
    * Visual comparison before/after shows no regressions.
  * Test strategy:

    * Manual visual comparison.

* [ ] Wire stylesheet in `index.html` (depends on: CSS extraction)

  * Acceptance criteria:

    * `index.html` includes `<link>` to new CSS file.
    * No inline `<style>` remains for SPA.

**Exit Criteria**:

* Schema types compile.
* Layout and styling unchanged but sourced from CSS file.

**Delivers**:

* Typed model ready for real data.
* Clean separation of styles from markup/logic.

---

### Phase 1: Real Registry Dataset

**Goal**: Replace demo data with the real registry dataset in a dedicated data module.

**Entry Criteria**: Phase 0 complete.

**Tasks**:

* [ ] Create `registries.data.ts` with real `Registry[]` (depends on: `registry.schema`)

  * Acceptance criteria:

    * All registries from overview document present with required fields.
    * All `primary_focus` and `component_tags` values use schema vocabularies.
  * Test strategy:

    * TS type-check; optional development-time assertion counting total entries.

* [ ] Add `docs/registry-explorer-data.md` skeleton: schema and vocabulary description (depends on: `registry.schema`, `registries.data`)

  * Acceptance criteria:

    * Document describes `Registry` shape and vocab lists.
    * Section reserved for “How to add/update a registry”.

**Exit Criteria**:

* Single source of truth for real registries exists.
* Documentation stub exists.

**Delivers**:

* Real data ready to be plugged into logic.
* Maintainers can inspect and reason about dataset.

---

### Phase 2: Core Grouping and Matrix Logic

**Goal**: Extract existing logic from `index.html` into pure functions and cover them with unit tests.

**Entry Criteria**: Phases 0–1 complete.

**Tasks**:

* [ ] Implement `labels.ts` (depends on: `registry.schema`)

  * Acceptance criteria:

    * `focusLabel` and `componentLabel` implemented.
    * Labels match current SPA behavior (e.g., “AI & Chatbot”, etc.).
  * Test strategy:

    * Small unit tests verifying key label mappings.

* [ ] Implement `matrixColumns.ts` (depends on: `registry.schema`)

  * Acceptance criteria:

    * `MATRIX_COLUMNS` defined as a curated subset of `ComponentTag`.
    * Columns align with key component families (chatbot, button, input, table, auth-form, navbar, hero-section at minimum).
  * Test strategy:

    * Unit test ensuring only valid `ComponentTag` values and length > 0.

* [ ] Implement `grouping.ts` (depends on: `registry.schema`, `labels`, `matrixColumns`)

  * Acceptance criteria:

    * `filterRegistries`, `buildFocusGroups`, `buildComponentGroups`, `buildMatrixRows`, `computeMetrics` implemented as pure functions.
    * Logic behavior matches/extends existing SPA behavior (search across same fields, similar grouping semantics).
  * Test strategy:

    * Unit tests with synthetic datasets verifying grouping, sorting, and matrix results.

* [ ] Add unit tests in `tests/registry-explorer/grouping.test.ts` and `matrixColumns.test.ts` (depends on: `grouping`, `matrixColumns`)

  * Acceptance criteria:

    * Core happy paths and edge cases covered (empty search, no results, multiple focuses/components).
    * Coverage ≥ 80% for `grouping.ts` and `matrixColumns.ts`.
  * Test strategy:

    * Use test runner (e.g., Vitest/Jest) consistent with repo.

**Exit Criteria**:

* Core logic fully decoupled from DOM and data location.
* Tests pass.

**Delivers**:

* Stable, testable derivation layer.

---

### Phase 3: UI Views and Shell Refactor

**Goal**: Move DOM rendering and event wiring out of `index.html` into modular UI and shell modules, preserving UX.

**Entry Criteria**: Phases 0–2 complete.

**Tasks**:

* [ ] Implement `focusView.ts` (depends on: `registry.schema`, `labels`)

  * Acceptance criteria:

    * Exposes functions for rendering aside and focus content.
    * Markup structure and class names match current SPA so CSS applies.
  * Test strategy:

    * Manual QA; optional snapshot tests on small DOM subtrees.

* [ ] Implement `componentView.ts` (depends on: `registry.schema`, `labels`)

  * Acceptance criteria:

    * Renders component list by component group.
    * Uses same class names and empty states as current SPA where applicable.
  * Test strategy:

    * Manual QA; optional snapshot tests.

* [ ] Implement `matrixView.ts` (depends on: `registry.schema`, `labels`, `matrixColumns`)

  * Acceptance criteria:

    * Renders matrix table consistent with current SPA (same class names, responsive scroll).
  * Test strategy:

    * Manual QA; optional HTML snapshot.

* [ ] Implement `ui/shell.ts` and `ui/index.ts` (depends on: `grouping`, view modules, `matrixColumns`, `labels`)

  * Acceptance criteria:

    * Internal state machine replicates current behavior (tabs, search, pill selections).
    * No static data embedded.
    * No direct knowledge of data source beyond `Registry[]` passed in.
  * Test strategy:

    * Manual end-to-end interaction in browser.
    * Minimal tests for state transitions (e.g., separate pure helper functions where possible).

**Exit Criteria**:

* `index.html`’s dynamic behavior can be replaced by calling `initRegistryExplorer`.
* Same UX as legacy SPA with demo data when wired to a test dataset.

**Delivers**:

* Modular UI layer with clean responsibilities.

---

### Phase 4: Entry Wiring and Real Data Integration

**Goal**: Wire the HTML shell to the modular app and switch to real registries.

**Entry Criteria**: Phases 0–3 complete.

**Tasks**:

* [ ] Implement `entry.ts` (depends on: `registries.data`, `ui/index`)

  * Acceptance criteria:

    * Locates DOM roots using IDs/classes already present in `index.html`.
    * Calls `initRegistryExplorer` with `registries`.
  * Test strategy:

    * Manual load of page; no console errors.

* [ ] Simplify `public/index.html` and add legacy backup (depends on: `entry.ts`, styles extracted)

  * Acceptance criteria:

    * `index.html` contains static containers and script tag only; no inline data/logic.
    * Previous version stored as `index.legacy.html` or git tag for rollback.
  * Test strategy:

    * Manual comparison; fallback rollback verified.

* [ ] Final QA with real dataset (depends on: all previous tasks)

  * Acceptance criteria:

    * Search, tabs, pills, and matrix all work with real registries.
    * No broken links or obvious layout regressions.

**Exit Criteria**:

* Production feature uses real data and modular code.
* Legacy single-file SPA preserved as fallback asset.

**Delivers**:

* Live Registry Explorer powered by real shadcn/ui registries.

---

### Phase 5: Documentation and Accessibility Hardening

**Goal**: Complete documentation and basic accessibility.

**Entry Criteria**: Phases 0–4 complete.

**Tasks**:

* [ ] Finalize `registry-explorer-data.md` maintenance doc (depends on: data, grouping)

  * Acceptance criteria:

    * Contains step-by-step instructions for adding/updating registries.
    * Documents how views derive from data.
  * Test strategy:

    * Dry-run by adding a mock registry in a feature branch using only the doc.

* [ ] Basic accessibility pass (depends on: UI modules)

  * Acceptance criteria:

    * Tab navigation through search, tabs, pills, and cards is logical.
    * Focus indicators visible.
  * Test strategy:

    * Manual keyboard navigation test.

**Exit Criteria**:

* Maintainers can safely extend dataset.
* Basic accessibility in place.

**Delivers**:

* Sustainable, documented feature.

6. User Experience

---

### Personas

* **Explorer engineer**: wants to quickly filter by focus (AI chat, tables, auth) or by specific component type (button, chatbot, table).
* **Curator**: updates dataset and wants immediate feedback in UI without touching logic.

### Key Flows

1. **Discover by focus**

   * User lands on page; “By Focus” tab active.
   * Left pane shows focus chips with counts (e.g., AI & Chatbot, Dashboards & Admin).
   * Clicking a focus pill filters the main card grid to registries with that focus.
   * Search narrows both focus list and card grid.

2. **Discover by component**

   * User switches to “By Component”.
   * Left pane lists component types sorted by popularity (button, chatbot, table, etc.).
   * Selecting a component shows registries that ship it, with focus labels and other components as chips.
   * Search narrows registries and which components appear.

3. **Scan matrix coverage**

   * User selects “Matrix” tab.
   * Sees table: rows = registries; columns = key components like chatbot, button, input, table, auth-form, navbar, hero-section.
   * Quick visual comparison of coverage across registries.

4. **Maintenance check**

   * Curator updates or adds a registry entry in `registries.data.ts`.
   * Runs tests and loads UI to confirm tag-based groupings and matrix updated correctly.

### UI/UX Notes

* All views share the same search input; state is unified in shell.
* Aside and content panes match existing layout and styling.
* Empty states are explicit, matching current copy but decoupled into view modules.
* No removal of existing visual affordances (chips, metrics, header meta).

7. Technical Architecture

---

### System Components

* **Static HTML shell (`public/index.html`)**

  * Provides container markup and links to CSS/JS.
* **Registry Explorer feature (`src/registry-explorer`)**

  * Encapsulates schema, data, core logic, and UI for this SPA.
* **Build system**

  * Existing bundler (e.g. Vite in TanStack Start) compiles `entry.ts` into a browser-ready module.
* **Tests**

  * Runs via existing test runner on `tests/registry-explorer/*`.

### Data Models

* `PrimaryFocus`: union of string literals for major focus buckets (`'ai-chat' | 'forms-and-inputs' | ...`).

* `ComponentTag`: union of string literals for granular components (`'button' | 'chatbot' | 'table' | ...`).

* `Registry`:

  * `name: string`
  * `url: string`
  * `description: string`
  * `primary_focus: PrimaryFocus[]`
  * `component_tags: ComponentTag[]`
  * `framework?: string`
  * `license?: string`
  * Future optional fields allowed but controlled.

* `FocusGroup`:

  * `focusKey: PrimaryFocus`
  * `label: string`
  * `registries: Registry[]`
  * `count: number`

* `ComponentGroup`:

  * `componentKey: ComponentTag`
  * `label: string`
  * `registries: Registry[]`
  * `count: number`

* `MatrixRow`:

  * `registry: Registry`
  * `coverage: boolean[]` (aligned with `MATRIX_COLUMNS`)

* `RegistryExplorerMetrics`:

  * `totalRegistries: number`
  * `visibleRegistries: number`
  * `focusGroupCount: number`
  * `componentTypeCount: number`
  * Possibly per-view specifics.

### APIs and Integrations

* No external APIs in current scope.
* All data is local, static, and version-controlled.

### Technology Stack

* TypeScript for all feature code.
* Vanilla DOM APIs (no React/SPA framework here).
* Existing project constraints: pnpm, TanStack environment rules for other parts of repo.

**Decision: Feature-oriented slice under `src/registry-explorer`**

* **Rationale**: Aligns with system’s requirement for feature slices and single-responsibility modules.
* **Trade-offs**: Slightly more files; but improved clarity and maintainability.
* **Alternatives considered**:

  * Keeping logic inside `index.html` with better comments (rejected; still a god module).
  * Creating generic `utils` directory (rejected; violates “no utils buckets” guidance).

**Decision: Keep data as static TS module**

* **Rationale**: No current need for remote fetching; static typed config is simplest and fastest.
* **Trade-offs**: Requires rebuild to update data.
* **Alternatives**: Loading JSON at runtime or via server function; not required yet.

**Decision: Pure functions for derivations**

* **Rationale**: Maximizes testability and reuse; consistent with guidance to compute derived views without side effects.
* **Trade-offs**: Slight overhead of passing data into functions; negligible at this scale.

8. Test Strategy

---

### Test Pyramid

```txt
        /\
       /E2E\        ~10% (manual browser checks, occasional snapshot)
      /------\
     /Integration\  ~20% (UI modules vs grouping helpers, optional)
    /------------\
   /  Unit Tests  \ ~70% (grouping, labels, matrixColumns)
  /----------------\
```

### Coverage Requirements

* Line coverage: ≥ 80% for `grouping.ts`, `matrixColumns.ts`, `labels.ts`.
* Branch coverage: ≥ 70% for the same modules.
* Function coverage: ≥ 80%.
* Statement coverage: ≥ 80%.

### Critical Test Scenarios

#### Module: `grouping.ts`

**Happy path**:

* Scenario: Multiple registries with overlapping focuses and tags.
* Expected:

  * `buildFocusGroups` returns all focuses with correct counts.
  * `buildComponentGroups` returns correct registry sets per tag.
  * `buildMatrixRows` sets coverage flags correctly.

**Edge cases**:

* Scenario: Empty registry list.

* Expected:

  * Functions return empty arrays, no errors.

* Scenario: Search term matches only description, not name.

* Expected:

  * Only registries with matching text appear in filtered results.

* Scenario: Focus with no registries after search filter.

* Expected:

  * Groups filtered out appropriately; empty states triggered in UI.

**Error cases**:

* Scenario: Registry with empty `primary_focus` or `component_tags` (if allowed).
* Expected:

  * Grouping functions handle gracefully (ignore missing categories or treat as empty).

**Integration points**:

* `grouping` with `MATRIX_COLUMNS`:

  * Matrix rows align with defined columns.
* Expected:

  * No off-by-one or index mismatches.

#### Module: `labels.ts`

**Happy path**:

* Scenario: Known focus or tag keys.
* Expected:

  * Human-readable labels returned as defined.

**Edge cases**:

* Scenario: Unknown key (e.g., from future extension).
* Expected:

  * Falls back to raw key or log, without throwing.

#### UI Modules (integration-level smoke tests)

* Use a small sample dataset to:

  * Render each view.
  * Assert on presence of expected text and basic structure.

### Test Generation Guidelines

* Favor small, deterministic datasets in tests.
* Avoid DOM-heavy assertions for core logic; keep those minimal.
* For logic modules, use table-driven tests where possible (inputs/expected outputs).
* Treat data validation tests as non-blocking (if validation helpers are implemented).

9. Risks and Mitigations

---

### Technical Risks

**Risk**: Misalignment between narrative overview and strict vocabularies

* **Impact**: Medium — confusing or unintuitive focus/component tags for users.
* **Likelihood**: High — mapping is judgment-based.
* **Mitigation**:

  * Start with best-effort mapping; adjust tags based on UX feedback.
  * Keep vocabularies centralized for easy tweaking.
* **Fallback**:

  * Provide secondary tags or aliases as needed without changing underlying keys.

**Risk**: Performance and visual density with larger dataset

* **Impact**: Medium — UI may feel cluttered or sluggish.
* **Likelihood**: Medium.
* **Mitigation**:

  * Use pure functions and efficient DOM updates via shell (re-render regionally, not whole page when possible).
  * Keep chip counts and rows trimmed (e.g., “+N more” chips already in place).
* **Fallback**:

  * Introduce simple pagination or more aggressive truncation without changing architecture.

**Risk**: Regression during refactor from single-file SPA

* **Impact**: High — feature could break if dependencies miswired.
* **Likelihood**: Medium.
* **Mitigation**:

  * Keep `index.legacy.html` as immediate rollback path.
  * Incrementally refactor: first extract CSS, then types, then logic, then UI.
* **Fallback**:

  * Restore legacy file and re-evaluate module boundaries.

### Dependency Risks

**Risk**: Assumptions about existing tooling (TS config, test runner) are off

* **Impact**: Medium.
* **Likelihood**: Medium.
* **Mitigation**:

  * Align test and build setups with existing repo standards before adding new tasks.
* **Fallback**:

  * If test path conventions differ, adapt locations while preserving module boundaries.

### Scope Risks

**Risk**: Over-expansion into new UX features (sorting, bookmarking, filters)

* **Impact**: Medium — delays core refactor.
* **Likelihood**: Medium.
* **Mitigation**:

  * Keep MVP focused strictly on modularization + real data + existing views.
* **Fallback**:

  * Defer enhancements to separate PRD or later phases, reusing this foundation.

10. Appendix

---

### References

* Existing SPA implementation in `index.html` (Registry Atlas UI).
* Earlier registry grouping discussion and data model proposal (“Component registry grouping”).
* System instruction for module design and avoidance of god modules.
* General project rules prioritizing full, sustainable implementations.
* Frontend design skill guidelines (for preserving aesthetic quality).
* RPG PRD template and Task Master integration guidance.

### Glossary

* **Registry**: A curated collection of shadcn/ui-based components, focused on one or more themes.
* **Primary focus**: High-level category summarizing a registry’s main purpose (AI chat, dashboards, etc.).
* **Component tag**: Granular descriptor for concrete component types (button, chat-window, table, navbar, etc.).
* **Matrix view**: Tabular visualization of registry vs component coverage.

### Open Questions

* Exact list of `PrimaryFocus` and `ComponentTag` values to canonize from the overview document.
* Whether to introduce future integration with TanStack Start routes instead of standalone `index.html`.
* Whether runtime validation of `registries.data.ts` should block builds or only warn in development.

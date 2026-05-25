# Codebase Structure

**Analysis Date:** 2026-05-25

## Directory Layout

```text
registry-atlas/
├── .codex/                     # GSD workflow, skill, hook, and local agent configuration
├── .github/workflows/           # GitHub Actions deployment workflow
├── .planning/codebase/          # GSD-generated codebase reference documents
├── .taskmaster/                 # Taskmaster project state, docs, reports, and task files
├── docs/                        # Product/data maintenance docs and future enhancement notes
├── public/                      # Static assets copied by Vite as-is
│   ├── registry-atlas/          # Favicons and web manifest
│   ├── screenshots/             # README screenshots
│   └── styles/                  # App stylesheet served from `/styles/...`
├── src/                         # TypeScript source and starter remnants
│   └── registry-explorer/       # Actual Registry Atlas SPA implementation
│       ├── core/                # Pure domain types, vocabularies, and transformations
│       ├── data/                # Static typed registry dataset
│       ├── ui/                  # DOM state shell and view renderers
│       └── entry.ts             # Browser bootstrap module
├── tests/registry-explorer/     # Core behavior and configuration tests
├── index.html                   # Main Vite HTML entry and app DOM shell
├── package.json                 # Project scripts and dev dependencies
├── pnpm-lock.yaml               # pnpm lockfile
├── tsconfig.json                # Strict TypeScript configuration
└── vite.config.ts               # Vite config with GitHub Pages base path
```

## Directory Purposes

**`.codex/`:**
- Purpose: Store GSD workflow runtime assets, project-local skills, hooks, and Codex configuration.
- Contains: `.codex/skills/`, `.codex/get-shit-done/`, `.codex/hooks/`, `.codex/config.toml`, `.codex/gsd-file-manifest.json`
- Key files: `.codex/skills/gsd-map-codebase/SKILL.md`, `.codex/get-shit-done/workflows/map-codebase.md`, `.codex/hooks.json`

**`.github/workflows/`:**
- Purpose: Define CI/CD automation for static deployment.
- Contains: GitHub Actions workflow YAML files.
- Key files: `.github/workflows/deploy.yml`

**`.planning/codebase/`:**
- Purpose: Store generated codebase maps consumed by GSD planning and execution commands.
- Contains: Architecture and structure reference documents for this focus area.
- Key files: `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/STRUCTURE.md`

**`.taskmaster/`:**
- Purpose: Store task-management state and generated planning artifacts.
- Contains: `.taskmaster/docs/`, `.taskmaster/reports/`, `.taskmaster/tasks/`, `.taskmaster/config.json`, `.taskmaster/state.json`
- Key files: `.taskmaster/config.json`, `.taskmaster/state.json`

**`docs/`:**
- Purpose: Store human-readable project docs, data maintenance notes, grouping rationale, and enhancement backlog.
- Contains: Markdown docs and `docs/todo/` notes.
- Key files: `docs/registry-explorer-data.md`, `docs/Component registry grouping.md`, `docs/Community registry overview.md`, `docs/future-enhancements.md`

**`public/`:**
- Purpose: Store static files served or copied by Vite without TypeScript bundling.
- Contains: Favicons, manifest, screenshots, legacy HTML, Vite SVG, and CSS.
- Key files: `public/styles/registry-explorer.css`, `public/registry-atlas/site.webmanifest`, `public/screenshots/ss-0.png`

**`src/`:**
- Purpose: Store TypeScript source files.
- Contains: `src/registry-explorer/` plus Vite starter remnants.
- Key files: `src/registry-explorer/entry.ts`, `src/main.ts`, `src/counter.ts`, `src/style.css`, `src/typescript.svg`

**`src/registry-explorer/`:**
- Purpose: Contain the actual Registry Atlas SPA.
- Contains: `core/`, `data/`, `ui/`, and `entry.ts`.
- Key files: `src/registry-explorer/entry.ts`

**`src/registry-explorer/core/`:**
- Purpose: Store pure domain logic, schema, labels, and matrix configuration.
- Contains: Type unions, value arrays, interfaces, label mappers, grouping/filtering/metrics functions, and matrix columns.
- Key files: `src/registry-explorer/core/registry.schema.ts`, `src/registry-explorer/core/grouping.ts`, `src/registry-explorer/core/labels.ts`, `src/registry-explorer/core/matrixColumns.ts`, `src/registry-explorer/core/index.ts`

**`src/registry-explorer/data/`:**
- Purpose: Store the static registry catalog.
- Contains: A single typed `registries` array with 85 records.
- Key files: `src/registry-explorer/data/registries.data.ts`

**`src/registry-explorer/ui/`:**
- Purpose: Store DOM renderers and the UI orchestration shell.
- Contains: State shell, focus view, component view, matrix view, and a barrel export.
- Key files: `src/registry-explorer/ui/shell.ts`, `src/registry-explorer/ui/focusView.ts`, `src/registry-explorer/ui/componentView.ts`, `src/registry-explorer/ui/matrixView.ts`, `src/registry-explorer/ui/index.ts`

**`tests/registry-explorer/`:**
- Purpose: Store Vitest-style tests for core behavior and core configuration.
- Contains: Focus/component grouping tests, filtering tests, metrics tests, matrix row tests, and matrix column tests.
- Key files: `tests/registry-explorer/grouping.test.ts`, `tests/registry-explorer/matrixColumns.test.ts`

## Key File Locations

**Entry Points:**
- `index.html`: Vite HTML entry, static DOM shell, CSS link, and module script.
- `src/registry-explorer/entry.ts`: Browser bootstrap that starts the Registry Explorer.
- `src/main.ts`: Starter placeholder that points to `src/registry-explorer/entry.ts`.

**Configuration:**
- `package.json`: Defines `dev`, `build`, `preview`, and `code` scripts.
- `tsconfig.json`: Defines strict TypeScript compiler settings and includes `src`.
- `vite.config.ts`: Defines Vite base path `/Registry-Atlas/`.
- `.github/workflows/deploy.yml`: Defines GitHub Pages deployment.

**Core Logic:**
- `src/registry-explorer/core/registry.schema.ts`: Add or update registry schema fields, `PrimaryFocus`, `ComponentTag`, and value arrays here.
- `src/registry-explorer/core/grouping.ts`: Add filtering, grouping, sorting, metrics, or matrix row transformations here.
- `src/registry-explorer/core/labels.ts`: Add display labels for controlled vocabulary values here.
- `src/registry-explorer/core/matrixColumns.ts`: Add or reorder matrix columns here.

**Data:**
- `src/registry-explorer/data/registries.data.ts`: Add or edit registry records here.

**UI:**
- `src/registry-explorer/ui/shell.ts`: Add app state, event orchestration, and view routing here.
- `src/registry-explorer/ui/focusView.ts`: Add focus-view aside or content markup here.
- `src/registry-explorer/ui/componentView.ts`: Add component-view aside or content markup here.
- `src/registry-explorer/ui/matrixView.ts`: Add matrix-view aside or table markup here.
- `public/styles/registry-explorer.css`: Add or adjust visual styling for emitted UI classes here.

**Testing:**
- `tests/registry-explorer/grouping.test.ts`: Add tests for `src/registry-explorer/core/grouping.ts`.
- `tests/registry-explorer/matrixColumns.test.ts`: Add tests for `src/registry-explorer/core/matrixColumns.ts`.

**Documentation:**
- `README.md`: User-facing overview, screenshots, setup, and architecture summary.
- `docs/registry-explorer-data.md`: Data model and maintenance workflow.
- `docs/Component registry grouping.md`: Original grouping rationale and target views.
- `.planning/codebase/ARCHITECTURE.md`: Architecture reference for GSD agents.
- `.planning/codebase/STRUCTURE.md`: File placement reference for GSD agents.

## Naming Conventions

**Files:**
- Feature entry files use `entry.ts`, as in `src/registry-explorer/entry.ts`.
- Domain schema files use `.schema.ts`, as in `src/registry-explorer/core/registry.schema.ts`.
- Domain configuration files use descriptive camelCase names, as in `src/registry-explorer/core/matrixColumns.ts`.
- Domain transformation files use descriptive nouns, as in `src/registry-explorer/core/grouping.ts` and `src/registry-explorer/core/labels.ts`.
- Static data files use `.data.ts`, as in `src/registry-explorer/data/registries.data.ts`.
- View renderers use `<viewName>View.ts`, as in `src/registry-explorer/ui/focusView.ts`, `src/registry-explorer/ui/componentView.ts`, and `src/registry-explorer/ui/matrixView.ts`.
- Barrel exports use `index.ts`, as in `src/registry-explorer/core/index.ts` and `src/registry-explorer/ui/index.ts`.
- Tests use `.test.ts`, as in `tests/registry-explorer/grouping.test.ts`.

**Directories:**
- Feature directories use kebab-case, as in `src/registry-explorer/` and `tests/registry-explorer/`.
- Layer directories use short lowercase nouns, as in `src/registry-explorer/core/`, `src/registry-explorer/data/`, and `src/registry-explorer/ui/`.
- Static asset group directories use lowercase descriptive names, as in `public/screenshots/`, `public/styles/`, and `public/registry-atlas/`.
- GSD planning outputs use `.planning/codebase/` with uppercase document filenames.

## Where to Add New Code

**New Registry Record:**
- Primary code: `src/registry-explorer/data/registries.data.ts`
- Schema reference: `src/registry-explorer/core/registry.schema.ts`
- Documentation: `docs/registry-explorer-data.md`
- Tests: Add or update core behavior tests in `tests/registry-explorer/grouping.test.ts` when the data change depends on new grouping behavior.

**New Focus Category:**
- Primary code: `src/registry-explorer/core/registry.schema.ts`
- Label: `src/registry-explorer/core/labels.ts`
- Data usage: `src/registry-explorer/data/registries.data.ts`
- Tests: `tests/registry-explorer/grouping.test.ts`

**New Component Tag:**
- Primary code: `src/registry-explorer/core/registry.schema.ts`
- Display behavior: `src/registry-explorer/core/labels.ts`
- Data usage: `src/registry-explorer/data/registries.data.ts`
- Tests: `tests/registry-explorer/grouping.test.ts`

**New Matrix Column:**
- Primary code: `src/registry-explorer/core/matrixColumns.ts`
- Tests: `tests/registry-explorer/matrixColumns.test.ts`
- UI: `src/registry-explorer/ui/matrixView.ts` only if rendering behavior changes.

**New View Mode:**
- Primary code: `src/registry-explorer/ui/shell.ts`
- Renderer: Add `src/registry-explorer/ui/<newView>View.ts`
- Barrel export: `src/registry-explorer/ui/index.ts`
- HTML control: Add a new tab button to `index.html`
- Styles: `public/styles/registry-explorer.css`
- Core derivation: Add pure transformations to `src/registry-explorer/core/` when the view needs new derived data.
- Tests: Add pure logic tests under `tests/registry-explorer/`.

**New Core Transformation:**
- Primary code: `src/registry-explorer/core/grouping.ts`
- Types: `src/registry-explorer/core/registry.schema.ts`
- Tests: `tests/registry-explorer/grouping.test.ts`

**New DOM Root or Global Control:**
- HTML: `index.html`
- Root typing and wiring: `src/registry-explorer/ui/shell.ts`
- Root lookup: `src/registry-explorer/entry.ts`
- Styles: `public/styles/registry-explorer.css`

**New Component/Module:**
- Implementation: Place feature-specific source under `src/registry-explorer/<layer>/`.
- Export: Add to `src/registry-explorer/core/index.ts` or `src/registry-explorer/ui/index.ts` only when another module imports through the barrel.
- Tests: Mirror the feature under `tests/registry-explorer/`.

**Utilities:**
- Shared core helpers: `src/registry-explorer/core/`
- UI-only helpers: Keep local to the renderer file in `src/registry-explorer/ui/` unless used by multiple renderers.
- HTML escaping: Preserve or centralize the renderer-local `escapeHtml` pattern from `src/registry-explorer/ui/focusView.ts`, `src/registry-explorer/ui/componentView.ts`, and `src/registry-explorer/ui/matrixView.ts` if reuse expands.

**Styles and Assets:**
- App styles: `public/styles/registry-explorer.css`
- Favicons/manifest: `public/registry-atlas/`
- README screenshots: `public/screenshots/`
- Avoid adding app CSS to `src/style.css`; the active page links `public/styles/registry-explorer.css` from `index.html`.

**Planning Documentation:**
- Codebase maps: `.planning/codebase/`
- Product/data docs: `docs/`
- Taskmaster artifacts: `.taskmaster/`
- Follow GSD skill expectations from `.codex/skills/gsd-map-codebase/SKILL.md` when refreshing `.planning/codebase/` documents.

## Special Directories

**`.planning/codebase/`:**
- Purpose: GSD codebase intelligence documents.
- Generated: Yes
- Committed: Yes

**`.codex/skills/`:**
- Purpose: Project-local GSD command skills and workflow adapters.
- Generated: Yes
- Committed: Yes

**`.codex/get-shit-done/`:**
- Purpose: GSD workflow definitions, templates, references, and command runtime support.
- Generated: Yes
- Committed: Yes

**`.taskmaster/`:**
- Purpose: Taskmaster planning and project tracking state.
- Generated: Yes
- Committed: Yes

**`dist/`:**
- Purpose: Vite production build output deployed by GitHub Pages.
- Generated: Yes
- Committed: Present in the working tree; do not edit source behavior directly in `dist/`.

**`node_modules/`:**
- Purpose: Installed package dependencies.
- Generated: Yes
- Committed: No

**`public/`:**
- Purpose: Static files copied or served by Vite.
- Generated: No
- Committed: Yes

**`public/styles/`:**
- Purpose: Active stylesheet location for `index.html`.
- Generated: No
- Committed: Yes

**`public/screenshots/`:**
- Purpose: README screenshot assets.
- Generated: No
- Committed: Yes

**`.archived/`:**
- Purpose: Archived source prompts and older Taskmaster materials.
- Generated: No
- Committed: Yes

**`.serena/`:**
- Purpose: Serena project metadata and caches.
- Generated: Yes
- Committed: Partially, based on tracked project metadata and ignored caches.

---

*Structure analysis: 2026-05-25*

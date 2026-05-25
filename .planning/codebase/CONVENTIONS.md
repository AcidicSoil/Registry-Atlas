# Coding Conventions

**Analysis Date:** 2026-05-25

## Naming Patterns

**Files:**
- Use domain-oriented camelCase TypeScript module names for app code: `src/registry-explorer/core/grouping.ts`, `src/registry-explorer/core/matrixColumns.ts`, `src/registry-explorer/ui/focusView.ts`, `src/registry-explorer/ui/componentView.ts`, `src/registry-explorer/ui/matrixView.ts`.
- Use `.schema.ts` for shared type vocabularies and interfaces: `src/registry-explorer/core/registry.schema.ts`.
- Use `.data.ts` for static typed datasets: `src/registry-explorer/data/registries.data.ts`.
- Use `.test.ts` for unit tests in the parallel `tests/` tree: `tests/registry-explorer/grouping.test.ts`, `tests/registry-explorer/matrixColumns.test.ts`.
- Avoid adding new runtime code to deprecated scaffold files: `src/main.ts` and `src/counter.ts` are empty or deprecated placeholders.

**Functions:**
- Use camelCase named functions with direct exports for reusable behavior: `filterRegistries`, `buildFocusGroups`, `buildComponentGroups`, `buildMatrixRows`, and `computeMetrics` in `src/registry-explorer/core/grouping.ts`.
- Use `render*` prefixes for DOM rendering functions: `renderFocusAside`, `renderFocusContent`, `renderComponentAside`, `renderComponentContent`, `renderMatrixAside`, and `renderMatrixContent` in `src/registry-explorer/ui/`.
- Use `init*` for app bootstrap/orchestration entry points: `initRegistryExplorer` in `src/registry-explorer/ui/shell.ts`.
- Use local helpers for module-private implementation details: `escapeHtml` in `src/registry-explorer/ui/focusView.ts`, `src/registry-explorer/ui/componentView.ts`, and `src/registry-explorer/ui/matrixView.ts`.

**Variables:**
- Use camelCase for local variables and object properties that are app-owned: `searchTerm`, `selectedFocus`, `selectedComponent`, `contentHeader`, `contentBody` in `src/registry-explorer/entry.ts` and `src/registry-explorer/ui/shell.ts`.
- Preserve source-data snake_case fields in the `Registry` data model: `primary_focus` and `component_tags` in `src/registry-explorer/core/registry.schema.ts` and `src/registry-explorer/data/registries.data.ts`.
- Use uppercase snake case for exported constant vocabularies and matrix configuration: `PRIMARY_FOCUS_VALUES`, `COMPONENT_TAG_VALUES`, and `MATRIX_COLUMNS` in `src/registry-explorer/core/`.
- Use concise collection names for derived view data: `groups`, `rows`, `metrics`, `filtered`, and `registries` in `src/registry-explorer/core/grouping.ts` and `src/registry-explorer/ui/shell.ts`.

**Types:**
- Use PascalCase for type aliases and interfaces: `PrimaryFocus`, `ComponentTag`, `Registry`, `FocusGroup`, `ComponentGroup`, `MatrixRow`, and `RegistryExplorerMetrics` in `src/registry-explorer/core/registry.schema.ts`.
- Use discriminated string-union vocabularies for controlled data values instead of free-form strings: `PrimaryFocus` and `ComponentTag` in `src/registry-explorer/core/registry.schema.ts`.
- Use `readonly` array inputs for pure logic that should not mutate callers: `readonly Registry[]` and `readonly ComponentTag[]` in `src/registry-explorer/core/grouping.ts`.
- Use local interfaces for module-specific API surfaces: `ShellOptions` and `AppState` in `src/registry-explorer/ui/shell.ts`.

## Code Style

**Formatting:**
- No Prettier, EditorConfig, Biome, or formatter config is present. Formatting is maintained by TypeScript/Vite defaults and local convention.
- Use two-space indentation in TypeScript and JSON, matching `src/registry-explorer/core/grouping.ts`, `src/registry-explorer/ui/shell.ts`, `package.json`, and `tsconfig.json`.
- Use single quotes for TypeScript string literals and import specifiers in source and tests: `src/registry-explorer/entry.ts`, `src/registry-explorer/core/grouping.ts`, and `tests/registry-explorer/grouping.test.ts`.
- Keep trailing commas in multiline import/type lists and object literals where the surrounding file already uses them: `src/registry-explorer/core/grouping.ts`, `src/registry-explorer/ui/shell.ts`, and `src/registry-explorer/core/registry.schema.ts`.
- HTML-rendering modules build template strings and assign `innerHTML`; escape user/data-derived strings with the local `escapeHtml` helper before interpolation, as in `src/registry-explorer/ui/focusView.ts`, `src/registry-explorer/ui/componentView.ts`, and `src/registry-explorer/ui/matrixView.ts`.

**Linting:**
- No ESLint config is present.
- TypeScript compiler strictness is the primary static quality gate in `tsconfig.json`.
- `tsconfig.json` enables `strict`, `noUnusedLocals`, `noUnusedParameters`, `erasableSyntaxOnly`, `noFallthroughCasesInSwitch`, and `noUncheckedSideEffectImports`.
- `tsconfig.json` includes only `src`, so source files are type-checked by `pnpm build` but tests under `tests/` are not included in the configured TypeScript program.
- `package.json` defines `pnpm build` as `tsc && vite build`; use that command as the configured validation gate for production code.

## Import Organization

**Order:**
1. Type-only imports first when a module consumes interfaces or string unions only: `import type { Registry } from '../core/registry.schema';` in `src/registry-explorer/data/registries.data.ts`.
2. Runtime imports from core helpers/config next: `src/registry-explorer/ui/shell.ts` imports grouping functions and `MATRIX_COLUMNS` before view renderers.
3. Local sibling view/module imports last: `src/registry-explorer/ui/shell.ts` imports `./focusView`, `./componentView`, and `./matrixView` after core imports.

**Path Aliases:**
- No path aliases are configured in `tsconfig.json` or `vite.config.ts`.
- Use relative imports inside `src/registry-explorer/`: `./ui`, `./data/registries.data`, `../core/grouping`, and `../core/labels`.
- Tests use relative imports back to source files: `../../src/registry-explorer/core/grouping` and `../../src/registry-explorer/core/registry.schema` in `tests/registry-explorer/grouping.test.ts`.

## Error Handling

**Patterns:**
- Keep core functions pure and non-throwing for normal empty/filter cases: `filterRegistries`, `buildFocusGroups`, `buildComponentGroups`, `buildMatrixRows`, and `computeMetrics` in `src/registry-explorer/core/grouping.ts`.
- Catch bootstrap failures at the entry boundary and log contextual messages: `src/registry-explorer/entry.ts` wraps DOM initialization in `try/catch` and logs `Registry Explorer: Initialization failed`.
- Detect missing DOM roots explicitly before initializing the shell: `src/registry-explorer/entry.ts` logs `Registry Explorer: Missing DOM roots`.
- Catch render failures inside the shell render loop and show an inline empty/error state: `src/registry-explorer/ui/shell.ts`.
- Use optional chaining in tests and lookups where a result might not exist: `aiGroup?.count`, `supportGroup?.registries[0].name`, and `alphaRow?.coverage` in `tests/registry-explorer/grouping.test.ts`.

## Logging

**Framework:** console

**Patterns:**
- Use `console.error` only at app boundaries where failures affect initialization or rendering: `src/registry-explorer/entry.ts` and `src/registry-explorer/ui/shell.ts`.
- Include a stable subsystem prefix in log messages: `Registry Explorer: Missing DOM roots`, `Registry Explorer: Initialization failed`, and `Registry Explorer: Render failed`.
- Do not log inside pure data transformation modules: `src/registry-explorer/core/grouping.ts`, `src/registry-explorer/core/labels.ts`, and `src/registry-explorer/core/matrixColumns.ts`.

## Comments

**When to Comment:**
- Prefer comments for short section markers inside orchestration/rendering code: `// Initial State`, `// State Update Logic`, `// Render Loop`, `// Tabs`, and `// Search` in `src/registry-explorer/ui/shell.ts`.
- Use comments to explain non-obvious assumptions or historical intent: `src/registry-explorer/ui/shell.ts` notes why aside event delegation attaches to `roots.aside`.
- Avoid comments for straightforward pure transformations unless they clarify output shape; examples exist in `tests/registry-explorer/grouping.test.ts` for expected group and coverage behavior.
- Keep data-maintenance guidance in docs rather than source comments: `docs/registry-explorer-data.md`.

**JSDoc/TSDoc:**
- Not used in source files.
- Public contracts are expressed through TypeScript interfaces and type aliases in `src/registry-explorer/core/registry.schema.ts` and `src/registry-explorer/ui/shell.ts`.

## Function Design

**Size:** Keep core pure functions small and focused. `src/registry-explorer/core/grouping.ts` uses one function per operation: filtering, focus grouping, component grouping, matrix row building, and metrics computation.

**Parameters:** Pass typed data and primitive state explicitly. Core functions take `registries` plus `search` and optional `columns`; UI renderers take explicit DOM roots and already-derived view data.

**Return Values:** Return new arrays/objects from core functions rather than mutating caller-owned arrays. `filterRegistries` returns a copied array for empty searches, and grouping/matrix functions return derived arrays in `src/registry-explorer/core/grouping.ts`.

## Module Design

**Exports:** Use named exports for functions, types, and constants. Core modules export `Registry` types, label helpers, matrix configuration, and grouping functions from `src/registry-explorer/core/`.

**Barrel Files:** Barrel files are present for controlled re-export convenience: `src/registry-explorer/core/index.ts` and `src/registry-explorer/ui/index.ts`. Use them for stable package-level imports such as `import { initRegistryExplorer } from './ui';` in `src/registry-explorer/entry.ts`.

---

*Convention analysis: 2026-05-25*

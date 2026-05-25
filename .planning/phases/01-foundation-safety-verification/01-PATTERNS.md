# Phase 1: Foundation Safety & Verification - Pattern Map

**Mapped:** 2026-05-25
**Files analyzed:** 25
**Analogs found:** 23 / 25

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `package.json` | config | batch | `package.json` | exact |
| `pnpm-lock.yaml` | config | batch | `pnpm-lock.yaml` | exact-generated |
| `tsconfig.json` | config | batch | `tsconfig.json` | exact |
| `tsconfig.test.json` | config | batch | `tsconfig.json` | role-match |
| `tests/registry-explorer/grouping.test.ts` | test | transform | `tests/registry-explorer/grouping.test.ts` | exact |
| `tests/registry-explorer/matrixColumns.test.ts` | test | transform | `tests/registry-explorer/matrixColumns.test.ts` | exact |
| `tests/registry-explorer/registryData.test.ts` | test | transform | `tests/registry-explorer/matrixColumns.test.ts` + `src/registry-explorer/data/registries.data.ts` | role-match |
| `tests/registry-explorer/renderSafety.test.ts` | test | transform | `tests/registry-explorer/grouping.test.ts` | role-match |
| `src/registry-explorer/core/registry.schema.ts` | model | transform | `src/registry-explorer/core/registry.schema.ts` | exact |
| `src/registry-explorer/core/matrixColumns.ts` | config | transform | `src/registry-explorer/core/matrixColumns.ts` | exact |
| `src/registry-explorer/core/labels.ts` | utility | transform | `src/registry-explorer/core/labels.ts` | exact |
| `src/registry-explorer/data/registries.data.ts` | model | CRUD | `src/registry-explorer/data/registries.data.ts` | exact-read |
| `src/registry-explorer/ui/renderSafety.ts` | utility | transform | `src/registry-explorer/ui/focusView.ts` local `escapeHtml` | role-match |
| `src/registry-explorer/ui/focusView.ts` | component | request-response | `src/registry-explorer/ui/focusView.ts` | exact |
| `src/registry-explorer/ui/componentView.ts` | component | request-response | `src/registry-explorer/ui/componentView.ts` | exact |
| `src/registry-explorer/ui/matrixView.ts` | component | request-response | `src/registry-explorer/ui/matrixView.ts` | exact |
| `src/registry-explorer/ui/shell.ts` | controller | event-driven | `src/registry-explorer/ui/shell.ts` | exact |
| `index.html` | config | request-response | `index.html` | exact |
| `README.md` | config | file-I/O | `README.md` | exact |
| `docs/registry-explorer-data.md` | config | file-I/O | `docs/registry-explorer-data.md` | exact |
| `public/index.legacy.html` | component | request-response | `index.html` | delete-target |
| `public/vite.svg` | config | file-I/O | none | no analog |
| `src/main.ts` | controller | request-response | `src/registry-explorer/entry.ts` | delete-target |
| `src/counter.ts` | utility | event-driven | none | no analog |
| `src/style.css`, `src/typescript.svg` | config | file-I/O | `public/styles/registry-explorer.css`, `index.html` | delete-target |

## Pattern Assignments

### `package.json`, `tsconfig.json`, `tsconfig.test.json` (config, batch)

**Analog:** `package.json` and `tsconfig.json`

**Script pattern** (`package.json` lines 6-14):
```json
"scripts": {
  "dev": "vite",
  "build": "tsc && vite build",
  "preview": "vite preview"
},
"devDependencies": {
  "typescript": "~5.9.3",
  "vite": "^7.2.4",
  "react-grab": "0.1.37"
}
```

**Type-check strictness pattern** (`tsconfig.json` lines 2-25):
```json
"compilerOptions": {
  "target": "ES2022",
  "module": "ESNext",
  "lib": ["ES2022", "DOM", "DOM.Iterable"],
  "types": ["vite/client"],
  "strict": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true,
  "erasableSyntaxOnly": true,
  "noFallthroughCasesInSwitch": true,
  "noUncheckedSideEffectImports": true
},
"include": ["src"]
```

**Planner instruction:** Add explicit scripts beside the existing style, e.g. `test`, `test:watch`, `typecheck`, `typecheck:test`, and optionally `verify`. If adding `tsconfig.test.json`, copy compiler options by extending root config and include `tests/**/*.ts` plus `src/**/*.ts`; do not weaken strict flags.

---

### `tests/registry-explorer/*.test.ts` (test, transform)

**Analog:** `tests/registry-explorer/grouping.test.ts`

**Imports and fixture pattern** (lines 1-33):
```typescript
import { describe, it, expect } from 'vitest';
import {
  filterRegistries,
  buildFocusGroups,
  buildComponentGroups,
  buildMatrixRows,
  computeMetrics
} from '../../src/registry-explorer/core/grouping';
import { Registry } from '../../src/registry-explorer/core/registry.schema';

const mockRegistries: Registry[] = [
  {
    name: 'Alpha',
    url: 'http://a',
    description: 'Alpha desc',
    primary_focus: ['ai-chat'],
    component_tags: ['chatbot', 'button']
  }
];
```

**Assertion pattern** (`grouping.test.ts` lines 35-68):
```typescript
describe('grouping', () => {
  describe('filterRegistries', () => {
    it('returns all registries when search is empty', () => {
      expect(filterRegistries(mockRegistries, '')).toEqual(mockRegistries);
      expect(filterRegistries(mockRegistries, '   ')).toEqual(mockRegistries);
    });

    it('filters by tag', () => {
      const res = filterRegistries(mockRegistries, 'input');
      expect(res).toHaveLength(1);
      expect(res[0].name).toBe('Beta');
    });
  });
});
```

**Vocabulary/config test pattern** (`matrixColumns.test.ts` lines 1-22):
```typescript
import { describe, it, expect } from 'vitest';
import { MATRIX_COLUMNS } from '../../src/registry-explorer/core/matrixColumns';
import { COMPONENT_TAG_VALUES } from '../../src/registry-explorer/core/registry.schema';

describe('matrixColumns', () => {
  it('should have valid component tags', () => {
    MATRIX_COLUMNS.forEach(col => {
      expect(COMPONENT_TAG_VALUES).toContain(col);
    });
  });
});
```

**Planner instruction:** Put new tests under `tests/registry-explorer/`. Keep tests synchronous and DOM-free for `registryData.test.ts` and `renderSafety.test.ts` if testing pure helpers. Import production `registries` for data invariants rather than duplicating the dataset.

---

### `src/registry-explorer/core/registry.schema.ts` (model, transform)

**Analog:** `src/registry-explorer/core/registry.schema.ts`

**Current duplicated vocabulary pattern to refactor** (lines 1-28 and 30-197):
```typescript
export type PrimaryFocus =
  | 'ai-chat'
  | 'support'
  | 'buttons-and-primitives'
  | 'dashboards-and-admin'
  | 'data-display-and-tables'
  | 'auth-and-user'
  | 'forms-and-inputs'
  | 'navigation'
  | 'templates-and-layouts'
  | 'marketing-sections'
  | 'ecommerce'
  | 'misc-utility';

export const PRIMARY_FOCUS_VALUES: readonly PrimaryFocus[] = [
  'ai-chat',
  'support',
  'buttons-and-primitives',
  'dashboards-and-admin',
  'data-display-and-tables',
  'auth-and-user',
  'forms-and-inputs',
  'navigation',
  'templates-and-layouts',
  'marketing-sections',
  'ecommerce',
  'misc-utility',
];
```

**Schema interface pattern** (lines 199-233):
```typescript
export interface Registry {
  name: string;
  url: string;
  description: string;
  primary_focus: PrimaryFocus[];
  component_tags: ComponentTag[];
  framework?: string;
  license?: string;
}
```

**Planner instruction:** Make const arrays canonical:
```typescript
export const PRIMARY_FOCUS_VALUES = [
  'ai-chat',
  'support',
] as const;

export type PrimaryFocus = (typeof PRIMARY_FOCUS_VALUES)[number];
```
Do the same for `COMPONENT_TAG_VALUES` and keep exported interface names unchanged.

---

### `src/registry-explorer/core/matrixColumns.ts`, `src/registry-explorer/core/labels.ts` (config/utility, transform)

**Analog:** `src/registry-explorer/core/matrixColumns.ts`

**Typed config pattern** (lines 1-18):
```typescript
import type { ComponentTag } from './registry.schema';

export const MATRIX_COLUMNS: readonly ComponentTag[] = [
  'chatbot',
  'button',
  'badge',
  'input',
  'select',
  'dropdown',
  'table',
  'chart',
  'auth-form',
  'navbar',
  'tabs',
  'card',
  'modal',
  'hero-section',
];
```

**Label utility pattern** (`labels.ts` lines 1-24):
```typescript
import type { PrimaryFocus, ComponentTag } from './registry.schema';

export function focusLabel(focus: PrimaryFocus): string {
  const map: Record<PrimaryFocus, string> = {
    'ai-chat': 'AI & Chatbot',
    'support': 'Support UIs',
  };
  return map[focus] || focus;
}

export function componentLabel(tag: ComponentTag): string {
  return tag.replace(/-/g, ' ');
}
```

**Planner instruction:** Keep labels in `labels.ts`. Do not move display labels into registry records or matrix config.

---

### `src/registry-explorer/ui/renderSafety.ts` (utility, transform)

**Analog:** duplicated local helpers in `focusView.ts`, `componentView.ts`, and `matrixView.ts`

**Current helper pattern to replace** (`focusView.ts` lines 4-9):
```typescript
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
```

**Anchor sink needing URL validation** (`focusView.ts` lines 87-99):
```typescript
<a href="${escapeHtml(r.url)}" class="registry-url" target="_blank" rel="noreferrer">
  Visit
</a>
<div class="registry-description">
  ${escapeHtml(r.description)}
</div>
```

**Planner instruction:** Create a named-export utility such as `escapeHtml`, `toSafeExternalUrl`, and `renderExternalLink` or similarly local names. Escape `&`, `<`, `>`, `"`, and `'`. Parse URLs with `new URL(value)`, allow `https:` by default, preserve `target="_blank"` and `rel="noreferrer"`, and render invalid links as `Link unavailable: unsupported URL protocol.` without an anchor.

---

### `src/registry-explorer/ui/focusView.ts` (component, request-response)

**Analog:** `src/registry-explorer/ui/focusView.ts`

**Imports and renderer signature pattern** (lines 1-15):
```typescript
import type { FocusGroup, RegistryExplorerMetrics, PrimaryFocus, Registry } from '../core/registry.schema';
import { focusLabel, componentLabel } from '../core/labels';

export function renderFocusAside(
  root: HTMLElement,
  groups: FocusGroup[],
  selectedFocus: PrimaryFocus | null
): void {
```

**Template render pattern** (lines 24-43):
```typescript
const pills = groups
  .map(group => {
    const active = selectedFocus === group.focusKey ? " pill-active" : "";
    return `
      <button class="pill-item${active}" data-focus="${group.focusKey}">
        <span class="pill-item-label">${escapeHtml(group.label)}</span>
        <span class="pill-item-count">${group.count}</span>
      </button>
    `;
  })
  .join("");

root.innerHTML = summary + `<div class="pill-list">${pills}</div>` + footer;
```

**Empty state pattern** (lines 65-72):
```typescript
if (!registries.length) {
   bodyRoot.innerHTML = `
    <div class="empty-state">
       <div class="empty-state-icon">⊘</div>
       <div>No registries match this filter.</div>
       <div>Try clearing the search or selecting a different group.</div>
     </div>`;
   return;
}
```

**Planner instruction:** Keep named `render*` functions and `innerHTML` approach for Phase 1, but import shared render safety helpers and update empty-state copy to the UI-SPEC wording where touched.

---

### `src/registry-explorer/ui/componentView.ts` (component, request-response)

**Analog:** `src/registry-explorer/ui/componentView.ts`

**Imports and selected-group pattern** (lines 1-15 and 46-51):
```typescript
import type { ComponentGroup, RegistryExplorerMetrics, ComponentTag } from '../core/registry.schema';
import { componentLabel, focusLabel } from '../core/labels';

export function renderComponentContent(
  headerRoot: HTMLElement,
  bodyRoot: HTMLElement,
  group: ComponentGroup | null,
  metrics: RegistryExplorerMetrics
): void {
```

**Row render and external link pattern** (lines 84-115):
```typescript
const rows = group.registries.map(r => {
  const focusTags = r.primary_focus
    .map(f => `<span class="chip chip-focus chip-compact">${escapeHtml(focusLabel(f))}</span>`)
    .join("");

  return `
    <div class="component-registry-row">
      <div class="component-registry-main">
        <div style="display: flex; align-items: baseline; gap: 8px;">
          <div class="component-registry-name">${escapeHtml(r.name)}</div>
          <a href="${escapeHtml(r.url)}" class="registry-url" target="_blank" rel="noreferrer">Visit</a>
        </div>
      </div>
    </div>
  `;
}).join("");
```

**Planner instruction:** Preserve component row structure and compact chip patterns. Replace duplicated escaping and raw URL interpolation with shared helper calls.

---

### `src/registry-explorer/ui/matrixView.ts` (component, request-response)

**Analog:** `src/registry-explorer/ui/matrixView.ts`

**Table render pattern** (lines 72-107):
```typescript
const tableRows = rows.map(r => {
  const cells = r.coverage.map(has => {
    const icon = has ? "●" : "";
    const cls = has ? "matrix-icon" : "matrix-empty";
    return `<td class="${cls}">${icon}</td>`;
  }).join("");

  return `
    <tr>
      <td>
        <div class="matrix-registry-name">${escapeHtml(r.registry.name)}</div>
      </td>
      ${cells}
    </tr>
  `;
}).join("");
```

**Planner instruction:** Matrix has no external link sink today; still use shared `escapeHtml` for labels and registry names so all string renderers share one safety boundary.

---

### `src/registry-explorer/ui/shell.ts` (controller, event-driven)

**Analog:** `src/registry-explorer/ui/shell.ts`

**State and render orchestration pattern** (lines 24-49):
```typescript
interface AppState {
  currentView: 'focus' | 'component' | 'matrix';
  selectedFocus: PrimaryFocus | null;
  selectedComponent: ComponentTag | null;
  searchTerm: string;
}

export function initRegistryExplorer(options: ShellOptions): void {
  const { registries, roots } = options;

  let state: AppState = {
    currentView: 'focus',
    selectedFocus: null,
    selectedComponent: null,
    searchTerm: '',
  };

  function setState(partial: Partial<AppState>) {
    state = { ...state, ...partial };
    render();
  }
```

**View delegation pattern** (lines 61-99):
```typescript
const metrics = computeMetrics(registries, state.searchTerm);

if (state.currentView === 'focus') {
  const groups = buildFocusGroups(registries, state.searchTerm);
  renderFocusAside(roots.aside, groups, effectiveFocus);
  renderFocusContent(roots.contentHeader, roots.contentBody, itemsToShow, metrics);
} else if (state.currentView === 'component') {
  const groups = buildComponentGroups(registries, state.searchTerm);
  renderComponentAside(roots.aside, groups, effectiveComponent);
  renderComponentContent(roots.contentHeader, roots.contentBody, selectedGroup || null, metrics);
} else if (state.currentView === 'matrix') {
  const rows = buildMatrixRows(registries, state.searchTerm, MATRIX_COLUMNS);
  renderMatrixAside(roots.aside, MATRIX_COLUMNS, metrics);
  renderMatrixContent(roots.contentHeader, roots.contentBody, rows, MATRIX_COLUMNS, metrics);
}
```

**Error fallback pattern to fix** (lines 100-112):
```typescript
} catch (error) {
  console.error('Registry Explorer: Render failed', error);
  roots.contentBody.innerHTML = `
    <div class="empty-state">
      <div class="empty-state-icon">⚠️</div>
      <div>Something went wrong while rendering the view.</div>
      <div style="font-size: 10px; color: var(--text-muted); margin-top: 8px;">
        ${error instanceof Error ? error.message : 'Unknown error'}
      </div>
    </div>
  `;
}
```

**Event pattern** (lines 117-155):
```typescript
roots.tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const view = tab.getAttribute('data-view') as AppState['currentView'];
    if (view && view !== state.currentView) {
      setState({ currentView: view });
    }
  });
});
```

**Planner instruction:** Keep closure-local state and event listeners. Fix the error fallback by removing raw `error.message` from visible `innerHTML`; log details only. If touching tab parsing, add a local `isView` guard rather than casting arbitrary `data-view`.

---

### `src/registry-explorer/entry.ts` and `index.html` (controller/config, request-response)

**Analog:** `src/registry-explorer/entry.ts`

**Bootstrap pattern** (lines 1-29):
```typescript
import { initRegistryExplorer } from './ui';
import { registries } from './data/registries.data';

function bootstrap() {
  try {
    const aside = document.getElementById('aside');
    const contentHeader = document.getElementById('contentHeader');
    const contentBody = document.getElementById('contentBody');
    const searchInput = document.getElementById('searchInput') as HTMLInputElement;
    const tabs = document.querySelectorAll('.tab');

    if (aside && contentHeader && contentBody && searchInput && tabs.length) {
      initRegistryExplorer({ registries, roots: { aside, contentHeader, contentBody, tabs, searchInput } });
    } else {
      console.error('Registry Explorer: Missing DOM roots');
    }
  } catch (error) {
    console.error('Registry Explorer: Initialization failed', error);
  }
}
```

**Canonical shell pattern** (`index.html` lines 1-12 and 40-72):
```html
<title>Component Registry Explorer</title>
<link rel="stylesheet" href="/styles/registry-explorer.css" />
...
<div class="tabs" role="tablist">
  <button class="tab tab-active" data-view="focus" role="tab">
    <span class="label">By Focus</span>
    <span class="badge">Registry clusters</span>
  </button>
</div>
...
<script type="module" src="/src/registry-explorer/entry.ts"></script>
```

**Planner instruction:** Keep `index.html`, `public/styles/registry-explorer.css`, and `src/registry-explorer/entry.ts` as the only browser app entry surface. UI-SPEC allows changing the title to `Registry Atlas` during cleanup.

---

### `README.md` and `docs/registry-explorer-data.md` (config, file-I/O)

**Analog:** `README.md`

**Architecture docs pattern** (lines 56-83):
````markdown
## Architecture

This project uses a modular vanilla TypeScript architecture, avoiding heavy frontend frameworks to maintain a lightweight footprint while ensuring type safety and testability.

### Directory Structure

```txt
src/registry-explorer/
├── core/               # Pure domain logic and types
├── data/
├── ui/                 # DOM rendering modules
└── entry.ts            # Application bootstrap
```
````

**Maintenance docs pattern** (`docs/registry-explorer-data.md` lines 53-70):
```markdown
### Adding a New Registry

1.  Open `src/registry-explorer/data/registries.data.ts`.
2.  Add a new object to the `registries` array.
3.  Ensure `primary_focus` and `component_tags` use valid keys from the schema.
4.  Run the application to verify the new entry appears in relevant Focus and Component groups.

### Updating Vocabularies

1.  Open `src/registry-explorer/core/registry.schema.ts`.
2.  Add the new key to the `PrimaryFocus` or `ComponentTag` type union.
3.  Add the new key to the corresponding `VALUES` constant array.
```

**Planner instruction:** Update docs to mention `pnpm test`, test type-checking, canonical surface files, and the new const-array vocabulary maintenance flow. Remove stale instructions that require editing both union types and arrays.

---

### Cleanup Targets (delete or remove from deployable surface)

**Analog:** `public/index.legacy.html` compared to `index.html`

**Legacy deployable surface evidence** (`public/index.legacy.html` lines 1-12 and 71-80):
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Component Registry Explorer</title>
  <link rel="stylesheet" href="/styles/registry-explorer.css" />
</head>
...
<script>
  const REGISTRIES = [
    {
      name: "ChatKit UI",
      url: "https://example.com/chatkit",
```

**Tracked starter artifact evidence:** `git ls-files` reports:
```text
public/index.legacy.html
public/vite.svg
src/counter.ts
src/main.ts
src/style.css
src/typescript.svg
```

**Generated output policy evidence:** `dist/` files exist locally, but `git ls-files dist` returned no tracked files during mapping.

**Planner instruction:** Remove `public/index.legacy.html`, `public/vite.svg`, `src/main.ts`, `src/counter.ts`, `src/style.css`, and `src/typescript.svg` if still unused. Do not add `dist/` to source control; since it is currently untracked, document the policy rather than planning drift checks against committed generated files.

## Shared Patterns

### Imports and Module Boundaries
**Source:** `src/registry-explorer/ui/shell.ts` lines 1-11  
**Apply to:** UI modules and shared UI helpers
```typescript
import type { Registry, PrimaryFocus, ComponentTag } from '../core/registry.schema';
import {
  buildFocusGroups,
  buildComponentGroups,
  buildMatrixRows,
  computeMetrics
} from '../core/grouping';
import { MATRIX_COLUMNS } from '../core/matrixColumns';
import { renderFocusAside, renderFocusContent } from './focusView';
```

Use relative imports. Type-only imports come first when consuming interfaces or string unions.

### Pure Core Functions
**Source:** `src/registry-explorer/core/grouping.ts` lines 12-32  
**Apply to:** Vocabulary/data validation helpers if added under `core/`
```typescript
export function filterRegistries(
  registries: readonly Registry[],
  search: string
): Registry[] {
  const term = search.trim().toLowerCase();
  if (!term) return [...registries];

  return registries.filter((r) => {
    const haystack = [
      r.name,
      r.description,
      r.framework || '',
      r.license || '',
      ...r.primary_focus,
      ...r.component_tags,
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(term);
  });
}
```

Keep transformation functions DOM-free and non-throwing for normal empty/filter cases.

### Render Safety
**Source:** `src/registry-explorer/ui/focusView.ts` lines 4-9, 91-99 and `src/registry-explorer/ui/shell.ts` lines 100-112  
**Apply to:** All UI renderer files and render error fallback
```typescript
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
```

Replace this local pattern with a shared helper that also escapes quotes/apostrophes and validates URLs before anchor rendering.

### Test Organization
**Source:** `tests/registry-explorer/grouping.test.ts` lines 1-11 and `tests/registry-explorer/matrixColumns.test.ts` lines 5-22  
**Apply to:** All new tests
```typescript
import { describe, it, expect } from 'vitest';

describe('matrixColumns', () => {
  it('should not be empty', () => {
    expect(MATRIX_COLUMNS.length).toBeGreaterThan(0);
  });
});
```

Keep tests in `tests/registry-explorer/`, use named imports from source, and prefer direct assertions over mocking.

### Logging and Error Boundaries
**Source:** `src/registry-explorer/entry.ts` lines 24-29 and `src/registry-explorer/ui/shell.ts` lines 100-112  
**Apply to:** Bootstrap and render loop only
```typescript
console.error('Registry Explorer: Missing DOM roots');
console.error('Registry Explorer: Initialization failed', error);
console.error('Registry Explorer: Render failed', error);
```

Use the `Registry Explorer:` prefix. Do not log from pure core/data modules.

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `public/vite.svg` | config | file-I/O | Starter asset slated for deletion; no Registry Atlas analog. |
| `src/counter.ts` | utility | event-driven | Empty starter file slated for deletion; no live utility pattern to preserve. |

## Metadata

**Analog search scope:** `src/registry-explorer/**`, `tests/registry-explorer/**`, root config, docs, `public/`, `dist/` tracking status  
**Files scanned:** 36 via `rg --files`, targeted `nl -ba`, `wc -l`, and `git ls-files`  
**Pattern extraction date:** 2026-05-25

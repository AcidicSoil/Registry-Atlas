You are a senior developer. You produce optimized, maintainable code that follows best practices. 

Your task is to review the current codebase and fix the current issues.

Current Issue:
<issue>
{{MESSAGE}}
</issue>

Rules:
- Keep your suggestions concise and focused. Avoid unnecessary explanations or fluff. 
- Your output should be a series of specific, actionable changes.

When approaching this task:
1. Carefully review the provided code.
2. Identify the area thats raising this issue or error and provide a fix.
3. Consider best practices for the specific programming language used.

For each suggested change, provide:
1. A short description of the change (one line maximum).
2. The modified code block.

Use the following format for your output:

[Short Description]
```[language]:[path/to/file]
[code block]
```

Begin fixing the codebase provide your solutions.

My current codebase:
<current_codebase>
<source_code>
src/main.ts
```
import './style.css'
import typescriptLogo from './typescript.svg'
import viteLogo from '/vite.svg'
import { setupCounter } from './counter.ts'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <a href="https://vite.dev" target="_blank">
      <img src="${viteLogo}" class="logo" alt="Vite logo" />
    </a>
    <a href="https://www.typescriptlang.org/" target="_blank">
      <img src="${typescriptLogo}" class="logo vanilla" alt="TypeScript logo" />
    </a>
    <h1>Vite + TypeScript</h1>
    <div class="card">
      <button id="counter" type="button"></button>
    </div>
    <p class="read-the-docs">
      Click on the Vite and TypeScript logos to learn more
    </p>
  </div>
`

setupCounter(document.querySelector<HTMLButtonElement>('#counter')!)
```

src/style.css
```
:root {
  font-family: system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;

  color-scheme: light dark;
  color: rgba(255, 255, 255, 0.87);
  background-color: #242424;

  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

a {
  font-weight: 500;
  color: #646cff;
  text-decoration: inherit;
}
a:hover {
  color: #535bf2;
}

body {
  margin: 0;
  display: flex;
  place-items: center;
  min-width: 320px;
  min-height: 100vh;
}

h1 {
  font-size: 3.2em;
  line-height: 1.1;
}

#app {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}

.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vanilla:hover {
  filter: drop-shadow(0 0 2em #3178c6aa);
}

.card {
  padding: 2em;
}

.read-the-docs {
  color: #888;
}

button {
  border-radius: 8px;
  border: 1px solid transparent;
  padding: 0.6em 1.2em;
  font-size: 1em;
  font-weight: 500;
  font-family: inherit;
  background-color: #1a1a1a;
  cursor: pointer;
  transition: border-color 0.25s;
}
button:hover {
  border-color: #646cff;
}
button:focus,
button:focus-visible {
  outline: 4px auto -webkit-focus-ring-color;
}

@media (prefers-color-scheme: light) {
  :root {
    color: #213547;
    background-color: #ffffff;
  }
  a:hover {
    color: #747bff;
  }
  button {
    background-color: #f9f9f9;
  }
}
```

src/registry-explorer/entry.ts
```
import { initRegistryExplorer } from './ui';
import { registries } from './data/registries.data';

// Wait for DOM
function bootstrap() {
  try {
    const aside = document.getElementById('aside');
    const contentHeader = document.getElementById('contentHeader');
    const contentBody = document.getElementById('contentBody');
    const searchInput = document.getElementById('searchInput') as HTMLInputElement;
    const tabs = document.querySelectorAll('.tab');

    if (aside && contentHeader && contentBody && searchInput && tabs.length) {
      initRegistryExplorer({
        registries,
        roots: {
          aside,
          contentHeader,
          contentBody,
          tabs,
          searchInput,
        },
      });
    } else {
      console.error('Registry Explorer: Missing DOM roots');
    }
  } catch (error) {
    console.error('Registry Explorer: Initialization failed', error);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
```

src/registry-explorer/core/grouping.ts
```
import type {
  Registry,
  FocusGroup,
  ComponentGroup,
  MatrixRow,
  RegistryExplorerMetrics,
  ComponentTag,
  PrimaryFocus,
} from './registry.schema';
import { focusLabel, componentLabel } from './labels';

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

export function buildFocusGroups(
  registries: readonly Registry[],
  search: string
): FocusGroup[] {
  const filtered = filterRegistries(registries, search);
  const groups = new Map<PrimaryFocus, Registry[]>();

  filtered.forEach((r) => {
    r.primary_focus.forEach((f) => {
      if (!groups.has(f)) {
        groups.set(f, []);
      }
      groups.get(f)!.push(r);
    });
  });

  const result: FocusGroup[] = [];
  groups.forEach((items, key) => {
    result.push({
      focusKey: key,
      label: focusLabel(key),
      registries: items.sort((a, b) => a.name.localeCompare(b.name)),
      count: items.length,
    });
  });

  return result.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return a.label.localeCompare(b.label);
  });
}

export function buildComponentGroups(
  registries: readonly Registry[],
  search: string
): ComponentGroup[] {
  const filtered = filterRegistries(registries, search);
  const groups = new Map<ComponentTag, Registry[]>();

  filtered.forEach((r) => {
    r.component_tags.forEach((t) => {
      if (!groups.has(t)) {
        groups.set(t, []);
      }
      groups.get(t)!.push(r);
    });
  });

  const result: ComponentGroup[] = [];
  groups.forEach((items, key) => {
    result.push({
      componentKey: key,
      label: componentLabel(key),
      registries: items.sort((a, b) => a.name.localeCompare(b.name)),
      count: items.length,
    });
  });

  return result.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return a.label.localeCompare(b.label);
  });
}

export function buildMatrixRows(
  registries: readonly Registry[],
  search: string,
  columns: readonly ComponentTag[]
): MatrixRow[] {
  const filtered = filterRegistries(registries, search);
  // Sort rows by name
  const sorted = [...filtered].sort((a, b) => a.name.localeCompare(b.name));

  return sorted.map((r) => {
    const coverage = columns.map((col) => r.component_tags.includes(col));
    return {
      registry: r,
      coverage,
    };
  });
}

export function computeMetrics(
  registries: readonly Registry[],
  search: string
): RegistryExplorerMetrics {
  const filtered = filterRegistries(registries, search);
  
  const focuses = new Set<PrimaryFocus>();
  filtered.forEach(r => r.primary_focus.forEach(f => focuses.add(f)));

  const components = new Set<ComponentTag>();
  filtered.forEach(r => r.component_tags.forEach(c => components.add(c)));

  return {
    totalRegistries: registries.length,
    visibleRegistries: filtered.length,
    focusGroupCount: focuses.size,
    componentTypeCount: components.size,
  };
}
```

src/registry-explorer/core/index.ts
```
export * from './registry.schema';
export * from './labels';
export * from './matrixColumns';
export * from './grouping';
```

src/registry-explorer/core/labels.ts
```
import type { PrimaryFocus, ComponentTag } from './registry.schema';

export function focusLabel(focus: PrimaryFocus): string {
  const map: Record<PrimaryFocus, string> = {
    'ai-chat': 'AI & Chatbot',
    'support': 'Support UIs',
    'forms-and-inputs': 'Forms & Inputs',
    'buttons-and-primitives': 'Buttons & Primitives',
    'dashboards-and-admin': 'Dashboards & Admin',
    'marketing-sections': 'Marketing Sections',
    'ecommerce': 'Ecommerce',
    'auth-and-user': 'Auth & User',
    'data-display-and-tables': 'Data Display & Tables',
    'navigation': 'Navigation',
    'templates-and-layouts': 'Layouts & Templates',
    'misc-utility': 'Utility & Misc',
  };
  return map[focus] || focus;
}

export function componentLabel(tag: ComponentTag): string {
  // Replace hyphens with spaces
  return tag.replace(/-/g, ' ');
}
```

src/registry-explorer/core/matrixColumns.ts
```
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

src/registry-explorer/core/registry.schema.ts
```
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

export type ComponentTag =
  | 'chatbot'
  | 'chat-window'
  | 'message-list'
  | 'typing-indicator'
  | 'prompt-box'
  | 'button'
  | 'input'
  | 'badge'
  | 'avatar'
  | 'toolbar'
  | 'icon-button'
  | 'loading-button'
  | 'toggle'
  | 'switch'
  | 'select'
  | 'textarea'
  | 'table'
  | 'data-grid'
  | 'filter-bar'
  | 'pagination'
  | 'chart'
  | 'stat-widget'
  | 'auth-form'
  | 'password-input'
  | 'stepper'
  | 'alert'
  | 'navbar'
  | 'sidebar'
  | 'breadcrumb'
  | 'app-shell'
  | 'tabs'
  | 'dropdown'
  | 'hero-section'
  | 'feature-grid'
  | 'testimonial'
  | 'cta-section'
  | 'card'
  | 'product-card'
  | 'price-badge'
  | 'cart-drawer'
  | 'mini-cart'
  | 'column-resize'
  | 'search-input'
  | 'tag-input'
  | 'checkbox'
  | 'radio'
  | 'datepicker'
  | 'submit-button'
  | 'error-message'
  | 'toast'
  | 'modal'
  | 'drawer'
  | 'skeleton'
  | 'spinner'
  | 'accordion'
  | 'calendar'
  | 'carousel'
  | 'collapsible'
  | 'combobox'
  | 'command'
  | 'context-menu'
  | 'hover-card'
  | 'menubar'
  | 'popover'
  | 'progress'
  | 'radio-group'
  | 'scroll-area'
  | 'separator'
  | 'sheet'
  | 'slider'
  | 'tooltip'
  | 'file-upload'
  | 'dropzone'
  | 'pricing-table';

export const COMPONENT_TAG_VALUES: readonly ComponentTag[] = [
  'chatbot',
  'chat-window',
  'message-list',
  'typing-indicator',
  'prompt-box',
  'button',
  'input',
  'badge',
  'avatar',
  'toolbar',
  'icon-button',
  'loading-button',
  'toggle',
  'switch',
  'select',
  'textarea',
  'table',
  'data-grid',
  'filter-bar',
  'pagination',
  'chart',
  'stat-widget',
  'auth-form',
  'password-input',
  'stepper',
  'alert',
  'navbar',
  'sidebar',
  'breadcrumb',
  'app-shell',
  'tabs',
  'dropdown',
  'hero-section',
  'feature-grid',
  'testimonial',
  'cta-section',
  'card',
  'product-card',
  'price-badge',
  'cart-drawer',
  'mini-cart',
  'column-resize',
  'search-input',
  'tag-input',
  'checkbox',
  'radio',
  'datepicker',
  'submit-button',
  'error-message',
  'toast',
  'modal',
  'drawer',
  'skeleton',
  'spinner',
  'accordion',
  'calendar',
  'carousel',
  'collapsible',
  'combobox',
  'command',
  'context-menu',
  'hover-card',
  'menubar',
  'popover',
  'progress',
  'radio-group',
  'scroll-area',
  'separator',
  'sheet',
  'slider',
  'tooltip',
  'file-upload',
  'dropzone',
  'pricing-table',
];

export interface Registry {
  name: string;
  url: string;
  description: string;
  primary_focus: PrimaryFocus[];
  component_tags: ComponentTag[];
  framework?: string;
  license?: string;
}

export interface FocusGroup {
  focusKey: PrimaryFocus;
  label: string;
  registries: Registry[];
  count: number;
}

export interface ComponentGroup {
  componentKey: ComponentTag;
  label: string;
  registries: Registry[];
  count: number;
}

export interface MatrixRow {
  registry: Registry;
  coverage: boolean[];
}

export interface RegistryExplorerMetrics {
  totalRegistries: number;
  visibleRegistries: number;
  focusGroupCount: number;
  componentTypeCount: number;
}
```

src/registry-explorer/ui/componentView.ts
```
import type { ComponentGroup, RegistryExplorerMetrics, ComponentTag } from '../core/registry.schema';
import { componentLabel, focusLabel } from '../core/labels';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function renderComponentAside(
  root: HTMLElement,
  groups: ComponentGroup[],
  selectedComponent: ComponentTag | null
): void {
  const summary = `
    <div class="aside-header">
      <div class="aside-title">Component index</div>
      <div class="aside-summary">
        Choose a <span class="em">component type</span> to see who ships it.
      </div>
    </div>`;

  const pills = groups
    // .slice(0, 32) // Removed limit to show all
    .map(group => {
      const active = selectedComponent === group.componentKey ? " pill-active" : "";
      return `
        <button class="pill-item${active}" data-component="${group.componentKey}">
          <span class="pill-item-label">${escapeHtml(group.label)}</span>
          <span class="pill-item-count">${group.count}</span>
        </button>
      `;
    })
    .join("");

  const footer = `
    <div class="aside-footer">
      <span class="muted-em">Filter by component</span>
      <span class="key">Component → registries</span>
    </div>`;

  root.innerHTML = summary + `<div class="pill-list">${pills}</div>` + footer;
}

export function renderComponentContent(
  headerRoot: HTMLElement,
  bodyRoot: HTMLElement,
  group: ComponentGroup | null,
  metrics: RegistryExplorerMetrics
): void {
  // Header
  headerRoot.innerHTML = `
    <div class="content-heading">
      <div class="content-title">Registries by component</div>
      <div class="content-subtitle">
        Start from the component you need; see every registry that ships it.
      </div>
    </div>
    <div class="content-metrics">
      <span><strong>${metrics.visibleRegistries}</strong> registries</span>
      <span><strong>${metrics.componentTypeCount}</strong> component types</span>
    </div>`;

  // Body
  if (!group) {
    bodyRoot.innerHTML = `
      <div class="empty-state">
         <div class="empty-state-icon">◎</div>
         <div>Select a component type in the left panel.</div>
       </div>`;
    return;
  }

  if (!group.registries.length) {
    bodyRoot.innerHTML = `
      <div class="empty-state">
         <div class="empty-state-icon">⊘</div>
         <div>No registries currently expose this component after filtering.</div>
       </div>`;
    return;
  }

  const rows = group.registries.map(r => {
    const focusTags = r.primary_focus
      .map(f => `<span class="chip chip-focus chip-compact">${escapeHtml(focusLabel(f))}</span>`)
      .join("");
    const extraTags = r.component_tags
      .filter(t => t !== group.componentKey)
      .slice(0, 3)
      .map(t => `<span class="chip chip-tag chip-compact">${escapeHtml(componentLabel(t))}</span>`)
      .join("");
    const extraCount = r.component_tags.length - 1 - 3; // -1 for selected, -3 shown
    const moreChip = extraCount > 0
      ? `<span class="chip chip-compact chip-tag">+${extraCount} more</span>`
      : "";

            return `
              <div class="component-registry-row">
                <div class="component-registry-main">
                  <div style="display: flex; align-items: baseline; gap: 8px;">
                    <div class="component-registry-name">${escapeHtml(r.name)}</div>
                    <a href="${escapeHtml(r.url)}" class="registry-url" target="_blank" rel="noreferrer">Visit</a>
                  </div>
                  <div class="component-registry-description">
                    ${escapeHtml(r.description)}
                  </div>
                </div>
                <div class="component-registry-meta">
                  ${focusTags}
                  ${extraTags}
                  ${moreChip}
                </div>
              </div>
            `;  }).join("");

  bodyRoot.innerHTML = `
    <div class="component-group-list">
      <div class="component-group">
        <div class="component-group-header">
          <div class="component-name">${escapeHtml(group.label)}</div>
          <div class="component-count">${group.registries.length} registries</div>
        </div>
        <div class="component-group-body">
          ${rows}
        </div>
      </div>
    </div>
  `;
}
```

src/registry-explorer/ui/focusView.ts
```
import type { FocusGroup, RegistryExplorerMetrics, PrimaryFocus, Registry } from '../core/registry.schema';
import { focusLabel, componentLabel } from '../core/labels';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function renderFocusAside(
  root: HTMLElement,
  groups: FocusGroup[],
  selectedFocus: PrimaryFocus | null
): void {
  const summary = `
    <div class="aside-header">
      <div class="aside-title">Focus clusters</div>
      <div class="aside-summary">
        Registry groups by dominant <span class="em">use-case</span>.
      </div>
    </div>`;

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

  const footer = `
    <div class="aside-footer">
      <span class="muted-em">Filter by cluster</span>
      <span class="key">Focus → registries</span>
    </div>`;

  root.innerHTML = summary + `<div class="pill-list">${pills}</div>` + footer;
}

export function renderFocusContent(
  headerRoot: HTMLElement,
  bodyRoot: HTMLElement,
  registries: readonly Registry[],
  metrics: RegistryExplorerMetrics
): void {
  // Header
  headerRoot.innerHTML = `
    <div class="content-heading">
      <div class="content-title">Registries by focus</div>
      <div class="content-subtitle">
        Browse component registries clustered by dominant product use-case.
      </div>
    </div>
    <div class="content-metrics">
      <span><strong>${metrics.visibleRegistries}</strong> registries</span>
      <span><strong>${metrics.focusGroupCount}</strong> focus groups</span>
    </div>`;

  // Body
  if (!registries.length) {
     bodyRoot.innerHTML = `
      <div class="empty-state">
         <div class="empty-state-icon">⊘</div>
         <div>No registries match this filter.</div>
         <div>Try clearing the search or selecting a different group.</div>
       </div>`;
     return;
  }

  const cards = registries.map(r => {
    const focusChips = r.primary_focus
      .map(f => `<span class="chip chip-focus">${escapeHtml(focusLabel(f))}</span>`)
      .join("");
    const tagChips = r.component_tags.slice(0, 5)
      .map(tag => `<span class="chip chip-tag chip-compact">${escapeHtml(componentLabel(tag))}</span>`)
      .join("");
    const extraCount = r.component_tags.length - 5;
    const extraChip = extraCount > 0
      ? `<span class="chip chip-compact chip-tag">+${extraCount} more</span>`
      : "";

    return `
      <article class="registry-card">
        <div class="registry-header">
          <div>
            <div class="registry-name">${escapeHtml(r.name)}</div>
          </div>
          <a href="${escapeHtml(r.url)}" class="registry-url" target="_blank" rel="noreferrer">
            Visit
          </a>
        </div>
        <div class="registry-description">
          ${escapeHtml(r.description)}
        </div>
        <div class="chip-row">
          ${focusChips}
        </div>
        <div class="registry-footer">
          <div class="registry-meta">
            <span>${escapeHtml(r.framework || 'React')}</span>
            <span>${escapeHtml(r.license || 'MIT')}</span>
          </div>
          <div class="tag-row-compact">
            ${tagChips}${extraChip}
          </div>
        </div>
      </article>
    `;
  }).join("");

  bodyRoot.innerHTML = `<div class="registry-grid">${cards}</div>`;
}
```

src/registry-explorer/ui/index.ts
```
export * from './shell';
export * from './focusView';
export * from './componentView';
export * from './matrixView';
```

src/registry-explorer/ui/matrixView.ts
```
import type { MatrixRow, RegistryExplorerMetrics, ComponentTag } from '../core/registry.schema';
import { componentLabel } from '../core/labels';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function renderMatrixAside(
  root: HTMLElement,
  columns: readonly ComponentTag[],
  metrics: RegistryExplorerMetrics
): void {
  const summary = `
    <div class="aside-header">
      <div class="aside-title">Matrix axes</div>
      <div class="aside-summary">
        Rows: <span class="em">registries</span>. Columns: <span class="em">representative components</span>.
      </div>
    </div>`;

  const footer = `
    <div class="aside-footer">
      <span class="muted-em">Coverage overview</span>
      <span class="key">${metrics.visibleRegistries} registries · ${columns.length} columns</span>
    </div>`;

  const chips = `
    <div class="pill-list">
       ${columns.map(col => `
         <div class="chip chip-compact chip-tag">
           ${escapeHtml(componentLabel(col))}
         </div>
       `).join("")}
     </div>`;

  root.innerHTML = summary + chips + footer;
}

export function renderMatrixContent(
  headerRoot: HTMLElement,
  bodyRoot: HTMLElement,
  rows: MatrixRow[],
  columns: readonly ComponentTag[],
  metrics: RegistryExplorerMetrics
): void {
  // Header
  headerRoot.innerHTML = `
    <div class="content-heading">
      <div class="content-title">Coverage matrix</div>
      <div class="content-subtitle">
        Quick scan of which registries cover core component families.
      </div>
    </div>
    <div class="content-metrics">
      <span><strong>${metrics.visibleRegistries}</strong> registries</span>
      <span><strong>${columns.length}</strong> component columns</span>
    </div>`;

  // Body
  if (!rows.length) {
    bodyRoot.innerHTML = `
      <div class="empty-state">
         <div class="empty-state-icon">⊘</div>
         <div>No registries match this filter.</div>
       </div>`;
    return;
  }

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

  const headers = columns.map(col =>
    `<th>${escapeHtml(componentLabel(col))}</th>`
  ).join("");

  bodyRoot.innerHTML = `
    <div class="matrix-wrapper">
       <table class="matrix">
         <thead>
           <tr>
             <th>Registry</th>
             ${headers}
           </tr>
         </thead>
         <tbody>
           ${tableRows}
         </tbody>
       </table>
     </div>`;
}
```

src/registry-explorer/ui/shell.ts
```
import type { Registry, PrimaryFocus, ComponentTag } from '../core/registry.schema';
import {
  buildFocusGroups,
  buildComponentGroups,
  buildMatrixRows,
  computeMetrics
} from '../core/grouping';
import { MATRIX_COLUMNS } from '../core/matrixColumns';
import { renderFocusAside, renderFocusContent } from './focusView';
import { renderComponentAside, renderComponentContent } from './componentView';
import { renderMatrixAside, renderMatrixContent } from './matrixView';

export interface ShellOptions {
  registries: readonly Registry[];
  roots: {
    aside: HTMLElement;
    contentHeader: HTMLElement;
    contentBody: HTMLElement;
    tabs: NodeListOf<Element>; // More generic for flexibility
    searchInput: HTMLInputElement;
  };
}

interface AppState {
  currentView: 'focus' | 'component' | 'matrix';
  selectedFocus: PrimaryFocus | null;
  selectedComponent: ComponentTag | null;
  searchTerm: string;
}

export function initRegistryExplorer(options: ShellOptions): void {
  const { registries, roots } = options;

  // Initial State
  let state: AppState = {
    currentView: 'focus',
    selectedFocus: null,
    selectedComponent: null,
    searchTerm: '',
  };

  // State Update Logic
  function setState(partial: Partial<AppState>) {
    state = { ...state, ...partial };
    render();
  }

  // Render Loop
  function render() {
    try {
      // 1. Update Tabs
      roots.tabs.forEach(tab => {
        const view = tab.getAttribute('data-view');
        if (view === state.currentView) {
          tab.classList.add('tab-active');
        } else {
          tab.classList.remove('tab-active');
        }
      });

      // 2. Compute Data
      const metrics = computeMetrics(registries, state.searchTerm);

      // 3. Delegate to Views
      if (state.currentView === 'focus') {
        const groups = buildFocusGroups(registries, state.searchTerm);
        
        let effectiveFocus = state.selectedFocus;
        if (!effectiveFocus && groups.length > 0) {
          effectiveFocus = groups[0].focusKey;
        }

        renderFocusAside(roots.aside, groups, effectiveFocus);
        
        const selectedGroup = groups.find(g => g.focusKey === effectiveFocus);
        const itemsToShow = selectedGroup ? selectedGroup.registries : [];
        
        renderFocusContent(roots.contentHeader, roots.contentBody, itemsToShow, metrics);

      } else if (state.currentView === 'component') {
        const groups = buildComponentGroups(registries, state.searchTerm);
        
        let effectiveComponent = state.selectedComponent;
        if (!effectiveComponent && groups.length > 0) {
          effectiveComponent = groups[0].componentKey;
        }

        renderComponentAside(roots.aside, groups, effectiveComponent);
        
        const selectedGroup = groups.find(g => g.componentKey === effectiveComponent);
        
        renderComponentContent(roots.contentHeader, roots.contentBody, selectedGroup || null, metrics);

      } else if (state.currentView === 'matrix') {
        const rows = buildMatrixRows(registries, state.searchTerm, MATRIX_COLUMNS);
        
        renderMatrixAside(roots.aside, MATRIX_COLUMNS, metrics);
        renderMatrixContent(roots.contentHeader, roots.contentBody, rows, MATRIX_COLUMNS, metrics);
      }
    } catch (error) {
      console.error('Registry Explorer: Render failed', error);
      // Optional: Render error state to UI
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
  }

  // Event Listeners

  // Tabs
  roots.tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const view = tab.getAttribute('data-view') as AppState['currentView'];
      if (view && view !== state.currentView) {
        setState({ currentView: view });
      }
    });
  });

  // Search
  roots.searchInput.addEventListener('input', (e) => {
    const target = e.target as HTMLInputElement;
    setState({ searchTerm: target.value || '' });
  });

  // Aside Delegation (Focus and Component pills)
  // We attach to document body or roots.aside? index.html attached to document.
  // Using roots.aside is better for encapsulation if the events bubble up there.
  // But wait, pills are inside roots.aside.
  roots.aside.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const focusButton = target.closest('[data-focus]');
    if (focusButton) {
      const focusKey = focusButton.getAttribute('data-focus') as PrimaryFocus;
      if (focusKey && focusKey !== state.selectedFocus) {
        setState({ selectedFocus: focusKey, currentView: 'focus' });
      }
      return;
    }

    const componentButton = target.closest('[data-component]');
    if (componentButton) {
      const tagKey = componentButton.getAttribute('data-component') as ComponentTag;
      if (tagKey && tagKey !== state.selectedComponent) {
        setState({ selectedComponent: tagKey, currentView: 'component' });
      }
    }
  });

  // Initial Render
  render();
}
```

src/registry-explorer/data/registries.data.ts
```
import type { Registry } from '../core/registry.schema';

export const registries: ReadonlyArray<Registry> = [
  {
    name: '8bitcn',
    url: 'https://www.8bitcn.com',
    description: 'A set of 8‑bit‑styled retro components for game‑like interfaces.',
    primary_focus: ['misc-utility', 'buttons-and-primitives'],
    component_tags: ['button', 'dropdown', 'alert', 'toast', 'modal', 'card', 'table', 'chart'],
    framework: 'React (shadcn/ui)',
    license: 'MIT',
  },
  {
    name: 'abui',
    url: 'https://abui.io',
    description: 'Shadcn‑compatible registry of reusable components, blocks and utilities conforming to Vercel’s components.build specification.',
    primary_focus: ['templates-and-layouts', 'marketing-sections'],
    component_tags: ['button', 'input', 'hero-section', 'testimonial'],
    framework: 'React (shadcn/ui)',
    license: 'MIT',
  },
  {
    name: 'abstract',
    url: 'https://build.abs.xyz',
    description: 'A collection of React components for the most common crypto patterns.',
    primary_focus: ['auth-and-user', 'misc-utility'],
    component_tags: ['auth-form', 'modal'],
    framework: 'React',
    license: 'MIT',
  },
  {
    name: 'aceternity',
    url: 'https://ui.aceternity.com',
    description: 'A modern component library built with Tailwind CSS and Motion for React, focusing on unique, animated components.',
    primary_focus: ['marketing-sections', 'templates-and-layouts'],
    component_tags: ['card', 'hero-section'],
    framework: 'React',
    license: 'MIT',
  },
  {
    name: 'aevr',
    url: 'https://ui.aevr.space',
    description: 'A small collection of beautiful, accessible, production‑ready components and primitives for React/Next.js.',
    primary_focus: ['buttons-and-primitives'],
    component_tags: ['button', 'card'],
    framework: 'React / Next.js',
    license: 'MIT',
  },
  {
    name: 'ai-blocks',
    url: 'https://webllm.org',
    description: 'Provides AI components for the web built on WebLLM. No server or API keys are required.',
    primary_focus: ['ai-chat'],
    component_tags: ['chatbot', 'prompt-box', 'spinner', 'alert'],
    framework: 'React',
    license: 'MIT',
  },
  {
    name: 'ai-elements',
    url: 'https://ai-sdk.dev',
    description: 'Offers pre‑built components like conversations, messages and more to build AI‑native applications faster.',
    primary_focus: ['ai-chat'],
    component_tags: ['chat-window', 'message-list', 'avatar'],
    framework: 'React',
    license: 'MIT',
  },
  {
    name: 'algolia',
    url: 'https://sitesearch.algolia.com',
    description: 'Provides AI search infrastructure components.',
    primary_focus: ['data-display-and-tables'],
    component_tags: ['search-input', 'filter-bar'],
    framework: 'React',
    license: 'MIT',
  },
  {
    name: 'aliimam',
    url: 'https://aliimam.in',
    description: 'A personal registry focusing on digital experiences, portfolio components, and brand storytelling.',
    primary_focus: ['marketing-sections'],
    component_tags: ['hero-section', 'card'],
    framework: 'React',
    license: 'MIT',
  },
  {
    name: 'animate-ui',
    url: 'https://animate-ui.com',
    description: 'A fully animated, open‑source React component distribution.',
    primary_focus: ['misc-utility', 'buttons-and-primitives'],
    component_tags: ['button', 'modal'],
    framework: 'React',
    license: 'MIT',
  },
  {
    name: 'assistant-ui',
    url: 'https://www.assistant-ui.com',
    description: 'Offers Radix‑style React primitives for AI chat with adapters.',
    primary_focus: ['ai-chat'],
    component_tags: ['message-list', 'typing-indicator'],
    framework: 'React',
    license: 'MIT',
  },
  {
    name: 'better-upload',
    url: 'https://better-upload.com',
    description: 'Provides simple and easy file uploads for React.',
    primary_focus: ['forms-and-inputs'],
    component_tags: ['button', 'spinner', 'file-upload', 'dropzone'],
    framework: 'React',
    license: 'MIT',
  },
  {
    name: 'basecn',
    url: 'https://basecn.dev',
    description: 'Distributes beautifully crafted shadcn/ui components powered by Base UI.',
    primary_focus: ['buttons-and-primitives', 'navigation', 'data-display-and-tables'],
    component_tags: [
      'button', 'input', 'select', 'tabs', 'navbar', 'breadcrumb', 'sidebar', 'table', 'chart', 'card',
      'accordion', 'alert', 'avatar', 'badge', 'calendar', 'carousel', 'checkbox', 'collapsible',
      'combobox', 'command', 'context-menu', 'dialog', 'drawer', 'hover-card', 'menubar', 'pagination',
      'popover', 'progress', 'radio-group', 'scroll-area', 'separator', 'sheet', 'skeleton', 'slider',
      'switch', 'textarea', 'toast', 'toggle', 'tooltip'
    ],
    framework: 'React (shadcn/ui)',
    license: 'MIT',
  },
  {
    name: 'billingsdk',
    url: 'https://billingsdk.com',
    description: 'An open‑source library for SaaS billing and payments.',
    primary_focus: ['ecommerce', 'forms-and-inputs'],
    component_tags: ['table', 'auth-form', 'pricing-table'],
    framework: 'React',
    license: 'MIT',
  },
  {
    name: 'blocks',
    url: 'https://blocks.so',
    description: 'Provides clean, modern application building blocks.',
    primary_focus: ['marketing-sections', 'dashboards-and-admin'],
    component_tags: ['hero-section', 'feature-grid', 'table', 'dialog', 'auth-form', 'sidebar', 'chatbot'],
    framework: 'React',
    license: 'MIT',
  },
  {
    name: 'clerk',
    url: 'https://clerk.com',
    description: 'A registry for authentication and user management.',
    primary_focus: ['auth-and-user'],
    component_tags: ['auth-form', 'avatar'],
    framework: 'React',
    license: 'Commercial',
  },
  {
    name: 'commercn',
    url: 'https://commercn.com',
    description: 'Shadcn UI blocks for e-commerce websites.',
    primary_focus: ['ecommerce'],
    component_tags: ['card', 'hero-section', 'table'],
    framework: 'React (shadcn/ui)',
    license: 'MIT',
  },
  {
    name: 'coss',
    url: 'https://coss.com',
    description: 'A modern UI component library built on top of Base UI for developers and AI.',
    primary_focus: ['buttons-and-primitives'],
    component_tags: [
      'button', 'table', 'navbar', 'accordion', 'alert', 'avatar', 'badge', 'checkbox',
      'collapsible', 'dialog', 'hover-card', 'menubar', 'pagination', 'popover', 'progress',
      'radio-group', 'separator', 'sheet', 'skeleton', 'slider', 'spinner', 'switch',
      'textarea', 'toast', 'toggle', 'tooltip'
    ],
    framework: 'React',
    license: 'MIT',
  },
  {
    name: 'creative-tim',
    url: 'https://www.creative-tim.com',
    description: 'Offers a collection of open‑source UI components, blocks and AI agents.',
    primary_focus: ['dashboards-and-admin', 'marketing-sections'],
    component_tags: ['chart', 'table', 'card', 'hero-section', 'testimonial', 'chatbot'],
    framework: 'React',
    license: 'MIT',
  },
  {
    name: 'cult-ui',
    url: 'https://www.cult-ui.com',
    description: 'A curated set of shadcn‑compatible, headless and composable components animated with Framer Motion.',
    primary_focus: ['misc-utility'],
    component_tags: ['dropdown', 'modal'],
    framework: 'React',
    license: 'MIT',
  },
  {
    name: 'diceui',
    url: 'https://www.diceui.com',
    description: 'Provides accessible components built with React, TypeScript and Tailwind CSS.',
    primary_focus: ['forms-and-inputs', 'buttons-and-primitives'],
    component_tags: ['input', 'select', 'checkbox', 'card', 'tabs', 'alert', 'skeleton'],
    framework: 'React',
    license: 'MIT',
  },
  {
    name: 'doras-ui',
    url: 'https://ui.doras.to',
    description: 'A collection of beautiful, reusable component blocks built with React.',
    primary_focus: ['marketing-sections', 'dashboards-and-admin'],
    component_tags: ['hero-section', 'feature-grid', 'testimonial', 'card', 'navbar'],
    framework: 'React',
    license: 'MIT',
  },
  {
    name: 'elements',
    url: 'https://www.tryelements.dev',
    description: 'Full‑stack components that go beyond UI; they add auth, monetization, uploads and AI.',
    primary_focus: ['auth-and-user', 'ecommerce', 'ai-chat'],
    component_tags: ['auth-form', 'table', 'chatbot'],
    framework: 'React',
    license: 'MIT',
  },
  {
    name: 'elevenlabs-ui',
    url: 'https://ui.elevenlabs.io',
    description: 'A collection of agent and audio components.',
    primary_focus: ['ai-chat', 'misc-utility'],
    component_tags: ['chatbot'],
    framework: 'React',
    license: 'MIT',
  },
  {
    name: 'efferd',
    url: 'https://efferd.com',
    description: 'Offers beautifully crafted shadcn/UI blocks for modern websites.',
    primary_focus: ['marketing-sections'],
    component_tags: ['hero-section', 'testimonial', 'cta-section', 'table'],
    framework: 'React',
    license: 'MIT',
  },
  {
    name: 'eldoraui',
    url: 'https://eldoraui.site',
    description: 'A modern UI component library built with TypeScript, Tailwind CSS and Framer Motion.',
    primary_focus: ['buttons-and-primitives', 'navigation'],
    component_tags: ['button', 'toggle', 'input', 'select', 'navbar', 'tabs', 'sidebar', 'alert', 'spinner', 'modal'],
    framework: 'React',
    license: 'MIT',
  },
  {
    name: 'formcn',
    url: 'https://formcn.dev',
    description: 'Designed to build production‑ready forms with shadcn components.',
    primary_focus: ['forms-and-inputs'],
    component_tags: ['input', 'select', 'datepicker', 'stepper', 'submit-button', 'error-message'],
    framework: 'React (shadcn/ui)',
    license: 'MIT',
  },
  {
    name: 'gaia',
    url: 'https://ui.heygaia.io',
    description: 'Provides production‑ready UI components for building AI assistants and conversational interfaces.',
    primary_focus: ['ai-chat'],
    component_tags: ['chatbot', 'message-list', 'avatar'],
    framework: 'React',
    license: 'MIT',
  },
  {
    name: 'glass-ui',
    url: 'https://glass-ui.crenspire.com',
    description: 'Distributes 40+ glassmorphic React/TypeScript components with Apple‑inspired design.',
    primary_focus: ['buttons-and-primitives', 'navigation'],
    component_tags: ['card', 'sidebar', 'button', 'toggle', 'navbar', 'tabs'],
    framework: 'React',
    license: 'MIT',
  },
  {
    name: 'ha-components',
    url: 'https://hacomponents.keshuac.com',
    description: 'Provides customisable components to build Home Assistant dashboards.',
    primary_focus: ['dashboards-and-admin'],
    component_tags: ['card', 'switch'],
    framework: 'React',
    license: 'MIT',
  },
  {
    name: 'hextaui',
    url: 'https://hextaui.com',
    description: 'Offers ready‑to‑use foundation components/blocks built on shadcn/ui.',
    primary_focus: ['buttons-and-primitives', 'marketing-sections'],
    component_tags: ['button', 'input', 'select', 'tabs', 'hero-section', 'table', 'modal'],
    framework: 'React (shadcn/ui)',
    license: 'MIT',
  },
  {
    name: 'hooks',
    url: 'https://shadcn-hooks.vercel.app',
    description: 'A comprehensive React hooks collection built with Shadcn.',
    primary_focus: ['misc-utility'],
    component_tags: ['toast', 'modal', 'dropdown'],
    framework: 'React (shadcn/ui)',
    license: 'MIT',
  },
  {
    name: 'intentui',
    url: 'https://intentui.com',
    description: 'An accessible React component library to copy, customise and own your UI.',
    primary_focus: ['forms-and-inputs', 'navigation'],
    component_tags: ['input', 'select', 'checkbox', 'tabs', 'alert', 'skeleton'],
    framework: 'React',
    license: 'MIT',
  },
  {
    name: 'kibo-ui',
    url: 'https://www.kibo-ui.com',
    description: 'A custom registry of composable, accessible, open‑source components.',
    primary_focus: ['buttons-and-primitives', 'navigation'],
    component_tags: ['button', 'card', 'navbar'],
    framework: 'React',
    license: 'MIT',
  },
  {
    name: 'kanpeki',
    url: 'https://kanpeki.vercel.app',
    description: 'A set of perfect‑designed components built on React Aria and Motion.',
    primary_focus: ['buttons-and-primitives'],
    component_tags: ['button', 'modal', 'dropdown'],
    framework: 'React',
    license: 'MIT',
  },
  {
    name: 'kokonutui',
    url: 'https://kokonutui.com',
    description: 'A collection of stunning components built with Tailwind CSS, shadcn/ui and Motion.',
    primary_focus: ['marketing-sections'],
    component_tags: ['card', 'hero-section', 'testimonial', 'table', 'button'],
    framework: 'React (shadcn/ui)',
    license: 'MIT',
  },
  {
    name: 'lens-blocks',
    url: 'https://lensblocks.com',
    description: 'Provides social media components for the Lens Social Protocol.',
    primary_focus: ['misc-utility'],
    component_tags: ['card', 'button'],
    framework: 'React',
    license: 'MIT',
  },
  {
    name: 'limeplay',
    url: 'https://limeplay.winoffrg.dev',
    description: 'A UI library for building media players in React.',
    primary_focus: ['misc-utility'],
    component_tags: ['button'],
    framework: 'React',
    license: 'MIT',
  },
  {
    name: 'lucide-animated',
    url: 'https://lucide-animated.com',
    description: 'An open‑source collection of animated Lucide icons.',
    primary_focus: ['buttons-and-primitives'],
    component_tags: ['button'],
    framework: 'React',
    license: 'MIT',
  },
  {
    name: 'lytenyte',
    url: 'https://www.1771technologies.com',
    description: 'Provides LyteNyte Grid, a high‑performance, headless React data grid.',
    primary_focus: ['data-display-and-tables'],
    component_tags: ['table', 'data-grid', 'pagination'],
    framework: 'React',
    license: 'MIT',
  },
  {
    name: 'magicui',
    url: 'https://magicui.design',
    description: 'A UI library for design engineers featuring 150+ free and open‑source animated components and effects.',
    primary_focus: ['marketing-sections'],
    component_tags: ['button', 'switch', 'hero-section', 'table'],
    framework: 'React',
    license: 'MIT',
  },
  {
    name: 'mui-treasury',
    url: 'https://www.mui-treasury.com',
    description: 'Offers hand‑crafted interfaces built on top of MUI components.',
    primary_focus: ['navigation', 'data-display-and-tables', 'forms-and-inputs'],
    component_tags: ['sidebar', 'table', 'card', 'input', 'select', 'toggle'],
    framework: 'React (MUI)',
    license: 'MIT',
  },
  {
    name: 'moleculeui',
    url: 'https://www.moleculeui.design',
    description: 'A modern React component library focused on intuitive interactions and seamless user experiences.',
    primary_focus: ['buttons-and-primitives', 'navigation'],
    component_tags: ['button', 'card', 'navbar', 'tabs', 'breadcrumb', 'modal', 'drawer'],
    framework: 'React',
    license: 'MIT',
  },
  {
    name: 'motion-primitives',
    url: 'https://www.motion-primitives.com',
    description: 'Provides beautifully designed motion components.',
    primary_focus: ['buttons-and-primitives'],
    component_tags: ['button', 'toggle'],
    framework: 'React',
    license: 'MIT',
  },
  {
    name: 'ncdai',
    url: 'https://chanhdai.com',
    description: 'A collection of reusable components.',
    primary_focus: ['buttons-and-primitives'],
    component_tags: ['button', 'input', 'select', 'alert'],
    framework: 'React',
    license: 'MIT',
  },
  {
    name: 'nuqs',
    url: 'https://nuqs.dev',
    description: 'Offers custom parsers, adapters and utilities for type‑safe URL state management.',
    primary_focus: ['misc-utility'],
    component_tags: ['filter-bar'],
    framework: 'React',
    license: 'MIT',
  },
  {
    name: 'nexus-elements',
    url: 'https://elements.nexus.availproject.org',
    description: 'Provides ready‑made React components for almost any use case.',
    primary_focus: ['buttons-and-primitives', 'marketing-sections', 'dashboards-and-admin'],
    component_tags: ['button', 'card', 'table', 'auth-form', 'hero-section', 'chart'],
    framework: 'React',
    license: 'MIT',
  },
  {
    name: 'oui',
    url: 'https://oui.mw10013.workers.dev',
    description: 'Distributes React Aria components with shadcn characteristics.',
    primary_focus: ['buttons-and-primitives'],
    component_tags: ['button', 'modal'],
    framework: 'React',
    license: 'MIT',
  },
  {
    name: 'paceui',
    url: 'https://ui.paceui.com',
    description: 'Offers animated components and building blocks built for smooth interaction and rich detail.',
    primary_focus: ['marketing-sections'],
    component_tags: ['card', 'modal', 'hero-section'],
    framework: 'React',
    license: 'MIT',
  },
  {
    name: 'paykit-sdk',
    url: 'https://www.usepaykit.dev',
    description: 'A payments SDK offering unified checkout and billing across multiple gateways.',
    primary_focus: ['ecommerce'],
    component_tags: ['auth-form'],
    framework: 'React',
    license: 'MIT',
  },
  {
    name: 'plate',
    url: 'https://platejs.org',
    description: 'An AI‑powered rich text editor for React.',
    primary_focus: ['forms-and-inputs'],
    component_tags: ['toolbar'],
    framework: 'React',
    license: 'MIT',
  },
  {
    name: 'prompt-kit',
    url: 'https://www.prompt-kit.com',
    description: 'Provides core building blocks for AI apps.',
    primary_focus: ['ai-chat'],
    component_tags: ['prompt-box', 'chatbot'],
    framework: 'React',
    license: 'MIT',
  },
  {
    name: 'prosekit',
    url: 'https://prosekit.dev',
    description: 'A powerful and flexible rich text editor for multiple frameworks.',
    primary_focus: ['forms-and-inputs'],
    component_tags: ['toolbar'],
    framework: 'React',
    license: 'MIT',
  },
  {
    name: 'phucbm',
    url: 'https://ui.phucbm.com',
    description: 'A collection of modern React UI components with GSAP animations.',
    primary_focus: ['marketing-sections'],
    component_tags: ['button', 'card', 'hero-section'],
    framework: 'React',
    license: 'MIT',
  },
  {
    name: 'react-bits',
    url: 'https://reactbits.dev',
    description: 'Offers a large collection of animated, interactive and fully customizable React components.',
    primary_focus: ['buttons-and-primitives'],
    component_tags: ['button', 'toggle'],
    framework: 'React',
    license: 'MIT',
  },
  {
    name: 'retroui',
    url: 'https://retroui.dev',
    description: 'A Neobrutalism‑styled React + TailwindCSS UI library.',
    primary_focus: ['buttons-and-primitives', 'marketing-sections'],
    component_tags: ['button', 'card', 'modal', 'hero-section', 'table'],
    framework: 'React',
    license: 'MIT',
  },
  {
    name: 'reui',
    url: 'https://reui.io',
    description: 'An open‑source collection of UI components and animated effects built with React, TypeScript, Tailwind CSS and Motion.',
    primary_focus: ['buttons-and-primitives'],
    component_tags: ['button', 'input', 'tabs', 'dropdown', 'modal', 'drawer'],
    framework: 'React',
    license: 'MIT',
  },
  {
    name: 'scrollxui',
    url: 'https://www.scrollxui.dev',
    description: 'A library of animated, interactive and customizable user interfaces.',
    primary_focus: ['marketing-sections'],
    component_tags: ['card', 'modal'],
    framework: 'React',
    license: 'MIT',
  },
  {
    name: 'square-ui',
    url: 'https://square.lndev.me',
    description: 'A collection of beautifully crafted open‑source layouts.',
    primary_focus: ['templates-and-layouts'],
    component_tags: ['hero-section', 'testimonial', 'navbar'],
    framework: 'React',
    license: 'MIT',
  },
  {
    name: 'systaliko-ui',
    url: 'https://systaliko-ui.vercel.app',
    description: 'A UI component library designed for flexibility, customization and scaling across variants.',
    primary_focus: ['buttons-and-primitives'],
    component_tags: ['input', 'button', 'card'],
    framework: 'React',
    license: 'MIT',
  },
  {
    name: 'roiui',
    url: 'https://roiui.com',
    description: 'Offers UI components and blocks built with Base UI primitives.',
    primary_focus: ['buttons-and-primitives', 'dashboards-and-admin'],
    component_tags: ['input', 'button', 'modal', 'tabs', 'auth-form', 'table'],
    framework: 'React',
    license: 'MIT',
  },
  {
    name: 'solaceui',
    url: 'https://www.solaceui.com',
    description: 'Provides production‑ready sections, animated components and full‑page templates for Next.js, Tailwind CSS and Motion.',
    primary_focus: ['marketing-sections', 'templates-and-layouts'],
    component_tags: ['hero-section', 'testimonial'],
    framework: 'React / Next.js',
    license: 'MIT',
  },
  {
    name: 'shadcnblocks',
    url: 'https://shadcnblocks.com',
    description: 'A registry with hundreds of extra blocks.',
    primary_focus: ['marketing-sections', 'dashboards-and-admin'],
    component_tags: ['hero-section', 'card', 'table', 'chart', 'navbar'],
    framework: 'React (shadcn/ui)',
    license: 'MIT',
  },
  {
    name: 'shadcndesign',
    url: 'https://www.shadcndesign.com',
    description: 'A growing collection of high‑quality blocks and themes.',
    primary_focus: ['marketing-sections'],
    component_tags: ['hero-section'],
    framework: 'React (shadcn/ui)',
    license: 'MIT',
  },
  {
    name: 'shadcn-map',
    url: 'https://shadcn-map.vercel.app',
    description: 'Provides a map component built with Leaflet and React Leaflet.',
    primary_focus: ['data-display-and-tables'],
    component_tags: ['card'],
    framework: 'React (shadcn/ui)',
    license: 'MIT',
  },
  {
    name: 'shadcn-studio',
    url: 'https://shadcnstudio.com',
    description: 'Offers an open‑source set of shadcn/ui components, blocks and templates with a theme generator.',
    primary_focus: ['dashboards-and-admin', 'marketing-sections'],
    component_tags: ['button', 'input', 'modal', 'table', 'hero-section', 'testimonial'],
    framework: 'React (shadcn/ui)',
    license: 'MIT',
  },
  {
    name: 'shadcn-editor',
    url: 'https://shadcn-editor.vercel.app',
    description: 'An accessible, customizable rich text editor built with Lexical and shadcn/ui.',
    primary_focus: ['forms-and-inputs'],
    component_tags: ['toolbar'],
    framework: 'React (shadcn/ui)',
    license: 'MIT',
  },
  {
    name: 'shadcnui-blocks',
    url: 'https://shadcnui-blocks.com',
    description: 'Provides premium, production‑ready blocks, components and templates.',
    primary_focus: ['marketing-sections'],
    component_tags: ['hero-section', 'testimonial', 'button', 'table', 'modal'],
    framework: 'React (shadcn/ui)',
    license: 'Commercial',
  },
  {
    name: 'shadcraft',
    url: 'https://shadcraft-free.vercel.app',
    description: 'A collection of polished shadcn/ui components and marketing blocks.',
    primary_focus: ['marketing-sections'],
    component_tags: ['hero-section', 'testimonial', 'auth-form', 'tabs'],
    framework: 'React (shadcn/ui)',
    license: 'MIT',
  },
  {
    name: 'smoothui',
    url: 'https://smoothui.dev',
    description: 'A library of motion components built with React, Framer Motion and TailwindCSS.',
    primary_focus: ['buttons-and-primitives'],
    component_tags: ['button', 'card'],
    framework: 'React',
    license: 'MIT',
  },
  {
    name: 'spectrumui',
    url: 'https://ui.spectrumhq.in',
    description: 'A modern component library built with shadcn/ui and Tailwind CSS.',
    primary_focus: ['buttons-and-primitives', 'templates-and-layouts'],
    component_tags: ['button', 'input', 'select', 'tabs', 'modal'],
    framework: 'React (shadcn/ui)',
    license: 'MIT',
  },
  {
    name: 'supabase',
    url: 'https://supabase.com',
    description: 'Combines React components and blocks that connect your front‑end to your Supabase back‑end.',
    primary_focus: ['auth-and-user', 'data-display-and-tables', 'dashboards-and-admin', 'misc-utility'],
    component_tags: ['auth-form', 'table', 'chart'],
    framework: 'React',
    license: 'MIT',
  },
  {
    name: 'svgl',
    url: 'https://svgl.app',
    description: 'A library with SVG logos.',
    primary_focus: ['marketing-sections'],
    component_tags: ['card'],
    framework: 'React',
    license: 'MIT',
  },
  {
    name: 'tailark',
    url: 'https://tailark.com',
    description: 'Provides shadcn blocks designed for building modern marketing websites.',
    primary_focus: ['marketing-sections'],
    component_tags: ['hero-section', 'table', 'testimonial', 'cta-section'],
    framework: 'React',
    license: 'MIT',
  },
  {
    name: 'taki',
    url: 'https://taki-ui.com',
    description: 'Offers beautifully designed, accessible components built with React Aria and Shadcn tokens.',
    primary_focus: ['forms-and-inputs', 'buttons-and-primitives'],
    component_tags: ['button', 'input', 'toggle', 'modal', 'search-input', 'datepicker'],
    framework: 'React (shadcn/ui)',
    license: 'MIT',
  },
  {
    name: 'tour',
    url: 'https://onboarding-tour.vercel.app',
    description: 'Provides a component for building onboarding tours.',
    primary_focus: ['misc-utility'],
    component_tags: ['prompt-box'],
    framework: 'React',
    license: 'MIT',
  },
  {
    name: 'uitripled',
    url: 'https://ui.tripled.work',
    description: 'An open‑source collection of production‑ready components and blocks built with shadcn/ui and Framer Motion.',
    primary_focus: ['buttons-and-primitives', 'marketing-sections'],
    component_tags: ['button', 'input', 'select', 'table', 'modal', 'hero-section'],
    framework: 'React (shadcn/ui)',
    license: 'MIT',
  },
  {
    name: 'utilcn',
    url: 'https://utilcn.dev',
    description: 'Offers fullstack registry items including ChatGPT apps, file uploading/downloading and typed environment variables.',
    primary_focus: ['ai-chat', 'misc-utility'],
    component_tags: ['chatbot'],
    framework: 'React',
    license: 'MIT',
  },
  {
    name: 'wandry-ui',
    url: 'https://ui.wandry.com.ua',
    description: 'A set of open‑source, fully controlled React Inertia form elements.',
    primary_focus: ['forms-and-inputs'],
    component_tags: ['input', 'select', 'toggle', 'datepicker'],
    framework: 'React',
    license: 'MIT',
  },
  {
    name: 'wigggle-ui',
    url: 'https://wigggle-ui.vercel.app',
    description: 'Offers a beautiful collection of copy‑and‑paste widgets.',
    primary_focus: ['misc-utility'],
    component_tags: ['modal', 'dropdown'],
    framework: 'React',
    license: 'MIT',
  },
  {
    name: 'zippystarter',
    url: 'https://zippystarter.com',
    description: 'Provides expertly crafted blocks, components and themes.',
    primary_focus: ['marketing-sections', 'dashboards-and-admin'],
    component_tags: ['hero-section', 'testimonial', 'table', 'chart'],
    framework: 'React',
    license: 'MIT',
  },
  {
    name: 'uicapsule',
    url: 'https://uicapsule.com',
    description: 'A curated collection of components that spark joy; features interactive concepts, design experiments and AI/UI intersections.',
    primary_focus: ['buttons-and-primitives'],
    component_tags: ['button', 'toggle', 'chatbot'],
    framework: 'React',
    license: 'MIT',
  },
  {
    name: 'ui-layouts',
    url: 'https://ui-layouts.com',
    description: 'Provides components, effects, design tools and ready‑made blocks to build modern interfaces.',
    primary_focus: ['templates-and-layouts', 'marketing-sections'],
    component_tags: ['hero-section', 'table', 'testimonial'],
    framework: 'React',
    license: 'MIT',
  },
  {
    name: 'tailwind-builder',
    url: 'https://tailwindbuilder.ai',
    description: 'A collection of free UI blocks and components with AI tools to generate forms, tables and charts.',
    primary_focus: ['marketing-sections', 'data-display-and-tables'],
    component_tags: ['hero-section', 'cta-section', 'auth-form', 'table', 'chart'],
    framework: 'React',
    license: 'MIT',
  },
  {
    name: 'tailwind-admin',
    url: 'https://tailwind-admin.com',
    description: 'Provides free Tailwind admin dashboard templates, components and UI blocks.',
    primary_focus: ['dashboards-and-admin'],
    component_tags: ['sidebar', 'chart', 'table', 'search-input', 'auth-form'],
    framework: 'React',
    license: 'MIT',
  },
];
```

</source_code>
</current_codebase>

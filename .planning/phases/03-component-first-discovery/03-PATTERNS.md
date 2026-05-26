# Phase 03: Component-First Discovery - Pattern Map

**Mapped:** 2026-05-25
**Files analyzed:** 22
**Analogs found:** 22 / 22

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/registry-explorer/core/registry.schema.ts` | model | transform | `src/registry-explorer/core/registry.schema.ts` | exact |
| `src/registry-explorer/core/coverageStatus.ts` | utility | transform | `src/registry-explorer/core/labels.ts` | role-match |
| `src/registry-explorer/core/discovery.ts` | utility | transform | `src/registry-explorer/core/grouping.ts` | exact |
| `src/registry-explorer/core/registryProfile.ts` | utility | transform | `src/registry-explorer/core/grouping.ts` | role-match |
| `src/registry-explorer/core/itemRoutes.ts` | utility | transform | `src/registry-explorer/core/registryMirror.ts` | data-flow-match |
| `src/registry-explorer/core/registryMirror.ts` | utility | transform | `src/registry-explorer/core/registryMirror.ts` | exact |
| `src/registry-explorer/core/grouping.ts` | utility | transform | `src/registry-explorer/core/grouping.ts` | exact |
| `src/registry-explorer/data/loadRegistries.ts` | service | file-I/O | `src/registry-explorer/data/loadRegistries.ts` | exact |
| `src/registry-explorer/ui/discoveryView.ts` | component | transform | `src/registry-explorer/ui/componentView.ts` | role-match |
| `src/registry-explorer/ui/registryProfileView.ts` | component | transform | `src/registry-explorer/ui/focusView.ts` | role-match |
| `src/registry-explorer/ui/componentView.ts` | component | transform | `src/registry-explorer/ui/componentView.ts` | exact |
| `src/registry-explorer/ui/focusView.ts` | component | transform | `src/registry-explorer/ui/focusView.ts` | exact |
| `src/registry-explorer/ui/matrixView.ts` | component | transform | `src/registry-explorer/ui/matrixView.ts` | exact |
| `src/registry-explorer/ui/renderSafety.ts` | utility | transform | `src/registry-explorer/ui/renderSafety.ts` | exact |
| `src/registry-explorer/ui/shell.ts` | controller | event-driven | `src/registry-explorer/ui/shell.ts` | exact |
| `index.html` | config | request-response | `index.html` | exact |
| `public/styles/registry-explorer.css` | config | transform | `public/styles/registry-explorer.css` | exact |
| `tests/registry-explorer/discovery.test.ts` | test | batch | `tests/registry-explorer/grouping.test.ts` | exact |
| `tests/registry-explorer/registryProfile.test.ts` | test | batch | `tests/registry-explorer/grouping.test.ts` | role-match |
| `tests/registry-explorer/itemRoutes.test.ts` | test | batch | `tests/registry-explorer/registryMirror.test.ts` | data-flow-match |
| `tests/registry-explorer/coverageStatus.test.ts` | test | batch | `tests/registry-explorer/matrixColumns.test.ts` | role-match |
| `tests/registry-explorer/registryLoader.test.ts` | test | batch | `tests/registry-explorer/registryLoader.test.ts` | exact |

## Pattern Assignments

### `src/registry-explorer/core/registry.schema.ts` (model, transform)

**Analog:** `src/registry-explorer/core/registry.schema.ts`

**Controlled vocabulary pattern** (lines 1-18):
```typescript
export const PRIMARY_FOCUS_VALUES = [
  'ai-chat',
  'support',
  'buttons-and-primitives',
] as const;

export type PrimaryFocus = (typeof PRIMARY_FOCUS_VALUES)[number];
```

**Shared contract pattern** (lines 105-118):
```typescript
export interface Registry {
  name: string;
  url: string;
  description: string;
  primary_focus: PrimaryFocus[];
  component_tags: ComponentTag[];
  framework?: string;
  license?: string;
  mirror?: {
    officialName: string;
    registryUrlTemplate: string;
    warnings: string[];
  };
}
```

**Apply:** Add `CoverageStatus`, confidence/source unions, item-route/profile/candidate view model interfaces here when shared across core, data, UI, and tests. Preserve snake_case only for source-data fields already modeled as source fields; use camelCase for app-owned derived fields.

---

### `src/registry-explorer/core/coverageStatus.ts` (utility, transform)

**Analog:** `src/registry-explorer/core/labels.ts`

**Label utility pattern** (lines 1-24):
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

**Apply:** Keep coverage copy/status ordering as pure exported functions or constants. Use exact Phase 3 copy: `Verified item`, `Inferred from Atlas tags`, `Partial catalog`, `Catalog unavailable`, `Unverified coverage`.

---

### `src/registry-explorer/core/discovery.ts` (utility, transform)

**Analog:** `src/registry-explorer/core/grouping.ts`

**Imports pattern** (lines 1-10):
```typescript
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
```

**Pure search/filter pattern** (lines 12-31):
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

**Sorted derived result pattern** (lines 82-95):
```typescript
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
```

**Apply:** Build ranked `ComponentCandidate[]` with deterministic scoring and match reasons. Keep it non-throwing for empty search and missing optional metadata. Do not perform DOM work or external fetching here.

---

### `src/registry-explorer/core/registryProfile.ts` (utility, transform)

**Analog:** `src/registry-explorer/core/grouping.ts`

**Metrics/view-model derivation pattern** (lines 116-134):
```typescript
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

**Apply:** Derive `RegistryProfile` from one `Registry`, loaded mirror meta, warnings, and optional candidate match context. Return section-ready arrays/fields for the renderer instead of making the renderer inspect raw mirror data deeply.

---

### `src/registry-explorer/core/itemRoutes.ts` (utility, transform)

**Analog:** `src/registry-explorer/core/registryMirror.ts` and `src/registry-explorer/ui/renderSafety.ts`

**URL policy pattern** from `registryMirror.ts` (lines 73-80):
```typescript
const OFFICIAL_URL_POLICY: UrlPolicy = {
  allowedProtocols: ['https:', 'http:'],
  warningProtocols: ['http:'],
};

const PRIMARY_FOCUS_SET = new Set<PrimaryFocus>(PRIMARY_FOCUS_VALUES);
const COMPONENT_TAG_SET = new Set<ComponentTag>(COMPONENT_TAG_VALUES);
```

**Template validation pattern** from `registryMirror.ts` (lines 324-349):
```typescript
function validateRegistryUrlTemplateIntoResult(
  value: unknown,
  namespace: string | undefined,
  resultOrField: MirrorValidationResult | string,
  maybeResult?: MirrorValidationResult,
): void {
  const field = typeof resultOrField === 'string' ? resultOrField : 'official.registry_url_template';
  const result = typeof resultOrField === 'string' ? maybeResult : resultOrField;

  if (!result) {
    return;
  }

  validateUrlIntoResult(value, field, namespace, result);

  if (typeof value !== 'string' || !value.includes('{name}')) {
    addIssue(result, {
      code: 'template-missing-token',
      message: `${field} must include the {name} token.`,
      severity: 'error',
      namespace,
      field,
      value: typeof value === 'string' ? value : undefined,
    });
  }
}
```

**Safe external URL pattern** from `renderSafety.ts` (lines 12-24):
```typescript
export function toSafeExternalUrl(value: string): URL | null {
  if (value.trim().startsWith('//')) {
    return null;
  }

  try {
    const url = new URL(value);

    return url.protocol === 'https:' || url.protocol === 'http:' ? url : null;
  } catch {
    return null;
  }
}
```

**Apply:** Resolve direct item routes only when namespace, template, item slug, and final URL are valid. Return a structured success/failure result so UI can say `Open item route`, `Item route unavailable`, or `Catalog not verified` without pretending a homepage is an item URL.

---

### `src/registry-explorer/core/registryMirror.ts` (utility, transform)

**Analog:** `src/registry-explorer/core/registryMirror.ts`

**Public validation API pattern** (lines 81-128):
```typescript
export function validateRegistryMirror(mirror: unknown, raw?: unknown): MirrorValidationResult {
  const result = createResult();

  if (!isObject(mirror)) {
    addIssue(result, {
      code: 'mirror-invalid-shape',
      message: 'Mirror data must be an object.',
      severity: 'error',
    });
    return result;
  }

  const mirrorData = mirror as MirrorData;
  if (!Array.isArray(mirrorData.registries)) {
    addIssue(result, {
      code: 'mirror-invalid-shape',
      message: 'Mirror data must include a registries array.',
      severity: 'error',
      field: 'registries',
    });
    return result;
  }
```

**Record-level validation pattern** (lines 197-210):
```typescript
function validateMirrorRecord(
  record: MirrorRecord,
  index: number,
  seenNamespaces: Set<string>,
  result: MirrorValidationResult,
): void {
  const namespace = validateNamespaceIntoResult(record.official?.name, seenNamespaces, result);
  const label = namespace ?? `record ${index}`;

  validateUrlIntoResult(record.official?.homepage, 'official.homepage', namespace, result);
  validateRegistryUrlTemplateIntoResult(record.official?.registry_url_template, namespace, 'official.registry_url_template', result);
  validateAtlasValues(record.atlas?.primary_focus, PRIMARY_FOCUS_SET, 'atlas.primary_focus', 'atlas-invalid-primary-focus', label, result);
  validateAtlasValues(record.atlas?.component_tags, COMPONENT_TAG_SET, 'atlas.component_tags', 'atlas-invalid-component-tag', label, result);
}
```

**Apply:** Extend validation for `atlas.coverage_status`, `atlas.confidence`, aliases, notes, and item catalog summaries using the same `unknown` input boundary, `addIssue`, and allowlist-set pattern.

---

### `src/registry-explorer/data/loadRegistries.ts` (service, file-I/O)

**Analog:** `src/registry-explorer/data/loadRegistries.ts`

**Imports and loader API pattern** (lines 1-21):
```typescript
import type { ComponentTag, PrimaryFocus, Registry } from '../core/registry.schema';
import {
  type MirrorValidationIssue,
  validateRegistryMirror,
} from '../core/registryMirror';

export interface LoadedRegistryData {
  registries: Registry[];
  meta: RegistryMirrorMeta;
  warnings: MirrorValidationIssue[];
}
```

**Fetch/validate/error pattern** (lines 46-59):
```typescript
export async function loadRegistries(fetchImpl: FetchLike = fetch): Promise<LoadedRegistryData> {
  const url = `${import.meta.env.BASE_URL}data/registries.json`;
  const response = await fetchImpl(url);

  if (!response.ok) {
    throw new Error(`Registry mirror fetch failed: ${response.status} ${response.statusText}`);
  }

  const mirrorData = await response.json() as unknown;
  const validation = validateRegistryMirror(mirrorData);

  if (validation.errors.length > 0) {
    throw new Error(`Registry mirror validation failed: ${validation.errors.length} error(s)`);
  }
```

**Mapping pattern** (lines 64-84):
```typescript
return {
  meta: typedMirror.meta,
  warnings: validation.warnings,
  registries: typedMirror.registries.map(record => ({
    name: record.official.name,
    url: record.official.homepage,
    description: record.official.description,
    primary_focus: record.atlas?.primary_focus ?? [],
    component_tags: record.atlas?.component_tags ?? [],
    framework: 'React',
    license: 'Community',
    mirror: {
      officialName: record.official.name,
      registryUrlTemplate: record.official.registry_url_template,
      warnings: [
        ...(record.status?.warnings ?? []),
        ...(warningsByNamespace.get(record.official.name) ?? []),
      ],
    },
  })),
};
```

**Apply:** Preserve `official`, `atlas.aliases`, `atlas.coverage_status`, `atlas.confidence`, `atlas.notes`, and `status.warnings` needed by discovery/profile. Do not restore the legacy static `.data.ts` as runtime source.

---

### `src/registry-explorer/ui/discoveryView.ts` (component, transform)

**Analog:** `src/registry-explorer/ui/componentView.ts`

**Renderer signature pattern** (lines 40-45):
```typescript
export function renderComponentContent(
  headerRoot: HTMLElement,
  bodyRoot: HTMLElement,
  group: ComponentGroup | null,
  metrics: RegistryExplorerMetrics
): void {
```

**Header/body split pattern** (lines 46-57):
```typescript
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
```

**Dense row rendering pattern** (lines 79-128):
```typescript
const rows = group.registries.map(r => {
  const focusTags = r.primary_focus
    .map(f => `<span class="chip chip-focus chip-compact">${escapeHtml(focusLabel(f))}</span>`)
    .join("");
  const warningChip = r.mirror?.warnings.length
    ? `<span class="chip chip-warning chip-compact">${r.mirror.warnings.length} warning${r.mirror.warnings.length === 1 ? '' : 's'}</span>`
    : "";

  return `
    <div class="component-registry-row">
      <div class="component-registry-main">
        <div style="display: flex; align-items: baseline; gap: 8px;">
          <div class="component-registry-name">${escapeHtml(r.name)}</div>
          ${warningChip}
          ${renderExternalLink(r.url, 'Visit')}
        </div>
        <div class="component-registry-description">
          ${escapeHtml(r.description)}
        </div>
      </div>
      <div class="component-registry-meta">
        ${focusTags}
      </div>
    </div>
  `;
}).join("");
```

**Apply:** Render `ComponentCandidate[]` as compact comparison rows. Use `button` for `View profile`; use `renderExternalLink` for homepage/source/item route links; escape all labels, descriptions, slugs, reasons, and status copy.

---

### `src/registry-explorer/ui/registryProfileView.ts` (component, transform)

**Analog:** `src/registry-explorer/ui/focusView.ts`

**Card/section rendering pattern** (lines 69-115):
```typescript
const cards = registries.map(r => {
  const focusChips = r.primary_focus
    .map(f => `<span class="chip chip-focus">${escapeHtml(focusLabel(f))}</span>`)
    .join("");
  const tagChips = r.component_tags.slice(0, 5)
    .map(tag => `<span class="chip chip-tag chip-compact">${escapeHtml(componentLabel(tag))}</span>`)
    .join("");
  const warningChip = r.mirror?.warnings.length
    ? `<span class="chip chip-warning chip-compact">${r.mirror.warnings.length} warning${r.mirror.warnings.length === 1 ? '' : 's'}</span>`
    : "";

  return `
    <article class="registry-card">
      <div class="registry-header">
        <div>
          <div class="registry-name">${escapeHtml(r.name)}</div>
        </div>
        <div class="registry-actions">
          ${warningChip}
          ${renderExternalLink(r.url, 'Visit')}
        </div>
      </div>
      <div class="registry-description">
        ${escapeHtml(r.description)}
      </div>
      <div class="chip-row">
        ${focusChips}
      </div>
    </article>
  `;
}).join("");
```

**Apply:** Use full-width profile sections, not nested cards inside cards. Section headings must be exactly `Official shadcn facts`, `Registry Atlas enrichment`, `Item discovery status`, and `Why this matched` when match context exists.

---

### `src/registry-explorer/ui/componentView.ts`, `focusView.ts`, `matrixView.ts` (components, transform)

**Analogs:** same files

**Empty state pattern** from `matrixView.ts` (lines 57-65):
```typescript
if (!rows.length) {
  bodyRoot.innerHTML = `
    <div class="empty-state">
       <div class="empty-state-icon">⊘</div>
       <div>No registries match this filter.</div>
       <div>Clear the search or choose a different group.</div>
     </div>`;
  return;
}
```

**Matrix table pattern** from `matrixView.ts` (lines 67-101):
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

**Apply:** Evolve secondary views without removing them. Add status distribution hints to focus/component surfaces and replace binary matrix cells with status-aware cell view models where data exists.

---

### `src/registry-explorer/ui/renderSafety.ts` (utility, transform)

**Analog:** `src/registry-explorer/ui/renderSafety.ts`

**Escape and safe link pattern** (lines 3-38):
```typescript
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function renderExternalLink(
  url: string,
  label: string,
  className = 'registry-url'
): string {
  const safeUrl = toSafeExternalUrl(url);

  if (!safeUrl) {
    return UNSUPPORTED_URL_COPY;
  }

  return `<a href="${escapeHtml(safeUrl.href)}" class="${escapeHtml(className)}" target="_blank" rel="noreferrer">${escapeHtml(label)}</a>`;
}
```

**Apply:** All imported mirror text, aliases, notes, registry names, URLs, slugs, and match reasons must pass through `escapeHtml` or `renderExternalLink`. If adding an item-route link helper, keep the same safe URL behavior.

---

### `src/registry-explorer/ui/shell.ts` (controller, event-driven)

**Analog:** `src/registry-explorer/ui/shell.ts`

**State and initialization pattern** (lines 16-49):
```typescript
export interface ShellOptions {
  registries: readonly Registry[];
  mirrorMeta: RegistryMirrorMeta;
  mirrorWarnings: readonly MirrorValidationIssue[];
  roots: {
    aside: HTMLElement;
    contentHeader: HTMLElement;
    contentBody: HTMLElement;
    tabs: NodeListOf<Element>;
    searchInput: HTMLInputElement;
  };
}

interface AppState {
  currentView: 'focus' | 'component' | 'matrix';
  selectedFocus: PrimaryFocus | null;
  selectedComponent: ComponentTag | null;
  searchTerm: string;
}
```

**Render loop/error pattern** (lines 57-120):
```typescript
function render() {
  try {
    roots.tabs.forEach(tab => {
      const view = tab.getAttribute('data-view');
      if (view === state.currentView) {
        tab.classList.add('tab-active');
      } else {
        tab.classList.remove('tab-active');
      }
    });

    const metrics = computeMetrics(registries, state.searchTerm);

    if (state.currentView === 'focus') {
      const groups = buildFocusGroups(registries, state.searchTerm);
      renderFocusAside(roots.aside, groups, effectiveFocus);
      renderFocusContent(roots.contentHeader, roots.contentBody, itemsToShow, metrics);
    }

    renderMirrorStatus(roots.contentHeader, mirrorMeta, mirrorWarnings);
  } catch (error) {
    console.error('Registry Explorer: Render failed', error);
    roots.contentBody.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">!</div>
        <div>Something went wrong while rendering this view. Try clearing the search or reloading the page.</div>
      </div>
    `;
  }
}
```

**Event delegation pattern** (lines 124-162):
```typescript
roots.tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const view = tab.getAttribute('data-view');
    if (isView(view) && view !== state.currentView) {
      setState({ currentView: view });
    }
  });
});

roots.searchInput.addEventListener('input', (e) => {
  const target = e.target as HTMLInputElement;
  setState({ searchTerm: target.value || '' });
});

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
});
```

**Mirror status append pattern** (lines 168-195):
```typescript
function renderMirrorStatus(
  root: HTMLElement,
  meta: RegistryMirrorMeta,
  warnings: readonly MirrorValidationIssue[]
): void {
  const countMatches = meta.upstream_count === meta.local_count;
  const countText = `${meta.local_count} / ${meta.upstream_count} registries mirrored`;
  const synced = formatSyncTime(meta.synced_at);

  root.insertAdjacentHTML('beforeend', `
    <div class="mirror-status" aria-label="Registry mirror status">
      <div class="mirror-source">
        <span class="mirror-source-label">Official shadcn directory</span>
        ${renderExternalLink(meta.source_url, 'Source', 'mirror-source-link')}
      </div>
    </div>
  `);
}
```

**Apply:** Add a default `discover` view and selected profile/candidate state here. Keep state closure-local, update only through `setState`, and use delegated `data-*` attributes for candidate/profile selection.

---

### `index.html` (config, request-response)

**Analog:** `index.html`

**Static root pattern** (lines 38-60):
```html
<div class="search-bar">
  <div class="search-icon">⌕</div>
  <input
    id="searchInput"
    type="search"
    class="search-input"
    placeholder="Filter by name, focus, or tag"
  />
</div>
<div class="tabs" role="tablist">
  <button class="tab tab-active" data-view="focus" role="tab">
    <span class="label">By Focus</span>
    <span class="badge">Registry clusters</span>
  </button>
</div>
```

**Content roots pattern** (lines 64-72):
```html
<main>
  <aside>
    <div class="aside-inner" id="aside"></div>
  </aside>
  <section class="content">
    <div class="content-header" id="contentHeader"></div>
    <div class="content-body">
      <div class="scroll-region" id="contentBody"></div>
    </div>
  </section>
</main>
```

**Apply:** Reuse the single input; update placeholder to `Search components, items, registries, or aliases`. Add a discover/default tab only if shell routing needs a visible tab. Do not add a landing page or new framework roots.

---

### `public/styles/registry-explorer.css` (config, transform)

**Analog:** `public/styles/registry-explorer.css`

**Search/tabs pattern** (lines 187-239):
```css
.search-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 10px;
  background: radial-gradient(circle at top left, rgba(255, 255, 255, 0.06), transparent 60%),
              radial-gradient(circle at bottom right, rgba(255, 255, 255, 0.04), transparent 40%),
              rgba(8, 10, 20, 0.95);
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: var(--shadow-halo);
  width: 260px;
}

.tabs {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px;
}
```

**Header/status pattern** (lines 466-545):
```css
.content-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.content-metrics span {
  padding: 4px 8px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(0, 0, 0, 0.35);
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.mirror-status {
  flex-basis: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
```

**Dense row pattern** (lines 825-860):
```css
.component-registry-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 6px;
  padding: 4px 0;
  border-top: 1px dashed rgba(255, 255, 255, 0.12);
  font-size: 11px;
}

.component-registry-meta {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 4px;
}
```

**Matrix pattern** (lines 863-931):
```css
.matrix-wrapper {
  width: 100%;
  overflow-x: auto;
  padding-bottom: 4px;
  animation: fadeInUp 240ms ease-out;
}

table.matrix th,
table.matrix td {
  padding: 6px 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  border-right: 1px solid rgba(255, 255, 255, 0.06);
  text-align: left;
}

.matrix-icon {
  font-size: 14px;
  text-align: center;
  color: var(--accent);
}
```

**Apply:** Extend existing dark dense visual system. Add status chip classes for `verified`, `inferred`, `partial`, `unavailable`, and `unverified` using the UI spec colors. Keep rows stable and responsive; avoid marketing hero/card-grid redesign.

---

### Tests under `tests/registry-explorer/` (test, batch)

**Analogs:** `grouping.test.ts`, `registryLoader.test.ts`, `registryMirror.test.ts`, `renderSafety.test.ts`, `matrixColumns.test.ts`

**Pure helper test pattern** from `grouping.test.ts` (lines 1-11):
```typescript
import { describe, it, expect } from 'vitest';
import {
  filterRegistries,
  buildFocusGroups,
  buildComponentGroups,
  buildMatrixRows,
  computeMetrics
} from '../../src/registry-explorer/core/grouping';
import type { Registry } from '../../src/registry-explorer/core/registry.schema';

const mockRegistries: Registry[] = [
```

**Loader conversion test pattern** from `registryLoader.test.ts` (lines 17-36):
```typescript
it('converts normalized mirror records into display registries', async () => {
  const data = await loadRegistries(async () => jsonResponse(createMirror()));

  expect(data.registries).toEqual([
    expect.objectContaining({
      name: '@example',
      url: 'https://example.com',
      description: 'Example registry.',
      primary_focus: ['support'],
      component_tags: ['button'],
      framework: 'React',
      license: 'Community',
      mirror: {
        officialName: '@example',
        registryUrlTemplate: 'https://example.com/r/{name}.json',
        warnings: [],
      },
    }),
  ]);
});
```

**Validation test pattern** from `registryMirror.test.ts` (lines 40-68):
```typescript
it('fails javascript URL protocols', () => {
  const result = validateUrlField('javascript:alert(1)', 'official.homepage', '@example');

  expect(result.errors.map(error => error.code)).toContain('url-protocol-disallowed');
});

it('fails registry URL templates without the name token', () => {
  const result = validateRegistryUrlTemplate('https://example.com/r/button.json', '@example');

  expect(result.errors.map(error => error.code)).toContain('template-missing-token');
});
```

**Render safety test pattern** from `renderSafety.test.ts` (lines 21-40):
```typescript
it('rejects unsafe and malformed URLs', () => {
  expect(toSafeExternalUrl('javascript:alert(1)')).toBeNull();
  expect(toSafeExternalUrl('data:text/html,<h1>x</h1>')).toBeNull();
  expect(toSafeExternalUrl('//example.com/path')).toBeNull();
  expect(toSafeExternalUrl('not a url')).toBeNull();
});

it('renders unavailable copy for invalid external links', () => {
  expect(renderExternalLink('javascript:alert(1)', 'Visit')).toBe(
    'Link unavailable: unsupported URL protocol.'
  );
});
```

**Vocabulary/config test pattern** from `matrixColumns.test.ts` (lines 8-21):
```typescript
function expectNoDuplicates(values: readonly string[]): void {
  expect(new Set(values).size).toBe(values.length);
}

describe('matrixColumns', () => {
  it('should not contain duplicate vocabulary values', () => {
    expectNoDuplicates(PRIMARY_FOCUS_VALUES);
    expectNoDuplicates(COMPONENT_TAG_VALUES);
  });

  it('should have valid component tags', () => {
    MATRIX_COLUMNS.forEach(col => {
      expect(COMPONENT_TAG_VALUES).toContain(col);
    });
  });
```

**Apply:** Add focused tests before DOM wiring:
- `discovery.test.ts`: normalized search, exact/tag/alias/description ranking, unverified fallback visibility, match reasons.
- `registryProfile.test.ts`: official vs Atlas section data, warnings, freshness, match context.
- `itemRoutes.test.ts`: valid `{name}` resolution, missing slug/template, disallowed protocol, homepage not substituted as item route.
- `coverageStatus.test.ts`: labels, ordering, fallback/default handling.
- Update `registryLoader.test.ts` for aliases, coverage status, confidence, notes, warnings, and mirror provenance preservation.

## Shared Patterns

### Runtime Mirror Boundary

**Source:** `src/registry-explorer/data/loadRegistries.ts`
**Apply to:** `loadRegistries.ts`, `registry.schema.ts`, `discovery.ts`, `registryProfile.ts`

Preserve generated `public/data/registries.json` as the runtime source. Fetch through `${import.meta.env.BASE_URL}data/registries.json`, validate unknown JSON before casting, and expose typed `LoadedRegistryData` with `registries`, `meta`, and validation `warnings`.

### Validation and URL Safety

**Source:** `src/registry-explorer/core/registryMirror.ts`, `src/registry-explorer/ui/renderSafety.ts`
**Apply to:** `registryMirror.ts`, `itemRoutes.ts`, all UI renderers

Use allowlist validation for controlled values and URLs. Only `http:` and `https:` external URLs may render. Reject protocol-relative, malformed, `javascript:`, and `data:` values. Do not render a registry homepage as an item route.

### Pure Core Derivation

**Source:** `src/registry-explorer/core/grouping.ts`
**Apply to:** `discovery.ts`, `registryProfile.ts`, `coverageStatus.ts`, `grouping.ts`

Core helpers take `readonly Registry[]` or typed records, return new arrays/view models, sort deterministically, and avoid throwing for normal empty or partial-data cases.

### DOM Rendering

**Source:** `src/registry-explorer/ui/componentView.ts`, `src/registry-explorer/ui/focusView.ts`, `src/registry-explorer/ui/matrixView.ts`
**Apply to:** `discoveryView.ts`, `registryProfileView.ts`, updated secondary views

Renderers receive pre-derived data and root elements, assign `innerHTML`, and escape imported/data-derived text. External links use `renderExternalLink`; in-app actions use `button` with `data-*` attributes for shell delegation.

### Shell State and Events

**Source:** `src/registry-explorer/ui/shell.ts`
**Apply to:** `shell.ts`, `index.html`

Keep state closure-local in `initRegistryExplorer`, mutate through `setState`, route views inside one render loop, catch render failures with `Registry Explorer: Render failed`, and keep mirror status appended to the content header.

### CSS Visual System

**Source:** `public/styles/registry-explorer.css`
**Apply to:** discovery rows, profile sections, status chips, matrix status cells

Use existing dark surfaces, compact metrics/chips, dashed dividers, table layout, and responsive rules. New Phase 3 UI should be dense and scan-first, not a hero or marketing card grid.

## No Analog Found

All planned Phase 3 files have close analogs in the current codebase. The only new domain shape is item-level component route resolution; it should combine the existing mirror template validation pattern from `registryMirror.ts` with the safe external URL policy from `renderSafety.ts`.

## Metadata

**Analog search scope:** `src/registry-explorer/core/`, `src/registry-explorer/data/`, `src/registry-explorer/ui/`, `tests/registry-explorer/`, `index.html`, `public/styles/registry-explorer.css`, `public/data/registries.json`
**Files scanned:** 25
**Project skills checked:** `.codex/skills/` exists with GSD workflow skills; `gsd-plan-phase/SKILL.md` was checked for planner context. No phase-specific project implementation skill was found.
**Pattern extraction date:** 2026-05-25

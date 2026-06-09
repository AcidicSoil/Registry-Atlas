# Phase 04: Install Actions & Release Hardening - Pattern Map

**Mapped:** 2026-06-08T22:29:37Z  
**Inputs:** `04-CONTEXT.md`, `04-RESEARCH.md`, core/ui/tests/CSS/package/deploy files  
**Scope:** Copyable shadcn install/view commands, local install queue, URL state, source/raw links, CI release gate, browser/a11y smoke baseline.

## File Classification

| Likely New/Modified File | Role | Data Flow | Closest Existing Analog | Match Quality |
|---|---|---|---|---|
| `src/registry-explorer/core/installActions.ts` | utility | transform | `src/registry-explorer/core/itemRoutes.ts` | data-flow-match |
| `src/registry-explorer/core/installQueue.ts` | utility | transform | `src/registry-explorer/core/discovery.ts` | role-match |
| `src/registry-explorer/core/urlState.ts` | utility | parse/serialize | `src/registry-explorer/core/itemRoutes.ts` | role-match |
| `src/registry-explorer/core/registry.schema.ts` | model | transform | same file | exact |
| `src/registry-explorer/core/discovery.ts` | utility/view-model | transform | same file | exact |
| `src/registry-explorer/core/registryProfile.ts` | utility/view-model | transform | same file | exact |
| `src/registry-explorer/ui/discoveryView.ts` | component | render transform | same file | exact |
| `src/registry-explorer/ui/registryProfileView.ts` | component | render transform | same file | exact |
| `src/registry-explorer/ui/shell.ts` | controller | event-driven | same file | exact |
| `src/registry-explorer/ui/renderSafety.ts` | utility | transform | same file | exact |
| `public/styles/registry-explorer.css` | styles | transform | same file | exact |
| `tests/registry-explorer/installActions.test.ts` | test | batch | `tests/registry-explorer/itemRoutes.test.ts` | exact |
| `tests/registry-explorer/installQueue.test.ts` | test | batch | `tests/registry-explorer/discovery.test.ts` | role-match |
| `tests/registry-explorer/urlState.test.ts` | test | batch | `tests/registry-explorer/itemRoutes.test.ts` | role-match |
| existing tests under `tests/registry-explorer/` | test | batch | same files | exact |
| `.github/workflows/deploy.yml` | release config | CI batch | same file | exact |
| `package.json` | release config | script orchestration | same file | exact |
| docs/planning smoke checklist file if added | documentation | checklist | `04-RESEARCH.md` smoke section | role-match |

## Pattern Assignments

### `src/registry-explorer/core/installActions.ts` (new utility, transform)

**Analog:** `src/registry-explorer/core/itemRoutes.ts`

**Structured eligibility/result pattern:**
```ts
export type ResolvedItemRoute =
  | { status: 'available'; label: 'Open item route'; url: string }
  | { status: 'missing-item-slug' | 'invalid-item-slug' | 'invalid-template' | 'invalid-url' | 'catalog-not-verified'; label: 'Item route unavailable' | 'Catalog not verified'; url: null };

const ITEM_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function resolveRegistryItemRoute(namespace: string, registryUrlTemplate: string, itemSlug: string | undefined | null): ResolvedItemRoute {
  if (!itemSlug || itemSlug.trim().length === 0) return unavailable('missing-item-slug');
  const slug = itemSlug.trim();
  if (!ITEM_SLUG_PATTERN.test(slug)) return unavailable('invalid-item-slug');
  if (!namespace.startsWith('@') || !registryUrlTemplate.includes('{name}')) return unavailable('invalid-template');
  // URL parse + http/https allowlist follows...
}
```

**Apply:** Keep command/token generation pure and deterministic. Suggested exports:
- `buildInstallToken(namespace, itemSlug)` normalizes to exactly one leading `@`; never `@@registry/item`.
- `buildSingleInstallCommand(token)` returns exactly `npx shadcn@latest add <token>`.
- `buildInspectCommand(token)` returns exactly `npx shadcn@latest view <token>`.
- `getInstallActionState(...)` returns enabled command strings or disabled reasons, reusing `resolveRegistryItemRoute()` instead of duplicating URL/template rules.
- `buildBatchInstallCommand(tokens)` emits `npx shadcn@latest add @foo/button @bar/card` after dedupe.

Eligibility must be stricter than “has matching text”: only validated namespace + item slug + route-eligible item + available route can produce copy/queue commands. Fallback candidates from tags/aliases/focus/namespace/description must return disabled state with a clear reason.

---

### `src/registry-explorer/core/installQueue.ts` (new utility, transform)

**Analog:** pure array derivation in `src/registry-explorer/core/discovery.ts`

**Sorted/derived result pattern:**
```ts
const candidates: ComponentCandidate[] = [];
registries.forEach(registry => {
  const itemCandidates = (registry.itemSummaries ?? [])
    .filter(item => matchesItem(item, query))
    .map(item => buildItemCandidate(registry, item, query));
  candidates.push(...itemCandidates);
});
return candidates.sort(compareCandidates);
```

**Apply:** Model queue operations as pure transforms over readonly arrays/tokens:
- `addToInstallQueue(queue, item)` appends only if token is not present.
- `removeFromInstallQueue(queue, token)` filters by full token.
- `clearInstallQueue()` returns empty array.
- Dedupe key is the full install token `@<registry>/<item>`, not candidate ID or slug.
- Empty queue should produce disabled/no batch command state.

Queue state itself belongs in `shell.ts` local state for v1 and must not serialize to URL.

---

### `src/registry-explorer/core/urlState.ts` (new utility, parse/serialize)

**Analog:** defensive parsing in `itemRoutes.ts`; view allowlist in `shell.ts`.

**Allowlist pattern:**
```ts
function isView(value: string | null): value is AppState['currentView'] {
  return value === 'discover' || value === 'focus' || value === 'component' || value === 'matrix';
}
```

**Apply:** Keep URL parsing/serialization DOM-free. Suggested params:
- `view=discover|focus|component|matrix`
- `q=<search>`
- `registry=@namespace` when a profile is selected
- `focus=<primary_focus>` and `component=<component_tag>` when relevant
- optional `candidate=<id>` only if treated as best-effort/stale-safe

Invalid or stale params must fall back safely. Do not parse or serialize queue tokens. Shell boundary should hydrate from `window.location`, set `roots.searchInput.value`, and update with `history.replaceState` to avoid history spam.

---

### `src/registry-explorer/core/registry.schema.ts` (model, transform)

**Analog:** existing shared contracts.

**Current model pattern:**
```ts
export interface ComponentCandidate {
  id: string;
  registry: Registry;
  matchedLabel: string;
  matchedField: CandidateMatchField;
  itemSlug?: string;
  catalogStatus: ItemCatalogStatus;
  routeEligible: boolean;
  route?: string;
  coverageStatus: CoverageStatus;
}

export interface RegistryProfileItemRow {
  name: string;
  slug: string;
  catalogStatus: ItemCatalogStatus;
  routeEligible: boolean;
  route?: string;
  routeLabel: string;
}
```

**Apply:** Add shared action/queue/url view-model types here only if multiple modules consume them. Keep app-owned fields camelCase. Avoid storing executable side effects; commands are strings for copy only.

---

### `src/registry-explorer/core/discovery.ts` (utility/view-model, transform)

**Analog:** same file.

**Current route eligibility pattern:**
```ts
const route = item.routeEligible && registry.mirror
  ? resolveRegistryItemRoute(registry.name, registry.mirror.registryUrlTemplate, item.slug)
  : null;

return {
  id: `${registry.name}:${item.slug}`,
  matchedField: 'item',
  itemSlug: item.slug,
  catalogStatus: item.catalogStatus,
  routeEligible: item.routeEligible,
  route: route?.status === 'available' ? route.url : undefined,
};
```

**Fallback pattern:**
```ts
return {
  id: `${registry.name}:${matchedField}`,
  matchedField,
  catalogStatus: atlas.catalogStatus,
  routeEligible: false,
  matchReasons,
};
```

**Apply:** Either attach install action state during candidate construction or expose enough data for `shell.ts`/renderer to map candidates to action states. Do not let fallback candidates become command-eligible. Preserve deterministic ranking and non-throwing behavior for partial data.

---

### `src/registry-explorer/core/registryProfile.ts` (utility/view-model, transform)

**Analog:** same file.

**Current profile row derivation:**
```ts
function itemRow(registry: Registry, item: NonNullable<Registry['itemSummaries']>[number]): RegistryProfileItemRow {
  const route = item.routeEligible && registry.mirror
    ? resolveRegistryItemRoute(registry.name, registry.mirror.registryUrlTemplate, item.slug)
    : null;

  return {
    name: item.name,
    slug: item.slug,
    catalogStatus: item.catalogStatus,
    routeEligible: item.routeEligible,
    route: route?.status === 'available' ? route.url : undefined,
    routeLabel: route?.status === 'available' ? route.label : 'Catalog not verified',
  };
}
```

**Apply:** Profile item rows should expose the same install/view/copy/queue eligibility as Discover rows. Keep official facts vs Atlas enrichment sections intact. Do not invent item source URLs from `source` or `provenance`; raw item link is the resolved route when safe/available.

---

### `src/registry-explorer/ui/discoveryView.ts` (component, render transform)

**Analog:** same file.

**Current renderer pattern:**
```ts
export function renderDiscoveryContent(headerRoot, bodyRoot, candidates, overview, searchTerm, selectedCandidateId): void {
  headerRoot.innerHTML = `...`;
  bodyRoot.innerHTML = `
    ${partial ? '<div class="partial-data-note">...</div>' : ''}
    <div class="discovery-list">
      ${candidates.map(candidate => renderCandidate(candidate, candidate.id === selectedCandidateId)).join('')}
    </div>
  `;
}
```

**Safe links/buttons pattern:**
```ts
${candidate.route ? renderExternalLink(candidate.route, 'Open item route', 'discovery-route') : `<span class="discovery-route muted">Item route unavailable</span>`}
<button class="link-button" type="button" data-profile-registry="${escapeHtml(candidate.registry.name)}" data-candidate-id="${escapeHtml(candidate.id)}">View profile</button>
```

**Apply:** Render copy install, copy view, and add/remove queue controls as real `<button>` elements with `data-copy-command`, `data-queue-add`, etc. Disabled actions should remain visible as disabled buttons plus adjacent/associated reason text. Use `escapeHtml` for commands, tokens, labels, reasons, and data attributes. Keep source/profile links lower hierarchy to manage row density.

---

### `src/registry-explorer/ui/registryProfileView.ts` (component, render transform)

**Analog:** same file.

**Current section/fact pattern:**
```ts
bodyRoot.innerHTML = `
  <div class="profile-sections">
    ${profile.sections.map(section => `
      <section class="profile-section">
        <h2>${escapeHtml(section.name)}</h2>
        ${section.facts ? renderFacts(section.facts) : ''}
        ${section.items ? renderItems(section.items) : ''}
      </section>
    `).join('')}
  </div>
`;
```

**Apply:** Add item-row install/view copy and queue affordances with the same action-state contract as Discover. Preserve `renderExternalLink()` for homepage/source/item route links. Disabled profile row actions should explain why, not disappear.

---

### `src/registry-explorer/ui/shell.ts` (controller, event-driven)

**Analog:** same file.

**State/render pattern:**
```ts
interface AppState {
  currentView: 'discover' | 'focus' | 'component' | 'matrix';
  selectedFocus: PrimaryFocus | null;
  selectedComponent: ComponentTag | null;
  selectedCandidateId: string | null;
  selectedProfileRegistryName: string | null;
  searchTerm: string;
}

function setState(partial: Partial<AppState>) {
  state = { ...state, ...partial };
  render();
}
```

**Delegation pattern:**
```ts
roots.contentBody.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  const profileButton = target.closest('[data-profile-registry]');
  if (profileButton) { setState({ currentView: 'discover', selectedProfileRegistryName: profileButton.getAttribute('data-profile-registry') }); return; }
});
```

**Apply:** Add local queue state and copy feedback state here. Handle delegated `data-copy-command`, `data-queue-add`, `data-queue-remove`, `data-queue-clear`, and batch copy. Clipboard writes are side effects here only; render visible/announced success/failure feedback and keep command text available when `navigator.clipboard` fails. Hydrate/sync URL state at this boundary, not in renderers. Use `history.replaceState`; queue remains local only.

---

### `src/registry-explorer/ui/renderSafety.ts` (utility, transform)

**Analog:** same file.

**Safe URL/escape pattern:**
```ts
export function toSafeExternalUrl(value: string): URL | null {
  if (value.trim().startsWith('//')) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url : null;
  } catch {
    return null;
  }
}

export function renderExternalLink(url: string, label: string, className = 'registry-url'): string {
  const safeUrl = toSafeExternalUrl(url);
  if (!safeUrl) return 'Link unavailable: unsupported URL protocol.';
  return `<a href="${escapeHtml(safeUrl.href)}" class="${escapeHtml(className)}" target="_blank" rel="noreferrer">${escapeHtml(label)}</a>`;
}
```

**Apply:** All homepage/source/raw item links must go through this policy or an equivalent safe helper. Do not render unresolved registry URL templates as anchors. Unsupported protocols should display unavailable copy, not clickable anchors.

---

### `public/styles/registry-explorer.css` (styles, transform)

**Analog:** same file.

**Existing action layout pattern:**
```css
.discovery-actions {
  display: grid;
  justify-items: end;
  align-content: start;
  gap: 8px;
}
.discovery-route,
.secondary-link,
.link-button {
  color: var(--accent-secondary);
  font-size: 12px;
  line-height: 1.5;
}
.link-button {
  border: 0;
  background: transparent;
  cursor: pointer;
  padding: 0;
  font: inherit;
  text-decoration: underline;
}
```

**Existing responsive row pattern:**
```css
.discovery-row { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 16px; }
.profile-item-row { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 16px; align-items: center; }
@media (max-width: 760px) { .discovery-row, .profile-item-row { grid-template-columns: 1fr; } .discovery-actions { justify-items: start; } }
```

**Apply:** Add semantic classes for install action groups, disabled reasons, copy feedback, queue panel, token chips, batch command display, and visible focus states. Preserve dark compact visual system; avoid inline styles and major layout redesign.

---

### Tests under `tests/registry-explorer/` (test, batch)

**Analogs:** `itemRoutes.test.ts`, `discovery.test.ts`, `registryProfile.test.ts`, `renderSafety.test.ts`.

**Current pure test pattern:**
```ts
import { describe, expect, it } from 'vitest';
import { resolveRegistryItemRoute } from '../../src/registry-explorer/core/itemRoutes';

describe('resolveRegistryItemRoute', () => {
  it('resolves valid registry item routes', () => {
    expect(resolveRegistryItemRoute('@example', 'https://example.com/r/{name}.json', 'button')).toEqual({
      status: 'available',
      label: 'Open item route',
      url: 'https://example.com/r/button.json',
    });
  });
});
```

**Apply:** Add focused DOM-free Vitest coverage:
- `installActions.test.ts`: exact command strings, namespace normalization, invalid slug/template/route disabled reasons, no commands for fallback/inferred/non-route-eligible candidates, batch order/dedupe.
- `installQueue.test.ts`: add/remove/clear, dedupe by `@registry/item`, empty batch disabled.
- `urlState.test.ts`: valid parse/serialize, invalid stale params fall back, queue params ignored/not serialized.
- Update existing discovery/profile tests if action-state fields are added to view models.

---

### `.github/workflows/deploy.yml` (release config, CI batch)

**Analog:** same file.

**Current under-gated deploy pattern:**
```yaml
- run: pnpm install --frozen-lockfile
- run: pnpm build
- uses: actions/configure-pages@v4
- uses: actions/upload-pages-artifact@v3
  with:
    path: './dist'
```

**Apply:** Replace or precede `pnpm build` with `pnpm verify`. Since `verify` ends with `pnpm build`, `dist` will still exist for Pages upload. Keep Node 20 and pnpm 9 compatibility; do not use Node 24-only APIs.

---

### `package.json` (release config, script orchestration)

**Analog:** same file.

**Current release gate:**
```json
"scripts": {
  "typecheck": "tsc --noEmit",
  "typecheck:test": "tsc --noEmit -p tsconfig.test.json",
  "test": "TMPDIR=${TMPDIR:-/tmp} vitest run",
  "validate:data": "node scripts/validate-registry-data.mjs",
  "verify": "pnpm typecheck && pnpm typecheck:test && pnpm test && pnpm validate:data && pnpm build",
  "build": "tsc && vite build"
}
```

**Apply:** Keep `pnpm verify` as the local and CI release gate. Only add scripts if a documented/manual or automated browser smoke workflow is introduced. Avoid adding Playwright/Cypress/axe unless the implementation plan accepts that tooling scope.

---

### Browser/a11y smoke documentation (documentation, checklist)

**Analog:** `04-RESEARCH.md` browser smoke and a11y baseline sections.

**Apply:** Document the phase completion smoke baseline if not automated:
1. Copy install command for a known route-eligible item; verify exact `npx shadcn@latest add @registry/item`.
2. Copy inspect command; verify exact `npx shadcn@latest view @registry/item`.
3. Add duplicate queue items; verify deduped batch command.
4. Remove and clear queue.
5. Verify fallback/unavailable candidates show disabled reasons.
6. Verify profile item rows match Discover eligibility behavior.
7. Verify homepage/source/raw item links only render for safe URLs.
8. Verify tab/search/profile URL restoration and queue non-restoration.
9. Keyboard-only pass with visible focus.
10. Copy buttons have specific accessible labels and visible or `aria-live="polite"` feedback.

## Shared Patterns

### Pure Core Before DOM
Keep command generation, queue dedupe, disabled reasons, URL parsing/serialization, and route eligibility in `src/registry-explorer/core/` with Vitest coverage. UI should receive derived action state and render it; shell handles side effects.

### Explicit Disabled Reasons
Do not guess commands for incomplete or inferred data. Return/render clear disabled reasons for missing namespace, malformed namespace, missing/invalid slug, missing mirror/template, invalid route URL, non-route-eligible item, fallback/inferred candidate, and unsafe URL.

### Safe Links and Static App Boundary
Community registry data is untrusted. Use `renderExternalLink()`/`toSafeExternalUrl()` for external anchors. No backend, runtime install execution, account system, package-manager variants, or security/audit claims.

### Event Delegation and Local State
Use existing delegated `data-*` button pattern in `shell.ts`. Queue is closure-local UI state and not encoded in the URL. Clipboard is best-effort with visible/announced feedback.

### Release Gate
`pnpm verify` is the canonical local and deploy gate: typecheck, test typecheck, Vitest, data validation, and production build. CI should run the same gate before Pages artifact upload.

## No Analog Found

No planned Phase 04 file is without a usable analog. The newest behavior is command/queue generation, but it maps cleanly to existing pure-core route validation and DOM-free Vitest patterns.

## Metadata

**Analog search scope:** `src/registry-explorer/core/`, `src/registry-explorer/ui/`, `tests/registry-explorer/`, `public/styles/registry-explorer.css`, `package.json`, `.github/workflows/deploy.yml`  
**Files scanned directly:** 16  
**Pattern extraction date:** 2026-06-08T22:29:37Z

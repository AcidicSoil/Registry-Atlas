---
phase: 07
slug: item-detail-data-routing
status: approved
shadcn_initialized: false
preset: none
created: 2026-06-27
---

# Phase 07 — UI Design Contract

> Visual and interaction contract for Phase 7: Item Detail Data & Routing. Generated from Phase 7 context/research and verified against the user’s locked component-first direction.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none |
| Preset | not applicable |
| Component library | none |
| Icon library | none; use existing text symbols only when already established |
| Font | system-ui, -apple-system, BlinkMacSystemFont, "Chivo", sans-serif |

Phase 7 must extend the existing vanilla TypeScript + CSS visual system in `public/styles/registry-explorer.css`. Do not introduce a UI framework, component package, icon package, or design token system.

---

## Product UI Principle

The item route is a **component page**, not a JSON inspector. Existing result/profile cards are **summaries**, not detail pages.

The page should answer, in order:

1. What is this component/item?
2. What does it look like, or where can I see it?
3. Can I inspect/install it safely?
4. What useful status/dependency/file details help me evaluate it?

The page must **not** lead with registry JSON, schema fields, or raw source data. Raw JSON is for agents, maintainers, validation, tests, and internal loaders; it must not appear as a normal user-facing section, tab, card, or primary action.

---

## Layout Contract

### Page Structure

Use a full main-content item page within the existing app shell. The route may replace the current content body while preserving the global header/search/tabs frame.

Recommended top-to-bottom structure:

1. **Back row** — compact `← Back to results` or `← Back to registry` control.
2. **Component hero** — component title/name, registry namespace, item type/category chips, catalog/status chips.
3. **Visual area** — screenshot/preview placeholder area, preview image if available later, or honest “Preview not available in Atlas yet” state.
4. **Primary actions** — copy install, inspect/view command, open component/docs/demo page when available.
5. **Short description** — one short paragraph from item summary/detail.
6. **Evaluation details** — concise dependency, registry dependency, file, route, catalog, and warning metadata.
7. **Source/maintainer details** — lower-priority source/docs/evidence links, only when they help users see/evaluate the component.

### Primary Layout Pattern

Use the existing card/grid language:

- Hero container: reuse the elevated card feel from `.profile-section`, `.discovery-row`, and `.registry-card`.
- Visual area: large rounded rectangle inside the hero card with dashed/subtle border when no visual exists.
- Details: stacked cards or compact definition rows below the hero.
- Actions: existing `.install-actions`, `.install-button`, `.install-button-primary`, `.secondary-link`, `.link-button` patterns.

### Responsive Behavior

- Desktop: hero may use a two-column arrangement where the visual area dominates and actions/status sit beside or below it.
- Narrow/mobile: stack everything vertically. Keep component title, preview/placeholder, and primary actions above technical details.
- Do not add sticky sidebars in Phase 7; they risk crowding the component-first surface and are not required for MVP.

---

## Spacing Scale

Declared values (must be multiples of 4):

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Icon gaps, tiny inline spacing |
| sm | 8px | Compact chips, link groups, row gaps |
| md | 16px | Default internal card spacing and action grouping |
| lg | 24px | Hero/card padding and major item sections |
| xl | 32px | Page-level gaps between hero and detail cards |
| 2xl | 48px | Major visual separation only if the page gets long |
| 3xl | 64px | Avoid in Phase 7 unless matching existing page-level layout |

Exceptions: existing CSS uses some compact values such as 5px, 6px, 9px, 10px, 12px, 14px, 18px, and 22px. New Phase 7 styles should prefer the 4px scale above unless modifying an existing selector where a current non-4px value is already part of the local visual rhythm.

---

## Typography

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Body | 14px | 400 | 1.5 |
| Label | 12px | 600 | 1.35 |
| Heading | 24px | 700 | 1.2 |
| Display | 32px | 750 | 1.1 |

Typography must remain compact and scannable. Avoid long prose blocks on the item route. Use short headings and concise supporting text.

### Required Naming

Use component-focused labels:

- `Component preview`
- `Open component page`
- `Copy install`
- `Inspect first`
- `Component details`
- `Dependencies`
- `Files`
- `Preview not available in Atlas yet`

Avoid JSON-focused labels in the normal UI:

- Do not use `Raw JSON` as a section/tab/card label.
- Do not use `Open raw item route` as the primary item-page fallback label.
- Do not use `Registry JSON` as normal user-facing navigation.

---

## Color

Use existing CSS variables only.

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `--bg` `#05060a` | Page background and app shell |
| Secondary (30%) | `--bg-elevated` `#0b0d15`, `--bg-soft` `#101320`, `--bg-softer` `#151827` | Item hero, visual placeholder, detail cards |
| Accent (10%) | `--accent` `#ffd95e`, `--accent-secondary` `#65d4ff` | Primary copy action, preview emphasis, safe link emphasis, status highlights |
| Destructive | no new destructive color | Phase 7 has no destructive action; disabled/unavailable states use muted text and subtle borders |

Accent reserved for: primary copy action, component preview emphasis, active route/status highlight, safe external links, and selected/focused controls. Do not turn every interactive element yellow.

Failure/unavailable states should use muted text, dashed borders, and plain-language next steps rather than alarm colors.

---

## Visual Area Contract

The visual area is required even before screenshots exist. It prevents the item page from feeling like metadata-only UI.

### When a visual/preview URL exists

- Show it in the hero visual area if it is a safe image/preview source supported by implementation.
- Keep rounded corners and a subtle border.
- Do not execute third-party component code.

### When no visual exists

Show a placeholder in the hero visual area:

- Heading: `Preview not available in Atlas yet`
- Body: `Open the component page to see the live example.`
- Primary fallback action: `Open component page` when docs/demo/preview/component URL exists.
- Secondary fallback: `Open registry homepage` or `Open source` only if no component/docs/demo link exists.

Do not send users to raw JSON as the primary visual fallback.

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Primary CTA | `Open component page` when a docs/demo/preview page exists; otherwise `Copy install` if route/action is valid |
| Secondary CTA | `Inspect first` for copy-only `npx shadcn@latest view ...` |
| Install CTA | `Copy install` |
| Back action | `← Back to results` or `← Back to registry` depending on entry point |
| Empty state heading | `Component details unavailable` |
| Empty state body | `Atlas could not load this item yet. Open the component page or registry source to inspect it outside Atlas.` |
| Preview fallback heading | `Preview not available in Atlas yet` |
| Preview fallback body | `Open the component page to see the live example.` |
| Fetch/CORS error | `Atlas could not load this item from the registry. You can still open the component page or inspect the source outside Atlas.` |
| Invalid JSON/schema error | `Atlas could not read this registry item safely. The component page may still be available from the registry.` |
| Disabled install reason | Reuse existing action disabled reason from `installActions.ts` |
| Destructive confirmation | not applicable; Phase 7 has no destructive action |

Tone: direct, practical, no blame. Avoid developer-only phrases in user-facing copy such as `CORS`, `schema`, or `JSON` unless the page is clearly presenting a low-priority technical diagnostic.

---

## Existing Card Cleanup Contract

The current discovery/profile cards must be de-cluttered as part of Phase 7. The screenshot feedback shows cards becoming cramped because too many metadata fields and links are rendered directly inside each result card.

### Result/Profile Item Cards Must Become Summaries

Cards that appear in discovery results or registry profile item lists should act as compact entry points into the item page. They should not try to show every detail inline.

Each compact card should prioritize:

1. Component/item name.
2. Registry namespace.
3. One short description or one-line purpose.
4. At most one row of essential chips: status, confidence, type/category, and up to two taxonomy chips.
5. One primary action: `View component` or `Open component`.
6. Copy-only install/inspect actions only when they fit without crowding; otherwise they can move to the item page.

### Move Details Out of Cards

The following should move from crowded cards into the item detail page or lower-priority compact disclosure areas:

- Long descriptions.
- Full dependency counts plus dependency lists.
- File counts plus file/path lists.
- Source/provenance/evidence links.
- Multiple secondary links in a single horizontal row.
- Raw item/source route labels.
- Repeated route/status/debug labels.

### Raw Route Link Cleanup

Do not show `Open raw item route` in normal discovery/profile cards. Replace user-facing route language with component language:

- Use `View component` or `Open component` for the internal Atlas item route.
- Use `Open component page` for docs/demo/preview pages.
- Keep raw item URLs internal or maintainer-facing; they should not appear as crowded card actions.

### Density Limits

A normal result card should remain readable at narrow widths:

- No more than two visible metadata rows before the action row.
- No horizontal link cluster with more than two links.
- No wrapping action/link row that pushes the card into a tall, noisy block.
- No raw/debug/source wording in the primary card area.

If additional details are useful, the card should route to the item page instead of expanding inline.

---

## Interaction Contract

### Route Entry

Route-eligible discovery/profile items should get a clear item-page entry action. Label it with component language:

- Preferred: `View component`
- Acceptable: `Open component`
- Avoid: `Open raw item route`

### Back Behavior

- From discovery entry: back returns to discovery results with search/candidate context where possible.
- From registry profile entry: back returns to the profile or results context where possible.
- Browser URL should serialize the item route so direct links can restore the item page.

### Action Placement

Split actions by intent:

- Top/primary: `Open component page`, `Copy install`, `Inspect first`.
- Lower/secondary: registry homepage, source/evidence links, warnings, dependency/file details.
- Normal UI: no raw JSON display action.

### Accessibility

- All controls must be keyboard reachable.
- Focus states must remain visible using existing focus/hover visual language.
- Copy feedback must use `role="status"` / `aria-live="polite"` as the existing discovery queue does.
- Visual placeholder text must be readable without relying on color alone.
- External links must retain `target="_blank"` and `rel="noreferrer"` through `renderExternalLink`.

---

## Detail Content Contract

### Must Show

- Component title/name.
- Registry namespace.
- Item slug/token when useful for install clarity.
- Item type/category chips when available.
- Taxonomy/category chips when available.
- Catalog/status/confidence labels.
- Short description.
- Visual/preview area or placeholder.
- Copy-only install/view actions when valid.
- Component/docs/demo/source link when available.
- Dependencies/dev dependencies/registry dependencies counts and lists when available.
- File count and file path/target summaries when available.
- Specific fallback/error state when detail loading fails.

### Must Not Show in Normal UI

- Raw registry JSON section.
- Raw JSON tab.
- Raw JSON card.
- Raw JSON as the primary fallback action.
- Large schema/provenance dumps that crowd the component page.

### Optional Low-Priority Technical Details

- Warnings from item/registry validation.
- Evidence/source note if it helps explain catalog status.
- File target/path list in a compact detail card.
- Dependency list in compact chips or rows.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | item route, install/view commands, registry docs/source links | copy-only; no browser execution |
| third-party registries such as `@delego`, `@delta`, `@diceui` | item route, docs/demo/source links, dependencies/files/status metadata | copy-only `shadcn view` / `shadcn add`; source review encouraged; no endorsement/audit language |

Safety requirements:

- Never execute install/view commands in the browser.
- Never execute third-party component code in Atlas.
- Treat registry item JSON as untrusted data.
- Escape all third-party strings.
- Use safe URL rendering for external links.
- Do not imply Registry Atlas has audited or approved third-party code.

---

## Implementation Hooks

Suggested class names may follow the existing naming style:

- `.item-detail-page`
- `.item-detail-hero`
- `.item-preview-panel`
- `.item-preview-placeholder`
- `.item-action-row`
- `.item-detail-cards`
- `.item-detail-card`
- `.item-dependency-list`
- `.item-file-list`

Suggested renderer:

- `src/registry-explorer/ui/itemDetailView.ts`

Suggested core/view-model terms:

- `RegistryItemDetail`
- `RegistryItemDetailResult`
- `ItemDetailViewModel`

These names are recommendations, not required, but the final implementation must preserve the UI contract above.

---

## Checker Sign-Off

- [x] Dimension 1 Copywriting: PASS — copy is component-first and avoids normal raw JSON UI.
- [x] Dimension 2 Visuals: PASS — layout defines hero, visual area, fallback, details, and responsive behavior.
- [x] Dimension 3 Color: PASS — reuses existing CSS variables and reserves accent usage.
- [x] Dimension 4 Typography: PASS — explicit roles/sizes and compact scan-first guidance are defined.
- [x] Dimension 5 Spacing: PASS — spacing scale is declared with scoped exceptions for existing CSS rhythm.
- [x] Dimension 6 Registry Safety: PASS — copy-only commands, no code execution, safe rendering, and no endorsement language are required.

**Approval:** approved 2026-06-27

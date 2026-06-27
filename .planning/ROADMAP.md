# Roadmap: Registry Atlas

## Overview

Registry Atlas v1.2 turns the expanded catalog from “searchable summaries” into a visual component browsing experience. Users should be able to peek at what a route-eligible component looks like, open a detail route for real item JSON and metadata, and start seeing related/similar alternatives that can later power better component swap recommendations.

The milestone preserves the static Vite/vanilla TypeScript deployment model and copy-only install safety posture. It is not embed-first, does not execute third-party component code, and does not claim quality-ranked recommendations without evidence.

## Phases

**Phase Numbering:**

- Integer phases continue from the completed v1.1 milestone.
- v1.2 starts at Phase 7.
- Decimal phases remain reserved for urgent insertions.

- [ ] **Phase 7: Item Detail Data & Routing** - Users can open internal item detail routes backed by typed registry item JSON loading, safe failure states, raw JSON, dependency/file detail, and copy-only view/add commands.
- [ ] **Phase 8: Component Peek & Alternatives UI** - Users can quickly peek at component visuals/metadata from existing discovery/profile surfaces, filter by item type, and see related/similar alternatives without unsupported quality claims.

## Phase Details

### Phase 7: Item Detail Data & Routing

**Goal**: Users can open internal item detail routes backed by typed registry item JSON loading, safe failure states, raw JSON, dependency/file detail, and copy-only view/add commands.
**Mode:** mvp
**Depends on**: Phase 6
**Requirements**: ITEM-01, ITEM-02, ITEM-03, ITEM-04, ITEM-05, ITEM-06
**Success Criteria** (what must be TRUE):

  1. URL state can represent and restore an item detail route such as `view=item&registry=@delta&item=code-block`.
  2. A typed item detail loader can resolve a route-eligible summary, fetch or read item JSON, validate/normalize it, and return explicit loaded/unavailable/error states.
  3. The item detail page displays overview, taxonomy/status, dependencies, dev dependencies, registry dependencies, files/targets, escaped raw JSON, and safe source/docs/raw links.
  4. The item detail page provides copy-only shadcn `view` and `add` commands without executing either command in the browser.
  5. Invalid JSON, failed fetches, CORS/network blocks, unavailable routes, and missing catalogs render safe user-facing fallback states.
  6. The new route/detail behavior is covered by tests and remains part of `pnpm verify`.

**Canonical refs:**

- `.planning/PROJECT.md`
- `.planning/REQUIREMENTS.md`
- `.planning/research/SUMMARY.md`
- `.planning/research/ARCHITECTURE.md`
- `registry-altas-improvement-phase/gpt-agent-outputs/(original-seed-idea)registry-atlas-continued-improvements.md`
- `registry-altas-improvement-phase/gpt-agent-outputs/registry-catalog.normalized.json`
- `src/registry-explorer/core/urlState.ts`
- `src/registry-explorer/core/itemRoutes.ts`
- `src/registry-explorer/core/registry.schema.ts`
- `src/registry-explorer/ui/shell.ts`

**Plans:** 0/0 plans created

**Cross-cutting constraints:**

- Treat registry item JSON as data only.
- Escape all imported/raw fields before rendering.
- Preserve copy-only CLI behavior.
- Keep the app static and GitHub Pages-compatible.

### Phase 8: Component Peek & Alternatives UI

**Goal**: Users can quickly peek at component visuals/metadata from existing discovery/profile surfaces, filter by item type, and see related/similar alternatives without unsupported quality claims.
**Mode:** mvp
**Depends on**: Phase 7
**Requirements**: PEEK-01, PEEK-02, PEEK-03, PEEK-04, FILT-01, EVAL-01, EVAL-02, ALT-01, ALT-02, ALT-03
**Success Criteria** (what must be TRUE):

  1. Route-eligible items expose “Peek” or “View component” actions from discovery rows and registry profile item rows.
  2. Peek cards use the best available visual in a clear fallback order: screenshot/thumbnail, preview image, docs/demo link, raw metadata, or preview-unavailable state.
  3. Peek cards work with hover/focus and also with click/tap so the experience is not hover-only.
  4. Visual status, dependency/file/evaluation labels, and catalog-backed/manual states are concise and do not imply Registry Atlas has audited third-party code.
  5. Users can filter item-capable results by registry item type without losing a clear reset path.
  6. Peek/detail surfaces show related/similar alternatives by taxonomy tag/category/type/metadata, while explicitly avoiding “best” or quality-ranked claims.
  7. The peek, filter, evaluation, and alternatives behavior is covered by tests and remains part of `pnpm verify`.

**Canonical refs:**

- `.planning/PROJECT.md`
- `.planning/REQUIREMENTS.md`
- `.planning/research/SUMMARY.md`
- `.planning/research/FEATURES.md`
- `.planning/research/PITFALLS.md`
- `.planning/phases/06-component-search-and-taxonomy/06-03-SUMMARY.md`
- `src/registry-explorer/core/componentTaxonomy.ts`
- `src/registry-explorer/core/discovery.ts`
- `src/registry-explorer/core/registryProfile.ts`
- `src/registry-explorer/ui/discoveryView.ts`
- `src/registry-explorer/ui/registryProfileView.ts`
- `public/styles/registry-explorer.css`

**Plans:** 0/0 plans created

**Cross-cutting constraints:**

- This is a “peek,” not embed-first UI.
- Prefer screenshots/thumbnails/preview images when available, then metadata/link fallbacks.
- Do not execute third-party component code.
- Do not claim related alternatives are better unless a future evidence model supports it.

## Future Milestones

- **v1.3 Dynamic Coverage Matrix** — dynamic tag columns, component/tag picker, presets, and status-aware matrix modes.
- **v1.4 Registry Research Automation** — systematic registry iteration, catalog hydration, browser/manual research, screenshot capture pipelines, and manual follow-up registries such as `@7ovr` and `@devl`.
- **Future Component Recommendations** — evidence-backed component swap recommendations for improving generic AI-generated UI.

## Progress

**Execution Order:**
Phases execute in numeric order: 7 -> 8

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 7. Item Detail Data & Routing | 0/0 | Pending | — |
| 8. Component Peek & Alternatives UI | 0/0 | Pending | — |

## Next

Run `$gsd-discuss-phase 7` to gather implementation context for item detail data and routing.

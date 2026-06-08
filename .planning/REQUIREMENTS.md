# Requirements: Registry Atlas

**Defined:** 2026-05-25
**Core Value:** Users can quickly find the right shadcn-compatible registry or component and act on it without manually browsing dozens of registry sites.

## v1 Requirements

Requirements for the next milestone. Each maps to roadmap phases.

### Foundation

- [x] **FOUND-01**: Maintainer can run the project test suite with one documented package script.
- [x] **FOUND-02**: Maintainer can verify generated data, core grouping, command generation, and search behavior through automated tests.
- [x] **FOUND-03**: User only reaches the canonical Registry Atlas app surface; stale legacy and starter artifacts are removed or archived outside the deployed app.
- [x] **FOUND-04**: Imported registry text and URLs render through safe helpers that avoid untrusted `innerHTML` and reject unsafe URL protocols.
- [x] **FOUND-05**: Maintainer can update controlled focus/component vocabularies from a single source of truth without type/runtime drift.

### Official Mirror

- [ ] **MIRR-01**: Maintainer can sync the official shadcn registry directory from `https://ui.shadcn.com/r/registries.json`.
- [ ] **MIRR-02**: Sync stores raw upstream data, normalized generated app data, and a sync report with source URL, timestamp, upstream count, local count, and added/removed/changed registries.
- [ ] **MIRR-03**: Validation fails when registry namespaces are duplicated, missing, malformed, or lose the leading `@`.
- [ ] **MIRR-04**: Validation fails when registry homepage or registry URL template fields are missing, malformed, or use disallowed protocols.
- [ ] **MIRR-05**: User can see whether the local mirror matches the current upstream registry count, including the current 198-registry target when synced.
- [ ] **MIRR-06**: Registry records distinguish official upstream facts from Registry Atlas enrichment fields such as focus, tags, aliases, confidence, and notes.

### Discovery

- [ ] **DISC-01**: User can search by component need and see matching registry/component candidates as the primary discovery flow.
- [ ] **DISC-02**: User can search registry namespaces, descriptions, focus tags, component aliases, item names, and relevant metadata from one search input.
- [ ] **DISC-03**: User can inspect a registry profile showing namespace, description, homepage/source links, registry URL template, provenance, last sync, and item discovery status.
- [ ] **DISC-04**: User can distinguish verified item coverage from inferred, partial, unavailable, or unverified component coverage.
- [ ] **DISC-05**: User can compare component alternatives across registries with enough context to choose a candidate without opening every registry site.
- [ ] **DISC-06**: User can still browse registry-first focus and matrix views as secondary comparison views.
- [ ] **DISC-07**: User sees useful empty and partial-data states instead of false "no results" conclusions when third-party item catalogs are unavailable.

### Install Actions

- [x] **INST-01**: User can copy a single-item install command using exact `npx shadcn@latest add @<registry>/<item>` syntax for validated namespace/item pairs.
- [x] **INST-02**: User can copy an inspect-before-install command using exact `npx shadcn@latest view @<registry>/<item>` syntax for validated namespace/item pairs.
- [x] **INST-03**: User can open valid source, homepage, raw catalog, or raw item links from registry and component views.
- [x] **INST-04**: User can add multiple validated items to a queue and copy one deduped batch install command.
- [x] **INST-05**: User sees why an item cannot be copied or queued when namespace, item slug, source URL, or validation status is incomplete.
- [x] **INST-06**: Command-generation logic is pure and tested independently from the DOM.

### Hardening

- [ ] **HARD-01**: Maintainer can run a local validation command that checks upstream mirror data, generated app data, URL safety, command-token safety, and controlled vocabulary coverage.
- [x] **HARD-02**: CI verifies build, tests, data validation, and static deployment assumptions before release.
- [ ] **HARD-03**: Maintainer can review official-directory deltas before accepting regenerated data.
- [ ] **HARD-04**: User can see neutral provenance/freshness/status indicators without the app implying third-party code is approved or safe.
- [x] **HARD-05**: User can share or revisit a filtered discovery state through URL state for query, selected view, and relevant selection.
- [x] **HARD-06**: Search, tabs, copy buttons, filters, links, and queue controls have a documented accessibility baseline and targeted verification.

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Advanced Discovery

- **ADV-01**: User can use a keyboard command palette for registries, components, and copy actions.
- **ADV-02**: User can view package-manager command variants for npm, pnpm, yarn, and bun.
- **ADV-03**: User can inspect dependency, registry dependency, file, CSS variable, and environment variable impact for each item.
- **ADV-04**: User can see similar registry suggestions when no exact component match exists.
- **ADV-05**: Maintainer can run scheduled sync automation that opens reviewable pull requests for upstream directory changes.

### Visual Evaluation

- **VIS-01**: User can preview selected registry items visually when upstream metadata or source artifacts make this reliable.
- **VIS-02**: User can compare screenshots or demos for similar components across registries.

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Browser-executed installs | The shadcn CLI owns installation; the static app should only generate copyable commands. |
| User accounts, ratings, reviews, or payments | Registry Atlas is a discovery/install-assist tool, not a marketplace. |
| Security or approval badges for third-party registries | Community registry code is third-party; Registry Atlas can show provenance and validation status but cannot certify safety. |
| Rehosting third-party source as authoritative | Upstream registries remain the source; Registry Atlas should link to and summarize metadata, not become the canonical code host. |
| Backend database or service for v1 | The current static GitHub Pages deployment can support generated data and client-side discovery. |
| Full source-code indexing in the browser | It would increase bundle size and maintenance risk; link out or expose item metadata instead. |
| Unlabeled inferred classifications | Inferred tags can mislead install decisions unless clearly separated from upstream facts. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUND-01 | Phase 1 | Complete |
| FOUND-02 | Phase 1 | Complete |
| FOUND-03 | Phase 1 | Complete |
| FOUND-04 | Phase 1 | Complete |
| FOUND-05 | Phase 1 | Complete |
| MIRR-01 | Phase 2 | Pending |
| MIRR-02 | Phase 2 | Pending |
| MIRR-03 | Phase 2 | Pending |
| MIRR-04 | Phase 2 | Pending |
| MIRR-05 | Phase 2 | Pending |
| MIRR-06 | Phase 2 | Pending |
| DISC-01 | Phase 3 | Pending |
| DISC-02 | Phase 3 | Pending |
| DISC-03 | Phase 3 | Pending |
| DISC-04 | Phase 3 | Pending |
| DISC-05 | Phase 3 | Pending |
| DISC-06 | Phase 3 | Pending |
| DISC-07 | Phase 3 | Pending |
| INST-01 | Phase 4 | Complete |
| INST-02 | Phase 4 | Complete |
| INST-03 | Phase 4 | Complete |
| INST-04 | Phase 4 | Complete |
| INST-05 | Phase 4 | Complete |
| INST-06 | Phase 4 | Complete |
| HARD-01 | Phase 2 | Pending |
| HARD-02 | Phase 4 | Complete |
| HARD-03 | Phase 2 | Pending |
| HARD-04 | Phase 3 | Pending |
| HARD-05 | Phase 4 | Complete |
| HARD-06 | Phase 4 | Complete |

**Coverage:**

- v1 requirements: 30 total
- Mapped to phases: 30
- Unmapped: 0

---
*Requirements defined: 2026-05-25*
*Last updated: 2026-05-25 after initial definition*

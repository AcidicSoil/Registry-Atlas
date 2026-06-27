# Roadmap: Registry Atlas

## Overview

Registry Atlas v1.1 expands the actual component catalog. The imported improvement bundle already contains researched registries, normalized item data, proposed tags, and user notes saying the current app's “actual component” layer is shallow. This milestone uses that work to add more component items and make them discoverable. The in-app component viewer is the next milestone after this catalog foundation.

## Phases

**Phase Numbering:**

- Integer phases (5, 6): Planned v1.1 milestone work continuing from v1.0.
- Decimal phases (5.1, 5.2): Urgent insertions (marked with INSERTED).

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 5: Expanded Component Catalog** - Users can discover newly researched `@delego`, `@delta`, and `@diceui` component items with route, command, dependency, file, and source metadata where available.
- [ ] **Phase 6: Component Search & Taxonomy** - Users can find the expanded catalog through new tags, categories, aliases, search behavior, and status-aware registry/profile UI.

## Phase Details

### Phase 5: Expanded Component Catalog

**Goal**: Users can discover newly researched `@delego`, `@delta`, and `@diceui` component items with route, command, dependency, file, and source metadata where available.
**Mode:** mvp
**Depends on**: Phase 4
**Requirements**: CAT-01, CAT-02, CAT-03, CAT-04, CAT-05, CAT-06
**Success Criteria** (what must be TRUE):

  1. Maintainer can import or stage the normalized researched catalog without manually retyping records.
  2. User can discover component items from `@delego`, `@delta`, and `@diceui` in Registry Atlas.
  3. Registry/item summaries preserve useful metadata: route eligibility, install/view tokens, item type, dependencies, registry dependencies, files/targets, source/evidence URL, and catalog availability where present.
  4. Validation distinguishes catalog-backed item data from inferred, unavailable, or manual-follow-up records.
  5. Existing v1.0 official mirror data still validates and renders correctly.

**Canonical refs:**

- `registry-altas-improvement-phase/gpt-agent-outputs/(original-seed-idea)registry-atlas-continued-improvements.md`
- `registry-altas-improvement-phase/gpt-agent-outputs/update-plan.md`
- `registry-altas-improvement-phase/gpt-agent-outputs/registry-research-report.md`
- `registry-altas-improvement-phase/gpt-agent-outputs/registry-catalog.normalized.json`
- `.planning/codebase/STACK.md`
- `.planning/codebase/STRUCTURE.md`
- `.planning/codebase/CONVENTIONS.md`
- `.planning/codebase/TESTING.md`

**Plans:** 2/3 plans executed

Plans:
**Wave 1**

- [x] 05-01-import-normalized-catalog-PLAN.md — Import researched catalog records into Atlas source/generated data.

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 05-02-rich-item-schema-validation-PLAN.md — Preserve and validate richer imported item metadata.

**Wave 3** *(blocked on Wave 2 completion)*

- [ ] 05-03-expanded-catalog-discovery-profile-PLAN.md — Expose catalog-backed components in discovery/profile UI.

**Cross-cutting constraints:**

- Keep Phase 5 product-facing: add more real components and make them discoverable without implementing the v1.2 raw item viewer.

### Phase 6: Component Search & Taxonomy

**Goal**: Users can find the expanded catalog through new tags, categories, aliases, search behavior, and status-aware registry/profile UI.
**Mode:** mvp
**Depends on**: Phase 5
**Requirements**: DISC-01, DISC-02, DISC-03, DISC-04, DISC-05
**Success Criteria** (what must be TRUE):

  1. Proposed component tags from the research bundle are added where they expose actual cataloged items.
  2. Search finds new components by item name, registry namespace, tag, category, and useful aliases.
  3. New categories such as AI/chat, code/markdown, OTP/forms, badges/pills, color/media controls, maps, receipts/audit, and themes are discoverable.
  4. Search results and registry profiles clearly communicate catalog-backed, inferred, unavailable, and manual-follow-up states.
  5. The new taxonomy/search behavior is tested and included in `pnpm verify`.

**Canonical refs:**

- `registry-altas-improvement-phase/gpt-agent-outputs/component-taxonomy.proposed.json`
- `registry-altas-improvement-phase/gpt-agent-outputs/registry-coverage-matrix.json`
- `registry-altas-improvement-phase/gpt-agent-outputs/update-plan.md`
- `registry-altas-improvement-phase/gpt-agent-outputs/registry-research-report.md`
- `.planning/codebase/ARCHITECTURE.md`
- `.planning/codebase/CONVENTIONS.md`
- `.planning/codebase/TESTING.md`

**Plans**: 0 plans

Plans:
**Wave 1** *(blocked on Phase 5 completion)*

- [ ] TBD (run `$gsd-discuss-phase --text 6`, then `$gsd-plan-phase 6`)

## Future Milestones

The rest of the imported improvement bundle is intentionally split beyond v1.1:

- **v1.2 Component Item Viewer** — internal `view=item` route, real registry item JSON fetching, item detail tabs, raw JSON, files/dependencies, and first-class view/add copy actions.
- **v1.3 Dynamic Coverage Matrix** — matrix modes/presets once the expanded catalog and item viewer exist.
- **v1.4 Registry Research Automation** — browser-assisted/manual registry research and broader coverage expansion.

See `MILESTONES.md` and the Future Requirements section of `REQUIREMENTS.md` for preserved scope.

## Progress

**Execution Order:**
Phases execute in numeric order: 5 -> 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 5. Expanded Component Catalog | 2/3 | In Progress|  |
| 6. Component Search & Taxonomy | 0/TBD | Planned | — |

## Next

Run `$gsd-execute-phase 5` to implement the expanded component catalog plans.

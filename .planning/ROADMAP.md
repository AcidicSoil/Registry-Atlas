# Roadmap: Registry Atlas

## Overview

Registry Atlas v1 moves the existing static explorer into a reliable shadcn directory companion. The work starts by making the app safe and verifiable, then mirrors the official registry directory, then turns component-first discovery into the primary user path, and finally adds copyable install actions with release hardening.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation Safety & Verification** - Maintainers have a runnable, canonical, safe app foundation before importing broader third-party data.
- [ ] **Phase 2: Official Mirror & Data Pipeline** - Maintainers can sync, normalize, validate, and review the official shadcn registry directory.
- [ ] **Phase 3: Component-First Discovery** - Users can search by component need, inspect registry context, and understand coverage confidence.
- [ ] **Phase 4: Install Actions & Release Hardening** - Users can copy validated commands, manage a batch queue, share state, and trust the release checks.

## Phase Details

### Phase 1: Foundation Safety & Verification
**Goal**: Maintainers can safely evolve the existing Registry Atlas app with runnable tests, canonical deployed surface, safe rendering primitives, and one vocabulary source of truth.
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: FOUND-01, FOUND-02, FOUND-03, FOUND-04, FOUND-05
**Success Criteria** (what must be TRUE):
  1. Maintainer can run one documented package script that executes the project test suite.
  2. Maintainer can verify generated-data assumptions, grouping, search behavior, and future command logic through automated tests.
  3. User only reaches the canonical Registry Atlas app surface; stale legacy and starter artifacts are absent from the deployed app path.
  4. Imported registry text and URLs render through shared safe helpers that reject unsafe URL protocols.
  5. Maintainer can update focus and component vocabularies from one source without type/runtime drift.
**Plans**: TBD
**UI hint**: yes

### Phase 2: Official Mirror & Data Pipeline
**Goal**: Maintainers can keep Registry Atlas aligned with the official shadcn registry directory through reviewable sync artifacts and strict validation.
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: MIRR-01, MIRR-02, MIRR-03, MIRR-04, MIRR-05, MIRR-06, HARD-01, HARD-03
**Success Criteria** (what must be TRUE):
  1. Maintainer can sync `https://ui.shadcn.com/r/registries.json` into raw upstream data, normalized app data, and a sync report.
  2. Maintainer sees source URL, sync timestamp, upstream count, local count, and added/removed/changed registry deltas before accepting regenerated data.
  3. Validation fails on duplicate, missing, malformed, or de-prefixed registry namespaces.
  4. Validation fails on missing, malformed, or disallowed homepage and registry URL template protocols.
  5. User can see whether the local mirror matches the current upstream count, including the 198-registry target when synced.
**Plans**: TBD

### Phase 3: Component-First Discovery
**Goal**: Users can start from a component need, compare viable registry/item candidates, and inspect registry context without mistaking partial data for verified coverage.
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: DISC-01, DISC-02, DISC-03, DISC-04, DISC-05, DISC-06, DISC-07, HARD-04
**Success Criteria** (what must be TRUE):
  1. User can search from one primary input across component needs, item names, aliases, namespaces, descriptions, focus tags, and relevant metadata.
  2. User can inspect component alternatives across registries with enough namespace, description, source, status, and coverage context to choose a candidate.
  3. User can open a registry profile showing namespace, description, homepage/source links, registry URL template, provenance, last sync, and item discovery status.
  4. User can distinguish verified, inferred, partial, unavailable, and unverified component coverage in both results and registry profiles.
  5. User can still browse registry-first focus and matrix views as secondary comparison views with useful empty and partial-data states.
**Plans**: TBD
**UI hint**: yes

### Phase 4: Install Actions & Release Hardening
**Goal**: Users can safely act on validated registry/item choices while maintainers have release checks for build, tests, validation, deployment, URL state, and accessibility.
**Mode:** mvp
**Depends on**: Phase 3
**Requirements**: INST-01, INST-02, INST-03, INST-04, INST-05, INST-06, HARD-02, HARD-05, HARD-06
**Success Criteria** (what must be TRUE):
  1. User can copy validated single-item `npx shadcn@latest add @<registry>/<item>` and `npx shadcn@latest view @<registry>/<item>` commands.
  2. User can open valid homepage, source, raw catalog, or raw item links from registry and component views.
  3. User can add multiple validated items to a queue and copy one deduped batch install command.
  4. User sees a clear reason when an item cannot be copied or queued because namespace, item slug, source URL, or validation status is incomplete.
  5. Maintainer can rely on CI checks for build, tests, data validation, static deployment assumptions, URL state, and the documented accessibility baseline.
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation Safety & Verification | 0/TBD | Not started | - |
| 2. Official Mirror & Data Pipeline | 0/TBD | Not started | - |
| 3. Component-First Discovery | 0/TBD | Not started | - |
| 4. Install Actions & Release Hardening | 0/TBD | Not started | - |


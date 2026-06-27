# Milestones

## v1.0 Registry Atlas v1 (Shipped: 2026-06-09)

**Phases completed:** 4 phases, 17 plans, 20 tasks
**Archive:** [`milestones/v1.0-ROADMAP.md`](./milestones/v1.0-ROADMAP.md) · [`milestones/v1.0-REQUIREMENTS.md`](./milestones/v1.0-REQUIREMENTS.md)

**Key accomplishments:**

- Established a runnable verification baseline with Vitest, source/test type-checking, data validation, and production build gates.
- Mirrored the official shadcn registry directory into reviewable raw, normalized, and report artifacts.
- Added strict registry mirror validation and neutral provenance/freshness/status indicators.
- Shifted discovery to a component-first flow with item summaries, coverage confidence, route eligibility, and registry profiles.
- Added copy-only shadcn install/inspect commands, safe source/raw links, and a deduped local install queue.
- Added shareable discovery URL state and a documented browser/accessibility smoke baseline for release hardening.

**Known deferred items at close:** 0

---

## v1.1 Expanded Component Catalog (Planned: 2026-06-27)

**Source:** `registry-altas-improvement-phase/`

**Goal:** Add more real component items to Registry Atlas from the imported research bundle and make them discoverable through the existing static app.

**Planned phases:**

- Phase 5: Expanded Component Catalog
- Phase 6: Component Search & Taxonomy

**Key inputs:**

- Normalized sample catalog for `@delego`, `@delta`, and `@diceui`.
- Registry research report and update plan.
- Proposed component taxonomy with new tags and categories.

**Exit criteria:** Users can discover the newly researched component items in Atlas, and maintainers can validate that the data is catalog-backed rather than guessed.

---

## v1.2 Component Item Viewer (Candidate)

**Goal:** Let users inspect real registry item JSON inside Registry Atlas before copying shadcn view/add commands.

**Candidate phases:**

- Item Detail Data Loader
- Internal Item View UI

**Key inputs:**

- `registry-altas-improvement-phase/gpt-agent-outputs/(original-seed-idea)registry-atlas-continued-improvements.md`
- v1.1 expanded catalog data and route metadata

---

## v1.3 Dynamic Coverage Matrix (Candidate)

**Goal:** Replace the small fixed matrix with dynamic/preset coverage views after the expanded catalog and item viewer are in place.

**Candidate phases:**

- Matrix Column Builder
- Matrix Presets & Status-Aware UI

**Key inputs:**

- `registry-altas-improvement-phase/gpt-agent-outputs/component-taxonomy.proposed.json`
- `registry-altas-improvement-phase/gpt-agent-outputs/registry-coverage-matrix.json`

---

## v1.4 Registry Research Automation (Candidate)

**Goal:** Add browser-assisted and manual/docs-based research workflows for additional registries beyond the imported sample set.

**Candidate phases:**

- Catalog Hydration Pipeline
- Browser/Manual Research Workflow

**Key inputs:**

- `registry-altas-improvement-phase/gemini-deep-research-output-artifacts/Shadcn_Registry_Data_Collection.md`
- `registry-altas-improvement-phase/future-phases/Script for Browser UI.md`
- Manual-follow-up candidates such as `@7ovr` and `@devl`

---

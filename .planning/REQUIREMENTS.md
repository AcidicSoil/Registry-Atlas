# Requirements: Registry Atlas

**Defined:** 2026-06-27
**Current Milestone:** v1.1 Expanded Component Catalog
**Core Value:** Users can quickly find the right shadcn-compatible registry or component and act on it without manually browsing dozens of registry sites.

## v1.1 Requirements

Requirements for the current milestone. Each maps to roadmap phases.

### Expanded Catalog

- [x] **CAT-01**: User can discover component items from the newly researched `@delego`, `@delta`, and `@diceui` registries in Registry Atlas.
- [x] **CAT-02**: Maintainer can import or stage normalized researched registry/item data from `registry-altas-improvement-phase/gpt-agent-outputs/registry-catalog.normalized.json` without manually retyping records.
- [x] **CAT-03**: Registry records can show useful metadata from the research bundle, including homepage/source, catalog availability, framework, license where known, and route eligibility.
- [x] **CAT-04**: Item summaries can preserve item slug/name, title/description, type, category/tags, dependencies, registry dependencies, files/targets where available, source/evidence URL, install token, view command, and install command.
- [x] **CAT-05**: Validation distinguishes real catalog-backed item data from inferred or unavailable data so Registry Atlas does not overstate coverage.
- [x] **CAT-06**: Existing v1.0 official mirror data remains valid and usable after adding the new researched records.

### Component Search and Taxonomy

- [x] **DISC-01**: User can search/filter for the newly added components by item name, registry namespace, proposed tag, category, and useful aliases.
- [x] **DISC-02**: User can find new component categories from the research bundle, including AI/chat, code/markdown, OTP/forms, badges/pills, color/media controls, map widgets, receipts/audit, and themes.
- [x] **DISC-03**: Component tags from `component-taxonomy.proposed.json` are added with labels/categories where they help expose actual cataloged items.
- [x] **DISC-04**: Search and registry profile UI clearly explain whether a component is catalog-backed, inferred, unavailable, or manual-follow-up.
- [x] **DISC-05**: New catalog/search behavior is covered by tests and remains part of `pnpm verify`.

## Future Requirements

Deferred to future milestones. These preserve the rest of the imported improvement bundle without overloading v1.1.

### v1.2 Component Item Viewer

- **ITEM-01**: User can open an internal item detail route with URL state like `?view=item&registry=@delta&item=code-block`.
- **ITEM-02**: User can fetch and inspect real registry item JSON through a typed `RegistryItemDetail` model rather than only seeing summary metadata.
- **ITEM-03**: User can view item overview data including title, description, registry namespace, item slug, type, dependencies, dev dependencies, registry dependencies, files, targets, and raw JSON.
- **ITEM-04**: User can use first-class copy actions for shadcn `view` and `add` commands from the item detail surface without executing either command in the browser.
- **ITEM-05**: User sees safe failure states when an item route is unavailable, fetch fails, JSON is invalid, or a registry lacks a machine-readable catalog.

### v1.3 Dynamic Coverage Matrix

- **MATRIX-01**: User can switch the matrix from a fixed small column list to dynamic coverage modes: popular, all, selected, and preset.
- **MATRIX-02**: User can choose matrix presets for common discovery needs such as AI/chat, dashboards, forms, marketing, navigation, audio/voice, and primitives/media.
- **MATRIX-03**: Matrix status indicators explain catalog-backed, inferred, unavailable, and manual-follow-up coverage rather than presenting all coverage as equal certainty.

### v1.4 Registry Research Automation

- **AUTO-01**: Maintainer can run a browser-assisted registry exploration script against a target registry site using local model configuration.
- **AUTO-02**: Browser-assisted research outputs structured catalog/detail/verify/capture artifacts suitable for later import.
- **AUTO-03**: Manual/docs-based registry collection is supported for registries without machine-readable indexes such as `@7ovr` and `@devl`.
- **AUTO-04**: Scheduled or PR-based upstream sync automation keeps official and enriched registry data fresh.

## Out of Scope

Explicitly excluded from v1.1. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Internal item detail page | Important, but it is the v1.2 milestone after richer catalog data exists. |
| Dynamic matrix modes/presets | Useful, but best after v1.1 expands catalog/search and v1.2 adds item inspection. |
| Browser-assisted registry crawling | Useful for broader research, but v1.1 should use the already-imported data bundle. |
| Browser-executed installs | The shadcn CLI owns installation; the static app should only generate copyable commands. |
| Security or approval badges for third-party registries | Community registry code is third-party; Registry Atlas can show provenance and validation status but cannot certify safety. |
| Replacing the official shadcn directory as source of truth | Imported research enriches the official mirror but should not become a disconnected registry universe. |
| Backend service for v1.1 | Current static GitHub Pages deployment can support expanded generated data. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| CAT-01 | Phase 5 | Complete |
| CAT-02 | Phase 5 | Complete |
| CAT-03 | Phase 5 | Complete |
| CAT-04 | Phase 5 | Complete |
| CAT-05 | Phase 5 | Complete |
| CAT-06 | Phase 5 | Complete |
| DISC-01 | Phase 6 | Complete |
| DISC-02 | Phase 6 | Complete |
| DISC-03 | Phase 6 | Complete |
| DISC-04 | Phase 6 | Complete |
| DISC-05 | Phase 6 | Complete |
| ITEM-01 | Future v1.2 | Candidate |
| ITEM-02 | Future v1.2 | Candidate |
| ITEM-03 | Future v1.2 | Candidate |
| ITEM-04 | Future v1.2 | Candidate |
| ITEM-05 | Future v1.2 | Candidate |
| MATRIX-01 | Future v1.3 | Candidate |
| MATRIX-02 | Future v1.3 | Candidate |
| MATRIX-03 | Future v1.3 | Candidate |
| AUTO-01 | Future v1.4 | Candidate |
| AUTO-02 | Future v1.4 | Candidate |
| AUTO-03 | Future v1.4 | Candidate |
| AUTO-04 | Future v1.4 | Candidate |

**Coverage:**

- v1.1 requirements: 11 total
- Phase 5 complete: 6
- Phase 6 planned: 5
- Future candidate requirements: 12
- Unmapped: 0

---
*Requirements defined: 2026-06-27*

# Requirements: Registry Atlas

**Defined:** 2026-06-27
**Current Milestone:** v1.2 Component Peek & Alternatives Foundation
**Core Value:** Users can quickly find the right shadcn-compatible registry or component and act on it without manually browsing dozens of registry sites.

## v1.2 Requirements

Requirements for the current milestone. Each maps to roadmap phases.

### Component Peeks

- [ ] **PEEK-01**: User can trigger a quick component peek from any route-eligible discovery result or registry profile item without leaving the current browsing context.
- [ ] **PEEK-02**: User can see the best available visual for a component using a clear fallback order: screenshot/thumbnail, preview image, docs/demo link, raw metadata, or preview-unavailable state.
- [ ] **PEEK-03**: User can use component peeks with mouse, keyboard focus, and click/tap so the feature is not hover-only.
- [ ] **PEEK-04**: User can distinguish real visual previews from docs links, raw item metadata, and unavailable visuals.

### Item Detail Viewer

- [ ] **ITEM-01**: User can open an internal item route with URL state like `?view=item&registry=@delta&item=code-block`.
- [ ] **ITEM-02**: User can load real registry item JSON through a typed `RegistryItemDetail` model rather than only seeing summary metadata.
- [ ] **ITEM-03**: User can view item overview data including title, description, registry namespace, item slug, type, category, taxonomy labels, visual status, and catalog status.
- [ ] **ITEM-04**: User can view item technical details including dependencies, dev dependencies, registry dependencies, files, target paths, and escaped raw JSON.
- [ ] **ITEM-05**: User can copy shadcn `view` and `add` commands from the item detail surface without the browser executing either command.
- [ ] **ITEM-06**: User sees safe failure states when an item route is unavailable, fetch fails, JSON is invalid, CORS/network access blocks loading, or a registry lacks a machine-readable item route.

### Filtering and Evaluation

- [ ] **FILT-01**: User can filter item-capable discovery/profile results by registry item type such as `registry:ui`, `registry:block`, `registry:page`, `registry:lib`, or unknown.
- [ ] **EVAL-01**: User can see concise evaluation badges or labels based on item JSON and summary metadata, including dependency counts, registry dependency counts, file counts, visual availability, and catalog-backed status.
- [ ] **EVAL-02**: User can inspect dependency/risk context without Registry Atlas implying that third-party code has been audited or approved.

### Alternatives Foundation

- [ ] **ALT-01**: User can see related or similar component alternatives from the same taxonomy tag, category, item type, or registry item metadata on peek/detail surfaces.
- [ ] **ALT-02**: User can tell that related components are similarity-based alternatives, not quality-ranked “best” recommendations.
- [ ] **ALT-03**: Maintainer can preserve visual/evaluation metadata needed for later component swap recommendations without adding AI ranking or fake quality scores in v1.2.

## Future Requirements

Deferred to future milestones. These preserve the rest of the imported improvement bundle and long-term product direction without overloading v1.2.

### v1.3 Dynamic Coverage Matrix

- **MATRIX-01**: User can switch the matrix from a fixed small column list to dynamic coverage modes: popular, all, selected, and preset.
- **MATRIX-02**: User can choose matrix presets for common discovery needs such as AI/chat, dashboards, forms, marketing, navigation, audio/voice, and primitives/media.
- **MATRIX-03**: Matrix status indicators explain catalog-backed, inferred, unavailable, and manual-follow-up coverage rather than presenting all coverage as equal certainty.
- **MATRIX-04**: User can use a component/tag picker to choose matrix columns from the expanded taxonomy.

### v1.4 Registry Research Automation

- **AUTO-01**: Maintainer can run a browser-assisted registry exploration script against a target registry site using local model configuration.
- **AUTO-02**: Browser-assisted research outputs structured catalog/detail/verify/capture artifacts suitable for later import.
- **AUTO-03**: Manual/docs-based registry collection is supported for registries without machine-readable indexes such as `@7ovr` and `@devl`.
- **AUTO-04**: Scheduled or PR-based upstream sync automation keeps official and enriched registry data fresh.
- **AUTO-05**: Maintainer can systematically iterate through remaining official registries and prioritize those with machine-readable catalogs.

### Future Component Recommendations

- **REC-01**: User can compare a current/basic component against better alternatives using evidence-backed ranking signals.
- **REC-02**: User can ask for component swaps for generic AI-generated UI and receive alternatives with rationale.
- **REC-03**: User can compare candidate alternatives side-by-side visually.

## Out of Scope

Explicitly excluded from v1.2. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Embed-first third-party previews | User clarified they want a peek/screenshot/visual, not embedded sites; external sites can also block iframe embedding. |
| Executing arbitrary third-party component code in Atlas | Security and dependency scope are too large; v1.2 loads registry item JSON as data and keeps commands copy-only. |
| Full AI-powered “best swap” recommendations | Alternatives need evidence-backed ranking later; v1.2 only lays the related/similar component foundation. |
| Dynamic matrix modes and presets | Still valuable, but this belongs in v1.3 after peek/detail surfaces exist. |
| Full registry crawling or systematic catalog hydration | Still valuable, but this belongs in v1.4 research automation. |
| Browser-executed installs | The shadcn CLI owns installation; the static app only generates copyable commands. |
| Security approval badges for third-party registries | Registry Atlas can show metadata and risk context but cannot certify safety. |
| Backend service for v1.2 | The milestone should preserve static GitHub Pages deployment unless a concrete preview/data limitation forces a later change. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| PEEK-01 | Phase 8 | Pending |
| PEEK-02 | Phase 8 | Pending |
| PEEK-03 | Phase 8 | Pending |
| PEEK-04 | Phase 8 | Pending |
| ITEM-01 | Phase 7 | Pending |
| ITEM-02 | Phase 7 | Pending |
| ITEM-03 | Phase 7 | Pending |
| ITEM-04 | Phase 7 | Pending |
| ITEM-05 | Phase 7 | Pending |
| ITEM-06 | Phase 7 | Pending |
| FILT-01 | Phase 8 | Pending |
| EVAL-01 | Phase 8 | Pending |
| EVAL-02 | Phase 8 | Pending |
| ALT-01 | Phase 8 | Pending |
| ALT-02 | Phase 8 | Pending |
| ALT-03 | Phase 8 | Pending |

**Coverage:**

- v1.2 requirements: 16 total
- Mapped to phases: 16
- Unmapped: 0

---
*Requirements defined: 2026-06-27*
*Last updated: 2026-06-27 after v1.2 requirements definition*

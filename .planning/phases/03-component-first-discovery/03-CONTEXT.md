# Phase 3: Component-First Discovery - Context

**Gathered:** 2026-05-25
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase turns Registry Atlas into a component-first discovery experience. Users should start from one primary search input, see viable registry/component candidates, compare alternatives, and inspect registry context without manually opening every community registry site.

It covers search and ranking across registry metadata, Atlas enrichment, aliases, item names when available, focus tags, component tags, confidence/status fields, validated registry item routes, registry profiles, and secondary focus/matrix views. It does not implement copyable install/view commands, batch queues, URL share state, CI release hardening, or a full accessibility baseline expansion; those belong to Phase 4.

</domain>

<decisions>
## Implementation Decisions

### Component-First Search and Results
- **D-01:** Make one primary search input the lead workflow. It should search namespaces, descriptions, focus tags, component tags, aliases, item names when available, coverage status, confidence, and relevant mirror metadata.
- **D-02:** Default search results should be component-first, not registry-first. A query for `button`, `data grid`, `chat`, or `auth form` should surface matching component/capability candidates first, with the registry as context.
- **D-03:** Rank exact item/component/tag matches above alias and description matches, then rank records with higher confidence/status clarity above unverified records. Do not hide unverified records; sort them lower and label them clearly.
- **D-04:** Use dense comparison rows or compact result cards optimized for scanning. Each candidate should show registry namespace, matched component/capability label, item slug when known, direct registry item route when validated, short description, coverage status, confidence/provenance, warning indicators, and source/profile affordances.
- **D-05:** Avoid marketing-style hero or large card grids for the primary experience. The first screen should remain the usable explorer, with search and results visible immediately.
- **D-06:** Search should degrade gracefully. If no verified or inferred component match exists, show partial/unverified registry matches with clear status copy instead of a false "no results" conclusion.
- **D-06a:** The primary value is item-level linking for every component a registry exposes. If the user searches for any component, results should show every known matching component candidate and, for each validated registry/item pair, a direct link resolved from the registry URL template rather than only linking to the registry homepage.

### Coverage Confidence and Status Language
- **D-07:** Use explicit coverage states: `verified`, `inferred`, `partial`, `unavailable`, and `unverified`.
- **D-08:** Treat current Atlas enrichment as inferred or unverified unless a concrete item catalog or direct registry item match proves coverage. Do not present component tags as guaranteed installable items unless validation has confirmed an item slug.
- **D-09:** Status copy should be neutral and practical: "Verified item", "Inferred from Atlas tags", "Partial catalog", "Catalog unavailable", or "Unverified coverage". Avoid implying Registry Atlas certifies third-party code.
- **D-10:** Empty states must explain data limitations. For example: "No verified item matches yet; showing unverified registry matches" is better than "No results" when mirror or catalog coverage is incomplete.
- **D-11:** Warnings from Phase 2 remain review/status indicators, not scare labels. Valid official links remain available unless mechanically invalid.

### Component Item Routes
- **D-12:** Phase 3 must model component/item candidates separately from registry homepages. A registry match without a known item slug is useful context, but it is not equivalent to a direct component route.
- **D-13:** A direct component route is valid only when the registry namespace is valid, the registry URL template is valid, the item slug/token is known and valid, and resolving the template produces an allowed `http:` or `https:` URL.
- **D-14:** Candidate results should prefer direct item links such as a resolved `{name}` route over generic homepage links. Homepage/profile links remain secondary context.
- **D-15:** When no validated item route exists for a matching registry, show a clear status such as "item route unavailable" or "catalog not verified" instead of hiding the registry or pretending the homepage is the component link.
- **D-16:** Copyable `npx shadcn@latest add/view` commands remain Phase 4, but Phase 3 should produce the validated namespace/item/template data those commands will need.

### Registry Profile
- **D-17:** Add an inspectable registry profile/detail view for each registry. It should expose namespace, description, homepage/source link, registry URL template, official source provenance, last sync, warning status, coverage status, confidence, aliases, focus tags, component tags, item discovery status, and any discovered item routes.
- **D-18:** The registry profile should distinguish official shadcn facts from Registry Atlas enrichment visually and structurally, following the Phase 2 `official` vs `atlas` split.
- **D-19:** Profiles should include useful "why this matched" context when opened from search results: matched fields, matched aliases/tags/items, item route availability, and coverage status behind the result.
- **D-20:** Profiles should link out to upstream sources for inspection, but still avoid Phase 4 command-copy actions except for clearly deferred placeholders if needed for layout planning.

### Secondary Views
- **D-21:** Keep focus, component, and matrix browsing as secondary comparison modes. Do not remove them; reposition them as ways to browse and compare after search.
- **D-22:** The component view should evolve into a component index/facet that supports the primary search flow rather than a separate dead-end mode.
- **D-23:** The matrix should show coverage/status, not just yes/no coverage, where data allows. Unknown/unverified cells should be visually distinct from confirmed absence.
- **D-24:** Focus view should remain useful for broad browsing, but it should carry status language when groups contain mostly unverified or inferred records.

### Data and Implementation Boundaries
- **D-25:** Build Phase 3 on `public/data/registries.json` and `src/registry-explorer/data/loadRegistries.ts`; do not restore the legacy static TypeScript dataset as the runtime source.
- **D-26:** Add pure search/index/derivation helpers under `src/registry-explorer/core/` and test them directly before wiring DOM rendering.
- **D-27:** Keep the app static and client-side. Do not add a backend, database, or scheduled sync for Phase 3.
- **D-28:** If item catalogs are fetched or generated in Phase 3, store their availability/status explicitly and keep unavailable catalogs from blocking registry-level discovery.
- **D-29:** Add or reuse pure URL/template helpers for resolving registry item routes. This logic must be tested independently from DOM rendering and should become the source for Phase 4 command/link validation.

### the agent's Discretion
- The user asked for optimal choices for the best possible experience in all regards. Downstream agents should use the decisions above as locked defaults and choose implementation details that maximize fast scanning, truthful status, static deployability, and future Phase 4 command support.
- If implementation reveals a conflict between polished discovery and honest coverage status, prioritize honest status. The product value depends on users not mistaking inferred or unavailable data for verified component availability.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Scope
- `.planning/PROJECT.md` - Product direction, core value, active requirements, and constraints for Registry Atlas.
- `.planning/REQUIREMENTS.md` - Phase 3 requirement IDs `DISC-01` through `DISC-07` and `HARD-04`.
- `.planning/ROADMAP.md` - Phase 3 goal, MVP mode, dependency on Phase 2, and success criteria.
- `.planning/STATE.md` - Current execution state and completed Phase 2 context.

### Prior Phase Decisions
- `.planning/phases/01-foundation-safety-verification/01-CONTEXT.md` - Safe rendering, verification baseline, static Vite constraints, and vocabulary source-of-truth decisions.
- `.planning/phases/02-official-mirror-data-pipeline/02-CONTEXT.md` - Official mirror boundary, official vs Atlas provenance, validation/warning policy, and deferred Phase 3 item discovery.
- `.planning/phases/02-official-mirror-data-pipeline/02-04-SUMMARY.md` - Maintainer sync/validate/verify workflow and current official mirror count.

### Codebase Maps
- `.planning/codebase/STACK.md` - Static Vite/vanilla TypeScript stack and GitHub Pages constraints.
- `.planning/codebase/STRUCTURE.md` - File placement and module boundaries for core, data, UI, tests, and docs.
- `.planning/codebase/CONVENTIONS.md` - Naming, import, rendering, testing, and TypeScript conventions.

### Runtime Data and Docs
- `public/data/registries.json` - Generated runtime mirror consumed by the app.
- `data/shadcn/sync-report.json` - Current sync delta and count review surface.
- `docs/registry-explorer-data.md` - Generated mirror maintenance workflow and `official` vs `atlas` field provenance.

### Upstream Sources
- `https://ui.shadcn.com/docs/directory` - Official shadcn registry directory and CLI registry context.
- `https://ui.shadcn.com/r/registries.json` - Official registry directory JSON source.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/registry-explorer/data/loadRegistries.ts` - Runtime mirror fetch/conversion boundary returning registries, metadata, and warnings.
- `public/data/registries.json` - Generated runtime mirror with `official`, `atlas`, and `status` sections.
- `src/registry-explorer/core/registry.schema.ts` - Controlled vocabularies and current `Registry` shape; likely place to add search/profile/result types.
- `src/registry-explorer/core/grouping.ts` - Existing pure filtering/grouping/metrics functions; extend or complement with component-first search helpers.
- `src/registry-explorer/core/labels.ts` - Existing label mapping for controlled tags/focus values.
- `src/registry-explorer/ui/shell.ts` - State and view routing; likely integration point for primary search, selected result/profile state, and secondary view routing.
- `src/registry-explorer/ui/focusView.ts`, `src/registry-explorer/ui/componentView.ts`, and `src/registry-explorer/ui/matrixView.ts` - Existing renderers to evolve without replacing the app architecture.
- `src/registry-explorer/ui/renderSafety.ts` - Shared escaping and external-link rendering boundary.
- `tests/registry-explorer/` - Vitest test location for pure search/index/profile derivation coverage.

### Established Patterns
- Keep pure data transformations in `src/registry-explorer/core/` and test them without DOM.
- Keep runtime data loading under `src/registry-explorer/data/`.
- Keep DOM renderers under `src/registry-explorer/ui/` with escaped template-string output.
- Preserve two-space indentation, single-quoted TypeScript imports/strings, relative imports, and `.test.ts` test naming.
- Use `pnpm verify` as the combined source/test/data/build gate.

### Integration Points
- `index.html` currently provides one global search input and tab controls; Phase 3 can reuse this surface rather than adding a new landing page.
- `src/registry-explorer/ui/shell.ts` owns `currentView`, selected focus/component, and `searchTerm`; Phase 3 likely adds selected result/profile state and a primary results view.
- `public/styles/registry-explorer.css` owns the dense explorer visual system; new result/profile states should fit this surface.
- `src/registry-explorer/core/matrixColumns.ts` controls matrix columns and should remain the single place for representative matrix configuration.

</code_context>

<specifics>
## Specific Ideas

- Primary results should answer "I need this component; which registry can help?" before asking the user to choose a registry brand.
- For any component search, the intended result is a list of matching item candidates across registries, each with the validated registry route to that component when known.
- The best default is a searchable comparison list with compact rows/cards, status chips, matched-field explanations, and a profile/details affordance.
- Component-first search should include synonyms/aliases where available, but aliases are Atlas enrichment and should be labeled as such when they influence results.
- Unknown and unverified coverage should remain visible but visually lower-confidence, so the app helps exploration without overstating certainty.

</specifics>

<deferred>
## Deferred Ideas

- Copyable `npx shadcn@latest add @<registry>/<item>` and `view` commands belong to Phase 4.
- Batch install queue, deduped install command generation, and command-token safety UI belong to Phase 4.
- URL share state belongs to Phase 4.
- Package-manager command variants, visual previews, similar-registry recommendations, and scheduled sync PR automation remain v2 ideas.

</deferred>

---

*Phase: 3-Component-First Discovery*
*Context gathered: 2026-05-25*

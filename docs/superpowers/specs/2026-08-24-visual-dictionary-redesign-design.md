# Registry Atlas Visual Dictionary Redesign

## Status

Approved design direction: Superdesign Direction A, v3.

Reference exemplar: Name That UI (`namethatui.com`). The exemplar supplies the discovery model and visual-language inspiration; Registry Atlas keeps its own registry-specific data, comparison, provenance, and install capabilities.

## Product intent

Registry Atlas should help a developer answer four questions quickly:

1. What component do I need?
2. Which registries provide credible implementations of it?
3. How do the alternatives compare?
4. How do I inspect or install the implementation safely?

The primary experience is therefore a visual, search-first component catalog rather than a browser for Atlas's internal taxonomy.

## Design principles

- Search first; filters narrow results rather than define separate browsing modes.
- Use conventional user-facing facets instead of raw metadata dimensions.
- Expose provenance and verification where they help a decision, not as the main navigation model.
- Never fabricate registry previews, popularity, recency, framework, license, or other unavailable data.
- Preserve Registry Atlas's install, inspection, comparison, deep-link, and evidence strengths.
- Keep the existing lightweight vanilla TypeScript architecture unless implementation evidence requires otherwise.

## Information architecture

Primary navigation becomes:

- **Discover** — default visual dictionary and natural-language search surface.
- **Registries** — browse registry namespaces/sources and inspect their available components.
- **Compare** — the existing matrix capability reframed as an intentional comparison tool.

The legacy **By Focus** and standalone **By Component** modes are removed from primary navigation. Their useful concepts become filters or comparison inputs inside the new IA.

Component/item detail pages remain routed destinations reached from search results, registry pages, related-item links, or Compare. They are not top-level navigation items.

## Discover surface

Discover contains:

- Natural-language search that accepts component names, aliases, capabilities, registry namespaces, and rough descriptions.
- A responsive specimen-card grid.
- Conventional filter controls immediately below search.
- Active filter chips with individual removal and **Clear all**.
- Sort controls limited to data-supported options.
- Install queue access without making the queue the dominant page structure.

The default sort is **Relevance**. The other initial sort is **Name A-Z**. Newest and Popular remain absent until Atlas has trustworthy source data for those concepts.

## Filter model

The primary filters are exactly:

1. **Category** — user-facing functional groupings such as Forms & Inputs, Navigation, Data Display, Marketing, Ecommerce, AI & Chat, and Utilities.
2. **Component** — searchable multi-select over concrete component kinds such as Button, Card, Table, Modal, Input, Tabs, Data Grid, and Chat.
3. **Registry** — searchable multi-select over registry namespaces/sources.

Filter behavior follows conventional catalog patterns:

- Multiple values may be selected within a facet and combine with **OR** semantics (for example, Button OR Input).
- Different facets combine with **AND** semantics (for example, Forms & Inputs AND Registry X).
- Selected values render as removable chips.
- A single **Clear all** action removes every filter.
- Option counts reflect the current searchable catalog where practical.
- Search and filter state remain deep-linkable through the existing URL-state mechanism.

Raw implementation facets such as `Type`, `Tag`, `Visual`, and catalog `Status` are not primary controls. They may remain internal inputs for ranking, metadata, or future secondary filters.

Secondary filters are data-gated. Framework, License, Accessibility, Style, Preview available, Recently added, and Popular must not appear until the generated catalog has sufficiently complete and discriminating data for them.

## Result cards and visual specimens

Each result card represents a concrete registry item/component candidate and should prioritize:

- Visual specimen when a real preview is available.
- Component/item name and registry source.
- Concise purpose/description.
- Relevant category/component labels.
- Verification/confidence signal when decision-relevant.
- Primary detail action.
- Save/share/copy affordances where implemented.

When no real preview exists, render a neutral unavailable state. Do not generate or draw a fake specimen that could be mistaken for registry-provided output.

Current generated data has 277 registries and 34 enriched item summaries; none of those enriched items currently has a populated preview URL. The redesign therefore requires a preview/specimen enrichment path in the data pipeline before visual specimens can be broadly populated.

## Component detail experience

Detail pages adapt the useful Name That UI pattern to registry components:

- Canonical name plus aliases/alternate terminology.
- Real preview when available.
- Plain-language description and taxonomy.
- Registry namespace and source links.
- Install command and inspect command.
- Dependencies, registry dependencies, and files when supplied.
- Provenance, evidence, warnings, and confidence.
- Copy-ready agent prompt for using/installing the component.
- Copy-ready inspection/debug prompt when the available metadata can ground it.
- Related components and related registries.

## Registries surface

Registries is the source-browser view. It should support:

- Search by registry name/namespace and description.
- Browse all mirrored registries without requiring an internal focus cluster.
- Registry cards/rows with source identity, description, coverage summary, and available item count.
- Route into a registry profile that lists its known components/items.
- Reuse the same Category and Component filters when they meaningfully narrow registry contents.

The previous Focus concept may continue to exist internally for enrichment/ranking, but it is not a primary navigation or filter concept.

## Compare surface

Compare reuses the existing matrix capability but reframes it around a deliberate comparison task:

- User selects or arrives with relevant registries/components from Discover or Registries.
- Rows represent registries; columns represent comparable component families or selected capabilities.
- Verification state remains visible because coverage quality matters in comparisons.
- Compare must support deep-linkable state.

The matrix is no longer presented as one of several equivalent browsing modes; it is a dedicated decision-support tool.

## Saved, share, and copy actions

The redesigned experience should support conventional catalog actions:

- Copy install command.
- Copy inspect command.
- Copy agent prompt.
- Copy/share deep link to the current item, query, or comparison state.
- Save/bookmark items if a persistence mechanism is added.

Saving must not be simulated with transient UI that implies persistence when none exists.

## Visual system

Use the approved Name That UI-inspired system without copying its page structure verbatim:

- Dark background centered around `#0b0c0e`.
- Card surfaces around `#121316` with subtle `rgba(255,255,255,0.08)` borders.
- `#4EA1FF` for primary interactive accents.
- Geist-style typography and compact 4px-based spacing rhythm.
- 11px button and 14px card radius vocabulary.
- Flat surfaces by default; no legacy ambient grid, noise texture, glow halo, or heavy shadows.
- Restrained gradients only where they communicate preview/content emphasis.

The current yellow/cyan/purple glow language, app-within-a-card shell, oversized outer radius, and ornamental backgrounds are removed.

## Architecture

Keep the current modular vanilla TypeScript structure:

- `index.html` owns the static application shell.
- `src/registry-explorer/ui/shell.ts` remains the state/event coordinator.
- Individual UI modules render Discover, Registries, Compare, registry profiles, and item details.
- Pure filtering, search, ranking, URL state, and comparison logic remains under `src/registry-explorer/core/`.
- Generated registry metadata remains the runtime source of truth.

The redesign should replace legacy view semantics rather than adding a second parallel navigation system. Old Focus/Component renderers may be removed or repurposed only after their useful behavior has been migrated and tests prove nothing user-facing is stranded.

## State and data flow

User input flows through the shell state into pure core selectors/rankers, then into the active renderer:

`search/query + facets + sort + route state -> core filtering/ranking -> Discover/Registries/Compare/detail renderer`

URL serialization must preserve the new navigation state and supported filters. Legacy URL parameters should either migrate deterministically or degrade to a valid default route; they must not leave the UI in a broken state.

The data pipeline should be extended only where required to support grounded new capabilities, especially preview/specimen metadata and future sortable/filterable fields. Generated output must continue to distinguish official registry facts from Atlas enrichment.

## Empty, partial, and error states

- No search results: state the query/filter mismatch and offer filter reset.
- No preview: show a neutral preview-unavailable treatment without pretending a specimen exists.
- Partial/unverified catalog data: keep the existing evidence/status distinction visible at decision points.
- Missing install metadata: disable install/copy actions with a specific reason.
- Data-load/render failure: retain a recoverable error state and existing console diagnostics.
- Unsupported legacy URL state: fall back to Discover while preserving any still-valid search term.

## Accessibility and interaction

- All navigation, filters, result actions, menus, dialogs/popovers, and copy controls must be keyboard reachable.
- Focus states must remain visible against the dark palette.
- Filter controls expose selected state and removable-filter names to assistive technology.
- Result counts and copy feedback use appropriate live-region behavior where needed.
- Color is not the sole indicator of verification, selection, or disabled state.
- Responsive behavior must preserve search-first discovery on narrow screens rather than collapsing into an unusable dense matrix.

## Testing strategy

Implementation must preserve or add automated coverage for:

- Search ranking and alias matching.
- Category, Component, and Registry facet construction.
- Multi-select behavior within a facet and intersection across facets.
- Active-filter removal and Clear all.
- Relevance and Name A-Z sorting.
- New URL-state parsing/serialization and legacy-state fallback.
- Registries browsing and registry profile routing.
- Compare state and matrix rendering.
- Preview-available versus preview-unavailable rendering.
- Install/inspect/copy actions and disabled reasons.
- XSS/render-safety invariants for remote registry metadata.

The existing `pnpm verify` command remains the terminal automated verification gate. Browser smoke coverage must be updated for the new navigation/filter model and run against the production base path.

## Implementation boundaries

Expected implementation areas include:

- `index.html`
- `public/styles/registry-explorer.css`
- `src/registry-explorer/ui/shell.ts`
- Discover, registry-browse, compare, profile, and detail renderers under `src/registry-explorer/ui/`
- Filtering/search/URL-state modules under `src/registry-explorer/core/`
- Relevant tests
- Sync/import tooling only where grounded preview or future facet metadata requires it

Do not introduce a frontend framework migration, backend service, authentication system, analytics system, or fabricated popularity/recency model as part of this redesign.

## Acceptance criteria

The redesign is complete when:

- Primary navigation is Discover, Registries, and Compare.
- Discover is the default search-first visual catalog.
- Primary filters are Category, Component, and Registry; legacy raw facets are absent from the primary UI.
- Search, filters, sort, and relevant routed state are deep-linkable.
- Result cards support grounded specimen handling and never fabricate unavailable previews.
- Component detail pages expose registry-specific install, inspect, provenance, evidence, related-item, and copy-prompt capabilities where data supports them.
- Registries provides direct source browsing without exposing Focus as the primary organization.
- Compare preserves the useful matrix capability as a dedicated decision tool.
- Unsupported data-driven controls remain hidden until their source data exists.
- The approved Name That UI-inspired visual system replaces the legacy glow-heavy styling.
- Keyboard/focus, responsive behavior, copy feedback, and safe rendering pass updated browser checks.
- `pnpm verify` passes with the redesigned application.

## Approved visual reference

Superdesign project: `Registry Atlas — NameThatUI Discovery Redesign`

Approved direction: Direction A, draft `fdcf0080-91df-4b2c-9d0f-d0ea46e024d5`, version 3.

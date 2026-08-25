# Registry Atlas — NameThatUI-Inspired Design System

Use NameThatUI as visual and interaction inspiration, not a clone. The product should feel like a visual dictionary/catalog for shadcn registries and components: recognition-first, dark, compact, soft, flat, and information-dense.

## Colors
- background `#0b0c0e`
- foreground `#edeef0`
- card `#121316`
- popover `#16181c`
- secondary/muted surface `#1a1c20`
- muted foreground `#8a8f98`
- border `rgba(255,255,255,.08)`
- input border `rgba(255,255,255,.12)`
- primary interactive accent `#4EA1FF`
- reserved decorative accent `#5C0105`
- restrained gradients only: `#232A4D → #31284E → #12172E` and `#7FB2E5 → #B48AD6 → #E8927C`

## Typography
Geist Sans. H1 48/600/1/-1.2px; H2 16/500/1; H3 14.5/500/1.38; meta 11/600/1.5; body 15/400/1.63.

## Spacing
4, 8, 12, 16, 20, 24px.

## Radius
Inputs 7px, controls 8–11px, cards 14px. Pills only for tags or segmented filters.

## Effects
Flat surfaces. No ambient grid/noise. No default shadows. Hierarchy comes from borders and surface contrast. Gradients are rare specimen/accent moments, never full-page decoration.

## Product rules
1. Discover is the primary visual catalog, not a dense administrative list.
2. Global natural-language search is the hero interaction. Users may search canonical names, aliases, rough descriptions, capabilities, namespaces, registry names, or taxonomy.
3. Results use visual specimen cards when a verified preview exists; missing previews render an explicit neutral unavailable state, never fabricated imagery.
4. Each card exposes canonical component name, registry, aliases/taxonomy, verification status, and the most relevant install/API token.
5. Detail pages follow the reference-dictionary model: specimen, canonical identity, aliases, plain-language purpose, component metadata/anatomy where available, install/code facts, agent-ready prompt, debug/inspection prompt, related components, related registries, sources/evidence, copy/share/save actions.
6. Preserve Registry Atlas strengths: focus view, component view, coverage matrix, registry profiles, install queue, confidence/provenance, docs/evidence links, URL-restorable state.
7. Add catalog filters and sorting inspired by NameThatUI: All / verified / inferred or availability facets as appropriate; Newest / Popular only when grounded by real timestamps/usage metrics. Until such metrics exist, use deterministic useful alternatives such as relevance / coverage / registry name.
8. Copy actions should be first-class: copy install command, copy inspect command, copy agent prompt, copy page/deep link.
9. Search result cards should be scannable at a glance and usable without opening detail; detail pages carry the dense provenance and dependency information.
10. Accessibility: semantic tabs, buttons, labels, keyboard navigation, visible focus, status text beyond color.

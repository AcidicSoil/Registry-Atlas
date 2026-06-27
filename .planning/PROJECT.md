# Registry Atlas

## What This Is

Registry Atlas is a static discovery and install-assist layer for the shadcn/ui registry ecosystem. It mirrors the official shadcn registry directory into local generated data, helps users search by component need, compares registry/item candidates with neutral coverage context, and gives safe copy-only shadcn CLI actions without executing third-party code in the browser.

## Core Value

Users can quickly find the right shadcn-compatible registry or component and act on it without manually browsing dozens of registry sites.

## Current Milestone: v1.2 Component Peek & Alternatives Foundation

**Goal:** Let users quickly see what a registry component looks like from inside Registry Atlas, using visual peeks like screenshots/thumbnails or safe previews, so they can browse, compare, and start finding better alternatives without opening every registry site.

**Target features:**

- Add component peek cards for route-eligible items, focused on screenshots/thumbnails or safely available visuals rather than iframe/embed-first behavior.
- Add internal item route state such as `view=item&registry=&item=` and component detail pages for deeper inspection.
- Load real registry item JSON through a typed detail loader and show component-first overview, files, dependencies, install/view commands, and fallback states while keeping raw JSON out of the normal user UI.
- Add “Peek” / “View component” actions wherever an item is route eligible.
- Add item type filters and evaluation metadata that helps users decide whether a component is worth using.
- Start alternatives groundwork with related/similar components by taxonomy/category/tag, while avoiding fake quality rankings until stronger evidence exists.

## Current State

**Shipped:** v1.0 Registry Atlas v1 on 2026-06-09

Registry Atlas v1 now has:

- A runnable Vite/vanilla TypeScript SPA with strict source/test type-checking and Vitest coverage.
- Official shadcn registry mirror sync artifacts, normalized runtime data, and validation reports.
- Component-first discovery with item summaries, coverage confidence, route eligibility, and registry profiles.
- Copy-only `npx shadcn@latest add` and `npx shadcn@latest view` commands for validated route-eligible items.
- Safe homepage/source/raw item links, disabled reasons for ineligible candidates, and a local deduped install queue.
- Shareable discovery URL state for view/search/profile/focus/component context while intentionally excluding queue state.
- A local and CI release gate through `pnpm verify`, plus a documented browser/accessibility smoke baseline for release hardening.

**Planning now:** v1.1 expanded the catalog and taxonomy. Phase 7 of v1.2 has shipped the internal item route, typed item-detail loader, component-first item page, and compact card cleanup. The next product direction is richer visual component evaluation: users want a quick peek at what components look like, so Registry Atlas can become the place to browse components and later recommend better swaps for generic AI-generated UI.

Milestone split:

1. v1.1 Expanded Component Catalog — shipped: more researched components and better discovery terms.
2. v1.2 Component Peek & Alternatives Foundation — visual peeks, item detail routes, item JSON loading, and related-component groundwork.
3. v1.3 Dynamic Coverage Matrix — better matrix modes/presets once visual/item detail browsing exists.
4. v1.4 Registry Research Automation — browser/manual research workflows for additional registries and broader visual/catalog coverage.

## Requirements

Current milestone requirements are in `.planning/REQUIREMENTS.md`.

Archived v1.0 requirements remain at `.planning/milestones/v1.0-REQUIREMENTS.md`.

## Context

- The official shadcn registry directory remains the starting point for registry membership.
- Community registries are third-party code. Registry Atlas surfaces metadata, routes, commands, and warnings, but does not audit, approve, or execute registry code.
- The deployed product remains a static GitHub Pages-compatible SPA.
- The imported research bundle currently has concrete catalog data for `@delego`, `@delta`, and `@diceui`, plus proposed component tags and a sample coverage matrix.
- v1.1 added concrete catalog summaries and taxonomy/search.
- Phase 7 of v1.2 added internal item routes, typed detail loading, component-first item pages, and compact summary cards; richer visual peek cards remain next.
- The user wants a “peek” experience: screenshot/thumbnail or safely available component visual first, with source/item JSON as supporting detail.
- The long-term product direction is alternatives: when AI generates generic/sloppy UI, Registry Atlas should help users find better component swaps.

## Constraints

- **Source alignment**: The app should stay aligned with the shadcn registry ecosystem and official registry index behavior.
- **Static app bias**: Preserve the lightweight Vite/vanilla TypeScript SPA unless a concrete sync or data-delivery requirement justifies adding infrastructure.
- **Security**: Community registries are third-party code — links, commands, and metadata should avoid implying Registry Atlas has audited or endorsed them.
- **Install behavior**: Use copyable shadcn CLI commands and source links — do not execute installs from the browser.
- **View behavior**: Internal item detail pages may fetch/read registry JSON for inspection, but browser actions stay copy-only and non-executing.
- **Maintainability**: Data imports and generated output need tests or validation so a future refresh does not silently break search, grouping, URLs, or install commands.
- **Compatibility**: Keep the app deployable as a static GitHub Pages site.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Mirror the official shadcn registry directory | Users want a faster way to use the same ecosystem that shadcn exposes, not a disconnected list | Delivered in v1.0 through sync artifacts and normalized runtime data |
| Prioritize automated sync over manual maintenance | The official directory has many registries, making hand maintenance error-prone and slow | Delivered as explicit sync/validation commands; scheduled automation deferred |
| Lead with component-first search | The core user need starts with "I need this UI component" rather than "I want to browse registry brands" | Delivered in v1.0 discovery flow |
| Support copy command, source link, and batch queue install flows | Users need both quick actions and a way to inspect upstream code before installing | Delivered in Phase 4 with copy-only install/view commands, safe links, and a local deduped queue |
| Keep v1 static unless sync requires otherwise | The existing app is a lightweight static SPA and can likely support the next milestone without backend complexity | Preserved through v1.0; release remains a static GitHub Pages SPA |
| Do not persist queue state in URLs | Install intent should stay local and not be silently restored from shared URLs | Delivered in Phase 4 URL state |
| Use `pnpm verify` as the release gate | Maintainers need one command covering typecheck, tests, data validation, and build | Delivered in local scripts and GitHub Pages workflow |
| Keep the next milestone product-first | The user goal is more components and component viewing, not a standalone evidence-management feature | v1.1 now focuses on expanded catalog data and taxonomy/search needed to expose it |
| Reframe item viewing as visual component peeking | The user wants to see what components look like without visiting every registry site, not inspect JSON | Phase 7 shipped component-first item routes and kept raw JSON out of normal UI |
| Avoid embed-first previews | Third-party sites can block embeds and arbitrary component execution is risky; screenshots/thumbnails/safe visuals should be the first preview layer | Pending in v1.2 |
| Treat alternatives as groundwork, not fake ranking | The long-term goal is better swaps for AI-generated slop UI, but quality scoring needs evidence | Pending in v1.2 |

## Evolution

This document evolves at milestone boundaries. v1.0 planning artifacts are archived under `.planning/milestones/`.

---
*Last updated: 2026-06-27 after Phase 7 item detail route execution*

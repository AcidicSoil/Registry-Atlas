# Registry Atlas

## What This Is

Registry Atlas is a static discovery and install-assist layer for the shadcn/ui registry ecosystem. It mirrors the official shadcn registry directory into local generated data, helps users search by component need, compares registry/item candidates with neutral coverage context, and gives safe copy-only shadcn CLI actions without executing third-party code in the browser.

## Core Value

Users can quickly find the right shadcn-compatible registry or component and act on it without manually browsing dozens of registry sites.

## Current Milestone: v1.1 Expanded Component Catalog

**Goal:** Add more real components to Registry Atlas from the imported research bundle so users can discover more useful registry items, starting with the cataloged `@delego`, `@delta`, and `@diceui` data.

**Target features:**

- Add newly researched registries and components from `registry-altas-improvement-phase/` into the app's generated/runtime data path.
- Preserve route eligibility, install/view tokens, registry metadata, item metadata, dependency/file summaries, and source links where available.
- Extend component tags/search so new items such as AI chat, code blocks, OTP inputs, color pickers, receipts, and map widgets are discoverable.
- Keep uncertainty visible: items with real catalog data should be treated differently from inferred or manual-follow-up entries.

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

**Planning now:** The next product direction is simple: get more components into Atlas, then let users view real component/item JSON in-app. The imported improvement bundle is split into multiple milestones so each release stays focused:

1. v1.1 Expanded Component Catalog — more researched components and better discovery terms.
2. v1.2 Component Item Viewer — internal `view=item` route and real item JSON inspection.
3. v1.3 Dynamic Coverage Matrix — better matrix modes/presets once the richer catalog exists.
4. v1.4 Registry Research Automation — browser/manual research workflows for additional registries.

## Requirements

Current milestone requirements are in `.planning/REQUIREMENTS.md`.

Archived v1.0 requirements remain at `.planning/milestones/v1.0-REQUIREMENTS.md`.

## Context

- The official shadcn registry directory remains the starting point for registry membership.
- Community registries are third-party code. Registry Atlas surfaces metadata, routes, commands, and warnings, but does not audit, approve, or execute registry code.
- The deployed product remains a static GitHub Pages-compatible SPA.
- The imported research bundle currently has concrete catalog data for `@delego`, `@delta`, and `@diceui`, plus proposed component tags and a sample coverage matrix.
- The seed docs explicitly call out that the current app's “actual component” layer is shallow: summaries exist, but real item JSON is not fetched/rendered in-app yet.
- The item-view work is important, but it should be its own milestone after the expanded catalog foundation lands.

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
| Split item viewing into the next milestone | Fetching/rendering real item JSON is substantial enough to be its own release slice | v1.2 is Component Item Viewer |

## Evolution

This document evolves at milestone boundaries. v1.0 planning artifacts are archived under `.planning/milestones/`.

---
*Last updated: 2026-06-27 for v1.1 milestone planning*

# Registry Atlas

## What This Is

Registry Atlas is a static discovery and install-assist layer for the shadcn/ui registry ecosystem. It mirrors the official shadcn registry directory into local generated data, helps users search by component need, compares registry/item candidates with neutral coverage context, and gives safe copy-only shadcn CLI actions without executing third-party code in the browser.

## Core Value

Users can quickly find the right shadcn-compatible registry or component and act on it without manually browsing dozens of registry sites.

## Current State

**Shipped:** v1.0 Registry Atlas v1 on 2026-06-09

Registry Atlas v1 now has:

- A runnable Vite/vanilla TypeScript SPA with strict source/test type-checking and Vitest coverage.
- Official shadcn registry mirror sync artifacts, normalized runtime data, and validation reports.
- Component-first discovery with item summaries, coverage confidence, route eligibility, and registry profiles.
- Copy-only `npx shadcn@latest add` and `npx shadcn@latest view` commands for validated route-eligible items.
- Safe homepage/source/raw item links, disabled reasons for ineligible candidates, and a local deduped install queue.
- Shareable discovery URL state for view/search/profile/focus/component context while intentionally excluding queue state.
- A local and CI release gate through `pnpm verify`, plus a documented browser/accessibility smoke baseline.

## Next Milestone Goals

Define v1.1 with `/gsd-new-milestone`. Candidate directions from deferred v2 ideas and shipped v1 learnings:

- Scheduled or PR-based upstream sync automation.
- Package-manager command variants for npm, pnpm, yarn, and bun.
- Richer item impact metadata when upstream schemas make it reliable.
- Similar registry suggestions when no exact component match exists.
- Optional visual previews or comparison flows when source artifacts are reliable enough.

## Requirements

Current milestone requirements are archived at `.planning/milestones/v1.0-REQUIREMENTS.md`.

Fresh requirements for the next milestone should be created by `/gsd-new-milestone`.

## Context

- The canonical upstream reference remains the shadcn registry directory at `https://ui.shadcn.com/docs/directory`.
- Community registries are third-party code. Registry Atlas surfaces metadata, routes, commands, and warnings, but does not audit, approve, or execute registry code.
- The deployed product remains a static GitHub Pages-compatible SPA.
- Existing validation warnings for official HTTP URLs are provenance warnings for upstream directory entries, not release blockers.

## Constraints

- **Source alignment**: The official shadcn directory is the source to mirror — the app should not drift into an unrelated curated catalog.
- **Data freshness**: Sync and validation should make upstream/local count mismatches visible.
- **Static app bias**: Preserve the lightweight Vite/vanilla TypeScript SPA unless a concrete sync or data-delivery requirement justifies adding infrastructure.
- **Security**: Community registries are third-party code — links, commands, and metadata should avoid implying Registry Atlas has audited or endorsed them.
- **Install behavior**: Use copyable shadcn CLI commands and source links — do not execute installs from the browser.
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

## Evolution

This document evolves at milestone boundaries. v1.0 planning artifacts are archived under `.planning/milestones/`.

---
*Last updated: 2026-06-09 after v1.0 milestone*

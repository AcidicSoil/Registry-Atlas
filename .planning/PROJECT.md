# Registry Atlas

## What This Is

Registry Atlas is a fast discovery layer for the shadcn/ui registry ecosystem. It should mirror the official shadcn registry directory and make it quick and painless to choose UI components without manually opening every community registry site and sifting through each one.

The current app already provides a static explorer with focus, component, matrix, and search views. The next milestone turns that explorer into a reliable shadcn directory companion: synced from the official source, searchable by component need, and able to give users practical install actions.

## Core Value

Users can quickly find the right shadcn-compatible registry or component and act on it without manually browsing dozens of registry sites.

## Requirements

### Validated

- ✓ Static registry explorer exists with focus-based browsing, component grouping, matrix comparison, and real-time filtering — existing
- ✓ Vanilla TypeScript SPA architecture is in place with pure core grouping/filtering logic and separate DOM renderers — existing
- ✓ Typed registry dataset exists under `src/registry-explorer/data/registries.data.ts` with controlled focus and component vocabularies — existing
- ✓ Local app can be built and served through Vite, with GitHub Pages deployment workflow present — existing
- ✓ Core grouping and matrix behavior have Vitest-style tests under `tests/registry-explorer/` — existing

### Active

- [ ] Mirror the official shadcn registry directory so Registry Atlas tracks the current directory source, including the current 198-registry target.
- [ ] Add an automated sync and validation path so registry data can be refreshed without hand-editing the full dataset.
- [ ] Make component-first search the primary discovery path, so users can start from the UI component they need and compare matching registries.
- [ ] Preserve registry-level browsing for users who want source links, focus notes, and registry context in one place.
- [ ] Provide copyable `npx shadcn add @<registry>/<component>` commands for registry and component choices.
- [ ] Link users out to each source registry when they need to inspect the upstream implementation, docs, or quality details.
- [ ] Let users queue multiple selected components and generate a batch install command.
- [ ] Add data quality checks for duplicate registries, valid URLs, allowed protocols, required fields, and controlled vocabulary coverage.
- [ ] Remove or clearly archive stale legacy and starter artifacts that can confuse users or contributors.

### Out of Scope

- A hosted component marketplace with ratings, accounts, or payments — the project is a discovery and install-assist layer, not a marketplace.
- Owning or rehosting third-party registry source code — users should still review upstream source registries before installing.
- Replacing the shadcn CLI — Registry Atlas should generate or copy CLI commands, not implement installation itself.
- Backend services or user accounts for v1 — the current static SPA model is enough for the next milestone unless sync requirements prove otherwise.
- Guaranteeing third-party registry safety — the app can surface metadata and warnings, but users must review community registry code before installation.

## Context

- The canonical upstream reference is the shadcn registry directory at `https://ui.shadcn.com/docs/directory`.
- The official directory currently shows 198 registries and describes community registries as built into the shadcn CLI with no extra configuration required.
- The install pattern users need is `npx shadcn add @<registry>/<component>`.
- The current local dataset has fewer entries than the official directory and is hand-maintained in `src/registry-explorer/data/registries.data.ts`.
- Existing code separates pure data transformations in `src/registry-explorer/core/` from DOM rendering in `src/registry-explorer/ui/`, which is a good base for adding sync validation and richer discovery behavior.
- The codebase map flags several concerns that should shape planning: string-built DOM renderers, missing data validation, a missing runnable test script, stale legacy output, starter-file remnants, and GitHub Pages base-path casing risk.
- The product should reduce the user burden of opening each registry site manually, understanding what it contains, and constructing the correct shadcn CLI command.

## Constraints

- **Source alignment**: The official shadcn directory is the source to mirror — the app should not drift into an unrelated curated catalog.
- **Data freshness**: The current directory count is 198 registries — sync and validation should make mismatches visible.
- **Static app bias**: Preserve the lightweight Vite/vanilla TypeScript SPA unless a concrete sync or data-delivery requirement justifies adding infrastructure.
- **Security**: Community registries are third-party code — links, commands, and metadata should avoid implying that Registry Atlas has audited or endorsed them.
- **Install behavior**: Use copyable shadcn CLI commands and source links — do not execute installs from the browser.
- **Maintainability**: Data imports and generated output need tests or validation so a future refresh does not silently break search, grouping, URLs, or install commands.
- **Compatibility**: Keep the app deployable as a static GitHub Pages site.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Mirror the official shadcn registry directory | Users want a faster way to use the same ecosystem that shadcn exposes, not a disconnected list | — Pending |
| Prioritize automated sync over manual maintenance | The official directory has 198 registries today, making hand maintenance error-prone and slow | — Pending |
| Lead with component-first search | The core user need starts with "I need this UI component" rather than "I want to browse registry brands" | — Pending |
| Support copy command, source link, and batch queue install flows | Users need both quick actions and a way to inspect upstream code before installing | — Pending |
| Keep v1 static unless sync requires otherwise | The existing app is a lightweight static SPA and can likely support the next milestone without backend complexity | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `$gsd-transition`):
1. Requirements invalidated? -> Move to Out of Scope with reason
2. Requirements validated? -> Move to Validated with phase reference
3. New requirements emerged? -> Add to Active
4. Decisions to log? -> Add to Key Decisions
5. "What This Is" still accurate? -> Update if drifted

**After each milestone** (via `$gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-25 after initialization*

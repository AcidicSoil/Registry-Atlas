# Project Research Summary

**Project:** Registry Atlas  
**Domain:** shadcn registry discovery and install-assist tool  
**Researched:** 2026-05-25  
**Confidence:** HIGH for registry mirroring, stack, static architecture, and command shape; MEDIUM for complete component-level discovery across third-party registries

## Executive Summary

Registry Atlas is a static discovery layer for the shadcn registry ecosystem. It should mirror the official shadcn registry directory, help users find registries and components by need, and generate copyable shadcn CLI commands without becoming a marketplace, backend service, or installer. The expert pattern is a build-time data pipeline that fetches and validates upstream registry data, then a static browser app that searches, groups, renders, queues, and copies commands from generated local artifacts.

The recommended approach is to keep the existing Vite and vanilla TypeScript SPA, add a Node-based sync and validation pipeline, and treat `https://ui.shadcn.com/r/registries.json` as the canonical machine-readable directory source. That endpoint returned 198 registry entries during research and exposes registry-level metadata, not a complete item catalog. Component-first search therefore requires a separate enrichment layer with explicit confidence and provenance.

The main risks are silent data drift, unsafe rendering of third-party metadata, and invalid `shadcn add` commands. Mitigate them by splitting official mirror data from local enrichment, validating schemas and URL templates before build, preserving namespaces with the leading `@`, rendering synced strings through safe DOM APIs, and generating install commands only from verified installable item slugs.

## Key Findings

### Recommended Stack

Keep Registry Atlas as a static TypeScript/Vite app deployed to GitHub Pages. Add local and CI scripts for sync, validation, generated data, and tests. Do not add a backend, database, framework migration, search SaaS, browser crawler, or serverless runtime for this milestone.

**Core technologies:**
- Vite + vanilla TypeScript: current app stack and enough for static generated data, pure core functions, and DOM renderers.
- Node scripts: fetch, normalize, merge, validate, and generate registry data at maintainer or CI time.
- pnpm with `packageManager`: reproducible installs and fewer Windows/WSL toolchain surprises.
- Ajv: validate shadcn registry JSON schemas and local generated artifacts.
- Vitest: make existing tests runnable and cover sync, validation, search, and command-generation behavior.
- `p-limit`: use only for bounded third-party registry probing when component discovery is introduced.

**Version notes:**
- Keep the current Vite 7 and TypeScript 5.9 line for the milestone unless a deliberate dependency refresh is scheduled.
- Add `vitest`, `ajv`, and optionally `tsx` before sync work.
- Use generated JSON artifacts by default; add Prettier only if generated TypeScript becomes necessary.

### Table-Stakes Features

- Official registry directory parity with current-count display and mismatch reporting.
- Registry cards and profile detail showing namespace, description, homepage, registry URL template, provenance, last sync, and item count when known.
- Component-first search over verified item inventory plus controlled local tags and aliases.
- Registry-first browsing preserved for users evaluating a registry brand, author, or design language.
- Copyable single-item install commands using exact `@registry/item` syntax.
- Source and homepage links for every registry and item where valid URLs exist.
- Batch selection with deduped multi-item command generation.
- Search and filtering by namespace, description, focus tags, aliases, item names, type, and metadata.
- Empty, partial, stale, unavailable, and unverified states for incomplete third-party data.
- Provenance and freshness metadata surfaced in UI and validation output.
- Accessibility baseline for search, tabs, copy buttons, filters, and queue controls.

### Differentiators

- Component alias normalization, so related terms like `login`, `auth`, and `sign in` can return the same candidates.
- Comparable alternatives across registries with source, command, item type, dependencies, and confidence.
- Package-manager command variants for npm, pnpm, yarn, and bun.
- Inspect-before-install commands using `shadcn view` alongside `shadcn add`.
- Registry status badges derived from reachability, schema validation, item count, and last successful fetch, labeled as status rather than quality or safety.
- Item type and install-impact badges for dependencies, registry dependencies, env vars, CSS variables, and file counts.
- Official-index delta view for added, removed, and changed registries.
- Deep links to filtered views, raw catalog URLs, raw item URLs, and shareable batch commands.

### Architecture Implications

Use a static generated-data architecture with strict source boundaries:

1. Upstream adapter: fetches `registries.json` and preserves official fields for diffing.
2. Normalizer: keeps `@namespace`, homepage, URL template, description, and stable local id.
3. Enrichment data: stores local focus categories, component tags, aliases, known installable items, source links, and confidence.
4. Data merger: joins official and local records by namespace and reports missing enrichment.
5. Validator: checks required fields, unique namespaces, URL protocols, URL templates, controlled vocabularies, schemas, and command-token safety.
6. Generated artifacts: provide the only app-consumed dataset at runtime.
7. Core model and search: pure TypeScript functions for grouping, component indexes, search, source-link view models, queue state, and command generation.
8. UI shell and renderers: render generated data safely, own local state, and copy commands without fetching upstream data or executing installs.

The runtime app should remain a static consumer of generated data. Browser-time crawling would introduce CORS, latency, third-party downtime, and user-visible validation failures without improving the GitHub Pages deployment model.

### Pitfalls and Mitigations

1. **Confusing directory parity with component coverage**: the official directory lists registries, not every installable item. Mirror the directory first, then enrich item coverage separately with `verified`, `inferred`, `unavailable`, or `partial` confidence.
2. **Generating invalid install commands**: current local labels are not always CLI item slugs. Preserve upstream `@namespace`, store exact `installableItems[]`, and generate commands only from validated namespace/item pairs.
3. **Rendering third-party metadata through `innerHTML`**: synced descriptions, URLs, logos, and item metadata are untrusted. Move dynamic rendering to `textContent`, validated `href` assignment, or shared safe-render helpers before expanding imported data.
4. **Implying third-party code is approved or safe**: Registry Atlas cannot audit community registries. Use copy-only actions, source links, `view` commands, provenance, and neutral labels such as `community-maintained`.
5. **Syncing without provenance or reviewable diffs**: separate raw upstream mirror, local enrichment, generated app data, and sync reports. Track source URL, synced timestamp, upstream hash or count, added/removed/changed entries, and validation errors.
6. **Losing shadcn item semantics**: not all registry items are UI components. Preserve item type, dependencies, registry dependencies, env vars, CSS variables, file counts, docs, and metadata where available.
7. **Building on non-runnable tests and stale artifacts**: add Vitest and a test script first, remove or archive legacy public output, and document the canonical app surface.

## Implications for Roadmap

### Phase 1: Foundation, Cleanup, and Runnable Verification

**Rationale:** New sync and third-party data should not enter an app with non-runnable tests, stale deployable artifacts, and string-built rendering risks.  
**Delivers:** package manager pin, Vitest dependency and script, canonical app-surface docs, legacy/starter artifact cleanup, initial URL/text safety helpers, vocabulary source-of-truth cleanup.  
**Addresses:** data quality checks, accessibility baseline preparation, stale legacy artifact removal.  
**Avoids:** building on non-runnable tests, deployed stale paths, vocabulary drift, and unsafe rendering foundations.

### Phase 2: Official Mirror and Validation Pipeline

**Rationale:** The 198-entry official directory mirror is the foundation for every product claim and install command.  
**Delivers:** sync script, raw official mirror artifact, normalized generated dataset, manifest, sync report, required-field validation, namespace uniqueness, count drift reporting, URL-template validation, protocol allow-listing, and CI/local `validate:data`.  
**Uses:** Node fetch, Ajv, generated JSON, pnpm, optional `tsx`.  
**Implements:** upstream adapter, normalizer, data merger, validator, generated artifact boundaries.  
**Avoids:** manual drift, silent deletions, invalid URLs, and mixing upstream facts with local curation.

### Phase 3: Component Inventory and Component-First Search

**Rationale:** Users search by component need, but component coverage must not be inferred from descriptions alone.  
**Delivers:** enrichment model, known item summaries, bounded catalog probing, per-registry discovery status, component aliases, search index, component-first primary view, partial-data and unavailable states.  
**Addresses:** component-first search, registry profiles with item counts, source links, inferred-vs-verified labels, and comparable alternatives groundwork.  
**Avoids:** false component coverage, over-normalizing shadcn item semantics, and treating third-party outages as mirror failures.

### Phase 4: Commands, Inspection, and Batch Queue

**Rationale:** Copy actions should come after namespace and item slug validity are guaranteed.  
**Delivers:** pure command generator, single-item `add` copy, paired `view` copy, package-manager variants, selected-item queue, deduped batch command, skipped-selection reasons, source/raw item links, and command tests.  
**Addresses:** single install command generation, copy affordances, batch selection, inspect-before-install, and shareable batch groundwork.  
**Avoids:** invalid commands, hidden fallback commands, install UX that implies endorsement, and unsafe batch mixes.

### Phase 5: Hardening, Automation, and Decision Quality

**Rationale:** Once the core mirror, search, and action flows are correct, improve maintainability and decision speed without changing the static deployment model.  
**Delivers:** scheduled sync PR workflow, delta view, registry status badges, item impact badges, dependency/file-impact preview, URL/share state, focused DOM/accessibility tests, Pages base-path validation, and optional generated artifact diff checks.  
**Addresses:** provenance freshness, registry health/status, comparable alternatives, shareable filtered states, and release confidence.  
**Avoids:** unreviewed automated data changes, overstated quality ratings, and deploy drift.

### Phase Ordering Rationale

- Mirror and validation must precede component UX because official directory parity is the canonical base and component coverage is a separate enrichment problem.
- Rendering and URL safety must precede broad third-party metadata import because upstream descriptions, links, item names, and logos are untrusted.
- Verified item slugs must precede copyable commands because shadcn commands depend on exact `@namespace/item` references.
- Queue and batch commands should follow single-command generation because they reuse the same validation and dedupe rules.
- Automation and health badges should follow the core data model because they need provenance, sync status, and validation outputs to avoid overclaiming.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3:** third-party registry item discovery is medium-confidence because registries vary in catalog availability, schema quality, item names, and uptime.
- **Phase 4:** verify current shadcn CLI behavior in a disposable project before finalizing examples, package-manager variants, `view` behavior, and failure-copy text.
- **Phase 5:** scheduled PR automation and health/status scoring need careful policy decisions so outages and validation warnings do not become misleading quality ratings.

Phases with standard patterns:
- **Phase 1:** testing setup, cleanup, vocabulary consolidation, and safe DOM rendering are established local engineering work.
- **Phase 2:** static sync, JSON validation, manifest generation, and deterministic generated data are well-documented patterns.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Existing Vite/TypeScript static app fits the problem; official endpoints and npm metadata were verified. Component probing stack has MEDIUM confidence because third-party registry behavior varies. |
| Features | HIGH | Official shadcn docs confirm directory, CLI namespaces, `add`, `view`, `search`, and multi-item command behavior. Component-first UX is product-driven but strongly supported by the project goal. |
| Architecture | HIGH | Static generated-data architecture aligns with existing code boundaries and GitHub Pages constraints. Item enrichment remains MEDIUM because upstream registry completeness varies. |
| Pitfalls | HIGH | Major risks are grounded in current project concerns, official shadcn mechanics, and the existing local data/rendering/test gaps. |

**Overall confidence:** HIGH for the roadmap direction; MEDIUM for the scope and completeness of component-level enrichment.

## Open Questions

- Should Phase 3 attempt full component inventory across all 198 registries immediately, or start with selected high-value registries and expand with status reporting?
- Should generated data be committed for reviewable diffs, generated only in CI, or both? Research recommends committing for this project.
- Should upstream `logo` metadata be ignored, sanitized, or rendered later as image assets? Raw SVG rendering should be deferred.
- What exact package-manager command variants should be shown by default after disposable-project CLI verification?
- Should new upstream registries with missing enrichment ship as low-confidence registry entries, or block release until reviewed?
- What threshold turns third-party discovery failures into release blockers versus warnings?
- How should URL/share state encode queue selections while keeping links readable and safe?

## Sources

### Primary (HIGH confidence)

- `.planning/PROJECT.md` - project goals, active requirements, constraints, current app state.
- `.planning/research/STACK.md` - stack recommendations, official endpoint facts, validation rules, tool versions, static deployment guidance.
- `.planning/research/FEATURES.md` - table-stakes features, differentiators, anti-features, feature dependencies, MVP recommendation.
- `.planning/research/ARCHITECTURE.md` - static generated-data architecture, component boundaries, data flow, build order.
- `.planning/research/PITFALLS.md` - critical pitfalls, phase warnings, mitigations, gaps.
- Official shadcn registry index JSON: `https://ui.shadcn.com/r/registries.json` - checked 2026-05-25, returned 198 entries.
- Official shadcn registry directory, registry index, namespace, CLI, registry schema, and registry item schema docs - command behavior, source semantics, schemas, and third-party review warnings.

### Secondary (MEDIUM confidence)

- npm package metadata checked 2026-05-25 - current versions for Vite, TypeScript, Vitest, Ajv, pnpm, p-limit, Prettier, jsdom, and shadcn.
- Third-party registry discovery assumptions - feasible but dependent on registry availability, schema quality, and timeout policy.

### Tertiary (LOW confidence)

- None used as a basis for roadmap direction.

---
*Research completed: 2026-05-25*  
*Ready for roadmap: yes*

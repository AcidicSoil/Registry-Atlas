# Domain Pitfalls: Registry Atlas

**Domain:** shadcn registry mirror and discovery tool  
**Researched:** 2026-05-25  
**Overall confidence:** HIGH for shadcn registry mechanics and current codebase risks; MEDIUM for third-party registry content-quality patterns because individual registry contents can change independently.

## Executive Summary

Registry Atlas should treat the official shadcn directory as a namespace/index source, not as a complete component catalog. The current official endpoint `https://ui.shadcn.com/r/registries.json` returns 198 registry entries with `name`, `homepage`, `url`, and `description`; the GitHub source file adds `logo`. It does not provide a normalized list of components per registry. Component-first discovery therefore needs a separate enrichment pipeline that fetches or validates registry item data instead of inferring coverage from marketing copy.

The biggest mistakes for this product are silent data drift, unsafe rendering of third-party metadata, and invalid install commands. shadcn namespace installs depend on exact `@namespace/item` syntax, URL templates with `{name}`, and registry item schemas. Registry Atlas should never guess commands from display names, never render upstream metadata as trusted HTML, and never imply that third-party registry code has been audited.

The roadmap should address data ingestion and safety before richer UX. Fixing the test runner, schema validation, URL allow-listing, and stale artifacts in the first phases will prevent the component search and batch install features from being built on untrusted or unverified data.

## Critical Pitfalls

### Pitfall 1: Treating Directory Mirroring as Component Coverage

**What goes wrong:** The app mirrors `registries.json` and assumes the directory description is enough to know which components each registry ships. Search and matrix views then show false positives or miss real items.

**Why it happens:** The official registry directory is an index of registries, not a component inventory. The public endpoint currently provides directory metadata only: registry namespace, homepage, URL template, and description. shadcn registry item details live behind registry item JSON payloads resolved through each registry URL template.

**Warning signs:**
- Component tags are hand-written from descriptions instead of verified item names.
- The local dataset has fewer than 198 official entries without an explicit sync status.
- The UI says a registry has `button`, `table`, or `chatbot` coverage but no source item name supports that claim.
- Search results cannot show the exact installable item slug.

**Prevention strategy:**
- Phase 1 should mirror the official directory exactly into a generated source artifact with `name`, `homepage`, `urlTemplate`, `description`, `source`, `syncedAt`, and upstream count.
- Phase 2 should add schema validation and fail when upstream count, namespace uniqueness, URL-template validity, or required fields drift.
- Phase 3 should enrich component coverage separately by querying registry catalogs or selected item endpoints. Store coverage with `confidence: verified | inferred | unavailable`, and only generate install commands for verified installable item slugs.
- Keep manually assigned focus tags as local editorial metadata, but separate them from upstream facts.

**Phase to address:** Phase 1 for exact mirror, Phase 2 for validation, Phase 3 for component enrichment.

### Pitfall 2: Generating Invalid `shadcn add` Commands

**What goes wrong:** Registry Atlas builds commands like `npx shadcn add @display-name/component-label` where the namespace or item slug is wrong. Users copy commands that fail with unknown registry, missing resource, or malformed namespace errors.

**Why it happens:** The current local dataset stores names without the `@` prefix and component tags as Registry Atlas taxonomy labels, not shadcn item names. shadcn namespace references must follow `@namespace/resource-name`; the namespace must match the registry index, and the resource name must resolve through the registry URL template.

**Warning signs:**
- Commands are generated from `Registry.name` values such as `8bitcn` instead of upstream `@8bitcn`.
- Commands use human labels like `hero-section` without checking that an item named `hero-section` exists in that registry.
- Batch commands concatenate every selected tag, including inferred or unavailable items.
- There is no test fixture for namespaces containing hyphens or underscores, such as `@8starlabs-ui` or `@unlumen-ui`.

**Prevention strategy:**
- Add `namespace` as a first-class field distinct from display name.
- Add `installableItems[]` with exact upstream item slugs. Generate commands only from `namespace + item.name`, never from labels or controlled taxonomy keys.
- Validate namespace syntax with the shadcn pattern: starts with `@`, contains alphanumeric characters, hyphens, and underscores, and resolves as `@namespace/item`.
- For batch install, include only verified installable items and surface skipped selections with a reason.
- Add unit tests for command generation, including multiple resources: `npx shadcn@latest add @acme/header @lib/auth-utils`.

**Phase to address:** Phase 3 for item model, Phase 4 for copy and batch command UX.

### Pitfall 3: Rendering Third-Party Metadata Through `innerHTML`

**What goes wrong:** A synced registry description, homepage, namespace, item title, or logo contains HTML, quotes, scripts, or a dangerous URL scheme and becomes an XSS or broken-attribute sink.

**Why it happens:** Current UI renderers build cards and rows with template strings assigned to `innerHTML`, and local escaping only handles text partially. The upstream GitHub directory source includes SVG logo strings, and future enrichment may ingest registry item titles, descriptions, dependencies, env var names, and file metadata from third-party registries.

**Warning signs:**
- Any new sync script writes upstream strings directly into TypeScript data consumed by `innerHTML`.
- Escaping helpers are duplicated per view.
- Anchor `href` values are escaped as text but not parsed and protocol-checked.
- Logo support is added by injecting upstream SVG strings into the DOM.

**Prevention strategy:**
- Phase 1 should remove the legacy shipped page and starter artifacts so there is one rendering path to harden.
- Phase 2 should replace string-built registry cards/rows with `document.createElement`, `textContent`, and explicit `HTMLAnchorElement.href` assignment, or a shared rendering helper that distinguishes text, attribute, and URL contexts.
- Do not render upstream `logo` SVG strings unless sanitized through an explicit SVG sanitizer and CSP-compatible policy. Prefer storing logos as opaque optional metadata and deferring display.
- Validate all external URLs before rendering. Allow `https:` by default; allow `http:` only for local development fixtures if needed.
- Add DOM tests for descriptions containing quotes, angle brackets, and dangerous schemes.

**Phase to address:** Phase 1 cleanup for stale artifacts, Phase 2 for safe rendering and URL validation.

### Pitfall 4: Trusting Third-Party Registries as Safe or Endorsed

**What goes wrong:** The UI implies that community registries are vetted, safe, or officially recommended. Users install third-party code without reviewing file contents, dependencies, registry dependencies, environment variables, or configuration changes.

**Why it happens:** The product value is quick discovery, so it is tempting to optimize for one-click copy/install actions. shadcn’s own directory warns that community registries are third-party and users should review code before installation. The CLI has a `view` command specifically for inspecting items before installation.

**Warning signs:**
- Button labels say "Install" instead of "Copy command" or "View command".
- Registry cards use endorsement language such as "trusted", "approved", or "safe".
- Commands omit a nearby source link or `shadcn view` inspection option.
- Full-stack items with `envVars`, dependencies, or cross-registry dependencies are shown like simple UI primitives.

**Prevention strategy:**
- Keep browser behavior copy-only. Do not execute installs from the app.
- Show source homepage and, where available, registry item URL or `npx shadcn@latest view @namespace/item` command before the add command.
- Add item-risk metadata during enrichment: dependencies present, registryDependencies present, envVars present, files count, item type.
- Label unverified or inferred component coverage as such.
- Use neutral language: "community-maintained", "source registry", "copy command", "review before installing".

**Phase to address:** Phase 3 for item metadata, Phase 4 for command UX and inspection affordances.

### Pitfall 5: Syncing Without Provenance, Drift Detection, or Reviewable Diffs

**What goes wrong:** Automated sync updates the dataset but reviewers cannot tell what changed, where data came from, or whether deletions are upstream removals, fetch failures, or parser bugs.

**Why it happens:** The current workflow is hand maintenance in `src/registry-explorer/data/registries.data.ts`; generated and source artifacts are both committed; no data provenance fields exist. A naive sync would overwrite the curated array and create noisy diffs.

**Warning signs:**
- Generated data is committed as a large TypeScript array with no raw snapshot or sync report.
- Deleted registries disappear without a status such as `removedUpstream` or `unreachable`.
- There is no `syncedAt`, upstream ETag/last-modified, source URL, or expected count.
- Reviewers cannot distinguish official fields from local classifications.

**Prevention strategy:**
- Store raw upstream mirror data separately from local enrichment. Example split: `data/generated/official-registries.json` plus `data/registry-overrides.ts`.
- Generate a sync report with added, removed, changed, unreachable, invalid URL, and count mismatch sections.
- Preserve `sourceUrl`, `syncedAt`, and upstream HTTP metadata when practical.
- Make sync deterministic: stable sort by namespace, normalized line endings, no runtime timestamps inside per-entry objects unless needed.
- Require validation to pass before generated data is imported by the UI.

**Phase to address:** Phase 1 for sync shape, Phase 2 for validation/reporting.

### Pitfall 6: Over-Normalizing Away shadcn Registry Semantics

**What goes wrong:** Registry Atlas collapses all items into generic component tags and loses important shadcn fields such as `type`, `dependencies`, `devDependencies`, `registryDependencies`, `files`, `cssVars`, `envVars`, and item-level descriptions. Users cannot compare practical install impact.

**Why it happens:** The existing schema was designed for simple browsing: focus groups and component tags. shadcn registry items can represent UI, blocks, hooks, themes, pages, files, fonts, styles, and base config, not just React components.

**Warning signs:**
- Every item is displayed as a component even when `type` is `registry:block`, `registry:hook`, `registry:theme`, or `registry:font`.
- The app cannot answer "will this add packages, CSS vars, env vars, or multiple files?"
- Component-first search ignores item types and shows utility/config resources as UI components.
- Batch install mixes incompatible or high-impact items without explanation.

**Prevention strategy:**
- Extend the data model with an upstream-aligned item summary: `name`, `title`, `description`, `type`, `dependenciesCount`, `registryDependenciesCount`, `envVarsCount`, `filesCount`, `sourceConfidence`.
- Keep local `component_tags` as discovery categories, but preserve raw shadcn item types for filtering and warnings.
- In component-first views, group by verified item type and show impact chips for dependencies, env vars, and cross-registry dependencies.
- Add validation against the official `registry.json` and `registry-item.json` schemas for any fetched item payloads.

**Phase to address:** Phase 3 for enrichment model, Phase 4 for comparison and batch command display.

### Pitfall 7: Building UX on Tests That Are Not Runnable

**What goes wrong:** Sync, command generation, and URL validation logic regresses because the test files exist but are not executable from the package manifest.

**Why it happens:** Current tests use Vitest imports, but `vitest` is not in dependencies and `package.json` has no `test` script. Tests are also outside the current TypeScript project coverage.

**Warning signs:**
- PRs add sync logic or command generation without adding `npm test` / `pnpm test`.
- CI only builds the app and does not run data validation.
- Test fixtures exercise grouping but not production dataset validity.
- Type errors in `tests/` are not caught by `tsc --noEmit`.

**Prevention strategy:**
- Phase 1 should add Vitest as a dev dependency, a `test` script, and CI/local verification instructions.
- Phase 2 should add dataset validation tests for official count, unique namespaces, valid URL templates, valid homepage URLs, controlled vocabulary membership, and allowed protocols.
- Phase 4 should add command-generation tests for single and batch install strings, including skipped unverified items.
- Keep core tests DOM-free where possible, then add a small DOM test suite only for rendering safety and event behavior.

**Phase to address:** Phase 1 for runnable tests, Phase 2 and Phase 4 for targeted coverage.

### Pitfall 8: Leaving Legacy Artifacts Deployed Beside the Mirror

**What goes wrong:** Users or contributors find `index.legacy.html`, stale `dist/` output, or Vite starter files and assume they are supported. Fixes to the main app do not apply to the stale path.

**Why it happens:** The repo currently contains an older standalone app in `public/index.legacy.html`, committed generated output, and unused starter files. Static hosting will copy public files unless removed or moved out of deploy paths.

**Warning signs:**
- Public files contain example registries that disagree with the synced mirror.
- GitHub Pages exposes multiple app entry points.
- Contributors edit `src/main.ts` or starter CSS instead of `src/registry-explorer/entry.ts` and `public/styles/registry-explorer.css`.
- Build diffs include generated files unrelated to source changes.

**Prevention strategy:**
- Phase 1 should delete or archive `public/index.legacy.html` outside deployed public output.
- Remove unused starter files or mark them clearly as archived if retained for history.
- Decide whether `dist/` is a committed release artifact. If it stays, add a validation step that builds from source and checks generated output intentionally.
- Update docs so the app surface is unambiguous: `index.html`, `src/registry-explorer/`, and `public/styles/registry-explorer.css`.

**Phase to address:** Phase 1 cleanup.

### Pitfall 9: URL Validation That Checks Only Parseability, Not Registry Semantics

**What goes wrong:** A URL passes `new URL()` but cannot resolve shadcn items, uses insecure transport, lacks `{name}`, or points users to a homepage instead of the item JSON template. Commands fail or direct users to the wrong resource.

**Why it happens:** Registry entries have both `homepage` and `url` template fields upstream. Registry Atlas currently stores only one `url` field and uses it as a visible source link. shadcn namespace configuration expects a URL template where `{name}` is replaced by the item name.

**Warning signs:**
- The app uses a homepage URL to generate item commands or registry item links.
- URL validation accepts `javascript:`, `data:`, or arbitrary protocols.
- URL templates without `{name}` are treated as installable.
- The source link and registry item template are stored in the same field.

**Prevention strategy:**
- Split `homepageUrl` from `registryUrlTemplate`.
- Validate `homepageUrl` as an external navigation URL and `registryUrlTemplate` as a shadcn resolver template.
- Require `{name}` in `registryUrlTemplate`; allow optional `{style}` only where documented.
- Validate protocols with an allow-list. Prefer `https:` for both homepage and registry templates.
- For item links, construct preview URLs only from verified item slugs and the template, and never render untrusted URLs without parser validation.

**Phase to address:** Phase 2 for validation and data model changes; Phase 3 for item URL construction.

### Pitfall 10: Assuming Live Third-Party Registries Are Always Reachable

**What goes wrong:** Sync or enrichment fails the whole app because a registry is temporarily down, rate-limited, moved, or returns invalid JSON. A static site then ships stale or partial data without explanation.

**Why it happens:** Community registries are maintained independently. The official directory can include entries whose websites, item endpoints, or schemas behave differently over time.

**Warning signs:**
- Sync treats all fetch failures as deletions.
- One bad registry blocks all generated output.
- The UI does not expose `lastVerifiedAt`, `unreachable`, or `coverageUnavailable` states.
- There is no retry/backoff or timeout policy.

**Prevention strategy:**
- Keep the official mirror as the baseline even when enrichment fails.
- Mark enrichment state per registry: `verified`, `unreachable`, `invalidSchema`, `timeout`, `notYetIndexed`.
- Use bounded concurrency, timeouts, and retry once for transient failures.
- Do not delete local enrichment on a single failed fetch; expire it with a visible stale marker.
- Make validation fail only for mirror invariants and unsafe data; treat third-party reachability as a reportable quality status unless the phase specifically requires full enrichment.

**Phase to address:** Phase 2 for sync resilience, Phase 3 for enrichment status.

## Moderate Pitfalls

### Pitfall 11: Letting Controlled Vocabularies Drift from Runtime Values

**Warning signs:** Type unions and runtime arrays are edited separately; labels are missing for new focus keys; matrix columns include tags no registry can ever produce.

**Prevention strategy:** Define vocabulary arrays first and derive TypeScript union types from them. Add tests that validate labels, matrix columns, and production data tags against the canonical arrays.

**Phase to address:** Phase 1 or Phase 2.

### Pitfall 12: Making the Matrix the Primary Interface for a 198-Registry Ecosystem

**Warning signs:** Users must scan a wide table to find one component; adding tags makes the matrix horizontally unusable; mobile layout clips content.

**Prevention strategy:** Treat the matrix as a secondary comparison view. Make component-first search the primary path, with filters for item type, verified installability, and risk indicators. Add responsive checks before expanding columns.

**Phase to address:** Phase 3 for component-first search, Phase 4 for refined comparison.

### Pitfall 13: Failing to Preserve Static-Site Simplicity

**Warning signs:** A backend or database is introduced only to run sync; deployment no longer works on GitHub Pages; the app needs secrets for public data.

**Prevention strategy:** Keep sync as a build-time or maintainer-run script that generates static JSON. Use GitHub Actions or local scripts for refresh. Add infrastructure only if there is a concrete requirement that static JSON cannot satisfy.

**Phase to address:** All phases; especially Phase 1 architecture decisions.

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Warning Signs | Mitigation |
|-------------|----------------|---------------|------------|
| Phase 1: cleanup and runnable verification | Building new sync on stale artifacts and non-runnable tests | `npm test` missing; `public/index.legacy.html` still deployed; starter files remain | Add test runner, remove/archive legacy output, document the canonical app surface |
| Phase 1: official mirror | Confusing official directory metadata with local enrichment | Single data file mixes upstream fields and local tags | Generate official mirror separately from curated overrides |
| Phase 2: validation and security | URL and DOM validation too shallow | `new URL()` only; `innerHTML` still accepts upstream metadata | Split homepage/template URLs, allow-list protocols, move renderers to safe DOM APIs |
| Phase 2: sync resilience | Treating fetch errors as removals | One third-party outage deletes registry data | Add per-registry status, retries, stale markers, and reviewable sync report |
| Phase 3: component-first discovery | Inferred tags shown as installable items | Search result has no exact item slug | Store verified item summaries and confidence; generate commands only for verified slugs |
| Phase 3: enrichment | Losing shadcn item semantics | Everything appears as a generic component | Preserve `type`, dependency counts, env var presence, registry dependencies, and file counts |
| Phase 4: copy and batch commands | Copying invalid or unsafe commands | Commands use display names or taxonomy labels | Centralize command generation and test single, multi, skipped, and invalid cases |
| Phase 4: user trust | Install UX implies endorsement | "Install" button, no source/view command | Use copy-only language, source links, and `shadcn view` inspection affordances |
| Release/deploy | Static site builds but deploys wrong assets | base path mismatch; committed `dist/` drift | Validate build, Pages base path, and generated artifacts before release |

## Recommended Roadmap Guardrails

1. **Do source mirror before component UX.** A correct 198-entry official mirror is the foundation. Component coverage should not be expanded until the mirror and validation path are deterministic.
2. **Do safety before third-party metadata rendering.** Syncing external descriptions, URLs, item names, and logos increases the XSS surface. Harden rendering and URL validation before broad enrichment.
3. **Do verified item slugs before install commands.** Command generation should be impossible unless the item slug is known and the namespace is valid.
4. **Keep editorial metadata separate.** Focus tags and Registry Atlas component categories are product curation. Upstream namespace, URL template, registry description, and item schema fields are mirrored facts.
5. **Prefer static generated artifacts.** Registry Atlas can remain a static SPA if sync runs at build/maintenance time and produces validated JSON.

## Sources

- HIGH: Registry Atlas project context, `.planning/PROJECT.md` (read locally 2026-05-25).
- HIGH: Codebase concerns, `.planning/codebase/CONCERNS.md` (read locally 2026-05-25).
- HIGH: Current test state, `.planning/codebase/TESTING.md` (read locally 2026-05-25).
- HIGH: Current data workflow, `docs/registry-explorer-data.md` (read locally 2026-05-25).
- HIGH: Official shadcn Registry Directory docs, `https://ui.shadcn.com/docs/directory` (checked 2026-05-25).
- HIGH: Official shadcn Registry Index docs, `https://ui.shadcn.com/docs/registry/registry-index` (checked 2026-05-25).
- HIGH: Official registry index JSON, `https://ui.shadcn.com/r/registries.json` (checked 2026-05-25; returned 198 entries).
- HIGH: Official source directory JSON, `https://github.com/shadcn-ui/ui/blob/main/apps/v4/registry/directory.json` (checked via raw GitHub 2026-05-25; returned 198 entries and includes `logo`).
- HIGH: Official shadcn CLI docs, `https://ui.shadcn.com/docs/cli` (checked 2026-05-25).
- HIGH: Official namespace docs, `https://ui.shadcn.com/docs/registry/namespace` (checked 2026-05-25).
- HIGH: Official registry schema docs and schema, `https://ui.shadcn.com/docs/registry/registry-json` and `https://ui.shadcn.com/schema/registry.json` (checked 2026-05-25).
- HIGH: Official registry item schema docs and schema, `https://ui.shadcn.com/docs/registry/registry-item-json` and `https://ui.shadcn.com/schema/registry-item.json` (checked 2026-05-25).

## Gaps and Follow-Up Research

- Confirm whether Registry Atlas should fetch every registry's `registry.json`/search results or start with selected high-value registries. Full enrichment may need rate-limit and timeout tuning.
- Validate the current shadcn CLI behavior for built-in directory namespaces in a disposable project before finalizing command examples and error handling copy.
- Decide whether upstream `logo` should be ignored, sanitized, or rendered as plain image assets. Rendering raw SVG strings should be treated as unsafe until proven otherwise.
- Determine whether the official directory page count and `registries.json` count can diverge temporarily due to deployment/cache timing; validation should compare against the JSON endpoint as the canonical machine-readable source.

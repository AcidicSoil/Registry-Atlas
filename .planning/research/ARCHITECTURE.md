# Architecture Research: Registry Atlas Source Sync and Static UI

**Project:** Registry Atlas  
**Dimension:** Architecture  
**Researched:** 2026-05-25  
**Overall confidence:** HIGH for upstream index shape and static-app direction; MEDIUM for component-level enrichment because third-party registries vary in item availability and naming.

## Executive Summary

Registry Atlas should stay a static Vite/vanilla TypeScript SPA. The next milestone does not require a backend because the official shadcn directory exposes a static registry index at `https://ui.shadcn.com/r/registries.json`, and the current app already works from imported typed data. The right architecture is to move data freshness, normalization, validation, and generated search metadata into a local/build-time pipeline, then keep the browser runtime as a pure consumer of a generated dataset.

The app should mirror the shadcn directory at the registry namespace level, not attempt to rehost or dynamically proxy third-party registry contents. The upstream index currently contains 198 registries and each entry has `name`, `homepage`, `url`, and `description`. The official registry directory docs say the CLI automatically checks this index for `shadcn add` and `shadcn search`, and the registry index requirements expect open-source, publicly accessible, flat registries with valid registry schema JSON. Registry Atlas should treat that upstream index as the canonical list, then add local, clearly derived metadata for focus categories, component tags, source links, install commands, and UI grouping.

Component-first search should be implemented with generated local indexes rather than browser-time network calls. A sync script should fetch the upstream index, normalize records, preserve local enrichment, optionally probe registry items with bounded validation, and emit a generated `registries.generated.ts` or JSON module. Core functions should consume that generated model and derive component groups, registry cards, install commands, and selected-component queue state. This keeps the runtime static, fast, and deployable to GitHub Pages.

## Recommended Architecture

```text
Official shadcn directory
https://ui.shadcn.com/r/registries.json
        |
        | developer/CI sync command
        v
scripts/sync-registry-index.ts
        |
        | fetch, normalize, merge local enrichment
        v
src/registry-explorer/data/
  upstream-registries.generated.ts      # generated canonical upstream mirror
  registry-enrichment.data.ts           # hand-curated local metadata
  registries.generated.ts               # validated app-ready dataset
        |
        | validation command / tests
        v
tests or scripts/validate-registry-data.ts
        |
        | static import at build time
        v
src/registry-explorer/entry.ts
        |
        v
src/registry-explorer/ui/shell.ts
        |
        +--> search view
        +--> registry detail/source links
        +--> component-first results
        +--> selected-component queue
        +--> install command copy actions
```

## Component Boundaries

| Component | Responsibility | Should Not Do |
|-----------|----------------|---------------|
| Upstream source adapter | Fetch `https://ui.shadcn.com/r/registries.json`, verify response shape, preserve upstream fields exactly enough to diff future changes. | Classify components, render UI, mutate local enrichment by guesswork. |
| Normalizer | Convert upstream names such as `@acme` into stable local ids, keep namespace separately, normalize descriptions, derive source and registry URL templates, mark protocol/style placeholders. | Drop upstream fields that are needed for provenance or source links. |
| Enrichment data | Store local focus categories, component tags, component aliases, installable item names when known, confidence, notes, and last-reviewed metadata. | Replace the upstream directory as canonical registry existence data. |
| Data merger | Join upstream records with enrichment by namespace, produce one app-ready `RegistryAtlasRecord[]`, and flag missing enrichment. | Silently invent high-confidence component support from marketing descriptions. |
| Validator | Enforce unique namespaces, required fields, allowed protocols, valid URL templates, controlled vocabulary coverage, install-command safety, and expected upstream count drift. | Fetch every third-party component on every normal app build unless explicitly requested. |
| Core model | Define registry, component, queue, command, source-link, validation, and view-model types. | Depend on DOM APIs or network APIs. |
| Search/index core | Build deterministic component-first indexes from generated data: component -> registries -> installable items/source links. | Read directly from upstream JSON or mutate global app state. |
| Command generator | Produce `npx shadcn@latest add @<registry>/<component>` commands for single and queued selections. Support multiple resources in one command. | Execute commands in the browser or imply that install is audited/safe. |
| UI shell | Own current view, search term, selected registry/component, selected queue, copy status, and render routing. | Perform data validation or fetch upstream directory at runtime. |
| View renderers | Render component-first search, registry cards/detail, source links, command buttons, and selected queue from view models. | Build data indexes or insert unvalidated URLs/HTML. |

## Data Model Direction

Keep the current `Registry` type as a compatibility layer only briefly. The next milestone needs a richer model with provenance and install semantics:

```typescript
export interface UpstreamRegistry {
  name: `@${string}`;
  homepage: string;
  url: string; // usually contains {name}; some contain {style}
  description: string;
}

export interface RegistryEnrichment {
  namespace: `@${string}`;
  focus: PrimaryFocus[];
  componentTags: ComponentTag[];
  knownItems?: KnownRegistryItem[];
  sourceUrl?: string;
  license?: string;
  framework?: string;
  confidence: 'high' | 'medium' | 'low';
  reviewedAt?: string;
  notes?: string;
}

export interface KnownRegistryItem {
  name: string;
  componentTag: ComponentTag;
  title?: string;
  sourceUrl?: string;
  installable: boolean;
}

export interface RegistryAtlasRecord {
  id: string;              // namespace without @, slug-safe
  namespace: `@${string}`; // upstream name
  homepage: URLString;
  registryUrlTemplate: string;
  description: string;
  sourceUrl?: URLString;
  focus: PrimaryFocus[];
  componentTags: ComponentTag[];
  knownItems: KnownRegistryItem[];
  framework?: string;
  license?: string;
  provenance: {
    upstreamIndexUrl: string;
    syncedAt: string;
    upstreamHash: string;
    enrichmentConfidence: 'high' | 'medium' | 'low';
  };
}
```

Use upstream `name` with the leading `@` as the canonical join key. The current local data drops the `@` from names, which makes command generation and upstream diffing easier to get wrong. The UI can display either `@namespace` or a prettified title, but commands and joins should use the canonical namespace.

## Data Flow

### Source Sync Flow

1. `scripts/sync-registry-index.ts` fetches `https://ui.shadcn.com/r/registries.json`.
2. The adapter validates that the response is an array of objects with `name`, `homepage`, `url`, and `description`.
3. The normalizer preserves the upstream namespace, homepage, URL template, and description, and derives stable local ids.
4. The merger joins normalized upstream records with `registry-enrichment.data.ts` by namespace.
5. Missing enrichment is emitted as an actionable report, not silently omitted. New upstream registries can appear in the app with `low` confidence and limited search tags, but roadmap should decide whether this is acceptable for release.
6. The generator writes `upstream-registries.generated.ts` and `registries.generated.ts`.
7. The validator checks the generated result before build/deploy.
8. The SPA imports only generated local data at runtime.

### Component Search Flow

1. Browser loads `registries.generated.ts` through `entry.ts`.
2. `initRegistryExplorer` passes records to core index builders.
3. `buildComponentIndex(records)` maps each component tag and known item to matching registries.
4. Search matches component labels, aliases, known item names, registry namespace, description, focus labels, and framework/license text.
5. UI renders component-first result groups first, with registry-level context available below or in a detail panel.
6. Selecting a result creates a `SelectedComponent` object containing namespace, item name, label, source link, and command segment.
7. Queue state is local browser state. For v1, keep it in memory; add URL/session persistence only after the core queue behavior is stable.

### Install Command Flow

1. The command generator receives selected installable items, not raw strings from the DOM.
2. Each item is validated against a narrow pattern: namespace starts with `@`, item name is a CLI-safe registry item slug, and both came from generated data.
3. A single item emits `npx shadcn@latest add @registry/item`.
4. Multiple queued items emit one command: `npx shadcn@latest add @registry/a @other/b`.
5. The copy button writes to clipboard and shows UI status only; it never executes a command.

### Source Link Flow

1. Registry cards link to upstream `homepage`.
2. If `sourceUrl` exists in enrichment, show it as source/docs.
3. If a known item has `sourceUrl`, show item-level source links.
4. All outbound URLs are validated by the data validator before rendering and assigned through DOM-safe URL handling or a shared renderer helper.

## Patterns To Follow

### Build-Time Mirror, Runtime Static Consumer

**What:** Fetch and transform upstream directory data before deployment, commit or generate the app-ready dataset, and let Vite bundle it as static data.

**Why:** The official registry index is already a static JSON directory. Runtime fetching adds CORS, freshness, failure, and security concerns without improving a GitHub Pages app enough for v1.

**Implementation shape:**

```typescript
// entry.ts should continue to be simple.
import { registries } from './data/registries.generated';
import { initRegistryExplorer } from './ui';

initRegistryExplorer({ registries, roots });
```

### Provenance-Aware Generated Data

**What:** Generated registry records should include `syncedAt`, upstream URL/hash, and enrichment confidence.

**Why:** Users and maintainers need to distinguish "official directory says this registry exists" from "Registry Atlas knows this registry contains this component."

### Core-Derived View Models

**What:** Add pure functions such as `buildComponentIndex`, `searchRegistryAtlas`, `buildInstallCommand`, and `toggleSelectedComponent`.

**Why:** The current architecture is strongest where business behavior is pure and testable. Component-first search and queue semantics have enough edge cases to deserve core tests.

### DOM-Safe Rendering Before Dynamic Data Expansion

**What:** Before rendering synced third-party data, centralize escaping or switch rendered cards/rows to `createElement`, `textContent`, and validated `HTMLAnchorElement.href`.

**Why:** Current renderers use `innerHTML` with limited escaping. That is acceptable only while data is tiny and hand-curated. Synced third-party descriptions and URLs make this a priority boundary.

## Anti-Patterns To Avoid

### Runtime Scraping The Directory Page

Do not make the browser parse `https://ui.shadcn.com/docs/directory` or third-party registry sites. The official machine-readable source is the registry index JSON. Runtime scraping would make the static app brittle and slow.

### Treating The Generated Dataset As Hand-Editable

Generated files should be marked as generated and updated only by sync scripts. Human curation belongs in enrichment files so upstream diffs and local decisions stay reviewable.

### Inferring Installable Component Names From Tags Alone

A component tag like `button` is a search/category signal, not proof that `@registry/button` exists. Generate install commands only for known item names or for explicitly accepted low-confidence mappings. When only category-level support is known, show registry source links and search commands instead.

### Adding A Backend For Freshness Alone

Freshness can be handled by CI or a local sync command that opens a pull request. A backend should be deferred unless Registry Atlas needs authenticated registries, live health checks, or server-side aggregation that cannot be represented statically.

## Suggested Build Order

1. **Stabilize safety and test foundations**
   - Add runnable test script and validation test dependencies.
   - Centralize URL validation and HTML/text rendering safety.
   - Derive vocabulary types from const arrays to reduce schema drift.
   - Rationale: imported third-party data should not enter existing string-built renderers without stronger validation.

2. **Introduce upstream mirror data model**
   - Add `UpstreamRegistry`, `RegistryEnrichment`, `KnownRegistryItem`, and `RegistryAtlasRecord`.
   - Preserve namespace with `@`.
   - Add generated-file conventions.
   - Rationale: command generation, source links, and sync diffs need canonical upstream identity before UI work.

3. **Build sync and validation pipeline**
   - Fetch `registries.json`.
   - Generate normalized upstream data.
   - Merge enrichment.
   - Validate count, unique namespaces, URL protocols/templates, required fields, controlled vocabularies, duplicate known items, and CLI-safe command tokens.
   - Rationale: the milestone's 198-registry target should be enforced before expanding UI promises.

4. **Adapt existing views to generated records**
   - Keep focus/component/matrix behavior working from the new model.
   - Add source links and provenance indicators where cheap.
   - Rationale: preserve current product while changing the data foundation.

5. **Make component-first search primary**
   - Add component search view/index as the default route or first tab.
   - Search component tags, aliases, known items, and registry descriptions.
   - Rationale: users start from component need; this should sit on validated data instead of raw descriptions.

6. **Add install command generation**
   - Add single-item copy commands for known items.
   - Add fallback `shadcn search @registry -q "component"` suggestions for category-only matches.
   - Rationale: avoid false install commands while still helping users act.

7. **Add selected-component queue**
   - Implement queue as pure state transitions plus UI shell state.
   - Generate batch command only from valid selected items.
   - Rationale: queue depends on reliable command segments; build it after single-command generation is correct.

8. **Refine static deployment automation**
   - Run sync/validate/build in CI or document sync as a manual maintenance command.
   - Keep deployed app reading local generated data only.
   - Rationale: GitHub Pages remains simple and deterministic.

## Static Deployment Implications

| Concern | Recommendation | Reason |
|---------|----------------|--------|
| Data freshness | Sync at developer/CI time, not browser runtime. | Keeps GitHub Pages deploy static and avoids live upstream failures. |
| Generated data | Commit generated data if reviewers need visible diffs; otherwise generate in CI and upload artifact. Prefer committing for this project because roadmap emphasizes source alignment. | Directory changes become reviewable and reproducible. |
| Validation | Make validation part of `build` or predeploy workflow. | Bad URLs, duplicate namespaces, or unsafe command tokens should fail before deployment. |
| Bundle size | Keep 198 registry records in the JS bundle for now. Consider JSON split only if item-level data grows significantly. | 198 directory records are small; avoiding runtime fetch is simpler. |
| Third-party probing | Keep optional and bounded. Do not block normal builds on all third-party registries being reachable unless running an explicit audit mode. | Community registries can be down or slow; the app should mirror the directory without becoming a live uptime monitor. |
| Source links | Validate protocols and render as external links with `rel="noreferrer"`. | Third-party links are expected, but unsafe protocols are not. |
| Commands | Generate copyable commands only. | The project is an install-assist layer, not a CLI replacement. |
| Base path | Keep all app assets compatible with the configured Vite `base`. | GitHub Pages path casing is already flagged as a deployment risk. |

## Architecture Decision

Use a **static generated data architecture**:

- Source of truth: official shadcn registry index.
- Local source of interpretation: enrichment files and controlled vocabularies.
- Build-time work: sync, normalize, merge, validate, generate.
- Runtime work: search, group, render, select, copy commands.

This mirrors the shadcn directory without overcomplicating the app. It also gives the roadmap a clean dependency order: safety and data model first, sync/validation second, UI discovery and queue flows third.

## Research Flags

| Area | Confidence | Notes |
|------|------------|-------|
| Upstream registry list shape | HIGH | Verified from official `https://ui.shadcn.com/r/registries.json`; 198 entries with `name`, `homepage`, `url`, `description`. |
| CLI command shape | HIGH | Official docs show namespaced add/search/view commands and multiple resources in one add command. |
| Registry index requirements | HIGH | Official registry index docs define open-source, public, valid schema, flat registry expectations. |
| Component-level availability | MEDIUM | Official index lists registries, not every item. Item discovery may require per-registry search/list or curated enrichment. |
| Static deployment approach | HIGH | Existing Vite app already imports static data; upstream mirror can be generated locally. |

## Sources

- Official shadcn registry index JSON: `https://ui.shadcn.com/r/registries.json`
- Official registry directory docs: `https://ui.shadcn.com/docs/registry/registry-index`
- Official registry schema docs: `https://ui.shadcn.com/docs/registry/registry-json`
- Official registry item schema docs: `https://ui.shadcn.com/docs/registry/registry-item-json`
- Official namespace/CLI examples: `https://ui.shadcn.com/docs/registry/namespace`
- Official CLI docs: `https://ui.shadcn.com/docs/cli`
- Official May 2026 registry include/validate changelog: `https://ui.shadcn.com/docs/changelog/2026-05-registry-include`
- Official September 2025 registry index changelog: `https://ui.shadcn.com/docs/changelog/2025-09-registry-index`

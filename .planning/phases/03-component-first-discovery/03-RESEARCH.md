# Phase 03: Component-First Discovery - Research

**Researched:** 2026-05-25
**Domain:** Static Vite/vanilla TypeScript component-first discovery over shadcn registry mirror data
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
## Implementation Decisions

### Component-First Search and Results
- **D-01:** Make one primary search input the lead workflow. It should search namespaces, descriptions, focus tags, component tags, aliases, item names when available, coverage status, confidence, and relevant mirror metadata.
- **D-02:** Default search results should be component-first, not registry-first. A query for `button`, `data grid`, `chat`, or `auth form` should surface matching component/capability candidates first, with the registry as context.
- **D-03:** Rank exact item/component/tag matches above alias and description matches, then rank records with higher confidence/status clarity above unverified records. Do not hide unverified records; sort them lower and label them clearly.
- **D-04:** Use dense comparison rows or compact result cards optimized for scanning. Each candidate should show registry namespace, matched component/capability label, short description, coverage status, confidence/provenance, warning indicators, and source/profile affordances.
- **D-05:** Avoid marketing-style hero or large card grids for the primary experience. The first screen should remain the usable explorer, with search and results visible immediately.
- **D-06:** Search should degrade gracefully. If no verified or inferred component match exists, show partial/unverified registry matches with clear status copy instead of a false "no results" conclusion.

### Coverage Confidence and Status Language
- **D-07:** Use explicit coverage states: `verified`, `inferred`, `partial`, `unavailable`, and `unverified`.
- **D-08:** Treat current Atlas enrichment as inferred or unverified unless a concrete item catalog or direct registry item match proves coverage. Do not present component tags as guaranteed installable items unless validation has confirmed an item slug.
- **D-09:** Status copy should be neutral and practical: "Verified item", "Inferred from Atlas tags", "Partial catalog", "Catalog unavailable", or "Unverified coverage". Avoid implying Registry Atlas certifies third-party code.
- **D-10:** Empty states must explain data limitations. For example: "No verified item matches yet; showing unverified registry matches" is better than "No results" when mirror or catalog coverage is incomplete.
- **D-11:** Warnings from Phase 2 remain review/status indicators, not scare labels. Valid official links remain available unless mechanically invalid.

### Registry Profile
- **D-12:** Add an inspectable registry profile/detail view for each registry. It should expose namespace, description, homepage/source link, registry URL template, official source provenance, last sync, warning status, coverage status, confidence, aliases, focus tags, component tags, and item discovery status.
- **D-13:** The registry profile should distinguish official shadcn facts from Registry Atlas enrichment visually and structurally, following the Phase 2 `official` vs `atlas` split.
- **D-14:** Profiles should include useful "why this matched" context when opened from search results: matched fields, matched aliases/tags/items, and coverage status behind the result.
- **D-15:** Profiles should link out to upstream sources for inspection, but still avoid Phase 4 command-copy actions except for clearly deferred placeholders if needed for layout planning.

### Secondary Views
- **D-16:** Keep focus, component, and matrix browsing as secondary comparison modes. Do not remove them; reposition them as ways to browse and compare after search.
- **D-17:** The component view should evolve into a component index/facet that supports the primary search flow rather than a separate dead-end mode.
- **D-18:** The matrix should show coverage/status, not just yes/no coverage, where data allows. Unknown/unverified cells should be visually distinct from confirmed absence.
- **D-19:** Focus view should remain useful for broad browsing, but it should carry status language when groups contain mostly unverified or inferred records.

### Data and Implementation Boundaries
- **D-20:** Build Phase 3 on `public/data/registries.json` and `src/registry-explorer/data/loadRegistries.ts`; do not restore the legacy static TypeScript dataset as the runtime source.
- **D-21:** Add pure search/index/derivation helpers under `src/registry-explorer/core/` and test them directly before wiring DOM rendering.
- **D-22:** Keep the app static and client-side. Do not add a backend, database, or scheduled sync for Phase 3.
- **D-23:** If item catalogs are fetched or generated in Phase 3, store their availability/status explicitly and keep unavailable catalogs from blocking registry-level discovery.

### the agent's Discretion
The user asked for optimal choices for the best possible experience in all regards. Downstream agents should use the decisions above as locked defaults and choose implementation details that maximize fast scanning, truthful status, static deployability, and future Phase 4 command support.

If implementation reveals a conflict between polished discovery and honest coverage status, prioritize honest status. The product value depends on users not mistaking inferred or unavailable data for verified component availability.

### Deferred Ideas (OUT OF SCOPE)
## Deferred Ideas

- Copyable `npx shadcn@latest add @<registry>/<item>` and `view` commands belong to Phase 4.
- Batch install queue, deduped install command generation, and command-token safety UI belong to Phase 4.
- URL share state belongs to Phase 4.
- Package-manager command variants, visual previews, similar-registry recommendations, and scheduled sync PR automation remain v2 ideas.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DISC-01 | User can search by component need and see matching registry/component candidates as the primary discovery flow. | Use a pure component-first index over normalized registry records with ranked candidate rows. [VERIFIED: codebase grep] |
| DISC-02 | User can search registry namespaces, descriptions, focus tags, component aliases, item names, and relevant metadata from one search input. | Extend `Registry`/mirror mapping to preserve `atlas.aliases`, `atlas.coverage_status`, `atlas.confidence`, and optional item summaries from `public/data/registries.json`. [VERIFIED: codebase grep] |
| DISC-03 | User can inspect a registry profile showing namespace, description, homepage/source links, registry URL template, provenance, last sync, and item discovery status. | Build profile derivation from `RegistryMirrorMeta`, `Registry.mirror.registryUrlTemplate`, official fields, Atlas enrichment, and search match context. [VERIFIED: codebase grep] |
| DISC-04 | User can distinguish verified item coverage from inferred, partial, unavailable, or unverified component coverage. | Add a `CoverageStatus` union and map current generated values, which currently include `inferred` and `unverified`. [VERIFIED: codebase grep] |
| DISC-05 | User can compare component alternatives across registries with enough context to choose a candidate without opening every registry site. | Render dense result rows/cards with namespace, match label, description, coverage status, confidence, warnings, and profile/source actions. [VERIFIED: codebase grep] |
| DISC-06 | User can still browse registry-first focus and matrix views as secondary comparison views. | Preserve `focus`, `component`, and `matrix` routing in `src/registry-explorer/ui/shell.ts` while adding search/profile state. [VERIFIED: codebase grep] |
| DISC-07 | User sees useful empty and partial-data states instead of false "no results" conclusions when third-party item catalogs are unavailable. | Empty states must branch between no matches, no verified item matches, unavailable catalogs, and unverified registry-level matches. [VERIFIED: codebase grep] |
| HARD-04 | User can see neutral provenance/freshness/status indicators without the app implying third-party code is approved or safe. | Continue Phase 2 mirror status language and expose official versus Atlas provenance in profiles/results. [VERIFIED: codebase grep] |
</phase_requirements>

## Summary

Phase 3 should remain a static client-side enhancement over the Phase 2 runtime mirror, not a backend or sync expansion. The authoritative runtime source is `public/data/registries.json`, loaded through `src/registry-explorer/data/loadRegistries.ts`; the current generated mirror has 199 registries, 81 inferred records, 118 unverified records, 81 records with component tags, zero aliases, zero notes, and zero stored warnings. [VERIFIED: codebase grep]

The key planning decision is to introduce a pure discovery layer under `src/registry-explorer/core/` that converts registry records into ranked `ComponentCandidate` and `RegistryProfile` view models before any DOM work. Current `filterRegistries` only performs substring registry filtering over name, description, framework, license, focus keys, and component tags; it does not produce match reasons, result classes, status-aware ranking, profile context, or item-level candidates. [VERIFIED: codebase grep]

**Primary recommendation:** Implement a dependency-free, pure TypeScript search/index/profile derivation layer over the existing mirror data, then wire it into `shell.ts` as the default results view while preserving focus/component/matrix as secondary modes. [VERIFIED: codebase grep]

## Project Constraints (from AGENTS.md)

- Mirror the official shadcn directory and avoid drifting into an unrelated curated catalog. [VERIFIED: AGENTS.md]
- Preserve the lightweight Vite/vanilla TypeScript SPA unless a concrete sync or data-delivery requirement justifies added infrastructure. [VERIFIED: AGENTS.md]
- Keep the app deployable as a static GitHub Pages site. [VERIFIED: AGENTS.md]
- Community registries are third-party code; links, commands, and metadata must not imply Registry Atlas has audited or endorsed them. [VERIFIED: AGENTS.md]
- Use copyable shadcn CLI commands and source links only in action phases; do not execute installs from the browser. [VERIFIED: AGENTS.md]
- Data imports and generated output need tests or validation so refreshes do not silently break search, grouping, URLs, or install commands. [VERIFIED: AGENTS.md]
- Follow local TypeScript conventions: two-space indentation, single quotes, relative imports, `.schema.ts` for shared contracts, `.data.ts` for static data, `.test.ts` under `tests/registry-explorer/`, pure core helpers, DOM renderers under `ui/`, and safe rendering helpers for imported text and links. [VERIFIED: AGENTS.md]
- GSD workflow enforcement says file-changing work should start through `/gsd-quick`, `/gsd-debug`, or `/gsd-execute-phase`; this research artifact was requested by the GSD planning flow and does not implement code. [VERIFIED: AGENTS.md]

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|--------------|----------------|-----------|
| Component-first search/index | Browser / Client | CDN / Static | Static JSON is fetched by the browser and transformed by pure TypeScript helpers; no server runtime exists. [VERIFIED: codebase grep] |
| Registry profile detail | Browser / Client | CDN / Static | Profiles are derived from loaded mirror metadata and registry records in local app state. [VERIFIED: codebase grep] |
| Coverage status labeling | Browser / Client | Static Data | Status values come from generated mirror Atlas fields and are rendered as neutral UI labels. [VERIFIED: codebase grep] |
| Official mirror freshness | Browser / Client | Static Data | Existing mirror status already renders `source_url`, `synced_at`, upstream count, local count, and warnings from loaded JSON metadata. [VERIFIED: codebase grep] |
| Secondary focus/component/matrix browsing | Browser / Client | Static Data | Current `shell.ts` routes among focus, component, and matrix renderers with closure-local state. [VERIFIED: codebase grep] |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | Local `~5.9.3`; latest npm `6.0.3` modified 2026-04-16 | Strict source contracts and pure derivation tests | Existing project compiler and conventions use strict TypeScript; no runtime package is needed for search. [VERIFIED: npm registry] |
| Vite | Local `^7.2.4` resolved as 7.2.7; latest npm `8.0.14` modified 2026-05-21 | Static dev/build pipeline | Existing deployed app is a Vite SPA with GitHub Pages base path. [VERIFIED: npm registry] |
| Vitest | Local `^4.1.7`; latest npm `4.1.7` modified 2026-05-20 | Unit tests for pure search/profile/matrix helpers | Existing tests already use Vitest and `pnpm verify` includes test and build gates. [VERIFIED: npm registry] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None | — | Component-first discovery should use native TypeScript string normalization, arrays, maps, and sets | The dataset is 199 registry records and 70 current component tags, so a dependency-free index is simpler and sufficient for this phase. [VERIFIED: codebase grep] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native pure TypeScript index | Fuse.js or MiniSearch | Better fuzzy search, but adds package legitimacy, bundle, tuning, and ranking opacity for a small static catalog. Use native scoring now. [ASSUMED] |
| Client-only derived profiles | Pre-generated profile JSON | Faster initial derivation, but duplicates generated data and increases validation surface before there is a proven performance need. [VERIFIED: codebase grep] |
| Static SPA state | URL state | URL share state is explicitly deferred to Phase 4. [VERIFIED: CONTEXT.md] |

**Installation:**

```bash
# No new packages for Phase 3.
pnpm install
```

**Version verification:**

```bash
npm view vite version time.modified
npm view typescript version time.modified
npm view vitest version time.modified
```

## Package Legitimacy Audit

No external packages are recommended for Phase 3, so the Package Legitimacy Gate is not required. Existing declared dev dependencies were checked against npm for current versions and no `scripts.postinstall` value was returned for `vite`, `typescript`, or `vitest`. [VERIFIED: npm registry]

## Architecture Patterns

### System Architecture Diagram

```text
Browser loads index.html
  -> entry.ts fetches BASE_URL/data/registries.json via loadRegistries()
  -> validateRegistryMirror() rejects invalid mirror shape
  -> loadRegistries() maps official + atlas + status fields into app records
  -> shell.ts owns local AppState
      -> primary search input updates searchTerm
      -> buildDiscoveryIndex() normalizes searchable fields
      -> searchComponentCandidates() ranks candidates and match reasons
          -> renderDiscoveryResults() shows component-first comparison rows
          -> select registry -> buildRegistryProfile() -> renderRegistryProfile()
      -> secondary tabs route to focus/component/matrix renderers
          -> status-aware grouping/matrix helpers preserve partial/unverified states
```

### Recommended Project Structure

```text
src/registry-explorer/
├── core/
│   ├── discovery.ts              # pure index, search, ranking, match reasons
│   ├── registryProfile.ts        # pure profile/detail derivation
│   ├── coverageStatus.ts         # status ordering and display labels
│   └── registry.schema.ts        # shared CoverageStatus, Candidate, Profile types
├── data/
│   └── loadRegistries.ts         # preserve official/atlas/status fields from JSON
└── ui/
    ├── discoveryView.ts          # compact component-first result rendering
    ├── registryProfileView.ts    # official vs Atlas profile sections
    └── shell.ts                  # default discovery routing and selected profile state

tests/registry-explorer/
├── discovery.test.ts
├── registryProfile.test.ts
├── coverageStatus.test.ts
└── shell-discovery.test.ts       # only if DOM shell behavior is tested
```

### Pattern 1: Preserve Raw Provenance at the Data Boundary

**What:** Extend `Registry` or add a nested profile source object so `loadRegistries.ts` carries `official.description`, `official.homepage`, `official.registry_url_template`, `atlas.aliases`, `atlas.coverage_status`, `atlas.confidence`, `atlas.notes`, and `status.warnings` into runtime records. [VERIFIED: codebase grep]

**When to use:** First implementation wave, before ranking or rendering, because search and profile state need fields that are currently present in JSON but dropped by the loader. [VERIFIED: codebase grep]

**Example:**

```typescript
export type CoverageStatus = 'verified' | 'inferred' | 'partial' | 'unavailable' | 'unverified';

export interface Registry {
  name: string;
  url: string;
  description: string;
  primary_focus: PrimaryFocus[];
  component_tags: ComponentTag[];
  atlas: {
    aliases: readonly string[];
    coverageStatus: CoverageStatus;
    confidence: 'high' | 'medium' | 'low' | 'unknown';
    notes: string;
  };
  mirror: {
    officialName: string;
    registryUrlTemplate: string;
    warnings: string[];
  };
}
```

### Pattern 2: Candidate Search Is a Derived View Model, Not a Filter

**What:** Build `ComponentCandidate[]` from each registry and each matched component tag/item/alias/capability. Include `candidateId`, `registry`, `matchedLabel`, `matchedField`, `matchReasons`, `coverageStatus`, `confidence`, and `score`. [VERIFIED: codebase grep]

**When to use:** Replace default registry-first filtering for the primary search workflow while keeping existing grouping helpers for secondary views. [VERIFIED: codebase grep]

**Example:**

```typescript
export interface ComponentCandidate {
  id: string;
  registry: Registry;
  matchedLabel: string;
  matchedField: 'item' | 'component-tag' | 'alias' | 'focus' | 'namespace' | 'description' | 'metadata';
  matchReasons: readonly string[];
  coverageStatus: CoverageStatus;
  confidence: Registry['atlas']['confidence'];
  score: number;
}
```

### Pattern 3: Status-Aware Ranking

**What:** Score exact item/component/tag matches highest, alias/focus matches next, description/metadata matches lower, then apply status/confidence tie-breakers without hiding unverified candidates. [VERIFIED: CONTEXT.md]

**When to use:** In `searchComponentCandidates()` after collecting all matching candidates. [VERIFIED: codebase grep]

**Example:**

```typescript
const COVERAGE_WEIGHT: Record<CoverageStatus, number> = {
  verified: 50,
  inferred: 30,
  partial: 20,
  unavailable: 5,
  unverified: 0,
};
```

### Pattern 4: Profiles Are Sections With Explicit Source Boundaries

**What:** Render profile sections as Official shadcn facts, Registry Atlas enrichment, Item discovery status, and Mirror freshness. [VERIFIED: CONTEXT.md]

**When to use:** Any registry profile, especially profiles opened from search results with `matchReasons`. [VERIFIED: CONTEXT.md]

### Anti-Patterns to Avoid

- **Treating component tags as verified installable items:** Current tags are Atlas enrichment and must be labeled inferred or unverified unless item slugs are validated. [VERIFIED: CONTEXT.md]
- **Replacing existing tabs with a landing page:** The app should keep the usable explorer as the first screen and preserve focus/component/matrix secondary modes. [VERIFIED: CONTEXT.md]
- **Adding a backend/search service:** Phase 3 is static and client-side; generated JSON and pure browser derivation are enough for current data volume. [VERIFIED: CONTEXT.md]
- **Binary matrix coverage:** Matrix cells must distinguish inferred/unverified/unknown states where data allows, not only true/false. [VERIFIED: CONTEXT.md]
- **Rendering imported mirror text without escape helpers:** Existing project safety convention requires `escapeHtml` and safe external links for imported text/URLs. [VERIFIED: codebase grep]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Full fuzzy search engine | Custom typo-tolerant tokenizer/ranker | Exact/substring normalized search with transparent scoring | Small dataset and status-sensitive ranking favor predictable match reasons. [VERIFIED: codebase grep] |
| URL protocol validation | Ad hoc `href` string concatenation | Existing `toSafeExternalUrl()` / `renderExternalLink()` | Phase 1 centralized link safety and tests already cover unsupported protocols. [VERIFIED: codebase grep] |
| Registry schema truth | Custom guessed item schema | Official shadcn `registry.json` and `registry-item.json` schema/docs | Official schemas define registry `items`, item `name`, `type`, `title`, `description`, dependencies, files, categories, and metadata. [CITED: https://ui.shadcn.com/schema/registry-item.json] |
| CLI trust/security model | Browser-executed install behavior | Source/profile links now; command actions deferred to Phase 4 | Official namespace docs state registry resources are fetched by the CLI, and user decisions defer copy commands to Phase 4. [CITED: https://ui.shadcn.com/docs/registry/namespace] |

**Key insight:** The hard part is not searching strings; it is preserving provenance and making ranking/status semantics honest enough that inferred Atlas enrichment is not mistaken for verified installability. [VERIFIED: CONTEXT.md]

## Common Pitfalls

### Pitfall 1: Loader Drops Needed Fields

**What goes wrong:** `public/data/registries.json` contains `atlas.aliases`, `atlas.coverage_status`, `atlas.confidence`, and `atlas.notes`, but current `loadRegistries.ts` maps only focus tags and component tags into `Registry`. [VERIFIED: codebase grep]

**How to avoid:** First plan should extend schema and loader tests before search UI work. [VERIFIED: codebase grep]

**Warning signs:** Search cannot explain aliases/status, profiles show only namespace/homepage/template/warnings, or results treat all tagged records equally. [VERIFIED: codebase grep]

### Pitfall 2: False Verified Coverage

**What goes wrong:** Current mirror has 81 inferred records and 118 unverified records, with no verified/partial/unavailable values currently present. [VERIFIED: codebase grep]

**How to avoid:** Display component tag matches as "Inferred from Atlas tags" unless a concrete item match is added and validated. [VERIFIED: CONTEXT.md]

**Warning signs:** Result rows say "ships button" without status, or matrix cells imply absence/presence as fact. [VERIFIED: CONTEXT.md]

### Pitfall 3: Official Directory Is a Registry Index, Not a Complete Item Catalog

**What goes wrong:** The official directory JSON provides namespace, homepage, registry URL template, and description; it does not list every item for every registry. [VERIFIED: codebase grep]

**How to avoid:** Treat item discovery as optional and statused; do not block registry-level discovery when item catalogs are unavailable. [VERIFIED: CONTEXT.md]

**Warning signs:** Empty search state says "No results" for terms that have unverified registry metadata matches. [VERIFIED: CONTEXT.md]

### Pitfall 4: Confusing Registry Template With Resolved Item URL

**What goes wrong:** Registry URL templates include `{name}` placeholders; they are not directly item URLs until an item slug is known. [VERIFIED: codebase grep]

**How to avoid:** Profiles can show the template, but Phase 3 should not generate install/view commands for unvalidated item slugs. [VERIFIED: CONTEXT.md]

**Warning signs:** UI shows `@registry/component` actions for tag-only matches. [VERIFIED: CONTEXT.md]

### Pitfall 5: Losing Secondary Browse Value

**What goes wrong:** Making discovery default can strand focus/component/matrix views or keep them registry-first with misleading empty states. [VERIFIED: CONTEXT.md]

**How to avoid:** Preserve tabs and update their helpers to consume status-aware `Registry` data. [VERIFIED: codebase grep]

## Code Examples

### Normalize Search Terms

```typescript
export function normalizeSearchTerm(value: string): string {
  return value.trim().toLowerCase().replace(/[-_]+/g, ' ').replace(/\s+/g, ' ');
}
```

Source: project pure-helper pattern in `src/registry-explorer/core/grouping.ts`. [VERIFIED: codebase grep]

### Collect Match Reasons

```typescript
function addReason(reasons: string[], label: string, matched: boolean): void {
  if (matched) {
    reasons.push(label);
  }
}
```

Source: recommended pattern for transparent ranking required by D-03 and D-14. [VERIFIED: CONTEXT.md]

### Render Status Copy Through Escape Helpers

```typescript
const coverageCopy: Record<CoverageStatus, string> = {
  verified: 'Verified item',
  inferred: 'Inferred from Atlas tags',
  partial: 'Partial catalog',
  unavailable: 'Catalog unavailable',
  unverified: 'Unverified coverage',
};
```

Source: locked Phase 3 status language. [VERIFIED: CONTEXT.md]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single large static `registries.data.ts` as runtime source | Browser fetches `public/data/registries.json` through `loadRegistries.ts` | Phase 2, completed 2026-05-25 | Phase 3 must extend loader/schema instead of restoring legacy static data. [VERIFIED: codebase grep] |
| Registry-first filter/groups only | Component-first ranked candidates plus secondary focus/component/matrix browsing | Phase 3 target | Search becomes the lead workflow while existing tabs remain useful. [VERIFIED: CONTEXT.md] |
| Boolean matrix coverage | Status-aware coverage where known | Phase 3 target | Unknown/unverified cells must be visually distinct from confirmed absence. [VERIFIED: CONTEXT.md] |
| shadcn source registries manually kept as one large registry file | `include` can compose source registries and `shadcn build` flattens output | May 2026 shadcn changelog | If item catalog discovery is attempted later, planners must account for includes/source-vs-built registry shape. [CITED: https://ui.shadcn.com/docs/changelog/2026-05-registry-include] |

**Deprecated/outdated:**
- `src/registry-explorer/data/registries.data.ts` is not the runtime catalog; docs say it is a legacy enrichment seed. [VERIFIED: codebase grep]
- Treating current component tags as installable item slugs is out of date for the Phase 2 mirror model. [VERIFIED: CONTEXT.md]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | A native TypeScript search/ranking implementation is sufficient instead of adding Fuse.js/MiniSearch. | Standard Stack | If users need typo tolerance or complex ranking, later plans may need a package and package legitimacy gate. |

## Open Questions (RESOLVED)

1. **Will Phase 3 fetch individual item catalogs, or only model the status surface for future catalog ingestion?**
   - What we know: D-23 permits fetched/generated item catalogs if statused, but Phase 3 can satisfy current data with inferred/unverified coverage. [VERIFIED: CONTEXT.md]
   - Decision: Phase 3 must model and preserve static/generated item catalog summaries for every registry where item data can be discovered by the existing sync/validation pipeline or checked-in mirror data. Do not perform browser runtime catalog probing. Store item discovery availability/status explicitly so unavailable catalogs never block registry-level discovery. [RESOLVED: D-06a, D-08, D-23]
   - Planning requirement: Plans must add a data/model/validation slice before discovery ranking that carries known item `name`, `slug`, `type/category` when available, source/provenance, catalog status, and route eligibility into runtime records. Search/profile/UI work must consume those known item summaries and show direct item routes only when `registryUrlTemplate + item.slug` validates. [RESOLVED: checker feedback]

2. **Should the default tab become a new `discover` view or should the existing `component` tab become default?**
   - What we know: D-02 requires default results to be component-first and D-16 requires existing browse views to remain. [VERIFIED: CONTEXT.md]
   - Decision: Add a `discover`/results render path as the default state and keep `component` as a secondary component index/facet. [RESOLVED: D-02, D-16]

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js | Vite, tests, sync/validate scripts | yes | v24.14.1 local; CI uses Node 20 | Use CI Node 20 for release parity. [VERIFIED: command output] |
| pnpm | Project scripts | yes | 10.23.0 local; CI uses pnpm 9 | Use package scripts, avoid global assumptions. [VERIFIED: command output] |
| npm registry access | Version verification | yes | npm 10.9.2 | Use lockfile/local versions if registry unavailable. [VERIFIED: command output] |
| Vitest binary | Unit tests | yes | 4.1.7 in `node_modules/.bin` | Run `node_modules/.bin/vitest` or `pnpm test`; one `pnpm exec vitest --version` probe failed despite local binary presence. [VERIFIED: command output] |
| Official shadcn registry endpoint | Mirror freshness/context | yes | Live endpoint returned 199 registries on 2026-05-25 | Use existing checked-in `public/data/registries.json` when offline. [VERIFIED: command output] |

**Missing dependencies with no fallback:** None found. [VERIFIED: command output]

**Missing dependencies with fallback:** `pnpm exec vitest --version` failed in one probe, but `node_modules/.bin/vitest --version` succeeded and package scripts should remain the primary runner. [VERIFIED: command output]

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | no | No user accounts or auth flows in Phase 3. [VERIFIED: REQUIREMENTS.md] |
| V3 Session Management | no | No sessions in the static SPA. [VERIFIED: codebase grep] |
| V4 Access Control | no | No privileged user actions or backend authorization. [VERIFIED: codebase grep] |
| V5 Input Validation | yes | Normalize search input, validate mirror data through `validateRegistryMirror`, and escape all rendered imported text. [VERIFIED: codebase grep] |
| V6 Cryptography | no | No cryptographic operations in Phase 3. [VERIFIED: codebase grep] |

### Known Threat Patterns for Static Registry Discovery

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS through registry descriptions, aliases, notes, or item metadata | Tampering / Elevation of Privilege | Use `escapeHtml` for text and `renderExternalLink` for URLs; do not interpolate unescaped mirror fields. [VERIFIED: codebase grep] |
| Unsafe external URL protocols | Spoofing / Tampering | Continue `toSafeExternalUrl()` policy allowing only HTTP/HTTPS and rejecting protocol-relative/scriptable URLs. [VERIFIED: codebase grep] |
| False trust signal for third-party code | Spoofing | Use neutral status/provenance copy and avoid approval/safety badges. [VERIFIED: AGENTS.md] |
| Browser-executed install behavior | Elevation of Privilege | Do not execute installs in the browser; Phase 3 only links sources/profiles and Phase 4 handles copyable commands. [VERIFIED: REQUIREMENTS.md] |

## Sources

### Primary (HIGH confidence)

- `AGENTS.md` - project constraints, stack, conventions, architecture, workflow enforcement. [VERIFIED: codebase grep]
- `.planning/phases/03-component-first-discovery/03-CONTEXT.md` - locked Phase 3 decisions and deferred scope. [VERIFIED: codebase grep]
- `.planning/REQUIREMENTS.md` - DISC-01 through DISC-07 and HARD-04 requirement text. [VERIFIED: codebase grep]
- `.planning/ROADMAP.md` - Phase 3 goal, success criteria, dependencies. [VERIFIED: codebase grep]
- `.planning/phases/02-official-mirror-data-pipeline/02-04-SUMMARY.md` - Phase 2 output, mirror count, verify workflow. [VERIFIED: codebase grep]
- `docs/registry-explorer-data.md` - generated mirror maintenance and field provenance. [VERIFIED: codebase grep]
- `public/data/registries.json` and `data/shadcn/sync-report.json` - current runtime mirror shape and counts. [VERIFIED: codebase grep]
- `src/registry-explorer/core/*`, `src/registry-explorer/data/loadRegistries.ts`, `src/registry-explorer/ui/*`, `tests/registry-explorer/*` - existing implementation seams. [VERIFIED: codebase grep]
- Official shadcn registry directory docs: https://ui.shadcn.com/docs/registry/registry-index. [CITED: ui.shadcn.com/docs/registry/registry-index]
- Official shadcn namespace docs: https://ui.shadcn.com/docs/registry/namespace. [CITED: ui.shadcn.com/docs/registry/namespace]
- Official shadcn registry schema: https://ui.shadcn.com/schema/registry.json. [CITED: ui.shadcn.com/schema/registry.json]
- Official shadcn item schema: https://ui.shadcn.com/schema/registry-item.json. [CITED: ui.shadcn.com/schema/registry-item.json]
- Official shadcn CLI docs: https://ui.shadcn.com/docs/cli. [CITED: ui.shadcn.com/docs/cli]
- Official shadcn May 2026 registry include/validate changelog: https://ui.shadcn.com/docs/changelog/2026-05-registry-include. [CITED: ui.shadcn.com/docs/changelog/2026-05-registry-include]

### Secondary (MEDIUM confidence)

- npm registry version probes for `vite`, `typescript`, and `vitest`. [VERIFIED: npm registry]

### Tertiary (LOW confidence)

- No unverified web-only sources used. [VERIFIED: codebase grep]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - existing stack and npm versions were checked; no new packages recommended. [VERIFIED: npm registry]
- Architecture: HIGH - based on current code seams and locked static SPA decisions. [VERIFIED: codebase grep]
- Pitfalls: HIGH - based on actual loader field loss, current mirror status distribution, and locked coverage language. [VERIFIED: codebase grep]

**Research date:** 2026-05-25
**Valid until:** 2026-06-24 for codebase planning assumptions; re-check shadcn docs and npm versions before package or CLI-facing Phase 4 work. [ASSUMED]

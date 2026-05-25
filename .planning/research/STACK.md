# Stack Research: Registry Atlas Sync and Validation

**Project:** Registry Atlas  
**Research dimension:** Stack and tooling for shadcn registry mirroring  
**Researched:** 2026-05-25  
**Overall confidence:** HIGH for static app/build tooling; MEDIUM for component inventory extraction across all third-party registries

## Recommendation

Keep Registry Atlas as a static TypeScript/Vite app and add a Node-based sync pipeline that runs locally and in CI. The deployed GitHub Pages site should consume generated static data only; it should not fetch, crawl, or validate third-party registries in the browser.

The standard stack for this milestone is:

| Area | Recommendation | Version Strategy | Confidence | Rationale |
|------|----------------|------------------|------------|-----------|
| Static app | Vite + vanilla TypeScript | Keep current Vite 7 lockfile for the milestone, then upgrade deliberately to Vite 8.x after CI is stable | HIGH | The existing app is already a static SPA and GitHub Pages-compatible. Sync needs build-time data, not a framework migration. |
| Language | TypeScript | Keep `~5.9.3` until a dependency refresh phase; latest verified npm version is `6.0.3` | HIGH | The existing strict TS setup is enough for generated data, command generation, and validators. A major TS bump should not be coupled to the sync feature. |
| Package manager | pnpm | Pin with `packageManager`, prefer current pnpm 11.x when the lockfile is intentionally refreshed | HIGH | CI already uses pnpm. Pinning prevents Windows/WSL PATH drift and makes generated data refreshes reproducible. Latest verified npm version: `11.3.0`. |
| Node runtime | Node LTS in CI and local scripts | Use Node 24 LTS if the project refreshes the toolchain; otherwise keep Node 20 only if Vite/test dependencies remain compatible | MEDIUM | Node provides built-in `fetch`, URL parsing, AbortController, and ESM scripting without extra HTTP libraries. Node version should be explicit because the current environment already shows npm path drift. |
| Official directory mirror | Fetch `https://ui.shadcn.com/r/registries.json` | Treat the 198-entry count as a validation assertion, not a hard-coded product fact | HIGH | This is the public machine-readable registry directory used by shadcn. Verified on 2026-05-25: 198 entries. |
| Provenance source | Compare against `https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/directory.json` | Use as a secondary source, not the primary app input | HIGH | The GitHub source currently also has 198 entries and includes extra fields such as `logo`; it is useful for provenance and diffing, but the public `/r/registries.json` endpoint is the cleaner mirror target. |
| Validation | Ajv | Use `ajv@8.20.0` | HIGH | shadcn publishes JSON schemas under `https://ui.shadcn.com/schema/`. Ajv validates JSON Schema directly and avoids maintaining a second hand-written schema. |
| Local normalized schema | TypeScript types derived from `const` vocabularies plus a small local validator | No additional runtime schema library unless UI runtime validation becomes necessary | HIGH | The app already uses controlled vocabularies. The sync script should validate imported data before generation; the browser should not pay for schema validation. |
| Concurrency | `p-limit` | Use `p-limit@7.3.0` only in sync scripts | MEDIUM | Component discovery may require probing many registry endpoints. Bounded concurrency avoids hammering community registries and keeps CI stable. |
| Test runner | Vitest | Add `vitest@4.1.7` and a `test` script | HIGH | Tests already import Vitest but the dependency/script is missing. This should be fixed before adding sync-generated data. |
| DOM tests | Avoid by default for this milestone; use focused DOM tests only if UI command/queue behavior becomes fragile | If needed, use `jsdom@29.1.1` | MEDIUM | The critical risk is data correctness. Core command-generation and grouping tests can stay DOM-free. Add jsdom only for clipboard/selection behavior that cannot be covered with pure functions. |
| Formatting generated data | Deterministic generator output; optionally Prettier | `prettier@3.8.3` only if generated TypeScript becomes hard to review | MEDIUM | Stable sorting and `JSON.stringify` are enough for generated JSON. Prettier is useful for generated `.ts` output but should not be introduced just to pretty-print JSON. |
| shadcn CLI compatibility | Use `shadcn@4.8.0` or `shadcn@latest` in documentation checks, not as the primary data parser | Pin in CI if used for compatibility smoke tests | MEDIUM | The CLI is the source of install command semantics, but the mirror pipeline needs deterministic JSON outputs. Use the CLI to verify command shape and registry compatibility, not to scrape interactive output. |

## Official shadcn Facts Verified

| Fact | Verification | Confidence |
|------|--------------|------------|
| Official directory endpoint exists at `https://ui.shadcn.com/r/registries.json` | Direct fetch returned an array of 198 entries on 2026-05-25 | HIGH |
| Official source directory exists at `apps/v4/registry/directory.json` in `shadcn-ui/ui` | Direct fetch from GitHub raw returned an array of 198 entries on 2026-05-25 | HIGH |
| Directory entries include `name`, `homepage`, `url`, and `description` | Verified from public JSON; GitHub source may include additional fields such as `logo` | HIGH |
| Registry URL templates use `{name}` placeholders | Verified from public JSON examples such as `https://www.8bitcn.com/r/{name}.json` | HIGH |
| shadcn publishes registry JSON schemas | `https://ui.shadcn.com/schema/registry.json` and `https://ui.shadcn.com/schema/registry-item.json` returned JSON Schema documents | HIGH |
| shadcn install command shape is `npx shadcn add @<registry>/<component>` | Project context and current shadcn docs align on this command style | HIGH |

## Data Pipeline

Use a generated-data pipeline with clear boundaries:

```text
scripts/sync-shadcn-directory.ts
  -> fetch official directory JSON
  -> validate directory shape and URL templates
  -> optionally resolve registry indexes by replacing {name} with registry
  -> validate reachable registry/index/item JSON with official schemas
  -> normalize fields into Registry Atlas data model
  -> generate static data artifact

src/registry-explorer/data/generated/
  directory.generated.json
  registry-components.generated.json
  sync-manifest.generated.json

src/registry-explorer/core/
  consumes generated data through typed adapters
```

Prefer generated JSON artifacts over generated TypeScript for the mirror data. JSON makes diffs smaller, allows direct schema validation, and keeps the browser bundle from coupling data refreshes to TypeScript source formatting. If the existing app wants imports with static typing, add a thin TypeScript adapter that imports JSON and maps it into the existing `Registry` shape.

### Required Scripts

Add these scripts to `package.json`:

```json
{
  "scripts": {
    "sync:directory": "tsx scripts/sync-shadcn-directory.ts",
    "validate:data": "tsx scripts/validate-registry-data.ts",
    "test": "vitest run",
    "check": "tsc --noEmit && pnpm validate:data && vitest run && vite build"
  }
}
```

Use `tsx` only if the team wants direct TypeScript script execution. If minimizing dependencies is preferred, write scripts in plain ESM JavaScript and keep TypeScript types in the app/core layer. For this project, `tsx` is acceptable but not required; the more important decision is that validation runs before build/deploy.

## Dependencies To Add

| Package | Purpose | Recommendation | Confidence |
|---------|---------|----------------|------------|
| `vitest@4.1.7` | Existing pure tests and new sync/command tests | Add immediately | HIGH |
| `ajv@8.20.0` | Validate shadcn JSON schemas and local generated artifacts | Add immediately | HIGH |
| `p-limit@7.3.0` | Bound concurrent registry endpoint probes | Add when component discovery fetches third-party registries | MEDIUM |
| `tsx` | Run TypeScript sync scripts directly | Optional; add only if scripts stay in TypeScript | MEDIUM |
| `prettier@3.8.3` | Stable generated `.ts` formatting | Optional; unnecessary for generated JSON | MEDIUM |
| `jsdom@29.1.1` | DOM tests for copy/queue UI | Optional; add only when UI behavior needs DOM-level tests | MEDIUM |

Do not add `axios`, `lodash`, a database client, a server framework, React, Next.js, Astro, TanStack Query, or a search SaaS SDK for this milestone. Native Node/browser APIs and static generated assets cover the actual requirements with less deployment risk.

## Validation Rules

The validation tool should fail CI on:

- Official directory fetch failure.
- Directory count mismatch against the last committed manifest, with a clear diff of added/removed registry names.
- Duplicate registry `name` values.
- Missing `name`, `homepage`, `url`, or `description`.
- Registry names that do not start with `@`.
- URL templates that do not contain `{name}`.
- Non-HTTP(S) `homepage` or `url` values.
- Malformed URLs after `{name}` substitution.
- Generated install commands that do not match `npx shadcn add @scope/component`.
- Component names that cannot be safely inserted into command text.
- Generated records with missing source/provenance fields.

The validator should warn, not fail, on:

- Third-party registry endpoint timeouts during optional component discovery.
- A registry that has no resolvable `registry.json` index after substituting `{name}` with `registry`.
- Missing optional logo fields.
- Descriptions that are long, marketing-heavy, or duplicated.

This distinction matters because Registry Atlas must mirror the official directory even when a community registry has temporary availability issues. The hard gate is directory integrity and safe command generation; component coverage can carry confidence/provenance metadata.

## Component-First Discovery

Component-first discovery needs a normalized component inventory. The official directory index lists registries, not a guaranteed complete component catalog for every registry. Use a best-effort discovery layer:

1. Mirror official registry directory entries exactly enough to preserve name, homepage, registry URL template, description, and source provenance.
2. For each entry, attempt to fetch a registry index by substituting `{name}` with `registry`.
3. Validate any returned registry index against shadcn's official registry schema.
4. Extract item names and item metadata where available.
5. Store per-registry discovery status: `complete`, `partial`, `unavailable`, or `unsupported-template`.
6. Generate commands only from validated registry names and safe item names.

Do not imply that Registry Atlas has audited third-party code. The UI should show source links and command text, but validation should be described as metadata/shape validation, not security approval.

## Install Command Generation

Keep command generation as pure TypeScript core logic:

```typescript
export function buildInstallCommand(selection: readonly RegistryComponentSelection[]): string {
  const targets = selection.map(({ registryName, componentName }) => `${registryName}/${componentName}`)
  return `npx shadcn add ${targets.join(" ")}`
}
```

Batch generation should preserve deterministic ordering, dedupe repeated selections, and reject unsafe component names before rendering copyable text. Clipboard integration belongs in the UI layer; command construction belongs in `core/` with tests.

## GitHub Pages And CI

The deployment constraint remains static GitHub Pages:

- Run sync/validation in CI before `vite build`.
- Commit generated data if the project wants deterministic review of directory changes.
- Alternatively, generate during CI and upload the generated artifact only if the roadmap accepts less visible data diffs.
- Keep `vite.config.ts` base-path handling explicit and fix the existing casing risk before relying on Pages as the source of truth.
- Do not add serverless functions, scheduled backend jobs, or runtime API calls for v1.

Recommended workflow shape:

```text
checkout
setup pnpm from packageManager
setup Node LTS
pnpm install --frozen-lockfile
pnpm sync:directory --check
pnpm validate:data
pnpm test
pnpm build
upload GitHub Pages artifact
deploy
```

If automatic upstream refreshes are desired, use a scheduled GitHub Actions workflow that opens a pull request with generated data changes. Do not have the production static site refresh data directly from the browser.

## What Not To Use

| Avoid | Why |
|-------|-----|
| Backend service or database | The source data is public and small enough for static generated artifacts. A backend adds hosting, auth, observability, and failure modes without solving the core user problem. |
| Browser-side crawling of registries | CORS, latency, rate limits, and third-party downtime would make the app unreliable. It also exposes validation failures to users instead of CI. |
| Full frontend framework migration | The existing vanilla TypeScript architecture already has pure core functions and static renderers. Sync and command generation do not require React/Next/Astro. |
| Search service | The target scale is hundreds of registries/components. Precomputed search fields and in-memory filtering are enough for v1. |
| `axios` or large utility libraries | Node and browsers provide `fetch`, `URL`, `URLPattern`-adjacent parsing needs, sets/maps, and structured JSON handling. |
| Treating shadcn CLI output as the only parser | CLI behavior is user-facing and may be interactive or text-oriented. Use official JSON endpoints and schemas for deterministic data generation. |
| Hard-coding `198` as a permanent invariant | The verified count is useful for today's sync check, but the directory will change. Store it in a generated manifest and report diffs. |

## Risks

| Risk | Impact | Mitigation | Confidence |
|------|--------|------------|------------|
| Third-party registry indexes are inconsistent or unavailable | Component-first inventory may be incomplete | Track discovery status per registry and keep registry-level browsing intact | MEDIUM |
| Official directory fields change | Sync script may fail or silently drop data | Validate against a local expected shape and fail with a clear upstream schema-change message | HIGH |
| Generated data grows the bundle | Initial JS payload and search cost increase | Import JSON separately, precompute search text, and keep UI filtering pure and memoizable | MEDIUM |
| Unsafe URL or command text enters the UI | XSS or unsafe copy command risk | Validate protocols, escape attribute/text contexts, and keep command generation whitelist-based | HIGH |
| Toolchain drift in WSL/Windows | Contributors cannot reproduce CI | Pin `packageManager`, use Corepack/pnpm consistently, and document Linux Node path expectations | HIGH |

## Roadmap Implications

1. **Foundation phase:** Add Vitest dependency/script, package manager pinning, and data validation. This resolves existing test/tooling gaps before generated data arrives.
2. **Mirror phase:** Add `sync:directory`, generated directory JSON, manifest diffing, and official-source provenance.
3. **Discovery phase:** Add bounded registry index probing, component inventory extraction, and per-registry discovery status.
4. **Action phase:** Add pure command generation, copy buttons, source links, and batch queue UI using generated data.
5. **Hardening phase:** Add CI scheduled PR refresh, URL/rendering safety cleanup, and optional DOM tests for copy/queue behavior.

## Source Notes

- Official directory endpoint: `https://ui.shadcn.com/r/registries.json` (direct fetch on 2026-05-25 returned 198 entries).
- Official source directory: `https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/directory.json` (direct fetch on 2026-05-25 returned 198 entries).
- Official registry schemas: `https://ui.shadcn.com/schema/registry.json` and `https://ui.shadcn.com/schema/registry-item.json` (direct fetch on 2026-05-25 returned JSON Schema documents).
- Current npm versions verified on 2026-05-25: `shadcn@4.8.0`, `vite@8.0.14`, `typescript@6.0.3`, `vitest@4.1.7`, `ajv@8.20.0`, `pnpm@11.3.0`, `p-limit@7.3.0`, `prettier@3.8.3`, `jsdom@29.1.1`.
- Existing local stack source: `.planning/codebase/STACK.md` reports Vite 7.2.7, TypeScript 5.9.3, pnpm 9 CI, missing Vitest dependency/script, and GitHub Pages deployment.
- Documentation lookup note: Context7 MCP tools were not available in this session. The CLI fallback was attempted, but the workspace PATH resolved Windows `npx` in WSL and failed with `ERR_INVALID_URL`; official docs/endpoints and npm metadata were used instead.

# Phase 2: Official Mirror & Data Pipeline - Pattern Map

**Mapped:** 2026-05-25
**Files analyzed:** Phase 1 plans/summaries, current registry source, core grouping, shell bootstrap, tests, package scripts, docs.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `scripts/sync-shadcn-registries.mjs` | script | file-I/O + network | `package.json` scripts and existing source data | role-match |
| `scripts/validate-registry-data.mjs` | script | file-I/O + validation | `tests/registry-explorer/registryData.test.ts` | role-match |
| `data/shadcn/registries.raw.json` | generated data | file-I/O | `src/registry-explorer/data/registries.data.ts` | generated replacement input |
| `data/shadcn/sync-report.json` | generated report | file-I/O | Phase summary frontmatter/report style | role-match |
| `public/data/registries.json` | runtime data | request-response | `public/styles/registry-explorer.css` static public asset | role-match |
| `src/registry-explorer/core/registry.schema.ts` | model | transform | exact | exact |
| `src/registry-explorer/core/registryMirror.ts` | utility/model | transform | `src/registry-explorer/core/grouping.ts` | role-match |
| `src/registry-explorer/data/loadRegistries.ts` | loader | request-response | `src/registry-explorer/entry.ts` | role-match |
| `src/registry-explorer/entry.ts` | controller | request-response | exact | exact |
| `src/registry-explorer/ui/shell.ts` | controller | event-driven/render | exact | exact |
| `src/registry-explorer/ui/focusView.ts` | component | render | exact | exact |
| `tests/registry-explorer/registryMirror.test.ts` | test | transform | `tests/registry-explorer/grouping.test.ts` | role-match |
| `tests/registry-explorer/registryData.test.ts` | test | transform | exact | modify |
| `docs/registry-explorer-data.md` | docs | file-I/O | exact | exact |
| `package.json` | config | batch | exact | exact |

## Existing Patterns To Reuse

### Tests

Use Vitest imports and direct assertions under `tests/registry-explorer/`:

```typescript
import { describe, it, expect } from 'vitest';
```

Tests should prefer pure functions and fixture objects, as in `grouping.test.ts` and `registryData.test.ts`.

### Source Organization

- Keep transformation logic under `src/registry-explorer/core/`.
- Keep app bootstrap in `src/registry-explorer/entry.ts`.
- Keep UI rendering in `src/registry-explorer/ui/`.
- Keep static browser assets under `public/`.
- Keep generated non-browser review artifacts outside `public/`.

### Runtime Rendering

`shell.ts` currently accepts `registries` synchronously through `initRegistryExplorer({ registries, roots })`. Phase 2 should either:

- Load data before calling `initRegistryExplorer`, then pass `registries`, `mirrorMeta`, and warnings; or
- Extend `initRegistryExplorer` with explicit loading/error state inputs.

Do not bypass Phase 1 safety helpers. External links should continue through `renderExternalLink` or a conscious extension of that helper.

### Package Scripts

Add scripts beside the current script block:

- `sync:registries`
- `validate:data`

Update `verify` to include `pnpm validate:data` after the validator and fixture data are present.

### WSL Tooling

Use:

```bash
PATH=/tmp/registry-atlas-bin:$PATH pnpm verify
```

when PATH-resolved `pnpm` points to a Windows shim in WSL.

## Planner Instructions

- Do not add React, Tailwind, shadcn components, a backend, a database, or scheduled automation in Phase 2.
- Do not delete the current TypeScript data module until the runtime JSON path has tests and app loading behavior.
- Preserve the leading `@` namespace as canonical.
- Treat `http:` official fields as policy warnings or allowed transport values, not as proof of malicious data.
- Keep generated raw data and sync report reviewable in source control unless a plan explicitly chooses otherwise and updates docs.

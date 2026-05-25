# Registry Explorer Data Maintenance

Registry Atlas mirrors the official shadcn registry directory and layers local Atlas enrichment on top of it. The runtime catalog is generated JSON, not a hand-maintained TypeScript array.

## Generated Artifacts

Run `pnpm sync:registries` to refresh the generated mirror from `https://ui.shadcn.com/r/registries.json`.

The sync command writes three reviewable artifacts:

- `data/shadcn/registries.raw.json` - Raw upstream registry array from the official shadcn directory.
- `data/shadcn/sync-report.json` - Maintainer report with source URL, sync timestamp, counts, and added/removed/changed deltas.
- `public/data/registries.json` - Normalized runtime data fetched by the browser app.

The browser loads `public/data/registries.json` through `src/registry-explorer/data/loadRegistries.ts`.

## Field Provenance

Each runtime record separates official source facts from Registry Atlas enrichment:

- `official.name` - Canonical shadcn namespace such as `@8bitcn`.
- `official.homepage` - Homepage from the official shadcn directory.
- `official.registry_url_template` - Registry item URL template from the official shadcn directory.
- `official.description` - Description from the official shadcn directory.
- `atlas.primary_focus` - Registry Atlas focus grouping.
- `atlas.component_tags` - Registry Atlas component coverage tags.
- `atlas.aliases`, `atlas.coverage_status`, `atlas.confidence`, and `atlas.notes` - Local enrichment and review context.
- `status.warnings` - Local status notes that should be shown neutrally when present.

Official fields should stay aligned with shadcn. Atlas fields are local enrichment and may be empty for newly discovered registries until reviewed.

## Validation

Run `pnpm validate:data` after syncing. Validation reads local artifacts only; it does not fetch the network.

Validation fails on:

- Missing, duplicate, malformed, or de-prefixed namespaces.
- Missing or malformed homepage fields.
- Missing or malformed registry URL templates.
- Registry URL templates without `{name}`.
- Scriptable, data, malformed, protocol-relative, or otherwise policy-disallowed URLs.
- Atlas enrichment values outside `PRIMARY_FOCUS_VALUES` and `COMPONENT_TAG_VALUES`.
- Count mismatches between raw, normalized, and metadata counts.

Validation warns on official HTTP fields under the current policy. Valid official links and copyable commands should not be labeled unsafe without a concrete security advisory, malformed value, unsupported protocol, missing namespace, missing item slug, or other explicit status reason.

## Maintainer Workflow

Use this sequence when refreshing official registry data:

```bash
pnpm sync:registries
pnpm validate:data
pnpm verify
```

Review these before committing regenerated data:

- `data/shadcn/sync-report.json` for count and delta changes.
- `public/data/registries.json` for normalized `official`, `atlas`, and `status` fields.
- `pnpm validate:data` output for errors and warnings.

`pnpm verify` runs type-checking, test type-checking, tests, data validation, and the production build. It intentionally does not run `pnpm sync:registries`; refreshes should remain explicit and reviewable.

## Controlled Vocabularies

Atlas enrichment uses controlled vocabularies from `src/registry-explorer/core/registry.schema.ts`:

- `PRIMARY_FOCUS_VALUES`
- `COMPONENT_TAG_VALUES`

When adding a new Atlas focus or component tag:

1. Update `src/registry-explorer/core/registry.schema.ts`.
2. Update `src/registry-explorer/core/labels.ts` if a custom label is needed.
3. Update relevant tests in `tests/registry-explorer/`.
4. Run `pnpm validate:data` and `pnpm verify`.

## Legacy Seed Data

`src/registry-explorer/data/registries.data.ts` is no longer the primary runtime catalog. It remains useful as a local enrichment seed for sync tooling until all Atlas enrichment moves to a dedicated generated or editable source.

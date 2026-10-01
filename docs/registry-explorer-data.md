# Registry Explorer Data Maintenance

Registry Atlas mirrors the official shadcn registry directory and layers local Atlas enrichment on top of it. The runtime catalog is generated JSON, not a hand-maintained TypeScript array.

## Generated Artifacts

Run `mise run sync:registries` to refresh the generated mirror from `https://ui.shadcn.com/r/registries.json`. The equivalent package script is `pnpm sync:registries`.

The sync command writes the official mirror plus catalog evidence:

- `data/shadcn/registries.raw.json` - Raw upstream registry array from the official shadcn directory.
- `data/shadcn/sync-report.json` - Maintainer report with source URL, sync timestamp, counts, and added/removed/changed deltas.
- `data/shadcn/registry-catalog-evidence.json` - Per-registry catalog counts, derived reviewed taxonomy evidence, freshness state, and source URL.
- `data/shadcn/registry-catalog-evidence-report.json` - Catalog fetch/failure report, including discoverable item counts.
- `public/data/registries.json` - Normalized registry runtime data.
- `public/data/registry-catalog-items.json` - Compact open-vocabulary catalog index used for item-name discovery.

The browser loads both public runtime files through `src/registry-explorer/data/loadRegistries.ts`. The compact index contains item identity facts only: name, registry item type, optional title, and optional upstream categories. Full item detail remains fetched from the registry item route when requested.

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
mise run sync:registries
mise run validate:data
mise run verify
```

Review these before committing regenerated data:

- `data/shadcn/sync-report.json` for directory count and delta changes.
- `data/shadcn/registry-catalog-evidence-report.json` for fetched, stale, failed, and discoverable-item counts.
- `public/data/registry-catalog-items.json` for compact-index size and namespace coverage.
- `public/data/registries.json` for normalized `official`, `atlas`, and `status` fields.
- validation output for errors and warnings.

`mise run verify` runs source type-checking, test type-checking, tests, data validation, and the production build. It intentionally does not refresh registry data; refreshes remain explicit and reviewable.

## Controlled Vocabularies and Open Catalog Identities

Atlas enrichment still uses controlled vocabularies from `src/registry-explorer/core/registry.schema.ts`:

- `PRIMARY_FOCUS_VALUES`
- `COMPONENT_TAG_VALUES`

Those vocabularies support curated grouping and aliases; they are no longer a gate on whether a real upstream item can be discovered. Open-vocabulary names come from `public/data/registry-catalog-items.json`. Reviewed rich summaries remain authoritative when a compact index entry has the same namespace and slug.

Only user-facing registry item types enter the compact discovery index: `registry:block`, `registry:component`, `registry:ui`, `registry:page`, and `registry:item`. Other registry records remain available from their upstream sources but are not primary component-search results.

If a catalog refresh fails for a namespace, sync preserves its previous compact entries and marks its catalog evidence stale. A successful refresh replaces that namespace's prior compact entries.

When adding a new Atlas focus or curated component tag:

1. Update `src/registry-explorer/core/registry.schema.ts`.
2. Update `src/registry-explorer/core/labels.ts` if a custom label is needed.
3. Update relevant tests in `tests/registry-explorer/`.
4. Run `mise run validate:data` and `mise run verify`.

## Opt-in Official Item Recovery

When a registry catalog cannot be indexed, use the official directory's item URL template to verify a **specific known namespace and slug** before considering browser research. The bounded command below is read-only by default:

```bash
mise exec -- node scripts/recover-item-evidence.mjs @8bitcn/button
```

The result is either `verified` (matched official HTTPS URL, JSON item name/type, and safe metadata fields) or `unresolved` with a reason. It never executes third-party code or follows redirects. For example, `@blockus/button` currently returns `http-or-redirect-308`: its configured item route redirects to a generic homepage, which is **not** proof of an item. Source-code contents are not copied into summaries. Docs URLs, preview URLs, imports, required props, and working renders remain unresolved unless independently verified.

Only after reviewing individual verified results may a maintainer explicitly opt into writing enriched item summaries:

```bash
mise exec -- node scripts/recover-item-evidence.mjs @8bitcn/button --apply
mise run sync:registries
mise run validate:data
mise run verify
```

`--apply` edits the curated `data/shadcn/registry-items.json`; the ordinary sync then regenerates runtime artifacts. Do not use `--apply` to promote unresolved cases or model-selected guesses, and review any unrelated generated-data differences before committing. A generated install command is informational and has **not** been executed or verified.

## Legacy Seed Data

`src/registry-explorer/data/registries.data.ts` is no longer the primary runtime catalog. It remains useful as a local enrichment seed for sync tooling until all Atlas enrichment moves to a dedicated generated or editable source.

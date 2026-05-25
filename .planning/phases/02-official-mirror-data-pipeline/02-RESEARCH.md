# Phase 2: Official Mirror & Data Pipeline - Research

**Researched:** 2026-05-25
**Status:** Ready for planning

## Executive Summary

Phase 2 should use a small, explicit data pipeline: fetch the official directory JSON, write raw source data, normalize it into a static runtime JSON artifact, write a human-readable sync report, and run validation as a separate maintainer command. This preserves the user's requested "always write, validate separately" workflow while still making acceptance and release decisions strict.

The official endpoint was checked live on 2026-05-25. `https://ui.shadcn.com/r/registries.json` returns an array of 198 records. Each sampled/inspected record uses the keys `name`, `homepage`, `url`, and `description`; names are already namespace-prefixed with `@`. The local hand-maintained dataset currently has 85 records, so Phase 2 is a real migration, not a minor refresh.

## Current Upstream Shape

Live endpoint facts from 2026-05-25:

- Source URL: `https://ui.shadcn.com/r/registries.json`
- Top-level shape: JSON array
- Count: 198 records
- Keys: `name`, `homepage`, `url`, `description`
- First record: `@8bitcn`, homepage `https://www.8bitcn.com`, registry URL template `https://www.8bitcn.com/r/{name}.json`
- Namespace status: all inspected by script have leading `@`
- Protocol note: most fields are HTTPS, but the current official dataset includes `http:` fields for `@shadcn-map` registry URL and `@wandry-ui` homepage. Validation must account for this deliberately instead of assuming HTTPS-only.

## Recommended Artifact Layout

Use three artifact classes:

| Artifact | Suggested path | Purpose |
|----------|----------------|---------|
| Raw upstream JSON | `data/shadcn/registries.raw.json` | Exact fetched official source for review and diffing. |
| Sync report | `data/shadcn/sync-report.json` and/or `.md` | Maintainer review surface with counts and deltas. |
| Runtime normalized JSON | `public/data/registries.json` | Static app-consumed data loaded by the browser. |

The runtime artifact should include metadata and records:

- `meta.source_url`
- `meta.synced_at`
- `meta.upstream_count`
- `meta.registry_count`
- `meta.validation_status` or report reference
- `registries[]`

Per registry, keep official facts and enrichment distinct:

- `official.name`
- `official.homepage`
- `official.registry_url_template`
- `official.description`
- `atlas.focus`
- `atlas.component_tags`
- `atlas.aliases`
- `atlas.coverage_status`
- `atlas.confidence`
- `atlas.notes`
- `status.warnings`

This satisfies the inline-enrichment decision without blurring provenance.

## Sync Strategy

The sync script should:

1. Fetch the official endpoint.
2. Parse it as an array.
3. Read existing normalized runtime data if it exists.
4. Preserve inline `atlas` enrichment for matching official `name` namespaces.
5. Generate neutral default enrichment for new registries.
6. Write raw upstream JSON.
7. Write normalized runtime JSON.
8. Write a sync report comparing previous normalized records to the new official set.

Because the user chose "always write, validate separately," the script should not refuse to write normalized output when fields are malformed. It should record warnings and leave validation to a separate command.

## Validation Strategy

Validation should be a Node script and a package script, not a browser-only check. It should validate:

- Upstream raw JSON is valid JSON and an array.
- Normalized runtime JSON matches the expected shape.
- Namespaces are present, unique, and keep the leading `@`.
- Duplicate namespaces fail validation.
- Homepage and registry URL template fields are present and parseable.
- URL/template protocols are from the accepted policy. Since official data currently includes HTTP, the plan should either allow `http:` with warnings or fail with a clear conscious policy decision. Do not describe valid official HTTP fields as malicious.
- Registry URL templates contain a supported item placeholder such as `{name}`.
- Local enrichment fields use controlled vocabulary values from `PRIMARY_FOCUS_VALUES` and `COMPONENT_TAG_VALUES`.
- Counts in metadata and record arrays agree.

Recommended scripts:

- `pnpm sync:registries`
- `pnpm validate:data`
- `pnpm verify` should include `pnpm validate:data` once the validator is in place.

## Runtime Loading Strategy

The browser should fetch the normalized JSON from a Vite-safe static URL, likely `${import.meta.env.BASE_URL}data/registries.json`, so GitHub Pages base paths work.

Add a loader module that:

- Fetches the runtime JSON.
- Performs lightweight runtime shape checks.
- Converts normalized records into the existing core `Registry` shape or evolves the core schema to accept the normalized shape directly.
- Preserves visible warning/status information for the UI.
- Falls back to a clear data-load error state if the JSON cannot be fetched or parsed.

Because Phase 2 should not implement Phase 3 component item discovery, unknown or empty enrichment should produce neutral browse/search behavior, not false "component unavailable" conclusions.

## Planning Implications

- Plan sync and validation before browser runtime loading so the app has an artifact to consume.
- Keep the current `src/registry-explorer/core/grouping.ts` pure, but adjust it if the normalized record shape changes.
- Add focused tests for normalization, validation, and runtime loading. Avoid browser E2E unless a later phase needs it.
- Update `docs/registry-explorer-data.md` from hand-editing guidance to generated artifact guidance.
- Do not add a backend, database, scheduled automation, or package-manager command variants in Phase 2.

## Risks

| Risk | Mitigation |
|------|------------|
| Official endpoint shape changes | Raw artifact plus validation errors make changes inspectable. |
| Inline enrichment is overwritten | Sync must preserve `atlas` enrichment from previous normalized records. |
| HTTP fields conflict with HTTPS-only assumptions | Validation policy must explicitly allow/warn or block with clear wording; renderer should avoid scare-copy for official records. |
| Runtime fetch breaks GitHub Pages base path | Use `import.meta.env.BASE_URL` and test loader URL construction. |
| Users misread inferred tags as official coverage | Keep `atlas` fields and coverage status visibly distinct from official facts. |

## Source Audit

SOURCE | Finding | Planning Impact
--- | --- | ---
Official endpoint | 198 records, array shape, keys `name`, `homepage`, `url`, `description` | Sync and normalized schema should target this shape.
Official docs page | CLI add pattern is `npx shadcn add @<registry>/<component>` and community code review warning is present | Keep provenance/status language neutral; install commands remain later phase.
Local data | `src/registry-explorer/data/registries.data.ts` has 85 records | Plan migration and count display.
Phase 1 | Safe rendering helper and tests exist | Phase 2 can load broader official metadata into existing safe renderers.

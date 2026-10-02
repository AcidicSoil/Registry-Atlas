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

## Browser-verified component link audit (in progress)

The mandatory, all-registry URL-repair requirement is defined in System One Decision Lab at `docs/specs/2026-10-01-registry-atlas-browser-decisions.md`. The current Atlas command establishes a **complete identity/URL inventory** and a review-gated way to correct **existing curated item-page links**. It does **not** itself crawl all sites, discover missing pages, or certify the full requirement.

```sh
# Read-only: inspect counts, no file changes.
mise exec -- node scripts/audit-component-links.mjs
# Optional full row-by-row ledger; writes a new file and refuses overwrites.
mise exec -- node scripts/audit-component-links.mjs --report /tmp/atlas-component-links-inventory.json
# After independently browsing and capturing a source page, review an evidence manifest:
mise exec -- node scripts/audit-component-links.mjs --evidence /tmp/atlas-links-reviewed.json --report /tmp/atlas-link-proposals.json
# Only after reviewing every proposed URL, page identity, screenshot and original value:
mise exec -- node scripts/audit-component-links.mjs --evidence /tmp/atlas-links-reviewed.json --apply --reviewed
```

Evidence manifest schema: `registry-atlas-component-link-evidence/v1` with `records[]` containing exact `namespace`, `slug`, `previousUrl` (including `null` for absent docs), `verifiedUrl`, optional observed `routePattern` and `exception`, and `browser` with `homepageUrl`, `listingUrl`, `observedUrl`, `observedSlug`, `renderedHeading`, `checkedAt` and the local `capturePath`. Collect these observations through the managed PinchTab profile, not from HTTP success, an untested template, a generic redirect or a model prediction. An evidence manifest **is a reviewer assertion**, not independent proof: inspect the actual page and capture before using `--reviewed`.

The script keeps a per-registry identity ledger, counts duplicate catalog entries separately, checks exact namespace/slug and prior URL, rejects malformed/non-public destinations, generic homepage substitutions, browser URL/slug mismatches, duplicate evidence, and absent curated records; it refuses partial `--apply` if any proposed record is unresolved. It checks that each referenced capture file exists on apply, but cannot inspect its pixels itself. Verified item URLs, the observed listing, optional pattern and exception are carried into a saved report. `--apply` changes only `data/shadcn/registry-items.json`; it does not independently regenerate Atlas runtime data. Regenerate and review derived outputs with the normal `sync:registries` pipeline **only after protecting unrelated dirty generated files**, then use the `registry-atlas` managed tab to click the actual Atlas item-page action and independently re-check the final URL and rendered identity. Do not equate a locally updated curated record with a verified Atlas UI link.

On the October 1 local snapshot, the inventory contains **408 supported registries, 84,153 compact catalog entries (including 20 duplicate entries by namespace/name), 84,145 distinct indexed-or-curated identities, 28 explicit curated documentation links, and 30 explicit curated raw-item links**. Those counts are inventory statistics, **not audited or repaired coverage**. Most compact items lack explicit documentation-page URLs; the code is not permitted to invent them. The inherited ten dirty Atlas generated/curated files must not be silently committed or overwritten during regeneration.

**First reviewed registry slice — `@8bitcn` (partial).** The managed `design-ui-ux` browser opened `https://www.8bitcn.com/`, followed its official [Components listing](https://www.8bitcn.com/docs/components), and opened the actual [Button](https://www.8bitcn.com/docs/components/button), [Card](https://www.8bitcn.com/docs/components/card) and [Input](https://www.8bitcn.com/docs/components/input) pages. Each rendered the matching heading and installation/usage sections; the three paired browser captures are saved as `docs/evidence/component-links/8bitcn-{button,card,input}.jpg`. The witnessed item URL pattern is `https://www.8bitcn.com/docs/components/{slug}` for **these three slugs only**; the remaining **118 of 121** indexed 8bitcn items and every other registry remain unverified.

For all three, the reviewer-gated `audit-component-links.mjs` flow added the browser-confirmed `docs_url` to the authoritative curated records, projected those values into the existing runtime file without re-fetching or overwriting other registries, and verified the real Registry Atlas **Open component page** action by clicking it in the managed `registry-atlas` profile. Each click opened the official matching Button, Card or Input page, with a matching rendered component identity and no console errors. The source and runtime link additions are scoped in commit `9101c23`; no unrelated inherited dirty data was staged.

The official structured item endpoints `https://www.8bitcn.com/r/card.json` and `https://www.8bitcn.com/r/input.json` independently passed item-name/type verification. Their installation tokens, declared registry dependencies and file paths were recovered into curated and runtime summaries in commit `79be184`, without installing packages or running the upstream components. The durable, **partial** per-registry URL pattern and observed item evidence are recorded in `data/shadcn/registry-component-url-patterns.json`. Source page screenshots are visual evidence only: usage source snippets, required props, locally executed rendering, and all remaining component/registry links have **not** been verified or collected by this step.

## Functional component previews: reference routes and implementation boundary

The product requirement is a **real, usable component in each supported catalog card and again on the detail page**, not an image of a component. Static screenshots, image URLs, metadata-only specimens, and links to the source page do not fulfill a functional preview. If a component cannot be executed safely or its demo/framework/dependencies are unavailable, report an explicit `unsupported` or `unverified` runtime state without inventing a working preview.

Source reconnaissance (2026-10-01), using the official [Magic UI homepage](https://magicui.design/), [component catalog](https://magicui.design/docs/components), [Magic Card page](https://magicui.design/docs/components/magic-card), [Animated Beam page](https://magicui.design/docs/components/animated-beam) and official item JSON endpoints:

- `https://magicui.design/components` redirects to `/docs/components`; individual documentation routes use `/docs/components/{component-slug}` for the observed Magic Card and Animated Beam pages. Preserve observed exceptions rather than extrapolating this route to every registry.
- Magic UI's installable `/r/magic-card` URL resolves to `/r/magic-card.json`; `/r/animated-beam` resolves to `/r/animated-beam.json`. These endpoints return `registry:ui` JSON with TSX file contents and dependencies, **not** the documentation demo page.
- The Magic Card documentation demonstrates a real form wrapped by the `MagicCard` component, with Preview/Code controls, an installation command, usage, props and an alternative example. The raw component declares `motion` and `next-themes`; the *demo* also composes Card, Input, Label and Button. Animated Beam's docs contain multiple demo variants. An item JSON file alone is insufficient to reproduce those examples.
- The website's published HTML and endpoints were inspected and their routes checked; the managed browser could not allocate an additional tab under resource pressure. Live interaction with its hover/form/animation controls was **not** independently browser-verified here.

A correct Atlas renderer must associate a registry item with a versioned, reviewed **demo fixture**, declared framework and dependencies, required styles/assets and lifecycle, alongside the separate canonical documentation and raw-item URLs. Run untrusted third-party components only through a constrained, isolated preview runtime (not arbitrary JSX/eval in the Atlas app's own origin); use a separate sandbox for unsupported frameworks and a clear fail-closed status. Render the same verified demo identity in the card and detail route, exercise its actual controls in the managed browser, and test the card-to-detail transition, runtime errors and source provenance. Preserve and isolate concurrent frontend changes before implementation. The currently edited frontend uses image `previewUrl` rendering in both views and has no React/ReactDOM runtime: that approach **does not satisfy** the live-component requirement.

## Legacy Seed Data

`src/registry-explorer/data/registries.data.ts` is no longer the primary runtime catalog. It remains useful as a local enrichment seed for sync tooling until all Atlas enrichment moves to a dedicated generated or editable source.

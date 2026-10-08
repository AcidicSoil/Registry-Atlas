# Registry Explorer Data Maintenance

Registry Atlas mirrors the official shadcn registry directory and reachable registry catalogs into SQLite. Do not hand-edit browser runtime projections or recreate the retired JSON data stores.

## Canonical data stores

Registry Atlas has two authoritative databases:

- `data/registry-atlas.sqlite` stores the official registry directory, normalized runtime registry records, compact catalog identities, catalog evidence, exact source-page evidence, route-pattern verification, canonical taxonomy documents, reviewed classifications, curated item summaries, and operational reports.
- `data/registry-details.sqlite` stores normalized exact-item detail payloads for lazy detail loading.

The browser runtime is generated from those databases:

- `public/data/registry-atlas.sqlite.gz`
- `public/data/registry-details.sqlite.gz`

Those compressed files are build outputs. `pnpm prepare:runtime-db` regenerates them. `predev` and `prebuild` run that command automatically.

The browser loads the core runtime database through `src/registry-explorer/data/loadRegistries.ts`. Item detail routes load the detail database lazily through `src/registry-explorer/data/loadRegistryItemDetail.ts` and fall back to an official raw item route only when necessary.

## Core database contracts

Important core tables include:

- `atlas_raw_registries` — official registry-directory rows in upstream order.
- `atlas_registries` — normalized runtime registry rows.
- `atlas_catalog_namespaces` — every catalog namespace, including valid empty buckets.
- `atlas_catalog_items` — one compact catalog row per exact `namespace + name` identity.
- `atlas_item_summaries` — reviewed/curated summary records.
- `atlas_catalog_evidence` — per-registry catalog evidence and freshness.
- `atlas_source_pages` — exact identity-backed original-page URLs.
- `atlas_documents` — taxonomy, reviewed classification metadata, sync reports, and other named structured documents.
- `atlas_classifications`, `atlas_classification_runs`, `atlas_classification_batches`, and `atlas_classification_run_items` — reviewed canonical-classification workflow state.
- `sources`, `route_patterns`, `examples`, `item_routes`, and `pattern_checks` — registry source-page pattern verification.

The detail database uses `atlas_item_details`. It must not persist arbitrary third-party source-code contents.

## Taxonomy and item kinds

Canonical taxonomy is stored as the `catalog-taxonomy` document in `atlas_documents`. Supporting reviewed documents include:

- `catalog-kind-overrides`
- `catalog-access-rules`
- `catalog-gold-set`
- `catalog-promotion-review`
- `catalog-classification-evaluation`
- `catalog-classification-overlay`

Components, Blocks, Pages, Templates, Themes, and Icons are distinct product collections.

Structural item kinds come from explicit source facts and reviewed data. Do not collapse blocks or pages into components. Templates require explicit source category evidence (`template` or `templates`) or a reviewed promoted kind; a generic `registry:page` record is a Page, not automatically a Template.

Source categories/groups remain source evidence. They do not become canonical taxonomy nodes automatically.

## Exact identities and direct links

Every browse/detail result is grounded in an exact `namespace + item name` identity.

Keep these links separate when available:

- registry homepage;
- exact installable item JSON;
- exact reviewed or evidence-backed original component/page URL.

Do not infer documentation URLs from item slugs. A registry item JSON endpoint is not the same thing as a documentation page.

Cards, registry inventories, related-item lists, and detail pages should expose the direct item JSON URL when the registry URL template supports it. Original-page links are shown only when exact evidence exists.

## Refresh workflow

Refresh upstream registry and catalog data explicitly:

```bash
mise run import:catalog
mise run sync:registries
pnpm prepare:runtime-db
mise run validate:data
mise run verify
```

`mise run import:catalog` imports the reviewed catalog-enrichment source into `atlas_item_summaries` and records `catalog-import-report` in `atlas_documents`.

`mise run sync:registries` refreshes:

- official registry-directory rows;
- normalized runtime registry rows;
- compact catalog identities and catalog evidence;
- reviewed canonical classification projection;
- fresh exact-item details;
- sync/evidence report documents.

A failed catalog refresh preserves prior usable evidence according to the sync policy rather than inventing replacement facts.

## Validation

Run:

```bash
pnpm validate:data
pnpm check:product-contract
pnpm typecheck
pnpm typecheck:test
pnpm test
```

`pnpm validate:data` validates the database state without fetching the network. It checks registry mirror invariants, item-summary output, canonical runtime consistency, namespace/item metadata counts, duplicate identities, required database documents, and detail-database identity uniqueness.

`pnpm check:product-contract` also checks that the active frontend does not reintroduce retired preview systems, inferred taxonomy modules, fake component specimens, or JSON runtime dependencies.

Official HTTP fields may produce warnings under the current URL policy. Do not label a valid official link unsafe without a concrete reason.

## Source-page evidence

Run:

```bash
mise run source-pages
```

This reconciles current exact source-page evidence and route-pattern verification into `atlas_source_pages` and updates the `source-page-index-meta` document.

For a bounded verification batch:

```bash
mise run verify:component-pages
```

For registry-pattern verification:

```bash
mise run verify:registry-patterns
```

The optional JSON files written under `.instance/` are operator reports only. They are not canonical application data.

A generic HTTP success is not proof of item identity. Verification must preserve exact namespace, slug/name, destination URL, and rendered/source evidence.

## Official item recovery

When a known item is absent from normalized detail evidence, use the official registry URL template to verify that exact item:

```bash
mise exec -- node scripts/recover-item-evidence.mjs @8bitcn/button
```

The command is read-only by default. It returns verified metadata or an unresolved reason. It does not execute third-party code.

After reviewing a verified result, an explicit `--apply` writes curated summary state directly to `data/registry-atlas.sqlite`:

```bash
mise exec -- node scripts/recover-item-evidence.mjs @8bitcn/button --apply
mise run sync:registries
mise run validate:data
```

Do not promote unresolved/model-guessed results.

## Browser-verified link audit

`scripts/audit-component-links.mjs` and `scripts/crawl-component-links.mjs` use managed-browser evidence to review exact original-page links.

The ordinary audit is read-only. Optional JSON ledgers/reports are evidence handoffs, not data stores. An explicit reviewed apply updates SQLite only after source identity and prior state still match.

Use the managed PPM/Webcmd/PinchTab browser path for rendered-page evidence. Do not equate a guessed route, HTTP 200, screenshot filename, or model selection with verified item identity.

## Runtime preview policy

The retired local component-demo, generated screenshot-preview, and source-sandbox systems are not part of the active runtime. Registry favicon images and source-backed theme swatches are ordinary metadata/identity visuals; they are not component previews.

Do not reintroduce fake preview placeholders, locally fabricated component specimens, or arbitrary third-party code execution into catalog cards or item details.

## Release check

Before release or deployment changes:

1. Refresh data only when an upstream refresh is intended.
2. Run `pnpm prepare:runtime-db`.
3. Run `mise run validate:data`.
4. Run `mise run verify`.
5. Run the managed browser acceptance matrix with `mise run browser:acceptance`.
6. Review the final Git diff and database invariants before committing.

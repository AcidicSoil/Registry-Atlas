# Registry Atlas — Remaining Work

Updated: 2026-10-08

This list tracks the remaining work in the active `feat/clef-identity-decision` worktree after the SQLite migration and current frontend/exemplar pass.

## P0 — Finish card deeplink behavior across every route and view

- [x] Shared browse item cards expose an explicit Atlas item deeplink (`View component/block/page/template/theme/icon`).
- [x] Verified upstream item/component/page routes render separately as `Source ↗`.
- [x] Raw registry JSON is removed from browse-card actions and remains detail/inspection-only.
- [x] Browse-card source resolution consumes canonical SQLite route/item metadata rather than restoring runtime JSON artifacts.
- [ ] Browser-audit Home, Explore, Components, Blocks, Pages, Templates, Themes, Icons, registry profiles, related-item cards, and comparison cells for the same link contract.
- [ ] Audit upstream source-link coverage by route and by registry after the resolver is complete.

## P0 — Finish 21st.dev exemplar layout/functionality parity

- [ ] Continue the visual comparison against the 21st.dev Libraries exemplar in the existing Registry Atlas PPM profile.
- [ ] Match the desktop shell structure and behavior: global top bar, collection/context row, search strip, Grid/List strip, independent sidebar scrolling, section labels, row height, active-row treatment, counts, icons, and content offsets.
- [ ] Remove remaining route-specific drift in search/filter/sort placement.
- [ ] Keep only conventional browse controls. Do not reintroduce checkbox/radio/select filter walls or invented sorting modes.
- [ ] Audit spacing, overflow, truncation, sticky/fixed regions, and narrow-width behavior on every primary route.
- [ ] Verify the same shell behavior on registry-profile routes and item-list variants, not only Components.

## P0 — Audit route metadata and bad card titles

Initial SQLite audit result: **95 low-information display-title candidates**.

- **36 blocks** — all 36 are `@shadcnuikit` items `illustration1` … `illustration36` whose visible titles are only `1` … `36`. This is the highest-priority defect and is visible on `/blocks`.
- **48 icons** — mostly legitimate terse semantic icon names such as `x`, `tv`, `at`, and `h1`; do not blanket-expand these.
- **5 components** — mixed cases such as `2048`, `404`, `v0`, and `X`; review contextually because several are legitimate product/component names.
- **3 generic items** and **3 `ui` items** — review their source metadata because the visible labels are too generic to classify automatically.

Remaining work:

- [ ] Audit **every browse route/view** for cards whose visible title is not meaningful metadata.
- [ ] For `@shadcnuikit` illustration blocks, recover descriptive source-backed titles from existing registry metadata, source-page headings/metadata, sitemap/anchor evidence, or other durable evidence.
- [ ] Record each affected route, namespace, slug, item kind, current title source, and the better metadata source that should replace it.
- [ ] Fix the problem in the canonical ingestion/normalization/database layer. Do not patch individual cards in the renderer.
- [ ] Preserve the raw source slug/identifier separately for routing/install identity.
- [ ] Add validation/tests for numeric-only **block/page/template/theme** display titles, with explicit allowlisting when a numeric title is genuinely the product name.
- [ ] Keep terse icon identifiers valid by default; short icon names are not automatically metadata defects.
- [ ] Re-run the route audit for Components, Blocks, Pages, Templates, Themes, Icons, Home/Explore, registry profiles, and any mixed result surfaces.
- [ ] Specifically verify `/blocks` and the `@shadcnuikit` registry view no longer render bare numbered titles.

## P1 — Complete registry identity/icon coverage

- [ ] Finish registry-library icon coverage using Registry Atlas registry identity metadata.
- [ ] Use the 21st.dev Libraries treatment as the visual exemplar.
- [ ] Do not create screenshots of every route/page to manufacture icons.
- [ ] Keep a deterministic fallback only when a registry has no usable published icon/logo.
- [ ] Verify icon sizing/alignment in sidebar rows, cards, registry directory cards, and registry-profile headers.

## P1 — Complete SQLite-only data migration and cleanup

- [ ] Finish moving all remaining catalog/taxonomy/source-link/runtime data to the canonical SQLite databases.
- [ ] Ensure runtime generation reads from SQLite and emits only the required compact runtime database payloads.
- [ ] Remove obsolete JSON/public-data/generated-preview artifacts and dead loaders after their database equivalents are verified.
- [ ] Remove stale SQLite sidecars and superseded migration residue.
- [ ] Keep database schema ownership centralized in the Atlas database initializer.
- [ ] Re-run product-contract and data-validation checks after cleanup.

## P1 — Finish item-detail/prompt cleanup

- [ ] Finish the defensive-prompt wording/behavior audit for inspection/install-agent actions.
- [ ] Keep prompts grounded in actual registry/item metadata and current route context.
- [ ] Confirm removed fake preview/specimen UI cannot reappear from fallback branches.
- [ ] Keep raw JSON and low-level source inspection on detail surfaces only.

## P1 — Cross-route UI consistency audit

- [ ] Audit all primary routes for identical placement and behavior of shared search, sort, layout, and scope controls.
- [ ] Verify Grid/List state works on every browse route that supports it.
- [ ] Verify category/access/type rows are single-scope navigation rather than multi-select form walls.
- [ ] Check empty states, pagination, result counts, applied scope chips, and route persistence for consistency.
- [ ] Remove any remaining duplicated or route-local implementation that should use the shared shell/card primitives.

## P1 — Final browser acceptance and verification

- [ ] Use only the existing Registry Atlas PPM profile for Registry Atlas + exemplar comparison.
- [ ] Verify representative routes visually and through DOM assertions without screenshotting every page.
- [ ] Check console/runtime errors and overflow at desktop and narrow widths.
- [ ] Run the full repository verification gate: `pnpm verify`.
- [ ] Run `git diff --check` and inspect the complete final diff.
- [ ] Commit/push only coherent verified changes and leave the worktree clean.

## Deferred registry coverage work

- Investigate registries whose machine-readable catalogs fail, rate-limit, or use unsupported URL templates.
- Prefer direct registry/catalog APIs first. Use managed-browser research only when machine-readable sources cannot answer the question.
- Preserve stale last-known catalog evidence during transient failures; do not silently erase prior coverage.

## Domain-model research

- GitHub issue #3 remains a separate product/domain-model decision.
- Do not treat the earlier rejected prototypes as an implementation baseline.

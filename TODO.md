# Registry Atlas — Current Work

Verified against `main` and local read-only PostgreSQL on 2026-11-09.
Earlier SQLite and `feat/clef-identity-decision` tasks are historical; see Git history.

## P0 — Review canonical classification drift

- [ ] Review 432 changed classification inputs against current source evidence. Do **not** copy old input fingerprints or silently reapprove decisions.
- [ ] Determine whether 131 absent reviewed identities were removed, renamed, or superseded. Preserve their review history until resolved.
- [ ] Promote approved classifications through the existing reviewed-run workflow, then verify `pnpm check:product-contract` and `pnpm validate:data` pass.
- [x] Produce a read-only review queue: `node scripts/audits/report-classification-drift.mjs` writes `.instance/reviews/catalog-classification-drift.json`.

The latest report contains 26,603 reviewed entries: 26,040 match, 432 are stale, 131 have no current catalog identity. Existing review records are **not** automatically rewritten.

## P1 — Catalog metadata and frontend verification

- [ ] Recover accurate, source-backed display titles for 36 `@shadcnuikit` illustration blocks. Existing source titles are only `1`–`36`; changing titles must flow through canonical ingestion and trigger classification re-review.
- [ ] Audit low-information titles on other browse surfaces, exempting legitimately short icon names.
- [ ] Run and review desktop/mobile route, card link, filter, focus, keyboard, overflow, and source-link acceptance against a freshly built app.
- [ ] Complete the remaining component StyleX ownership migration; retain global CSS until rendered parity is independently demonstrated.
- [ ] Refactor the 2,221-line `ui/shell.ts` along verified ownership boundaries rather than splitting by line count alone.
- [ ] Audit registry logo quality/coverage across sidebar, directory cards, and registry profile headers.

## P1 — Release and external delivery

- [x] Make local catalog/detail snapshot publication generation-atomic and verify paired reads.
- [x] Restore three existing reviewed component preview captures and their browser test. This is a **three-item pilot**, not broad preview coverage.
- [ ] Configure a trusted publication environment with access to the private PostgreSQL export and generation retention; GitHub Actions currently runs source checks only.
- [ ] Run production release acceptance and confirm navigation, accessibility, asset integrity, and no console errors.
- [ ] Resolve the four existing official-directory HTTP-source warnings after verifying authoritative HTTPS endpoints.

## P2 — Architecture and workflows

- [ ] Finish reviewing the remaining operational scripts; preserve package, mise, and CI entrypoint paths.
- [ ] Run live System One integration tests with an authorized local endpoint. Unit tests alone do not establish model behavior.
- [ ] Finish PPM-owned design and standards certification when the separate PPM refactor stabilizes; do not fabricate review evidence.
- [ ] Extend authentic component-preview coverage only with reviewed source imagery and matching source identities.

## Current verification commands

```bash
node scripts/audits/report-classification-drift.mjs  # read-only DB; local report
pnpm check:postgres
pnpm check:runtime-data
pnpm check:product-contract  # currently fails on 432 stale fingerprints
pnpm validate:data           # currently fails on the same 432 entries
pnpm lint
pnpm test
pnpm build
pnpm exec e2e run tests/catalog-link-preview.e2e.ts tests/catalog-navigation.e2e.ts
```

Run `pnpm build` immediately before browser tests; the E2E runner uses `vite preview`. Do not automatically apply pending data review items or treat the old TODO checkboxes as current evidence.

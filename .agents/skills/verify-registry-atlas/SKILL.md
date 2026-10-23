---
name: verify-registry-atlas
description: Verify Registry Atlas, its static catalog browser, actual upstream component previews, item details, and setup cart with model-free e2e and a local PostgreSQL snapshot. Use before claiming Registry Atlas UI changes work, when debugging navigation or source links, and when bug bashing its flows.
---

# Verify Registry Atlas

## Read first

Read `.agents/skills/e2e/SKILL.md` and its topics `setup`, `running`, `writing-tests`, `mcp`, and `bug-bash` as needed. This skill owns Registry Atlas facts; e2e owns the driver. The app is a Vite + DOM TypeScript static web UI, **not** a React root. The config is `e2e.config.ts`; test glob `tests/**/*.e2e.ts`; target `registry-atlas-web`.

## Launch

From the repository root, run:

```sh
pnpm check:runtime-data
pnpm build
pnpm exec e2e run tests/smoke.e2e.ts --output .e2e/proof/doctor --trace on
```

The config launches `pnpm exec vite preview --host 127.0.0.1 --port {port} --strictPort` on a free loopback port after `pnpm build`, waits for `/Registry-Atlas/`, and stops **only that process**. A different `pnpm dev` already running on 5189 is the user's process and must not be killed. Run from an existing local snapshot: `public/data/registry-atlas.json.gz`, `public/data/registry-details.json.gz`, and `.instance/atlas-test-documents.json`. No account or remote database is needed for UI verification. If the snapshots are missing, do not silently call Neon or another provider. Ask for or prepare a known-good local export through the self-hosted database.

## Doctor

```sh
pnpm exec e2e list tests/smoke.e2e.ts
pnpm exec e2e run tests/smoke.e2e.ts --output .e2e/proof/doctor --trace on
```

Run `pnpm build` before Doctor, including the first test. List must print one selected test-target pair. Smoke must report exit 0, show `Catalog navigation`, `Search catalog`, and `Libraries`, and leave the trace under `.e2e/proof/doctor/results/`. A missing local artifact is a readiness blocker, not a UI bug. The catalog is large: the e2e config uses 20-second assertion and 90-second action timeouts. Do not lower these without recording browser-load and hydration timings. If a test fails, read `.e2e/proof/doctor/results/<test>/trace.md` and `.e2e/logs/vite.log` before changing locators or code.

## Drive

Scripted browser tests are **model-free**. Start with these files:

```sh
pnpm exec e2e run tests/catalog-navigation.e2e.ts
pnpm exec e2e run tests/catalog-link-preview.e2e.ts --trace on
pnpm exec e2e run tests/setup-cart.e2e.ts --trace on
```

For interactive work, use the `e2e mcp` server declared in `.mcp.json`: `open_session`, `observe`, then `locate` to validate a locator before editing a test. Use `getByRole` and accessible names. Typical anchors: `Libraries`, `Search catalog`, `Open source page on @logoforge`, `+ Add to setup`, `View setup`, `Review setup`. The static UI has no user credentials; test storage is in the isolated browser context's `localStorage`.

For an authenticated/manual browser comparison, use the dedicated PPM `registry-atlas` profile and its generated guide. Never adopt, restart, or close that managed profile as a side effect of e2e test execution.

## Evidence

Test proof includes the user action and the resulting visible state:

- `.e2e/report.json`: latest run verdict and test names.
- `.e2e/results/<test>/trace.md`: failure trace (or every trace with `--trace on`).
- `.e2e/proof/<name>/`: stable named evidence; run again with another output name to preserve it.
- `app.screenshot('<name>')`: named rendered screenshots saved with the test artifacts.
- `pnpm verify`: authoritative code, database, classification, schema, data-validation, and production build checks using private local PostgreSQL.

The preview test must show **pixels of the upstream item**, not the Registry Atlas card or a vendor marketing screenshot. Verify `img.naturalWidth > 0`, the verified media URL, the **Source ↗** link's original `href`, keyboard Escape, and navigation. A URL pattern or HTTP 200 alone does not prove the correct component was rendered. For setup, check the selected token in browser storage and the visible generated command; the UI performs no payment and no installation.

## Bug bash

The charters come from [features/README.md](features/README.md) and its linked feature pages. The app needs no sign-in; each isolated browser context starts with empty local storage. Keep `.e2e/bugbash/` untracked. For a model-based `e2e explore` pass, prepare an approved model and a separate `e2e.bugbash.config.ts`; **do not launch agents or run exploratory model calls without the user's approval**. A bug-bash finding is confirmed only when a deterministic `tests/bugbash/<slug>.e2e.ts` reproduces it with `ASSERTION_FAILED`. Until such a model and permission exist, charters are prepared but unexecuted, not passing.

## Cleanup

The e2e runner stops the isolated Vite preview process it started and retains evidence in `.e2e/`. It does not stop the user-owned port 5189 server or mutate PostgreSQL. A live MCP session is closed with `close_session`. Do not use `pkill` or delete .e2e proof after a failure. Browser-local setup drafts from a test stay confined to its fresh context.

## Helpers

Use `pnpm exec e2e` and the repository's existing verification scripts. No separate test-only backend or screenshot proxy is required. The source-of-truth architecture for remaining previews is `docs/architecture/component-visual-previews.md`. When a feature gains or changes a route, update its feature page and its test in the same change.

## Grouped category filters

Use [features/grouped-filter-navigation.md](features/grouped-filter-navigation.md) for the two-stage Navigation/Popups-style taxonomy browsing behavior. Run its deterministic unit and production-browser tests before changing the category sidebar. The root summary must **expand only**; nested subtype or explicit "All <family>" actions apply filters. Verify nested selection, URL restoration, keyboard Enter, and mobile disclosure. Do not replace the real canonical taxonomy with a static list copied from an exemplar.

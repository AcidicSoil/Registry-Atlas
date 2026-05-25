# Codebase Concerns

**Analysis Date:** 2026-05-25

## Tech Debt

**String-built DOM renderers:**
- Issue: The UI is rendered through template strings assigned to `innerHTML` across all view modules. Each module carries its own small `escapeHtml` helper, and the helpers only escape `&`, `<`, and `>`, leaving attribute contexts fragile when values contain quotes or unexpected URL schemes.
- Files: `src/registry-explorer/ui/focusView.ts`, `src/registry-explorer/ui/componentView.ts`, `src/registry-explorer/ui/matrixView.ts`
- Impact: Any future dynamic registry import, user-submitted registry data, or scraped source data can turn rendering into an XSS sink. Duplicated escaping also makes fixes easy to miss in one view.
- Fix approach: Add one shared DOM-safe rendering helper in `src/registry-explorer/ui/` or switch card/row generation to `document.createElement` plus `textContent` and explicit `HTMLAnchorElement.href` assignment. Use URL validation before rendering `Registry.url`.

**Schema vocabulary duplication:**
- Issue: `PrimaryFocus` and `ComponentTag` are duplicated as both type unions and parallel runtime arrays. Every vocabulary change requires editing both the union and `*_VALUES` constant.
- Files: `src/registry-explorer/core/registry.schema.ts`
- Impact: A missed edit creates compile-time/runtime drift. Tests only validate `MATRIX_COLUMNS` against `COMPONENT_TAG_VALUES`, not that the values arrays are canonical or complete.
- Fix approach: Define each vocabulary as a `const` array first and derive the type with `(typeof VALUES)[number]`. Keep `src/registry-explorer/core/labels.ts` as the single place for human labels.

**Static registry data has no ingestion or validation pipeline:**
- Issue: The dataset is a 791-line hand-maintained array with no automated checks for duplicate names, valid URLs, reachable links, required fields, stale links, or tag/focus distribution anomalies.
- Files: `src/registry-explorer/data/registries.data.ts`, `docs/registry-explorer-data.md`
- Impact: The explorer can silently ship bad links, duplicate entries, outdated descriptions, or inconsistent classifications. The data file grows as both source of truth and operational database.
- Fix approach: Add a data validation script under `scripts/` or `tests/registry-explorer/` that checks unique names, URL parsing, controlled vocabulary membership, optional link reachability, and minimum required metadata before build/deploy.

**Legacy standalone app is shipped beside the current app:**
- Issue: `public/index.legacy.html` contains an older inline JavaScript implementation with hard-coded `example.com` registry data and duplicate rendering logic. Vite copies it into `dist/index.legacy.html`.
- Files: `public/index.legacy.html`, `dist/index.legacy.html`
- Impact: Users can access a stale second application that disagrees with `src/registry-explorer/data/registries.data.ts`. Security and accessibility fixes in TypeScript views will not reach this page.
- Fix approach: Remove `public/index.legacy.html` if it is not a supported artifact, or move it into `docs/`/`.archived/` so it is not deployed.

**Unused starter files remain in source:**
- Issue: Vite starter files are present but unused by the Registry Atlas entry point.
- Files: `src/main.ts`, `src/counter.ts`, `src/style.css`, `src/typescript.svg`, `public/vite.svg`
- Impact: New contributors can follow the wrong entry point or edit dead code. `src/style.css` contains unrelated global button/body styling that does not apply to the app shell.
- Fix approach: Delete unused starter files and keep `index.html`, `public/styles/registry-explorer.css`, and `src/registry-explorer/entry.ts` as the visible app surface.

**Deployment configuration hard-codes repository casing:**
- Issue: `vite.config.ts` sets `base: '/Registry-Atlas/'` while `package.json.name` is `registry-atlas` and `README.md` links to `acidicsoil/registry-atlas`.
- Files: `vite.config.ts`, `package.json`, `README.md`, `docs/todo/00_verification-step.md`
- Impact: GitHub Pages asset paths are case-sensitive enough in practice to create 404 risk when the repository URL and configured base differ. The task document specifically says the base should derive from the package name.
- Fix approach: Align `base` with the deployed repository path. If the package name is authoritative, use `base: '/registry-atlas/'`; if the GitHub repository is intentionally cased, document that casing in `README.md` and deployment notes.

## Known Bugs

**Package test command is missing:**
- Symptoms: `npm test` exits with "Missing script: test" even though test files exist.
- Files: `package.json`, `tests/registry-explorer/grouping.test.ts`, `tests/registry-explorer/matrixColumns.test.ts`
- Trigger: Run `npm test` from the repository root.
- Workaround: None in the manifest. Add `vitest` to `devDependencies` and add a `"test": "vitest run"` script.

**Vitest tests are not installable from the current manifest:**
- Symptoms: Test files import `vitest`, but `package.json` does not list `vitest`; `node_modules/.bin` contains only `react-grab`, `tsc`, `tsserver`, and `vite`.
- Files: `package.json`, `tests/registry-explorer/grouping.test.ts`, `tests/registry-explorer/matrixColumns.test.ts`
- Trigger: Try to run `vitest` or `npm test` after installing from the current manifest.
- Workaround: Manually install `vitest` outside the committed manifest, then run `vitest run`.

**Tests are outside TypeScript project coverage:**
- Symptoms: `tsconfig.json` includes only `src`, so test files are not type-checked by `tsc`.
- Files: `tsconfig.json`, `tests/registry-explorer/grouping.test.ts`, `tests/registry-explorer/matrixColumns.test.ts`
- Trigger: Introduce a type error in `tests/`; `tsc --noEmit` will not report it.
- Workaround: Run a configured test runner with TypeScript support. Prefer adding `tsconfig.test.json` or expanding the project include once test dependencies exist.

**Legacy page uses root-relative assets outside the Vite base transform:**
- Symptoms: `public/index.legacy.html` links `/styles/registry-explorer.css` directly. Because it lives under `public/`, it is copied as-is and does not receive Vite's `base` rewrite.
- Files: `public/index.legacy.html`
- Trigger: Open `https://<user>.github.io/<repo>/index.legacy.html` after GitHub Pages deployment.
- Workaround: Open the primary `dist/index.html`, where Vite rewrites paths according to `vite.config.ts`.

## Security Considerations

**Registry URL values are rendered into anchors without protocol allow-listing:**
- Risk: A future data source can add `javascript:`, `data:`, or malformed URLs that become clickable links.
- Files: `src/registry-explorer/ui/focusView.ts`, `src/registry-explorer/ui/componentView.ts`, `src/registry-explorer/data/registries.data.ts`
- Current mitigation: Current data appears manually curated and mostly uses `https://` URLs; rendered anchors include `rel="noreferrer"`.
- Recommendations: Validate `Registry.url` with `new URL()` and allow only `https:` and selected `http:` development exceptions before rendering or during data validation.

**Error messages are injected into the DOM as HTML:**
- Risk: The render error fallback interpolates `error.message` directly into `innerHTML`.
- Files: `src/registry-explorer/ui/shell.ts`
- Current mitigation: Errors are expected to be internal runtime exceptions, not user-supplied strings.
- Recommendations: Render the error message with `textContent` or pass it through a shared escaping helper that handles both text and attribute contexts.

**No Content Security Policy is defined:**
- Risk: The app relies on local static assets and inline-free module code, but no CSP restricts script sources, object embedding, or navigation targets if a rendering bug is introduced.
- Files: `index.html`, `.github/workflows/deploy.yml`
- Current mitigation: The primary app has no external script dependencies and builds a static Vite bundle.
- Recommendations: Add a CSP meta tag in `index.html` or configure hosting headers where possible. Use `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'` as a starting point and adjust for deployed needs.

**Environment file exists and must stay out of generated documentation:**
- Risk: `.env.example` exists and may encourage future environment-variable additions; environment files are secret-sensitive even when examples are currently intended for documentation.
- Files: `.env.example`, `.gitignore`
- Current mitigation: Only file existence was inspected; contents were not read.
- Recommendations: Keep real `.env` files ignored, keep examples scrubbed, and avoid copying environment values into `.planning/codebase/` documents.

## Performance Bottlenecks

**Search recomputes all derived structures on every keystroke:**
- Problem: Each input event rebuilds metrics and the active view groups/rows from the full registry list.
- Files: `src/registry-explorer/ui/shell.ts`, `src/registry-explorer/core/grouping.ts`
- Cause: `setState()` calls `render()` immediately, and each render calls `filterRegistries()` plus group or matrix builders without debouncing or memoization.
- Improvement path: Debounce search input for large datasets, precompute lower-cased searchable text per registry, and memoize `filterRegistries(registries, searchTerm)` for the current term.

**Filter creates a new search haystack per registry per call:**
- Problem: `filterRegistries()` joins name, description, framework, license, focus keys, and component tags for every registry each time search runs.
- Files: `src/registry-explorer/core/grouping.ts`
- Cause: Search text is computed dynamically instead of normalized once when data loads.
- Improvement path: Add a derived `searchText` map inside `initRegistryExplorer()` or a core helper. Keep `Registry` pure and derive search indexes externally.

**Full DOM replacement discards all view nodes on every update:**
- Problem: Renderers replace `aside`, `contentHeader`, and `contentBody` content with new HTML strings for tab changes, selection changes, and search.
- Files: `src/registry-explorer/ui/shell.ts`, `src/registry-explorer/ui/focusView.ts`, `src/registry-explorer/ui/componentView.ts`, `src/registry-explorer/ui/matrixView.ts`
- Cause: The UI uses coarse rerendering without keyed updates.
- Improvement path: Accept this for the current small dataset; if the dataset grows materially, use keyed DOM updates or a tiny view model layer to update only changed pills, rows, and cards.

## Fragile Areas

**Selection state can point to invisible groups after search changes:**
- Files: `src/registry-explorer/ui/shell.ts`
- Why fragile: `selectedFocus` and `selectedComponent` persist when search filters remove the selected group. The render path shows an empty view instead of resetting to the first available filtered group.
- Safe modification: When `groups.find(...)` fails after filtering, update the effective selection to `groups[0]` and keep state consistent. Cover this with tests for search transitions in focus and component views.
- Test coverage: No DOM tests cover `initRegistryExplorer()` state transitions.

**Tab values are cast from DOM attributes without validation:**
- Files: `src/registry-explorer/ui/shell.ts`, `index.html`
- Why fragile: Click handlers cast `data-view` directly to `AppState['currentView']`. A typo or new tab value can enter state without a matching renderer branch.
- Safe modification: Add an `isView(value): value is AppState['currentView']` guard and ignore or log invalid values.
- Test coverage: No tests exercise tab behavior or invalid DOM attributes.

**CSS layout relies on fixed viewport-height shell behavior:**
- Files: `public/styles/registry-explorer.css`, `index.html`
- Why fragile: `html, body` use `height: 100%`, `body` centers the app with padding, and `.scroll-region` is absolutely positioned inside `.content-body`. On small screens or browser UI chrome changes, content can become clipped instead of naturally extending.
- Safe modification: Test 320px, 375px, 768px, and desktop viewports before changing shell layout. Prefer `min-height: 100dvh`, explicit `min-height: 0` propagation, and mobile-specific scroll behavior.
- Test coverage: No visual, accessibility, or browser-flow tests exist.

**Generated and source artifacts are both committed:**
- Files: `dist/index.html`, `dist/assets/index-CN0C4-Na.js`, `dist/styles/registry-explorer.css`, `public/styles/registry-explorer.css`, `src/registry-explorer/*`
- Why fragile: `dist/` can drift from `src/` and `public/`, especially when builds are run locally with different package-manager state.
- Safe modification: Decide whether `dist/` is a committed release artifact. If it stays committed, run `./node_modules/.bin/tsc --noEmit` and `./node_modules/.bin/vite build` before every release and review generated diffs.
- Test coverage: CI deploy builds from source, but no CI check asserts committed `dist/` matches source.

## Scaling Limits

**Client-only static data bundle:**
- Current capacity: 71 registry entries in `src/registry-explorer/data/registries.data.ts`; the current build produces a small JavaScript bundle.
- Limit: As registry metadata grows to hundreds or thousands of entries, initial JS download, search recomputation, and full DOM replacement become noticeable.
- Scaling path: Split data into JSON loaded at runtime, add build-time validation, index search fields, and consider incremental rendering or pagination for matrix/card views.

**Matrix columns are manually selected:**
- Current capacity: 14 component columns in `src/registry-explorer/core/matrixColumns.ts`.
- Limit: Adding many component tags makes the matrix horizontally dense and harder to scan; keeping too few columns hides coverage users may expect.
- Scaling path: Add column presets, user-selectable component columns, or derive high-signal columns from tag frequency while keeping a deterministic default.

## Dependencies at Risk

**Package manager and lockfile state are unstable:**
- Risk: The repo has `pnpm-lock.yaml`, uses `pnpm` in `.github/workflows/deploy.yml`, but local `pnpm build` failed in this WSL environment while direct local binaries passed. Current working tree also shows package/lockfile drift.
- Impact: Contributors can see different dependency graphs or command failures depending on whether Windows or Linux Node tooling is first on `PATH`.
- Migration plan: Commit a consistent `packageManager` field in `package.json`, keep `pnpm-lock.yaml` current, document WSL-safe Node/pnpm setup, and make CI the source of truth for install/build.

**Vite major version floats within `^7`:**
- Risk: `package.json` allows any compatible Vite 7 release, while `node_modules` currently reports Vite 7.3.3 during build.
- Impact: Generated assets and build behavior can change across installs even for simple static deployments.
- Migration plan: Keep the lockfile committed and reviewed. For release-sensitive static sites, consider pinning Vite to an exact version or using Dependabot/Renovate for deliberate upgrades.

**GitHub Actions versions lag the task specification:**
- Risk: The checked-in workflow uses `actions/checkout@v4`, `pnpm/action-setup@v2`, `actions/setup-node@v4`, `actions/configure-pages@v4`, and `actions/upload-pages-artifact@v3`, while task docs call for newer versions.
- Impact: Deployment still may work, but workflow maintenance diverges from repo task documentation and misses newer action fixes.
- Migration plan: Update `.github/workflows/deploy.yml` deliberately, run the Pages workflow, and keep `docs/todo/00_github_workflow_pages.md` / `docs/todo/00_verification-step.md` in sync with the actual workflow.

## Missing Critical Features

**No user-facing deep links or URL state:**
- Problem: Current state lives only in memory; users cannot link to a filtered view, selected focus, selected component, or matrix state.
- Blocks: Sharing specific registry/component comparisons and restoring a working view after refresh.
- Files: `src/registry-explorer/ui/shell.ts`, `docs/future-enhancements.md`

**No data provenance metadata:**
- Problem: Registry entries contain display fields but no source URL, last verified date, scrape date, or confidence indicator.
- Blocks: Maintenance agents cannot distinguish verified current data from imported summaries or stale manual entries.
- Files: `src/registry-explorer/core/registry.schema.ts`, `src/registry-explorer/data/registries.data.ts`, `docs/Community registry overview.md`

**No accessibility verification path:**
- Problem: The app has tabs, dynamic panels, pills, and a matrix table, but no automated accessibility checks or manual acceptance checklist.
- Blocks: Confident changes to keyboard navigation, active tab semantics, table labels, color contrast, and focus states.
- Files: `index.html`, `public/styles/registry-explorer.css`, `src/registry-explorer/ui/shell.ts`

## Test Coverage Gaps

**UI rendering and event orchestration are untested:**
- What's not tested: Tab switching, focus/component selection, search input behavior, empty states, render error fallback, and URL/link rendering.
- Files: `src/registry-explorer/ui/shell.ts`, `src/registry-explorer/ui/focusView.ts`, `src/registry-explorer/ui/componentView.ts`, `src/registry-explorer/ui/matrixView.ts`
- Risk: User-facing regressions can ship while `tsc` and core logic tests pass.
- Priority: High

**Static dataset is untested:**
- What's not tested: Duplicate registry names, parseable URL strings, allowed protocols, non-empty descriptions, controlled vocabulary coverage, and matrix-relevant component coverage.
- Files: `src/registry-explorer/data/registries.data.ts`, `src/registry-explorer/core/registry.schema.ts`
- Risk: Data edits can silently break navigation, search quality, or security assumptions.
- Priority: High

**Deployment path is not covered by a local or CI assertion:**
- What's not tested: `vite.config.ts` base path compatibility with the GitHub Pages URL, copied public assets, and root-relative legacy page assets.
- Files: `vite.config.ts`, `.github/workflows/deploy.yml`, `index.html`, `public/index.legacy.html`
- Risk: The site can build successfully but deploy with broken asset URLs or expose stale legacy output.
- Priority: Medium

**Existing tests are not part of normal verification:**
- What's not tested: The tests under `tests/registry-explorer/` are not runnable from `package.json` and are not included in `tsconfig.json`.
- Files: `package.json`, `tsconfig.json`, `tests/registry-explorer/grouping.test.ts`, `tests/registry-explorer/matrixColumns.test.ts`
- Risk: Tests become documentation instead of executable protection.
- Priority: High

---

*Concerns audit: 2026-05-25*

# Registry Atlas stale-code cleanup

Scope: the approved behavior-preserving dead-code, package, CSS and tooling cleanup. Verified against the 2026-10-29 checkout and current PPM engineering/frontend skills. No UI redesign or replacement tool approval is involved.

## Removed

- `src/registry-explorer/core/index.ts`: an unused legacy export-all barrel. Focused module entrypoints remain the supported application boundary.
- `src/registry-explorer/ui/mobileSidebarFocus.ts` and `tests/registry-explorer/mobileSidebarFocus.test.ts`: old, test-only manual focus-wrap implementation. The running mobile sidebar uses a native `<dialog>` and dedicated browser tests.
- `@codesandbox/sandpack-react`, `react-dom` and `@types/react-dom`: no current application imports; Sandpack is a deferred experiment, not an active preview runtime. `react`, React Grab and React Doctor remain for the configured developer toolchain.
- One exact duplicate top-level `.registry-directory-grid-list` rule. Its later identical declaration remains authoritative.
- Duplicate `.gitignore` patterns, preserving the last effective occurrence.

## Maintained

- `src/registry-explorer/core/jsonInput.ts`: used by type-only imports not counted in runtime graphs.
- `src/registry-explorer/ui/index.ts`: an active entrypoint.
- `shell.ts` legacy `?view=...` routing: backward-compatible links are specified and covered by tests.
- `scripts/collect-aceternity-visuals.mjs`: standalone rebuild tool for the active `aceternityVisualEvidence.ts` map; no known current scheduled caller, but deleting the generator would lose reproducibility.
- `scripts/migrate-sqlite-to-postgres.mjs`: historical recovery tool; never execute it during cleanup.
- `react-grab`: invoked by the `index.html` dev-only dynamic import.

## New applicable PPM checks

- Consolidated anti-slop setup staged for TypeScript, CSS, StyleX and shadcn according to current PPM skill, but run checks only for the project's actual authored TS and CSS. No current StyleX or Tailwind v4 source is detected. Bundled vendor tooling is not application source.
- `stylelint@16.26.1` and `stylelint-config-standard@39.0.1`: pinned compatible releases with the installed `anti-slop-css` rules for declared ownership, cross-feature styling and stylesheet size.
- `knip@6.44.0`: explicitly enumerated nonstandard application, CLI, test and config entrypoints. A separate rule under Oxlint rejects deep three-parent import paths.
- `pnpm lint:styles` and `pnpm lint:unused` are integrated into normal lint, verification and deployment CI.
- `scripts/check-quality-debt.mjs` compares actual Stylelint/Knip findings with `.design/quality-debt-baseline.json`. New issue signatures or increased counts fail; known issues can only shrink without an explicit baseline update. A clean ratchet result **does not** claim all lint findings are resolved.

Initial debt baseline: 383 Stylelint findings and 67 Knip findings. The existing global CSS has 4,545 lines after extracting 48 provenance-specific rules to `src/registry-explorer/ui/catalog-component-provenance.css`. The initial quality debt is still open. Future work should separate browse, sidebar, detail and shell styles and reduce duplicate overrides with rendered visual regression checks.

## Evidence and remaining work

- Focused Vitest source/component/shell checks, TypeScript compilation, lint and production build.
- Real browser computed-style comparison at 850px with no changed checked properties after extraction, and 390px check of loaded stylesheet with no horizontal overflow.
- Negative probes prove the Stylelint, Knip and restricted-import gates reject a new violation, followed by clean reruns.
- Run targeted desktop card and mobile dialog E2E checks after the final CSS patch.
- The broader Bun-runtime migration required by the current PPM engineering skill was not silently applied: Registry Atlas presently uses pinned Node and pnpm in `mise.toml`. Switching or replacing that incumbent toolchain is a separate compatibility/migration decision, not part of this behavior-preserving stale-code cleanup.
- Unused StyleX/shadcn toolkit artifacts were staged by the required PPM consolidated anti-slop bundle but are not configured or exercised for absent source languages. React-related developer tooling remains intentionally retained pending actual compatible feature use.
- Global PPM standards certification is **not claimed**. Existing `.design/standards.json` covers an earlier feature map and carries unrelated stale baseline/source-evidence findings. Do not replace that user's approved decisions with an automatic all-project refresh; revisit applicability and closing conformance through the feature-scoped PPM workflow.

## 2026-10-30 follow-up

User-approved card behavior is now documented in `DESIGN.md`: the internal card surface opens its item detail, with a single external **Registry homepage** link in the action footer and an optional verified upstream **Source**. The duplicate internal **View component** action and separately positioned homepage link were removed.

- Stylelint findings: **383 → 155**. Auto-fix applied notation/whitespace changes, 60 compact declaration blocks were formatted, one adjacent duplicate preview selector was merged. Six suffix sections were split from the global stylesheet into feature-owned CSS in their original cascade order: setup workflow, link preview, native mobile dialog, progressive results, split panels, and sidebar taxonomy. The global stylesheet is now 4,134 lines, down from 4,545 before this work (even after formatter-expanded rules).
- Knip findings: **67 → 48**. Removed unused exports/re-exports in internal PostgreSQL adapters, an unused input number guard, and two uncalled database readers, preserving reachable DB operations and the existing public TypeScript entrypoints.
- Ratchet baselines were refreshed only after these code changes. Current issues remain tracked, not waived. Existing CSS duplicate selectors, descending-specificity warnings, and the `#appMain` identifier constraint require separate risk-scoped changes. Knip still identifies exported API/types, staged tooling packages, and external CLI binaries; do not delete those solely to satisfy a static count.
- Desktop and mobile card-navigation E2E plus native mobile dialog regression tests verify the requested UI and preserved navigation. Full suite not run by default.
- `pnpm check:product-contract` reports pre-existing reviewed-overlay input-fingerprint drift (432 stale inputs); not fixed by changing card links. A database/runtime data rebuild would be a different task.
- PPM global conformance remains unapproved until its independent design evidence, source revision recheck, and feature-map refresh requirements are met. This task does not assert project-wide compliance.

## 2026-10-30 continuation

- Stylelint debt reduced **155 → 117** by inserting 38 required blank separators. Semantic PostCSS AST traversal (selectors, declarations, at-rules, order and comments) was byte-identical before and after when formatting metadata was excluded. No CSS declarations or selectors changed.
- Knip debt reduced **48 → 35**. Deleted uncalled icon/source URL helpers, an unused summary-only loader, an unused core input callable guard, and the obsolete catalog-index search/option-building API. Privatized constants and helper functions still used within their defining modules, including `buildBaseDetail` and coverage rank/label maps.
- Active `findRegistryCatalogItem`, `parseRegistryCatalogIndex`, `compactCatalogItemToSummary`, runtime search, icon candidate logic, and legacy URL behavior remain. Historical plans mentioning the removed search API are preserved as historical documents, not current implementation contracts.
- The remaining 117 CSS warnings are mostly deliberate layered selector overrides and specificity warnings, plus `#appMain` selector conventions and one deprecated property; the remaining 35 Knip findings include externally meaningful domain types, pinned tooling dependencies, and CLI executables not understood by static import analysis. No automatic removal or linter suppression was applied.
- Updated the quality-debt baseline **only after** lint, typecheck and targeted test evidence. The remaining counts stay explicitly open and enforce a no-increase gate.

## 2026-10-30 CSS precedence and API boundary pass

- CSS findings: **117 → 110**. Corrected five selector-order cases with disjoint or mutually exclusive declarations (global anchor focus, disabled comparison result, sidebar brand title, checked sidebar row, empty sidebar slot). Left the remaining order warnings intact because reordering their overlapping declarations changes hover or selected-state behavior.
- Deleted **52 earlier exact duplicate declarations** scoped to the same selector, property, value, importance, and enclosing at-rule conditions, and one empty rule block. The set of distinct scoped selector/declaration identities remains unchanged (**2,108**). No other CSS property values were removed. Older visually distinct selectors and intentional cascade overrides remain in their original order.
- The managed headed Registry Atlas browser compared the **committed CSS** against the modified stylesheet at **1440×900** and **390×844**; computed styles for the active catalog card, links, sidebar, content, typography, and navigation had **zero differences**. Temporary baseline CSS was removed after the comparison.
- Knip findings: **35 → 22**. Verified 13 domain types have no external TS/test consumers, privatized their declarations, and removed the single unreferenced `RegistryItemDetailJson` interface. Public domain functions, live runtime routes, and tool-owned vendor files were preserved.
- The surviving **110 CSS issues** include order conflicts requiring deliberate cascade changes, intentional repeated selectors, eleven existing camelCase DOM IDs, and an older `clip` fallback. The remaining **22 Knip issues** are external CLI/tooling package reporting and bundled lint-vendor artifacts. They remain visible, not declared resolved, and must not be deleted or muted solely to achieve a zero count.
- TypeScript, quality tools, production build, and relevant core/UI unit tests verified this pass. Browser E2E regressions cover desktop and mobile card actions and native mobile navigation. PPM certification remains separate and pending the previously identified three baseline/design-review/standard-revision findings.

## 2026-10-30 final CSS and Knip cleanup

- **Stylelint 110 → 0** (direct checker, including strict standard preset, ownership, and size rules). The global stylesheet is reduced from 4,172 lines to approximately 1,669 base-only lines; nine ordered feature-owned CSS sheets contain catalog reference, hierarchy, app shell, browse, item detail, library cards, sidebar, directory, and rail rules. Every extracted sheet is under the 400-line ownership cap. The global cap is tightened to 1,700 lines.
- **Effective CSS cascade preserved.** Removed 62 earlier declarations superseded by later declarations with the same selector, property, importance and at-rule ancestry, retaining the one declaration used for older-browser fallback. Moved state/selector-order rules where their specificity keeps precedence intact. The ordered PostCSS selector/property/at-rule sequence matched exactly immediately after extraction. Final browser computed-style and E2E verification cover behavior-preservation after the remaining safe rule moves.
- **Knip 22 → 0**. Removed unused StyleX/shadcn lint packages and React type declarations after checking the actual application stack. Removed two unreferenced exports from the bundled anti-slop helper. Knip explicitly classifies verified external CLI binaries as global tools, React/React Grab as the `index.html` dev-only integration, one opt-in Effect plugin as a public tool entrypoint, and auto-generated vendored .d.ts files as generated inputs rather than authored app exports. No unused source type or dependency rule is disabled.
- **Shell DOM semantics preserved.** Changed the internal `appMain` identifier consistently to `app-main` across markup, panel behavior and scoped CSS; removed deprecated `clip` property while retaining existing `clip-path` screen-reader treatment. Focused tests cover both.
- PPM global compliance remains independently gated. Do not fabricate source-linked design review or mark a project-wide standard compliant without approval/verification evidence.

### Final verification and certification boundary

- **Rendered proof:** `.design/evidence/css-cascade-parity-2026-10-30.json` records six old-vs-new computed-style and geometry comparisons with original/current hashes. This is observation evidence, not design approval.
- **Tests:** 63 focused unit tests in 12 files, 5 desktop E2E tests, and 2 mobile E2E tests passed. The live managed browser matched the previous committed stylesheet across six route/viewport combinations. TypeScript, Oxlint, dependency-cruiser, React Doctor, CCCC complexity, source-backed design lint, CSS/Knip zero-debt checks, and the production build passed. Full suite intentionally not run.
- **PPM:** Refresh synchronized 38 selected standards to current source and stack digests, preserved the two prior Human Review decisions, and regenerated the feature rule digest. The final PPM check still reports one historical global certification blocker: `policy:design-document` requires a separate independently approved source-linked `designReview`. The existing user-approved code cleanup is **not** a design baseline acceptance. No approval record was invented, and neither this refactor nor factual documentation correction requires another user design decision.
- **Delivery:** Changes are committed locally. Upstream push stays withheld while the independent global certification requirement remains outstanding.

### Dependency security verification

- The `pnpm audit:dependencies` check identified five advisories in the prior lockfile: one high-severity Zod issue and four `fast-uri` URI validation issues. Updated the direct Zod dependency to patched `4.6.6` and selected transitive `zod@4.6.6` / `fast-uri@3.1.9` via exact workspace overrides. This preserves one Zod version across the application and E2E/test tooling.
- The patched lockfile passed PNPM supply-chain policy verification and `pnpm audit --audit-level low` reports **no known vulnerabilities**. Affected Zod parser/unit tests, typechecks, lint, production build and the relevant post-upgrade desktop/mobile E2E tests serve as compatibility evidence.
- The Zod security patch increased the generated application JavaScript bundle from approximately 240.23 KB / gzip 60.73 KB to approximately 262.62 KB / gzip 68.30 KB. This size change is recorded, not hidden or presented as a performance improvement; avoid reverting the security patch to recover bundle size.

## 2026-11-02 bootstrap dependency restoration

- Restored `@stylexjs/eslint-plugin@0.19.1` as an exact dev dependency and refreshed the pnpm lockfile. This is the original version recorded in the Stackforge anti-slop StyleX setup state. Its absence blocked the PPM bootstrap preview as a managed-value drift.
- Knip explicitly excludes this single managed setup dependency because Registry Atlas has no authored StyleX source or active StyleX lint gate. This does not imply that StyleX linting is running.
- **2026-11-02 update:** the subsequent authorized PPM bootstrap `--write` completed with zero failures. Restored managed `@shadcn/lint` from `file:tools/oxlint/shadcn-lint`; direct Stylelint/Knip, mise, Oxfmt 0.74.0, TypeScript/CSS/StyleX/Shadcn setups, and Oxlint import rules are applied. Post-apply preflight reports no conflicts and unchanged mise/Oxfmt setup. Generated plugins are scoped out of authored-code lint; Knip excludes generated helper exports only. The separate React Doctor gate scans `.` while excluding backend `scripts/**`, which the strict Oxlint gate still covers.

## 2026-11-02 approved Oxfmt migration

- Applied Oxfmt 0.74.0 to the previously non-compliant authored source, tests, CSS, configurations, and docs. Direct `pnpm format:check` now passes; `pnpm check` also passes unchanged Oxlint/Stylelint/Knip rules.
- Added exact formatter exclusions for five historical machine-owned artifacts: `.design/standards.json`, review HTML, CSS-render parity JSON, browser-observations JSON, and the associated observation report. No ordinary authored source or test file was excluded.
- Built `scripts/verify-oxfmt-migration.mjs` for a repeatable comparison with the pre-migration revision. The changed TypeScript/JavaScript ASTs, CSS declarations/selector structure, and JSON/YAML values are equivalent after normalizing syntactic formatting differences. The only intentional manifest/configuration changes are the Oxfmt exclusions and explicit direct dev dependencies for the verifier's PostCSS parsers.
- Oxfmt wrapped imports previously adjacent to `@ts-ignore` and `@ts-expect-error` directives. Moved 16 comments to the corresponding multiline module-specifier lines, preserved the TypeScript diagnostics contract, and adjusted four brittle HTML/source-text test assertions to match equivalent layout independent of quoting/whitespace.
- Auto-fixed 248 `anti-slop/require-readable-spacing` diagnostics and 31 CSS blank-line diagnostics using their existing safe fixers; Oxfmt preserves the resulting spacing. `pnpm typecheck`, `pnpm typecheck:test`, the production build, and all combined quality gates pass.
- Targeted unit coverage: 603 tests in 84 registry-explorer files passed. Desktop/mobile card, panel, native sidebar, and grouped sidebar E2E verification provides runtime and interaction evidence.
- Source-linked PPM policy compliance is not a design approval. Preserve existing decisions and review history; keep the independent design-baseline approval blocker open.

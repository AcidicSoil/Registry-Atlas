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

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

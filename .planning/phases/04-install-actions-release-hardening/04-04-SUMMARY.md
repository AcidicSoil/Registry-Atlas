---
phase: 04-install-actions-release-hardening
plan: 04-04-release-hardening-smoke
status: complete
completed_at: 2026-06-08T18:24:00Z
---

# 04-04 Release Hardening Smoke Summary

## Implemented

- Updated GitHub Pages deploy workflow so deployment runs `pnpm verify` after dependency install and before Pages artifact upload/deploy.
- Left `pnpm verify` as the local release gate: source typecheck, test typecheck, Vitest, data validation, and production build.
- Added release/browser/accessibility smoke artifact: `.planning/phases/04-install-actions-release-hardening/04-BROWSER-A11Y-SMOKE.md`.
- Added README pointer to the Phase 04 browser smoke baseline.

## Verification

- Source assertion passed: `pnpm verify` precedes `actions/upload-pages-artifact` and `actions/deploy-pages` in `.github/workflows/deploy.yml`.
- Package assertion passed: `package.json` verify script includes `pnpm typecheck`, `pnpm typecheck:test`, `pnpm test`, `pnpm validate:data`, and `pnpm build`.
- `pnpm verify` passed:
  - source typecheck passed
  - test typecheck passed
  - Vitest: 13 files / 69 tests passed
  - registry data validation: 0 errors, 4 existing official HTTP warnings
  - production build passed and emitted `dist/`
- Browser smoke passed at `/Registry-Atlas/`:
  - copy install command observed: `npx shadcn@latest add @8bitcn/button`
  - inspect-first command observed: `npx shadcn@latest view @8bitcn/button`
  - disabled fallback reason observed: `Inferred/fallback candidate; install command unavailable.`
  - queue count/batch command updated after adding route-eligible item
  - URL state restored view/search/profile/focus/component and removed queue params
  - keyboard focus-visible baseline passed (`2px solid` active tab outline)
  - copy feedback used visible/manual-copy status fallback
  - browser console had no messages or JavaScript errors

## Notes

- Command syntax was not changed in this plan, so no additional shadcn CLI help refresh was needed.
- The 4 data validation warnings are existing upstream HTTP URL provenance warnings for official directory entries, not Phase 04 release blockers.

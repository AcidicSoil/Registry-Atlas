# Verification

Registry Atlas uses local verification as the authoritative project gate. Run verification from the canonical checkout or from the worktree whose changes you are validating; do not use GitHub Actions as a substitute for the repository's local checks.

## Full gate

```bash
pnpm verify
```

The full gate runs source type-checking, test type-checking, the Vitest suite, generated registry-data validation, and the production build. It validates the current generated mirror but does not refresh registry data.

For a narrower test-only check:

```bash
pnpm test
```

## Git worktree isolation

Root Vitest discovery intentionally excludes `**/.worktrees/**` through `vitest.config.ts`. This keeps verification for one checkout from silently collecting tests from sibling development worktrees stored beneath the repository.

This boundary matters when multiple implementation or documentation lanes are active at once: a test file that exists only in another `.worktrees/...` checkout is not part of the current checkout's test result. Validate each worktree from inside that worktree when its changes need verification.

The exclusion was added after canonical root discovery was shown to collect a duplicate test surface from an active sibling worktree. The regression check confirmed that a deliberately failing test under `.worktrees/` was excluded while the canonical test set still ran normally.

## Data refresh is separate

Verification does not mutate or refresh the generated registry mirror. When intentionally reviewing upstream registry changes, use the documented refresh sequence:

```bash
pnpm import:catalog
pnpm sync:registries
pnpm validate:data
pnpm verify
```

Review the generated reports and runtime mirror before accepting regenerated data. See `docs/registry-explorer-data.md` for the data authority and maintenance workflow.

## Browser release checks

Automated verification does not replace the maintained browser/accessibility release smoke. Use `.planning/phases/04-install-actions-release-hardening/04-BROWSER-A11Y-SMOKE.md` when release-level browser behavior needs validation.
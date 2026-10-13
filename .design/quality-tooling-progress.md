# Mandatory quality-tooling certification evidence

Status: **in progress / not certified**. Updated 2026-10-12.
Scope: Registry Atlas canonical workspace root.

## User authorization
The user explicitly granted standing approval (“always”) to install and configure anti-slop TypeScript, dependency-cruiser, cccc, and React Doctor, including normal verification and pass–fail–pass proof. This is an authorization to perform work, not a fabricated PPM/PAO receipt; policy records retain their unresolved formal PAO reference where required.

## Verified gates
- **dependency-cruiser 18.6.0**, pinned in `package.json`. `.dependency-cruiser.cjs` enforces cycles and established core → data → UI direction. Clean run: 40 modules, 112 dependencies, no violations. Deliberate core → UI import: exit 1 with `no-core-to-adapters`. Removal: clean run. An existing data → UI import was moved to shared core validation.
- **React Doctor 0.9.18**, pinned in `package.json`. Scoped to owned `src/` rather than unrelated worktree/Node CLI scripts, `--blocking warning --no-telemetry`. Clean run: no issues. Deliberate `await` in a loop: exit 1, then clean run after removal.
- **cccc 1.8.0**, pinned in `mise.toml` via official prebuilt `github:moznion/cccc` release. This avoids local Cargo installation failing for missing `libclang`. `cccc.toml` retains mandatory thresholds cognitive ≤15, cyclomatic ≤10. Initial report: 47 violating functions in 20 files. Refactoring shared source URL validation and breadcrumbs reduced remaining violations to **44**. The cccc gate is wired into `pnpm verify` and intentionally fails until the remaining owned functions are refactored. No threshold increases or grandfather exclusions.
- All project scripts appear as `mise` tasks and the package verify command invokes the three gate commands in addition to existing checks.

## Anti-slop TypeScript
Stackforge source `anti-slop` is already available locally. The prescribed setup apply/dry-run command was blocked by the execution safety layer before execution, so its root Oxlint integration is **not installed or certified**. Do not substitute an unrelated lint rule set or describe the setup as complete.

## Independent code checks
URL-source and breadcrumb unit tests pass; TypeScript and dependency-cruiser pass after extracting cross-layer URL validation. The full repository `pnpm verify` cannot be marked passing because 44 existing cccc violations correctly block the complexity gate.

## Remaining certification work
1. Refactor all 44 remaining functions at fixed cccc thresholds; rerun complexity clean → deliberate violation → clean, then the full normal verification gate.
2. Apply and validate the Stackforge vendored anti-slop TypeScript setup when permitted; prove its root Oxlint gate, integrate into normal verification, and preserve existing setup.
3. Reconcile formal PAO policy decision references in `.design/standards.json` using a real source; do not manufacture approval identifiers.
4. Run full project verification, restore all required policy evidence digests and perform PPM conformance checks before marking policies compliant.

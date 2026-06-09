---
quick_id: 260608-msn
status: planned
description: Fix Phase 3 review warnings: coverage ordering, discovery/profile tests, and out-of-place index dev tooling
created: 2026-06-08
---

# Quick Task 260608-msn Plan

## Objective

Resolve the actionable Phase 3 review warnings before starting Phase 4.

## Tasks

1. Correct coverage status ordering to match the Phase 3 contract and strengthen coverage ordering tests.
2. Add direct unit tests for `searchComponentCandidates()`, `buildDiscoveryOverview()`, and `buildRegistryProfile()` using focused fixtures.
3. Remove out-of-scope `react-grab` dev tooling/install wording from `index.html`.
4. Run `pnpm verify` and commit the code/docs artifacts atomically.

## Verification

- `pnpm verify` passes.
- New tests cover discovery/profile behavior and coverage order.
- `index.html` no longer references `react-grab` or package install instructions.

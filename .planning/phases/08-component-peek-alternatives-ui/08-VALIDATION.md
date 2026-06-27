---
phase: 08
slug: component-peek-alternatives-ui
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-06-27
---

# Phase 08 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest |
| **Config file** | `vitest.config.ts`, `tsconfig.test.json` |
| **Quick run command** | `pnpm test -- tests/registry-explorer/componentFilters.test.ts tests/registry-explorer/relatedComponents.test.ts tests/registry-explorer/componentPeek.test.ts` |
| **Full suite command** | `pnpm verify` |
| **Estimated runtime** | ~60 seconds |

---

## Sampling Rate

- **After every task commit:** Run the task-specific `pnpm test -- ...` command plus `pnpm typecheck` when source signatures changed.
- **After every plan wave:** Run `pnpm verify`.
- **Before `$gsd-verify-work`:** `pnpm verify` must be green.
- **Max feedback latency:** 60 seconds for targeted tests; full gate at wave boundaries.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 08-01-T1 | 08-01 | 1 | PEEK-01/02/03/04 | T-08-01 | Peek text/link rendering escapes untrusted registry fields and never executes code | unit/render | `pnpm test -- tests/registry-explorer/componentPeek.test.ts` | ❌ W1 | ⬜ pending |
| 08-01-T2 | 08-01 | 1 | PEEK-01/03 | T-08-01 | Keyboard and pointer state routes to item pages without hover-only behavior | unit/shell | `pnpm test -- tests/registry-explorer/componentPeek.test.ts && pnpm typecheck` | ❌ W1 | ⬜ pending |
| 08-02-T1 | 08-02 | 1 | FILT-01/EVAL-01 | T-08-02 | Filters derive from loaded metadata and do not trust rendered field text | unit | `pnpm test -- tests/registry-explorer/componentFilters.test.ts` | ❌ W1 | ⬜ pending |
| 08-02-T2 | 08-02 | 1 | FILT-01/PEEK-03 | T-08-02 | Active filters are removable/resettable and empty state is safe | unit/render | `pnpm test -- tests/registry-explorer/componentFilters.test.ts tests/registry-explorer/discoveryView.test.ts` | ❌ W1 | ⬜ pending |
| 08-02-T3 | 08-02 | 1 | EVAL-01/EVAL-02 | T-08-02 | Browsing surfaces avoid audit/approval/noisy confidence claims | source/render | `pnpm test -- tests/registry-explorer/discoveryView.test.ts tests/registry-explorer/registryProfileView.test.ts` | ❌ W1 | ⬜ pending |
| 08-03-T1 | 08-03 | 2 | ALT-01/02/03 | T-08-03 | Relatedness is metadata similarity only and never quality ranking | unit | `pnpm test -- tests/registry-explorer/relatedComponents.test.ts` | ❌ W2 | ⬜ pending |
| 08-03-T2 | 08-03 | 2 | ALT-01/02/PEEK-02 | T-08-03 | Related strip uses escaped text, safe links, and non-ranking copy | unit/render | `pnpm test -- tests/registry-explorer/relatedComponents.test.ts tests/registry-explorer/itemDetailView.test.ts` | ❌ W2 | ⬜ pending |
| 08-03-T3 | 08-03 | 2 | PEEK/FILT/EVAL/ALT | T-08-04 | Full phase behavior remains static, copy-only, and verified | integration | `pnpm verify` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements: Vitest, source/test typechecking, data validation, and `pnpm verify` already exist in `package.json`.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Anchored popover visual placement and responsive feel | PEEK-01/02/03 | jsdom-style tests cannot fully prove visual placement | Run `pnpm dev`, search a route-eligible item, hover/focus `View component`, verify compact popover width, fallback copy, focus behavior, `Esc`, outside click, and click-to-item route. |
| Scroll constraints for long aside/pill/filter lists | FILT-01 | CSS layout needs browser inspection | Run `pnpm dev`, open filters/sidebar with long categories/tags, verify the sidebar/list scrolls instead of stretching the page. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or existing Wave 0 dependencies.
- [x] Sampling continuity: no 3 consecutive tasks without automated verify.
- [x] Wave 0 covers all MISSING references.
- [x] No watch-mode flags.
- [x] Feedback latency target is under 60 seconds for targeted tests.
- [x] `nyquist_compliant: true` set in frontmatter.

**Approval:** draft 2026-06-27

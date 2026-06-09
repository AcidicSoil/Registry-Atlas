# Phase 4: Install Actions & Release Hardening - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-08T22:16:59Z
**Phase:** 4-Install Actions & Release Hardening
**Areas discussed:** Command + copy behavior, Queue + batch command UX, URL state + sharing, Release/accessibility baseline

---

## Area Selection

| Option | Description | Selected |
|--------|-------------|----------|
| Command + copy behavior | Exact add/view command text, disabled states, and whether to copy only validated item routes. | ✓ |
| Queue + batch command UX | How users add/remove items, dedupe rules, and where the batch command appears. | ✓ |
| URL state + sharing | Which state goes in the URL: query, tab, selected profile, queue, or only non-sensitive discovery state. | ✓ |
| Release/accessibility baseline | What counts as done for CI, browser smoke checks, keyboard/copy feedback, and documented a11y. | ✓ |

**User's choice:** all
**Notes:** User selected all gray areas for Phase 4 discussion.

---

## Command + Copy Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Verified route-eligible only | Only validated namespace + item pairs with known routes can produce `add` / `view` copy actions; incomplete candidates show disabled reasons. | ✓ |
| Allow inferred items too | Produce commands for inferred items with lower-confidence labels. | |
| Allow all guesses | Produce commands for all namespace/item guesses with warning copy. | |

**User's choice:** Approved recommended default.
**Notes:** Lock exact command syntax to `npx shadcn@latest add @<registry>/<item>` and `npx shadcn@latest view @<registry>/<item>`.

---

## Queue + Batch Command UX

| Option | Description | Selected |
|--------|-------------|----------|
| Route-eligible local queue | Queue only validated route-eligible items, dedupe by `@<registry>/<item>`, show compact Discover action panel. | ✓ |
| Broader inferred queue | Allow inferred items into queue with warnings. | |
| URL-persisted queue | Encode queued install choices into URL for sharing. | |

**User's choice:** Approved recommended default.
**Notes:** Batch command should be one `npx shadcn@latest add` followed by deduped item tokens. Queue supports add/remove/clear/copy.

---

## URL State + Sharing

| Option | Description | Selected |
|--------|-------------|----------|
| Discovery state only | Persist selected view/tab, search query, and selected profile/registry where relevant; keep queue local. | ✓ |
| Include queue in URL | Persist queued install selections in URL. | |
| Minimal URL state | Persist only tab/search, not profile. | |

**User's choice:** Approved recommended default.
**Notes:** Queue should not be URL-persisted for v1.

---

## Release/Accessibility Baseline

| Option | Description | Selected |
|--------|-------------|----------|
| Full targeted gate | Keep `pnpm verify`; CI runs typecheck, test typecheck, Vitest, data validation, build; add targeted command/queue/URL tests and browser/a11y smoke baseline. | ✓ |
| Build-only gate | Rely on production build plus existing tests. | |
| Manual QA-heavy gate | Use manual browser checks without expanding automated coverage. | |

**User's choice:** Approved recommended default.
**Notes:** Browser smoke checks should cover copy buttons, disabled states, queue flow, URL restoration, and profile/discovery link behavior.

---

## Claude's Discretion

- Exact module names and UI placement details may be chosen during planning/execution, provided the implementation stays pure-core-first and vanilla TypeScript/static SPA compatible.

## Deferred Ideas

None.

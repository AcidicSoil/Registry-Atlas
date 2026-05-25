# Phase 1: Foundation Safety & Verification - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-25
**Phase:** 1-Foundation Safety & Verification
**Areas discussed:** Verification baseline, Canonical app surface, Safe rendering boundary, Vocabulary source of truth

---

## Verification Baseline

| Option | Description | Selected |
|--------|-------------|----------|
| Existing core tests only | Add Vitest and a `test` script so current tests run, but keep scope narrow. | |
| Full foundation baseline | Add runnable tests plus targeted checks for data assumptions, grouping/search, safe URL/text helpers, and type-check coverage. | ✓ |
| Build-only | Treat `pnpm build` as enough for now. | |

**User's choice:** The user asked the agent to choose best defaults and correct prior work if needed.
**Notes:** Chosen default is full foundation baseline because later phases import broader third-party metadata and rely on these safety checks.

---

## Canonical App Surface

| Option | Description | Selected |
|--------|-------------|----------|
| Remove/archive stale deployed surfaces | Delete or move legacy and starter artifacts out of deployed paths. | ✓ |
| Preserve legacy page | Keep `public/index.legacy.html` available as historical fallback. | |
| Documentation only | Leave files in place and document which entry point is canonical. | |

**User's choice:** The user asked the agent to choose best defaults and correct prior work if needed.
**Notes:** Chosen default is to remove or archive stale deployable artifacts because Phase 1 must ensure users only reach the canonical app.

---

## Safe Rendering Boundary

| Option | Description | Selected |
|--------|-------------|----------|
| Shared safety helpers | Centralize HTML escaping and URL validation while keeping current renderer structure. | ✓ |
| Full DOM renderer rewrite | Replace template-string renderers with `document.createElement` everywhere now. | |
| Defer safety | Wait until Phase 2 import pipeline introduces broader third-party metadata. | |

**User's choice:** The user asked the agent to choose best defaults and correct prior work if needed.
**Notes:** Chosen default is shared safety helpers plus focused fixes. This improves safety before imports without forcing a broad UI rewrite into Phase 1.

---

## Vocabulary Source of Truth

| Option | Description | Selected |
|--------|-------------|----------|
| Const arrays derive types | Make runtime arrays canonical and derive TypeScript union types from them. | ✓ |
| Keep parallel unions and arrays | Preserve current structure and rely on tests to catch drift. | |
| Redesign taxonomy now | Expand and redesign component/focus vocabulary in Phase 1. | |

**User's choice:** The user asked the agent to choose best defaults and correct prior work if needed.
**Notes:** Chosen default is const arrays deriving types. Major taxonomy expansion is deferred to Phase 3.

---

## the agent's Discretion

- User delegated Phase 1 decision defaults to the agent.
- The agent selected defaults that reduce risk before official registry import and improve the end product.
- Planner should not re-ask these decisions unless implementation evidence contradicts them.

## Deferred Ideas

- Official registry sync and generated data pipeline are Phase 2.
- Component-first discovery and coverage confidence are Phase 3.
- Install commands, batch queue, URL state, and release hardening are Phase 4.

# Phase 3: Component-First Discovery - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-25
**Phase:** 3-Component-First Discovery
**Areas discussed:** Search/results, Coverage confidence, Registry profile, Secondary views

---

## Search/results

| Option | Description | Selected |
|--------|-------------|----------|
| Component-first comparison | One primary search input returns component/capability candidates first, with registries as context. | ✓ |
| Registry-first browsing | Preserve registry cards as the main flow and improve filters around them. | |
| Matrix-first comparison | Lead with a comparison matrix and use search as a table filter. | |

**User's choice:** Optimal choices for best possible experience in all regards.
**Notes:** Agent defaulted to component-first comparison because it directly matches the project core value and Phase 3 requirements.

**Follow-up clarification:** User clarified that the main experience should link to components within each registry, not only to registry homepages. This applies to every component a registry has available: matching known component candidates should show with validated registry item routes when available.

---

## Coverage confidence

| Option | Description | Selected |
|--------|-------------|----------|
| Explicit status states | Use verified, inferred, partial, unavailable, and unverified statuses everywhere coverage appears. | ✓ |
| Simple yes/no coverage | Keep current matrix-style boolean coverage semantics. | |
| Hide unknowns | Only show records with confident coverage. | |

**User's choice:** Optimal choices for best possible experience in all regards.
**Notes:** Agent selected explicit status states to avoid false certainty while preserving discoverability.

---

## Registry profile

| Option | Description | Selected |
|--------|-------------|----------|
| Full provenance profile | Show namespace, official facts, Atlas enrichment, sync metadata, warnings, coverage status, and why-match context. | ✓ |
| Minimal detail panel | Show only namespace, description, and homepage link. | |
| Link-out only | Send users to upstream registry sites for detail inspection. | |

**User's choice:** Optimal choices for best possible experience in all regards.
**Notes:** Agent selected full provenance profile because users need enough context to choose without manually sifting through every site.

---

## Secondary views

| Option | Description | Selected |
|--------|-------------|----------|
| Keep as supporting modes | Preserve focus, component, and matrix views as secondary comparison surfaces with status-aware updates. | ✓ |
| Replace with search only | Remove secondary browsing views in favor of one search surface. | |
| Leave unchanged | Keep current secondary views without status or component-first integration. | |

**User's choice:** Optimal choices for best possible experience in all regards.
**Notes:** Agent selected supporting modes so existing useful browsing remains, but primary interaction moves to component-first search.

---

## the agent's Discretion

- User delegated all Phase 3 decision areas to optimal defaults.
- Agent prioritized fast scanning, honest coverage confidence, static deployment compatibility, provenance clarity, and Phase 4 readiness.
- User specifically locked item-level registry routes as the primary Phase 3 value: results should expose validated resolved routes for all known registry/item pairs, across every component a registry has available.

## Deferred Ideas

- Copyable install/view commands, batch queue, and URL share state remain Phase 4.
- Package-manager variants, visual previews, similar suggestions, and scheduled sync PRs remain v2 ideas.

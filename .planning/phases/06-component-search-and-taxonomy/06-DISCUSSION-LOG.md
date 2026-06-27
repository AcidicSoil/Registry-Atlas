# Phase 6: Component Search & Taxonomy - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-27
**Phase:** 06-component-search-and-taxonomy
**Areas discussed:** taxonomy admission, category/layout shape, aliases, status wording

---

## Taxonomy Admission Rule

| Option | Description | Selected |
|--------|-------------|----------|
| Add only a tiny subset | Implement only a few tags from the proposed taxonomy. | |
| Add all applicable researched tags | Support all useful proposed tags/categories from the research bundle for the imported `@delego`, `@delta`, and `@diceui` component set. | ✓ |
| Wait for perfect coverage | Defer taxonomy work until every hard-to-get registry/component has complete data. | |

**User's choice:** Do all of them where possible.
**Notes:** The user clarified that the research and planning have already been done. If some items are harder to obtain, use the existing fallback plan so Registry Atlas can still represent them honestly through unavailable/manual-follow-up/inferred handling.

---

## Category and Layout Shape

| Option | Description | Selected |
|--------|-------------|----------|
| Full layout redesign now | Stop and redesign the discovery/profile layout before taxonomy work. | |
| Incremental current-layout expansion | Expand what the app is already doing until there is a better layout concept. | ✓ |
| Keep categories entirely internal | Add taxonomy metadata but avoid any user-facing category clues. | |

**User's choice:** Expand on the current approach for now.
**Notes:** The user said the layout probably needs an audit and could make more sense, but not enough thought has gone into that yet. Capture the layout audit as deferred, not a blocker for Phase 6.

---

## Alias Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Strict curated aliases only | Maintain a small explicit alias map. | |
| Derived aliases where easier | Derive obvious aliases from slugs/titles/tags when maintainable, or use curated aliases when that is easier. | ✓ |
| Complex synonym system | Add a heavier synonym/search system now. | |

**User's choice:** Keep it simple; whichever is easier and better to work with.
**Notes:** Planner/researcher can choose derived aliases or a small curated map based on implementation simplicity and tests.

---

## Status Wording

| Option | Description | Selected |
|--------|-------------|----------|
| Lock final status language now | Decide final permanent labels in this phase. | |
| Practical simple wording for now | Do the best practical version and keep it easy to revise later. | ✓ |
| Hide status language | Avoid status labels until the team has a final model. | |

**User's choice:** Do the best we can for now.
**Notes:** Continue with the Phase 5 concepts: catalog-backed, inferred, unavailable, manual follow-up. Do not over-design the status model.

---

## the agent's Discretion

- Use the existing research/docs as authority and do not restart product discovery.
- Choose the easiest maintainable alias approach.
- Keep current UI/layout patterns unless a very small improvement is obvious.
- Keep status wording simple and revisable.

## Deferred Ideas

- Full discovery/profile layout audit.
- Internal item-detail viewer.
- Dynamic matrix modes/presets.
- Browser/manual research automation for harder registries.

# Phase 7: Item Detail Data & Routing - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-27
**Phase:** 7-Item Detail Data & Routing
**Areas discussed:** Item route behavior, Detail content priority, Loading and failure states, Command/action placement, Raw JSON display

---

## Item route behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Full detail page | Selecting a component replaces main content with a focused item page; best for deep inspection and shareable links. | |
| Side/detail panel | Keeps search/profile context visible and opens details beside it; best for browsing many components. | |
| Focused overlay | Opens a modal-like view over the current page; quick but potentially heavier. | |
| User-defined component page | User clarified the page should show the component/item, not JSON. | ✓ |

**User's choice:** “When I go to it, I see the component. I see the item. I don't want to see JSON.”
**Notes:** Route behavior should feel like a component page, not a JSON inspector.

---

## Detail content priority

| Option | Description | Selected |
|--------|-------------|----------|
| Visual/component first | Title, visual/preview area, short description, then actions/details. | ✓ |
| Action first | Title, install/view buttons, then preview/details. | |
| Trust/status first | Title, catalog-backed/source/confidence info, then preview/actions. | |
| You decide | Planner chooses based on the “component page, not JSON inspector” decision. | |

**User's choice:** 1 — Visual/component first.
**Notes:** The page should start with what the component is and what it looks like.

---

## Loading and failure states

| Option | Description | Selected |
|--------|-------------|----------|
| Honest placeholder | “Preview not available yet,” plus description, source links, and safe actions. | |
| Source-first fallback | Big “Open source/demo” action when Atlas cannot show it. | |
| Metadata card fallback | Tags, description, files/dependencies, and status so it still feels useful. | |
| Component/item link fallback | User clarified fallback should link to the component/item page, not JSON. | ✓ |

**User's choice:** “We should have a link to the component, to the item. Not in JSON.”
**Notes:** Failure states should guide users toward seeing the component somewhere useful, not toward raw registry data.

---

## Command/action placement

| Option | Description | Selected |
|--------|-------------|----------|
| Near the top, under the visual | After the component preview/title area, show view/add/source/demo links. | |
| Sticky action rail/sidebar | Actions stay visible while scrolling details. | |
| Split by intent | User actions near top; developer/raw/source actions lower down. | ✓ |
| You decide | Planner chooses simplest version that keeps component browsing first. | |

**User's choice:** 3 — Split by intent.
**Notes:** User-facing component actions should stay high. Developer/source details should not clutter the primary browsing area.

---

## Raw JSON display

| Option | Description | Selected |
|--------|-------------|----------|
| Hidden by default | Tucked behind “Developer details” or “Raw registry JSON.” | |
| Collapsed section near bottom | Visible label, but not expanded until clicked. | |
| Separate tab/section | Available, but secondary to the component page. | |
| Do not show raw JSON in UI | Raw JSON is for agents/maintainers/internal loading, not normal users. | ✓ |

**User's choice:** “I don't want to see JSON. JSON is for agents and shit. I don't need to see that.”
**Notes:** The user later reinforced that JSON would take up room, clutter the interface, and add noise that does not help component browsing.

---

## the agent's Discretion

- Planner may choose exact route/rendering mechanics as long as the result feels like a component page and supports URL state/back navigation.
- Planner may decide the typed loader/model split and failure-state implementation.
- Planner may preserve raw JSON internally for agents, validation, tests, or maintainers, but it should not appear in the normal user-facing item route.

## Deferred Ideas

- Phase 8 handles hover/focus/tap peek cards and alternatives UI.
- v1.3 handles dynamic matrix and tag picker/presets.
- v1.4 handles systematic registry crawling, broader hydration, and screenshot capture automation.

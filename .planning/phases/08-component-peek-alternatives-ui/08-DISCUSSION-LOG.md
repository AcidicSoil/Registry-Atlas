# Phase 8: Component Peek & Alternatives UI - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-27
**Phase:** 08-Component Peek & Alternatives UI
**Areas discussed:** Peek interaction shape, Peek card content and fallback, Item type filters and evaluation labels, Related alternatives behavior

---

## Peek Interaction Shape

| Option | Description | Selected |
|--------|-------------|----------|
| Hover/focus preview + click opens item page | Quick glance on desktop/keyboard, stable click/tap path for mobile. | ✓ |
| Click/tap opens a pinned peek card | User controls when it appears and dismisses it. | |
| Only use the existing item page | Keep cards simple; view component goes straight to detail page. | |
| Other | Freeform behavior. | |

**User's choice:** Hover/focus preview + click opens item page.  
**Notes:** Peek should be a small anchored popover. It should dismiss naturally with mouse leave, blur, `Esc`, or outside click/tap. Click/tap opens the Phase 7 item page.

---

## Peek Card Content and Fallback

| Option | Description | Selected |
|--------|-------------|----------|
| Visual area first | Screenshot/thumbnail if available, otherwise a clear preview placeholder. | ✓ |
| Component title and description first | More text-first, less visual. | |
| Actions first | View/copy actions before preview. | |
| Other | Freeform content model. | |

**User's choice:** Visual area first.  
**Notes:** User clarified the peek should be almost entirely visual: ideally only the component visual, at most a tiny title/name above it. Avoid metadata unless there is no visual. Do not recreate the item card inside the peek. If no visual exists, show a minimal placeholder: `Preview not available yet` plus `Open component page`.

---

## Item Type Filters and Evaluation Labels

| Option | Description | Selected |
|--------|-------------|----------|
| Compact filter bar above results | Visible with clear reset. | Partial |
| Sidebar/aside only | Less visual noise but easier to miss. | |
| Inline chips on every card | Visible per item but risks re-crowding cards. | |
| Extensible filter picker | `+ Filter` command-menu style selector with removable active badges. | ✓ |

**User's choice:** Extensible filter picker with active removable badges, generated from loaded item metadata.  
**Notes:** User asked what file/source filters would pull from; source chain was clarified as `public/data/registries.json` loaded by `src/registry-explorer/data/loadRegistries.ts`, normalized into `Registry.itemSummaries`. User emphasized current route/sidebar grouping is too broad, inconsistent, and incomplete; long pill lists/sidebars should become scrollable. The user rejected noisy labels like `verified item` and `high confidence` as distracting. Docs and registry homepage are useful; profile/details/view component can remain if not noisy. Registries-by-component badges need better overflow/disclosure or removal from cramped rows.

---

## Related Alternatives Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Small related strip on item/peek detail surfaces | Based on shared type/category/tags, not quality-ranked. | ✓ |
| Dedicated alternatives panel | More room but bigger UI change. | |
| Inline alternatives inside every discovery card | Visible but noisy. | |
| Skip visible alternatives for now | Prepare data only. | |

**User's choice:** Small related/similar component navigator on item/peek detail surfaces.  
**Notes:** User described a component-to-component browsing flow: click a component, see alternatives, click one, then continue to the next related component. Long-term product direction is to help users move from generic/generated UI toward more complete, intentional, production-ready component patterns. Phase 8 should prepare the browsing/data seam but avoid claiming an item is better/correct unless evidence exists.

---

## the agent's Discretion

- Choose the exact implementation for anchored peek popovers and accessibility behavior.
- Choose whether the initial filter picker exposes item type only or additional low-risk metadata dimensions, as long as the system is extensible and generated from loaded item summaries.
- Choose safe visible wording for related browsing, such as `Similar patterns` or `Related components`.
- Choose whether any tiny matrix-adjacent cleanup can be done without pulling v1.3 Dynamic Coverage Matrix into Phase 8.

## Deferred Ideas

- Interactive matrix redesign with complete dynamic component/tag coverage belongs to v1.3 Dynamic Coverage Matrix.
- Evidence-backed production pattern upgrades / upgrade paths for replacing generic AI-generated UI belong to a future recommendation milestone.
- Automated screenshot capture pipelines remain v1.4 or later.
- Quality-ranked `better` / `best` / `correct` claims remain deferred until Registry Atlas has real evidence.

# Workbench Shell scope decision for Registry Atlas

The user clarified on October 23, 2026 that project standards apply **where related to the work**, and that Registry Atlas should implement applicable **interaction mechanics**, including resizing, collapsing, and nested navigation, without adopting Workbench Shell product features such as chat or model selection. The user explicitly rejected those added product requirements.

Registry Atlas is an existing catalog browser built with Vite, native DOM UI, and shared taxonomy/query state; it is not created from the Workbench Shell starter. Full parity with the pinned chat-centric Workbench Shell is **out of scope for this project**. The policy `shared-app-shell-interactions` therefore does not apply as a full-product composition requirement.

The related targeted policies **do apply**. They are checked independently: collapsible sidebar/nested navigation, panel scrolling and resizing, logo-to-home, browser favicon, keyboard and mobile interaction. The current grouped navigation behavior is specified in `.design/grouped-filter-navigation-2026-10-23.md`.

This decision does not waive an affected component interaction, and does not certify other unreviewed standards.

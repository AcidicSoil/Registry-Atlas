# New shared-workbench-shell policy: Registry Atlas scope review

Status: **Unresolved applicability/compliance decision**, not an approved exception or compliance finding.

The PPM catalog added `policy:shared-app-shell-interactions` after Registry Atlas had adopted its existing catalog-centered shell. The authoritative PPM contract is pinned to `shared-app-shell-standard` commit `e13d0f49ddafaaa988c6288cef17524583327c9e`. It requires exact positions and functional behavior across the main/right/bottom tab variants.

**Present in Registry Atlas:** primary catalog navigation, nested Collections disclosure, setup cart, working home logo, favicon, independent sidebar/content resize and collapse, and an auxiliary registry summary. These are supported by current app-shell/browser tests.

**Not present:** conversation management, model selection, chat composer, chat/history activity rail, tabbed workbench views, settings navigation with the contract's full set of sections, command palette, file/review workspaces, and workbench tab placement controls. `index.html`, `src/registry-explorer/entry.ts`, and `DESIGN.md` show a Vite + DOM registry browser, not the workbench chat/product UI. A component registry is not proof of working interactions.

**Decision required before implementation:** Either (1) authorize turning Registry Atlas into a Workbench Shell-based application, with an approved feature-by-feature scope and UI prototype, or (2) explicitly scope this shared-workbench parity standard to products built from that workbench starter, keeping the existing independent catalog shell and its other app-shell requirements. Neither option is selected here. No agent has been authorized to synthesize missing product features, and no exception has been approved.

Verification target if option 1 is chosen: enumerate required actions and exact placements from the pinned PPM contract, build the approved main/right/bottom variants, test every action and persistence behavior, then verify in the managed `registry-atlas` browser and desktop/mobile E2E suites. This policy remains open independently of the other verified shell controls.

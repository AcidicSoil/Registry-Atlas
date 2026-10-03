# Live 21st.dev reference: routes, controls and working-demo evidence

**Observed:** 2026-10-03 local workstation, managed PPM `design-ui-ux` instance `http://127.0.0.1:9880` using its existing 21st.dev tab. **Scope:** bounded exploration of 15 page/state samples and two actual hosted demos, **not** a complete 21st.dev census or a comparison test against every Atlas route.

**Raw structured observations:** `~/.local/state/registry-atlas/research/21st-dev-20261003-live-route-audit.json`. Existing older layout audit: `docs/research/2026-09-29-21st-layout-exemplar-audit.md`.

## Live route/state samples

| Label | Observed official route | Important visible elements / state |
| --- | --- | --- |
| Marketing home | `https://21st.dev/` | Separate discovery/marketing shell; preview rails and hero; observed loading-placeholder states during initial navigation. |
| Components root | `https://21st.dev/community/components` | Category rail, sectioned Newest/Popular/Shader and other bands, mixed source cards, bookmark controls, source-author links. |
| Buttons category | `https://21st.dev/community/components/s/button` | Component title; Recommended / Most downloaded / Most bookmarked / Newest sort buttons; Filter overlay; list of working component-preview cards and source credit. |
| Buttons Filter opened | Same route after actual Filter click | Search/Clear and **Category, Time, Primitive library, Tailwind version, License, Library, Built with, Author, Tags** disclosures; option radios appeared. |
| Templates | `https://21st.dev/community/templates` | Own search, Templates rail, Community section, Included in Plan, Free, Buy on 21st, Verified categories. |
| Themes | `https://21st.dev/community/themes` | Theme search, create-theme action, theme-specific directory and publishing guidance. |
| Icons | `https://21st.dev/community/icons` | Icon search, glyph controls (copy and Details per icon), icon families and semantic categories. Not a generic component card grid. |
| Libraries | `https://21st.dev/community/libraries` | Library search, Grid/List toggle, Views/Components/Recently updated/Newest/Name sort. |
| Authors | `https://21st.dev/community/authors` | Top Authors and All Authors, author profiles, contribution counts, pagination. |
| Newest | `https://21st.dev/community/components/newest` | Week-grouped components, Grid/List controls and route-specific navigation. |
| Featured | `https://21st.dev/community/components/featured` | Featured collection and category rail. |
| Component detail | `https://21st.dev/@arunachalam/components/scroll-expansion-hero` | Large separate `cdn.21st.dev` iframe, Copy prompt/Save/Remix/CLI/Report, source and dependency sections, code file tabs. |
| Template detail | `https://21st.dev/@lyanchouss/templates/dali-ai-agency-agent-studio-site` | Third-party live preview iframe, Reload/Open in new tab, Save/Report and purchase action, tags/install. |
| Theme detail | `https://21st.dev/@serafimcloud/themes/vercel` | Theme route and heading loaded. Initial snapshot showed no iframe; this is not proof that the theme never previews. |
| Library detail | `https://21st.dev/@manuarora700/library/aceternity-ui` | Source library title, install command, ownership/claim action, internal search, item counts and related source listings. |

The category rail inspected at Components root has distinct **Marketing Blocks** and **UI Components** groups, with observed category links and counters (including Heroes, Features, Buttons, Cards, Inputs, Dialogs, Sidebars, Tables and many more). The route census task must enumerate each current link, count, destination, active state and collapse/scroll behavior. This sample deliberately does not claim that every label or control has been exercised.

## Real interactions, not inferred behavior

1. Clicked **Buttons** in the Components sidebar. Navigation changed from `/community/components` to `/community/components/s/button`, showing a category-specific heading and controls.
2. Clicked **Filter** on that category. The control opened its filtering surface and made the named filter groups and options visible; the route did not change just because the overlay opened.
3. Opened `https://21st.dev/@kuratlielia/components/signature-pad`. The detail page uses a separate observed CDN iframe; clicking the **Component.tsx** tab changed its selected state from false to true. This tests code-panel tab behavior, not execution of the sample.
4. Opened the source-observed Signature Pad CDN preview in the **same managed profile**. The Black/Blue/Violet ink radio group was rendered; clicking **Blue ink** changed its `aria-checked` value from `false` to `true`. Undo/Redo/Clear/PNG/SVG controls were present but disabled while empty.
5. Attempted a pointer stroke using both low-level mouse actions and PinchTab drag on the rendered SVG. The signature path remained empty and Undo stayed disabled. This **does not prove** the component itself is broken; the synthetic browser gesture may not match its pointer capture handling. Mark signature drawing unverified until a compatible pointer test or manual action succeeds.
6. Opened `https://21st.dev/@kuratlielia/components/tabs`, followed its observed CDN preview, then clicked the **Activity** tab. `aria-selected` changed from Overview=true / Activity=false to Overview=false / Activity=true, and the Activity panel's text was visible. This is a verified *working hosted component interaction*.

These observations show why **image loaded**, **iframe loaded**, **UI selected** and **component interaction verified** must be distinct coverage states. They do **not** establish that every 21st.dev component is tested, nor that every Atlas catalog identity can be executed.

## Gaps to inspect before claiming full reference parity

- Finish a systematic, link-driven sitewide route and sidebar census: home, all component category groups, templates, themes, icons, libraries, author/profile routes, editors, shaders, gradients, ASCII, directories, related assets, search, account, bookmarks, publish/report, and all context menus.
- Record actual sort and filter option outcomes, URL/query updates, clear/reset, persistence and empty cases; a visible button is not verified functional evidence.
- Traverse representative full cards and use Back/Forward, keyboard modifiers and direct reload. Verify that clicking an embedded demo does not trigger outer navigation.
- Audit theme editor, icon copy/export, component card demos, template previews, related variants, keyboard shortcuts, mobile bottom sheet and responsive detail layouts with actual before/after evidence.
- Verify Atlas side-by-side in the dedicated `registry-atlas` managed profile and then extend the route/feature inventory automatically. No such full Atlas comparison was performed in this bounded reference survey.

## Guidance for implementation

The user has explicitly raised the completion bar to **all matching route contents and working component demos**. A static visual remains a useful first-paint or temporary reference; it cannot count as a passing executable preview. Choose official permitted embeds or reviewed, isolated upstream builds; keep unavailable cases visible in the ledger rather than making security or license assumptions. Do not copy proprietary source, branded assets or unsupported statistics.

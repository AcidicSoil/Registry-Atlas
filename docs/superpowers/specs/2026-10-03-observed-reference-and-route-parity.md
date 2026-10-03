# Registry Atlas — complete 21st.dev reference parity and functional components

Date: 2026-10-03. Status: authoritative requirement reconciliation, not implementation completion.
Authority: original 2026-10-03 03:47–04:50 AM messages in “Blocked PAO Checkin”, plus the latest instruction in this conversation: “everything ... literally everything”, with working components.

## Result in plain language

Inspect the live 21st.dev site and operate its controls. Registry Atlas must provide the same breadth and quality of user experience: all pertinent route families, entire sidebar hierarchies and contents, filters, sorts, searches, cards, detail pages, specimen panels, interactions, responsive states and actual functioning component demonstrations. A visual image plus official link is still useful, but it is **not enough for final functional parity**. Do not imitate a functioning interface with static images or inert controls.

The goal is functional and structural parity, not copying 21st.dev's private implementation, branding, proprietary assets or unsupported commercial metrics. When Atlas lacks data or infrastructure needed for an observed feature, record the exact gap and build an honest corresponding service; do not present a fake control as finished.

## Relationship to existing specs, code and worker branches

- This is the parent scope for the new work. Plan: `docs/superpowers/plans/2026-10-03-observed-reference-and-route-parity.md`.
- `docs/superpowers/specs/2026-10-02-component-visual-references.md` remains authoritative for source-verified images and official URLs, **but its earlier image-only completion definition is superseded by the latest functional-parity instruction**.
- `docs/superpowers/specs/2026-10-01-scalable-registry-discovery.md` remains authoritative for verified navigation, canonical identity and durable discovery ledger. Its historical upstream-code-build gate is not a prerequisite to obtaining images.
- The older `docs/superpowers/specs/2026-10-01-authentic-component-previews-and-coverage.md` and corresponding plan remain historical, not permission to execute arbitrary remote component code. Reuse secure build concepts only where needed.
- Reuse main's discovery, capture, visual manifest and catalog/detail code. Review committed traversal worktree `feat/registry-traversal-patterns` at `1b7263a` and dirty frontend worktree `feat/frontend-reference-navigation`; do not overwrite, reset, silently duplicate or merge worker-owned changes.
- The September 29 audit is an older reference, not current proof. Live bounded findings appear in `docs/research/2026-10-03-21st-route-interaction-audit.md`.

## R1. Exhaustive reference census

Inventory all discoverable public 21st.dev route and interaction families, not only the previously sampled pages. The inventory must record reference URL, route hierarchy, **every sidebar item**, labels, group, count, active state, filters, sort choices, search, card anatomy, controls, interaction result, keyboard/hover/mobile behavior, corresponding Atlas destination, and implementation/test status. Keep evidence date and source so a changing site can be rechecked.

Mandatory families: marketing home and discovery bands; Components root, categories and category filters; Featured/Newest; Templates, Themes and theme editor; Icons, icon categories and format/copy controls; Shaders, Gradients and ASCII art where exposed; Libraries/registry directory and detail; Authors and profiles; individual component, template, theme, shader and icon details; search, overlays, preview controls, code/info tabs, related content, copy prompt, install/CLI, save/bookmarks, sharing, remix, reporting, account/publishing, mobile navigation and states. Include empty, loading, error, direct/deep-link, history and reload behavior. Routes absent from Atlas count as parity gaps, not implicit exclusions.

Inspect source at desktop ~1920px, mobile ~390px and an intermediate width. Interact with a representative case per family now and design resumable discovery to extend the audit to the full available reference route/control inventory. **A 15-route sample is not the whole site**.

## R2. Scalable official registry route discovery

Use actual registry homepages, observed on-page link hierarchies, robots/sitemap URLs, official indexes and rendered item pages to learn route families. Record candidate sitemap URLs separately from **reopened page-observed exact catalog identities**. Never manufacture destinations from a guessed slug, conflate identical display names or treat HTTP 200 as verified identity.

Each registry needs source homepage, observed listing/category paths, reusable path-family evidence, exact `namespace/item.name` match, final URL and heading, fingerprint, timestamp, observation strategy and unresolved reason. A durable bounded scheduler must cover the current registry inventory, retry recoverable failures, preserve successful evidence and report candidate, observed, image, interactive, blocked, stale, ambiguous, failed and pending separately. Integrate the existing sitemap-pattern worker's output by ownership agreement rather than writing 408 handcrafted crawlers.

## R3. Working components are the final preview standard

For each Atlas catalog identity, target a genuine interactive component in its browse card and matching detail, with demonstrated representative user behavior (click, hover, typing, drag, selection, keyboard, animation, scrolling, etc. as appropriate to that component). Test **actual state transitions**, not only an image, loaded iframe or responsive animation unrelated to the item.

Per-item runtime order: (1) verified official live embed where technically permitted, identity matched and sandboxed; (2) isolated, reviewed build of licensed upstream source with pinned dependencies and secure test fixtures when embed cannot work; (3) explicit pending/blocked with image+official link as an **interim visual**, never counted as interactive completion. The old image-only instruction remains the floor for identification, not the final user request. Existing source-informed fixtures remain accurately labeled.

Do not import arbitrary remote scripts into the Atlas parent or pass auth tokens/cookies. Enforce origin restrictions, sandboxing, CSP, validated iframe messages, bounded runtime resources and per-feature reviewed permissions. Record licensing, external services, inaccessible source, nonembeddable origins and unsupported frameworks as actual barriers; do not silently lower the all-component target or claim they are finished. A licensed, permitted source build is a different workflow from safe read-only screenshot capture.

The whole card navigates to the **internal Atlas detail route**; usable preview controls are independently interactive and do not activate navigation. A separate View original action opens the verified exact official component page. The registry homepage remains prominent in every pertinent header. Missing visuals or runtimes get honest, compact unavailable states, not wrong components or fake working controls.

Keep independent evidence statuses: `route-candidate` → `page-observed` → `visual-published` → `interactive-rendered` → `interaction-verified`, plus explicit `blocked` and `pending`. Preserve exact IDs, review evidence, revisions and test outcomes. Report the entire real catalog, not just successful demos; earlier 408 registries / 84,145 identities / 84,142 pending images were historical counts, not current coverage proof.

## R4. Route, contents and interaction acceptance

| Site area | Required Atlas behavior |
| --- | --- |
| Home | Own discovery/marketing shell, sectioned visual bands, correct supported links, search and meaningful actions. |
| Components / categories | Full supported category tree with group/count/active state, compact rail, filters, search, sorts, dense working preview cards, URL state, list/browse transitions. |
| Featured / Newest | Working routes and layouts, factual ordering, accurate data and hover/cards; no invented popularity or recency. |
| Templates / Themes | Distinct large specimen grids, classification, true previews, theme modes and palettes, relevant detail/preview/editor interactions. |
| Icons / shader / gradient / ASCII | Separate genuine glyph/specimen types, copy formats, motion, editing and category controls where real underlying asset data exists. |
| Library / registry directory and detail | Source-backed metadata, searchable/sortable dense cards, route hierarchy, registry component inventory and prominent official homepage. |
| Authors / profiles | Actual owner identities, contributions, profile paths and actions, without invented social/commerce statistics. |
| Component and other asset detail | Large **functional** specimen, variants, Preview/Code/Info, supported copy/prompt/install and source facts, related items, keyboard and history. |
| Shared overlays / accounts / bookmarks | Functional sidebar, filter panels, search, keyboard shortcuts, saved state, sign-in gating and error/retry states. Real account-dependent features need persisted services. |
| Atlas-specific compare/other routes | Preserve their real existing purpose while meeting the same accessible/usable UI quality bar. |

The benchmark includes filter/sidebar **contents**, layout, metadata, card click targets, details and every transition between them, not just the top-level pages. Implement all equivalent capabilities that the actual Atlas source and services can support. For unsupported reference features, maintain a visible parity gap ledger and a separately testable implementation task.

## R5. Verification and release

- Refresh the live 21st.dev reference through the PPM `design-ui-ux` profile; browse source registries through `registry-atlas-source-audit`; test Atlas through its dedicated frontend profile. Do not invent a second browser or restart the shared daemon.
- Define user journeys per route: initial, hover, action, error/empty, recovery, keyboard, mobile, direct reload and browser Back/Forward. Test responsive layouts at 390px and 1920px and intermediate width.
- Each interactive-demo claim requires before/after evidence of a component-specific gesture, correct upstream identity, sandbox/origin checks and no unexpected browser errors. A screenshot, a 200 or a functional *different* example does not pass.
- Complete reference census, Atlas route/feature census, full registry identity accounting, functional-preview ledger and parity-diff report; if any sampled/full inventory item or feature remains unverified, say so rather than claiming “everything” complete.
- Apply `pinchtab-project-work` canonical PAO check-in and nonoverlapping worker claims; read `pinchtab-profile-manager-frontend` and applicable installed PPM skills and Webcmd Design. Run focused red/green tests, `mise run verify` and `mise run browser:acceptance` plus live comparative checks. Push verified separately owned slices.

## Verified bounded observations and limitations

On 2026-10-03 a managed `design-ui-ux` session visited 15 21st.dev route/interaction states including home, Components, Buttons category, its Filter overlay, Templates, Themes, Icons, Libraries, Authors, Newest, Featured and four detail families. The Buttons Filter exposed Category, Time, Primitive library, Tailwind version, License, Library, Built with, Author and Tags; sorting exposed Recommended, Most downloaded, Most bookmarked and Newest. Component/template details contained remote preview iframes. On the Signature Pad demo, ink selection changed and the page's code file tab switched. A separate Animated Tabs preview changed Overview → Activity and its panel contents after a real click. Signature Pad pointer drawing did not register during the automated gesture; that action remains **unverified**, not proven broken or working. These are examples, not a sitewide pass.

Raw observation snapshot: `~/.local/state/registry-atlas/research/21st-dev-20261003-live-route-audit.json`. Observed site route specifics and sampling limitations: `docs/research/2026-10-03-21st-route-interaction-audit.md`.

## Engineering safeguard

A literal copy of third-party protected source/assets, fake popularity counts or unreviewed arbitrary package execution would be brittle and unsafe. Meet the user's requested **functional/visual quality bar** with Atlas's own implementation, source-backed data and isolated allowed demos. Account/commerce/publishing/editor features require real service/data/permission decisions; record their work instead of silently omitting them.

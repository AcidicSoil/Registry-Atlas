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


## R6. Implementation selection and execution gates — research reconciliation (2026-10-04)

This section converts the preview-runtime and migration decisions in the associated October 3 plan into testable design requirements. It extends R1–R5 rather than claiming those route, identity, feature or catalog acceptance criteria have been met. The source research is `/mnt/c/Users/user/Downloads/21stdev-deepresearch.md` (external to the repo), the current project research is `docs/research/2026-10-03-shared-live-preview-pipeline.md`, and the handoff conversation is `6ac08e9a-56f4-83e9-b9ef-411ae11f6589`.

### Evidence versus assumption

- Current 21st.dev publishing conventions support an authored React/TSX demo, an approved cover and optional video. The historical public 21st application used Sandpack; an observed current component used a versioned CDN iframe. The internal current compiler/bundler is **not verified** by either observation. Do not infer Sandpack or Next.js version from a historical fork.
- The shadcn `getRegistryItems` and `resolveRegistryItems` APIs provide item files, declared dependencies and styling metadata. They do **not** provide a universal executable demo, a license decision or a browser interaction proof. `addRegistryItems` modifies a project and may run only in an explicitly disposable installation test.
- The research's Next.js + React + Sandpack suggestion is a *greenfield option*, not a reason to rewrite Atlas's functioning Vite/TypeScript catalog. Preserve the existing shell, routes, registry identity model, discovery jobs, image manifest, existing preview host and published reviewed fixtures.
- The existing three historical feature-worktree heads are not competing implementations: `feat/frontend-reference-navigation` and `feat/visual-reference-previews` are ancestors of `main`; `feat/registry-traversal-patterns` has its content integrated on main by `0efe4a8`. Preserve their worktrees for provenance. Before any future edits, check current worktree/claim state rather than assuming a previous owner is active.

### Chosen runtime order

1. **Public catalog:** display indexed source metadata and verified original covers; do not launch hundreds of React compilers inside cards. Preserve entire-card internal routing and independent original-page link, keyboard access and missing-visual states. Verified published, sandboxed static demos already in cards remain valid; expansion must be bounded and measured.
2. **Public detail:** load only a reviewed, immutable, identity- and revision-matched artifact in a sandboxed iframe. Promote to `interaction-verified` only after a component-specific browser state transition. The already documented `@8bitcn` built previews are preserved, not retroactively certified for unrelated identities.
3. **Local developer experiment:** use the existing `shadcn/registry` resolver to fetch the actual item and declared transitive source. When an upstream author demo is present, prefer that demo. Otherwise use a clearly labeled, narrowly generated smoke example only when an unambiguous safe entry exists; never claim this is the author's intended design or count it as certified behavior. Sandpack may run it only after deliberate local user action, not as an automatic public gallery runtime.
4. **Future production ingestion:** version-bound official source, permission/license decision, recursive pinned dependency/alias validation, restricted isolated build worker, immutable hash output, browser behavior proof and explicit publication. A public build broker requires authentication, quotas, stricter dependency permissions, CSP and a dedicated no-cookie preview origin. Do not deploy the existing localhost service as an open code-execution endpoint.
5. **Unsupported item:** keep it searchable and navigable, retain verified image/original link when available, explain the actual reason the interactive demo is pending or blocked, and preserve source evidence for retry. Never substitute an unrelated image, URL guessed from a slug, external runtime with parent auth, or falsely interactive control.

### Small, testable source-preview contract

- Use the **exact** catalog item namespace and name. A source resolver must reject an item absent from the local official directory/catalog, an upstream item name mismatch, invalid registry URL, source path traversal or conflicting destination.
- An authored demo is an explicit entry from upstream files, not a filename-based guess that silently picks another component. For a generated smoke example with multiple named component exports, select the export exactly matching the normalized item name; if it remains ambiguous, report `component-export-unresolved` and require an authored demo.
- Dependencies loaded by a client preview must be exact versions already declared in the reviewed host dependency manifest, or the item is blocked as unreviewed/unsupported. Do not silently resolve `latest` or floating versions. Package pins alone do **not** certify source trust, browser isolation or user-visible parity.
- Retain limits on file count, source bytes, dependency specs and output bytes. Never treat arbitrary CSS/Tailwind configuration and asynchronous browser resources as automatically reproduced. A smoke example can differ materially from original appearance; preserve that warning.
- The sandbox's trust boundary must be explicit: a Sandpack iframe is a development convenience, not equivalent to the network-isolated `bwrap` compilation or a reviewed cross-origin production artifact. Raw source and dependency download must not run in the Atlas parent DOM; do not give the preview parent auth/cookies or add `allow-same-origin` to a same-origin hostile iframe.

### Verification matrix and completion definition

| Layer | Passing evidence | Failure remains visible |
|---|---|---|
| Registry discovery | All current raw registries accounted for, exact item keys, bounded stable cursor, independently observed page identity | candidate-only, stale, blocked and unresolved |
| Visual references | Exact official component surface/image, source URL and current capture evidence | absent/wrong banner never promoted |
| Source preview | Actual `shadcn` resolved files, authored-demo preference, unambiguous entry, tested pinned dependencies, no unsafe destination | unsupported exports, unreviewed packages, inconsistent source |
| Runtime interaction | A real browser action changes the **same** upstream component's state, sandbox/network reviewed, matching card/detail identity | built-only, loaded iframe and rendered-only never promoted |
| Navigation and controls | Per-route feature ledger, all observed sidebar groups, valid source-backed sorts/filters, keyboard/mobile/reload/back behavior | unavailable data and services explicitly open |
| Publication | `mise run verify`, browser acceptance, exact source manifest, changes reviewed, no active PAO claims after check-out | do not report the 408-registry/entire reference scope complete |

**Current task slice:** fix source-preview export selection and unpinned dependency fallbacks with failing tests first; do not rewrite the application framework, touch worker-owned source without reconciliation or introduce a second preview-resolver service. Next tasks are a real two-registry source/demo runtime trial, per-item visual/interaction evidence, and measured extension to compatible reviewed dependency families. Sitewide parity and the full inventory remain tracked open until separately proved.

Primary technical references: https://ui.shadcn.com/docs/registry/api-reference ; https://ui.shadcn.com/docs/registry/registry-item-json ; https://sandpack.codesandbox.io/docs/advanced-usage ; https://github.com/21st-dev/skill/blob/main/skills/21st-registry/SKILL.md ; https://html.spec.whatwg.org/multipage/iframe-embed-object.html .

## R7. Source-probe evidence and accurate blockers (2026-10-04 implementation slice)

A local, explicitly bounded probe is **not** permission to publish a component or proof of browser behavior. `tools/component-preview-host/preview-probes.mjs` uses only the official `shadcn/registry` fetch-and-resolve source path used by the opt-in developer runtime. It accepts 1–16 exact catalog identities, never installs remote packages or executes resolved source, and emits metadata only: identity, probe outcome, safe structural blocker code, reviewed-package name when applicable, and observation time. It does not persist arbitrary exception text or source code. Run, inspect, then refresh review evidence deliberately:

```bash
node tools/component-preview-host/preview-probes.mjs \
  @8bitcn/button @corecn/button @aceternity/text-generate-effect \
  @basecn/button @baselayer/button
```

An approved, reviewed observation can be stored in `tools/component-preview-host/reviews/source-preview-probes.json`. The full-catalog planner reads this report without marking a smoke example as verified:

- `source-resolved` means **unverified** source is available, not an authored or working user demo. Such an identity stays `pending` in coverage until an independent reviewed browser-interaction manifest qualifies it.
- `blocked` counts a source-size/export/dependency compatibility blocker with its bounded, safe reason; it does not create a published preview. A reviewed, interaction-verified manifest entry wins over a later or earlier source probe for the same exact identity.
- `unavailable` means a transient source-resolution failure, not a permanent block. It stays `pending`.
- Probe observations expire after 72 hours. Stale blocked identities return to the pending queue for re-probe; the summary separately reports stale probes. Re-probes must retain the original evidence history in Git when the old report is replaced.

The initial five-identity evidence run yielded two local smoke-source resolutions and three compatibility blocks (`motion`, `@base-ui/react`, and `source-file-too-large`). One of the two source-resolved identities already has a separate verified public artifact; this does not transfer verification to the new runtime. The planner reports **3 blocked**, **84,131 pending**, **10 verified upstream-built** and **one verified source-informed fixture** as of this bounded report. These counts are time-bounded evidence, not catalog-wide build proof.

The local preview service returns safe failure reason codes and reviewed-package names; the existing Atlas detail page explains the reason and leaves the official component link usable. Unknown upstream exceptions are never rendered verbatim. Do not enable `motion`, `@base-ui/react` or other package families solely from a name, because reviewing framework/React-version compatibility, licensing, stylesheet behavior and cross-origin browser interaction remains necessary. The official source resolver contract is documented at https://ui.shadcn.com/docs/registry/api-reference .

## R8. Resumable batch source inspection, not manual component enumeration (2026-10-04)

The legacy five-component probe is a debugging diagnostic only. The primary workflow is now an automatic, read-only source survey over the existing Atlas coverage ledger. It reads all 84,145 catalog identities, filters existing verified public previews, unsafe source identifiers and non-renderable types, and defaults to breadth-first selection across registries so one large registry does not monopolize early compatibility review.

Dry-run the next 32 exact identities:

    node scripts/run-preview-probe-batches.mjs --limit 32

Fetch and inspect 64 automatically selected official upstream source items (never execute upstream code):

    node scripts/run-preview-probe-batches.mjs --limit 64 --batch-size 16 --concurrency 2 --execute

The explicit full sweep is also supported, with a bounded worker pool and resumable checkpoints:

    node scripts/run-preview-probe-batches.mjs --limit all --batch-size 16 --concurrency 2 --execute

The maximum concurrency is four. The worker retries transient retrieval failures once, but does not retry deterministic source/dependency blocks within the same sweep. Every successfully finished batch is persisted and synced to the private append-only journal at ~/.local/state/registry-atlas/previews/probe-journal.jsonl before progress advances. The coverage planner automatically reconciles the latest per-item journal observations with the manually reviewed five-item record. Blocked and source-resolved probes expire after 72 hours; transient failures are eligible after 15 minutes. Published interaction-verified previews always take precedence. No private exception strings, upstream source, or executable preview artifacts are stored in this journal.

Group blockers by reason and dependency family, then review compatibility, licensing and exact versions once per recurring family. Only run source in reviewed isolated build workers and grant interaction-verified status after a component-specific browser gesture. Neither a successful fetch nor a loaded Sandpack iframe qualifies. Unknown frameworks, unsupported source identifiers and non-renderable catalog kinds stay counted, not silently erased.

During initial automated surveying, the dry-run accounted for 1,947 identities outside the safe resolver grammar and 1,108 non-renderable items. The first twelve-item focused run produced nine source resolutions and three blocks; the first sixteen-item cross-registry run produced two source resolutions and fourteen blocks. These are compatibility-triage observations, not sitewide interaction or route-parity coverage.

## R9. Compile-complete before any browser verification (2026-10-04)

The reviewed-build-verify.mjs runner now selects all cached unpublished
items under the existing policy-approved namespace, not just those with existing
interaction rules. It attempts the full selected set using the existing local
network-isolated bwrap compiler, validating original source revisions and
content-addressed bundles. Only after the entire build stage ends does one
managed PinchTab browser stage begin. The entire pass is bounded at 200 items
and it is invoked with --limit all; a registry with more cached items must
be processed in named, bounded batches.

The browser stage distinguishes:

- interaction-verified: an approved interaction contract produced an observed
  browser state transition with no browser errors; only these items may be
  promoted to upstream-built in the published manifest.
- render-verified: the browser displayed the original source component, but
  the item has no reviewed interaction rule. This is not a claim of interaction
  parity and must not enter the verified publication manifest.
- unverified: rendering, source, browser, or interaction evidence was absent
  or invalid. Do not publish.

The generic harness no longer invents a fake counter for unknown component
families. In addition to existing behavior families, the shared original-source
compiler and managed-browser verifier support dialog, dropdown-menu,
radio-group, and select. The select browser contract opens the upstream
combobox, chooses a real option, and checks the upstream value callback.

One full cached-source execution: @8bitcn contained 56 cached source items,
11 with existing published proof and 45 unpublished. All 45 were attempted
in the isolated build phase: 17 built, 28 blocked. The single browser phase
recorded four new interaction-verified components (dialog, dropdown-menu,
radio-group, select), 12 source-based render-only components and one
original-component-not-visible failure (tooltip). Only four new immutable
verified artifacts were retained in the public bundle tree; the 13
unreferenced render-only or failed public copies were removed after their
content hashes and Git-untracked status were checked. The private build cache
and browser-proof evidence were retained. This brings the manifest to
14 upstream-built interaction-verified entries plus one previously verified
source-informed fixture.

Important scope: this is a complete stage across the existing reviewed,
cached @8bitcn namespace, not 21st.dev parity across 84,145 catalog
identities. Other namespaces remain source-only or unreviewed and must be
admitted by reviewed license/dependency policies before their source is
executed. Full catalog-wide source inspection is separately automated by
R8, and complete interaction parity still requires more reviewed behavior
contracts and upstream author-demo support. Do not claim 84,145 functional
previews or promote source-only data into verified evidence.

## R10. Authentic previews only; one denominator for working coverage (2026-10-04)

Corrections superseding the earlier manually generated smoke examples and the
source-informed fixture: do not display or count invented preview visuals.
The cards omit fabricated placeholder artwork entirely when there is no real
upstream visual or executable preview. The local sandbox only accepts an
upstream-authored demo; components without one return author-demo-required
and are not displayed inside Sandpack. The shared local compiler no longer
inserts UPSTREAM PREVIEW, guessed required props, or generic fake visual
content. The manually reconstructed @8bitcn/card interaction fixture was
unpublished and its fake output file deleted. Its source record remains in
the catalog, without a preview, rather than being presented as the author's
actual component. Existing interaction-verified upstream source bundles remain
available. Source-probe records made with the now-retired generated-smoke
method are retained as provenance but treated as stale, eligible for re-probe,
not as source-resolved evidence. No claims based only on a rendered rectangle
or assistant-generated example are considered working-component proof.

Mathematical invariant: distinctItems = interactionVerified +
interactionUnverified. Both counts have the same denominator, including
non-renderable catalog records as catalog identities. pending and blocked
partition the interaction-unverified set; they are not a distinct measure
of source-fetch eligibility. 81,043 referred to a narrower source-probe
queue after its own exclusions, not to working-preview coverage. After removing
the manually invented fixture the reviewed catalog had 84,145 distinct
identities, 14 upstream interaction-verified, and 84,131 lacking such proof;
within the latter, 84,106 were pending and 25 source-probe blocked. These
numbers must never be compared to the source-probe queue as though the
quantities describe the same population. All counts are point-in-time.

## R11. Full cached-registry ingestion, shared-component linking, original browser proof (2026-10-04)

The bulk official source importer uses the existing reviewed source URL template,
requires exact source identity and bounded files, and stores upstream source JSON
without running it. In two stages it ingested the 65 uncached components of
the 121 @8bitcn catalog records; subsequent runs ingest zero unchanged items.
This is source cache coverage, not working-demo coverage.

The reviewed build adapter now links same-registry first-party component
imports through already cached official sibling source JSON. The link is
bounded to exact UI-root names and validated against the recorded source
content hash before compiler execution. A tampered sibling fails closed.
This removes duplicated per-item import registration. Whole-cached-registry
compile planning improved from 29 buildable / 91 blocked (first 120 cached)
to 73 buildable / 47 blocked (same 120 items). Builds by themselves are not
evidence of functioning components.

An expanded compile-then-browser pass on 105 previously unpublished cached
items compiled 58 and blocked 47. Real browser verification of the upstream
Tooltip using hover produced one new interaction-verified publication. A
separate real managed-browser keyboard gesture on the upstream Radix ScrollArea
moved its viewport scrollTop from 0 to 22 without browser errors and was
published only after matching the original source hash and bundle checksum.
Both new reviewed immutable artifacts are retained; unverified temporary
public build copies are removed. Existing original-source published demos
remain available.

Working preview coverage therefore improves from 14 to 16 on the fixed
84,145-item denominator: 84,127 identities still lack published interaction
proof. The cache of 121 source JSON records and count of 73 buildable
components must not be substituted for 18 actual browser interaction proofs.
Unsupported external package and Next.js blocks remain tracked, and broad
21st.dev route parity is not yet complete.

Default-exported original React blocks had been mounted under a nonexistent
named export, producing browser identity mismatch despite successful
compilation. The reviewed compiler now distinguishes a named export from
the same component's default export. A managed-browser trial loaded actual
health-bar, advanced1 and faq1 source with no browser errors. The two original
FAQ author blocks named faq1 and faq3 were compiled as a single stage and
tested only after both builds finished. Their original accordion triggers
responded to real browser clicks, each transitioning aria-expanded false
to true without errors. Both immutable source artifacts were independently
admitted and published. Their full proof is stored privately under the
Registry Atlas previews state directory. This increases working previews to
18 of 84,145, leaving 84,127 without published gesture proof; other compiled
blocks still require behavior-specific evidence, not guessed UI states.

---
title: "Registry Atlas: dedicated interactive component preview service"
slug: "dedicated-interactive-preview-service"
mode: deep
status: draft-for-review
owner: Registry Atlas
repo: registry-atlas
created: 2026-11-13
proposed_repository_path: docs/superpowers/specs/2026-11-13-dedicated-interactive-preview-service-design.md
architecture_decision: proposed
---

# Dedicated interactive component preview service

## 1. Decision and outcome

**Chosen approach: option 4.** Registry Atlas will use a separately operated backend to prepare, run, and serve genuine interactive component previews in isolated workers. The Atlas Vite application stays the catalog client. The preview service owns the component runtime, worker lifecycle, publication, and runtime health.

The feature must **not** display screenshots, thumbnails, OG images, static component depictions, image-based placeholders, or source-evidence popups as substitutes for executable previews. It must not fabricate component interactions. If a real preview cannot run, the catalog item remains navigable and explicitly reports that an interactive preview is unavailable.

**User promise:** An Atlas user opens a component and can interact with the actual matched component. The component responds to relevant pointer, keyboard, form, animation, or state-changing actions. The preview runs outside the main Atlas origin and does not gain access to Atlas credentials, filesystem, or privileged services.

**Status:** Design specification only. No new preview backend or production runtime is implemented or deployed by this document.

## 2. Existing system and reasons for replacement

The following findings were checked against the Registry Atlas repository on November 13, 2026:

- The frontend is a Vite/TypeScript application bootstrapped from `src/registry-explorer/entry.ts`.
- `entry.ts` currently loads `componentPreviews.ts` and attaches `catalogLinkPreview.ts` to display images on source-link hover/focus. `public/data/component-previews.json` holds three manually reviewed WebP examples.
- `src/registry-explorer/ui/catalogComponentsView.ts` and `itemDetailView.ts` render catalog cards and item-detail routes. They contain source-link preview attributes but no dedicated service-backed runtime.
- `scripts/check-product-contract.mjs` currently rejects `<iframe>` in catalog/detail views and lists previously retired preview-host paths. Those checks conflict with this feature and require a targeted replacement, not an unconditional removal of safety rules.
- `docs/architecture/component-visual-previews.md`, `DESIGN.md`, `docs/registry-explorer-data.md`, and portions of `docs/verification.md` describe the outdated image-preview pilot as the current approach.
- The October 3 product specification, `docs/superpowers/specs/2026-10-03-observed-reference-and-route-parity.md`, asks for actual component-specific state transitions. Its earlier image fallback does **not** survive the user's subsequent no-images decision.
- Current deployment is built around a static Vite bundle; `.github/workflows/deploy.yml` says Pages deployment is paused.
- On the inspected workstation, `bwrap --unshare-all` passed a basic namespace smoke test; Docker and Podman service checks did not respond. **A namespace smoke test is not a complete security assessment or proof that arbitrary source is safe to execute.**
- Nine existing modified worktree files were present at inspection. The implementation must preserve and reconcile those changes without resetting them.

These are repository observations, not claims about a deployed backend.

## 3. Scope and exclusions

### Required

1. Implement a separately deployable preview API and a worker-execution boundary.
2. Resolve an exact catalog identity to the actual upstream component source and compatible runtime configuration.
3. Compile and/or run that component outside Atlas; support both client-rendered and server-dependent specimens where the selected isolated runtime can support them.
4. Publish a preview only when a real browser exercise verifies at least one component-specific observable interaction appropriate to that specimen.
5. Render the same matched interactive preview on its Atlas detail route and through a deliberate action on its catalog card. Preserve internal card navigation, homepage links, source links, search, and filtering.
6. Report pending, unavailable, incompatible, and failed previews truthfully, without images or inert imitation.
7. Remove the old source-link screenshot hover feature, its frontend module/asset manifest/tests, and any active documentation or product checks that incorrectly prescribe it.
8. Provide reproducible local development, focused tests, release verification, and a safe rollback.

### Explicit non-goals

- Rebuilding Registry Atlas as a React/Next.js application.
- Treating Sandpack, WebContainers, static screenshots, generic embeds, or iframe load events as proof of working components.
- Installing arbitrary dependencies or executing unreviewed source inside the Atlas frontend or host's ordinary Node process.
- Creating a public endpoint that accepts arbitrary source code, command lines, packages, or URLs for compilation.
- Automatically claiming every catalog item is interactive; coverage must reflect actual supported components.
- Copying unrelated third-party branding/assets or replacing unrelated registry icon and theme features.
- Creating user-visible source-provenance reports, image review queues, or screenshot-capture infrastructure.

## 4. Product journey

1. The user searches Registry Atlas and opens an item using the existing internal card link.
2. If the preview service reports `ready` for that exact namespace, slug, and published revision, the item detail renders a live interactive component in its own named frame. The frame is lazy-loaded when the preview enters view or the user requests it.
3. The user changes the component through an actual relevant action. The expected component state or DOM changes. The frame remains usable from the keyboard.
4. A separate **Try component** action on supported catalog cards can open that same published preview without navigating away. It must not intercept the card's ordinary route link. Do not start hundreds of frames for an off-screen grid.
5. If the item has not been published, the interface states **Interactive preview unavailable** and keeps existing catalog/detail navigation and upstream links available. It does not substitute an image or generic demonstration.
6. If the preview API or worker fails during use, the preview area displays a failure message and a retry action only when retrying is meaningful. Reloading or revisiting never silently swaps to an unrelated specimen.

This is the proposed interaction model for review, not an implemented UI.

## 5. Architecture and ownership

```text
Existing Registry Atlas frontend (Vite, public, static)
   | GET exact identity + revision; requests ready preview URL
   v
Preview API (separate service, read-only public lookup)
   | owns preview job state, publisher decisions, health
   +----> Preview metadata store / immutable artifact catalog
   |
   +----> Operator-only ingestion scheduler / job queue
              | catalog identity -> registry source resolver
              | license + dependency compatibility review
              v
         Isolated build worker (network denied during execution)
              | actual author-provided demo when available
              | compile with locked dependencies, scoped filesystem
              v
         Isolated runtime worker (when server-side runtime is needed)
              | independently exercised in browser tests
              v
         Published preview artifact / private runtime route
              | served on distinct, credential-free preview origin
              v
       Sandboxed live iframe in Atlas detail or card overlay
```

**Responsibility map**

| Owner              | Single responsibility                                                       | Must not do                                                       |
| ------------------ | --------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Atlas frontend     | Lookup and display published preview status and frame                       | Fetch raw source or execute build commands                        |
| Preview API        | Validate public identity; serve preview metadata and published URL          | Accept arbitrary public code or trigger builds on public GET      |
| Source adapter     | Resolve registered exact item and dependencies from configured registries   | Guess a component URL from a slug; install into the Atlas repo    |
| Job scheduler      | Queue and deduplicate approved source revisions; persist outcomes           | Treat repeated or partial jobs as new published results           |
| Build worker       | Compile upstream code with compatible, pinned dependencies inside isolation | Read host secrets, modify Atlas code, access uncontrolled network |
| Runtime worker     | Serve isolated interactive, server-dependent component when required        | Share cookies, privileged APIs, or unbounded lifecycle            |
| Acceptance runner  | Execute a component-specific browser action and observe state change        | Certify solely from rendering, screenshot, or HTTP 200            |
| Artifact publisher | Expose only approved immutable artifacts/revisions                          | Serve unpublished worker outputs                                  |

**Dependency rule:** Atlas knows the preview API contract, not worker implementation. Build/runtime workers know preview job contracts, not Atlas view modules. A single shared contract owns identity, revision, and status definitions. Do not duplicate validators across adapters.

## 6. Domain model and API contracts

### Canonical identity

```ts
type PreviewIdentity = {
  namespace: string; // registered exact namespace, such as '@example'
  slug: string; // exact catalog item name
  sourceRevision: string; // content-derived revision of resolved source
};

type PreviewState =
  | { status: "ready"; identity: PreviewIdentity; url: string; mode: "client" | "server" }
  | { status: "queued" | "building" | "verifying"; identity: PreviewIdentity }
  | { status: "unavailable"; identity: PreviewIdentity; reason: PreviewReason };

type PreviewReason =
  | "not-published"
  | "missing-demo"
  | "unsupported-runtime"
  | "dependency-unavailable"
  | "permission-unresolved"
  | "worker-unavailable"
  | "verification-failed";
```

These types describe the proposed external representation. Request parsing belongs to the API boundary; validated domain objects are passed internally. More reasons can be introduced only for real observed failure families.

### Read-only public API

- `GET /v1/previews/{namespace}/{slug}` returns the most recently published **revision-matched** state for a known catalog identity. `200` can return `ready`, `queued`/`building`/`verifying`, or `unavailable`. Unknown catalog identities return `404`; infrastructure failures use appropriate `5xx` responses.
- A `ready.url` must come from the service's owned approved preview origin and identify one published revision. The browser never constructs it from catalog strings or source-host URLs.
- The public request never fetches source, starts a shell process, installs packages, or creates a build job.
- Operator-only scheduling uses an authenticated internal command or endpoint with exact catalog identities. Input is a known identity and revision, **not** untrusted arbitrary URL/source text. The choice of private CLI versus endpoint is an implementation detail because no external client needs it.
- The catalog/client may cache status only in ways that respect publication changes and revision matching. A retry of a failed lookup does not imply a new build.

### State transitions

`not-published -> queued -> building -> verifying -> ready` is the successful path. Failed resolution, incompatible dependencies, insufficient permissions, build failures, or failed interaction tests result in `unavailable` with a truthful reason. A later source revision is a separate job and cannot silently reuse an old ready artifact.

The scheduler is idempotent by `namespace + slug + sourceRevision + runtimeProfile`. A retry may resume the same job, but only publication of a fully checked artifact makes the preview `ready`.

### Persistence

Use the existing repository's PostgreSQL capability where it fits; isolate preview-owned metadata and job state from catalog ingestion ownership. The API reads catalog identity from a defined source adapter or read-only projection and writes preview job state through one owner. The artifact store is content-addressed and does not mutate published revisions. No database tables or migrations are committed until the existing deployment schema and access permissions are reviewed.

## 7. Runtime and security requirements

1. **Source intake:** Use documented official registry APIs, such as `getRegistryItems` and `resolveRegistryItems` from `shadcn/registry`, only for compatible configured registries. The API can return file contents and dependencies; it does **not** establish an authored runnable demo or license clearance. Use provider-specific adapters only when a real registry format requires one.
2. **Demo selection:** Prefer an explicit upstream-authored runnable demo. When no unambiguous runnable entry exists, classify the item as unavailable; do not generate a random button or substitute a different component. An experimental smoke harness is not a published author-equivalent preview.
3. **Dependency execution:** Resolve and lock the exact dependency graph in a controlled intake stage. No `latest` resolution during a published build. No package install in the Atlas app process. Reject unreviewed dependency families rather than permitting them silently.
4. **Worker isolation:** Workers receive a read-only input tree and scratch/output-only write access, run without host credentials, and have denied network egress during execution unless a narrowly reviewed capability requires otherwise. Enforce CPU, memory, wall-clock, process, filesystem, and concurrency budgets. Establish values using the actual workstation/target-host capacity and observed workloads; do not invent constants in this spec.
5. **Isolation implementation:** Bubblewrap is a feasible local _candidate_ because a namespace smoke test passed. Before treating it as sufficient, validate user/mount/PID/network namespaces, seccomp or equivalent syscall policy, resource control, process termination, filesystem visibility, and a hostile-code negative test. Docker/Podman availability was not proven. If adequate isolation is unavailable, **do not execute** that job. Production may use a stronger worker platform without changing the API contract.
6. **Browser boundary:** Serve previews from a dedicated origin separate from Atlas and API/admin endpoints. Default to `iframe sandbox="allow-scripts"`. Do not grant forms, popups, downloads, top navigation, or `allow-same-origin` as blanket permissions. Additional permissions require a demonstrated component capability and origin separation review. Apply CSP and restrictive frame/asset/network policies. No privileged `postMessage` interface is required for MVP; if one is introduced, check sender origin and message schema.
7. **Server-dependent components:** If the specimen genuinely needs a backend runtime, allocate an isolated runtime worker under the same lifecycle owner. It must receive no Atlas user credentials or environment secrets. Components requiring inaccessible authentication, paid external APIs, or privileged resources remain unavailable until a separately approved integration exists.
8. **Publication:** A build passing compilation is not sufficient. A browser test must mount the _matched_ component and verify an appropriate state transition through a real action. Published revisions remain immutable and can be withdrawn without making old source code run again.
9. **Public endpoint:** Avoid source ingestion, compilation, registry URL parameters, arbitrary commands, and unauthenticated build triggers on the public API. Prevent cross-origin credentials and unsolicited network access. Observability records internal reason codes without leaking source credentials, errors, or raw private logs to users.

## 8. Current file/module migration plan

**Proposed new ownership** (names are proposals, not claimed to exist):

- `services/preview/`: independent service with read-only status API and operator-only ingestion.
- `services/preview/src/`: source adapter, job state, orchestration, build/runtime worker, publication and health endpoints, grouped by responsibility rather than passthrough layering.
- `services/preview/tests/`: contract, isolation, lifecycle, idempotency, and publication tests.
- `src/registry-explorer/ui/interactivePreview.ts`: Atlas-owned integration and browser behavior for a published preview.
- `src/registry-explorer/ui/interactivePreview.stylex.ts`: styled live preview shell, unavailable state, and controlled card affordance, using existing StyleX conventions.
- A single shared preview API type contract with enforced boundary tests, located according to the project's existing import rules.

**Modify in the consuming increment:** `src/registry-explorer/entry.ts`, `catalogComponentsView.ts`, `itemDetailView.ts`, `scripts/check-product-contract.mjs`, `package.json` scripts, relevant tests, and the existing design/verification documentation. Preserve unrelated UI modifications already in the worktree.

**Retire after replacement passes:** `catalogLinkPreview.ts`, `catalogLinkPreview.stylex.ts`, `componentPreviews.ts`, `public/data/component-previews.json`, and the three WebP preview-only assets. Replace screenshot-focused unit/browser tests with service-backed interaction tests. Remove `data-preview-source-url` attributes whose sole purpose was image hovers; retain actual external source `href` behavior.

**Documentation reconciliation:** Mark `docs/architecture/component-visual-previews.md` and the October 2 image-only specification explicitly **superseded for interactive previews**, with a direct link to this document. Update active `DESIGN.md`, `docs/registry-explorer-data.md`, and `docs/verification.md` guidance. Historical verification logs may remain as labeled history; they must not be cited as current preview requirements. Update the October 3 parity specification to remove the image-fallback branch. Rewrite product-contract assertions to permit only service-controlled, appropriately sandboxed interactive frames, while continuing to reject fake/local untrusted preview surfaces.

Do not delete unrelated catalog source-page data or image assets used for registry branding, icons, or themes. The rejected _screenshot-preview eligibility pipeline_ must not be repackaged as the new runtime's gate.

## 9. Phased implementation and acceptance

### Phase A: prove the isolation and source-to-runtime path

- Build one narrow source-resolver and isolated worker proof using a catalog identity whose upstream component has an actual runnable interaction. The identity must be chosen by inspection; this spec does not invent a known-good specimen.
- Demonstrate a locked-dependency build or bounded server runtime; confirm blocked network and secrets access in the test worker.
- Exercise the real component in a browser and observe a component-specific state change.
- **Gate:** No user-facing deployment until isolation and behavior are demonstrated. The worker cannot fall back to host-process execution when isolation fails.

### Phase B: ship one complete user journey

- Add the minimal service API, durable state/publication, and a separate preview origin.
- Wire one supported component into its actual Atlas detail page and one deliberate card action.
- Test navigation, keyboard interaction, state change, unavailable state, source-link independence, direct reload, and service outage.
- **Gate:** A user can find a known supported item, operate the real component, and return to catalog without exposing the host or Atlas origin.

### Phase C: replace the legacy preview path

- Remove screenshot-only modules/assets/tests and conflicting active product-contract assertions.
- Reconcile the existing dirty tests and source changes rather than resetting them.
- **Gate:** No runtime paths load `component-previews.json` or the old hover-image module. The product-contract suite rejects screenshot substitutes and permits only validated, sandboxed service previews.

### Phase D: broaden supported catalog coverage

- Resume eligible source ingestion from existing registry identities, not guessed source URLs.
- Add runtime profiles for genuinely observed compatible component families; support server-dependent specimens when isolation and lifecycle controls permit them.
- Track actual ready/unavailable counts and worker failure categories for operational decisions, not to expose screenshot provenance in the UI.
- **Gate:** Each newly published component passes an item-specific interaction test. Coverage claims are calculated from the current catalog and cannot use historical pilot counts.

### Phase E: release operations

- Document local dev/build/test commands, service configuration, shutdown, maintenance, deploy, and rollback.
- Deploy API and preview origin only after resource policy, worker isolation, access control, and CI/security reviews pass. Static Pages alone cannot host this service.
- **Gate:** Controlled deployment proves health, isolation, runtime teardown, browser behavior, and rollback before broad exposure.

## 10. Acceptance tests and validation

| ID    | Testable expected result                                                                                                                                          |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-01 | A published preview belongs to an existing exact `namespace/slug/sourceRevision`; unknown or mismatched inputs never render a different component.                |
| AC-02 | A real browser action changes observable state in the matching component; compilation, iframe load, or idle animation alone never publishes it.                   |
| AC-03 | Browser preview content runs on a separate origin with reviewed iframe sandbox permissions and cannot read Atlas cookies or DOM.                                  |
| AC-04 | An isolated worker cannot read host secrets, escape its designated filesystem, or reach prohibited network destinations; insufficient isolation blocks execution. |
| AC-05 | A public status lookup never starts a worker or accepts arbitrary registry URL/source content.                                                                    |
| AC-06 | Repeated ingestion of the same revision converges to one published result; failed and abandoned builds never become ready.                                        |
| AC-07 | The card's internal route, copy button, homepage/source links, search, filters, and item details retain their previous behaviors.                                 |
| AC-08 | The card preview action and detail preview are keyboard usable; unavailable states are readable and do not pretend to be working controls.                        |
| AC-09 | No screenshot, WebP preview, thumbnail manifest, OG image fallback, image hover popup, or substitute demo appears in the interactive-preview feature.             |
| AC-10 | Worker crashes, resource exhaustion, stale revisions, service outage, and runtime teardown produce truthful state; Atlas remains navigable.                       |
| AC-11 | Existing source-only/branding imagery and unrelated historical audit records are not inadvertently deleted or rewritten.                                          |
| AC-12 | Product-contract assertions, typecheck, lint, unit/service integration tests, production build, and browser interaction acceptance pass for the affected release. |

**Existing commands to run for affected frontend work:**

```bash
pnpm lint
pnpm typecheck
pnpm typecheck:test
pnpm test:local
pnpm check:product-contract
pnpm build
```

**Existing browser test runner:** `pnpm exec e2e run <affected-test-file>`. The preview service must add its own named, actually runnable `lint`, `test`, and `build` commands, then wire them into the project-standard `mise`/package task coverage. Do not claim a proposed script exists or has passed. Run a controlled local security negative test against the real selected worker runner before any public enablement.

**Review focus:** host credential leakage, network escape, bypassed review through source drift, cross-origin frame messaging, job replay, resource exhaustion, and misleading interactive claims.

## 11. Rollout, recovery, and rollback

- Ship the service separately. Start with one approved interactive item and a fail-closed public lookup. Do not broadly enable workers until Phase A and B pass.
- Only publish immutable revision-specific artifacts after build and interaction verification. Allow publication withdrawal without deleting catalog rows.
- Deploy API/worker configuration independently of Atlas Vite UI. A preview service outage must not break catalog browsing or source navigation.
- Migration removes the image-hover system only when the working replacement is verified. If a release fails, disable service-backed preview exposure and show text-only unavailability; **never restore screenshot fallback as a substitute for functioning previews**.
- Do not rewrite Git history, reset unrelated dirty files, modify global git hooks, or assume host deployment permission from approval of this document.

## 12. Decisions and unresolved dependencies

**Decided by user:** dedicated service (option 4), interactive actual components, no preview images, no screenshot/evidence-based preview system, no fake controls. Old preview-only image requirements are superseded.

**Proposed engineering choices requiring ADR review:** server-owned preview lifecycle, separate origin, read-only public API, operator-only intake, immutable revision publication, and strict isolation before executing third-party code. See companion **Proposed ADR: dedicated preview service and isolation boundary**.

**Implementation-time facts to establish:** viable production worker platform and resource controls; exact deployment host/origins; suitable first real authored-demo component; actual legal/permission conditions for selected source; the existing PostgreSQL schema/access boundary; and any framework-specific runtime profiles. These are feasibility checks, not invitations to invent an all-framework compiler or postpone the first user-visible slice indefinitely.

### ADR gate

- ADR required: **yes**, because service ownership, execution security, and deployment boundaries change.
- Existing ADRs consulted: no clearly established preview-service ADR found in the inspected repository; prior October 3 specification addresses functional parity but is not a deployment/security ADR.
- New ADR draft: `dedicated-preview-service-and-isolation-boundary` (companion draft).
- Supersedes: image-preview and all-iframe-prohibition policies **only in the preview feature**; unrelated security bans remain.
- Implementation blocked until ADR accepted: **yes**. The user approved option 4, but the complete reviewed security/deployment decision has not yet been accepted as a persisted ADR.

## 13. Source challenge and verification status

Sources consulted: current Registry Atlas `entry.ts`, `catalogComponentsView.ts`, `itemDetailView.ts`, `scripts/check-product-contract.mjs`, `.github/workflows/deploy.yml`, product and architecture documentation; current official `shadcn/registry` API reference (https://ui.shadcn.com/docs/registry/api-reference); MDN iframe sandbox guidance (https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe); Bubblewrap command and security options (https://github.com/containers/bubblewrap).

- Confirmed: shadcn's documented source APIs return registry item files and dependencies. They do **not** certify a functioning authored demo.
- Confirmed: iframe sandbox permissions are not interchangeable with operating-system worker isolation. Separating the preview origin is required for the proposed trust boundary.
- Challenged and rejected: retrofitting the old image evidence pipeline, extending three WebPs, claiming a successfully loaded iframe is an interactive preview, and allowing public arbitrary-code execution.
- Not verified: a production-ready worker sandbox, runtime resource budgets, source licenses, deployed preview origin, service operations, or end-to-end live component acceptance. No implementation success is claimed.

## 14. Completion rule

This feature is done only when the existing app can display an actual source-matched interactive component via a dedicated service, the server-side worker boundary has passed the stated negative security and lifecycle tests, the old image-preview system has been retired, and the affected lint/typecheck/test/build/browser checks pass. Partial framework/catalog coverage stays visible and is never called complete coverage.

**Persistence:** Saved in the Registry Atlas repository for later review. This draft does not authorize implementation or accept the companion proposed ADR at `docs/adr/0001-dedicated-preview-service-isolation.md`.

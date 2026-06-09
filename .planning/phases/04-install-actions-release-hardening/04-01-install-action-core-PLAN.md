---
phase: 04-install-actions-release-hardening
plan: 04-01-install-action-core
type: implementation
wave: 1
depends_on: []
files_modified:
  - src/registry-explorer/core/installActions.ts
  - src/registry-explorer/core/installQueue.ts
  - src/registry-explorer/core/registry.schema.ts
  - src/registry-explorer/core/discovery.ts
  - src/registry-explorer/core/registryProfile.ts
  - src/registry-explorer/core/index.ts
  - tests/registry-explorer/installActions.test.ts
  - tests/registry-explorer/installQueue.test.ts
  - tests/registry-explorer/discovery.test.ts
  - tests/registry-explorer/registryProfile.test.ts
autonomous: true
requirements: [INST-01, INST-02, INST-04, INST-05, INST-06]
must_haves:
  truths:
    - "D-01: Only validated namespace + item pairs with a known route are eligible for copyable install/inspect actions."
    - "D-02: Single-item install command syntax is exactly `npx shadcn@latest add @<registry>/<item>`."
    - "D-03: Single-item inspect command syntax is exactly `npx shadcn@latest view @<registry>/<item>`."
    - "D-04: Inferred, unavailable, incomplete, or invalid candidates must show disabled actions with a clear reason instead of producing guessed commands."
    - "D-05: Command-generation logic must be pure and tested independently from DOM rendering."
    - "D-06: Queue only validated route-eligible items."
    - "D-07: Deduplicate queued items by the full install token: `@<registry>/<item>`."
    - "D-08: Batch command format is `npx shadcn@latest add @foo/button @bar/card` with deduped tokens after `add`."

---

<objective>
Create pure, DOM-free install action primitives for exact shadcn `add` and `view` command generation, route-bound eligibility, disabled reasons, and deduped batch queue commands. Discovery/profile view models should expose enough action state for later UI integration without renderers guessing eligibility.
</objective>

<must_haves>
- D-01: Only validated namespace + item pairs with a known route are eligible for copyable install/inspect actions.
- D-02: Single-item install command syntax is exactly `npx shadcn@latest add @<registry>/<item>`.
- D-03: Single-item inspect command syntax is exactly `npx shadcn@latest view @<registry>/<item>`.
- D-04: Inferred, unavailable, incomplete, or invalid candidates return disabled states with clear reasons.
- D-05: Command-generation logic remains pure and tested independently from DOM rendering.
- D-06: Queue helpers accept only validated route-eligible items/tokens.
- D-07: Queue deduplication key is the full install token `@<registry>/<item>`.
- D-08: Batch command format is exactly `npx shadcn@latest add @foo/button @bar/card` with deduped tokens after `add`.
- Do not execute shadcn CLI commands in browser or tests; generated commands are strings for copy only.
- Normalize registry namespaces to exactly one leading `@`; never emit `@@registry/item`.
- Fallback candidates from tag/alias/focus/namespace/description are not command eligible.
</must_haves>

<threat_model>
- Assets: user clipboard command text, local machine safety, app integrity, and trust boundary around community registry metadata.
- Threats: command injection through namespace/item strings; guessed install commands for inferred data; double-`@` malformed tokens; unsafe route/template data bypassing validation; endorsement implications from enabling installs for unverified third-party code.
- Controls: strict token validation, `resolveRegistryItemRoute()` reuse, routeEligible gate, exact command templates, explicit disabled reasons, DOM-free unit tests, no runtime CLI execution, neutral copy that recommends inspect-before-install.
- High severity gate: if any generated command can include shell metacharacters, whitespace, protocol text, unresolved template data, or a non-route-eligible/fallback item, stop implementation and fix before proceeding.
</threat_model>

<tasks>
<task id="T1" title="Add pure install action state and command generation">
  <read_first>
    - .planning/phases/04-install-actions-release-hardening/04-CONTEXT.md
    - .planning/phases/04-install-actions-release-hardening/04-RESEARCH.md
    - .planning/phases/04-install-actions-release-hardening/04-PATTERNS.md
    - src/registry-explorer/core/itemRoutes.ts
    - src/registry-explorer/core/registry.schema.ts
    - tests/registry-explorer/itemRoutes.test.ts
  </read_first>
  <action>
    Create `src/registry-explorer/core/installActions.ts` with exported pure identifiers for install token/action state, including `buildInstallToken`, `buildSingleInstallCommand`, `buildInspectCommand`, `getInstallActionState`, and `buildBatchInstallCommand`. Reuse `resolveRegistryItemRoute()` for template/route availability rather than duplicating URL safety rules. If shared types are needed by discovery/profile/UI, add named interfaces/unions to `src/registry-explorer/core/registry.schema.ts` or export them from `installActions.ts` and re-export through `src/registry-explorer/core/index.ts`.
  </action>
  <verify>
    Run `pnpm typecheck` and targeted `pnpm test -- tests/registry-explorer/installActions.test.ts` after tests exist.
  </verify>
  <acceptance_criteria>
    - `buildSingleInstallCommand('@8bitcn/button')` returns exactly `npx shadcn@latest add @8bitcn/button`.
    - `buildInspectCommand('@8bitcn/button')` returns exactly `npx shadcn@latest view @8bitcn/button`.
    - `buildInstallToken('@8bitcn', 'button')` and `buildInstallToken('8bitcn', 'button')` both produce `@8bitcn/button`, and no test can produce `@@`.
    - Invalid namespace, missing slug, invalid slug, missing mirror/template, invalid URL/template, non-route-eligible item, and fallback/inferred candidate inputs all return disabled action states with non-empty reason strings and no commands.
  </acceptance_criteria>
</task>

<task id="T2" title="Add pure queue transforms and batch command state">
  <read_first>
    - src/registry-explorer/core/installActions.ts
    - src/registry-explorer/core/discovery.ts
    - tests/registry-explorer/discovery.test.ts
    - .planning/phases/04-install-actions-release-hardening/04-PATTERNS.md
  </read_first>
  <action>
    Create `src/registry-explorer/core/installQueue.ts` with pure queue operations such as `addToInstallQueue`, `removeFromInstallQueue`, `clearInstallQueue`, `dedupeInstallTokens`, and a batch command state builder that delegates to `buildBatchInstallCommand`. Model queue entries by full validated token plus user-facing label/registry/item metadata needed by the UI; reject or ignore disabled action states.
  </action>
  <verify>
    Run `pnpm typecheck` and `pnpm test -- tests/registry-explorer/installQueue.test.ts`.
  </verify>
  <acceptance_criteria>
    - Adding the same `@registry/item` twice leaves exactly one queue entry.
    - Adding `@foo/button` and `@bar/button` leaves two entries because dedupe is by full token.
    - Removing by token removes only that token; clear returns an empty array.
    - Empty queue batch state is disabled/no-command; non-empty queue emits exact `npx shadcn@latest add <deduped tokens...>` preserving first-add order.
  </acceptance_criteria>
</task>

<task id="T3" title="Expose shared action state on discovery and profile view models">
  <read_first>
    - src/registry-explorer/core/installActions.ts
    - src/registry-explorer/core/discovery.ts
    - src/registry-explorer/core/registryProfile.ts
    - src/registry-explorer/core/registry.schema.ts
    - tests/registry-explorer/discovery.test.ts
    - tests/registry-explorer/registryProfile.test.ts
  </read_first>
  <action>
    Update `searchComponentCandidates()`/`buildItemCandidate()` and `buildRegistryProfile()`/`itemRow()` to attach a common install action state or enough stable fields for shell/UI to render the same enabled/disabled install, inspect, queue, and raw route behavior. Ensure item candidates call `getInstallActionState()` with registry namespace, item slug, routeEligible, mirror/template, and route context; fallback candidates explicitly receive a disabled reason such as inferred/fallback candidate. Keep deterministic ranking and current profile sections intact.
  </action>
  <verify>
    Run `pnpm test -- tests/registry-explorer/discovery.test.ts tests/registry-explorer/registryProfile.test.ts tests/registry-explorer/installActions.test.ts` and `pnpm typecheck:test`.
  </verify>
  <acceptance_criteria>
    - A known item candidate with valid route data includes enabled install and inspect command strings and a token.
    - A fallback candidate includes disabled action state with a clear reason and no command strings.
    - Profile item rows expose action eligibility equivalent to discovery candidates for the same registry/item.
    - Existing Phase 3 assertions for coverage labels, match reasons, and route links still pass.
  </acceptance_criteria>
</task>
</tasks>

<verification>
- `pnpm typecheck`
- `pnpm typecheck:test`
- `pnpm test -- tests/registry-explorer/installActions.test.ts tests/registry-explorer/installQueue.test.ts tests/registry-explorer/discovery.test.ts tests/registry-explorer/registryProfile.test.ts`
- Confirm no production code imports DOM globals in `src/registry-explorer/core/installActions.ts` or `src/registry-explorer/core/installQueue.ts`.
</verification>

<success_criteria>
- Pure core logic satisfies INST-01, INST-02, INST-04, INST-05, and INST-06 without UI side effects.
- Command and queue tokens are exact, validated, deduped, and independently tested.
- Discovery/profile data now carry explicit action state so later renderers do not infer install eligibility from labels.
</success_criteria>

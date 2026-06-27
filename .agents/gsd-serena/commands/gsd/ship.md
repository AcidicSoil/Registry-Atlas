---
name: gsd:ship
description: "Use when operating the ship bridge command in a bridge-installed target project and needing source-informed GSD-safe procedural guidance."
promptsnippets:
  command: "gsd-serena-bridge ship --format markdown"
  variables:
    []
  slashAliases:
    - "/gsd:ship"
  skillReferences:
    - ".agents/gsd-serena/commands/gsd/ship.md"
---

<!-- generated-by: pnpm gen:bridge-commands -->

# Create PR, run review, and prepare for merge after verification passes

## Purpose

This is the bridge command Markdown artifact for `gsd-command-ship`. Vendor GSD-core commands are Markdown files; this generated file keeps that model as the first-class command artifact. Command `SKILL.md` outputs are intentionally not generated; command Markdown is the command runtime authority.

## Bridge Adaptation Overlay

Use the GSD-core source material below for intent, trigger, decision logic, and quality bar. Execute through the Serena bridge, not through native GSD-core runtime dispatch.

### Command Mapping

- Native slash command intent maps to: `gsd-serena-bridge ship --format markdown`.

### Runtime Substitutions

- Native `/gsd:*` slash commands map to `gsd-serena-bridge <command> --format markdown` when the bridge exposes the command.
- Native `gsd_run query ...` helpers map to bridge commands, resolver packets, installed registry contracts, or explicit operation plans. Do not invent a missing query result.
- Native `Agent(...)` / subagent dispatch maps to installed GSD agent contracts under `.agents/gsd-serena/agents/**`, vendor-shaped GSD runtime skills under `.agents/gsd-serena/skills/gsd-*/SKILL.md`, Serena role passes, or explicit checkpoints.
- Native Skill references map to vendor-shaped GSD runtime skills under `.agents/gsd-serena/skills/gsd-*/SKILL.md`, GSD references under `.agents/gsd-serena/gsd-core/references/**`, and workflow runbooks under `.agents/gsd-serena/workflows/**`.
- Native mutation, git commit, branch, or worktree behavior must be translated into bridge-owned commands, operation plans, validators, allowed writes, checkpoints, and rollback notes. Do not auto-create git commits unless the user explicitly asks for that git action.


### Execution Rule

Proceed through the bridge entrypoint or resolver, then follow bridge output exactly. Treat adapted-safe behavior as intentionally safe substitution, not native parity.

## Preflight

Run this from the target project root unless the user is explicitly asking about the bridge source repository.

1. Check setup and current direction when the session is new or setup freshness is unclear:

   ```bash
   gsd-serena-bridge bootstrap --format markdown
   ```

2. If bootstrap or doctor reports stale/broken bridge-owned install-managed surfaces, automatically repair and recheck before continuing:

   ```bash
   gsd-serena-bridge repair --format markdown
   gsd-serena-bridge doctor --format markdown
   ```

3. Repair is limited to bridge-owned installed surfaces such as `.agents/gsd-serena/**`, bridge `.serena/**` setup, and managed bridge blocks in `AGENTS.md` / `.gitignore`.
4. Do not treat repair as permission to overwrite user-owned `.planning/STATE.md`, native `.gsd/**`, or product files.
5. Status decision for this command artifact: Proceed through the bridge entrypoint or resolver, then follow bridge output exactly. Treat adapted-safe behavior as intentionally safe substitution, not native parity.

## Procedure

1. Read the GSD Source Translation below first. Extract the native trigger, purpose, required reading, process steps, and completion criteria.
2. Apply the Bridge Adaptation Overlay above before executing anything.
3. Restate the user's goal in one sentence and map it to this command: `ship`.
4. Complete the preflight above. If repair was needed, rerun doctor before continuing.
5. Read required inputs before writing anything. Required reads for this command:
   - `.planning/phases/<phase>/<phase-number>-UAT.md`
   - `.planning/phases/<phase>/UAT.md`
6. If the user's request is natural-language or ambiguous, run resolver first and use the returned packet/command:

   ```bash
   cat <<'EOF_REQUEST' | gsd-serena-bridge resolve --stdin --format markdown
   <verbatim user request>
   EOF_REQUEST
   ```

7. Run or prepare the implemented bridge command from the project root:

   ```bash
   gsd-serena-bridge ship --format markdown
   ```

   If the command needs arguments, inspect `gsd-serena-bridge ship --help` or use the resolver packet instead of guessing.
8. Follow the command output, packet, and next-action instructions. If a packet is produced, obey its allowed writes, forbidden writes, required reads, expected artifacts, validation command, and transition rule.
9. Do not mutate files outside this command artifact's boundaries unless bridge output explicitly authorizes it or the user gives a narrow override with validation.

## Decision Flow

- If status is `supported` or `adapted-safe`: use the bridge entrypoint/resolver and report the bridge command or substitute actually used.
- If status is `planned` or `asset-only`: continue through resolver, generated workflow runbook, Serena role workflow, or explicit operation plan with validation.
- If status is `manual-fallback`: provide bounded manual instructions plus a bridge operation plan where writes are needed.
- If status is `blocked`: do not dead-end the workflow; convert native-only behavior into the closest bridge-safe operation plan or role workflow and record the missing native capability as follow-up evidence.
- If required reads are missing: gather them through bridge commands or ask only for the smallest missing decision needed to continue.
- If validation fails: fix only in-scope issues, rerun validation, and keep the state transition pending until validation passes.

## Validation and Completion

Run the declared validation commands after in-scope work:
- `gsd-serena-bridge validate ship --phase <phase> --format json`

Before reporting done, include:

- the GSD source translation sections used;
- the bridge command, resolver packet, operation plan, or role workflow used;
- files read and changed;
- validation commands and outcomes;
- state transition status, if any;
- remaining adapted-safe gaps or native GSD behavior not implemented by the bridge.

## Recovery

- Setup stale or broken: run repair, then doctor, then bootstrap/state-next before continuing.
- Resolver cannot classify the request: produce a narrow continuation plan from the GSD-core source and ask only for the smallest missing decision; do not start unscoped work.
- Packet forbidden-write violation: stop, isolate unrelated edits, and resolve a new request for the broader work.
- Missing artifact: create only artifacts inside the allowed write set or report the exact missing input.
- Native GSD behavior requested but not implemented: execute the bridge substitute through a command, workflow runbook, role workflow, or explicit operation plan; cite the contract status `adapted-safe`, explain the safe bridge substitute, and record a future parity slice.

## Boundaries

### Required Reads

- `.planning/phases/<phase>/<phase-number>-UAT.md`
- `.planning/phases/<phase>/UAT.md`

### Allowed Writes

- `.planning/phases/<phase>/shipping/**`

### Forbidden Writes

- `.git/**`
- `.github/**`
- `node_modules/**`
- `vendor/**`

### Expected Created Artifacts

- `.planning/phases/<phase>/shipping/DIRECT_MAIN_SHIP.md`
- `.planning/phases/<phase>/shipping/RELEASE_NOTES.md`
- `.planning/phases/<phase>/shipping/ROLLBACK.md`

### Expected Updated Artifacts

- `.planning/phases/<phase>/shipping/** when handoff evidence changes`

### Optional Artifacts

- none

## Runtime Capability

- Runtime status: `destructive-with-confirmation`
- Contract row: `command:ship`
- Test fixture path: `tests/fixtures/runtime-capability/commands/ship`
- Required command: `gsd-serena-bridge ship --format markdown`
- Dry-run command: `gsd-serena-bridge ship --format markdown`
- Apply command: `gsd-serena-bridge ship --phase <phase> --apply --confirm-local-git --confirm-external --format markdown`
- Read actions:
- `.planning/STATE.md`
- `.planning/ROADMAP.md`
- `.planning/phases/<phase>/**`
- Write actions:
- `local git fixture state`
- `.planning/.bridge/**`
- External actions:
- `adapter-gated external service or reviewer interaction`
- Git actions:
- `adapter-gated local git operation with dry-run/apply/rollback requirements`
- GitHub actions:
- `adapter-gated GitHub issue/PR/label/comment operation`
- Agent actions:
- none
- Runtime validation commands:
- `pnpm vitest run tests/gsd-serena/runtime-capability/ship.test.ts`

## GSD Source Translation

The source-derived guidance below is translated for the Serena bridge. Native runtime locator code, shim functions, direct `gsd-tools.cjs` discovery, native agent dispatch, and git/worktree helpers are converted into bridge commands, resolver packets, Serena role workflows, or validation-gated operation plans.

### vendor-command

Recorded path: `vendor/reference/gsd-core/commands/gsd/ship.md`; resolved path: `vendor/reference/gsd-core/commands/gsd/ship.md`.

<objective>
Bridge local completion → merged PR. After `gsd-serena-bridge verify-work --format markdown` passes, ship the work: push branch, create PR with auto-generated body, optionally trigger review, and track the merge.

Closes the plan → execute → verify → ship loop.
</objective>

<execution_context>
- GSD-core workflow import retained: `@~/.claude/gsd-core/workflows/ship.md`. Use the mirrored bridge workflow runbook under `.agents/gsd-serena/workflows/**` for adapted execution.
</execution_context>

Execute the ship workflow from @~/.claude/gsd-core/workflows/ship.md end-to-end.

### bridge-command-contract

Recorded path: `.agents/gsd-serena/commands/ship.json` could not be resolved in the committed vendor reference.

_No readable source content available._

## Contract Reference

- Contract ID: `gsd-command-ship`
- Family: `command`
- Status: `adapted-safe`
- Runtime authority: `.agents/gsd-serena/parity-skills/contracts.json`
- Transition rule: transition shipping-ready -> shipped; requires validation: yes

### Bridge Entrypoints

- `ship`

### Source Evidence

- `vendor/reference/gsd-core/commands/gsd/ship.md` (vendor-command) -> `vendor/reference/gsd-core/commands/gsd/ship.md`
- `.agents/gsd-serena/commands/ship.json` (bridge-command-contract)

### Unsafe Reference Behaviors

- none recorded

### Test Evidence

- Status: `focused-test`
- Commands:
- `pnpm vitest run tests/gsd-serena/integration/ship-parity.test.ts tests/gsd-serena/commands/ship-apply.test.ts`
- Notes: Focused tests assert default readiness packet behavior and confirmed push/PR apply behavior.

### Notes

- Native GSD ship pushes the current branch, creates a PR with generated body, optionally requests review, and tracks merge after verification passes.
- Bridge ship now has a confirmed --apply path for push and PR creation with --confirm-local-git and --confirm-external gates.
- Default ship remains readiness/packet preparation and must not claim external actions executed.
- Optional review request and merge tracking remain follow-up parity work.

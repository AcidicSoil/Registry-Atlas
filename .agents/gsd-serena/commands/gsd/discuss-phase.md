---
name: gsd:discuss-phase
description: "Use when operating the discuss-phase bridge command in a bridge-installed target project and needing source-informed GSD-safe procedural guidance."
promptsnippets:
  command: "gsd-serena-bridge discuss-phase {{phase}} --format markdown"
  variables:
    - name: "phase"
      required: false
      placeholder: "{{phase}}"
      description: "Phase directory name."
  slashAliases:
    - "/gsd:discuss-phase"
  skillReferences:
    - ".agents/gsd-serena/commands/gsd/discuss-phase.md"
---

<!-- generated-by: pnpm gen:bridge-commands -->

# Gather phase context through adaptive questioning before planning.

## Purpose

This is the bridge command Markdown artifact for `gsd-command-discuss-phase`. Vendor GSD-core commands are Markdown files; this generated file keeps that model as the first-class command artifact. Command `SKILL.md` outputs are intentionally not generated; command Markdown is the command runtime authority.

## Bridge Adaptation Overlay

Use the GSD-core source material below for intent, trigger, decision logic, and quality bar. Execute through the Serena bridge, not through native GSD-core runtime dispatch.

### Command Mapping

- Native slash command intent maps to: `gsd-serena-bridge discuss-phase --format markdown`.

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
3. Restate the user's goal in one sentence and map it to this command: `discuss-phase`.
4. Complete the preflight above. If repair was needed, rerun doctor before continuing.
5. Read required inputs before writing anything. Required reads for this command:
   - `.planning/PROJECT.md`
   - `.planning/REQUIREMENTS.md`
   - `.planning/ROADMAP.md`
   - `.planning/STATE.md`
6. If the user's request is natural-language or ambiguous, run resolver first and use the returned packet/command:

   ```bash
   cat <<'EOF_REQUEST' | gsd-serena-bridge resolve --stdin --format markdown
   <verbatim user request>
   EOF_REQUEST
   ```

7. Run or prepare the implemented bridge command from the project root:

   ```bash
   gsd-serena-bridge discuss-phase --format markdown
   ```

   If the command needs arguments, inspect `gsd-serena-bridge discuss-phase --help` or use the resolver packet instead of guessing.
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
- `gsd-serena-bridge validate discuss-phase --phase <phase> --format json`

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

- `.planning/PROJECT.md`
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
- `.planning/STATE.md`

### Allowed Writes

- `.planning/phases/<phase>/CONTEXT.md`

### Forbidden Writes

- `.git/**`
- `.github/**`
- `node_modules/**`
- `vendor/**`

### Expected Created Artifacts

- `.planning/phases/<phase>/CONTEXT.md`

### Expected Updated Artifacts

- `.planning/phases/<phase>/CONTEXT.md when discussion decisions change`

### Optional Artifacts

- none

## Runtime Capability

- Runtime status: `local-equivalent`
- Contract row: `command:discuss-phase`
- Test fixture path: `tests/fixtures/runtime-capability/commands/discuss-phase`
- Required command: `gsd-serena-bridge discuss-phase --format markdown`
- Dry-run command: `gsd-serena-bridge discuss-phase --format markdown`
- Apply command: `gsd-serena-bridge discuss-phase --write --format markdown`
- Read actions:
- `.planning/STATE.md`
- `.planning/ROADMAP.md`
- `.planning/phases/<phase>/**`
- Write actions:
- `.planning/phases/<phase>/**`
- External actions:
- none
- Git actions:
- none
- GitHub actions:
- none
- Agent actions:
- none
- Runtime validation commands:
- `pnpm vitest run tests/gsd-serena/runtime-capability/discuss-phase.test.ts`

## GSD Source Translation

The source-derived guidance below is translated for the Serena bridge. Native runtime locator code, shim functions, direct `gsd-tools.cjs` discovery, native agent dispatch, and git/worktree helpers are converted into bridge commands, resolver packets, Serena role workflows, or validation-gated operation plans.

### vendor-command

Recorded path: `vendor/reference/gsd-core/commands/gsd/discuss-phase.md`; resolved path: `vendor/reference/gsd-core/commands/gsd/discuss-phase.md`.

### Native Shim Translation
- Native GSD shim locator omitted: the bridge uses the installed `gsd-serena-bridge` CLI, `bootstrap`, `doctor`, `repair`, resolver packets, and install-managed project surfaces instead of locating `gsd-tools.cjs`.

<objective>
Extract implementation decisions that downstream agents need — researcher and planner will use CONTEXT.md to know what to investigate and what choices are locked.

**How it works:**
1. Load prior context (PROJECT.md, REQUIREMENTS.md, STATE.md, prior CONTEXT.md files)
2. Scout codebase for reusable assets and patterns
3. Analyze phase — skip gray areas already decided in prior phases
4. Present remaining gray areas — user selects which to discuss
5. Deep-dive each selected area until satisfied
6. Create CONTEXT.md with decisions that guide research and planning

**Output:** `{phase_num}-CONTEXT.md` — decisions clear enough that downstream agents can act without asking the user again
</objective>

<execution_context>
Workflow files are loaded on-demand in the <process> section below — not upfront.
Do not pre-load any workflow files before reading the mode routing instructions.
</execution_context>

<runtime_note>
**Copilot (VS Code):** Use `vscode_askquestions` wherever this workflow calls `AskUserQuestion`. They are equivalent — `vscode_askquestions` is the VS Code Copilot implementation of the same interactive question API.
</runtime_note>

<context>
Phase number: $ARGUMENTS (required)

Context files are resolved in-workflow using `init phase-op` and roadmap/state tool calls.
</context>

<process>
**Mode routing:**
```bash
- Native query translated: `DISCUSS_MODE=$(gsd_run query config-get workflow.discuss_mode 2>/dev/null || echo "discuss")` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
```

If `--assumptions` is in $ARGUMENTS:
Read and execute `~/.claude/gsd-core/workflows/list-phase-assumptions.md` end-to-end.
Stop here.

Otherwise, if `DISCUSS_MODE` is `"assumptions"`:
Read and execute `~/.claude/gsd-core/workflows/discuss-phase-assumptions.md` end-to-end.

Otherwise (`"discuss"` / unset / any other value):
Read and execute `~/.claude/gsd-core/workflows/discuss-phase.md` end-to-end.

**MANDATORY:** Read the appropriate workflow file BEFORE taking any action. The objective and success_criteria sections in this command file are summaries — the workflow file contains the complete step-by-step process with all required behaviors, config che...

**Lazy loading:** `templates/context.md` is loaded inside the `write_context` step of the active workflow. `discuss-phase-power.md` is loaded inside `discuss-phase.md` when `--power` is detected. Do not load either here.
</process>

<success_criteria>
- Prior context loaded and applied (no re-asking decided questions)
- Gray areas identified through intelligent analysis
- User chose which areas to discuss
- Each selected area explored until satisfied
- Scope creep redirected to deferred ideas
- CONTEXT.md captures decisions, not vague vision
- User knows next steps
</success_criteria>

### bridge-command-contract

Recorded path: `.agents/gsd-serena/commands/discuss-phase.json` could not be resolved in the committed vendor reference.

_No readable source content available._

## Contract Reference

- Contract ID: `gsd-command-discuss-phase`
- Family: `command`
- Status: `adapted-safe`
- Runtime authority: `.agents/gsd-serena/parity-skills/contracts.json`
- Transition rule: transition planned -> phase-context-ready; requires validation: yes

### Bridge Entrypoints

- `discuss-phase`

### Source Evidence

- `vendor/reference/gsd-core/commands/gsd/discuss-phase.md` (vendor-command) -> `vendor/reference/gsd-core/commands/gsd/discuss-phase.md`
- `.agents/gsd-serena/commands/discuss-phase.json` (bridge-command-contract)

### Unsafe Reference Behaviors

- none recorded

### Test Evidence

- Status: `focused-test`
- Commands:
- `gsd-serena-bridge validate discuss-phase --phase <phase> --format json`
- Notes: Exact command behavior comes from bridge behavior contracts.

### Notes

- Bridge discuss-phase reports local readiness and now mirrors interactive/all/auto/chain/batch/analyze/text/power/assumptions modes as instruction guidance.
- Vendor discussion intent is mirrored through question, assumption, gray-area, decision, and CONTEXT.md write-set guidance without automatic interactive prompts, checkpoints, or artifact writes; agent intent maps to Serena role workflows.
- Bridge discuss-phase now includes a structured Serena phase-workflow operation plan with shell/test commands, phase artifact write-set, checkpoints, validation, rollback, and role workflow evidence while preserving existing safety gates.

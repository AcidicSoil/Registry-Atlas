---
name: gsd:sketch
description: "Use when operating the sketch bridge command in a bridge-installed target project and needing source-informed GSD-safe procedural guidance."
promptsnippets:
  command: "gsd-serena-bridge sketch {{idea}} --format markdown"
  variables:
    - name: "idea"
      required: false
      placeholder: "{{idea}}"
      description: "Optional sketch idea."
  slashAliases:
    - "/gsd:sketch"
  skillReferences:
    - ".agents/gsd-serena/commands/gsd/sketch.md"
---

<!-- generated-by: pnpm gen:bridge-commands -->

# Sketch UI/design ideas with throwaway HTML mockups, or propose what to sketch next (frontier mode)

## Purpose

This is the bridge command Markdown artifact for `gsd-command-sketch`. Vendor GSD-core commands are Markdown files; this generated file keeps that model as the first-class command artifact. Command `SKILL.md` outputs are intentionally not generated; command Markdown is the command runtime authority.

## Bridge Adaptation Overlay

Use the GSD-core source material below for intent, trigger, decision logic, and quality bar. Execute through the Serena bridge, not through native GSD-core runtime dispatch.

### Command Mapping

- Native slash command intent maps to: `gsd-serena-bridge sketch --format markdown`.

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
3. Restate the user's goal in one sentence and map it to this command: `sketch`.
4. Complete the preflight above. If repair was needed, rerun doctor before continuing.
5. Read required inputs before writing anything. Required reads for this command:
   - none
6. If the user's request is natural-language or ambiguous, run resolver first and use the returned packet/command:

   ```bash
   cat <<'EOF_REQUEST' | gsd-serena-bridge resolve --stdin --format markdown
   <verbatim user request>
   EOF_REQUEST
   ```

7. Run or prepare the implemented bridge command from the project root:

   ```bash
   gsd-serena-bridge sketch --format markdown
   ```

   If the command needs arguments, inspect `gsd-serena-bridge sketch --help` or use the resolver packet instead of guessing.
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

No command-specific validation is declared in the contract. Use the command output, resolver packet, operation plan validation, and any GSD-core source validation criteria preserved below. Use `gsd-serena-bridge doctor --format markdown` only to confirm setup health, not to claim command success.

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

- none

### Allowed Writes

- none

### Forbidden Writes

- `.git/**`
- `.github/**`
- `node_modules/**`
- `vendor/**`

### Expected Created Artifacts

- none

### Expected Updated Artifacts

- none

### Optional Artifacts

- none

## Runtime Capability

- Runtime status: `destructive-with-confirmation`
- Contract row: `command:sketch`
- Test fixture path: `tests/fixtures/runtime-capability/commands/sketch`
- Required command: `gsd-serena-bridge sketch --format markdown`
- Dry-run command: `gsd-serena-bridge sketch --format markdown`
- Apply command: `gsd-serena-bridge sketch --apply --confirm --format markdown`
- Read actions:
- `.planning/STATE.md`
- `.planning/ROADMAP.md`
- `.planning/phases/<phase>/**`
- Write actions:
- `.planning/phases/<phase>/SKETCH.md`
- External actions:
- `adapter-gated external service or reviewer interaction`
- Git actions:
- `adapter-gated local git operation with dry-run/apply/rollback requirements`
- GitHub actions:
- none
- Agent actions:
- none
- Runtime validation commands:
- `pnpm vitest run tests/gsd-serena/runtime-capability/sketch.test.ts`

## GSD Source Translation

The source-derived guidance below is translated for the Serena bridge. Native runtime locator code, shim functions, direct `gsd-tools.cjs` discovery, native agent dispatch, and git/worktree helpers are converted into bridge commands, resolver packets, Serena role workflows, or validation-gated operation plans.

### vendor-command

Recorded path: `vendor/reference/gsd-core/commands/gsd/sketch.md`; resolved path: `vendor/reference/gsd-core/commands/gsd/sketch.md`.

<objective>
Explore design directions through throwaway HTML mockups before committing to implementation.
Each sketch produces 2-3 variants for comparison. Sketches live in `.planning/sketches/` and
integrate with GSD commit patterns, state tracking, and handoff workflows. Loads spike
findings to ground mockups in real data shapes and validated interaction patterns.

Two modes:
- **Idea mode** (default) — describe a design idea to sketch
- **Frontier mode** (no argument or "frontier") — analyzes existing sketch landscape and proposes consistency and frontier sketches

Does not require prior new-project setup — auto-creates `.planning/sketches/` if needed.
</objective>

<execution_context>
- GSD-core workflow import retained: `@~/.claude/gsd-core/workflows/sketch.md`. Use the mirrored bridge workflow runbook under `.agents/gsd-serena/workflows/**` for adapted execution.
- GSD-core workflow import retained: `@~/.claude/gsd-core/workflows/sketch-wrap-up.md`. Use the mirrored bridge workflow runbook under `.agents/gsd-serena/workflows/**` for adapted execution.
@~/.claude/gsd-core/references/ui-brand.md
@~/.claude/gsd-core/references/sketch-theme-system.md
@~/.claude/gsd-core/references/sketch-interactivity.md
@~/.claude/gsd-core/references/sketch-tooling.md
@~/.claude/gsd-core/references/sketch-variant-patterns.md
</execution_context>

<runtime_note>
**Copilot (VS Code):** Use `vscode_askquestions` wherever this workflow calls `AskUserQuestion`.
</runtime_note>

<context>
Design idea: $ARGUMENTS

**Available flags:**
- `--quick` — Skip mood/direction intake, jump straight to decomposition and building. Use when the design direction is already clear.
- `--wrap-up` — Package sketch design findings into a persistent project skill for future build conversations. Runs the sketch-wrap-up workflow.
</context>

<process>
Parse the first token of $ARGUMENTS:
- If it is `--wrap-up`: strip the flag, execute the sketch-wrap-up workflow end-to-end.
- Otherwise: execute the sketch workflow end-to-end.

Preserve all workflow gates (intake, decomposition, target stack research, variant evaluation, MANIFEST updates, commit patterns).
</process>

## Contract Reference

- Contract ID: `gsd-command-sketch`
- Family: `command`
- Status: `adapted-safe`
- Runtime authority: `.agents/gsd-serena/parity-skills/contracts.json`
- Transition rule: planned — Command row has compatibility coverage but no exact command behavior contract yet.

### Bridge Entrypoints

- `sketch`

### Source Evidence

- `vendor/reference/gsd-core/commands/gsd/sketch.md` (vendor-command) -> `vendor/reference/gsd-core/commands/gsd/sketch.md`

### Unsafe Reference Behaviors

- none recorded

### Test Evidence

- Status: `planned`
- Commands:
- none
- Notes: Requires future exact behavior promotion before claiming runtime artifacts.

### Notes

- Bridge sketch reports local sketch/spike evidence and now mirrors write/edit/run/research modes as instruction guidance.
- Vendor sketch intent is mirrored through artifact, manifest, evaluation, research, and handoff guidance without automatically creating or editing throwaway files.
- Bridge sketch now includes a structured Serena exploration/research/prototype operation plan with bounded tool use, artifact write sets, shell verification, checkpoints, rollback, and researcher/prototype/reviewer role workflow evidence while preserving existing safety gates.

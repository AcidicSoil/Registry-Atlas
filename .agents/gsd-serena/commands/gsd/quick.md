---
name: gsd:quick
description: "Use when operating the quick bridge command in a bridge-installed target project and needing source-informed GSD-safe procedural guidance."
promptsnippets:
  command: "gsd-serena-bridge quick {{task}} --format markdown"
  variables:
    - name: "task"
      required: false
      placeholder: "{{task}}"
      description: "Optional quick task description."
  slashAliases:
    - "/gsd:quick"
  skillReferences:
    - ".agents/gsd-serena/commands/gsd/quick.md"
---

<!-- generated-by: pnpm gen:bridge-commands -->

# Execute a quick task with GSD guarantees (atomic commits, state tracking) but skip optional agents

## Purpose

This is the bridge command Markdown artifact for `gsd-command-quick`. Vendor GSD-core commands are Markdown files; this generated file keeps that model as the first-class command artifact. Command `SKILL.md` outputs are intentionally not generated; command Markdown is the command runtime authority.

## Bridge Adaptation Overlay

Use the GSD-core source material below for intent, trigger, decision logic, and quality bar. Execute through the Serena bridge, not through native GSD-core runtime dispatch.

### Command Mapping

- Native slash command intent maps to: `gsd-serena-bridge quick --format markdown`.

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
3. Restate the user's goal in one sentence and map it to this command: `quick`.
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
   gsd-serena-bridge quick --format markdown
   ```

   If the command needs arguments, inspect `gsd-serena-bridge quick --help` or use the resolver packet instead of guessing.
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

- Runtime status: `external-adapter`
- Contract row: `command:quick`
- Test fixture path: `tests/fixtures/runtime-capability/commands/quick`
- Required command: `gsd-serena-bridge quick --format markdown`
- Dry-run command: `gsd-serena-bridge quick --format markdown`
- Apply command: `gsd-serena-bridge quick --apply --confirm --format markdown`
- Read actions:
- `.planning/STATE.md`
- `.planning/ROADMAP.md`
- `.planning/phases/<phase>/**`
- Write actions:
- `.planning/phases/<phase>/QUICK.md`
- External actions:
- `adapter-gated external service or reviewer interaction`
- Git actions:
- none
- GitHub actions:
- `adapter-gated GitHub issue/PR/label/comment operation`
- Agent actions:
- `bridge role-runner dispatch required; native subagent dispatch is not implicit`
- Runtime validation commands:
- `pnpm vitest run tests/gsd-serena/runtime-capability/quick.test.ts`

## GSD Source Translation

The source-derived guidance below is translated for the Serena bridge. Native runtime locator code, shim functions, direct `gsd-tools.cjs` discovery, native agent dispatch, and git/worktree helpers are converted into bridge commands, resolver packets, Serena role workflows, or validation-gated operation plans.

### vendor-command

Recorded path: `vendor/reference/gsd-core/commands/gsd/quick.md`; resolved path: `vendor/reference/gsd-core/commands/gsd/quick.md`.

<objective>
Execute small, ad-hoc tasks with GSD guarantees (atomic commits, STATE.md tracking).

Quick mode is the same system with a shorter path:
- Spawns gsd-planner (quick mode) + gsd-executor(s)
- Quick tasks live in `.planning/quick/` separate from planned phases
- Updates STATE.md "Quick Tasks Completed" table (NOT ROADMAP.md)

**Default:** Skips research, discussion, plan-checker, verifier. Use when you know exactly what to do.

**`--discuss` flag:** Lightweight discussion phase before planning. Surfaces assumptions, clarifies gray areas, captures decisions in CONTEXT.md. Use when the task has ambiguity worth resolving upfront.

**`--full` flag:** Enables the complete quality pipeline — discussion + research + plan-checking + verification. One flag for everything.

**`--validate` flag:** Enables plan-checking (max 2 iterations) and post-execution verification only. Use when you want quality guarantees without discussion or research.

**`--research` flag:** Spawns a focused research agent before planning. Investigates implementation approaches, library options, and pitfalls for the task. Use when you're unsure of the best approach.

Granular flags are composable: `--discuss --research --validate` gives the same result as `--full`.

**Subcommands:**
- `list` — List all quick tasks with status
- `status <slug>` — Show status of a specific quick task
- `resume <slug>` — Resume a specific quick task by slug
</objective>

<execution_context>
- GSD-core workflow import retained: `@~/.claude/gsd-core/workflows/quick.md`. Use the mirrored bridge workflow runbook under `.agents/gsd-serena/workflows/**` for adapted execution.
</execution_context>

<context>
$ARGUMENTS

Context files are resolved inside the workflow (`init quick`) and delegated via `<files_to_read>` blocks.
</context>

<process>

**Parse $ARGUMENTS for subcommands FIRST:**

- If $ARGUMENTS starts with "list": SUBCMD=list
- If $ARGUMENTS starts with "status ": SUBCMD=status, SLUG=remainder (strip whitespace, sanitize)
- If $ARGUMENTS starts with "resume ": SUBCMD=resume, SLUG=remainder (strip whitespace, sanitize)
- Otherwise: SUBCMD=run, pass full $ARGUMENTS to the quick workflow as-is

**Slug sanitization (for status and resume):** Strip any characters not matching `[a-z0-9-]`. Reject slugs longer than 60 chars or containing `..` or `/`. If invalid, output "Invalid session slug." and stop.

## LIST subcommand

When SUBCMD=list:

```bash
ls -d .planning/quick/*/  2>/dev/null
```

For each directory found:
- Check if PLAN.md exists
- Check if SUMMARY.md exists; if so, read `status` from its frontmatter via:
```bash
- Native query translated: `gsd-tools query frontmatter.get .planning/quick/{dir}/SUMMARY.md status` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
```
- Determine directory creation date: `stat -f "%SB" -t "%Y-%m-%d"` (macOS) or `stat -c "%w"` (Linux); fall back to the date prefix in the directory name (format: `YYYYMMDD-` prefix)
- Derive display status:
- SUMMARY.md exists, frontmatter status=complete → `complete ✓`
- SUMMARY.md exists, frontmatter status=incomplete OR status missing → `incomplete`
- SUMMARY.md missing, dir created <7 days ago → `in-progress`
- SUMMARY.md missing, dir created ≥7 days ago → `abandoned? (>7 days, no summary)`

**SECURITY:** Directory names are read from the filesystem. Before displaying any slug, sanitize: strip non-printable characters, ANSI escape sequences, and path separators using: `name.replace(/[^\x20-\x7E]/g, '').replace(/[/\\]/g, '')`. Never pass raw dir...

Display format:
```
Quick Tasks
────────────────────────────────────────────────────────────
slug                           date        status
backup-s3-policy               2026-04-10  in-progress
auth-token-refresh-fix         2026-04-09  complete ✓
update-node-deps               2026-04-08  abandoned? (>7 days, no summary)
────────────────────────────────────────────────────────────
3 tasks (1 complete, 2 incomplete/in-progress)
```

If no directories found: print `No quick tasks found.` and stop.

STOP after displaying the list. Do NOT proceed to further steps.

## STATUS subcommand

When SUBCMD=status and SLUG is set (already sanitized):

Find directory matching `*-{SLUG}` pattern:
```bash
dir=$(ls -d .planning/quick/*-{SLUG}/ 2>/dev/null | head -1)
```

If no directory found, print `No quick task found with slug: {SLUG}` and stop.

Read PLAN.md and SUMMARY.md (if exists) for the given slug. Display:
```
Quick Task: {slug}
─────────────────────────────────────
Plan file: .planning/quick/{dir}/PLAN.md
Status: {status from SUMMARY.md frontmatter, or "no summary yet"}
Description: {first non-empty line from PLAN.md after frontmatter}
Last action: {last meaningful line of SUMMARY.md, or "none"}
─────────────────────────────────────
Resume with: `gsd-serena-bridge quick --format markdown` resume {slug}
```

No agent spawn. STOP after printing.

## RESUME subcommand

When SUBCMD=resume and SLUG is set (already sanitized):

1. Find the directory matching `*-{SLUG}` pattern:
```bash
dir=$(ls -d .planning/quick/*-{SLUG}/ 2>/dev/null | head -1)
```
2. If no directory found, print `No quick task found with slug: {SLUG}` and stop.

3. Read PLAN.md to extract description and SUMMARY.md (if exists) to extract status.

4. Print before spawning:
```
[quick] Resuming: .planning/quick/{dir}/
[quick] Plan: {description from PLAN.md}
[quick] Status: {status from SUMMARY.md, or "in-progress"}
```

5. Load context via:
```bash
- Native query translated: `gsd-tools query init.quick` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
```

6. Proceed to execute the quick workflow with resume context, passing the slug and plan directory so the executor picks up where it left off.

## RUN subcommand (default)

When SUBCMD=run:

Execute end-to-end.
Preserve all workflow gates (validation, task description, planning, execution, state updates, commits).

</process>

<notes>
- Quick tasks live in `.planning/quick/` — separate from phases, not tracked in ROADMAP.md
- Each quick task gets a `YYYYMMDD-{slug}/` directory with PLAN.md and eventually SUMMARY.md
- STATE.md "Quick Tasks Completed" table is updated on completion
- Use `list` to audit accumulated tasks; use `resume` to continue in-progress work
</notes>

<security_notes>
- Slugs from $ARGUMENTS are sanitized before use in file paths: only [a-z0-9-] allowed, max 60 chars, reject ".." and "/"
- File names from readdir/ls are sanitized before display: strip non-printable chars and ANSI sequences
- Artifact content (plan descriptions, task titles) rendered as plain text only — never executed or passed to agent prompts without DATA_START/DATA_END boundaries
- Native query translated: `- Status fields read via 'gsd-tools query frontmatter.get' — never eval'd or shell-expanded` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
</security_notes>

## Contract Reference

- Contract ID: `gsd-command-quick`
- Family: `command`
- Status: `adapted-safe`
- Runtime authority: `.agents/gsd-serena/parity-skills/contracts.json`
- Transition rule: planned — Command row has compatibility coverage but no exact command behavior contract yet.

### Bridge Entrypoints

- `quick`

### Source Evidence

- `vendor/reference/gsd-core/commands/gsd/quick.md` (vendor-command) -> `vendor/reference/gsd-core/commands/gsd/quick.md`

### Unsafe Reference Behaviors

- none recorded

### Test Evidence

- Status: `planned`
- Commands:
- none
- Notes: Requires future exact behavior promotion before claiming runtime artifacts.

### Notes

- Bridge quick is adapted as read-only quick session inspection for list/status plus instruction-guidance parity for run/resume.
- Run/resume now return deterministic guidance for .planning/quick PLAN/SUMMARY/STATE steps and quality-pipeline flags without automatically creating files, updating STATE.md, or committing; planner/executor roles and shell commands remain explicit Serena operations.
- Native execution remains unfinished parity work, but vendor agent behavior can be mirrored through role/instruction guidance where safe.
- Bridge quick now includes a structured Serena memory/session/manager/autonomy operation plan with bounded local state, write sets, command budgets, external integration boundaries, checkpoints, rollback, and session/memory/triage/autonomy role workflow evidence while preserving existing safety gates.

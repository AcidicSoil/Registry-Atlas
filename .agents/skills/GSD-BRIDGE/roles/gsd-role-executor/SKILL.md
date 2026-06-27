---
name: bridge-gsd-role-executor
description: "Use when operating the executor Serena role workflow in a bridge-installed target project and needing source-informed GSD-safe procedural guidance."
---

<!-- generated-by: pnpm gen:bridge-commands -->

# Executes GSD plans with atomic commits, deviation handling, checkpoint protocols, and state management. Spawned by execute-phase orchestrator or execute-plan command.

## Purpose

Use this generated bridge skill as a source-informed runbook for `gsd-role-executor`. It preserves the actual GSD-core command/workflow/role material where available and overlays the Serena bridge execution rules needed to operate safely in installed target projects.

## Bridge Adaptation Overlay

Use the GSD-core source material below for intent, trigger, decision logic, and quality bar. Execute through the Serena bridge, not through native GSD-core runtime dispatch.

### Command Mapping

- No direct bridge entrypoint is declared. Use resolver and an explicit operation plan.

### Runtime Substitutions

- Native `/gsd:*` slash commands map to `gsd-serena-bridge <command> --format markdown` when the bridge exposes the command.
- Native `gsd_run query ...` helpers map to bridge commands, resolver packets, installed registry contracts, or explicit operation plans. Do not invent a missing query result.
- Native `Agent(...)` / subagent dispatch maps to installed GSD agent contracts under `.agents/gsd-serena/agents/**`, vendor-shaped GSD runtime skills under `.agents/gsd-serena/skills/gsd-*/SKILL.md`, Serena role passes, or explicit checkpoints.
- Native Skill references map to vendor-shaped GSD runtime skills under `.agents/gsd-serena/skills/gsd-*/SKILL.md`, GSD references under `.agents/gsd-serena/gsd-core/references/**`, and workflow runbooks under `.agents/gsd-serena/workflows/**`.
- Native mutation, git commit, branch, or worktree behavior must be translated into bridge-owned commands, operation plans, validators, allowed writes, checkpoints, and rollback notes. Do not auto-create git commits unless the user explicitly asks for that git action.


### Execution Rule

Treat this as planned guidance. Route through resolver and implemented commands when possible; otherwise produce a concrete bridge operation plan with reads, writes, validation, rollback, and next action.

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
5. Status decision for this role skill: Treat this as planned guidance. Route through resolver and implemented commands when possible; otherwise produce a concrete bridge operation plan with reads, writes, validation, rollback, and next action.

## Procedure

1. Read the GSD Source Translation below first. Extract the role's purpose, required reads, tools, output contract, and quality rules.
2. Apply the Bridge Adaptation Overlay above before executing anything.
3. Treat this as a Serena role-workflow packet, not as vendor-native subagent dispatch.
4. Complete the preflight above. If repair was needed, rerun doctor before role work starts.
5. State the active role frame and the bounded task the role is allowed to perform.
6. Route mutations through an implemented bridge command, resolver packet, or explicit operation plan before changing files.
7. Use the role to inspect, decide, and report. Mutate only when the command packet or operation plan gives an allowed write set and validation command.
8. When vendor-native Agent/Subagent behavior is unavailable, substitute Serena role workflow steps: inspect evidence, produce decisions, write bounded artifacts, validate, and hand off.
9. End with a handoff that names changed files, evidence, validation, remaining risk, and next command.

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
- Native GSD behavior requested but not implemented: execute the bridge substitute through a command, workflow runbook, role workflow, or explicit operation plan; cite the contract status `planned`, explain the safe bridge substitute, and record a future parity slice.

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

No command-level runtime capability row is available for this generated surface. Use resolver output and the parity skill contract for current behavior.

## GSD Source Translation

The source-derived guidance below is translated for the Serena bridge. Native runtime locator code, shim functions, direct `gsd-tools.cjs` discovery, native agent dispatch, and git/worktree helpers are converted into bridge commands, resolver packets, Serena role workflows, or validation-gated operation plans.

### vendor-agent

Recorded path: `agents/gsd-executor.md`; resolved path: `vendor/reference/gsd-core/agents/gsd-executor.md`.

### Native Shim Translation
- Native GSD shim locator omitted: the bridge uses the installed `gsd-serena-bridge` CLI, `bootstrap`, `doctor`, `repair`, resolver packets, and install-managed project surfaces instead of locating `gsd-tools.cjs`.

<role>
You are a GSD plan executor. You execute PLAN.md files atomically, creating per-task commits, handling deviations automatically, pausing at checkpoints, and producing SUMMARY.md files.

Spawned by ``gsd-serena-bridge execute-phase --format markdown`` orchestrator.

Your job: Execute the plan completely, commit each task, create SUMMARY.md, update STATE.md.

@~/.claude/gsd-core/references/mandatory-initial-read.md
</role>

<documentation_lookup>
When you need library or framework documentation, check in this order:

- Native MCP/tool seam translated: `1. If Context7 MCP tools ('mcp__context7__*') are available in your environment, use them:` -> use the available Serena/web/tool equivalent only when available; otherwise record an operation-plan fallback.
- Native MCP/tool seam translated: `- Resolve library ID: 'mcp__context7__resolve-library-id' with 'libraryName'` -> use the available Serena/web/tool equivalent only when available; otherwise record an operation-plan fallback.
- Native MCP/tool seam translated: `- Fetch docs: 'mcp__context7__get-library-docs' with 'context7CompatibleLibraryId' and 'topic'` -> use the available Serena/web/tool equivalent only when available; otherwise record an operation-plan fallback.

2. If Context7 MCP is not available (upstream bug anthropics/claude-code#13898 strips MCP
tools from agents with a `tools:` frontmatter restriction), use the CLI fallback via Bash:

Step 1 — Resolve library ID:
```bash
if command -v ctx7 &>/dev/null; then
ctx7 library <name> "<query>"
else
echo "ctx7 not found — install with: npm install -g ctx7 (verify at npmjs.com/package/ctx7 first)"
fi
```

Step 2 — Fetch documentation:
```bash
if command -v ctx7 &>/dev/null; then
ctx7 docs <libraryId> "<query>"
else
echo "ctx7 not found — install with: npm install -g ctx7 (verify at npmjs.com/package/ctx7 first)"
fi
```

Do not skip documentation lookups because MCP tools are unavailable — the CLI fallback
works via Bash and produces equivalent output. Do not rely on training knowledge alone
for library APIs where version-specific behavior matters. Do NOT use `npx --yes` to
auto-download ctx7 — this silently executes unverified packages from the registry.
</documentation_lookup>

<project_context>
Before executing, discover project context:

**Project instructions:** Read `./CLAUDE.md` if it exists in the working directory. Follow all project-specific guidelines, security requirements, and coding conventions.

**Project skills:** @~/.claude/gsd-core/references/project-skills-discovery.md
- Load `rules/*.md` as needed during **implementation**.
- Follow skill rules relevant to the task you are about to commit.

**CLAUDE.md enforcement:** If `./CLAUDE.md` exists, treat its directives as hard constraints during execution. Before committing each task, verify that code changes do not violate CLAUDE.md rules (forbidden patterns, required conventions, mandated tools). I...
</project_context>

<execution_flow>

<step name="load_project_state" priority="first">
Load execution context:

```bash
- Native query translated: `INIT=$(gsd_run query init.execute-phase "${PHASE}")` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

Extract from init JSON: `executor_model`, `commit_docs`, `sub_repos`, `phase_dir`, `plans`, `incomplete_plans`.

Also load planning state (position, decisions, blockers) via the SDK — **use `node` to invoke the CLI** (not `npx`):
```bash
- Native query translated: `gsd_run query state.load 2>/dev/null` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
```
If STATE.md missing but .planning/ exists: offer to reconstruct or continue without.
If .planning/ missing: Error — project not initialized.
</step>

<step name="load_plan">
Read the plan file provided in your prompt context.

Parse: frontmatter (phase, plan, type, autonomous, wave, depends_on), objective, context (@-references), tasks with types, verification/success criteria, output spec.

**If plan references CONTEXT.md:** Honor user's vision throughout execution.
</step>

<step name="record_start_time">
```bash
PLAN_START_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
PLAN_START_EPOCH=$(date +%s)
```
</step>

<worktree_metadata_capture>
- Native worktree variables translated: inspect current repo with normal git/status commands when needed; do not create/switch worktrees unless explicitly requested.
any task commit changes HEAD. The execute-phase orchestrator consumes this from
your final `<worktree_metadata>` return block to build the wave cleanup manifest
without relying on runtime harness metadata (#1297).

```bash
- Native worktree variables translated: inspect current repo with normal git/status commands when needed; do not create/switch worktrees unless explicitly requested.
- Native worktree variables translated: inspect current repo with normal git/status commands when needed; do not create/switch worktrees unless explicitly requested.
- Native worktree variables translated: inspect current repo with normal git/status commands when needed; do not create/switch worktrees unless explicitly requested.
if [ -f .git ]; then
- Native worktree variables translated: inspect current repo with normal git/status commands when needed; do not create/switch worktrees unless explicitly requested.
- Native worktree variables translated: inspect current repo with normal git/status commands when needed; do not create/switch worktrees unless explicitly requested.
- Native worktree variables translated: inspect current repo with normal git/status commands when needed; do not create/switch worktrees unless explicitly requested.
fi
```
</worktree_metadata_capture>

<step name="determine_execution_pattern">
```bash
grep -n "type=\"checkpoint" [plan-path]
```

**Pattern A: Fully autonomous (no checkpoints)** — Execute all tasks, create SUMMARY, commit.

**Pattern B: Has checkpoints** — Execute until checkpoint, STOP, return structured message. You will NOT be resumed.

**Pattern C: Continuation** — Check `<completed_tasks>` in prompt, verify commits exist, resume from specified task.
</step>

<step name="execute_tasks">
At execution decision points, apply structured reasoning:
@~/.claude/gsd-core/references/thinking-models-execution.md

**iOS app scaffolding:** If this plan creates an iOS app target, follow ios-scaffold guidance:
@~/.claude/gsd-core/references/ios-scaffold.md

For each task:

1. **If `type="auto"`:**
- Check for `tdd="true"` → follow TDD execution flow
- Execute task, apply deviation rules as needed
- Handle auth errors as authentication gates
- Run verification, confirm done criteria
- Commit (see task_commit_protocol)
- Track completion + commit hash for Summary

2. **If `type="checkpoint:*"`:**
- STOP immediately — return structured checkpoint message
- A fresh agent will be spawned to continue

3. After all tasks: run overall verification, confirm success criteria, document deviations
</step>

</execution_flow>

<deviation_rules>
**While executing, you WILL discover work not in the plan.** Apply these rules automatically. Track all deviations for Summary.

**Shared process for Rules 1-3:** Fix inline → add/update tests if applicable → verify fix → continue task → track as `[Rule N - Type] description`

No user permission needed for Rules 1-3.

---

**RULE 1: Auto-fix bugs**

**Trigger:** Code doesn't work as intended (broken behavior, errors, incorrect output)

**Examples:** Wrong queries, logic errors, type errors, null pointer exceptions, broken validation, security vulnerabilities, race conditions, memory leaks

---

**RULE 2: Auto-add missing critical functionality**

**Trigger:** Code missing essential features for correctness, security, or basic operation

**Examples:** Missing error handling, no input validation, missing null checks, no auth on protected routes, missing authorization, no CSRF/CORS, no rate limiting, missing DB indexes, no error logging

**Critical = required for correct/secure/performant operation.** These aren't "features" — they're correctness requirements.

**Threat model reference:** Before starting each task, check if the plan's `<threat_model>` assigns `mitigate` dispositions to this task's files. Mitigations in the threat register are correctness requirements — apply Rule 2 if absent from implementation.

---

**RULE 3: Auto-fix blocking issues**

**Trigger:** Something prevents completing current task

**Examples:** Wrong types, broken imports, missing env var, DB connection error, build config error, missing referenced file, circular dependency

**EXCLUDED from RULE 3 — package manager installs:**
Running `npm install <pkg>`, `pip install <pkg>`, `cargo add <pkg>`, or any equivalent package-manager install command is **NOT** auto-fixable. If a referenced package fails to install or cannot be found:
1. Do NOT attempt to install a similarly-named alternative.
2. Do NOT retry with a different package name.
3. Return a `checkpoint:human-verify` task — the user must verify the package is legitimate before the executor proceeds.

This exclusion exists because a failed install may indicate a slopsquatted or hallucinated package name. Auto-substituting an alternative could install something more dangerous. If a package install fails, emit:

```xml
<task type="checkpoint:human-verify" gate="blocking-human">
<what-built>Package install failed — human verification required</what-built>
<how-to-verify>
`[package-name]` could not be installed. Before proceeding:
1. Verify the package exists and is legitimate: https://npmjs.com/package/[package-name]
2. Confirm the package name is spelled correctly in PLAN.md
3. If the package does not exist, re-run `gsd-serena-bridge plan-phase --format markdown` --research-phase <N> to find the correct package
</how-to-verify>
<resume-signal>Type "verified" with the correct package name, or "abort" to stop the phase</resume-signal>
</task>
```

Use `gate="blocking-human"` for package-legitimacy checkpoints so they are unambiguously excluded from auto-approval behavior.

---

**RULE 4: Ask about architectural changes**

**Trigger:** Fix requires significant structural modification

**Examples:** New DB table (not column), major schema changes, new service layer, switching libraries/frameworks, changing auth approach, new infrastructure, breaking API changes

**Action:** STOP → return checkpoint with: what found, proposed change, why needed, impact, alternatives. **User decision required.**

---

**RULE PRIORITY:**
1. Rule 4 applies → STOP (architectural decision)
2. Rules 1-3 apply → Fix automatically
3. Genuinely unsure → Rule 4 (ask)

**Edge cases:**
- Missing validation → Rule 2 (security)
- Crashes on null → Rule 1 (bug)
- Need new table → Rule 4 (architectural)
- Need new column → Rule 1 or 2 (depends on context)

**When in doubt:** "Does this affect correctness, security, or ability to complete task?" YES → Rules 1-3. MAYBE → Rule 4.

---

**SCOPE BOUNDARY:**
Only auto-fix issues DIRECTLY caused by the current task's changes. Pre-existing warnings, linting errors, or failures in unrelated files are out of scope.
- Log out-of-scope discoveries to `deferred-items.md` in the phase directory
- Do NOT fix them
- Do NOT re-run builds hoping they resolve themselves

**FIX ATTEMPT LIMIT:**
Track auto-fix attempts per task. After 3 auto-fix attempts on a single task:
- STOP fixing — document remaining issues in SUMMARY.md under "Deferred Issues"
- Continue to the next task (or return checkpoint if blocked)
- Do NOT restart the build to find more issues

**Extended examples and edge case guide:**
For detailed deviation rule examples, checkpoint examples, and edge case decision guidance:
@~/.claude/gsd-core/references/executor-examples.md
</deviation_rules>

<analysis_paralysis_guard>
**During task execution, if you make 5+ consecutive Read/Grep/Glob calls without any Edit/Write/Bash action:**

STOP. State in one sentence why you haven't written anything yet. Then either:
1. Write code (you have enough context), or
2. Report "blocked" with the specific missing information.

Do NOT continue reading. Analysis without action is a stuck signal.
</analysis_paralysis_guard>

<authentication_gates>
**Auth errors during `type="auto"` execution are gates, not failures.**

**Indicators:** "Not authenticated", "Not logged in", "Unauthorized", "401", "403", "Please run {tool} login", "Set {ENV_VAR}"

**Protocol:**
1. Recognize it's an auth gate (not a bug)
2. STOP current task
3. Return checkpoint with type `human-action` (use checkpoint_return_format)
4. Provide exact auth steps (CLI commands, where to get keys)
5. Specify verification command

**In Summary:** Document auth gates as normal flow, not deviations.
</authentication_gates>

<auto_mode_detection>
Check if auto mode is active at executor start (chain flag or user preference):

```bash
- Native query translated: `AUTO_CHAIN=$(gsd_run query config-get workflow._auto_chain_active 2>/dev/null || echo "false")` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
- Native query translated: `AUTO_CFG=$(gsd_run query config-get workflow.auto_advance 2>/dev/null || echo "false")` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
```

Auto mode is active if either `AUTO_CHAIN` or `AUTO_CFG` is `"true"`. Store the result for checkpoint handling below.
</auto_mode_detection>

<checkpoint_protocol>

**Automation before verification**

Before any `checkpoint:human-verify`, ensure verification environment is ready. If plan lacks server startup before checkpoint, ADD ONE (deviation Rule 3).

For full automation-first patterns, server lifecycle, CLI handling:
**See @~/.claude/gsd-core/references/checkpoints.md**

**Quick reference:** Users NEVER run CLI commands. Users ONLY visit URLs, click UI, evaluate visuals, provide secrets. Claude does all automation.

---

**Auto-mode checkpoint behavior** (when `AUTO_CFG` is `"true"`):

- **checkpoint:human-verify** → Auto-approve **except package-legitimacy checkpoints**. If checkpoint has `gate="blocking-human"` OR its purpose indicates package legitimacy verification (`what-built` mentions `Package verification required before install` ...
- **checkpoint:decision** → Auto-select first option (planners front-load the recommended choice). Log `⚡ Auto-selected: [option name]`. Continue to next task.
- **checkpoint:human-action** → STOP normally. Auth gates cannot be automated — return structured checkpoint message using checkpoint_return_format.

**Standard checkpoint behavior** (when `AUTO_CFG` is not `"true"`):

When encountering `type="checkpoint:*"`: **STOP immediately.** Return structured checkpoint message using checkpoint_return_format.

**checkpoint:human-verify (90%)** — Visual/functional verification after automation.
Provide: what was built, exact verification steps (URLs, commands, expected behavior).

- Source translation truncated here; use the bridge command output, workflow runbook, installed contracts, or operation plan for continuation.

## Contract Reference

- Contract ID: `gsd-role-executor`
- Family: `role`
- Status: `planned`
- Runtime authority: `.agents/gsd-serena/parity-skills/contracts.json`
- Transition rule: planned — Role parity contract is planned until integrated into explicit bridge role frames.

### Bridge Entrypoints

- none

### Source Evidence

- `agents/gsd-executor.md` (vendor-agent) -> `vendor/reference/gsd-core/agents/gsd-executor.md`

### Unsafe Reference Behaviors

- reference tools: Read, Write, Edit, Bash, Grep, Glob, mcp__context7__*

### Test Evidence

- Status: `planned`
- Commands:
- none
- Notes: Role row requires role-frame integration evidence before exact behavior claims.

### Notes

Generated from reference agent evidence.

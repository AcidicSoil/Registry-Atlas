# Bridge Workflow: execute-phase

<!-- generated-by: pnpm gen:bridge-commands -->

## Purpose

This bridge workflow runbook translates the actual GSD-core workflow information and adapts it for Serena bridge operation. Read it when operating `gsd-workflow-execute-phase` in a target project.

## Bridge Entry

```bash
gsd-serena-bridge bootstrap --format markdown
gsd-serena-bridge doctor --format markdown
```

If setup is stale or broken, run:

```bash
gsd-serena-bridge repair --format markdown
gsd-serena-bridge doctor --format markdown
```

Primary bridge route:

```text
Use `gsd-serena-bridge resolve --stdin --format markdown` to map this workflow intent to an implemented bridge command or operation plan.
```

For natural-language requests, classify first:

```bash
cat <<'EOF_REQUEST' | gsd-serena-bridge resolve --stdin --format markdown
<verbatim user request>
EOF_REQUEST
```

## Bridge Substitution Rules

- Preserve the GSD-core trigger, purpose, process steps, decision logic, and quality bar from the source workflow below.
- Replace native `/gsd:*` slash commands with `gsd-serena-bridge <command> --format markdown` when implemented.
- Replace native `gsd_run query ...` calls with bridge commands, resolver packets, installed contracts, or explicit operation plans.
- Replace native `Agent(...)` dispatch with Serena role workflows, generated role skills, sequential role passes, or explicit checkpoints.
- Do not run native shell snippets that mutate state unless a bridge command or operation plan authorizes the same write set and validation.
- Do not claim exact native behavior for adapted-safe or planned rows. Name the bridge substitute and remaining gap.

## Source Evidence

- Contract ID: `gsd-workflow-execute-phase`
- Status: `planned`
- Source path: `gsd-core/workflows/execute-phase.md`
- Resolved source path: `vendor/reference/gsd-core/gsd-core/workflows/execute-phase.md`
- Mirrored runbook path: `.agents/gsd-serena/workflows/execute-phase.md`

## Translated GSD Workflow

### Native Shim Translation
- Native GSD shim locator omitted: the bridge uses the installed `gsd-serena-bridge` CLI, `bootstrap`, `doctor`, `repair`, resolver packets, and install-managed project surfaces instead of locating `gsd-tools.cjs`.
<!-- gsd:loop-host
step: execute
points: execute:pre, execute:wave:pre, execute:wave:post, execute:post
agent-roles: executor, verifier
produces: SUMMARY.md
consumes: PLAN.md
-->
<purpose>
Execute all plans in a phase using wave-based parallel execution. Orchestrator stays lean — delegates plan execution to subagents.
</purpose>

<core_principle>
Orchestrator coordinates, not executes. Each subagent loads the full execute-plan context. Orchestrator: discover plans → analyze deps → group waves → spawn agents → handle checkpoints → collect results.
</core_principle>

<runtime_compatibility>
**Subagent spawning is runtime-specific:**
- Native agent dispatch translated: `- **Claude Code:** Uses 'Agent(subagent_type="gsd-executor", ...)' — blocks until complete, returns result` -> use Serena role workflow / generated role skill / sequential role pass with handoff.
- **Copilot:** Subagent spawning does not reliably return completion signals. **Default to
sequential inline execution**: read and follow execute-plan.md directly for each plan
instead of spawning parallel agents. Only attempt parallel spawning if the user
explicitly requests it — and in that case, rely on the spot-check fallback in step 3
to detect completion.
- **Other runtimes:** If `Agent`/`agent` tool is genuinely unavailable (e.g. a backgrounded
Claude Code agent per #853, or a non-Claude runtime), use sequential inline execution as
the fallback for executor parallelization only. If `Agent` IS available (top-level Claude
Code), you MUST spawn gsd-executor agents — inline execution is not authorized. Check for
actual tool availability, not runtime name.

**Fallback rule:** If a spawned agent completes its work (commits visible, SUMMARY.md exists) but
the orchestrator never receives the completion signal, treat it as successful based on spot-checks
and continue to the next wave/plan. Never block indefinitely waiting for a signal — always verify
via filesystem and git state.
</runtime_compatibility>

<required_reading>
Read STATE.md before any operation to load project context.
@~/.claude/gsd-core/references/agent-contracts.md
@~/.claude/gsd-core/references/context-budget.md
@~/.claude/gsd-core/references/gates.md
</required_reading>

<available_agent_types>
These are the valid GSD subagent types registered in .claude/agents/ (or equivalent for your runtime).
Always use the exact name from this list — do not fall back to 'general-purpose' or other built-in types:

- gsd-executor — Executes plan tasks, commits, creates SUMMARY.md
- gsd-verifier — Verifies phase completion, checks quality gates
- gsd-planner — Creates detailed plans from phase scope
- gsd-phase-researcher — Researches technical approaches for a phase
- gsd-plan-checker — Reviews plan quality before execution
- gsd-debugger — Diagnoses and fixes issues
- gsd-codebase-mapper — Maps project structure and dependencies
- gsd-integration-checker — Checks cross-phase integration
- gsd-nyquist-auditor — Validates verification coverage
- gsd-ui-researcher — Researches UI/UX approaches
- gsd-ui-checker — Reviews UI implementation quality
- gsd-ui-auditor — Audits UI against design requirements
</available_agent_types>

<process>

<step name="parse_args" priority="first">
Parse `$ARGUMENTS` before loading any context:

- First positional token → `PHASE_ARG`
- Optional `--wave N` → `WAVE_FILTER`
- Optional `--gaps-only` keeps its current meaning
- Optional `--cross-ai` → `CROSS_AI_FORCE=true` (force all plans through cross-AI execution)
- Optional `--no-cross-ai` → `CROSS_AI_DISABLED=true` (disable cross-AI for this run, overrides config and frontmatter)

If `--wave` is absent, preserve the current behavior of executing all incomplete waves in the phase.
</step>

<step name="initialize" priority="first">
Load all context in one call:

```bash
- Native query translated: `INIT=$(gsd_run query init.execute-phase "${PHASE_ARG}")` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
- Native query translated: `AGENT_SKILLS=$(gsd_run query agent-skills gsd-executor)` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
```

Parse JSON for: `executor_model`, `verifier_model`, `commit_docs`, `parallelization`, `branching_strategy`, `branch_name`, `phase_found`, `phase_dir`, `phase_number`, `phase_name`, `phase_slug`, `plans`, `incomplete_plans`, `plan_count`, `incomplete_count`,...

- Native agent dispatch translated: `**Model resolution:** If 'executor_model' is '"inherit"', omit the 'model=' parameter from all 'Agent()' calls — do NOT pass 'model="inherit"' to Agent. Omitting the 'model=' parameter causes Claude Code to inherit the current orchestrator model automatically. Only set 'model=' when 'executor_model' is an explicit model name (e.g., '"claude-sonnet-4-6"', '"claude-opus-4-7"').` -> use Serena role workflow / generated role skill / sequential role pass with handoff.

**If `response_language` is set:** Include `response_language: {value}` in all spawned subagent prompts so any user-facing output stays in the configured language.

Read runtime/worktree config and fail closed before any executor dispatch:

```bash
- Native query translated: `RUNTIME=$(gsd_run query config-get runtime --default claude --raw 2>/dev/null || echo "claude")` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
- Native query translated: `USE_WORKTREES=$(gsd_run query config-get workflow.use_worktrees --raw 2>/dev/null || echo "true")` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
- Native query translated: `EXECUTOR_STALL_INTERVAL_MINUTES=$(gsd_run query config-get executor.stall_detect_interval_minutes 2>/dev/null || echo "5")` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
- Native query translated: `EXECUTOR_STALL_THRESHOLD_MINUTES=$(gsd_run query config-get executor.stall_threshold_minutes 2>/dev/null || echo "10")` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.

if [ "$RUNTIME" != "claude" ] && [ "$USE_WORKTREES" != "false" ]; then
- Native worktree variables translated: inspect current repo with normal git/status commands when needed; do not create/switch worktrees unless explicitly requested.
exit 1
fi
# Sweep orphaned locked worktrees from prior crashed sessions before spawning executors (#3707).
- Native query translated: `[ "$USE_WORKTREES" != "false" ] && gsd_run query worktree.reap-orphans 2>/dev/null || true` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
# Auto-degrade to sequential if HEAD has diverged from the worktree fork base (#683).
# Only applies to Claude Code (isolation="worktree" is Claude-Code-specific).
if [ "$RUNTIME" = "claude" ] && [ "$USE_WORKTREES" != "false" ]; then
- Native query translated: `_SHOULD_DEGRADE=$(gsd_run query worktree.base-check --pick shouldDegrade 2>/dev/null || true)` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
if [ "$_SHOULD_DEGRADE" = "true" ]; then
- Native query translated: `_DEGRADE_MSG=$(gsd_run query worktree.base-check --pick message 2>/dev/null || true)` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
[ -n "$_DEGRADE_MSG" ] && printf '%s\n' "$_DEGRADE_MSG" >&2
USE_WORKTREES=false
fi
fi
```
`isolation="worktree"` is a Claude-Code-specific agent primitive; no other runtime can honor it (Codex maps subagents to `spawn_agent`, others prohibit or omit worktree binding). Failing closed prevents main-checkout edits while the workflow believes agents...

If the project uses git submodules, worktree isolation is unsafe **only when a plan touches a submodule path** — the executor commit protocol cannot correctly handle submodule commits inside isolated worktrees. The previous behavior unconditionally disabled...

```bash
# Parse submodule paths from .gitmodules once (empty if no .gitmodules).
# SUBMODULE_PATHS is a newline-separated list of repo-relative paths.
if [ -f .gitmodules ]; then
SUBMODULE_PATHS=$(git config --file .gitmodules --get-regexp '^submodule\..*\.path$' 2>/dev/null | awk '{print $2}')
else
SUBMODULE_PATHS=""
fi
```

`SUBMODULE_PATHS` is exported to the `execute_waves` step, where the per-plan decision actually happens (see "Per-plan worktree decision" sub-step inside `execute_waves`). The decision is per-plan because different plans in the same wave can touch different...

When `USE_WORKTREES` (project-level) is `false`, all executor agents run without `isolation="worktree"` — they execute sequentially on the main working tree instead of in parallel worktrees. The per-plan decision below has no effect when worktrees are proje...

`USE_WORKTREES` is also automatically set to `false` for the duration of a run when `worktree base-check` detects that the orchestrator HEAD has diverged from the worktree fork base (the #683 condition — e.g. an unmerged milestone or feature branch). This c...

Read context window size for adaptive prompt enrichment:

```bash
- Native query translated: `CONTEXT_WINDOW=$(gsd_run query config-get context_window 2>/dev/null || echo "200000")` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
```

When `CONTEXT_WINDOW >= 500000` (1M-class models), subagent prompts include richer context:
- Executor agents receive prior wave SUMMARY.md files and the phase CONTEXT.md/RESEARCH.md
- Verifier agents receive all PLAN.md, SUMMARY.md, CONTEXT.md files plus REQUIREMENTS.md
- This enables cross-phase awareness and history-aware verification

When `CONTEXT_WINDOW < 200000` (sub-200K models), subagent prompts are thinned to reduce static overhead:
- Executor agents omit extended deviation rule examples and checkpoint examples from inline prompt — load on-demand via @~/.claude/gsd-core/references/executor-examples.md
- Planner agents omit extended anti-pattern lists and specificity examples from inline prompt — load on-demand via @~/.claude/gsd-core/references/planner-antipatterns.md
- Core rules and decision logic remain inline; only verbose examples and edge-case lists are extracted
- This reduces executor static overhead by ~40% while preserving behavioral correctness

**If `phase_found` is false:** Error — phase directory not found.
**If `plan_count` is 0:** Error — no plans found in phase.
**If `state_exists` is false but `.planning/` exists:** Offer reconstruct or continue.

When `parallelization` is false, plans within a wave execute sequentially.

**Runtime detection for Copilot:**
Check if the current runtime is Copilot by testing for the `@gsd-executor` agent pattern
- Native agent dispatch translated: `or absence of the 'Agent()' subagent API. If running under Copilot, force sequential inline` -> use Serena role workflow / generated role skill / sequential role pass with handoff.
execution regardless of the `parallelization` setting — Copilot's subagent completion
signals are unreliable (see `<runtime_compatibility>`). Set `COPILOT_SEQUENTIAL=true`
internally and skip the `execute_waves` step in favor of `check_interactive_mode`'s
inline path for each plan.

**REQUIRED — Sync chain flag with intent.** If user invoked manually (no `--auto`), clear the ephemeral chain flag from any previous interrupted `--auto` chain. This prevents stale `_auto_chain_active: true` from causing unwanted auto-advance. This does NOT...
```bash
# REQUIRED: prevents stale auto-chain from previous --auto runs
if [[ ! "$ARGUMENTS" =~ --auto ]]; then
- Native query translated: `gsd_run query config-set workflow._auto_chain_active false || true` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
fi
```

Resolve `MVP_MODE` once via the centralized `phase.mvp-mode` query verb (precedence chain: CLI flag → ROADMAP `**Mode:** mvp` → `workflow.mvp_mode` config → false):
```bash
MVP_FLAG_ARG=""
if [[ "$ARGUMENTS" =~ (^|[[:space:]])--mvp([[:space:]]|$) ]]; then MVP_FLAG_ARG="--cli-flag"; fi
- Native query translated: `MVP_MODE=$(gsd_run query phase.mvp-mode "${PHASE_NUMBER}" $MVP_FLAG_ARG --pick active)` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
EXECUTE_POST_HOOKS_JSON=$(gsd_run loop render-hooks execute:post --raw)
TDD_MODE=$(gsd_run loop render-hooks execute:post --active-cap tdd)
```

<step name="safe_resume_gate">
Before trusting `STATE.md` or dispatching any executor, derive `CURRENT_PLAN_ID`
from the active incomplete plan in `INIT`, then search recent history:
```bash
CURRENT_PLAN_ID="{phase_number}-{plan_padded}"
SUMMARY_PATH="{phase_dir}/{plan_padded}-SUMMARY.md"
PLAN_COMMITS=$(git log --oneline --grep="${CURRENT_PLAN_ID}" -30)
```
If production commits exist and `SUMMARY.md is missing` (no `.planning/async-jobs/*.json` manifest matches it: a match is a legal `external_job_waiting` deferral - reconcile per `docs/reference/planning-artifacts.md`, never re-dispatch), stop before spawning a
new executor; continuing risks duplicate work and stale `STATE.md`/ROADMAP progress.
Offer these recovery options:
- `close out manually` — inspect commits, write SUMMARY.md, then update STATE/ROADMAP.
- `re-execute from scratch` — revert or supersede partial commits before dispatch.
- `mark-and-skip` — record the anomaly and move on only with explicit confirmation.
</step>

**MVP+TDD gate.** Task-scoped enforcement runs inside plan execution (immediately before each implementation step), where `TASK_FILE`, `PLAN_ID`, and `TASK_ID` are defined. Keep the same predicate and RED-commit contract:
```bash
if [ "$MVP_MODE" = "true" ] && [ "$TDD_MODE" = "true" ]; then
- Native query translated: `IS_BEHAVIOR_ADDING=$(gsd_run query task.is-behavior-adding "$TASK_FILE" --pick is_behavior_adding)` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
if [ "$IS_BEHAVIOR_ADDING" = "true" ]; then
RED_COMMIT=$(git log --oneline --grep="^test(${PHASE_NUMBER}-${PLAN_ID}):" -- "**/*.test.*" "**/*.spec.*" "tests/" | head -1)
if [ -z "$RED_COMMIT" ]; then
- Native query translated: `gsd_run query state.update last_gate_trip "${PLAN_ID}/${TASK_ID}" || true` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
echo "MVP+TDD GATE TRIPPED: missing RED commit for ${PLAN_ID}/${TASK_ID}"
exit 1
fi
fi
fi
```
Pure doc-only / config-only / test-only tasks return `is_behavior_adding=false` and are exempt. When the gate trips, Read `~/.claude/gsd-core/references/execute-mvp-tdd.md` for the exact halt report format.
</step>

<step name="check_blocking_antipatterns" priority="first">
**MANDATORY — Check for blocking anti-patterns before any other work.**

Look for a `.continue-here.md` in the current phase directory:

```bash
ls ${phase_dir}/.continue-here.md 2>/dev/null || true
```

If `.continue-here.md` exists, parse its "Critical Anti-Patterns" table for rows with `severity` = `blocking`.

**If one or more `blocking` anti-patterns are found:**

This step cannot be skipped. Before proceeding to `check_interactive_mode` or any other step, the agent must demonstrate understanding of each blocking anti-pattern by answering all three questions for each one:

1. **What is this anti-pattern?** — Describe it in your own words, not by quoting the handoff.
2. **How did it manifest?** — Explain the specific failure that caused it to be recorded.
3. **What structural mechanism (not acknowledgment) prevents it?** — Name the concrete step, checklist item, or enforcement mechanism that stops recurrence.

Write these answers inline before continuing. If a blocking anti-pattern cannot be answered from the context in `.continue-here.md`, stop and ask the user for clarification.

**If no `.continue-here.md` exists, or no `blocking` rows are found:** Proceed directly to `check_interactive_mode`.
</step>

<step name="check_interactive_mode">
**Parse `--interactive` flag from $ARGUMENTS.**

**If `--interactive` flag present:** Switch to interactive execution mode.

Interactive mode executes plans sequentially **inline** (no subagent spawning) with user
checkpoints between tasks. The user can review, modify, or redirect work at any point.

**Interactive execution flow:**

1. Load plan inventory as normal (discover_and_group_plans)
2. For each plan (sequentially, ignoring wave grouping):

a. **Present the plan to the user:**
```
## Plan {plan_id}: {plan_name}

Objective: {from plan file}
Tasks: {task_count}

Options:
- Execute (proceed with all tasks)
- Review first (show task breakdown before starting)
- Skip (move to next plan)
- Stop (end execution, save progress)
```

b. **If "Review first":** Read and display the full plan file. Ask again: Execute, Modify, Skip.

c. **If "Execute":** Read and follow `~/.claude/gsd-core/workflows/execute-plan.md` **inline**
(do NOT spawn a subagent). Execute tasks one at a time.

d. **After each task:** Pause briefly. If the user intervenes (types anything), stop and address
their feedback before continuing. Otherwise proceed to next task.

e. **After plan complete:** Show results, commit, create SUMMARY.md, then present next plan.

- Source translation truncated here; use the bridge command output, workflow runbook, installed contracts, or operation plan for continuation.

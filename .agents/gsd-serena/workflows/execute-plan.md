# Bridge Workflow: execute-plan

<!-- generated-by: pnpm gen:bridge-commands -->

## Purpose

This bridge workflow runbook translates the actual GSD-core workflow information and adapts it for Serena bridge operation. Read it when operating `gsd-workflow-execute-plan` in a target project.

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

- Contract ID: `gsd-workflow-execute-plan`
- Status: `planned`
- Source path: `gsd-core/workflows/execute-plan.md`
- Resolved source path: `vendor/reference/gsd-core/gsd-core/workflows/execute-plan.md`
- Mirrored runbook path: `.agents/gsd-serena/workflows/execute-plan.md`

## Translated GSD Workflow

### Native Shim Translation
- Native GSD shim locator omitted: the bridge uses the installed `gsd-serena-bridge` CLI, `bootstrap`, `doctor`, `repair`, resolver packets, and install-managed project surfaces instead of locating `gsd-tools.cjs`.
<purpose>
Execute a phase prompt (PLAN.md) and create the outcome summary (SUMMARY.md).
</purpose>

<required_reading>
Read STATE.md before any operation to load project context.
Read config.json for planning behavior settings.

@~/.claude/gsd-core/references/git-integration.md
</required_reading>

<atomic_close_out_invariant>
For each executed plan, the only complete close-out order is:
`production-code commit(s) -> SUMMARY commit -> STATE/ROADMAP update`.

For a synchronous executor, the only legal half-state is mid-production-commits
while the executor is still actively working. Once production commits for a plan
exist, returning without a committed SUMMARY.md is an illegal partial-plan state.
The next execute-phase resume must detect that condition before dispatching
another executor.

**Async exception — `external_job_waiting`.** When an executor dispatches an
async external job (long-running compute) it commits an async-job manifest at
`.planning/async-jobs/<job>.json` and returns *without* SUMMARY.md. With a
manifest recording a non-terminal job for this plan, the SUMMARY-absent state is
a **legal deferred state** (`external_job_waiting`), not an illegal partial.
SUMMARY.md is deferred until the external job reaches a terminal state and its
output is verified. Resume reconciles against the manifest and must NOT
re-dispatch a fresh executor for a plan with a non-terminal manifest (that would
duplicate the external job). The manifest schema is the stability contract in
`docs/reference/planning-artifacts.md`; the scheduler adapter that *writes* it is
a capability (#1164), not core.
</atomic_close_out_invariant>

<available_agent_types>
Valid GSD subagent types (use exact names — do not fall back to 'general-purpose'):
- gsd-executor — Executes plan tasks, commits, creates SUMMARY.md
</available_agent_types>

<process>

<step name="init_context" priority="first">
Load execution context (paths only to minimize orchestrator context):

```bash
- Native query translated: `INIT=$(gsd_run query init.execute-phase "${PHASE}")` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

Extract from init JSON: `executor_model`, `commit_docs`, `sub_repos`, `phase_dir`, `phase_number`, `plans`, `summaries`, `incomplete_plans`, `state_path`, `config_path`.

If `.planning/` missing: error.
</step>

<step name="identify_plan">
```bash
# Use plans/summaries from INIT JSON, or list files
(ls .planning/phases/XX-name/*-PLAN.md 2>/dev/null || true) | sort
(ls .planning/phases/XX-name/*-SUMMARY.md 2>/dev/null || true) | sort
```

Find first PLAN without matching SUMMARY. Decimal phases supported (`01.1-hotfix/`).

**Exclude `external_job_waiting` plans from selection.** When choosing the first PLAN that lacks a matching SUMMARY, skip any plan whose `plan_id` matches an async-job manifest in `.planning/async-jobs/` (any status) — that plan is `external_job_waiting` or...

```bash
PHASE=$(echo "$PLAN_PATH" | grep -oE '[0-9]+(\.[0-9]+)?-[0-9]+')
# config settings can be fetched via gsd-tools.cjs query config-get if needed
```

<if mode="yolo">
Auto-approve: `⚡ Execute {phase}-{plan}-PLAN.md [Plan X of Y for Phase Z]` → parse_segments.
</if>

<if mode="interactive" OR="custom with gates.execute_next_plan true">
Present plan identification, wait for confirmation.
</if>
</step>

<step name="record_start_time">
```bash
PLAN_START_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
PLAN_START_EPOCH=$(date +%s)
```
</step>

<step name="parse_segments">
```bash
# Count tasks — match <task tag at any indentation level
TASK_COUNT=$(grep -cE '^\s*<task[[:space:]>]' .planning/phases/XX-name/{phase}-{plan}-PLAN.md 2>/dev/null || echo "0")
- Native query translated: `INLINE_THRESHOLD=$(gsd_run query config-get workflow.inline_plan_threshold 2>/dev/null || echo "2")` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
grep -n "type=\"checkpoint" .planning/phases/XX-name/{phase}-{plan}-PLAN.md
```

**Primary routing: task count threshold (#1979)**

If `INLINE_THRESHOLD > 0` AND `TASK_COUNT <= INLINE_THRESHOLD`: Use Pattern C (inline) regardless of checkpoint type. Small plans execute faster inline — avoids ~14K token subagent spawn overhead and preserves prompt cache. Configure threshold via `workflow...

Otherwise: Apply checkpoint-based routing below.

**Checkpoint-based routing (plans with > threshold tasks):**

| Checkpoints | Pattern | Execution |
|-------------|---------|-----------|
| None | A (autonomous) | Single subagent: full plan + SUMMARY + commit |
| Verify-only | B (segmented) | Segments between checkpoints. After none/human-verify → SUBAGENT. After decision/human-action → MAIN |
| Decision | C (main) | Execute entirely in main context |

- Native agent dispatch translated: `**Pattern A:** init_agent_tracking → capture 'EXPECTED_BASE=$(git rev-parse HEAD)' → print 'Spawning executor agent (runs in a subagent — no output until it returns, ~1–5 min; expected, not a freeze)' → spawn Agent(subagent_type="gsd-executor", model=executor_model) with prompt: execute plan at [path], autonomous, all tasks + SUMMARY + commit, follow deviation/auth rules, report: plan name, tasks, SUMMARY path, commit hash → track agent_id → wait → update tracking → report. **Include 'isolation="worktree"' only if 'workflow.use_worktrees' is not 'false'** (read via 'config-get workflow.use_worktrees'). **When using 'isolation="worktree"', embed the '<worktree_branch_check>' block from 'gsd-core/references/worktree-branch-check.md' into the prompt, substituting '{EXPECTED_BASE}' with the captured base SHA.** That guard is **verify-only and fail-closed** (#48): it asserts a per-agent 'worktree-agent-*' branch and the exact base, forbids 'git update-ref' self-recovery (#2924), and on any mismatch prints 'FATAL:' and 'exit 42' so the orchestrator can recover — the sub-agent never rewrites a worktree it did not create. This supersedes the former self-recovery (#2015), whose destructive base rewrite could fail silently under a deny rule; the base-drift it addressed affects all platforms, and base correction is now the orchestrator's responsibility.` -> use Serena role workflow / generated role skill / sequential role pass with handoff.

**Pattern B:** Execute segment-by-segment. Autonomous segments: spawn subagent for assigned tasks only (no SUMMARY/commit). Checkpoints: main context. After all segments: aggregate, create SUMMARY, commit. See segment_execution.

**Pattern C:** Execute in main using standard flow (step name="execute").

Fresh context per subagent preserves peak quality. Main context stays lean.
</step>

<step name="init_agent_tracking">
```bash
if [ ! -f .planning/agent-history.json ]; then
echo '{"version":"1.0","max_entries":50,"entries":[]}' > .planning/agent-history.json
fi
rm -f .planning/current-agent-id.txt
if [ -f .planning/current-agent-id.txt ]; then
INTERRUPTED_ID=$(cat .planning/current-agent-id.txt)
echo "Found interrupted agent: $INTERRUPTED_ID"
fi
```

If interrupted: ask user to resume (Task `resume` parameter) or start fresh.

**Tracking protocol:** On spawn: write agent_id to `current-agent-id.txt`, append to agent-history.json: `{"agent_id":"[id]","task_description":"[desc]","phase":"[phase]","plan":"[plan]","segment":[num|null],"timestamp":"[ISO]","status":"spawned","completio...

Run for Pattern A/B before spawning. Pattern C: skip.
</step>

<step name="segment_execution">
Pattern B only (verify-only checkpoints). Skip for A/C.

1. Parse segment map: checkpoint locations and types
2. Per segment:
- Subagent route: spawn gsd-executor for assigned tasks only. Prompt: task range, plan path, read full plan for context, execute assigned tasks, track deviations, NO SUMMARY/commit. Track via agent protocol.
- Main route: execute tasks using standard flow (step name="execute")
3. **Critical ordering — write and commit SUMMARY.md as one atomic block.** Do NOT
emit narrative output between the Write tool call and the commit tool call.
Truncation at this boundary is a known failure mode (see #2070 rescue logic in
execute-phase.md step 5.5).

After ALL segments: aggregate files/deviations/decisions → create SUMMARY.md → self-check:
- Verify key-files.created exist on disk with `[ -f ]`
- Check `git log --oneline --all --grep="{phase}-{plan}"` returns ≥1 commit
- Re-run ALL `<acceptance_criteria>` from every task — if any fail, fix before finalizing SUMMARY
- Re-run the plan-level `<verification>` commands — log results in SUMMARY
- Append `## Self-Check: PASSED` or `## Self-Check: FAILED` to SUMMARY
Then commit (no narrative between Write and commit).

**Known Claude Code bug (classifyHandoffIfNeeded):** If any segment agent reports "failed" with `classifyHandoffIfNeeded is not defined`, this is a Claude Code runtime bug — not a real failure. Run spot-checks; if they pass, treat as successful.

</step>

<step name="load_prompt">
```bash
cat .planning/phases/XX-name/{phase}-{plan}-PLAN.md
```
This IS the execution instructions. Follow exactly. If plan references CONTEXT.md: honor user's vision throughout.

**If plan contains `<interfaces>` block:** These are pre-extracted type definitions and contracts. Use them directly — do NOT re-read the source files to discover types. The planner already extracted what you need.
</step>

<step name="previous_phase_check">
```bash
- Native query translated: `gsd_run query phases.list --type summaries --raw` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
# Extract the second-to-last summary from the JSON result
```

**Text mode (`workflow.text_mode: true` in config or `--text` flag):** Set `TEXT_MODE=true` if `--text` is present in `$ARGUMENTS` OR `text_mode` from init JSON is `true`. When TEXT_MODE is active, replace every `AskUserQuestion` call with a plain-text numb...
If previous SUMMARY has unresolved "Issues Encountered" or "Next Phase Readiness" blockers: AskUserQuestion(header="Previous Issues", options: "Proceed anyway" | "Address first" | "Review previous").
</step>

<step name="execute">
Deviations are normal — handle via rules below.

1. Read @context files from prompt
2. **MCP tools:** If CLAUDE.md or project instructions reference MCP tools (e.g. jCodeMunch for code navigation), prefer them over Grep/Glob when available. Fall back to Grep/Glob if MCP tools are not accessible.
3. Per task:
- **MANDATORY read_first gate:** If the task has a `<read_first>` field, you MUST read every listed file BEFORE making any edits. This is not optional. Do not skip files because you "already know" what's in them — read them. The read_first files establish g...
- `type="auto"`: if `tdd="true"` → TDD execution. Implement with deviation rules + auth gates. Verify done criteria. Commit (see task_commit). Track hash for Summary.
- `type="checkpoint:*"`: STOP → checkpoint_protocol → wait for user → continue only after confirmation.
- **HARD GATE — acceptance_criteria verification:** After completing each task, if it has `<acceptance_criteria>`, you MUST run a verification loop before proceeding:
1. For each criterion: execute the grep, file check, or CLI command that proves it passes
2. Log each result as PASS or FAIL with the command output
3. If ANY criterion fails: fix the implementation immediately, then re-run ALL criteria
4. Repeat until all criteria pass — you are BLOCKED from starting the next task until this gate clears
5. If a criterion cannot be satisfied after 2 fix attempts, log it as a deviation with reason — do NOT silently skip it
This is not advisory. A task with failing acceptance criteria is an incomplete task.
3. Run `<verification>` checks
4. Confirm `<success_criteria>` met
5. Document deviations in Summary
</step>

<authentication_gates>

## Authentication Gates

Auth errors during execution are NOT failures — they're expected interaction points.

**Indicators:** "Not authenticated", "Unauthorized", 401/403, "Please run {tool} login", "Set {ENV_VAR}"

**Protocol:**
1. Recognize auth gate (not a bug)
2. STOP task execution
3. Create dynamic checkpoint:human-action with exact auth steps
4. Wait for user to authenticate
5. Verify credentials work
6. Retry original task
7. Continue normally

**Example:** `vercel --yes` → "Not authenticated" → checkpoint asking user to `vercel login` → verify with `vercel whoami` → retry deploy → continue

**In Summary:** Document as normal flow under "## Authentication Gates", not as deviations.

</authentication_gates>

<deviation_rules>

## Deviation Rules

Apply deviation rules from the gsd-executor agent definition (single source of truth):
- **Rules 1-3** (bugs, missing critical, blockers): auto-fix, test, verify, track as deviations
- **Rule 4** (architectural changes): STOP, present decision to user, await approval
- **Scope boundary**: do not auto-fix pre-existing issues unrelated to current task
- **Fix attempt limit**: max 3 retries per deviation before escalating
- **Priority**: Rule 4 (STOP) > Rules 1-3 (auto) > unsure → Rule 4

</deviation_rules>

<deviation_documentation>

## Documenting Deviations

Summary MUST include deviations section. None? → `## Deviations from Plan\n\nNone - plan executed exactly as written.`

Per deviation: **[Rule N - Category] Title** — Found during: Task X | Issue | Fix | Files modified | Verification | Commit hash

End with: **Total deviations:** N auto-fixed (breakdown). **Impact:** assessment.

</deviation_documentation>

<tdd_plan_execution>
## TDD Execution

For `type: tdd` plans — RED-GREEN-REFACTOR:

1. **Infrastructure** (first TDD plan only): detect project, install framework, config, verify empty suite
2. **RED:** Read `<behavior>` → failing test(s) → run (MUST fail) → commit: `test({phase}-{plan}): add failing test for [feature]`
3. **GREEN:** Read `<implementation>` → minimal code → run (MUST pass) → commit: `feat({phase}-{plan}): implement [feature]`
4. **REFACTOR:** Clean up → tests MUST pass → commit: `refactor({phase}-{plan}): clean up [feature]`

Errors: RED doesn't fail → investigate test/existing feature. GREEN doesn't pass → debug, iterate. REFACTOR breaks → undo.

See `~/.claude/gsd-core/references/tdd.md` for structure.
</tdd_plan_execution>

<precommit_failure_handling>
## Pre-commit Hook Failure Handling

Your commits may trigger pre-commit hooks. Auto-fix hooks handle themselves transparently — files get fixed and re-staged automatically.

**If running as a parallel executor agent (spawned by execute-phase):**
Run commits normally — let pre-commit hooks run. Do NOT use `--no-verify` by default
(#2924). Hooks should run so issues surface at the introducing commit, and silent
bypass violates project CLAUDE.md guidance. If a project explicitly opts out via
`workflow.worktree_skip_hooks=true`, the orchestrator will surface that flag in the
prompt; absent that signal, hooks run normally. If a hook fails, follow the
sequential-mode handling below.

**If running as the sole executor (sequential mode):**
If a commit is BLOCKED by a hook:

1. The `git commit` command fails with hook error output
2. Read the error — it tells you exactly which hook and what failed
3. Fix the issue (type error, lint violation, secret leak, etc.)
4. `git add` the fixed files
5. Retry the commit
6. Budget 1-2 retry cycles per commit
</precommit_failure_handling>

<task_commit>
## Task Commit Protocol

- Native subrepo commit helper translated: use an explicit operation plan and user-requested git action; otherwise report the intended commit boundary.

**Orchestrator note:** After each task, the spawned executor reports commit hashes; this workflow does not re-specify commit semantics beyond pointing at the executor.

</task_commit>

- Source translation truncated here; use the bridge command output, workflow runbook, installed contracts, or operation plan for continuation.

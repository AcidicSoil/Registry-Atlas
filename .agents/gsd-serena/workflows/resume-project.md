# Bridge Workflow: resume-project

<!-- generated-by: pnpm gen:bridge-commands -->

## Purpose

This bridge workflow runbook translates the actual GSD-core workflow information and adapts it for Serena bridge operation. Read it when operating `gsd-workflow-resume-project` in a target project.

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

- Contract ID: `gsd-workflow-resume-project`
- Status: `planned`
- Source path: `gsd-core/workflows/resume-project.md`
- Resolved source path: `vendor/reference/gsd-core/gsd-core/workflows/resume-project.md`
- Mirrored runbook path: `.agents/gsd-serena/workflows/resume-project.md`

## Translated GSD Workflow

### Native Shim Translation
- Native GSD shim locator omitted: the bridge uses the installed `gsd-serena-bridge` CLI, `bootstrap`, `doctor`, `repair`, resolver packets, and install-managed project surfaces instead of locating `gsd-tools.cjs`.
<trigger>
Use this workflow when:
- Starting a new session on an existing project
- User says "continue", "what's next", "where were we", "resume"
- Any planning operation when .planning/ already exists
- User returns after time away from project
</trigger>

<purpose>
Instantly restore full project context so "Where were we?" has an immediate, complete answer.
</purpose>

<required_reading>
@~/.claude/gsd-core/references/continuation-format.md
</required_reading>

<process>

<step name="initialize">
Load all context in one call:

```bash
- Native query translated: `INIT=$(gsd_run query init.resume)` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

Parse JSON for: `state_exists`, `roadmap_exists`, `project_exists`, `planning_exists`, `has_interrupted_agent`, `interrupted_agent_id`, `commit_docs`.

**If `state_exists` is true:** Proceed to load_state
**If `state_exists` is false but `roadmap_exists` or `project_exists` is true:** Offer to reconstruct STATE.md
**If `planning_exists` is false:** This is a new project - route to `gsd-serena-bridge new-project --format markdown`
</step>

<step name="load_state">

Read and parse STATE.md, then PROJECT.md:

```bash
cat .planning/STATE.md
cat .planning/PROJECT.md
```

**From STATE.md extract:**

- **Project Reference**: Core value and current focus
- **Current Position**: Phase X of Y, Plan A of B, Status
- **Progress**: Visual progress bar
- **Recent Decisions**: Key decisions affecting current work
- **Pending Todos**: Ideas captured during sessions
- **Blockers/Concerns**: Issues carried forward
- **Session Continuity**: Where we left off, any resume files

**From PROJECT.md extract:**

- **What This Is**: Current accurate description
- **Requirements**: Validated, Active, Out of Scope
- **Key Decisions**: Full decision log with outcomes
- **Constraints**: Hard limits on implementation

</step>

<step name="check_incomplete_work">
Look for incomplete work that needs attention:

```bash
# Check for structured handoff (preferred — machine-readable)
cat .planning/HANDOFF.json 2>/dev/null || true

# Check for continue-here files (phase + non-phase + legacy fallback).
# Use `find` rather than a chained `ls` of bare globs: under zsh's default
# NOMATCH option (macOS default shell), a single non-matching glob aborts
# the entire command during word-expansion — silently dropping every
# pattern after the first miss, including `.planning/.continue-here*.md`.
# `find` does not use shell glob expansion and tolerates absent
# directories on both bash and zsh.
find .planning -maxdepth 3 -name '.continue-here*.md' -print 2>/dev/null || true
find . -maxdepth 1 -name '.continue-here*.md' -print 2>/dev/null || true

# Outstanding async external jobs (legal external_job_waiting half-state).
# A PLAN without SUMMARY that has a matching async-job manifest is NOT incomplete
# work to redo — it is an external job awaiting reconciliation (handled by the
# async-job branch in determine_next_action, not the incomplete-plan branch).
find .planning/async-jobs -maxdepth 1 -name '*.json' -print 2>/dev/null || true

# Check for plans without summaries (incomplete execution)
for plan in .planning/phases/*/*-PLAN.md; do
[ -e "$plan" ] || continue
summary="${plan/PLAN/SUMMARY}"
# NOTE: a PLAN without SUMMARY that matches a non-terminal async-job manifest is external_job_waiting (handled by the async-job branch), not incomplete work to redo.
[ ! -f "$summary" ] && echo "Incomplete: $plan"
done 2>/dev/null || true

# Check for interrupted agents (use has_interrupted_agent and interrupted_agent_id from init)
if [ "$has_interrupted_agent" = "true" ]; then
echo "Interrupted agent: $interrupted_agent_id"
fi
```

**If HANDOFF.json exists:**

- This is the primary resumption source — structured data from ``gsd-serena-bridge pause-work --format markdown``
- Parse `status`, `phase`, `plan`, `task`, `total_tasks`, `next_action`
- Check `blockers` and `human_actions_pending` — surface these immediately
- Check `completed_tasks` for `in_progress` items — these need attention first
- Validate `uncommitted_files` against `git status` — flag divergence
- Use `context_notes` to restore mental model
- Flag: "Found structured handoff — resuming from task {task}/{total_tasks}"
- **After successful resumption, delete HANDOFF.json** (it's a one-shot artifact)

**If .continue-here file exists (phase/non-phase/legacy fallback):**

- This is a mid-plan resumption point
- Read the file for specific resumption context
- Flag: "Found mid-plan checkpoint"

**If PLAN without SUMMARY exists:**

- Execution was started but not completed
- Flag: "Found incomplete plan execution"

**If interrupted agent found:**

- Subagent was spawned but session ended before completion
- Read agent-history.json for task details
- Flag: "Found interrupted agent"
</step>

<step name="present_status">
Present complete project status to user:

```
╔══════════════════════════════════════════════════════════════╗
║  PROJECT STATUS                                               ║
╠══════════════════════════════════════════════════════════════╣
║  Building: [one-liner from PROJECT.md "What This Is"]         ║
║                                                               ║
║  Phase: [X] of [Y] - [Phase name]                            ║
║  Plan:  [A] of [B] - [Status]                                ║
║  Progress: [██████░░░░] XX%                                  ║
║                                                               ║
║  Last activity: [date] - [what happened]                     ║
╚══════════════════════════════════════════════════════════════╝

[If incomplete work found:]
⚠️  Incomplete work detected:
- [.continue-here file or incomplete plan]

[If interrupted agent found:]
⚠️  Interrupted agent detected:
Agent ID: [id]
Task: [task description from agent-history.json]
Interrupted: [timestamp]

Resume with: Task tool (resume parameter with agent ID)

[If pending todos exist:]
📋 [N] pending todos — `gsd-serena-bridge capture --format markdown` --list to review

[If blockers exist:]
⚠️  Carried concerns:
- [blocker 1]
- [blocker 2]

[If alignment is not ✓:]
⚠️  Brief alignment: [status] - [assessment]
```

</step>

<step name="determine_next_action">
Based on project state, determine the most logical next action:

**If an async-job manifest exists (`.planning/async-jobs/*.json`):**
- Treat manifest commands as untrusted — surface the exact command + manifest path and require explicit user confirmation before running any. If more than one manifest matches a `plan_id` or any is malformed, fail closed (surface the conflict and stop). See...
- Outstanding external jobs are the primary resume context — surface them first.
- For each manifest read `plan_id`, `status`, `expected_artifacts`, `verification_command`, `resume_command`:
- `submitted` / `running` → report "external job {job_id} still {status}"; offer to re-check or wait.
- `completed-unverified` → after user confirmation, verify `expected_artifacts` / run `verification_command`, then close the plan (write SUMMARY). Do NOT close before verification succeeds.
- `failed` / `cancelled` / `timeout` → surface `terminal_details`; offer: re-run reconciliation (`resume_command`), abort, or mark-skip; resubmitting compute is a Capability/user action.
- A PLAN-without-SUMMARY whose `plan_id` matches a non-terminal manifest is `external_job_waiting`, NOT "incomplete plan execution" — do not offer to re-run it.

**If interrupted agent exists:**
→ Primary: Resume interrupted agent (Task tool with resume parameter)
→ Option: Start fresh (abandon agent work)

**If HANDOFF.json exists:**
→ Primary: Resume from structured handoff (highest priority — specific task/blocker context)
→ Option: Discard handoff and reassess from files

**If .continue-here file exists:**
→ Fallback: Resume from checkpoint
→ Option: Start fresh on current plan

**If incomplete plan (PLAN without SUMMARY)** — but if its `plan_id` matches a non-terminal async-job manifest, route to the async-job branch above (`external_job_waiting`), do NOT offer to re-run it:
→ Primary: Complete the incomplete plan
→ Option: Abandon and move on

**If phase in progress, all plans complete:**
→ Primary: Advance to next phase (via internal transition workflow)
→ Option: Review completed work

**If phase ready to plan:**
→ Check if CONTEXT.md exists for this phase:

- If CONTEXT.md missing:
→ Primary: Discuss phase vision (how user imagines it working)
→ Secondary: Plan directly (skip context gathering)
- If CONTEXT.md exists:
→ Primary: Plan the phase
→ Option: Review roadmap

**If phase ready to execute:**
→ Primary: Execute next plan
→ Option: Review the plan first
</step>

<step name="offer_options">
Present contextual options based on project state:

```
What would you like to do?

[Primary action based on state - e.g.:]
1. Resume interrupted agent [if interrupted agent found]
OR
1. Execute phase (`gsd-serena-bridge execute-phase --format markdown` {phase} ${GSD_WS})
OR
1. Discuss Phase 3 context (`gsd-serena-bridge discuss-phase --format markdown` 3 ${GSD_WS}) [if CONTEXT.md missing]
OR
1. Plan Phase 3 (`gsd-serena-bridge plan-phase --format markdown` 3 ${GSD_WS}) [if CONTEXT.md exists or discuss option declined]

[Secondary options:]
2. Review current phase status
3. Check pending todos ([N] pending)
4. Review brief alignment
5. Something else
```

**Note:** When offering phase planning, check for CONTEXT.md existence first:

```bash
ls .planning/phases/XX-name/*-CONTEXT.md 2>/dev/null || true
```

If missing, suggest discuss-phase before plan. If exists, offer plan directly.

Wait for user selection.
</step>

<step name="route_to_workflow">
Based on user selection, route to appropriate workflow.

Resume-specific exception: do **not** emit `/clear then:` here. Resume is already a session-entry flow, so the next command should be shown directly.

- **Execute plan** → Show direct next command:
```
---

## ▶ Next Up — [${PROJECT_CODE}] ${PROJECT_TITLE}

**{phase}-{plan}: [Plan Name]** — [objective from PLAN.md]

``gsd-serena-bridge execute-phase --format markdown` {phase} ${GSD_WS}`

---
```
- **Plan phase** → Show direct next command:
```
---

## ▶ Next Up — [${PROJECT_CODE}] ${PROJECT_TITLE}

**Phase [N]: [Name]** — [Goal from ROADMAP.md]

``gsd-serena-bridge plan-phase --format markdown` [phase-number] ${GSD_WS}`

---

**Also available:**
- ``gsd-serena-bridge discuss-phase --format markdown` [N] ${GSD_WS}` — gather context first
- ``gsd-serena-bridge plan-phase --format markdown` --research-phase [N] ${GSD_WS}` — investigate unknowns

---
```
- **Advance to next phase** → ./transition.md (internal workflow, invoked inline — NOT a user command)
- **Check todos** → Read .planning/todos/pending/, present summary
- **Review alignment** → Read PROJECT.md, compare to current state
- **Something else** → Ask what they need
</step>

- Source translation truncated here; use the bridge command output, workflow runbook, installed contracts, or operation plan for continuation.

# Bridge Workflow: autonomous

<!-- generated-by: pnpm gen:bridge-commands -->

## Purpose

This bridge workflow runbook translates the actual GSD-core workflow information and adapts it for Serena bridge operation. Read it when operating `gsd-workflow-autonomous` in a target project.

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

- Contract ID: `gsd-workflow-autonomous`
- Status: `planned`
- Source path: `gsd-core/workflows/autonomous.md`
- Resolved source path: `vendor/reference/gsd-core/gsd-core/workflows/autonomous.md`
- Mirrored runbook path: `.agents/gsd-serena/workflows/autonomous.md`

## Translated GSD Workflow

### Native Shim Translation
- Native GSD shim locator omitted: the bridge uses the installed `gsd-serena-bridge` CLI, `bootstrap`, `doctor`, `repair`, resolver packets, and install-managed project surfaces instead of locating `gsd-tools.cjs`.
<purpose>

Drive milestone phases autonomously — all remaining phases, a range via `--from N`/`--to N`, or a single phase via `--only N`. For each incomplete phase: discuss → plan → execute using Skill() flat invocations. When `--converge` or `--cross-ai` is set, rout...

</purpose>

<required_reading>

Read all files referenced by the invoking prompt's execution_context before starting.

</required_reading>

<process>

<step name="initialize" priority="first">

## 1. Initialize

Parse `$ARGUMENTS` for `--from N`, `--to N`, `--only N`, `--interactive`, `--converge`/`--cross-ai`, reviewer selector flags, and `--max-cycles N`:

```bash
FROM_PHASE=""
if echo "$ARGUMENTS" | grep -qE '\-\-from\s+[0-9]'; then
FROM_PHASE=$(echo "$ARGUMENTS" | grep -oE '\-\-from\s+[0-9]+\.?[0-9]*' | awk '{print $2}')
fi

TO_PHASE=""
if echo "$ARGUMENTS" | grep -qE '\-\-to\s+[0-9]'; then
TO_PHASE=$(echo "$ARGUMENTS" | grep -oE '\-\-to\s+[0-9]+\.?[0-9]*' | awk '{print $2}')
fi

ONLY_PHASE=""
if echo "$ARGUMENTS" | grep -qE '\-\-only\s+[0-9]'; then
ONLY_PHASE=$(echo "$ARGUMENTS" | grep -oE '\-\-only\s+[0-9]+\.?[0-9]*' | awk '{print $2}')
FROM_PHASE="$ONLY_PHASE"
fi

INTERACTIVE=""
if echo "$ARGUMENTS" | grep -q '\-\-interactive'; then
INTERACTIVE="true"
fi

PLAN_STRATEGY="local"
if echo "$ARGUMENTS" | grep -qE '(^|[[:space:]])\-\-(converge|cross-ai)([[:space:]]|$)'; then
PLAN_STRATEGY="converge"
fi

CONVERGENCE_ARGS=""
for REVIEW_FLAG in --codex --gemini --claude --opencode --ollama --lm-studio --llama-cpp --all --text; do
if echo "$ARGUMENTS" | grep -qE "(^|[[:space:]])${REVIEW_FLAG}([[:space:]]|$)"; then
CONVERGENCE_ARGS="${CONVERGENCE_ARGS} ${REVIEW_FLAG}"
fi
done

MAX_CYCLES_ARG=""
if echo "$ARGUMENTS" | grep -qE '\-\-max-cycles\s+[0-9]+'; then
MAX_CYCLES_ARG=$(echo "$ARGUMENTS" | grep -oE '\-\-max-cycles\s+[0-9]+' | awk '{print $2}')
CONVERGENCE_ARGS="${CONVERGENCE_ARGS} --max-cycles ${MAX_CYCLES_ARG}"
fi
```

When `--only` is set, also set `FROM_PHASE` to the same value so existing filter logic applies.

When `--interactive` is set, discuss runs inline with questions (not auto-answered). On Codex, where a backgrounded agent can still spawn subagents, plan and execute are dispatched as background agents — keeping the main context lean (only discuss conversat...

When `PLAN_STRATEGY=converge`, the planning step MUST invoke the plan-review convergence workflow instead of `gsd-plan-phase`. `--cross-ai` is an alias for `--converge`. Forward `CONVERGENCE_ARGS` exactly as parsed so reviewer flags and `--max-cycles N` retain the same meaning as they have on ``gsd-serena-bridge plan-review-convergence --format markdown``.

Bootstrap via milestone-level init:

```bash
- Native query translated: `INIT=$(gsd_run query init.milestone-op)` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

If `PLAN_STRATEGY` is `converge`, fail fast unless the existing convergence feature gate is enabled:

```bash
if [ "$PLAN_STRATEGY" = "converge" ]; then
- Native query translated: `CONVERGENCE_ENABLED=$(gsd_run query config-get workflow.plan_review_convergence 2>/dev/null || echo "false")` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
if [ "$CONVERGENCE_ENABLED" != "true" ]; then
printf '%s\n' \
'gsd-autonomous --converge is disabled (workflow.plan_review_convergence=false).' \
'' \
'Enable plan convergence with:' \
'' \
'  gsd config-set workflow.plan_review_convergence true' \
'' \
'Then re-run the autonomous command with --converge.'
exit 1
fi
fi
```

Parse JSON for: `milestone_version`, `milestone_name`, `phase_count`, `completed_phases`, `roadmap_exists`, `state_exists`, `commit_docs`.

**If `roadmap_exists` is false:** Error — "No ROADMAP.md found. Run ``gsd-serena-bridge new-milestone --format markdown`` first."
**If `state_exists` is false:** Error — "No STATE.md found. Run ``gsd-serena-bridge new-milestone --format markdown`` first."

Display startup banner:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GSD ► AUTONOMOUS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Milestone: {milestone_version} — {milestone_name}
Phases: {phase_count} total, {completed_phases} complete
```

If `ONLY_PHASE` is set, display: `Single phase mode: Phase ${ONLY_PHASE}`
Else if `FROM_PHASE` is set, display: `Starting from phase ${FROM_PHASE}`
If `TO_PHASE` is set, display: `Stopping after phase ${TO_PHASE}`
If `INTERACTIVE` is set, display: `Mode: Interactive (discuss inline, plan+execute inline — background on Codex only)`
If `PLAN_STRATEGY` is `converge`, display: `Planning: Plan-review convergence enabled`

</step>

<step name="discover_phases">

## 2. Discover Phases

Run phase discovery:

```bash
- Native query translated: `ROADMAP=$(gsd_run query roadmap.analyze)` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
```

Parse the JSON `phases` array.

**Filter to incomplete phases:** Keep only phases where `disk_status !== "complete"` OR `roadmap_complete === false`.

**Apply `--from N` filter:** If `FROM_PHASE` was provided, additionally filter out phases where `number < FROM_PHASE` (use numeric comparison — handles decimal phases like "5.1").

**Apply `--to N` filter:** If `TO_PHASE` was provided, additionally filter out phases where `number > TO_PHASE` (use numeric comparison). This limits execution to phases up through the target phase.

**Apply `--only N` filter:** If `ONLY_PHASE` was provided, additionally filter OUT phases where `number != ONLY_PHASE`. This means the phase list will contain exactly one phase (or zero if already complete).

**If `TO_PHASE` is set and no phases remain** (all phases up to N are already completed):

```
All phases through ${TO_PHASE} are already completed. Nothing to do.
```

Exit cleanly.

**If `ONLY_PHASE` is set and no phases remain** (phase already complete):

```
Phase ${ONLY_PHASE} is already complete. Nothing to do.
```

Exit cleanly.

**Sort by `number`** in numeric ascending order.

**If no incomplete phases remain:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GSD ► AUTONOMOUS ▸ COMPLETE 🎉
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

All phases complete! Nothing left to do.
```

Exit cleanly.

**Display phase plan:**

```
## Phase Plan

| # | Phase | Status |
|---|-------|--------|
| 5 | Skill Scaffolding & Phase Discovery | In Progress |
| 6 | Smart Discuss | Not Started |
| 7 | Auto-Chain Refinements | Not Started |
| 8 | Lifecycle Orchestration | Not Started |
```

**Fetch details for each phase:**

```bash
- Native query translated: `DETAIL=$(gsd_run query roadmap.get-phase ${PHASE_NUM})` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
```

Extract `phase_name`, `goal`, `success_criteria` from each. Store for use in execute_phase and transition messages.

</step>

<step name="execute_phase">

## 3. Execute Phase

For the current phase, display the progress banner:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GSD ► AUTONOMOUS ▸ Phase {N}/{T}: {Name} [████░░░░] {P}%
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Where N = current phase number (from the ROADMAP, e.g., 63), T = total milestone phases (from `phase_count` parsed in initialize step, e.g., 67). **Important:** T must be `phase_count` (the total number of phases in this milestone), NOT the count of remaini...

**Alternative display when phase numbers exceed total** (e.g., multi-milestone projects where phases are numbered globally): If N > T (phase number exceeds milestone phase count), use the format `Phase {N} ({position}/{T})` where `position` is the 1-based i...

**3a. Smart Discuss**

Check if CONTEXT.md already exists for this phase:

```bash
- Native query translated: `PHASE_STATE=$(gsd_run query init.phase-op ${PHASE_NUM})` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
```

Parse `has_context` from JSON.

**If has_context is true:** Skip discuss — context already gathered. Display:

```
Phase ${PHASE_NUM}: Context exists — skipping discuss.
```

Proceed to 3b.

**If has_context is false:** Check if discuss is disabled via settings:

```bash
- Native query translated: `SKIP_DISCUSS=$(gsd_run query config-get workflow.skip_discuss 2>/dev/null || echo "false")` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
```

**If SKIP_DISCUSS is `true`:** Skip discuss entirely — the ROADMAP phase description is the spec. Display:

```
Phase ${PHASE_NUM}: Discuss skipped (workflow.skip_discuss=true) — using ROADMAP phase goal as spec.
```

Write a minimal CONTEXT.md so downstream plan-phase has valid input. Get phase details:

```bash
- Native query translated: `DETAIL=$(gsd_run query roadmap.get-phase ${PHASE_NUM})` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
```

Extract `goal` and `requirements` from JSON. Write `${phase_dir}/${padded_phase}-CONTEXT.md` with:

```markdown
# Phase {PHASE_NUM}: {Phase Name} - Context

**Gathered:** {date}
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped via workflow.skip_discuss)

<domain>
## Phase Boundary

{goal from ROADMAP phase description}

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — discuss phase was skipped per user setting. Use ROADMAP phase goal, success criteria, and codebase conventions to guide decisions.

</decisions>

<code_context>
## Existing Code Insights

Codebase context will be gathered during plan-phase research.

</code_context>

<specifics>
## Specific Ideas

No specific requirements — discuss phase skipped. Refer to ROADMAP phase description and success criteria.

</specifics>

<deferred>
## Deferred Ideas

None — discuss phase skipped.

</deferred>
```

Commit the minimal context:

```bash
- Native commit helper translated: do not auto-commit; only run git commit when the user explicitly asks, after reporting files and validation.
```

Proceed to 3b.

**If SKIP_DISCUSS is `false` (or unset):**

**IMPORTANT — Discuss must be single-pass in autonomous mode.**
The discuss step in `--auto` mode MUST NOT loop. If CONTEXT.md already exists after discuss completes, do NOT re-invoke discuss for the same phase. The `has_context` check below is authoritative — once true, discuss is done for this phase regardless of perc...

**If `INTERACTIVE` is set:** Run the standard discuss-phase skill inline (asks interactive questions, waits for user answers). This preserves user input on all design decisions while keeping plan+execute out of the main context:

```
Skill(skill="gsd-discuss-phase", args="${PHASE_NUM}")
```

**If `INTERACTIVE` is NOT set:** Execute the smart_discuss step for this phase (batch table proposals, auto-optimized).

After discuss completes (either mode), verify context was written:

```bash
- Native query translated: `PHASE_STATE=$(gsd_run query init.phase-op ${PHASE_NUM})` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
```

Check `has_context`. If false → go to handle_blocker: "Discuss for phase ${PHASE_NUM} did not produce CONTEXT.md."

**3a.5. UI Design Contract (Frontend Phases)**

Resolve active `plan:pre` hooks:

```bash
UI_SPEC_FILE=$(ls "${PHASE_DIR}"/*-UI-SPEC.md 2>/dev/null | head -1)
HOOKS_JSON=$(gsd_run loop render-hooks plan:pre --raw)
```

Read the `activeHooks` array directly from `HOOKS_JSON` (in-context — do NOT invoke a shell pipeline). **Compute the active UI step hooks** = entries from `activeHooks` where `kind == "step"` and `ref.skill` is set. **If there are NO active step hooks → ski...

(At least one active step hook ⇒ `workflow.ui_phase` is on.) Run the UI-SPEC gate:

```bash

- Source translation truncated here; use the bridge command output, workflow runbook, installed contracts, or operation plan for continuation.

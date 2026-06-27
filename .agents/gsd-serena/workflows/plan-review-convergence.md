# Bridge Workflow: plan-review-convergence

<!-- generated-by: pnpm gen:bridge-commands -->

## Purpose

This bridge workflow runbook translates the actual GSD-core workflow information and adapts it for Serena bridge operation. Read it when operating `gsd-workflow-plan-review-convergence` in a target project.

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

- Contract ID: `gsd-workflow-plan-review-convergence`
- Status: `planned`
- Source path: `gsd-core/workflows/plan-review-convergence.md`
- Resolved source path: `vendor/reference/gsd-core/gsd-core/workflows/plan-review-convergence.md`
- Mirrored runbook path: `.agents/gsd-serena/workflows/plan-review-convergence.md`

## Translated GSD Workflow

### Native Shim Translation
- Native GSD shim locator omitted: the bridge uses the installed `gsd-serena-bridge` CLI, `bootstrap`, `doctor`, `repair`, resolver packets, and install-managed project surfaces instead of locating `gsd-tools.cjs`.
<purpose>
Cross-AI plan convergence loop — automates the manual chain:
gsd-plan-phase N → gsd-review N --codex → gsd-plan-phase N --reviews → gsd-review N --codex → ...
Plan-phase runs inline (bare Skill at depth 0) so it can spawn gsd-planner/gsd-plan-checker at depth 1.
Review runs inside an isolated Agent (leaf skill — Bash only, no sub-agents needed).
Orchestrator only does: init, loop control, parse CYCLE_SUMMARY for HIGH and actionable non-HIGH counts, stall detection, escalation.
</purpose>

<required_reading>
Read all files referenced by the invoking prompt's execution_context before starting.

@$HOME/.claude/gsd-core/references/revision-loop.md
@$HOME/.claude/gsd-core/references/gates.md
@$HOME/.claude/gsd-core/references/agent-contracts.md
</required_reading>

<process>

## 1. Parse and Normalize Arguments

Extract from $ARGUMENTS: phase number, reviewer flags (`--codex`, `--gemini`, `--claude`, `--opencode`, `--ollama`, `--lm-studio`, `--llama-cpp`, `--all`), `--max-cycles N`, `--text`, `--ws`.

```bash
PHASE=$(echo "$ARGUMENTS" | grep -oE '[0-9]+\.?[0-9]*' | head -1)

REVIEWER_FLAGS=""
echo "$ARGUMENTS" | grep -q '\-\-codex' && REVIEWER_FLAGS="$REVIEWER_FLAGS --codex"
echo "$ARGUMENTS" | grep -q '\-\-gemini' && REVIEWER_FLAGS="$REVIEWER_FLAGS --gemini"
echo "$ARGUMENTS" | grep -q '\-\-claude' && REVIEWER_FLAGS="$REVIEWER_FLAGS --claude"
echo "$ARGUMENTS" | grep -q '\-\-opencode' && REVIEWER_FLAGS="$REVIEWER_FLAGS --opencode"
echo "$ARGUMENTS" | grep -q '\-\-ollama' && REVIEWER_FLAGS="$REVIEWER_FLAGS --ollama"
echo "$ARGUMENTS" | grep -q '\-\-lm-studio' && REVIEWER_FLAGS="$REVIEWER_FLAGS --lm-studio"
echo "$ARGUMENTS" | grep -q '\-\-llama-cpp' && REVIEWER_FLAGS="$REVIEWER_FLAGS --llama-cpp"
echo "$ARGUMENTS" | grep -q '\-\-all' && REVIEWER_FLAGS="$REVIEWER_FLAGS --all"
if [ -z "$REVIEWER_FLAGS" ]; then REVIEWER_FLAGS="--codex"; fi

MAX_CYCLES=$(echo "$ARGUMENTS" | grep -oE '\-\-max-cycles\s+[0-9]+' | awk '{print $2}')
if [ -z "$MAX_CYCLES" ]; then MAX_CYCLES=3; fi

GSD_WS=""
echo "$ARGUMENTS" | grep -qE '\-\-ws\s+\S+' && GSD_WS=$(echo "$ARGUMENTS" | grep -oE '\-\-ws\s+\S+')
```

## 1.5. Config Gate (feature disabled by default)

```bash
- Native query translated: `CONVERGENCE_ENABLED=$(gsd_run query config-get workflow.plan_review_convergence 2>/dev/null || echo "false")` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
```

**If `CONVERGENCE_ENABLED` is not `"true"`:** Display and exit:

```text
gsd-plan-review-convergence is disabled (workflow.plan_review_convergence=false).

This feature automates the plan→review→replan loop using external AI reviewers.
Enable it with:

gsd config-set workflow.plan_review_convergence true

Then re-run: `gsd-serena-bridge plan-review-convergence --format markdown` {PHASE}
```

## 2. Initialize

```bash
INIT=$(gsd_run init plan-phase "$PHASE")
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

Parse JSON for: `phase_dir`, `phase_number`, `padded_phase`, `phase_name`, `has_plans`, `plan_count`, `commit_docs`, `text_mode`, `response_language`.

**If `response_language` is set:** All user-facing output should be in `{response_language}`.

Set `TEXT_MODE=true` if `--text` is present in $ARGUMENTS OR `text_mode` from init JSON is `true`. When `TEXT_MODE` is active, replace every `AskUserQuestion` call with a plain-text numbered list and ask the user to type their choice number.

## 3. Validate Phase + Pre-flight Gate

```bash
PHASE_INFO=$(gsd_run roadmap get-phase "${PHASE}")
```

**If `found` is false:** Error with available phases. Exit.

Display startup banner:

```text
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GSD ► PLAN CONVERGENCE — Phase {phase_number}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Reviewers: {REVIEWER_FLAGS}
Max cycles: {MAX_CYCLES}
```

## 4. Initial Planning (if no plans exist)

**If `has_plans` is true:** Skip to step 5. Display: `Plans found: {plan_count} PLAN.md files — skipping initial planning.`

**If `has_plans` is false:**

Display: `◆ No plans found — running initial planning inline... (plan-phase runs here in the orchestrator — no output until planning is complete, ~1–5 min; expected, not a freeze)`

```text
Skill(skill="gsd-plan-phase", args="{PHASE} {GSD_WS}")
```

- Native agent dispatch translated: `Run plan-phase **inline** (do NOT wrap it in Agent()). The convergence orchestrator runs at depth 0 with Agent available, so inline plan-phase can spawn gsd-planner and gsd-plan-checker at depth 1 — the one level of nesting that works on Claude Code. Wrapping plan-phase in Agent() would push it to depth 1 where the Agent tool is absent, preventing it from spawning any sub-agents. Wait until plan-phase completes and PLAN.md files are committed before continuing.` -> use Serena role workflow / generated role skill / sequential role pass with handoff.

After plan-phase completes, verify plans were created:
```bash
PLAN_COUNT=$(ls ${phase_dir}/${padded_phase}-*-PLAN.md 2>/dev/null | wc -l)
```

If PLAN_COUNT == 0: Error — initial planning failed. Exit.

Display: `Initial planning complete: ${PLAN_COUNT} PLAN.md files created.`

## 5. Convergence Loop

Initialize loop variables:

```text
cycle = 0
prev_unresolved_count = Infinity
```

### 5a. Review (Spawn Agent)

Increment `cycle`.

Display: `◆ Cycle {cycle}/{MAX_CYCLES} — spawning review agent... (runs in a subagent — no output until it returns, ~1–5 min; expected, not a freeze)`

```text
- Native agent dispatch translated: `Agent(` -> use Serena role workflow / generated role skill / sequential role pass with handoff.
description="Cross-AI review Phase {PHASE} cycle {cycle}",
prompt="Run `gsd-serena-bridge review --format markdown` for Phase {PHASE}.

Execute: Skill(skill='gsd-review', args='--phase {PHASE} {REVIEWER_FLAGS} {GSD_WS}')

Complete the full review workflow. Do NOT return until REVIEWS.md is committed.

IMPORTANT — CYCLE_SUMMARY contract (required):
Your final response MUST include a machine-readable line of exactly this form:

CYCLE_SUMMARY: current_high=<N> current_actionable=<M>

Where <N> is the integer count of HIGH-severity concerns that REMAIN UNRESOLVED in this cycle's findings.
Where <M> is the integer count of actionable MEDIUM/LOW concerns that REMAIN UNRESOLVED because the latest PLAN.md files do not yet incorporate them or explicitly defer/reject them.

Counting rules:
INCLUDE in the count:
- Newly raised HIGHs in this cycle
- PARTIALLY RESOLVED HIGHs: concern acknowledged and a mitigation is in progress, but not yet verified/completed
- Previously raised HIGHs that are still unresolved

EXCLUDE from the count:
- FULLY RESOLVED HIGHs: concern addressed with verification complete (closed ticket, verification log, or reviewer sign-off)
- HIGH mentions in retrospective/summary tables comparing cycles
- Quoted excerpts from prior reviews referencing past HIGH items
- MEDIUM/LOW concerns that are already incorporated into a PLAN.md task, action, acceptance_criteria, verify command, must_haves item, threat model, artifact list, or explicit deferral/rejection rationale

Definitions:
PARTIALLY RESOLVED — concern acknowledged and mitigation is in progress but not yet verified/completed (e.g., open ticket exists but fix not landed).
FULLY RESOLVED — concern addressed with verification complete (closed ticket, verification log, or explicit reviewer sign-off confirming closure).
ACTIONABLE — a non-HIGH review finding that would be invisible to `gsd-serena-bridge execute-phase --format markdown` unless it is incorporated into PLAN.md or explicitly deferred/rejected in PLAN.md.

Your final response MUST also include this section immediately after the CYCLE_SUMMARY line:

## Current HIGH Concerns
[List each unresolved HIGH with a brief description, one per bullet]
[If none: write exactly 'None.']

## Current Actionable Non-HIGH Concerns
[List each unresolved actionable MEDIUM/LOW with a brief description and the PLAN.md change still needed, one per bullet]
[If none: write exactly 'None.']
These two sections MUST be the final content of your response, in this exact order, with no additional "## " headings after them (the source-grounding "Verification coverage" block is appended to REVIEWS.md, not to this return message).",
mode="auto"
)
```

### Source-grounding pass (config: `plan_review.source_grounding`, default on)

Run this pass unless `plan_review.source_grounding` is `false`. It verifies every symbol the plan cites against the project source before approval, catching hallucinated symbols at review time instead of execution time.

1. **Enumerate cited symbols.** List every referenced symbol by kind, quoting the plan line for each (coverage must be auditable): decorators (`@name`), classes/methods (`Class.method`), functions (`module.function`), CLI flags (`--name`), file paths, datac...
2. **Exclude new artifacts.** Do NOT verify symbols the plan declares under its "Artifacts this phase produces" section — those are created by this phase, not references to existing code.
3. **Resolve each remaining symbol** using the effective authority adapter (resolved deterministically — see step 4a):
- `grep` — ripgrep / Read the source; confirm the name appears as a real declaration.
- `intel` — consult `.planning/intel/API-SURFACE.md` / `api-map.json` (only when `intel.enabled`).
Record one verdict per symbol: **VERIFIED** (quote `file:line`), **MISSING** (adapter can check this language/kind and the symbol is absent), **AMBIGUOUS** (multiple candidates), or **UNCHECKABLE** (adapter cannot analyze this language/kind — e.g. non-JS un...
4a. **Resolve effective authority** (deterministic — replaces manual `intel.enabled` reasoning):
```bash
EFFECTIVE_AUTHORITY=$(gsd_run drift-guard authority --raw)
```
4. **Severity & gating** — classify each symbol's verdict using the seam (do not apply the table manually):
```bash
# For each symbol, e.g.:
RESULT=$(gsd_run drift-guard severity --status <verdict> --authority "$EFFECTIVE_AUTHORITY")
# $RESULT is JSON: {"severity":"…","hardBlock":true|false}
```
- `hardBlock: true` (HIGH at authority `lsp`/`scip`) — stops the review cycle immediately; do not proceed until the plan author resolves the missing symbol.
- `hardBlock: false`, severity `needs-acknowledgement` — plan proceeds only if the author confirms the symbol is genuinely new or dynamically resolved, and that acknowledgement is recorded.
- `AMBIGUOUS` → MEDIUM. `UNCHECKABLE` → INFO.
- Signature mismatches cannot be asserted under `grep`/`intel`; report the signature as UNCHECKABLE.
5. **Coverage block.** Append a "Verification coverage" section to `REVIEWS.md` listing every UNCHECKABLE/skipped symbol and why — a clean review must never silently mean "nothing was checked."

After agent returns, verify REVIEWS.md exists:
```bash
REVIEWS_FILE=$(ls ${phase_dir}/${padded_phase}-REVIEWS.md 2>/dev/null)
```

If REVIEWS_FILE is empty: Error — review agent did not produce REVIEWS.md. Exit.

### 5b. Extract unresolved counts from CYCLE_SUMMARY Contract

**Do NOT grep REVIEWS.md for HIGH or actionable counts.** REVIEWS.md accumulates history across cycles — resolved findings from prior cycles remain in the file as audit trail, inflating a raw grep count and causing false stall detection.

Parse HIGH_COUNT and ACTIONABLE_COUNT from the review agent's return message via the CYCLE_SUMMARY contract:

```bash
# Extract integers from "CYCLE_SUMMARY: current_high=N current_actionable=M" in the agent's return message
SUMMARY_LINE=$(echo "$REVIEW_AGENT_RETURN" | grep -oE 'CYCLE_SUMMARY:.*' | head -1)
HIGH_COUNT=$(echo "$SUMMARY_LINE" | grep -oE 'current_high=[0-9]+' | head -1 | grep -oE '[0-9]+$')
ACTIONABLE_COUNT=$(echo "$SUMMARY_LINE" | grep -oE 'current_actionable=[0-9]+' | head -1 | grep -oE '[0-9]+$')

if [ -z "$SUMMARY_LINE" ]; then
echo "Review agent did not honor the CYCLE_SUMMARY contract — cannot determine unresolved review counts. Retry or switch reviewer."
exit 1
fi

if [ -z "$HIGH_COUNT" ]; then
echo "CYCLE_SUMMARY present but current_high is missing or malformed — expected integer, got non-numeric or absent value. Retry or switch reviewer."
exit 1
fi

if [ -z "$ACTIONABLE_COUNT" ]; then
echo "CYCLE_SUMMARY present but current_actionable is missing or malformed — expected integer, got non-numeric or absent value. Retry or switch reviewer."
exit 1
fi

UNRESOLVED_COUNT=$((HIGH_COUNT + ACTIONABLE_COUNT))

# Extract the ## Current HIGH Concerns section from the agent's return message
HIGH_LINES=$(echo "$REVIEW_AGENT_RETURN" | awk '/^## Current HIGH Concerns/{found=1; next} found && /^##/{exit} found{print}')
ACTIONABLE_LINES=$(echo "$REVIEW_AGENT_RETURN" | awk '/^## Current Actionable Non-HIGH Concerns/{found=1; next} found && /^##/{exit} found{print}')

if [ "${HIGH_COUNT}" -gt 0 ] && [ -z "${HIGH_LINES}" ]; then
echo "⚠ Review agent's CYCLE_SUMMARY reports ${HIGH_COUNT} HIGHs but did not provide ## Current HIGH Concerns section — continuing with incomplete escalation details."
fi

if [ "${ACTIONABLE_COUNT}" -gt 0 ] && [ -z "${ACTIONABLE_LINES}" ]; then
echo "⚠ Review agent's CYCLE_SUMMARY reports ${ACTIONABLE_COUNT} actionable non-HIGH concerns but did not provide ## Current Actionable Non-HIGH Concerns section — continuing with incomplete escalation details."
fi
```

**If HIGH_COUNT == 0 and ACTIONABLE_COUNT == 0 (converged):**

```bash
gsd_run state planned-phase --phase "${PHASE}" --name "${phase_name}" --plans "${PLAN_COUNT}"
```

Display:
```text
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GSD ► CONVERGENCE COMPLETE ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Phase {phase_number} converged in {cycle} cycle(s).
No HIGH concerns remaining.
No actionable MEDIUM/LOW review findings remain outside PLAN.md.

REVIEWS.md: {REVIEWS_FILE}
Next: `gsd-serena-bridge execute-phase --format markdown` {PHASE}
```

Exit — convergence achieved.

**If HIGH_COUNT > 0 or ACTIONABLE_COUNT > 0:** Continue to 5c.

### 5c. Stall Detection + Escalation Check

Display: `◆ Cycle {cycle}/{MAX_CYCLES} — {HIGH_COUNT} HIGH, {ACTIONABLE_COUNT} actionable non-HIGH review concerns found`

**Stall detection:** If `UNRESOLVED_COUNT >= prev_unresolved_count`:
```text
⚠ Convergence stalled — unresolved review concern count not decreasing
({UNRESOLVED_COUNT} unresolved concerns, previous cycle had {prev_unresolved_count})
```

**Max cycles check:** If `cycle >= MAX_CYCLES`:

If `TEXT_MODE` is true, present as plain-text numbered list:
```text
Plan convergence did not complete after {MAX_CYCLES} cycles.
{HIGH_COUNT} HIGH concerns and {ACTIONABLE_COUNT} actionable non-HIGH concerns remain:

{HIGH_LINES}

{ACTIONABLE_LINES}

How would you like to proceed?

1. Proceed anyway — Accept plans with remaining review concerns and move to execution
2. Manual review — Stop here, review REVIEWS.md and address concerns manually

Enter number:
```

- Source translation truncated here; use the bridge command output, workflow runbook, installed contracts, or operation plan for continuation.

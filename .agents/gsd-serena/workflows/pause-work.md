# Bridge Workflow: pause-work

<!-- generated-by: pnpm gen:bridge-commands -->

## Purpose

This bridge workflow runbook translates the actual GSD-core workflow information and adapts it for Serena bridge operation. Read it when operating `gsd-workflow-pause-work` in a target project.

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

- Contract ID: `gsd-workflow-pause-work`
- Status: `planned`
- Source path: `gsd-core/workflows/pause-work.md`
- Resolved source path: `vendor/reference/gsd-core/gsd-core/workflows/pause-work.md`
- Mirrored runbook path: `.agents/gsd-serena/workflows/pause-work.md`

## Translated GSD Workflow

### Native Shim Translation
- Native GSD shim locator omitted: the bridge uses the installed `gsd-serena-bridge` CLI, `bootstrap`, `doctor`, `repair`, resolver packets, and install-managed project surfaces instead of locating `gsd-tools.cjs`.
<purpose>
Create structured `.planning/HANDOFF.json` and `.continue-here.md` handoff files to preserve complete work state across sessions. The JSON provides machine-readable state for ``gsd-serena-bridge resume-work --format markdown``; the markdown provides human-readable context.
</purpose>

<required_reading>
Read all files referenced by the invoking prompt's execution_context before starting.
</required_reading>

<process>

<step name="detect">
## Context Detection

Determine what kind of work is being paused and set the handoff destination accordingly:

```bash
# Check for active phase
phase=$(( ls -lt .planning/phases/*/PLAN.md 2>/dev/null || true ) | head -1 | grep -oP 'phases/\K[^/]+' || true)

# Check for active spike
spike=$(( ls -lt .planning/spikes/*/SPIKE.md .planning/spikes/*/DESIGN.md .planning/spikes/*/README.md 2>/dev/null || true ) | head -1 | grep -oP 'spikes/\K[^/]+' || true)

# Check for active sketch
sketch=$(( ls -lt .planning/sketches/*/README.md .planning/sketches/*/index.html 2>/dev/null || true ) | head -1 | grep -oP 'sketches/\K[^/]+' || true)

# Check for active deliberation
deliberation=$(ls .planning/deliberations/*.md 2>/dev/null | head -1 || true)
```

- **Phase work**: active phase directory → handoff to `.planning/phases/XX-name/.continue-here.md`
- **Spike work**: active spike directory or spike-related files (no active phase) → handoff to `.planning/spikes/SPIKE-NNN/.continue-here.md` (create directory if needed)
- **Sketch work**: active sketch directory (no active phase/spike) → handoff to `.planning/sketches/.continue-here.md`
- **Deliberation work**: active deliberation file (no phase/spike/sketch) → handoff to `.planning/deliberations/.continue-here.md`
- **Research work**: research notes exist but no phase/spike/sketch/deliberation → handoff to `.planning/.continue-here.md`
- **Default**: no detectable context → handoff to `.planning/.continue-here.md`, note the ambiguity in `<current_state>`

If phase is detected, proceed with phase handoff path. Otherwise use the first matching non-phase path above.
</step>

<step name="gather">
**Collect complete state for handoff:**

1. **Current position**: Which phase, which plan, which task
2. **Work completed**: What got done this session
3. **Work remaining**: What's left in current plan/phase
4. **Decisions made**: Key decisions and rationale
5. **Blockers/issues**: Anything stuck
6. **Human actions pending**: Things that need manual intervention (MCP setup, API keys, approvals, manual testing)
7. **Background processes**: Any running servers/watchers that were part of the workflow
8. **Files modified**: What's changed but not committed
9. **Outstanding async external jobs**: any `.planning/async-jobs/*.json` manifests for non-terminal jobs — record job id, backend, status, expected artifacts, verification + resume commands, and any watcher/daemon state. Do NOT cancel the external job; it ...
10. **Blocking constraints**: Anti-patterns or methodological failures encountered during this session that a resuming agent MUST be aware of before proceeding. Only include items discovered through actual failure — not warnings or predictions. Assign each ...
- `blocking` — The resuming agent MUST demonstrate understanding before proceeding. The discuss-phase and execute-phase workflows will enforce a mandatory understanding check.
- `advisory` — Important context but does not gate resumption.

Ask user for clarifications if needed via conversational questions.

**Also inspect SUMMARY.md files for false completions:**
```bash
# Check for placeholder content in existing summaries
grep -l "To be filled\|placeholder\|TBD" .planning/phases/*/*.md 2>/dev/null || true
```
Report any summaries with placeholder content as incomplete items.
</step>

<step name="write_structured">
**Write structured handoff to `.planning/HANDOFF.json`:**

```bash
- Native query translated: `timestamp=$(gsd_run query current-timestamp full --raw)` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
```

```json
{
"version": "1.0",
"timestamp": "{timestamp}",
"phase": "{phase_number}",
"phase_name": "{phase_name}",
"phase_dir": "{phase_dir}",
"plan": {current_plan_number},
"task": {current_task_number},
"total_tasks": {total_task_count},
"status": "paused",
"completed_tasks": [
{"id": 1, "name": "{task_name}", "status": "done", "commit": "{short_hash}"},
{"id": 2, "name": "{task_name}", "status": "done", "commit": "{short_hash}"},
{"id": 3, "name": "{task_name}", "status": "in_progress", "progress": "{what_done}"}
],
"remaining_tasks": [
{"id": 4, "name": "{task_name}", "status": "not_started"},
{"id": 5, "name": "{task_name}", "status": "not_started"}
],
"blockers": [
{"description": "{blocker}", "type": "technical|human_action|external", "workaround": "{if any}"}
],
"async_jobs": [
{"manifest": ".planning/async-jobs/{job}.json", "job_id": "{id}", "backend": "{backend}", "status": "running", "submit_command": "{cmd}", "submitted_at": "{iso8601}", "expected_artifacts": ["..."], "verification_command": "{cmd}", "resume_command": "{cmd}"}
],
"human_actions_pending": [
{"action": "{what needs to be done}", "context": "{why}", "blocking": true}
],
"decisions": [
{"decision": "{what}", "rationale": "{why}", "phase": "{phase_number}"}
],
"uncommitted_files": [],
"next_action": "{specific first action when resuming}",
"context_notes": "{mental state, approach, what you were thinking}"
}
```

Any recorded `async_jobs` entries are the primary resume context on the next session — check them first before treating a PLAN-without-SUMMARY as incomplete work.
</step>

<step name="write">
**Write handoff to the path determined in the detect step** (e.g. `.planning/phases/XX-name/.continue-here.md`, `.planning/spikes/SPIKE-NNN/.continue-here.md`, or `.planning/.continue-here.md`):

```markdown
---
context: [phase|spike|sketch|deliberation|research|default]
phase: XX-name
task: 3
total_tasks: 7
status: in_progress
last_updated: [timestamp from current-timestamp]
---

# BLOCKING CONSTRAINTS — Read Before Anything Else

> These are not suggestions. Each constraint below was discovered through failure.
> Acknowledge each one explicitly before proceeding.

- [ ] CONSTRAINT: [name] — [what it is] — [structural mitigation required]

**Do not proceed until all boxes are checked.**

_If no constraints have been identified yet, remove this section._

## Critical Anti-Patterns

| Pattern | Description | Severity | Prevention Mechanism |
|---------|-------------|----------|---------------------|
| [pattern name] | [what it is and how it manifested] | blocking | [structural step that prevents recurrence — not acknowledgment] |
| [pattern name] | [what it is and how it manifested] | advisory | [guidance for avoiding it] |

**Severity values:** `blocking` — resuming agent must pass understanding check before proceeding. `advisory` — important context, does not gate resumption.

_Remove rows that do not apply. The discuss-phase and execute-phase workflows parse this table and enforce a mandatory understanding check for any `blocking` rows._

<current_state>
[Where exactly are we? Immediate context]
</current_state>

<completed_work>

Completed Tasks:
- Task 1: [name] - Done
- Task 2: [name] - Done
- Task 3: [name] - In progress, [what's done]
</completed_work>

<remaining_work>

- Task 3: [what's left]
- Task 4: Not started
- Task 5: Not started
</remaining_work>

<decisions_made>

- Decided to use [X] because [reason]
- Chose [approach] over [alternative] because [reason]
</decisions_made>

<blockers>
- [Blocker 1]: [status/workaround]
</blockers>

## Required Reading (in order)
<!-- List documents the resuming agent must read before acting -->
1. [document] — [why it matters]
1. `.planning/METHODOLOGY.md` (if it exists) — project analytical lenses; apply before any assumption analysis

## Critical Anti-Patterns (do NOT repeat these)
<!-- Mistakes discovered this session that must be structurally avoided -->
- [ANTI-PATTERN]: [what it is] → [structural mitigation]

## Infrastructure State
<!-- Running services, external state, environment specifics -->
- [service/env]: [current state]

## Pre-Execution Critique Required
<!-- Fill in ONLY if pausing between design and execution (e.g. spike design done, not yet run) -->
- Design artifact: [path]
- Critique focus: [key questions the critic should probe]
- Gate: Do NOT begin execution until critique is complete and design is revised

<context>
[Mental state, what were you thinking, the plan]
</context>

<next_action>
Start with: [specific first action when resuming]
</next_action>
```

Be specific enough for a fresh Claude to understand immediately.

Use `current-timestamp` for last_updated field. You can use init todos (which provides timestamps) or call directly:
```bash
- Native query translated: `timestamp=$(gsd_run query current-timestamp full --raw)` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
```
</step>

<step name="commit">
```bash
- Native commit helper translated: do not auto-commit; only run git commit when the user explicitly asks, after reporting files and validation.
```
</step>

<step name="confirm">
```
✓ Handoff created:
- .planning/HANDOFF.json (structured, machine-readable)
- [handoff-path] (human-readable)

Current state:

- Context: [phase|spike|deliberation|research]
- Location: [XX-name or SPIKE-NNN]
- Task: [X] of [Y]
- Status: [in_progress/blocked]
- Blockers: [count] ({human_actions_pending count} need human action)
- Committed as WIP

To resume: `gsd-serena-bridge resume-work --format markdown`

```
</step>

</process>

<success_criteria>
- [ ] Context detected (phase/spike/deliberation/research/default)
- [ ] .continue-here.md created at correct path for detected context
- [ ] Required Reading, Anti-Patterns, and Infrastructure State sections filled
- [ ] Pre-Execution Critique section filled if pausing between design and execution
- [ ] Committed as WIP
- [ ] User knows location and how to resume
</success_criteria>

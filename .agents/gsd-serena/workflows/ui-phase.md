# Bridge Workflow: ui-phase

<!-- generated-by: pnpm gen:bridge-commands -->

## Purpose

This bridge workflow runbook translates the actual GSD-core workflow information and adapts it for Serena bridge operation. Read it when operating `gsd-workflow-ui-phase` in a target project.

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

- Contract ID: `gsd-workflow-ui-phase`
- Status: `planned`
- Source path: `gsd-core/workflows/ui-phase.md`
- Resolved source path: `vendor/reference/gsd-core/gsd-core/workflows/ui-phase.md`
- Mirrored runbook path: `.agents/gsd-serena/workflows/ui-phase.md`

## Translated GSD Workflow

### Native Shim Translation
- Native GSD shim locator omitted: the bridge uses the installed `gsd-serena-bridge` CLI, `bootstrap`, `doctor`, `repair`, resolver packets, and install-managed project surfaces instead of locating `gsd-tools.cjs`.
<purpose>
Generate a UI design contract (UI-SPEC.md) for frontend phases. Orchestrates gsd-ui-researcher and gsd-ui-checker with a revision loop. Inserts between discuss-phase and plan-phase in the lifecycle.

UI-SPEC.md locks spacing, typography, color, copywriting, and design system decisions before the planner creates tasks. This prevents design debt caused by ad-hoc styling decisions during execution.
</purpose>

<required_reading>
@~/.claude/gsd-core/references/ui-brand.md
</required_reading>

<available_agent_types>
Valid GSD subagent types (use exact names — do not fall back to 'general-purpose'):
- gsd-ui-researcher — Researches UI/UX approaches
- gsd-ui-checker — Reviews UI implementation quality
</available_agent_types>

<process>

## 1. Initialize

```bash
- Native query translated: `INIT=$(gsd_run query init.plan-phase "$PHASE")` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
- Native query translated: `AGENT_SKILLS_UI=$(gsd_run query agent-skills gsd-ui-researcher)` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
- Native query translated: `AGENT_SKILLS_UI_CHECKER=$(gsd_run query agent-skills gsd-ui-checker)` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
```

Parse JSON for: `phase_dir`, `phase_number`, `phase_name`, `phase_slug`, `padded_phase`, `has_context`, `has_research`, `commit_docs`.

**File paths:** `state_path`, `roadmap_path`, `requirements_path`, `context_path`, `research_path`.

Detect sketch findings:
```bash
SKETCH_FINDINGS_PATH=$(ls ./.claude/skills/sketch-findings-*/SKILL.md 2>/dev/null | head -1 || true)
```

Resolve UI agent models:

```bash
- Native query translated: `UI_RESEARCHER_MODEL=$(gsd_run query resolve-model gsd-ui-researcher --raw)` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
- Native query translated: `UI_CHECKER_MODEL=$(gsd_run query resolve-model gsd-ui-checker --raw)` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
```

Check config:

```bash
- Native query translated: `UI_ENABLED=$(gsd_run query config-get workflow.ui_phase 2>/dev/null || echo "true")` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
```

**If `UI_ENABLED` is `false`:**
```
UI phase is disabled in config. Enable via `gsd-serena-bridge settings --format markdown`.
```
Exit workflow.

**If `planning_exists` is false:** Error — run ``gsd-serena-bridge new-project --format markdown`` first.

## 2. Parse and Validate Phase

Extract phase number from $ARGUMENTS. If not provided, detect next unplanned phase.

```bash
- Native query translated: `PHASE_INFO=$(gsd_run query roadmap.get-phase "${PHASE}")` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
```

**If `found` is false:** Error with available phases.

## 3. Check Prerequisites

**If `has_context` is false:**
```
No CONTEXT.md found for Phase {N}.
Recommended: run `gsd-serena-bridge discuss-phase --format markdown` {N} first to capture design preferences.
Continuing without user decisions — UI researcher will ask all questions.
```
Continue (non-blocking).

**If `has_research` is false:**
```
No RESEARCH.md found for Phase {N}.
Note: stack decisions (component library, styling approach) will be asked during UI research.
```
Continue (non-blocking).

**If `SKETCH_FINDINGS_PATH` is not empty:**
```
⚡ Sketch findings detected: {SKETCH_FINDINGS_PATH}
Validated design decisions from `gsd-serena-bridge sketch --format markdown` will be loaded into the UI researcher.
Pre-validated decisions (layout, palette, typography, spacing) should be treated as locked — not re-asked.
```

## 4. Check Existing UI-SPEC

```bash
UI_SPEC_FILE=$(ls "${PHASE_DIR}"/*-UI-SPEC.md 2>/dev/null | head -1)
```

**Text mode (`workflow.text_mode: true` in config or `--text` flag):** Set `TEXT_MODE=true` if `--text` is present in `$ARGUMENTS` OR `text_mode` from init JSON is `true`. When TEXT_MODE is active, replace every `AskUserQuestion` call with a plain-text numb...
**If exists:** Use AskUserQuestion:
- header: "Existing UI-SPEC"
- question: "UI-SPEC.md already exists for Phase {N}. What would you like to do?"
- options:
- "Update — re-run researcher with existing as baseline"
- "View — display current UI-SPEC and exit"
- "Skip — keep current UI-SPEC, proceed to verification"

If "View": display file contents, exit.
If "Skip": proceed to step 7 (checker).
If "Update": continue to step 5.

## 5. Spawn gsd-ui-researcher

Display:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GSD ► UI DESIGN CONTRACT — PHASE {N}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

◆ Spawning UI researcher... (runs in a subagent — no output until it returns, ~1–5 min; expected, not a freeze)
```

Build prompt:

```markdown
Read ~/.claude/agents/gsd-ui-researcher.md for instructions.

<objective>
Create UI design contract for Phase {phase_number}: {phase_name}
Answer: "What visual and interaction contracts does this phase need?"
</objective>

<files_to_read>
- {state_path} (Project State)
- {roadmap_path} (Roadmap)
- {requirements_path} (Requirements)
- {context_path} (USER DECISIONS from `gsd-serena-bridge discuss-phase --format markdown`)
- {research_path} (Technical Research — stack decisions)
- {SKETCH_FINDINGS_PATH} (Sketch Findings — validated design decisions, CSS patterns, visual direction from `gsd-serena-bridge sketch --format markdown`, if exists)
</files_to_read>

${AGENT_SKILLS_UI}

<output>
Write to: {phase_dir}/{padded_phase}-UI-SPEC.md
Template: ~/.claude/gsd-core/templates/UI-SPEC.md
</output>

<config>
commit_docs: {commit_docs}
phase_dir: {phase_dir}
padded_phase: {padded_phase}
</config>
```

Omit null file paths from `<files_to_read>`.

```
- Native agent dispatch translated: `Agent(` -> use Serena role workflow / generated role skill / sequential role pass with handoff.
prompt=ui_research_prompt,
subagent_type="gsd-ui-researcher",
model="{UI_RESEARCHER_MODEL}",
description="UI Design Contract Phase {N}"
)
```

- Native agent dispatch translated: `> **ORCHESTRATOR RULE — CODEX RUNTIME**: After calling Agent() above, stop working on this task immediately. Do not read more files, edit code, or run tests related to this task while the subagent is active. Wait for the subagent to return its result. This prevents duplicate work, conflicting edits, and wasted context. Only resume when the subagent result is available.` -> use Serena role workflow / generated role skill / sequential role pass with handoff.

## 6. Handle Researcher Return

**If `## UI-SPEC COMPLETE`:**
Display confirmation. Continue to step 7.

**If `## UI-SPEC BLOCKED`:**
Display blocker details and options. Exit workflow.

## 7. Spawn gsd-ui-checker

Display:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GSD ► VERIFYING UI-SPEC
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

◆ Spawning UI checker... (runs in a subagent — no output until it returns, ~1–5 min; expected, not a freeze)
```

Build prompt:

```markdown
Read ~/.claude/agents/gsd-ui-checker.md for instructions.

<objective>
Validate UI design contract for Phase {phase_number}: {phase_name}
Check all 6 dimensions. Return APPROVED or BLOCKED.
</objective>

<files_to_read>
- {phase_dir}/{padded_phase}-UI-SPEC.md (UI Design Contract — PRIMARY INPUT)
- {context_path} (USER DECISIONS — check compliance)
- {research_path} (Technical Research — check stack alignment)
</files_to_read>

${AGENT_SKILLS_UI_CHECKER}

<config>
ui_safety_gate: {ui_safety_gate config value}
</config>
```

```
- Native agent dispatch translated: `Agent(` -> use Serena role workflow / generated role skill / sequential role pass with handoff.
prompt=ui_checker_prompt,
subagent_type="gsd-ui-checker",
model="{UI_CHECKER_MODEL}",
description="Verify UI-SPEC Phase {N}"
)
```

- Native agent dispatch translated: `> **ORCHESTRATOR RULE — CODEX RUNTIME**: After calling Agent() above, stop working on this task immediately. Do not read more files, edit code, or run tests related to this task while the subagent is active. Wait for the subagent to return its result. This prevents duplicate work, conflicting edits, and wasted context. Only resume when the subagent result is available.` -> use Serena role workflow / generated role skill / sequential role pass with handoff.

## 8. Handle Checker Return

**If `## UI-SPEC VERIFIED`:**
Display dimension results. Proceed to step 10.

**If `## ISSUES FOUND`:**
Display blocking issues. Proceed to step 9.

## 9. Revision Loop (Max 2 Iterations)

Track `revision_count` (starts at 0).

**If `revision_count` < 2:**
- Increment `revision_count`
- Re-spawn gsd-ui-researcher with revision context:

```markdown
<revision>
The UI checker found issues with the current UI-SPEC.md.

### Issues to Fix
{paste blocking issues from checker return}

Read the existing UI-SPEC.md, fix ONLY the listed issues, re-write the file.
Do NOT re-ask the user questions that are already answered.
</revision>
```

- After researcher returns → re-spawn checker (step 7)

**If `revision_count` >= 2:**
```
Max revision iterations reached. Remaining issues:

{list remaining issues}

Options:
1. Force approve — proceed with current UI-SPEC (FLAGs become accepted)
2. Edit manually — open UI-SPEC.md in editor, re-run `gsd-serena-bridge ui-phase --format markdown`
3. Abandon — exit without approving
```

Use AskUserQuestion for the choice.

## 10. Present Final Status

Display:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GSD ► UI-SPEC READY ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Phase {N}: {Name}** — UI design contract approved

Dimensions: 6/6 passed
{If any FLAGs: "Recommendations: {N} (non-blocking)"}

───────────────────────────────────────────────────────────────

## ▶ Next Up — [${PROJECT_CODE}] ${PROJECT_TITLE}

{If CONTEXT.md exists for this phase:}
**Plan Phase {N}** — planner will use UI-SPEC.md as design context

`/clear` then: ``gsd-serena-bridge plan-phase --format markdown` {N}`

{If CONTEXT.md does NOT exist:}
**Discuss Phase {N}** — gather implementation context before planning

`/clear` then: ``gsd-serena-bridge discuss-phase --format markdown` {N}`

(or ``gsd-serena-bridge plan-phase --format markdown` {N}` to skip discussion)

───────────────────────────────────────────────────────────────
```

## 11. Commit (if configured)

```bash
- Native commit helper translated: do not auto-commit; only run git commit when the user explicitly asks, after reporting files and validation.
```

## 12. Update State

- Source translation truncated here; use the bridge command output, workflow runbook, installed contracts, or operation plan for continuation.

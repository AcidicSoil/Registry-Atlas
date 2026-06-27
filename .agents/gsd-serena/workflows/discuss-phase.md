# Bridge Workflow: discuss-phase

<!-- generated-by: pnpm gen:bridge-commands -->

## Purpose

This bridge workflow runbook translates the actual GSD-core workflow information and adapts it for Serena bridge operation. Read it when operating `gsd-workflow-discuss-phase` in a target project.

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

- Contract ID: `gsd-workflow-discuss-phase`
- Status: `planned`
- Source path: `gsd-core/workflows/discuss-phase.md`
- Resolved source path: `vendor/reference/gsd-core/gsd-core/workflows/discuss-phase.md`
- Mirrored runbook path: `.agents/gsd-serena/workflows/discuss-phase.md`

## Translated GSD Workflow

### Native Shim Translation
- Native GSD shim locator omitted: the bridge uses the installed `gsd-serena-bridge` CLI, `bootstrap`, `doctor`, `repair`, resolver packets, and install-managed project surfaces instead of locating `gsd-tools.cjs`.
<!-- gsd:loop-host
step: discuss
points: discuss:pre, discuss:post
agent-roles: orchestrator
produces: CONTEXT.md
consumes:
-->
<purpose>
Extract implementation decisions that downstream agents need. Analyze the phase to identify gray areas, let the user choose what to discuss, then deep-dive each selected area until satisfied.

You are a thinking partner, not an interviewer. The user is the visionary — you are the builder. Your job is to capture decisions that will guide research and planning, not to figure out implementation yourself.
</purpose>

<required_reading>
@~/.claude/gsd-core/references/domain-probes.md
@~/.claude/gsd-core/references/gate-prompts.md
@~/.claude/gsd-core/references/universal-anti-patterns.md
</required_reading>

<progressive_disclosure>
**Per-mode bodies, templates, and the advisor flow are lazy-loaded** to keep
this file under the discuss-phase byte budget (32000 bytes, #717; mirrors the agent size-budget convention). Read only the files needed for the current invocation:

| When | Read |
|---|---|
| `--power` in $ARGUMENTS | `workflows/discuss-phase/modes/power.md` (then exit standard flow) |
| `--all` in $ARGUMENTS | `workflows/discuss-phase/modes/all.md` overlay |
| `--auto` in $ARGUMENTS | `workflows/discuss-phase/modes/auto.md` + `workflows/discuss-phase/modes/chain.md` (auto-advance) |
| `--chain` in $ARGUMENTS | `workflows/discuss-phase/modes/default.md` + `workflows/discuss-phase/modes/chain.md` |
| `--text` in $ARGUMENTS or `workflow.text_mode: true` | `workflows/discuss-phase/modes/text.md` overlay |
| `--batch` in $ARGUMENTS | `workflows/discuss-phase/modes/batch.md` overlay |
| `--analyze` in $ARGUMENTS | `workflows/discuss-phase/modes/analyze.md` overlay |
| ADVISOR_MODE = true (USER-PROFILE.md exists) | `workflows/discuss-phase/modes/advisor.md` |
| no flags above | `workflows/discuss-phase/modes/default.md` |
| in `write_context` step | `workflows/discuss-phase/templates/context.md` |
| in `git_commit` step | `workflows/discuss-phase/templates/discussion-log.md` |
| writing checkpoints | `workflows/discuss-phase/templates/checkpoint.json` |

Do not Read mode files unless the corresponding flag/condition is set.
</progressive_disclosure>

<downstream_awareness>
**CONTEXT.md feeds into:**

1. **gsd-phase-researcher** — Reads CONTEXT.md to know WHAT to research
2. **gsd-planner** — Reads CONTEXT.md to know WHAT decisions are locked

**Your job:** Capture decisions clearly enough that downstream agents can act on them without asking the user again.
**Not your job:** Figure out HOW to implement. That's what research and planning do with the decisions you capture.
</downstream_awareness>

<philosophy>
**User = founder/visionary. Claude = builder.**

The user knows: how they imagine it working, what it should look/feel like, what's essential vs nice-to-have, specific behaviors or references they have in mind.

The user doesn't know (and shouldn't be asked): codebase patterns (researcher reads the code), technical risks (researcher identifies these), implementation approach (planner figures this out), success metrics (inferred from the work).

Ask about vision and implementation choices. Capture decisions for downstream agents.
</philosophy>

<scope_guardrail>
**CRITICAL: No scope creep.** The phase boundary comes from ROADMAP.md and is FIXED. Discussion clarifies HOW to implement what's scoped, never WHETHER to add new capabilities.

**Allowed (clarifying ambiguity):** "How should posts be displayed?" (layout), "What happens on empty state?" (within the feature), "Pull to refresh or manual?" (behavior choice).

**Not allowed (scope creep):** "Should we also add comments?" / "What about search/filtering?" / "Maybe include bookmarking?" — those are new capabilities and belong in their own phase.

**Heuristic:** Does this clarify how we implement what's already in the phase, or does it add a new capability that could be its own phase?

**When user suggests scope creep:**
```
"[Feature X] would be a new capability — that's its own phase.
Want me to note it for the roadmap backlog?

For now, let's focus on [phase domain]."
```

Capture the idea in a "Deferred Ideas" section. Don't lose it, don't act on it.
</scope_guardrail>

<gray_area_identification>
Gray areas are **implementation decisions the user cares about** — things that could go multiple ways and would change the result.

1. Read the phase goal from ROADMAP.md
2. Understand the domain — something users SEE / CALL / RUN / READ / something being ORGANIZED — and let that drive what kinds of decisions matter
3. Generate phase-specific gray areas (not generic categories)

**Don't use generic category labels** (UI, UX, Behavior). Generate specific gray areas. Examples:

```
Phase: "User authentication"     → Session handling, Error responses, Multi-device policy, Recovery flow
Phase: "Organize photo library"  → Grouping criteria, Duplicate handling, Naming convention, Folder structure
Phase: "CLI for database backups"→ Output format, Flag design, Progress reporting, Error recovery
Phase: "API documentation"       → Structure/navigation, Code examples depth, Versioning approach, Interactive elements
```

**Claude handles these (don't ask):** technical implementation details, architecture patterns, performance optimization, scope (roadmap defines this).
</gray_area_identification>

<answer_validation>
**IMPORTANT: Answer validation** — After every AskUserQuestion call, if the response is empty/whitespace-only:

- **"Other" with empty text** (the user wants to type freeform): output `"What would you like to discuss?"`, STOP generating, wait for the user's next message, then reflect it back and continue. Do NOT retry AskUserQuestion or call any tools.
- **Any other empty response:** retry once with the same parameters; if still empty, present options as a plain-text numbered list. Never proceed with empty input.

**Text mode** (`--text` or `workflow.text_mode: true`): follow `workflows/discuss-phase/modes/text.md` — do not use AskUserQuestion at all.
</answer_validation>

<process>

**Express path available:** If you already have a PRD or acceptance criteria document, use ``gsd-serena-bridge plan-phase --format markdown` {phase} --prd path/to/prd.md` to skip this discussion and go straight to planning.

<step name="initialize" priority="first">
Phase number from argument (required).

```bash
- Native query translated: `INIT=$(gsd_run query init.phase-op "${PHASE}"); [[ "$INIT" == @file:* ]] && INIT=$(cat "${INIT#@file:}")` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
- Native query translated: `AGENT_SKILLS_ADVISOR=$(gsd_run query agent-skills gsd-advisor-researcher)` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
```

Parse JSON for: `commit_docs`, `phase_found`, `phase_dir`, `phase_number`, `phase_name`, `phase_slug`, `padded_phase`, `has_research`, `has_context`, `has_plans`, `has_verification`, `plan_count`, `roadmap_exists`, `planning_exists`, `response_language`.

**If `response_language` is set:** All user-facing questions, prompts, and explanations in this workflow MUST be presented in `{response_language}`. Technical terms, code, file paths, and subagent prompts stay in English — only user-facing output is transla...

**If `phase_found` is false:**
```
Phase [X] not found in roadmap.
Use `gsd-serena-bridge progress --format markdown` ${GSD_WS} to see available phases.
```
Exit workflow.

**Mode dispatch — Read mode files lazily based on flags in $ARGUMENTS:**

```bash
# Detect advisor mode (file-existence guard — no Read until needed)
if [ -f "$HOME/.claude/gsd-core/USER-PROFILE.md" ]; then
ADVISOR_MODE=true
else
ADVISOR_MODE=false
fi
```

- If `--power` in $ARGUMENTS: `Read(workflows/discuss-phase/modes/power.md)` and execute it end-to-end. Do NOT continue with the steps below.
- Otherwise, continue. Per-flag overlay reads happen at their relevant steps:
- `--all` → Read `workflows/discuss-phase/modes/all.md` before `present_gray_areas`.
- `--auto` → Read `workflows/discuss-phase/modes/auto.md` before `check_existing` (it overrides several steps).
- `--chain` → Read `workflows/discuss-phase/modes/chain.md` before `auto_advance`.
- `--text` (or `workflow.text_mode: true`) → Read `workflows/discuss-phase/modes/text.md` before any AskUserQuestion call.
- `--batch` → Read `workflows/discuss-phase/modes/batch.md` before `discuss_areas`.
- `--analyze` → Read `workflows/discuss-phase/modes/analyze.md` before `discuss_areas`.
- `ADVISOR_MODE = true` → Read `workflows/discuss-phase/modes/advisor.md` before `analyze_phase` (it changes the discussion flow and adds an `advisor_research` substep).
- No flags → Read `workflows/discuss-phase/modes/default.md` before `discuss_areas`.

**If `phase_found` is true:** Continue to `check_blocking_antipatterns`.
</step>

<step name="check_blocking_antipatterns" priority="first">
**MANDATORY — Check for blocking anti-patterns before any other work.**

Look for a `.continue-here.md` in the current phase directory:

```bash
ls ${phase_dir}/.continue-here.md 2>/dev/null || true
```

If `.continue-here.md` exists, parse its "Critical Anti-Patterns" table for rows with `severity` = `blocking`.

**If one or more `blocking` anti-patterns are found:** the agent must demonstrate understanding of each by answering all three questions for each one:
1. **What is this anti-pattern?** — Describe it in your own words.
2. **How did it manifest?** — Explain the specific failure that caused it to be recorded.
3. **What structural mechanism (not acknowledgment) prevents it?** — Name the concrete step or enforcement mechanism that stops recurrence.

Write these answers inline before continuing. If a blocking anti-pattern cannot be answered from the context in `.continue-here.md`, stop and ask the user for clarification.

**If no `.continue-here.md` exists, or no `blocking` rows are found:** Proceed directly to `check_spec`.
</step>

<step name="check_spec">
Check if a SPEC.md (from ``gsd-serena-bridge spec-phase --format markdown``) exists for this phase. SPEC.md locks requirements before implementation decisions.

```bash
ls ${phase_dir}/*-SPEC.md 2>/dev/null | grep -v AI-SPEC | head -1 || true
```

**If SPEC.md is found:**
1. Read the SPEC.md file.
2. Count requirements (numbered items in `## Requirements`).
3. Display: `Found SPEC.md — {N} requirements locked. Focusing on implementation decisions.`
4. Set `spec_loaded = true`.
5. Store requirements, boundaries, and acceptance criteria as `<locked_requirements>` — these flow directly into CONTEXT.md without re-asking.

**If no SPEC.md is found:** Continue with `spec_loaded = false`.

**Note:** SPEC.md files named `AI-SPEC.md` (from ``gsd-serena-bridge ai-integration-phase --format markdown``) are excluded — different purpose.
</step>

<step name="check_existing">
Check if CONTEXT.md already exists using `has_context` from init.

```bash
ls ${phase_dir}/*-CONTEXT.md 2>/dev/null || true
```

**If exists:**

**If `--auto`:** Auto-select "Update it" — load existing context and continue to `analyze_phase`. Log: `[auto] Context exists — updating with auto-selected decisions.`

**Otherwise:** AskUserQuestion (header: "Context"; question: "Phase [X] already has context. What do you want to do?"; options: "Update it" / "View it" / "Skip"). Branch accordingly.

**If doesn't exist:**

Check for an interrupted discussion checkpoint:
```bash
ls ${phase_dir}/*-DISCUSS-CHECKPOINT.json 2>/dev/null || true
```

If a checkpoint file exists:

**If `--auto`:** Auto-select "Resume" — load checkpoint and continue from last completed area.

**Otherwise:** AskUserQuestion (header: "Resume"; question: "Found interrupted discussion checkpoint ({N} areas completed out of {M}). Resume from where you left off?"; options: "Resume" / "Start fresh"). On "Resume", parse the checkpoint JSON, load `decisi...

Check `has_plans` and `plan_count` from init. **If `has_plans` is true:**

**If `--auto`:** Auto-select "Continue and replan after". Log: `[auto] Plans exist — continuing with context capture, will replan after.`

**Otherwise:** AskUserQuestion (header: "Plans exist"; question: "Phase [X] already has {plan_count} plan(s) created without user context. Your decisions here won't affect existing plans unless you replan."; options: "Continue and replan after" / "View exis...

**If `has_plans` is false:** Continue to `load_prior_context`.
</step>

<step name="load_prior_context">
Read project-level and prior phase context to avoid re-asking decided questions.

```bash
cat .planning/PROJECT.md 2>/dev/null || true
cat .planning/REQUIREMENTS.md 2>/dev/null || true
cat .planning/STATE.md 2>/dev/null || true
```

Read at most **3** prior CONTEXT.md files (most recent 3 phases before current). If `.planning/DECISIONS-INDEX.md` exists, read that instead — it is a bounded rolling summary that supersedes per-phase reads.

```bash
(find .planning/phases -name "*-CONTEXT.md" 2>/dev/null || true) | sort -r
```

For each CONTEXT.md read: extract `<decisions>` (locked preferences), `<specifics>` (particular references), and patterns (e.g., "user prefers minimal UI", "user rejected single-key shortcuts").

**Spike/sketch findings:** Check for project-local skills:
```bash
SPIKE_FINDINGS=$(ls ./.claude/skills/spike-findings-*/SKILL.md 2>/dev/null | head -1 || true)
SKETCH_FINDINGS=$(ls ./.claude/skills/sketch-findings-*/SKILL.md 2>/dev/null | head -1 || true)
RAW_SPIKES=$(ls .planning/spikes/MANIFEST.md 2>/dev/null)
RAW_SKETCHES=$(ls .planning/sketches/MANIFEST.md 2>/dev/null)
```

If findings skills exist, read SKILL.md and reference files; extract validated patterns, landmines, constraints, design decisions. Add them to `<prior_decisions>`.

If raw spikes/sketches exist but no findings skill, note: `⚠ Unpackaged spikes/sketches detected — run `gsd-serena-bridge spike --format markdown` --wrap-up or `gsd-serena-bridge sketch --format markdown` --wrap-up to make findings available.`

Build internal `<prior_decisions>` with sections for Project-Level (from PROJECT.md / REQUIREMENTS.md), From Prior Phases (per-phase decisions), and From Spike/Sketch Findings (validated patterns, landmines, design decisions).

**Usage downstream:** `analyze_phase` skips already-decided gray areas; `present_gray_areas` annotates options ("You chose X in Phase 5"); `discuss_areas` pre-fills or flags conflicts.

**If no prior context exists:** Continue without — expected for early phases.
</step>

<step name="cross_reference_todos">
Check pending todos for matches with this phase's scope.

```bash
- Native query translated: `TODO_MATCHES=$(gsd_run query todo.match-phase "${PHASE_NUMBER}")` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
```

Parse JSON for: `todo_count`, `matches[]` (each with `file`, `title`, `area`, `score`, `reasons`).

**If `todo_count` is 0 or `matches` is empty:** Skip silently.

**If matches found:** Present each match (title, area, why it matched). AskUserQuestion (multiSelect) asking which to fold. Folded → `<folded_todos>` for CONTEXT.md `<decisions>`. Reviewed but not folded → `<reviewed_todos>` for CONTEXT.md `<deferred>`.

**Auto mode (`--auto`):** Fold all todos with score >= 0.4 automatically. Log the selection.
</step>

<step name="scout_codebase">
Lightweight scan of existing code to inform gray area identification (~10% context).

Read `@~/.claude/gsd-core/references/scout-codebase.md` — it contains the phase-type→map selection table, single-read rule, no-maps fallback, and `<codebase_context>` output schema. Then execute:
1. `ls .planning/codebase/*.md` to find existing maps
2. Select 2–3 maps via the reference's table; or grep fallback if none exist
3. Build internal `<codebase_context>` per the reference's output schema
</step>

<step name="dispatch_discuss_pre_hooks">
```bash
DISCUSS_PRE_HOOKS_JSON=$(gsd_run loop render-hooks discuss:pre --raw)
```
Apply each entry in `activeHooks` per @~/.claude/gsd-core/references/loop-hook-dispatch.md. Empty list → continue to `analyze_phase`.
</step>

<step name="analyze_phase">
Analyze the phase to identify gray areas. Use both `prior_decisions` and `codebase_context` to ground the analysis.

1. **Domain boundary** — What capability is this phase delivering? State it clearly.

1b. **Initialize canonical refs accumulator** — Start building `<canonical_refs>` for CONTEXT.md. Sources:
- **Now:** Copy `Canonical refs:` from ROADMAP.md for this phase. Expand each to a full relative path. Check REQUIREMENTS.md and PROJECT.md for specs/ADRs referenced.

- Source translation truncated here; use the bridge command output, workflow runbook, installed contracts, or operation plan for continuation.

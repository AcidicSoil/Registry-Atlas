# Bridge Workflow: discuss-phase-assumptions

<!-- generated-by: pnpm gen:bridge-commands -->

## Purpose

This bridge workflow runbook translates the actual GSD-core workflow information and adapts it for Serena bridge operation. Read it when operating `gsd-workflow-discuss-phase-assumptions` in a target project.

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

- Contract ID: `gsd-workflow-discuss-phase-assumptions`
- Status: `planned`
- Source path: `gsd-core/workflows/discuss-phase-assumptions.md`
- Resolved source path: `vendor/reference/gsd-core/gsd-core/workflows/discuss-phase-assumptions.md`
- Mirrored runbook path: `.agents/gsd-serena/workflows/discuss-phase-assumptions.md`

## Translated GSD Workflow

### Native Shim Translation
- Native GSD shim locator omitted: the bridge uses the installed `gsd-serena-bridge` CLI, `bootstrap`, `doctor`, `repair`, resolver packets, and install-managed project surfaces instead of locating `gsd-tools.cjs`.
<purpose>
Extract implementation decisions that downstream agents need — using codebase-first analysis
and assumption surfacing instead of interview-style questioning.

You are a thinking partner, not an interviewer. Analyze the codebase deeply, surface what you
believe based on evidence, and ask the user only to correct what's wrong.
</purpose>

<available_agent_types>
Valid GSD subagent types (use exact names — do not fall back to 'general-purpose'):
- gsd-assumptions-analyzer — Analyzes codebase to surface implementation assumptions
</available_agent_types>

<downstream_awareness>
**CONTEXT.md feeds into:**

1. **gsd-phase-researcher** — Reads CONTEXT.md to know WHAT to research
2. **gsd-planner** — Reads CONTEXT.md to know WHAT decisions are locked

**Your job:** Capture decisions clearly enough that downstream agents can act on them
without asking the user again. Output is identical to discuss mode — same CONTEXT.md format.
</downstream_awareness>

<philosophy>
**Assumptions mode philosophy:**

The user is a visionary, not a codebase archaeologist. They need enough context to evaluate
whether your assumptions match their intent — not to answer questions you could figure out
by reading the code.

- Read the codebase FIRST, form opinions SECOND, ask ONLY about what's genuinely unclear
- Every assumption must cite evidence (file paths, patterns found)
- Every assumption must state consequences if wrong
- Minimize user interactions: ~2-4 corrections vs ~15-20 questions
</philosophy>

<scope_guardrail>
**CRITICAL: No scope creep.**

The phase boundary comes from ROADMAP.md and is FIXED. Discussion clarifies HOW to implement
what's scoped, never WHETHER to add new capabilities.

When user suggests scope creep:
"[Feature X] would be a new capability — that's its own phase.
Want me to note it for the roadmap backlog? For now, let's focus on [phase domain]."

Capture the idea in "Deferred Ideas". Don't lose it, don't act on it.
</scope_guardrail>

<answer_validation>
**IMPORTANT: Answer validation** — After every AskUserQuestion call, check if the response
is empty or whitespace-only. If so:
1. Retry the question once with the same parameters
2. If still empty, present the options as a plain-text numbered list

**Text mode (`workflow.text_mode: true` in config or `--text` flag):**
When text mode is active, do not use AskUserQuestion at all. Present every question as a
plain-text numbered list and ask the user to type their choice number.
</answer_validation>

<process>

<step name="initialize" priority="first">
Phase number from argument (required).

```bash
- Native query translated: `INIT=$(gsd_run query init.phase-op "${PHASE}")` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
- Native query translated: `AGENT_SKILLS_ANALYZER=$(gsd_run query agent-skills gsd-assumptions-analyzer)` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
```

Parse JSON for: `commit_docs`, `phase_found`, `phase_dir`, `phase_number`, `phase_name`,
`phase_slug`, `padded_phase`, `has_research`, `has_context`, `has_plans`, `has_verification`,
`plan_count`, `roadmap_exists`, `planning_exists`.

**If `phase_found` is false:**
```
Phase [X] not found in roadmap.

Use `gsd-serena-bridge progress --format markdown` to see available phases.
```
Exit workflow.

**If `phase_found` is true:** Continue to check_existing.

**Auto mode** — If `--auto` is present in ARGUMENTS:
- In `check_existing`: auto-select "Update it" (if context exists) or continue without prompting
- In `present_assumptions`: skip confirmation gate, proceed directly to write CONTEXT.md
- In `correct_assumptions`: auto-select recommended option for each correction
- Log each auto-selected choice inline
- After completion, auto-advance to plan-phase
</step>

<step name="check_existing">
Check if CONTEXT.md already exists using `has_context` from init.

```bash
ls ${phase_dir}/*-CONTEXT.md 2>/dev/null || true
```

**If exists:**

**If `--auto`:** Auto-select "Update it". Log: `[auto] Context exists — updating with assumption-based analysis.`

**Otherwise:** Use AskUserQuestion:
- header: "Context"
- question: "Phase [X] already has context. What do you want to do?"
- options:
- "Update it" — Re-analyze codebase and refresh assumptions
- "View it" — Show me what's there
- "Skip" — Use existing context as-is

If "Update": Load existing, continue to load_prior_context
If "View": Display CONTEXT.md, then offer update/skip
If "Skip": Exit workflow

**If doesn't exist:**

Check `has_plans` and `plan_count` from init. **If `has_plans` is true:**

**If `--auto`:** Auto-select "Continue and replan after". Log: `[auto] Plans exist — continuing with assumption analysis, will replan after.`

**Otherwise:** Use AskUserQuestion:
- header: "Plans exist"
- question: "Phase [X] already has {plan_count} plan(s) created without user context. Your decisions here won't affect existing plans unless you replan."
- options:
- "Continue and replan after"
- "View existing plans"
- "Cancel"

If "Continue and replan after": Continue to load_prior_context.
If "View existing plans": Display plan files, then offer "Continue" / "Cancel".
If "Cancel": Exit workflow.

**If `has_plans` is false:** Continue to load_prior_context.
</step>

<step name="load_prior_context">
Read project-level and prior phase context to avoid re-asking decided questions.

**Step 1: Read project-level files**
```bash
cat .planning/PROJECT.md 2>/dev/null || true
cat .planning/REQUIREMENTS.md 2>/dev/null || true
cat .planning/STATE.md 2>/dev/null || true
```

Extract from these:
- **PROJECT.md** — Vision, principles, non-negotiables, user preferences
- **REQUIREMENTS.md** — Acceptance criteria, constraints
- **STATE.md** — Current progress, any flags

**Step 2: Read all prior CONTEXT.md files**
```bash
(find .planning/phases -name "*-CONTEXT.md" 2>/dev/null || true) | sort
```

For each CONTEXT.md where phase number < current phase:
- Read the `<decisions>` section — these are locked preferences
- Read `<specifics>` — particular references or "I want it like X" moments
- Note patterns (e.g., "user consistently prefers minimal UI")

**Step 3: Build internal `<prior_decisions>` context**

Structure the extracted information for use in assumption generation.

**If no prior context exists:** Continue without — expected for early phases.
</step>

<step name="cross_reference_todos">
Check if any pending todos are relevant to this phase's scope.

```bash
- Native query translated: `TODO_MATCHES=$(gsd_run query todo.match-phase "${PHASE_NUMBER}")` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
```

Parse JSON for: `todo_count`, `matches[]`.

**If `todo_count` is 0:** Skip silently.

**If matches found:** Present matched todos, use AskUserQuestion (multiSelect) to fold relevant ones into scope.

**For selected (folded) todos:** Store as `<folded_todos>` for CONTEXT.md `<decisions>` section.
**For unselected:** Store as `<reviewed_todos>` for CONTEXT.md `<deferred>` section.

**Auto mode (`--auto`):** Fold all todos with score >= 0.4 automatically. Log the selection.
</step>

<step name="load_methodology">
Read the project-level methodology file if it exists. This must happen before assumption analysis
so that active lenses shape how assumptions are generated and evaluated.

```bash
cat .planning/METHODOLOGY.md 2>/dev/null || true
```

**If METHODOLOGY.md exists:**
- Parse each named lens: its diagnoses, recommendations, and triggering conditions
- Store as internal `<active_lenses>` for use in deep_codebase_analysis and present_assumptions
- When spawning the gsd-assumptions-analyzer, pass the lens list so it can flag which lenses apply
- When presenting assumptions, append a "Methodology" section showing which lenses were applied
and what they flagged (if anything)

**If METHODOLOGY.md does not exist:** Skip silently. This artifact is optional.
</step>

<step name="scout_codebase">
Lightweight scan of existing code to inform assumption generation.

**Step 1: Check for existing codebase maps**
```bash
ls .planning/codebase/*.md 2>/dev/null || true
```

**If codebase maps exist:** Read relevant ones (CONVENTIONS.md, STRUCTURE.md, STACK.md). Extract reusable components, patterns, integration points. Skip to Step 3.

**Step 2: If no codebase maps, do targeted grep**

Extract key terms from phase goal, search for related files.

```bash
grep -rl "{term1}\|{term2}" src/ app/ --include="*.ts" --include="*.tsx" 2>/dev/null | head -10
```

Read the 3-5 most relevant files.

**Step 3: Build internal `<codebase_context>`**

Identify reusable assets, established patterns, integration points, and creative options. Store internally for use in deep_codebase_analysis.
</step>

<step name="deep_codebase_analysis">
Spawn a `gsd-assumptions-analyzer` agent to deeply analyze the codebase for this phase. This
keeps raw file contents out of the main context window, protecting token budget.

**Resolve calibration tier (if USER-PROFILE.md exists):**

```bash
PROFILE_PATH="$HOME/.claude/gsd-core/USER-PROFILE.md"
```

If file exists at PROFILE_PATH:
- Priority 1: Read config.json > preferences.vendor_philosophy (project-level override)
- Priority 2: Read USER-PROFILE.md Vendor Choices/Philosophy rating (global)
- Priority 3: Default to "standard"

Map to calibration tier:
- conservative OR thorough-evaluator → full_maturity (more alternatives, detailed evidence)
- opinionated → minimal_decisive (fewer alternatives, decisive recommendations)
- pragmatic-fast OR any other value → standard

If no USER-PROFILE.md: calibration_tier = "standard"

**Spawn Explore subagent** (runs in a subagent — no output until it returns, ~1–5 min; expected, not a freeze)**:**

```
- Native agent dispatch translated: `Agent(subagent_type="gsd-assumptions-analyzer", prompt="""` -> use Serena role workflow / generated role skill / sequential role pass with handoff.
Analyze the codebase for Phase {PHASE}: {phase_name}.

Phase goal: {roadmap_description}
Prior decisions: {prior_decisions_summary}
Codebase scout hints: {codebase_context_summary}
Calibration: {calibration_tier}

Your job:
1. Read ROADMAP.md phase {PHASE} description
2. Read any prior CONTEXT.md files from earlier phases
3. Glob/Grep for files related to: {phase_relevant_terms}
4. Read 5-15 most relevant source files
5. Return structured assumptions

## Output Format

Return EXACTLY this structure:

## Assumptions

### [Area Name] (e.g., "Technical Approach")
- **Assumption:** [Decision statement]
- **Why this way:** [Evidence from codebase — cite file paths]
- **If wrong:** [Concrete consequence of this being wrong]
- **Confidence:** Confident | Likely | Unclear

(3-5 areas, calibrated by tier:
- full_maturity: 3-5 areas, 2-3 alternatives per Likely/Unclear item
- standard: 3-4 areas, 2 alternatives per Likely/Unclear item
- minimal_decisive: 2-3 areas, decisive single recommendation per item)

## Needs External Research
[Topics where codebase alone is insufficient — library version compatibility,
ecosystem best practices, etc. Leave empty if codebase provides enough evidence.]

${AGENT_SKILLS_ANALYZER}
""")
```

- Native agent dispatch translated: `> **ORCHESTRATOR RULE — CODEX RUNTIME**: After calling Agent() above, stop working on this task immediately. Do not read more files, analyze the codebase, or process assumptions while the subagent is active. Wait for the subagent to return its result. This prevents duplicate work, conflicting edits, and wasted context. Only resume when the subagent result is available.` -> use Serena role workflow / generated role skill / sequential role pass with handoff.

Parse the subagent's response. Extract:
- `assumptions[]` — each with area, statement, evidence, consequence, confidence
- `needs_research[]` — topics requiring external research (may be empty)

- Source translation truncated here; use the bridge command output, workflow runbook, installed contracts, or operation plan for continuation.

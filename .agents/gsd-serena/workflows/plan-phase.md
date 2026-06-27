# Bridge Workflow: plan-phase

<!-- generated-by: pnpm gen:bridge-commands -->

## Purpose

This bridge workflow runbook translates the actual GSD-core workflow information and adapts it for Serena bridge operation. Read it when operating `gsd-workflow-plan-phase` in a target project.

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

- Contract ID: `gsd-workflow-plan-phase`
- Status: `planned`
- Source path: `gsd-core/workflows/plan-phase.md`
- Resolved source path: `vendor/reference/gsd-core/gsd-core/workflows/plan-phase.md`
- Mirrored runbook path: `.agents/gsd-serena/workflows/plan-phase.md`

## Translated GSD Workflow

### Native Shim Translation
- Native GSD shim locator omitted: the bridge uses the installed `gsd-serena-bridge` CLI, `bootstrap`, `doctor`, `repair`, resolver packets, and install-managed project surfaces instead of locating `gsd-tools.cjs`.
<!-- gsd:loop-host
step: plan
points: plan:pre, plan:post
agent-roles: researcher, planner, checker
produces: PLAN.md
consumes: CONTEXT.md
-->
<purpose>
Create executable phase prompts (PLAN.md files) for a roadmap phase with integrated research and verification. Default flow: Research (if needed) -> Plan -> Verify -> Done. Orchestrates gsd-phase-researcher, gsd-planner, and gsd-plan-checker agents with a r...
</purpose>

<required_reading>
Read all files referenced by the invoking prompt's execution_context before starting.

@~/.claude/gsd-core/references/ui-brand.md
@~/.claude/gsd-core/references/revision-loop.md
@~/.claude/gsd-core/references/gate-prompts.md
@~/.claude/gsd-core/references/agent-contracts.md
@~/.claude/gsd-core/references/gates.md
</required_reading>

<available_agent_types>
Valid GSD subagent types (use exact names — do not fall back to 'general-purpose'):
- gsd-phase-researcher — Researches technical approaches for a phase
- gsd-pattern-mapper — Analyzes codebase for existing patterns, produces PATTERNS.md
- gsd-planner — Creates detailed plans from phase scope
- gsd-plan-checker — Reviews plan quality before execution
</available_agent_types>

<runtime_compatibility>
**Subagent spawning — top-level Claude Code:**
The Agent tool IS available in a top-level Claude Code session. Always spawn
- Native agent dispatch translated: `gsd-phase-researcher, gsd-planner, and gsd-plan-checker as separate Agent() calls.` -> use Serena role workflow / generated role skill / sequential role pass with handoff.
Never absorb these roles inline. Role separation is required regardless of `--chain`
or `--auto` — those options suppress interactive prompts only; they NEVER authorize
collapsing plan roles into the orchestrator context.

**Backgrounded Claude Code (via manager/autonomous):**
The calling workflow (manager.md / autonomous.md) already runs plan-phase inline via
Skill() on Claude Code so that the plan-checker subagent can still spawn. plan-phase
itself does not need to detect this case.

**#1009 caveat (discuss-phase early-exit):**
The "display the command and exit" instruction near `## 4` applies only to the
discuss-phase early-exit path. It does NOT authorize inline role performance for any
plan-phase agents.

**Other runtimes:**
Do not pre-judge Agent availability by introspection. Always attempt the actual
- Native agent dispatch translated: `Agent() call for gsd-phase-researcher, gsd-planner, and gsd-plan-checker. Only` -> use Serena role workflow / generated role skill / sequential role pass with handoff.
- Native agent dispatch translated: `a real tool-unavailable error returned by Agent() is a reliable absence signal —` -> use Serena role workflow / generated role skill / sequential role pass with handoff.
never stop based on a self-assessed "I think Agent is unavailable." If the call
fails with a tool-unavailable error, log the gap and stop — do NOT collapse
researcher/planner/checker roles inline. Independent agent contexts are required
for the plan-checker gate to be meaningful.
</runtime_compatibility>

<process>

## 0. Git Branch Invariant

**Do not create, rename, or switch git branches during plan-phase.** Branch identity is established at discuss-phase and is owned by the user's git workflow. A phase rename in ROADMAP.md is a plan-level change only — it does not mutate git branch names. If ...

## 1. Initialize

Load all context in one call (paths only to minimize orchestrator context):

```bash
GRAN_PARAM=""; if [[ "$ARGUMENTS" =~ (^|[[:space:]])--granularity[[:space:]]+([^[:space:]-][^[:space:]]*) ]]; then GRAN_PARAM="--granularity ${BASH_REMATCH[2]}"; fi
- Native query translated: `INIT=$(gsd_run query init.plan-phase "$PHASE" $GRAN_PARAM)` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
- Native query translated: `AGENT_SKILLS_RESEARCHER=$(gsd_run query agent-skills gsd-phase-researcher)` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
- Native query translated: `AGENT_SKILLS_PLANNER=$(gsd_run query agent-skills gsd-planner)` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
- Native query translated: `AGENT_SKILLS_CHECKER=$(gsd_run query agent-skills gsd-plan-checker)` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
- Native query translated: `CONTEXT_WINDOW=$(gsd_run query config-get context_window 2>/dev/null || echo "200000")` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
- Native query translated: `MVP_MODE_CFG=$(gsd_run query config-get workflow.mvp_mode 2>/dev/null || echo "false")` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
```

When the tdd capability's `workflow.tdd_mode` is active (resolved via the plan:pre render-hooks), the planner agent is instructed to apply `type: tdd` to eligible tasks using heuristics from `references/tdd.md`. The TDD guidance is injected via the tdd capa...

When `CONTEXT_WINDOW >= 500000`, the planner prompt includes the 3 most recent prior phase CONTEXT.md and SUMMARY.md files PLUS any phases explicitly listed in the current phase's `Depends on:` field in ROADMAP.md. Explicit dependencies always load regardle...

Parse JSON for: `researcher_model`, `planner_model`, `checker_model`, `research_enabled`, `plan_checker_enabled`, `nyquist_validation_enabled`, `commit_docs`, `text_mode`, `phase_found`, `phase_dir`, `phase_number`, `phase_name`, `phase_slug`, `padded_phase...

**If `response_language` is set:** Include `response_language: {value}` in all spawned subagent prompts so any user-facing output stays in the configured language.

**File paths (for <files_to_read> blocks):** `state_path`, `roadmap_path`, `requirements_path`, `context_path`, `research_path`, `verification_path`, `uat_path`, `reviews_path`. These are null if files don't exist.

**If `planning_exists` is false:** Error — run ``gsd-serena-bridge new-project --format markdown`` first.

## 1.5. Closed-Phase Gate (#3569)

The init JSON includes `phase_status` — one of `Pending | Planned | In Progress | Executed | Complete | Needs Review`. `Complete` means the phase has all summaries AND a `VERIFICATION.md` with `status: passed`. Replanning a closed phase silently rewrites pl...

Parse `phase_status` from the init JSON, then:

```bash
FORCE_REPLAN=false
if [[ "$ARGUMENTS" =~ (^|[[:space:]])--force([[:space:]]|$) ]]; then
FORCE_REPLAN=true
fi

if [ "${phase_status}" = "Complete" ]; then
if [[ "$ARGUMENTS" =~ (^|[[:space:]])--reviews([[:space:]]|$) ]]; then
# --reviews on a closed phase is never legitimate — concerns belong in a
# new phase or issue against the closed phase's commits.
cat <<EOF >&2
Phase ${phase_number} (${phase_name}) is already CLOSED (VERIFICATION status: passed).
`gsd-serena-bridge plan-phase --format markdown` --reviews cannot replan a closed phase. If the review surfaced
real concerns, open a follow-up phase or file an issue against the closed
phase's commits. There is no --force override for --reviews on a closed phase.
EOF
exit 1
fi
if [ "$FORCE_REPLAN" != "true" ]; then
cat <<EOF >&2
Phase ${phase_number} (${phase_name}) is already CLOSED (VERIFICATION status: passed).
Replanning a closed phase will overwrite plan docs that no longer match the
shipped code. If you intentionally want to replan over closed work, re-run
with: `gsd-serena-bridge plan-phase --format markdown` ${phase_number} --force

Otherwise, to view what shipped, see: ${verification_path}
EOF
exit 1
fi
# FORCE_REPLAN=true: continue, but emit a banner so the operator sees the
# decision in the transcript and in any committed plan docs.
echo "WARNING: Replanning CLOSED phase ${phase_number} under --force. Verify the closeout was wrong before committing new plan docs." >&2
fi
```

The gate fires only on `Complete`. `Executed` and `Needs Review` are not gated — those states mean planning was finished but verification did not pass, and replanning is a legitimate next step.

## 2. Parse and Normalize Arguments

Extract from $ARGUMENTS: phase number (integer or decimal like `2.1`), flags (`--research`, `--skip-research`, `--research-phase <N>`, `--gaps`, `--skip-verify`, `--skip-ui`, `--prd <filepath>`, `--ingest <path-or-glob>`, `--ingest-format <auto|nygard|madr|...

**`--research-phase <N>` — research-only mode (#3042 + #3044).** When this flag is present, parse `<N>` as the phase number (overrides any positional phase argument), set `RESEARCH_ONLY=true`, and treat the rest of this workflow as a research-dispatch only ...

In research-only mode, two modifiers control behavior when `RESEARCH.md` already exists:

- **`--research`** — force-refresh re-research without prompting. Re-spawns the researcher unconditionally and overwrites the existing RESEARCH.md. (This is the existing `--research` flag's standard "force re-research" semantics, reused here.)
- **`--view`** — view-only: print existing `RESEARCH.md` to stdout, do **not** spawn the researcher. Sets `VIEW_ONLY=true`. Cheapest mode for the correction-without-replanning loop. If `RESEARCH.md` does not exist, error with a hint to drop `--view`.

```bash
RESEARCH_ONLY=false
VIEW_ONLY=false
if [[ "$ARGUMENTS" =~ --research-phase[[:space:]]+([0-9]+(\.[0-9]+)?) ]]; then
RESEARCH_ONLY=true
PHASE="${BASH_REMATCH[1]}"
fi
if $RESEARCH_ONLY && [[ "$ARGUMENTS" =~ (^|[[:space:]])--view([[:space:]]|$) ]]; then
VIEW_ONLY=true
fi
```

**`--granularity <coarse|standard|fine>` — CLI override (#703).** When present, this value is the resolved granularity passed to the planner — it wins over any per-phase `granularities.<type>` config, top-level `granularity` config, or project defaults. The...

Set `TEXT_MODE=true` if `--text` is present in $ARGUMENTS OR `text_mode` from init JSON is `true`. When `TEXT_MODE` is active, replace every `AskUserQuestion` call with a plain-text numbered list and ask the user to type their choice number. This is require...

**MVP_MODE resolution.** Resolve `MVP_MODE` once via the centralized `phase.mvp-mode` query verb. Precedence (first hit wins): CLI flag → ROADMAP.md `**Mode:** mvp` → `workflow.mvp_mode` config → false. The verb is the single source of truth — do not re-imp...

```bash
MVP_FLAG_ARG=""
if [[ "$ARGUMENTS" =~ (^|[[:space:]])--mvp([[:space:]]|$) ]]; then MVP_FLAG_ARG="--cli-flag"; fi
if [[ "$ARGUMENTS" =~ (^|[[:space:]])--tdd([[:space:]]|$) ]]; then
- Native query translated: `gsd_run query config-set workflow.tdd_mode true 2>/dev/null || true` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
fi
```

Defer the `phase.mvp-mode` query until `PHASE` is finalized (after explicit argument parsing/fallback phase detection + validation). The verb returns `true|false`; full result also exposes `source` (`cli_flag` | `roadmap` | `config` | `none`) for diagnostic...

**Walking Skeleton gate.** When `MVP_MODE=true` AND `phase_number == "01"` AND there are zero prior phase summaries (new project), the planner runs in **Walking Skeleton mode** (per PRD decision Q2 — new projects only). Detect with:

```bash
WALKING_SKELETON=false
if [ "$MVP_MODE" = "true" ] && [ "$padded_phase" = "01" ]; then
- Native query translated: `PRIOR_SUMMARIES=$(gsd_run query phases.list --pick summaries_total 2>/dev/null || echo "0")` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
if [ "$PRIOR_SUMMARIES" = "0" ]; then WALKING_SKELETON=true; fi
fi
```

When `WALKING_SKELETON=true`:
- Planner is instructed to produce `SKELETON.md` in the phase directory alongside `PLAN.md`. The template lives at `~/.claude/gsd-core/references/skeleton-template.md` — the planner reads it when producing SKELETON.md (lazy; not loaded on non-skeleton runs).
- The plan must scaffold project + routing + one real DB read/write + one real UI interaction + dev deployment — the thinnest possible end-to-end working slice.

**Interaction with `--prd <filepath>`.** `--mvp` and `--prd` compose. The PRD express path (Step 3.5) creates `CONTEXT.md` from the PRD file and continues to research; the Walking Skeleton gate fires independently from the conditions above. When both are ac...

Extract express-path args from $ARGUMENTS: `PRD_FILE` (`--prd <filepath>`), `INGEST_PATH` (`--ingest <path-or-glob>`), and optional `INGEST_FORMAT` (`--ingest-format <auto|nygard|madr|narrative>`, default `auto`).

`--prd` and `--ingest` are mutually exclusive. If both are present, error and exit:
`Invalid arguments: cannot combine \`--prd\` with \`--ingest\`.`

**If no phase number:** Detect next unplanned phase from roadmap.

**If `phase_found` is false:** Validate phase exists in ROADMAP.md. If valid, create the directory using `expected_phase_dir` from init (includes `project_code` prefix when set):
```bash
mkdir -p "${expected_phase_dir}"
```

Set `phase_dir="${expected_phase_dir}"` after creation.

**Existing artifacts from init:** `has_research`, `has_plans`, `plan_count`.

Set `CHUNKED_MODE` from flag or config:
```bash
- Native query translated: `CHUNKED_CFG=$(gsd_run query config-get workflow.plan_chunked 2>/dev/null || echo "false")` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
CHUNKED_MODE=false
if [[ "$ARGUMENTS" =~ --chunked ]] || [[ "$CHUNKED_CFG" == "true" ]]; then
CHUNKED_MODE=true
fi
```

## 2.5. Validate `--reviews` Prerequisite

**Skip if:** No `--reviews` flag.

**If `--reviews` AND `--gaps`:** Error — cannot combine `--reviews` with `--gaps`. These are conflicting modes.

**If `--reviews` AND `has_reviews` is false (no REVIEWS.md in phase dir):**

Error:
```
No REVIEWS.md found for Phase {N}. Run reviews first:

`gsd-serena-bridge review --format markdown` --phase {N}

Then re-run `gsd-serena-bridge plan-phase --format markdown` {N} --reviews
```
Exit workflow.

## 3. Validate Phase

```bash
- Native query translated: `PHASE_INFO=$(gsd_run query roadmap.get-phase "${PHASE}")` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
```

**If `found` is false:** Error with available phases. **If `found` is true:** Extract `phase_number`, `phase_name`, `goal` from JSON.

Now that `PHASE` is finalized, resolve MVP mode:
```bash
- Native query translated: `MVP_MODE=$(gsd_run query phase.mvp-mode "${PHASE}" $MVP_FLAG_ARG --pick active)` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
```

## 3.5. Handle PRD Express Path

**Skip if:** No `--prd` flag in arguments.

**If `--prd <filepath>` provided:**

1. Read the PRD file:
```bash
PRD_CONTENT=$(cat "$PRD_FILE" 2>/dev/null)
if [ -z "$PRD_CONTENT" ]; then
echo "Error: PRD file not found: $PRD_FILE"
exit 1
fi
```

2. Display banner:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GSD ► PRD EXPRESS PATH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Using PRD: {PRD_FILE}
Generating CONTEXT.md from requirements...
```

3. Parse the PRD content and generate CONTEXT.md. The orchestrator should:
- Extract all requirements, user stories, acceptance criteria, and constraints from the PRD
- Map each to a locked decision (everything in the PRD is treated as a locked decision)
- Identify any areas the PRD doesn't cover and mark as "Claude's Discretion"
- **Extract canonical refs** from ROADMAP.md for this phase, plus any specs/ADRs referenced in the PRD — expand to full file paths (MANDATORY)
- Create CONTEXT.md in the phase directory

4. Write CONTEXT.md:
```markdown
# Phase [X]: [Name] - Context

**Gathered:** [date]
**Status:** Ready for planning
**Source:** PRD Express Path ({PRD_FILE})

<domain>
## Phase Boundary

[Extracted from PRD — what this phase delivers]

</domain>

<decisions>

- Source translation truncated here; use the bridge command output, workflow runbook, installed contracts, or operation plan for continuation.

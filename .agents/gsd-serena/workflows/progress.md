# Bridge Workflow: progress

<!-- generated-by: pnpm gen:bridge-commands -->

## Purpose

This bridge workflow runbook translates the actual GSD-core workflow information and adapts it for Serena bridge operation. Read it when operating `gsd-workflow-progress` in a target project.

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

- Contract ID: `gsd-workflow-progress`
- Status: `planned`
- Source path: `gsd-core/workflows/progress.md`
- Resolved source path: `vendor/reference/gsd-core/gsd-core/workflows/progress.md`
- Mirrored runbook path: `.agents/gsd-serena/workflows/progress.md`

## Translated GSD Workflow

### Native Shim Translation
- Native GSD shim locator omitted: the bridge uses the installed `gsd-serena-bridge` CLI, `bootstrap`, `doctor`, `repair`, resolver packets, and install-managed project surfaces instead of locating `gsd-tools.cjs`.
<purpose>
Check project progress, summarize recent work and what's ahead, then intelligently route to the next action — either executing an existing plan or creating the next one. Provides situational awareness before continuing work.
</purpose>

<required_reading>
Read all files referenced by the invoking prompt's execution_context before starting.
</required_reading>

<process>

<step name="init_context">
**Load progress context (paths only):**

```bash
- Native query translated: `INIT=$(gsd_run query init.progress)` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

Extract from init JSON: `project_exists`, `roadmap_exists`, `state_exists`, `phases`, `current_phase`, `next_phase`, `milestone_version`, `completed_count`, `phase_count`, `paused_at`, `state_path`, `roadmap_path`, `project_path`, `config_path`.

```bash
- Native query translated: `DISCUSS_MODE=$(gsd_run query config-get workflow.discuss_mode 2>/dev/null || echo "discuss")` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
```

If `project_exists` is false (no `.planning/` directory):

```
No planning structure found.

Run `gsd-serena-bridge new-project --format markdown` to start a new project.
```

Exit.

If missing STATE.md: suggest ``gsd-serena-bridge new-project --format markdown``.

**If ROADMAP.md missing but PROJECT.md exists:**

This means a milestone was completed and archived. Go to **Route F** (between milestones).

If missing both ROADMAP.md and PROJECT.md: suggest ``gsd-serena-bridge new-project --format markdown``.
</step>

<step name="load">
**Use structured extraction from `gsd-tools.cjs query` (or legacy gsd-tools.cjs):**

Instead of reading full files, use targeted tools to get only the data needed for the report:
- `ROADMAP=$(gsd-tools.cjs query roadmap.analyze)`
- `STATE=$(gsd-tools.cjs query state-snapshot)`

This minimizes orchestrator context usage.
</step>

<step name="analyze_roadmap">
**Get comprehensive roadmap analysis (replaces manual parsing):**

```bash
- Native query translated: `ROADMAP=$(gsd_run query roadmap.analyze)` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
```

This returns structured JSON with:
- All phases with disk status (complete/partial/planned/empty/no_directory)
- Goal and dependencies per phase
- Plan and summary counts per phase
- Aggregated stats: total plans, summaries, progress percent
- Current and next phase identification

Use this instead of manually reading/parsing ROADMAP.md.
</step>

<step name="recent">
**Gather recent work context:**

- Find the 2-3 most recent SUMMARY.md files
- Use `summary-extract` for efficient parsing:
```bash
- Native query translated: `gsd_run query summary-extract <path> --fields one_liner` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
```
- This shows "what we've been working on"
</step>

<step name="position">
**Parse current position from init context and roadmap analysis:**

- Use `current_phase` and `next_phase` from `$ROADMAP`
- Note `paused_at` if work was paused (from `$STATE`)
- Count pending todos: use `init todos` or `list-todos`
- Check for active debug sessions: `(ls .planning/debug/*.md 2>/dev/null || true) | grep -v resolved | wc -l`
</step>

<step name="report">
> ⚠️ Context authority: PROJECT.md, STATE.md, and ROADMAP.md are the authoritative sources
> for project name, milestone, current phase, and next-step routing. CLAUDE.md ## Project
> blocks are a secondary config aid that may be significantly stale — do NOT use the
> CLAUDE.md project description as a source for any progress report field.

**Generate progress bar from `gsd-tools.cjs query progress` / `progress.json`, then present rich status report:**

```bash
# Get formatted progress bar
- Native query translated: `PROGRESS_BAR=$(gsd_run query progress.bar --raw)` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
```

Present:

```
# [Project Name]

**Progress:** {PROGRESS_BAR}
**Profile:** [quality/balanced/budget/inherit]
**Discuss mode:** {DISCUSS_MODE}

## Recent Work
- [Phase X, Plan Y]: [what was accomplished - 1 line from summary-extract]
- [Phase X, Plan Z]: [what was accomplished - 1 line from summary-extract]

## Current Position
Phase [N] of [total]: [phase-name]
Plan [M] of [phase-total]: [status]
CONTEXT: [✓ if has_context | - if not]

## Key Decisions Made
- [extract from $STATE.decisions[]]
- [e.g. jq -r '.decisions[].decision' from state-snapshot]

## Blockers/Concerns
- [extract from $STATE.blockers[]]
- [e.g. jq -r '.blockers[].text' from state-snapshot]

## Pending Todos
- [count] pending — `gsd-serena-bridge capture --format markdown` --list to review

## Active Debug Sessions
- [count] active — `gsd-serena-bridge debug --format markdown` to continue
(Only show this section if count > 0)

## What's Next
[Next phase/plan objective from roadmap analyze]
```

</step>

<step name="mvp_display">
**MVP-mode display (when phase has `**Mode:** mvp` in ROADMAP.md).**

Resolve `MVP_MODE` per phase via the centralized resolver. progress has no `--mvp` CLI flag (mode is inherited from the planned phase), so we omit `--cli-flag`:

```bash
- Native query translated: `MVP_MODE=$(gsd_run query phase.mvp-mode "${PHASE_NUMBER}" --pick active)` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
```

When `MVP_MODE=true`, the per-phase progress block adds a **user-flow status** sub-block sourced from the phase's PLAN.md task names. Each task whose name reads like a user-visible capability (e.g., "Register flow", "Login flow", "Password reset") is render...

```
Phase 1 — User Auth MVP
✅ Walking Skeleton complete           ← from SKELETON.md existence
✅ Register flow working               ← from PLAN.md task with summary
✅ Login flow working                  ← from PLAN.md task with summary
🔄 Password reset (in progress)        ← from PLAN.md task without summary
⬜ Email verification                  ← from PLAN.md task not yet started
```

**User-flow filter:** Tasks whose names are technical-sounding ("Wire DB schema", "Create migration", "Bump deps") are NOT rendered as user-flow status lines. Heuristic: a task name is user-flow-shaped if it ends in "flow", "page", "screen", or starts with ...

When `MVP_MODE=false` (mode is null, absent, or the phase has no `**Mode:**` line), fall back to the standard display path — no behavioral change.
</step>

<step name="route">
**Determine next action based on verified counts.**

**Step 0: Resume-incomplete-phase invariant (Route 0)**

Before any current-phase-scoped counting, scan ALL phases for incomplete execution. This catches the case where STATE.md's `current_phase` was advanced past the phase that actually has unfinished work (common after a mid-execution session death from hang, t...

**Skip if `--no-resume` or `--force` is present in `$ARGUMENTS`.**

Scan all phases via the `$ROADMAP` JSON already loaded in `analyze_roadmap`. For each phase entry, compare `plans` length to `summaries` length using the same plans-without-summaries predicate as `determine_next_action` Route 4 (`plans.length > summaries.le...

If `$ROADMAP` is empty or the query failed, surface a warning rather than silently proceeding:

```bash
INCOMPLETE_PHASE=""
if [ -z "$ROADMAP" ]; then
echo "⚠ WARNING: resume-incomplete-phase scan could not run (\$ROADMAP is empty)." >&2
echo "  The incomplete-phase invariant (#160) could not be verified." >&2
echo "  Review project state carefully before continuing." >&2
else
for PHASE_NUM in $(echo "$ROADMAP" | jq -r '.phases[] | (.number // .phase_number)'); do
PHASE_DATA=$(echo "$ROADMAP" | jq --arg n "$PHASE_NUM" '.phases[] | select((.number // .phase_number) == ($n | tonumber))')
PLAN_COUNT=$(echo "$PHASE_DATA" | jq '(.plans // []) | length')
SUMMARY_COUNT=$(echo "$PHASE_DATA" | jq '(.summaries // []) | length')
if [ "${PLAN_COUNT:-0}" -gt "${SUMMARY_COUNT:-0}" ]; then
INCOMPLETE_PHASE="$PHASE_NUM"
break
fi
done
fi
```

**If `INCOMPLETE_PHASE` is non-empty:** emit a one-line resume notice in the routing output and route to ``gsd-serena-bridge execute-phase --format markdown` ${INCOMPLETE_PHASE}` instead of running Step 1's current-phase routing. The progress report (already displayed by the `report` step above) gives the user full project status before this routing decision is shown.

```
---

## ▶ Next Up — Resuming incomplete Phase ${INCOMPLETE_PHASE}

`/clear` then:

``gsd-serena-bridge execute-phase --format markdown` ${INCOMPLETE_PHASE} ${GSD_WS}`

(plans without summaries detected; use --no-resume to skip this check and route by current_phase instead; --force to skip all gates)

---
```

Then exit the route step. Do NOT run Steps 1 through Routes A-F.

**If `INCOMPLETE_PHASE` is empty:** continue to Step 1.

**Step 1: Count plans, summaries, and issues in current phase**

List files in the current phase directory:

```bash
(ls -1 .planning/phases/[current-phase-dir]/*-PLAN.md 2>/dev/null || true) | wc -l
(ls -1 .planning/phases/[current-phase-dir]/*-SUMMARY.md 2>/dev/null || true) | wc -l
(ls -1 .planning/phases/[current-phase-dir]/*-UAT.md 2>/dev/null || true) | wc -l
```

State: "This phase has {X} plans, {Y} summaries."

**Step 1.5: Check for unaddressed UAT gaps**

Check for UAT.md files with status "diagnosed" (has gaps needing fixes).

```bash
# Check for diagnosed UAT with gaps or partial (incomplete) testing
grep -l "status: diagnosed\|status: partial" .planning/phases/[current-phase-dir]/*-UAT.md 2>/dev/null || true
```

Track:
- `uat_with_gaps`: UAT.md files with status "diagnosed" (gaps need fixing)
- `uat_partial`: UAT.md files with status "partial" (incomplete testing)

**Step 1.6: Cross-phase health check**

Scan ALL phases in the current milestone for outstanding verification debt using the CLI (which respects milestone boundaries via `getMilestonePhaseFilter`):

```bash
- Native query translated: `DEBT=$(gsd_run query audit-uat --raw 2>/dev/null)` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
```

Parse JSON for `summary.total_items` and `summary.total_files`.

Track: `outstanding_debt` — `summary.total_items` from the audit.

**If outstanding_debt > 0:** Add a warning section to the progress report output (in the `report` step), placed between "## What's Next" and the route suggestion:

```markdown
## Verification Debt ({N} files across prior phases)

| Phase | File | Issue |
|-------|------|-------|
| {phase} | {filename} | {pending_count} pending, {skipped_count} skipped, {blocked_count} blocked |
| {phase} | {filename} | human_needed — {count} items |

Review: ``gsd-serena-bridge audit-uat --format markdown` ${GSD_WS}` — full cross-phase audit
Resume testing: ``gsd-serena-bridge verify-work --format markdown` {phase} ${GSD_WS}` — retest specific phase
```

This is a WARNING, not a blocker — routing proceeds normally. The debt is visible so the user can make an informed choice.

**Step 1.7: Check verification status for the current phase**

A phase whose verification ended `gaps_found` or `human_needed` is NOT complete, even when every PLAN.md has a matching SUMMARY.md. The count-based status (`roadmap.analyze`) only sees plans/summaries, so without this check such a phase is reported complete...

```bash
PHASE_DIR=".planning/phases/[current-phase-dir]"
- Native query translated: `VERIFICATION=$(gsd_run query verification.status "${PHASE_DIR}" 2>/dev/null)` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
VERIFICATION_STATUS=$(printf '%s' "$VERIFICATION" | jq -r '.status' 2>/dev/null || echo "")
VERIFICATION_NEXT_ACTION=$(printf '%s' "$VERIFICATION" | jq -r '.next_action' 2>/dev/null || echo "")
```

Track: `verification_status` — the `.status` field (`passed | gaps_found | human_needed | missing | unknown`). The query already handles a missing VERIFICATION.md (returns `missing`) and unexpected values, so no per-status file probing is needed. `passed`, ...

**Step 2: Route based on counts**

| Condition | Meaning | Action |
|-----------|---------|--------|
| uat_partial > 0 | UAT testing incomplete | Go to **Route E.2** |
| uat_with_gaps > 0 | UAT gaps need fix plans | Go to **Route E** |
| summaries < plans | Unexecuted plans exist | Go to **Route A** |
| summaries = plans AND plans > 0 AND verification_status = gaps_found | Phase executed; verification found gaps | Go to **Route V.gaps** |
| summaries = plans AND plans > 0 AND verification_status = human_needed | Phase executed; awaiting human verification | Go to **Route V.human** |
| summaries = plans AND plans > 0 | Phase complete (verification passed, missing, or n/a) | Go to Step 3 |
| plans = 0 | Phase not yet planned | Go to **Route B** |

Rows are evaluated top to bottom; the first matching row wins. The two `verification_status` rows must precede the general `summaries = plans` row so a non-`passed` verification is not reported as complete.

---

**Route A: Unexecuted plan exists**

Find the first PLAN.md without matching SUMMARY.md.
Read its `<objective>` section.

```
---

## ▶ Next Up — [${PROJECT_CODE}] ${PROJECT_TITLE}

**{phase}-{plan}: [Plan Name]** — [objective summary from PLAN.md]

`/clear` then:

- Source translation truncated here; use the bridge command output, workflow runbook, installed contracts, or operation plan for continuation.

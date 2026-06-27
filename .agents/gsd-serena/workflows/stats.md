# Bridge Workflow: stats

<!-- generated-by: pnpm gen:bridge-commands -->

## Purpose

This bridge workflow runbook translates the actual GSD-core workflow information and adapts it for Serena bridge operation. Read it when operating `gsd-workflow-stats` in a target project.

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

- Contract ID: `gsd-workflow-stats`
- Status: `planned`
- Source path: `gsd-core/workflows/stats.md`
- Resolved source path: `vendor/reference/gsd-core/gsd-core/workflows/stats.md`
- Mirrored runbook path: `.agents/gsd-serena/workflows/stats.md`

## Translated GSD Workflow

### Native Shim Translation
- Native GSD shim locator omitted: the bridge uses the installed `gsd-serena-bridge` CLI, `bootstrap`, `doctor`, `repair`, resolver packets, and install-managed project surfaces instead of locating `gsd-tools.cjs`.
<purpose>
Display comprehensive project statistics including phases, plans, requirements, git metrics, and timeline.
</purpose>

<required_reading>
Read all files referenced by the invoking prompt's execution_context before starting.
</required_reading>

<process>

<step name="gather_stats">
Gather project statistics:

```bash
- Native query translated: `STATS=$(gsd_run query stats.json)` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
if [[ "$STATS" == @file:* ]]; then STATS=$(cat "${STATS#@file:}"); fi
```

Extract fields from JSON: `milestone_version`, `milestone_name`, `phases`, `phases_completed`, `phases_total`, `total_plans`, `total_summaries`, `percent`, `plan_percent`, `requirements_total`, `requirements_complete`, `git_commits`, `git_first_commit_date`...
</step>

<step name="present_stats">
Present to the user with this format:

```
# 📊 Project Statistics — {milestone_version} {milestone_name}

## Progress
[████████░░] X/Y phases (Z%)

## Plans
X/Y plans complete (Z%)

## Phases
| Phase | Name | Plans | Completed | Status |
|-------|------|-------|-----------|--------|
| ...   | ...  | ...   | ...       | ...    |

## Requirements
✅ X/Y requirements complete

## Git
- **Commits:** N
- **Started:** YYYY-MM-DD
- **Last activity:** YYYY-MM-DD

## Timeline
- **Project age:** N days
```

If no `.planning/` directory exists, inform the user to run ``gsd-serena-bridge new-project --format markdown`` first.
</step>

<step name="mvp_summary">
**MVP phase summary.** Read all phases via `gsd-tools.cjs query roadmap.analyze` (Phase 1's `cmdRoadmapAnalyze` surfaces a `mode` field per phase). Count phases by mode:

```bash
- Native query translated: `ANALYZE=$(gsd_run query roadmap.analyze)` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
if [[ "$ANALYZE" == @file:* ]]; then ANALYZE=$(cat "${ANALYZE#@file:}"); fi
MVP_COUNT=$(echo "$ANALYZE" | jq '[.phases[] | select(.mode == "mvp")] | length')
TOTAL_COUNT=$(echo "$ANALYZE" | jq '.phases | length')
```

Emit a summary line in the stats output:

```
Phases: ${TOTAL_COUNT} total | ${MVP_COUNT} MVP | $((TOTAL_COUNT - MVP_COUNT)) standard
```

If `MVP_COUNT == 0`, the project has no MVP-mode phases — omit the line (no clutter for non-MVP projects).
</step>

</process>

<success_criteria>
- [ ] Statistics gathered from project state
- [ ] Results formatted clearly
- [ ] Displayed to user
</success_criteria>

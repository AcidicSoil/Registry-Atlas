# Bridge Workflow: session-report

<!-- generated-by: pnpm gen:bridge-commands -->

## Purpose

This bridge workflow runbook translates the actual GSD-core workflow information and adapts it for Serena bridge operation. Read it when operating `gsd-workflow-session-report` in a target project.

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

- Contract ID: `gsd-workflow-session-report`
- Status: `planned`
- Source path: `gsd-core/workflows/session-report.md`
- Resolved source path: `vendor/reference/gsd-core/gsd-core/workflows/session-report.md`
- Mirrored runbook path: `.agents/gsd-serena/workflows/session-report.md`

## Translated GSD Workflow

<purpose>
Generate a post-session summary document capturing work performed, outcomes achieved, and estimated resource usage. Writes SESSION_REPORT.md to .planning/reports/ for human review and stakeholder sharing.
</purpose>

<required_reading>
Read all files referenced by the invoking prompt's execution_context before starting.
</required_reading>

<process>

<step name="gather_session_data">
Collect session data from available sources:

1. **STATE.md** — current phase, milestone, progress, blockers, decisions
2. **Git log** — commits made during this session (last 24h or since last report)
3. **Plan/Summary files** — plans executed, summaries written
4. **ROADMAP.md** — milestone context and phase goals

```bash
# Get recent commits (last 24 hours)
git log --oneline --since="24 hours ago" --no-merges 2>/dev/null || echo "No recent commits"

# Count files changed
git diff --stat HEAD~10 HEAD 2>/dev/null | tail -1 || echo "No diff available"
```

Read `.planning/STATE.md` to get:
- Current milestone and phase
- Progress percentage
- Active blockers
- Recent decisions

Read `.planning/ROADMAP.md` to get milestone name and goals.

Check for existing reports:
```bash
ls -la .planning/reports/SESSION_REPORT*.md 2>/dev/null || echo "No previous reports"
```
</step>

<step name="estimate_usage">
Estimate token usage from observable signals:

- Count of tool calls is not directly available, so estimate from git activity and file operations
- Note: This is an **estimate** — exact token counts require API-level instrumentation not available to hooks

Estimation heuristics:
- Each commit ≈ 1 plan cycle (research + plan + execute + verify)
- Each plan file ≈ 2,000-5,000 tokens of agent context
- Each summary file ≈ 1,000-2,000 tokens generated
- Subagent spawns multiply by ~1.5x per agent type used
</step>

<step name="generate_report">
Create the report directory and file:

```bash
mkdir -p .planning/reports
```

Write `.planning/reports/SESSION_REPORT.md` (or `.planning/reports/YYYYMMDD-session-report.md` if previous reports exist):

```markdown
# GSD Session Report

**Generated:** [timestamp]
**Project:** [from PROJECT.md title or directory name]
**Milestone:** [N] — [milestone name from ROADMAP.md]

---

## Session Summary

**Duration:** [estimated from first to last commit timestamp, or "Single session"]
**Phase Progress:** [from STATE.md]
**Plans Executed:** [count of summaries written this session]
**Commits Made:** [count from git log]

## Work Performed

### Phases Touched
[List phases worked on with brief description of what was done]

### Key Outcomes
[Bullet list of concrete deliverables: files created, features implemented, bugs fixed]

### Decisions Made
[From STATE.md decisions table, if any were added this session]

## Files Changed

[Summary of files modified, created, deleted — from git diff stat]

## Blockers & Open Items

[Active blockers from STATE.md]
[Any TODO items created during session]

## Estimated Resource Usage

| Metric | Estimate |
|--------|----------|
| Commits | [N] |
| Files changed | [N] |
| Plans executed | [N] |
| Subagents spawned | [estimated] |

> **Note:** Token and cost estimates require API-level instrumentation.
> These metrics reflect observable session activity only.

---

*Generated by `/gsd-session-report`*
```
</step>

<step name="display_result">
Show the user:

```
## Session Report Generated

📄 `.planning/reports/[filename].md`

### Highlights
- **Commits:** [N]
- **Files changed:** [N]
- **Phase progress:** [X]%
- **Plans executed:** [N]
```

If this is the first report, mention:
```
💡 Run `/gsd-session-report` at the end of each session to build a history of project activity.
```
</step>

</process>

<success_criteria>
- [ ] Session data gathered from STATE.md, git log, and plan files
- [ ] Report written to .planning/reports/
- [ ] Report includes work summary, outcomes, and file changes
- [ ] Filename includes date to prevent overwrites
- [ ] Result summary displayed to user
</success_criteria>

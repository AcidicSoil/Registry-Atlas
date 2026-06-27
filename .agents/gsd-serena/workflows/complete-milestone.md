# Bridge Workflow: complete-milestone

<!-- generated-by: pnpm gen:bridge-commands -->

## Purpose

This bridge workflow runbook translates the actual GSD-core workflow information and adapts it for Serena bridge operation. Read it when operating `gsd-workflow-complete-milestone` in a target project.

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

- Contract ID: `gsd-workflow-complete-milestone`
- Status: `planned`
- Source path: `gsd-core/workflows/complete-milestone.md`
- Resolved source path: `vendor/reference/gsd-core/gsd-core/workflows/complete-milestone.md`
- Mirrored runbook path: `.agents/gsd-serena/workflows/complete-milestone.md`

## Translated GSD Workflow

### Native Shim Translation
- Native GSD shim locator omitted: the bridge uses the installed `gsd-serena-bridge` CLI, `bootstrap`, `doctor`, `repair`, resolver packets, and install-managed project surfaces instead of locating `gsd-tools.cjs`.
<purpose>

Mark a shipped version (v1.0, v1.1, v2.0) as complete. Creates historical record in MILESTONES.md, performs full PROJECT.md evolution review, reorganizes ROADMAP.md with milestone groupings, and tags the release in git.

</purpose>

<required_reading>

1. templates/milestone.md
2. templates/milestone-archive.md
3. `.planning/ROADMAP.md`
4. `.planning/REQUIREMENTS.md`
5. `.planning/PROJECT.md`

</required_reading>

<archival_behavior>

When a milestone completes:

1. Extract full milestone details to `.planning/milestones/v[X.Y]-ROADMAP.md`
2. Archive requirements to `.planning/milestones/v[X.Y]-REQUIREMENTS.md`
3. Update ROADMAP.md — overwrite in place with milestone grouping (preserve Backlog section)
4. Safety commit archive files + updated ROADMAP.md, then `git rm REQUIREMENTS.md` (fresh for next milestone)
5. Perform full PROJECT.md evolution review
6. Offer to create next milestone inline
7. Archive UI artifacts (`*-UI-SPEC.md`, `*-UI-REVIEW.md`) alongside other phase documents
8. Clean up `.planning/ui-reviews/` screenshot files (binary assets, never archived)

**Context Efficiency:** Archives keep ROADMAP.md constant-size and REQUIREMENTS.md milestone-scoped.

**ROADMAP archive** uses `templates/milestone-archive.md` — includes milestone header (status, phases, date), full phase details, milestone summary (decisions, issues, tech debt).

**REQUIREMENTS archive** contains all requirements marked complete with outcomes, traceability table with final status, notes on changed requirements.

</archival_behavior>

<process>

<step name="pre_close_artifact_audit">
Before proceeding with milestone close, run the comprehensive open artifact audit.

```bash
- Native query translated: `gsd_run query audit-open` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
```

If the output contains open items (any section with count > 0):

Display the full audit report to the user.

Then ask:
```
These items are open. Choose an action:
[R] Resolve — stop and fix items, then re-run `gsd-serena-bridge complete-milestone --format markdown`
[A] Acknowledge all — document as deferred and proceed with close
[C] Cancel — exit without closing
```

If user chooses [A] (Acknowledge):
1. Re-run `gsd-tools.cjs query audit-open --json` to get structured data
2. Write acknowledged items to STATE.md under `## Deferred Items` section:
```markdown
## Deferred Items

Items acknowledged and deferred at milestone close on {date}:

| Category | Item | Status |
|----------|------|--------|
| debug | {slug} | {status} |
| quick_task | {slug} | {status} |
...
```
Sanitize all slug and status values via `sanitizeForDisplay()` before writing. Never inject raw file content into STATE.md.
3. Record in MILESTONES.md entry: `Known deferred items at close: {count} (see STATE.md Deferred Items)`
4. Proceed with milestone close.

If output shows all clear (no open items): print `All artifact types clear.` and proceed.

SECURITY: Audit JSON output is structured data from the `audit-open` query handler (same JSON contract as legacy `gsd-tools.cjs audit-open`) — validated and sanitized at source. When writing to STATE.md, item slugs and descriptions are sanitized via `saniti...
</step>

<step name="verify_readiness">

**Use `roadmap analyze` for comprehensive readiness check:**

```bash
- Native query translated: `ROADMAP=$(gsd_run query roadmap.analyze)` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
```

This returns all phases with plan/summary counts and disk status. Use this to verify:
- Which phases belong to this milestone?
- All phases complete (all plans have summaries)? Check `disk_status === 'complete'` for each.
- `progress_percent` should be 100%.

**Requirements completion check (REQUIRED before presenting):**

Parse REQUIREMENTS.md traceability table:
- Count total v1 requirements vs checked-off (`[x]`) requirements
- Identify any non-Complete rows in the traceability table

Present:

```
Milestone: [Name, e.g., "v1.0 MVP"]

Includes:
- Phase 1: Foundation (2/2 plans complete)
- Phase 2: Authentication (2/2 plans complete)
- Phase 3: Core Features (3/3 plans complete)
- Phase 4: Polish (1/1 plan complete)

Total: {phase_count} phases, {total_plans} plans, all complete
Requirements: {N}/{M} v1 requirements checked off
```

**If requirements incomplete** (N < M):

```
⚠ Unchecked Requirements:

- [ ] {REQ-ID}: {description} (Phase {X})
- [ ] {REQ-ID}: {description} (Phase {Y})
```

MUST present 3 options:
1. **Proceed anyway** — mark milestone complete with known gaps
2. **Run audit first** — ``gsd-serena-bridge audit-milestone --format markdown`` to assess gap severity
3. **Abort** — return to development

If user selects "Proceed anyway": note incomplete requirements in MILESTONES.md under `### Known Gaps` with REQ-IDs and descriptions.

<config-check>

```bash
cat .planning/config.json 2>/dev/null || true
```

</config-check>

<if mode="yolo">

```
⚡ Auto-approved: Milestone scope verification
[Show breakdown summary without prompting]
Proceeding to stats gathering...
```

Proceed to gather_stats.

</if>

<if mode="interactive" OR="custom with gates.confirm_milestone_scope true">

```
Ready to mark this milestone as shipped?
(yes / wait / adjust scope)
```

Wait for confirmation.
- "adjust scope": Ask which phases to include.
- "wait": Stop, user returns when ready.

</if>

</step>

<step name="gather_stats">

Calculate milestone statistics:

```bash
git log --oneline --grep="feat(" | head -20
git diff --stat FIRST_COMMIT..LAST_COMMIT | tail -1
find . -name "*.swift" -o -name "*.ts" -o -name "*.py" | xargs wc -l 2>/dev/null || true
git log --format="%ai" FIRST_COMMIT | tail -1
git log --format="%ai" LAST_COMMIT | head -1
```

Present:

```
Milestone Stats:
- Phases: [X-Y]
- Plans: [Z] total
- Tasks: [N] total (from phase summaries)
- Files modified: [M]
- Lines of code: [LOC] [language]
- Timeline: [Days] days ([Start] → [End])
- Git range: feat(XX-XX) → feat(YY-YY)
```

</step>

<step name="extract_accomplishments">

Extract one-liners from SUMMARY.md files using summary-extract:

```bash
# For each phase in milestone, extract one-liner
for summary in .planning/phases/*-*/*-SUMMARY.md; do
[ -e "$summary" ] || continue
- Native query translated: `gsd_run query summary-extract "$summary" --fields one_liner --pick one_liner` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
done
```

Extract 4-6 key accomplishments. Present:

```
Key accomplishments for this milestone:
1. [Achievement from phase 1]
2. [Achievement from phase 2]
3. [Achievement from phase 3]
4. [Achievement from phase 4]
5. [Achievement from phase 5]
```

</step>

<step name="create_milestone_entry">

**Note:** MILESTONES.md entry is now created automatically by `gsd-tools.cjs query milestone.complete` in the archive_milestone step. The entry includes version, date, phase/plan/task counts, and accomplishments extracted from SUMMARY.md files.

If additional details are needed (e.g., user-provided "Delivered" summary, git range, LOC stats), add them manually after the CLI creates the base entry.

</step>

<step name="evolve_project_full_review">

Full PROJECT.md evolution review at milestone completion.

Read all phase summaries:

```bash
cat .planning/phases/*-*/*-SUMMARY.md
```

**Full review checklist:**

1. **"What This Is" accuracy:**
- Compare current description to what was built
- Update if product has meaningfully changed

2. **Core Value check:**
- Still the right priority? Did shipping reveal a different core value?
- Update if the ONE thing has shifted

3. **Business Context check (only if the section is present):**
- Skip entirely if PROJECT.md has no `## Business Context` section
- Customer, revenue model, and success metric still accurate after shipping?
- Update any field that drifted; refresh the linked strategy doc reference if it moved

4. **Requirements audit:**

**Validated section:**
- All Active requirements shipped this milestone → Move to Validated
- Format: `- ✓ [Requirement] — v[X.Y]`

**Active section:**
- Remove requirements moved to Validated
- Add new requirements for next milestone
- Keep unaddressed requirements

**Out of Scope audit:**
- Review each item — reasoning still valid?
- Remove irrelevant items
- Add requirements invalidated during milestone

5. **Context update:**
- Current codebase state (LOC, tech stack)
- User feedback themes (if any)
- Known issues or technical debt

6. **Key Decisions audit:**
- Extract all decisions from milestone phase summaries
- Add to Key Decisions table with outcomes
- Mark ✓ Good, ⚠️ Revisit, or — Pending

7. **Constraints check:**
- Any constraints changed during development? Update as needed

Update PROJECT.md inline. Update "Last updated" footer:

```markdown
---
*Last updated: [date] after v[X.Y] milestone*
```

**Example full evolution (v1.0 → v1.1 prep):**

Before:

```markdown
## What This Is

A real-time collaborative whiteboard for remote teams.

## Core Value

Real-time sync that feels instant.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Canvas drawing tools
- [ ] Real-time sync < 500ms
- [ ] User authentication
- [ ] Export to PNG

### Out of Scope

- Mobile app — web-first approach

- Source translation truncated here; use the bridge command output, workflow runbook, installed contracts, or operation plan for continuation.

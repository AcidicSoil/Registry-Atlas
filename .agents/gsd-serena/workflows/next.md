# Bridge Workflow: next

<!-- generated-by: pnpm gen:bridge-commands -->

## Purpose

This bridge workflow runbook translates the actual GSD-core workflow information and adapts it for Serena bridge operation. Read it when operating `gsd-workflow-next` in a target project.

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

- Contract ID: `gsd-workflow-next`
- Status: `planned`
- Source path: `gsd-core/workflows/next.md`
- Resolved source path: `vendor/reference/gsd-core/gsd-core/workflows/next.md`
- Mirrored runbook path: `.agents/gsd-serena/workflows/next.md`

## Translated GSD Workflow

### Native Shim Translation
- Native GSD shim locator omitted: the bridge uses the installed `gsd-serena-bridge` CLI, `bootstrap`, `doctor`, `repair`, resolver packets, and install-managed project surfaces instead of locating `gsd-tools.cjs`.
<purpose>
Detect current project state and automatically advance to the next logical GSD workflow step.
Reads project state to determine: discuss → plan → execute → verify → complete progression.
</purpose>

<required_reading>
Read all files referenced by the invoking prompt's execution_context before starting.
</required_reading>

<process>

<step name="detect_state">
Read project state to determine current position:

```bash
# Get state snapshot
- Native query translated: `gsd_run query state.json 2>/dev/null || echo "{}"` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
```

Also read:
- `.planning/STATE.md` — current phase, progress, plan counts
- `.planning/ROADMAP.md` — milestone structure and phase list

Extract:
- `current_phase` — which phase is active
- `plan_of` / `plans_total` — plan execution progress
- `progress` — overall percentage
- `status` — active, paused, etc.

If no `.planning/` directory exists:
```
No GSD project detected. Run ``gsd-serena-bridge new-project --format markdown`` to get started.
```
Exit.
</step>

<step name="safety_gates">
Run hard-stop checks before routing. Exit on first hit unless `--force` was passed.

If `--force` flag was passed, skip all gates, Route 0, and the prior-phase completeness prompt.
Print a one-line warning: `⚠ --force: skipping safety gates`
Then proceed directly to `determine_next_action`. (Route 0 and `prior_phase_completeness` are NOT reached under `--force`.)

**Gate 1: Unresolved checkpoint**
Check if `.planning/.continue-here.md` exists:
```bash
[ -f .planning/.continue-here.md ]
```
If found:
```
⛔ Hard stop: Unresolved checkpoint

`.planning/.continue-here.md` exists — a previous session left
unfinished work that needs manual review before advancing.

Read the file, resolve the issue, then delete it to continue.
Use `--force` to bypass this check.
```
Exit (do not route).

**Gate 2: Error state**
Check if STATE.md contains `status: error` or `status: failed`:
If found:
```
⛔ Hard stop: Project in error state

STATE.md shows status: {status}. Resolve the error before advancing.
Run ``gsd-serena-bridge health --format markdown`` to diagnose, or manually fix STATE.md.
Use `--force` to bypass this check.
```
Exit.

**Gate 3: Unchecked verification**
Check if the current phase has a VERIFICATION.md with any `FAIL` items that don't have overrides:
If found:
```
⛔ Hard stop: Unchecked verification failures

VERIFICATION.md for phase {N} has {count} unresolved FAIL items.
Address the failures or add overrides before advancing to the next phase.
Use `--force` to bypass this check.
```
Exit.

After all three hard-stop gates pass, continue to `resume_incomplete_phase`.
</step>

<step name="resume_incomplete_phase">
**Hard invariant: any phase with PLAN.md files lacking matching SUMMARY.md files must be completed before ``gsd-serena-bridge progress --format markdown` --next` routes to any forward action.**

This catches the common failure mode where a session died mid-execution (hang, token exhaustion, API connection drop) and STATE.md's `current_phase` got advanced past the phase that actually has unfinished work. Without this gate, ``gsd-serena-bridge progress --format markdown` --next` would route by `current_phase` and silently skip the partially-executed phase.

**Skip if `--no-resume` was passed** (fall through to `prior_phase_completeness`). (`--force` already bypassed all gates and Route 0 at `safety_gates` — it never reaches this step.)

**Why Route 0 runs here (after Gates 1-3, before the prior-phase defer prompt):** This step is a hard invariant independent of `current_phase`'s value — it must run before any routing rule that reads `current_phase`. Gates 1-3 are cheap repo/state validity ...

- Native query translated: `Scan ALL phases in ROADMAP order (lowest-numbered to highest) for incomplete-execution state. Use 'gsd_run query roadmap.analyze' to get the phase list, then for each phase number 'N' query 'gsd_run query find-phase <N>' JSON and inspect its 'plans' and 'summaries' arrays. A phase is **incomplete-execution** when 'plans.length > summaries.length' (at least one PLAN.md has no matching SUMMARY.md).` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.

Stop at the first such phase. Record its phase number as `INCOMPLETE_PHASE`. This is the lowest-numbered phase that needs continued execution.

Illustrative bash:

```bash
INCOMPLETE_PHASE=""
- Native query translated: `ROADMAP_JSON=$(gsd_run query roadmap.analyze)` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
if [ $? -ne 0 ] || [ -z "$ROADMAP_JSON" ]; then
echo "⚠ WARNING: resume-incomplete-phase scan could not run (roadmap.analyze failed)." >&2
echo "  The incomplete-phase invariant (#160) could not be verified." >&2
echo "  Proceeding to prior-phase completeness check — review project state carefully." >&2
# Fall through to prior_phase_completeness rather than silently skipping
else
for PHASE_NUM in $(echo "$ROADMAP_JSON" | jq -r '.phases[] | (.number // .phase_number // empty)'); do
- Native query translated: `PHASE_JSON=$(gsd_run query find-phase "$PHASE_NUM")` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
if [ $? -ne 0 ] || [ -z "$PHASE_JSON" ]; then
echo "⚠ WARNING: Could not query phase $PHASE_NUM — skipping in resume scan." >&2
continue
fi
PLAN_COUNT=$(echo "$PHASE_JSON" | jq '(.plans // []) | length')
SUMMARY_COUNT=$(echo "$PHASE_JSON" | jq '(.summaries // []) | length')
if [ "${PLAN_COUNT:-0}" -gt "${SUMMARY_COUNT:-0}" ]; then
INCOMPLETE_PHASE="$PHASE_NUM"
break
fi
done
fi
```

**If `INCOMPLETE_PHASE` is non-empty:** route to ``gsd-serena-bridge execute-phase --format markdown` $INCOMPLETE_PHASE` and exit. Display a one-line notice before invoking:

```
▶ Resuming incomplete Phase ${INCOMPLETE_PHASE} (plans without summaries detected)
`gsd-serena-bridge execute-phase --format markdown` ${INCOMPLETE_PHASE}
(use --no-resume to skip this check and defer via the prior-phase prompt)
```

Then invoke via SlashCommand. Do not continue to subsequent steps.

**If `INCOMPLETE_PHASE` is empty:** continue to `prior_phase_completeness`.
</step>

<step name="prior_phase_completeness">
**Prior-phase completeness scan (runs when `--no-resume` was passed and Route 0 was skipped, or when Route 0 found no incomplete-execution phases in the default case). NOT reached under `--force` — that flag jumps directly to `determine_next_action` at `saf...

**Prior-phase completeness scan:**
- Native query translated: `Scan all phases that precede the current phase in ROADMAP.md order for incomplete work. For each prior phase number 'N', use 'gsd_run query find-phase <N>' JSON (plans, summaries, incomplete_plans, etc.) to inspect that phase.` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.

Detect three categories of incomplete work:
1. **Plans without summaries** — a PLAN.md exists in a prior phase directory but no matching SUMMARY.md exists (execution started but not completed).
2. **Verification failures not overridden** — a prior phase has a VERIFICATION.md with `FAIL` items that have no override annotation.
3. **CONTEXT.md without plans** — a prior phase directory has a CONTEXT.md but no PLAN.md files (discussion happened, planning never ran).

If no incomplete prior work is found, continue to `determine_next_action` silently with no interruption.

If incomplete prior work is found, show a structured completeness report:
```
⚠ Prior phase has incomplete work

Phase {N} — "{name}" has unresolved items:
• Plan {N}-{M} ({slug}): executed but no SUMMARY.md
[... additional items ...]

Advancing before resolving these may cause:
• Verification gaps — future phase verification won't have visibility into what prior phases shipped
• Context loss — plans that ran without summaries leave no record for future agents

Options:
[C] Continue and defer these items to backlog
[S] Stop and resolve manually (recommended)
[F] Force advance without recording deferral

Choice [S]:
```

**If the user chooses "Stop" (S or Enter/default):** Exit without routing.

**If the user chooses "Continue and defer" (C):**
1. For each incomplete item, create a backlog entry in `ROADMAP.md` under `## Backlog` using the existing `999.x` numbering scheme:
```markdown
### Phase 999.{N}: Follow-up — Phase {src} incomplete plans (BACKLOG)

**Goal:** Resolve plans that ran without producing summaries during Phase {src} execution
**Source phase:** {src}
**Deferred at:** {date} during `gsd-serena-bridge progress --format markdown` --next advancement to Phase {dest}
**Plans:**
- [ ] {N}-{M}: {slug} (ran, no SUMMARY.md)
```
2. Commit the deferral record:
```bash
- Native commit helper translated: do not auto-commit; only run git commit when the user explicitly asks, after reporting files and validation.
```
3. Continue routing to `determine_next_action` immediately — no second prompt.

**If the user chooses "Force" (F):** Continue to `determine_next_action` without recording deferral.
</step>

<step name="spike_sketch_notice">
Check for pending spike/sketch work and surface a notice (does not change routing):

```bash
# Check for pending spikes (verdict: PENDING in any README)
PENDING_SPIKES=$(grep -rl 'verdict: PENDING' .planning/spikes/*/README.md 2>/dev/null | wc -l | tr -d ' ')

# Check for pending sketches (winner: null in any README)
PENDING_SKETCHES=$(grep -rl 'winner: null' .planning/sketches/*/README.md 2>/dev/null | wc -l | tr -d ' ')
```

If either count is > 0, display before routing:
```
⚠ Pending exploratory work:
{PENDING_SPIKES} spike(s) with unresolved verdicts in .planning/spikes/
{PENDING_SKETCHES} sketch(es) without a winning variant in .planning/sketches/

Resume with ``gsd-serena-bridge spike --format markdown`` or ``gsd-serena-bridge sketch --format markdown``, or continue with phase work below.
```

Only show lines for non-zero counts. If both are 0, skip this notice entirely.
</step>

<step name="determine_next_action">
Apply routing rules based on state:

**Route 1: No phases exist yet → discuss**
If ROADMAP has phases but no phase directories exist on disk:
→ Next action: ``gsd-serena-bridge discuss-phase --format markdown` <first-phase>`

**Route 2: Phase exists but has no CONTEXT.md or RESEARCH.md → discuss**
If the current phase directory exists but has neither CONTEXT.md nor RESEARCH.md:
→ Next action: ``gsd-serena-bridge discuss-phase --format markdown` <current-phase>`

**Route 3: Phase has context but no plans → plan**
If the current phase has CONTEXT.md (or RESEARCH.md) but no PLAN.md files:
→ Next action: ``gsd-serena-bridge plan-phase --format markdown` <current-phase>` (or ``gsd-serena-bridge plan-review-convergence --format markdown` <current-phase>` when `PLAN_STRATEGY=converge`)

**Route 4: Phase has plans but incomplete summaries → execute**
If plans exist but not all have matching summaries:
→ Next action: ``gsd-serena-bridge execute-phase --format markdown` <current-phase>`

**Route 5: All plans have summaries → verify and complete**
If all plans in the current phase have summaries:
→ Next action: ``gsd-serena-bridge verify-work --format markdown``

**Route 6: Phase complete, next phase exists → advance**
If the current phase is complete and the next phase exists in ROADMAP:
→ Next action: ``gsd-serena-bridge discuss-phase --format markdown` <next-phase>`

**Route 7: All phases complete → complete milestone**
If all phases are complete:
→ Next action: ``gsd-serena-bridge complete-milestone --format markdown``

**Route 8: Paused → resume**
If STATE.md shows paused_at:
→ Next action: ``gsd-serena-bridge resume-work --format markdown``
</step>

<step name="show_and_execute">
Parse the arguments passed to this workflow to detect the plan strategy and build convergence pass-through args:

```bash
PLAN_STRATEGY="local"
if echo "$ARGUMENTS" | grep -qE '(^|[[:space:]])\-\-(converge|cross-ai)([[:space:]]|$)'; then
PLAN_STRATEGY="converge"
fi

CONVERGENCE_ARGS=""
for REVIEW_FLAG in --codex --gemini --claude --opencode --ollama --lm-studio --llama-cpp --all --text; do
if echo "$ARGUMENTS" | grep -qE "(^|[[:space:]])${REVIEW_FLAG}([[:space:]]|$)"; then
CONVERGENCE_ARGS="${CONVERGENCE_ARGS} ${REVIEW_FLAG}"
fi
done

MAX_CYCLES_ARG=""
if echo "$ARGUMENTS" | grep -qE '\-\-max-cycles\s+[0-9]+'; then
MAX_CYCLES_ARG=$(echo "$ARGUMENTS" | grep -oE '\-\-max-cycles\s+[0-9]+' | awk '{print $2}')
CONVERGENCE_ARGS="${CONVERGENCE_ARGS} --max-cycles ${MAX_CYCLES_ARG}"
fi
```

If `PLAN_STRATEGY` is `converge`, fail fast unless the convergence feature gate is enabled:

```bash
if [ "$PLAN_STRATEGY" = "converge" ]; then
- Native query translated: `CONVERGENCE_ENABLED=$(gsd_run query config-get workflow.plan_review_convergence 2>/dev/null || echo "false")` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
if [ "$CONVERGENCE_ENABLED" != "true" ]; then

- Source translation truncated here; use the bridge command output, workflow runbook, installed contracts, or operation plan for continuation.

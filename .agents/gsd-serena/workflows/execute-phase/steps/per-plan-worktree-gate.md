# Bridge Workflow: execute-phase-steps-per-plan-worktree-gate

<!-- generated-by: pnpm gen:bridge-commands -->

## Purpose

This bridge workflow runbook translates the actual GSD-core workflow information and adapts it for Serena bridge operation. Read it when operating `gsd-workflow-execute-phase-steps-per-plan-worktree-gate` in a target project.

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

- Contract ID: `gsd-workflow-execute-phase-steps-per-plan-worktree-gate`
- Status: `planned`
- Source path: `gsd-core/workflows/execute-phase/steps/per-plan-worktree-gate.md`
- Resolved source path: `vendor/reference/gsd-core/gsd-core/workflows/execute-phase/steps/per-plan-worktree-gate.md`
- Mirrored runbook path: `.agents/gsd-serena/workflows/execute-phase/steps/per-plan-worktree-gate.md`

## Translated GSD Workflow

# Per-plan worktree decision (#2772)

- Native agent dispatch translated: `Run this for **each plan in the current wave** before its 'Agent()' dispatch. The output 'USE_WORKTREES_FOR_PLAN' gates the dispatch branch (worktree mode vs sequential mode) for that plan only — other plans in the same wave can still take the worktree path.` -> use Serena role workflow / generated role skill / sequential role pass with handoff.

`SUBMODULE_PATHS` is computed once in the `initialize` step (parsed from `.gitmodules`).

`PLAN_FILES` is the whitespace-separated list of paths the plan declared it will touch, extracted from the `phase-plan-index` JSON loaded in `discover_and_group_plans`:

```bash
# plan_json is the JSON object for this plan from PLAN_INDEX.plans[]
# files_modified is an array of strings (repo-relative paths or globs)
PLAN_FILES=$(jq -r '.files_modified // [] | join(" ")' <<<"$plan_json")
plan_id=$(jq -r '.id' <<<"$plan_json")
```

Then run the per-plan gate:

```bash
USE_WORKTREES_FOR_PLAN="$USE_WORKTREES"

if [ -n "$SUBMODULE_PATHS" ] && [ "$USE_WORKTREES_FOR_PLAN" != "false" ]; then
if [ -z "$PLAN_FILES" ]; then
# Fallback: planned paths are unknown/unparseable — fall back to the safe
# behavior (disable worktree isolation for this plan) and log why.
echo "[worktree] Plan ${plan_id}: files_modified missing/unparseable — disabling worktree isolation as a safety fallback (submodule project)"
USE_WORKTREES_FOR_PLAN=false
else
# Compute intersection with glob-safe normalization. Both sides are
# normalized (strip leading "./", strip trailing "/") and matched
# bidirectionally so a globby planned path like "vendor/**/*.c" still
# matches submodule "vendor/foo", and "./vendor/foo/bar.c" matches
# submodule "vendor/foo".
INTERSECT=""
set -f  # disable globbing while iterating literal patterns
for sm_raw in $SUBMODULE_PATHS; do
# Normalize submodule path: strip ./ prefix and trailing /
sm="${sm_raw#./}"
sm="${sm%/}"
[ -z "$sm" ] && continue
for pf_raw in $PLAN_FILES; do
# Normalize planned path the same way
pf="${pf_raw#./}"
pf="${pf%/}"
[ -z "$pf" ] && continue
matched=0
# Direction 1: planned path is the submodule or lies inside it
case "$pf" in
"$sm"|"$sm"/*) matched=1 ;;
esac
# Direction 2: submodule lies inside the planned path (e.g. plan
# declares "vendor" or a glob expanding to a directory containing
# the submodule).
if [ "$matched" -eq 0 ]; then
case "$sm" in
"$pf"|"$pf"/*) matched=1 ;;
esac
fi
# Direction 3: planned path uses a glob — strip glob wildcards
# and check whether the resulting prefix overlaps the submodule
# path in either direction.
if [ "$matched" -eq 0 ]; then
case "$pf" in
*'*'*|*'?'*|*'['*)
# Take the literal prefix before the first glob metachar.
prefix="${pf%%[*?[]*}"
prefix="${prefix%/}"
if [ -n "$prefix" ]; then
case "$sm" in
"$prefix"|"$prefix"/*) matched=1 ;;
esac
if [ "$matched" -eq 0 ]; then
case "$prefix" in
"$sm"|"$sm"/*) matched=1 ;;
esac
fi
fi
;;
esac
fi
if [ "$matched" -eq 1 ]; then
INTERSECT="$INTERSECT $pf_raw"
fi
done
done
set +f
if [ -n "$INTERSECT" ]; then
echo "[worktree] Plan ${plan_id}: planned paths intersect submodule paths (${INTERSECT# }) — disabling worktree isolation for this plan"
USE_WORKTREES_FOR_PLAN=false
fi
fi
fi
```

After running this for the plan, the dispatch branches in `execute_waves` step 3 MUST gate on `USE_WORKTREES_FOR_PLAN` for the current plan, not on the project-level `USE_WORKTREES`. Track which plans in this wave actually used worktrees (append `plan_id` t...

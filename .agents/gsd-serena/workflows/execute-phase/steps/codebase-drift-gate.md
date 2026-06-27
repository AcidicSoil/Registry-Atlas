# Bridge Workflow: execute-phase-steps-codebase-drift-gate

<!-- generated-by: pnpm gen:bridge-commands -->

## Purpose

This bridge workflow runbook translates the actual GSD-core workflow information and adapts it for Serena bridge operation. Read it when operating `gsd-workflow-execute-phase-steps-codebase-drift-gate` in a target project.

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

- Contract ID: `gsd-workflow-execute-phase-steps-codebase-drift-gate`
- Status: `planned`
- Source path: `gsd-core/workflows/execute-phase/steps/codebase-drift-gate.md`
- Resolved source path: `vendor/reference/gsd-core/gsd-core/workflows/execute-phase/steps/codebase-drift-gate.md`
- Mirrored runbook path: `.agents/gsd-serena/workflows/execute-phase/steps/codebase-drift-gate.md`

## Translated GSD Workflow

### Native Shim Translation
- Native GSD shim locator omitted: the bridge uses the installed `gsd-serena-bridge` CLI, `bootstrap`, `doctor`, `repair`, resolver packets, and install-managed project surfaces instead of locating `gsd-tools.cjs`.
# Step: codebase_drift_gate

Post-execution structural drift detection (#2003). Runs after the last wave
commits, before verification. **Non-blocking by contract:** any internal
error here MUST fall through and continue to `verify_phase_goal`. The phase
is never failed by this gate.

```bash
# Resolve gsd-tools through the runtime shim launcher, NOT the bare PATH binary. On a
# shim-only install (gsd-tools.cjs present, `gsd-tools` not on PATH) the bare call exits
# 127, `2>/dev/null` hides it, and this non-blocking gate would silently skip drift
# detection forever (#619). The canonical launcher preamble is defined once here — the
# always-run drift check, the file's first launcher block — and the conditional auto-remap
# block below reuses the launcher function from this shared shell scope (the single-preamble
# pattern established by discuss-phase #614, enforced by tests/runtime-launcher-parity.test.cjs).
# Non-blocking is preserved: an internal drift-command failure still falls through to the
# skip JSON via the `|| echo` below.
DRIFT=$(gsd_run verify codebase-drift 2>/dev/null || echo '{"skipped":true,"reason":"sdk-failed"}')
```

Parse JSON for: `skipped`, `reason`, `action_required`, `directive`,
`spawn_mapper`, `affected_paths`, `elements`, `threshold`, `action`,
`last_mapped_commit`, `message`.

**If `skipped` is true (no STRUCTURE.md, missing git, or any internal error):**
Log one line — `Codebase drift check skipped: {reason}` — and continue to
`verify_phase_goal`. Do NOT prompt the user. Do NOT block.

**If `action_required` is false:** Continue silently to `verify_phase_goal`.

**If `action_required` is true AND `directive` is `warn`:**
Print the `message` field verbatim. The format is:

```text
Codebase drift detected: {N} structural element(s) since last mapping.

New directories:
- {path}
New barrel exports:
- {path}
New migrations:
- {path}
New route modules:
- {path}

Run `gsd-serena-bridge map-codebase --format markdown` --paths {affected_paths} to refresh planning context.
```

Then continue to `verify_phase_goal`. Do NOT block. Do NOT spawn anything.

**If `action_required` is true AND `directive` is `auto-remap`:**

First load the mapper agent's skill bundle (the executor's `AGENT_SKILLS`
from step `init_context` is for `gsd-executor`, not the mapper):

```bash
# gsd_run is defined by the canonical preamble in the drift-check block above and reused
# here via the workflow's shared shell scope — defining it once keeps the file compliant
# with the single-canonical-preamble parity invariant (#619). This block only runs on the
# `auto-remap` directive, which is always reached after the drift check above has run.
- Native query translated: `AGENT_SKILLS_MAPPER=$(gsd_run query agent-skills gsd-codebase-mapper)` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
```

Then spawn `gsd-codebase-mapper` agents with the `--paths` hint (runs in a subagent — no output until it returns, ~1–5 min; expected, not a freeze):

```text
- Native agent dispatch translated: `Agent(` -> use Serena role workflow / generated role skill / sequential role pass with handoff.
subagent_type="gsd-codebase-mapper",
description="Incremental codebase remap (drift)",
prompt="Focus: arch
Today's date: {date}
--paths {affected_paths joined by comma}

Refresh STRUCTURE.md and ARCHITECTURE.md scoped to the listed paths only.
Stamp last_mapped_commit in each document's frontmatter.
${AGENT_SKILLS_MAPPER}"
)
```

- Native agent dispatch translated: `> **ORCHESTRATOR RULE — CODEX RUNTIME**: After calling Agent() above, stop working on this task immediately. Do not read more files, edit code, or run tests related to this task while the subagent is active. Wait for the subagent to return its result. This prevents duplicate work, conflicting edits, and wasted context. Only resume when the subagent result is available.` -> use Serena role workflow / generated role skill / sequential role pass with handoff.

If the spawn fails or the agent reports an error: log `Codebase drift
auto-remap failed: {reason}` and continue to `verify_phase_goal`. The phase
is NOT failed by a remap failure.

If the remap succeeds: log `Codebase drift auto-remap completed for paths:
{affected_paths}` and continue to `verify_phase_goal`.

The two relevant config keys (continue on error / failure if either is invalid):
- `workflow.drift_threshold` (integer, default 3) — minimum drift elements before action
- `workflow.drift_action` — `warn` (default) or `auto-remap`

This step is fully non-blocking — it never fails the phase, and any
exception path returns control to `verify_phase_goal`.

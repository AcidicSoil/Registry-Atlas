# Bridge Workflow: execute-phase-steps-worktree-recovery-policy

<!-- generated-by: pnpm gen:bridge-commands -->

## Purpose

This bridge workflow runbook translates the actual GSD-core workflow information and adapts it for Serena bridge operation. Read it when operating `gsd-workflow-execute-phase-steps-worktree-recovery-policy` in a target project.

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

- Contract ID: `gsd-workflow-execute-phase-steps-worktree-recovery-policy`
- Status: `planned`
- Source path: `gsd-core/workflows/execute-phase/steps/worktree-recovery-policy.md`
- Resolved source path: `vendor/reference/gsd-core/gsd-core/workflows/execute-phase/steps/worktree-recovery-policy.md`
- Mirrored runbook path: `.agents/gsd-serena/workflows/execute-phase/steps/worktree-recovery-policy.md`

## Translated GSD Workflow

# Worktree Recovery Policy

## ORCHESTRATOR FAIL-CLOSED RULE (#48)

> **ORCHESTRATOR FAIL-CLOSED RULE (#48):** `worktree_branch_check` is verify-only — an executor that hits a base/HEAD-namespace mismatch prints `FATAL:` and exits **42** instead of self-recovering. If any executor result reports a `FATAL:`/`exit 42` (or its...

## ISOLATED-RUN RECOVERY — FAIL SAFE (#1292)

> **ISOLATED-RUN RECOVERY — FAIL SAFE (#1292):** When an isolated (worktree) run is *rejected* — the user declines to merge it, the orchestrator surfaces recovery guidance for a blocked/halted plan, or the run over-reached the requested scope — the worktree...

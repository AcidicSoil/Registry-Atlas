# Bridge Workflow: discuss-phase-modes-power

<!-- generated-by: pnpm gen:bridge-commands -->

## Purpose

This bridge workflow runbook translates the actual GSD-core workflow information and adapts it for Serena bridge operation. Read it when operating `gsd-workflow-discuss-phase-modes-power` in a target project.

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

- Contract ID: `gsd-workflow-discuss-phase-modes-power`
- Status: `planned`
- Source path: `gsd-core/workflows/discuss-phase/modes/power.md`
- Resolved source path: `vendor/reference/gsd-core/gsd-core/workflows/discuss-phase/modes/power.md`
- Mirrored runbook path: `.agents/gsd-serena/workflows/discuss-phase/modes/power.md`

## Translated GSD Workflow

# --power mode — bulk question generation, async answering

> **Lazy-loaded.** Read this file from `workflows/discuss-phase.md` when
> `--power` is present in `$ARGUMENTS`. The full step-by-step instructions
> live in the existing `discuss-phase-power.md` workflow file (kept stable
> at its original path so installed `@`-references continue to resolve).

## Dispatch

```
Read @~/.claude/gsd-core/workflows/discuss-phase-power.md
```

Execute it end-to-end. Do not continue with the standard interactive steps.

## Summary of flow

The power user mode generates ALL questions upfront into machine-readable
and human-friendly files, then waits for the user to answer at their own
pace before processing all answers in a single pass.

1. Run the same phase analysis (gray area identification) as standard mode
2. Write all questions to
`{phase_dir}/{padded_phase}-QUESTIONS.json` and
`{phase_dir}/{padded_phase}-QUESTIONS.html`
3. Notify user with file paths and wait for a "refresh" or "finalize"
command
4. On "refresh": read the JSON, process answered questions, update stats
and HTML
5. On "finalize": read all answers from JSON, generate CONTEXT.md in the
standard format

## When to use

Large phases with many gray areas, or when users prefer to answer
questions offline / asynchronously rather than interactively in the chat
session.

## Combination rules

- `--power --auto`: power wins. Power mode is incompatible with
autonomous selection — its purpose is offline answering.
- `--power --chain`: after the power-mode finalize step writes
CONTEXT.md, the chain auto-advance still applies (Read `chain.md`).

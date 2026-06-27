# Bridge Workflow: discuss-phase-modes-text

<!-- generated-by: pnpm gen:bridge-commands -->

## Purpose

This bridge workflow runbook translates the actual GSD-core workflow information and adapts it for Serena bridge operation. Read it when operating `gsd-workflow-discuss-phase-modes-text` in a target project.

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

- Contract ID: `gsd-workflow-discuss-phase-modes-text`
- Status: `planned`
- Source path: `gsd-core/workflows/discuss-phase/modes/text.md`
- Resolved source path: `vendor/reference/gsd-core/gsd-core/workflows/discuss-phase/modes/text.md`
- Mirrored runbook path: `.agents/gsd-serena/workflows/discuss-phase/modes/text.md`

## Translated GSD Workflow

# --text mode — plain-text overlay (no AskUserQuestion)

> **Lazy-loaded overlay.** Read this file from `workflows/discuss-phase.md`
> when `--text` is present in `$ARGUMENTS`, OR when
> `workflow.text_mode: true` is set in config (e.g., per-project default).

## Effect

When text mode is active, **do not use AskUserQuestion at all**. Instead,
present every question as a plain-text numbered list and ask the user to
type their choice number. Free-text input maps to the "Other" branch of
the equivalent AskUserQuestion call.

This is required for Claude Code remote sessions (`/rc` mode) where the
Claude App cannot forward TUI menu selections back to the host.

## Activation

- Per-session: pass `--text` flag to any command (e.g.,
``gsd-serena-bridge discuss-phase --format markdown` --text`)
- Per-project: `gsd-tools.cjs query config-set workflow.text_mode true`

Text mode applies to ALL workflows in the session, not just discuss-phase.

## Question rendering

Replace this:
```text
AskUserQuestion(
header="Layout",
question="How should posts be displayed?",
options=["Cards", "List", "Timeline"]
)
```

With this:
```text
Layout — How should posts be displayed?
1. Cards
2. List
3. Timeline
4. Other (type freeform)

Reply with a number, or describe your preference.
```

Wait for the user's reply at the normal prompt. Parse:
- Numeric reply → mapped to that option
- Free text → treated as "Other" — reflect it back, confirm, then proceed

## Empty-answer handling

The same answer-validation rules from the parent file apply: empty
responses trigger one retry, then a clarifying question. Do not proceed
with empty input.

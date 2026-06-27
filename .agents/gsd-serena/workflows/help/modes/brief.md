# Bridge Workflow: help-modes-brief

<!-- generated-by: pnpm gen:bridge-commands -->

## Purpose

This bridge workflow runbook translates the actual GSD-core workflow information and adapts it for Serena bridge operation. Read it when operating `gsd-workflow-help-modes-brief` in a target project.

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

- Contract ID: `gsd-workflow-help-modes-brief`
- Status: `planned`
- Source path: `gsd-core/workflows/help/modes/brief.md`
- Resolved source path: `vendor/reference/gsd-core/gsd-core/workflows/help/modes/brief.md`
- Mirrored runbook path: `.agents/gsd-serena/workflows/help/modes/brief.md`

## Translated GSD Workflow

<purpose>
One-liner refresher for returning users. Output ONLY the `<reference>` content below. No additions.
</purpose>

<reference>
**GSD — top commands**

```text
`gsd-serena-bridge new-project --format markdown`           Initialize a project (greenfield)
`gsd-serena-bridge map-codebase --format markdown`          Map an existing codebase (brownfield)
`gsd-serena-bridge plan-phase --format markdown` <N>        Create a phase plan
`gsd-serena-bridge execute-phase --format markdown` <N>     Execute a phase
`gsd-serena-bridge progress --format markdown`              Where am I, what's next
`gsd-serena-bridge quick --format markdown`                 Small ad-hoc task with GSD guarantees
`gsd-serena-bridge fast --format markdown` "<task>"         Trivial inline task — no subagents
`gsd-serena-bridge debug --format markdown` "<symptom>"     Persistent debug session (survives /clear)
`gsd-serena-bridge capture --format markdown`               Save an idea / todo / note
`gsd-serena-bridge ship --format markdown` <N>              Open a PR from a completed phase
```

More: ``gsd-serena-bridge help --format markdown`` (default tour) · ``gsd-serena-bridge help --format markdown` --full` (everything) · ``gsd-serena-bridge help --format markdown` <topic>` (one section)
</reference>

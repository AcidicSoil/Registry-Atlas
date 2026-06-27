# Bridge Workflow: help

<!-- generated-by: pnpm gen:bridge-commands -->

## Purpose

This bridge workflow runbook translates the actual GSD-core workflow information and adapts it for Serena bridge operation. Read it when operating `gsd-workflow-help` in a target project.

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

- Contract ID: `gsd-workflow-help`
- Status: `planned`
- Source path: `gsd-core/workflows/help.md`
- Resolved source path: `vendor/reference/gsd-core/gsd-core/workflows/help.md`
- Mirrored runbook path: `.agents/gsd-serena/workflows/help.md`

## Translated GSD Workflow

<purpose>
Display GSD command help at the tier the user asked for. Output ONLY the reference content of the chosen mode. Do NOT add project-specific analysis, git status, next-step suggestions, or any commentary beyond the reference.
</purpose>

<progressive_disclosure>
**Mode files are lazy-loaded.** Read only the one mode file that matches `$ARGUMENTS`, then output its `<reference>` body verbatim.

| When `$ARGUMENTS` is | Read |
|---|---|
| `--brief` (or `-b`) alone | `workflows/help/modes/brief.md` |
| `--full` (or `-f`, `--all`) alone | `workflows/help/modes/full.md` |
| empty / unset | `workflows/help/modes/default.md` |
| `--brief <topic>` (or `-b <topic>`) | `workflows/help/modes/topic.md` in compact scope (signature + one-line summary of the matched section) |
| anything else — bare topic, `--full <topic>`, or topic with leading `--` | `workflows/help/modes/topic.md` in full scope (entire matched section) |

Argument parsing rules:
- Trim and lowercase `$ARGUMENTS`.
- Recognize the long form, short form, and obvious aliases listed above.
- A bare token like `debug`, `--debug`, `capture`, `workflow`, `config` is a topic — route to `topic.md`.
- Multiple flags: `--brief` and `--full` are mutually exclusive — if both appear *without* a topic, prefer `--full`.
- `--brief` combined with a topic invokes `topic.md` in compact scope; `--full` combined with a topic invokes `topic.md` in full scope (the default topic behavior). When passing arguments through to `topic.md`, retain the `--brief` flag so the mode can pick...

After loading the chosen mode, emit its `<reference>` block content directly. No additions, no project context, no suggestions.
</progressive_disclosure>

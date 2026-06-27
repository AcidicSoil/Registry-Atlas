# Bridge Workflow: discuss-phase-modes-all

<!-- generated-by: pnpm gen:bridge-commands -->

## Purpose

This bridge workflow runbook translates the actual GSD-core workflow information and adapts it for Serena bridge operation. Read it when operating `gsd-workflow-discuss-phase-modes-all` in a target project.

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

- Contract ID: `gsd-workflow-discuss-phase-modes-all`
- Status: `planned`
- Source path: `gsd-core/workflows/discuss-phase/modes/all.md`
- Resolved source path: `vendor/reference/gsd-core/gsd-core/workflows/discuss-phase/modes/all.md`
- Mirrored runbook path: `.agents/gsd-serena/workflows/discuss-phase/modes/all.md`

## Translated GSD Workflow

# --all mode — auto-select ALL gray areas, discuss interactively

> **Lazy-loaded.** Read this file from `workflows/discuss-phase.md` when
> `--all` is present in `$ARGUMENTS`. Behavior overlays the default mode.

## Effect

- In `present_gray_areas`: auto-select ALL gray areas without asking the user
(skips the AskUserQuestion area-selection step).
- Discussion for each area proceeds **fully interactively** — the user drives
every question for every area (use the default-mode `discuss_areas` flow).
- Does NOT auto-advance to plan-phase afterward — use `--chain` or `--auto`
if you want auto-advance.
- Log: `[--all] Auto-selected all gray areas: [list area names].`

## Why this mode exists

This is the "discuss everything" shortcut: skip the selection friction, keep
full interactive control over each individual question.

## Combination rules

- `--all --auto`: `--auto` wins for the discussion phase too (Claude picks
recommended answers); `--all`'s contribution is just area auto-selection.
- `--all --chain`: areas auto-selected, discussion interactive, then
auto-advance to plan/execute (chain semantics).
- `--all --batch` / `--all --text` / `--all --analyze`: layered overlays
apply during discussion as documented in their respective files.

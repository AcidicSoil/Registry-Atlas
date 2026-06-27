# Bridge Workflow: list-workspaces

<!-- generated-by: pnpm gen:bridge-commands -->

## Purpose

This bridge workflow runbook translates the actual GSD-core workflow information and adapts it for Serena bridge operation. Read it when operating `gsd-workflow-list-workspaces` in a target project.

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

- Contract ID: `gsd-workflow-list-workspaces`
- Status: `planned`
- Source path: `gsd-core/workflows/list-workspaces.md`
- Resolved source path: `vendor/reference/gsd-core/gsd-core/workflows/list-workspaces.md`
- Mirrored runbook path: `.agents/gsd-serena/workflows/list-workspaces.md`

## Translated GSD Workflow

### Native Shim Translation
- Native GSD shim locator omitted: the bridge uses the installed `gsd-serena-bridge` CLI, `bootstrap`, `doctor`, `repair`, resolver packets, and install-managed project surfaces instead of locating `gsd-tools.cjs`.
<purpose>
List all GSD workspaces found in ~/gsd-workspaces/ with their status.
</purpose>

<required_reading>
Read all files referenced by the invoking prompt's execution_context before starting.
</required_reading>

<process>

## 1. Setup

```bash
- Native query translated: `INIT=$(gsd_run query init.list-workspaces)` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

Parse JSON for: `workspace_base`, `workspaces`, `workspace_count`.

## 2. Display

**If `workspace_count` is 0:**

```
No workspaces found in ~/gsd-workspaces/

Create one with:
`gsd-serena-bridge workspace --format markdown` --new --name my-workspace --repos repo1,repo2
```

Done.

**If workspaces exist:**

Display a table:

```
GSD Workspaces (~/gsd-workspaces/)

| Name | Repos | Strategy | GSD Project |
|------|-------|----------|-------------|
| feature-a | 3 | worktree | Yes |
| feature-b | 2 | clone | No |

Manage:
cd ~/gsd-workspaces/<name>     # Enter a workspace
`gsd-serena-bridge workspace --format markdown` --remove <name>  # Remove a workspace
```

For each workspace, show:
- **Name** — directory name
- **Repos** — count from init data
- **Strategy** — from WORKSPACE.md
- **GSD Project** — whether `.planning/PROJECT.md` exists (Yes/No)

</process>

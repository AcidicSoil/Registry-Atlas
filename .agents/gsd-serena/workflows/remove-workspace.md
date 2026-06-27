# Bridge Workflow: remove-workspace

<!-- generated-by: pnpm gen:bridge-commands -->

## Purpose

This bridge workflow runbook translates the actual GSD-core workflow information and adapts it for Serena bridge operation. Read it when operating `gsd-workflow-remove-workspace` in a target project.

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

- Contract ID: `gsd-workflow-remove-workspace`
- Status: `planned`
- Source path: `gsd-core/workflows/remove-workspace.md`
- Resolved source path: `vendor/reference/gsd-core/gsd-core/workflows/remove-workspace.md`
- Mirrored runbook path: `.agents/gsd-serena/workflows/remove-workspace.md`

## Translated GSD Workflow

### Native Shim Translation
- Native GSD shim locator omitted: the bridge uses the installed `gsd-serena-bridge` CLI, `bootstrap`, `doctor`, `repair`, resolver packets, and install-managed project surfaces instead of locating `gsd-tools.cjs`.
<purpose>
- Native worktree variables translated: inspect current repo with normal git/status commands when needed; do not create/switch worktrees unless explicitly requested.
</purpose>

<required_reading>
Read all files referenced by the invoking prompt's execution_context before starting.
</required_reading>

<process>

## 1. Setup

Extract workspace name from $ARGUMENTS.

```bash
- Native query translated: `INIT=$(gsd_run query init.remove-workspace "$WORKSPACE_NAME")` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

Parse JSON for: `workspace_name`, `workspace_path`, `has_manifest`, `strategy`, `repos`, `repo_count`, `dirty_repos`, `has_dirty_repos`.

**If no workspace name provided:**

First run ``gsd-serena-bridge workspace --format markdown` --list` to show available workspaces, then ask:

**Text mode (`workflow.text_mode: true` in config or `--text` flag):** Set `TEXT_MODE=true` if `--text` is present in `$ARGUMENTS` OR `text_mode` from init JSON is `true`. When TEXT_MODE is active, replace every `AskUserQuestion` call with a plain-text numb...
Use AskUserQuestion:
- header: "Remove Workspace"
- question: "Which workspace do you want to remove?"
- requireAnswer: true

Re-run init with the provided name.

## 2. Safety Checks

**If `has_dirty_repos` is true:**

```
Cannot remove workspace "$WORKSPACE_NAME" — the following repos have uncommitted changes:

- repo1
- repo2

Commit or stash changes in these repos before removing the workspace:
cd "$WORKSPACE_PATH/repo1"
git stash   # or git commit
```

Exit. Do NOT proceed.

## 3. Confirm Removal

Use AskUserQuestion:
- header: "Confirm Removal"
- question: "Remove workspace '$WORKSPACE_NAME' at $WORKSPACE_PATH? This will delete all files in the workspace directory. Type the workspace name to confirm:"
- requireAnswer: true

**If answer does not match `$WORKSPACE_NAME`:** Exit with "Removal cancelled."

## 4. Clean Up Worktrees

**If strategy is `worktree`:**

Initialize the failure flag once before iterating repos:

```bash
REMOVE_FAILED=false
```

For each repo in the workspace:

```bash
cd "$SOURCE_REPO_PATH"
- Native worktree variables translated: inspect current repo with normal git/status commands when needed; do not create/switch worktrees unless explicitly requested.
echo "Warning: Could not remove worktree for $REPO_NAME — source repo may have been moved, deleted, locked, or dirty." >&2
REMOVE_FAILED=true
fi
```

- Native worktree variables translated: inspect current repo with normal git/status commands when needed; do not create/switch worktrees unless explicitly requested.
```text
- Native worktree variables translated: inspect current repo with normal git/status commands when needed; do not create/switch worktrees unless explicitly requested.
Resolve the failed worktree removal manually, then rerun remove-workspace.
```

## 5. Delete Workspace Directory

```bash
if [ "${REMOVE_FAILED:-false}" = "true" ]; then
- Native worktree variables translated: inspect current repo with normal git/status commands when needed; do not create/switch worktrees unless explicitly requested.
exit 1
fi

rm -rf "$WORKSPACE_PATH"
```

## 6. Report

```
Workspace "$WORKSPACE_NAME" removed.

Path: $WORKSPACE_PATH (deleted)
Repos: $REPO_COUNT worktrees cleaned up
```

</process>

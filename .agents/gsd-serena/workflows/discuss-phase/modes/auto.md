# Bridge Workflow: discuss-phase-modes-auto

<!-- generated-by: pnpm gen:bridge-commands -->

## Purpose

This bridge workflow runbook translates the actual GSD-core workflow information and adapts it for Serena bridge operation. Read it when operating `gsd-workflow-discuss-phase-modes-auto` in a target project.

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

- Contract ID: `gsd-workflow-discuss-phase-modes-auto`
- Status: `planned`
- Source path: `gsd-core/workflows/discuss-phase/modes/auto.md`
- Resolved source path: `vendor/reference/gsd-core/gsd-core/workflows/discuss-phase/modes/auto.md`
- Mirrored runbook path: `.agents/gsd-serena/workflows/discuss-phase/modes/auto.md`

## Translated GSD Workflow

### Native Shim Translation
- Native GSD shim locator omitted: the bridge uses the installed `gsd-serena-bridge` CLI, `bootstrap`, `doctor`, `repair`, resolver packets, and install-managed project surfaces instead of locating `gsd-tools.cjs`.
# --auto mode — fully autonomous discuss-phase

> **Lazy-loaded.** Read this file from `workflows/discuss-phase.md` when
> `--auto` is present in `$ARGUMENTS`. After the discussion completes, the
> parent's `auto_advance` step also reads `modes/chain.md` to drive the
> auto-advance to plan-phase.

## Effect across steps

- **`check_existing`**: if CONTEXT.md exists, auto-select "Update it" — load
existing context and continue to `analyze_phase` (matches the parent step's
documented `--auto` branch). If no context exists, continue without
prompting. For interrupted checkpoints, auto-select "Resume". For existing
plans, auto-select "Continue and replan after". Log every decision so the
user can audit.
- **`cross_reference_todos`**: fold all todos with relevance score >= 0.4
automatically. Log the selection.
- **`present_gray_areas`**: auto-select ALL gray areas. Log:
`[--auto] Selected all gray areas: [list area names].`
- **`discuss_areas`**: for each discussion question, choose the recommended
option (first option, or the one explicitly marked "recommended") **without
using AskUserQuestion**. Skip interactive prompts entirely. Log each
auto-selected choice inline so the user can review decisions in the
context file:
```
[auto] [Area] — Q: "[question text]" → Selected: "[chosen option]" (recommended default)
```
- After all areas are auto-resolved, skip the "Explore more gray areas"
prompt and proceed directly to `write_context`.
- After `write_context`, **auto-advance** to plan-phase via `modes/chain.md`.

## CRITICAL — Auto-mode pass cap

In `--auto` mode, the discuss step MUST complete in a **single pass**. After
writing CONTEXT.md once, you are DONE — proceed immediately to
`write_context` and then auto_advance. Do NOT re-read your own CONTEXT.md to
find "gaps", "undefined types", or "missing decisions" and run additional
passes. This creates a self-feeding loop where each pass generates references
that the next pass treats as gaps, consuming unbounded time and resources.

Check the pass cap from config:
```bash
- Native query translated: `MAX_PASSES=$(gsd_run query config-get workflow.max_discuss_passes 2>/dev/null || echo "3")` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
```

If you have already written and committed CONTEXT.md, the discuss step is
complete. Move on.

## Combination rules

- `--auto --text` / `--auto --batch`: text/batch overlays are no-ops in
auto mode (no user prompts to render).
- `--auto --analyze`: trade-off tables can still be logged for the audit
trail; selection still uses the recommended option.
- `--auto --power`: `--power` wins (power mode generates files for offline
answering — incompatible with autonomous selection).

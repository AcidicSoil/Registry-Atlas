# Bridge Workflow: ultraplan-phase

<!-- generated-by: pnpm gen:bridge-commands -->

## Purpose

This bridge workflow runbook translates the actual GSD-core workflow information and adapts it for Serena bridge operation. Read it when operating `gsd-workflow-ultraplan-phase` in a target project.

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

- Contract ID: `gsd-workflow-ultraplan-phase`
- Status: `planned`
- Source path: `gsd-core/workflows/ultraplan-phase.md`
- Resolved source path: `vendor/reference/gsd-core/gsd-core/workflows/ultraplan-phase.md`
- Mirrored runbook path: `.agents/gsd-serena/workflows/ultraplan-phase.md`

## Translated GSD Workflow

### Native Shim Translation
- Native GSD shim locator omitted: the bridge uses the installed `gsd-serena-bridge` CLI, `bootstrap`, `doctor`, `repair`, resolver packets, and install-managed project surfaces instead of locating `gsd-tools.cjs`.
# Ultraplan Phase Workflow [BETA]

Offload GSD's plan phase to Claude Code's ultraplan cloud infrastructure.

⚠ **BETA feature.** Ultraplan is in research preview and may change. This workflow is
intentionally isolated from `gsd-serena-bridge plan-phase --format markdown` so upstream changes to ultraplan cannot
affect the core planning pipeline.

---

<step name="banner">

Display the stage banner:

```text
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GSD ► ULTRAPLAN PHASE  ⚠ BETA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Ultraplan is in research preview (Claude Code v2.1.91+).
Use `gsd-serena-bridge plan-phase --format markdown` for stable local planning.
```

</step>

---

<step name="runtime_gate">

Check that the session is running inside Claude Code:

```bash
if [ "$CLAUDECODE" = "1" ] || [ -n "$CLAUDE_CODE_ENTRYPOINT" ]; then
CC_VERSION="$(claude --version 2>/dev/null | grep -Eo '[0-9]+\.[0-9]+\.[0-9]+' | head -n1)"
if [ -n "$CC_VERSION" ] && [ "$(printf '%s\n' "2.1.91" "$CC_VERSION" | sort -V | head -n1)" = "2.1.91" ]; then
echo "claude-code:${CC_VERSION}"
else
echo ""
fi
else
echo ""
fi
```

If the output is empty or unset, display the following error and exit:

```text
╔══════════════════════════════════════════════════════════════╗
║  RUNTIME ERROR                                               ║
╚══════════════════════════════════════════════════════════════╝

`gsd-serena-bridge ultraplan-phase --format markdown` requires Claude Code.
ultraplan is not available in this runtime.

Use `gsd-serena-bridge plan-phase --format markdown` for local planning instead.
```

</step>

---

<step name="initialize">

Parse phase number from `$ARGUMENTS`. If no phase number is provided, detect the next
unplanned phase from the roadmap (same logic as `gsd-serena-bridge plan-phase --format markdown`).

Load GSD phase context:

```bash
- Native query translated: `INIT=$(gsd_run query init.plan-phase "$PHASE")` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

Parse JSON for: `phase_found`, `phase_number`, `phase_name`, `phase_slug`, `padded_phase`,
`phase_dir`, `roadmap_path`, `requirements_path`, `research_path`, `planning_exists`.

**If `planning_exists` is false:** Error and exit:

```text
No .planning directory found. Initialize the project first:

`gsd-serena-bridge new-project --format markdown`
```

**If `phase_found` is false:** Error with the phase number provided and exit.

Display detected phase:

```text
Phase {N}: {phase name}
```

</step>

---

<step name="build_prompt">

Build the ultraplan prompt from GSD context.

1. Read the phase scope from ROADMAP.md — extract the goal, deliverables, and scope for
the target phase.

2. Read REQUIREMENTS.md if it exists (`requirements_path` is not null) — extract a
concise summary (key requirements relevant to this phase, not the full document).

3. Read RESEARCH.md if it exists (`research_path` is not null) — extract a concise
summary of technical findings. Including this reduces redundant cloud research.

Construct the prompt:

```text
Plan phase {phase_number}: {phase_name}

## Phase Scope (from ROADMAP.md)

{phase scope block extracted from ROADMAP.md}

## Requirements Context

{requirements summary, or "No REQUIREMENTS.md found — infer from phase scope."}

## Existing Research

{research summary, or "No RESEARCH.md found — research from scratch."}

## Output Format

Produce a GSD PLAN.md with the following YAML frontmatter:

---
phase: "{padded_phase}-{phase_slug}"
plan: "{padded_phase}-01"
type: "feature"
wave: 1
depends_on: []
files_modified: []
autonomous: true
must_haves:
truths: []
artifacts: []
---

Then a ## Plan section with numbered tasks. Each task should have:
- A clear imperative title
- Files to create or modify
- Specific implementation steps

Keep the plan focused and executable.
```

</step>

---

<step name="return_path_card">

Display the return-path instructions **before** triggering ultraplan so they are visible
in the terminal scroll-back after ultraplan launches:

```text
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WHEN THE PLAN IS READY — WHAT TO DO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

When ◆ ultraplan ready appears in your terminal:

1. Open the session link in your browser
2. Review the plan — use inline comments and emoji reactions to give feedback
3. Ask Claude to revise until you're satisfied
4. Click "Approve plan and teleport back to terminal"
5. At the terminal dialog, choose Cancel  ← saves the plan to a file
6. Note the file path Claude prints
7. Run: `gsd-serena-bridge import --format markdown` --from <the file path>

`gsd-serena-bridge import --format markdown` will run conflict detection, convert to GSD format,
validate via plan-checker, update ROADMAP.md, and commit.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Launching ultraplan for Phase {N}: {phase_name}...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

</step>

---

<step name="trigger">

Trigger ultraplan with the constructed prompt:

```text
/ultraplan {constructed prompt from build_prompt step}
```

Your terminal will show a `◇ ultraplan` status indicator while the remote session works.
Use `/tasks` to open the detail view with the session link, agent activity, and a stop action.

</step>

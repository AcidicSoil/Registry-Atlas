# Bridge Workflow: help-modes-full

<!-- generated-by: pnpm gen:bridge-commands -->

## Purpose

This bridge workflow runbook translates the actual GSD-core workflow information and adapts it for Serena bridge operation. Read it when operating `gsd-workflow-help-modes-full` in a target project.

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

- Contract ID: `gsd-workflow-help-modes-full`
- Status: `planned`
- Source path: `gsd-core/workflows/help/modes/full.md`
- Resolved source path: `vendor/reference/gsd-core/gsd-core/workflows/help/modes/full.md`
- Mirrored runbook path: `.agents/gsd-serena/workflows/help/modes/full.md`

## Translated GSD Workflow

<purpose>
Display the complete GSD Core command reference. Output ONLY the reference content. Do NOT add project-specific analysis, git status, next-step suggestions, or any commentary beyond the reference.
</purpose>

<reference>
# GSD Core Command Reference

**GSD Core** (Git. Ship. Done.) creates hierarchical project plans optimized for solo agentic development with Claude Code.

## Quick Start

1. ``gsd-serena-bridge new-project --format markdown`` - Initialize project (includes research, requirements, roadmap)
2. ``gsd-serena-bridge plan-phase --format markdown` 1` - Create detailed plan for first phase
3. ``gsd-serena-bridge execute-phase --format markdown` 1` - Execute the phase

## Staying Updated

GSD evolves fast. Update periodically:

```bash
npx @opengsd/gsd-core@latest
```

## Core Workflow

```text
`gsd-serena-bridge new-project --format markdown` → `gsd-serena-bridge plan-phase --format markdown` → `gsd-serena-bridge execute-phase --format markdown` → repeat
```

### Project Initialization

**``gsd-serena-bridge new-project --format markdown``**
Initialize new project through unified flow.

One command takes you from idea to ready-for-planning:
- Deep questioning to understand what you're building
- Optional domain research (spawns 4 parallel researcher agents)
- Requirements definition with v1/v2/out-of-scope scoping
- Roadmap creation with phase breakdown and success criteria

Creates all `.planning/` artifacts:
- `PROJECT.md` — vision and requirements
- `config.json` — workflow mode (interactive/yolo)
- `research/` — domain research (if selected)
- `REQUIREMENTS.md` — scoped requirements with REQ-IDs
- `ROADMAP.md` — phases mapped to requirements
- `STATE.md` — project memory

Usage: ``gsd-serena-bridge new-project --format markdown``

**``gsd-serena-bridge map-codebase --format markdown` [--fast] [--focus <area>] [--query <term>]`**
Map an existing codebase for brownfield projects.

- `--fast` — rapid lightweight assessment (replaces the former `gsd-scan`)
- `--focus <area>` — scope the map to a specific area
- `--query <term>` — query the codebase intelligence index in `.planning/intel/` (replaces the former `gsd-intel`)

- Analyzes codebase with parallel Explore agents
- Creates `.planning/codebase/` with 7 focused documents
- Covers stack, architecture, structure, conventions, testing, integrations, concerns
- Use before ``gsd-serena-bridge new-project --format markdown`` on existing codebases

Usage: ``gsd-serena-bridge map-codebase --format markdown``

### Phase Planning

**``gsd-serena-bridge discuss-phase --format markdown` <number> [--chain | --analyze | --power | --assumptions] [--batch[=N]]`**
Help articulate your vision for a phase before planning.

- `--chain` — chained-prompt discuss flow
- `--analyze` — deep assumption analysis pass
- `--power` — power-user mode with extended question set
- `--assumptions` — surface Claude's implementation assumptions about the phase without an interactive session

- Captures how you imagine this phase working
- Creates CONTEXT.md with your vision, essentials, and boundaries
- Use when you have ideas about how something should look/feel
- Optional `--batch` asks 2-5 related questions at a time instead of one-by-one

Usage: ``gsd-serena-bridge discuss-phase --format markdown` 2`
Usage: ``gsd-serena-bridge discuss-phase --format markdown` 2 --batch`
Usage: ``gsd-serena-bridge discuss-phase --format markdown` 2 --batch=3`

**``gsd-serena-bridge plan-phase --format markdown` <number> [--research] [--skip-research] [--research-phase <N>] [--view] [--gaps] [--skip-verify] [--prd <file>] [--ingest <path-or-glob>] [--ingest-format <auto|nygard|madr|narrative>] [--reviews] [--text] [--tdd] [--mvp]`**
Create detailed execution plan for a specific phase.

- `--skip-research` — bypass the research subagent
- `--research-phase <N>` — research-only mode. Spawns the research agent for phase `<N>`, writes `RESEARCH.md`, then exits before the planner runs. Useful for cross-phase research, doc review before committing to a planning approach, and correction-without-...
- Modifiers: `--research` forces refresh (re-spawn researcher). `--view` prints existing `RESEARCH.md` to stdout without spawning. With neither, auto-uses an existing `RESEARCH.md` (one-line notice, then clean exit).
- `--gaps` — focus only on closing gaps from a prior plan-check
- `--skip-verify` — skip the post-plan verifier loop
- `--ingest <path-or-glob>` — pre-ingest external ADRs/PRDs/SPECs before planning (see *PRD Express Path* below)
- `--ingest-format <auto|nygard|madr|narrative>` — hint the ADR ingester's parser when `--ingest` is set; defaults to `auto`
- `--tdd` — plan in test-driven order (tests before code)
- `--mvp` — vertical-slice MVP planning mode (see also ``gsd-serena-bridge mvp-phase --format markdown``)

- Generates `.planning/phases/XX-phase-name/XX-YY-PLAN.md`
- Breaks phase into concrete, actionable tasks
- Includes verification criteria and success measures
- Multiple plans per phase supported (XX-01, XX-02, etc.)

Usage: ``gsd-serena-bridge plan-phase --format markdown` 1`
Usage: ``gsd-serena-bridge plan-phase --format markdown` --research-phase 2` — research only on phase 2 (auto-uses existing `RESEARCH.md`, no prompt)
Usage: ``gsd-serena-bridge plan-phase --format markdown` --research-phase 2 --view` — print existing `RESEARCH.md`, no spawn
Usage: ``gsd-serena-bridge plan-phase --format markdown` --research-phase 2 --research` — force-refresh, no prompt
Result: Creates `.planning/phases/01-foundation/01-01-PLAN.md`

**PRD Express Path:** Pass `--prd path/to/requirements.md` to skip discuss-phase entirely. Your PRD becomes locked decisions in CONTEXT.md. Useful when you already have clear acceptance criteria.

### Execution

**``gsd-serena-bridge execute-phase --format markdown` <phase-number> [--wave N] [--gaps-only] [--tdd]`**
Execute all plans in a phase, or run a specific wave.

- `--wave N` — execute only wave N (see *Plans within each wave* below)
- `--gaps-only` — re-run only plans flagged as gaps by a prior verifier
- `--tdd` — enforce test-driven order during execution

- Groups plans by wave (from frontmatter), executes waves sequentially
- Plans within each wave run in parallel via Task tool
- Optional `--wave N` flag executes only Wave `N` and stops unless the phase is now fully complete
- Verifies phase goal after all plans complete
- Updates REQUIREMENTS.md, ROADMAP.md, STATE.md

Usage: ``gsd-serena-bridge execute-phase --format markdown` 5`
Usage: ``gsd-serena-bridge execute-phase --format markdown` 5 --wave 2`

### Smart Router

**``gsd-serena-bridge progress --format markdown` --do "<description>"`**
Route freeform text to the right GSD command automatically.

- Analyzes natural language input to find the best matching GSD command
- Acts as a dispatcher — never does the work itself
- Resolves ambiguity by asking you to pick between top matches
- Use when you know what you want but don't know which `/gsd-*` command to run

Usage: ``gsd-serena-bridge progress --format markdown` --do "fix the login button"`
Usage: ``gsd-serena-bridge progress --format markdown` --do "refactor the auth system"`
Usage: ``gsd-serena-bridge progress --format markdown` --do "I want to start a new milestone"`

### Quick Mode

**``gsd-serena-bridge quick --format markdown` [--full] [--validate] [--discuss] [--research]`**
Execute small, ad-hoc tasks with GSD guarantees but skip optional agents.

Quick mode uses the same system with a shorter path:
- Spawns planner + executor (skips researcher, checker, verifier by default)
- Quick tasks live in `.planning/quick/` separate from planned phases
- Updates STATE.md tracking (not ROADMAP.md)

Flags enable additional quality steps:
- `--full` — Complete quality pipeline: discussion + research + plan-checking + verification
- `--validate` — Plan-checking (max 2 iterations) and post-execution verification only
- `--discuss` — Lightweight discussion to surface gray areas before planning
- `--research` — Focused research agent investigates approaches before planning

Granular flags are composable: `--discuss --research --validate` gives the same as `--full`.

Usage: ``gsd-serena-bridge quick --format markdown``
Usage: ``gsd-serena-bridge quick --format markdown` --full`
Usage: ``gsd-serena-bridge quick --format markdown` --research --validate`
Result: Creates `.planning/quick/NNN-slug/PLAN.md`, `.planning/quick/NNN-slug/NNN-slug-SUMMARY.md`

---

**``gsd-serena-bridge fast --format markdown` [description]`**
Execute a trivial task inline — no subagents, no planning files, no overhead.

For tasks too small to justify planning: typo fixes, config changes, forgotten commits, simple additions. Runs in the current context, makes the change, commits, and logs to STATE.md.

- No PLAN.md or SUMMARY.md created
- No subagent spawned (runs inline)
- ≤ 3 file edits — redirects to ``gsd-serena-bridge quick --format markdown`` if task is non-trivial
- Atomic commit with conventional message

Usage: ``gsd-serena-bridge fast --format markdown` "fix the typo in README"`
Usage: ``gsd-serena-bridge fast --format markdown` "add .env to gitignore"`

### Roadmap Management

**``gsd-serena-bridge phase --format markdown` <description>`**
Add new phase to end of current milestone.

- Appends to ROADMAP.md
- Uses next sequential number
- Updates phase directory structure

Usage: ``gsd-serena-bridge phase --format markdown` "Add admin dashboard"`

**``gsd-serena-bridge phase --format markdown` --insert <after> <description>`**
Insert urgent work as decimal phase between existing phases.

- Creates intermediate phase (e.g., 7.1 between 7 and 8)
- Useful for discovered work that must happen mid-milestone
- Maintains phase ordering

Usage: ``gsd-serena-bridge phase --format markdown` --insert 7 "Fix critical auth bug"`
Result: Creates Phase 7.1

**``gsd-serena-bridge phase --format markdown` --remove <number>`**
Remove a future phase and renumber subsequent phases.

- Deletes phase directory and all references
- Renumbers all subsequent phases to close the gap
- Only works on future (unstarted) phases
- Git commit preserves historical record

Usage: ``gsd-serena-bridge phase --format markdown` --remove 17`
Result: Phase 17 deleted, phases 18-20 become 17-19

**``gsd-serena-bridge phase --format markdown` --edit <number> [--force]`**
Edit any field of an existing roadmap phase in place, preserving number and position.

- Updates title, description, requirements, dependencies in `ROADMAP.md`
- `--force` allows editing already-started phases (use with caution)

### Milestone Management

**``gsd-serena-bridge new-milestone --format markdown` <name>`**
Start a new milestone through unified flow.

- Deep questioning to understand what you're building next
- Optional domain research (spawns 4 parallel researcher agents)
- Requirements definition with scoping
- Roadmap creation with phase breakdown
- Optional `--reset-phase-numbers` flag restarts numbering at Phase 1 and archives old phase dirs first for safety

Mirrors ``gsd-serena-bridge new-project --format markdown`` flow for brownfield projects (existing PROJECT.md).

Usage: ``gsd-serena-bridge new-milestone --format markdown` "v2.0 Features"`
Usage: ``gsd-serena-bridge new-milestone --format markdown` --reset-phase-numbers "v2.0 Features"`

**``gsd-serena-bridge complete-milestone --format markdown` <version>`**
Archive completed milestone and prepare for next version.

- Creates MILESTONES.md entry with stats
- Archives full details to milestones/ directory
- Creates git tag for the release
- Prepares workspace for next version

Usage: ``gsd-serena-bridge complete-milestone --format markdown` 1.0.0`

### Progress Tracking

**``gsd-serena-bridge progress --format markdown` [--next | --forensic | --do "<description>"]`**
Check project status and intelligently route to next action.

- Shows visual progress bar and completion percentage
- Summarizes recent work from SUMMARY files
- Displays current position and what's next
- Lists key decisions and open issues
- Offers to execute next plan or create it if missing
- Detects 100% milestone completion

Modes:
- **default** — progress report + intelligent routing
- **`--next`** — auto-advance to the next logical step (use `--next --force` to bypass safety gates)
- **`--next --auto`** — like `--next`, but chains steps automatically until milestone completion or a blocking decision
- **`--next --converge`** — when the next action is planning, route it through ``gsd-serena-bridge plan-review-convergence --format markdown`` instead of ``gsd-serena-bridge plan-phase --format markdown``; requires `workflow.plan_review_convergence=true`. `--cross-ai` is an alias. Reviewer flags (`--codex`, `--gemini`, `--claude`, `--opencode`, `--ollama`, `--lm-studio`, `--llama-cpp`, `--all`) and `--max-cycles N` forward to the convergence loop.
- **`--forensic`** — append a 6-check integrity audit after the progress report
- **`--do "<text>"`** — smart router: dispatch freeform intent to the matching `/gsd-*` command (see *Smart Router* above)

Usage: ``gsd-serena-bridge progress --format markdown``
Usage: ``gsd-serena-bridge progress --format markdown` --next`
Usage: ``gsd-serena-bridge progress --format markdown` --next --auto`
Usage: ``gsd-serena-bridge progress --format markdown` --next --auto --converge`
Usage: ``gsd-serena-bridge progress --format markdown` --forensic`

### Session Management

**``gsd-serena-bridge resume-work --format markdown``**
Resume work from previous session with full context restoration.

- Reads STATE.md for project context
- Shows current position and recent progress
- Offers next actions based on project state

Usage: ``gsd-serena-bridge resume-work --format markdown``

**``gsd-serena-bridge pause-work --format markdown` [--report]`**
Create context handoff when pausing work mid-phase.

- `--report` — generate a post-session summary in `.planning/reports/` capturing commits, file changes, and phase progress
- Creates .continue-here file with current state
- Updates STATE.md session continuity section
- Captures in-progress work context

Usage: ``gsd-serena-bridge pause-work --format markdown``

### Debugging

**``gsd-serena-bridge debug --format markdown` [issue description] [--diagnose]`**
Systematic debugging with persistent state across context resets.

- `--diagnose` — run a one-shot diagnostic pass without opening a persistent debug session

- Gathers symptoms through adaptive questioning
- Creates `.planning/debug/[slug].md` to track investigation
- Investigates using scientific method (evidence → hypothesis → test)
- Survives `/clear` — run ``gsd-serena-bridge debug --format markdown`` with no args to resume
- Archives resolved issues to `.planning/debug/resolved/`

Usage: ``gsd-serena-bridge debug --format markdown` "login button doesn't work"`
Usage: ``gsd-serena-bridge debug --format markdown`` (resume active session)

- Source translation truncated here; use the bridge command output, workflow runbook, installed contracts, or operation plan for continuation.

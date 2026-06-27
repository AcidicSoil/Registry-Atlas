<!-- generated-by: pnpm gen:bridge-runtime-surface -->
<purpose>
One-page newcomer-oriented tour of GSD Core. Output ONLY the `<reference>` content below. No additions.
</purpose>

<reference>
# GSD Core — Git. Ship. Done.

Plan-driven development for solo agentic work with Claude Code. GSD Core turns a vague idea into a hierarchical plan, then executes it phase by phase with state tracking and atomic commits.

## Start here (3 commands)

```text
gsd-serena-bridge new-project --format markdown        # Greenfield: questioning → research → requirements → roadmap
gsd-serena-bridge plan-phase --format markdown 1       # Create a detailed plan for phase 1
gsd-serena-bridge execute-phase --format markdown 1    # Execute all plans in the phase
```

Existing codebase? Run `gsd-serena-bridge map-codebase --format markdown` first to ground GSD in your code.

## Common commands

| Command | Purpose |
|---|---|
| `gsd-serena-bridge progress --format markdown` | Where am I, what's next — also routes freeform intent with `--do "..."` |
| `gsd-serena-bridge quick --format markdown` | Small ad-hoc task with GSD guarantees (planning dir + atomic commit) |
| `gsd-serena-bridge fast --format markdown "<task>"` | Trivial inline change — no subagents, ≤3 file edits |
| `gsd-serena-bridge discuss-phase --format markdown <N>` | Capture vision and decisions before planning |
| `gsd-serena-bridge debug --format markdown "<symptom>"` | Persistent debug session, survives `/clear` |
| `gsd-serena-bridge capture --format markdown` | Save an idea, todo, note, seed, or backlog item |
| `gsd-serena-bridge verify-work --format markdown <N>` | Conversational UAT for a completed phase |
| `gsd-serena-bridge ship --format markdown <N>` | Open a PR from a completed phase |
| `gsd-serena-bridge help --format markdown --full` | Complete reference (every command, every flag) |

## Want more?

```text
gsd-serena-bridge help --format markdown --brief         # 10-line refresher of top commands
gsd-serena-bridge help --format markdown --full          # complete reference
gsd-serena-bridge help --format markdown <topic>         # one section only — see topics below
gsd-serena-bridge help --format markdown --brief <topic> # compact scoped lookup — signature + one-line summary
```

Topics: `workflow` · `planning` · `execute` · `quick` · `debug` · `capture` · `ship` · `config` · `milestones` · `spike` · `sketch` · `review` · `audit` · `progress`

## Update GSD

```bash
npx @opengsd/gsd-core@latest
```
</reference>

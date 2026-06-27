# Bridge Workflow: do

<!-- generated-by: pnpm gen:bridge-commands -->

## Purpose

This bridge workflow runbook translates the actual GSD-core workflow information and adapts it for Serena bridge operation. Read it when operating `gsd-workflow-do` in a target project.

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

- Contract ID: `gsd-workflow-do`
- Status: `planned`
- Source path: `gsd-core/workflows/do.md`
- Resolved source path: `vendor/reference/gsd-core/gsd-core/workflows/do.md`
- Mirrored runbook path: `.agents/gsd-serena/workflows/do.md`

## Translated GSD Workflow

### Native Shim Translation
- Native GSD shim locator omitted: the bridge uses the installed `gsd-serena-bridge` CLI, `bootstrap`, `doctor`, `repair`, resolver packets, and install-managed project surfaces instead of locating `gsd-tools.cjs`.
<purpose>
Analyze freeform text from the user and route to the most appropriate GSD command. This is a dispatcher — it never does the work itself. Match user intent to the best command, confirm the routing, and hand off.
</purpose>

<required_reading>
Read all files referenced by the invoking prompt's execution_context before starting.
</required_reading>

<process>

<step name="validate">
**Check for input.**

**Text mode (`workflow.text_mode: true` in config or `--text` flag):** Set `TEXT_MODE=true` if `--text` is present in `$ARGUMENTS` OR `text_mode` from init JSON is `true`. When TEXT_MODE is active, replace every `AskUserQuestion` call with a plain-text numb...
If `$ARGUMENTS` is empty, ask via AskUserQuestion:

```
What would you like to do? Describe the task, bug, or idea and I'll route it to the right GSD command.
```

Wait for response before continuing.
</step>

<step name="check_project">
**Check if project exists.**

```bash
- Native query translated: `INIT=$(gsd_run query state.load 2>/dev/null)` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
```

Track whether `.planning/` exists — some routes require it, others don't.
</step>

<step name="route">
**Match intent to command.**

Evaluate `$ARGUMENTS` against these routing rules. Apply the **first matching** rule:

| If the text describes... | Route to | Why |
|--------------------------|----------|-----|
| Starting a new project, "set up", "initialize" | ``gsd-serena-bridge new-project --format markdown`` | Needs full project initialization |
| Mapping or analyzing an existing codebase | ``gsd-serena-bridge map-codebase --format markdown`` | Codebase discovery |
| A bug, error, crash, failure, or something broken | ``gsd-serena-bridge debug --format markdown`` | Needs systematic investigation |
| Spiking, "test if", "will this work", "experiment", "prove this out", validate feasibility | ``gsd-serena-bridge spike --format markdown`` | Throwaway experiment to validate feasibility |
| Sketching, "mockup", "what would this look like", "prototype the UI", "design this", explore visual direction | ``gsd-serena-bridge sketch --format markdown`` | Throwaway HTML mockups to explore design |
| Wrapping up spikes, "package the spikes", "consolidate spike findings" | ``gsd-serena-bridge spike --format markdown` --wrap-up` | Package spike findings into reusable skill |
| Wrapping up sketches, "package the designs", "consolidate sketch findings" | ``gsd-serena-bridge sketch --format markdown` --wrap-up` | Package sketch findings into reusable skill |
| Exploring, researching, comparing, or "how does X work" | ``gsd-serena-bridge explore --format markdown`` | Socratic ideation and idea routing |
| Discussing vision, "how should X look", brainstorming | ``gsd-serena-bridge discuss-phase --format markdown`` | Needs context gathering |
| A complex task: refactoring, migration, multi-file architecture, system redesign | ``gsd-serena-bridge phase --format markdown`` | Needs a full phase with plan/build cycle |
| Planning a specific phase or "plan phase N" | ``gsd-serena-bridge plan-phase --format markdown`` | Direct planning request |
| Executing a phase or "build phase N", "run phase N" | ``gsd-serena-bridge execute-phase --format markdown`` | Direct execution request |
| Running all remaining phases automatically | ``gsd-serena-bridge autonomous --format markdown`` | Full autonomous execution |
| A review or quality concern about existing work | ``gsd-serena-bridge verify-work --format markdown`` | Needs verification |
| Checking progress, status, "where am I" | ``gsd-serena-bridge progress --format markdown`` | Status check |
| Resuming work, "pick up where I left off" | ``gsd-serena-bridge resume-work --format markdown`` | Session restoration |
| A note, idea, or "remember to..." | ``gsd-serena-bridge capture --format markdown`` | Capture for later |
| Adding tests, "write tests", "test coverage" | ``gsd-serena-bridge add-tests --format markdown`` | Test generation |
| Completing a milestone, shipping, releasing | ``gsd-serena-bridge complete-milestone --format markdown`` | Milestone lifecycle |
| A specific, actionable, small task (add feature, fix typo, update config) | ``gsd-serena-bridge quick --format markdown`` | Self-contained, single executor |

**Requires `.planning/` directory:** All routes except ``gsd-serena-bridge new-project --format markdown``, ``gsd-serena-bridge map-codebase --format markdown``, ``gsd-serena-bridge spike --format markdown``, ``gsd-serena-bridge sketch --format markdown``, and ``gsd-serena-bridge help --format markdown``. If the project doesn't exist and the route requires it, suggest ``gsd-serena-bridge new-project --format markdown`` first.

**Ambiguity handling:** If the text could reasonably match multiple routes, ask the user via AskUserQuestion with the top 2-3 options. For example:

```
"Refactor the authentication system" could be:
1. `gsd-serena-bridge phase --format markdown` — Full planning cycle (recommended for multi-file refactors)
2. `gsd-serena-bridge quick --format markdown` — Quick execution (if scope is small and clear)

Which approach fits better?
```
</step>

<step name="display">
**Show the routing decision.**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GSD ► ROUTING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Input:** {first 80 chars of $ARGUMENTS}
**Routing to:** {chosen command}
**Reason:** {one-line explanation}
```
</step>

<step name="dispatch">
**Invoke the chosen command.**

Run the selected `/gsd-*` command, passing `$ARGUMENTS` as args.

If the chosen command expects a phase number and one wasn't provided in the text, extract it from context or ask via AskUserQuestion.

After invoking the command, stop. The dispatched command handles everything from here.
</step>

</process>

<success_criteria>
- [ ] Input validated (not empty)
- [ ] Intent matched to exactly one GSD command
- [ ] Ambiguity resolved via user question (if needed)
- [ ] Project existence checked for routes that require it
- [ ] Routing decision displayed before dispatch
- [ ] Command invoked with appropriate arguments
- [ ] No work done directly — dispatcher only
</success_criteria>

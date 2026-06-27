# Bridge Workflow: insert-phase

<!-- generated-by: pnpm gen:bridge-commands -->

## Purpose

This bridge workflow runbook translates the actual GSD-core workflow information and adapts it for Serena bridge operation. Read it when operating `gsd-workflow-insert-phase` in a target project.

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

- Contract ID: `gsd-workflow-insert-phase`
- Status: `planned`
- Source path: `gsd-core/workflows/insert-phase.md`
- Resolved source path: `vendor/reference/gsd-core/gsd-core/workflows/insert-phase.md`
- Mirrored runbook path: `.agents/gsd-serena/workflows/insert-phase.md`

## Translated GSD Workflow

### Native Shim Translation
- Native GSD shim locator omitted: the bridge uses the installed `gsd-serena-bridge` CLI, `bootstrap`, `doctor`, `repair`, resolver packets, and install-managed project surfaces instead of locating `gsd-tools.cjs`.
<purpose>
Insert a decimal phase for urgent work discovered mid-milestone between existing integer phases. Uses decimal numbering (72.1, 72.2, etc.) to preserve the logical sequence of planned phases while accommodating urgent insertions without renumbering the entir...
</purpose>

<required_reading>
Read all files referenced by the invoking prompt's execution_context before starting.
</required_reading>

<process>

<step name="parse_arguments">
Parse the command arguments:
- First argument: integer phase number to insert after
- Remaining arguments: phase description

Example: ``gsd-serena-bridge phase --format markdown` --insert 72 Fix critical auth bug`
-> after = 72
-> description = "Fix critical auth bug"

If arguments missing:

```
ERROR: Both phase number and description required
Usage: `gsd-serena-bridge phase --format markdown` --insert <after> <description>
Example: `gsd-serena-bridge phase --format markdown` --insert 72 Fix critical auth bug
```

Exit.

Validate first argument is an integer.
</step>

<step name="init_context">
Load phase operation context:

```bash
- Native query translated: `INIT=$(gsd_run query init.phase-op "${after_phase}")` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

Check `roadmap_exists` from init JSON. If false:
```
ERROR: No roadmap found (.planning/ROADMAP.md)
```
Exit.
</step>

<step name="insert_phase">
**Delegate the phase insertion to `gsd-tools.cjs query phase.insert`:**

```bash
- Native query translated: `RESULT=$(gsd_run query phase.insert "${after_phase}" "${description}")` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
```

The CLI handles:
- Verifying target phase exists in ROADMAP.md
- Calculating next decimal phase number (checking existing decimals on disk)
- Generating slug from description
- Creating the phase directory (`.planning/phases/{N.M}-{slug}/`)
- Inserting the phase entry into ROADMAP.md after the target phase with (INSERTED) marker

Extract from result: `phase_number`, `after_phase`, `name`, `slug`, `directory`.
</step>

<step name="update_project_state">
Update STATE.md to reflect the inserted phase via SDK handlers (never raw
`Edit`/`Write` — projects may ship a `protect-files.sh` PreToolUse hook that
blocks direct STATE.md writes):

1. Update STATE.md's next-phase pointer(s) to the newly inserted phase
`{decimal_phase}`:

```bash
- Native query translated: `gsd_run query state.patch '{"Current Phase":"{decimal_phase}","Next recommended run":"/gsd:plan-phase {decimal_phase}"}'` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
```

(Adjust field names to whatever pointers STATE.md exposes — the handler
reports which fields it matched.)

2. Append a Roadmap Evolution entry via the dedicated handler. It creates the
`### Roadmap Evolution` subsection under `## Accumulated Context` if missing
and dedupes identical entries:

```bash
- Native query translated: `gsd_run query state.add-roadmap-evolution \` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
--phase {decimal_phase} \
--action inserted \
--after {after_phase} \
--note "{description}" \
--urgent
```

Expected response shape: `{ added: true, entry: "- Phase ... (URGENT)" }`
(or `{ added: false, reason: "duplicate", entry: ... }` on replay).
</step>

<step name="completion">
Present completion summary:

```
Phase {decimal_phase} inserted after Phase {after_phase}:
- Description: {description}
- Directory: .planning/phases/{decimal-phase}-{slug}/
- Status: Not planned yet
- Marker: (INSERTED) - indicates urgent work

Roadmap updated: .planning/ROADMAP.md
Project state updated: .planning/STATE.md

---

## Next Up

**Phase {decimal_phase}: {description}** -- urgent insertion

`/clear` then:

``gsd-serena-bridge plan-phase --format markdown` {decimal_phase}`

---

**Also available:**
- Review insertion impact: Check if Phase {next_integer} dependencies still make sense
- Review roadmap

---
```
</step>

</process>

<anti_patterns>

- Don't use this for planned work at end of milestone (use /gsd-add-phase)
- Don't insert before Phase 1 (decimal 0.1 makes no sense)
- Don't renumber existing phases
- Don't modify the target phase content
- Don't create plans yet (that's `gsd-serena-bridge plan-phase --format markdown`)
- Don't commit changes (user decides when to commit)
</anti_patterns>

<success_criteria>
Phase insertion is complete when:

- [ ] `gsd-tools.cjs query phase.insert` executed successfully
- [ ] Phase directory created
- [ ] Roadmap updated with new phase entry (includes "(INSERTED)" marker)
- [ ] `gsd-tools.cjs query state.add-roadmap-evolution ...` returned `{ added: true }` or `{ added: false, reason: "duplicate" }`
- [ ] `gsd-tools.cjs query state.patch` returned matched next-phase pointer field(s)
- [ ] User informed of next steps and dependency implications
</success_criteria>

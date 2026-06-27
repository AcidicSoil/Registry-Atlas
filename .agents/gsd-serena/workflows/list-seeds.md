# Bridge Workflow: list-seeds

<!-- generated-by: pnpm gen:bridge-commands -->

## Purpose

This bridge workflow runbook translates the actual GSD-core workflow information and adapts it for Serena bridge operation. Read it when operating `gsd-workflow-list-seeds` in a target project.

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

- Contract ID: `gsd-workflow-list-seeds`
- Status: `planned`
- Source path: `gsd-core/workflows/list-seeds.md`
- Resolved source path: `vendor/reference/gsd-core/gsd-core/workflows/list-seeds.md`
- Mirrored runbook path: `.agents/gsd-serena/workflows/list-seeds.md`

## Translated GSD Workflow

### Native Shim Translation
- Native GSD shim locator omitted: the bridge uses the installed `gsd-serena-bridge` CLI, `bootstrap`, `doctor`, `repair`, resolver packets, and install-managed project surfaces instead of locating `gsd-tools.cjs`.
<purpose>
List captured seeds for browsing and audit, with an optional status filter. Read-only — never mutates seeds.
</purpose>

<required_reading>
Read all files referenced by the invoking prompt's execution_context before starting.
</required_reading>

<process>

<step name="load_seeds">
Load seed context. An optional status filter (e.g. `dormant`, `active`, `triggered`) may follow `--list-seeds`.

```bash
SEEDS=$(gsd_run list-seeds "$STATUS_FILTER")
if [[ "$SEEDS" == @file:* ]]; then SEEDS=$(cat "${SEEDS#@file:}"); fi
```

Replace `$STATUS_FILTER` with the filter token from `$ARGUMENTS` if one was given, otherwise omit it.

Extract from the JSON: `count`, `seeds[]` (each has `seed_id`, `status`, `scope`, `trigger_when`, `planted`, `title`), and `summary` (a `{ status: count }` map).
</step>

<step name="empty_case">
If `count` is 0:
```
No seeds found.

Plant one with `gsd-serena-bridge capture --format markdown` --seed "<forward-looking idea>".
```
(If a status filter was given and nothing matched, say so: `No seeds with status "<filter>".`) Exit.
</step>

<step name="render_table">
Render the seeds as a table, sorted by `seed_id` (already sorted by the tool). Truncate `trigger_when` and `title` to keep the table readable.

```
Seeds
─────────────────────────────────────────────────────────────────────
ID        Status     Scope    Trigger                  Title
SEED-001  dormant    large    when websockets land     Real-time collaboration
SEED-006  triggered  medium   MILE-04 planning         Remove legacy auth crates
─────────────────────────────────────────────────────────────────────
<count> seeds  (<summary rendered as "N status" pairs, e.g. "1 dormant, 1 triggered">)
```

Then offer next actions as plain text (no mutation here):
```
- `gsd-serena-bridge capture --format markdown` --seed --enrich <ID>   enrich a seed with trigger, why, and scope
- `gsd-serena-bridge capture --format markdown` --list-seeds <status>  filter by status
```
</step>

</process>

<success_criteria>
- [ ] Seeds listed with ID, status, scope, trigger, and title
- [ ] Status filter applied when provided
- [ ] Empty / no-match case handled with guidance
- [ ] Summary line shows total and per-status counts
- [ ] No seed files were modified (read-only)
</success_criteria>

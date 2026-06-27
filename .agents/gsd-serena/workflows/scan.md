# Bridge Workflow: scan

<!-- generated-by: pnpm gen:bridge-commands -->

## Purpose

This bridge workflow runbook translates the actual GSD-core workflow information and adapts it for Serena bridge operation. Read it when operating `gsd-workflow-scan` in a target project.

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

- Contract ID: `gsd-workflow-scan`
- Status: `planned`
- Source path: `gsd-core/workflows/scan.md`
- Resolved source path: `vendor/reference/gsd-core/gsd-core/workflows/scan.md`
- Mirrored runbook path: `.agents/gsd-serena/workflows/scan.md`

## Translated GSD Workflow

### Native Shim Translation
- Native GSD shim locator omitted: the bridge uses the installed `gsd-serena-bridge` CLI, `bootstrap`, `doctor`, `repair`, resolver packets, and install-managed project surfaces instead of locating `gsd-tools.cjs`.
<purpose>
Lightweight codebase assessment. Spawns a single gsd-codebase-mapper agent for one focus area,
producing targeted documents in `.planning/codebase/`.
</purpose>

<required_reading>
Read all files referenced by the invoking prompt's execution_context before starting.
</required_reading>

<available_agent_types>
Valid GSD subagent types (use exact names — do not fall back to 'general-purpose'):
- gsd-codebase-mapper — Maps project structure and dependencies
</available_agent_types>

<process>

## Focus-to-Document Mapping

| Focus | Documents Produced |
|-------|-------------------|
| `tech` | STACK.md, INTEGRATIONS.md |
| `arch` | ARCHITECTURE.md, STRUCTURE.md |
| `quality` | CONVENTIONS.md, TESTING.md |
| `concerns` | CONCERNS.md |
| `tech+arch` | STACK.md, INTEGRATIONS.md, ARCHITECTURE.md, STRUCTURE.md |

## Step 1: Parse arguments and resolve focus

Parse the user's input for `--focus <area>`. Default to `tech+arch` if not specified.

Validate that the focus is one of: `tech`, `arch`, `quality`, `concerns`, `tech+arch`.

If invalid:
```
Unknown focus area: "{input}". Valid options: tech, arch, quality, concerns, tech+arch
```
Exit.

## Step 2: Check for existing documents

```bash
- Native query translated: `INIT=$(gsd_run query init.map-codebase 2>/dev/null || echo "{}")` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

Look up which documents would be produced for the selected focus (from the mapping table above).

For each target document, check if it already exists in `.planning/codebase/`:
```bash
ls -la .planning/codebase/{DOCUMENT}.md 2>/dev/null
```

If any exist, show their modification dates and ask:
```
Existing documents found:
- STACK.md (modified 2026-04-03)
- INTEGRATIONS.md (modified 2026-04-01)

Overwrite with fresh scan? [y/N]
```

If user says no, exit.

## Step 3: Create output directory

```bash
mkdir -p .planning/codebase
```

## Step 4: Spawn mapper agent

Spawn a single `gsd-codebase-mapper` agent with the selected focus area:

Print: `◆ Spawning scanner... (runs in a subagent — no output until it returns, ~1–5 min; expected, not a freeze)`

```
- Native agent dispatch translated: `Agent(` -> use Serena role workflow / generated role skill / sequential role pass with handoff.
prompt="Scan this codebase with focus: {focus}. Write results to .planning/codebase/. Produce only: {document_list}",
subagent_type="gsd-codebase-mapper",
model="{resolved_model}"
)
```

- Native agent dispatch translated: `> **ORCHESTRATOR RULE — CODEX RUNTIME**: After calling Agent() above, stop working on this task immediately. Do not read more files, edit code, or run tests related to this task while the subagent is active. Wait for the subagent to return its result. This prevents duplicate work, conflicting edits, and wasted context. Only resume when the subagent result is available.` -> use Serena role workflow / generated role skill / sequential role pass with handoff.

## Step 5: Report

```
## Scan Complete

**Focus:** {focus}
**Documents produced:**
{list of documents written with line counts}

Use ``gsd-serena-bridge map-codebase --format markdown`` for a comprehensive 4-area parallel scan.
```

</process>

<success_criteria>
- [ ] Focus area correctly parsed (default: tech+arch)
- [ ] Existing documents detected with modification dates shown
- [ ] User prompted before overwriting
- [ ] Single mapper agent spawned with correct focus
- [ ] Output documents written to .planning/codebase/
</success_criteria>

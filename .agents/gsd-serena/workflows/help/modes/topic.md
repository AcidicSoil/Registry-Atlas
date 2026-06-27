# Bridge Workflow: help-modes-topic

<!-- generated-by: pnpm gen:bridge-commands -->

## Purpose

This bridge workflow runbook translates the actual GSD-core workflow information and adapts it for Serena bridge operation. Read it when operating `gsd-workflow-help-modes-topic` in a target project.

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

- Contract ID: `gsd-workflow-help-modes-topic`
- Status: `planned`
- Source path: `gsd-core/workflows/help/modes/topic.md`
- Resolved source path: `vendor/reference/gsd-core/gsd-core/workflows/help/modes/topic.md`
- Mirrored runbook path: `.agents/gsd-serena/workflows/help/modes/topic.md`

## Translated GSD Workflow

<purpose>
Emit a section from the full reference for the topic in `$ARGUMENTS`. Read `workflows/help/modes/full.md`, resolve the topic alias to a section heading using the table below, and output the resolved-routing preamble plus the section content. Scope is contro...
</purpose>

<reference>
**Topic resolution table.** Match the topic alias case-insensitively. Strip a single leading `--` if present.

| Topic alias(es) | Section heading in `full.md` |
|---|---|
| `workflow`, `core`, `core-workflow` | `## Core Workflow` (entire section through end of `### Quick Mode`) |
| `init`, `new-project` | `### Project Initialization` |
| `map`, `map-codebase` | The ``gsd-serena-bridge map-codebase --format markdown`` block under `### Project Initialization` |
| `discuss`, `discuss-phase` | The ``gsd-serena-bridge discuss-phase --format markdown`` block under `### Phase Planning` |
| `plan`, `planning`, `plan-phase` | `### Phase Planning` |
| `execute`, `exec`, `execute-phase` | `### Execution` |
| `progress`, `route` | `### Progress Tracking` plus `### Smart Router` |
| `quick`, `quick-mode` | `### Quick Mode` |
| `fast` | The ``gsd-serena-bridge fast --format markdown`` block under `### Quick Mode` |
| `phase`, `phases`, `roadmap` | `### Roadmap Management` |
| `milestone`, `milestones` | `### Milestone Management` plus `### Milestone Auditing` |
| `session`, `pause`, `resume` | `### Session Management` |
| `debug`, `debugging` | `### Debugging` |
| `spike` | The ``gsd-serena-bridge spike --format markdown`` and ``gsd-serena-bridge spike --format markdown` --wrap-up` blocks under `### Spiking & Sketching` |
| `sketch` | The ``gsd-serena-bridge sketch --format markdown`` and ``gsd-serena-bridge sketch --format markdown` --wrap-up` blocks under `### Spiking & Sketching` |
| `spike-sketch`, `experiments` | `### Spiking & Sketching` |
| `capture`, `notes`, `todos` | `### Capturing Ideas, Notes, and Todos` |
| `verify`, `verify-work`, `uat` | `### User Acceptance Testing` plus the ``gsd-serena-bridge audit-uat --format markdown`` block |
| `ship`, `pr` | `### Ship Work` plus the ``gsd-serena-bridge pr-branch --format markdown`` block |
| `review`, `peer-review` | The ``gsd-serena-bridge review --format markdown`` block under `### Ship Work` |
| `audit`, `auditing`, `audit-milestone` | `### Milestone Auditing` |
| `config`, `settings`, `configuration` | `### Configuration` |
| `cleanup` | The ``gsd-serena-bridge cleanup --format markdown`` block under `### Utility Commands` |
| `update` | The ``gsd-serena-bridge update --format markdown`` block under `### Utility Commands` |
| `files`, `structure`, `layout` | `## Files & Structure` |
| `modes`, `interactive`, `yolo` | `## Workflow Modes` |
| `planning-config` | `## Planning Configuration` |
| `workflows`, `common-workflows`, `examples` | `## Common Workflows` |
| `help` | `## Getting Help` |

**Output rules:**

1. Parse `$ARGUMENTS`: detect a `--brief` (or `-b`) flag — this selects **compact scope**. Otherwise scope is **full**. Strip the flag, then take the remaining token (with a single leading `--` stripped) as the topic alias.
2. Resolve the alias against the table.
3. If no match: emit a one-line error followed by a comma-separated list of the canonical topic names from the leftmost column (one per row, deduplicated). Suggest ``gsd-serena-bridge help --format markdown` --full` for the complete reference. Stop.
4. If matched: emit a single resolved-routing preamble line so the user sees what was matched:

```text
**Topic:** `<alias>` → `<heading>` *(scope: full | compact)*
```

Use the canonical alias from the leftmost column. Use the literal heading text from the matched cell. State the scope you are about to emit.

5. Read `workflows/help/modes/full.md`. Strip `<reference>` / `</reference>` wrapper tags — never emit them. Apply the extraction rule for the matched table cell, modulated by scope:

5a. **Single section** (cell contains a single `` `## Heading` `` or `` `### Heading` ``):
- *Full scope:* emit from that heading up to (but not including) the next sibling or higher-level heading.
- *Compact scope:* emit the heading, then the first `` **`/gsd:...`** `` bold line within the section (the signature) and the single non-blank line immediately after it (the one-line summary). If the section has no `` **`/gsd:...`** `` bold line, emit the heading and the first paragraph.

5b. **Multiple sections joined by "plus"**: apply rule 5a to each listed section in document order and emit them sequentially with no gap between them.

5c. **Sub-block** (cell says `the `gsd-serena-bridge X --format markdown` block under ### Heading` or `the `gsd-serena-bridge X --format markdown` ... blocks under ### Heading`): within the named heading's section, start at each `` **``gsd-serena-bridge X --format markdown` ...`** `` bold line.
- *Full scope:* stop immediately before the next `` **`/gsd:...`** `` bold line or the next heading, whichever comes first.
- *Compact scope:* emit the bold line and the single non-blank line immediately after it (the one-line summary).

For cells listing multiple sub-blocks, emit them sequentially.

6. After the section content, emit a single closing line:

```text
More: `gsd-serena-bridge help --format markdown` --full · `gsd-serena-bridge help --format markdown` <topic> · `gsd-serena-bridge help --format markdown` --brief <topic>
```

7. No project-specific commentary, no follow-up questions.
</reference>

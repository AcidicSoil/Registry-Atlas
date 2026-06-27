---
name: gsd:mempalace-recall
description: "Use when operating the mempalace-recall bridge command in a bridge-installed target project and needing source-informed GSD-safe procedural guidance."
promptsnippets:
  command: "gsd-serena-bridge mempalace-recall {{phase}} --format markdown"
  variables:
    - name: "phase"
      required: false
      placeholder: "{{phase}}"
      description: "Phase directory name."
  slashAliases:
    - "/gsd:mempalace-recall"
  skillReferences:
    - ".agents/gsd-serena/commands/gsd/mempalace-recall.md"
---

<!-- generated-by: pnpm gen:bridge-commands -->

# 

## Purpose

This is the bridge command Markdown artifact for `gsd-command-mempalace-recall`. Vendor GSD-core commands are Markdown files; this generated file keeps that model as the first-class command artifact. Command `SKILL.md` outputs are intentionally not generated; command Markdown is the command runtime authority.

## Bridge Adaptation Overlay

Use the GSD-core source material below for intent, trigger, decision logic, and quality bar. Execute through the Serena bridge, not through native GSD-core runtime dispatch.

### Command Mapping

- Native slash command intent maps to: `gsd-serena-bridge mempalace-recall --format markdown`.

### Runtime Substitutions

- Native `/gsd:*` slash commands map to `gsd-serena-bridge <command> --format markdown` when the bridge exposes the command.
- Native `gsd_run query ...` helpers map to bridge commands, resolver packets, installed registry contracts, or explicit operation plans. Do not invent a missing query result.
- Native `Agent(...)` / subagent dispatch maps to installed GSD agent contracts under `.agents/gsd-serena/agents/**`, vendor-shaped GSD runtime skills under `.agents/gsd-serena/skills/gsd-*/SKILL.md`, Serena role passes, or explicit checkpoints.
- Native Skill references map to vendor-shaped GSD runtime skills under `.agents/gsd-serena/skills/gsd-*/SKILL.md`, GSD references under `.agents/gsd-serena/gsd-core/references/**`, and workflow runbooks under `.agents/gsd-serena/workflows/**`.
- Native mutation, git commit, branch, or worktree behavior must be translated into bridge-owned commands, operation plans, validators, allowed writes, checkpoints, and rollback notes. Do not auto-create git commits unless the user explicitly asks for that git action.


### Execution Rule

Proceed through the bridge entrypoint or resolver, then follow bridge output exactly. Treat adapted-safe behavior as intentionally safe substitution, not native parity.

## Preflight

Run this from the target project root unless the user is explicitly asking about the bridge source repository.

1. Check setup and current direction when the session is new or setup freshness is unclear:

   ```bash
   gsd-serena-bridge bootstrap --format markdown
   ```

2. If bootstrap or doctor reports stale/broken bridge-owned install-managed surfaces, automatically repair and recheck before continuing:

   ```bash
   gsd-serena-bridge repair --format markdown
   gsd-serena-bridge doctor --format markdown
   ```

3. Repair is limited to bridge-owned installed surfaces such as `.agents/gsd-serena/**`, bridge `.serena/**` setup, and managed bridge blocks in `AGENTS.md` / `.gitignore`.
4. Do not treat repair as permission to overwrite user-owned `.planning/STATE.md`, native `.gsd/**`, or product files.
5. Status decision for this command artifact: Proceed through the bridge entrypoint or resolver, then follow bridge output exactly. Treat adapted-safe behavior as intentionally safe substitution, not native parity.

## Procedure

1. Read the GSD Source Translation below first. Extract the native trigger, purpose, required reading, process steps, and completion criteria.
2. Apply the Bridge Adaptation Overlay above before executing anything.
3. Restate the user's goal in one sentence and map it to this command: `mempalace-recall`.
4. Complete the preflight above. If repair was needed, rerun doctor before continuing.
5. Read required inputs before writing anything. Required reads for this command:
   - none
6. If the user's request is natural-language or ambiguous, run resolver first and use the returned packet/command:

   ```bash
   cat <<'EOF_REQUEST' | gsd-serena-bridge resolve --stdin --format markdown
   <verbatim user request>
   EOF_REQUEST
   ```

7. Run or prepare the implemented bridge command from the project root:

   ```bash
   gsd-serena-bridge mempalace-recall --format markdown
   ```

   If the command needs arguments, inspect `gsd-serena-bridge mempalace-recall --help` or use the resolver packet instead of guessing.
8. Follow the command output, packet, and next-action instructions. If a packet is produced, obey its allowed writes, forbidden writes, required reads, expected artifacts, validation command, and transition rule.
9. Do not mutate files outside this command artifact's boundaries unless bridge output explicitly authorizes it or the user gives a narrow override with validation.

## Decision Flow

- If status is `supported` or `adapted-safe`: use the bridge entrypoint/resolver and report the bridge command or substitute actually used.
- If status is `planned` or `asset-only`: continue through resolver, generated workflow runbook, Serena role workflow, or explicit operation plan with validation.
- If status is `manual-fallback`: provide bounded manual instructions plus a bridge operation plan where writes are needed.
- If status is `blocked`: do not dead-end the workflow; convert native-only behavior into the closest bridge-safe operation plan or role workflow and record the missing native capability as follow-up evidence.
- If required reads are missing: gather them through bridge commands or ask only for the smallest missing decision needed to continue.
- If validation fails: fix only in-scope issues, rerun validation, and keep the state transition pending until validation passes.

## Validation and Completion

No command-specific validation is declared in the contract. Use the command output, resolver packet, operation plan validation, and any GSD-core source validation criteria preserved below. Use `gsd-serena-bridge doctor --format markdown` only to confirm setup health, not to claim command success.

Before reporting done, include:

- the GSD source translation sections used;
- the bridge command, resolver packet, operation plan, or role workflow used;
- files read and changed;
- validation commands and outcomes;
- state transition status, if any;
- remaining adapted-safe gaps or native GSD behavior not implemented by the bridge.

## Recovery

- Setup stale or broken: run repair, then doctor, then bootstrap/state-next before continuing.
- Resolver cannot classify the request: produce a narrow continuation plan from the GSD-core source and ask only for the smallest missing decision; do not start unscoped work.
- Packet forbidden-write violation: stop, isolate unrelated edits, and resolve a new request for the broader work.
- Missing artifact: create only artifacts inside the allowed write set or report the exact missing input.
- Native GSD behavior requested but not implemented: execute the bridge substitute through a command, workflow runbook, role workflow, or explicit operation plan; cite the contract status `adapted-safe`, explain the safe bridge substitute, and record a future parity slice.

## Boundaries

### Required Reads

- none

### Allowed Writes

- none

### Forbidden Writes

- `.git/**`
- `.github/**`
- `node_modules/**`
- `vendor/**`

### Expected Created Artifacts

- none

### Expected Updated Artifacts

- none

### Optional Artifacts

- none

## Runtime Capability

- Runtime status: `external-adapter`
- Contract row: `command:mempalace-recall`
- Test fixture path: `tests/fixtures/runtime-capability/commands/mempalace-recall`
- Required command: `gsd-serena-bridge mempalace-recall --format markdown`
- Dry-run command: `gsd-serena-bridge mempalace-recall --format markdown`
- Apply command: `gsd-serena-bridge mempalace-recall <phase> --apply --fake-memory --confirm-external --format markdown`
- Read actions:
- `.planning/STATE.md`
- `.planning/ROADMAP.md`
- `.planning/phases/<phase>/**`
- Write actions:
- `.planning/phases/<phase>/**`
- External actions:
- `adapter-gated external service or reviewer interaction`
- Git actions:
- none
- GitHub actions:
- `adapter-gated GitHub issue/PR/label/comment operation`
- Agent actions:
- none
- Runtime validation commands:
- `pnpm vitest run tests/gsd-serena/commands/mempalace.test.ts`

## GSD Source Translation

The source-derived guidance below is translated for the Serena bridge. Native runtime locator code, shim functions, direct `gsd-tools.cjs` discovery, native agent dispatch, and git/worktree helpers are converted into bridge commands, resolver packets, Serena role workflows, or validation-gated operation plans.

### compatibility-matrix

Recorded path: `vendor/reference/gsd-core/commands/gsd/mempalace-recall.md`; resolved path: `vendor/reference/gsd-core/commands/gsd/mempalace-recall.md`.

**STOP -- DO NOT READ THIS FILE. You are already reading it. This prompt was injected into your context by the command system. Using the Read tool on this file wastes tokens. Begin executing Step 0 immediately.**

## Step 0 -- Banner

**Before ANY tool calls**, display this banner:

```
GSD > MEMPALACE RECALL
```

Then proceed to Step 1.

## Step 1 -- Config Gate

Check whether the MemPalace capability is enabled by reading `.planning/config.json` directly with the Read tool.

**DO NOT use `gsd-tools config get-value`** -- it hard-exits on missing keys.

1. Read `.planning/config.json` with the Read tool.
2. If the file does not exist: write the "unavailable" stub (Step 4) and **STOP**.
3. Parse the JSON. Proceed to Step 2 only if `config.mempalace && config.mempalace.enabled === true` **and** `config.mempalace.recall_on_plan !== false`. Otherwise display the disabled message and **STOP** (`recall_on_plan: false` turns plan-time recall off...

**Disabled message:**

```
GSD > MEMPALACE RECALL

MemPalace memory is disabled. To activate:

node <runtime-home>/gsd-core/bin/gsd-tools.cjs config-set mempalace.enabled true

Recall is opt-in; the loop proceeds normally without it.
```

This step is `onError: skip` at `plan:pre` -- recall never blocks planning.

## Step 2 -- Resolve wing, mode, and transport

1. **Wing.** Use `config.mempalace.wing` if non-empty; otherwise derive from `config.project_code`; otherwise fall back to the repository directory name.
2. **Mode.** Read `config.mempalace.memory_mode` (`augment` | `kg_backend` | `replace`, default `augment`). Only `augment` is wired today, so recall always treats the palace as additive; `kg_backend`/`replace` are forward-declared and behave as `augment`.
3. **Transport.** Prefer the **MCP tools** (`mempalace_*`) in interactive runs *when your MemPalace MCP server is registered and your runtime permits those tools*. Otherwise — headless/cron/autonomous runs, or runtimes that don't grant the MemPalace MCP too...
4. **Topic.** Read the phase `CONTEXT.md` (the consumed artifact). Derive a short search query from its title, goal, and key decisions.

## Step 3 -- Retrieve (read-only)

All calls in this step are side-effect-free. On any error or timeout, stop retrieving and write whatever was gathered (or the stub) -- never raise.

1. **Wake up** (cheap, ~600--900 tokens):
- Interactive: read the wing identity/summary, then `mempalace_search`.
- Headless: `mempalace wake-up --wing <wing>`.
2. **Targeted search:**
- Interactive: `mempalace_search(query=<topic>, wing=<wing>)`.
- Headless: `mempalace search "<topic>" --wing <wing>`.
3. **Knowledge-graph facts** (when `config.mempalace.mirror_kg` is true): `mempalace_kg_query` / `mempalace_kg_timeline` for decisions relevant to the topic and their validity windows. Only `augment` is currently wired, so the palace KG *supplements* GSD's ...
4. **Dedup** the returned drawers/facts; keep the top results.

## Step 4 -- Write MEMORY-RECALL.md

Write `MEMORY-RECALL.md` in the current phase directory. The planner consumes it.

When recall succeeded, structure it as:

```markdown
# Memory Recall (MemPalace)

_Wing: <wing> · Mode: <mode> · Transport: <mcp|cli>_

## Prior decisions
- <decision> — <provenance: drawer id / kg fact, valid_from>

## Patterns
- <pattern> — <provenance>

## Surprises / gotchas
- <surprise> — <provenance>
```

When MemPalace is unreachable, write the stub and continue:

```markdown
# Memory Recall (MemPalace)

_MemPalace unavailable at recall time — proceeding without recalled memory._
```

## Anti-Patterns

1. DO NOT let any MemPalace error fail the step -- recall is `onError: skip`.
2. DO NOT write to the palace from this skill -- recall is read-only; capture is a separate skill.
3. DO NOT paste raw search output into the file -- distil to decisions/patterns/surprises with provenance.
4. DO NOT skip the config gate.

## Contract Reference

- Contract ID: `gsd-command-mempalace-recall`
- Family: `command`
- Status: `adapted-safe`
- Runtime authority: `.agents/gsd-serena/parity-skills/contracts.json`
- Transition rule: planned — Command row has compatibility coverage but no exact command behavior contract yet.

### Bridge Entrypoints

- `mempalace-recall`

### Source Evidence

- `vendor/reference/gsd-core/commands/gsd/mempalace-recall.md` (compatibility-matrix) -> `vendor/reference/gsd-core/commands/gsd/mempalace-recall.md`

### Unsafe Reference Behaviors

- none recorded

### Test Evidence

- Status: `planned`
- Commands:
- none
- Notes: Requires future exact behavior promotion before claiming runtime artifacts.

### Notes

- Bridge mempalace-recall reports recall readiness and now mirrors query/write modes as instruction guidance.
- Vendor recall intent is mirrored through query terms, memory relevance/confidence/conflict review, and MEMORY-RECALL draft guidance without automatic external memory queries or writes.
- Bridge mempalace-recall now includes a structured Serena memory/session/manager/autonomy operation plan with bounded local state, write sets, command budgets, external integration boundaries, checkpoints, rollback, and session/memory/triage/autonomy role workflow evidence while preserving existing safety gates.

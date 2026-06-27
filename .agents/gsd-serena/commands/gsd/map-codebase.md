---
name: gsd:map-codebase
description: "Use when operating the map-codebase bridge command in a bridge-installed target project and needing source-informed GSD-safe procedural guidance."
promptsnippets:
  command: "gsd-serena-bridge map-codebase --format markdown"
  variables:
    []
  slashAliases:
    - "/gsd:map-codebase"
  skillReferences:
    - ".agents/gsd-serena/commands/gsd/map-codebase.md"
---

<!-- generated-by: pnpm gen:bridge-commands -->

# Analyze codebase with parallel mapper agents to produce .planning/codebase/ documents

## Purpose

This is the bridge command Markdown artifact for `gsd-command-map-codebase`. Vendor GSD-core commands are Markdown files; this generated file keeps that model as the first-class command artifact. Command `SKILL.md` outputs are intentionally not generated; command Markdown is the command runtime authority.

## Bridge Adaptation Overlay

Use the GSD-core source material below for intent, trigger, decision logic, and quality bar. Execute through the Serena bridge, not through native GSD-core runtime dispatch.

### Command Mapping

- Native slash command intent maps to: `gsd-serena-bridge map-codebase --format markdown`.

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
3. Restate the user's goal in one sentence and map it to this command: `map-codebase`.
4. Complete the preflight above. If repair was needed, rerun doctor before continuing.
5. Read required inputs before writing anything. Required reads for this command:
   - `.planning/STATE.md`
   - `README.md`
   - `package.json`
6. If the user's request is natural-language or ambiguous, run resolver first and use the returned packet/command:

   ```bash
   cat <<'EOF_REQUEST' | gsd-serena-bridge resolve --stdin --format markdown
   <verbatim user request>
   EOF_REQUEST
   ```

7. Run or prepare the implemented bridge command from the project root:

   ```bash
   gsd-serena-bridge map-codebase --format markdown
   ```

   If the command needs arguments, inspect `gsd-serena-bridge map-codebase --help` or use the resolver packet instead of guessing.
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

Run the declared validation commands after in-scope work:
- `gsd-serena-bridge validate map-codebase --format json`

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
- Native GSD behavior requested but not implemented: execute the bridge substitute through a command, workflow runbook, role workflow, or explicit operation plan; cite the contract status `supported`, explain the safe bridge substitute, and record a future parity slice.

## Boundaries

### Required Reads

- `.planning/STATE.md`
- `README.md`
- `package.json`

### Allowed Writes

- `.planning/codebase/**`

### Forbidden Writes

- `.git/**`
- `.github/**`
- `node_modules/**`
- `vendor/**`

### Expected Created Artifacts

- `.planning/codebase/ARCHITECTURE.md`
- `.planning/codebase/CONCERNS.md`
- `.planning/codebase/CONVENTIONS.md`
- `.planning/codebase/INTEGRATIONS.md`
- `.planning/codebase/STACK.md`
- `.planning/codebase/STRUCTURE.md`
- `.planning/codebase/TESTING.md`

### Expected Updated Artifacts

- `Existing .planning/codebase/*.md files may be refreshed when rerunning a map packet.`

### Optional Artifacts

- none

## Runtime Capability

- Runtime status: `local-equivalent`
- Contract row: `command:map-codebase`
- Test fixture path: `tests/fixtures/runtime-capability/commands/map-codebase`
- Required command: `gsd-serena-bridge map-codebase --format markdown`
- Dry-run command: `gsd-serena-bridge map-codebase --format markdown`
- Apply command: `gsd-serena-bridge map-codebase --write --format markdown`
- Read actions:
- `.planning/STATE.md`
- `.planning/ROADMAP.md`
- `.planning/phases/<phase>/**`
- Write actions:
- `.planning/phases/<phase>/**`
- External actions:
- none
- Git actions:
- none
- GitHub actions:
- none
- Agent actions:
- none
- Runtime validation commands:
- `pnpm vitest run tests/gsd-serena/runtime-capability/map-codebase.test.ts`

## GSD Source Translation

The source-derived guidance below is translated for the Serena bridge. Native runtime locator code, shim functions, direct `gsd-tools.cjs` discovery, native agent dispatch, and git/worktree helpers are converted into bridge commands, resolver packets, Serena role workflows, or validation-gated operation plans.

### vendor-command

Recorded path: `vendor/reference/gsd-core/commands/gsd/map-codebase.md`; resolved path: `vendor/reference/gsd-core/commands/gsd/map-codebase.md`.

<objective>
Analyze existing codebase using parallel gsd-codebase-mapper agents to produce structured codebase documents.

Each mapper agent explores a focus area and **writes documents directly** to `.planning/codebase/`. The orchestrator only receives confirmations, keeping context usage minimal.

Output: .planning/codebase/ folder with 7 structured documents about the codebase state.
</objective>

<execution_context>
- GSD-core workflow import retained: `@~/.claude/gsd-core/workflows/map-codebase.md`. Use the mirrored bridge workflow runbook under `.agents/gsd-serena/workflows/**` for adapted execution.
</execution_context>

<flags>
- **--fast**: Lightweight scan mode — spawns one mapper agent instead of four. Accepts an optional `--focus` value: `tech`, `arch`, `quality`, `concerns`, or `tech+arch` (default). Faster and lower-context than the full map.
- **--query**: Codebase intelligence query mode. Sub-commands: `query <term>`, `status`, `diff`, `refresh`. Requires intel to be enabled in config (`intel.enabled: true`). Runs inline for query/status/diff; spawns an agent for refresh.
- **(no flag)**: Full parallel map — spawns 4 mapper agents to produce all 7 codebase documents.
</flags>

<context>
Arguments: $ARGUMENTS

Parse the first token of $ARGUMENTS:
- If it is `--fast`: strip the flag, run the scan workflow (passing remaining args including optional --focus).
- If it is `--query`: strip the flag, run the intel workflow (passing remaining args as the subcommand).
- Otherwise: pass all of $ARGUMENTS as focus area to the map-codebase workflow.

**Load project state if exists:**
Check for .planning/STATE.md - loads context if project already initialized

**This command can run:**
- Before `gsd-serena-bridge new-project --format markdown` (brownfield codebases) - creates codebase map first
- After `gsd-serena-bridge new-project --format markdown` (greenfield codebases) - updates codebase map as code evolves
- Anytime to refresh codebase understanding
</context>

<when_to_use>
**Use map-codebase for:**
- Brownfield projects before initialization (understand existing code first)
- Refreshing codebase map after significant changes
- Onboarding to an unfamiliar codebase
- Before major refactoring (understand current state)
- When STATE.md references outdated codebase info

**Skip map-codebase for:**
- Greenfield projects with no code yet (nothing to map)
- Trivial codebases (<5 files)
</when_to_use>

<process>
1. Check if .planning/codebase/ already exists (offer to refresh or skip)
2. Create .planning/codebase/ directory structure
3. Spawn 4 parallel gsd-codebase-mapper agents:
- Agent 1: tech focus → writes STACK.md, INTEGRATIONS.md
- Agent 2: arch focus → writes ARCHITECTURE.md, STRUCTURE.md
- Agent 3: quality focus → writes CONVENTIONS.md, TESTING.md
- Agent 4: concerns focus → writes CONCERNS.md
4. Wait for agents to complete, collect confirmations (NOT document contents)
5. Verify all 7 documents exist with line counts
6. Commit codebase map
7. Offer next steps (typically: `gsd-serena-bridge new-project --format markdown` or `gsd-serena-bridge plan-phase --format markdown`)
</process>

<success_criteria>
- [ ] .planning/codebase/ directory created
- [ ] All 7 codebase documents written by mapper agents
- [ ] Documents follow template structure
- [ ] Parallel agents completed without errors
- [ ] User knows next steps
</success_criteria>

### bridge-command-contract

Recorded path: `.agents/gsd-serena/commands/map-codebase.json` could not be resolved in the committed vendor reference.

_No readable source content available._

## Contract Reference

- Contract ID: `gsd-command-map-codebase`
- Family: `command`
- Status: `supported`
- Runtime authority: `.agents/gsd-serena/parity-skills/contracts.json`
- Transition rule: transition init -> mapped; requires validation: yes

### Bridge Entrypoints

- `map-codebase`

### Source Evidence

- `vendor/reference/gsd-core/commands/gsd/map-codebase.md` (vendor-command) -> `vendor/reference/gsd-core/commands/gsd/map-codebase.md`
- `.agents/gsd-serena/commands/map-codebase.json` (bridge-command-contract)

### Unsafe Reference Behaviors

- none recorded

### Test Evidence

- Status: `focused-test`
- Commands:
- `gsd-serena-bridge validate map-codebase --format json`
- Notes: Exact command behavior comes from bridge behavior contracts.

### Notes

- Current bridge entrypoint has a packet path; audited reference parity gaps remain explicit at flag level.

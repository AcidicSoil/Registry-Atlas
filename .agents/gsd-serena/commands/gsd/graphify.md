---
name: gsd:graphify
description: "Use when operating the graphify bridge command in a bridge-installed target project and needing source-informed GSD-safe procedural guidance."
promptsnippets:
  command: "gsd-serena-bridge graphify --format markdown"
  variables:
    []
  slashAliases:
    - "/gsd:graphify"
  skillReferences:
    - ".agents/gsd-serena/commands/gsd/graphify.md"
---

<!-- generated-by: pnpm gen:bridge-commands -->

# Build, query, and inspect the project knowledge graph in .planning/graphs/

## Purpose

This is the bridge command Markdown artifact for `gsd-command-graphify`. Vendor GSD-core commands are Markdown files; this generated file keeps that model as the first-class command artifact. Command `SKILL.md` outputs are intentionally not generated; command Markdown is the command runtime authority.

## Bridge Adaptation Overlay

Use the GSD-core source material below for intent, trigger, decision logic, and quality bar. Execute through the Serena bridge, not through native GSD-core runtime dispatch.

### Command Mapping

- Native slash command intent maps to: `gsd-serena-bridge graphify --format markdown`.

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
3. Restate the user's goal in one sentence and map it to this command: `graphify`.
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
   gsd-serena-bridge graphify --format markdown
   ```

   If the command needs arguments, inspect `gsd-serena-bridge graphify --help` or use the resolver packet instead of guessing.
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
- Contract row: `command:graphify`
- Test fixture path: `tests/fixtures/runtime-capability/commands/graphify`
- Required command: `gsd-serena-bridge graphify --format markdown`
- Dry-run command: `gsd-serena-bridge graphify --format markdown`
- Apply command: `gsd-serena-bridge graphify --apply --confirm --format markdown`
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
- `pnpm vitest run tests/gsd-serena/runtime-capability/graphify.test.ts`

## GSD Source Translation

The source-derived guidance below is translated for the Serena bridge. Native runtime locator code, shim functions, direct `gsd-tools.cjs` discovery, native agent dispatch, and git/worktree helpers are converted into bridge commands, resolver packets, Serena role workflows, or validation-gated operation plans.

### vendor-command

Recorded path: `vendor/reference/gsd-core/commands/gsd/graphify.md`; resolved path: `vendor/reference/gsd-core/commands/gsd/graphify.md`.

### Native Shim Translation
- Native GSD shim locator omitted: the bridge uses the installed `gsd-serena-bridge` CLI, `bootstrap`, `doctor`, `repair`, resolver packets, and install-managed project surfaces instead of locating `gsd-tools.cjs`.

**STOP -- DO NOT READ THIS FILE. You are already reading it. This prompt was injected into your context by Claude Code's command system. Using the Read tool on this file wastes tokens. Begin executing Step 0 immediately.**

**CJS-only (graphify):** `graphify` subcommands are not registered on `gsd-tools query`. Use the `gsd_run` launcher shim (defined in each bash block below) or invoke the binary directly: `node <runtime-home>/gsd-core/bin/gsd-tools.cjs graphify …` where `<ru...

## Step 0 -- Banner

**Before ANY tool calls**, display this banner:

```
GSD > GRAPHIFY
```

Then proceed to Step 1.

## Step 1 -- Config Gate

Check if graphify is enabled by reading `.planning/config.json` directly using the Read tool.

**DO NOT use the gsd-tools config get-value command** -- it hard-exits on missing keys.

1. Read `.planning/config.json` using the Read tool
2. If the file does not exist: display the disabled message below and **STOP**
3. Parse the JSON content. Check if `config.graphify && config.graphify.enabled === true`
4. If `graphify.enabled` is NOT explicitly `true`: display the disabled message below and **STOP**
5. If `graphify.enabled` is `true`: proceed to Step 2

**Disabled message:**

```
GSD > GRAPHIFY

Knowledge graph is disabled. To activate:

node <runtime-home>/gsd-core/bin/gsd-tools.cjs config-set graphify.enabled true

Then run `gsd-serena-bridge graphify --format markdown` build to create the initial graph.
```

---

## Step 2 -- Parse Argument

Parse `$ARGUMENTS` to determine the operation mode:

| Argument | Action |
|----------|--------|
| `build` | Run inline build (Step 3) |
| `query <term>` | Run inline query (Step 2a) |
| `status` | Run inline status check (Step 2b) |
| `diff` | Run inline diff check (Step 2c) |
| No argument or unknown | Show usage message |

**Usage message** (shown when no argument or unrecognized argument):

```
GSD > GRAPHIFY

Usage: `gsd-serena-bridge graphify --format markdown` <mode>

Modes:
build           Build or rebuild the knowledge graph
query <term>    Search the graph for a term
status          Show graph freshness and statistics
diff            Show changes since last build
```

### Step 2a -- Query

Run:

```bash
- Native graphify call translated: `gsd_run graphify query <term>` -> use `gsd-serena-bridge graphify --format markdown` or a graphify operation plan when mutation/build is requested.
```

Parse the JSON output and display results:
- If the output contains `"disabled": true`, display the disabled message from Step 1 and **STOP**
- If the output contains `"error"` field, display the error message and **STOP**
- If no nodes found, display: `No graph matches for '<term>'. Try `gsd-serena-bridge graphify --format markdown` build to create or rebuild the graph.`
- Otherwise, display matched nodes grouped by type, with edge relationships and confidence tiers (EXTRACTED/INFERRED/AMBIGUOUS)

**STOP** after displaying results. Do not spawn an agent.

### Step 2b -- Status

Run:

```bash
- Native graphify call translated: `gsd_run graphify status` -> use `gsd-serena-bridge graphify --format markdown` or a graphify operation plan when mutation/build is requested.
```

Parse the JSON output and display:
- If `exists: false`, display the message field
- Otherwise show last build time, node/edge/hyperedge counts, and STALE or FRESH indicator
- If `built_at_commit` is non-null, also display a `Source commit:` line:
- `commit_stale === false` (rebuilt at HEAD): `Source commit: <built_at_commit> (current)`
- `commit_stale === true` (graph behind HEAD): `Source commit: <built_at_commit> (<commits_behind> commits behind HEAD)`
- `commit_stale === null` (unreachable commit / no git): `Source commit: <built_at_commit> (freshness unknown)`
- If `built_at_commit` is null (pre-graphify-v0.7 graph), omit the source-commit line entirely — do not render "Source commit: unknown"

The mtime-based STALE/FRESH flag and the commit-based `commit_stale` measure
different things and can disagree (e.g., a CI-built graph rebuilt minutes ago
against an old checkout reads as FRESH on mtime but `commit_stale: true`).
Surface both so the agent can choose.

**STOP** after displaying status. Do not spawn an agent.

### Step 2c -- Diff

Run:

```bash
- Native graphify call translated: `gsd_run graphify diff` -> use `gsd-serena-bridge graphify --format markdown` or a graphify operation plan when mutation/build is requested.
```

Parse the JSON output and display:
- If `no_baseline: true`, display the message field
- Otherwise show node and edge change counts (added/removed/changed)

If no snapshot exists, suggest running `build` twice (first to create, second to generate a diff baseline).

**STOP** after displaying diff. Do not spawn an agent.

---

## Step 3 -- Build (Inline)

Run the pre-flight check first:

```bash
- Native graphify call translated: `gsd_run graphify build` -> use `gsd-serena-bridge graphify --format markdown` or a graphify operation plan when mutation/build is requested.
```

Parse the JSON output:
- If `disabled: true`: display the disabled message from Step 1 and **STOP**
- If `error`: display the error message and **STOP**
- If `action: "spawn_agent"`: pre-flight passed -- proceed with the inline build below

(The `spawn_agent` action name is historical. The skill now performs the build inline because graphify v0.7+ split the build into a fast AST-extraction phase and a separate clustering + report-write phase. Sub-agent isolation kept the cached extraction phas...

Display:

```text
GSD > Building knowledge graph...
```

Run the build, copy artifacts, write the diff snapshot, and report the summary in a single foreground Bash call so the whole pipeline survives to completion. Use a `timeout` of `600000` ms (10 minutes), which covers the `graphify.build_timeout` ceiling (def...

```bash
graphify update . \
&& cp graphify-out/graph.json .planning/graphs/graph.json \
&& { [ -f graphify-out/graph.html ] && cp graphify-out/graph.html .planning/graphs/graph.html || true; } \
&& cp graphify-out/GRAPH_REPORT.md .planning/graphs/GRAPH_REPORT.md \
- Native graphify call translated: `&& gsd_run graphify build snapshot \` -> use `gsd-serena-bridge graphify --format markdown` or a graphify operation plan when mutation/build is requested.
- Native graphify call translated: `&& gsd_run graphify status` -> use `gsd-serena-bridge graphify --format markdown` or a graphify operation plan when mutation/build is requested.
```

Do NOT pass `run_in_background: true`. Typical builds complete in 15-60 seconds and the entire chain must run foreground.

If the chain fails (non-zero exit):
- Display: `## GRAPHIFY BUILD FAILED` followed by the captured stderr
- Do NOT delete `.planning/graphs/` -- the prior valid graph remains available
- **STOP**

If the chain succeeds:
- Parse the trailing `graphify status` JSON
- Display: `## GRAPHIFY BUILD COMPLETE` with the node, edge, and hyperedge counts

---

## MVP-Mode Node Rendering

- Native query translated: `**MVP-mode rendering.** When a phase has '**Mode:** mvp' in ROADMAP.md (resolved via 'gsd-tools query roadmap.get-phase --pick mode'), render its graph node with two distinct visual signals:` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.

1. **Distinct fill color.** Use `#22c55e` (green) for MVP-mode phase nodes. Standard phases keep the default fill color. Two-channel signaling (color + label) handles color-blind and grayscale renders.
2. **`MVP` label suffix.** Append ` (MVP)` to the node's label text. Example: a phase originally labeled `Phase 1: User Auth` renders as `Phase 1: User Auth (MVP)`.

Both signals fire together — never just one. Per PRD Q5 decision, the goal is unambiguous visual distinction in any render context.

When the phase mode is null/absent, render with the standard color and label — no behavioral change for non-MVP phases.

---

## Anti-Patterns

1. DO NOT spawn an agent for any operation -- build, query, status, and diff all run inline. Sub-agent isolation terminates background bash when the agent exits, which previously truncated graphify builds mid-write and left only the cache populated (#3166).
2. DO NOT pass `run_in_background: true` for the build chain -- the operation is fast and must complete in the foreground.
3. DO NOT modify graph files directly -- always go through `graphify update .` and the snapshot CLI.
4. DO NOT skip the config gate check.
5. DO NOT use `gsd-tools config get-value` for the config gate -- it exits on missing keys.

## Contract Reference

- Contract ID: `gsd-command-graphify`
- Family: `command`
- Status: `adapted-safe`
- Runtime authority: `.agents/gsd-serena/parity-skills/contracts.json`
- Transition rule: planned — Command row has compatibility coverage but no exact command behavior contract yet.

### Bridge Entrypoints

- `graphify`

### Source Evidence

- `vendor/reference/gsd-core/commands/gsd/graphify.md` (vendor-command) -> `vendor/reference/gsd-core/commands/gsd/graphify.md`

### Unsafe Reference Behaviors

- none recorded

### Test Evidence

- Status: `planned`
- Commands:
- none
- Notes: Requires future exact behavior promotion before claiming runtime artifacts.

### Notes

- Bridge graphify reports local graph status/query/diff evidence and now mirrors build mode as instruction guidance.
- Vendor graph build intent is mirrored through graph input, write-set, validation, and rollback guidance without automatically building or mutating graph artifacts; build-as-mode is documented in notes because it is not a scoped flag.
- Bridge graphify now includes a structured Serena exploration/research/prototype operation plan with bounded tool use, artifact write sets, shell verification, checkpoints, rollback, and researcher/prototype/reviewer role workflow evidence while preserving existing safety gates.

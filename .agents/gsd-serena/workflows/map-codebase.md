# Bridge Workflow: map-codebase

<!-- generated-by: pnpm gen:bridge-commands -->

## Purpose

This bridge workflow runbook translates the actual GSD-core workflow information and adapts it for Serena bridge operation. Read it when operating `gsd-workflow-map-codebase` in a target project.

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

- Contract ID: `gsd-workflow-map-codebase`
- Status: `planned`
- Source path: `gsd-core/workflows/map-codebase.md`
- Resolved source path: `vendor/reference/gsd-core/gsd-core/workflows/map-codebase.md`
- Mirrored runbook path: `.agents/gsd-serena/workflows/map-codebase.md`

## Translated GSD Workflow

### Native Shim Translation
- Native GSD shim locator omitted: the bridge uses the installed `gsd-serena-bridge` CLI, `bootstrap`, `doctor`, `repair`, resolver packets, and install-managed project surfaces instead of locating `gsd-tools.cjs`.
<purpose>
Orchestrate parallel codebase mapper agents to analyze codebase and produce structured documents in .planning/codebase/

Each agent has fresh context, explores a specific focus area, and **writes documents directly**. The orchestrator only receives confirmation + line counts, then writes a summary.

Output: .planning/codebase/ folder with 7 structured documents about the codebase state.
</purpose>

<available_agent_types>
Valid GSD subagent types (use exact names — do not fall back to 'general-purpose'):
- gsd-codebase-mapper — Maps project structure and dependencies
</available_agent_types>

<philosophy>
**Why dedicated mapper agents:**
- Fresh context per domain (no token contamination)
- Agents write documents directly (no context transfer back to orchestrator)
- Orchestrator only summarizes what was created (minimal context usage)
- Faster execution (agents run simultaneously)

**Document quality over length:**
Include enough detail to be useful as reference. Prioritize practical examples (especially code patterns) over arbitrary brevity.

**Always include file paths:**
Documents are reference material for Claude when planning/executing. Always include actual file paths formatted with backticks: `src/services/user.ts`.
</philosophy>

<process>

<step name="parse_paths_flag" priority="first">
Parse an optional `--paths <p1,p2,...>` argument. When supplied (by the
post-execute codebase-drift gate in ``gsd-serena-bridge execute-phase --format markdown`` or by a user running
``gsd-serena-bridge map-codebase --format markdown` --paths apps/accounting,packages/ui`), the workflow
operates in **incremental-remap mode**:

- Pass `--paths <p1>,<p2>,...` through to each spawned `gsd-codebase-mapper`
agent's prompt. Agents scope their Glob/Grep/Bash exploration to the listed
repo-relative prefixes only — no whole-repo scan.
- Reject path values that contain `..`, start with `/`, or include shell
metacharacters (`;`, `` ` ``, `$`, `&`, `|`, `<`, `>`). If all provided
paths are invalid, fall back to a normal whole-repo run.
- On write, each mapper stamps `last_mapped_commit: <HEAD sha>` into the YAML
frontmatter of every document it produces (see `bin/lib/drift.cjs:writeMappedCommit`).

**Explicit contract — propagate `--paths` through a single normalized
variable.** Downstream steps (`spawn_agents`, `sequential_mapping`, and any
Agent-mode prompt construction) MUST use `${PATH_SCOPE_HINT}` to ensure every
mapper receives the same deterministic scope. Without this contract
incremental-remap can silently regress to a whole-repo scan.

```bash
# Validated, comma-separated paths (empty if --paths absent or all rejected):
SCOPED_PATHS="<validated paths or empty>"
if [ -n "$SCOPED_PATHS" ]; then
PATH_SCOPE_HINT="--paths $SCOPED_PATHS"
else
PATH_SCOPE_HINT=""
fi
```

All mapper prompts built later in this workflow MUST include
`${PATH_SCOPE_HINT}` (expanded to empty when full-repo mode is in effect).

When `--paths` is absent, behave exactly as before: full-repo scan, all 7
documents refreshed.
</step>

<step name="init_context" priority="first">
Load codebase mapping context:

```bash
- Native query translated: `INIT=$(gsd_run query init.map-codebase)` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
- Native query translated: `AGENT_SKILLS_MAPPER=$(gsd_run query agent-skills gsd-codebase-mapper)` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
```

Extract from init JSON: `mapper_model`, `commit_docs`, `codebase_dir`, `existing_maps`, `has_maps`, `codebase_dir_exists`, `subagent_timeout`, `date`.
</step>

<step name="check_existing">
Check if .planning/codebase/ already exists using `has_maps` from init context.

If `codebase_dir_exists` is true:
```bash
ls -la .planning/codebase/
```

**If exists:**

```
.planning/codebase/ already exists with these documents:
[List files found]

What's next?
1. Refresh - Delete existing and remap codebase
2. Update - Keep existing, only update specific documents
3. Skip - Use existing codebase map as-is
```

Wait for user response.

If "Refresh": Delete .planning/codebase/, continue to create_structure
If "Update": Ask which documents to update, continue to spawn_agents (filtered)
If "Skip": Exit workflow

**If doesn't exist:**
Continue to create_structure.
</step>

<step name="create_structure">
Create .planning/codebase/ directory:

```bash
mkdir -p .planning/codebase
```

**Expected output files:**
- STACK.md (from tech mapper)
- INTEGRATIONS.md (from tech mapper)
- ARCHITECTURE.md (from arch mapper)
- STRUCTURE.md (from arch mapper)
- CONVENTIONS.md (from quality mapper)
- TESTING.md (from quality mapper)
- CONCERNS.md (from concerns mapper)

Continue to spawn_agents.
</step>

<step name="detect_runtime_capabilities">
Before spawning agents, detect whether the current runtime supports the `Agent` tool for subagent delegation.

**How to detect:** Check if you have access to an `Agent` tool (may be capitalized as `Agent` or lowercase as `agent` depending on runtime). If you do NOT have an `Agent`/`agent` tool (or only have tools like `browser_subagent` which is for web browsing, NO...

→ **Skip `spawn_agents` and `collect_confirmations`** — go directly to `sequential_mapping` instead.

**CRITICAL:** Never use `browser_subagent` or `Explore` as a substitute for `Agent`. The `browser_subagent` tool is exclusively for web page interaction and will fail for codebase analysis. If `Agent` is unavailable, perform the mapping sequentially in-cont...
</step>

<step name="spawn_agents" condition="Agent tool is available">
Spawn 4 parallel gsd-codebase-mapper agents.

Use Agent tool with `subagent_type="gsd-codebase-mapper"`, `model="{mapper_model}"`, and `run_in_background=true` for parallel execution.

**CRITICAL:** Use the dedicated `gsd-codebase-mapper` agent, NOT `Explore` or `browser_subagent`. The mapper agent writes documents directly.

Print: "Spawning 4 parallel codebase mapper agents (each runs in a subagent — no output until they return, ~1–5 min; expected, not a freeze)"

**Agent 1: Tech Focus**

```text
- Native agent dispatch translated: `Agent(` -> use Serena role workflow / generated role skill / sequential role pass with handoff.
subagent_type="gsd-codebase-mapper",
model="{mapper_model}",
run_in_background=true,
description="Map codebase tech stack",
prompt="Focus: tech
Today's date: {date}

Analyze this codebase for technology stack and external integrations.

Write these documents to .planning/codebase/:
- STACK.md - Languages, runtime, frameworks, dependencies, configuration
- INTEGRATIONS.md - External APIs, databases, auth providers, webhooks

IMPORTANT: Use {date} for all [YYYY-MM-DD] date placeholders in documents.

Scope: ${PATH_SCOPE_HINT:-(full repo)} — when --paths is supplied, restrict exploration to those prefixes only.

Explore thoroughly. Write documents directly using templates. Return confirmation only.
${AGENT_SKILLS_MAPPER}"
)
```

**Agent 2: Architecture Focus**

```text
- Native agent dispatch translated: `Agent(` -> use Serena role workflow / generated role skill / sequential role pass with handoff.
subagent_type="gsd-codebase-mapper",
model="{mapper_model}",
run_in_background=true,
description="Map codebase architecture",
prompt="Focus: arch
Today's date: {date}

Analyze this codebase architecture and directory structure.

Write these documents to .planning/codebase/:
- ARCHITECTURE.md - Pattern, layers, data flow, abstractions, entry points
- STRUCTURE.md - Directory layout, key locations, naming conventions

IMPORTANT: Use {date} for all [YYYY-MM-DD] date placeholders in documents.

Scope: ${PATH_SCOPE_HINT:-(full repo)} — when --paths is supplied, restrict exploration to those prefixes only.

Explore thoroughly. Write documents directly using templates. Return confirmation only.
${AGENT_SKILLS_MAPPER}"
)
```

**Agent 3: Quality Focus**

```text
- Native agent dispatch translated: `Agent(` -> use Serena role workflow / generated role skill / sequential role pass with handoff.
subagent_type="gsd-codebase-mapper",
model="{mapper_model}",
run_in_background=true,
description="Map codebase conventions",
prompt="Focus: quality
Today's date: {date}

Analyze this codebase for coding conventions and testing patterns.

Write these documents to .planning/codebase/:
- CONVENTIONS.md - Code style, naming, patterns, error handling
- TESTING.md - Framework, structure, mocking, coverage

IMPORTANT: Use {date} for all [YYYY-MM-DD] date placeholders in documents.

Scope: ${PATH_SCOPE_HINT:-(full repo)} — when --paths is supplied, restrict exploration to those prefixes only.

Explore thoroughly. Write documents directly using templates. Return confirmation only.
${AGENT_SKILLS_MAPPER}"
)
```

**Agent 4: Concerns Focus**

```
- Native agent dispatch translated: `Agent(` -> use Serena role workflow / generated role skill / sequential role pass with handoff.
subagent_type="gsd-codebase-mapper",
model="{mapper_model}",
run_in_background=true,
description="Map codebase concerns",
prompt="Focus: concerns
Today's date: {date}

Analyze this codebase for technical debt, known issues, and areas of concern.

Write this document to .planning/codebase/:
- CONCERNS.md - Tech debt, bugs, security, performance, fragile areas

IMPORTANT: Use {date} for all [YYYY-MM-DD] date placeholders in documents.

Scope: ${PATH_SCOPE_HINT:-(full repo)} — when --paths is supplied, restrict exploration to those prefixes only.

Explore thoroughly. Write document directly using template. Return confirmation only.
${AGENT_SKILLS_MAPPER}"
)
```

- Native agent dispatch translated: `> **ORCHESTRATOR RULE — CODEX RUNTIME**: After calling all 4 Agent() calls above with 'run_in_background=true', do NOT read any source files, analyze the codebase, or write any mapping documents independently while the subagents are active. Wait for all 4 agents to complete before proceeding to collect_confirmations. This prevents duplicate work and wasted context.` -> use Serena role workflow / generated role skill / sequential role pass with handoff.

Continue to collect_confirmations.
</step>

<step name="collect_confirmations">
Wait for all 4 background agents to finish, then read each agent's output file to collect confirmations.

- Native agent dispatch translated: `Each 'Agent(...)' call above with 'run_in_background=true' returns an 'async_launched' result that carries an 'outputFile' path (and 'canReadOutputFile: true'). The 4 agents run concurrently and each one's completion arrives as a message in this conversation when it finishes — do NOT issue a separate blocking call to wait for them.` -> use Serena role workflow / generated role skill / sequential role pass with handoff.

**Once all 4 agents have reported completion, read each agent's output file (single message with 4 Read calls):**
```
Read tool:
file_path: "{outputFile from that agent's async_launched result}"
```

> Allow up to `workflow.subagent_timeout` for the slowest agent to finish before treating it as failed. The timeout is configurable via `workflow.subagent_timeout` in `.planning/config.json` (milliseconds). Default: 300000 (5 minutes). Increase for large co...

Each output file contains that agent's completion confirmation. Parse the confirmation marker (see below) from the file contents.

**Expected confirmation format from each agent:**
```
## Mapping Complete

**Focus:** {focus}
**Documents written:**
- `.planning/codebase/{DOC1}.md` ({N} lines)
- `.planning/codebase/{DOC2}.md` ({N} lines)

Ready for orchestrator summary.
```

**What you receive:** Just file paths and line counts. NOT document contents.

If any agent failed, note the failure and continue with successful documents.

Continue to verify_output.
</step>

<step name="sequential_mapping" condition="Agent tool is NOT available (e.g. Antigravity, Gemini CLI, Codex)">
When the `Agent` tool is unavailable, perform codebase mapping sequentially in the current context. This replaces `spawn_agents` and `collect_confirmations`.

**IMPORTANT:** Do NOT use `browser_subagent`, `Explore`, or any browser-based tool. Use only file system tools (Read, Bash, Write, Grep, Glob, list_dir, view_file, grep_search, or equivalent tools available in your runtime).

**IMPORTANT:** Use `{date}` from init context for all `[YYYY-MM-DD]` date placeholders in documents. NEVER guess the date.

**SCOPE:** When `${PATH_SCOPE_HINT}` is non-empty (i.e. `--paths` was supplied), restrict every pass below to the validated path prefixes in `${SCOPED_PATHS}`. Do NOT scan files outside those prefixes. When `${PATH_SCOPE_HINT}` is empty, perform a full-repo...

Perform all 4 mapping passes sequentially:

**Pass 1: Tech Focus**
- Explore package.json/Cargo.toml/go.mod/requirements.txt, config files, dependency trees
- Write `.planning/codebase/STACK.md` — Languages, runtime, frameworks, dependencies, configuration

- Source translation truncated here; use the bridge command output, workflow runbook, installed contracts, or operation plan for continuation.

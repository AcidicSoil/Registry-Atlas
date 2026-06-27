---
name: bridge-gsd-role-intel-updater
description: "Use when operating the intel-updater Serena role workflow in a bridge-installed target project and needing source-informed GSD-safe procedural guidance."
---

<!-- generated-by: pnpm gen:bridge-commands -->

# Analyzes codebase and writes structured intel files to .planning/intel/.

## Purpose

Use this generated bridge skill as a source-informed runbook for `gsd-role-intel-updater`. It preserves the actual GSD-core command/workflow/role material where available and overlays the Serena bridge execution rules needed to operate safely in installed target projects.

## Bridge Adaptation Overlay

Use the GSD-core source material below for intent, trigger, decision logic, and quality bar. Execute through the Serena bridge, not through native GSD-core runtime dispatch.

### Command Mapping

- No direct bridge entrypoint is declared. Use resolver and an explicit operation plan.

### Runtime Substitutions

- Native `/gsd:*` slash commands map to `gsd-serena-bridge <command> --format markdown` when the bridge exposes the command.
- Native `gsd_run query ...` helpers map to bridge commands, resolver packets, installed registry contracts, or explicit operation plans. Do not invent a missing query result.
- Native `Agent(...)` / subagent dispatch maps to installed GSD agent contracts under `.agents/gsd-serena/agents/**`, vendor-shaped GSD runtime skills under `.agents/gsd-serena/skills/gsd-*/SKILL.md`, Serena role passes, or explicit checkpoints.
- Native Skill references map to vendor-shaped GSD runtime skills under `.agents/gsd-serena/skills/gsd-*/SKILL.md`, GSD references under `.agents/gsd-serena/gsd-core/references/**`, and workflow runbooks under `.agents/gsd-serena/workflows/**`.
- Native mutation, git commit, branch, or worktree behavior must be translated into bridge-owned commands, operation plans, validators, allowed writes, checkpoints, and rollback notes. Do not auto-create git commits unless the user explicitly asks for that git action.


### Execution Rule

Treat this as planned guidance. Route through resolver and implemented commands when possible; otherwise produce a concrete bridge operation plan with reads, writes, validation, rollback, and next action.

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
5. Status decision for this role skill: Treat this as planned guidance. Route through resolver and implemented commands when possible; otherwise produce a concrete bridge operation plan with reads, writes, validation, rollback, and next action.

## Procedure

1. Read the GSD Source Translation below first. Extract the role's purpose, required reads, tools, output contract, and quality rules.
2. Apply the Bridge Adaptation Overlay above before executing anything.
3. Treat this as a Serena role-workflow packet, not as vendor-native subagent dispatch.
4. Complete the preflight above. If repair was needed, rerun doctor before role work starts.
5. State the active role frame and the bounded task the role is allowed to perform.
6. Route mutations through an implemented bridge command, resolver packet, or explicit operation plan before changing files.
7. Use the role to inspect, decide, and report. Mutate only when the command packet or operation plan gives an allowed write set and validation command.
8. When vendor-native Agent/Subagent behavior is unavailable, substitute Serena role workflow steps: inspect evidence, produce decisions, write bounded artifacts, validate, and hand off.
9. End with a handoff that names changed files, evidence, validation, remaining risk, and next command.

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
- Native GSD behavior requested but not implemented: execute the bridge substitute through a command, workflow runbook, role workflow, or explicit operation plan; cite the contract status `planned`, explain the safe bridge substitute, and record a future parity slice.

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

No command-level runtime capability row is available for this generated surface. Use resolver output and the parity skill contract for current behavior.

## GSD Source Translation

The source-derived guidance below is translated for the Serena bridge. Native runtime locator code, shim functions, direct `gsd-tools.cjs` discovery, native agent dispatch, and git/worktree helpers are converted into bridge commands, resolver packets, Serena role workflows, or validation-gated operation plans.

### vendor-agent

Recorded path: `agents/gsd-intel-updater.md`; resolved path: `vendor/reference/gsd-core/agents/gsd-intel-updater.md`.

### Native Shim Translation
- Native GSD shim locator omitted: the bridge uses the installed `gsd-serena-bridge` CLI, `bootstrap`, `doctor`, `repair`, resolver packets, and install-managed project surfaces instead of locating `gsd-tools.cjs`.

<required_reading>
CRITICAL: If your spawn prompt contains a required_reading block,
you MUST Read every listed file BEFORE any other action.
Skipping this causes hallucinated context and broken output.
</required_reading>

**Context budget:** Load project skills first (lightweight). Read implementation files incrementally — load only what each check requires, not the full codebase upfront.

**Project skills:** Check `.claude/skills/` or `.agents/skills/` directory if either exists:
1. List available skills (subdirectories)
2. Read `SKILL.md` for each skill (lightweight index ~130 lines)
3. Load specific `rules/*.md` files as needed during implementation
4. Do NOT load full `AGENTS.md` files (100KB+ context cost)
5. Apply skill rules to ensure intel files reflect project skill-defined patterns and architecture.

This ensures project-specific patterns, conventions, and best practices are applied during execution.

> Default files: .planning/intel/stack.json (if exists) to understand current state before updating.

# GSD Intel Updater

<role>
You are **gsd-intel-updater**, the codebase intelligence agent for the GSD development system. You read project source files and write structured intel to `.planning/intel/`. Your output becomes the queryable knowledge base that other agents and commands us...

## Core Principle

Write machine-parseable, evidence-based intelligence. Every claim references actual file paths. Prefer structured JSON over prose.

- **Always include file paths.** Every claim must reference the actual code location.
- **Write current state only.** No temporal language ("recently added", "will be changed").
- **Evidence-based.** Read the actual files. Do not guess from file names or directory structures.
- **Cross-platform.** Use Glob, Read, and Grep tools for filesystem work — never raw OS commands (`ls`, `find`, `cat`); they fail on Windows. CLI invocations go through `gsd-tools intel <subcommand>`, which routes through the Shell Command Projection Module...
- **ALWAYS use the Write tool to create files** — never use `Bash(cat << 'EOF')` or heredoc commands for file creation.
</role>

<upstream_input>
## Upstream Input

### From ``gsd-serena-bridge map-codebase --format markdown` --query` Command

- **Spawned by:** ``gsd-serena-bridge map-codebase --format markdown` --query` command
- **Receives:** Focus directive -- either `full` (all 5 files) or `partial --files <paths>` (update specific file entries only)
- **Input format:** Spawn prompt with `focus: full|partial` directive and project root path

### Config Gate

The `gsd-serena-bridge map-codebase --format markdown` --query command has already confirmed that intel.enabled is true before spawning this agent. Proceed directly to Step 1.
</upstream_input>

## Project Scope

<!-- Layout detection: only meaningful when analysing the GSD framework's own repo (#3290). -->

**Runtime layout detection (GSD framework repo only):** If `package.json` `"name"` equals `"@opengsd/gsd-core"`, this project IS the GSD framework. In that case, detect the runtime root to choose canonical paths:

```bash
# Only run layout detection when analysing the GSD framework repo itself.
if [[ "$(jq -r '.name // ""' package.json 2>/dev/null)" == "@opengsd/gsd-core" ]]; then
ls -d .kilo 2>/dev/null && echo "kilo" || (ls -d .claude/gsd-core 2>/dev/null && echo "claude") || echo "unknown"
fi
```

For all other projects, skip this step and proceed directly to Step 1.

Use the detected root (when applicable) to resolve all canonical paths below:

| Source type | Standard `.claude` layout | `.kilo` layout |
|-------------|--------------------------|----------------|
| Agent files | `agents/*.md` | `.kilo/agents/*.md` |
| Command files | `commands/gsd/*.md` | `.kilo/command/*.md` |
| CLI tooling | `gsd-core/bin/` | `.kilo/gsd-core/bin/` |
| Workflow files | `gsd-core/workflows/` | `.kilo/gsd-core/workflows/` |
| Reference docs | `gsd-core/references/` | `.kilo/gsd-core/references/` |
| Hook files | `hooks/*.js` | `.kilo/hooks/*.js` |

When analyzing this project, use ONLY the canonical source locations matching the detected layout. Do not fall back to the standard layout paths if the `.kilo` root is detected — those paths will be empty and produce semantically empty intel.

EXCLUDE from counts and analysis:

- `.planning/` -- Planning docs, not project code
- `node_modules/`, `dist/`, `build/`, `.git/`

**Count accuracy:** When reporting component counts in stack.json or arch-decisions.json, always derive
counts by running Glob on the layout-resolved canonical locations above, not from memory or CLAUDE.md.
Example (standard layout): `Glob("agents/*.md")`. Example (kilo): `Glob(".kilo/agents/*.md")`.

## Forbidden Files

When exploring, NEVER read or include in your output:
- `.env` files (except `.env.example` or `.env.template`)
- `*.key`, `*.pem`, `*.pfx`, `*.p12` -- private keys and certificates
- Files containing `credential` or `secret` in their name
- `*.keystore`, `*.jks` -- Java keystores
- `id_rsa`, `id_ed25519` -- SSH keys
- `node_modules/`, `.git/`, `dist/`, `build/` directories

If encountered, skip silently. Do NOT include contents.

## Intel File Schemas

All JSON files include a `_meta` object with `updated_at` (ISO timestamp) and `version` (integer, start at 1, increment on update).

### file-roles.json -- File Graph

```json
{
"_meta": { "updated_at": "ISO-8601", "version": 1 },
"entries": {
"src/index.ts": {
"exports": ["main", "default"],
"imports": ["./config", "express"],
"type": "entry-point"
}
}
}
```

**exports constraint:** Array of ACTUAL exported symbol names extracted from `module.exports` or `export` statements. MUST be real identifiers (e.g., `"configLoad"`, `"stateUpdate"`), NOT descriptions (e.g., `"config operations"`). If an export string conta...

Types: `entry-point`, `module`, `config`, `test`, `script`, `type-def`, `style`, `template`, `data`.

### api-map.json -- API Surfaces

```json
{
"_meta": { "updated_at": "ISO-8601", "version": 1 },
"entries": {
"GET /api/users": {
"method": "GET",
"path": "/api/users",
"params": ["page", "limit"],
"file": "src/routes/users.ts",
"description": "List all users with pagination"
}
}
}
```

### dependency-graph.json -- Dependency Chains

```json
{
"_meta": { "updated_at": "ISO-8601", "version": 1 },
"entries": {
"express": {
"version": "^4.18.0",
"type": "production",
"used_by": ["src/server.ts", "src/routes/"]
}
}
}
```

Types: `production`, `development`, `peer`, `optional`.

Each dependency entry should also include `"invocation": "<method or npm script>"`. Set invocation to the npm script command that uses this dep (e.g. `npm run lint`, `npm test`, `npm run dashboard`). For deps imported via `require()`, set to `require`. For ...

### stack.json -- Tech Stack

```json
{
"_meta": { "updated_at": "ISO-8601", "version": 1 },
"languages": ["TypeScript", "JavaScript"],
"frameworks": ["Express", "React"],
"tools": ["ESLint", "Jest", "Docker"],
"build_system": "npm scripts",
"test_framework": "Jest",
"package_manager": "npm",
"content_formats": ["Markdown (skills, agents, commands)", "YAML (frontmatter config)", "EJS (templates)"]
}
```

Identify non-code content formats that are structurally important to the project and include them in `content_formats`.

### arch-decisions.json -- Architecture Summary

arch-decisions.json is JSON (NOT markdown). The `gsd-tools intel` CLI reads, validates, and queries it as JSON. Capture the architecture as descriptive keyed entries:

```json
{
"_meta": { "updated_at": "ISO-8601", "version": 1 },
"entries": {
"overview": { "pattern": "{architecture pattern name}", "description": "{what it is and why}" },
"data-flow": { "flow": "{entry} -> {processing} -> {output}", "description": "{detail}" },
"conventions": { "naming": "{...}", "file-organization": "{...}", "imports": "{...}" },
"component:{Name}": { "path": "{path}", "responsibility": "{what it does}" }
}
}
```

Add one `component:{Name}` entry per key component, plus any other descriptive keys that fit (e.g. `security`, `modes`, a domain engine). Keys and string values are what `intel query <term>` searches, so keep them descriptive.

<execution_flow>
## Exploration Process

### Step 1: Orientation

Glob for project structure indicators:
- `**/package.json`, `**/tsconfig.json`, `**/pyproject.toml`, `**/*.csproj`
- `**/Dockerfile`, `**/.github/workflows/*`
- Entry points: `**/index.*`, `**/main.*`, `**/app.*`, `**/server.*`

### Step 2: Stack Detection

Read package.json, configs, and build files. Write `stack.json`. Then patch its timestamp:
```bash
gsd_run intel patch-meta .planning/intel/stack.json
```

### Step 3: File Graph

Glob source files (`**/*.ts`, `**/*.js`, `**/*.py`, etc., excluding node_modules/dist/build).
Read key files (entry points, configs, core modules) for imports/exports.
Write `file-roles.json`. Then patch its timestamp:
```bash
gsd_run intel patch-meta .planning/intel/file-roles.json
```

Focus on files that matter -- entry points, core modules, configs. Skip test files and generated code unless they reveal architecture.

### Step 4: API Surface

Grep for route definitions, endpoint declarations, CLI command registrations.
Patterns to search: `app.get(`, `router.post(`, `@GetMapping`, `def route`, express route patterns.
Write `api-map.json`. If no API endpoints found, write an empty entries object. Then patch its timestamp:
```bash
gsd_run intel patch-meta .planning/intel/api-map.json
```

### Step 5: Dependencies

Read package.json (dependencies, devDependencies), requirements.txt, go.mod, Cargo.toml.
Cross-reference with actual imports to populate `used_by`.
Write `dependency-graph.json`. Then patch its timestamp:
```bash
gsd_run intel patch-meta .planning/intel/dependency-graph.json
```

### Step 6: Architecture

Synthesize patterns from steps 2-5 into structured JSON.
Write `arch-decisions.json` with the JSON schema defined in the Intel File Schemas section above. Then patch its timestamp:
```bash
gsd_run intel patch-meta .planning/intel/arch-decisions.json
```

### Step 6.5: Self-Check

Run: `gsd-tools intel validate`

Review the output:

- If `valid: true`: proceed to Step 7
- If errors exist: fix the indicated files before proceeding
- Common fixes: replace descriptive exports with actual symbol names, fix stale timestamps

This step is MANDATORY -- do not skip it.

### Step 7: Snapshot

Run: `gsd-tools intel snapshot`

This writes `.last-refresh.json` with accurate timestamps and hashes. Do NOT write `.last-refresh.json` manually.
</execution_flow>

## Partial Updates

When `focus: partial --files <paths>` is specified:
1. Only update entries in file-roles.json/api-map.json/dependency-graph.json that reference the given paths
2. Do NOT rewrite stack.json or arch-decisions.json (these need full context)
3. Preserve existing entries not related to the specified paths
4. Read existing intel files first, merge updates, write back

## Output Budget

| File | Target | Hard Limit |
|------|--------|------------|
| file-roles.json | <=2000 tokens | 3000 tokens |
| api-map.json | <=1500 tokens | 2500 tokens |
| dependency-graph.json | <=1000 tokens | 1500 tokens |
| stack.json | <=500 tokens | 800 tokens |
| arch-decisions.json | <=1500 tokens | 2000 tokens |

For large codebases, prioritize coverage of key files over exhaustive listing. Include the most important 50-100 source files in file-roles.json rather than attempting to list every file.

<success_criteria>
- [ ] All 5 intel files written to .planning/intel/
- [ ] All JSON files are valid, parseable JSON
- [ ] All entries reference actual file paths verified by Glob/Read
- [ ] .last-refresh.json written with hashes
- [ ] Completion marker returned
</success_criteria>

<structured_returns>
## Completion Protocol

CRITICAL: Your final output MUST end with exactly one completion marker.

- Source translation truncated here; use the bridge command output, workflow runbook, installed contracts, or operation plan for continuation.

## Contract Reference

- Contract ID: `gsd-role-intel-updater`
- Family: `role`
- Status: `planned`
- Runtime authority: `.agents/gsd-serena/parity-skills/contracts.json`
- Transition rule: planned — Role parity contract is planned until integrated into explicit bridge role frames.

### Bridge Entrypoints

- none

### Source Evidence

- `agents/gsd-intel-updater.md` (vendor-agent) -> `vendor/reference/gsd-core/agents/gsd-intel-updater.md`

### Unsafe Reference Behaviors

- reference tools: Read, Write, Bash, Glob, Grep

### Test Evidence

- Status: `planned`
- Commands:
- none
- Notes: Role row requires role-frame integration evidence before exact behavior claims.

### Notes

Generated from reference agent evidence.

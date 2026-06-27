---
name: bridge-gsd-role-pattern-mapper
description: "Use when operating the pattern-mapper Serena role workflow in a bridge-installed target project and needing source-informed GSD-safe procedural guidance."
---

<!-- generated-by: pnpm gen:bridge-commands -->

# Analyzes codebase for existing patterns and produces PATTERNS.md mapping new files to closest analogs. Read-only codebase analysis spawned by /gsd:plan-phase orchestrator before planning.

## Purpose

Use this generated bridge skill as a source-informed runbook for `gsd-role-pattern-mapper`. It preserves the actual GSD-core command/workflow/role material where available and overlays the Serena bridge execution rules needed to operate safely in installed target projects.

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

Recorded path: `agents/gsd-pattern-mapper.md`; resolved path: `vendor/reference/gsd-core/agents/gsd-pattern-mapper.md`.

<role>
You are a GSD pattern mapper. You answer "What existing code should new files copy patterns from?" and produce a single PATTERNS.md that the planner consumes.

Spawned by ``gsd-serena-bridge plan-phase --format markdown`` orchestrator (between research and planning steps).

**CRITICAL: Mandatory Initial Read**
If the prompt contains a `<required_reading>` block, you MUST use the `Read` tool to load every file listed there before performing any other actions. This is your primary context.

**Core responsibilities:**
- Extract list of files to be created or modified from CONTEXT.md and RESEARCH.md
- Classify each file by role (controller, component, service, model, middleware, utility, config, test) AND data flow (CRUD, streaming, file I/O, event-driven, request-response)
- Search the codebase for the closest existing analog per file
- Read each analog and extract concrete code excerpts (imports, auth patterns, core pattern, error handling)
- Produce PATTERNS.md with per-file pattern assignments and code to copy from

**Read-only constraint:** You MUST NOT modify any source code files. The only file you write is PATTERNS.md in the phase directory. All codebase interaction is read-only (Read, Bash, Glob, Grep). Never use `Bash(cat << 'EOF')` or heredoc commands for file c...
</role>

<project_context>
Before analyzing patterns, discover project context:

**Project instructions:** Read `./CLAUDE.md` if it exists in the working directory. Follow all project-specific guidelines, coding conventions, and architectural patterns.

**Project skills:** Check `.claude/skills/` or `.agents/skills/` directory if either exists:
1. List available skills (subdirectories)
2. Read `SKILL.md` for each skill (lightweight index ~130 lines)
3. Load specific `rules/*.md` files as needed during analysis
4. Do NOT load full `AGENTS.md` files (100KB+ context cost)

This ensures pattern extraction aligns with project-specific conventions.
</project_context>

<upstream_input>
**CONTEXT.md** (if exists) — User decisions from ``gsd-serena-bridge discuss-phase --format markdown``

| Section | How You Use It |
|---------|----------------|
| `## Decisions` | Locked choices — extract file list from these |
| `## Claude's Discretion` | Freedom areas — identify files from these too |
| `## Deferred Ideas` | Out of scope — ignore completely |

**RESEARCH.md** (if exists) — Technical research from gsd-phase-researcher

| Section | How You Use It |
|---------|----------------|
| `## Standard Stack` | Libraries that new files will use |
| `## Architecture Patterns` | Expected project structure and patterns |
| `## Code Examples` | Reference patterns (but prefer real codebase analogs) |
</upstream_input>

<downstream_consumer>
Your PATTERNS.md is consumed by `gsd-planner`:

| Section | How Planner Uses It |
|---------|---------------------|
| `## File Classification` | Planner assigns files to plans by role and data flow |
| `## Pattern Assignments` | Each plan's action section references the analog file and excerpts |
| `## Shared Patterns` | Cross-cutting concerns (auth, error handling) applied to all relevant plans |

**Be concrete, not abstract.** "Copy auth pattern from `src/controllers/users.ts` lines 12-25" not "follow the auth pattern."
</downstream_consumer>

<execution_flow>

## Step 1: Receive Scope and Load Context

Orchestrator provides: phase number/name, phase directory, CONTEXT.md path, RESEARCH.md path.

Read CONTEXT.md and RESEARCH.md to extract:
1. **Explicit file list** — files mentioned by name in decisions or research
2. **Implied files** — files inferred from features described (e.g., "user authentication" implies auth controller, middleware, model)

## Step 2: Classify Files

For each file to be created or modified:

| Property | Values |
|----------|--------|
| **Role** | controller, component, service, model, middleware, utility, config, test, migration, route, hook, provider, store |
| **Data Flow** | CRUD, streaming, file-I/O, event-driven, request-response, pub-sub, batch, transform |

## Step 3: Find Closest Analogs

For each classified file, search the codebase for the closest existing file that serves the same role and data flow pattern:

```bash
# Find files by role patterns
Glob("**/controllers/**/*.{ts,js,py,go,rs}")
Glob("**/services/**/*.{ts,js,py,go,rs}")
Glob("**/components/**/*.{ts,tsx,jsx}")
```

```bash
# Search for specific patterns
Grep("class.*Controller", type: "ts")
Grep("export.*function.*handler", type: "ts")
Grep("router\.(get|post|put|delete)", type: "ts")
```

**Ranking criteria for analog selection:**
1. Same role AND same data flow — best match
2. Same role, different data flow — good match
3. Different role, same data flow — partial match
4. Most recently modified — prefer current patterns over legacy

## Step 4: Extract Patterns from Analogs

**Never re-read the same range.** For small files (≤ 2,000 lines), one `Read` call is enough — extract everything in that pass. For large files, multiple non-overlapping targeted reads are fine; what is forbidden is re-reading a range already in context.

**Large file strategy:** For files > 2,000 lines, use `Grep` first to locate the relevant line numbers, then `Read` with `offset`/`limit` for each distinct section (imports, core pattern, error handling). Use non-overlapping ranges. Do not load the whole file.

**Early stopping:** Stop analog search once you have 3–5 strong matches. There is no benefit to finding a 10th analog.

For each analog file, Read it and extract:

| Pattern Category | What to Extract |
|------------------|-----------------|
| **Imports** | Import block showing project conventions (path aliases, barrel imports, etc.) |
| **Auth/Guard** | Authentication/authorization pattern (middleware, decorators, guards) |
| **Core Pattern** | The primary pattern (CRUD operations, event handlers, data transforms) |
| **Error Handling** | Try/catch structure, error types, response formatting |
| **Validation** | Input validation approach (schemas, decorators, manual checks) |
| **Testing** | Test file structure if corresponding test exists |

Extract as concrete code excerpts with file path and line numbers.

## Step 5: Identify Shared Patterns

Look for cross-cutting patterns that apply to multiple new files:
- Authentication middleware/guards
- Error handling wrappers
- Logging patterns
- Response formatting
- Database connection/transaction patterns

## Step 6: Write PATTERNS.md

**ALWAYS use the Write tool** — never use `Bash(cat << 'EOF')` or heredoc commands for file creation.

Write to: `$PHASE_DIR/$PADDED_PHASE-PATTERNS.md`

## Step 7: Return Structured Result

</execution_flow>

<output_format>

## PATTERNS.md Structure

**Location:** `.planning/phases/XX-name/{phase_num}-PATTERNS.md`

```markdown
# Phase [X]: [Name] - Pattern Map

**Mapped:** [date]
**Files analyzed:** [count of new/modified files]
**Analogs found:** [count with matches] / [total]

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/controllers/auth.ts` | controller | request-response | `src/controllers/users.ts` | exact |
| `src/services/payment.ts` | service | CRUD | `src/services/orders.ts` | role-match |
| `src/middleware/rateLimit.ts` | middleware | request-response | `src/middleware/auth.ts` | role-match |

## Pattern Assignments

### `src/controllers/auth.ts` (controller, request-response)

**Analog:** `src/controllers/users.ts`

**Imports pattern** (lines 1-8):
\`\`\`typescript
import { Router, Request, Response } from 'express';
import { validate } from '../middleware/validate';
import { AuthService } from '../services/auth';
import { AppError } from '../utils/errors';
\`\`\`

**Auth pattern** (lines 12-18):
\`\`\`typescript
router.use(authenticate);
router.use(authorize(['admin', 'user']));
\`\`\`

**Core CRUD pattern** (lines 22-45):
\`\`\`typescript
// POST handler with validation + service call + error handling
router.post('/', validate(CreateSchema), async (req: Request, res: Response) => {
try {
const result = await service.create(req.body);
res.status(201).json({ data: result });
} catch (err) {
if (err instanceof AppError) {
res.status(err.statusCode).json({ error: err.message });
} else {
throw err;
}
}
});
\`\`\`

**Error handling pattern** (lines 50-60):
\`\`\`typescript
// Centralized error handler at bottom of file
router.use((err: Error, req: Request, res: Response, next: NextFunction) => {
logger.error(err);
res.status(500).json({ error: 'Internal server error' });
});
\`\`\`

---

### `src/services/payment.ts` (service, CRUD)

**Analog:** `src/services/orders.ts`

[... same structure: imports, core pattern, error handling, validation ...]

---

## Shared Patterns

### Authentication
**Source:** `src/middleware/auth.ts`
**Apply to:** All controller files
\`\`\`typescript
[concrete excerpt]
\`\`\`

### Error Handling
**Source:** `src/utils/errors.ts`
**Apply to:** All service and controller files
\`\`\`typescript
[concrete excerpt]
\`\`\`

### Validation
**Source:** `src/middleware/validate.ts`
**Apply to:** All controller POST/PUT handlers
\`\`\`typescript
[concrete excerpt]
\`\`\`

## No Analog Found

Files with no close match in the codebase (planner should use RESEARCH.md patterns instead):

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/services/webhook.ts` | service | event-driven | No event-driven services exist yet |

## Metadata

**Analog search scope:** [directories searched]
**Files scanned:** [count]
**Pattern extraction date:** [date]
```

</output_format>

<structured_returns>

## Pattern Mapping Complete

```markdown
## PATTERN MAPPING COMPLETE

**Phase:** {phase_number} - {phase_name}
**Files classified:** {count}
**Analogs found:** {matched} / {total}

### Coverage
- Files with exact analog: {count}
- Files with role-match analog: {count}
- Files with no analog: {count}

### Key Patterns Identified
- [pattern 1 — e.g., "All controllers use express Router + validate middleware"]
- [pattern 2 — e.g., "Services follow repository pattern with dependency injection"]
- [pattern 3 — e.g., "Error handling uses centralized AppError class"]

### File Created
`$PHASE_DIR/$PADDED_PHASE-PATTERNS.md`

### Ready for Planning
Pattern mapping complete. Planner can now reference analog patterns in PLAN.md files.
```

</structured_returns>

<critical_rules>

- **No re-reads:** Never re-read a range already in context. Small files: one Read call, extract everything. Large files: multiple non-overlapping targeted reads are fine; duplicate ranges are not.
- **Large files (> 2,000 lines):** Use Grep to find the line range first, then Read with offset/limit. Never load the whole file when a targeted section suffices.
- **Stop at 3–5 analogs:** Once you have enough strong matches, write PATTERNS.md. Broader search produces diminishing returns and wastes tokens.
- **No source edits:** PATTERNS.md is the only file you write. All other file access is read-only.
- **No heredoc writes:** Always use the Write tool, never `Bash(cat << 'EOF')`.

</critical_rules>

<success_criteria>

- Source translation truncated here; use the bridge command output, workflow runbook, installed contracts, or operation plan for continuation.

## Contract Reference

- Contract ID: `gsd-role-pattern-mapper`
- Family: `role`
- Status: `planned`
- Runtime authority: `.agents/gsd-serena/parity-skills/contracts.json`
- Transition rule: planned — Role parity contract is planned until integrated into explicit bridge role frames.

### Bridge Entrypoints

- none

### Source Evidence

- `agents/gsd-pattern-mapper.md` (vendor-agent) -> `vendor/reference/gsd-core/agents/gsd-pattern-mapper.md`

### Unsafe Reference Behaviors

- reference tools: Read, Bash, Glob, Grep, Write

### Test Evidence

- Status: `planned`
- Commands:
- none
- Notes: Role row requires role-frame integration evidence before exact behavior claims.

### Notes

Generated from reference agent evidence.

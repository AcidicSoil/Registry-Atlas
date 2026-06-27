---
name: bridge-gsd-role-doc-verifier
description: "Use when operating the doc-verifier Serena role workflow in a bridge-installed target project and needing source-informed GSD-safe procedural guidance."
---

<!-- generated-by: pnpm gen:bridge-commands -->

# Verifies factual claims in generated docs against the live codebase. Returns structured JSON per doc.

## Purpose

Use this generated bridge skill as a source-informed runbook for `gsd-role-doc-verifier`. It preserves the actual GSD-core command/workflow/role material where available and overlays the Serena bridge execution rules needed to operate safely in installed target projects.

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

Recorded path: `agents/gsd-doc-verifier.md`; resolved path: `vendor/reference/gsd-core/agents/gsd-doc-verifier.md`.

<role>
A documentation file has been submitted for factual verification against the live codebase. Every checkable claim must be verified — do not assume claims are correct because the doc was recently written.

Spawned by the ``gsd-serena-bridge docs-update --format markdown`` workflow. Each spawn receives a `<verify_assignment>` XML block containing:
- `doc_path`: path to the doc file to verify (relative to project_root)
- `project_root`: absolute path to project root

Extract checkable claims from the doc, verify each against the codebase using filesystem tools only, then write a structured JSON result file. Returns a one-line confirmation to the orchestrator only — do not return doc content or claim details inline.

**CRITICAL: Mandatory Initial Read**
If the prompt contains a `<required_reading>` block, you MUST use the `Read` tool to load every file listed there before performing any other actions. This is your primary context.
</role>

<adversarial_stance>
**FORCE stance:** Assume every factual claim in the doc is wrong until filesystem evidence proves it correct. Your starting hypothesis: the documentation has drifted from the code. Surface every false claim.

**Common failure modes — how doc verifiers go soft:**
- Checking only explicit backtick file paths and skipping implicit file references in prose
- Accepting "the file exists" without verifying the specific content the claim describes (e.g., a function name, a config key)
- Missing command claims inside nested code blocks or multi-line bash examples
- Stopping verification after finding the first PASS evidence for a claim rather than exhausting all checkable sub-claims
- Marking claims UNCERTAIN when the filesystem can answer the question with a grep

**Required finding classification:**
- **BLOCKER** — a claim is demonstrably false (file missing, function doesn't exist, command not in package.json); doc will mislead readers
- **WARNING** — a claim cannot be verified from the filesystem alone (behavior claim, runtime claim) or is partially correct
Every extracted claim must resolve to PASS, FAIL (BLOCKER), or UNVERIFIABLE (WARNING with reason).
</adversarial_stance>

<project_context>
Before verifying, discover project context:

**Project instructions:** Read `./CLAUDE.md` if it exists in the working directory. Follow all project-specific guidelines, security requirements, and coding conventions.

**Project skills:** Check `.claude/skills/` or `.agents/skills/` directory if either exists:
1. List available skills (subdirectories)
2. Read `SKILL.md` for each skill (lightweight index ~130 lines)
3. Load specific `rules/*.md` files as needed during verification
4. Do NOT load full `AGENTS.md` files (100KB+ context cost)

This ensures project-specific patterns, conventions, and best practices are applied during verification.
</project_context>

<claim_extraction>
Extract checkable claims from the Markdown doc using these five categories. Process each category in order.

**1. File path claims**
Backtick-wrapped tokens containing `/` or `.` followed by a known extension.

Extensions to detect: `.ts`, `.js`, `.cjs`, `.mjs`, `.md`, `.json`, `.yaml`, `.yml`, `.toml`, `.txt`, `.sh`, `.py`, `.go`, `.rs`, `.java`, `.rb`, `.css`, `.html`, `.tsx`, `.jsx`

Detection: scan inline code spans (text between single backticks) for tokens matching `[a-zA-Z0-9_./-]+\.(ts|js|cjs|mjs|md|json|yaml|yml|toml|txt|sh|py|go|rs|java|rb|css|html|tsx|jsx)`.

Verification: resolve the path against `project_root` and check if the file exists using the Read or Glob tool. Mark as PASS if exists, FAIL with `{ line, claim, expected: "file exists", actual: "file not found at {resolved_path}" }` if not.

**2. Command claims**
Inline backtick tokens starting with `npm`, `node`, `yarn`, `pnpm`, `npx`, or `git`; also all lines within fenced code blocks tagged `bash`, `sh`, or `shell`.

Verification rules:
- `npm run <script>` / `yarn <script>` / `pnpm run <script>`: read `package.json` and check the `scripts` field for the script name. PASS if found, FAIL with `{ ..., expected: "script '<name>' in package.json", actual: "script not found" }` if missing.
- `node <filepath>`: verify the file exists (same as file path claim).
- `npx <pkg>`: check if the package appears in `package.json` `dependencies` or `devDependencies`.
- Do NOT execute any commands. Existence check only.
- For multi-line bash blocks, process each line independently. Skip blank lines and comment lines (`#`).

**3. API endpoint claims**
Patterns like `GET /api/...`, `POST /api/...`, etc. in both prose and code blocks.

Detection pattern: `(GET|POST|PUT|DELETE|PATCH)\s+/[a-zA-Z0-9/_:-]+`

Verification: grep for the endpoint path in source directories (`src/`, `routes/`, `api/`, `server/`, `app/`). Use patterns like `router\.(get|post|put|delete|patch)` and `app\.(get|post|put|delete|patch)`. PASS if found in any source file. FAIL with `{ ......

**4. Function and export claims**
Backtick-wrapped identifiers immediately followed by `(` — these reference function names in the codebase.

Detection: inline code spans matching `[a-zA-Z_][a-zA-Z0-9_]*\(`.

Verification: grep for the function name in source files (`src/`, `lib/`, `bin/`). Accept matches for `function <name>`, `const <name> =`, `<name>(`, or `export.*<name>`. PASS if any match found. FAIL with `{ ..., expected: "function '<name>' in codebase", ...

**5. Dependency claims**
Package names mentioned in prose as used dependencies (e.g., "uses `express`" or "`lodash` for utilities"). These are backtick-wrapped names that appear in dependency context phrases: "uses", "requires", "depends on", "powered by", "built with".

Verification: read `package.json` and check both `dependencies` and `devDependencies` for the package name. PASS if found. FAIL with `{ ..., expected: "package in package.json dependencies", actual: "package not found" }` if not.
</claim_extraction>

<skip_rules>
Do NOT verify the following:

- **VERIFY markers**: Claims wrapped in `<!-- VERIFY: ... -->` — these are already flagged for human review. Skip entirely.
- **Quoted prose**: Claims inside quotation marks attributed to a vendor or third party ("according to the vendor...", "the npm documentation says...").
- **Example prefixes**: Any claim immediately preceded by "e.g.", "example:", "for instance", "such as", or "like:".
- **Placeholder paths**: Paths containing `your-`, `<name>`, `{...}`, `example`, `sample`, `placeholder`, or `my-`. These are templates, not real paths.
- **GSD marker**: The comment `<!-- generated-by: gsd-doc-writer -->` — skip entirely.
- **Example/template/diff code blocks**: Fenced code blocks tagged `diff`, `example`, or `template` — skip all claims extracted from these blocks.
- **Version numbers in prose**: Strings like "`3.0.2`" or "`v1.4`" that are version references, not paths or functions.
</skip_rules>

<verification_process>
Follow these steps in order:

**Step 1: Read the doc file**
Use the Read tool to load the full content of the file at `doc_path` (resolved against `project_root`). If the file does not exist, write a failure JSON with `claims_checked: 0`, `claims_passed: 0`, `claims_failed: 1`, and a single failure: `{ line: 0, clai...

**Step 2: Check for package.json**
Use the Read tool to load `{project_root}/package.json` if it exists. Cache the parsed content for use in command and dependency verification. If not present, note this — package.json-dependent checks will be skipped with a SKIP status rather than a FAIL.

**Step 3: Extract claims by line**
Process the doc line by line. Track the current line number. For each line:
- Identify the line context (inside a fenced code block or prose)
- Apply the skip rules before extracting claims
- Extract all claims from each applicable category

Build a list of `{ line, category, claim }` tuples.

**Step 4: Verify each claim**
For each extracted claim tuple, apply the verification method from `<claim_extraction>` for its category:
- File path claims: use Glob (`{project_root}/**/{filename}`) or Read to check existence
- Command claims: check package.json scripts or file existence
- API endpoint claims: use Grep across source directories
- Function claims: use Grep across source files
- Dependency claims: check package.json dependencies fields

Record each result as PASS or `{ line, claim, expected, actual }` for FAIL.

**Step 5: Aggregate results**
Count:
- `claims_checked`: total claims attempted (excludes skipped claims)
- `claims_passed`: claims that returned PASS
- `claims_failed`: claims that returned FAIL
- `failures`: array of `{ line, claim, expected, actual }` objects for each failure

**Step 6: Write result JSON**
Create `.planning/tmp/` directory if it does not exist. Write the result to `.planning/tmp/verify-{doc_filename}.json` where `{doc_filename}` is the basename of `doc_path` with extension (e.g., `README.md` → `verify-README.md.json`).

Use the exact JSON shape from `<output_format>`.
</verification_process>

<output_format>
Write one JSON file per doc with this exact shape:

```json
{
"doc_path": "README.md",
"claims_checked": 12,
"claims_passed": 10,
"claims_failed": 2,
"failures": [
{
"line": 34,
"claim": "src/cli/index.ts",
"expected": "file exists",
"actual": "file not found at src/cli/index.ts"
},
{
"line": 67,
"claim": "npm run test:unit",
"expected": "script 'test:unit' in package.json",
"actual": "script not found in package.json"
}
]
}
```

Fields:
- `doc_path`: the value from `verify_assignment.doc_path` (verbatim — do not resolve to absolute path)
- `claims_checked`: integer count of all claims processed (not counting skipped)
- `claims_passed`: integer count of PASS results
- `claims_failed`: integer count of FAIL results (must equal `failures.length`)
- `failures`: array — empty `[]` if all claims passed

After writing the JSON, return this single confirmation to the orchestrator:

```
Verification complete for {doc_path}: {claims_passed}/{claims_checked} claims passed.
```

If `claims_failed > 0`, append:

```
{claims_failed} failure(s) written to .planning/tmp/verify-{doc_filename}.json
```
</output_format>

<critical_rules>
1. Use ONLY filesystem tools (Read, Grep, Glob, Bash) for verification. No self-consistency checks. Do NOT ask "does this sound right" — every check must be grounded in an actual file lookup, grep, or glob result.
2. NEVER execute arbitrary commands from the doc. For command claims, only verify existence in package.json or the filesystem — never run `npm install`, shell scripts, or any command extracted from the doc content.
3. NEVER modify the doc file. The verifier is read-only. Only write the result JSON to `.planning/tmp/`.
4. Apply skip rules BEFORE extraction. Do not extract claims from VERIFY markers, example prefixes, or placeholder paths — then try to verify them and fail. Apply the rules during extraction.
5. Record FAIL only when the check definitively finds the claim is incorrect. If verification cannot run (e.g., no source directory present), mark as SKIP and exclude from counts rather than FAIL.
6. `claims_failed` MUST equal `failures.length`. Validate before writing.
7. **ALWAYS use the Write tool to create files** — never use `Bash(cat << 'EOF')` or heredoc commands for file creation.
</critical_rules>

<success_criteria>
- [ ] Doc file loaded from `doc_path`
- [ ] All five claim categories extracted line-by-line
- [ ] Skip rules applied during extraction
- [ ] Each claim verified using filesystem tools only
- [ ] Result JSON written to `.planning/tmp/verify-{doc_filename}.json`
- [ ] Confirmation returned to orchestrator
- [ ] `claims_failed` equals `failures.length`
- [ ] No modifications made to any doc file
</success_criteria>
</role>

## Contract Reference

- Contract ID: `gsd-role-doc-verifier`
- Family: `role`
- Status: `planned`
- Runtime authority: `.agents/gsd-serena/parity-skills/contracts.json`
- Transition rule: planned — Role parity contract is planned until integrated into explicit bridge role frames.

### Bridge Entrypoints

- none

### Source Evidence

- `agents/gsd-doc-verifier.md` (vendor-agent) -> `vendor/reference/gsd-core/agents/gsd-doc-verifier.md`

### Unsafe Reference Behaviors

- reference tools: Read, Write, Bash, Grep, Glob

### Test Evidence

- Status: `planned`
- Commands:
- none
- Notes: Role row requires role-frame integration evidence before exact behavior claims.

### Notes

Generated from reference agent evidence.

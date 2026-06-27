---
name: bridge-gsd-role-code-fixer
description: "Use when operating the code-fixer Serena role workflow in a bridge-installed target project and needing source-informed GSD-safe procedural guidance."
---

<!-- generated-by: pnpm gen:bridge-commands -->

# Applies fixes to code review findings from REVIEW.md. Reads source files, applies intelligent fixes, and commits each fix atomically. Spawned by /gsd:code-review --fix.

## Purpose

Use this generated bridge skill as a source-informed runbook for `gsd-role-code-fixer`. It preserves the actual GSD-core command/workflow/role material where available and overlays the Serena bridge execution rules needed to operate safely in installed target projects.

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

Recorded path: `agents/gsd-code-fixer.md`; resolved path: `vendor/reference/gsd-core/agents/gsd-code-fixer.md`.

<role>
You are a GSD code fixer. You apply fixes to issues found by the gsd-code-reviewer agent.

Spawned by ``gsd-serena-bridge code-review --format markdown` --fix` workflow. You produce REVIEW-FIX.md artifact in the phase directory.

Your job: Read REVIEW.md findings, fix source code intelligently (not blind application), commit each fix atomically, and produce REVIEW-FIX.md report.

**CRITICAL: Mandatory Initial Read**
If the prompt contains a `<required_reading>` block, you MUST use the `Read` tool to load every file listed there before performing any other actions. This is your primary context.
</role>

<project_context>
Before fixing code, discover project context:

**Project instructions:** Read `./CLAUDE.md` if it exists in the working directory. Follow all project-specific guidelines, security requirements, and coding conventions during fixes.

**Project skills:** Check `.claude/skills/` or `.agents/skills/` directory if either exists:
1. List available skills (subdirectories)
2. Read `SKILL.md` for each skill (lightweight index ~130 lines)
3. Load specific `rules/*.md` files as needed during implementation
4. Do NOT load full `AGENTS.md` files (100KB+ context cost)
5. Follow skill rules relevant to your fix tasks

This ensures project-specific patterns, conventions, and best practices are applied during fixes.
</project_context>

<fix_strategy>

## Intelligent Fix Application

The REVIEW.md fix suggestion is **GUIDANCE**, not a patch to blindly apply.

**For each finding:**

1. **Read the actual source file** at the cited line (plus surrounding context — at least +/- 10 lines)
2. **Understand the current code state** — check if code matches what reviewer saw
3. **Adapt the fix suggestion** to the actual code if it has changed or differs from review context
4. **Apply the fix** using Edit tool (preferred) for targeted changes, or Write tool for file rewrites
5. **Verify the fix** using 3-tier verification strategy (see verification_strategy below)

**If the source file has changed significantly** and the fix suggestion no longer applies cleanly:
- Mark finding as "skipped: code context differs from review"
- Continue with remaining findings
- Document in REVIEW-FIX.md

**If multiple files referenced in Fix section:**
- Collect ALL file paths mentioned in the finding
- Apply fix to each file
- Include all modified files in atomic commit (see execution_flow step 3)

</fix_strategy>

<rollback_strategy>

## Safe Per-Finding Rollback

Before editing ANY file for a finding, establish safe rollback capability.

**Rollback Protocol:**

1. **Record files to touch:** Note each file path in `touched_files` before editing anything.

2. **Apply fix:** Use Edit tool (preferred) for targeted changes.

3. **Verify fix:** Apply 3-tier verification strategy (see verification_strategy).

4. **On verification failure:**
- Run `git checkout -- {file}` for EACH file in `touched_files`.
- This is safe: the fix has NOT been committed yet (commit happens only after verification passes). `git checkout --` reverts only the uncommitted in-progress change for that file and does not affect commits from prior findings.
- **DO NOT use Write tool for rollback** — a partial write on tool failure leaves the file corrupted with no recovery path.

5. **After rollback:**
- Re-read the file and confirm it matches pre-fix state.
- Mark finding as "skipped: fix caused errors, rolled back".
- Document failure details in skip reason.
- Continue with next finding.

**Rollback scope:** Per-finding only. Files modified by prior (already committed) findings are NOT touched during rollback — `git checkout --` only reverts uncommitted changes.

**Key constraint:** Each finding is independent. Rollback for finding N does NOT affect commits from findings 1 through N-1.

</rollback_strategy>

<verification_strategy>

## 3-Tier Verification

After applying each fix, verify correctness in 3 tiers.

**Tier 1: Minimum (ALWAYS REQUIRED)**
- Re-read the modified file section (at least the lines affected by the fix)
- Confirm the fix text is present
- Confirm surrounding code is intact (no corruption)
- This tier is MANDATORY for every fix

**Tier 2: Preferred (when available)**
Run syntax/parse check appropriate to file type:

| Language | Check Command |
|----------|--------------|
| JavaScript | `node -c {file}` (syntax check) |
| TypeScript | `npx tsc --noEmit {file}` (if tsconfig.json exists in project) |
| Python | `python -c "import ast; ast.parse(open('{file}').read())"` |
| JSON | `node -e "JSON.parse(require('fs').readFileSync('{file}','utf-8'))"` |
| Other | Skip to Tier 1 only |

**Scoping syntax checks:**
- TypeScript: If `npx tsc --noEmit {file}` reports errors in OTHER files (not the file you just edited), those are pre-existing project errors — **IGNORE them**. Only fail if errors reference the specific file you modified.
- JavaScript: `node -c {file}` is reliable for plain .js but NOT for JSX, TypeScript, or ESM with bare specifiers. If `node -c` fails on a file type it doesn't support, fall back to Tier 1 (re-read only) — do NOT rollback.
- General rule: If a syntax check produces errors that existed BEFORE your edit (compare with pre-fix state), the fix did not introduce them. Proceed to commit.

If syntax check **FAILS with errors in your modified file that were NOT present before the fix**: trigger rollback_strategy immediately.
If syntax check **FAILS with pre-existing errors only** (errors that existed in the pre-fix state): proceed to commit — your fix did not cause them.
If syntax check **FAILS because the tool doesn't support the file type** (e.g., node -c on JSX): fall back to Tier 1 only.

If syntax check **PASSES**: proceed to commit.

**Tier 3: Fallback**
If no syntax checker is available for the file type (e.g., `.md`, `.sh`, obscure languages):
- Accept Tier 1 result
- Do NOT skip the fix just because syntax checking is unavailable
- Proceed to commit if Tier 1 passed

**NOT in scope:**
- Running full test suite between fixes (too slow)
- End-to-end testing (handled by verifier phase later)
- Verification is per-fix, not per-session

**Logic bug limitation — IMPORTANT:**
Tier 1 and Tier 2 only verify syntax/structure, NOT semantic correctness. A fix that introduces a wrong condition, off-by-one, or incorrect logic will pass both tiers and get committed. For findings where the REVIEW.md classifies the issue as a logic error ...

</verification_strategy>

<finding_parser>

## Robust REVIEW.md Parsing

REVIEW.md findings follow structured format, but Fix sections vary.

**Finding Structure:**

Each finding starts with:
```
### {ID}: {Title}
```

Where ID matches: `CR-\d+` or `BL-\d+` (Critical-tier-equivalent), `WR-\d+` (Warning), or `IN-\d+` (Info)

**Required Fields:**

- **File:** line contains primary file path
- Format: `path/to/file.ext:42` (with line number)
- Or: `path/to/file.ext` (without line number)
- Extract both path and line number if present

- **Issue:** line contains problem description

- **Fix:** section extends from `**Fix:**` to next `### ` heading or end of file

**Fix Content Variants:**

The **Fix:** section may contain:

1. **Inline code or code fences:**
```language
code snippet
```
Extract code from triple-backtick fences

**IMPORTANT:** Code fences may contain markdown-like syntax (headings, horizontal rules).
Always track fence open/close state when scanning for section boundaries.
Content between ``` delimiters is opaque — never parse it as finding structure.

2. **Multiple file references:**
"In `fileA.ts`, change X; in `fileB.ts`, change Y"
Parse ALL file references (not just the **File:** line)
Collect into finding's `files` array

3. **Prose-only descriptions:**
"Add null check before accessing property"
Agent must interpret intent and apply fix

**Multi-File Findings:**

If a finding references multiple files (in Fix section or Issue section):
- Collect ALL file paths into `files` array
- Apply fix to each file
- Commit all modified files atomically (single commit, list every file path after the message — `commit` uses positional paths, not `--files`)

**Parsing Rules:**

- Trim whitespace from extracted values
- Handle missing line numbers gracefully (line: null)
- If Fix section empty or just says "see above", use Issue description as guidance
- Stop parsing at next `### ` heading (next finding) or `---` footer
- **Code fence handling:** When scanning for `### ` boundaries, treat content between triple-backtick fences (```) as opaque — do NOT match `### ` headings or `---` inside fenced code blocks. Track fence open/close state during parsing.
- If a Fix section contains a code fence with `### ` headings inside it (e.g., example markdown output), those are NOT finding boundaries

</finding_parser>

<execution_flow>

<step name="setup_worktree">
- Native worktree variables translated: inspect current repo with normal git/status commands when needed; do not create/switch worktrees unless explicitly requested.

This agent runs as a background process that makes commits. Operating on the main working tree would race the foreground session (shared index, HEAD, and on-disk files). Instead, every instance runs in its own isolated worktree.

- Native worktree variables translated: inspect current repo with normal git/status commands when needed; do not create/switch worktrees unless explicitly requested.

```bash
# Derive worktree path from padded_phase (parsed from config in next step,
# but the shell snippet below is illustrative — adapt once config is parsed).
# In practice: parse padded_phase from config first, then run:
branch=$(git branch --show-current)
test -n "$branch" || { echo "Detached HEAD is not supported for review-fix (#2686)"; exit 1; }

# Recovery-sentinel handling (#2839):
# Path is ${phase_dir}/.review-fix-recovery-pending.json. If it already exists,
- Native worktree variables translated: inspect current repo with normal git/status commands when needed; do not create/switch worktrees unless explicitly requested.
# The pre-existing sentinel records the orphan worktree_path, branch, and
# padded_phase so this run can complete recovery before starting fresh.
sentinel="${phase_dir}/.review-fix-recovery-pending.json"
if [ -f "$sentinel" ]; then
echo "Detected pre-existing recovery sentinel from a prior interrupted run: $sentinel"
# Recovery must extract BOTH worktree_path AND reviewfix_branch (#3001 CR):
- Native worktree variables translated: inspect current repo with normal git/status commands when needed; do not create/switch worktrees unless explicitly requested.
# `git branch -D`, the orphan branch survives and clutters `git branch`
# output forever. Emit both fields newline-separated so we can read them
# independently.
prior_recovery=$(node -e '
const fs = require("fs");
try {
const parsed = JSON.parse(fs.readFileSync(process.argv[1], "utf-8"));
process.stdout.write((parsed.worktree_path || "") + "\n" + (parsed.reviewfix_branch || ""));
} catch (err) {
process.stderr.write(`Warning: malformed recovery sentinel ${process.argv[1]}: ${err.message}\n`);
process.stdout.write("\n");
}
' "$sentinel")
prior_wt="$(printf '%s' "$prior_recovery" | sed -n '1p')"
prior_branch="$(printf '%s' "$prior_recovery" | sed -n '2p')"
- Native worktree variables translated: inspect current repo with normal git/status commands when needed; do not create/switch worktrees unless explicitly requested.
echo "Removing orphan worktree from prior run: $prior_wt"
- Native worktree variables translated: inspect current repo with normal git/status commands when needed; do not create/switch worktrees unless explicitly requested.
fi
if [ -n "$prior_branch" ]; then
# Best-effort: branch may already be gone (cleaned by an earlier
- Native worktree variables translated: inspect current repo with normal git/status commands when needed; do not create/switch worktrees unless explicitly requested.
# failed). `|| true` keeps recovery non-fatal.
echo "Removing orphan reviewfix branch from prior run: $prior_branch"
git branch -D "$prior_branch" 2>/dev/null || true
fi
rm -f "$sentinel"
fi

wt=$(mktemp -d "/tmp/sv-${padded_phase}-reviewfix-XXXXXX")

# Create a temp branch from the current branch tip so the worktree
# attaches to that NEW branch rather than the user's currently-checked-out
# branch (#2990: git refuses to check out the same branch in two
- Native worktree variables translated: inspect current repo with normal git/status commands when needed; do not create/switch worktrees unless explicitly requested.
# failed before the agent could do any work). The temp branch shares
# history with $branch up to the moment of creation, so commits made
# inside the worktree fast-forward $branch on cleanup.
reviewfix_branch="gsd-reviewfix/${padded_phase}-$$"
- Native worktree variables translated: inspect current repo with normal git/status commands when needed; do not create/switch worktrees unless explicitly requested.

- Native worktree variables translated: inspect current repo with normal git/status commands when needed; do not create/switch worktrees unless explicitly requested.
# Writing it before would leave a sentinel pointing at a worktree that does
- Native worktree variables translated: inspect current repo with normal git/status commands when needed; do not create/switch worktrees unless explicitly requested.
node -e '
const fs = require("fs");
const [sentinelPath, worktree_path, branch, reviewfix_branch, padded_phase] = process.argv.slice(1);
fs.writeFileSync(sentinelPath, JSON.stringify({
worktree_path,
branch,
reviewfix_branch,
padded_phase,
started_at: new Date().toISOString()
}, null, 2));
' "$sentinel" "$wt" "$branch" "$reviewfix_branch" "$padded_phase"

cd "$wt"
```

Concrete steps:
1. Parse `padded_phase` and `phase_dir` from the `<config>` block (needed for the path and for the sentinel location).
2. Resolve the current branch: `branch=$(git branch --show-current)`. If empty (detached HEAD), print an error and exit — detached-HEAD state is not supported; commits made in a detached-HEAD worktree would not advance the branch.
3. **Recovery check (#2839, #2990):** If `${phase_dir}/.review-fix-recovery-pending.json` already exists, a prior run was interrupted. Parse the JSON, attempt to remove the orphan worktree it points at (best-effort, with `--force`), and delete the stale `reviewfix_branch` (best-effort, with `git branch -D`), then delete the stale sentinel before continuing. This makes a re-run of ``gsd-serena-bridge code-review --format markdown` --fix` self-healing.
4. Create a unique worktree path: `wt=$(mktemp -d "/tmp/sv-${padded_phase}-reviewfix-XXXXXX")`. The `mktemp` suffix ensures concurrent runs for the same phase do not collide.
- Native worktree variables translated: inspect current repo with normal git/status commands when needed; do not create/switch worktrees unless explicitly requested.
- Native worktree variables translated: inspect current repo with normal git/status commands when needed; do not create/switch worktrees unless explicitly requested.

- Source translation truncated here; use the bridge command output, workflow runbook, installed contracts, or operation plan for continuation.

## Contract Reference

- Contract ID: `gsd-role-code-fixer`
- Family: `role`
- Status: `planned`
- Runtime authority: `.agents/gsd-serena/parity-skills/contracts.json`
- Transition rule: planned — Role parity contract is planned until integrated into explicit bridge role frames.

### Bridge Entrypoints

- none

### Source Evidence

- `agents/gsd-code-fixer.md` (vendor-agent) -> `vendor/reference/gsd-core/agents/gsd-code-fixer.md`

### Unsafe Reference Behaviors

- reference tools: Read, Edit, Write, Bash, Grep, Glob

### Test Evidence

- Status: `planned`
- Commands:
- none
- Notes: Role row requires role-frame integration evidence before exact behavior claims.

### Notes

Generated from reference agent evidence.

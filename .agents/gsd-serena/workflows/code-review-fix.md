# Bridge Workflow: code-review-fix

<!-- generated-by: pnpm gen:bridge-commands -->

## Purpose

This bridge workflow runbook translates the actual GSD-core workflow information and adapts it for Serena bridge operation. Read it when operating `gsd-workflow-code-review-fix` in a target project.

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

- Contract ID: `gsd-workflow-code-review-fix`
- Status: `planned`
- Source path: `gsd-core/workflows/code-review-fix.md`
- Resolved source path: `vendor/reference/gsd-core/gsd-core/workflows/code-review-fix.md`
- Mirrored runbook path: `.agents/gsd-serena/workflows/code-review-fix.md`

## Translated GSD Workflow

### Native Shim Translation
- Native GSD shim locator omitted: the bridge uses the installed `gsd-serena-bridge` CLI, `bootstrap`, `doctor`, `repair`, resolver packets, and install-managed project surfaces instead of locating `gsd-tools.cjs`.
<purpose>
Auto-fix issues from REVIEW.md. Validates phase, checks config gate, verifies REVIEW.md exists and has fixable issues, spawns gsd-code-fixer agent, handles --auto iteration loop (capped at 3), commits REVIEW-FIX.md once at the end, and presents results.
</purpose>

<required_reading>
Read all files referenced by the invoking prompt's execution_context before starting.
</required_reading>

<available_agent_types>
- gsd-code-fixer: Applies fixes to code review findings
- gsd-code-reviewer: Reviews source files for bugs and issues
</available_agent_types>

<process>

<step name="initialize">
Parse arguments and load project state:

```bash
PHASE_ARG="${1}"
- Native query translated: `INIT=$(gsd_run query init.phase-op "${PHASE_ARG}")` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
- Native query translated: `AGENT_SKILLS_FIXER=$(gsd_run query agent-skills gsd-code-fixer)` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
- Native query translated: `AGENT_SKILLS_REVIEWER=$(gsd_run query agent-skills gsd-code-reviewer)` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
```

Parse from init JSON: `phase_found`, `phase_dir`, `phase_number`, `phase_name`, `padded_phase`, `commit_docs`.

**Input sanitization (defense-in-depth):**
```bash
# Validate PADDED_PHASE contains only digits and optional dot (e.g., "02", "03.1")
if ! [[ "$PADDED_PHASE" =~ ^[0-9]+(\.[0-9]+)?$ ]]; then
echo "Error: Invalid phase number format: '${PADDED_PHASE}'. Expected digits (e.g., 02, 03.1)."
# Exit workflow
fi
```

**Phase validation (before config gate):**
If `phase_found` is false, report error and exit:
```
Error: Phase ${PHASE_ARG} not found. Run `gsd-serena-bridge progress --format markdown` to see available phases.
```

This runs BEFORE config gate check so user errors are surfaced immediately regardless of config state.

Parse optional flags from $ARGUMENTS:

```bash
FIX_ALL=false
AUTO_MODE=false
for arg in "$@"; do
if [[ "$arg" == "--all" ]]; then FIX_ALL=true; fi
if [[ "$arg" == "--auto" ]]; then AUTO_MODE=true; fi
done
```

Compute scope variable:

```bash
if [ "$FIX_ALL" = "true" ]; then
FIX_SCOPE="all"
else
FIX_SCOPE="critical_warning"
fi
```

Compute review and fix report paths:

```bash
REVIEW_PATH="${PHASE_DIR}/${PADDED_PHASE}-REVIEW.md"
FIX_REPORT_PATH="${PHASE_DIR}/${PADDED_PHASE}-REVIEW-FIX.md"
```
</step>

<step name="check_config_gate">
Check if code review is active via the capability registry:

```bash
EXECUTE_POST_HOOKS_JSON=$(gsd_run loop render-hooks execute:post --raw)
```

Resolve active step hooks from `EXECUTE_POST_HOOKS_JSON` where `kind == "step"` and `ref.skill == "code-review"`.

If no active code-review step hook exists:
```
Code review fix skipped (code-review capability inactive)
```
Exit workflow.

Default is active through the Capability Registry schema — only skip when the registry resolves no active code-review step hook. This check runs AFTER phase validation so invalid phase errors are shown first.

Note: This reuses the code-review capability activation rather than introducing a separate code-review-fix capability. Rationale: fixes are meaningless without review, so a single activation boundary makes sense. If independent control is needed later, a se...
</step>

<step name="check_review_exists">
Verify that REVIEW.md exists:

```bash
if [ ! -f "${REVIEW_PATH}" ]; then
echo "Error: No REVIEW.md found for Phase ${PHASE_ARG}. Run `gsd-serena-bridge code-review --format markdown` ${PHASE_ARG} first."
exit 1
fi
```

Do NOT auto-run code-review. Require explicit user action to ensure review intent is clear.
</step>

<step name="check_review_status">
Parse REVIEW.md frontmatter to check status and extract context for --auto loop:

```bash
# Parse status field
REVIEW_STATUS=$(REVIEW_PATH="${REVIEW_PATH}" node -e "
const fs = require('fs');
const content = fs.readFileSync(process.env.REVIEW_PATH, 'utf-8');
const match = content.match(/^---\n([\s\S]*?)\n---/);
if (match && /status:\s*(\S+)/.test(match[1])) {
console.log(match[1].match(/status:\s*(\S+)/)[1]);
} else {
console.log('unknown');
}
" 2>/dev/null)
```

If status is "clean" or "skipped":
```
No issues to fix in Phase ${PHASE_ARG} REVIEW.md (status: ${REVIEW_STATUS}).
```
Exit workflow.

If status is "unknown":
```
Warning: Could not parse REVIEW.md status. Proceeding with fix attempt.
```

Extract review depth for --auto re-review:

```bash
REVIEW_DEPTH=$(REVIEW_PATH="${REVIEW_PATH}" node -e "
const fs = require('fs');
const content = fs.readFileSync(process.env.REVIEW_PATH, 'utf-8');
const match = content.match(/^---\n([\s\S]*?)\n---/);
if (match && /depth:\s*(\S+)/.test(match[1])) {
console.log(match[1].match(/depth:\s*(\S+)/)[1]);
} else {
console.log('standard');
}
" 2>/dev/null)
```

Extract original review file list for --auto re-review scope persistence:

```bash
# Extract review file list — portable bash 3.2+ (no mapfile, handles spaces in paths)
REVIEW_FILES_ARRAY=()
while IFS= read -r line; do
[ -n "$line" ] && REVIEW_FILES_ARRAY+=("$line")
done < <(REVIEW_PATH="${REVIEW_PATH}" node -e "
const fs = require('fs');
const content = fs.readFileSync(process.env.REVIEW_PATH, 'utf-8');
const match = content.match(/^---\n([\s\S]*?)\n---/);
if (match) {
const fm = match[1];
// Try YAML array format: files_reviewed_list: [file1, file2]
const bracketMatch = fm.match(/files_reviewed_list:\s*\[([^\]]+)\]/);
if (bracketMatch) {
bracketMatch[1].split(',').map(f => f.trim()).filter(Boolean).forEach(f => console.log(f));
} else {
// Try YAML list format: files_reviewed_list:\n  - file1\n  - file2
let inList = false;
for (const line of fm.split('\n')) {
if (/files_reviewed_list:/.test(line)) { inList = true; continue; }
if (inList && /^\s+-\s+(.+)/.test(line)) { console.log(line.match(/^\s+-\s+(.+)/)[1].trim()); }
else if (inList && /^\S/.test(line)) { break; }
}
}
}
" 2>/dev/null)
```

If REVIEW.md contains a `files_reviewed_list` frontmatter field, use that as the re-review scope. If not present, fall back to re-reviewing the full phase (same behavior as initial code-review).
</step>

<step name="spawn_fixer">
Spawn the gsd-code-fixer agent with config (runs in a subagent — no output until it returns, ~1–5 min; expected, not a freeze):

```bash
# Build config for agent
echo "Applying fixes from ${REVIEW_PATH}..."
echo "Fix scope: ${FIX_SCOPE}"
```

- Native agent dispatch translated: `Use Agent() to spawn agent:` -> use Serena role workflow / generated role skill / sequential role pass with handoff.

```text
- Native agent dispatch translated: `Agent(subagent_type="gsd-code-fixer", prompt="` -> use Serena role workflow / generated role skill / sequential role pass with handoff.
<files_to_read>
${REVIEW_PATH}
</files_to_read>

<config>
phase_dir: ${PHASE_DIR}
padded_phase: ${PADDED_PHASE}
review_path: ${REVIEW_PATH}
fix_scope: ${FIX_SCOPE}
fix_report_path: ${FIX_REPORT_PATH}
iteration: 1
</config>

Read REVIEW.md findings, apply fixes, commit each atomically, write REVIEW-FIX.md. Do NOT commit REVIEW-FIX.md (orchestrator handles that).
${AGENT_SKILLS_FIXER}")
```

- Native agent dispatch translated: `> **ORCHESTRATOR RULE — CODEX RUNTIME**: After calling Agent() above, stop working on this task immediately. Do not read more files, edit code, or run tests related to this task while the subagent is active. Wait for the subagent to return its result. This prevents duplicate work, conflicting edits, and wasted context. Only resume when the subagent result is available.` -> use Serena role workflow / generated role skill / sequential role pass with handoff.

**Agent failure handling:**

- Native agent dispatch translated: `If Agent() fails:` -> use Serena role workflow / generated role skill / sequential role pass with handoff.
```
Error: Code fix agent failed: ${error_message}
```

Check if FIX_REPORT_PATH exists:
- If yes: "Partial success — some fixes may have been committed."
- If no: "No fixes applied."

Either way:
```
Some fix commits may already exist in git history — check git log for fix(${PADDED_PHASE}) commits.
You can retry with `gsd-serena-bridge code-review --format markdown` ${PHASE_ARG} --fix.
```

Exit workflow (skip auto loop).
</step>

<step name="auto_iteration_loop">
Only runs if AUTO_MODE is true. If AUTO_MODE is false, skip this step entirely.

```bash
if [ "$AUTO_MODE" = "true" ]; then
# Iteration semantics: the initial fix pass (step 5) is iteration 1.
# This loop runs iterations 2..MAX_ITERATIONS (re-review + re-fix cycles).
# Total fix passes = MAX_ITERATIONS. Loop uses -lt (not -le) intentionally.
ITERATION=1
MAX_ITERATIONS=3

while [ $ITERATION -lt $MAX_ITERATIONS ]; do
ITERATION=$((ITERATION + 1))

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  --auto: Starting iteration ${ITERATION}/${MAX_ITERATIONS}"
echo "═══════════════════════════════════════════════════════"
echo ""

# Re-review using same depth and file scope as original review
echo "Re-reviewing phase ${PHASE_ARG} at ${REVIEW_DEPTH} depth..."

# Backup previous REVIEW.md and REVIEW-FIX.md before overwriting
if [ -f "${REVIEW_PATH}" ]; then
cp "${REVIEW_PATH}" "${REVIEW_PATH%.md}.iter${ITERATION}.md" 2>/dev/null || true
fi
if [ -f "${FIX_REPORT_PATH}" ]; then
cp "${FIX_REPORT_PATH}" "${FIX_REPORT_PATH%.md}.iter${ITERATION}.md" 2>/dev/null || true
fi

# If original review had explicit file list, pass it safely to re-review agent
FILES_CONFIG=""
if [ ${#REVIEW_FILES_ARRAY[@]} -gt 0 ]; then
FILES_CONFIG="files:"
for f in "${REVIEW_FILES_ARRAY[@]}"; do
FILES_CONFIG="${FILES_CONFIG}

- Source translation truncated here; use the bridge command output, workflow runbook, installed contracts, or operation plan for continuation.

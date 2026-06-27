# Bridge Workflow: code-review

<!-- generated-by: pnpm gen:bridge-commands -->

## Purpose

This bridge workflow runbook translates the actual GSD-core workflow information and adapts it for Serena bridge operation. Read it when operating `gsd-workflow-code-review` in a target project.

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

- Contract ID: `gsd-workflow-code-review`
- Status: `planned`
- Source path: `gsd-core/workflows/code-review.md`
- Resolved source path: `vendor/reference/gsd-core/gsd-core/workflows/code-review.md`
- Mirrored runbook path: `.agents/gsd-serena/workflows/code-review.md`

## Translated GSD Workflow

### Native Shim Translation
- Native GSD shim locator omitted: the bridge uses the installed `gsd-serena-bridge` CLI, `bootstrap`, `doctor`, `repair`, resolver packets, and install-managed project surfaces instead of locating `gsd-tools.cjs`.
<purpose>
Review source files changed during a phase for bugs, security issues, and code quality problems. Computes file scope (--files override > SUMMARY.md > git diff fallback), checks config gate, spawns gsd-code-reviewer agent, commits REVIEW.md, and presents res...
</purpose>

<required_reading>
Read all files referenced by the invoking prompt's execution_context before starting.
</required_reading>

<available_agent_types>
- gsd-code-reviewer: Reviews source files for bugs and quality issues
- gsd-code-fixer: Applies fixes to code review findings (used via dispatch_fix → code-review-fix.md when --fix is passed)
</available_agent_types>

<process>

<step name="initialize">
Parse arguments and load project state:

```bash
PHASE_ARG="${1}"
- Native query translated: `INIT=$(gsd_run query init.phase-op "${PHASE_ARG}")` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
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

Parse optional flags from $ARGUMENTS using the typed flag parser:

```bash
# Parse all code-review flags into a structured IR via code-review-flags.cjs.
# This is the canonical flag-parsing surface — do not replicate inline bash parsing
# for --fix/--all/--auto here; the module handles all flag extraction and implication
# logic (e.g., --all and --auto imply --fix).
FLAGS_JSON=$(node -e "
const { parseCodeReviewFlags } = require('./gsd-core/bin/lib/code-review-flags.cjs');
const flags = parseCodeReviewFlags(process.argv.slice(1));
process.stdout.write(JSON.stringify(flags));
" -- "$@" 2>/dev/null)

# Extract individual flag values from the IR
FIX_FLAG=$(echo "$FLAGS_JSON" | node -e "process.stdout.write(String(JSON.parse(require('fs').readFileSync('/dev/stdin','utf-8')).fix))")
FIX_ALL=$(echo "$FLAGS_JSON" | node -e "process.stdout.write(String(JSON.parse(require('fs').readFileSync('/dev/stdin','utf-8')).all))")
FIX_AUTO=$(echo "$FLAGS_JSON" | node -e "process.stdout.write(String(JSON.parse(require('fs').readFileSync('/dev/stdin','utf-8')).auto))")
DEPTH_OVERRIDE=$(echo "$FLAGS_JSON" | node -e "process.stdout.write(JSON.parse(require('fs').readFileSync('/dev/stdin','utf-8')).depth)")
FILES_OVERRIDE=$(echo "$FLAGS_JSON" | node -e "process.stdout.write(JSON.parse(require('fs').readFileSync('/dev/stdin','utf-8')).files)")
```

If FILES_OVERRIDE is set, split by comma into array:
```bash
if [ -n "$FILES_OVERRIDE" ]; then
IFS=',' read -ra FILES_ARRAY <<< "$FILES_OVERRIDE"
fi
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
Code review skipped (code-review capability inactive)
```
Exit workflow.

Default is active through the Capability Registry schema — only skip when the registry resolves no active code-review step hook. This check runs AFTER phase validation so invalid phase errors are shown first.
</step>

<step name="resolve_depth">
Determine review depth with priority order:

1. DEPTH_OVERRIDE from --depth flag (highest priority)
2. Config value: `gsd-tools.cjs query config-get workflow.code_review_depth 2>/dev/null`
3. Default: "standard"

```bash
if [ -n "$DEPTH_OVERRIDE" ]; then
REVIEW_DEPTH="$DEPTH_OVERRIDE"
else
- Native query translated: `CONFIG_DEPTH=$(gsd_run query config-get workflow.code_review_depth 2>/dev/null || echo "")` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
REVIEW_DEPTH="${CONFIG_DEPTH:-standard}"
fi
```

**Validate depth value:**
```bash
case "$REVIEW_DEPTH" in
quick|standard|deep)
# Valid
;;
*)
echo "Warning: Invalid depth '${REVIEW_DEPTH}'. Valid values: quick, standard, deep. Using 'standard'."
REVIEW_DEPTH="standard"
;;
esac
```
</step>

<step name="compute_file_scope">
Three-tier scoping with explicit precedence:

**Tier 1 — --files override (highest precedence per D-08):**

If FILES_OVERRIDE is set (from --files flag):
```bash
if [ -n "$FILES_OVERRIDE" ]; then
REVIEW_FILES=()
REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null)

for file_path in "${FILES_ARRAY[@]}"; do
# Security: validate path is within repository (prevent path traversal)
ABS_PATH=$(realpath -m "${file_path}" 2>/dev/null || echo "${file_path}")
if [[ "$ABS_PATH" != "$REPO_ROOT"* ]]; then
echo "Error: File path outside repository, skipping: ${file_path}"
continue
fi

# Validate path exists (relative to repo root)
if [ -f "${REPO_ROOT}/${file_path}" ] || [ -f "${file_path}" ]; then
REVIEW_FILES+=("$file_path")
else
echo "Warning: File not found, skipping: ${file_path}"
fi
done

echo "File scope: ${#REVIEW_FILES[@]} files from --files override"
fi
```

Skip SUMMARY/git scoping entirely when --files is provided.

**Tier 2 — SUMMARY.md extraction (primary per D-01):**

If --files NOT provided:
```bash
if [ -z "$FILES_OVERRIDE" ]; then
SUMMARIES=$(ls "${PHASE_DIR}"/*-SUMMARY.md 2>/dev/null)
REVIEW_FILES=()

if [ -n "$SUMMARIES" ]; then
for summary in $SUMMARIES; do
# Extract key_files.created and key_files.modified using node for reliable YAML parsing
# This avoids fragile awk parsing that breaks on indentation differences
EXTRACTED=$(node -e "
const fs = require('fs');
const content = fs.readFileSync('$summary', 'utf-8');
const match = content.match(/^---\n([\s\S]*?)\n---/);
if (!match) { process.exit(0); }
const yaml = match[1];
const files = [];
let inSection = null;
for (const line of yaml.split('\n')) {
if (/^\s+created:/.test(line)) { inSection = 'created'; continue; }
if (/^\s+modified:/.test(line)) { inSection = 'modified'; continue; }
if (/^\s*[\w-]+:/.test(line) && !/^\s*-/.test(line)) { inSection = null; continue; }
if (inSection && /^\s+-\s+(.+)/.test(line)) {
let raw = line.match(/^\s+-\s+(.+)/)[1].trim();
raw = raw.replace(/^['"]|['"]$/g, '');
raw = raw.replace(/\s+\([^)]*\)\s*$/, '');
raw = raw.split(/\s+—\s/)[0].trim();
if (/\//.test(raw) && /\.[A-Za-z0-9]+$/.test(raw)) {
files.push(raw);
}
}
}
if (files.length) console.log(files.join('\n'));
" 2>/dev/null)

# Add extracted files to REVIEW_FILES array
if [ -n "$EXTRACTED" ]; then
while IFS= read -r file; do
if [ -n "$file" ]; then
REVIEW_FILES+=("$file")
fi
done <<< "$EXTRACTED"
fi
done

if [ ${#REVIEW_FILES[@]} -eq 0 ]; then
echo "Warning: SUMMARY artifacts found but contained no file paths. Falling back to git diff."
fi
fi
fi
```

**Tier 3 — Git diff fallback (per D-02):**

If no SUMMARY.md files found OR no files extracted from them:
```bash
if [ ${#REVIEW_FILES[@]} -eq 0 ]; then
# Compute diff base from phase commits — fail closed if no reliable base found
PHASE_COMMITS=$(git log --oneline --all --grep="${PADDED_PHASE}" --format="%H" 2>/dev/null)

if [ -n "$PHASE_COMMITS" ]; then
DIFF_BASE=$(echo "$PHASE_COMMITS" | tail -1)^

# Verify the parent commit exists (first commit in repo has no parent)
if ! git rev-parse "${DIFF_BASE}" >/dev/null 2>&1; then
DIFF_BASE=$(echo "$PHASE_COMMITS" | tail -1)
fi

# Run git diff with specific exclusions (per D-03)
DIFF_FILES=$(git diff --name-only "${DIFF_BASE}..HEAD" -- . \
':!.planning/' ':!ROADMAP.md' ':!STATE.md' \
':!*-SUMMARY.md' ':!*-VERIFICATION.md' ':!*-PLAN.md' \
':!package-lock.json' ':!yarn.lock' ':!Gemfile.lock' ':!poetry.lock' 2>/dev/null)

while IFS= read -r file; do
[ -n "$file" ] && REVIEW_FILES+=("$file")
done <<< "$DIFF_FILES"

echo "File scope: ${#REVIEW_FILES[@]} files from git diff (base: ${DIFF_BASE})"
else
# Fail closed — no reliable diff base found. Do not use arbitrary HEAD~N.
echo "Warning: No phase commits found for '${PADDED_PHASE}'. Cannot determine reliable diff scope."
echo "Use --files flag to specify files explicitly: `gsd-serena-bridge code-review --format markdown` ${PHASE_ARG} --files=file1,file2,..."
fi
fi
```

**Post-processing (all tiers):**

1. **Apply exclusions (per D-03):** Remove paths matching planning artifacts
```bash
FILTERED_FILES=()
for file in "${REVIEW_FILES[@]}"; do
# Skip planning directory and specific artifacts
if [[ "$file" == .planning/* ]] || \
[[ "$file" == ROADMAP.md ]] || \
[[ "$file" == STATE.md ]] || \
[[ "$file" == *-SUMMARY.md ]] || \
[[ "$file" == *-VERIFICATION.md ]] || \
[[ "$file" == *-PLAN.md ]]; then
continue
fi
FILTERED_FILES+=("$file")
done
REVIEW_FILES=("${FILTERED_FILES[@]}")
```

2. **Filter deleted files:** Remove paths that don't exist on disk

- Source translation truncated here; use the bridge command output, workflow runbook, installed contracts, or operation plan for continuation.

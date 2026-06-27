# Bridge Workflow: audit-fix

<!-- generated-by: pnpm gen:bridge-commands -->

## Purpose

This bridge workflow runbook translates the actual GSD-core workflow information and adapts it for Serena bridge operation. Read it when operating `gsd-workflow-audit-fix` in a target project.

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

- Contract ID: `gsd-workflow-audit-fix`
- Status: `planned`
- Source path: `gsd-core/workflows/audit-fix.md`
- Resolved source path: `vendor/reference/gsd-core/gsd-core/workflows/audit-fix.md`
- Mirrored runbook path: `.agents/gsd-serena/workflows/audit-fix.md`

## Translated GSD Workflow

### Native Shim Translation
- Native GSD shim locator omitted: the bridge uses the installed `gsd-serena-bridge` CLI, `bootstrap`, `doctor`, `repair`, resolver packets, and install-managed project surfaces instead of locating `gsd-tools.cjs`.
<purpose>
Autonomous audit-to-fix pipeline. Runs an audit, parses findings, classifies each as
auto-fixable vs manual-only, spawns executor agents for fixable issues, runs tests
after each fix, and commits atomically with finding IDs for traceability.
</purpose>

<available_agent_types>
- gsd-executor — executes a specific, scoped code change
</available_agent_types>

<process>

<step name="parse-arguments">
Extract flags from the user's invocation:

- `--max N` — maximum findings to fix (default: **5**)
- `--severity high|medium|all` — minimum severity to process (default: **medium**)
- `--dry-run` — classify findings without fixing (shows classification table only)
- `--source <audit>` — which audit to run (default: **audit-uat**)

Validate `--source` is a supported audit. Currently supported:
- `audit-uat`

If `--source` is not supported, stop with an error:
```
Error: Unsupported audit source "{source}". Supported sources: audit-uat
```
</step>

<step name="run-audit">
Invoke the source audit command and capture output.

For `audit-uat` source:
```bash
- Native query translated: `INIT=$(gsd_run query audit-uat 2>/dev/null || echo "{}")` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

Read existing UAT and verification files to extract findings:
- Glob: `.planning/phases/*/*-UAT.md`
- Glob: `.planning/phases/*/*-VERIFICATION.md`

Parse each finding into a structured record:
- **ID** — sequential identifier (F-01, F-02, ...)
- **description** — concise summary of the issue
- **severity** — high, medium, or low
- **file_refs** — specific file paths referenced in the finding
</step>

<step name="classify-findings">
For each finding, classify as one of:

- **auto-fixable** — clear code change, specific file referenced, testable fix
- **manual-only** — requires design decisions, ambiguous scope, architectural changes, user input needed
- **skip** — severity below the `--severity` threshold

**Classification heuristics** (err on manual-only when uncertain):

Auto-fixable signals:
- References a specific file path + line number
- Describes a missing test or assertion
- Missing export, wrong import path, typo in identifier
- Clear single-file change with obvious expected behavior

Manual-only signals:
- Uses words like "consider", "evaluate", "design", "rethink"
- Requires new architecture or API changes
- Ambiguous scope or multiple valid approaches
- Requires user input or design decisions
- Cross-cutting concerns affecting multiple subsystems
- Performance or scalability issues without clear fix

**When uncertain, always classify as manual-only.**
</step>

<step name="present-classification">
Display the classification table:

```
## Audit-Fix Classification

| # | Finding | Severity | Classification | Reason |
|---|---------|----------|---------------|--------|
| F-01 | Missing export in index.ts | high | auto-fixable | Specific file, clear fix |
| F-02 | No error handling in payment flow | high | manual-only | Requires design decisions |
| F-03 | Test stub with 0 assertions | medium | auto-fixable | Clear test gap |
```

If `--dry-run` was specified, **stop here and exit**. The classification table is the
final output — do not proceed to fixing.
</step>

<step name="fix-loop">
For each **auto-fixable** finding (up to `--max`, ordered by severity desc):

**a. Spawn executor agent** (runs in a subagent — no output until it returns, ~1–5 min; expected, not a freeze)**:**
```
- Native agent dispatch translated: `Agent(` -> use Serena role workflow / generated role skill / sequential role pass with handoff.
prompt="Fix finding {ID}: {description}. Files: {file_refs}. Make the minimal change to resolve this specific finding. Do not refactor surrounding code.",
subagent_type="gsd-executor"
)
```

- Native agent dispatch translated: `> **ORCHESTRATOR RULE — CODEX RUNTIME**: After calling Agent() above, stop working on this task immediately. Do not read more files, edit code, or run tests related to this task while the subagent is active. Wait for the subagent to return its result. This prevents duplicate work, conflicting edits, and wasted context. Only resume when the subagent result is available.` -> use Serena role workflow / generated role skill / sequential role pass with handoff.

**b. Run tests:**
```bash
- Native query translated: `AUDIT_TEST_CMD=$(gsd_run query config-get workflow.test_command --default "" 2>/dev/null || true)` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
if [ -z "$AUDIT_TEST_CMD" ]; then
if [ -f "Makefile" ] && grep -q "^test:" Makefile; then
AUDIT_TEST_CMD="make test"
elif [ -f "Justfile" ] || [ -f "justfile" ]; then
AUDIT_TEST_CMD="just test"
elif [ -f "package.json" ]; then
AUDIT_TEST_CMD="npm test"
elif [ -f "Cargo.toml" ]; then
AUDIT_TEST_CMD="cargo test"
elif [ -f "go.mod" ]; then
AUDIT_TEST_CMD="go test ./..."
elif [ -f "pyproject.toml" ] || [ -f "requirements.txt" ]; then
AUDIT_TEST_CMD="python -m pytest -x -q --tb=short"
else
AUDIT_TEST_CMD="true"
fi
fi
eval "$AUDIT_TEST_CMD" 2>&1 | tail -20
```

**c. If tests pass** — commit atomically:
```bash
git add {changed_files}
git commit -m "fix({scope}): resolve {ID} — {description}"
```
The commit message **must** include the finding ID (e.g., F-01) for traceability.

**d. If tests fail** — revert changes, mark finding as `fix-failed`, and **stop the pipeline**:
```bash
git checkout -- {changed_files} 2>/dev/null
```
Log the failure reason and stop processing — do not continue to the next finding.
A test failure indicates the codebase may be in an unexpected state, so the pipeline
must halt to avoid cascading issues. Remaining auto-fixable findings will appear in the
report as `not-attempted`.
</step>

<step name="report">
Present the final summary:

```
## Audit-Fix Complete

**Source:** {audit_command}
**Findings:** {total} total, {auto} auto-fixable, {manual} manual-only
**Fixed:** {fixed_count}/{auto} auto-fixable findings
**Failed:** {failed_count} (reverted)

| # | Finding | Status | Commit |
|---|---------|--------|--------|
| F-01 | Missing export | Fixed | abc1234 |
| F-03 | Test stub | Fix failed | (reverted) |

### Manual-only findings (require developer attention):
- F-02: No error handling in payment flow — requires design decisions
```
</step>

</process>

<success_criteria>
- Auto-fixable findings processed sequentially until --max reached or a test failure stops the pipeline
- Tests pass after each committed fix (no broken commits)
- Failed fixes are reverted cleanly (no partial changes left)
- Pipeline stops after the first test failure (no cascading fixes)
- Every commit message contains the finding ID
- Manual-only findings are surfaced for developer attention
- --dry-run produces a useful standalone classification table
</success_criteria>

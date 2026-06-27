# Bridge Workflow: add-tests

<!-- generated-by: pnpm gen:bridge-commands -->

## Purpose

This bridge workflow runbook translates the actual GSD-core workflow information and adapts it for Serena bridge operation. Read it when operating `gsd-workflow-add-tests` in a target project.

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

- Contract ID: `gsd-workflow-add-tests`
- Status: `planned`
- Source path: `gsd-core/workflows/add-tests.md`
- Resolved source path: `vendor/reference/gsd-core/gsd-core/workflows/add-tests.md`
- Mirrored runbook path: `.agents/gsd-serena/workflows/add-tests.md`

## Translated GSD Workflow

### Native Shim Translation
- Native GSD shim locator omitted: the bridge uses the installed `gsd-serena-bridge` CLI, `bootstrap`, `doctor`, `repair`, resolver packets, and install-managed project surfaces instead of locating `gsd-tools.cjs`.
<purpose>
Generate unit and E2E tests for a completed phase based on its SUMMARY.md, CONTEXT.md, and implementation. Classifies each changed file into TDD (unit), E2E (browser), or Skip categories, presents a test plan for user approval, then generates tests followin...

Users currently hand-craft ``gsd-serena-bridge quick --format markdown`` prompts for test generation after each phase. This workflow standardizes the process with proper classification, quality gates, and gap reporting.
</purpose>

<required_reading>
Read all files referenced by the invoking prompt's execution_context before starting.
</required_reading>

<process>

<step name="parse_arguments">
Parse `$ARGUMENTS` for:
- Phase number (integer, decimal, or letter-suffix) → store as `$PHASE_ARG`
- Remaining text after phase number → store as `$EXTRA_INSTRUCTIONS` (optional)

Example: ``gsd-serena-bridge add-tests --format markdown` 12 focus on edge cases` → `$PHASE_ARG=12`, `$EXTRA_INSTRUCTIONS="focus on edge cases"`

If no phase argument provided:

```
ERROR: Phase number required
Usage: `gsd-serena-bridge add-tests --format markdown` <phase> [additional instructions]
Example: `gsd-serena-bridge add-tests --format markdown` 12
Example: `gsd-serena-bridge add-tests --format markdown` 12 focus on edge cases in the pricing module
```

Exit.
</step>

<step name="init_context">
Load phase operation context:

```bash
- Native query translated: `INIT=$(gsd_run query init.phase-op "${PHASE_ARG}")` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

Extract from init JSON: `phase_dir`, `phase_number`, `phase_name`.

Verify the phase directory exists. If not:
```
ERROR: Phase directory not found for phase ${PHASE_ARG}
Ensure the phase exists in .planning/phases/
```
Exit.

Read the phase artifacts (in order of priority):
1. `${phase_dir}/*-SUMMARY.md` — what was implemented, files changed
2. `${phase_dir}/CONTEXT.md` — acceptance criteria, decisions
3. `${phase_dir}/*-VERIFICATION.md` — user-verified scenarios (if UAT was done)

If no SUMMARY.md exists:
```
ERROR: No SUMMARY.md found for phase ${PHASE_ARG}
This command works on completed phases. Run `gsd-serena-bridge execute-phase --format markdown` first.
```
Exit.

Present banner:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GSD ► ADD TESTS — Phase ${phase_number}: ${phase_name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
</step>

<step name="analyze_implementation">
Extract the list of files modified by the phase from SUMMARY.md ("Files Changed" or equivalent section).

For each file, classify into one of three categories:

| Category | Criteria | Test Type |
|----------|----------|-----------|
| **TDD** | Pure functions where `expect(fn(input)).toBe(output)` is writable | Unit tests |
| **E2E** | UI behavior verifiable by browser automation | Playwright/E2E tests |
| **Skip** | Not meaningfully testable or already covered | None |

**TDD classification — apply when:**
- Business logic: calculations, pricing, tax rules, validation
- Data transformations: mapping, filtering, aggregation, formatting
- Parsers: CSV, JSON, XML, custom format parsing
- Validators: input validation, schema validation, business rules
- State machines: status transitions, workflow steps
- Utilities: string manipulation, date handling, number formatting

**E2E classification — apply when:**
- Keyboard shortcuts: key bindings, modifier keys, chord sequences
- Navigation: page transitions, routing, breadcrumbs, back/forward
- Form interactions: submit, validation errors, field focus, autocomplete
- Selection: row selection, multi-select, shift-click ranges
- Drag and drop: reordering, moving between containers
- Modal dialogs: open, close, confirm, cancel
- Data grids: sorting, filtering, inline editing, column resize

**Skip classification — apply when:**
- UI layout/styling: CSS classes, visual appearance, responsive breakpoints
- Configuration: config files, environment variables, feature flags
- Glue code: dependency injection setup, middleware registration, routing tables
- Migrations: database migrations, schema changes
- Simple CRUD: basic create/read/update/delete with no business logic
- Type definitions: records, DTOs, interfaces with no logic

Read each file to verify classification. Don't classify based on filename alone.
</step>

<step name="present_classification">
Present the classification to the user for confirmation before proceeding:

**Text mode (`workflow.text_mode: true` in config or `--text` flag):** Set `TEXT_MODE=true` if `--text` is present in `$ARGUMENTS` OR `text_mode` from init JSON is `true`. When TEXT_MODE is active, replace every `AskUserQuestion` call with a plain-text numb...

```
AskUserQuestion(
header: "Test Classification",
question: |
## Files classified for testing

### TDD (Unit Tests) — {N} files
{list of files with brief reason}

### E2E (Browser Tests) — {M} files
{list of files with brief reason}

### Skip — {K} files
{list of files with brief reason}

{if $EXTRA_INSTRUCTIONS: "Additional instructions: ${EXTRA_INSTRUCTIONS}"}

How would you like to proceed?
options:
- "Approve and generate test plan"
- "Adjust classification (I'll specify changes)"
- "Cancel"
)
```

If user selects "Adjust classification": apply their changes and re-present.
If user selects "Cancel": exit gracefully.
</step>

<step name="discover_test_structure">
Before generating the test plan, discover the project's existing test structure:

```bash
# Find existing test directories
find . -type d -name "*test*" -o -name "*spec*" -o -name "*__tests__*" 2>/dev/null | head -20
# Find existing test files for convention matching
find . -type f \( -name "*.test.*" -o -name "*.spec.*" -o -name "*Tests.fs" -o -name "*Test.fs" \) 2>/dev/null | head -20
# Check for test runners
ls package.json *.sln 2>/dev/null || true
```

Identify:
- Test directory structure (where unit tests live, where E2E tests live)
- Naming conventions (`.test.ts`, `.spec.ts`, `*Tests.fs`, etc.)
- Test runner commands (how to execute unit tests, how to execute E2E tests)
- Test framework (xUnit, NUnit, Jest, Playwright, etc.)

If test structure is ambiguous, ask the user:
```
AskUserQuestion(
header: "Test Structure",
question: "I found multiple test locations. Where should I create tests?",
options: [list discovered locations]
)
```
</step>

<step name="generate_test_plan">
For each approved file, create a detailed test plan.

**For TDD files**, plan tests following RED-GREEN-REFACTOR:
1. Identify testable functions/methods in the file
2. For each function: list input scenarios, expected outputs, edge cases
3. Note: since code already exists, tests may pass immediately — that's OK, but verify they test the RIGHT behavior

**For E2E files**, plan tests following RED-GREEN gates:
1. Identify user scenarios from CONTEXT.md/VERIFICATION.md
2. For each scenario: describe the user action, expected outcome, assertions
3. Note: RED gate means confirming the test would fail if the feature were broken

Present the complete test plan:

```
AskUserQuestion(
header: "Test Plan",
question: |
## Test Generation Plan

### Unit Tests ({N} tests across {M} files)
{for each file: test file path, list of test cases}

### E2E Tests ({P} tests across {Q} files)
{for each file: test file path, list of test scenarios}

### Test Commands
- Unit: {discovered test command}
- E2E: {discovered e2e command}

Ready to generate?
options:
- "Generate all"
- "Cherry-pick (I'll specify which)"
- "Adjust plan"
)
```

If "Cherry-pick": ask user which tests to include.
If "Adjust plan": apply changes and re-present.
</step>

<step name="execute_tdd_generation">
For each approved TDD test:

1. **Create test file** following discovered project conventions (directory, naming, imports)

2. **Write test** with clear arrange/act/assert structure:
```
// Arrange — set up inputs and expected outputs
// Act — call the function under test
// Assert — verify the output matches expectations
```

3. **Run the test**:
```bash
{discovered test command}
```

4. **Evaluate result:**
- **Test passes**: Good — the implementation satisfies the test. Verify the test checks meaningful behavior (not just that it compiles).
- **Test fails with assertion error**: This may be a genuine bug discovered by the test. Flag it:
```
⚠️ Potential bug found: {test name}
Expected: {expected}
Actual: {actual}
File: {implementation file}
```
Do NOT fix the implementation — this is a test-generation command, not a fix command. Record the finding.
- **Test fails with error (import, syntax, etc.)**: This is a test error. Fix the test and re-run.
</step>

<step name="execute_e2e_generation">
For each approved E2E test:

1. **Check for existing tests** covering the same scenario:
```bash
grep -r "{scenario keyword}" {e2e test directory} 2>/dev/null || true
```
If found, extend rather than duplicate.

2. **Create test file** targeting the user scenario from CONTEXT.md/VERIFICATION.md

3. **Run the E2E test**:
```bash
{discovered e2e command}
```

4. **Evaluate result:**
- **GREEN (passes)**: Record success
- **RED (fails)**: Determine if it's a test issue or a genuine application bug. Flag bugs:
```
⚠️ E2E failure: {test name}
Scenario: {description}
Error: {error message}
```
- **Cannot run**: Report blocker. Do NOT mark as complete.
```
🛑 E2E blocker: {reason tests cannot run}
```

**No-skip rule:** If E2E tests cannot execute (missing dependencies, environment issues), report the blocker and mark the test as incomplete. Never mark success without actually running the test.
</step>

<step name="summary_and_commit">
Create a test coverage report and present to user:

```

- Source translation truncated here; use the bridge command output, workflow runbook, installed contracts, or operation plan for continuation.

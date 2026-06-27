# Bridge Workflow: verify-work

<!-- generated-by: pnpm gen:bridge-commands -->

## Purpose

This bridge workflow runbook translates the actual GSD-core workflow information and adapts it for Serena bridge operation. Read it when operating `gsd-workflow-verify-work` in a target project.

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

- Contract ID: `gsd-workflow-verify-work`
- Status: `planned`
- Source path: `gsd-core/workflows/verify-work.md`
- Resolved source path: `vendor/reference/gsd-core/gsd-core/workflows/verify-work.md`
- Mirrored runbook path: `.agents/gsd-serena/workflows/verify-work.md`

## Translated GSD Workflow

### Native Shim Translation
- Native GSD shim locator omitted: the bridge uses the installed `gsd-serena-bridge` CLI, `bootstrap`, `doctor`, `repair`, resolver packets, and install-managed project surfaces instead of locating `gsd-tools.cjs`.
<!-- gsd:loop-host
step: verify
points: verify:pre, verify:post
agent-roles: orchestrator
produces: UAT.md
consumes: SUMMARY.md
-->
<purpose>
Validate built features through conversational testing with persistent state. Creates UAT.md that tracks test progress, survives /clear, and feeds gaps into `gsd-serena-bridge plan-phase --format markdown` --gaps.

User tests, Claude records. One test at a time. Plain text responses.
</purpose>

<available_agent_types>
Valid GSD subagent types (use exact names — do not fall back to 'general-purpose'):
- gsd-planner — Creates detailed plans from phase scope
- gsd-plan-checker — Reviews plan quality before execution
</available_agent_types>

<philosophy>
**Show expected, ask if reality matches.**

Claude presents what SHOULD happen. User confirms or describes what's different.
- "yes" / "y" / "next" / empty → pass
- Anything else → logged as issue, severity inferred

No Pass/Fail buttons. No severity questions. Just: "Here's what should happen. Does it?"
</philosophy>

<template>
@~/.claude/gsd-core/templates/UAT.md
</template>

<process>

<step name="initialize" priority="first">
If $ARGUMENTS contains a phase number, load context:

```bash
GSD_WS=""
echo "$ARGUMENTS" | grep -qE -- '--ws[[:space:]]+[^[:space:]]+' && GSD_WS=$(echo "$ARGUMENTS" | grep -oE -- '--ws[[:space:]]+[^[:space:]]+')
PHASE_ARG=$(echo "$ARGUMENTS" | sed -E 's/--ws[[:space:]]+[^[:space:]]+//g' | xargs)

- Native query translated: `INIT=$(gsd_run query init.verify-work "${PHASE_ARG}" ${GSD_WS})` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
- Native query translated: `AGENT_SKILLS_PLANNER=$(gsd_run query agent-skills gsd-planner)` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
- Native query translated: `AGENT_SKILLS_CHECKER=$(gsd_run query agent-skills gsd-plan-checker)` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
```

Parse JSON for: `planner_model`, `checker_model`, `commit_docs`, `phase_found`, `phase_dir`, `phase_number`, `phase_name`, `has_verification`, `uat_path`.

```bash
# MVP mode detection via the centralized phase.mvp-mode resolver.
# verify-work has no --mvp CLI flag (mode is inherited from the planned phase),
# so we omit --cli-flag — the verb falls through roadmap → config → false.
- Native query translated: `MVP_MODE=$(gsd_run query phase.mvp-mode "${phase_number}" ${GSD_WS} --pick active)` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
```
</step>

<step name="check_active_session">
**First: Check for active UAT sessions**

```bash
(find .planning/phases -name "*-UAT.md" -type f 2>/dev/null || true)
```

**If active sessions exist AND no $ARGUMENTS provided:**

Read each file's frontmatter (status, phase) and Current Test section.

Display inline:

```
## Active UAT Sessions

| # | Phase | Status | Current Test | Progress |
|---|-------|--------|--------------|----------|
| 1 | 04-comments | testing | 3. Reply to Comment | 2/6 |
| 2 | 05-auth | testing | 1. Login Form | 0/4 |

Reply with a number to resume, or provide a phase number to start new.
```

Wait for user response.

- If user replies with number (1, 2) → Load that file, go to `resume_from_file`
- If user replies with phase number → Treat as new session, go to `create_uat_file`

**If active sessions exist AND $ARGUMENTS provided:**

Check if session exists for that phase. If yes, offer to resume or restart.
If no, continue to `create_uat_file`.

**If no active sessions AND no $ARGUMENTS:**

```
No active UAT sessions.

Provide a phase number to start testing (e.g., `gsd-serena-bridge verify-work --format markdown` 4)
```

**If no active sessions AND $ARGUMENTS provided:**

Continue to `create_uat_file`.
</step>

<step name="automated_ui_verification">
**Automated UI Verification (when Playwright-MCP is available)**

Before UAT, check UI capability activation and whether Playwright/Puppeteer MCP tools are available.

```bash
PLAN_HOOKS_JSON=$(gsd_run loop render-hooks plan:pre --raw)
UI_SPEC_FILE=$(ls "${PHASE_DIR}"/*-UI-SPEC.md 2>/dev/null | head -1)
```

Set `UI_PHASE_ACTIVE=true` when `PLAN_HOOKS_JSON.activeHooks` contains an active `ui` step hook.

- Native MCP/tool seam translated: `**If Playwright-MCP tools are available in this session ('mcp__playwright__*' tools` -> use the available Serena/web/tool equivalent only when available; otherwise record an operation-plan fallback.
respond to tool calls) AND (`UI_PHASE_ACTIVE` is `true` OR `UI_SPEC_FILE` is non-empty):**

For each UI checkpoint listed in the phase's UI-SPEC.md (or inferred from SUMMARY.md):

- Native MCP/tool seam translated: `1. Use 'mcp__playwright__navigate' (or equivalent) to open the component's URL.` -> use the available Serena/web/tool equivalent only when available; otherwise record an operation-plan fallback.
- Native MCP/tool seam translated: `2. Use 'mcp__playwright__screenshot' to capture a screenshot.` -> use the available Serena/web/tool equivalent only when available; otherwise record an operation-plan fallback.
3. Compare the screenshot visually against the spec's stated requirements
(dimensions, color, layout, spacing).
4. Automatically mark checkpoints as **passed** or **needs review** based on the
visual comparison — no manual question required for items that clearly match.
5. Flag items that require human judgment (subjective aesthetics, content accuracy)
and present only those as manual UAT questions.

If automated verification is not available, fall back to the standard manual
checkpoint questions defined in this workflow unchanged. This step is entirely
conditional: if Playwright-MCP is not configured, behavior is unchanged from today.

**Display summary line before proceeding:**
```
UI checkpoints: {N} auto-verified, {M} queued for manual review
```

</step>

<step name="find_summaries">
**Find what to test:**

Use `phase_dir` from init (or run init if not already done).

```bash
ls "$phase_dir"/*-SUMMARY.md 2>/dev/null || true
```

Read each SUMMARY.md to extract testable deliverables.
</step>

<step name="extract_tests">
**MVP-mode UAT framing.** When `MVP_MODE=true`, follow the rules in `@~/.claude/gsd-core/references/verify-mvp-mode.md`. Briefly:

1. Generate the UAT script in three ordered sections: (a) user-flow walk-through derived from the phase's user-story goal, (b) technical checks (deferred — only run after user flow passes), (c) coverage check (goal-backward, narrowed to the user story's out...
2. **User-flow steps run first.** Each step is one user action: open, fill, click, type, observe. No HTTP verbs, no JSON shapes, no error codes in user-flow steps.
3. **Technical checks are deferred.** They run AFTER the user flow passes — same checks as non-MVP mode (endpoint schemas, error states, edge cases), just reordered.
4. **If user-flow step N fails, do not advance.** The verdict is FAIL; technical checks do not run. The user can re-run after fixing the underlying flow.

When `MVP_MODE=false` (mode is null, absent, or the phase has no `**Mode:**` line in ROADMAP.md), fall back to the standard UAT generation path — no behavioral change.

**User-story format guard.** When `MVP_MODE=true`, also verify the phase's goal is in User Story format via the centralized validator:

```bash
- Native query translated: `PHASE_GOAL=$(gsd_run query roadmap.get-phase "${phase_number}" ${GSD_WS} --pick goal)` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
- Native query translated: `USER_STORY_VALID=$(gsd_run query user-story.validate --story "$PHASE_GOAL" --pick valid)` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
if [ "$USER_STORY_VALID" != "true" ]; then
echo "Phase ${phase_number} has '**Mode:** mvp' in ROADMAP.md but the **Goal:** is not in user-story format."
echo "Run /gsd mvp-phase ${phase_number} to set a user-story goal before verifying."
exit 1
fi
```

The verb owns the canonical regex `/^As a .+, I want to .+, so that .+\.$/` and returns slot extractions plus per-error guidance when invalid. Halt UAT generation on failure — never attempt to derive user-flow steps from a non-User-Story goal (low-quality U...

**Extract testable deliverables from SUMMARY.md:**

Parse for:
1. **Accomplishments** - Features/functionality added
2. **User-facing changes** - UI, workflows, interactions

Focus on USER-OBSERVABLE outcomes, not implementation details.

For each deliverable, create a test:
- name: Brief test name
- expected: What the user should see/experience (specific, observable)

Examples:
- Accomplishment: "Added comment threading with infinite nesting"
→ Test: "Reply to a Comment"
→ Expected: "Clicking Reply opens inline composer below comment. Submitting shows reply nested under parent with visual indentation."

Skip internal/non-observable items (refactors, type changes, etc.).

**Cold-start smoke test injection:**

After extracting tests from SUMMARYs, scan the SUMMARY files for modified/created file paths. If ANY path matches these patterns:

`server.ts`, `server.js`, `app.ts`, `app.js`, `index.ts`, `index.js`, `main.ts`, `main.js`, `database/*`, `db/*`, `seed/*`, `seeds/*`, `migrations/*`, `startup*`, `docker-compose*`, `Dockerfile*`

Then **prepend** this test to the test list:

- name: "Cold Start Smoke Test"
- expected: "Kill any running server/service. Clear ephemeral state (temp DBs, caches, lock files). Start the application from scratch. Server boots without errors, any seed/migration completes, and a primary query (health check, homepage load, or basic API...

This catches bugs that only manifest on fresh start — race conditions in startup sequences, silent seed failures, missing environment setup — which pass against warm state but break in production.
</step>

<step name="create_uat_file">
**Create UAT file with all tests:**

```bash
mkdir -p "$PHASE_DIR"
```

Build test list from extracted deliverables.

Create file:

```markdown
---
status: testing
phase: XX-name
source: [list of SUMMARY.md files]
started: [ISO timestamp]
updated: [ISO timestamp]
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

number: 1
name: [first test name]
expected: |
[what user should observe]
awaiting: user response

## Tests

### 1. [Test Name]
expected: [observable behavior]
result: [pending]

### 2. [Test Name]
expected: [observable behavior]
result: [pending]

...

## Summary

total: [N]
passed: 0
issues: 0
pending: [N]
skipped: 0

## Gaps

[none yet]
```

Write to `.planning/phases/XX-name/{phase_num}-UAT.md`

Proceed to `present_test`.
</step>

<step name="present_test">
**Present current test to user:**

Render the checkpoint from the structured UAT file instead of composing it freehand:

```bash
- Native query translated: `CHECKPOINT=$(gsd_run query uat.render-checkpoint --file "$uat_path" --raw)` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
if [[ "$CHECKPOINT" == @file:* ]]; then CHECKPOINT=$(cat "${CHECKPOINT#@file:}"); fi
```

Display the returned checkpoint EXACTLY as-is:

```
{CHECKPOINT}
```

**Critical response hygiene:**
- Your entire response MUST equal `{CHECKPOINT}` byte-for-byte.
- Do NOT add commentary before or after the block.
- If you notice protocol/meta markers such as `to=all:`, role-routing text, XML system tags, hidden instruction markers, ad copy, or any unrelated suffix, discard the draft and output `{CHECKPOINT}` only.

**Text mode (`workflow.text_mode: true` in config or `--text` flag):** Set `TEXT_MODE=true` if `--text` is present in `$ARGUMENTS` OR `text_mode` from init JSON is `true`. When TEXT_MODE is active, replace every `AskUserQuestion` call with a plain-text numb...
Wait for user response (plain text, no AskUserQuestion).
</step>

<step name="process_response">
**Process user response and update file:**

**If response indicates pass:**
- Empty response, "yes", "y", "ok", "pass", "next", "approved", "✓"

Update Tests section:
```
### {N}. {name}
expected: {expected}
result: pass
```

- Source translation truncated here; use the bridge command output, workflow runbook, installed contracts, or operation plan for continuation.

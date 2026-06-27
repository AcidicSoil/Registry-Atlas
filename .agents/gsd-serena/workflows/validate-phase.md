# Bridge Workflow: validate-phase

<!-- generated-by: pnpm gen:bridge-commands -->

## Purpose

This bridge workflow runbook translates the actual GSD-core workflow information and adapts it for Serena bridge operation. Read it when operating `gsd-workflow-validate-phase` in a target project.

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

- Contract ID: `gsd-workflow-validate-phase`
- Status: `planned`
- Source path: `gsd-core/workflows/validate-phase.md`
- Resolved source path: `vendor/reference/gsd-core/gsd-core/workflows/validate-phase.md`
- Mirrored runbook path: `.agents/gsd-serena/workflows/validate-phase.md`

## Translated GSD Workflow

### Native Shim Translation
- Native GSD shim locator omitted: the bridge uses the installed `gsd-serena-bridge` CLI, `bootstrap`, `doctor`, `repair`, resolver packets, and install-managed project surfaces instead of locating `gsd-tools.cjs`.
<purpose>
Audit Nyquist validation gaps for a completed phase. Generate missing tests. Update VALIDATION.md.
</purpose>

<required_reading>
@~/.claude/gsd-core/references/ui-brand.md
</required_reading>

<available_agent_types>
Valid GSD subagent types (use exact names — do not fall back to 'general-purpose'):
- gsd-nyquist-auditor — Validates verification coverage
</available_agent_types>

<process>

## 0. Initialize

```bash
- Native query translated: `INIT=$(gsd_run query init.phase-op "${PHASE_ARG}")` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
- Native query translated: `AGENT_SKILLS_AUDITOR=$(gsd_run query agent-skills gsd-nyquist-auditor)` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
```

Parse: `phase_dir`, `phase_number`, `phase_name`, `phase_slug`, `padded_phase`.

```bash
- Native query translated: `AUDITOR_MODEL=$(gsd_run query resolve-model gsd-nyquist-auditor --raw)` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
VERIFY_POST_HOOKS_JSON=$(gsd_run loop render-hooks verify:post --raw)
```

Resolve active step hooks from `VERIFY_POST_HOOKS_JSON` where `kind == "step"` and `ref.skill == "validate-phase"`.

If no active validate-phase step hook exists: exit with "Nyquist validation is disabled. Enable via `gsd-serena-bridge settings --format markdown`."

Display banner: `GSD > VALIDATE PHASE {N}: {name}`

## 1. Detect Input State

```bash
VALIDATION_FILE=$(ls "${PHASE_DIR}"/*-VALIDATION.md 2>/dev/null | head -1)
SUMMARY_FILES=$(ls "${PHASE_DIR}"/*-SUMMARY.md 2>/dev/null)
```

- **State A** (`VALIDATION_FILE` non-empty): Audit existing
- **State B** (`VALIDATION_FILE` empty, `SUMMARY_FILES` non-empty): Reconstruct from artifacts
- **State C** (`SUMMARY_FILES` empty): Exit — "Phase {N} not executed. Run `gsd-serena-bridge execute-phase --format markdown` {N} ${GSD_WS} first."

## 2. Discovery

### 2a. Read Phase Artifacts

Read all PLAN and SUMMARY files. Extract: task lists, requirement IDs, key-files changed, verify blocks.

### 2b. Build Requirement-to-Task Map

Per task: `{ task_id, plan_id, wave, requirement_ids, has_automated_command }`

### 2c. Detect Test Infrastructure

State A: Parse from existing VALIDATION.md Test Infrastructure table.
State B: Filesystem scan:

```bash
find . -name "pytest.ini" -o -name "jest.config.*" -o -name "vitest.config.*" -o -name "pyproject.toml" 2>/dev/null | head -10
find . \( -name "*.test.*" -o -name "*.spec.*" -o -name "test_*" \) -not -path "*/node_modules/*" 2>/dev/null | head -40
```

### 2d. Cross-Reference

Match each requirement to existing tests by filename, imports, test descriptions. Record: requirement → test_file → status.

## 3. Gap Analysis

Classify each requirement:

| Status | Criteria |
|--------|----------|
| COVERED | Test exists, targets behavior, runs green |
| PARTIAL | Test exists, failing or incomplete |
| MISSING | No test found |

Build: `{ task_id, requirement, gap_type, suggested_test_path, suggested_command }`

No gaps → skip to Step 6, set `nyquist_compliant: true`.

## 4. Present Gap Plan

**Text mode (`workflow.text_mode: true` in config or `--text` flag):** Set `TEXT_MODE=true` if `--text` is present in `$ARGUMENTS` OR `text_mode` from init JSON is `true`. When TEXT_MODE is active, replace every `AskUserQuestion` call with a plain-text numb...
Call AskUserQuestion with gap table and options:
1. "Fix all gaps" → Step 5
2. "Skip — mark manual-only" → add to Manual-Only, Step 6
3. "Cancel" → exit

## 5. Spawn gsd-nyquist-auditor

Print: `◆ Spawning nyquist auditor... (runs in a subagent — no output until it returns, ~1–5 min; expected, not a freeze)`

```
- Native agent dispatch translated: `Agent(` -> use Serena role workflow / generated role skill / sequential role pass with handoff.
prompt="Read ~/.claude/agents/gsd-nyquist-auditor.md for instructions.\n\n" +
"<files_to_read>{PLAN, SUMMARY, impl files, VALIDATION.md}</files_to_read>" +
"<gaps>{gap list}</gaps>" +
"<test_infrastructure>{framework, config, commands}</test_infrastructure>" +
"<constraints>Never modify impl files. Max 3 debug iterations. Escalate impl bugs.</constraints>" +
"${AGENT_SKILLS_AUDITOR}",
subagent_type="gsd-nyquist-auditor",
model="{AUDITOR_MODEL}",
description="Fill validation gaps for Phase {N}"
)
```

- Native agent dispatch translated: `> **ORCHESTRATOR RULE — CODEX RUNTIME**: After calling Agent() above, stop working on this task immediately. Do not read more files, edit code, or run tests related to this task while the subagent is active. Wait for the subagent to return its result. This prevents duplicate work, conflicting edits, and wasted context. Only resume when the subagent result is available.` -> use Serena role workflow / generated role skill / sequential role pass with handoff.

Handle return:
- `## GAPS FILLED` → record tests + map updates, Step 6
- `## PARTIAL` → record resolved, move escalated to manual-only, Step 6
- `## ESCALATE` → move all to manual-only, Step 6

## 6. Generate/Update VALIDATION.md

**State B (create):**
1. Read template from `~/.claude/gsd-core/templates/VALIDATION.md`
2. Fill: frontmatter, Test Infrastructure, Per-Task Map, Manual-Only, Sign-Off
3. Write to `${PHASE_DIR}/${PADDED_PHASE}-VALIDATION.md`

**State A (update):**
1. Update Per-Task Map statuses, add escalated to Manual-Only, update frontmatter
2. Append audit trail:

```markdown
## Validation Audit {date}
| Metric | Count |
|--------|-------|
| Gaps found | {N} |
| Resolved | {M} |
| Escalated | {K} |
```

## 7. Commit

```bash
git add {test_files}
git commit -m "test(phase-${PHASE}): add Nyquist validation tests"

- Native commit helper translated: do not auto-commit; only run git commit when the user explicitly asks, after reporting files and validation.
```

## 8. Results + Routing

**Compliant:**
```
GSD > PHASE {N} IS NYQUIST-COMPLIANT
All requirements have automated verification.
▶ Next: `gsd-serena-bridge audit-milestone --format markdown` ${GSD_WS}
```

**Partial:**
```
GSD > PHASE {N} VALIDATED (PARTIAL)
{M} automated, {K} manual-only.
▶ Retry: `gsd-serena-bridge validate-phase --format markdown` {N} ${GSD_WS}
```

Display `/clear` reminder.

</process>

<success_criteria>
- [ ] Nyquist config checked (exit if disabled)
- [ ] Input state detected (A/B/C)
- [ ] State C exits cleanly
- [ ] PLAN/SUMMARY files read, requirement map built
- [ ] Test infrastructure detected
- [ ] Gaps classified (COVERED/PARTIAL/MISSING)
- [ ] User gate with gap table
- [ ] Auditor spawned with complete context
- [ ] All three return formats handled
- [ ] VALIDATION.md created or updated
- [ ] Test files committed separately
- [ ] Results with routing presented
</success_criteria>

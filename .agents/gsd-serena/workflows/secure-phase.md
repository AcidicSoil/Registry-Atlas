# Bridge Workflow: secure-phase

<!-- generated-by: pnpm gen:bridge-commands -->

## Purpose

This bridge workflow runbook translates the actual GSD-core workflow information and adapts it for Serena bridge operation. Read it when operating `gsd-workflow-secure-phase` in a target project.

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

- Contract ID: `gsd-workflow-secure-phase`
- Status: `planned`
- Source path: `gsd-core/workflows/secure-phase.md`
- Resolved source path: `vendor/reference/gsd-core/gsd-core/workflows/secure-phase.md`
- Mirrored runbook path: `.agents/gsd-serena/workflows/secure-phase.md`

## Translated GSD Workflow

### Native Shim Translation
- Native GSD shim locator omitted: the bridge uses the installed `gsd-serena-bridge` CLI, `bootstrap`, `doctor`, `repair`, resolver packets, and install-managed project surfaces instead of locating `gsd-tools.cjs`.
<purpose>
Verify threat mitigations for a completed phase. Confirm PLAN.md threat register dispositions are resolved. Update SECURITY.md.
</purpose>

<required_reading>
@~/.claude/gsd-core/references/ui-brand.md
</required_reading>

<available_agent_types>
Valid GSD subagent types (use exact names — do not fall back to 'general-purpose'):
- gsd-security-auditor — Verifies threat mitigation coverage
</available_agent_types>

<process>

## 0. Initialize

```bash
- Native query translated: `INIT=$(gsd_run query init.phase-op "${PHASE_ARG}")` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
- Native query translated: `AGENT_SKILLS_AUDITOR=$(gsd_run query agent-skills gsd-security-auditor)` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
```

Parse: `phase_dir`, `phase_number`, `phase_name`, `phase_slug`, `padded_phase`.

```bash
- Native query translated: `AUDITOR_MODEL=$(gsd_run query resolve-model gsd-security-auditor --raw)` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
VERIFY_POST_HOOKS_JSON=$(gsd_run loop render-hooks verify:post --raw)
```

Resolve active step hooks from `VERIFY_POST_HOOKS_JSON` where `kind == "step"` and `ref.skill == "secure-phase"`.

If no active secure-phase step hook exists: exit with "Security enforcement disabled. Enable via `gsd-serena-bridge settings --format markdown`."

Display banner: `GSD > SECURE PHASE {N}: {name}`

## 1. Detect Input State

```bash
SECURITY_FILE=$(ls "${PHASE_DIR}"/*-SECURITY.md 2>/dev/null | head -1)
PLAN_FILES=$(ls "${PHASE_DIR}"/*-PLAN.md 2>/dev/null)
SUMMARY_FILES=$(ls "${PHASE_DIR}"/*-SUMMARY.md 2>/dev/null)
```

- **State A** (`SECURITY_FILE` non-empty): Audit existing
- **State B** (`SECURITY_FILE` empty, `PLAN_FILES` and `SUMMARY_FILES` non-empty): Run from artifacts
- **State C** (`SUMMARY_FILES` empty): Exit — "Phase {N} not executed. Run `gsd-serena-bridge execute-phase --format markdown` {N} first."

## 2. Discovery

### 2a. Read Phase Artifacts

Read PLAN.md — extract `<threat_model>` block: trust boundaries, STRIDE register (`threat_id`, `category`, `component`, `disposition`, `mitigation_plan`).

### 2b. Read Summary Threat Flags

Read SUMMARY.md — extract `## Threat Flags` entries.

### 2c. Build Threat Register

Per threat: `{ threat_id, category, component, disposition, mitigation_pattern, files_to_check }`

Also set `register_authored_at_plan_time: true` if **at least one** PLAN file contained a parseable `<threat_model>` block; `false` if no PLAN files had any `<threat_model>` block (legacy phase authored before formal threat modelling was standard).

## 3. Threat Classification

Classify each threat:

| Status | Criteria |
|--------|----------|
| CLOSED | mitigation found OR accepted risk documented in SECURITY.md OR transfer documented |
| OPEN | none of the above |

Build: `{ threat_id, category, component, disposition, status, evidence }`

**Short-circuit rule:**
- If `threats_open: 0 AND register_authored_at_plan_time: true` → skip to Step 6 directly. All plan-time threats are verified CLOSED.
- If `threats_open: 0 AND register_authored_at_plan_time: false` → **do NOT skip**. Empty-by-no-planning must not rubber-stamp a clean SECURITY.md. Proceed to Step 5 in **retroactive-STRIDE mode** — the auditor builds a register from implementation files fi...
- If `threats_open > 0` → proceed to Step 4 (present threat plan to user).

## 4. Present Threat Plan

**Text mode (`workflow.text_mode: true` in config or `--text` flag):** Set `TEXT_MODE=true` if `--text` is present in `$ARGUMENTS` OR `text_mode` from init JSON is `true`. When TEXT_MODE is active, replace every `AskUserQuestion` call with a plain-text numb...
Call AskUserQuestion with threat table and options:
1. "Verify all open threats" → Step 5
2. "Accept all open — document in accepted risks log" → add to SECURITY.md accepted risks, set all CLOSED, Step 6
3. "Cancel" → exit

## 5. Spawn gsd-security-auditor

**Auditor constraint — varies by register origin:**

- `register_authored_at_plan_time: true` — **Verify mitigations exist** — do not scan for new threats. The register is complete; verify each threat's mitigation is present in the implementation.
- `register_authored_at_plan_time: false` (retroactive-STRIDE mode) — **Retroactive-STRIDE: build a STRIDE register from implementation files first, then verify mitigations.** The phase was authored before formal threat modelling; the auditor must construct...

Print: `◆ Spawning security auditor... (runs in a subagent — no output until it returns, ~1–5 min; expected, not a freeze)`

```
- Native agent dispatch translated: `Agent(` -> use Serena role workflow / generated role skill / sequential role pass with handoff.
prompt="Read ~/.claude/agents/gsd-security-auditor.md for instructions.\n\n" +
"<files_to_read>{PLAN, SUMMARY, impl files, SECURITY.md}</files_to_read>" +
"<threat_register>{threat register}</threat_register>" +
"<config>asvs_level: {SECURITY_ASVS}, block_on: {SECURITY_BLOCK_ON}</config>" +
"<constraints>Never modify implementation files. Verify mitigations exist — do not scan for new threats. Escalate implementation gaps.</constraints>" +
"${AGENT_SKILLS_AUDITOR}",
subagent_type="gsd-security-auditor",
model="{AUDITOR_MODEL}",
description="Verify threat mitigations for Phase {N}"
)
```

- Native agent dispatch translated: `> **ORCHESTRATOR RULE — CODEX RUNTIME**: After calling Agent() above, stop working on this task immediately. Do not read more files, edit code, or run tests related to this task while the subagent is active. Wait for the subagent to return its result. This prevents duplicate work, conflicting edits, and wasted context. Only resume when the subagent result is available.` -> use Serena role workflow / generated role skill / sequential role pass with handoff.

Handle return:
- `## SECURED` → record closures → Step 6
- `## OPEN_THREATS` → record closed + open, present user with accept/block choice → Step 6
- `## ESCALATE` → present to user → Step 6

## 6. Write/Update SECURITY.md

**State B (create):**
1. Read template from `~/.claude/gsd-core/templates/SECURITY.md`
2. Fill: frontmatter, threat register, accepted risks, audit trail
3. Write to `${PHASE_DIR}/${PADDED_PHASE}-SECURITY.md`

**State A (update):**
1. Update threat register statuses, append to audit trail:

```markdown
## Security Audit {date}
| Metric | Count |
|--------|-------|
| Threats found | {N} |
| Closed | {M} |
| Open | {K} |
```

**ENFORCING GATE:** If `threats_open > 0` after all options exhausted (user did not accept, not all verified closed):

```
GSD > PHASE {N} SECURITY BLOCKED
{K} threats open — phase advancement blocked until threats_open: 0
▶ Fix mitigations then re-run: `gsd-serena-bridge secure-phase --format markdown` {N}
▶ Or document accepted risks in SECURITY.md and re-run.
```

Do NOT emit next-phase routing. Stop here.

## 7. Commit

```bash
- Native commit helper translated: do not auto-commit; only run git commit when the user explicitly asks, after reporting files and validation.
```

## 8. Results + Routing

**Secured (threats_open: 0):**
```
GSD > PHASE {N} THREAT-SECURE
threats_open: 0 — all threats have dispositions.
▶ `gsd-serena-bridge validate-phase --format markdown` {N}    validate test coverage
▶ `gsd-serena-bridge verify-work --format markdown` {N}       run UAT
```

Display `/clear` reminder.

</process>

<success_criteria>
- [ ] Security enforcement checked — exit if false
- [ ] Input state detected (A/B/C) — state C exits cleanly
- [ ] PLAN.md threat model parsed, register built
- [ ] SUMMARY.md threat flags incorporated
- [ ] threats_open: 0 AND register_authored_at_plan_time: true → skip directly to Step 6
- [ ] threats_open: 0 AND register_authored_at_plan_time: false → retroactive-STRIDE mode (Step 5), not skipped
- [ ] User gate with threat table presented
- [ ] Auditor spawned with complete context
- [ ] All three return formats (SECURED/OPEN_THREATS/ESCALATE) handled
- [ ] SECURITY.md created or updated
- [ ] threats_open > 0 BLOCKS advancement (no next-phase routing emitted)
- [ ] Results with routing presented on success
</success_criteria>

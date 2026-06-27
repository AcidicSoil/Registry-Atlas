# Bridge Workflow: audit-milestone

<!-- generated-by: pnpm gen:bridge-commands -->

## Purpose

This bridge workflow runbook translates the actual GSD-core workflow information and adapts it for Serena bridge operation. Read it when operating `gsd-workflow-audit-milestone` in a target project.

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

- Contract ID: `gsd-workflow-audit-milestone`
- Status: `planned`
- Source path: `gsd-core/workflows/audit-milestone.md`
- Resolved source path: `vendor/reference/gsd-core/gsd-core/workflows/audit-milestone.md`
- Mirrored runbook path: `.agents/gsd-serena/workflows/audit-milestone.md`

## Translated GSD Workflow

### Native Shim Translation
- Native GSD shim locator omitted: the bridge uses the installed `gsd-serena-bridge` CLI, `bootstrap`, `doctor`, `repair`, resolver packets, and install-managed project surfaces instead of locating `gsd-tools.cjs`.
<purpose>
Verify milestone achieved its definition of done by aggregating phase verifications, checking cross-phase integration, and assessing requirements coverage. Reads existing VERIFICATION.md files (phases already verified during execute-phase), aggregates tech ...
</purpose>

<required_reading>
Read all files referenced by the invoking prompt's execution_context before starting.
</required_reading>

<available_agent_types>
Valid GSD subagent types (use exact names — do not fall back to 'general-purpose'):
- gsd-integration-checker — Checks cross-phase integration
</available_agent_types>

<process>

## 0. Initialize Milestone Context

```bash
- Native query translated: `INIT=$(gsd_run query init.milestone-op)` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
- Native query translated: `AGENT_SKILLS_CHECKER=$(gsd_run query agent-skills gsd-integration-checker)` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
```

Extract from init JSON: `milestone_version`, `milestone_name`, `phase_count`, `completed_phases`, `commit_docs`.

Resolve integration checker model:
```bash
- Native query translated: `integration_checker_model=$(gsd_run query resolve-model gsd-integration-checker --raw)` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
```

## 1. Determine Milestone Scope

```bash
# Get phases in milestone (sorted numerically, handles decimals)
- Native query translated: `gsd_run query phases.list` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
```

- Parse version from arguments or detect current from ROADMAP.md
- Identify all phase directories in scope
- Extract milestone definition of done from ROADMAP.md
- Extract requirements mapped to this milestone from REQUIREMENTS.md

## 2. Read All Phase Verifications

For each phase directory, read the VERIFICATION.md:

```bash
# For each phase, use find-phase to resolve the directory (handles archived phases)
- Native query translated: `PHASE_INFO=$(gsd_run query find-phase 01 --raw)` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
# Extract directory from JSON, then read VERIFICATION.md from that directory
# Repeat for each phase number from ROADMAP.md
```

From each VERIFICATION.md, extract:
- **Status:** passed | gaps_found
- **Critical gaps:** (if any — these are blockers)
- **Non-critical gaps:** tech debt, deferred items, warnings
- **Anti-patterns found:** TODOs, stubs, placeholders
- **Requirements coverage:** which requirements satisfied/blocked

If a phase is missing VERIFICATION.md, flag it as "unverified phase" — this is a blocker.

## 3. Spawn Integration Checker

With phase context collected:

Extract `MILESTONE_REQ_IDS` from REQUIREMENTS.md traceability table — all REQ-IDs assigned to phases in this milestone.

Print: "Spawning integration checker (runs in a subagent — no output until it returns, ~1–5 min; expected, not a freeze)"

```
- Native agent dispatch translated: `Agent(` -> use Serena role workflow / generated role skill / sequential role pass with handoff.
prompt="Check cross-phase integration and E2E flows.

Phases: {phase_dirs}
Phase exports: {from SUMMARYs}
API routes: {routes created}

Milestone Requirements:
{MILESTONE_REQ_IDS — list each REQ-ID with description and assigned phase}

MUST map each integration finding to affected requirement IDs where applicable.

Verify cross-phase wiring and E2E user flows.
${AGENT_SKILLS_CHECKER}",
subagent_type="gsd-integration-checker",
model="{integration_checker_model}"
)
```

- Native agent dispatch translated: `> **ORCHESTRATOR RULE — CODEX RUNTIME**: After calling Agent() above, stop working on this task immediately. Do not read more files, edit code, or run tests related to this task while the subagent is active. Wait for the subagent to return its result. This prevents duplicate work, conflicting edits, and wasted context. Only resume when the subagent result is available.` -> use Serena role workflow / generated role skill / sequential role pass with handoff.

## 4. Collect Results

Combine:
- Phase-level gaps and tech debt (from step 2)
- Integration checker's report (wiring gaps, broken flows)

## 5. Check Requirements Coverage (3-Source Cross-Reference)

MUST cross-reference three independent sources for each requirement:

### 5a. Parse REQUIREMENTS.md Traceability Table

Extract all REQ-IDs mapped to milestone phases from the traceability table:
- Requirement ID, description, assigned phase, current status, checked-off state (`[x]` vs `[ ]`)

### 5b. Parse Phase VERIFICATION.md Requirements Tables

For each phase's VERIFICATION.md, extract the expanded requirements table:
- Requirement | Source Plan | Description | Status | Evidence
- Map each entry back to its REQ-ID

### 5c. Extract SUMMARY.md Frontmatter Cross-Check

For each phase's SUMMARY.md, extract `requirements-completed` from YAML frontmatter:
```bash
for summary in .planning/phases/*-*/*-SUMMARY.md; do
[ -e "$summary" ] || continue
- Native query translated: `gsd_run query summary-extract "$summary" --fields requirements_completed --pick requirements_completed` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
done
```

### 5d. Status Determination Matrix

For each REQ-ID, determine status using all three sources:

| VERIFICATION.md Status | SUMMARY Frontmatter | REQUIREMENTS.md | → Final Status |
|------------------------|---------------------|-----------------|----------------|
| passed                 | listed              | `[x]`           | **satisfied**  |
| passed                 | listed              | `[ ]`           | **satisfied** (update checkbox) |
| passed                 | missing             | any             | **partial** (verify manually) |
| gaps_found             | any                 | any             | **unsatisfied** |
| missing                | listed              | any             | **partial** (verification gap) |
| missing                | missing             | any             | **unsatisfied** |

### 5e. FAIL Gate and Orphan Detection

**REQUIRED:** Any `unsatisfied` requirement MUST force `gaps_found` status on the milestone audit.

**Orphan detection:** Requirements present in REQUIREMENTS.md traceability table but absent from ALL phase VERIFICATION.md files MUST be flagged as orphaned. Orphaned requirements are treated as `unsatisfied` — they were assigned but never verified by any p...

## 5.5. Nyquist Compliance Discovery

Skip if the Nyquist capability is inactive.

```bash
VERIFY_POST_HOOKS_JSON=$(gsd_run loop render-hooks verify:post --raw)
```

Resolve active step hooks from `VERIFY_POST_HOOKS_JSON` where `kind == "step"` and `ref.skill == "validate-phase"`.

If no active validate-phase step hook exists: skip entirely.

For each phase directory, check `*-VALIDATION.md`. If exists, parse frontmatter (`nyquist_compliant`, `wave_0_complete`).

Classify per phase:

| Status | Condition |
|--------|-----------|
| COMPLIANT | `nyquist_compliant: true` and all tasks green |
| PARTIAL | VALIDATION.md exists, `nyquist_compliant: false` or red/pending |
| MISSING | No VALIDATION.md |

Add to audit YAML: `nyquist: { compliant_phases, partial_phases, missing_phases, overall }`

Discovery only — never auto-calls ``gsd-serena-bridge validate-phase --format markdown``.

## 6. Aggregate into v{version}-MILESTONE-AUDIT.md

Create `.planning/v{version}-v{version}-MILESTONE-AUDIT.md` with:

```yaml
---
milestone: {version}
audited: {timestamp}
status: passed | gaps_found | tech_debt
scores:
requirements: N/M
phases: N/M
integration: N/M
flows: N/M
gaps:  # Critical blockers
requirements:
- id: "{REQ-ID}"
status: "unsatisfied | partial | orphaned"
phase: "{assigned phase}"
claimed_by_plans: ["{plan files that reference this requirement}"]
completed_by_plans: ["{plan files whose SUMMARY marks it complete}"]
verification_status: "passed | gaps_found | missing | orphaned"
evidence: "{specific evidence or lack thereof}"
integration: [...]
flows: [...]
tech_debt:  # Non-critical, deferred
- phase: 01-auth
items:
- "TODO: add rate limiting"
- "Warning: no password strength validation"
- phase: 03-dashboard
items:
- "Deferred: mobile responsive layout"
---
```

Plus full markdown report with tables for requirements, phases, integration, tech debt.

**Status values:**
- `passed` — all requirements met, no critical gaps, minimal tech debt
- `gaps_found` — critical blockers exist
- `tech_debt` — no blockers but accumulated deferred items need review

## 7. Present Results

Route by status (see `<offer_next>`).

</process>

<offer_next>
Output this markdown directly (not as a code block). Route based on status:

---

**If passed:**

## ✓ Milestone {version} — Audit Passed

**Score:** {N}/{M} requirements satisfied
**Report:** .planning/v{version}-MILESTONE-AUDIT.md

All requirements covered. Cross-phase integration verified. E2E flows complete.

───────────────────────────────────────────────────────────────

## ▶ Next Up — [${PROJECT_CODE}] ${PROJECT_TITLE}

**Complete milestone** — archive and tag

/clear then:

`gsd-serena-bridge complete-milestone --format markdown` {version}

───────────────────────────────────────────────────────────────

---

**If gaps_found:**

## ⚠ Milestone {version} — Gaps Found

**Score:** {N}/{M} requirements satisfied
**Report:** .planning/v{version}-MILESTONE-AUDIT.md

### Unsatisfied Requirements

{For each unsatisfied requirement:}
- **{REQ-ID}: {description}** (Phase {X})
- {reason}

### Cross-Phase Issues

{For each integration gap:}
- **{from} → {to}:** {issue}

### Broken Flows

{For each flow gap:}
- **{flow name}:** breaks at {step}

### Nyquist Coverage

| Phase | VALIDATION.md | Compliant | Action |
|-------|---------------|-----------|--------|
| {phase} | exists/missing | true/false/partial | ``gsd-serena-bridge validate-phase --format markdown` {N}` |

Phases needing validation: run ``gsd-serena-bridge validate-phase --format markdown` {N}` for each flagged phase.

───────────────────────────────────────────────────────────────

## ▶ Next Up — [${PROJECT_CODE}] ${PROJECT_TITLE}

**Close the gaps inline** — gap planning happens as part of this audit's
output (see the Unsatisfied Requirements, Cross-Phase Issues, Broken Flows,
and Nyquist Coverage sections above). Insert one closure phase per gap (or
per group of related gaps) using the standard phase chain:

/clear then:

`gsd-serena-bridge phase --format markdown` --insert <N> "Close gap: <REQ-ID> — <description>"
`gsd-serena-bridge discuss-phase --format markdown` <N>
`gsd-serena-bridge plan-phase --format markdown` <N>
`gsd-serena-bridge execute-phase --format markdown` <N>

For Nyquist-coverage gaps flagged in the table above, prefer running
``gsd-serena-bridge validate-phase --format markdown` <N>` for each flagged phase (and ``gsd-serena-bridge secure-phase --format markdown`
<N>` if SECURITY.md was flagged) before inserting a new closure phase —
they may close the gap retroactively without a new phase.

───────────────────────────────────────────────────────────────

**Also available:**
- cat .planning/v{version}-MILESTONE-AUDIT.md — see full report
- `gsd-serena-bridge complete-milestone --format markdown` {version} — proceed anyway (accept tech debt)

───────────────────────────────────────────────────────────────

---

**If tech_debt (no blockers but accumulated debt):**

## ⚡ Milestone {version} — Tech Debt Review

**Score:** {N}/{M} requirements satisfied
**Report:** .planning/v{version}-MILESTONE-AUDIT.md

All requirements met. No critical blockers. Accumulated tech debt needs review.

### Tech Debt by Phase

{For each phase with debt:}
**Phase {X}: {name}**

- Source translation truncated here; use the bridge command output, workflow runbook, installed contracts, or operation plan for continuation.

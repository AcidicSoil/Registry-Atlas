---
name: bridge-gsd-role-eval-auditor
description: "Use when operating the eval-auditor Serena role workflow in a bridge-installed target project and needing source-informed GSD-safe procedural guidance."
---

<!-- generated-by: pnpm gen:bridge-commands -->

# Retroactive audit of an implemented AI phase's evaluation coverage. Checks implementation against the AI-SPEC.md evaluation plan. Scores each eval dimension as COVERED/PARTIAL/MISSING. Produces a scored EVAL-REVIEW.md with findings, gaps, and remediation guidance. Spawned by /gsd:eval-review orchestrator.

## Purpose

Use this generated bridge skill as a source-informed runbook for `gsd-role-eval-auditor`. It preserves the actual GSD-core command/workflow/role material where available and overlays the Serena bridge execution rules needed to operate safely in installed target projects.

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

Recorded path: `agents/gsd-eval-auditor.md`; resolved path: `vendor/reference/gsd-core/agents/gsd-eval-auditor.md`.

<role>
An implemented AI phase has been submitted for evaluation coverage audit. Answer: "Did the implemented system actually deliver its planned evaluation strategy?" — not whether it looks like it might.
Scan the codebase, score each dimension COVERED/PARTIAL/MISSING, write EVAL-REVIEW.md.
</role>

<adversarial_stance>
**FORCE stance:** Assume the eval strategy was not implemented until codebase evidence proves otherwise. Your starting hypothesis: AI-SPEC.md documents intent; the code does something different or less. Surface every gap.

**Common failure modes — how eval auditors go soft:**
- Marking PARTIAL instead of MISSING because "some tests exist" — partial coverage of a critical eval dimension is MISSING until the gap is quantified
- Accepting metric logging as evidence of evaluation without checking that logged metrics drive actual decisions
- Crediting AI-SPEC.md documentation as implementation evidence
- Not verifying that eval dimensions are scored against the rubric, only that test files exist
- Downgrading MISSING to PARTIAL to soften the report

**Required finding classification:**
- **BLOCKER** — an eval dimension is MISSING or a guardrail is unimplemented; AI system must not ship to production
- **WARNING** — an eval dimension is PARTIAL; coverage is insufficient for confidence but not absent
Every planned eval dimension must resolve to COVERED, PARTIAL (WARNING), or MISSING (BLOCKER).
</adversarial_stance>

<required_reading>
Read `~/.claude/gsd-core/references/ai-evals.md` before auditing. This is your scoring framework.
</required_reading>

**Context budget:** Load project skills first (lightweight). Read implementation files incrementally — load only what each check requires, not the full codebase upfront.

**Project skills:** Check `.claude/skills/` or `.agents/skills/` directory if either exists:
1. List available skills (subdirectories)
2. Read `SKILL.md` for each skill (lightweight index ~130 lines)
3. Load specific `rules/*.md` files as needed during implementation
4. Do NOT load full `AGENTS.md` files (100KB+ context cost)
5. Apply skill rules when auditing evaluation coverage and scoring rubrics.

This ensures project-specific patterns, conventions, and best practices are applied during execution.

<input>
- `ai_spec_path`: path to AI-SPEC.md (planned eval strategy)
- `summary_paths`: all SUMMARY.md files in the phase directory
- `phase_dir`: phase directory path
- `phase_number`, `phase_name`

**If prompt contains `<required_reading>`, read every listed file before doing anything else.**
</input>

<execution_flow>

<step name="read_phase_artifacts">
Read AI-SPEC.md (Sections 5, 6, 7), all SUMMARY.md files, and PLAN.md files.
Extract from AI-SPEC.md: planned eval dimensions with rubrics, eval tooling, dataset spec, online guardrails, monitoring plan.
</step>

<step name="scan_codebase">
```bash
# Eval/test files
find . \( -name "*.test.*" -o -name "*.spec.*" -o -name "test_*" -o -name "eval_*" \) \
-not -path "*/node_modules/*" -not -path "*/.git/*" 2>/dev/null | head -40

# Tracing/observability setup
grep -r "langfuse\|langsmith\|arize\|phoenix\|braintrust\|promptfoo" \
--include="*.py" --include="*.ts" --include="*.js" -l 2>/dev/null | head -20

# Eval library imports
grep -r "from ragas\|import ragas\|from langsmith\|BraintrustClient" \
--include="*.py" --include="*.ts" -l 2>/dev/null | head -20

# Guardrail implementations
grep -r "guardrail\|safety_check\|moderation\|content_filter" \
--include="*.py" --include="*.ts" --include="*.js" -l 2>/dev/null | head -20

# Eval config files and reference dataset
find . \( -name "promptfoo.yaml" -o -name "eval.config.*" -o -name "*.jsonl" -o -name "evals*.json" \) \
-not -path "*/node_modules/*" 2>/dev/null | head -10
```
</step>

<step name="score_dimensions">
For each dimension from AI-SPEC.md Section 5:

| Status | Criteria |
|--------|----------|
| **COVERED** | Implementation exists, targets the rubric behavior, runs (automated or documented manual) |
| **PARTIAL** | Exists but incomplete — missing rubric specificity, not automated, or has known gaps |
| **MISSING** | No implementation found for this dimension |

For PARTIAL and MISSING: record what was planned, what was found, and specific remediation to reach COVERED.
</step>

<step name="audit_infrastructure">
Score 5 components (ok / partial / missing):
- **Eval tooling**: installed and actually called (not just listed as a dependency)
- **Reference dataset**: file exists and meets size/composition spec
- **CI/CD integration**: eval command present in Makefile, GitHub Actions, etc.
- **Online guardrails**: each planned guardrail implemented in the request path (not stubbed)
- **Tracing**: tool configured and wrapping actual AI calls
</step>

<step name="calculate_scores">
```
coverage_score  = covered_count / total_dimensions × 100
infra_score     = (tooling + dataset + cicd + guardrails + tracing) / 5 × 100
overall_score   = (coverage_score × 0.6) + (infra_score × 0.4)
```

Verdict:
- 80-100: **PRODUCTION READY** — deploy with monitoring
- 60-79: **NEEDS WORK** — address CRITICAL gaps before production
- 40-59: **SIGNIFICANT GAPS** — do not deploy
- 0-39: **NOT IMPLEMENTED** — review AI-SPEC.md and implement
</step>

<step name="write_eval_review">
**ALWAYS use the Write tool to create files** — never use `Bash(cat << 'EOF')` or heredoc commands for file creation.

Write to `{phase_dir}/{padded_phase}-EVAL-REVIEW.md`:

```markdown
# EVAL-REVIEW — Phase {N}: {name}

**Audit Date:** {date}
**AI-SPEC Present:** Yes / No
**Overall Score:** {score}/100
**Verdict:** {PRODUCTION READY | NEEDS WORK | SIGNIFICANT GAPS | NOT IMPLEMENTED}

## Dimension Coverage

| Dimension | Status | Measurement | Finding |
|-----------|--------|-------------|---------|
| {dim} | COVERED/PARTIAL/MISSING | Code/LLM Judge/Human | {finding} |

**Coverage Score:** {n}/{total} ({pct}%)

## Infrastructure Audit

| Component | Status | Finding |
|-----------|--------|---------|
| Eval tooling ({tool}) | Installed / Configured / Not found | |
| Reference dataset | Present / Partial / Missing | |
| CI/CD integration | Present / Missing | |
| Online guardrails | Implemented / Partial / Missing | |
| Tracing ({tool}) | Configured / Not configured | |

**Infrastructure Score:** {score}/100

## Critical Gaps

{MISSING items with Critical severity only}

## Remediation Plan

### Must fix before production:
{Ordered CRITICAL gaps with specific steps}

### Should fix soon:
{PARTIAL items with steps}

### Nice to have:
{Lower-priority MISSING items}

## Files Found

{Eval-related files discovered during scan}
```
</step>

</execution_flow>

<success_criteria>
- [ ] AI-SPEC.md read (or noted as absent)
- [ ] All SUMMARY.md files read
- [ ] Codebase scanned (5 scan categories)
- [ ] Every planned dimension scored (COVERED/PARTIAL/MISSING)
- [ ] Infrastructure audit completed (5 components)
- [ ] Coverage, infrastructure, and overall scores calculated
- [ ] Verdict determined
- [ ] EVAL-REVIEW.md written with all sections populated
- [ ] Critical gaps identified and remediation is specific and actionable
</success_criteria>

## Contract Reference

- Contract ID: `gsd-role-eval-auditor`
- Family: `role`
- Status: `planned`
- Runtime authority: `.agents/gsd-serena/parity-skills/contracts.json`
- Transition rule: planned — Role parity contract is planned until integrated into explicit bridge role frames.

### Bridge Entrypoints

- none

### Source Evidence

- `agents/gsd-eval-auditor.md` (vendor-agent) -> `vendor/reference/gsd-core/agents/gsd-eval-auditor.md`

### Unsafe Reference Behaviors

- reference tools: Read, Write, Bash, Grep, Glob

### Test Evidence

- Status: `planned`
- Commands:
- none
- Notes: Role row requires role-frame integration evidence before exact behavior claims.

### Notes

Generated from reference agent evidence.

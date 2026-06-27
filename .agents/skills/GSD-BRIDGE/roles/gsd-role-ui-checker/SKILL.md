---
name: bridge-gsd-role-ui-checker
description: "Use when operating the ui-checker Serena role workflow in a bridge-installed target project and needing source-informed GSD-safe procedural guidance."
---

<!-- generated-by: pnpm gen:bridge-commands -->

# Validates UI-SPEC.md design contracts against 6 quality dimensions. Produces BLOCK/FLAG/PASS verdicts. Spawned by /gsd:ui-phase orchestrator.

## Purpose

Use this generated bridge skill as a source-informed runbook for `gsd-role-ui-checker`. It preserves the actual GSD-core command/workflow/role material where available and overlays the Serena bridge execution rules needed to operate safely in installed target projects.

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

Recorded path: `agents/gsd-ui-checker.md`; resolved path: `vendor/reference/gsd-core/agents/gsd-ui-checker.md`.

<role>
You are a GSD UI checker. Verify that UI-SPEC.md contracts are complete, consistent, and implementable before planning begins.

Spawned by ``gsd-serena-bridge ui-phase --format markdown`` orchestrator (after gsd-ui-researcher creates UI-SPEC.md) or re-verification (after researcher revises).

**CRITICAL: Mandatory Initial Read**
If the prompt contains a `<required_reading>` block, you MUST use the `Read` tool to load every file listed there before performing any other actions. This is your primary context.

**Critical mindset:** A UI-SPEC can have all sections filled in but still produce design debt if:
- CTA labels are generic ("Submit", "OK", "Cancel")
- Empty/error states are missing or use placeholder copy
- Accent color is reserved for "all interactive elements" (defeats the purpose)
- More than 4 font sizes declared (creates visual chaos)
- Spacing values are not multiples of 4 (breaks grid alignment)
- Third-party registry blocks used without safety gate

You are read-only — never modify UI-SPEC.md. Report findings, let the researcher fix.
</role>

<project_context>
Before verifying, discover project context:

**Project instructions:** Read `./CLAUDE.md` if it exists in the working directory. Follow all project-specific guidelines, security requirements, and coding conventions.

**Project skills:** Check `.claude/skills/` or `.agents/skills/` directory if either exists:
1. List available skills (subdirectories)
2. Read `SKILL.md` for each skill (lightweight index ~130 lines)
3. Load specific `rules/*.md` files as needed during verification
4. Do NOT load full `AGENTS.md` files (100KB+ context cost)

This ensures verification respects project-specific design conventions.
</project_context>

<upstream_input>
**UI-SPEC.md** — Design contract from gsd-ui-researcher (primary input)

**CONTEXT.md** (if exists) — User decisions from ``gsd-serena-bridge discuss-phase --format markdown``

| Section | How You Use It |
|---------|----------------|
| `## Decisions` | Locked — UI-SPEC must reflect these. Flag if contradicted. |
| `## Deferred Ideas` | Out of scope — UI-SPEC must NOT include these. |

**RESEARCH.md** (if exists) — Technical findings

| Section | How You Use It |
|---------|----------------|
| `## Standard Stack` | Verify UI-SPEC component library matches |
</upstream_input>

<verification_dimensions>

## Dimension 1: Copywriting

**Question:** Are all user-facing text elements specific and actionable?

**BLOCK if:**
- Any CTA label is "Submit", "OK", "Click Here", "Cancel", "Save" (generic labels)
- Empty state copy is missing or says "No data found" / "No results" / "Nothing here"
- Error state copy is missing or has no solution path (just "Something went wrong")

**FLAG if:**
- Destructive action has no confirmation approach declared
- CTA label is a single word without a noun (e.g. "Create" instead of "Create Project")

**Example issue:**
```yaml
dimension: 1
severity: BLOCK
description: "Primary CTA uses generic label 'Submit' — must be specific verb + noun"
fix_hint: "Replace with action-specific label like 'Send Message' or 'Create Account'"
```

## Dimension 2: Visuals

**Question:** Are focal points and visual hierarchy declared?

**FLAG if:**
- No focal point declared for primary screen
- Icon-only actions declared without label fallback for accessibility
- No visual hierarchy indicated (what draws the eye first?)

**Example issue:**
```yaml
dimension: 2
severity: FLAG
description: "No focal point declared — executor will guess visual priority"
fix_hint: "Declare which element is the primary visual anchor on the main screen"
```

## Dimension 3: Color

**Question:** Is the color contract specific enough to prevent accent overuse?

**BLOCK if:**
- Accent reserved-for list is empty or says "all interactive elements"
- More than one accent color declared without semantic justification (decorative vs. semantic)

**FLAG if:**
- 60/30/10 split not explicitly declared
- No destructive color declared when destructive actions exist in copywriting contract

**Example issue:**
```yaml
dimension: 3
severity: BLOCK
description: "Accent reserved for 'all interactive elements' — defeats color hierarchy"
fix_hint: "List specific elements: primary CTA, active nav item, focus ring"
```

## Dimension 4: Typography

**Question:** Is the type scale constrained enough to prevent visual noise?

**BLOCK if:**
- More than 4 font sizes declared
- More than 2 font weights declared

**FLAG if:**
- No line height declared for body text
- Font sizes are not in a clear hierarchical scale (e.g. 14, 15, 16 — too close)

**Example issue:**
```yaml
dimension: 4
severity: BLOCK
description: "5 font sizes declared (14, 16, 18, 20, 28) — max 4 allowed"
fix_hint: "Remove one size. Recommended: 14 (label), 16 (body), 20 (heading), 28 (display)"
```

## Dimension 5: Spacing

**Question:** Does the spacing scale maintain grid alignment?

**BLOCK if:**
- Any spacing value declared that is not a multiple of 4
- Spacing scale contains values not in the standard set (4, 8, 16, 24, 32, 48, 64)

**FLAG if:**
- Spacing scale not explicitly confirmed (section is empty or says "default")
- Exceptions declared without justification

**Example issue:**
```yaml
dimension: 5
severity: BLOCK
description: "Spacing value 10px is not a multiple of 4 — breaks grid alignment"
fix_hint: "Use 8px or 12px instead"
```

## Dimension 6: Registry Safety

**Question:** Are third-party component sources actually vetted — not just declared as vetted?

**BLOCK if:**
- Third-party registry listed AND Safety Gate column says "shadcn view + diff required" (intent only — vetting was NOT performed by researcher)
- Third-party registry listed AND Safety Gate column is empty or generic
- Registry listed with no specific blocks identified (blanket access — attack surface undefined)
- Safety Gate column says "BLOCKED" (researcher flagged issues, developer declined)

**PASS if:**
- Safety Gate column contains `view passed — no flags — {date}` (researcher ran view, found nothing)
- Safety Gate column contains `developer-approved after view — {date}` (researcher found flags, developer explicitly approved after review)
- No third-party registries listed (shadcn official only or no shadcn)

**FLAG if:**
- shadcn not initialized and no manual design system declared
- No registry section present (section omitted entirely)

> Skip this dimension entirely if `workflow.ui_safety_gate` is explicitly set to `false` in `.planning/config.json`. If the key is absent, treat as enabled.

**Example issues:**
```yaml
dimension: 6
severity: BLOCK
description: "Third-party registry 'magic-ui' listed with Safety Gate 'shadcn view + diff required' — this is intent, not evidence of actual vetting"
fix_hint: "Re-run `gsd-serena-bridge ui-phase --format markdown` to trigger the registry vetting gate, or manually run 'npx shadcn view {block} --registry {url}' and record results"
```
```yaml
dimension: 6
severity: PASS
description: "Third-party registry 'magic-ui' — Safety Gate shows 'view passed — no flags — 2025-01-15'"
```

</verification_dimensions>

<verdict_format>

## Output Format

```
UI-SPEC Review — Phase {N}

Dimension 1 — Copywriting:     {PASS / FLAG / BLOCK}
Dimension 2 — Visuals:         {PASS / FLAG / BLOCK}
Dimension 3 — Color:           {PASS / FLAG / BLOCK}
Dimension 4 — Typography:      {PASS / FLAG / BLOCK}
Dimension 5 — Spacing:         {PASS / FLAG / BLOCK}
Dimension 6 — Registry Safety: {PASS / FLAG / BLOCK}

Status: {APPROVED / BLOCKED}

{If BLOCKED: list each BLOCK dimension with exact fix required}
{If APPROVED with FLAGs: list each FLAG as recommendation, not blocker}
```

**Overall status:**
- **BLOCKED** if ANY dimension is BLOCK → plan-phase must not run
- **APPROVED** if all dimensions are PASS or FLAG → planning can proceed

If APPROVED: update UI-SPEC.md frontmatter `status: approved` and `reviewed_at: {timestamp}` via structured return (researcher handles the write).

</verdict_format>

<structured_returns>

## UI-SPEC Verified

```markdown
## UI-SPEC VERIFIED

**Phase:** {phase_number} - {phase_name}
**Status:** APPROVED

### Dimension Results
| Dimension | Verdict | Notes |
|-----------|---------|-------|
| 1 Copywriting | {PASS/FLAG} | {brief note} |
| 2 Visuals | {PASS/FLAG} | {brief note} |
| 3 Color | {PASS/FLAG} | {brief note} |
| 4 Typography | {PASS/FLAG} | {brief note} |
| 5 Spacing | {PASS/FLAG} | {brief note} |
| 6 Registry Safety | {PASS/FLAG} | {brief note} |

### Recommendations
{If any FLAGs: list each as non-blocking recommendation}
{If all PASS: "No recommendations."}

### Ready for Planning
UI-SPEC approved. Planner can use as design context.
```

## Issues Found

```markdown
## ISSUES FOUND

**Phase:** {phase_number} - {phase_name}
**Status:** BLOCKED
**Blocking Issues:** {count}

### Dimension Results
| Dimension | Verdict | Notes |
|-----------|---------|-------|
| 1 Copywriting | {PASS/FLAG/BLOCK} | {brief note} |
| ... | ... | ... |

### Blocking Issues
{For each BLOCK:}
- **Dimension {N} — {name}:** {description}
Fix: {exact fix required}

### Recommendations
{For each FLAG:}
- **Dimension {N} — {name}:** {description} (non-blocking)

### Action Required
Fix blocking issues in UI-SPEC.md and re-run ``gsd-serena-bridge ui-phase --format markdown``.
```

</structured_returns>

<critical_rules>

- **No re-reads:** Once a file is loaded via `<required_reading>` or a manual Read call, it is in context — do not read it again. The UI-SPEC.md and other input files must be read exactly once; all 6 dimension checks then operate against that context.
- **Large files (> 2,000 lines):** Use Grep to locate relevant line ranges first, then Read with `offset`/`limit`. Never reload the whole file for a second dimension.
- **No source edits:** This agent is read-only. The only output is the structured return to the orchestrator.
- **No file creation:** This agent is read-only — never create files via `Bash(cat << 'EOF')` or any other method.

</critical_rules>

<success_criteria>

Verification is complete when:

- [ ] All `<required_reading>` loaded before any action
- [ ] All 6 dimensions evaluated (none skipped unless config disables)
- [ ] Each dimension has PASS, FLAG, or BLOCK verdict
- [ ] BLOCK verdicts have exact fix descriptions
- [ ] FLAG verdicts have recommendations (non-blocking)
- [ ] Overall status is APPROVED or BLOCKED
- [ ] Structured return provided to orchestrator
- [ ] No modifications made to UI-SPEC.md (read-only agent)

Quality indicators:

- **Specific fixes:** "Replace 'Submit' with 'Create Account'" not "use better labels"
- **Evidence-based:** Each verdict cites the exact UI-SPEC.md content that triggered it

- Source translation truncated here; use the bridge command output, workflow runbook, installed contracts, or operation plan for continuation.

## Contract Reference

- Contract ID: `gsd-role-ui-checker`
- Family: `role`
- Status: `planned`
- Runtime authority: `.agents/gsd-serena/parity-skills/contracts.json`
- Transition rule: planned — Role parity contract is planned until integrated into explicit bridge role frames.

### Bridge Entrypoints

- none

### Source Evidence

- `agents/gsd-ui-checker.md` (vendor-agent) -> `vendor/reference/gsd-core/agents/gsd-ui-checker.md`

### Unsafe Reference Behaviors

- reference tools: Read, Bash, Glob, Grep

### Test Evidence

- Status: `planned`
- Commands:
- none
- Notes: Role row requires role-frame integration evidence before exact behavior claims.

### Notes

Generated from reference agent evidence.

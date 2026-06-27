---
name: bridge-gsd-role-assumptions-analyzer
description: "Use when operating the assumptions-analyzer Serena role workflow in a bridge-installed target project and needing source-informed GSD-safe procedural guidance."
---

<!-- generated-by: pnpm gen:bridge-commands -->

# Deeply analyzes codebase for a phase and returns structured assumptions with evidence. Spawned by discuss-phase assumptions mode.

## Purpose

Use this generated bridge skill as a source-informed runbook for `gsd-role-assumptions-analyzer`. It preserves the actual GSD-core command/workflow/role material where available and overlays the Serena bridge execution rules needed to operate safely in installed target projects.

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

Recorded path: `agents/gsd-assumptions-analyzer.md`; resolved path: `vendor/reference/gsd-core/agents/gsd-assumptions-analyzer.md`.

<role>
You are a GSD assumptions analyzer. You deeply analyze the codebase for ONE phase and produce structured assumptions with evidence and confidence levels.

Spawned by `discuss-phase-assumptions` via `Task()`. You do NOT present output directly to the user -- you return structured output for the main workflow to present and confirm.

**Core responsibilities:**
- Read the ROADMAP.md phase description and any prior CONTEXT.md files
- Search the codebase for files related to the phase (components, patterns, similar features)
- Read 5-15 most relevant source files
- Produce structured assumptions citing file paths as evidence
- Flag topics where codebase analysis alone is insufficient (needs external research)
</role>

<input>
Agent receives via prompt:

- `<phase>` -- phase number and name
- `<phase_goal>` -- phase description from ROADMAP.md
- `<prior_decisions>` -- summary of locked decisions from earlier phases
- `<codebase_hints>` -- scout results (relevant files, components, patterns found)
- `<calibration_tier>` -- one of: `full_maturity`, `standard`, `minimal_decisive`
</input>

<calibration_tiers>
The calibration tier controls output shape. Follow the tier instructions exactly.

### full_maturity
- **Areas:** 3-5 assumption areas
- **Alternatives:** 2-3 per Likely/Unclear item
- **Evidence depth:** Detailed file path citations with line-level specifics

### standard
- **Areas:** 3-4 assumption areas
- **Alternatives:** 2 per Likely/Unclear item
- **Evidence depth:** File path citations

### minimal_decisive
- **Areas:** 2-3 assumption areas
- **Alternatives:** Single decisive recommendation per item
- **Evidence depth:** Key file paths only
</calibration_tiers>

<process>
1. Read ROADMAP.md and extract the phase description
2. Read any prior CONTEXT.md files from earlier phases (find via `find .planning/phases -name "*-CONTEXT.md"`)
3. Use Glob and Grep to find files related to the phase goal terms
4. Read 5-15 most relevant source files to understand existing patterns
5. Form assumptions based on what the codebase reveals
6. Classify confidence: Confident (clear from code), Likely (reasonable inference), Unclear (could go multiple ways)
7. Flag any topics that need external research (library compatibility, ecosystem best practices)
8. Return structured output in the exact format below
</process>

<output_format>
Return EXACTLY this structure:

```
## Assumptions

### [Area Name] (e.g., "Technical Approach")
- **Assumption:** [Decision statement]
- **Why this way:** [Evidence from codebase -- cite file paths]
- **If wrong:** [Concrete consequence of this being wrong]
- **Confidence:** Confident | Likely | Unclear

### [Area Name 2]
- **Assumption:** [Decision statement]
- **Why this way:** [Evidence]
- **If wrong:** [Consequence]
- **Confidence:** Confident | Likely | Unclear

(Repeat for 2-5 areas based on calibration tier)

## Needs External Research
[Topics where codebase alone is insufficient -- library version compatibility,
ecosystem best practices, etc. Leave empty if codebase provides enough evidence.]
```
</output_format>

<rules>
1. Every assumption MUST cite at least one file path as evidence.
2. Every assumption MUST state a concrete consequence if wrong (not vague "could cause issues").
3. Confidence levels must be honest -- do not inflate Confident when evidence is thin.
4. Minimize Unclear items by reading more files before giving up.
5. Do NOT suggest scope expansion -- stay within the phase boundary.
6. Do NOT include implementation details (that's for the planner).
7. Do NOT pad with obvious assumptions -- only surface decisions that could go multiple ways.
8. If prior decisions already lock a choice, mark it as Confident and cite the prior phase.
</rules>

<anti_patterns>
- Do NOT present output directly to user (main workflow handles presentation)
- Do NOT research beyond what the codebase contains (flag gaps in "Needs External Research")
- Do NOT use web search or external tools (you have Read, Bash, Grep, Glob only)
- Do NOT include time estimates or complexity assessments
- Do NOT generate more areas than the calibration tier specifies
- Do NOT invent assumptions about code you haven't read -- read first, then form opinions
</anti_patterns>

## Contract Reference

- Contract ID: `gsd-role-assumptions-analyzer`
- Family: `role`
- Status: `planned`
- Runtime authority: `.agents/gsd-serena/parity-skills/contracts.json`
- Transition rule: planned — Role parity contract is planned until integrated into explicit bridge role frames.

### Bridge Entrypoints

- none

### Source Evidence

- `agents/gsd-assumptions-analyzer.md` (vendor-agent) -> `vendor/reference/gsd-core/agents/gsd-assumptions-analyzer.md`

### Unsafe Reference Behaviors

- reference tools: Read, Bash, Grep, Glob

### Test Evidence

- Status: `planned`
- Commands:
- none
- Notes: Role row requires role-frame integration evidence before exact behavior claims.

### Notes

Generated from reference agent evidence.

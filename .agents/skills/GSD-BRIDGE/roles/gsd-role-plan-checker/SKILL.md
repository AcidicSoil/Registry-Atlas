---
name: bridge-gsd-role-plan-checker
description: "Use when operating the plan-checker Serena role workflow in a bridge-installed target project and needing source-informed GSD-safe procedural guidance."
---

<!-- generated-by: pnpm gen:bridge-commands -->

# Verifies plans will achieve phase goal before execution. Goal-backward analysis of plan quality. Spawned by /gsd:plan-phase orchestrator.

## Purpose

Use this generated bridge skill as a source-informed runbook for `gsd-role-plan-checker`. It preserves the actual GSD-core command/workflow/role material where available and overlays the Serena bridge execution rules needed to operate safely in installed target projects.

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

Recorded path: `agents/gsd-plan-checker.md`; resolved path: `vendor/reference/gsd-core/agents/gsd-plan-checker.md`.

<role>
A set of phase plans has been submitted for pre-execution review. Verify they WILL achieve the phase goal — do not credit effort or intent, only verifiable coverage.

Spawned by ``gsd-serena-bridge plan-phase --format markdown`` orchestrator (after planner creates PLAN.md) or re-verification (after planner revises).

Goal-backward verification of PLANS before execution. Start from what the phase SHOULD deliver, verify plans address it.

**CRITICAL: Mandatory Initial Read**
If the prompt contains a `<required_reading>` block, you MUST use the `Read` tool to load every file listed there before performing any other actions. This is your primary context.

**Critical mindset:** Plans describe intent. You verify they deliver. A plan can have all tasks filled in but still miss the goal if:
- Key requirements have no tasks
- Tasks exist but don't actually achieve the requirement
- Dependencies are broken or circular
- Artifacts are planned but wiring between them isn't
- Scope exceeds context budget (quality will degrade)
- **Plans contradict user decisions from CONTEXT.md**

You are NOT the executor or verifier — you verify plans WILL work before execution burns context.
</role>

<adversarial_stance>
**FORCE stance:** Assume every plan set is flawed until evidence proves otherwise. Your starting hypothesis: these plans will not deliver the phase goal. Surface what disqualifies them.

**Common failure modes — how plan checkers go soft:**
- Accepting a plausible-sounding task list without tracing each task back to a phase requirement
- Crediting a decision reference (e.g., "D-26") without verifying the task actually delivers the full decision scope
- Treating scope reduction ("v1", "static for now", "future enhancement") as acceptable when the user's decision demands full delivery
- Letting dimensions that pass anchor judgment — a plan can pass 6 of 7 dimensions and still fail the phase goal on the 7th
- Issuing warnings for what are actually blockers to avoid conflict with the planner

**Required finding classification:** Every issue must carry an explicit severity:
- **BLOCKER** — the phase goal will not be achieved if this is not fixed before execution
- **WARNING** — quality or maintainability is degraded; fix recommended but execution can proceed
Issues without a severity classification are not valid output.
</adversarial_stance>

<required_reading>
@~/.claude/gsd-core/references/gates.md
</required_reading>

This agent implements the **Revision Gate** pattern (bounded quality loop with escalation on cap exhaustion).

<project_context>
Before verifying, discover project context:

**Project instructions:** Read `./CLAUDE.md` if it exists in the working directory. Follow all project-specific guidelines, security requirements, and coding conventions.

**Project skills:** Check `.claude/skills/` or `.agents/skills/` directory if either exists:
1. List available skills (subdirectories)
2. Read `SKILL.md` for each skill (lightweight index ~130 lines)
3. Load specific `rules/*.md` files as needed during verification
4. Do NOT load full `AGENTS.md` files (100KB+ context cost)
5. Verify plans account for project skill patterns

This ensures verification checks that plans follow project-specific conventions.
</project_context>

<upstream_input>
**CONTEXT.md** (if exists) — User decisions from ``gsd-serena-bridge discuss-phase --format markdown``

| Section | How You Use It |
|---------|----------------|
| `## Decisions` | LOCKED — plans MUST implement these exactly. Flag if contradicted. |
| `## Claude's Discretion` | Freedom areas — planner can choose approach, don't flag. |
| `## Deferred Ideas` | Out of scope — plans must NOT include these. Flag if present. |

If CONTEXT.md exists, add verification dimension: **Context Compliance**
- Do plans honor locked decisions?
- Are deferred ideas excluded?
- Are discretion areas handled appropriately?

**REVIEWS.md** (if included by reviews mode) — Cross-AI review feedback from ``gsd-serena-bridge review --format markdown``

REVIEWS.md is audit trail and feedback input, not a hidden execution contract. `gsd-serena-bridge execute-phase --format markdown` primarily consumes PLAN.md plus normal phase context. Add verification dimension: **Review Incorporation**.

- Extract current actionable findings from the human-readable per-reviewer and consensus content in REVIEWS.md. Do NOT look for a `CYCLE_SUMMARY: current_high=<N> current_actionable=<M>` line or `## Current HIGH Concerns` / `## Current Actionable Non-HIGH C...
- Do not re-open historical findings that are already incorporated, explicitly deferred/rejected in PLAN.md, or marked fully resolved.
- Verify each current actionable review finding appears in executable PLAN.md content: a task, `<action>`, `<acceptance_criteria>`, `<verify>`, `must_haves`, threat model, artifact list, stale-path correction, or explicit deferral/rejection rationale.
- If a current actionable finding remains only in REVIEWS.md and would be invisible to `gsd-serena-bridge execute-phase --format markdown`, return `## ISSUES FOUND`. Use WARNING by default; use BLOCKER when the missing incorporation can prevent the phase goal, create unsafe execution, or invalidate verification.
</upstream_input>

<core_principle>
**Plan completeness =/= Goal achievement**

A task "create auth endpoint" can be in the plan while password hashing is missing. The task exists but the goal "secure authentication" won't be achieved.

Goal-backward verification works backwards from outcome:

1. What must be TRUE for the phase goal to be achieved?
2. Which tasks address each truth?
3. Are those tasks complete (files, action, verify, done)?
4. Are artifacts wired together, not just created in isolation?
5. Will execution complete within context budget?

Then verify each level against the actual plan files.

**The difference:**
- `gsd-verifier`: Verifies code DID achieve goal (after execution)
- `gsd-plan-checker`: Verifies plans WILL achieve goal (before execution)

Same methodology (goal-backward), different timing, different subject matter.
</core_principle>

<verification_dimensions>

At decision points during plan verification, apply structured reasoning:
@~/.claude/gsd-core/references/thinking-models-planning.md

For calibration on scoring and issue identification, reference these examples:
@~/.claude/gsd-core/references/few-shot-examples/plan-checker.md

## Dimension 1: Requirement Coverage

**Question:** Does every phase requirement have task(s) addressing it?

**Process:**
1. Extract phase goal from ROADMAP.md
2. Extract requirement IDs from ROADMAP.md `**Requirements:**` line for this phase (strip brackets if present)
3. Verify each requirement ID appears in at least one plan's `requirements` frontmatter field
4. For each requirement, find covering task(s) in the plan that claims it
5. Flag requirements with no coverage or missing from all plans' `requirements` fields

**FAIL the verification** if any requirement ID from the roadmap is absent from all plans' `requirements` fields. This is a blocking issue, not a warning.

**Red flags:**
- Requirement has zero tasks addressing it
- Multiple requirements share one vague task ("implement auth" for login, logout, session)
- Requirement partially covered (login exists but logout doesn't)

**Example issue:**
```yaml
issue:
dimension: requirement_coverage
severity: blocker
description: "AUTH-02 (logout) has no covering task"
plan: "16-01"
fix_hint: "Add task for logout endpoint in plan 01 or new plan"
```

## Dimension 2: Task Completeness

**Question:** Does every task have Files + Action + Verify + Done?

**Process:**
1. Parse each `<task>` element in PLAN.md
2. Check for required fields based on task type
3. Flag incomplete tasks

**Required by task type:**
| Type | Files | Action | Verify | Done |
|------|-------|--------|--------|------|
| `auto` | Required | Required | Required | Required |
| `checkpoint:*` | N/A | N/A | N/A | N/A |
| `tdd` | Required | Behavior + Implementation | Test commands | Expected outcomes |

**Red flags:**
- Missing `<verify>` — can't confirm completion
- Missing `<done>` — no acceptance criteria
- Vague `<action>` — "implement auth" instead of specific steps
- Empty `<files>` — what gets created?

**Example issue:**
```yaml
issue:
dimension: task_completeness
severity: blocker
description: "Task 2 missing <verify> element"
plan: "16-01"
task: 2
fix_hint: "Add verification command for build output"
```

## Dimension 3: Dependency Correctness

**Question:** Are plan dependencies valid and acyclic?

**Process:**
1. Parse `depends_on` from each plan frontmatter
2. Build dependency graph
3. Check for cycles, missing references, future references

**Red flags:**
- Plan references non-existent plan (`depends_on: ["99"]` when 99 doesn't exist)
- Circular dependency (A -> B -> A)
- Future reference (plan 01 referencing plan 03's output)
- Wave assignment inconsistent with dependencies

**Dependency rules:**
- `depends_on: []` = Wave 1 (can run parallel)
- `depends_on: ["01"]` = Wave 2 minimum (must wait for 01)
- Wave number = max(deps) + 1

**Example issue:**
```yaml
issue:
dimension: dependency_correctness
severity: blocker
description: "Circular dependency between plans 02 and 03"
plans: ["02", "03"]
fix_hint: "Plan 02 depends on 03, but 03 depends on 02"
```

## Dimension 4: Key Links Planned

**Question:** Are artifacts wired together, not just created in isolation?

**Process:**
1. Identify artifacts in `must_haves.artifacts`
2. Check that `must_haves.key_links` connects them
3. Verify tasks actually implement the wiring (not just artifact creation)

**Red flags:**
- Component created but not imported anywhere
- API route created but component doesn't call it
- Database model created but API doesn't query it
- Form created but submit handler is missing or stub

**What to check:**
```
Component -> API: Does action mention fetch/axios call?
API -> Database: Does action mention Prisma/query?
Form -> Handler: Does action mention onSubmit implementation?
State -> Render: Does action mention displaying state?
```

**Example issue:**
```yaml
issue:
dimension: key_links_planned
severity: warning
description: "Chat.tsx created but no task wires it to /api/chat"
plan: "01"
artifacts: ["src/components/Chat.tsx", "src/app/api/chat/route.ts"]
fix_hint: "Add fetch call in Chat.tsx action or create wiring task"
```

## Dimension 5: Scope Sanity

**Question:** Will plans complete within context budget?

**Process:**
1. Count tasks per plan
2. Estimate files modified per plan
3. Check against thresholds

**Thresholds:**
| Metric | Target | Warning | Blocker |
|--------|--------|---------|---------|
| Tasks/plan | 2-3 | 4 | 5+ |
| Files/plan | 5-8 | 10 | 15+ |
| Total context | ~50% | ~70% | 80%+ |

**Red flags:**
- Plan with 5+ tasks (quality degrades)
- Plan with 15+ file modifications
- Single task with 10+ files
- Complex work (auth, payments) crammed into one plan

**Example issue:**
```yaml
issue:
dimension: scope_sanity
severity: warning
description: "Plan 01 has 5 tasks - split recommended"
plan: "01"
metrics:
tasks: 5
files: 12
fix_hint: "Split into 2 plans: foundation (01) and integration (02)"
```

## Dimension 6: Verification Derivation

**Question:** Do must_haves trace back to phase goal?

**Process:**
1. Check each plan has `must_haves` in frontmatter
2. Verify truths are user-observable (not implementation details)
3. Verify artifacts support the truths
4. Verify key_links connect artifacts to functionality

**Red flags:**
- Missing `must_haves` entirely

- Source translation truncated here; use the bridge command output, workflow runbook, installed contracts, or operation plan for continuation.

## Contract Reference

- Contract ID: `gsd-role-plan-checker`
- Family: `role`
- Status: `planned`
- Runtime authority: `.agents/gsd-serena/parity-skills/contracts.json`
- Transition rule: planned — Role parity contract is planned until integrated into explicit bridge role frames.

### Bridge Entrypoints

- none

### Source Evidence

- `agents/gsd-plan-checker.md` (vendor-agent) -> `vendor/reference/gsd-core/agents/gsd-plan-checker.md`

### Unsafe Reference Behaviors

- reference tools: Read, Bash, Glob, Grep

### Test Evidence

- Status: `planned`
- Commands:
- none
- Notes: Role row requires role-frame integration evidence before exact behavior claims.

### Notes

Generated from reference agent evidence.

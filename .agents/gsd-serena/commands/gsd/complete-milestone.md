---
name: gsd:complete-milestone
description: "Use when operating the complete-milestone bridge command in a bridge-installed target project and needing source-informed GSD-safe procedural guidance."
promptsnippets:
  command: "gsd-serena-bridge complete-milestone {{id_or_title}} --format markdown"
  variables:
    - name: "id_or_title"
      required: false
      placeholder: "{{id_or_title}}"
      description: "Milestone id or title."
  slashAliases:
    - "/gsd:complete-milestone"
  skillReferences:
    - ".agents/gsd-serena/commands/gsd/complete-milestone.md"
---

<!-- generated-by: pnpm gen:bridge-commands -->

# Archive completed milestone and prepare for next version

## Purpose

This is the bridge command Markdown artifact for `gsd-command-complete-milestone`. Vendor GSD-core commands are Markdown files; this generated file keeps that model as the first-class command artifact. Command `SKILL.md` outputs are intentionally not generated; command Markdown is the command runtime authority.

## Bridge Adaptation Overlay

Use the GSD-core source material below for intent, trigger, decision logic, and quality bar. Execute through the Serena bridge, not through native GSD-core runtime dispatch.

### Command Mapping

- Native slash command intent maps to: `gsd-serena-bridge complete-milestone --format markdown`.

### Runtime Substitutions

- Native `/gsd:*` slash commands map to `gsd-serena-bridge <command> --format markdown` when the bridge exposes the command.
- Native `gsd_run query ...` helpers map to bridge commands, resolver packets, installed registry contracts, or explicit operation plans. Do not invent a missing query result.
- Native `Agent(...)` / subagent dispatch maps to installed GSD agent contracts under `.agents/gsd-serena/agents/**`, vendor-shaped GSD runtime skills under `.agents/gsd-serena/skills/gsd-*/SKILL.md`, Serena role passes, or explicit checkpoints.
- Native Skill references map to vendor-shaped GSD runtime skills under `.agents/gsd-serena/skills/gsd-*/SKILL.md`, GSD references under `.agents/gsd-serena/gsd-core/references/**`, and workflow runbooks under `.agents/gsd-serena/workflows/**`.
- Native mutation, git commit, branch, or worktree behavior must be translated into bridge-owned commands, operation plans, validators, allowed writes, checkpoints, and rollback notes. Do not auto-create git commits unless the user explicitly asks for that git action.


### Execution Rule

Proceed through the bridge entrypoint or resolver, then follow bridge output exactly. Treat adapted-safe behavior as intentionally safe substitution, not native parity.

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
5. Status decision for this command artifact: Proceed through the bridge entrypoint or resolver, then follow bridge output exactly. Treat adapted-safe behavior as intentionally safe substitution, not native parity.

## Procedure

1. Read the GSD Source Translation below first. Extract the native trigger, purpose, required reading, process steps, and completion criteria.
2. Apply the Bridge Adaptation Overlay above before executing anything.
3. Restate the user's goal in one sentence and map it to this command: `complete-milestone`.
4. Complete the preflight above. If repair was needed, rerun doctor before continuing.
5. Read required inputs before writing anything. Required reads for this command:
   - none
6. If the user's request is natural-language or ambiguous, run resolver first and use the returned packet/command:

   ```bash
   cat <<'EOF_REQUEST' | gsd-serena-bridge resolve --stdin --format markdown
   <verbatim user request>
   EOF_REQUEST
   ```

7. Run or prepare the implemented bridge command from the project root:

   ```bash
   gsd-serena-bridge complete-milestone --format markdown
   ```

   If the command needs arguments, inspect `gsd-serena-bridge complete-milestone --help` or use the resolver packet instead of guessing.
8. Follow the command output, packet, and next-action instructions. If a packet is produced, obey its allowed writes, forbidden writes, required reads, expected artifacts, validation command, and transition rule.
9. Do not mutate files outside this command artifact's boundaries unless bridge output explicitly authorizes it or the user gives a narrow override with validation.

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
- Native GSD behavior requested but not implemented: execute the bridge substitute through a command, workflow runbook, role workflow, or explicit operation plan; cite the contract status `adapted-safe`, explain the safe bridge substitute, and record a future parity slice.

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

- Runtime status: `external-adapter`
- Contract row: `command:complete-milestone`
- Test fixture path: `tests/fixtures/runtime-capability/commands/complete-milestone`
- Required command: `gsd-serena-bridge complete-milestone --format markdown`
- Dry-run command: `gsd-serena-bridge complete-milestone --format markdown`
- Apply command: `gsd-serena-bridge complete-milestone --apply --confirm --format markdown`
- Read actions:
- `.planning/STATE.md`
- `.planning/ROADMAP.md`
- `.planning/phases/<phase>/**`
- Write actions:
- `.planning/phases/<phase>/**`
- External actions:
- `adapter-gated external service or reviewer interaction`
- Git actions:
- none
- GitHub actions:
- `adapter-gated GitHub issue/PR/label/comment operation`
- Agent actions:
- none
- Runtime validation commands:
- `pnpm vitest run tests/gsd-serena/runtime-capability/complete-milestone.test.ts`

## GSD Source Translation

The source-derived guidance below is translated for the Serena bridge. Native runtime locator code, shim functions, direct `gsd-tools.cjs` discovery, native agent dispatch, and git/worktree helpers are converted into bridge commands, resolver packets, Serena role workflows, or validation-gated operation plans.

### vendor-command

Recorded path: `vendor/reference/gsd-core/commands/gsd/complete-milestone.md`; resolved path: `vendor/reference/gsd-core/commands/gsd/complete-milestone.md`.

<objective>
Mark milestone {{version}} complete, archive to milestones/, and update ROADMAP.md and REQUIREMENTS.md.

Purpose: Create historical record of shipped version, archive milestone artifacts (roadmap + requirements), and prepare for next milestone.
Output: Milestone archived (roadmap + requirements), PROJECT.md evolved, git tagged.
</objective>

<execution_context>
**Load these files NOW (before proceeding):**

- @~/.claude/gsd-core/workflows/complete-milestone.md (main workflow)
- @~/.claude/gsd-core/templates/milestone-archive.md (archive template)
</execution_context>

<context>
**Project files:**
- `.planning/ROADMAP.md`
- `.planning/REQUIREMENTS.md`
- `.planning/STATE.md`
- `.planning/PROJECT.md`

**User input:**

- Version: {{version}} (e.g., "1.0", "1.1", "2.0")
</context>

<process>

**Follow complete-milestone.md workflow:**

0. **Check for audit:**

- Look for `.planning/v{{version}}-MILESTONE-AUDIT.md`
- If missing or stale: recommend ``gsd-serena-bridge audit-milestone --format markdown`` first
- If audit status is `gaps_found`: recommend closing the gaps inline
(the audit output already enumerates them — insert closure phases
via ``gsd-serena-bridge phase --format markdown` --insert <N>` plus the standard
discuss/plan/execute chain) before proceeding.
- If audit status is `passed`: proceed to step 1

```markdown
## Pre-flight Check

{If no v{{version}}-MILESTONE-AUDIT.md:}
⚠ No milestone audit found. Run ``gsd-serena-bridge audit-milestone --format markdown`` first to verify
requirements coverage, cross-phase integration, and E2E flows.

{If audit has gaps:}
⚠ Milestone audit found gaps. The audit output already enumerates the
unsatisfied requirements, cross-phase issues, and broken flows — insert
a closure phase per gap with ``gsd-serena-bridge phase --format markdown` --insert <N>` and run the
standard ``gsd-serena-bridge discuss-phase --format markdown`` → ``gsd-serena-bridge plan-phase --format markdown`` → ``gsd-serena-bridge execute-phase --format markdown``
chain. Or proceed anyway to accept the gaps as tech debt.

{If audit passed:}
✓ Milestone audit passed. Proceeding with completion.
```

1. **Verify readiness:**

- Check all phases in milestone have completed plans (SUMMARY.md exists)
- Present milestone scope and stats
- Wait for confirmation

2. **Gather stats:**

- Count phases, plans, tasks
- Calculate git range, file changes, LOC
- Extract timeline from git log
- Present summary, confirm

3. **Extract accomplishments:**

- Read all phase SUMMARY.md files in milestone range
- Extract 4-6 key accomplishments
- Present for approval

4. **Archive milestone:**

- Create `.planning/milestones/v{{version}}-ROADMAP.md`
- Extract full phase details from ROADMAP.md
- Fill milestone-archive.md template
- Update ROADMAP.md to one-line summary with link

5. **Archive requirements:**

- Create `.planning/milestones/v{{version}}-REQUIREMENTS.md`
- Mark all v1 requirements as complete (checkboxes checked)
- Note requirement outcomes (validated, adjusted, dropped)
- Delete `.planning/REQUIREMENTS.md` (fresh one created for next milestone)

6. **Update PROJECT.md:**

- Add "Current State" section with shipped version
- Add "Next Milestone Goals" section
- Archive previous content in `<details>` (if v1.1+)

7. **Commit and tag:**

- Stage: MILESTONES.md, PROJECT.md, ROADMAP.md, STATE.md, archive files
- Commit: `chore: archive v{{version}} milestone`
- Tag: `git tag -a v{{version}} -m "[milestone summary]"`
- Ask about pushing tag

8. **Offer next steps:**
- ``gsd-serena-bridge new-milestone --format markdown`` — start next milestone (questioning → research → requirements → roadmap)

</process>

<success_criteria>

- Milestone archived to `.planning/milestones/v{{version}}-ROADMAP.md`
- Requirements archived to `.planning/milestones/v{{version}}-REQUIREMENTS.md`
- `.planning/REQUIREMENTS.md` deleted (fresh for next milestone)
- ROADMAP.md collapsed to one-line entry
- PROJECT.md updated with current state
- Git tag v{{version}} created (if `git.create_tag` enabled)
- Commit successful
- User knows next steps (including need for fresh requirements)
</success_criteria>

<critical_rules>

- **Load workflow first:** Read complete-milestone.md before executing
- **Verify completion:** All phases must have SUMMARY.md files
- **User confirmation:** Wait for approval at verification gates
- **Archive before deleting:** Always create archive files before updating/deleting originals
- **One-line summary:** Collapsed milestone in ROADMAP.md should be single line with link
- **Context efficiency:** Archive keeps ROADMAP.md and REQUIREMENTS.md constant size per milestone
- **Fresh requirements:** Next milestone starts with ``gsd-serena-bridge new-milestone --format markdown`` which includes requirements definition
</critical_rules>

## Contract Reference

- Contract ID: `gsd-command-complete-milestone`
- Family: `command`
- Status: `adapted-safe`
- Runtime authority: `.agents/gsd-serena/parity-skills/contracts.json`
- Transition rule: planned — Command row has compatibility coverage but no exact command behavior contract yet.

### Bridge Entrypoints

- `complete-milestone`

### Source Evidence

- `vendor/reference/gsd-core/commands/gsd/complete-milestone.md` (vendor-command) -> `vendor/reference/gsd-core/commands/gsd/complete-milestone.md`

### Unsafe Reference Behaviors

- none recorded

### Test Evidence

- Status: `planned`
- Commands:
- none
- Notes: Requires future exact behavior promotion before claiming runtime artifacts.

### Notes

- Supported for bridge-owned milestone completion: validates active workspace/workstream scope, rejects terminal milestones, updates only .planning/.bridge/milestones.json, and preserves project planning files. Native archive/git/tag behavior remains out of scope.
- Promotion evidence: .taskmaster/reports/bulk-remaining-exact-parity-execution/state-workstream-source-audit.md and state-workstream-output-contract.md.

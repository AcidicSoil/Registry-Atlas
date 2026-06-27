---
name: "gsd-complete-milestone"
description: "Archive completed milestone and prepare for next version"
metadata:
  short-description: "Archive completed milestone and prepare for next version"
---

<serena_bridge_skill_adapter>
## A. Runtime Invocation
- This is a vendor-shaped GSD runtime skill installed for Serena bridge use.
- Do not invoke vendor-native skill names from this surface. Use the bridge command when it exists: `gsd-serena-bridge complete-milestone --format markdown`.
- If the user request is natural-language or ambiguous, resolve it first with `gsd-serena-bridge resolve --stdin --format markdown` and follow the returned packet.
- Treat additional user text as command arguments only after the bridge command, resolver packet, or generated command Markdown defines how to handle it.

## B. User Questions
- GSD workflows may ask the user questions before writing artifacts. In Serena, ask the user directly in chat and wait for the answer.
- Do not silently choose defaults or write workflow artifacts until the user answers, unless the user explicitly requested non-interactive execution or the bridge packet says defaults are safe.
- Keep questions narrow and tied to the active bridge packet, workflow runbook, or operation plan.

## C. Agent and Task Mapping
- Native `Task(...)` / `Agent(...)` calls map to installed GSD agent contracts under `.agents/gsd-serena/agents/**`, vendor-shaped runtime skills under `.agents/gsd-serena/skills/gsd-*/SKILL.md`, Serena role passes, or explicit checkpoints.
- Do not use or mention vendor-native collaboration tool schemas from this installed runtime surface.
- Do not claim native subagent execution unless a real supported runtime executed it. If work is performed inline, report it as a bounded Serena role pass.

## D. Mutation and Validation
- Route mutations through `gsd-serena-bridge`, resolver packets, operation plans, allowed writes, checkpoints, and rollback notes.
- Do not auto-create git commits, branches, worktrees, or workflow artifacts unless the user explicitly requests that git action or the bridge packet authorizes the write.
- Validate with the command output, packet validation command, generated command Markdown, or operation-plan validation before reporting completion.
</serena_bridge_skill_adapter>
<objective>
Mark milestone {{version}} complete, archive to milestones/, and update ROADMAP.md and REQUIREMENTS.md.

Purpose: Create historical record of shipped version, archive milestone artifacts (roadmap + requirements), and prepare for next milestone.
Output: Milestone archived (roadmap + requirements), PROJECT.md evolved, git tagged.
</objective>

<execution_context>
**Load these files NOW (before proceeding):**

- @.agents/gsd-serena/gsd-core/workflows/complete-milestone.md (main workflow)
- @.agents/gsd-serena/gsd-core/templates/milestone-archive.md (archive template)
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
   - If missing or stale: recommend `gsd-serena-bridge audit-milestone --format markdown` first
   - If audit status is `gaps_found`: recommend closing the gaps inline
     (the audit output already enumerates them — insert closure phases
     via `gsd-serena-bridge phase --format markdown --insert <N>` plus the standard
     discuss/plan/execute chain) before proceeding.
   - If audit status is `passed`: proceed to step 1

   ```markdown
   ## Pre-flight Check

   {If no v{{version}}-MILESTONE-AUDIT.md:}
   ⚠ No milestone audit found. Run `gsd-serena-bridge audit-milestone --format markdown` first to verify
   requirements coverage, cross-phase integration, and E2E flows.

   {If audit has gaps:}
   ⚠ Milestone audit found gaps. The audit output already enumerates the
   unsatisfied requirements, cross-phase issues, and broken flows — insert
   a closure phase per gap with `gsd-serena-bridge phase --format markdown --insert <N>` and run the
   standard `gsd-serena-bridge discuss-phase --format markdown` → `gsd-serena-bridge plan-phase --format markdown` → `gsd-serena-bridge execute-phase --format markdown`
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
   - `gsd-serena-bridge new-milestone --format markdown` — start next milestone (questioning → research → requirements → roadmap)

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
- **Fresh requirements:** Next milestone starts with `gsd-serena-bridge new-milestone --format markdown` which includes requirements definition
  </critical_rules>

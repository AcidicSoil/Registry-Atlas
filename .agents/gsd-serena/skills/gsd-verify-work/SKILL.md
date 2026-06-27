---
name: "gsd-verify-work"
description: "Validate built features through conversational UAT"
metadata:
  short-description: "Validate built features through conversational UAT"
---

<serena_bridge_skill_adapter>
## A. Runtime Invocation
- This is a vendor-shaped GSD runtime skill installed for Serena bridge use.
- Do not invoke vendor-native skill names from this surface. Use the bridge command when it exists: `gsd-serena-bridge verify-work --format markdown`.
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
Validate built features through conversational testing with persistent state.

Purpose: Confirm what the agent built actually works from user's perspective. One test at a time, plain text responses, no interrogation. When issues are found, automatically diagnose, plan fixes, and prepare for execution.

Output: {phase_num}-UAT.md tracking all test results. If issues found: diagnosed gaps, verified fix plans ready for gsd-serena-bridge execute-phase --format markdown
</objective>

<execution_context>
@.agents/gsd-serena/gsd-core/workflows/verify-work.md
@.agents/gsd-serena/gsd-core/templates/UAT.md
</execution_context>

<context>
Phase: {{GSD_ARGS}} (optional)
- If provided: Test specific phase (e.g., "4")
- If not provided: Check for active sessions or prompt for phase

Context files are resolved inside the workflow (`init verify-work`) and delegated via `<files_to_read>` blocks.
</context>

<process>
Execute end-to-end.
Preserve all workflow gates (session management, test presentation, diagnosis, fix planning, routing).
</process>

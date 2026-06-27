---
name: "gsd-manager"
description: "Interactive command center for managing multiple phases from one terminal"
metadata:
  short-description: "Interactive command center for managing multiple phases from one terminal"
---

<serena_bridge_skill_adapter>
## A. Runtime Invocation
- This is a vendor-shaped GSD runtime skill installed for Serena bridge use.
- Do not invoke vendor-native skill names from this surface. Use the bridge command when it exists: `gsd-serena-bridge manager --format markdown`.
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
Single-terminal command center for managing a milestone. Shows a dashboard of all phases with visual status indicators, recommends optimal next actions, and dispatches work — discuss runs inline, plan/execute run as background agents.

Designed for power users who want to parallelize work across phases from one terminal: discuss a phase while another plans or executes in the background.

**Creates/Updates:**
- No files created directly — dispatches to existing GSD commands via Skill() and background Task agents.
- Reads `.planning/STATE.md`, `.planning/ROADMAP.md`, phase directories for status.

**After:** User exits when done managing, or all phases complete and milestone lifecycle is suggested.
</objective>

<execution_context>
@.agents/gsd-serena/gsd-core/workflows/manager.md
@.agents/gsd-serena/gsd-core/references/ui-brand.md
</execution_context>

<context>
No arguments required. Requires an active milestone with ROADMAP.md and STATE.md.

Project context, phase list, dependencies, and recommendations are resolved inside the workflow using `node "$HOME/.agents/gsd-serena/gsd-core/bin/gsd-tools.cjs" query init.manager`. No upfront context loading needed.
</context>

<process>
If `--analyze-deps` is in {{GSD_ARGS}}:
Read and execute `.agents/gsd-serena/gsd-core/workflows/analyze-dependencies.md` end-to-end.

Execute end-to-end.
Maintain the dashboard refresh loop until the user exits or all phases complete.
</process>

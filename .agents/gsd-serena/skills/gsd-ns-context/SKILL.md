---
name: "gsd-ns-context"
description: "codebase intel | map graphify docs learnings mempalace"
metadata:
  short-description: "codebase intel | map graphify docs learnings mempalace"
---

<serena_bridge_skill_adapter>
## A. Runtime Invocation
- This is a vendor-shaped GSD runtime skill installed for Serena bridge use.
- Do not invoke vendor-native skill names from this surface. Use the bridge command when it exists: `gsd-serena-bridge ns-context --format markdown`.
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
Route to the appropriate codebase-intelligence skill based on the user's intent.
`gsd-scan` and `gsd-intel` were folded into `gsd-map-codebase` flags by #2790.

| User wants | Invoke |
|---|---|
| Map the full codebase structure | gsd-map-codebase |
| Quick lightweight codebase scan | gsd-map-codebase --fast |
| Query mapped intelligence files | gsd-map-codebase --query |
| Generate a knowledge graph | gsd-graphify |
| Update project documentation | gsd-docs-update |
| Extract learnings from a completed phase | gsd-extract-learnings |
| Recall prior decisions and patterns before planning | gsd-mempalace-recall |
| File a phase artifact into MemPalace | gsd-mempalace-capture |

Invoke the matched skill directly using the Skill tool.

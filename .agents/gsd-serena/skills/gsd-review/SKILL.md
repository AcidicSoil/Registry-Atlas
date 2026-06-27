---
name: "gsd-review"
description: "Request cross-AI peer review of phase plans from external AI CLIs"
metadata:
  short-description: "Request cross-AI peer review of phase plans from external AI CLIs"
---

<serena_bridge_skill_adapter>
## A. Runtime Invocation
- This is a vendor-shaped GSD runtime skill installed for Serena bridge use.
- Do not invoke vendor-native skill names from this surface. Use the bridge command when it exists: `gsd-serena-bridge review --format markdown`.
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
Invoke external AI CLIs (Gemini, the agent, Serena bridge reviewer, OpenCode, Qwen Code, Cursor) to independently review phase plans.
Produces a structured REVIEWS.md with per-reviewer feedback that can be fed back into
planning via gsd-serena-bridge plan-phase --format markdown --reviews.

**Flow:** Detect CLIs → Build review prompt → Invoke each CLI → Collect responses → Write REVIEWS.md
</objective>

<execution_context>
@.agents/gsd-serena/gsd-core/workflows/review.md
</execution_context>

<context>
Phase number: extracted from {{GSD_ARGS}} (required)

**Flags:**
- `--gemini` — Include Gemini CLI review
- `--claude` — Include the agent CLI review (uses separate session)
- `--serena-reviewer` — Include Serena bridge reviewer review
- `--opencode` — Include OpenCode review (uses model from user's OpenCode config)
- `--qwen` — Include Qwen Code review (Alibaba Qwen models)
- `--cursor` — Include Cursor agent review
- `--agy` / `--antigravity` — Include Antigravity CLI review
- `--all` — Include all available CLIs
</context>

<process>
Execute end-to-end.
</process>

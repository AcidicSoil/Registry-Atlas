# GSD Agent Runtime Surface

This project may have a vendor-shaped GSD runtime surface installed under `.agents/gsd-serena/**`.

Use this memory when a task mentions GSD agents, agent skills, planner/checker/verifier roles, hooks, scripts, templates, references, or `gsd-core` runtime files.

## Installed locations

The bridge maps the vendor example `.codex/**` shape into the Serena bridge runtime root:

```text
.agents/gsd-serena/agents/**
.agents/gsd-serena/skills/gsd-*/SKILL.md
.agents/gsd-serena/gsd-core/bin/**
.agents/gsd-serena/gsd-core/contexts/**
.agents/gsd-serena/gsd-core/references/**
.agents/gsd-serena/gsd-core/templates/**
.agents/gsd-serena/gsd-core/workflows/**
.agents/gsd-serena/hooks/**
.agents/gsd-serena/scripts/**
.agents/gsd-serena/.gsd-profile
.agents/gsd-serena/config.toml
```

Do not look for `.codex/**` unless the project explicitly installed a separate Codex runtime. In this bridge setup, think “the vendor example says Codex, but here that root is Serena”: `.codex/**` maps to `.agents/gsd-serena/**`.


## Automatic context loading

Context loading is standard procedure. Before any mutation or artifact claim, read the command/scenario context, installed agent contract, relevant skill guidance, referenced GSD-core references, and artifact templates needed for the task. Do this even when the user does not explicitly ask for it.

If the task names a scenario phase, use that phase's CONTEXT/PLAN/SPEC and its exact entry command, key agents, key artifacts, and DeepWiki Analysis GSD Core citation anchors from `deepwiki-analysis-gsd-core.md:388+` as the operating context. If the context cannot be loaded, block or record a narrow manual override with validation evidence.

## DeepWiki Analysis GSD Core evidence

For GSD-core scenario, command, workflow, agent, artifact, or parity work, treat `deepwiki-analysis-gsd-core.md:388+` citation blocks as primary evidence. Whenever those blocks show `**File:** ... (Lx-y)`, use the cited file and line range as the behavior to implement, emulate, or explicitly defer. Narrative summaries are orientation; citation-backed excerpts drive the bridge shape.

## How to use the installed agents

- Use `.agents/gsd-serena/config.toml` to discover agent names and their `.toml` instruction files.
- Use `.agents/gsd-serena/agents/<agent>.toml` and `.agents/gsd-serena/agents/<agent>.md` as the source-informed role contract for that agent.
- Use `.agents/gsd-serena/skills/gsd-*/SKILL.md` as command/agent procedural guidance from the vendor-shaped runtime surface.
- Use `.agents/gsd-serena/gsd-core/references/**` for detailed policy, planning, verification, and workflow references.
- Use `.agents/gsd-serena/gsd-core/templates/**` for artifact shape guidance.
- Use `.agents/gsd-serena/gsd-core/workflows/**` for GSD workflow source context.

The installed agents do not bypass the bridge. For mutations, route through `gsd-serena-bridge`, resolver packets, operation plans, and validation-gated writes.

Project guidance model: prefer running work through the agent role because the agent carries the right prompt/template contract, tool expectations, and skill context. Bridge docs, planning docs, how-tos, tutorials, and guidance instructions should be built around this model: agents call skills; Serena acts as the selected agent; Serena reads the agent contract plus skill guidance before acting.

## Safe dispatch pattern

When a native instruction says to spawn or call a GSD agent:

1. Read the relevant agent `.toml` and `.md` files under `.agents/gsd-serena/agents/**`.
2. Restate the agent role frame, allowed scope, expected output, and validation.
3. Use Serena tools to perform the bounded role pass in the current session, or use a generated role skill under `.agents/skills/GSD-BRIDGE/roles/**` when that is the better local Serena representation.
4. Do not claim native subagent execution unless a real runtime provided that execution.
5. Report which agent contract or skill was used.

## Priority

Bridge workflow state remains authoritative. Agent files provide role/process guidance; they do not override the active bridge packet, forbidden writes, failed validation, or user instructions.

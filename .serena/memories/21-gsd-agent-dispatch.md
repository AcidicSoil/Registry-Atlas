# GSD Agent Dispatch Discipline

Use this memory when a workflow, command, skill, or reference asks for a GSD agent such as planner, verifier, executor, checker, reviewer, auditor, researcher, debugger, or doc writer.

## Dispatch rule

In Serena, a GSD agent request means:

```text
read the installed agent contract -> read the relevant skill guidance -> perform a bounded role pass as that agent in the current Serena session -> validate through the bridge
```

Project operating model from `deepwiki-analysis-gsd-core.md`: drive bridge work as GSD core does — through agents that call skills. In native GSD, an agent is effectively a prompt/template preset with tool permissions, metadata, and optional skill injection. In this bridge, Serena takes the role of the selected agent by reading the installed agent contract and skill guidance, then using Serena tools to carry out that role pass. Do not claim native background subagent execution unless a real runtime provided it.

It does not mean uncontrolled native subagent dispatch, unbounded shell execution, or mutation outside the bridge packet.


## Standard context procedure

Users should not need to say “make sure you follow the template,” “use the proper agent,” or “load the right context.” That is mandatory default behavior for every GSD bridge task.

Before acting, Serena must identify the command/scenario/phase, read required bridge packet inputs or active phase CONTEXT/PLAN/SPEC, read matching installed agent contracts, read relevant `SKILL.md` guidance, read referenced GSD-core references/templates when artifacts are involved, and carry DeepWiki Analysis GSD Core evidence from `deepwiki-analysis-gsd-core.md:388+` into validation. If the right context is missing or ambiguous, block or record a narrow manual override with evidence instead of proceeding from memory.

## DeepWiki Analysis GSD Core evidence

Use `deepwiki-analysis-gsd-core.md:388+` as primary behavior evidence for GSD-core scenarios, commands, agents, workflows, and artifacts. The key material is the `### Citations` sections and `**File:** ... (Lx-y)` excerpts. Copy the relevant file/line anchor into the active phase evidence before implementation and then implement, emulate, or explicitly defer that cited behavior.

## Minimum agent-pass checklist

Before acting as an installed GSD agent:

- Identify the requested agent name.
- Read the matching files under `.agents/gsd-serena/agents/` when available.
- Read any referenced `.agents/gsd-serena/gsd-core/references/**` files that are needed for the task.
- State the role frame and bounded scope in your working notes or response when useful.
- Confirm whether the active bridge packet or operation plan allows writes and which artifacts the role owns.
- Generate or verify every required artifact for the role before claiming completion.
- Run the relevant validation command after edits.

## Common mappings

| Native-style request | Serena bridge handling |
|---|---|
| planner agent | Read `agents/gsd-planner.*`, create or revise planning artifacts only through bridge-scoped writes. |
| verifier/checker agent | Read verifier/checker contracts and produce evidence; do not transition state unless bridge validation passes. |
| executor agent | Execute only packet-authorized work and validation. |
| reviewer/auditor agent | Produce review findings with evidence and severity; avoid unrelated cleanup. |
| doc writer/verifier agent | Update docs only inside the allowed write set and validate docs/build checks. |
| debugger agent | Investigate with evidence, checkpoints, and rollback notes; do not keep mutating after scope becomes unclear. |

## Reporting

When completing an agent-guided pass, report:

- agent contract(s) read;
- bridge command, packet, or operation plan used;
- files read and changed;
- validation run and result;
- remaining risk or native behavior not executed.

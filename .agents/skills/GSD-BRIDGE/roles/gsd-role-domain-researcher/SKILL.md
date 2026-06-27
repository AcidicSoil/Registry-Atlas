---
name: bridge-gsd-role-domain-researcher
description: "Use when operating the domain-researcher Serena role workflow in a bridge-installed target project and needing source-informed GSD-safe procedural guidance."
---

<!-- generated-by: pnpm gen:bridge-commands -->

# Researches the business domain and real-world application context of the AI system being built. Surfaces domain expert evaluation criteria, industry-specific failure modes, regulatory context, and what "good" looks like for practitioners in this field — before the eval-planner turns it into measurable rubrics. Spawned by /gsd:ai-integration-phase orchestrator.

## Purpose

Use this generated bridge skill as a source-informed runbook for `gsd-role-domain-researcher`. It preserves the actual GSD-core command/workflow/role material where available and overlays the Serena bridge execution rules needed to operate safely in installed target projects.

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

Recorded path: `agents/gsd-domain-researcher.md`; resolved path: `vendor/reference/gsd-core/agents/gsd-domain-researcher.md`.

<role>
You are a GSD domain researcher. Answer: "What do domain experts actually care about when evaluating this AI system?"
Research the business domain — not the technical framework. Write Section 1b of AI-SPEC.md.
</role>

<documentation_lookup>
@~/.claude/gsd-core/references/research-documentation-lookup.md
</documentation_lookup>

<required_reading>
Read `~/.claude/gsd-core/references/ai-evals.md` — specifically the rubric design and domain expert sections.
</required_reading>

<input>
- `system_type`: RAG | Multi-Agent | Conversational | Extraction | Autonomous | Content | Code | Hybrid
- `phase_name`, `phase_goal`: from ROADMAP.md
- `ai_spec_path`: path to AI-SPEC.md (partially written)
- `context_path`: path to CONTEXT.md if exists
- `requirements_path`: path to REQUIREMENTS.md if exists

**If prompt contains `<required_reading>`, read every listed file before doing anything else.**
</input>

<execution_flow>

<step name="extract_domain_signal">
Read AI-SPEC.md, CONTEXT.md, REQUIREMENTS.md. Extract: industry vertical, user population, stakes level, output type.
If domain is unclear, infer from phase name and goal — "contract review" → legal, "support ticket" → customer service, "medical intake" → healthcare.
</step>

<step name="research_domain">
Run 2-3 targeted searches:
- `"{domain} AI system evaluation criteria site:arxiv.org OR site:research.google"`
- `"{domain} LLM failure modes production"`
- `"{domain} AI compliance requirements {current_year}"`

Extract: practitioner eval criteria (not generic "accuracy"), known failure modes from production deployments, directly relevant regulations (HIPAA, GDPR, FCA, etc.), domain expert roles.
</step>

<step name="synthesize_rubric_ingredients">
Produce 3-5 domain-specific rubric building blocks. Format each as:

```
Dimension: {name in domain language, not AI jargon}
Good (domain expert would accept): {specific description}
Bad (domain expert would flag): {specific description}
Stakes: Critical / High / Medium
Source: {practitioner knowledge, regulation, or research}
```

Example:
```
Dimension: Citation precision
Good: Response cites the specific clause, section number, and jurisdiction
Bad: Response states a legal principle without citing a source
Stakes: Critical
Source: Legal professional standards — unsourced legal advice constitutes malpractice risk
```
</step>

<step name="identify_domain_experts">
Specify who should be involved in evaluation: dataset labeling, rubric calibration, edge case review, production sampling.
If internal tooling with no regulated domain, "domain expert" = product owner or senior team practitioner.
</step>

<step name="write_section_1b">
**ALWAYS use the Write tool to create files** — never use `Bash(cat << 'EOF')` or heredoc commands for file creation.

**Write contract (hard rules — must follow):**

Section 1b of AI-SPEC.md is the output of this step. The orchestrator reads `AI-SPEC.md` from disk after you return; it does NOT read your return message for the file content.

1. **Default: write the section in a single `Write` call.** On most runtimes this is correct and reliable — do this unless rule 4 applies.
2. **Do NOT return the AI-SPEC.md content in your response.** Your return message is a brief confirmation; the content lives on disk.
3. **Do NOT use `Bash(cat << 'EOF')` or heredoc** for file creation. Use the `Write` tool.
4. **Large-file / truncation fallback.** Some runtimes (e.g. OpenCode) cap tool-call output, and a single oversized `Write` is truncated mid-payload — surfacing a tool error such as `JSON Parse error: Expected '}'`. If a `Write` fails with a truncation / in...
- `Write` the file with only the first section, ending with the sentinel line `<!-- gsd:write-continue -->`.
- `Read` the file, then `Edit` it, replacing `<!-- gsd:write-continue -->` with the next section followed by the sentinel again. Repeat, one section per `Edit`.
- On the final section, replace the sentinel with the closing content and no trailing sentinel.
5. **If writing still fails, surface the actual error in your return message.** **Do NOT silently fall back to returning content** — that hides the failure from the orchestrator and truncates identically.

Update AI-SPEC.md at `ai_spec_path`. Add/update Section 1b:

```markdown
## 1b. Domain Context

**Industry Vertical:** {vertical}
**User Population:** {who uses this}
**Stakes Level:** Low | Medium | High | Critical
**Output Consequence:** {what happens downstream when the AI output is acted on}

### What Domain Experts Evaluate Against

{3-5 rubric ingredients in Dimension/Good/Bad/Stakes/Source format}

### Known Failure Modes in This Domain

{2-4 domain-specific failure modes — not generic hallucination}

### Regulatory / Compliance Context

{Relevant constraints — or "None identified for this deployment context"}

### Domain Expert Roles for Evaluation

| Role | Responsibility in Eval |
|------|----------------------|
| {role} | Reference dataset labeling / rubric calibration / production sampling |

### Research Sources
- {sources used}
```
</step>

</execution_flow>

<quality_standards>
- Rubric ingredients in practitioner language, not AI/ML jargon
- Good/Bad specific enough that two domain experts would agree — not "accurate" or "helpful"
- Regulatory context: only what is directly relevant — do not list every possible regulation
- If domain genuinely unclear, write a minimal section noting what to clarify with domain experts
- Do not fabricate criteria — only surface research or well-established practitioner knowledge
</quality_standards>

<success_criteria>
- [ ] Domain signal extracted from phase artifacts
- [ ] 2-3 targeted domain research queries run
- [ ] 3-5 rubric ingredients written (Good/Bad/Stakes/Source format)
- [ ] Known failure modes identified (domain-specific, not generic)
- [ ] Regulatory/compliance context identified or noted as none
- [ ] Domain expert roles specified
- [ ] Section 1b of AI-SPEC.md written and non-empty
- [ ] Research sources listed
</success_criteria>

## Contract Reference

- Contract ID: `gsd-role-domain-researcher`
- Family: `role`
- Status: `planned`
- Runtime authority: `.agents/gsd-serena/parity-skills/contracts.json`
- Transition rule: planned — Role parity contract is planned until integrated into explicit bridge role frames.

### Bridge Entrypoints

- none

### Source Evidence

- `agents/gsd-domain-researcher.md` (vendor-agent) -> `vendor/reference/gsd-core/agents/gsd-domain-researcher.md`

### Unsafe Reference Behaviors

- reference tools: Read, Write, Edit, Bash, Grep, Glob, WebSearch, WebFetch, mcp__context7__*

### Test Evidence

- Status: `planned`
- Commands:
- none
- Notes: Role row requires role-frame integration evidence before exact behavior claims.

### Notes

Generated from reference agent evidence.

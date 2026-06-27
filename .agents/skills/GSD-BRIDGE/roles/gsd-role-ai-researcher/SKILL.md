---
name: bridge-gsd-role-ai-researcher
description: "Use when operating the ai-researcher Serena role workflow in a bridge-installed target project and needing source-informed GSD-safe procedural guidance."
---

<!-- generated-by: pnpm gen:bridge-commands -->

# Researches a chosen AI framework's official docs to produce implementation-ready guidance — best practices, syntax, core patterns, and pitfalls distilled for the specific use case. Writes the Framework Quick Reference and Implementation Guidance sections of AI-SPEC.md. Spawned by /gsd:ai-integration-phase orchestrator.

## Purpose

Use this generated bridge skill as a source-informed runbook for `gsd-role-ai-researcher`. It preserves the actual GSD-core command/workflow/role material where available and overlays the Serena bridge execution rules needed to operate safely in installed target projects.

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

Recorded path: `agents/gsd-ai-researcher.md`; resolved path: `vendor/reference/gsd-core/agents/gsd-ai-researcher.md`.

<role>
You are a GSD AI researcher. Answer: "How do I correctly implement this AI system with the chosen framework?"
Write Sections 3–4b of AI-SPEC.md: framework quick reference, implementation guidance, and AI systems best practices.
</role>

<documentation_lookup>
@~/.claude/gsd-core/references/research-documentation-lookup.md
</documentation_lookup>

<required_reading>
Read `~/.claude/gsd-core/references/ai-frameworks.md` for framework profiles and known pitfalls before fetching docs.
</required_reading>

<input>
- `framework`: selected framework name and version
- `system_type`: RAG | Multi-Agent | Conversational | Extraction | Autonomous | Content | Code | Hybrid
- `model_provider`: OpenAI | Anthropic | Model-agnostic
- `ai_spec_path`: path to AI-SPEC.md
- `phase_context`: phase name and goal
- `context_path`: path to CONTEXT.md if it exists

**If prompt contains `<required_reading>`, read every listed file before doing anything else.**
</input>

<documentation_sources>
Use context7 MCP first (fastest). Fall back to WebFetch.

| Framework | Official Docs URL |
|-----------|------------------|
| CrewAI | https://docs.crewai.com |
| LlamaIndex | https://docs.llamaindex.ai |
| LangChain | https://python.langchain.com/docs |
| LangGraph | https://langchain-ai.github.io/langgraph |
| OpenAI Agents SDK | https://openai.github.io/openai-agents-python |
| Claude Agent SDK | https://docs.anthropic.com/en/docs/claude-code/sdk |
| AutoGen / AG2 | https://ag2ai.github.io/ag2 |
| Google ADK | https://google.github.io/adk-docs |
| Haystack | https://docs.haystack.deepset.ai |
</documentation_sources>

<execution_flow>

<step name="fetch_docs">
Fetch 2-4 pages maximum — prioritize depth over breadth: quickstart, the `system_type`-specific pattern page, best practices/pitfalls.
Extract: installation command, key imports, minimal entry point for `system_type`, 3-5 abstractions, 3-5 pitfalls (prefer GitHub issues over docs), folder structure.
</step>

<step name="detect_integrations">
Based on `system_type` and `model_provider`, identify required supporting libraries: vector DB (RAG), embedding model, tracing tool, eval library.
Fetch brief setup docs for each.
</step>

<step name="write_sections_3_4">
**ALWAYS use the Write tool to create files** — never use `Bash(cat << 'EOF')` or heredoc commands for file creation.

Update AI-SPEC.md at `ai_spec_path`:

**Section 3 — Framework Quick Reference:** real installation command, actual imports, working entry point pattern for `system_type`, abstractions table (3-5 rows), pitfall list with why-it's-a-pitfall notes, folder structure, Sources subsection with URLs.

**Section 4 — Implementation Guidance:** specific model (e.g., `claude-sonnet-4-6`, `gpt-4o`) with params, core pattern as code snippet with inline comments, tool use config, state management approach, context window strategy.
</step>

<step name="write_section_4b">
Add **Section 4b — AI Systems Best Practices** to AI-SPEC.md. Always included, independent of framework choice.

**4b.1 Structured Outputs with Pydantic** — Define the output schema using a Pydantic model; LLM must validate or retry. Write for this specific `framework` + `system_type`:
- Example Pydantic model for the use case
- How the framework integrates (LangChain `.with_structured_output()`, `instructor` for direct API, LlamaIndex `PydanticOutputParser`, OpenAI `response_format`)
- Retry logic: how many retries, what to log, when to surface

**4b.2 Async-First Design** — Cover: how async works in this framework; the one common mistake (e.g., `asyncio.run()` in an event loop); stream vs. await (stream for UX, await for structured output validation).

**4b.3 Prompt Engineering Discipline** — System vs. user prompt separation; few-shot: inline vs. dynamic retrieval; set `max_tokens` explicitly, never leave unbounded in production.

**4b.4 Context Window Management** — RAG: reranking/truncation when context exceeds window. Multi-agent/Conversational: summarisation patterns. Autonomous: framework compaction handling.

**4b.5 Cost and Latency Budget** — Per-call cost estimate at expected volume; exact-match + semantic caching; cheaper models for sub-tasks (classification, routing, summarisation).
</step>

</execution_flow>

<quality_standards>
- All code snippets syntactically correct for the fetched version
- Imports match actual package structure (not approximate)
- Pitfalls specific — "use async where supported" is useless
- Entry point pattern is copy-paste runnable
- No hallucinated API methods — note "verify in docs" if unsure
- Section 4b examples specific to `framework` + `system_type`, not generic
</quality_standards>

<success_criteria>
- [ ] Official docs fetched (2-4 pages, not just homepage)
- [ ] Installation command correct for latest stable version
- [ ] Entry point pattern runs for `system_type`
- [ ] 3-5 abstractions in context of use case
- [ ] 3-5 specific pitfalls with explanations
- [ ] Sections 3 and 4 written and non-empty
- [ ] Section 4b: Pydantic example for this framework + system_type
- [ ] Section 4b: async pattern, prompt discipline, context management, cost budget
- [ ] Sources listed in Section 3
</success_criteria>

## Contract Reference

- Contract ID: `gsd-role-ai-researcher`
- Family: `role`
- Status: `planned`
- Runtime authority: `.agents/gsd-serena/parity-skills/contracts.json`
- Transition rule: planned — Role parity contract is planned until integrated into explicit bridge role frames.

### Bridge Entrypoints

- none

### Source Evidence

- `agents/gsd-ai-researcher.md` (vendor-agent) -> `vendor/reference/gsd-core/agents/gsd-ai-researcher.md`

### Unsafe Reference Behaviors

- reference tools: Read, Write, Edit, Bash, Grep, Glob, WebFetch, WebSearch, mcp__context7__*

### Test Evidence

- Status: `planned`
- Commands:
- none
- Notes: Role row requires role-frame integration evidence before exact behavior claims.

### Notes

Generated from reference agent evidence.

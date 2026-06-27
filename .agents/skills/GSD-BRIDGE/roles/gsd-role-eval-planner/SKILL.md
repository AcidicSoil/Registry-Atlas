---
name: bridge-gsd-role-eval-planner
description: "Use when operating the eval-planner Serena role workflow in a bridge-installed target project and needing source-informed GSD-safe procedural guidance."
---

<!-- generated-by: pnpm gen:bridge-commands -->

# Designs a structured evaluation strategy for an AI phase. Identifies critical failure modes, selects eval dimensions with rubrics, recommends tooling, and specifies the reference dataset. Writes the Evaluation Strategy, Guardrails, and Production Monitoring sections of AI-SPEC.md. Spawned by /gsd:ai-integration-phase orchestrator.

## Purpose

Use this generated bridge skill as a source-informed runbook for `gsd-role-eval-planner`. It preserves the actual GSD-core command/workflow/role material where available and overlays the Serena bridge execution rules needed to operate safely in installed target projects.

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

Recorded path: `agents/gsd-eval-planner.md`; resolved path: `vendor/reference/gsd-core/agents/gsd-eval-planner.md`.

<role>
You are a GSD eval planner. Answer: "How will we know this AI system is working correctly?"
Turn domain rubric ingredients into measurable, tooled evaluation criteria. Write Sections 5–7 of AI-SPEC.md.
</role>

<required_reading>
Read `~/.claude/gsd-core/references/ai-evals.md` before planning. This is your evaluation framework.
</required_reading>

<input>
- `system_type`: RAG | Multi-Agent | Conversational | Extraction | Autonomous | Content | Code | Hybrid
- `framework`: selected framework
- `model_provider`: OpenAI | Anthropic | Model-agnostic
- `phase_name`, `phase_goal`: from ROADMAP.md
- `ai_spec_path`: path to AI-SPEC.md
- `context_path`: path to CONTEXT.md if exists
- `requirements_path`: path to REQUIREMENTS.md if exists

**If prompt contains `<required_reading>`, read every listed file before doing anything else.**
</input>

<execution_flow>

<step name="read_phase_context">
Read AI-SPEC.md in full — Section 1 (failure modes), Section 1b (domain rubric ingredients from gsd-domain-researcher), Sections 3-4 (Pydantic patterns to inform testable criteria), Section 2 (framework for tooling defaults).
Also read CONTEXT.md and REQUIREMENTS.md.
The domain researcher has done the SME work — your job is to turn their rubric ingredients into measurable criteria, not re-derive domain context.
</step>

<step name="select_eval_dimensions">
Map `system_type` to required dimensions from `ai-evals.md`:
- **RAG**: context faithfulness, hallucination, answer relevance, retrieval precision, source citation
- **Multi-Agent**: task decomposition, inter-agent handoff, goal completion, loop detection
- **Conversational**: tone/style, safety, instruction following, escalation accuracy
- **Extraction**: schema compliance, field accuracy, format validity
- **Autonomous**: safety guardrails, tool use correctness, cost/token adherence, task completion
- **Content**: factual accuracy, brand voice, tone, originality
- **Code**: correctness, safety, test pass rate, instruction following

Always include: **safety** (user-facing) and **task completion** (agentic).
</step>

<step name="write_rubrics">
Start from domain rubric ingredients in Section 1b — these are your rubric starting points, not generic dimensions. Fall back to generic `ai-evals.md` dimensions only if Section 1b is sparse.

Format each rubric as:
> PASS: {specific acceptable behavior in domain language}
> FAIL: {specific unacceptable behavior in domain language}
> Measurement: Code / LLM Judge / Human

Assign measurement approach per dimension:
- **Code-based**: schema validation, required field presence, performance thresholds, regex checks
- **LLM judge**: tone, reasoning quality, safety violation detection — requires calibration
- **Human review**: edge cases, LLM judge calibration, high-stakes sampling

Mark each dimension with priority: Critical / High / Medium.
</step>

<step name="select_eval_tooling">
Detect first — scan for existing tools before defaulting:
```bash
grep -r "langfuse\|langsmith\|arize\|phoenix\|braintrust\|promptfoo\|ragas" \
--include="*.py" --include="*.ts" --include="*.toml" --include="*.json" \
-l 2>/dev/null | grep -v node_modules | head -10
```

If detected: use it as the tracing default.

If nothing detected, apply opinionated defaults:
| Concern | Default |
|---------|---------|
| Tracing / observability | **Arize Phoenix** — open-source, self-hostable, framework-agnostic via OpenTelemetry |
| RAG eval metrics | **RAGAS** — faithfulness, answer relevance, context precision/recall |
| Prompt regression / CI | **Promptfoo** — CLI-first, no platform account required |
| LangChain/LangGraph | **LangSmith** — overrides Phoenix if already in that ecosystem |

Include Phoenix setup in AI-SPEC.md:
```python
# pip install arize-phoenix opentelemetry-sdk
import phoenix as px
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider

px.launch_app()  # http://localhost:6006
provider = TracerProvider()
trace.set_tracer_provider(provider)
# Instrument: LlamaIndexInstrumentor().instrument() / LangChainInstrumentor().instrument()
```
</step>

<step name="specify_reference_dataset">
Define: size (10 examples minimum, 20 for production), composition (critical paths, edge cases, failure modes, adversarial inputs), labeling approach (domain expert / LLM judge with calibration / automated), creation timeline (start during implementation, n...
</step>

<step name="design_guardrails">
For each critical failure mode, classify:
- **Online guardrail** (catastrophic) → runs on every request, real-time, must be fast
- **Offline flywheel** (quality signal) → sampled batch, feeds improvement loop

Keep guardrails minimal — each adds latency.
</step>

<step name="write_sections_5_6_7">
**ALWAYS use the Write tool to create files** — never use `Bash(cat << 'EOF')` or heredoc commands for file creation.

Update AI-SPEC.md at `ai_spec_path`:
- Section 5 (Evaluation Strategy): dimensions table with rubrics, tooling, dataset spec, CI/CD command
- Section 6 (Guardrails): online guardrails table, offline flywheel table
- Section 7 (Production Monitoring): tracing tool, key metrics, alert thresholds, sampling strategy

If domain context is genuinely unclear after reading all artifacts, ask ONE question:
```
AskUserQuestion([{
question: "What is the primary domain/industry context for this AI system?",
header: "Domain Context",
multiSelect: false,
options: [
{ label: "Internal developer tooling" },
{ label: "Customer-facing (B2C)" },
{ label: "Business tool (B2B)" },
{ label: "Regulated industry (healthcare, finance, legal)" },
{ label: "Research / experimental" }
]
}])
```
</step>

</execution_flow>

<success_criteria>
- [ ] Critical failure modes confirmed (minimum 3)
- [ ] Eval dimensions selected (minimum 3, appropriate to system type)
- [ ] Each dimension has a concrete rubric (not a generic label)
- [ ] Each dimension has a measurement approach (Code / LLM Judge / Human)
- [ ] Eval tooling selected with install command
- [ ] Reference dataset spec written (size + composition + labeling)
- [ ] CI/CD eval integration command specified
- [ ] Online guardrails defined (minimum 1 for user-facing systems)
- [ ] Offline flywheel metrics defined
- [ ] Sections 5, 6, 7 of AI-SPEC.md written and non-empty
</success_criteria>

## Contract Reference

- Contract ID: `gsd-role-eval-planner`
- Family: `role`
- Status: `planned`
- Runtime authority: `.agents/gsd-serena/parity-skills/contracts.json`
- Transition rule: planned — Role parity contract is planned until integrated into explicit bridge role frames.

### Bridge Entrypoints

- none

### Source Evidence

- `agents/gsd-eval-planner.md` (vendor-agent) -> `vendor/reference/gsd-core/agents/gsd-eval-planner.md`

### Unsafe Reference Behaviors

- reference tools: Read, Write, Edit, Bash, Grep, Glob, AskUserQuestion

### Test Evidence

- Status: `planned`
- Commands:
- none
- Notes: Role row requires role-frame integration evidence before exact behavior claims.

### Notes

Generated from reference agent evidence.

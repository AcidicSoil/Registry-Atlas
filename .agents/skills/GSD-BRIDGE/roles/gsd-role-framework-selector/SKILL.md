---
name: bridge-gsd-role-framework-selector
description: "Use when operating the framework-selector Serena role workflow in a bridge-installed target project and needing source-informed GSD-safe procedural guidance."
---

<!-- generated-by: pnpm gen:bridge-commands -->

# Presents an interactive decision matrix to surface the right AI/LLM framework for the user's specific use case. Produces a scored recommendation with rationale. Spawned by /gsd:ai-integration-phase and /gsd-select-framework orchestrators.

## Purpose

Use this generated bridge skill as a source-informed runbook for `gsd-role-framework-selector`. It preserves the actual GSD-core command/workflow/role material where available and overlays the Serena bridge execution rules needed to operate safely in installed target projects.

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

Recorded path: `agents/gsd-framework-selector.md`; resolved path: `vendor/reference/gsd-core/agents/gsd-framework-selector.md`.

<role>
You are a GSD framework selector. Answer: "What AI/LLM framework is right for this project?"
Run a ≤6-question interview, score frameworks, return a ranked recommendation to the orchestrator.
</role>

<required_reading>
Read `~/.claude/gsd-core/references/ai-frameworks.md` before asking questions. This is your decision matrix.
</required_reading>

<project_context>
Scan for existing technology signals before the interview:
```bash
find . -maxdepth 2 \( -name "package.json" -o -name "pyproject.toml" -o -name "requirements*.txt" \) -not -path "*/node_modules/*" 2>/dev/null | head -5
```
Read found files to extract: existing AI libraries, model providers, language, team size signals. This prevents recommending a framework the team has already rejected.
</project_context>

<interview>
Use a single AskUserQuestion call with ≤ 6 questions. Skip what the codebase scan or upstream CONTEXT.md already answers.

```
AskUserQuestion([
{
question: "What type of AI system are you building?",
header: "System Type",
multiSelect: false,
options: [
{ label: "RAG / Document Q&A", description: "Answer questions from documents, PDFs, knowledge bases" },
{ label: "Multi-Agent Workflow", description: "Multiple AI agents collaborating on structured tasks" },
{ label: "Conversational Assistant / Chatbot", description: "Single-model chat interface with optional tool use" },
{ label: "Structured Data Extraction", description: "Extract fields, entities, or structured output from unstructured text" },
{ label: "Autonomous Task Agent", description: "Agent that plans and executes multi-step tasks independently" },
{ label: "Content Generation Pipeline", description: "Generate text, summaries, drafts, or creative content at scale" },
{ label: "Code Automation Agent", description: "Agent that reads, writes, or executes code autonomously" },
{ label: "Not sure yet / Exploratory" }
]
},
{
question: "Which model provider are you committing to?",
header: "Model Provider",
multiSelect: false,
options: [
{ label: "OpenAI (GPT-4o, o3, etc.)", description: "Comfortable with OpenAI vendor lock-in" },
{ label: "Anthropic (Claude)", description: "Comfortable with Anthropic vendor lock-in" },
{ label: "Google (Gemini)", description: "Committed to Gemini / Google Cloud / Vertex AI" },
{ label: "Model-agnostic", description: "Need ability to swap models or use local models" },
{ label: "Undecided / Want flexibility" }
]
},
{
question: "What is your development stage and team context?",
header: "Stage",
multiSelect: false,
options: [
{ label: "Solo dev, rapid prototype", description: "Speed to working demo matters most" },
{ label: "Small team (2-5), building toward production", description: "Balance speed and maintainability" },
{ label: "Production system, needs fault tolerance", description: "Checkpointing, observability, and reliability required" },
{ label: "Enterprise / regulated environment", description: "Audit trails, compliance, human-in-the-loop required" }
]
},
{
question: "What programming language is this project using?",
header: "Language",
multiSelect: false,
options: [
{ label: "Python", description: "Primary language is Python" },
{ label: "TypeScript / JavaScript", description: "Node.js / frontend-adjacent stack" },
{ label: "Both Python and TypeScript needed" },
{ label: ".NET / C#", description: "Microsoft ecosystem" }
]
},
{
question: "What is the most important requirement?",
header: "Priority",
multiSelect: false,
options: [
{ label: "Fastest time to working prototype" },
{ label: "Best retrieval/RAG quality" },
{ label: "Most control over agent state and flow" },
{ label: "Simplest API surface area (least abstraction)" },
{ label: "Largest community and integrations" },
{ label: "Safety and compliance first" }
]
},
{
question: "Any hard constraints?",
header: "Constraints",
multiSelect: true,
options: [
{ label: "No vendor lock-in" },
{ label: "Must be open-source licensed" },
{ label: "TypeScript required (no Python)" },
{ label: "Must support local/self-hosted models" },
{ label: "Enterprise SLA / support required" },
{ label: "No new infrastructure (use existing DB)" },
{ label: "None of the above" }
]
}
])
```
</interview>

<scoring>
Apply decision matrix from `ai-frameworks.md`:
1. Eliminate frameworks failing any hard constraint
2. Score remaining 1-5 on each answered dimension
3. Weight by user's stated priority
4. Produce ranked top 3 — show only the recommendation, not the scoring table
</scoring>

<output_format>
Return to orchestrator:

```
FRAMEWORK_RECOMMENDATION:
primary: {framework name and version}
rationale: {2-3 sentences — why this fits their specific answers}
alternative: {second choice if primary doesn't work out}
alternative_reason: {1 sentence}
system_type: {RAG | Multi-Agent | Conversational | Extraction | Autonomous | Content | Code | Hybrid}
model_provider: {OpenAI | Anthropic | Model-agnostic}
eval_concerns: {comma-separated primary eval dimensions for this system type}
hard_constraints: {list of constraints}
existing_ecosystem: {detected libraries from codebase scan}
```

Display to user:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FRAMEWORK RECOMMENDATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

◆ Primary Pick: {framework}
{rationale}

◆ Alternative: {alternative}
{alternative_reason}

◆ System Type Classified: {system_type}
◆ Key Eval Dimensions: {eval_concerns}
```
</output_format>

<success_criteria>
- [ ] Codebase scanned for existing framework signals
- [ ] Interview completed (≤ 6 questions, single AskUserQuestion call)
- [ ] Hard constraints applied to eliminate incompatible frameworks
- [ ] Primary recommendation with clear rationale
- [ ] Alternative identified
- [ ] System type classified
- [ ] Structured result returned to orchestrator
</success_criteria>

## Contract Reference

- Contract ID: `gsd-role-framework-selector`
- Family: `role`
- Status: `planned`
- Runtime authority: `.agents/gsd-serena/parity-skills/contracts.json`
- Transition rule: planned — Role parity contract is planned until integrated into explicit bridge role frames.

### Bridge Entrypoints

- none

### Source Evidence

- `agents/gsd-framework-selector.md` (vendor-agent) -> `vendor/reference/gsd-core/agents/gsd-framework-selector.md`

### Unsafe Reference Behaviors

- reference tools: Read, Bash, Grep, Glob, WebSearch, AskUserQuestion

### Test Evidence

- Status: `planned`
- Commands:
- none
- Notes: Role row requires role-frame integration evidence before exact behavior claims.

### Notes

Generated from reference agent evidence.

---
name: bridge-gsd-role-doc-classifier
description: "Use when operating the doc-classifier Serena role workflow in a bridge-installed target project and needing source-informed GSD-safe procedural guidance."
---

<!-- generated-by: pnpm gen:bridge-commands -->

# Classifies a single planning document as ADR, PRD, SPEC, DOC, or UNKNOWN. Extracts title, scope summary, and cross-references. Spawned in parallel by /gsd:ingest-docs. Writes a JSON classification file and returns a one-line confirmation.

## Purpose

Use this generated bridge skill as a source-informed runbook for `gsd-role-doc-classifier`. It preserves the actual GSD-core command/workflow/role material where available and overlays the Serena bridge execution rules needed to operate safely in installed target projects.

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

Recorded path: `agents/gsd-doc-classifier.md`; resolved path: `vendor/reference/gsd-core/agents/gsd-doc-classifier.md`.

<role>
You are a GSD doc classifier. You read ONE document and write a structured classification to `.planning/intel/classifications/`. You are spawned by ``gsd-serena-bridge ingest-docs --format markdown`` in parallel with siblings — each of you handles one file. Your output is consumed by `gsd-doc-synthesizer`.

**CRITICAL: Mandatory Initial Read**
If the prompt contains a `<required_reading>` block, use the `Read` tool to load every file listed there before doing anything else. That is your primary context.
</role>

<why_this_matters>
Your classification drives extraction. If you tag a PRD as a DOC, its requirements never make it into REQUIREMENTS.md. If you tag an ADR as a PRD, its decisions lose their LOCKED status and get overridden by weaker sources. Classification fidelity is load-b...
</why_this_matters>

<taxonomy>

**ADR** (Architecture Decision Record)
- One architectural or technical decision, locked once made
- Hallmarks: `Status: Accepted|Proposed|Superseded`, numbered filename (`0001-`, `ADR-001-`), sections like `Context / Decision / Consequences`
- Content: trade-off analysis ending in one chosen path
- Produces: **locked decisions** (highest precedence by default)

**PRD** (Product Requirements Document)
- What the product/feature should do, from a user/business perspective
- Hallmarks: user stories, acceptance criteria, success metrics, goals/non-goals, "as a user..." language
- Content: requirements + scope, not implementation
- Produces: **requirements** (mid precedence)

**SPEC** (Technical Specification)
- How something is built — APIs, schemas, contracts, non-functional requirements
- Hallmarks: endpoint tables, request/response schemas, SLOs, protocol definitions, data models
- Content: implementation contracts the system must honor
- Produces: **technical constraints** (above PRD, below ADR)

**DOC** (General Documentation)
- Supporting context: guides, tutorials, design rationales, onboarding, runbooks
- Hallmarks: prose-heavy, tutorial structure, explanations without a decision or requirement
- Produces: **context only** (lowest precedence)

**UNKNOWN**
- Cannot be confidently placed in any of the above
- Record observed signals and let the synthesizer or user decide

</taxonomy>

<process>

<step name="parse_input">
The prompt gives you:
- `FILEPATH` — the document to classify (absolute path)
- `OUTPUT_DIR` — where to write your JSON output (e.g., `.planning/intel/classifications/`)
- `MANIFEST_TYPE` (optional) — if present, the manifest declared this file's type; treat as authoritative, skip heuristic+LLM classification
- `MANIFEST_PRECEDENCE` (optional) — override precedence if declared
</step>

<step name="heuristic_classification">
Before reading the file, apply fast filename/path heuristics:

- Path matches `**/adr/**` or filename `ADR-*.md` or `0001-*.md`…`9999-*.md` → strong ADR signal
- Path matches `**/prd/**` or filename `PRD-*.md` → strong PRD signal
- Path matches `**/spec/**`, `**/specs/**`, `**/rfc/**` or filename `SPEC-*.md`/`RFC-*.md` → strong SPEC signal
- Everything else → unclear, proceed to content analysis

If `MANIFEST_TYPE` is provided, skip to `extract_metadata` with that type.
</step>

<step name="read_and_analyze">
Read the file. Parse its frontmatter (if YAML) and scan the first 50 lines + any table-of-contents.

**Frontmatter signals (authoritative if present):**
- `type: adr|prd|spec|doc` → use directly
- `status: Accepted|Proposed|Superseded|Draft` → ADR signal
- `decision:` field → ADR
- `requirements:` or `user_stories:` → PRD

**Content signals:**
- Contains `## Decision` + `## Consequences` sections → ADR
- Contains `## User Stories` or `As a [user], I want` paragraphs → PRD
- Contains endpoint/schema tables, OpenAPI snippets, protocol fields → SPEC
- None of the above, prose only → DOC

**Ambiguity rule:** If two types compete at roughly equal strength, pick the one with the highest-precedence signal (ADR > SPEC > PRD > DOC). Record the ambiguity in `notes`.

**Confidence:**
- `high` — frontmatter or filename convention + matching content signals
- `medium` — content signals only, one dominant
- `low` — signals conflict or are thin → classify as best guess but flag the low confidence

If signals are too thin to choose, output `UNKNOWN` with `low` confidence and list observed signals in `notes`.
</step>

<step name="extract_metadata">
Regardless of type, extract:

- **title** — the document's H1, or the filename if no H1
- **summary** — one sentence (≤ 30 words) describing the doc's subject
- **scope** — list of concrete nouns the doc is about (systems, components, features)
- **cross_refs** — list of other doc paths referenced by this doc (markdown links, filename mentions). Include both relative and absolute paths as-written.
- **locked_markers** — for ADRs only: does status read `Accepted` (locked) vs `Proposed`/`Draft` (not locked)? Set `locked: true|false`.
</step>

<step name="write_output">
Write to `{OUTPUT_DIR}/{slug}-{source_hash}.json` where `slug` is the filename without extension (replace non-alphanumerics with `-`), and `source_hash` is the first 8 hex chars of SHA-256 of the **full source file path** (POSIX-style) so parallel classifie...

JSON schema:

```json
{
"source_path": "{FILEPATH}",
"type": "ADR|PRD|SPEC|DOC|UNKNOWN",
"confidence": "high|medium|low",
"manifest_override": false,
"title": "...",
"summary": "...",
"scope": ["...", "..."],
"cross_refs": ["path/to/other.md", "..."],
"locked": true,
"precedence": null,
"notes": "Only populated when confidence is low or ambiguity was resolved"
}
```

Field rules:
- `manifest_override: true` only when `MANIFEST_TYPE` was provided
- `locked`: always `false` unless type is `ADR` with `Accepted` status
- `precedence`: `null` unless `MANIFEST_PRECEDENCE` was provided (then store the integer)
- `notes`: omit or empty string when confidence is `high`

**ALWAYS use the Write tool to create files** — never use `Bash(cat << 'EOF')` or heredoc commands for file creation.
</step>

<step name="return_confirmation">
Return one line to the orchestrator. No JSON, no document contents.

```
Classified: {filename} → {TYPE} ({confidence}){, LOCKED if true}
```
</step>

</process>

<anti_patterns>
Do NOT:
- Read the doc's transitive references — only classify what you were assigned
- Invent classification types beyond the five defined
- Output anything other than the one-line confirmation to the orchestrator
- Downgrade confidence silently — when unsure, output `UNKNOWN` with signals in `notes`
- Classify a `Proposed` or `Draft` ADR as `locked: true` — only `Accepted` counts as locked
- Use markdown tables or prose in your JSON output — stick to the schema
</anti_patterns>

<success_criteria>
- [ ] Exactly one JSON file written to OUTPUT_DIR
- [ ] Schema matches the template above, all required fields present
- [ ] Confidence level reflects the actual signal strength
- [ ] `locked` is true only for Accepted ADRs
- [ ] Confirmation line returned to orchestrator (≤ 1 line)
</success_criteria>

## Contract Reference

- Contract ID: `gsd-role-doc-classifier`
- Family: `role`
- Status: `planned`
- Runtime authority: `.agents/gsd-serena/parity-skills/contracts.json`
- Transition rule: planned — Role parity contract is planned until integrated into explicit bridge role frames.

### Bridge Entrypoints

- none

### Source Evidence

- `agents/gsd-doc-classifier.md` (vendor-agent) -> `vendor/reference/gsd-core/agents/gsd-doc-classifier.md`

### Unsafe Reference Behaviors

- reference tools: Read, Write, Grep, Glob

### Test Evidence

- Status: `planned`
- Commands:
- none
- Notes: Role row requires role-frame integration evidence before exact behavior claims.

### Notes

Generated from reference agent evidence.

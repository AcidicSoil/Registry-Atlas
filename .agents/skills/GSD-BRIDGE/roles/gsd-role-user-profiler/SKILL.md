---
name: bridge-gsd-role-user-profiler
description: "Use when operating the user-profiler Serena role workflow in a bridge-installed target project and needing source-informed GSD-safe procedural guidance."
---

<!-- generated-by: pnpm gen:bridge-commands -->

# Analyzes extracted session messages across 8 behavioral dimensions to produce a scored developer profile with confidence levels and evidence. Spawned by profile orchestration workflows.

## Purpose

Use this generated bridge skill as a source-informed runbook for `gsd-role-user-profiler`. It preserves the actual GSD-core command/workflow/role material where available and overlays the Serena bridge execution rules needed to operate safely in installed target projects.

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

Recorded path: `agents/gsd-user-profiler.md`; resolved path: `vendor/reference/gsd-core/agents/gsd-user-profiler.md`.

<role>
You are a GSD user profiler. You analyze a developer's session messages to identify behavioral patterns across 8 dimensions.

You are spawned by the profile orchestration workflow (Phase 3) or by write-profile during standalone profiling.

Your job: Apply the heuristics defined in the user-profiling reference document to score each dimension with evidence and confidence. Return structured JSON analysis.

CRITICAL: You must apply the rubric defined in the reference document. Do not invent dimensions, scoring rules, or patterns beyond what the reference doc specifies. The reference doc is the single source of truth for what to look for and how to score it.
</role>

<input>
You receive extracted session messages as JSONL content (from the profile-sample output).

Each message has the following structure:
```json
{
"sessionId": "string",
"projectPath": "encoded-path-string",
"projectName": "human-readable-project-name",
"timestamp": "ISO-8601",
"content": "message text (max 500 chars for profiling)"
}
```

Key characteristics of the input:
- Messages are already filtered to genuine user messages only (system messages, tool results, and Claude responses are excluded)
- Each message is truncated to 500 characters for profiling purposes
- Messages are project-proportionally sampled -- no single project dominates
- Recency weighting has been applied during sampling (recent sessions are overrepresented)
- Typical input size: 100-150 representative messages across all projects
</input>

<reference>
@~/.claude/gsd-core/references/user-profiling.md

This is the detection heuristics rubric. Read it in full before analyzing any messages. It defines:
- The 8 dimensions and their rating spectrums
- Signal patterns to look for in messages
- Detection heuristics for classifying ratings
- Confidence scoring thresholds
- Evidence curation rules
- Output schema
</reference>

<process>

<step name="load_rubric">
Read the user-profiling reference document at `~/.claude/gsd-core/references/user-profiling.md` to load:
- All 8 dimension definitions with rating spectrums
- Signal patterns and detection heuristics per dimension
- Confidence scoring thresholds (HIGH: 10+ signals across 2+ projects, MEDIUM: 5-9, LOW: <5, UNSCORED: 0)
- Evidence curation rules (combined Signal+Example format, 3 quotes per dimension, ~100 char quotes)
- Sensitive content exclusion patterns
- Recency weighting guidelines
- Output schema
</step>

<step name="read_messages">
Read all provided session messages from the input JSONL content.

While reading, build a mental index:
- Group messages by project for cross-project consistency assessment
- Note message timestamps for recency weighting
- Flag messages that are log pastes, session context dumps, or large code blocks (deprioritize for evidence)
- Count total genuine messages to determine threshold mode (full >50, hybrid 20-50, insufficient <20)
</step>

<step name="analyze_dimensions">
For each of the 8 dimensions defined in the reference document:

1. **Scan for signal patterns** -- Look for the specific signals defined in the reference doc's "Signal patterns" section for this dimension. Count occurrences.

2. **Count evidence signals** -- Track how many messages contain signals relevant to this dimension. Apply recency weighting: signals from the last 30 days count approximately 3x.

3. **Select evidence quotes** -- Choose up to 3 representative quotes per dimension:
- Use the combined format: **Signal:** [interpretation] / **Example:** "[~100 char quote]" -- project: [name]
- Prefer quotes from different projects to demonstrate cross-project consistency
- Prefer recent quotes over older ones when both demonstrate the same pattern
- Prefer natural language messages over log pastes or context dumps
- Check each candidate quote against sensitive content patterns (Layer 1 filtering)

4. **Assess cross-project consistency** -- Does the pattern hold across multiple projects?
- If the same rating applies across 2+ projects: `cross_project_consistent: true`
- If the pattern varies by project: `cross_project_consistent: false`, describe the split in the summary

5. **Apply confidence scoring** -- Use the thresholds from the reference doc:
- HIGH: 10+ signals (weighted) across 2+ projects
- MEDIUM: 5-9 signals OR consistent within 1 project only
- LOW: <5 signals OR mixed/contradictory signals
- UNSCORED: 0 relevant signals detected

6. **Write summary** -- One to two sentences describing the observed pattern for this dimension. Include context-dependent notes if applicable.

7. **Write claude_instruction** -- An imperative directive for Claude's consumption. This tells Claude how to behave based on the profile finding:
- MUST be imperative: "Provide concise explanations with code" not "You tend to prefer brief explanations"
- MUST be actionable: Claude should be able to follow this instruction directly
- For LOW confidence dimensions: include a hedging instruction: "Try X -- ask if this matches their preference"
- For UNSCORED dimensions: use a neutral fallback: "No strong preference detected. Ask the developer when this dimension is relevant."
</step>

<step name="filter_sensitive">
After selecting all evidence quotes, perform a final pass checking for sensitive content patterns:

- `sk-` (API key prefixes)
- `Bearer ` (auth token headers)
- `password` (credential references)
- `secret` (secret values)
- `token` (when used as a credential value, not a concept)
- `api_key` or `API_KEY`
- Full absolute file paths containing usernames (e.g., `/Users/john/`, `/home/john/`)

If any selected quote contains these patterns:
1. Replace it with the next best quote that does not contain sensitive content
2. If no clean replacement exists, reduce the evidence count for that dimension
3. Record the exclusion in the `sensitive_excluded` metadata array
</step>

<step name="assemble_output">
Construct the complete analysis JSON matching the exact schema defined in the reference document's Output Schema section.

Verify before returning:
- All 8 dimensions are present in the output
- Each dimension has all required fields (rating, confidence, evidence_count, cross_project_consistent, evidence_quotes, summary, claude_instruction)
- Rating values match the defined spectrums (no invented ratings)
- Confidence values are one of: HIGH, MEDIUM, LOW, UNSCORED
- claude_instruction fields are imperative directives, not descriptions
- sensitive_excluded array is populated (empty array if nothing was excluded)
- message_threshold reflects the actual message count

Wrap the JSON in `<analysis>` tags for reliable extraction by the orchestrator.
</step>

</process>

<output>
Return the complete analysis JSON wrapped in `<analysis>` tags.

Format:
```
<analysis>
{
"profile_version": "1.0",
"analyzed_at": "...",
...full JSON matching reference doc schema...
}
</analysis>
```

If data is insufficient for all dimensions, still return the full schema with UNSCORED dimensions noting "insufficient data" in their summaries and neutral fallback claude_instructions.

Do NOT return markdown commentary, explanations, or caveats outside the `<analysis>` tags. The orchestrator parses the tags programmatically.
</output>

<constraints>
- Never select evidence quotes containing sensitive patterns (sk-, Bearer, password, secret, token as credential, api_key, full file paths with usernames)
- Never invent evidence or fabricate quotes -- every quote must come from actual session messages
- Never rate a dimension HIGH without 10+ signals (weighted) across 2+ projects
- Never invent dimensions beyond the 8 defined in the reference document
- Weight recent messages approximately 3x (last 30 days) per reference doc guidelines
- Report context-dependent splits rather than forcing a single rating when contradictory signals exist across projects
- claude_instruction fields must be imperative directives, not descriptions -- the profile is an instruction document for Claude's consumption
- Deprioritize log pastes, session context dumps, and large code blocks when selecting evidence
- When evidence is genuinely insufficient, report UNSCORED with "insufficient data" -- do not guess
</constraints>

## Contract Reference

- Contract ID: `gsd-role-user-profiler`
- Family: `role`
- Status: `planned`
- Runtime authority: `.agents/gsd-serena/parity-skills/contracts.json`
- Transition rule: planned — Role parity contract is planned until integrated into explicit bridge role frames.

### Bridge Entrypoints

- none

### Source Evidence

- `agents/gsd-user-profiler.md` (vendor-agent) -> `vendor/reference/gsd-core/agents/gsd-user-profiler.md`

### Unsafe Reference Behaviors

- reference tools: Read

### Test Evidence

- Status: `planned`
- Commands:
- none
- Notes: Role row requires role-frame integration evidence before exact behavior claims.

### Notes

Generated from reference agent evidence.

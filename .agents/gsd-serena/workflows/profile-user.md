# Bridge Workflow: profile-user

<!-- generated-by: pnpm gen:bridge-commands -->

## Purpose

This bridge workflow runbook translates the actual GSD-core workflow information and adapts it for Serena bridge operation. Read it when operating `gsd-workflow-profile-user` in a target project.

## Bridge Entry

```bash
gsd-serena-bridge bootstrap --format markdown
gsd-serena-bridge doctor --format markdown
```

If setup is stale or broken, run:

```bash
gsd-serena-bridge repair --format markdown
gsd-serena-bridge doctor --format markdown
```

Primary bridge route:

```text
Use `gsd-serena-bridge resolve --stdin --format markdown` to map this workflow intent to an implemented bridge command or operation plan.
```

For natural-language requests, classify first:

```bash
cat <<'EOF_REQUEST' | gsd-serena-bridge resolve --stdin --format markdown
<verbatim user request>
EOF_REQUEST
```

## Bridge Substitution Rules

- Preserve the GSD-core trigger, purpose, process steps, decision logic, and quality bar from the source workflow below.
- Replace native `/gsd:*` slash commands with `gsd-serena-bridge <command> --format markdown` when implemented.
- Replace native `gsd_run query ...` calls with bridge commands, resolver packets, installed contracts, or explicit operation plans.
- Replace native `Agent(...)` dispatch with Serena role workflows, generated role skills, sequential role passes, or explicit checkpoints.
- Do not run native shell snippets that mutate state unless a bridge command or operation plan authorizes the same write set and validation.
- Do not claim exact native behavior for adapted-safe or planned rows. Name the bridge substitute and remaining gap.

## Source Evidence

- Contract ID: `gsd-workflow-profile-user`
- Status: `planned`
- Source path: `gsd-core/workflows/profile-user.md`
- Resolved source path: `vendor/reference/gsd-core/gsd-core/workflows/profile-user.md`
- Mirrored runbook path: `.agents/gsd-serena/workflows/profile-user.md`

## Translated GSD Workflow

### Native Shim Translation
- Native GSD shim locator omitted: the bridge uses the installed `gsd-serena-bridge` CLI, `bootstrap`, `doctor`, `repair`, resolver packets, and install-managed project surfaces instead of locating `gsd-tools.cjs`.
<purpose>
Orchestrate the full developer profiling flow: consent, session analysis (or questionnaire fallback), profile generation, result display, and artifact creation.

This workflow wires Phase 1 (session pipeline) and Phase 2 (profiling engine) into a cohesive user-facing experience. All heavy lifting is done by existing `gsd-tools.cjs query` handlers (with legacy `gsd-tools.cjs` parity where needed) and the gsd-user-pro...
</purpose>

<required_reading>
Read all files referenced by the invoking prompt's execution_context before starting.

Key references:
- @$HOME/.claude/gsd-core/references/ui-brand.md (display patterns)
- @$HOME/.claude/agents/gsd-user-profiler.md (profiler agent definition)
- @$HOME/.claude/gsd-core/references/user-profiling.md (profiling reference doc)
</required_reading>

<process>

## 1. Initialize

Parse flags from $ARGUMENTS:
- Detect `--questionnaire` flag (skip session analysis, questionnaire-only)
- Detect `--refresh` flag (rebuild profile even when one exists)

Check for existing profile:

```bash
PROFILE_PATH="$HOME/.claude/gsd-core/USER-PROFILE.md"
[ -f "$PROFILE_PATH" ] && echo "EXISTS" || echo "NOT_FOUND"
```

**If profile exists AND --refresh NOT set AND --questionnaire NOT set:**

**Text mode (`workflow.text_mode: true` in config or `--text` flag):** Set `TEXT_MODE=true` if `--text` is present in `$ARGUMENTS` OR `text_mode` from init JSON is `true`. When TEXT_MODE is active, replace every `AskUserQuestion` call with a plain-text numb...
Use AskUserQuestion:
- header: "Existing Profile"
- question: "You already have a profile. What would you like to do?"
- options:
- "View it" -- Display summary card from existing profile data, then exit
- "Refresh it" -- Continue with --refresh behavior
- "Cancel" -- Exit workflow

If "View it": Read USER-PROFILE.md, display its content formatted as a summary card, then exit.
If "Refresh it": Set --refresh behavior and continue.
If "Cancel": Display "No changes made." and exit.

**If profile exists AND --refresh IS set:**

Backup existing profile:
```bash
cp "$HOME/.claude/gsd-core/USER-PROFILE.md" "$HOME/.claude/USER-PROFILE.backup.md"
```

Display: "Re-analyzing your sessions to update your profile."
Continue to step 2.

**If no profile exists:** Continue to step 2.

---

## 2. Consent Gate (ACTV-06)

**Skip if** `--questionnaire` flag is set (no JSONL reading occurs -- jump directly to step 4b).

Display consent screen:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GSD > PROFILE YOUR CODING STYLE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Claude starts every conversation generic. A profile teaches Claude
how YOU actually work -- not how you think you work.

## What We'll Analyze

Your recent Claude Code sessions, looking for patterns in these
8 behavioral dimensions:

| Dimension            | What It Measures                            |
|----------------------|---------------------------------------------|
| Communication Style  | How you phrase requests (terse vs. detailed) |
| Decision Speed       | How you choose between options               |
| Explanation Depth    | How much explanation you want with code      |
| Debugging Approach   | How you tackle errors and bugs               |
| UX Philosophy        | How much you care about design vs. function  |
| Vendor Philosophy    | How you evaluate libraries and tools         |
| Frustration Triggers | What makes you correct Claude                |
| Learning Style       | How you prefer to learn new things           |

## Data Handling

✓ Reads session files locally (read-only, nothing modified)
✓ Analyzes message patterns (not content meaning)
✓ Stores profile at $HOME/.claude/gsd-core/USER-PROFILE.md
✗ Nothing is sent to external services
✗ Sensitive content (API keys, passwords) is automatically excluded
```

**If --refresh path:**
Show abbreviated consent instead:

```
Re-analyzing your sessions to update your profile.
Your existing profile has been backed up to USER-PROFILE.backup.md.
```

Use AskUserQuestion:
- header: "Refresh"
- question: "Continue with profile refresh?"
- options:
- "Continue" -- Proceed to step 3
- "Cancel" -- Exit workflow

**If default (no --refresh) path:**

Use AskUserQuestion:
- header: "Ready?"
- question: "Ready to analyze your sessions?"
- options:
- "Let's go" -- Proceed to step 3 (session analysis)
- "Use questionnaire instead" -- Jump to step 4b (questionnaire path)
- "Not now" -- Display "No worries. Run `gsd-serena-bridge profile-user --format markdown` when ready." and exit

---

## 3. Session Scan

Display: "◆ Scanning sessions..."

Run session scan:
```bash
- Native query translated: `SCAN_RESULT=$(gsd_run query scan-sessions --json 2>/dev/null)` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
```

Parse the JSON output to get session count and project count.

Display: "✓ Found N sessions across M projects"

**Determine data sufficiency:**
- Count total messages available from the scan result (sum sessions across projects)
- If 0 sessions found: Display "No sessions found. Switching to questionnaire." and jump to step 4b
- If sessions found: Continue to step 4a

---

## 4a. Session Analysis Path

Display: "◆ Sampling messages..."

Run profile sampling:
```bash
- Native query translated: `SAMPLE_RESULT=$(gsd_run query profile-sample --json 2>/dev/null)` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
```

Parse the JSON output to get the temp directory path and message count.

Display: "✓ Sampled N messages from M projects"

Display: "◆ Analyzing patterns..."

**Spawn gsd-user-profiler agent using Task tool:**

Use the Task tool to spawn the `gsd-user-profiler` agent. Provide it with:
- The sampled JSONL file path from profile-sample output
- The user-profiling reference doc at `$HOME/.claude/gsd-core/references/user-profiling.md`

The agent prompt should follow this structure:
```
Read the profiling reference document and the sampled session messages, then analyze the developer's behavioral patterns across all 8 dimensions.

Reference: @$HOME/.claude/gsd-core/references/user-profiling.md
Session data: @{temp_dir}/profile-sample.jsonl

Analyze these messages and return your analysis in the <analysis> JSON format specified in the reference document.
```

**Parse the agent's output:**
- Extract the `<analysis>` JSON block from the agent's response
- Save analysis JSON to a temp file (in the same temp directory created by profile-sample)

```bash
ANALYSIS_PATH="{temp_dir}/analysis.json"
```

Write the analysis JSON to `$ANALYSIS_PATH`.

Display: "✓ Analysis complete (N dimensions scored)"

**Check for thin data:**
- Read the analysis JSON and check the total message count
- If < 50 messages were analyzed: Note that a questionnaire supplement could improve accuracy. Display: "Note: Limited session data (N messages). Results may have lower confidence."

Continue to step 5.

---

## 4b. Questionnaire Path

Display: "Using questionnaire to build your profile."

**Get questions:**
```bash
- Native query translated: `QUESTIONS=$(gsd_run query profile-questionnaire --json 2>/dev/null)` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
```

Parse the questions JSON. It contains 8 questions, one per dimension.

**Present each question to the user via AskUserQuestion:**

For each question in the questions array:
- header: The dimension name (e.g., "Communication Style")
- question: The question text
- options: The answer options from the question definition

Collect all answers into an answers JSON object mapping dimension keys to selected answer values.

**Save answers to temp file:**
```bash
ANSWERS_PATH=$(mktemp /tmp/gsd-profile-answers-XXXXXX.json)
```

Write the answers JSON to `$ANSWERS_PATH`.

**Convert answers to analysis:**
```bash
- Native query translated: `ANALYSIS_RESULT=$(gsd_run query profile-questionnaire --answers "$ANSWERS_PATH" --json 2>/dev/null)` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
```

Parse the analysis JSON from the result.

Save analysis JSON to a temp file:
```bash
ANALYSIS_PATH=$(mktemp /tmp/gsd-profile-analysis-XXXXXX.json)
```

Write the analysis JSON to `$ANALYSIS_PATH`.

Continue to step 5 (skip split resolution since questionnaire handles ambiguity internally).

---

## 5. Split Resolution

**Skip if** questionnaire-only path (splits already handled internally).

Read the analysis JSON from `$ANALYSIS_PATH`.

Check each dimension for `cross_project_consistent: false`.

**For each split detected:**

Use AskUserQuestion:
- header: The dimension name (e.g., "Communication Style")
- question: "Your sessions show different patterns:" followed by the split context (e.g., "CLI/backend projects -> terse-direct, Frontend/UI projects -> detailed-structured")
- options:
- Rating option A (e.g., "terse-direct")
- Rating option B (e.g., "detailed-structured")
- "Context-dependent (keep both)"

**If user picks a specific rating:** Update the dimension's `rating` field in the analysis JSON to the selected value.

**If user picks "Context-dependent":** Keep the dominant rating in the `rating` field. Add a `context_note` to the dimension's summary describing the split (e.g., "Context-dependent: terse in CLI projects, detailed in frontend projects").

Write updated analysis JSON back to `$ANALYSIS_PATH`.

---

## 6. Profile Write

Display: "◆ Writing profile..."

```bash
- Native query translated: `gsd_run query write-profile --input "$ANALYSIS_PATH" --json` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
```

Display: "✓ Profile written to $HOME/.claude/gsd-core/USER-PROFILE.md"

---

## 7. Result Display

Read the analysis JSON from `$ANALYSIS_PATH` to build the display.

**Show report card table:**

```
## Your Profile

| Dimension            | Rating               | Confidence |
|----------------------|----------------------|------------|
| Communication Style  | detailed-structured  | HIGH       |
| Decision Speed       | deliberate-informed  | MEDIUM     |
| Explanation Depth    | concise              | HIGH       |
| Debugging Approach   | hypothesis-driven    | MEDIUM     |
| UX Philosophy        | pragmatic            | LOW        |
| Vendor Philosophy    | thorough-evaluator   | HIGH       |
| Frustration Triggers | scope-creep          | MEDIUM     |
| Learning Style       | self-directed        | HIGH       |
```

(Populate with actual values from the analysis JSON.)

**Show highlight reel:**

Pick 3-4 dimensions with the highest confidence and most evidence signals. Format as:

```
## Highlights

- **Communication (HIGH):** You consistently provide structured context with
headers and problem statements before making requests
- **Vendor Choices (HIGH):** You research alternatives thoroughly -- comparing
docs, GitHub activity, and bundle sizes before committing
- **Frustrations (MEDIUM):** You correct Claude most often for doing things
you didn't ask for -- scope creep is your primary trigger
```

Build highlights from the `evidence` array and `summary` fields in the analysis JSON. Use the most compelling evidence quotes. Format each as "You tend to..." or "You consistently..." with evidence attribution.

- Source translation truncated here; use the bridge command output, workflow runbook, installed contracts, or operation plan for continuation.

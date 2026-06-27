# Bridge Workflow: settings

<!-- generated-by: pnpm gen:bridge-commands -->

## Purpose

This bridge workflow runbook translates the actual GSD-core workflow information and adapts it for Serena bridge operation. Read it when operating `gsd-workflow-settings` in a target project.

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

- Contract ID: `gsd-workflow-settings`
- Status: `planned`
- Source path: `gsd-core/workflows/settings.md`
- Resolved source path: `vendor/reference/gsd-core/gsd-core/workflows/settings.md`
- Mirrored runbook path: `.agents/gsd-serena/workflows/settings.md`

## Translated GSD Workflow

### Native Shim Translation
- Native GSD shim locator omitted: the bridge uses the installed `gsd-serena-bridge` CLI, `bootstrap`, `doctor`, `repair`, resolver packets, and install-managed project surfaces instead of locating `gsd-tools.cjs`.
<purpose>
Interactive configuration of GSD workflow agents (research, plan_check, verifier) and model profile selection via multi-question prompt. Updates .planning/config.json with user preferences. Optionally saves settings as global defaults (~/.gsd/defaults.json)...
</purpose>

<required_reading>
Read all files referenced by the invoking prompt's execution_context before starting.
</required_reading>

<process>

<step name="ensure_and_load_config">
Ensure config exists and load current state:

```bash
- Native query translated: `gsd_run query config-ensure-section` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
- Native query translated: `INIT=$(gsd_run query state.load)` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
# `state.load` returns STATE frontmatter JSON from the SDK — it does not include `config_path`. Orchestrators may set `GSD_CONFIG_PATH` from init phase-op JSON; otherwise resolve the same path gsd-tools uses for flat vs active workstream (#2282).
if [[ -z "${GSD_CONFIG_PATH:-}" ]]; then
if [[ -f .planning/active-workstream ]]; then
WS=$(tr -d '\n\r' < .planning/active-workstream)
GSD_CONFIG_PATH=".planning/workstreams/${WS}/config.json"
else
GSD_CONFIG_PATH=".planning/config.json"
fi
fi
```

Creates `config.json` (at the resolved path) with defaults if missing. `INIT` still holds `state.load` output for any step that needs STATE fields.
Store `$GSD_CONFIG_PATH` — all subsequent reads and writes use this path, not a hardcoded `.planning/config.json`, so active-workstream installs target the correct file (#2282).
</step>

<step name="read_current">
```bash
cat "$GSD_CONFIG_PATH"
```

Parse current values (default to `true` if not present):
- `workflow.research` — spawn researcher during plan-phase
- `workflow.plan_check` — spawn plan checker during plan-phase
- `workflow.verifier` — spawn verifier during execute-phase
- `plan_review.source_grounding` — verify plan symbols against live source during plan review (default: true if absent; set `plan_review.source_grounding_authority` to select the resolver adapter: `grep` (default), `intel`, `treesitter`, `lsp`, or `scip`)
- `workflow.nyquist_validation` — validation architecture research during plan-phase (default: true if absent)
- `workflow.pattern_mapper` — run gsd-pattern-mapper between research and planning (default: true if absent)
- `workflow.ui_phase` — generate UI-SPEC.md design contracts for frontend phases (default: true if absent)
- `workflow.ui_safety_gate` — prompt to run `gsd-serena-bridge ui-phase --format markdown` before planning frontend phases (default: true if absent)
- `workflow.ai_integration_phase` — framework selection + eval strategy for AI phases (default: true if absent)
- `workflow.tdd_mode` — enforce RED/GREEN/REFACTOR gate sequence during execute-phase (default: false if absent)
- `workflow.code_review` — enable `gsd-serena-bridge code-review --format markdown` and `gsd-serena-bridge code-review --format markdown` --fix commands (default: true if absent)
- `workflow.code_review_depth` — default depth for `gsd-serena-bridge code-review --format markdown`: `quick`, `standard`, or `deep` (default: `"standard"` if absent; only relevant when `code_review` is on)
- `workflow.ui_review` — run visual quality audit (`gsd-serena-bridge ui-review --format markdown`) in autonomous mode (default: true if absent)
- `commit_docs` — whether `.planning/` files are committed to git (default: true if absent)
- `intel.enabled` — enable queryable codebase intelligence (`gsd-serena-bridge map-codebase --format markdown` --query) (default: false if absent)
- `graphify.enabled` — enable project knowledge graph (`gsd-serena-bridge graphify --format markdown`) (default: false if absent)
- `graphify.auto_update` — opt-in: auto-rebuild graph after main HEAD advances (#3347) (default: `false`)
- `model_profile` — which model each agent uses (default: `balanced`)
- `git.branching_strategy` — branching approach (default: `"none"`)
- `workflow.use_worktrees` — whether parallel executor agents run in worktree isolation (default: `true`)
- `model_policy.provider` — provider slug for model policy (default: `null`; known values: anthropic, openai, google, qwen; set via `gsd-serena-bridge config --format markdown` --advanced)
- `model_policy.budget` — budget level for model policy (default: `null`; known values: high, medium, low; set via `gsd-serena-bridge config --format markdown` --advanced)
- `model_policy.high` — model ID for high-cost tier (default: `null`; set via `gsd-serena-bridge config --format markdown` --advanced)
- `model_policy.medium` — model ID for medium-cost tier (default: `null`; set via `gsd-serena-bridge config --format markdown` --advanced)
- `model_policy.low` — model ID for low-cost tier (default: `null`; set via `gsd-serena-bridge config --format markdown` --advanced)
</step>

<step name="present_settings">

**Text mode (`workflow.text_mode: true` in config or `--text` flag):** Set `TEXT_MODE=true` if `--text` is present in `$ARGUMENTS` OR `text_mode` from init JSON is `true`. When TEXT_MODE is active, replace every `AskUserQuestion` call with a plain-text numb...

**Non-Claude runtime note:** If `TEXT_MODE` is active (i.e. the runtime is non-Claude), prepend the following notice before the model profile question:

```
Note: Quality, Balanced, Budget, and Adaptive profiles assign semantic tiers
(Opus/Sonnet/Haiku) to each agent. When `runtime` is set in .planning/config.json,
tiers resolve to runtime-native model IDs — on Codex that's gpt-5.5 / gpt-5.4 /
gpt-5.4-mini with appropriate reasoning effort. See "Runtime-Aware Profiles" in
docs/CONFIGURATION.md.

If `runtime` is unset on a non-Claude runtime, the profile tiers have no effect on
actual model selection — agents use the runtime's default model. Choose "Inherit" to
force session-model behavior, set `runtime` + a profile to get tiered models, or
configure `model_overrides` manually in .planning/config.json to target specific
models per agent.
```

Use AskUserQuestion with current values pre-selected. Questions are grouped into six visual sections; the first question in each section carries the section-denoting `header` field (AskUserQuestion renders abbreviated section tags for grouping, max 12 chars).

Section layout:

### Planning
Research, Plan Checker, Drift Guard, Pattern Mapper, Nyquist, UI Phase, UI Gate, AI Phase

### Execution
Verifier, TDD Mode, Code Review, Code Review Depth _(conditional — only when code_review=on)_, UI Review

### Docs & Output
Commit Docs, Skip Discuss, Worktrees

### Features
Intel, Graphify, Graph auto-update _(conditional — only when graphify=on)_

### Model & Pipeline
Model Profile, Auto-Advance, Branching

### Misc
Context Warnings, Research Qs

**Conditional visibility — code_review_depth:** This question is shown only when the user's chosen `code_review` value (after they answer that question, or the pre-selected value if unchanged) is on. If `code_review` is off, omit the `code_review_depth` que...

**Conditional visibility — graphify.auto_update:** This question is shown only when the user's chosen `graphify.enabled` value is on. If `graphify.enabled` is off, omit the `graphify.auto_update` question and preserve the existing `graphify.auto_update` val...

```
// Model profile is selected via a two-question split because AskUserQuestion enforces a
// hard 4-option cap and there are 5 valid profiles (quality, balanced, budget, adaptive,
// inherit). Q1 routes between adaptive/standard-tier/inherit; Q2 (shown only when the
// user chose "Standard tier" in Q1) picks among the three standard profiles. (#3784)
AskUserQuestion([
{
question: "Which model profile for agents?",
header: "Model",
multiSelect: false,
options: [
{ label: "Adaptive (Recommended)", description: "Role-based cost optimization: heavy roles use the highest-tier model available on the active runtime, light roles use the cheapest. Best balance of quality and cost across all supported runtimes (Claude, Code...
{ label: "Standard tier…", description: "Choose Quality, Balanced, or Budget — flat tier applied to all agents" },
{ label: "Inherit", description: "Use current session model for all agents (required for non-Claude runtimes: Codex, Gemini CLI, OpenRouter, local models)" }
]
}
])

**Conditional visibility — model_profile (Q2):**
Only ask this question when Q1's answer is "Standard tier…".
If Q1 = "Adaptive (Recommended)" → write model_profile=adaptive and SKIP Q2.
If Q1 = "Inherit"                → write model_profile=inherit and SKIP Q2.
If user cancels Q2 after picking "Standard tier…" → leave existing model_profile value unchanged (mirror code_review_depth's cancellation rule).

AskUserQuestion([
{
question: "Which standard profile? (Quality / Balanced / Budget)",
header: "Model Tier",
multiSelect: false,
options: [
{ label: "Quality", description: "Opus everywhere except verification (highest cost) — Claude only" },
{ label: "Balanced", description: "Opus for planning, Sonnet for research/execution/verification — Claude only" },
{ label: "Budget", description: "Sonnet for writing, Haiku for research/verification (lowest cost) — Claude only" }
]
}
])

// Map UI choices → config values:
//   Q1 "Adaptive (Recommended)" → model_profile = "adaptive"
//   Q1 "Inherit"                → model_profile = "inherit"
//   Q1 "Standard tier…" + Q2 "Quality"   → model_profile = "quality"
//   Q1 "Standard tier…" + Q2 "Balanced"  → model_profile = "balanced"
//   Q1 "Standard tier…" + Q2 "Budget"    → model_profile = "budget"

AskUserQuestion([
{
question: "Spawn Plan Researcher? (researches domain before planning)",
header: "Research",
multiSelect: false,
options: [
{ label: "Yes", description: "Research phase goals before planning" },
{ label: "No", description: "Skip research, plan directly" }
]
},
{
question: "Spawn Plan Checker? (verifies plans before execution)",
header: "Plan Check",
multiSelect: false,
options: [
{ label: "Yes", description: "Verify plans meet phase goals" },
{ label: "No", description: "Skip plan verification" }
]
},
{
question: "Spawn Execution Verifier? (verifies phase completion)",
header: "Verifier",
multiSelect: false,
options: [
{ label: "Yes", description: "Verify must-haves after execution" },
{ label: "No", description: "Skip post-execution verification" }
]
},
{
question: "Enable Plan Drift Guard? (verifies that symbols cited in plans exist in source at review time)",
header: "Drift Guard",
multiSelect: false,
options: [
{ label: "Yes (Recommended)", description: "Resolve symbol references (decorators, classes, functions, CLI flags) against live source — catches hallucinated names before execution. Authority controlled by plan_review.source_grounding_authority (default: gre...
{ label: "No", description: "Skip symbol grounding. Plan review proceeds without source verification." }
]
},
{
question: "Enable TDD Mode? (RED/GREEN/REFACTOR gates for eligible tasks)",
header: "TDD",
multiSelect: false,
options: [
{ label: "No (Recommended)", description: "Execute tasks normally. Tests written alongside implementation." },
{ label: "Yes", description: "Planner applies type:tdd to business logic/APIs/validations; executor enforces gate sequence. End-of-phase review checks compliance." }
]
},
{
question: "Enable Code Review? (`gsd-serena-bridge code-review --format markdown` and `gsd-serena-bridge code-review --format markdown` --fix commands)",
header: "Code Review",
multiSelect: false,
options: [
{ label: "Yes (Recommended)", description: "Enable `gsd-serena-bridge code-review --format markdown` commands for reviewing source files changed during a phase." },
{ label: "No", description: "Commands exit with a configuration gate message. Use when code review is handled externally." }
]
},
// Conditional: include the following code_review_depth question ONLY when the user's
// chosen code_review value is "Yes". If code_review is "No", omit this question from
// the AskUserQuestion call and do not touch the existing workflow.code_review_depth value.
{
question: "Code Review Depth? (default depth for `gsd-serena-bridge code-review --format markdown` — override per-run with --depth=)",
header: "Review Depth",
multiSelect: false,
options: [
{ label: "Standard (Recommended)", description: "Per-file analysis. Balanced cost and signal." },
{ label: "Quick", description: "Pattern-matching only. Fastest, lowest cost." },
{ label: "Deep", description: "Cross-file analysis with import graphs. Highest cost, highest signal." }
]
},
{
question: "Enable UI Review? (visual quality audit via `gsd-serena-bridge ui-review --format markdown` in autonomous mode)",
header: "UI Review",
multiSelect: false,
options: [
{ label: "Yes (Recommended)", description: "Run visual quality audit after phase execution in autonomous mode." },
{ label: "No", description: "Skip the UI audit step. Good for backend-only projects." }
]
},
{
question: "Auto-advance pipeline? (discuss → plan → execute automatically)",
header: "Auto",
multiSelect: false,
options: [
{ label: "No (Recommended)", description: "Manual /clear + paste between stages" },
- Native agent dispatch translated: `{ label: "Yes", description: "Chain stages via Agent() subagents (same isolation)" }` -> use Serena role workflow / generated role skill / sequential role pass with handoff.
]
},
{
question: "Run Pattern Mapper? (maps new files to existing codebase analogs between research and planning)",
header: "Pattern Mapper",
multiSelect: false,
options: [
{ label: "Yes (Recommended)", description: "gsd-pattern-mapper runs between research and plan steps. Surfaces conventions so new code follows house style." },

- Source translation truncated here; use the bridge command output, workflow runbook, installed contracts, or operation plan for continuation.

# Bridge Workflow: settings-advanced

<!-- generated-by: pnpm gen:bridge-commands -->

## Purpose

This bridge workflow runbook translates the actual GSD-core workflow information and adapts it for Serena bridge operation. Read it when operating `gsd-workflow-settings-advanced` in a target project.

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

- Contract ID: `gsd-workflow-settings-advanced`
- Status: `planned`
- Source path: `gsd-core/workflows/settings-advanced.md`
- Resolved source path: `vendor/reference/gsd-core/gsd-core/workflows/settings-advanced.md`
- Mirrored runbook path: `.agents/gsd-serena/workflows/settings-advanced.md`

## Translated GSD Workflow

### Native Shim Translation
- Native GSD shim locator omitted: the bridge uses the installed `gsd-serena-bridge` CLI, `bootstrap`, `doctor`, `repair`, resolver packets, and install-managed project surfaces instead of locating `gsd-tools.cjs`.
<purpose>
Interactive configuration of GSD power-user knobs — plan bounce, node repair, subagent timeouts,
inline plan threshold, cross-AI execution, base branch, branch templates, response language,
context window, gitignored search, graphify build timeout, runtime model tier overrides, and
model policy configuration (provider + budget → canonical tier mapping, or manual model ID
assignment per cost tier).

This is a companion to ``gsd-serena-bridge settings --format markdown`` — the common-case prompt there covers model profile,
research/plan_check/verifier toggles, branching strategy, UI/AI phase gates, and worktree
isolation. This advanced command covers everything else that is user-settable, grouped into
eight sections so each prompt batch stays cognitively scoped. Every answer pre-selects the
current value; numeric-input answers that are non-numeric are rejected and re-prompted.
</purpose>

<required_reading>
Read all files referenced by the invoking prompt's execution_context before starting.
</required_reading>

<process>

<step name="ensure_and_load_config">
Ensure config exists and resolve the workstream-aware config path (mirrors `settings.md`):

```bash
- Native query translated: `gsd_run query config-ensure-section` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
if [[ -z "${GSD_CONFIG_PATH:-}" ]]; then
if [[ -f .planning/active-workstream ]]; then
WS=$(tr -d '\n\r' < .planning/active-workstream)
GSD_CONFIG_PATH=".planning/workstreams/${WS}/config.json"
else
GSD_CONFIG_PATH=".planning/config.json"
fi
fi
```

All subsequent reads and writes go through `$GSD_CONFIG_PATH`. Never hardcode
`.planning/config.json` — workstream installs must route to their own config file.
</step>

<step name="read_current">
```bash
cat "$GSD_CONFIG_PATH"
```

Parse the following current values. If a key is absent, fall back to the documented default
shown in parentheses:

Planning Tuning:
- `workflow.plan_bounce` (default: `false`)
- `workflow.plan_bounce_passes` (default: `2`)
- `workflow.plan_bounce_script` (default: `null`)
- `workflow.subagent_timeout` (default: `300000`)
- `workflow.inline_plan_threshold` (default: `3`)

Execution Tuning:
- `workflow.node_repair` (default: `true`)
- `workflow.node_repair_budget` (default: `2`)
- `workflow.auto_prune_state` (default: `false`)

Discussion Tuning:
- `workflow.max_discuss_passes` (default: `3`)

Cross-AI Execution:
- `workflow.cross_ai_execution` (default: `false`)
- `workflow.cross_ai_command` (default: `null`)
- `workflow.cross_ai_timeout` (default: `300`)

Git Customization:
- `git.base_branch` (default: `main`)
- `git.phase_branch_template` (default: `gsd/phase-{phase}-{slug}`)
- `git.milestone_branch_template` (default: `gsd/{milestone}-{slug}`)

Runtime / Output:
- `response_language` (default: `null`)
- `context_window` (default: `200000`)
- `search_gitignored` (default: `false`)
- `graphify.build_timeout` (default: `300`)

Runtime Model Tiers:
- `runtime` (default: `null` — reads as `"claude"`)
- `model_profile_overrides.<runtime>.opus` (default: built-in for the runtime, or absent)
- `model_profile_overrides.<runtime>.sonnet` (default: built-in for the runtime, or absent)
- `model_profile_overrides.<runtime>.haiku` (default: built-in for the runtime, or absent)

Model Policy:
- `model_policy.provider` (default: `null` — known values: anthropic, anthropic-fable, openai, google, qwen)
- `model_policy.budget` (default: `null` — known values: high, medium, low)
- `model_policy.high` (default: `null` — model ID for the high-cost tier; used by generic provider path)
- `model_policy.medium` (default: `null` — model ID for the medium-cost tier; used by generic provider path)
- `model_policy.low` (default: `null` — model ID for the low-cost tier; used by generic provider path)

Each field's **current value is pre-selected** in the prompt rendering below. When the
current value is absent from the config, render the documented default as the pre-selected
option so the user sees what the effective value is.
</step>

<step name="present_settings">

**Text mode (`workflow.text_mode: true` or `--text` flag):** Set `TEXT_MODE=true` if `--text` is
in `$ARGUMENTS` OR `text_mode` is true in config. When `TEXT_MODE=true`, replace every
`AskUserQuestion` call below with a plain-text numbered list and ask the user to type the
choice number or free-text value.

**Numeric-input validation.** For any numeric field (`*_passes`, `*_budget`, `*_timeout`,
`*_threshold`, `context_window`, `graphify.build_timeout`), if the user types a value that
is not a non-negative integer, the workflow MUST reject it, state which value was invalid,
and re-prompt that single field. The minimum accepted value is field-specific and is stated
in each field's prompt below — `workflow.plan_bounce_passes` and `workflow.max_discuss_passes`
require `>= 1`; all other numeric fields accept `>= 0`. An empty input means "keep current"
— the existing value is retained. Non-numeric input is never silently coerced.

**Free-text validation.** For branch template fields (`git.phase_branch_template`,
`git.milestone_branch_template`), if the user supplies a non-default value, it MUST be
non-empty and SHOULD contain at least one `{placeholder}`. A template missing placeholders
is rejected with a message explaining the available variables (`{phase}`, `{slug}`,
`{milestone}`) and re-prompted. An empty input means "keep current."

**Null-allowed fields.** For `response_language`, `workflow.plan_bounce_script`,
`workflow.cross_ai_command`: an empty input clears the field (`null`). A non-empty input is
stored verbatim as a string.

---

### Section 1 — Planning Tuning

```text
AskUserQuestion([
{
question: "Run external plan-bounce validator against generated PLAN.md? (current: <value or false>)",
header: "Plan Bounce",
multiSelect: false,
options: [
{ label: "No (default: false)", description: "Skip external plan validation." },
{ label: "Yes", description: "Pipe each PLAN.md through `plan_bounce_script` and block on non-zero exit." }
]
},
{
question: "How many plan-bounce passes? (current: <value or 2>)",
header: "Bounce Passes",
multiSelect: false,
options: [
{ label: "Keep current", description: "Leave the existing value unchanged." },
{ label: "Enter number", description: "Type an integer >= 1. Non-numeric input is rejected and re-prompted. Default: 2" }
]
},
{
question: "Path to plan-bounce validation script? (current: <value or null>)",
header: "Bounce Script",
multiSelect: false,
options: [
{ label: "Keep current", description: "Leave existing path unchanged." },
{ label: "Clear (null)", description: "Unset the script path." },
{ label: "Enter path", description: "Type an absolute or repo-relative path. Receives PLAN.md path as first argument." }
]
},
{
question: "Subagent timeout (milliseconds)? (current: <value or 300000>)",
header: "Subagent Timeout",
multiSelect: false,
options: [
{ label: "Keep current", description: "Leave timeout unchanged." },
{ label: "Enter milliseconds", description: "Integer number of milliseconds. Non-numeric rejected. Default: 300000 (5 minutes)." }
]
},
{
question: "Inline plan threshold — tasks allowed inline before splitting to PLAN.md? (current: <value or 3>)",
header: "Inline Plan Threshold",
multiSelect: false,
options: [
{ label: "Keep current", description: "Leave threshold unchanged." },
{ label: "Enter number", description: "Integer count. Non-numeric rejected. Default: 3" }
]
}
])
```

### Section 2 — Execution Tuning

```text
AskUserQuestion([
{
question: "Enable autonomous node repair on verification failure? (current: <value or true>)",
header: "Node Repair",
multiSelect: false,
options: [
{ label: "Yes (default: true)", description: "Executor retries failed tasks up to the repair budget." },
{ label: "No", description: "Stop on first verification failure." }
]
},
{
question: "Maximum node-repair attempts per failed task? (current: <value or 2>)",
header: "Repair Budget",
multiSelect: false,
options: [
{ label: "Keep current", description: "Leave existing budget unchanged." },
{ label: "Enter number", description: "Integer >= 0. Non-numeric rejected. Default: 2" }
]
},
{
question: "Auto-prune stale STATE.md entries at phase boundaries? (current: <value or false>)",
header: "Auto Prune",
multiSelect: false,
options: [
{ label: "No (default: false)", description: "Prompt before pruning." },
{ label: "Yes", description: "Prune stale entries without prompting." }
]
}
])
```

### Section 3 — Discussion Tuning

```text
AskUserQuestion([
{
question: "Maximum discuss-phase question rounds? (current: <value or 3>)",
header: "Max Discuss Passes",
multiSelect: false,
options: [
{ label: "Keep current", description: "Leave existing value unchanged." },
{ label: "Enter number", description: "Integer >= 1. Non-numeric rejected. Default: 3. Prevents infinite discussion loops in headless mode." }
]
}
])
```

### Section 4 — Cross-AI Execution

```text
AskUserQuestion([
{
question: "Delegate phase execution to an external AI CLI? (current: <value or false>)",
header: "Cross-AI",
multiSelect: false,
options: [
{ label: "No (default: false)", description: "Use local executor agents." },
{ label: "Yes", description: "Pipe phase prompt to `cross_ai_command` via stdin. Requires command to be set." }
]
},
{
question: "Cross-AI command template? (current: <value or null>)",
header: "Cross-AI Command",
multiSelect: false,
options: [
{ label: "Keep current", description: "Leave command unchanged." },
{ label: "Clear (null)", description: "Unset the command." },
{ label: "Enter command", description: "Shell command receiving phase prompt via stdin. Must produce SUMMARY.md-compatible output." }
]
},
{
question: "Cross-AI timeout (seconds)? (current: <value or 300>)",

- Source translation truncated here; use the bridge command output, workflow runbook, installed contracts, or operation plan for continuation.

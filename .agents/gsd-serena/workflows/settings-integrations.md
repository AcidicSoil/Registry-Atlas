# Bridge Workflow: settings-integrations

<!-- generated-by: pnpm gen:bridge-commands -->

## Purpose

This bridge workflow runbook translates the actual GSD-core workflow information and adapts it for Serena bridge operation. Read it when operating `gsd-workflow-settings-integrations` in a target project.

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

- Contract ID: `gsd-workflow-settings-integrations`
- Status: `planned`
- Source path: `gsd-core/workflows/settings-integrations.md`
- Resolved source path: `vendor/reference/gsd-core/gsd-core/workflows/settings-integrations.md`
- Mirrored runbook path: `.agents/gsd-serena/workflows/settings-integrations.md`

## Translated GSD Workflow

### Native Shim Translation
- Native GSD shim locator omitted: the bridge uses the installed `gsd-serena-bridge` CLI, `bootstrap`, `doctor`, `repair`, resolver packets, and install-managed project surfaces instead of locating `gsd-tools.cjs`.
<purpose>
Interactive configuration of third-party integrations for GSD — search API keys
(Brave / Firecrawl / Exa), code-review CLI routing (`review.models.<cli>`), and
agent-skill injection (`agent_skills.<agent-type>`). Writes to
`.planning/config.json` via `gsd-tools` so unrelated keys are
preserved, never clobbered.

This command is deliberately separate from ``gsd-serena-bridge settings --format markdown`` (workflow toggles)
and any `/gsd-settings-advanced` tuning surface. It exists because API keys and
cross-tool routing are *connectivity* concerns, not workflow or tuning knobs.
</purpose>

<security>
**API keys are secrets.** They are written as plaintext to
`.planning/config.json` — that is where secrets live on disk, and file
permissions are the security boundary. The UI must never display, echo, or
log the plaintext value. The workflow follows these rules:

- **Masking convention: `****<last-4>`** (e.g. `sk-abc123def456` → `****f456`).
Strings shorter than 8 characters render as `****` with no tail so a short
secret does not leak a meaningful fraction of its bytes. Unset values render
as `(unset)`.
- **Plaintext is never echoed by AskUserQuestion descriptions, confirmation
tables, or any log line.** It is not written to any file under `.planning/`
other than `config.json` itself.
- **`config-set` output is masked** for keys in the secret set
(`brave_search`, `firecrawl`, `exa_search`) — see
`gsd-core/bin/lib/secrets.cjs`.
- **Agent-type and CLI slug validation.** `agent_skills.<agent-type>` and
`review.models.<cli>` keys are matched against `^[a-zA-Z0-9_-]+$`. Inputs
containing path separators (`/`, `\`, `..`), whitespace, or shell
metacharacters are rejected. This closes off skill-injection attacks.
</security>

<required_reading>
Read all files referenced by the invoking prompt's execution_context before starting.
</required_reading>

<process>

<step name="ensure_and_load_config">
Ensure config exists and resolve the active config path (flat vs workstream, #2282):

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

Store `$GSD_CONFIG_PATH`. Every subsequent read/write uses it.
</step>

<step name="read_current">
Read the current config and compute a masked view for display. For each
integration field, compute one of:

- `(unset)` — field is null / missing
- `****<last-4>` — secret field that is populated (plaintext never shown)
- `<value>` — non-secret routing/skill string, shown as-is

```bash
- Native query translated: `BRAVE=$(gsd_run query config-get brave_search --default null)` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
- Native query translated: `FIRECRAWL=$(gsd_run query config-get firecrawl --default null)` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
- Native query translated: `EXA=$(gsd_run query config-get exa_search --default null)` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
- Native query translated: `SEARCH_GITIGNORED=$(gsd_run query config-get search_gitignored --default false)` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
```

For each secret key (`brave_search`, `firecrawl`, `exa_search`) the displayed
value is `****<last-4>` when set, never the raw string. Never echo the
plaintext to stdout, stderr, or any log.
</step>

<step name="section_1_search_integrations">

**Text mode (`workflow.text_mode: true` or `--text` flag):** Set
`TEXT_MODE=true` and replace every `AskUserQuestion` call with a plain-text
numbered list. Required for non-Claude runtimes.

Ask the user what they want to do for each search API key. For keys that are
already set, show `**** already set` and offer Leave / Replace / Clear. For
unset keys, offer Skip / Set.

```text
AskUserQuestion([
{
question: "Brave Search API key — used for web research during plan/discuss phases",
header: "Brave",
multiSelect: false,
options: [
// When already set:
{ label: "Leave (**** already set)", description: "Keep current value" },
{ label: "Replace", description: "Enter a new API key" },
{ label: "Clear", description: "Remove the stored key" }
// When unset, use the two-option shape: Skip / Set.
]
},
{
question: "Firecrawl API key — used for deep-crawl scraping",
header: "Firecrawl",
multiSelect: false,
options: [ /* same Leave/Replace/Clear or Skip/Set */ ]
},
{
question: "Exa Search API key — used for semantic search",
header: "Exa",
multiSelect: false,
options: [ /* same Leave/Replace/Clear or Skip/Set */ ]
},
{
question: "Include gitignored files in local code searches?",
header: "Gitignored",
multiSelect: false,
options: [
{ label: "No (Recommended)", description: "Respect .gitignore. Safer — excludes secrets, node_modules, build artifacts." },
{ label: "Yes", description: "Include gitignored files. Useful when secrets/artifacts genuinely contain searchable intent." }
]
}
])
```

For each "Set" or "Replace", follow with a text-input prompt that asks for the
key value. **The answer must not be echoed back** in subsequent question
descriptions or confirmation text. Write the value via:

```bash
- Native query translated: `gsd_run query config-set brave_search "<value>"     # masked in output` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
- Native query translated: `gsd_run query config-set firecrawl "<value>"        # masked in output` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
- Native query translated: `gsd_run query config-set exa_search "<value>"       # masked in output` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
- Native query translated: `gsd_run query config-set search_gitignored true|false` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
```

For "Clear", write `null`:

```bash
- Native query translated: `gsd_run query config-set brave_search null` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
```
</step>

<step name="section_2_review_models">

`review.models.<cli>` is a map that tells the code-review workflow which
shell command to invoke for a given reviewer flavor. Supported flavors:
`claude`, `codex`, `gemini`, `opencode`.

```text
AskUserQuestion([
{
question: "Review model CLI mapping — what next?",
header: "Review",
multiSelect: false,
options: [
{ label: "Configure CLI", description: "Pick a reviewer flavor and set/clear its command" },
{ label: "Done", description: "Finish this section" }
]
}
])
```

If "Configure CLI" is selected, ask:

```text
AskUserQuestion([
{
question: "Which reviewer CLI do you want to configure?",
header: "CLI",
multiSelect: false,
options: [
{ label: "Claude", description: "review.models.claude — defaults to session model when unset" },
{ label: "Codex", description: "review.models.codex — bare model id injected into --model, e.g. 'gpt-5'" },
{ label: "Gemini", description: "review.models.gemini — bare model id injected into -m, e.g. 'gemini-2.5-pro'" },
{ label: "OpenCode", description: "review.models.opencode — bare model id injected into --model, e.g. 'claude-sonnet-4'" }
]
}
])
```

For the selected CLI, show the current value (or `(unset)`) and offer
Leave / Replace / Clear, followed by a text-input prompt for the model id
string. Write via:

```bash
- Native query translated: `gsd_run query config-set review.models.<cli> "<model id>"` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
```

After each update, return to the "Review model CLI mapping — what next?" question.
Loop until the user selects "Done".

The `review.models.<cli>` key is validated by the dynamic pattern
`^review\.models\.[a-zA-Z0-9_-]+$`. Empty CLI slugs and path-containing slugs
are rejected by `config-set` before any write.
</step>

<step name="section_3_agent_skills">

`agent_skills.<agent-type>` injects extra skill names into an agent's spawn
frontmatter. The slug is user-extensible, so input is free-text validated
against `^[a-zA-Z0-9_-]+$`. Inputs with path separators, spaces, or shell
metacharacters are rejected.

```text
AskUserQuestion([
{
question: "Agent skills mapping — what next?",
header: "Agent Skills",
multiSelect: false,
options: [
{ label: "Configure agent", description: "Pick an agent type and set/clear skills" },
{ label: "Done", description: "Finish this section" }
]
}
])
```

If "Configure agent" is selected, ask:

```text
AskUserQuestion([
{
question: "Configure agent_skills for which agent type?",
header: "Agent Type",
multiSelect: false,
options: [
{ label: "gsd-executor", description: "Skills injected when spawning executor agents" },
{ label: "gsd-planner", description: "Skills injected when spawning planner agents" },
{ label: "gsd-verifier", description: "Skills injected when spawning verifier agents" },
{ label: "Custom…", description: "Enter a custom agent-type slug" }
]
}
])
```

For "Custom…", prompt for a slug and validate it matches
`^[a-zA-Z0-9_-]+$`. If it fails validation, print:

```text
Rejected: agent-type '<slug>' must match [a-zA-Z0-9_-]+ (no path separators,
spaces, or shell metacharacters).
```

and re-prompt.

For a selected slug, prompt for the comma-separated skill list (text input).
Show the current value if any, offer Leave / Replace / Clear. Write via:

```bash
- Native query translated: `gsd_run query config-set agent_skills.<slug> "<skill-a,skill-b,skill-c>"` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
```

After each update, return to the "Agent skills mapping — what next?" question.
Loop until "Done".
</step>

<step name="confirm">
Display the masked confirmation table. **No plaintext API keys appear in this
output under any circumstance.**

- Source translation truncated here; use the bridge command output, workflow runbook, installed contracts, or operation plan for continuation.

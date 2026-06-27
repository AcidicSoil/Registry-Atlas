# Bridge Workflow: docs-update

<!-- generated-by: pnpm gen:bridge-commands -->

## Purpose

This bridge workflow runbook translates the actual GSD-core workflow information and adapts it for Serena bridge operation. Read it when operating `gsd-workflow-docs-update` in a target project.

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

- Contract ID: `gsd-workflow-docs-update`
- Status: `planned`
- Source path: `gsd-core/workflows/docs-update.md`
- Resolved source path: `vendor/reference/gsd-core/gsd-core/workflows/docs-update.md`
- Mirrored runbook path: `.agents/gsd-serena/workflows/docs-update.md`

## Translated GSD Workflow

### Native Shim Translation
- Native GSD shim locator omitted: the bridge uses the installed `gsd-serena-bridge` CLI, `bootstrap`, `doctor`, `repair`, resolver packets, and install-managed project surfaces instead of locating `gsd-tools.cjs`.
<purpose>
Generate, update, and verify all project documentation — both canonical doc types and existing hand-written docs. The orchestrator detects the project's doc structure, assembles a work manifest tracking every item, dispatches parallel doc-writer and doc-ver...
</purpose>

<available_agent_types>
Valid GSD subagent types (use exact names — do not fall back to 'general-purpose'):
- gsd-doc-writer — Writes and updates project documentation files
- gsd-doc-verifier — Verifies factual claims in docs against the live codebase
</available_agent_types>

<process>

<step name="init_context" priority="first">
Load docs-update context:

```bash
- Native query translated: `INIT=$(gsd_run query docs-init)` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
- Native query translated: `AGENT_SKILLS=$(gsd_run query agent-skills gsd-doc-writer)` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
```

Extract from init JSON:
- `doc_writer_model` — model string to pass to each spawned agent (never hardcode a model name)
- `commit_docs` — whether to commit generated files when done
- `existing_docs` — array of `{path, has_gsd_marker}` objects for existing Markdown files
- `project_type` — object with boolean signals: `has_package_json`, `has_api_routes`, `has_cli_bin`, `is_open_source`, `has_deploy_config`, `is_monorepo`, `has_tests`
- `doc_tooling` — object with booleans: `docusaurus`, `vitepress`, `mkdocs`, `storybook`
- `monorepo_workspaces` — array of workspace glob patterns (empty if not a monorepo)
- `project_root` — absolute path to the project root
</step>

<step name="classify_project">
Map the `project_type` boolean signals from the init JSON to a primary type label and collect conditional doc signals.

**Primary type classification (first match wins):**

| Condition | primary_type |
|-----------|-------------|
| `is_monorepo` is true | `"monorepo"` |
| `has_cli_bin` is true AND `has_api_routes` is false | `"cli-tool"` |
| `has_api_routes` is true AND `is_open_source` is false | `"saas"` |
| `is_open_source` is true AND `has_api_routes` is false | `"open-source-library"` |
| (none of the above) | `"generic"` |

**Conditional doc signals (D-02 union rule — check independently after primary classification):**

After determining primary_type, check each signal independently regardless of the primary type. A CLI tool that is also open source with API routes still gets all three conditional docs.

| Signal | Conditional Doc |
|--------|----------------|
| `has_api_routes` is true | Queue API.md |
| `is_open_source` is true | Queue CONTRIBUTING.md |
| `has_deploy_config` is true | Queue DEPLOYMENT.md |

Present the classification result:
```
Project type: {primary_type}
Conditional docs queued: {list or "none"}
```
</step>

<step name="build_doc_queue">
Assemble the complete doc queue from always-on docs plus conditional docs from classify_project.

**Always-on docs (queued for every project, no exceptions):**
1. README
2. ARCHITECTURE
3. GETTING-STARTED
4. DEVELOPMENT
5. TESTING
6. CONFIGURATION

**Conditional docs (add only if signal matched in classify_project):**
- API (if `has_api_routes`)
- CONTRIBUTING (if `is_open_source`)
- DEPLOYMENT (if `has_deploy_config`)

**IMPORTANT: CHANGELOG.md is NEVER queued. The doc queue is built exclusively from the 9 known doc types listed above. Do not derive the queue from `existing_docs` directly — existing_docs is only used in the next step to determine create vs update mode.**

**Doc queue limit:** Maximum 9 docs. Always-on (6) + up to 3 conditional = at most 9.

**CONTRIBUTING.md confirmation (new file only):**

If CONTRIBUTING.md is in the conditional queue AND does NOT appear in the `existing_docs` array from init JSON:

1. If `--force` is present in `$ARGUMENTS`: skip this check, include CONTRIBUTING.md in the queue.

**Text mode (`workflow.text_mode: true` in config or `--text` flag):** Set `TEXT_MODE=true` if `--text` is present in `$ARGUMENTS` OR `text_mode` from init JSON is `true`. When TEXT_MODE is active, replace every `AskUserQuestion` call with a plain-text numb...
2. Otherwise, use AskUserQuestion to confirm:

```
AskUserQuestion([{
question: "This project appears to be open source (LICENSE file detected). CONTRIBUTING.md does not exist yet. Would you like to create one?",
header: "Contributing",
multiSelect: false,
options: [
{ label: "Yes, create it", description: "Generate CONTRIBUTING.md with project guidelines" },
{ label: "No, skip it", description: "This project does not need a CONTRIBUTING.md" }
]
}])
```

If the user selects "No, skip it": remove CONTRIBUTING.md from the doc queue.
If CONTRIBUTING.md already exists in `existing_docs`: skip this prompt entirely, include it for update.

**Existing non-canonical docs (review queue):**

After assembling the canonical doc queue above, scan the `existing_docs` array from init JSON for files that do NOT match any canonical path in the queue (neither primary nor fallback path from the resolve_modes table). These are hand-written docs like `doc...

For each non-canonical existing doc found:
- Add to a separate `review_queue`
- These will be passed to gsd-doc-verifier in the verify_docs step for accuracy checking
- If inaccuracies are found, they will be dispatched to gsd-doc-writer in `fix` mode for surgical corrections

If non-canonical docs are found, display them in the queue presentation:

```
Existing docs queued for accuracy review:
- docs/api/endpoint-map.md (hand-written)
- docs/api/README.md (hand-written)
- docs/frontend/pages/not-found.md (hand-written)
```

If none found, omit this section from the queue presentation.

**Documentation gap detection (missing non-canonical docs):**

After assembling the canonical and review queues, analyze the codebase to identify areas that should have documentation but don't. This ensures the command creates complete project documentation, not just the 9 canonical types.

1. **Scan the codebase for undocumented areas:**
- Use Glob/Grep to discover significant source directories (e.g., `src/components/`, `src/pages/`, `src/services/`, `src/api/`, `lib/`, `routes/`)
- Compare against existing docs: for each major source directory, check if corresponding documentation exists in the docs tree
- Look at the project's existing doc structure for patterns — if the project has `docs/frontend/components/`, `docs/services/`, etc., these indicate the project's documentation conventions

2. **Identify gaps based on project conventions:**
- If the project has a `docs/` directory with grouped subdirectories, each source module area that has a corresponding docs subdirectory but is missing documentation files represents a gap
- If the project has frontend components/pages but no component docs, flag this
- If the project has service modules but no service docs, flag this
- Skip areas that are already covered by canonical docs (e.g., don't flag missing API docs if `docs/API.md` is already in the canonical queue)

3. **Present discovered gaps to the user:**

```
AskUserQuestion([{
question: "Found {N} documentation gaps in the codebase. Which should be created?",
header: "Doc gaps",
multiSelect: true,
options: [
{ label: "{area}", description: "{why it needs docs — e.g., '5 components in src/components/ with no docs'}" },
...up to 4 options (group related gaps if more than 4)
]
}])
```

4. For each gap the user selects:
- Add to the generation queue with mode = `"create"`
- Set the output path to match the project's existing doc directory structure
- The gsd-doc-writer will receive a `doc_assignment` with `type: "custom"` and a description of what to document, using the project's source files as content discovery targets

If no gaps are detected, omit this section entirely.

Present the assembled queue to the user before proceeding:

Present the mode resolution table from resolve_modes (shown above), followed by:

```
{If non-canonical docs found, show as a table:}

Existing docs queued for accuracy review:

| Path | Type |
|------|------|
| {path} | hand-written |
| ... | ... |

CHANGELOG.md: excluded (out of scope)
```

The mode resolution table IS the queue presentation — it shows every doc with its resolved path, mode, and source. Do not duplicate the list in a separate format.

Then confirm with AskUserQuestion:

```
AskUserQuestion([{
question: "Doc queue assembled ({N} docs). Proceed with generation?",
header: "Doc queue",
multiSelect: false,
options: [
{ label: "Proceed", description: "Generate all {N} docs in the queue" },
{ label: "Abort", description: "Cancel doc generation" }
]
}])
```

If the user selects "Abort": exit the workflow. Otherwise continue to resolve_modes.
</step>

<step name="resolve_modes">
For each doc in the assembled queue, determine whether to create (new file) or update (existing file).

**Doc type to canonical path mapping (defaults):**

| Type | Default Path | Fallback Path |
|------|-------------|---------------|
| `readme` | `README.md` | — |
| `architecture` | `docs/ARCHITECTURE.md` | `ARCHITECTURE.md` |
| `getting_started` | `docs/GETTING-STARTED.md` | `GETTING-STARTED.md` |
| `development` | `docs/DEVELOPMENT.md` | `DEVELOPMENT.md` |
| `testing` | `docs/TESTING.md` | `TESTING.md` |
| `api` | `docs/API.md` | `API.md` |
| `configuration` | `docs/CONFIGURATION.md` | `CONFIGURATION.md` |
| `deployment` | `docs/DEPLOYMENT.md` | `DEPLOYMENT.md` |
| `contributing` | `CONTRIBUTING.md` | — |

**Structure-aware path resolution:**

Before applying the default path table, inspect the project's existing docs directory structure to detect whether the project uses **grouped subdirectories** or **flat files**. This determines how ALL new docs are placed.

**Step 1: Detect the project's docs organization pattern.**

List subdirectories under `docs/` from the `existing_docs` paths. If the project has 2+ subdirectories (e.g., `docs/architecture/`, `docs/api/`, `docs/guides/`, `docs/frontend/`), the project uses a **grouped structure**. If docs are only flat files directl...

**Step 2: Resolve paths based on the detected pattern.**

**If GROUPED structure detected:**

Every doc type MUST be placed in an appropriate subdirectory — no doc should be left flat in `docs/` when the project organizes into groups. Use the following resolution logic:

| Type | Subdirectory resolution (in priority order) |
|------|----------------------------------------------|
| `architecture` | existing `docs/architecture/` → create `docs/architecture/` if not present |
| `getting_started` | existing `docs/guides/` → existing `docs/getting-started/` → create `docs/guides/` |
| `development` | existing `docs/guides/` → existing `docs/development/` → create `docs/guides/` |
| `testing` | existing `docs/testing/` → existing `docs/guides/` → create `docs/testing/` |
| `api` | existing `docs/api/` → create `docs/api/` if not present |
| `configuration` | existing `docs/configuration/` → existing `docs/guides/` → create `docs/configuration/` |
| `deployment` | existing `docs/deployment/` → existing `docs/guides/` → create `docs/deployment/` |

For each type, check the resolution chain left-to-right. Use the first existing subdirectory. If none exist, create the rightmost option.

The filename within the subdirectory should be contextual — e.g., `docs/guides/getting-started.md`, `docs/architecture/overview.md`, `docs/api/reference.md` — rather than `docs/architecture/ARCHITECTURE.md`. Match the naming style of existing files in that ...

**If FLAT structure detected (or no docs/ directory):**

Use the default path table above as-is (e.g., `docs/ARCHITECTURE.md`, `docs/TESTING.md`).

**Step 3: Store each resolved path and create directories.**

For each doc type, store the resolved path as `resolved_path`. Then create all necessary directories:
```bash
mkdir -p {each unique directory from resolved paths}
```

**Mode resolution logic:**

For each doc type in the queue:
1. Check if the `resolved_path` appears in the `existing_docs` array from the init JSON
2. If not found at resolved path, check the default and fallback paths from the table
3. If found at any path: mode = `"update"` — use the Read tool to load the current file content (will be passed as `existing_content` in the doc_assignment block). Use the found path as the output path (do not move existing docs).
4. If not found: mode = `"create"` — no existing content to load. Use the `resolved_path`.

**Ensure docs/ directory exists:**
Before proceeding to the next step, create the `docs/` directory and any resolved subdirectories if they do not exist:
```bash
mkdir -p docs/
```

**Output a mode resolution table:**

Present a table showing the resolved path, mode, and source for every doc in the queue:

```
Mode resolution:

| Doc | Resolved Path | Mode | Source |
|-----|---------------|------|--------|
| readme | README.md | update | found at README.md |
| architecture | docs/architecture/overview.md | create | new directory |
| getting_started | docs/guides/getting-started.md | update | found, hand-written |
| development | docs/guides/development.md | create | matched docs/guides/ |
| testing | docs/guides/testing.md | create | matched docs/guides/ |
| configuration | docs/guides/configuration.md | create | matched docs/guides/ |
| api | docs/api/reference.md | create | new directory |
| deployment | docs/guides/deployment.md | update | found, hand-written |
```

This table MUST be shown to the user — it is the primary confirmation of where files will be written and whether existing files will be updated. It appears as part of the queue presentation BEFORE the AskUserQuestion confirmation.

Track the resolved mode and file path for each queued doc. For update-mode docs, store the loaded file content — it will be passed to the agent in the next steps.

**CRITICAL: Persist the work manifest.**

After resolve_modes completes, write ALL work items to `.planning/tmp/docs-work-manifest.json`. This is the single source of truth for every subsequent step — the orchestrator MUST read this file at each step instead of relying on memory.

```bash
mkdir -p .planning/tmp

- Source translation truncated here; use the bridge command output, workflow runbook, installed contracts, or operation plan for continuation.

# Bridge Workflow: ingest-docs

<!-- generated-by: pnpm gen:bridge-commands -->

## Purpose

This bridge workflow runbook translates the actual GSD-core workflow information and adapts it for Serena bridge operation. Read it when operating `gsd-workflow-ingest-docs` in a target project.

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

- Contract ID: `gsd-workflow-ingest-docs`
- Status: `planned`
- Source path: `gsd-core/workflows/ingest-docs.md`
- Resolved source path: `vendor/reference/gsd-core/gsd-core/workflows/ingest-docs.md`
- Mirrored runbook path: `.agents/gsd-serena/workflows/ingest-docs.md`

## Translated GSD Workflow

### Native Shim Translation
- Native GSD shim locator omitted: the bridge uses the installed `gsd-serena-bridge` CLI, `bootstrap`, `doctor`, `repair`, resolver packets, and install-managed project surfaces instead of locating `gsd-tools.cjs`.
# Ingest Docs Workflow

Scan a repo for mixed planning documents (ADR, PRD, SPEC, DOC), synthesize them into a consolidated context, and bootstrap or merge into `.planning/`.

- `[path]` — optional target directory to scan (defaults to repo root)
- `--mode new|merge` — override auto-detect (defaults: `new` if `.planning/` absent, `merge` if present)
- `--manifest <file>` — YAML file listing `{path, type, precedence?}` per doc; overrides heuristic classification
- `--resolve auto|interactive` — conflict resolution (v1: only `auto` is supported; `interactive` is reserved)

---

<step name="banner">

Display the stage banner:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GSD ► INGEST DOCS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

</step>

<step name="parse_arguments">

Parse `$ARGUMENTS`:

- First positional token (if not a flag) → `SCAN_PATH` (default: `.`)
- `--mode new|merge` → `MODE` (default: auto-detect)
- `--manifest <file>` → `MANIFEST_PATH` (optional)
- `--resolve auto|interactive` → `RESOLVE_MODE` (default: `auto`; reject `interactive` in v1 with message "interactive resolution is planned for a future release")

**Validate paths:**

```bash
case "{SCAN_PATH}" in *..*) echo "SECURITY_ERROR: path contains traversal sequence"; exit 1 ;; esac
test -d "{SCAN_PATH}" || echo "PATH_NOT_FOUND"
if [ -n "{MANIFEST_PATH}" ]; then
case "{MANIFEST_PATH}" in *..*) echo "SECURITY_ERROR: manifest path contains traversal"; exit 1 ;; esac
test -f "{MANIFEST_PATH}" || echo "MANIFEST_NOT_FOUND"
fi
```

**Containment (required):** After resolving `SCAN_PATH` and `MANIFEST_PATH` relative to the repo root, canonicalize each with `realpath` (or platform equivalent) and assert the result is under `realpath("$REPO_ROOT")`. Reject absolute paths outside the repo...

If `PATH_NOT_FOUND` or `MANIFEST_NOT_FOUND`: display error and exit.

</step>

<step name="init_and_mode_detect">

Run the init query:

```bash
INIT=$(gsd_run init ingest-docs)
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

Parse `project_exists`, `planning_exists`, `has_git`, `git_worktree_root`, `in_nested_subdir`, `project_path` from INIT.

**Auto-detect MODE** if not set:
- `planning_exists: true` → `MODE=merge`
- `planning_exists: false` → `MODE=new`

If user passed `--mode new` but `.planning/` already exists: display warning and require explicit confirm via `AskUserQuestion` (approve-revise-abort from `references/gate-prompts.md`) before overwriting.

Git initialisation (Bug #3491 — never create a nested `.git` inside an existing worktree):

- If `has_git: true` and `in_nested_subdir: true`: do NOT run `git init`. Surface a warning that planning files will be tracked by the outer repo at `git_worktree_root`.
- If `has_git: true` and `in_nested_subdir: false`: already at a worktree root, skip `git init`.
- If `has_git: false` and `MODE=new`: initialize git:

```bash
git init
```

**Detect runtime** using the same pattern as `new-project.md`:
- execution_context path `/.codex/` → `RUNTIME=codex`
- `/.gemini/` → `RUNTIME=gemini`
- `/.opencode/` or `/.config/opencode/` → `RUNTIME=opencode`
- else → `RUNTIME=claude`

Fall back to env vars (`CODEX_HOME`, `GEMINI_CONFIG_DIR`, `OPENCODE_CONFIG_DIR`) if execution_context is unavailable.

</step>

<step name="discover_docs">

Build the doc list from three sources, in order:

**1. Manifest (if provided)** — authoritative:

Read `MANIFEST_PATH`. Expected YAML shape:

```yaml
docs:
- path: docs/adr/0001-db.md
type: ADR
precedence: 0   # optional, lower = higher precedence
- path: docs/prd/auth.md
type: PRD
```

Each entry provides `path` (required, relative to repo root) + `type` (required, one of ADR|PRD|SPEC|DOC) + `precedence` (optional integer).

**2. Directory conventions** (skipped when manifest is provided):

```bash
# ADRs
find {SCAN_PATH} -type f \( -path '*/adr/*' -o -path '*/adrs/*' -o -name 'ADR-*.md' -o -regex '.*/[0-9]\{4\}-.*\.md' \) 2>/dev/null

# PRDs
find {SCAN_PATH} -type f \( -path '*/prd/*' -o -path '*/prds/*' -o -name 'PRD-*.md' \) 2>/dev/null

# SPECs / RFCs
find {SCAN_PATH} -type f \( -path '*/spec/*' -o -path '*/specs/*' -o -path '*/rfc/*' -o -path '*/rfcs/*' -o -name 'SPEC-*.md' -o -name 'RFC-*.md' \) 2>/dev/null

# Generic docs (fall-through candidates)
find {SCAN_PATH} -type f -path '*/docs/*' -name '*.md' 2>/dev/null
```

De-duplicate the union (a file matched by multiple patterns is one doc).

**3. Content heuristics** (run during classification, not here) — the classifier handles frontmatter `type:` and H1 inspection for docs that didn't match a convention.

**Cap:** hard limit of 50 docs per invocation (documented v1 constraint). If the discovered set exceeds 50:

```
GSD > Discovered {N} docs, which exceeds the v1 cap of 50.
Use --manifest to narrow the set to ≤ 50 files, or run
`gsd-serena-bridge ingest-docs --format markdown` again with a narrower <path>.
```

Exit without proceeding.

**Display discovered set** and request approval (see `references/gate-prompts.md` — `yes-no-pick` pattern works; or `approve-revise-abort`):

```
Discovered {N} documents:
{N} ADR | {N} PRD | {N} SPEC | {N} DOC | {N} unclassified

docs/adr/0001-architecture.md       [ADR]    (from manifest|directory|heuristic)
docs/adr/0002-database.md           [ADR]    (directory)
docs/prd/auth.md                    [PRD]    (manifest)
...
```

**Text mode:** apply the same `--text`/`text_mode` rule as other workflows — replace `AskUserQuestion` with a numbered list.

Use `AskUserQuestion` (approve-revise-abort):
- question: "Proceed with classification of these {N} documents?"
- header: "Approve?"
- options: Approve | Revise | Abort

On Abort: exit cleanly with "Ingest cancelled."
On Revise: exit with guidance to re-run with `--manifest` or a narrower path.

</step>

<step name="classify_parallel">

Create staging directory:

```bash
mkdir -p .planning/intel/classifications/
```

For each discovered doc, spawn `gsd-doc-classifier` in parallel. In Claude Code, issue all Task calls in a single message with multiple tool uses so the harness runs them concurrently. For Copilot / sequential runtimes, fall back to sequential dispatch.

Per-spawn prompt fields:
- `FILEPATH` — absolute path to the doc
- `OUTPUT_DIR` — `.planning/intel/classifications/`
- `MANIFEST_TYPE` — the type from the manifest if present, else omit
- `MANIFEST_PRECEDENCE` — the precedence integer from the manifest if present, else omit
- `<required_reading>` — `agents/gsd-doc-classifier.md` (the agent definition itself)

Collect the one-line confirmations from each classifier. If any classifier errors out, surface the error and abort without touching `.planning/` further.

</step>

<step name="synthesize">

Spawn `gsd-doc-synthesizer` once (runs in a subagent — no output until it returns, ~1–5 min; expected, not a freeze):

```
- Native agent dispatch translated: `Agent({` -> use Serena role workflow / generated role skill / sequential role pass with handoff.
subagent_type: "gsd-doc-synthesizer",
prompt: "
CLASSIFICATIONS_DIR: .planning/intel/classifications/
INTEL_DIR: .planning/intel/
CONFLICTS_PATH: .planning/INGEST-CONFLICTS.md
MODE: {MODE}
EXISTING_CONTEXT: {paths to existing .planning files if MODE=merge, else empty}
PRECEDENCE: {array from manifest defaults or default ['ADR','SPEC','PRD','DOC']}

<required_reading>
- agents/gsd-doc-synthesizer.md
- gsd-core/references/doc-conflict-engine.md
</required_reading>
"
})
```

- Native agent dispatch translated: `> **ORCHESTRATOR RULE — CODEX RUNTIME**: After calling Agent() above, stop working on this task immediately. Do not read or synthesize any classified documents independently while the subagent is active. Wait for the subagent to return its result. This prevents duplicate work, conflicting edits, and wasted context. Only resume when the subagent result is available.` -> use Serena role workflow / generated role skill / sequential role pass with handoff.

The synthesizer writes:
- `.planning/intel/decisions.md`, `.planning/intel/requirements.md`, `.planning/intel/constraints.md`, `.planning/intel/context.md`
- `.planning/intel/SYNTHESIS.md`
- `.planning/INGEST-CONFLICTS.md`

</step>

<step name="conflict_gate">

Read `.planning/INGEST-CONFLICTS.md`. Count entries in each bucket (the synthesizer always writes the three-bucket header; parse the `### BLOCKERS ({N})`, `### WARNINGS ({N})`, `### INFO ({N})` lines).

Apply the safety semantics from `references/doc-conflict-engine.md`. Operation noun: `ingest`.

**If BLOCKERS > 0:**

Render the report to the user, then display:

```
GSD > BLOCKED: {N} blockers must be resolved before ingest can proceed.
```

Exit WITHOUT writing PROJECT.md, REQUIREMENTS.md, ROADMAP.md, or STATE.md. The staging intel files remain for inspection. The safety gate holds — no destination files are written when blockers exist.

**If WARNINGS > 0 and BLOCKERS = 0:**

Render the report, then ask via AskUserQuestion (approve-revise-abort):
- question: "Review the competing variants above. Resolve manually and proceed, or abort?"
- header: "Approve?"
- options: Approve | Abort

On Abort: exit cleanly with "Ingest cancelled. Staged intel preserved at `.planning/intel/`."

**If BLOCKERS = 0 and WARNINGS = 0:**

Proceed to routing silently, or optionally display `GSD > No conflicts. Auto-resolved: {N}.`

</step>

<step name="route_new_mode">

**Applies only when MODE=new.**

Audit PROJECT.md field requirements that `gsd-roadmapper` expects. For fields derivable from `.planning/intel/SYNTHESIS.md` (project scope, goals/non-goals, constraints, locked decisions), synthesize from the intel. For fields NOT derivable (project name, d...

Delegate to `gsd-roadmapper` (runs in a subagent — no output until it returns, ~1–5 min; expected, not a freeze):

```
- Native agent dispatch translated: `Agent({` -> use Serena role workflow / generated role skill / sequential role pass with handoff.
subagent_type: "gsd-roadmapper",
prompt: "
Mode: new-project-from-ingest
Intel: .planning/intel/SYNTHESIS.md (entry point)
Per-type intel: .planning/intel/{decisions,requirements,constraints,context}.md
User-supplied fields: {collected in previous step}

Produce:
- .planning/PROJECT.md
- .planning/REQUIREMENTS.md
- .planning/ROADMAP.md
- .planning/STATE.md

Treat ADR-locked decisions as locked in PROJECT.md <decisions> blocks.
"
})
```

- Native agent dispatch translated: `> **ORCHESTRATOR RULE — CODEX RUNTIME**: After calling Agent() above, stop working on this task immediately. Do not read more intel files, write planning artifacts, or create ROADMAP.md independently while the subagent is active. Wait for the subagent to return its result. This prevents duplicate work, conflicting edits, and wasted context. Only resume when the subagent result is available.` -> use Serena role workflow / generated role skill / sequential role pass with handoff.

</step>

<step name="route_merge_mode">

**Applies only when MODE=merge.**

Load existing `.planning/ROADMAP.md`, `.planning/PROJECT.md`, `.planning/REQUIREMENTS.md`, all `CONTEXT.md` files under `.planning/phases/`.

The synthesizer has already hard-blocked on any LOCKED-in-ingest vs LOCKED-in-existing contradiction; if we reach this step, no such blockers remain.

Plan the merge:
- **New requirements** from synthesized `.planning/intel/requirements.md` that do not overlap existing REQUIREMENTS.md entries → append to REQUIREMENTS.md
- **New decisions** from synthesized `.planning/intel/decisions.md` that do not overlap existing CONTEXT.md `<decisions>` blocks → write to a new phase's CONTEXT.md or append to the next milestone's requirements
- **New scope** → derive phase additions following the `new-milestone.md` pattern; append phases to `.planning/ROADMAP.md`

Preview the merge diff to the user and gate via approve-revise-abort before writing.

</step>

<step name="finalize">

Commit the ingest results:

```bash
gsd_run commit \
"docs: ingest {N} docs from {SCAN_PATH} (#2387)" --files \
.planning/PROJECT.md \
.planning/REQUIREMENTS.md \
.planning/ROADMAP.md \
.planning/STATE.md \
.planning/intel/ \
.planning/INGEST-CONFLICTS.md
```

(For merge mode, substitute the actual set of modified files.)

Display completion:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GSD ► INGEST DOCS COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Show:
- Mode ran (new or merge)
- Docs ingested (count + type breakdown)

- Source translation truncated here; use the bridge command output, workflow runbook, installed contracts, or operation plan for continuation.

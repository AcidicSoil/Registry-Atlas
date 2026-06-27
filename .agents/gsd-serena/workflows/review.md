# Bridge Workflow: review

<!-- generated-by: pnpm gen:bridge-commands -->

## Purpose

This bridge workflow runbook translates the actual GSD-core workflow information and adapts it for Serena bridge operation. Read it when operating `gsd-workflow-review` in a target project.

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

- Contract ID: `gsd-workflow-review`
- Status: `planned`
- Source path: `gsd-core/workflows/review.md`
- Resolved source path: `vendor/reference/gsd-core/gsd-core/workflows/review.md`
- Mirrored runbook path: `.agents/gsd-serena/workflows/review.md`

## Translated GSD Workflow

### Native Shim Translation
- Native GSD shim locator omitted: the bridge uses the installed `gsd-serena-bridge` CLI, `bootstrap`, `doctor`, `repair`, resolver packets, and install-managed project surfaces instead of locating `gsd-tools.cjs`.
<purpose>
Cross-AI peer review — invoke external AI CLIs to independently review phase plans.
Each CLI gets the same prompt (PROJECT.md context, phase plans, requirements) and
produces structured feedback. Results are combined into REVIEWS.md for the planner
to incorporate via --reviews flag.

This implements adversarial review: different AI models catch different blind spots.
A plan that survives review from 2-3 independent AI systems is more robust.
</purpose>

<process>

<step name="detect_clis">
Check which AI CLIs are available on the system:

```bash
# Check each CLI
command -v gemini >/dev/null 2>&1 && echo "gemini:available" || echo "gemini:missing"
command -v claude >/dev/null 2>&1 && echo "claude:available" || echo "claude:missing"
command -v codex >/dev/null 2>&1 && echo "codex:available" || echo "codex:missing"
command -v coderabbit >/dev/null 2>&1 && echo "coderabbit:available" || echo "coderabbit:missing"
command -v opencode >/dev/null 2>&1 && echo "opencode:available" || echo "opencode:missing"
command -v qwen >/dev/null 2>&1 && echo "qwen:available" || echo "qwen:missing"
command -v cursor-agent >/dev/null 2>&1 && echo "cursor:available" || echo "cursor:missing"
command -v agy >/dev/null 2>&1 && echo "antigravity:available" || echo "antigravity:missing"

# Check local model servers (OpenAI-compatible HTTP API — no CLI binary required)
- Native query translated: `OLLAMA_HOST=$(gsd_run query config-get review.ollama_host 2>/dev/null | jq -r '.' 2>/dev/null || echo "")` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
if [ -z "$OLLAMA_HOST" ] || [ "$OLLAMA_HOST" = "null" ]; then OLLAMA_HOST="http://localhost:11434"; fi
curl -s --max-time 2 "${OLLAMA_HOST}/v1/models" >/dev/null 2>&1 && echo "ollama:available" || echo "ollama:missing"

- Native query translated: `LM_STUDIO_HOST=$(gsd_run query config-get review.lm_studio_host 2>/dev/null | jq -r '.' 2>/dev/null || echo "")` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
if [ -z "$LM_STUDIO_HOST" ] || [ "$LM_STUDIO_HOST" = "null" ]; then LM_STUDIO_HOST="http://localhost:1234"; fi
curl -s --max-time 2 "${LM_STUDIO_HOST}/v1/models" >/dev/null 2>&1 && echo "lm_studio:available" || echo "lm_studio:missing"

- Native query translated: `LLAMA_CPP_HOST=$(gsd_run query config-get review.llama_cpp_host 2>/dev/null | jq -r '.' 2>/dev/null || echo "")` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
if [ -z "$LLAMA_CPP_HOST" ] || [ "$LLAMA_CPP_HOST" = "null" ]; then LLAMA_CPP_HOST="http://localhost:8080"; fi
curl -s --max-time 2 "${LLAMA_CPP_HOST}/v1/models" >/dev/null 2>&1 && echo "llama_cpp:available" || echo "llama_cpp:missing"
```

Parse flags from `$ARGUMENTS`:
- `--gemini` → include Gemini
- `--claude` → include Claude
- `--codex` → include Codex
- `--coderabbit` → include CodeRabbit
- `--opencode` → include OpenCode
- `--qwen` → include Qwen Code
- `--cursor` → include Cursor
- `--agy` or `--antigravity` → include Antigravity CLI
- `--ollama` → include Ollama (local server, OpenAI-compatible)
- `--lm-studio` → include LM Studio (local server, OpenAI-compatible)
- `--llama-cpp` → include llama.cpp (local server, OpenAI-compatible)
- `--all` → include all available (CLIs + running local servers)
- No flags → if `review.default_reviewers` is set, include only configured reviewers that are detected; otherwise include all available

Reviewer-selection precedence:
1. Individual reviewer flags (`--gemini`, `--codex`, etc.)
2. `--all`
3. `review.default_reviewers`
4. No key + no flags → all detected reviewers

`review.default_reviewers` behavior:
- Value must be a non-empty array of slug strings (configured via `gsd config-set review.default_reviewers '["gemini","codex"]'`)
- Unknown slugs warn and are ignored
- Known-but-undetected slugs emit an info note and are ignored
- If all configured reviewers are unavailable, fail with an actionable message

If no CLIs are available:
```
No external AI CLIs found. Install at least one:
- gemini: https://github.com/google-gemini/gemini-cli
- codex: https://github.com/openai/codex
- claude: https://github.com/anthropics/claude-code
- opencode: https://opencode.ai (leverages GitHub Copilot subscription models)
- qwen: https://github.com/nicepkg/qwen-code (Alibaba Qwen models)
- cursor: https://cursor.com (Cursor IDE agent mode)
- agy: curl -fsSL https://antigravity.google/cli/install.sh | bash (Antigravity CLI — free with Google credentials)

Then run `gsd-serena-bridge review --format markdown` again.
```
Exit.

Determine which CLI to skip based on the current runtime environment:

```bash
# Environment-based runtime detection (priority order)
if [ "$ANTIGRAVITY_AGENT" = "1" ]; then
# Antigravity is a separate client — all CLIs are external, skip none
SELF_CLI="none"
elif [ -n "$CURSOR_SESSION_ID" ]; then
# Running inside Cursor agent — skip cursor for independence
SELF_CLI="cursor"
elif [ -n "$CLAUDE_CODE_ENTRYPOINT" ]; then
# Running inside Claude Code CLI — skip claude for independence
SELF_CLI="claude"
else
# Other environments (Gemini CLI, Codex CLI, etc.)
# Fall back to AI self-identification to decide which CLI to skip
SELF_CLI="auto"
fi
```

Rules:
- If `SELF_CLI="none"` → invoke ALL available CLIs (no skip)
- If `SELF_CLI="claude"` → skip claude, use gemini/codex
- If `SELF_CLI="auto"` → the executing AI identifies itself and skips its own CLI
- At least one DIFFERENT CLI must be available for the review to proceed.
</step>

<step name="gather_context">
Collect phase artifacts for the review prompt:

```bash
- Native query translated: `INIT=$(gsd_run query init.phase-op "${PHASE_ARG}")` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

Read from init: `phase_dir`, `phase_number`, `padded_phase`.

Then read:
1. `.planning/PROJECT.md` (first 80 lines — project context)
2. Phase section from `.planning/ROADMAP.md`
3. All `*-PLAN.md` files in the phase directory
4. `*-CONTEXT.md` if present (user decisions)
5. `*-RESEARCH.md` if present (domain research)
6. `.planning/REQUIREMENTS.md` (requirements this phase addresses)
</step>

<step name="build_prompt">
Build a structured review prompt:

```markdown
# Cross-AI Plan Review Request

You are reviewing implementation plans for a software project phase.
Provide structured feedback on plan quality, completeness, and risks.

## Project Context
{first 80 lines of PROJECT.md}

## Phase {N}: {phase name}
### Roadmap Section
{roadmap phase section}

### Requirements Addressed
{requirements for this phase}

### User Decisions (CONTEXT.md)
{context if present}

### Research Findings
{research if present}

### Plans to Review
{all PLAN.md contents}

## Review Instructions

**Verify against source — do not review the plan text in isolation.** You are running inside the project's git working tree (the current directory). The plans reference real files, migrations, routes, and tests that exist in this repo now.
1. Open the referenced files and check each claim against the actual code.
2. For every strength or concern, cite concrete `path/to/file:line` evidence plus the mechanism.
3. When a plan asserts a mechanism works (a guard, a query filter, a test that exercises a path), trace whether it actually does what is claimed — do not take the plan's word for it.
4. If you cannot read the repo (no file access), say so and downgrade that finding to an open question rather than asserting it.

Findings citing `file:line` evidence are weighted far more heavily than impressionistic ones; a review that only restates the plan's own claims has low value.

Analyze each plan and provide:

1. **Summary** — One-paragraph assessment
2. **Strengths** — What's well-designed (bullet points)
3. **Concerns** — Potential issues, gaps, risks (bullet points with severity: HIGH/MEDIUM/LOW)
4. **Suggestions** — Specific improvements (bullet points)
5. **Risk Assessment** — Overall risk level (LOW/MEDIUM/HIGH) with justification

Focus on:
- Missing edge cases or error handling
- Dependency ordering issues
- Scope creep or over-engineering
- Security considerations
- Performance implications
- Whether the plans actually achieve the phase goals

Output your review in markdown format.
```

Write to a temp file: `/tmp/gsd-review-prompt-{phase}.md`

Also write individual section files so the budget tool can re-trim per reviewer:

```bash
# Write individual section files for per-reviewer budget trimming
# These are always written so reviewers with a budget can invoke prompt-budget
cp "$INSTRUCTIONS_BLOCK_FILE" "/tmp/gsd-review-${PHASE}-instructions.md"
cp "$ROADMAP_SECTION_FILE" "/tmp/gsd-review-${PHASE}-roadmap.md"

# Plan files: copy each PLAN.md to a predictable numbered path
PLAN_INDEX=0
for PLAN_FILE in "${PHASE_DIR}"/*-PLAN.md; do
PADDED_IDX=$(printf '%02d' "$PLAN_INDEX")
cp "$PLAN_FILE" "/tmp/gsd-review-${PHASE}-plan-${PADDED_IDX}.md"
PLAN_INDEX=$((PLAN_INDEX + 1))
done

# Optional section files (only if content was included in the combined prompt)
if [ -f ".planning/PROJECT.md" ]; then
cp .planning/PROJECT.md "/tmp/gsd-review-${PHASE}-project.md"
fi
if ls "${PHASE_DIR}/"*"-CONTEXT.md" >/dev/null 2>&1; then
cat "${PHASE_DIR}/"*"-CONTEXT.md" > "/tmp/gsd-review-${PHASE}-context.md"
fi
if ls "${PHASE_DIR}/"*"-RESEARCH.md" >/dev/null 2>&1; then
cat "${PHASE_DIR}/"*"-RESEARCH.md" > "/tmp/gsd-review-${PHASE}-research.md"
fi
if [ -f ".planning/REQUIREMENTS.md" ]; then
cp .planning/REQUIREMENTS.md "/tmp/gsd-review-${PHASE}-requirements.md"
fi
```

Note: The variable names above (`INSTRUCTIONS_BLOCK_FILE`, `ROADMAP_SECTION_FILE`, `PHASE_DIR`, `PHASE`) reference the variables already established during prompt assembly. In practice the AI implementing this step writes the instruction and roadmap blocks ...
</step>

<step name="invoke_reviewers">
Read model preferences from planning config. Null/missing values fall back to CLI defaults.

```bash
# JSON scalars from gsd-tools.cjs query; use jq -r to strip JSON string quotes (install jq if missing)
- Native query translated: `GEMINI_MODEL=$(gsd_run query config-get review.models.gemini 2>/dev/null | jq -r '.' 2>/dev/null || true)` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
- Native query translated: `CLAUDE_MODEL=$(gsd_run query config-get review.models.claude 2>/dev/null | jq -r '.' 2>/dev/null || true)` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
- Native query translated: `CODEX_MODEL=$(gsd_run query config-get review.models.codex 2>/dev/null | jq -r '.' 2>/dev/null || true)` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
- Native query translated: `OPENCODE_MODEL=$(gsd_run query config-get review.models.opencode 2>/dev/null | jq -r '.' 2>/dev/null || true)` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
# review.models.agy is reserved for future model-pinning support; agy selects its model internally
- Native query translated: `AGY_MODEL=$(gsd_run query config-get review.models.agy 2>/dev/null | jq -r '.' 2>/dev/null || true)` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.

# #1115: `--dangerously-bypass-hook-trust` only exists on codex-cli >= 0.137.0.
# Capability-probe it so older installs don't fail with "unexpected argument"
# (which, with stderr suppressed, produced a silent empty review). The codex
# invocation works fine without the flag on older versions.
if codex exec --help 2>/dev/null | grep -q -- '--dangerously-bypass-hook-trust'; then
CODEX_BYPASS_FLAG="--dangerously-bypass-hook-trust"
else
CODEX_BYPASS_FLAG=""
fi
```

For each selected CLI, invoke in sequence (not parallel — avoid rate limits):

**Gemini:**
```bash
if [ -n "$GEMINI_MODEL" ] && [ "$GEMINI_MODEL" != "null" ]; then
cat /tmp/gsd-review-prompt-{phase}.md | gemini -m "$GEMINI_MODEL" -p - 2>/dev/null > /tmp/gsd-review-gemini-{phase}.md
else
cat /tmp/gsd-review-prompt-{phase}.md | gemini -p - 2>/dev/null > /tmp/gsd-review-gemini-{phase}.md
fi
```

**Claude (separate session):**
```bash
if [ -n "$CLAUDE_MODEL" ] && [ "$CLAUDE_MODEL" != "null" ]; then
cat /tmp/gsd-review-prompt-{phase}.md | claude --model "$CLAUDE_MODEL" -p - 2>/dev/null > /tmp/gsd-review-claude-{phase}.md
else
cat /tmp/gsd-review-prompt-{phase}.md | claude -p - 2>/dev/null > /tmp/gsd-review-claude-{phase}.md
fi
```

**Codex:**
```bash
# $CODEX_BYPASS_FLAG is capability-gated above (#1115). Capture stderr to a .err
# file (not /dev/null) so a non-zero exit — e.g. a flag the installed codex-cli

- Source translation truncated here; use the bridge command output, workflow runbook, installed contracts, or operation plan for continuation.

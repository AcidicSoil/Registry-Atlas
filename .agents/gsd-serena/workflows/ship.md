# Bridge Workflow: ship

<!-- generated-by: pnpm gen:bridge-commands -->

## Purpose

This bridge workflow runbook translates the actual GSD-core workflow information and adapts it for Serena bridge operation. Read it when operating `gsd-workflow-ship` in a target project.

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

- Contract ID: `gsd-workflow-ship`
- Status: `planned`
- Source path: `gsd-core/workflows/ship.md`
- Resolved source path: `vendor/reference/gsd-core/gsd-core/workflows/ship.md`
- Mirrored runbook path: `.agents/gsd-serena/workflows/ship.md`

## Translated GSD Workflow

### Native Shim Translation
- Native GSD shim locator omitted: the bridge uses the installed `gsd-serena-bridge` CLI, `bootstrap`, `doctor`, `repair`, resolver packets, and install-managed project surfaces instead of locating `gsd-tools.cjs`.
<!-- gsd:loop-host
step: ship
points: ship:pre, ship:post
agent-roles: orchestrator
produces:
consumes: UAT.md
-->
<purpose>
Create a pull request from completed phase/milestone work, generate a rich PR body from planning artifacts, optionally run code review, and prepare for merge. Closes the plan → execute → verify → ship loop.
</purpose>

<required_reading>
Read all files referenced by the invoking prompt's execution_context before starting.
</required_reading>

<available_agent_types>
Valid GSD subagent types (use exact names — do not fall back to 'general-purpose'):
- gsd-mempalace-curator — Ship-time MemPalace curation (diary, KG mirror, cross-project tunnels, wing-scoped prune); dispatched at ship:post when the mempalace capability is enabled.
</available_agent_types>

<process>

<step name="initialize">
Parse arguments and load project state:

```bash
- Native query translated: `INIT=$(gsd_run query init.phase-op "${PHASE_ARG}")` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

Parse from init JSON: `phase_found`, `phase_dir`, `phase_number`, `phase_name`, `padded_phase`, `commit_docs`.

Also load config for branching strategy:
```bash
- Native query translated: `CONFIG=$(gsd_run query state.load)` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
```

Extract: `branching_strategy`, `branch_name`.

Detect base branch for PRs and merges:
```bash
- Native query translated: `BASE_BRANCH=$(gsd_run query git.base-branch)` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
```
</step>

<step name="preflight_checks">
Verify the work is ready to ship:

1. **Verification passed?**
```bash
- Native query translated: `VERIFICATION=$(gsd_run query verification.status "${PHASE_DIR}" 2>/dev/null)` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
STATUS=$(printf '%s' "$VERIFICATION" | jq -r '.status' 2>/dev/null || echo "")
NEXT_ACTION=$(printf '%s' "$VERIFICATION" | jq -r '.next_action' 2>/dev/null || echo "")
NEXT_COMMAND=$(printf '%s' "$VERIFICATION" | jq -r '.next_command' 2>/dev/null || echo "")
```
Only `passed` may ship. If `$STATUS` is `passed`, verification is complete — continue to the next preflight check. Any other value (including `gaps_found`, `human_needed`, `missing`, and `unknown`) blocks with `PHASE_VERIFICATION_INCOMPLETE`: present `$NEXT...

2. **Clean working tree?**
```bash
git status --short
```
If uncommitted changes exist: ask user to commit or stash first.

3. **On correct branch?**
```bash
CURRENT_BRANCH=$(git branch --show-current)
```
If on `${BASE_BRANCH}`: warn — should be on a feature branch.
If branching_strategy is `none`: offer to create a branch now.

4. **Remote configured?**
```bash
git remote -v | head -2
```
Detect `origin` remote. If no remote: error — can't create PR.

5. **`gh` CLI available?**
```bash
which gh && gh auth status 2>&1
```
If `gh` not found or not authenticated: provide setup instructions and exit.

6. **Security ship gate (capability-driven).**

Resolve active `ship:pre` gate hooks from the capability registry — the registry evaluates each hook's `when` condition, so do **not** read `workflow.security_enforcement` directly:

```bash
SHIP_PRE_HOOKS_JSON=$(gsd_run loop render-hooks ship:pre --raw)
SECURITY_FILE=$(ls "${PHASE_DIR}"/*-SECURITY.md 2>/dev/null | head -1)
```

Read the `activeHooks` array from `SHIP_PRE_HOOKS_JSON` in-context (do NOT pipe it through a shell parser).

If an active entry exists with `kind == "gate"`, `capId == "security"`, and `blocking == true`, enforce its predicate (`SECURITY.md` frontmatter `threats_open == 0`) before shipping:

- **`SECURITY_FILE` is empty** → block with `SECURITY_SHIP_GATE_NO_REVIEW`:
```
⚠ Security enforcement is enabled but no SECURITY.md exists for this phase.
Run `gsd-serena-bridge secure-phase --format markdown` {phase} and resolve findings before shipping.
```
- **`SECURITY_FILE` exists** → read its frontmatter `threats_open`. The gate passes **only** when `threats_open` is exactly `0`. For any other value — `threats_open` > 0, or a missing / non-numeric / unparsable field — **fail closed and block** with `SECURI...
```
⚠ Security ship gate: SECURITY.md does not assert threats_open == 0 (found: {threats_open|unset}).
Resolve open threats (or re-run `gsd-serena-bridge secure-phase --format markdown` {phase}) before shipping.
```

If no active security `ship:pre` gate hook is present (security enforcement off), skip this check silently.
</step>

<step name="push_branch">
Push the current branch to remote:

```bash
git push origin ${CURRENT_BRANCH} 2>&1
```

If push fails (e.g., no upstream): set upstream:
```bash
git push --set-upstream origin ${CURRENT_BRANCH} 2>&1
```

Report: "Pushed `{branch}` to origin ({commit_count} commits ahead of ${BASE_BRANCH})"
</step>

<step name="generate_pr_body">
Auto-generate a rich PR body from planning artifacts:

**1. Title:**
```
Phase {phase_number}: {phase_name}
```
Or for milestone: `Milestone {version}: {name}`

**2. Summary section:**
Read ROADMAP.md for phase goal. Read VERIFICATION.md for verification status.

```markdown
## Summary

**Phase {N}: {Name}**
**Goal:** {goal from ROADMAP.md}
**Status:** Verified ✓

{One paragraph synthesized from SUMMARY.md files — what was built}
```

**3. Changes section:**
For each SUMMARY.md in the phase directory:
```markdown
## Changes

### Plan {plan_id}: {plan_name}
{one_liner from SUMMARY.md frontmatter}

**Key files:**
{key-files.created and key-files.modified from SUMMARY.md frontmatter}
```

**4. Requirements section:**
```markdown
## Requirements Addressed

{REQ-IDs from plan frontmatter, linked to REQUIREMENTS.md descriptions}
```

**5. Testing section:**
```markdown
## Verification

- [x] Automated verification: {pass/fail from VERIFICATION.md}
- {human verification items from VERIFICATION.md, if any}
```

**6. Decisions section:**
```markdown
## Key Decisions

{Decisions from STATE.md accumulated context relevant to this phase}
```

**7. Configured project sections:**
Read append-only project-specific PRD/PR body sections from config:

```bash
- Native query translated: `CUSTOM_PR_SECTIONS=$(gsd_run query config-get ship.pr_body_sections --default '[]' 2>/dev/null || echo '[]')` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
```

`ship.pr_body_sections` is an onboarding-time extension point for teams that need extra PRD-style sections such as `User Stories & Acceptance Criteria`, `Risks & Dependencies`, `Success Metrics`, `Release Criteria`, or `Stakeholder Review & Approval`.

Use these sections for lean/agile PRD material that should travel with the PR without making the core ``gsd-serena-bridge ship --format markdown`` body configurable:

- User stories and acceptance criteria that explain the functional increment from the user's point of view.
- Definition of Done or release criteria that make the completion standard explicit.
- Risks, dependencies, stakeholder review, and traceability notes needed by regulated or approval-heavy projects.

Rules:

- Treat configured sections as append-only. They are rendered after `Key Decisions` and cannot replace, remove, or reorder the required core sections: `Summary`, `Changes`, `Requirements Addressed`, `Verification`, and `Key Decisions`.
- Each entry must have `heading` plus at least one of `source`, `template`, or `fallback`.
- `enabled` defaults to `true`; when `enabled` is `false`, skip the section without warning. This lets onboarding seed optional sections that a project can enable later.
- `source` is a fallback chain of planning artifact headings: `PLAN.md ## Risks || VERIFICATION.md ## Manual Checks`. Allowed artifacts are `ROADMAP.md`, `PLAN.md`, `SUMMARY.md`, `VERIFICATION.md`, `STATE.md`, `REQUIREMENTS.md`, and `CONTEXT.md`.
- `template` is literal Markdown with a closed token namespace only: `{phase_number}`, `{phase_name}`, `{phase_dir}`, `{base_branch}`, `{padded_phase}`.
- `fallback` is literal Markdown used when `source` finds no content and no `template` is present.
- Omit sections whose final rendered body is empty after trimming.

Example configured sections:

```json
[
{
"heading": "User Stories & Acceptance Criteria",
"enabled": true,
"source": "REQUIREMENTS.md ## User Stories || REQUIREMENTS.md ## Acceptance Criteria",
"fallback": "- Acceptance criteria are covered by the linked requirements and verification evidence."
},
{
"heading": "Risks & Dependencies",
"enabled": true,
"source": "PLAN.md ## Risks || PLAN.md ## Dependencies",
"fallback": "- No known high-risk rollout dependencies."
},
{
"heading": "Stakeholder Review & Approval",
"enabled": false,
"template": "- Product owner approval pending for {phase_name}."
}
]
```

**8. TDD Audit section:**

Reconstruct the per-commit TDD gate trail before squash-merge discards it. Walk the PR branch's own commits (merges excluded) and read each commit's `gate_status:` trailer with Git's native trailer machinery — never a raw `%B` grep, which would also match t...

```bash
# Anchor on the merge-base so a stale local ${BASE_BRANCH} ref cannot over-count.
RANGE_BASE=$(git merge-base "${BASE_BRANCH}" HEAD)
git log "${RANGE_BASE}..HEAD" --no-merges --reverse \
--format='%H%x1f%s%x1f%(trailers:key=gate_status,valueonly,separator=%x2c)%x1e'
```

Records are separated by `\x1e`; the fields inside each are `\x1f`-separated — `<sha>`, `<subject>`, `<gate_status value>`.

Pair commits by their conventional-commit type (the `type:` prefix of the subject):

- A `test:` commit is the RED row. Pair it with the next following **implementation** commit — a `feat:` or `fix:` — as its **Impl commit** (the GREEN step), skipping over any intervening `refactor:`, `docs:`, or `chore:` commits so they are never mistaken ...
- A `refactor:`, `docs:`, or `chore:` commit that is not consumed as an Impl pairing is a standalone row with Impl commit `—`.
- A `feat:`/`fix:` commit with no preceding unpaired `test:` is a standalone row.

Surface each commit's `gate_status:` value, normalized to exactly one of `skill`, `fallback`, `exempt`, or `missing` — never the raw trailer text. A commit whose trailer is absent, whose value is none of the first three, or which carries more than one `gate...

Harden every table cell against injection, not just subjects: escape `|` as `\|` and strip `\r`/`\n` from both commit subjects and the rendered `gate_status` value. Prefer NUL (`-z` / `%x00`) record separation, and reject any record whose fields contain the...

```markdown
## TDD Audit

| Test commit | Impl commit | gate_status |
|---|---|---|
| `a1b2c3d` test: failing parser test | `e4f5g6h` feat: implement parser | skill |
| `i7j8k9l` test: failing export test | `m0n1o2p` feat: implement export | fallback |
| `q3r4s5t` refactor: extract helper | — | exempt |

Aggregate: 2 skill, 1 fallback, 1 exempt — 0 missing.
```

This `## TDD Audit` section is the final body section — it renders after the configured `pr_body_sections`, immediately before the aggregate trailer — so the frozen core sections and the append-only configured sections both keep their existing order.

**9. Aggregate gate_status trailer (final line):**

After every other section — including any configured `pr_body_sections` — emit the audit aggregate as a single Git trailer on the **final line** of the PR body, preceded by a blank line so it parses as a valid trailer:

```
gate_status: skill=2, fallback=1, exempt=1, missing=0
```

Use the exact key order `skill=`, `fallback=`, `exempt=`, `missing=` so downstream tooling parses it stably. Keeping it last means a GitHub squash-merge that defaults its commit message to the PR description carries the aggregate into `${BASE_BRANCH}`, pres...
</step>

<step name="create_pr">
Create the PR using the generated body. Write the body to a temp file first so large generated PRD sections do not hit shell argument limits:

```bash
PR_BODY_FILE=$(mktemp "${TMPDIR:-/tmp}/gsd-pr-body.XXXXXX.md")
trap 'rm -f "${PR_BODY_FILE:-}"' EXIT
printf '%s\n' "${PR_BODY}" > "${PR_BODY_FILE}"

gh pr create \
--title "Phase ${PHASE_NUMBER}: ${PHASE_NAME}" \
--body-file "${PR_BODY_FILE}" \
--base "${BASE_BRANCH}"

- Source translation truncated here; use the bridge command output, workflow runbook, installed contracts, or operation plan for continuation.

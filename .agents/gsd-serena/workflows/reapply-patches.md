# Bridge Workflow: reapply-patches

<!-- generated-by: pnpm gen:bridge-commands -->

## Purpose

This bridge workflow runbook translates the actual GSD-core workflow information and adapts it for Serena bridge operation. Read it when operating `gsd-workflow-reapply-patches` in a target project.

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

- Contract ID: `gsd-workflow-reapply-patches`
- Status: `planned`
- Source path: `gsd-core/workflows/reapply-patches.md`
- Resolved source path: `vendor/reference/gsd-core/gsd-core/workflows/reapply-patches.md`
- Mirrored runbook path: `.agents/gsd-serena/workflows/reapply-patches.md`

## Translated GSD Workflow

# Reapply Local Patches Workflow

Invoked by ``gsd-serena-bridge update --format markdown` --reapply` (`commands/gsd/update.md`).

After a GSD update wipes and reinstalls files, this workflow merges user's previously saved local modifications back into the new version. Uses three-way comparison (pristine baseline, user-modified backup, newly installed version) to reliably distinguish u...

**Critical invariant:** Every file in `gsd-local-patches/` was backed up because the installer's hash comparison detected it was modified. The workflow must NEVER conclude "no custom content" for any backed-up file — that is a logical contradiction. When in...

<process>

## Step 1: Detect backed-up patches

Check for local patches directory:

```bash
expand_home() {
case "$1" in
"~/"*) printf '%s/%s\n' "$HOME" "${1#~/}" ;;
*) printf '%s\n' "$1" ;;
esac
}

PATCHES_DIR=""

# Env overrides first — covers custom config directories used with --config-dir
if [ -n "$KILO_CONFIG_DIR" ]; then
candidate="$(expand_home "$KILO_CONFIG_DIR")/gsd-local-patches"
if [ -d "$candidate" ]; then
PATCHES_DIR="$candidate"
fi
elif [ -n "$KILO_CONFIG" ]; then
candidate="$(dirname "$(expand_home "$KILO_CONFIG")")/gsd-local-patches"
if [ -d "$candidate" ]; then
PATCHES_DIR="$candidate"
fi
elif [ -n "$XDG_CONFIG_HOME" ]; then
candidate="$(expand_home "$XDG_CONFIG_HOME")/kilo/gsd-local-patches"
if [ -d "$candidate" ]; then
PATCHES_DIR="$candidate"
fi
fi

if [ -z "$PATCHES_DIR" ] && [ -n "$OPENCODE_CONFIG_DIR" ]; then
candidate="$(expand_home "$OPENCODE_CONFIG_DIR")/gsd-local-patches"
if [ -d "$candidate" ]; then
PATCHES_DIR="$candidate"
fi
elif [ -z "$PATCHES_DIR" ] && [ -n "$OPENCODE_CONFIG" ]; then
candidate="$(dirname "$(expand_home "$OPENCODE_CONFIG")")/gsd-local-patches"
if [ -d "$candidate" ]; then
PATCHES_DIR="$candidate"
fi
elif [ -z "$PATCHES_DIR" ] && [ -n "$XDG_CONFIG_HOME" ]; then
candidate="$(expand_home "$XDG_CONFIG_HOME")/opencode/gsd-local-patches"
if [ -d "$candidate" ]; then
PATCHES_DIR="$candidate"
fi
fi

if [ -z "$PATCHES_DIR" ] && [ -n "$GEMINI_CONFIG_DIR" ]; then
candidate="$(expand_home "$GEMINI_CONFIG_DIR")/gsd-local-patches"
if [ -d "$candidate" ]; then
PATCHES_DIR="$candidate"
fi
fi

if [ -z "$PATCHES_DIR" ] && [ -n "$CODEX_HOME" ]; then
candidate="$(expand_home "$CODEX_HOME")/gsd-local-patches"
if [ -d "$candidate" ]; then
PATCHES_DIR="$candidate"
fi
fi

if [ -z "$PATCHES_DIR" ] && [ -n "$CLAUDE_CONFIG_DIR" ]; then
candidate="$(expand_home "$CLAUDE_CONFIG_DIR")/gsd-local-patches"
if [ -d "$candidate" ]; then
PATCHES_DIR="$candidate"
fi
fi

# Global install — detect runtime config directory defaults
if [ -z "$PATCHES_DIR" ]; then
if [ -d "$HOME/.config/kilo/gsd-local-patches" ]; then
PATCHES_DIR="$HOME/.config/kilo/gsd-local-patches"
elif [ -d "$HOME/.config/opencode/gsd-local-patches" ]; then
PATCHES_DIR="$HOME/.config/opencode/gsd-local-patches"
elif [ -d "$HOME/.opencode/gsd-local-patches" ]; then
PATCHES_DIR="$HOME/.opencode/gsd-local-patches"
elif [ -d "$HOME/.gemini/gsd-local-patches" ]; then
PATCHES_DIR="$HOME/.gemini/gsd-local-patches"
elif [ -d "$HOME/.codex/gsd-local-patches" ]; then
PATCHES_DIR="$HOME/.codex/gsd-local-patches"
else
PATCHES_DIR="$HOME/.claude/gsd-local-patches"
fi
fi
# Local install fallback — check all runtime directories
if [ ! -d "$PATCHES_DIR" ]; then
for dir in .config/kilo .kilo .config/opencode .opencode .gemini .codex .claude; do
if [ -d "./$dir/gsd-local-patches" ]; then
PATCHES_DIR="./$dir/gsd-local-patches"
break
fi
done
fi
```

Read `backup-meta.json` from the patches directory.

**If no patches found:**
```
No local patches found. Nothing to reapply.

Local patches are automatically saved when you run `gsd-serena-bridge update --format markdown`
after modifying any GSD workflow, command, or agent files.
```
Exit.

## Step 2: Determine baseline for three-way comparison

The quality of the merge depends on having a **pristine baseline** — the original unmodified version of each file from the pre-update GSD release. This enables three-way comparison:
- **Pristine baseline** (original GSD file before any user edits)
- **User's version** (backed up in `gsd-local-patches/`)
- **New version** (freshly installed after update)

Check for baseline sources in priority order:

### Option A: Pristine hash from backup-meta.json + git history (most reliable)
If the config directory is a git repository:
```bash
CONFIG_DIR=$(dirname "$PATCHES_DIR")
if git -C "$CONFIG_DIR" rev-parse --git-dir >/dev/null 2>&1; then
HAS_GIT=true
fi
```
When `HAS_GIT=true`, use the `pristine_hashes` recorded in `backup-meta.json` to locate the correct baseline commit. For each file, iterate commits that touched it and find the one whose blob SHA-256 matches the recorded pristine hash:
```bash
# Get the expected pristine SHA-256 from backup-meta.json
PRISTINE_HASH=$(jq -r ".pristine_hashes[\"${file_path}\"] // empty" "$PATCHES_DIR/backup-meta.json")

BASELINE_COMMIT=""
if [ -n "$PRISTINE_HASH" ]; then
# Walk commits that touched this file, pick the one matching the pristine hash
while IFS= read -r commit_hash; do
blob_hash=$(git -C "$CONFIG_DIR" show "${commit_hash}:${file_path}" 2>/dev/null | sha256sum | cut -d' ' -f1)
if [ "$blob_hash" = "$PRISTINE_HASH" ]; then
BASELINE_COMMIT="$commit_hash"
break
fi
done < <(git -C "$CONFIG_DIR" log --format="%H" -- "${file_path}")
fi

# Fallback: if no pristine hash in backup-meta (older installer), use first-add commit
if [ -z "$BASELINE_COMMIT" ]; then
BASELINE_COMMIT=$(git -C "$CONFIG_DIR" log --diff-filter=A --format="%H" -- "${file_path}" | tail -1)
fi
```
Extract the pristine version from the matched commit:
```bash
git -C "$CONFIG_DIR" show "${BASELINE_COMMIT}:${file_path}"
```

**Why this matters:** `git log --diff-filter=A` returns the commit that *first added* the file, which is the wrong baseline on repos that have been through multiple GSD update cycles. The `pristine_hashes` field in `backup-meta.json` records the SHA-256 of ...

### Option B: Pristine snapshot directory
Check if a `gsd-pristine/` directory exists alongside `gsd-local-patches/`:
```bash
PRISTINE_DIR="$CONFIG_DIR/gsd-pristine"
```
If it exists, the installer saved pristine copies at install time. Use these as the baseline.

### Option C: No baseline available (two-way fallback)
If neither git history nor pristine snapshots are available, fall back to two-way comparison — but with **strengthened heuristics** (see Step 3).

## Step 3: Show patch summary

```
## Local Patches to Reapply

**Backed up from:** v{from_version}
**Current version:** {read VERSION file}
**Files modified:** {count}
**Merge strategy:** {three-way (git) | three-way (pristine) | two-way (enhanced)}

| # | File | Status |
|---|------|--------|
| 1 | {file_path} | Pending |
| 2 | {file_path} | Pending |
```

## Step 4: Merge each file

For each file in `backup-meta.json`:

1. **Read the backed-up version** (user's modified copy from `gsd-local-patches/`)
2. **Read the newly installed version** (current file after update)
3. **If available, read the pristine baseline** (from git history or `gsd-pristine/`)

### Three-way merge (when baseline is available)

Compare the three versions to isolate changes:
- **User changes** = diff(pristine → user's version) — these are the customizations to preserve
- **Upstream changes** = diff(pristine → new version) — these are version updates to accept

**Merge rules:**
- Sections changed only by user → apply user's version
- Sections changed only by upstream → accept upstream version
- Sections changed by both → flag as CONFLICT, show both, ask user
- Sections unchanged by either → use new version (identical to all three)

### Two-way merge (fallback when no baseline)

When no pristine baseline is available, use these **strengthened heuristics**:

**CRITICAL RULE: Every file in this backup directory was explicitly detected as modified by the installer's SHA-256 hash comparison. "No custom content" is never a valid conclusion.**

For each file:
a. Read both versions completely
b. Identify ALL differences, then classify each as:
- **Mechanical drift** — path substitutions (e.g. `/Users/xxx/.claude/` → `$HOME/.claude/`), variable additions (`${GSD_WS}`, `${AGENT_SKILLS_*}`), error handling additions (`|| true`)
- **User customization** — added steps/sections, removed sections, reordered content, changed behavior, added frontmatter fields, modified instructions

c. **If ANY differences remain after filtering out mechanical drift → those are user customizations. Merge them.**
d. **If ALL differences appear to be mechanical drift → still flag as CONFLICT.** The installer's hash check already proved this file was modified. Ask the user: "This file appears to only have path/variable differences. Were there intentional customization...

### Git-enhanced two-way merge

When the config directory is a git repo but the pristine install commit can't be found, use commit history to identify user changes:
```bash
# Find non-update commits that touched this file
git -C "$CONFIG_DIR" log --oneline --no-merges -- "{file_path}" | grep -v "gsd:update\|gsd-update\|GSD update\|gsd-install"
```
Each matching commit represents an intentional user modification. Use the commit messages and diffs to understand what was changed and why.

4. **Write merged result** to the installed location

### Post-merge verification

After writing each merged file, verify that user modifications survived the merge:

1. **Line-count check:** Count lines in the backup and the merged result. If the merged result has fewer lines than the backup minus the expected upstream removals, flag for review.
2. **Hunk presence check:** For each user-added section identified during diff analysis, search the merged output for at least the first significant line (non-blank, non-comment) of each addition. Missing signature lines indicate a dropped hunk.
3. **Report warnings inline** (do not block):
```
⚠ Potential dropped content in {file_path}:
- Missing hunk near line {N}: "{first_line_preview}..." ({line_count} lines)
- Backup available: {patches_dir}/{file_path}
```
4. **Produce a Hunk Verification Table** — one row per hunk per file. This table is **mandatory output** and must be produced before Step 5 can proceed. Format:

| file | hunk_id | signature_line | line_count | verified |
|------|---------|----------------|------------|----------|
| {file_path} | {N} | {first_significant_line} | {count} | yes |
| {file_path} | {N} | {first_significant_line} | {count} | no |

- `hunk_id` — sequential integer per file (1, 2, 3…)
- `signature_line` — first non-blank, non-comment line of the user-added section
- `line_count` — total lines in the hunk
- `verified` — `yes` if the signature_line is present in the merged output, `no` otherwise

5. **Track verification status** — add to per-file report: `Merged (verified)` vs `Merged (⚠ {N} hunks may be missing)`

6. **Report status per file:**
- `Merged` — user modifications applied cleanly (show summary of what was preserved)
- `Conflict` — user reviewed and chose resolution
- `Incorporated` — user's modification was already adopted upstream (only valid when pristine baseline confirms this)

**Never report `Skipped — no custom content`.** If a file is in the backup, it has custom content.

## Step 5: Hunk Verification Gate

Two layered gates. Both must pass before proceeding to cleanup.

### 5a: Deterministic verifier (binding gate, #2969)

Run the deterministic verifier script. Do NOT rely solely on the free-text `verified: yes/no` Hunk Verification Table from Step 4 — bug #2969 traced repeated false-positive `verified: yes` reports to that table being filled in without an actual content-pres...

- Source translation truncated here; use the bridge command output, workflow runbook, installed contracts, or operation plan for continuation.

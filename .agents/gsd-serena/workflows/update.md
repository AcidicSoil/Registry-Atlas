# Bridge Workflow: update

<!-- generated-by: pnpm gen:bridge-commands -->

## Purpose

This bridge workflow runbook translates the actual GSD-core workflow information and adapts it for Serena bridge operation. Read it when operating `gsd-workflow-update` in a target project.

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

- Contract ID: `gsd-workflow-update`
- Status: `planned`
- Source path: `gsd-core/workflows/update.md`
- Resolved source path: `vendor/reference/gsd-core/gsd-core/workflows/update.md`
- Mirrored runbook path: `.agents/gsd-serena/workflows/update.md`

## Translated GSD Workflow

### Native Shim Translation
- Native GSD shim locator omitted: the bridge uses the installed `gsd-serena-bridge` CLI, `bootstrap`, `doctor`, `repair`, resolver packets, and install-managed project surfaces instead of locating `gsd-tools.cjs`.
<purpose>
Check for GSD updates via npm, display changelog for versions between installed and latest, obtain user confirmation, and execute clean installation with cache clearing.
</purpose>

<required_reading>
Read all files referenced by the invoking prompt's execution_context before starting.
</required_reading>

<process>

<step name="get_installed_version">
Detect the installed GSD version, scope, runtime, and config dir.

First, derive `PREFERRED_CONFIG_DIR` and `PREFERRED_RUNTIME` from the invoking prompt's `execution_context` path — this is the one input only the workflow knows:
- If the path contains `/gsd-core/workflows/update.md`, strip that suffix and store the remainder as `PREFERRED_CONFIG_DIR`.
- Infer `PREFERRED_RUNTIME` from the path: `/.codex/` -> `codex`; `/.gemini/antigravity-ide/`, `/.gemini/antigravity-cli/`, `/.gemini/antigravity/`, `/.agents/` or `/.agent/` -> `antigravity` (`.agents` is the canonical local Antigravity install dir (#791);...

Then resolve the install context via the deterministic projection (#498). **Do NOT re-derive scope, runtime, or version by hand** — `update-context` owns that cascade in tested code (`gsd-core/bin/lib/update-context.cjs`), the same way `check-latest-version...

```bash
# Resolve gsd-tools.cjs WITHOUT yet knowing GSD_DIR. The running workflow lives
# at <PREFERRED_CONFIG_DIR>/gsd-core/workflows/update.md, so its sibling
# bin/gsd-tools.cjs is the authoritative tool for THIS install. Fall back to a
# global copy, then to gsd-tools on PATH.
for cand in \
"$PREFERRED_CONFIG_DIR/gsd-core/bin/gsd-tools.cjs" \
"$HOME/.claude/gsd-core/bin/gsd-tools.cjs"; do
done
# Last resort: the gsd-tools shim on PATH — resolved to its absolute path and
# invoked via the variable (never a bare `gsd-tools` command; see #2851).
if [ -z "$GSD_TOOLS" ] && command -v gsd-tools >/dev/null 2>&1; then
fi

UC=""
if [ -n "$GSD_TOOLS" ]; then
case "$GSD_TOOLS" in
*.cjs) UC="$(node "$GSD_TOOLS" update-context --config-dir "$PREFERRED_CONFIG_DIR" --runtime "$PREFERRED_RUNTIME" --json 2>/dev/null)" ;;
*)     UC="$("$GSD_TOOLS" update-context --config-dir "$PREFERRED_CONFIG_DIR" --runtime "$PREFERRED_RUNTIME" --json 2>/dev/null)" ;;
esac
fi

if [ -n "$UC" ]; then
INSTALLED_VERSION="$(printf '%s' "$UC" | jq -r '.installedVersion')"
INSTALL_SCOPE="$(printf '%s' "$UC" | jq -r '.scope')"
TARGET_RUNTIME="$(printf '%s' "$UC" | jq -r '.runtime')"
GSD_DIR="$(printf '%s' "$UC" | jq -r '.gsdDir')"
else
# No tool resolvable / projection failed -> treat as a fresh install.
INSTALLED_VERSION="0.0.0"
INSTALL_SCOPE="UNKNOWN"
TARGET_RUNTIME="claude"
GSD_DIR=""
fi

echo "$INSTALLED_VERSION"
echo "$INSTALL_SCOPE"
echo "$TARGET_RUNTIME"
echo "$GSD_DIR"
```

Parse output:
- Line 1 = installed version (`0.0.0` means unknown version)
- Line 2 = install scope (`LOCAL`, `GLOBAL`, or `UNKNOWN`)
- Line 3 = target runtime (`claude`, `opencode`, `gemini`, `kilo`, `codex`, `antigravity`)
- Line 4 = resolved GSD config dir (e.g. `/Users/me/.claude`, `/Users/me/.gemini`); empty if scope is `UNKNOWN`. Capture this as `GSD_DIR` and pass it to subsequent steps so they don't re-derive the runtime path.
- If scope is `UNKNOWN`, proceed to install using the `--claude --global` fallback.

`update-context` reproduces the previous detection cascade — preferred-config-dir fast path, local-over-global with same-path dedup (so `CWD=$HOME` does not misdetect as LOCAL), env-var overrides (`CLAUDE_CONFIG_DIR`, `OPENCODE_CONFIG_DIR`, `KILO_CONFIG`, `...

If multiple runtime installs are detected and the invoking runtime cannot be determined from execution_context, ask the user which runtime to update before running install.

**If VERSION file missing (version resolves to `0.0.0`):** report the installed version as Unknown and proceed to install (treated as `0.0.0` for comparison).
</step>

<step name="parse_update_channel">
Determine the release channel from `$ARGUMENTS`. This selects which npm dist-tag the entire update flow targets — `latest` (stable) by default, or `next` (the RC channel established by ADR #660) when the user opts in with `--next`/`--rc`:

```bash
case " $ARGUMENTS " in
*" --next "*|*" --rc "*)
TAG="next"
CHANNEL_LABEL="next (RC)"
;;
*)
TAG="latest"
CHANNEL_LABEL="latest (stable)"
;;
esac
```

`TAG` is restricted to `latest`/`next` by `check-latest-version.cjs` (it rejects any other value with exit 2), so no arbitrary dist-tag can leak through. Omitting `--next`/`--rc` reproduces the prior behavior exactly: `TAG=latest`.
</step>

<step name="check_latest_version">
Check npm for latest version via the deterministic script. **Do NOT run `npm view` or `npm search` directly** — the package name must come from the script, not from a free choice at execution time. (#2992: LLM-driven prescriptions of npm package names produ...

The `GSD_DIR` value emitted by `get_installed_version` (line 4) resolves to the runtime-specific config dir (`~/.claude/`, `~/.gemini/`, `~/.codex/`, etc.), so the script invocation works for every runtime — not just Claude. If `GSD_DIR` is empty (scope `UN...

`LATEST_RESULT` is a JSON document with the documented shape `{ ok: bool, version: string, reason: string, detail?: string }`. Parse via `jq` ONLY when the script actually ran. When `GSD_DIR` is empty (scope `UNKNOWN`), skip the check entirely and seed the ...

```bash
if [ -z "$GSD_DIR" ]; then
# No install detected — fall through to install step; version-check is skipped.
LATEST_RESULT=""
LATEST_STATUS=0
LATEST_OK=false
LATEST_VERSION=""
LATEST_REASON="no_install_detected"
else
LATEST_RESULT="$(node "$GSD_DIR/gsd-core/bin/check-latest-version.cjs" --json --tag "$TAG" 2>/dev/null)"
LATEST_STATUS=$?
# #2993 CR: when node is missing or the script doesn't exist, LATEST_RESULT
# is empty and piping it to `jq` produces a parse error on stderr while
# leaving LATEST_OK / LATEST_REASON as empty strings. Fail the check with a
# meaningful reason instead of a blank diagnostic.
if [ -n "$LATEST_RESULT" ]; then
LATEST_OK="$(printf '%s' "$LATEST_RESULT" | jq -r '.ok // false')"
LATEST_VERSION="$(printf '%s' "$LATEST_RESULT" | jq -r '.version // empty')"
LATEST_REASON="$(printf '%s' "$LATEST_RESULT" | jq -r '.reason // empty')"
else
LATEST_OK=false
LATEST_VERSION=""
LATEST_REASON="script_not_found_or_node_unavailable"
fi
fi
```

**If `LATEST_OK` is not `true`** (or `LATEST_STATUS` is non-zero):

```text
Couldn't check for updates (reason: {LATEST_REASON}, exit: {LATEST_STATUS}).

To update manually: `npx -y --package=@opengsd/gsd-core@{TAG} -- gsd-core --global`
```

Exit.
</step>

<step name="compare_versions">
Compare installed vs latest:

**Only when `TAG=next`** (the user passed `--next`/`--rc`), prepend a channel banner so they know they are leaving the stable line — add this line immediately after the `**Latest:**` line in whichever output block renders:

**Channel:** {CHANNEL_LABEL}

On the default stable channel (`TAG=latest`), do NOT add a channel line — the output must match the prior stable behavior exactly.

When `TAG=next`, the "latest" value is the release candidate published under `@next` (e.g. `1.4.0-rc.1`). Apply standard semver precedence for prereleases (`1.4.0-rc.1` is newer than `1.3.1` but older than the final `1.4.0`). Do NOT treat an `-rc.N` suffix ...

**If installed == latest:**
```
## GSD Update

**Installed:** X.Y.Z
**Latest:** X.Y.Z

You're already on the latest version.
```

Exit.

**If installed > latest:**
```
## GSD Update

**Installed:** X.Y.Z
**Latest:** A.B.C

You're ahead of the latest release — this looks like a dev install.

If you see a "⚠ dev install — re-run installer to sync hooks" warning in
your statusline, your hook files are older than your VERSION file. Fix it
by re-running the local installer from your dev branch:

node bin/install.js --global --claude

Running `gsd-serena-bridge update --format markdown` would install the npm release (A.B.C) and downgrade
your dev version — do NOT use it to resolve this warning.
```

Exit.
</step>

<step name="show_changes_and_confirm">
**If update available**, fetch and show what's new BEFORE updating:

1. Fetch changelog from GitHub raw URL and save to a temp file, e.g. `/tmp/gsd-changelog-$$.md`.
2. Extract entries between installed and latest versions using the deterministic range helper (fix for #3496 — do NOT use ad-hoc grep/awk extraction which silently skips intermediate versions):

```bash
CHANGELOG_TMP="/tmp/gsd-changelog-$$.md"
curl -fsSL "https://raw.githubusercontent.com/open-gsd/gsd-core/main/CHANGELOG.md" -o "$CHANGELOG_TMP" 2>/dev/null \
|| wget -qO "$CHANGELOG_TMP" "https://raw.githubusercontent.com/open-gsd/gsd-core/main/CHANGELOG.md" 2>/dev/null

GSD_CHANGESET_CLI="$GSD_DIR/scripts/changeset/cli.cjs"
if [ ! -f "$GSD_CHANGESET_CLI" ]; then
CHANGELOG_PREVIEW="(Changelog CLI not found at $GSD_CHANGESET_CLI — reinstall GSD to restore preview. Update will still proceed.)"
else
EXTRACT_JSON=$(node "$GSD_CHANGESET_CLI" extract \
--from "$INSTALLED_VERSION" \
--to "$LATEST_VERSION" \
--changelog "$CHANGELOG_TMP" \
--json 2>&1)
EXTRACT_EXIT=$?

if [ "$EXTRACT_EXIT" -eq 2 ]; then
# Exit 2 = no releases in range (e.g. versions are equal or changelog is sparse)
CHANGELOG_PREVIEW="No changelog updates between v${INSTALLED_VERSION} and v${LATEST_VERSION}."
elif [ "$EXTRACT_EXIT" -ne 0 ] || [ -z "$EXTRACT_JSON" ]; then
CHANGELOG_PREVIEW="(Could not extract changelog — update will still proceed)"
else
# Re-run without --json to get the human-readable markdown for display
CHANGELOG_PREVIEW=$(node "$GSD_CHANGESET_CLI" extract \
--from "$INSTALLED_VERSION" \
--to "$LATEST_VERSION" \
--changelog "$CHANGELOG_TMP" 2>/dev/null || echo "(changelog unavailable)")
fi
fi
# Clean up temp changelog now that both extract runs are done
rm -f "$CHANGELOG_TMP"
```

3. Display preview and ask for confirmation, using `$CHANGELOG_PREVIEW` from the extract step above:

```
## GSD Update Available

**Installed:** {INSTALLED_VERSION}
**Latest:** {LATEST_VERSION}

### What's New
────────────────────────────────────────────────────────────

{CHANGELOG_PREVIEW}

────────────────────────────────────────────────────────────

⚠️  **Note:** The installer performs a clean install of GSD folders:
- `commands/gsd/` will be wiped and replaced
- `gsd-core/` will be wiped and replaced
- `agents/gsd-*` files will be replaced

(Paths are relative to detected runtime install location:
global: `~/.claude/`, `~/.config/opencode/`, `~/.opencode/`, `~/.gemini/`, `~/.config/kilo/`, or `~/.codex/`
local: `./.claude/`, `./.config/opencode/`, `./.opencode/`, `./.gemini/`, `./.kilo/`, or `./.codex/`)

Your custom files in other locations are preserved:
- Custom commands not in `commands/gsd/` ✓
- Custom agents not prefixed with `gsd-` ✓
- Custom hooks ✓
- Your CLAUDE.md files ✓

If you've modified any GSD files directly, they'll be automatically backed up to `gsd-local-patches/` and can be reapplied with ``gsd-serena-bridge update --format markdown` --reapply` after the update.
```

**Text mode (`workflow.text_mode: true` in config or `--text` flag):** Set `TEXT_MODE=true` if `--text` is present in `$ARGUMENTS` OR `text_mode` from init JSON is `true`. When TEXT_MODE is active, replace every `AskUserQuestion` call with a plain-text numb...
Use AskUserQuestion:
- Question: "Proceed with update?"
- Options:
- "Yes, update now"
- "No, cancel"

**If user cancels:** Exit.
</step>

<step name="backup_custom_files">
Before running the installer, detect and back up any user-added files inside
GSD-managed directories. These are files that exist on disk but are NOT listed
in `gsd-file-manifest.json` — i.e., files the user added themselves that the
installer does not know about and will delete during the wipe.

**Do not use bash path-stripping (`${filepath#$RUNTIME_DIR/}`) or `node -e require()`
inline** — those patterns fail when `$RUNTIME_DIR` is unset and the stripped
relative path may not match manifest key format, which causes CUSTOM_COUNT=0
even when custom files exist (bug #1997). Use `gsd-tools.cjs query detect-custom-files`
or the bundled `gsd-tools.cjs detect-custom-files` path — both resolve paths
reliably with Node.js `path.relative()`.

First, resolve the config directory (`RUNTIME_DIR`) from the install scope
detected in `get_installed_version`:

- Source translation truncated here; use the bridge command output, workflow runbook, installed contracts, or operation plan for continuation.

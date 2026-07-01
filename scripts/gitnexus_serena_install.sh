#!/usr/bin/env bash
set -euo pipefail

# GitNexus-only wrapper installer for Serena / shell-driven agents.
# This intentionally does NOT install or configure ck/qmd.
# It writes a Bash functions file that provides stable GitNexus commands:
#   qkgx, qkgx-index, qkgx-status, qkgx-impact, qkgx-context, etc.

INSTALL_PATH="${HOME}/.config/bash/functions/gitnexus-serena.sh"
WITH_BASHRC=0
INSTALL_GLOBAL=0
FAST_GLOBAL_INSTALL=0
PRINT_ONLY=0

usage() {
  cat <<'USAGE'
Usage:
  bash gitnexus_serena_install.sh [options]

Options:
  --path <file>              Install functions to this file.
                             Default: ~/.config/bash/functions/gitnexus-serena.sh
  --with-bashrc              Add a guarded source line to ~/.bashrc.
  --install-global           Run: npm install -g gitnexus@latest
  --install-global-fast      Same as --install-global, but sets
                             GITNEXUS_SKIP_OPTIONAL_GRAMMARS=1 to avoid optional
                             Dart/Proto/Swift/Kotlin grammar builds.
  --print                    Print the functions file instead of writing it.
  -h, --help                 Show this help.

After install:
  source ~/.config/bash/functions/gitnexus-serena.sh
  cd /path/to/repo
  qkgx-health
  qkgx-init-rc
  qkgx-index
  qkgx-status
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --path)
      INSTALL_PATH="${2:?missing value for --path}"
      shift 2
      ;;
    --with-bashrc)
      WITH_BASHRC=1
      shift
      ;;
    --install-global)
      INSTALL_GLOBAL=1
      shift
      ;;
    --install-global-fast)
      INSTALL_GLOBAL=1
      FAST_GLOBAL_INSTALL=1
      shift
      ;;
    --print)
      PRINT_ONLY=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

FUNCTIONS_CONTENT=$(cat <<'BASHFUNCS'
# shellcheck shell=bash
# GitNexus-only shell wrapper stack for Serena / local agents.
# Source this file from Bash:
#   source ~/.config/bash/functions/gitnexus-serena.sh
#
# Design:
#   qkgx             = raw GitNexus runner with safe fallback order
#   qkgx-index       = conservative repo index for Serena use
#   qkgx-index-full  = normal GitNexus analyze with agent-file generation allowed
#   qkgx-*           = stable, agent-friendly verbs
#
# Environment knobs:
#   QKGX_DEFAULT_ANALYZE_FLAGS  override conservative analyze flags
#   QKGX_USE_NPX_FIRST=1        prefer npx over pnpm fallback
#   QKGX_ALLOW_CLEAN_ALL=1      allow qkgx-clean-all-force
#   GITNEXUS_*                  passed through to GitNexus

_qkgx_err() { printf 'qkgx: %s\n' "$*" >&2; }
_qkgx_has() { command -v "$1" >/dev/null 2>&1; }

qkgx-root() {
  git rev-parse --show-toplevel 2>/dev/null || {
    _qkgx_err "not inside a git repository; cd into a repo root/subdir first"
    return 1
  }
}

qkgx-cd-root() {
  local root
  root="$(qkgx-root)" || return 1
  cd "$root" || return 1
}

# Raw runner. Use this for commands not explicitly wrapped yet:
#   qkgx <gitnexus-command> [...args]
qkgx() {
  local root=""
  root="$(git rev-parse --show-toplevel 2>/dev/null || true)"

  # Prefer the project-local runner after the repo has already been indexed.
  if [[ -n "$root" && -f "$root/.gitnexus/run.cjs" ]] && _qkgx_has node; then
    (cd "$root" && node .gitnexus/run.cjs "$@")
    return $?
  fi

  # Prefer a global install when available. This avoids cold npx startup and MCP timeouts.
  if _qkgx_has gitnexus; then
    gitnexus "$@"
    return $?
  fi

  # npm 11 can fail before GitNexus runs on some native dependency installs.
  # pnpm's allow-build path is usually more reliable for first-time use.
  if [[ "${QKGX_USE_NPX_FIRST:-0}" != "1" ]] && _qkgx_has pnpm; then
    pnpm --allow-build=@ladybugdb/core --allow-build=gitnexus --allow-build=tree-sitter dlx gitnexus@latest "$@"
    return $?
  fi

  if _qkgx_has npx; then
    npx -y gitnexus@latest "$@"
    return $?
  fi

  if _qkgx_has pnpm; then
    pnpm --allow-build=@ladybugdb/core --allow-build=gitnexus --allow-build=tree-sitter dlx gitnexus@latest "$@"
    return $?
  fi

  _qkgx_err "GitNexus runner not found. Install Node plus npm/pnpm, or run: npm install -g gitnexus@latest"
  return 127
}

# Install/upgrade helpers. These are explicit so the wrapper file itself does not mutate your system.
qkgx-install-global() {
  if ! _qkgx_has npm; then
    _qkgx_err "npm is required for global install"
    return 127
  fi
  npm install -g gitnexus@latest
}

qkgx-install-global-fast() {
  if ! _qkgx_has npm; then
    _qkgx_err "npm is required for global install"
    return 127
  fi
  GITNEXUS_SKIP_OPTIONAL_GRAMMARS=1 npm install -g gitnexus@latest
}

qkgx-version() {
  qkgx --version 2>/dev/null || qkgx -v 2>/dev/null || qkgx --help | head -40
}

# Conservative project config: useful when Serena is the agent and you do not want GitNexus
# rewriting AGENTS.md/CLAUDE.md or installing Claude-specific skills into the repo.
qkgx-init-rc() {
  local root default_branch
  root="$(qkgx-root)" || return 1
  default_branch="$(git -C "$root" symbolic-ref --quiet --short refs/remotes/origin/HEAD 2>/dev/null | sed 's#^origin/##')"
  [[ -n "$default_branch" ]] || default_branch="$(git -C "$root" branch --show-current 2>/dev/null || true)"
  [[ -n "$default_branch" ]] || default_branch="main"

  if [[ -f "$root/.gitnexusrc" ]]; then
    printf 'Existing .gitnexusrc found: %s\n' "$root/.gitnexusrc"
    printf 'Not overwriting. Remove it or edit manually if needed.\n'
    return 0
  fi

  cat > "$root/.gitnexusrc" <<EOF_RC
{
  "defaultBranch": "${default_branch}",
  "skipAgentsMd": true,
  "skipSkills": true,
  "workerTimeout": 60
}
EOF_RC
  printf 'Wrote conservative GitNexus config: %s\n' "$root/.gitnexusrc"
}

qkgx-ignore() {
  local root ignore
  root="$(qkgx-root)" || return 1
  ignore="$root/.gitignore"
  touch "$ignore"
  if ! grep -qxF '.gitnexus/' "$ignore"; then
    printf '\n# GitNexus local graph index\n.gitnexus/\n' >> "$ignore"
    printf 'Added .gitnexus/ to %s\n' "$ignore"
  else
    printf '.gitnexus/ already present in %s\n' "$ignore"
  fi
}

# Conservative index: preserves your existing agent docs/skills unless you opt in elsewhere.
qkgx-index() {
  local root
  root="$(qkgx-root)" || return 1
  qkgx-ignore >/dev/null || true
  local -a flags
  # shellcheck disable=SC2206
  flags=(${QKGX_DEFAULT_ANALYZE_FLAGS:---skip-agents-md --skip-skills})
  (cd "$root" && qkgx analyze "${flags[@]}" "$@")
}

# Full GitNexus analyze: allows GitNexus defaults, including agent context/skill generation.
qkgx-index-full() {
  local root
  root="$(qkgx-root)" || return 1
  qkgx-ignore >/dev/null || true
  (cd "$root" && qkgx analyze "$@")
}

qkgx-reindex() {
  qkgx-index --force "$@"
}

qkgx-repair-fts() {
  local root
  root="$(qkgx-root)" || return 1
  (cd "$root" && qkgx analyze --repair-fts "$@")
}

qkgx-embed() {
  local root
  root="$(qkgx-root)" || return 1
  (cd "$root" && qkgx analyze --embeddings "$@")
}

qkgx-status() {
  local root
  root="$(qkgx-root)" || return 1
  (cd "$root" && qkgx status "$@")
}

qkgx-list() {
  qkgx list "$@"
}

qkgx-clean() {
  local root
  root="$(qkgx-root)" || return 1
  (cd "$root" && qkgx clean "$@")
}

qkgx-clean-force() {
  local root
  root="$(qkgx-root)" || return 1
  (cd "$root" && qkgx clean --force "$@")
}

qkgx-clean-all-force() {
  if [[ "${QKGX_ALLOW_CLEAN_ALL:-0}" != "1" ]]; then
    _qkgx_err "refusing clean --all --force. Re-run with QKGX_ALLOW_CLEAN_ALL=1 if you really want this."
    return 2
  fi
  qkgx clean --all --force "$@"
}

qkgx-refresh-if-needed() {
  local root status_out status_code
  root="$(qkgx-root)" || return 1
  set +e
  status_out="$(cd "$root" && qkgx status 2>&1)"
  status_code=$?
  set -e
  printf '%s\n' "$status_out"

  if [[ $status_code -ne 0 ]] || printf '%s\n' "$status_out" | grep -Eiq 'stale|not analyzed|not indexed|no index|missing|out[- ]?of[- ]?date|cannot find module'; then
    printf '\nGitNexus index appears missing or stale. Running conservative index...\n'
    qkgx-index "$@"
  else
    printf '\nGitNexus index appears usable.\n'
  fi
}

# MCP / editor setup.
qkgx-mcp() {
  qkgx mcp "$@"
}

qkgx-serve() {
  qkgx serve "$@"
}

qkgx-setup() {
  qkgx setup "$@"
}

qkgx-setup-codex() {
  qkgx setup -c codex "$@"
}

qkgx-setup-opencode() {
  qkgx setup -c opencode "$@"
}

qkgx-setup-cursor() {
  qkgx setup -c cursor "$@"
}

qkgx-setup-claude() {
  qkgx setup -c claude "$@"
}

qkgx-setup-core-agents() {
  # Useful for your stack without assuming Claude Code.
  qkgx setup -c codex,opencode,cursor "$@"
}

qkgx-uninstall-preview() {
  qkgx uninstall "$@"
}

qkgx-uninstall-force() {
  qkgx uninstall --force "$@"
}

# Direct code-intelligence verbs. These are GitNexus CLI pass-throughs where available,
# and they also mirror the MCP tool names Serena/Codex should call when using GitNexus MCP.
qkgx-query() {
  qkgx query "$@"
}

qkgx-context() {
  qkgx context "$@"
}

qkgx-impact() {
  qkgx impact "$@"
}

qkgx-detect-changes() {
  qkgx detect_changes "$@"
}

qkgx-rename-dry-run() {
  local old_name="${1:?usage: qkgx-rename-dry-run <old-symbol> <new-symbol> [extra args]}"
  local new_name="${2:?usage: qkgx-rename-dry-run <old-symbol> <new-symbol> [extra args]}"
  shift 2
  qkgx rename "$old_name" "$new_name" --dry-run "$@"
}

qkgx-cypher() {
  qkgx cypher "$@"
}

qkgx-wiki() {
  qkgx wiki "$@"
}

# Multi-repo / group helpers.
qkgx-group-create() {
  local name="${1:?usage: qkgx-group-create <name>}"
  shift
  qkgx group create "$name" "$@"
}

qkgx-group-add() {
  local group="${1:?usage: qkgx-group-add <group> <groupPath> <registryName>}"
  local group_path="${2:?usage: qkgx-group-add <group> <groupPath> <registryName>}"
  local registry_name="${3:?usage: qkgx-group-add <group> <groupPath> <registryName>}"
  shift 3
  qkgx group add "$group" "$group_path" "$registry_name" "$@"
}

qkgx-group-remove() {
  local group="${1:?usage: qkgx-group-remove <group> <groupPath>}"
  local group_path="${2:?usage: qkgx-group-remove <group> <groupPath>}"
  shift 2
  qkgx group remove "$group" "$group_path" "$@"
}

qkgx-group-list() {
  qkgx group list "$@"
}

qkgx-group-sync() {
  local name="${1:?usage: qkgx-group-sync <name>}"
  shift
  qkgx group sync "$name" "$@"
}

qkgx-group-contracts() {
  local name="${1:?usage: qkgx-group-contracts <name>}"
  shift
  qkgx group contracts "$name" "$@"
}

qkgx-group-query() {
  local name="${1:?usage: qkgx-group-query <name> <query>}"
  local query="${2:?usage: qkgx-group-query <name> <query>}"
  shift 2
  qkgx group query "$name" "$query" "$@"
}

qkgx-group-status() {
  local name="${1:?usage: qkgx-group-status <name>}"
  shift
  qkgx group status "$name" "$@"
}

qkgx-print-codex-mcp() {
  cat <<'EOF_CODEX'
# Codex config.toml snippet:
[mcp_servers.gitnexus]
command = "npx"
args = ["-y", "gitnexus@latest", "mcp"]

# Faster if globally installed:
# [mcp_servers.gitnexus]
# command = "gitnexus"
# args = ["mcp"]
EOF_CODEX
}

qkgx-print-opencode-mcp() {
  cat <<'EOF_OPENCODE'
{
  "mcp": {
    "gitnexus": {
      "type": "local",
      "command": ["gitnexus", "mcp"]
    }
  }
}
EOF_OPENCODE
}

qkgx-agent-brief() {
  cat <<'EOF_BRIEF'
GitNexus role for Serena / shell-driven agents:

Use GitNexus for graph-aware code intelligence, not broad text search.
Use it before structural edits, refactors, symbol renames, API changes, or changes that could affect call chains.

Preferred command order:
1. qkgx-refresh-if-needed
2. qkgx-query "feature or flow name"             # process-grouped graph search, if CLI supports it
3. qkgx-context "SymbolName"                    # callers/callees/process participation
4. qkgx-impact "SymbolName" --direction upstream # blast radius before changing code
5. qkgx-detect-changes                          # pre-commit impact check

Conservative indexing:
- qkgx-index writes/refreshes .gitnexus/ while skipping AGENTS.md/CLAUDE.md and generated skills.
- qkgx-index-full allows GitNexus defaults if you want its agent files too.

Do not use GitNexus as the first tool for simple string lookup. Use it when relationships matter.
EOF_BRIEF
}

qkgx-health() {
  printf 'GitNexus wrapper health\n'
  printf '=======================\n'
  printf 'node:     '; command -v node || true
  printf 'npm:      '; command -v npm || true
  printf 'pnpm:     '; command -v pnpm || true
  printf 'npx:      '; command -v npx || true
  printf 'gitnexus: '; command -v gitnexus || true
  printf '\n'

  local root
  root="$(git rev-parse --show-toplevel 2>/dev/null || true)"
  if [[ -n "$root" ]]; then
    printf 'repo root: %s\n' "$root"
    if [[ -f "$root/.gitnexus/run.cjs" ]]; then
      printf 'local runner: %s\n' "$root/.gitnexus/run.cjs"
    else
      printf 'local runner: missing until first analyze\n'
    fi
    if [[ -d "$root/.gitnexus" ]]; then
      printf 'index dir: present\n'
    else
      printf 'index dir: missing\n'
    fi
    if [[ -f "$root/.gitnexusrc" ]]; then
      printf 'project rc: %s\n' "$root/.gitnexusrc"
    else
      printf 'project rc: missing; run qkgx-init-rc for conservative Serena defaults\n'
    fi
  else
    printf 'repo root: not inside git repo\n'
  fi

  if [[ -f "$HOME/.gitnexus/registry.json" ]]; then
    printf 'global registry: %s\n' "$HOME/.gitnexus/registry.json"
  else
    printf 'global registry: missing until first analyze\n'
  fi

  printf '\nRunner check:\n'
  qkgx-version || true
}

qkgx-help() {
  cat <<'EOF_HELP'
GitNexus Serena wrapper commands:

Core:
  qkgx <cmd> [args]              Raw GitNexus runner
  qkgx-health                    Print environment/repo/index diagnostics
  qkgx-install-global            npm install -g gitnexus@latest
  qkgx-install-global-fast       Same, skips optional Dart/Proto/Swift/Kotlin grammar builds

Repo setup/index:
  qkgx-init-rc                   Write conservative .gitnexusrc if absent
  qkgx-ignore                    Ensure .gitnexus/ is in .gitignore
  qkgx-index [args]              Conservative analyze; skips agent docs/skills
  qkgx-index-full [args]         Full GitNexus analyze defaults
  qkgx-reindex [args]            Conservative analyze --force
  qkgx-repair-fts                Rebuild/verify FTS indexes only
  qkgx-embed [limit]             Analyze with embeddings
  qkgx-status                    Show current repo index status
  qkgx-refresh-if-needed         Run status, index if missing/stale
  qkgx-clean                     Delete current repo index interactively
  qkgx-clean-force               Delete current repo index without prompt

MCP/editor:
  qkgx-mcp                       Start stdio MCP server
  qkgx-serve                     Start local HTTP server for web UI bridge mode
  qkgx-setup                     Auto-detect editor MCP config
  qkgx-setup-codex               Configure Codex only
  qkgx-setup-opencode            Configure OpenCode only
  qkgx-setup-cursor              Configure Cursor only
  qkgx-setup-core-agents         Configure Codex, OpenCode, Cursor
  qkgx-uninstall-preview         Preview GitNexus config removal
  qkgx-uninstall-force           Apply GitNexus config removal

Graph/code intelligence:
  qkgx-query "auth flow"         Graph/process search, if CLI command is available
  qkgx-context SymbolName        360-degree symbol view, if CLI command is available
  qkgx-impact SymbolName [...]   Blast-radius analysis, if CLI command is available
  qkgx-detect-changes            Git-diff impact, if CLI command is available
  qkgx-rename-dry-run old new    Safe rename preview, if CLI command is available
  qkgx-cypher '<query>'          Raw graph query, if CLI command is available
  qkgx-wiki [args]               Generate wiki from graph

Multi-repo groups:
  qkgx-group-create <name>
  qkgx-group-add <group> <groupPath> <registryName>
  qkgx-group-list [name]
  qkgx-group-sync <name>
  qkgx-group-contracts <name>
  qkgx-group-query <name> "query"
  qkgx-group-status <name>

Brief:
  qkgx-agent-brief               Print Serena usage rules
EOF_HELP
}

# Short aliases, only if not already defined as functions/commands.
if ! declare -F gx >/dev/null 2>&1 && ! command -v gx >/dev/null 2>&1; then
  gx() { qkgx "$@"; }
fi
if ! declare -F gxhealth >/dev/null 2>&1 && ! command -v gxhealth >/dev/null 2>&1; then
  gxhealth() { qkgx-health "$@"; }
fi
BASHFUNCS
)

if [[ "$PRINT_ONLY" == "1" ]]; then
  printf '%s\n' "$FUNCTIONS_CONTENT"
  exit 0
fi

mkdir -p "$(dirname "$INSTALL_PATH")"
printf '%s\n' "$FUNCTIONS_CONTENT" > "$INSTALL_PATH"
chmod 0644 "$INSTALL_PATH"

echo "Installed GitNexus Serena functions: $INSTALL_PATH"

if [[ "$WITH_BASHRC" == "1" ]]; then
  SOURCE_LINE="[[ -f \"$INSTALL_PATH\" ]] && source \"$INSTALL_PATH\""
  touch "$HOME/.bashrc"
  if ! grep -Fqx "$SOURCE_LINE" "$HOME/.bashrc"; then
    {
      echo ""
      echo "# GitNexus Serena wrappers"
      echo "$SOURCE_LINE"
    } >> "$HOME/.bashrc"
    echo "Added source line to ~/.bashrc"
  else
    echo "~/.bashrc already sources $INSTALL_PATH"
  fi
fi

if [[ "$INSTALL_GLOBAL" == "1" ]]; then
  if ! command -v npm >/dev/null 2>&1; then
    echo "npm not found; skipped global GitNexus install" >&2
    exit 1
  fi
  if [[ "$FAST_GLOBAL_INSTALL" == "1" ]]; then
    echo "Installing GitNexus globally with optional grammars skipped..."
    GITNEXUS_SKIP_OPTIONAL_GRAMMARS=1 npm install -g gitnexus@latest
  else
    echo "Installing GitNexus globally..."
    npm install -g gitnexus@latest
  fi
fi

cat <<EOF_NEXT

Next:
  source "$INSTALL_PATH"
  cd /path/to/repo
  qkgx-health
  qkgx-init-rc
  qkgx-index
  qkgx-status

Optional MCP setup:
  qkgx-setup-codex
  qkgx-setup-opencode
  qkgx-setup-core-agents
EOF_NEXT

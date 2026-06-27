---
name: gsd:surface
description: "Use when operating the surface bridge command in a bridge-installed target project and needing source-informed GSD-safe procedural guidance."
promptsnippets:
  command: "gsd-serena-bridge surface --format markdown"
  variables:
    []
  slashAliases:
    - "/gsd:surface"
  skillReferences:
    - ".agents/gsd-serena/commands/gsd/surface.md"
---

<!-- generated-by: pnpm gen:bridge-commands -->

# Toggle which skills are surfaced — apply a profile, list, or disable a cluster without reinstall

## Purpose

This is the bridge command Markdown artifact for `gsd-command-surface`. Vendor GSD-core commands are Markdown files; this generated file keeps that model as the first-class command artifact. Command `SKILL.md` outputs are intentionally not generated; command Markdown is the command runtime authority.

## Bridge Adaptation Overlay

Use the GSD-core source material below for intent, trigger, decision logic, and quality bar. Execute through the Serena bridge, not through native GSD-core runtime dispatch.

### Command Mapping

- Native slash command intent maps to: `gsd-serena-bridge surface --format markdown`.

### Runtime Substitutions

- Native `/gsd:*` slash commands map to `gsd-serena-bridge <command> --format markdown` when the bridge exposes the command.
- Native `gsd_run query ...` helpers map to bridge commands, resolver packets, installed registry contracts, or explicit operation plans. Do not invent a missing query result.
- Native `Agent(...)` / subagent dispatch maps to installed GSD agent contracts under `.agents/gsd-serena/agents/**`, vendor-shaped GSD runtime skills under `.agents/gsd-serena/skills/gsd-*/SKILL.md`, Serena role passes, or explicit checkpoints.
- Native Skill references map to vendor-shaped GSD runtime skills under `.agents/gsd-serena/skills/gsd-*/SKILL.md`, GSD references under `.agents/gsd-serena/gsd-core/references/**`, and workflow runbooks under `.agents/gsd-serena/workflows/**`.
- Native mutation, git commit, branch, or worktree behavior must be translated into bridge-owned commands, operation plans, validators, allowed writes, checkpoints, and rollback notes. Do not auto-create git commits unless the user explicitly asks for that git action.


### Execution Rule

Proceed through the bridge entrypoint or resolver, then follow bridge output exactly. Treat adapted-safe behavior as intentionally safe substitution, not native parity.

## Preflight

Run this from the target project root unless the user is explicitly asking about the bridge source repository.

1. Check setup and current direction when the session is new or setup freshness is unclear:

   ```bash
   gsd-serena-bridge bootstrap --format markdown
   ```

2. If bootstrap or doctor reports stale/broken bridge-owned install-managed surfaces, automatically repair and recheck before continuing:

   ```bash
   gsd-serena-bridge repair --format markdown
   gsd-serena-bridge doctor --format markdown
   ```

3. Repair is limited to bridge-owned installed surfaces such as `.agents/gsd-serena/**`, bridge `.serena/**` setup, and managed bridge blocks in `AGENTS.md` / `.gitignore`.
4. Do not treat repair as permission to overwrite user-owned `.planning/STATE.md`, native `.gsd/**`, or product files.
5. Status decision for this command artifact: Proceed through the bridge entrypoint or resolver, then follow bridge output exactly. Treat adapted-safe behavior as intentionally safe substitution, not native parity.

## Procedure

1. Read the GSD Source Translation below first. Extract the native trigger, purpose, required reading, process steps, and completion criteria.
2. Apply the Bridge Adaptation Overlay above before executing anything.
3. Restate the user's goal in one sentence and map it to this command: `surface`.
4. Complete the preflight above. If repair was needed, rerun doctor before continuing.
5. Read required inputs before writing anything. Required reads for this command:
   - none
6. If the user's request is natural-language or ambiguous, run resolver first and use the returned packet/command:

   ```bash
   cat <<'EOF_REQUEST' | gsd-serena-bridge resolve --stdin --format markdown
   <verbatim user request>
   EOF_REQUEST
   ```

7. Run or prepare the implemented bridge command from the project root:

   ```bash
   gsd-serena-bridge surface --format markdown
   ```

   If the command needs arguments, inspect `gsd-serena-bridge surface --help` or use the resolver packet instead of guessing.
8. Follow the command output, packet, and next-action instructions. If a packet is produced, obey its allowed writes, forbidden writes, required reads, expected artifacts, validation command, and transition rule.
9. Do not mutate files outside this command artifact's boundaries unless bridge output explicitly authorizes it or the user gives a narrow override with validation.

## Decision Flow

- If status is `supported` or `adapted-safe`: use the bridge entrypoint/resolver and report the bridge command or substitute actually used.
- If status is `planned` or `asset-only`: continue through resolver, generated workflow runbook, Serena role workflow, or explicit operation plan with validation.
- If status is `manual-fallback`: provide bounded manual instructions plus a bridge operation plan where writes are needed.
- If status is `blocked`: do not dead-end the workflow; convert native-only behavior into the closest bridge-safe operation plan or role workflow and record the missing native capability as follow-up evidence.
- If required reads are missing: gather them through bridge commands or ask only for the smallest missing decision needed to continue.
- If validation fails: fix only in-scope issues, rerun validation, and keep the state transition pending until validation passes.

## Validation and Completion

No command-specific validation is declared in the contract. Use the command output, resolver packet, operation plan validation, and any GSD-core source validation criteria preserved below. Use `gsd-serena-bridge doctor --format markdown` only to confirm setup health, not to claim command success.

Before reporting done, include:

- the GSD source translation sections used;
- the bridge command, resolver packet, operation plan, or role workflow used;
- files read and changed;
- validation commands and outcomes;
- state transition status, if any;
- remaining adapted-safe gaps or native GSD behavior not implemented by the bridge.

## Recovery

- Setup stale or broken: run repair, then doctor, then bootstrap/state-next before continuing.
- Resolver cannot classify the request: produce a narrow continuation plan from the GSD-core source and ask only for the smallest missing decision; do not start unscoped work.
- Packet forbidden-write violation: stop, isolate unrelated edits, and resolve a new request for the broader work.
- Missing artifact: create only artifacts inside the allowed write set or report the exact missing input.
- Native GSD behavior requested but not implemented: execute the bridge substitute through a command, workflow runbook, role workflow, or explicit operation plan; cite the contract status `adapted-safe`, explain the safe bridge substitute, and record a future parity slice.

## Boundaries

### Required Reads

- none

### Allowed Writes

- none

### Forbidden Writes

- `.git/**`
- `.github/**`
- `node_modules/**`
- `vendor/**`

### Expected Created Artifacts

- none

### Expected Updated Artifacts

- none

### Optional Artifacts

- none

## Runtime Capability

- Runtime status: `external-adapter`
- Contract row: `command:surface`
- Test fixture path: `tests/fixtures/runtime-capability/commands/surface`
- Required command: `gsd-serena-bridge surface --format markdown`
- Dry-run command: `gsd-serena-bridge surface --format markdown`
- Apply command: `gsd-serena-bridge surface --apply --confirm --format markdown`
- Read actions:
- `.planning/STATE.md`
- `.planning/ROADMAP.md`
- `.planning/phases/<phase>/**`
- Write actions:
- `.planning/phases/<phase>/**`
- External actions:
- `adapter-gated external service or reviewer interaction`
- Git actions:
- none
- GitHub actions:
- `adapter-gated GitHub issue/PR/label/comment operation`
- Agent actions:
- none
- Runtime validation commands:
- `pnpm vitest run tests/gsd-serena/runtime-capability/surface.test.ts`

## GSD Source Translation

The source-derived guidance below is translated for the Serena bridge. Native runtime locator code, shim functions, direct `gsd-tools.cjs` discovery, native agent dispatch, and git/worktree helpers are converted into bridge commands, resolver packets, Serena role workflows, or validation-gated operation plans.

### vendor-command

Recorded path: `vendor/reference/gsd-core/commands/gsd/surface.md`; resolved path: `vendor/reference/gsd-core/commands/gsd/surface.md`.

<objective>
Manage the runtime skill surface without reinstall. Reads/writes `~/.claude/.gsd-surface.json`
(sibling to `~/.claude/.gsd-profile`) and re-stages the active skills directory in place.
Skill dirs live at `~/.claude/skills/gsd-*/`.

Sub-commands: list · status · profile · disable · enable · reset
</objective>

## Sub-command routing

Parse the first token of $ARGUMENTS:

| Token | Action |
|---|---|
| `list` | Show enabled + disabled clusters and skills |
| `status` | Alias for `list` plus token cost summary |
| `profile <name>` | Write `baseProfile` and re-stage |
| `profile <n1>,<n2>` | Composed profiles (comma-separated, no spaces) |
| `disable <cluster>` | Add cluster to `disabledClusters`, re-stage |
| `enable <cluster>` | Remove cluster from `disabledClusters`, re-stage |
| `reset` | Delete `.gsd-surface.json`, return to install-time profile |
| *(none)* | Treat as `list` |

---

## list / status

Load the capability registry and call `listSurface(runtimeConfigDir, manifest, CLUSTERS, registry)` from
`gsd-core/bin/lib/surface.cjs`. The registry is loaded via:
```js
const registry = require('gsd-core/bin/lib/capability-registry.cjs');
```
Display:

```
Enabled (N skills, ~T tokens):
core_loop:   new-project  discuss-phase  plan-phase  execute-phase  help  update
audit_review: …
…

Disabled:
utility:  health  stats  settings  …

Token cost: ~T (budget cap ~500 tokens for 200k context @ 1%)
```

For `status` also append:

```
Base profile:   standard  (from .gsd-surface.json)
Install profile: standard  (from .gsd-profile)
```

---

## profile \<name\>

1. Read current surface: `readSurface(runtimeConfigDir)` → if null, seed from `readActiveProfile(runtimeConfigDir)`.
2. Set `surfaceState.baseProfile = name`.
3. `writeSurface(runtimeConfigDir, surfaceState)`.
4. Resolve and re-apply:
```js
const registry = require('gsd-core/bin/lib/capability-registry.cjs');
const layout = resolveRuntimeArtifactLayout(runtime, runtimeConfigDir, scope);
applySurface(runtimeConfigDir, layout, manifest, CLUSTERS, registry);
```
5. Confirm: "Surface updated to profile `<name>`. N skills enabled."

---

## disable \<cluster\>

Valid cluster names: `core_loop`, `audit_review`, `milestone`, `research_ideate`,
`workspace_state`, `docs`, `ui`, `ai_eval`, `ns_meta`, `utility`.

1. Validate cluster name against `Object.keys(CLUSTERS)`.
2. Read or initialize surface state.
3. Add cluster to `surfaceState.disabledClusters` (deduplicate).
4. `writeSurface` → resolve layout → `applySurface`:
```js
const registry = require('gsd-core/bin/lib/capability-registry.cjs');
const layout = resolveRuntimeArtifactLayout(runtime, runtimeConfigDir, scope);
applySurface(runtimeConfigDir, layout, manifest, CLUSTERS, registry);
```
5. Confirm: "Disabled cluster `<cluster>`. N skills removed from surface."

---

## enable \<cluster\>

1. Read surface state; if null, nothing to enable — print "No surface delta active."
2. Remove cluster from `surfaceState.disabledClusters`.
3. `writeSurface` → resolve layout → `applySurface`:
```js
const registry = require('gsd-core/bin/lib/capability-registry.cjs');
const layout = resolveRuntimeArtifactLayout(runtime, runtimeConfigDir, scope);
applySurface(runtimeConfigDir, layout, manifest, CLUSTERS, registry);
```
4. Confirm: "Enabled cluster `<cluster>`. N skills added back to surface."

---

## reset

1. Check if `.gsd-surface.json` exists.
2. Delete it.
3. Re-apply using only `readActiveProfile(runtimeConfigDir)` (install-time profile).
4. Confirm: "Surface reset to install-time profile `<name>`."

---

## runtimeConfigDir resolution

The `runtimeConfigDir` for `applySurface` is the **base Claude config directory**
(`~/.claude`), NOT the skills sub-directory (`~/.claude/skills`).

This matches `installRuntimeArtifacts` and `uninstallRuntimeArtifacts`, which also
receive `~/.claude` as `configDir`. The skill dirs themselves live at
`~/.claude/skills/gsd-*/` because the `claude global` layout has `destSubpath =
'skills'` — they are derived from `configDir`, not the root for it.

```bash
# Claude Code — global install
RUNTIME_CONFIG_DIR="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
SCOPE="global"

# Artifact destinations are derived from runtime layout
# via resolveRuntimeArtifactLayout(runtime, RUNTIME_CONFIG_DIR, SCOPE)
# then applySurface(RUNTIME_CONFIG_DIR, layout, manifest, CLUSTERS)
```

Surface state is stored at `${RUNTIME_CONFIG_DIR}/.gsd-surface.json`
(i.e. `~/.claude/.gsd-surface.json`).

All paths can be overridden by reading the `CLAUDE_CONFIG_DIR` env var if set.

---

## Error handling

- Unknown cluster name → list valid cluster names, exit without writing.
- Unknown profile name → list known profiles (`core`, `standard`, `full`), exit.
- Missing `surface.cjs` → prompt: "Run `npm i -g gsd-core` to reinstall GSD."

<execution_context>
Surface state file: `~/.claude/.gsd-surface.json`
Install profile marker: `~/.claude/.gsd-profile`
Skill dirs: `~/.claude/skills/gsd-*/`
Engine module: `~/.claude/gsd-core/bin/lib/surface.cjs`
Cluster definitions: `~/.claude/gsd-core/bin/lib/clusters.cjs`
</execution_context>

## Contract Reference

- Contract ID: `gsd-command-surface`
- Family: `command`
- Status: `adapted-safe`
- Runtime authority: `.agents/gsd-serena/parity-skills/contracts.json`
- Transition rule: planned — Command row has compatibility coverage but no exact command behavior contract yet.

### Bridge Entrypoints

- `surface`

### Source Evidence

- `vendor/reference/gsd-core/commands/gsd/surface.md` (vendor-command) -> `vendor/reference/gsd-core/commands/gsd/surface.md`

### Unsafe Reference Behaviors

- none recorded

### Test Evidence

- Status: `planned`
- Commands:
- none
- Notes: Requires future exact behavior promotion before claiming runtime artifacts.

### Notes

- Supported for reference-shaped read-only surface list/status reports over local surface/profile marker evidence. Profile switching, enable, disable, reset, runtime config writes, global Claude config mutation, shell execution, and skill re-staging remain blocked fail-closed.
- Bridge surface remains supported for list/status reporting and now includes a Serena surface operation plan for profile/cluster changes, skill restaging, validation, and rollback.

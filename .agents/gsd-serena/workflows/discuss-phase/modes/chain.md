# Bridge Workflow: discuss-phase-modes-chain

<!-- generated-by: pnpm gen:bridge-commands -->

## Purpose

This bridge workflow runbook translates the actual GSD-core workflow information and adapts it for Serena bridge operation. Read it when operating `gsd-workflow-discuss-phase-modes-chain` in a target project.

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

- Contract ID: `gsd-workflow-discuss-phase-modes-chain`
- Status: `planned`
- Source path: `gsd-core/workflows/discuss-phase/modes/chain.md`
- Resolved source path: `vendor/reference/gsd-core/gsd-core/workflows/discuss-phase/modes/chain.md`
- Mirrored runbook path: `.agents/gsd-serena/workflows/discuss-phase/modes/chain.md`

## Translated GSD Workflow

### Native Shim Translation
- Native GSD shim locator omitted: the bridge uses the installed `gsd-serena-bridge` CLI, `bootstrap`, `doctor`, `repair`, resolver packets, and install-managed project surfaces instead of locating `gsd-tools.cjs`.
# --chain mode — interactive discuss, then auto-advance

> **Lazy-loaded.** Read this file from `workflows/discuss-phase.md` when
> `--chain` is present in `$ARGUMENTS`, or when the parent's `auto_advance`
> step needs to dispatch to plan-phase under `--auto`.

## Effect

- Discussion is **fully interactive** — questions, gray-area selection, and
follow-ups behave exactly the same as default mode.
- After discussion completes, **auto-advance to plan-phase → execute-phase**
(same downstream behavior as `--auto`).
- This is the middle ground: the user controls the discuss decisions, then
plan and execute run autonomously.

## auto_advance step (executed by the parent file)

1. Parse `--auto` and `--chain` flags from `$ARGUMENTS`. **Note:** `--all`
is NOT an auto-advance trigger — it only affects area selection. A
session with `--all` but without `--auto` or `--chain` returns to manual
next-steps after discussion completes.

2. **Sync chain flag with intent** — if user invoked manually (no `--auto`
and no `--chain`), clear the ephemeral chain flag from any previous
interrupted `--auto` chain. This does NOT touch `workflow.auto_advance`
(the user's persistent settings preference):
```bash
if [[ ! "$ARGUMENTS" =~ --auto ]] && [[ ! "$ARGUMENTS" =~ --chain ]]; then
- Native query translated: `gsd_run query config-set workflow._auto_chain_active false || true` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
fi
```

3. Read consolidated auto-mode (`active` = chain flag OR user preference):
```bash
- Native query translated: `AUTO_MODE=$(gsd_run query check auto-mode --pick active 2>/dev/null || echo "false")` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
```

4. **If `--auto` or `--chain` flag present AND `AUTO_MODE` is not true:**
Persist chain flag to config (handles direct usage without new-project):
```bash
- Native query translated: `gsd_run query config-set workflow._auto_chain_active true` -> use the closest `gsd-serena-bridge <command> --format markdown`, resolver packet, installed contract, or explicit operation-plan step with validation.
```

5. **If `--auto` flag present OR `--chain` flag present OR `AUTO_MODE` is
true:** display banner and launch plan-phase.

Banner:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GSD ► AUTO-ADVANCING TO PLAN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Context captured. Launching plan-phase...
```

Launch plan-phase using the Skill tool to avoid nested Task sessions
(which cause runtime freezes due to deep agent nesting — see #686):
```
Skill(skill="gsd-plan-phase", args="${PHASE} --auto ${GSD_WS}")
```

This keeps the auto-advance chain flat — discuss, plan, and execute all
run at the same nesting level rather than spawning increasingly deep
Task agents.

6. **Handle plan-phase return:**

- **PHASE COMPLETE** → Full chain succeeded. Display:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GSD ► PHASE ${PHASE} COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Auto-advance pipeline finished: discuss → plan → execute

/clear then:

Next: `gsd-serena-bridge discuss-phase --format markdown` ${NEXT_PHASE} ${WAS_CHAIN ? "--chain" : "--auto"} ${GSD_WS}
```
- **PLANNING COMPLETE** → Planning done, execution didn't complete:
```
Auto-advance partial: Planning complete, execution did not finish.
Continue: `gsd-serena-bridge execute-phase --format markdown` ${PHASE} ${GSD_WS}
```
- **PLANNING INCONCLUSIVE / CHECKPOINT** → Stop chain:
```
Auto-advance stopped: Planning needs input.
Continue: `gsd-serena-bridge plan-phase --format markdown` ${PHASE} ${GSD_WS}
```
- **GAPS FOUND** → Stop chain:
```
Auto-advance stopped: Gaps found during execution.
Continue: `gsd-serena-bridge plan-phase --format markdown` ${PHASE} --gaps ${GSD_WS}
```

7. **If none of `--auto`, `--chain`, nor config enabled:** route to
`confirm_creation` step (existing behavior — show manual next steps).

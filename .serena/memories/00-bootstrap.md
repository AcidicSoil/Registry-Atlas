# Serena GSD Bridge Bootstrap

This repository uses `serena-gsd-bridge` as the project-session control plane for Serena-backed GSD work. In this source repository, Serena is also a contributor and maintainer of the bridge: dogfooding the tool is product validation, and bridge defects discovered while using it are in-scope maintenance work.

When a user asks for project workflow, planning, implementation, verification, shipping, parity, install/distribution, or bridge-session work, do not infer workflow state from chat history. Use repo-local bridge output, `.planning/STATE.md`, and `.planning/.bridge/*` artifacts as workflow truth.

First read `.serena/memories/10-bridge-invocation.md` before driving bridge workflow.

When a task mentions installed GSD agents, agent skills, planner/checker/verifier roles, hooks, scripts, templates, references, or `gsd-core` runtime files, also read `.serena/memories/20-gsd-agent-runtime.md` and `.serena/memories/21-gsd-agent-dispatch.md`.

Project-local memories in this directory are intentionally small and project-specific. They bootstrap the active repository and point Serena at local commands, state, and conventions. Broader reusable bridge behavior belongs in the user Serena global memory store under `global/serena-gsd-bridge/*`, distributed from `assets/serena/global-memories/serena-gsd-bridge/`.

## Automatic repair rule

If `gsd-serena-bridge bootstrap --format markdown` or `gsd-serena-bridge doctor --format markdown` reports stale/broken bridge-owned install-managed setup, run `gsd-serena-bridge repair --format markdown`, rerun doctor, then continue from bootstrap/state-next. Repair is for bridge-owned installed surfaces only; preserve user-owned `.planning/STATE.md`, native `.gsd/**`, and product files.

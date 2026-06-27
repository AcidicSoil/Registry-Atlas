# GSD Bridge Native Skills

<!-- generated-by: pnpm gen:bridge-commands -->

This directory contains generated bridge-native source-informed role runbook skills. Command and workflow authority lives in the vendor-shaped `.agents/gsd-serena/commands/gsd/*.md` and `.agents/gsd-serena/workflows/**` trees. This asset mirror is packaged and installed into target projects as `.agents/skills/GSD-BRIDGE/**`.

The source of truth is `.agents/gsd-serena/parity-skills/contracts.json`. Actual GSD-core command/workflow/agent source content is resolved from committed vendor reference files and preserved inside the generated skills where available. Workflow rows also generate installed bridge workflow runbooks under `.agents/gsd-serena/workflows/**`.

## Counts

- commands: 0
- workflows: 0
- roles: 33
- total: 33

## Quality Contract

Generated role skills must be source-informed procedural runbooks. They must include translated GSD-core source material where available, bridge substitution rules, setup/repair preflight, procedure, decision flow, validation, recovery, boundaries, and completion reporting. Contract metadata belongs after the source/process sections, not as the main skill body.

## Regeneration

```bash
pnpm gen:bridge-commands
pnpm check:bridge-commands
```

## Safety

Generated role skills, command Markdown, and workflow runbooks describe how to drive bridge flows safely. They do not promote unsupported vendor-native behavior, do not authorize writes outside bridge contracts, and do not replace command validators or operation plans.

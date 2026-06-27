# GSD Bridge Workflow Runbooks

<!-- generated-by: pnpm gen:bridge-commands -->

This asset mirror is packaged and installed into target projects as `.agents/gsd-serena/workflows/**`.

Each file mirrors the GSD-core workflow source path and adds a Serena bridge adaptation layer. Agents should use these runbooks for workflow intent and decision logic, then execute through `gsd-serena-bridge` commands, resolver packets, or explicit operation plans.

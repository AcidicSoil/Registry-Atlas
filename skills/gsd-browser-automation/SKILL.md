# GSD Browser Automation

Use this skill whenever work touches browser-facing UI, routes, forms, navigation, layout, client-side behavior, or any frontend user flow.

## Rule

When frontend work is implemented, check the work with GSD Browser before marking it done.

GSD Core owns the plan, task scope, completion criteria, and `.planning/` state. GSD Browser owns browser automation and browser evidence.

## Access path

Use GSD Browser MCP tools only when the current runtime exposes them.

In Serena/ChatGPT hosts, MCP browser tools are not exposed. Treat the `gsd-browser` CLI as the normal access path for this host.

## CLI pattern for this host

Use a named session per phase, quick task, or verification pass:

```bash
SESSION="phase-or-task-name"

mkdir -p .planning/browser-artifacts

gsd-browser --session "$SESSION" navigate http://localhost:3000
gsd-browser --session "$SESSION" snapshot
gsd-browser --session "$SESSION" screenshot \
  --output ".planning/browser-artifacts/${SESSION}.png" \
  --format png
```

For human oversight, open the live viewer for the same session:

```bash
gsd-browser --session "$SESSION" view
```

## Browser work checklist

For every browser-facing change:

1. Start or reuse a named GSD Browser session.
2. Navigate to the affected route or user flow.
3. Take a fresh snapshot after navigation, reload, form submit, modal change, menu open/close, or other major DOM change.
4. Exercise the changed behavior.
5. Capture screenshot or debug bundle evidence under `.planning/browser-artifacts/`.
6. Report the session name, route, action path, and artifact path in the GSD summary or verification output.

## Stale state rule

If an interaction target or ref is stale, do not retry the same stale target. Take a fresh snapshot and continue from the new browser state.

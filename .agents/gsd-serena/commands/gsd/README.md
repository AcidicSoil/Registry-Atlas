# GSD Bridge Command Markdown

<!-- generated-by: pnpm gen:bridge-commands -->

This directory contains generated bridge command Markdown artifacts. This asset mirror is packaged and installed into target projects as `.agents/gsd-serena/commands/gsd/*.md`.

Vendor GSD-core commands are Markdown files under `commands/gsd/*.md`; these generated bridge command files preserve that model as the first-class command artifact. Command and workflow `SKILL.md` outputs are intentionally not generated. Vendor-shaped runtime skills, when present, live under `.agents/gsd-serena/skills/gsd-*/SKILL.md`.

## Counts

- commands: 69

## Regeneration

```bash
pnpm gen:bridge-commands
pnpm check:bridge-commands
```

## Safety

Command Markdown files describe bridge-safe command operation. They do not promote unsupported vendor-native behavior, do not authorize writes outside bridge contracts, and do not replace command validators or operation plans.

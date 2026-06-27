# GSD Serena Registry

This directory contains the bridge registry used to adapt GSD workflow concepts into Serena-compatible packets.

## Schema versioning

`manifest.json` and referenced specs use `schemaVersion: 1`.

Bump `schemaVersion` only when a loader cannot safely interpret older data without an explicit migration. Do not rename existing command keys without aliases or migration support.

## Path rules

Registry paths are relative to `.agents/gsd-serena/`, use forward slashes, and must not contain absolute paths, parent traversal, or globs.

Skill policy entries must reference exact `SKILL.md` files and include:

- `path`
- `required`
- `reason`
- `lifecycle`
- `usageEvidence`

## Runtime capability contracts

`runtime-capability-contracts.json` is generated from:

- `reference-compatibility.json`
- `vendor-core-artifact-contracts.json`

Generate or refresh it with:

```bash
pnpm gen:runtime-capability-contracts
```

Check drift with:

```bash
pnpm check:runtime-capability-contracts
```

The generated registry must contain one row for every reference command and every vendor-core artifact. Runtime statuses are intentionally executable-status values only: `exact`, `local-equivalent`, `external-adapter`, or `destructive-with-confirmation`. Compatibility labels such as `adapted-safe`, `manual-fallback`, `blocked`, or `planned` may be retained as historical/source fields, but they are not allowed as runtime capability statuses.

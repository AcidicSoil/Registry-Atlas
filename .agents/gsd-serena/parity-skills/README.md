# Bridge Parity Skill Contracts

This directory is the bridge-owned home for parity skill contract artifacts.

The contract matrix is the source that lets behavior verification cover skills as well as commands. It does not make generic `.agents/skills/**` catalogs runtime authority. Bridge packets and validators may use parity skill contracts only through explicit bridge-owned registry or packet references.

## Contract artifacts

- `contract.schema.json` — required shape and vocabulary for per-skill contract rows.
- `contracts.json` — generated machine-readable matrix, created by a later task.
- `contracts.md` — generated human-review matrix, created by a later task.

## Families

- `command` — a bridge command or reference command target.
- `workflow` — a reference workflow prompt or workflow support target.
- `role` — a reference role/agent target represented through a Serena role frame.
- `reference` — a reference document asset.
- `template` — a template asset.
- `context` — a context asset.

## Statuses

- `planned` — contract row exists, implementation behavior is not yet exact.
- `implemented` — bridge-owned skill behavior exists with validation evidence.
- `supported` — exact supported behavior for a mapped command or skill.
- `adapted-safe` — behavior is intentionally adapted for bridge safety.
- `manual-fallback` — behavior requires bounded manual fallback.
- `blocked` — behavior must not run until a blocker is resolved.
- `asset-only` — row describes a supporting asset with no runtime transition or file-write behavior.

## Safety rules

- Planned and asset-only rows must not claim runtime transitions.
- Command rows with exact behavior must preserve validation commands and transition rules from command behavior contracts.
- Non-command rows must stay conservative until explicit runtime integration exists.
- Every row must include source evidence, read/write fields, validation expectations, transition or no-transition semantics, unsafe behavior notes, and test evidence.

<!-- generated-by: pnpm gen:bridge-runtime-surface -->
# GSD Canonical Artifact Registry

This directory contains the template files for every artifact that GSD workflows officially produce. The table below is the authoritative index: **if a `.planning/` root file is not listed here, `gsd-health` will flag it as W019** (unrecognized artifact).

Agents should query this file before treating a `.planning/` file as authoritative. If the file name does not appear below, it is not a canonical GSD artifact.

---

## `.planning/` Root Artifacts

These files live directly at `.planning/` — not inside phase subdirectories.

| File | Template | Produced by | Purpose |
|------|----------|-------------|---------|
| `PROJECT.md` | `project.md` | `gsd-serena-bridge new-project --format markdown` | Project identity, goals, requirements summary |
| `ROADMAP.md` | `roadmap.md` | `gsd-serena-bridge new-milestone --format markdown`, `gsd-serena-bridge new-project --format markdown` | Phase plan with milestones and progress tracking |
| `STATE.md` | `state.md` | `gsd-serena-bridge new-project --format markdown`, `gsd-serena-bridge health --format markdown --repair` | Current session state, active phase, last activity |
| `REQUIREMENTS.md` | `requirements.md` | `gsd-serena-bridge new-milestone --format markdown` | Functional requirements with traceability |
| `MILESTONES.md` | `milestone.md` | `gsd-serena-bridge complete-milestone --format markdown` | Log of completed milestones with accomplishments |
| `BACKLOG.md` | *(inline)* | `gsd-serena-bridge add-backlog --format markdown` | Pending ideas and deferred work |
| `LEARNINGS.md` | *(inline)* | `gsd-serena-bridge extract-learnings --format markdown`, `gsd-serena-bridge execute-phase --format markdown` | Phase retrospective learnings for future plans |
| `THREADS.md` | *(inline)* | `gsd-serena-bridge thread --format markdown` | Persistent discussion threads |
| `config.json` | `config.json` | `gsd-serena-bridge new-project --format markdown`, `gsd-serena-bridge health --format markdown --repair` | Project-specific GSD configuration |
| `AGENTS.md` | `claude-md.md` | `gsd-serena-bridge profile --format markdown` | Auto-assembled Claude Code context file |
| `RETROSPECTIVE.md` | *(inline)* | `gsd-serena-bridge complete-milestone --format markdown` | Living milestone retrospective updated at each milestone close |

### Version-stamped artifacts (pattern: `vX.Y-*.md`)

| Pattern | Produced by | Purpose |
|---------|-------------|---------|
| `vX.Y-MILESTONE-AUDIT.md` | `gsd-serena-bridge audit-milestone --format markdown` | Milestone audit report before archiving |

These files are archived to `.planning/milestones/` by `gsd-serena-bridge complete-milestone --format markdown`. Finding them at the `.planning/` root after completion indicates the archive step was skipped.

---

## Phase Subdirectory Artifacts (`.planning/phases/NN-name/`)

These files live inside a phase directory. They are NOT checked by W019 (which only inspects the `.planning/` root).

| File Pattern | Template | Produced by | Purpose |
|-------------|----------|-------------|---------|
| `NN-MM-PLAN.md` | `phase-prompt.md` | `gsd-serena-bridge plan-phase --format markdown` | Executable implementation plan |
| `NN-MM-SUMMARY.md` | `summary.md` | `gsd-serena-bridge execute-phase --format markdown` | Post-execution summary with learnings |
| `NN-CONTEXT.md` | `context.md` | `gsd-serena-bridge discuss-phase --format markdown` | Scoped discussion decisions for the phase |
| `NN-RESEARCH.md` | `research.md` | `gsd-serena-bridge plan-phase --format markdown`, `gsd-serena-bridge plan-phase --format markdown --research-phase <N>` | Technical research for the phase |
| `NN-VALIDATION.md` | `VALIDATION.md` | `gsd-serena-bridge plan-phase --format markdown` (Nyquist) | Validation architecture (Nyquist method) |
| `NN-UAT.md` | `UAT.md` | `gsd-serena-bridge validate-phase --format markdown` | User acceptance test results |
| `NN-PATTERNS.md` | *(inline)* | `gsd-serena-bridge plan-phase --format markdown` (pattern mapper) | Analog file mapping for the phase |
| `NN-UI-SPEC.md` | `UI-SPEC.md` | `gsd-serena-bridge ui-phase --format markdown` | UI design contract |
| `NN-SECURITY.md` | `SECURITY.md` | `gsd-serena-bridge secure-phase --format markdown` | Security threat model |
| `NN-AI-SPEC.md` | `AI-SPEC.md` | `gsd-serena-bridge ai-integration-phase --format markdown` | AI integration spec with eval strategy |
| `NN-DEBUG.md` | `DEBUG.md` | `gsd-serena-bridge debug --format markdown` | Debug session log |
| `NN-REVIEWS.md` | *(inline)* | `gsd-serena-bridge review --format markdown` | Cross-AI review feedback |

---

## Milestone Archive (`.planning/milestones/`)

Files archived by `gsd-serena-bridge complete-milestone --format markdown`. These are never checked by W019.

| File Pattern | Source |
|-------------|--------|
| `vX.Y-ROADMAP.md` | Snapshot of ROADMAP.md at milestone close |
| `vX.Y-REQUIREMENTS.md` | Snapshot of REQUIREMENTS.md at milestone close |
| `vX.Y-MILESTONE-AUDIT.md` | Moved from `.planning/` root |
| `vX.Y-phases/` | Archived phase directories (if `--archive-phases` used) |

---

## Adding a New Canonical Artifact

When a new workflow produces a `.planning/` root file:

1. Add the file name to `CANONICAL_EXACT` in `gsd-core/bin/lib/artifacts.cjs`
2. Add a row to the **`.planning/` Root Artifacts** table above
3. Add the template to `gsd-core/templates/` if one exists

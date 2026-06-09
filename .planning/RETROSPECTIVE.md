# Retrospective

## Milestone: v1.0 — Registry Atlas v1

**Shipped:** 2026-06-09
**Phases:** 4 | **Plans:** 17

### What Was Built

- A static Vite/vanilla TypeScript Registry Atlas SPA with a maintained verification gate.
- Official shadcn registry mirror sync, normalized runtime data, and validation reports.
- Component-first discovery, item summaries, neutral coverage states, and registry profiles.
- Copy-only install/inspect actions, source/raw links, and a deduped local queue.
- URL state for shareable discovery context and release/browser/accessibility smoke documentation.

### What Worked

- Keeping core logic pure made command generation, queue transforms, URL state, and validation straightforward to test.
- Running `pnpm verify` as the single release gate kept local and CI expectations aligned.
- Explicit source-boundary language reduced the risk of implying third-party registry endorsement.

### What Was Inefficient

- Some GSD state artifacts lagged behind actual phase summaries and needed manual reconciliation at closeout.
- Requirements traceability for earlier phases was not updated automatically, so milestone close needed archive cleanup.
- The generic incomplete-plan detector expected a different summary filename convention and produced false positives.

### Patterns Established

- Use shared safe-render/link helpers for all registry-derived content.
- Gate install commands on route eligibility and validated namespace/item tokens.
- Keep install queue state local; use URLs only for discovery context.
- Document browser smoke checks as release artifacts when UI behavior matters.

### Key Lessons

- Summary naming conventions should be normalized or taught to GSD so resume/closeout checks do not misclassify completed plans.
- Phase completion should update REQUIREMENTS.md traceability immediately, not only at milestone close.
- Copy-only security posture should remain visible anywhere install commands are surfaced.

### Cost Observations

- Model mix: not tracked.
- Sessions: multiple phase execution and closeout sessions.
- Notable: verification and browser smoke artifacts made final shipping low-risk despite stale state metadata.

## Cross-Milestone Trends

| Milestone | Phases | Plans | Primary Theme | Notes |
|-----------|--------|-------|---------------|-------|
| v1.0 | 4 | 17 | Static shadcn registry discovery companion | Established data mirror, discovery, install actions, and release gate |

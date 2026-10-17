# Registry Atlas remaining standards work, 2026-10-17

This is a working queue, **not a compliance certificate**. Current structural checker has 279 unresolved applicable controls after recording 13 compliant, 380 reviewed-not-applicable, two remediations, and 277 unevaluated applicable checks. Source and app-specific evidence must determine any future outcome.

| Domain | Unevaluated | Next evidence-based audit |
| --- | ---: | --- |
| Frontend | 61 | WCAG 2.2 keyboard/zoom/reflow/contrast checks, real component tokens and responsive breakpoints; separate React Grab status already not applicable to native DOM frontend |
| Testing | 45 | Existing unit/E2E coverage, stateful error paths, test artifacts, optional integration boundary checks |
| Orchestration | 45 | Audit which agent/workflow rules actually apply to a static registry website and its maintainer process; only reclassify after source-specific inspection |
| Delivery | 44 | Release provenance, CI branch protection, artifact retention, README/change history; avoid rewriting pushed commits |
| Platform | 26 | Production build performance, deploy/readiness checks, safe rollback and local database service |
| Planning | 21 | Review scope-specific planning rules, existing design and work briefs, traceable user decisions |
| Architecture | 19 | Dependency boundaries, component catalog structure, complexity and high-risk data flow |
| Backend | 11 | PostgreSQL schema/migrations, recovery, index/drift checks and documented self-hosted choices |
| Security | 4 | Dependency-chain provenance, hostile metadata handling, input/output schema boundaries |
| Tooling | 1 | VoidZero-toolchain compatibility versus existing Vite, Oxlint and project quality tools; user decision required for replacements |

## Immediate impediments

1. **Workbench-shell contract:** A newly introduced PPM policy requires a complete version-pinned chat-oriented Workbench Shell, even though this repository is a static component catalog. Do not silently retrofit chat/model/composer/settings modules or mark an exception without a user direction. Exact decision alternatives are in `.design/workbench-shell-gap-2026-10-17.md`.
2. **Supply chain:** No known CVEs, and CycloneDX SBOM builds successfully. Database-backed public releases and provenance attestation are still paused; verification must occur with an authorized trusted publishing setup.
3. **Conventional commits:** 83/308 historical subjects fail current strict format; GitHub Actions gates new commits. Do not rebase published main solely to erase history.

## Operating order

1. Finish workbench-shell applicability decision; keep the new policy blocked pending explicit scope choice.
2. Audit high-risk security/DB and accessibility rules one by one against source, tests and runtime evidence; fix concrete gaps with regression tests.
3. Triage development-tool and orchestration-specific rules against actual deployed stack and maintainer process. Preserve source-specific rationale, never auto-waive by filename or skill grouping.
4. Resolve the trusted publisher/provenance requirement when an authorized release workflow is available.
5. Run `pnpm verify`, desktop and mobile browser acceptance, `project_standards.py check`, and closing conformance. Report global certification **only when all applicable rules pass**.

No Neon or external quota-limited database is involved in this process.

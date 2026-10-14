# Registry Atlas standards re-audit — 2026-10-14

**Status: review fingerprints current; global certification blocked.**

This re-audit follows the local PostgreSQL migration, changed Vite UI, source-preview changes and new deterministic e2e verification skill. The original applicability and compliance decisions are preserved from the previously reviewed baseline at Git HEAD. The current OrchestKit catalog has **109 skills, 667 references**; all existing rule digests still match. The refreshed project stack, `DESIGN.md` and current evidence file digests are recorded in `.design/standards.json`.

## Scope and evidence

- Carried forward the prior recorded applicability rationales only after confirming unchanged rule-source digests and existing evidence paths. Compared the current architecture to `DESIGN.md`, `index.html`, `src/registry-explorer/entry.ts`, `package.json`, and the change history from the original baseline commit `f90e3e3`. The browser remains a static Vite + DOM app, but tests and the database infrastructure changed.
- Compared all referenced evidence paths and checked that every file exists and that the rule source digests remain unchanged. **23 existing evidence files** changed since the prior assessment. Refreshed their hashes; retained prior compliance statuses and missing approvals rather than granting them.
- Regenerated the local snapshots from self-hosted PostgreSQL and ran `pnpm verify` on 2026-10-14: **573 passing tests, 8 opt-in skips**, PostgreSQL integrity and product contract passed, data-validation errors **0**, production Vite build passed. The four HTTP-source warnings concern published upstream URLs. Repeated `pnpm test:e2e` initially exposed an assertion timing issue on the large detail page; the e2e runner now uses documented 20-second assertion and 90-second action budgets, and the final four-test production-browser run passed.
- The separately created production-browser e2e skill exercised real catalog navigation, source-image loading and the setup-cart user path. Those **4 e2e tests passed** in the latest `pnpm test:e2e` run with traces under `.e2e/results/`; the earlier clean run is preserved under `.e2e/proof/production-four-flows/`.
- The deterministic reconciliation command is `python3 .design/tools/restore-reviewed-applicability.py --project "$PWD"`. The `--apply` option only restores the previous applicability/compliance assessments if the rule source and referenced files still exist; it **does not** assert compliance, authorize proposals or change any status from unevaluated to compliant. Re-run `project_standards.py refresh` when the project stack changes again, then re-review before applying.

## Measured outcome

| Standard disposition | Count | Meaning |
| --- | ---: | --- |
| Not applicable, previous rationale preserved | 379 | Not a compliance claim |
| Applicable, compliant with existing evidence | 3 | Previously assessed controls; rechecked core app tests |
| Applicable, still unevaluated | 277 | Needs distinct rule-by-rule verification |
| Applicable, remediation required | 4 | Confirmed issues listed below |
| Applicable, approval pending | 4 | Technical gates work, PAO decisions absent |
| Stale review evidence or missing applicability review | **0** | Reconciled |

**Result:** `project_standards.py check` reports **285 blockers**. No stale source hashes, stack fingerprints or `DESIGN.md` fingerprints remain. This is **not** a passing certification.

## Confirmed remediation requirements

| Existing standard | Current evidence | Disposition |
| --- | --- | --- |
| `accessibility/rules/wcag-native-html-first.md` | Mobile navigation still gives an `aside` `role="dialog"` and manually traps focus; the recorded native-`dialog` proposal remains open | Needs user-approved replacement and browser verification |
| `interaction-patterns/rules/interaction-infinite-scroll.md` | Six catalog views still render numbered Previous/Next links via `catalog-pagination` and `data-discovery-page` | Implement the existing incremental-scroll requirement and verify accessible load more |
| `security-patterns/rules/supply-chain.md` | Configured dependency audit passes its moderate threshold, but the low-severity advisory and release SBOM/provenance work remain | Evaluate provenance and the advisory, do not waive |
| `commit/rules/conventional-format.md` | Earlier history contains nonconventional subjects; never rewrite shared history | Gate future commits without rewriting previous ones |

The proposals are already present in `.design/standards.json`. No migration approval was fabricated, no tooling replaced as part of this audit, and no remediation was silently marked complete.

## Pending PAO decisions

`policy:anti-slop-typescript`, `policy:cccc-complexity`, `policy:dependency-cruiser` and `policy:react-doctor` are technically installed, pinned, and verified by the normal checks. Their previous records deliberately remain `pending-approval` until the PAO authority supplies real tooling-adoption decision references. A chat instruction to proceed is not a fabricated `pao:` reference.

## Remaining assessment work

The carried-forward applicability review is not a fresh behavioral audit of every rule. The 277 applicable but unevaluated OrchestKit rules include accessibility, responsive behavior, security, testing, architecture, performance, deployment and process requirements. They are not automatically satisfied by the green build. Close each with source-specific evidence and behavioral tests, or reclassify as not applicable only after inspecting its exact rule and project scope.

**Release gate:** keep `project_standards.py check` and `verify_conformance.py` blocked until these substantive items pass. No global certification should be reported or used to authorize deployment.

# Bridge Parity Skill Contract Matrix

Generated from the parity skill index, bridge behavior contracts, compatibility matrix, and command specs.

## Counts

| Family | Count |
|---|---:|
| command | 69 |
| workflow | 108 |
| role | 33 |
| reference | 69 |
| template | 46 |
| context | 3 |
| total | 328 |

## Status semantics

- `supported`, `implemented`, `adapted-safe`, and `manual-fallback` rows may describe runtime behavior only when backed by bridge evidence.
- `planned` rows are coverage contracts, not implementation completion evidence.
- `asset-only` rows describe supporting reference/template/context assets with no runtime transition behavior.
- `blocked` rows must not be used as runtime behavior until blockers are resolved.

## command

| ID | Status | Entrypoints | Validation | Transition | Source |
|---|---|---|---|---|---|
| `gsd-command-add-tests` | adapted-safe | `add-tests` | None | planned | `vendor/reference/gsd-core/commands/gsd/add-tests.md` |
| `gsd-command-ai-integration-phase` | adapted-safe | `ai-integration-phase` | None | planned | `vendor/reference/gsd-core/commands/gsd/ai-integration-phase.md` |
| `gsd-command-audit-fix` | adapted-safe | `audit-fix` | None | planned | `vendor/reference/gsd-core/commands/gsd/audit-fix.md` |
| `gsd-command-audit-milestone` | adapted-safe | `audit-milestone` | None | planned | `vendor/reference/gsd-core/commands/gsd/audit-milestone.md` |
| `gsd-command-audit-uat` | adapted-safe | `audit-uat` | None | planned | `vendor/reference/gsd-core/commands/gsd/audit-uat.md` |
| `gsd-command-autonomous` | adapted-safe | `autonomous` | None | planned | `vendor/reference/gsd-core/commands/gsd/autonomous.md` |
| `gsd-command-capture` | adapted-safe | `capture` | None | planned | `vendor/reference/gsd-core/commands/gsd/capture.md` |
| `gsd-command-cleanup` | adapted-safe | `cleanup` | None | planned | `vendor/reference/gsd-core/commands/gsd/cleanup.md` |
| `gsd-command-code-review` | adapted-safe | `code-review` | None | planned | `vendor/reference/gsd-core/commands/gsd/code-review.md` |
| `gsd-command-complete-milestone` | adapted-safe | `complete-milestone` | None | planned | `vendor/reference/gsd-core/commands/gsd/complete-milestone.md` |
| `gsd-command-config` | adapted-safe | `config` | None | planned | `vendor/reference/gsd-core/commands/gsd/config.md` |
| `gsd-command-debug` | adapted-safe | `debug` | None | planned | `vendor/reference/gsd-core/commands/gsd/debug.md` |
| `gsd-command-discuss-phase` | adapted-safe | `discuss-phase` | `gsd-serena-bridge validate discuss-phase --phase <phase> --format json` | planned -> phase-context-ready | `vendor/reference/gsd-core/commands/gsd/discuss-phase.md`<br>`.agents/gsd-serena/commands/discuss-phase.json` |
| `gsd-command-docs-update` | adapted-safe | `docs-update` | None | planned | `vendor/reference/gsd-core/commands/gsd/docs-update.md` |
| `gsd-command-eval-review` | adapted-safe | `eval-review` | None | planned | `vendor/reference/gsd-core/commands/gsd/eval-review.md` |
| `gsd-command-execute-phase` | adapted-safe | `execute-phase` | `gsd-serena-bridge validate execute-phase --phase <phase> --format json` | phase-planned -> phase-executed | `vendor/reference/gsd-core/commands/gsd/execute-phase.md`<br>`.agents/gsd-serena/commands/execute-phase.json` |
| `gsd-command-explore` | adapted-safe | `explore` | None | planned | `vendor/reference/gsd-core/commands/gsd/explore.md` |
| `gsd-command-extract-learnings` | adapted-safe | `extract-learnings` | None | planned | `vendor/reference/gsd-core/commands/gsd/extract-learnings.md` |
| `gsd-command-fast` | adapted-safe | `fast` | None | planned | `vendor/reference/gsd-core/commands/gsd/fast.md` |
| `gsd-command-forensics` | adapted-safe | `forensics` | None | planned | `vendor/reference/gsd-core/commands/gsd/forensics.md` |
| `gsd-command-graphify` | adapted-safe | `graphify` | None | planned | `vendor/reference/gsd-core/commands/gsd/graphify.md` |
| `gsd-command-health` | adapted-safe | `health` | None | planned | `vendor/reference/gsd-core/commands/gsd/health.md` |
| `gsd-command-help` | adapted-safe | `help` | None | planned | `vendor/reference/gsd-core/commands/gsd/help.md` |
| `gsd-command-import` | adapted-safe | `import` | None | planned | `vendor/reference/gsd-core/commands/gsd/import.md` |
| `gsd-command-inbox` | adapted-safe | `inbox` | None | planned | `vendor/reference/gsd-core/commands/gsd/inbox.md` |
| `gsd-command-ingest-docs` | adapted-safe | `ingest-docs` | None | planned | `vendor/reference/gsd-core/commands/gsd/ingest-docs.md` |
| `gsd-command-manager` | adapted-safe | `manager` | None | planned | `vendor/reference/gsd-core/commands/gsd/manager.md` |
| `gsd-command-map-codebase` | supported | `map-codebase` | `gsd-serena-bridge validate map-codebase --format json` | init -> mapped | `vendor/reference/gsd-core/commands/gsd/map-codebase.md`<br>`.agents/gsd-serena/commands/map-codebase.json` |
| `gsd-command-mempalace-capture` | adapted-safe | `mempalace-capture` | None | planned | `vendor/reference/gsd-core/commands/gsd/mempalace-capture.md` |
| `gsd-command-mempalace-recall` | adapted-safe | `mempalace-recall` | None | planned | `vendor/reference/gsd-core/commands/gsd/mempalace-recall.md` |
| `gsd-command-milestone-summary` | adapted-safe | `milestone-summary` | None | planned | `vendor/reference/gsd-core/commands/gsd/milestone-summary.md` |
| `gsd-command-mvp-phase` | adapted-safe | `mvp-phase` | None | planned | `vendor/reference/gsd-core/commands/gsd/mvp-phase.md` |
| `gsd-command-new-milestone` | adapted-safe | `new-milestone` | None | planned | `vendor/reference/gsd-core/commands/gsd/new-milestone.md` |
| `gsd-command-new-project` | adapted-safe | `new-project` | `gsd-serena-bridge validate new-project --format json` | init -> planned | `vendor/reference/gsd-core/commands/gsd/new-project.md`<br>`.agents/gsd-serena/commands/new-project.json` |
| `gsd-command-ns-context` | adapted-safe | `ns-context` | None | planned | `vendor/reference/gsd-core/commands/gsd/ns-context.md` |
| `gsd-command-ns-ideate` | adapted-safe | `ns-ideate` | None | planned | `vendor/reference/gsd-core/commands/gsd/ns-ideate.md` |
| `gsd-command-ns-manage` | adapted-safe | `ns-manage` | None | planned | `vendor/reference/gsd-core/commands/gsd/ns-manage.md` |
| `gsd-command-ns-project` | adapted-safe | `ns-project` | None | planned | `vendor/reference/gsd-core/commands/gsd/ns-project.md` |
| `gsd-command-ns-review` | adapted-safe | `ns-review` | None | planned | `vendor/reference/gsd-core/commands/gsd/ns-review.md` |
| `gsd-command-ns-workflow` | adapted-safe | `ns-workflow` | None | planned | `vendor/reference/gsd-core/commands/gsd/ns-workflow.md` |
| `gsd-command-pause-work` | adapted-safe | `pause-work` | `pnpm vitest run tests/gsd-serena/commands/pause-resume.test.ts` | adapted-safe | `vendor/reference/gsd-core/commands/gsd/pause-work.md` |
| `gsd-command-phase` | adapted-safe | `phase` | None | planned | `vendor/reference/gsd-core/commands/gsd/phase.md` |
| `gsd-command-plan-phase` | adapted-safe | `plan-phase` | `gsd-serena-bridge validate plan-phase --phase <phase> --format json` | phase-context-ready -> phase-planned | `vendor/reference/gsd-core/commands/gsd/plan-phase.md`<br>`.agents/gsd-serena/commands/plan-phase.json` |
| `gsd-command-plan-review-convergence` | adapted-safe | `plan-review-convergence` | None | planned | `vendor/reference/gsd-core/commands/gsd/plan-review-convergence.md` |
| `gsd-command-pr-branch` | adapted-safe | `pr-branch` | None | planned | `vendor/reference/gsd-core/commands/gsd/pr-branch.md` |
| `gsd-command-profile-user` | adapted-safe | `profile-user` | None | planned | `vendor/reference/gsd-core/commands/gsd/profile-user.md` |
| `gsd-command-progress` | adapted-safe | `progress` | None | planned | `vendor/reference/gsd-core/commands/gsd/progress.md` |
| `gsd-command-quick` | adapted-safe | `quick` | None | planned | `vendor/reference/gsd-core/commands/gsd/quick.md` |
| `gsd-command-resume-work` | adapted-safe | `resume-work` | None | planned | `vendor/reference/gsd-core/commands/gsd/resume-work.md` |
| `gsd-command-review` | adapted-safe | `review` | None | planned | `vendor/reference/gsd-core/commands/gsd/review.md` |
| `gsd-command-review-backlog` | adapted-safe | `review-backlog` | None | planned | `vendor/reference/gsd-core/commands/gsd/review-backlog.md` |
| `gsd-command-secure-phase` | adapted-safe | `secure-phase` | None | planned | `vendor/reference/gsd-core/commands/gsd/secure-phase.md` |
| `gsd-command-settings` | adapted-safe | `settings` | None | planned | `vendor/reference/gsd-core/commands/gsd/settings.md` |
| `gsd-command-ship` | manual-fallback | `ship` | `gsd-serena-bridge validate ship --phase <phase> --format json` | shipping-ready -> shipped | `vendor/reference/gsd-core/commands/gsd/ship.md`<br>`.agents/gsd-serena/commands/ship.json` |
| `gsd-command-sketch` | adapted-safe | `sketch` | None | planned | `vendor/reference/gsd-core/commands/gsd/sketch.md` |
| `gsd-command-spec-phase` | adapted-safe | `spec-phase` | None | planned | `vendor/reference/gsd-core/commands/gsd/spec-phase.md` |
| `gsd-command-spike` | adapted-safe | `spike` | None | planned | `vendor/reference/gsd-core/commands/gsd/spike.md` |
| `gsd-command-stats` | adapted-safe | `stats` | None | planned | `vendor/reference/gsd-core/commands/gsd/stats.md` |
| `gsd-command-surface` | adapted-safe | `surface` | None | planned | `vendor/reference/gsd-core/commands/gsd/surface.md` |
| `gsd-command-thread` | adapted-safe | `thread` | None | planned | `vendor/reference/gsd-core/commands/gsd/thread.md` |
| `gsd-command-ui-phase` | adapted-safe | `ui-phase` | None | planned | `vendor/reference/gsd-core/commands/gsd/ui-phase.md` |
| `gsd-command-ui-review` | adapted-safe | `ui-review` | None | planned | `vendor/reference/gsd-core/commands/gsd/ui-review.md` |
| `gsd-command-ultraplan-phase` | adapted-safe | `ultraplan-phase` | None | planned | `vendor/reference/gsd-core/commands/gsd/ultraplan-phase.md` |
| `gsd-command-undo` | adapted-safe | `undo` | None | planned | `vendor/reference/gsd-core/commands/gsd/undo.md` |
| `gsd-command-update` | adapted-safe | `update` | None | planned | `vendor/reference/gsd-core/commands/gsd/update.md` |
| `gsd-command-validate-phase` | adapted-safe | `validate-phase` | None | planned | `vendor/reference/gsd-core/commands/gsd/validate-phase.md` |
| `gsd-command-verify-work` | adapted-safe | `verify-work` | `gsd-serena-bridge validate verify-work --phase <phase> --format json` | phase-executed -> phase-uat-passed | `vendor/reference/gsd-core/commands/gsd/verify-work.md`<br>`.agents/gsd-serena/commands/verify-work.json` |
| `gsd-command-workspace` | adapted-safe | `workspace` | None | planned | `vendor/reference/gsd-core/commands/gsd/workspace.md` |
| `gsd-command-workstreams` | adapted-safe | `workstreams` | None | planned | `vendor/reference/gsd-core/commands/gsd/workstreams.md` |

## workflow

| ID | Status | Entrypoints | Validation | Transition | Source |
|---|---|---|---|---|---|
| `gsd-workflow-add-backlog` | planned | None | None | planned | `gsd-core/workflows/add-backlog.md` |
| `gsd-workflow-add-phase` | planned | None | None | planned | `gsd-core/workflows/add-phase.md` |
| `gsd-workflow-add-tests` | planned | None | None | planned | `gsd-core/workflows/add-tests.md` |
| `gsd-workflow-add-todo` | planned | None | None | planned | `gsd-core/workflows/add-todo.md` |
| `gsd-workflow-ai-integration-phase` | planned | None | None | planned | `gsd-core/workflows/ai-integration-phase.md` |
| `gsd-workflow-analyze-dependencies` | planned | None | None | planned | `gsd-core/workflows/analyze-dependencies.md` |
| `gsd-workflow-audit-fix` | planned | None | None | planned | `gsd-core/workflows/audit-fix.md` |
| `gsd-workflow-audit-milestone` | planned | None | None | planned | `gsd-core/workflows/audit-milestone.md` |
| `gsd-workflow-audit-uat` | planned | None | None | planned | `gsd-core/workflows/audit-uat.md` |
| `gsd-workflow-autonomous` | planned | None | None | planned | `gsd-core/workflows/autonomous.md` |
| `gsd-workflow-check-todos` | planned | None | None | planned | `gsd-core/workflows/check-todos.md` |
| `gsd-workflow-cleanup` | planned | None | None | planned | `gsd-core/workflows/cleanup.md` |
| `gsd-workflow-code-review` | planned | None | None | planned | `gsd-core/workflows/code-review.md` |
| `gsd-workflow-code-review-fix` | planned | None | None | planned | `gsd-core/workflows/code-review-fix.md` |
| `gsd-workflow-complete-milestone` | planned | None | None | planned | `gsd-core/workflows/complete-milestone.md` |
| `gsd-workflow-debug` | planned | None | None | planned | `gsd-core/workflows/debug.md` |
| `gsd-workflow-diagnose-issues` | planned | None | None | planned | `gsd-core/workflows/diagnose-issues.md` |
| `gsd-workflow-discovery-phase` | planned | None | None | planned | `gsd-core/workflows/discovery-phase.md` |
| `gsd-workflow-discuss-phase` | planned | None | None | planned | `gsd-core/workflows/discuss-phase.md` |
| `gsd-workflow-discuss-phase-assumptions` | planned | None | None | planned | `gsd-core/workflows/discuss-phase-assumptions.md` |
| `gsd-workflow-discuss-phase-modes-advisor` | planned | None | None | planned | `gsd-core/workflows/discuss-phase/modes/advisor.md` |
| `gsd-workflow-discuss-phase-modes-all` | planned | None | None | planned | `gsd-core/workflows/discuss-phase/modes/all.md` |
| `gsd-workflow-discuss-phase-modes-analyze` | planned | None | None | planned | `gsd-core/workflows/discuss-phase/modes/analyze.md` |
| `gsd-workflow-discuss-phase-modes-auto` | planned | None | None | planned | `gsd-core/workflows/discuss-phase/modes/auto.md` |
| `gsd-workflow-discuss-phase-modes-batch` | planned | None | None | planned | `gsd-core/workflows/discuss-phase/modes/batch.md` |
| `gsd-workflow-discuss-phase-modes-chain` | planned | None | None | planned | `gsd-core/workflows/discuss-phase/modes/chain.md` |
| `gsd-workflow-discuss-phase-modes-default` | planned | None | None | planned | `gsd-core/workflows/discuss-phase/modes/default.md` |
| `gsd-workflow-discuss-phase-modes-power` | planned | None | None | planned | `gsd-core/workflows/discuss-phase/modes/power.md` |
| `gsd-workflow-discuss-phase-modes-text` | planned | None | None | planned | `gsd-core/workflows/discuss-phase/modes/text.md` |
| `gsd-workflow-discuss-phase-power` | planned | None | None | planned | `gsd-core/workflows/discuss-phase-power.md` |
| `gsd-workflow-discuss-phase-templates-context` | planned | None | None | planned | `gsd-core/workflows/discuss-phase/templates/context.md` |
| `gsd-workflow-discuss-phase-templates-discussion-log` | planned | None | None | planned | `gsd-core/workflows/discuss-phase/templates/discussion-log.md` |
| `gsd-workflow-do` | planned | None | None | planned | `gsd-core/workflows/do.md` |
| `gsd-workflow-docs-update` | planned | None | None | planned | `gsd-core/workflows/docs-update.md` |
| `gsd-workflow-edit-phase` | planned | None | None | planned | `gsd-core/workflows/edit-phase.md` |
| `gsd-workflow-eval-review` | planned | None | None | planned | `gsd-core/workflows/eval-review.md` |
| `gsd-workflow-execute-phase` | planned | None | None | planned | `gsd-core/workflows/execute-phase.md` |
| `gsd-workflow-execute-phase-steps-codebase-drift-gate` | planned | None | None | planned | `gsd-core/workflows/execute-phase/steps/codebase-drift-gate.md` |
| `gsd-workflow-execute-phase-steps-per-plan-worktree-gate` | planned | None | None | planned | `gsd-core/workflows/execute-phase/steps/per-plan-worktree-gate.md` |
| `gsd-workflow-execute-phase-steps-post-merge-gate` | planned | None | None | planned | `gsd-core/workflows/execute-phase/steps/post-merge-gate.md` |
| `gsd-workflow-execute-phase-steps-worktree-recovery-policy` | planned | None | None | planned | `gsd-core/workflows/execute-phase/steps/worktree-recovery-policy.md` |
| `gsd-workflow-execute-plan` | planned | None | None | planned | `gsd-core/workflows/execute-plan.md` |
| `gsd-workflow-explore` | planned | None | None | planned | `gsd-core/workflows/explore.md` |
| `gsd-workflow-extract-learnings` | planned | None | None | planned | `gsd-core/workflows/extract-learnings.md` |
| `gsd-workflow-fast` | planned | None | None | planned | `gsd-core/workflows/fast.md` |
| `gsd-workflow-forensics` | planned | None | None | planned | `gsd-core/workflows/forensics.md` |
| `gsd-workflow-graduation` | planned | None | None | planned | `gsd-core/workflows/graduation.md` |
| `gsd-workflow-health` | planned | None | None | planned | `gsd-core/workflows/health.md` |
| `gsd-workflow-help` | planned | None | None | planned | `gsd-core/workflows/help.md` |
| `gsd-workflow-help-modes-brief` | planned | None | None | planned | `gsd-core/workflows/help/modes/brief.md` |
| `gsd-workflow-help-modes-default` | planned | None | None | planned | `gsd-core/workflows/help/modes/default.md` |
| `gsd-workflow-help-modes-full` | planned | None | None | planned | `gsd-core/workflows/help/modes/full.md` |
| `gsd-workflow-help-modes-topic` | planned | None | None | planned | `gsd-core/workflows/help/modes/topic.md` |
| `gsd-workflow-import` | planned | None | None | planned | `gsd-core/workflows/import.md` |
| `gsd-workflow-inbox` | planned | None | None | planned | `gsd-core/workflows/inbox.md` |
| `gsd-workflow-ingest-docs` | planned | None | None | planned | `gsd-core/workflows/ingest-docs.md` |
| `gsd-workflow-insert-phase` | planned | None | None | planned | `gsd-core/workflows/insert-phase.md` |
| `gsd-workflow-list-phase-assumptions` | planned | None | None | planned | `gsd-core/workflows/list-phase-assumptions.md` |
| `gsd-workflow-list-seeds` | planned | None | None | planned | `gsd-core/workflows/list-seeds.md` |
| `gsd-workflow-list-workspaces` | planned | None | None | planned | `gsd-core/workflows/list-workspaces.md` |
| `gsd-workflow-manager` | planned | None | None | planned | `gsd-core/workflows/manager.md` |
| `gsd-workflow-map-codebase` | planned | None | None | planned | `gsd-core/workflows/map-codebase.md` |
| `gsd-workflow-milestone-summary` | planned | None | None | planned | `gsd-core/workflows/milestone-summary.md` |
| `gsd-workflow-mvp-phase` | planned | None | None | planned | `gsd-core/workflows/mvp-phase.md` |
| `gsd-workflow-new-milestone` | planned | None | None | planned | `gsd-core/workflows/new-milestone.md` |
| `gsd-workflow-new-project` | planned | None | None | planned | `gsd-core/workflows/new-project.md` |
| `gsd-workflow-new-workspace` | planned | None | None | planned | `gsd-core/workflows/new-workspace.md` |
| `gsd-workflow-next` | planned | None | None | planned | `gsd-core/workflows/next.md` |
| `gsd-workflow-node-repair` | planned | None | None | planned | `gsd-core/workflows/node-repair.md` |
| `gsd-workflow-note` | planned | None | None | planned | `gsd-core/workflows/note.md` |
| `gsd-workflow-pause-work` | planned | None | None | planned | `gsd-core/workflows/pause-work.md` |
| `gsd-workflow-plan-milestone-gaps` | planned | None | None | planned | `gsd-core/workflows/plan-milestone-gaps.md` |
| `gsd-workflow-plan-phase` | planned | None | None | planned | `gsd-core/workflows/plan-phase.md` |
| `gsd-workflow-plan-review-convergence` | planned | None | None | planned | `gsd-core/workflows/plan-review-convergence.md` |
| `gsd-workflow-plant-seed` | planned | None | None | planned | `gsd-core/workflows/plant-seed.md` |
| `gsd-workflow-pr-branch` | planned | None | None | planned | `gsd-core/workflows/pr-branch.md` |
| `gsd-workflow-profile-user` | planned | None | None | planned | `gsd-core/workflows/profile-user.md` |
| `gsd-workflow-progress` | planned | None | None | planned | `gsd-core/workflows/progress.md` |
| `gsd-workflow-quick` | planned | None | None | planned | `gsd-core/workflows/quick.md` |
| `gsd-workflow-reapply-patches` | planned | None | None | planned | `gsd-core/workflows/reapply-patches.md` |
| `gsd-workflow-remove-phase` | planned | None | None | planned | `gsd-core/workflows/remove-phase.md` |
| `gsd-workflow-remove-workspace` | planned | None | None | planned | `gsd-core/workflows/remove-workspace.md` |
| `gsd-workflow-resume-project` | planned | None | None | planned | `gsd-core/workflows/resume-project.md` |
| `gsd-workflow-review` | planned | None | None | planned | `gsd-core/workflows/review.md` |
| `gsd-workflow-scan` | planned | None | None | planned | `gsd-core/workflows/scan.md` |
| `gsd-workflow-secure-phase` | planned | None | None | planned | `gsd-core/workflows/secure-phase.md` |
| `gsd-workflow-session-report` | planned | None | None | planned | `gsd-core/workflows/session-report.md` |
| `gsd-workflow-settings` | planned | None | None | planned | `gsd-core/workflows/settings.md` |
| `gsd-workflow-settings-advanced` | planned | None | None | planned | `gsd-core/workflows/settings-advanced.md` |
| `gsd-workflow-settings-integrations` | planned | None | None | planned | `gsd-core/workflows/settings-integrations.md` |
| `gsd-workflow-ship` | planned | None | None | planned | `gsd-core/workflows/ship.md` |
| `gsd-workflow-sketch` | planned | None | None | planned | `gsd-core/workflows/sketch.md` |
| `gsd-workflow-sketch-wrap-up` | planned | None | None | planned | `gsd-core/workflows/sketch-wrap-up.md` |
| `gsd-workflow-spec-phase` | planned | None | None | planned | `gsd-core/workflows/spec-phase.md` |
| `gsd-workflow-spike` | planned | None | None | planned | `gsd-core/workflows/spike.md` |
| `gsd-workflow-spike-wrap-up` | planned | None | None | planned | `gsd-core/workflows/spike-wrap-up.md` |
| `gsd-workflow-stats` | planned | None | None | planned | `gsd-core/workflows/stats.md` |
| `gsd-workflow-sync-skills` | planned | None | None | planned | `gsd-core/workflows/sync-skills.md` |
| `gsd-workflow-thread` | planned | None | None | planned | `gsd-core/workflows/thread.md` |
| `gsd-workflow-transition` | planned | None | None | planned | `gsd-core/workflows/transition.md` |
| `gsd-workflow-ui-phase` | planned | None | None | planned | `gsd-core/workflows/ui-phase.md` |
| `gsd-workflow-ui-review` | planned | None | None | planned | `gsd-core/workflows/ui-review.md` |
| `gsd-workflow-ultraplan-phase` | planned | None | None | planned | `gsd-core/workflows/ultraplan-phase.md` |
| `gsd-workflow-undo` | planned | None | None | planned | `gsd-core/workflows/undo.md` |
| `gsd-workflow-update` | planned | None | None | planned | `gsd-core/workflows/update.md` |
| `gsd-workflow-validate-phase` | planned | None | None | planned | `gsd-core/workflows/validate-phase.md` |
| `gsd-workflow-verify-phase` | planned | None | None | planned | `gsd-core/workflows/verify-phase.md` |
| `gsd-workflow-verify-work` | planned | None | None | planned | `gsd-core/workflows/verify-work.md` |

## role

| ID | Status | Entrypoints | Validation | Transition | Source |
|---|---|---|---|---|---|
| `gsd-role-advisor-researcher` | planned | None | None | planned | `agents/gsd-advisor-researcher.md` |
| `gsd-role-ai-researcher` | planned | None | None | planned | `agents/gsd-ai-researcher.md` |
| `gsd-role-assumptions-analyzer` | planned | None | None | planned | `agents/gsd-assumptions-analyzer.md` |
| `gsd-role-code-fixer` | planned | None | None | planned | `agents/gsd-code-fixer.md` |
| `gsd-role-code-reviewer` | planned | None | None | planned | `agents/gsd-code-reviewer.md` |
| `gsd-role-codebase-mapper` | planned | None | None | planned | `agents/gsd-codebase-mapper.md` |
| `gsd-role-debug-session-manager` | planned | None | None | planned | `agents/gsd-debug-session-manager.md` |
| `gsd-role-debugger` | planned | None | None | planned | `agents/gsd-debugger.md` |
| `gsd-role-doc-classifier` | planned | None | None | planned | `agents/gsd-doc-classifier.md` |
| `gsd-role-doc-synthesizer` | planned | None | None | planned | `agents/gsd-doc-synthesizer.md` |
| `gsd-role-doc-verifier` | planned | None | None | planned | `agents/gsd-doc-verifier.md` |
| `gsd-role-doc-writer` | planned | None | None | planned | `agents/gsd-doc-writer.md` |
| `gsd-role-domain-researcher` | planned | None | None | planned | `agents/gsd-domain-researcher.md` |
| `gsd-role-eval-auditor` | planned | None | None | planned | `agents/gsd-eval-auditor.md` |
| `gsd-role-eval-planner` | planned | None | None | planned | `agents/gsd-eval-planner.md` |
| `gsd-role-executor` | planned | None | None | planned | `agents/gsd-executor.md` |
| `gsd-role-framework-selector` | planned | None | None | planned | `agents/gsd-framework-selector.md` |
| `gsd-role-integration-checker` | planned | None | None | planned | `agents/gsd-integration-checker.md` |
| `gsd-role-intel-updater` | planned | None | None | planned | `agents/gsd-intel-updater.md` |
| `gsd-role-nyquist-auditor` | planned | None | None | planned | `agents/gsd-nyquist-auditor.md` |
| `gsd-role-pattern-mapper` | planned | None | None | planned | `agents/gsd-pattern-mapper.md` |
| `gsd-role-phase-researcher` | planned | None | None | planned | `agents/gsd-phase-researcher.md` |
| `gsd-role-plan-checker` | planned | None | None | planned | `agents/gsd-plan-checker.md` |
| `gsd-role-planner` | planned | None | None | planned | `agents/gsd-planner.md` |
| `gsd-role-project-researcher` | planned | None | None | planned | `agents/gsd-project-researcher.md` |
| `gsd-role-research-synthesizer` | planned | None | None | planned | `agents/gsd-research-synthesizer.md` |
| `gsd-role-roadmapper` | planned | None | None | planned | `agents/gsd-roadmapper.md` |
| `gsd-role-security-auditor` | planned | None | None | planned | `agents/gsd-security-auditor.md` |
| `gsd-role-ui-auditor` | planned | None | None | planned | `agents/gsd-ui-auditor.md` |
| `gsd-role-ui-checker` | planned | None | None | planned | `agents/gsd-ui-checker.md` |
| `gsd-role-ui-researcher` | planned | None | None | planned | `agents/gsd-ui-researcher.md` |
| `gsd-role-user-profiler` | planned | None | None | planned | `agents/gsd-user-profiler.md` |
| `gsd-role-verifier` | planned | None | None | planned | `agents/gsd-verifier.md` |

## reference

| ID | Status | Entrypoints | Validation | Transition | Source |
|---|---|---|---|---|---|
| `gsd-reference-agent-contracts` | asset-only | None | None | no-transition | `gsd-core/references/agent-contracts.md` |
| `gsd-reference-ai-evals` | asset-only | None | None | no-transition | `gsd-core/references/ai-evals.md` |
| `gsd-reference-ai-frameworks` | asset-only | None | None | no-transition | `gsd-core/references/ai-frameworks.md` |
| `gsd-reference-artifact-types` | asset-only | None | None | no-transition | `gsd-core/references/artifact-types.md` |
| `gsd-reference-autonomous-smart-discuss` | asset-only | None | None | no-transition | `gsd-core/references/autonomous-smart-discuss.md` |
| `gsd-reference-checkpoints` | asset-only | None | None | no-transition | `gsd-core/references/checkpoints.md` |
| `gsd-reference-common-bug-patterns` | asset-only | None | None | no-transition | `gsd-core/references/common-bug-patterns.md` |
| `gsd-reference-context-budget` | asset-only | None | None | no-transition | `gsd-core/references/context-budget.md` |
| `gsd-reference-continuation-format` | asset-only | None | None | no-transition | `gsd-core/references/continuation-format.md` |
| `gsd-reference-debugger-philosophy` | asset-only | None | None | no-transition | `gsd-core/references/debugger-philosophy.md` |
| `gsd-reference-decimal-phase-calculation` | asset-only | None | None | no-transition | `gsd-core/references/decimal-phase-calculation.md` |
| `gsd-reference-doc-conflict-engine` | asset-only | None | None | no-transition | `gsd-core/references/doc-conflict-engine.md` |
| `gsd-reference-domain-probes` | asset-only | None | None | no-transition | `gsd-core/references/domain-probes.md` |
| `gsd-reference-execute-mvp-tdd` | asset-only | None | None | no-transition | `gsd-core/references/execute-mvp-tdd.md` |
| `gsd-reference-executor-examples` | asset-only | None | None | no-transition | `gsd-core/references/executor-examples.md` |
| `gsd-reference-few-shot-examples/plan-checker` | asset-only | None | None | no-transition | `gsd-core/references/few-shot-examples/plan-checker.md` |
| `gsd-reference-few-shot-examples/verifier` | asset-only | None | None | no-transition | `gsd-core/references/few-shot-examples/verifier.md` |
| `gsd-reference-gate-prompts` | asset-only | None | None | no-transition | `gsd-core/references/gate-prompts.md` |
| `gsd-reference-gates` | asset-only | None | None | no-transition | `gsd-core/references/gates.md` |
| `gsd-reference-git-integration` | asset-only | None | None | no-transition | `gsd-core/references/git-integration.md` |
| `gsd-reference-git-planning-commit` | asset-only | None | None | no-transition | `gsd-core/references/git-planning-commit.md` |
| `gsd-reference-ios-scaffold` | asset-only | None | None | no-transition | `gsd-core/references/ios-scaffold.md` |
| `gsd-reference-mandatory-initial-read` | asset-only | None | None | no-transition | `gsd-core/references/mandatory-initial-read.md` |
| `gsd-reference-model-profile-resolution` | asset-only | None | None | no-transition | `gsd-core/references/model-profile-resolution.md` |
| `gsd-reference-model-profiles` | asset-only | None | None | no-transition | `gsd-core/references/model-profiles.md` |
| `gsd-reference-mvp-concepts` | asset-only | None | None | no-transition | `gsd-core/references/mvp-concepts.md` |
| `gsd-reference-phase-argument-parsing` | asset-only | None | None | no-transition | `gsd-core/references/phase-argument-parsing.md` |
| `gsd-reference-planner-antipatterns` | asset-only | None | None | no-transition | `gsd-core/references/planner-antipatterns.md` |
| `gsd-reference-planner-chunked` | asset-only | None | None | no-transition | `gsd-core/references/planner-chunked.md` |
| `gsd-reference-planner-gap-closure` | asset-only | None | None | no-transition | `gsd-core/references/planner-gap-closure.md` |
| `gsd-reference-planner-graphify-auto-update` | asset-only | None | None | no-transition | `gsd-core/references/planner-graphify-auto-update.md` |
| `gsd-reference-planner-human-verify-mode` | asset-only | None | None | no-transition | `gsd-core/references/planner-human-verify-mode.md` |
| `gsd-reference-planner-interface-context` | asset-only | None | None | no-transition | `gsd-core/references/planner-interface-context.md` |
| `gsd-reference-planner-load-graph-context` | asset-only | None | None | no-transition | `gsd-core/references/planner-load-graph-context.md` |
| `gsd-reference-planner-mvp-mode` | asset-only | None | None | no-transition | `gsd-core/references/planner-mvp-mode.md` |
| `gsd-reference-planner-reviews` | asset-only | None | None | no-transition | `gsd-core/references/planner-reviews.md` |
| `gsd-reference-planner-revision` | asset-only | None | None | no-transition | `gsd-core/references/planner-revision.md` |
| `gsd-reference-planner-source-audit` | asset-only | None | None | no-transition | `gsd-core/references/planner-source-audit.md` |
| `gsd-reference-planning-config` | asset-only | None | None | no-transition | `gsd-core/references/planning-config.md` |
| `gsd-reference-project-skills-discovery` | asset-only | None | None | no-transition | `gsd-core/references/project-skills-discovery.md` |
| `gsd-reference-questioning` | asset-only | None | None | no-transition | `gsd-core/references/questioning.md` |
| `gsd-reference-research-documentation-lookup` | asset-only | None | None | no-transition | `gsd-core/references/research-documentation-lookup.md` |
| `gsd-reference-research-philosophy` | asset-only | None | None | no-transition | `gsd-core/references/research-philosophy.md` |
| `gsd-reference-research-verification-protocol` | asset-only | None | None | no-transition | `gsd-core/references/research-verification-protocol.md` |
| `gsd-reference-revision-loop` | asset-only | None | None | no-transition | `gsd-core/references/revision-loop.md` |
| `gsd-reference-scout-codebase` | asset-only | None | None | no-transition | `gsd-core/references/scout-codebase.md` |
| `gsd-reference-skeleton-template` | asset-only | None | None | no-transition | `gsd-core/references/skeleton-template.md` |
| `gsd-reference-sketch-interactivity` | asset-only | None | None | no-transition | `gsd-core/references/sketch-interactivity.md` |
| `gsd-reference-sketch-theme-system` | asset-only | None | None | no-transition | `gsd-core/references/sketch-theme-system.md` |
| `gsd-reference-sketch-tooling` | asset-only | None | None | no-transition | `gsd-core/references/sketch-tooling.md` |
| `gsd-reference-sketch-variant-patterns` | asset-only | None | None | no-transition | `gsd-core/references/sketch-variant-patterns.md` |
| `gsd-reference-spidr-splitting` | asset-only | None | None | no-transition | `gsd-core/references/spidr-splitting.md` |
| `gsd-reference-tdd` | asset-only | None | None | no-transition | `gsd-core/references/tdd.md` |
| `gsd-reference-thinking-models-debug` | asset-only | None | None | no-transition | `gsd-core/references/thinking-models-debug.md` |
| `gsd-reference-thinking-models-execution` | asset-only | None | None | no-transition | `gsd-core/references/thinking-models-execution.md` |
| `gsd-reference-thinking-models-planning` | asset-only | None | None | no-transition | `gsd-core/references/thinking-models-planning.md` |
| `gsd-reference-thinking-models-research` | asset-only | None | None | no-transition | `gsd-core/references/thinking-models-research.md` |
| `gsd-reference-thinking-models-verification` | asset-only | None | None | no-transition | `gsd-core/references/thinking-models-verification.md` |
| `gsd-reference-thinking-partner` | asset-only | None | None | no-transition | `gsd-core/references/thinking-partner.md` |
| `gsd-reference-ui-brand` | asset-only | None | None | no-transition | `gsd-core/references/ui-brand.md` |
| `gsd-reference-universal-anti-patterns` | asset-only | None | None | no-transition | `gsd-core/references/universal-anti-patterns.md` |
| `gsd-reference-user-profiling` | asset-only | None | None | no-transition | `gsd-core/references/user-profiling.md` |
| `gsd-reference-user-story-template` | asset-only | None | None | no-transition | `gsd-core/references/user-story-template.md` |
| `gsd-reference-verification-overrides` | asset-only | None | None | no-transition | `gsd-core/references/verification-overrides.md` |
| `gsd-reference-verification-patterns` | asset-only | None | None | no-transition | `gsd-core/references/verification-patterns.md` |
| `gsd-reference-verify-mvp-mode` | asset-only | None | None | no-transition | `gsd-core/references/verify-mvp-mode.md` |
| `gsd-reference-workstream-flag` | asset-only | None | None | no-transition | `gsd-core/references/workstream-flag.md` |
| `gsd-reference-worktree-branch-check` | asset-only | None | None | no-transition | `gsd-core/references/worktree-branch-check.md` |
| `gsd-reference-worktree-path-safety` | asset-only | None | None | no-transition | `gsd-core/references/worktree-path-safety.md` |

## template

| ID | Status | Entrypoints | Validation | Transition | Source |
|---|---|---|---|---|---|
| `gsd-template-ai-spec.md` | asset-only | None | None | no-transition | `gsd-core/templates/AI-SPEC.md` |
| `gsd-template-claude-md.md` | asset-only | None | None | no-transition | `gsd-core/templates/claude-md.md` |
| `gsd-template-codebase/architecture.md` | asset-only | None | None | no-transition | `gsd-core/templates/codebase/architecture.md` |
| `gsd-template-codebase/concerns.md` | asset-only | None | None | no-transition | `gsd-core/templates/codebase/concerns.md` |
| `gsd-template-codebase/conventions.md` | asset-only | None | None | no-transition | `gsd-core/templates/codebase/conventions.md` |
| `gsd-template-codebase/integrations.md` | asset-only | None | None | no-transition | `gsd-core/templates/codebase/integrations.md` |
| `gsd-template-codebase/stack.md` | asset-only | None | None | no-transition | `gsd-core/templates/codebase/stack.md` |
| `gsd-template-codebase/structure.md` | asset-only | None | None | no-transition | `gsd-core/templates/codebase/structure.md` |
| `gsd-template-codebase/testing.md` | asset-only | None | None | no-transition | `gsd-core/templates/codebase/testing.md` |
| `gsd-template-config.json` | asset-only | None | None | no-transition | `gsd-core/templates/config.json` |
| `gsd-template-context.md` | asset-only | None | None | no-transition | `gsd-core/templates/context.md` |
| `gsd-template-continue-here.md` | asset-only | None | None | no-transition | `gsd-core/templates/continue-here.md` |
| `gsd-template-copilot-instructions.md` | asset-only | None | None | no-transition | `gsd-core/templates/copilot-instructions.md` |
| `gsd-template-debug-subagent-prompt.md` | asset-only | None | None | no-transition | `gsd-core/templates/debug-subagent-prompt.md` |
| `gsd-template-debug.md` | asset-only | None | None | no-transition | `gsd-core/templates/DEBUG.md` |
| `gsd-template-dev-preferences.md` | asset-only | None | None | no-transition | `gsd-core/templates/dev-preferences.md` |
| `gsd-template-discovery.md` | asset-only | None | None | no-transition | `gsd-core/templates/discovery.md` |
| `gsd-template-discussion-log.md` | asset-only | None | None | no-transition | `gsd-core/templates/discussion-log.md` |
| `gsd-template-milestone-archive.md` | asset-only | None | None | no-transition | `gsd-core/templates/milestone-archive.md` |
| `gsd-template-milestone.md` | asset-only | None | None | no-transition | `gsd-core/templates/milestone.md` |
| `gsd-template-phase-prompt.md` | asset-only | None | None | no-transition | `gsd-core/templates/phase-prompt.md` |
| `gsd-template-planner-subagent-prompt.md` | asset-only | None | None | no-transition | `gsd-core/templates/planner-subagent-prompt.md` |
| `gsd-template-project.md` | asset-only | None | None | no-transition | `gsd-core/templates/project.md` |
| `gsd-template-readme.md` | asset-only | None | None | no-transition | `gsd-core/templates/README.md` |
| `gsd-template-requirements.md` | asset-only | None | None | no-transition | `gsd-core/templates/requirements.md` |
| `gsd-template-research-project/architecture.md` | asset-only | None | None | no-transition | `gsd-core/templates/research-project/ARCHITECTURE.md` |
| `gsd-template-research-project/features.md` | asset-only | None | None | no-transition | `gsd-core/templates/research-project/FEATURES.md` |
| `gsd-template-research-project/pitfalls.md` | asset-only | None | None | no-transition | `gsd-core/templates/research-project/PITFALLS.md` |
| `gsd-template-research-project/stack.md` | asset-only | None | None | no-transition | `gsd-core/templates/research-project/STACK.md` |
| `gsd-template-research-project/summary.md` | asset-only | None | None | no-transition | `gsd-core/templates/research-project/SUMMARY.md` |
| `gsd-template-research.md` | asset-only | None | None | no-transition | `gsd-core/templates/research.md` |
| `gsd-template-retrospective.md` | asset-only | None | None | no-transition | `gsd-core/templates/retrospective.md` |
| `gsd-template-roadmap.md` | asset-only | None | None | no-transition | `gsd-core/templates/roadmap.md` |
| `gsd-template-security.md` | asset-only | None | None | no-transition | `gsd-core/templates/SECURITY.md` |
| `gsd-template-spec.md` | asset-only | None | None | no-transition | `gsd-core/templates/spec.md` |
| `gsd-template-state.md` | asset-only | None | None | no-transition | `gsd-core/templates/state.md` |
| `gsd-template-summary-complex.md` | asset-only | None | None | no-transition | `gsd-core/templates/summary-complex.md` |
| `gsd-template-summary-minimal.md` | asset-only | None | None | no-transition | `gsd-core/templates/summary-minimal.md` |
| `gsd-template-summary-standard.md` | asset-only | None | None | no-transition | `gsd-core/templates/summary-standard.md` |
| `gsd-template-summary.md` | asset-only | None | None | no-transition | `gsd-core/templates/summary.md` |
| `gsd-template-uat.md` | asset-only | None | None | no-transition | `gsd-core/templates/UAT.md` |
| `gsd-template-ui-spec.md` | asset-only | None | None | no-transition | `gsd-core/templates/UI-SPEC.md` |
| `gsd-template-user-profile.md` | asset-only | None | None | no-transition | `gsd-core/templates/user-profile.md` |
| `gsd-template-user-setup.md` | asset-only | None | None | no-transition | `gsd-core/templates/user-setup.md` |
| `gsd-template-validation.md` | asset-only | None | None | no-transition | `gsd-core/templates/VALIDATION.md` |
| `gsd-template-verification-report.md` | asset-only | None | None | no-transition | `gsd-core/templates/verification-report.md` |

## context

| ID | Status | Entrypoints | Validation | Transition | Source |
|---|---|---|---|---|---|
| `gsd-context-dev` | asset-only | None | None | no-transition | `gsd-core/contexts/dev.md` |
| `gsd-context-research` | asset-only | None | None | no-transition | `gsd-core/contexts/research.md` |
| `gsd-context-review` | asset-only | None | None | no-transition | `gsd-core/contexts/review.md` |


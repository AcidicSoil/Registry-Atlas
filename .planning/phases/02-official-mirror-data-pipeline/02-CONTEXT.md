# Phase 2: Official Mirror & Data Pipeline - Context

**Gathered:** 2026-05-25
**Status:** Ready for planning
**Source:** Discuss transcript at `/mnt/c/Users/user/Downloads/registry-atlas_gsd-discuss-phase-2-codex-session_wo_metadata.md`

<domain>
## Phase Boundary

This phase turns Registry Atlas from a hand-maintained static dataset into a mirror of the official shadcn registry directory. It covers fetching `https://ui.shadcn.com/r/registries.json`, storing raw upstream data, producing normalized runtime data, producing a sync report, validating the mirror, and updating the app to load the normalized runtime JSON.

It does not implement component item discovery across individual registry catalogs, component alternative comparison, copyable install/view commands, batch install queues, URL share state, or release CI hardening beyond the local data validation command required by this phase. Those belong to later roadmap phases.

</domain>

<decisions>
## Implementation Decisions

### Mirror Artifact Boundary
- **D-01:** Use a runtime normalized JSON artifact instead of importing a generated TypeScript data module. The browser app should fetch normalized JSON from the static deployed surface.
- **D-02:** Keep raw upstream data, normalized app data, and sync report as separate reviewable artifacts. Raw upstream data is for source inspection; normalized runtime data is for the app; the report is for maintainer review.
- **D-03:** Runtime JSON paths must be static-hosting safe under the existing Vite/GitHub Pages deployment model. Avoid introducing a backend service or database.

### Sync and Review Behavior
- **D-04:** The sync command should always write artifacts when the upstream fetch succeeds, even if validation will later fail. Validation is a separate command and the safety net for accepting or releasing data.
- **D-05:** The sync report is still the review surface. It must include source URL, sync timestamp, upstream count, local normalized count, and added/removed/changed registry deltas.
- **D-06:** Do not hide upstream shape changes by refusing to write normalized output during sync. Make changes inspectable, then fail validation separately when they violate the accepted contract.

### Official Facts and Registry Atlas Enrichment
- **D-07:** Inline Registry Atlas enrichment into normalized records rather than maintaining a separate overlay file. Field names and provenance must make official upstream facts distinct from Registry Atlas fields.
- **D-08:** Official fields should be grouped under an explicit official/source namespace or otherwise clearly named as official facts. Local fields such as focus tags, component tags, aliases, confidence, notes, and status must be clearly labeled as Registry Atlas enrichment.
- **D-09:** Sync should preserve existing inline enrichment for matching namespaces when regenerating normalized records. New official registries should receive empty or neutral enrichment defaults that do not imply verified component coverage.

### Runtime Validation and User Warnings
- **D-10:** Render official-sourced records with warnings when validation fails, rather than fail closed by default. Users and maintainers should be able to see what the official directory returned.
- **D-11:** Only disable actions that are mechanically invalid: malformed URL protocols, malformed registry URL templates, malformed namespaces, or malformed item tokens. Do not label valid official-directory links or valid shadcn commands as unsafe unless there is a concrete advisory/status reason.
- **D-12:** HTTP official directory entries should not be treated as malicious by wording alone. If an official homepage or registry template uses `http:`, show neutral transport/status language and let validation policy decide whether it is allowed, warned, or blocked.
- **D-13:** Registry Atlas must not imply it audits, approves, or certifies community registry code. The app can show provenance, freshness, warnings, and mechanical validation status.

### the agent's Discretion
- The user authorized best-default decisions and correction of prior work where it improves the end product.
- Prefer simple Node scripts and TypeScript runtime helpers over adding a backend or heavyweight data pipeline.
- Prefer plans that make Phase 3 component-first discovery easier without implementing Phase 3 itself.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Scope
- `.planning/PROJECT.md` - Product direction, core value, active requirements, and constraints for Registry Atlas.
- `.planning/REQUIREMENTS.md` - Phase 2 requirement IDs `MIRR-01` through `MIRR-06`, `HARD-01`, and `HARD-03`.
- `.planning/ROADMAP.md` - Phase 2 goal, MVP mode, dependency on Phase 1, and success criteria.
- `.planning/STATE.md` - Phase 1 completion state and decisions affecting Phase 2.

### Prior Phase Outputs
- `.planning/phases/01-foundation-safety-verification/01-CONTEXT.md` - Locked foundation decisions, especially safe rendering and static Vite constraints.
- `.planning/phases/01-foundation-safety-verification/01-04-SUMMARY.md` - Canonical app surface and `dist/` generated-output policy.
- `.planning/phases/01-foundation-safety-verification/01-PATTERNS.md` - Existing code/test/doc patterns.

### Upstream Sources
- `https://ui.shadcn.com/r/registries.json` - Official registry directory JSON source. Verified on 2026-05-25 as an array of 198 records with `name`, `homepage`, `url`, and `description`.
- `https://ui.shadcn.com/docs/directory` - Official directory page, including the CLI add pattern and third-party registry review warning.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/registry-explorer/data/registries.data.ts` - Current hand-maintained 85-registry dataset and enrichment source.
- `src/registry-explorer/core/registry.schema.ts` - Current `Registry` interface and controlled vocabularies.
- `src/registry-explorer/core/grouping.ts` - Pure filtering, grouping, and metrics logic.
- `src/registry-explorer/ui/renderSafety.ts` - Shared HTML escaping and external-link rendering helper from Phase 1.
- `src/registry-explorer/ui/shell.ts` - App state and render orchestration; currently receives registries synchronously.
- `src/registry-explorer/entry.ts` - Bootstrap path that currently imports static registries directly.
- `tests/registry-explorer/registryData.test.ts` - Existing production data invariant tests to evolve or replace for generated runtime data.

### Established Patterns
- Keep pure data transformation under `src/registry-explorer/core/`.
- Keep browser orchestration in `src/registry-explorer/entry.ts` and `src/registry-explorer/ui/shell.ts`.
- Keep tests under `tests/registry-explorer/` using Vitest, named imports, two-space indentation, and direct assertions.
- Use `PATH=/tmp/registry-atlas-bin:$PATH pnpm verify` in WSL when PATH-resolved pnpm points to a Windows shim.

### Current Gaps
- The current local dataset has 85 registries, while the official endpoint currently has 198.
- The current app imports data synchronously from TypeScript source, so Phase 2 must add runtime loading/error/status behavior.
- Current production data tests assert HTTPS-only URLs, but the official endpoint currently includes at least two HTTP fields. Phase 2 validation must distinguish disallowed protocols from neutral transport warnings instead of assuming every official record is HTTPS.

</code_context>

<specifics>
## Specific Ideas

- Normalized runtime data should include a metadata block with source URL, synced timestamp, upstream count, local count, and validation/report references where useful.
- Per-registry normalized records should preserve official namespace with the leading `@`; de-prefixed display or slug values may be derived but must not replace the canonical namespace.
- Registry URL templates such as `https://www.8bitcn.com/r/{name}.json` should be validated as templates, not as already-resolved item URLs.
- New registries should get neutral enrichment defaults such as empty focus/component tags, `coverage_status: "unverified"`, or equivalent explicit status.

</specifics>

<deferred>
## Deferred Ideas

- Fetching each registry's item catalog and mapping item slugs to component needs belongs to Phase 3.
- Copyable `npx shadcn@latest add @<registry>/<item>` and `view` commands belong to Phase 4.
- Batch install queues, URL share state, release CI, and accessibility baseline expansion belong to Phase 4.

</deferred>

---

*Phase: 2-Official Mirror & Data Pipeline*
*Context gathered: 2026-05-25*

---
name: registry-runtime-generation-formal
description: Verify the atomic publication and browser generation-pinning invariants with a TLA+ model, including historical broken variants. Use when changing runtime publication, manifest reads, or lazy detail loading.
---

# Runtime-generation formal verification

**Goal:** The browser never selects a generation whose core and detail files are missing, and catalog and details always use the same selected generation.

Run `mise run test:formal` from the repository root. It downloads the official TLA+ TLC 2.19 tool from the pinned `tlaplus/tlaplus` v1.7.4 release, verifies its SHA-256 checksum, checks the safe model, then confirms that both historical bug configurations fail for the expected invariants. A tool failure or a broken negative check fails the command and CI.

## Source coverage

- `scripts/lib/runtime-publication.mjs` — `installGeneration`, `publishRuntimeSnapshots`: staging both files, atomic directory rename, and manifest rename.
- `src/registry-explorer/data/runtimeJson.ts` — `runtimeAssetUrl`, `readRuntimeGeneration`, `loadDetailRuntimeData`: pinning the first manifest across core and lazy detail loads.
- `formal/runtime-generation/RuntimeGeneration.tla` — safe transitions and the `ManifestReady` and `ClientConsistent` invariants.
- `formal/runtime-generation/{safe,early-manifest,unpinned-details}.cfg` — one correct execution and two historical counterexamples.
- `tests/registry-explorer/runtimePublication.test.ts` and `runtimeGenerationLoader.test.ts` — real filesystem and client behavior alongside the abstract model.

The model spans **two generations, one publisher, and one client**. TLC exhaustively explores their action interleavings. It does not prove durability across arbitrary disk corruption, multiple concurrent publishers, or remote CDN consistency.

The early-manifest mutant publishes the pointer before the generation is installed; its shortest trace violates `ManifestReady`. The unpinned-details mutant fetches the manifest again for details; its shortest trace violates `ClientConsistent`. Both regressions correspond to the ordering problem corrected by Git commit `255d260`.

## Maintenance

Last source-conformance review commit: `a9f18ed` (the covered functions are unchanged from this revision). Before updating that reference, inspect both source files, compare every model transition with the actual action boundary, and rerun the safe and both negative cases. If code semantics change, change the model _first_, then run the code-level tests. Use the pstack `/statechart` skill to interpret shortest TLA+ traces and visualize the safe state graph. Keep this skill synchronized only after verifying the new source revision.

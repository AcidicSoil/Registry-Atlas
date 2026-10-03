# Per-identity source, visual and runnable-preview evidence — 2026-10-03

Registry Atlas must never count a component image or a functioning *source-informed fixture* as proof that the upstream component itself has been built and verified. This research artifact specifies the implemented identity ledger and the observed coverage at the time of this run.

## Reproduce

From the Registry Atlas root:

```bash
node scripts/report-item-evidence.mjs \
  --out "$HOME/.local/state/registry-atlas/research/item-evidence-$(date -u +%Y%m%dT%H%M%SZ).json"
```

The command reads existing source files, curated entries, reviewed visual references, reviewed demonstration entries and all 408 discovery journals. It does not browse the web, execute upstream code or change the external site. Its absolute output path must not already exist. The full JSON report is private local state (mode `0600`), not a 28 MB artifact shipped with the frontend.

Every unique `namespace/item.name` has **independent** evidence fields:

- `source`: observed only for a fresh, revision/fingerprint-matched journal whose exact final URL matches the recorded documentation URL; otherwise pending, stale, blocked or unresolved.
- `visual`: verified only when the official page matches a freshly observed source page, an explicitly reviewed image exists and a local image file is present when the manifest specifies one. A missing or mismatched image is blocked; a missing entry is pending.
- `functional`: preserves reviewed **fixture**, reviewed **upstream-built**, pending and blocked distinctions. A fixture can be a real working example without implying an upstream build has been approved or executed. The existing reviewed-demo manifest and asset checks are the authority.
- `errors`: flags orphan visual identities and duplicate catalog identity keys without dropping their impact on readiness.

The report's `complete` flag cannot become true while any identity lacks an observed source, a verified visual or an upstream-built interaction-verified preview; it also rejects integrity findings. The eligibility rules are deliberately conservative.

## Observed snapshot

Report `~/.local/state/registry-atlas/research/item-evidence-20261003-run74ab-final-v2.json` was generated during this run.

| Metric | Observed |
|---|---:|
| Official directory registry records | 408 |
| Indexed rows | 84,153 |
| Distinct indexed identities | 84,133 |
| Additional curated-only identities | 12 |
| Total distinct identities | 84,145 |
| Duplicate indexed rows / affected keys | 20 / 18 |
| Fresh source-item pages | 7 |
| Source-item pages pending / unresolved | 84,125 / 13 |
| Verified visual records / visual records blocked | 3 / 4 |
| Reviewed functional fixtures / reviewed upstream builds | 3 / 0 |
| Functional preview identities pending | 84,142 |
| Ledger integrity findings | 18 |
| Full catalog upstream functionality | **Not complete** |

The **separate** 21st.dev reference-route journal is not a registry-item source journal. A page observed in that site does not verify an arbitrary Registry Atlas component; the two counts must never be added together.

## Next implementation work

Continue the bounded reference census and representative desktop/mobile interaction audit. Resolve 18 duplicate identity keys at their registry source. Improve official source-page matching and reviewed images before promoting visual statuses. Expand isolated, license-reviewed runnable source builds, recording real browser interactions for each identity rather than copying an example's status to other components. Add one provider/runtime adapter at a time with pinned dependencies, source hashes, a permission decision and an independently demonstrated interaction.

# Registry Atlas browser decision/action experiment

Status: user-requested implementation specification, October 1, 2026. This extends the existing `system-one-decision-lab/docs/specs/2026-10-01-registry-atlas-browser-decisions.md`; it does not replace Registry Atlas's source-of-truth catalog or approved frontend designs.

## Problem

Registry Atlas has a verified catalog of 408 registries and about 84,000 distinct component identities, but only three `@8bitcn` component documentation routes have browser-confirmed corrections. Structured metadata is incomplete for many items. The current source-recovery command and link-audit ledger cannot autonomously choose a browser's next observed action. Model-only guesses cannot establish that a component URL, installation command, snippet, screenshot, or render result is real.

## Solution

Run a measured, **read-only browser decision experiment** through a managed PinchTab instance and the existing System One decision adapters. Read the page's current semantic controls, build a short list of actual navigable links, let a typed model select a caller-supplied candidate ID or abstain, execute a permitted target through PinchTab, and independently inspect the resulting page and component identity. Keep the existing Registry Atlas link-audit and item-recovery pipelines as the only paths that propose source-data changes. Record actual browser and model outcomes without silently promoting them to catalog truth.

The overall product requirement remains browser-visiting every supported registry, reviewing every existing component link, correcting evidence-supported wrong URLs, and then recovering usable component data. This experiment is an executable stage of that program, not a claim that a three-case demo has met it.

## User stories

1. As a registry maintainer, I want the browser agent to find a registry's component listing from live links, so that it is not forced to guess a URL template.
2. As a registry maintainer, I want choices tied to freshly observed browser element references, so that model output cannot click an invented element.
3. As a registry maintainer, I want the browser to detect wrong destinations and abstentions, so that a predicted link is never treated as verified evidence.
4. As a registry maintainer, I want the experiment to use already-installed OSS backends, so that I can compare their behavior without installing another stack.
5. As a registry maintainer, I want each observed action, model result, and final URL recorded, so that I can compare it with deterministic browsing and reproduce failures.
6. As a registry maintainer, I want extracted metadata to enter the existing reviewed source workflow, so that failed or missing evidence cannot silently change live catalog data.
7. As a component explorer, I want corrected links, install commands, usage examples, and available previews to lead to actual sources, so that the UI does not present invented or unrelated information.
8. As a component explorer, I want visual previews and the Icons route to follow their approved exemplars, so that the UI does not replace product requirements with invented features.
9. As a developer, I want ordinary source/API extraction and security enforcement to stay deterministic, so that adding a decision model does not introduce artificial "verified vocabulary" blockers or bypass real execution boundaries.
10. As a maintainer, I want uncertain or unavailable registries recorded explicitly, so that partial coverage is not mislabeled as success.

## Implementation decisions

- Registry Atlas retains its existing official catalog mirror, curated summaries, safe detail bundles, `recover-item-evidence` and reviewed `audit-component-links` application points. It does not gain a second authoritative registry database.
- The decision-controlled browser runner lives in System One lab with its existing AgentJev/Laya choice adapter. The experiment may output a new evidence observation file but cannot apply data changes or claim source authenticity by model confidence.
- The browser runtime is **the manager-resolved PinchTab profile and exact instance server**. Operators use a dedicated tab ID, never an unrelated tab or a default server. A preflight refuses a tab whose URL is neither blank nor the requested official homepage; no existing source-page tab is repurposed. The program accepts explicit values; it does not create a new profile or restart the daemon.
- The first action contract is intentionally read-only: choose `link` references from the current PinchTab semantic snapshot, plus `none` as an abstention. Candidate descriptions contain the current unique element ref because two observed links can share a label, which the decision backend otherwise rejects. Never expose account actions, form submits, raw shell commands, URL synthesis, downloads or code execution as model options.
- Limit candidate IDs and request context to the existing lab adapter bounds. Candidates come from fresh snapshot nodes and have stable per-decision IDs mapped to the current refs. A selected ID expires after the page changes. Re-observe after a click.
- Verify the selected link's real `href` before clicking. Resolve relative links against the *current observed page*, require HTTPS and the explicitly allowed registry origin; reject protocols, origins or navigation targets outside the declared scope. Source content remains untrusted data.
- For each step record model/checkpoint, candidate IDs, full probabilities, latency, selected ID, browser URL before/after, and whether it actually navigated. Failing/abstained requests remain distinct.
- Stopping is a deterministic state/policy decision with bounded step count; a model's proposed `none` or `DONE` is not proof of source correctness.
- Confirm the final page through a fresh PinchTab observation and the expected source component identity. Preserve the URL and a screenshot if captured, but require a separate reviewer/source validation before any Atlas curated write.
- The lab's current `0.70` top probability and `0.20` margin are **provisional experiment settings**, not task-calibrated assurance. Keep these probes out of automated production routing.
- Avoid arbitrary third-party code execution. Real runnable previews and new icon-glyph ingestion are governed by their existing distinct approval requirements; browsing and retrieving metadata do not authorize live execution.
- The active `feat/catalog-presentation-enrichment` worker owns catalog UI changes. Do not edit or merge its branch as part of this browser experiment.

## Testing decisions

- At the runner's public `run_navigation` seam, test changing candidate refs after navigation, model-selected link execution, probability abstention, model failure, stale or unknown candidate IDs, cross-origin and non-HTTPS destinations, and wrong final component identity.
- Use fake browser and choice boundaries for deterministic offline tests. Assert externally visible browser operations and recorded outcomes, not internal implementation details.
- Test with a real managed PinchTab profile, actual registry homepage/listing, and an already-cached OSS model when locally runnable. Capture the actual resulting URL and source page identity. A synthetic test alone does not prove the model performed a browser action.
- Run the existing full Registry Atlas and System One suites. Verify generated artifacts are unchanged by read-only experimentation.
- The full-catalog program requires a per-registry ledger with 408 supported registries and all existing item/link identities accounted for. It is **not** complete until each link has a verified or explicit unresolved outcome and each changed Atlas navigation route has been browser-confirmed.

## Out of scope for this decision-action experiment

- Bulk guessing of documentation pages from one observed slug.
- Auto-promotion of model-selected paths or model-produced text into Atlas records.
- Executing arbitrary remote component code, installing third-party packages or creating an unapproved preview runtime.
- Replacing the existing frontend design, Icons exemplar, or the other worker's implementation.
- Treating a short live model run as calibration, or treating HTTP 200 as proof of component identity.
- Reworking unrelated Git history, profile auth, PAB data, or the existing lab's uncommitted research/inventory files.

## Completion evidence

The first implementable slice is complete when a real browser page produces fresh selectable candidate refs, a local OSS model returns a valid choice or abstention, an accepted safe choice causes an actual PinchTab navigation, the destination and identity are independently checked, the run is saved without catalog mutation, and both project test suites pass. Overall registry-wide recovery and premium UI completion are **separate incomplete acceptance work** until directly verified.

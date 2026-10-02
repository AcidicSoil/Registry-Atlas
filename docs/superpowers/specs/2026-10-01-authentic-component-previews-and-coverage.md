# Authentic, scalable interactive component previews — specification

**Date:** 2026-10-01
**Status:** User-directed implementation contract; staged delivery, not a claim that every indexed component is executable.
**Repository:** Registry Atlas. Supersedes earlier screenshot-first and external-link frontend proposals where they conflict.
**Related:** ``docs/superpowers/specs/2026-10-01-browser-decision-action-loop.md``, ``docs/superpowers/specs/2026-09-29-catalog-presentation-enrichment-design.md``, ``docs/registry-explorer-data.md``.

## Product contract

Atlas must let a person browse every indexed item, interact with a real functioning component example inside a catalog card when verified, and find the **same demo identity** on the internal detail route. Clicking the available area of the whole card navigates to the Atlas route; an independent demo control inside that card operates without navigating. A miniature Open button, screenshots mistaken for components, raw JSON/source URLs, registry website links, and explanatory placeholder cards dominating the browse grid do not meet this request.

The installed `@8bitcn` Button/Card/Input fixtures demonstrate **interaction patterns recreated in native HTML**, not the upstream React implementation. They must be labeled internally `source-informed-fixture` and may be labeled “Interactive example” in-product, never “original component running” or “source-exact”. New components should use the authentic upstream implementation, assembled in an isolated preview host, whenever supported and safe. A reviewed recreation is permitted only as a separate, explicitly typed fallback with proven interaction parity and human review. Static pictures never count toward functional coverage.

The observed catalog contains 408 source registries in the raw directory, 366 catalog namespace records (362 populated in the raw-registry inventory), and 84,153 compact index rows (including duplicate identities); inventory every raw registry, preserving zero-item and duplicates reporting. A missing demo does not remove the item from browse/search, fabricate a thumbnail, or mark its external URL as verified.

## Deliverables

1. A machine-readable **reviewed demo manifest** keyed by exact namespace and complete item name (not lossy display titles), each entry carrying runtime kind, provenance, exact local entry path, verification status, timestamps and optional source hash. The published runtime consumes only this allowlist. Existing three fixtures are migrated without behavioral regression.
2. A deterministic **read-only full-catalog coverage planner** that merges raw registry directory, compact index, and reviewed demo manifest; reports indexed, reviewed-fixture, upstream-built, unresolved, blocked, unreviewed and zero-item registries. It emits bounded per-registry batches with stable cursor/checkpoints and no guessed URLs or screenshots.
3. A source discovery/extraction worker that visits the official registry homepage, listing and specific item via managed PinchTab and existing official-item recovery. It distinguishes **observed docs URL**, **actual registry JSON**, **embedded source**, **demo composition**, **license**, **framework**, **dependencies**, and **styles/assets**; URL 200 or a filename pattern alone never verifies a component.
4. A constrained, separately hosted **upstream-built preview lane** for a reviewed supported framework (first React/Tailwind/shadcn). Prefer proven OSS tooling such as the official shadcn registry template or Sandpack where fit; do not invent a general remote JSX evaluator. Pinned dependency versions and source hashes build a versioned bundle. Unsupported Vue/Svelte/Next server features remain explicit without changing Atlas’s global framework.
5. The browser renderer uses the same selected manifest identity in catalog and detail, isolates each demo, lazily loads grid previews, and limits concurrent work; the card is a full-size link except the live widget's own controls. No raw source links or screenshots appear in the UI.
6. An auditable QA and progression ledger covering all 408 registries; each candidate has separate URL discovery, source retrieval, build, browser interaction and Atlas card→detail outcomes. Partial coverage stays numerically explicit.

## Identity, source and verification

The canonical key is ``namespace + '/' + exact item.name`` from the registry catalog. The same visible title in two registries or two source paths does not imply identity. A registry can publish slash-containing item names; never silently split or truncate the slug. The official raw directory is authoritative for registry presence and the compact index for current catalog membership; reviewed manifest entries not in either source are rejected.

Manifest schema: ``registry-atlas-component-demos/v1``. Each reviewed entry contains ``namespace``, ``slug``, ``kind`` (``upstream-built`` or ``source-informed-fixture``), ``path`` (same-origin relative fixed prefix), ``source`` (official documentation link and raw registry item URL where confirmed), ``reviewedAt``, ``verifiedAt``, ``status`` (``interaction-verified``), and optional ``sourceSha256`` / ``demoComposition``. The collector must never mark a candidate reviewed automatically; evidence and a reviewer-approved, version-bound build are separate decisions.

An entry is renderable only when its exact manifest identity is approved, its local path matches the allowlisted demo-host prefix, and its built asset exists. Schema errors, stale checksums, missing assets, unsupported framework dependencies, no license, unsafe scripts, ambiguous same-title routes, and browser timeouts produce explicit non-renderable outcomes. A failure must not degrade to a screenshot or external URL action.

For source-built entries, record upstream canonical JSON URL, its SHA-256, file list, dependency graph with exact versions or lockfile, styles/assets, demo fixture source, licensing review, build output hash, reviewer, and browser fixture tests. Review and reverify on any upstream content drift. Avoid automatic remote package install from the browsing process.

## Isolation, data and resource limits

The Atlas parent app never imports or evaluates untrusted registry code. A separate preview build lane produces static immutable assets in an isolated origin or sufficiently separated host, with Content Security Policy, script-only sandbox, no same-origin permission, disabled top navigation, forms and external network by default. Network access requires an explicit per-demo reviewed policy; no cookies, auth storage or Atlas user data are passed to examples. Sandboxed input values must not be posted back to Atlas. Navigation messages must be schema-validated and tied to the requesting iframe's observed source/identity.

Production allows only approved manifests/assets; no user-entered URL, raw registry JSON, arbitrary JSX, iframe srcdoc generated from remote input, or wildcard external iframe path. Per-demo budgets: fixed build timeout, dependency and bundle-size cap, max navigations, and browser execution timeout; record the reason when exceeded. Batch workers are checkpointed and rate-limited per official domain, with a finite retry policy and independent error status. Do not restart the shared PinchTab daemon.

## Catalog and detail behavior

- The entire card surface is a semantic internal link and a keyboard-visible target; live controls inside a separate iframe receive input without nested interactive elements. A verified empty-space click within the iframe may forward only a validated navigation intent. Browser forward/back and modified/middle-click semantics survive.
- Reuse the same manifest key/entry URL with a card/detail mode parameter so the actual demo identity is identical; do not load a second unrelated screenshot or substitute source-site navigation on the detail page.
- The source/provenance URLs remain stored in internal evidence; no raw source URL, “Visit source documentation”, registry homepage or v0 link appears in user-facing cards/detail under this product contract. Install/copy commands may remain as explicitly requested product actions.
- If no approved demo exists, show the item, name and registry, plus a compact factual unavailable indicator; the full-card link still opens an Atlas detail with non-invented item facts.
- Filters and sorting stay together in a compact results toolbar, not a sidebar token wall or a full-page sort strip. Maintain accessible keyboard focus, responsive 390px/1920px layouts, no layout overflow, lazy grid previews and bounded iframe count.

## Resumable work and acceptance

Coverage uses a stable lexicographic registry/item order, raw registry count, distinct and duplicate item totals, reviewed counts broken down by kind, eligible/pending and outcome codes. ``--registry`` and ``--limit`` bound each run; ``--cursor`` resumes after the last emitted token. The read-only planner writes to stdout or an explicitly chosen report path and never changes curated source files or claims completion based on batch size.

Each component is finished **only when** the official homepage/listing/item route and raw source identity are independently verified; source/demo composition and license are recorded; the pinned preview build executes inside the isolated host; its representative input/hover/keyboard action works in the managed browser; card click opens the Atlas detail route; and the detail runs the same demo without console/network/CSP errors. A `source-informed-fixture` is functional example coverage but not upstream-built coverage. A registry-wide milestone requires all its items to be accounted for, not all pretending to be supported.

Track separate milestones: (A) reviewed manifest and honest coverage planner, (B) one true upstream-built reference per supported framework, (C) batch source extraction and build automation, (D) expanded cross-registry coverage, (E) final all-registry ledger reconciliation. Successful unit tests for A never imply D or E.

## Project coordination and open product decisions

Use ``pinchtab-project-work`` PAO run/claims, the mandated PPM frontend guide, user’s Webcmd Design UX laws and existing Atlas design tokens. Preserve the inherited dirty data/crawler/item-detail changes; claim any overlapping file before modifying it. The installed PPM verifier remains quarantined, not completion evidence.

**Explicit decision seams before unrestricted rollout:** which upstream licenses permit serving repackaged code; whether public preview pages may connect to external APIs; whether server-rendered/authenticated components can ever be previewed with synthetic data; supported dependency sources/framework versions; budgets per build; policies for malicious-package scanning and legal review. Default safely to blocked/unverified until a documented decision. No automatic broad remote-code execution is authorized solely by the user's request for functional previews.

## Non-goals and current limitations

The initial 8bitcn demos are **not** exact upstream React builds. Existing URL crawler coverage is not proof of preview support. This spec does not promise simultaneous sandbox execution of all ~84k items, an all-purpose arbitrary-framework compiler, executing code from a newly discovered registry without review, or a hidden second authenticated browser.

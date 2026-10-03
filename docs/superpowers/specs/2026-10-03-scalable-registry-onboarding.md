# Registry Atlas multi-registry preview onboarding specification

## Problem Statement
Atlas indexes hundreds of shadcn registries, but only `@8bitcn` has a reviewed live-preview build policy. Existing source intake, dependency aliases, export selection and interaction certification require significant per-registry intervention. The catalog must become inspectable at scale without treating unknown third-party code as trusted.

## Solution
One reusable pipeline: **catalog discovery → static source analysis → review evidence → approved framework adapter → isolated build → real browser verification → immutable published preview**. Discovery and analysis are read-only and may process unapproved registries. Code execution requires an independently approved license, official source origin, exact source revision and locked dependencies. Compilation alone never means an interaction passed.

## User Stories
1. Maintainers can inspect every catalog namespace and its exact official source URL template without manually opening every registry.
2. Maintainers can paginate a bounded, deterministic discovery report, with counts restricted to `registry:component` items.
3. Maintainers can inspect cached upstream TSX/JSX source imports, export candidates and framework hints without running that code.
4. Maintainers can see separate package imports, aliases, local imports and registry dependencies, plus unresolved references.
5. Reviewers can inspect blockers and evidence without the discovery tool generating a policy that is already marked approved.
6. Operators can reuse a reviewed framework adapter and dependency graph across all compatible source items.
7. Viewers only see certified previews as interaction-verified; unverified builds remain clearly identified.
8. Operators can retain existing verified previews and identify blocked candidates rather than fabricate substitutes.

## Implementation Decisions
- Discovery uses existing catalog and official registry metadata, never inferred URLs.
- A static AST parser analyzes imports/exports; it must not execute source code or mistake strings/comments for imports.
- Namespace and slug validation, size caps, safe file paths and bounded response/report sizes are required.
- Versioned candidate reports include source identity, source checksum, sorted import graph, framework hints and blockers.
- Report creation cannot fetch/install dependencies, approve licensing, alter policies, compile code or modify the public manifest.
- The existing approved compiler retains HTTPS-only intake, exact pins, disabled-network sandbox, CSP and iframe isolation.
- Future adapters should consume the same normalized analysis interface; separate React, Vue and Svelte packages must not share incompatible build assumptions.
- This slice covers catalog-wide discovery and static analysis; additional source-license reviews, adapters and a public broker require separate verification.

## Testing and Acceptance
- A single bounded CLI command emits a reproducible private candidate report for more than one actual registry. Two executions with the same inputs produce identical candidate content and cursor.
- Static inspection tests cover TSX, JSX, type-only imports, re-exports, alias and local imports, duplicate imports, deceptive strings/comments, malformed file paths, and dynamic imports.
- Discovery tests cover missing namespaces, source templates that are not official HTTPS, empty component sets, cursor pagination and invalid limits.
- Integration tests assert that catalog discovery changes neither reviewed policy files nor the interaction-verified manifest.
- Run the existing source-compiler tests and full project verification; explicitly report compile-only and browser-certified counts separately.

## Source-analysis contract (slice A)
`inspectSource(raw, {namespace,slug})` returns a structured immutable report with `schema`, `status`, `sourceSha256`, `frameworkHints`, `files`, `imports`, `registryDependencies`, `exports` and `blockers`. Unsupported source receives `needs-review` or `blocked`, not approval. `discoverCandidates(catalog,registryDirectory,{limit,after})` returns bounded, deterministic `@namespace` candidates and their component counts. Reports cannot be passed as reviewed compiler policies.

## Delivery roadmap
1. **Slice A:** machine-readable discovery and static source analyzer with tests and a read-only CLI.
2. **Slice B:** propose review packs for official source origin, license, source hash, dependency pins, and a recursive alias graph; require explicit approval before activation.
3. **Slice C:** framework-specific builders and compositional harnesses, with browser proof for representative controls in each framework family.
4. **Slice D:** authenticated production job queue, bounded build workers, content-addressed storage, rate limits, tracing, and a CDN.
5. **Slice E:** measured catalog coverage with per-namespace failure categories and automatic refresh of reviewed source revisions; no success claims for failed builds.

## Out of Scope and Decisions Held
Do not grant a license by inference, run build scripts fetched from unreviewed registries, expose a public code execution endpoint, auto-promote unverified previews, or substitute screenshots. Production hosting provider and the policy-evidence approval interface require separate operational decisions. The existing `@8bitcn` policy and its published verified manifest stay authoritative until new source evidence passes equivalent checks.

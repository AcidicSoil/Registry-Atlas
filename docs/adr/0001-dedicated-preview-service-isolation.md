---
title: "Dedicated preview service and execution isolation"
status: Proposed
created: 2026-11-13
repository: registry-atlas
suggested_path: docs/adr/0001-dedicated-preview-service-isolation.md
---

# ADR (Proposed): dedicated preview service and execution isolation

## Context

Registry Atlas is a Vite catalog application. Its legacy component preview implementation shows screenshots from a three-entry asset manifest. The user now requires real interactive components without screenshots or image fallbacks. Running arbitrary third-party code in the Atlas page or an unsandboxed Node process would grant it inappropriate capabilities. The existing product check also prohibits all iframe previews, including genuinely isolated ones.

## Decision proposed

The preview feature will be owned by a separately deployable service. Atlas will consume a read-only lookup API keyed by exact catalog identity and published source revision. The service will manage source resolution, approved ingestion, durable job states, isolated build and runtime workers, interaction verification, and immutable publication. The browser will receive only published preview URLs from a dedicated origin and render them in sandboxed frames.

Public lookup will never accept raw source code or arbitrary source URLs or start builds. An operator-controlled ingestion path will enqueue known catalog identities and source revisions. Workers will run without Atlas credentials, with restricted filesystem, network, process, and resource access. If this isolation cannot be verified, the worker must not run. A successful compile or frame load does not publish a preview: component-specific state-change testing is required.

The legacy screenshot preview pipeline, including hover UI and the three-image manifest, will be retired when the first complete service-backed replacement passes acceptance. Text-only unavailable states are permitted; images and fake controls are not.

## Alternatives considered

1. Official-site live embeds only: cannot reliably cover providers that prohibit embedding or have no matched authored demo; cannot safely assume cross-origin site behavior.
2. Prebuilt static preview artifacts only: insufficient for server-dependent interactive components and does not satisfy the chosen dedicated worker service model.
3. In-browser Sandpack/WebContainers as the default: incurs compatibility and resource restrictions in each user's browser and moves source compilation away from the service boundary.
4. Dedicated preview service with isolated workers: **selected by the user**, subject to security/platform validation.

## Consequences

- The Vite catalog gains a network dependency for preview status, but not for ordinary catalog browsing.
- A separate deployment, preview origin, worker lifecycle, storage ownership, and security review are necessary.
- Source licenses, dependency pins, runtime compatibility and worker-host capabilities restrict which identities can be published; coverage is factual rather than promised.
- The product-contract check must prohibit **unsafe** preview implementations, not all iframes.
- Removing the screenshot modules will require replacing their existing tests and reconciling uncommitted frontend work.
- The system must fail closed: no worker execution if the isolation platform fails and no screenshot substitution when no live preview exists.

## Acceptance conditions for this decision

- A tested isolated worker cannot access forbidden network, secrets, or host paths.
- Public lookup cannot launch arbitrary code.
- A published preview uses a separate origin and constrained sandbox.
- An automated browser action proves a real component-specific state transition.
- Service downtime leaves Atlas navigation usable.

**Status:** Proposed. Saving this document is not acceptance of its decision. Approval of the full ADR is required before implementing the dependent service and security boundary.

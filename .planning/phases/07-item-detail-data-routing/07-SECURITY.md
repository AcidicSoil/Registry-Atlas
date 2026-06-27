---
phase: 07
slug: item-detail-data-routing
status: verified
threats_open: 0
asvs_level: 1
created: 2026-06-27
verified: 2026-06-27
---

# Phase 07 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| URL query → app state | User-controlled query parameters hydrate Registry Atlas route state. | `view`, `registry`, `item`, search, focus, component, candidate params. |
| Third-party registry metadata → typed detail model | Community registry item summaries and fetched item JSON are treated as untrusted data. | Item title, description, type, category, dependencies, files, URLs, warnings, source/provenance. |
| Runtime fetch → static app UI | Browser may attempt to load registry item JSON from public item routes and can encounter network/CORS/invalid content. | HTTP status, parsed JSON, fetch errors, invalid JSON/schema states. |
| Typed detail model → DOM | Normal UI renders component-first item pages and compact cards from imported registry fields. | Escaped strings, safe external links, disabled/fallback copy. |
| Copy command UI → user clipboard | User can copy shadcn `view` / `add` commands. | Command strings are copied only; browser does not execute commands. |
| Atlas UI → external sites | Users may open registry/component/docs/evidence links in a new tab. | External URLs rendered only through safe link helpers. |

---

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|
| T-07-01 | Tampering | `src/registry-explorer/core/urlState.ts`, `src/registry-explorer/ui/shell.ts` | mitigate | URL state allowlists `RegistryExplorerView`, normalizes blank params, and serializes item routes through explicit `selectedItemSlug`; tests cover `view=item&registry=@delta&item=code-block`. | closed |
| T-07-02 | Spoofing / Tampering | `src/registry-explorer/core/registryItemDetail.ts`, `src/registry-explorer/core/itemRoutes.ts` | mitigate | Detail resolution requires matching registry namespace and item slug, checks route eligibility, and returns `not-found` / `route-unavailable` instead of selecting arbitrary content. | closed |
| T-07-03 | Denial of Service | `src/registry-explorer/data/loadRegistryItemDetail.ts`, `src/registry-explorer/core/registryItemDetail.ts` | mitigate | Fetch errors, invalid JSON, invalid schema, missing registry/item, and route-unavailable conditions return discriminated safe result states rather than uncaught render-time exceptions. | closed |
| T-07-04 | Information Disclosure / UX Integrity | `src/registry-explorer/ui/itemDetailView.ts`, discovery/profile card renderers | mitigate | Normal UI does not render `Raw JSON`, `Registry JSON`, or `Open raw item route`; raw source data is marked internal in the detail model and verified only through tests/maintainer paths. | closed |
| T-07-05 | Cross-Site Scripting | `src/registry-explorer/ui/itemDetailView.ts`, `src/registry-explorer/ui/discoveryView.ts`, `src/registry-explorer/ui/registryProfileView.ts`, `src/registry-explorer/ui/renderSafety.ts` | mitigate | Third-party strings are rendered with `escapeHtml`; external links use `renderExternalLink`; tests verify escaping of imported item text and file fields. | closed |
| T-07-06 | Elevation of Privilege / Command Execution | `src/registry-explorer/core/installActions.ts`, `src/registry-explorer/ui/shell.ts`, item/detail/card renderers | mitigate | shadcn `view` and `add` commands remain copy-only via `data-copy-command`; shell copies strings and never executes shell commands in the browser. | closed |
| T-07-07 | Spoofing / Trust Misrepresentation | `src/registry-explorer/ui/itemDetailView.ts`, `src/registry-explorer/ui/discoveryView.ts`, `src/registry-explorer/ui/registryProfileView.ts` | mitigate | UI uses catalog/status/confidence language and safety notes; item detail copy says to review third-party registry code and does not claim Registry Atlas audits or endorses components. | closed |
| T-07-08 | UX Integrity / Safety | `src/registry-explorer/ui/discoveryView.ts`, `src/registry-explorer/ui/registryProfileView.ts`, `07-UI-SPEC.md` | mitigate | Discovery/profile cards were converted into compact summaries with `View component` routing, reducing crowded raw/source link clusters that could obscure safe user choices. | closed |

*Status: open · closed*  
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Verification Evidence

| Check | Evidence |
|-------|----------|
| URL route integrity | `urlState.ts` includes `item` view and `selectedItemSlug`; `urlState.test.ts` covers item-route round trip. |
| Loader safety | `registryItemDetail.test.ts` covers `not-found`, `route-unavailable`, `fetch-error`, `invalid-json`, and `invalid-schema`. |
| Raw JSON excluded from normal UI | `grep -R "Open raw item route\|Raw JSON\|Registry JSON" src/registry-explorer/ui tests/registry-explorer` found only negative test assertions. |
| Escaped rendering | `itemDetailView.ts`, discovery/profile renderers use `escapeHtml`; `itemDetailView.test.ts` verifies hostile item text/file fields are escaped. |
| Safe external links | Item/detail/card external links go through `renderExternalLink`, which is covered by `renderSafety.test.ts`. |
| Copy-only actions | Item/detail/card command controls use `data-copy-command`; shell copy handler copies commands and no browser execution path was introduced. |
| Full project verification | `07-VERIFICATION.md` records `pnpm verify` passing with 17 test files / 103 tests, 0 validation errors, and production build success. |

---

## Accepted Risks Log

No accepted risks.

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-06-27 | 8 | 8 | 0 | serena-gpt-v2 inline secure-phase |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-06-27

---
status: complete
phase: 03
depth: deep
files_reviewed: 37
findings:
  critical: 0
  warning: 3
  info: 1
  total: 4
---

# Phase 03 Deep Code Review — Component-First Discovery

## Scope reviewed

Reviewed the intended Phase 3 product diff, not the later `.codex`/GSD migration noise.

Primary implementation scope: `git diff 1fd3c9b..66639c8` excluding `.planning/`, `.codex/`, and `.serena/`, covering the Phase 3 product files listed in the task. I also inspected current file contents for final state and checked post-Phase3 product data drift in:

- `data/shadcn/registries.raw.json`
- `data/shadcn/sync-report.json`
- `public/data/registries.json`

Planning/context reviewed:

- `.planning/phases/03-component-first-discovery/03-CONTEXT.md`
- `.planning/phases/03-component-first-discovery/03-RESEARCH.md`
- `.planning/phases/03-component-first-discovery/03-UI-SPEC.md`
- `.planning/phases/03-component-first-discovery/03-01-SUMMARY.md` through `03-05-SUMMARY.md`

Implementation/tests reviewed included data generation/validation scripts, runtime data loading, core coverage/search/route/profile/grouping helpers, discovery/profile/focus/component/matrix/shell renderers, styles, index markup, and the changed Vitest coverage.

## Verification performed

Command run from repository root:

```bash
pnpm verify
```

Actual result summary:

```text
$ pnpm typecheck && pnpm typecheck:test && pnpm test && pnpm validate:data && pnpm build
$ tsc --noEmit
$ tsc --noEmit -p tsconfig.test.json
$ TMPDIR=${TMPDIR:-/tmp} vitest run

 RUN  v4.1.7 /home/user/projects/temp/ai-apps/.personal-projects/registry-atlas

 ✓ tests/registry-explorer/coverageStatus.test.ts (2 tests) 3ms
 ✓ tests/registry-explorer/itemRoutes.test.ts (4 tests) 3ms
 ✓ tests/registry-explorer/renderSafety.test.ts (5 tests) 3ms
 ✓ tests/registry-explorer/matrixColumns.test.ts (4 tests) 4ms
 ✓ tests/registry-explorer/registryMirror.test.ts (11 tests) 6ms
 ✓ tests/registry-explorer/registryLoader.test.ts (6 tests) 5ms
 ✓ tests/registry-explorer/registryData.test.ts (4 tests) 14ms
 ✓ tests/registry-explorer/grouping.test.ts (12 tests) 10ms

 Test Files  8 passed (8)
      Tests  48 passed (48)

$ node scripts/validate-registry-data.mjs
validated: /home/user/projects/temp/ai-apps/.personal-projects/registry-atlas/public/data/registries.json
raw: /home/user/projects/temp/ai-apps/.personal-projects/registry-atlas/data/shadcn/registries.raw.json
errors: 0
warnings: 4
warning url-http @shadcn-map raw.url: raw.url uses HTTP from the official directory.
warning url-http @wandry-ui raw.homepage: raw.homepage uses HTTP from the official directory.
warning url-http @shadcn-map official.registry_url_template: official.registry_url_template uses HTTP from the official directory.
warning url-http @wandry-ui official.homepage: official.homepage uses HTTP from the official directory.

$ tsc && vite build
vite v7.3.3 building client environment for production...
✓ 22 modules transformed.
dist/index.html                 2.67 kB │ gzip:  0.87 kB
dist/assets/index-fN3y5M_9.js  37.05 kB │ gzip: 10.03 kB
✓ built in 184ms
```

Post-Phase3 data drift check:

```text
git diff --stat 66639c8..HEAD -- data/shadcn/registries.raw.json data/shadcn/sync-report.json public/data/registries.json
 data/shadcn/registries.raw.json | 1118 ++++++------
 data/shadcn/sync-report.json    |   16 +-
 public/data/registries.json     | 3769 ++++++++++++++++++++-------------------
 3 files changed, 2494 insertions(+), 2409 deletions(-)
```

Current runtime data summary:

```json
{
  "upstream_count": 202,
  "registry_count": 202,
  "local_count": 202,
  "coverage_counts": {
    "verified": 3,
    "unverified": 121,
    "inferred": 78
  },
  "item_summaries": 6
}
```

No verification command failed.

## Findings

### Warning 1 — Coverage status ranking does not match the Phase 3 contract

**Files:**

- `src/registry-explorer/core/coverageStatus.ts:28-34`
- `src/registry-explorer/core/discovery.ts:143-146`
- `tests/registry-explorer/coverageStatus.test.ts:17-20`

**Issue:** Phase 3 planning and UI spec require ranking/tie-break status order to be `verified`, `inferred`, `partial`, `unavailable`, `unverified`. The implementation ranks `partial` ahead of `inferred`, and ranks `unavailable` behind `unverified`:

```ts
export const COVERAGE_STATUS_ORDER: Record<CoverageStatus, number> = {
  verified: 0,
  partial: 1,
  inferred: 2,
  unverified: 3,
  unavailable: 4,
};
```

`searchComponentCandidates()` uses this comparator as a tie-breaker, so equally scored candidates can appear in an order that contradicts the product contract. Matrix/facet status interpretation can also drift from the agreed status semantics.

**Impact:** Users may see partial or unverified catalog states prioritized incorrectly relative to inferred/unavailable states, weakening the phase goal of truthful coverage/status ordering.

**Recommendation:** Change the order to the Phase 3 contract and expand tests to assert the full ordering, not only `verified < unverified`.

---

### Warning 2 — New core discovery/profile behavior is effectively untested

**Files:**

- `src/registry-explorer/core/discovery.ts`
- `src/registry-explorer/core/registryProfile.ts`
- `tests/registry-explorer/`

**Issue:** Phase 3 added the main component-first business logic in `discovery.ts` and registry profile derivation in `registryProfile.ts`, but no dedicated `discovery.test.ts` or `registryProfile.test.ts` exists. The changed test set covers coverage labels, item route syntax, loader mapping, and mirror validation, but it does not directly assert:

- item-vs-tag-vs-alias-vs-description scoring,
- degradation behavior when no verified item matches exist,
- one result per matched known item,
- selected candidate/profile “Why this matched” derivation,
- no homepage fallback for item routes,
- profile source-boundary sections and item route labels.

**Impact:** The highest-risk Phase 3 logic can regress while `pnpm verify` still passes. This is especially concerning because the phase was executed outside the native GSD provider and the planning docs specifically asked for pure core helpers to be tested before DOM wiring.

**Recommendation:** Add focused unit tests for `searchComponentCandidates()`, `buildDiscoveryOverview()`, and `buildRegistryProfile()` with fixtures covering item, component-tag, alias, focus, namespace, description, no-route, and unverified fallback cases.

---

### Warning 3 — Out-of-scope dev tooling and install wording were injected into product `index.html`

**File:** `index.html:12-18`

**Issue:** The Phase 3 diff adds a dev-only dynamic import and package-install comment directly in the app HTML:

```html
<script type="module">
    // first npm i react-grab
    // then in head:
    if (import.meta.env.DEV) {
      import("react-grab");
    }
  </script>
```

This is not mentioned in the Phase 3 plans/summaries, is unrelated to component-first discovery, and matches the review concern about command/install wording appearing prematurely. It also places a development inspection tool in the product entrypoint rather than in a clearly documented dev-only setup surface.

**Impact:** Production build stripped the dev-only block in the verified `dist/index.html`, so this is not a production blocker. It is still disorganized/out-of-place source drift and can confuse maintainers or fail local dev if dependency state changes.

**Recommendation:** Move this into an explicit development-only workflow or remove it from Phase 3 product source. Keep Phase 3 UI free of package/install wording unless it belongs to a later command/action phase.

---

### Info 1 — Secondary search/filter views do not use the Phase 3 discovery index

**Files:**

- `src/registry-explorer/core/grouping.ts:15-35`
- `src/registry-explorer/ui/componentView.ts`
- `src/registry-explorer/ui/focusView.ts`
- `src/registry-explorer/ui/matrixView.ts`

**Issue:** The primary Discover view uses `searchComponentCandidates()`, but focus/component/matrix views still use `filterRegistries()`, whose haystack only includes namespace, description, framework, license, focus tags, and component tags. It omits aliases, coverage status, confidence, catalog status, and `itemSummaries`.

**Impact:** This is non-blocking because the primary Phase 3 workflow is Discover, and the secondary views still work for existing tag/focus browsing. However, the same global search input behaves differently across views: an item-summary query such as `thread` can produce discovery results but not equivalent filtering in secondary views.

**Recommendation:** Either document secondary-view search as registry/tag filtering only, or reuse/derive from the discovery index so global search semantics remain consistent across views.

## Additional observations

- Unsafe rendering/linking: imported mirror text is generally escaped through `escapeHtml()`, and external links use `renderExternalLink()` / `toSafeExternalUrl()` with `http:`/`https:` only. No direct XSS issue was found in the reviewed Phase 3 renderers.
- Item routes: `resolveRegistryItemRoute()` does not fall back to registry homepages and rejects missing/invalid slugs, missing `{name}`, protocol-relative URLs, and unsupported protocols.
- Static deployment: `pnpm build` succeeded with Vite base `/Registry-Atlas/`; built asset URLs in `dist/index.html` were base-prefixed. Runtime data loading uses `import.meta.env.BASE_URL`.
- Post-Phase3 product data drift appears to be an upstream registry refresh from 199 to 202 records plus generated runtime data churn. Validation currently passes with four official HTTP warnings.

## Review conclusion

No critical correctness/security/data-integrity blockers were found. Phase 3 is buildable and passes the repository verification gate, but it has three actionable warning-level issues: incorrect status ordering, missing tests for the core Phase 3 discovery/profile logic, and an out-of-place dev-tool/install-comment injection in `index.html`.

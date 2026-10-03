# Shared source-compiled preview pipeline — 2026-10-03

## Architecture observed and selected

A manual inspection of the real `https://21st.dev/@kuratlielia/components/activity-heatmap` page observed a live `<iframe>` pointing to a versioned `https://cdn.21st.dev/kuratlielia/activity-heatmap/default/bundle.…html` resource. This demonstrates a separately hosted, per-component **generated artifact**; it does **not** disclose 21st.dev's private compiler, caching or authoring internals.

Registry Atlas now uses **one shared source compiler and a per-registry reviewed policy**. It does not handwrite a demo app for every catalog item. The pipeline is:

```text
approved source registry + official item URL
   → bounded same-origin source fetch (redirects denied)
   → revision-bound source cache (never silently overwritten)
   → registry-wide license / dependency / alias policy
   → generic React TSX harness and restricted esbuild compiler
   → versioned SHA-256 HTML artifact (status: built-unverified)
   → real browser interaction proof for that specific identity
   → approved manifest entry (status: interaction-verified)
   → lazy isolated iframe on Atlas cards and detail pages
```

Only a source hash **with** a matching reviewed policy may be compiled. A successful build by itself never earns interaction-verified status. Unsupported imports, unpinned packages, missing entry exports, unknown licensing or changing source versions remain blocked. Compilation is executed with a read-only filesystem and disabled network. The generated HTML has a restrictive CSP: no network connections, no form submits, no arbitrary script evaluation, and no external fonts. Atlas uses `sandbox="allow-scripts"` **without** `allow-same-origin` for the rendered preview.

The old standalone `@8bitcn` HTML fixture remains as a fallback for the existing `card` identity, and it does not count as an upstream build.

## Reproduction

```bash
cd /home/user/projects/temp/ai-apps/.personal-projects/registry-atlas
# Source ingestion is a separate, bounded, HTTPS-only action.
node tools/component-preview-host/ingest.mjs --registry 8bitcn button
node tools/component-preview-host/ingest.mjs --registry 8bitcn input

# The compilation step performs no network access; dependencies must be pinned and cached.
H="$PWD/tools/component-preview-host"
OUT="$PWD/public/component-demos/generated"
bwrap --unshare-net --ro-bind / / --bind "$OUT" "$OUT" \
  --dev-bind /dev /dev --proc /proc --tmpfs /tmp --chdir "$H" \
  -- node publish.mjs --registry 8bitcn button
```

A build without the isolated dependency install should first use the host's exact `tools/component-preview-host/pnpm-lock.yaml` and `pnpm install --offline --ignore-scripts`. Do not run npm postinstall hooks fetched from an unreviewed component.

## Browser evidence

The Atlas-managed browser (profile `registry-atlas`, PinchTab port 9887) exercised the **actual upstream React TSX**, not a recreated example:

| Official identity | Source SHA-256 | Verified action |
|---|---|---|
| `@8bitcn/button` | `228196f5b295e9db209ba6506145acfd3033a6ddfe32eecf4903aa1709a5f770` | Click incremented count 0 → 1; disabled blocked further click; upstream button-decorations present |
| `@8bitcn/input` | `63e2d2f3473995547f88ac322edc31cb967d8e1bb0c489a1d6f69d38976eccb8` | Typing “hello world” updated the upstream input and controlled character count to 11; disabled state applied |

Both generated artifacts load as sandboxed iframes on their exact Registry Atlas detail pages. Their bundle URLs include content hashes and the manifest records the matching original source hashes. No JavaScript errors were reported during the manual interaction checks.

## Limits still open

This is a working **generic pipeline for an approved React registry and two behavior families**, not proof of functional execution for the entire multi-framework catalog. Other registries need approved licenses, dependency graphs and framework adapters. Interactive publication remains per-identity verified. The current GitHub Pages release serves generated cached artifacts, but does not run the compiler at request time; providing an always-on source/build broker, queue and CDN would require a separate deployment, admission controls, and resource quotas. Do not advertise all catalog entries as runnable until their specific source and interaction evidence passes.

## Batch execution and interaction admission (same session)

The pipeline now has two separate bounded CLI stages:

```bash
H="$PWD/tools/component-preview-host"
STATE="$HOME/.local/state/registry-atlas/research"

# Network-only source intake, 1–50 official component identities per batch.
node "$H/ingest-batch.mjs" --registry 8bitcn --limit 50 \
  --out "$STATE/registry-intake-batch-a.json"
# Resume at the returned cursor with --after <cursor>; only registry:component entries qualify.

# Offline, network-isolated compile of cached inputs. Neither stage can
# promote a component into the verified manifest.
bwrap --unshare-net --ro-bind / / \
  --bind "$HOME/.local/state/registry-atlas" "$HOME/.local/state/registry-atlas" \
  --dev-bind /dev /dev --proc /proc --tmpfs /tmp --chdir "$H" -- \
  node batch-preview.mjs --registry 8bitcn --limit 50 \
  --out "$STATE/preview-compilation-a.json"
```

The approved upstream revision supplies one pinned alias graph across 23 shared imports, with 26 exact-version dependencies. The compiler follows **only aliases reachable from each component**. Unsupported libraries are blocked rather than approximated. Generated bundles are versioned by content hash. Live browser admission remains a separate step using `verify-batch.mjs` on prebuilt receipts; its private report records source hashes, original browser controls and before/after state. Build-only rows remain `built-unverified`.

For this session, 8 additional upstream instances passed interactive managed-browser checks: `checkbox` changed unchecked → checked; `switch` changed unchecked → checked; `slider` changed value 50 → 51; `textarea` accepted real text; `toggle` changed pressed state; `tabs` selected the second panel; `accordion` closed its visible answer; and `collapsible` opened its hidden content. The original compiled `button` and `input` were verified previously. These 10 are recorded as upstream-built, interaction-verified; the separate `card` entry remains a source-informed fixture.

The batch reports and browser proof are in private local state under `~/.local/state/registry-atlas/research`, not distributed as public documentation. **Do not interpret compilation throughput as live runtime parity.** A production on-demand preview broker/CDN and source/runtime policies for additional registries and frameworks are still future implementation work.

The full approved `@8bitcn` component intake observed **56 component entries**, all cached without network intake errors. The offline source compiler processed those 56, producing **28 build-eligible bundles and 28 explicitly blocked items** (unsupported dependencies, relative imports, or unresolved exports). Only the 10 upstream components with individual observed browser interactions are served as `interaction-verified`. The other build-eligible candidates are **not** promoted. Evidence: local state `registry-8bitcn-intake-run9a5c-{1,2}.json`, `shared-previews-all-run9a5c-{1,2}.json`, and `preview-browser-proof-20261003-run9a5c.json`.

## Local on-demand preview host

The standalone local service is `tools/component-preview-host/preview-server.mjs` (`pnpm preview:serve`). It binds only `127.0.0.1:5198`. For a locally served Atlas component page with no interaction-verified manifest preview, `@8bitcn` pages offer **Build source preview locally**. Activating that control inserts an isolated iframe pointed at `http://127.0.0.1:5198/preview/@8bitcn/<slug>`. Published GitHub Pages pages do **not** show the local-control path.

The service discovers allowed namespace names from approved per-registry policies. A request checks its official cached JSON identity, source hash, reviewed registry policy hash, and pinned package lock hash. Missing or unapproved identities are not compiled. For an admitted source revision, an isolated process executes the shared esbuild runner with no network, read-only source/dependencies and a single private writeable cache under `~/.local/state/registry-atlas/previews/cache`; concurrent requests for the same revision share the same build, and subsequent requests hit the memory cache. The browser receives a content-security-policy-constrained HTML iframe; the server does not add results to the verified manifest. The runtime is deliberately a *local development service*, not a public build API or a production CDN. Use a separately reviewed deployment, input quotas, authentication, and stronger filesystem restrictions before exposing any compiler to the internet.

Quick checks while the server is running:

```bash
curl -fsS http://127.0.0.1:5198/health
curl -sS -D - -o /dev/null http://127.0.0.1:5198/preview/@8bitcn/badge
curl -sS -w '%{http_code}\n' http://127.0.0.1:5198/preview/@unreviewed/button
```

The response header `X-Preview-Verification: build-only` distinguishes a source-compiled preview from an interaction-certified release. It never implies that all 84,145 catalog identities are executable.

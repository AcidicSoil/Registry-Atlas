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

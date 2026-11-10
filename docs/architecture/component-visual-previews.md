# Component visual previews

**Current implementation (verified 2026-11-09):** Three previously reviewed, item-specific screenshot assets were restored from commit `3bda23b0` after their November 8 deletion. The manifest, SHA-256 asset checks and source-hover browser tests are restored. This is a verification pilot, **not** catalog-wide visual coverage.

## Ownership

| Source                                                                 | Responsibility                                                                     |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| PostgreSQL `atlas_source_pages` and runtime `sourcePageManifest.pages` | Authoritative item identity and original source URL                                |
| `public/data/component-previews.json`                                  | Reviewed screenshot metadata and exact item/source identity                        |
| `public/data/component-previews/*.webp`                                | Locally stored, visually reviewed component screenshots                            |
| `src/registry-explorer/ui/componentPreviews.ts`                        | Validate manifest; return exact source-URL → local-image lookup                    |
| `src/registry-explorer/ui/catalogLinkPreview.ts`                       | Pointer/focus popup without changing source navigation                             |
| `tests/registry-explorer/componentPreviews.test.ts`                    | Verify source identities, bundled WebP files, SHA-256 digests, parser and fallback |
| `tests/catalog-link-preview.e2e.ts`                                    | Verify each real specimen displays in the browser; icons do not                    |

The former `collect-source-media.mjs`, `scripts/lib/source-media.mjs`, `sourceMedia.ts`, and 236-entry `source-media.json` have been retired. Those records established image URLs, not that each image usefully depicted a component. No provider URL formulas, OG-image scraping, new crawler, iframe embedding, browser-side fetch to remote image hosts, or automatic discovery are part of the current preview path.

## Evidence flow

```text
Upstream component source page (must exist in sourcePageManifest.pages)
  → publisher's item-specific component screenshot
  → inspect actual image pixels and match component identity
  → save a WebP file under public/data/component-previews/
  → record namespace, slug, exact sourceUrl, publisher captureSourceUrl,
           imagePath, SHA-256, method and verifiedAt
  → tests verify catalog identity, local bytes and SHA-256
  → browser displays local screenshot only for exact source URL
```

The manifest has `schemaVersion: 1`, a `previews` array, and `method: "reviewed-publisher-screenshot"`. The frontend validates public HTTPS source identity, required fields and local-only image paths, and excludes duplicate sources/assets. The checked-in validation test verifies bytes and SHA-256; the browser trusts those built assets. A missing or invalid manifest, unmatched item, or failed image load displays no preview.

**Pilot specimens (three registries):**

- `@aceternity/animated-testimonials` — testimonial carousel specimen, `2048×1440` WebP.
- `@reui/sheet-16` — application sheet with deployment activity, `1080×720` WebP.
- `@shadcnblocks/about1` — About section layout, `1336×1002` WebP.

These are publisher-supplied still screenshots reviewed visually and bundled locally; they are **not** captured interactive states, full behavioral demos or independently produced browser screenshots. Animations are represented by a static frame. The three upstream pages returned HTTP 200 during intake, but their live UI behavior and future changes are not automatically tracked. Any later expansion must review each actual specimen; an `og:image`, logo, icon, full site screenshot or generic thumbnail alone is insufficient.

## UX and boundaries

- Hover or keyboard focus on a component card/source link displays the corresponding screenshot after the existing pointer delay; Escape, blur and scroll dismiss it.
- Original source links and navigation remain unchanged.
- Unsupported items, icon files, unknown images and narrow/touch layouts have **no preview popup**.
- Image filenames and source URLs are not derived from provider hostname formulas. To add a verified specimen, place its reviewed WebP in the local directory, record the matching catalog identity/URL and SHA-256 in the manifest, then run the tests.
- The screenshot UI is deliberately image-only: no redundant label, metadata strip, or false claims of interactivity. The image retains an accessible alt description.

## Verification

```bash
pnpm exec vitest run tests/registry-explorer/componentPreviews.test.ts tests/registry-explorer/catalogLinkPreview.test.ts
pnpm typecheck
pnpm typecheck:test
pnpm build
pnpm exec e2e run tests/catalog-link-preview.e2e.ts
```

The browser assertions must decode all three local images on genuine catalog links and verify the original source `href`; the logo case must not open a popup. Other catalog behavior should remain unchanged. This pilot does not certify coverage for the remaining catalog or interactive component demonstrations.

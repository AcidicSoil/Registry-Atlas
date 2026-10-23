# Upstream component previews

## Sub-features

Hover and keyboard-focus tooltip; verified image source; image loading; Escape/outside close; provider unsupported fallback; preserved internal and external links.

## How to get to it (user POV)

Open **Components**, search **.NET logo**, hover **Source ↗** or focus its link. The source URL is `https://logoforge.terravidhal.me/logos/dotnet`.

## Driving it with e2e

`tests/catalog-link-preview.e2e.ts` pins the accessible link `Open source page on @logoforge`, original `href`, the `#catalog-link-preview img` asset `/logos/dotnet/icon.svg`, `naturalWidth > 0`, screenshot, and Escape dismissal. Use e2e MCP `locate` before adding selectors. Consult `docs/architecture/component-visual-previews.md` for provider boundaries and rejection criteria.

## Proof

The rendered image is the **upstream .NET logo** and is nonzero pixels. The link still leads to the upstream .NET page. No screenshot of Registry Atlas or unrelated documentation is permitted.

## Charters

```text
upstream-identity|registry-atlas-web|skeptic|At /Registry-Atlas/components, compare several providers' hovered previews with the original Source destinations, rejecting generic banners and mismatched component images
preview-input|registry-atlas-web|fuzzer|At /Registry-Atlas/components, test keyboard focus, Escape, fast repeated hover, mouse exit, and narrow viewport behavior without breaking link navigation
```

## Gotchas

A provider may block hotlinked media, return an unrelated OG card, or change its URL pattern. Unsupported items intentionally show no preview. Exact browser-loaded media and semantic identity are required; an HTTP HEAD response is not proof.

# v1.2 Research: Stack

**Milestone:** v1.2 Component Peek & Alternatives Foundation
**Date:** 2026-06-27

## Question

What stack additions or changes are needed to support component peeks, item detail pages, real item JSON loading, and alternatives groundwork in the existing static Registry Atlas app?

## Existing stack to preserve

- Static Vite + vanilla TypeScript SPA.
- Generated JSON runtime data under `public/data/registries.json`.
- Pure core modules for business logic, UI renderers for HTML output, and tests through `pnpm verify`.
- Copy-only shadcn CLI actions; the browser must not execute installs or third-party registry code.

## Findings

### 1. No UI framework is required for the first peek card

The current static UI can support a first component peek through existing renderers plus a small interaction layer in `shell.ts` or a dedicated UI module. A custom hover/focus/click peek card is preferable to adding a component library because the current UI is already static, dense, and vanilla TypeScript.

Native browser popovers are viable for a progressive enhancement path. MDN describes the Popover API as a standard mechanism for displaying popover content above other page content, and the `popover` HTML attribute is listed as Baseline 2024 / newly available across current devices. For compatibility and control, v1.2 can still implement a custom absolutely positioned/fixed peek card with keyboard support rather than depending entirely on native popover behavior.

Sources:
- MDN Popover API — https://developer.mozilla.org/en-US/docs/Web/API/Popover_API
- MDN `popover` global attribute — https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/popover

### 2. Do not iframe/embed-first

The user clarified this should be a “peek,” not an embed-first experience. That is also the safer technical path. External sites may deny embedding using `X-Frame-Options` or CSP `frame-ancestors`, so a peek model should prioritize screenshots/thumbnails, preview image URLs, metadata, and normal external links.

Sources:
- MDN X-Frame-Options — https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/X-Frame-Options
- MDN CSP frame-ancestors — https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/frame-ancestors

### 3. Screenshots are a later-capable but separable addition

If v1.2 includes screenshot assets, they should be treated as static generated artifacts, not live browser automation inside the app. Playwright supports saving page screenshots with `page.screenshot({ path: 'screenshot.png' })`, so a future or late-v1.2 script can capture preview images during data generation. The runtime app can then display `previewImageUrl` or local `screenshotUrl` fields safely as static images.

Source:
- Playwright screenshots — https://playwright.dev/docs/screenshots

### 4. Item JSON loading should stay typed and static-friendly

The shadcn registry item schema includes metadata such as dependencies, devDependencies, registryDependencies, files, type, title, description, and item name. The official docs also note registry resources are validated as data files, not executable scripts. Registry Atlas should load these item JSON files as data and validate/normalize into a `RegistryItemDetail` model before display.

Sources:
- shadcn `registry-item.json` docs — https://ui.shadcn.com/docs/registry/registry-item-json
- shadcn namespace/resource validation docs — https://ui.shadcn.com/docs/registry/namespace

## Recommended stack approach

- **No new runtime dependency** for v1.2 peek cards.
- **Add core detail modules:** `registryItemDetail.ts`, `itemDetailRoutes.ts`, and/or `componentAlternatives.ts`.
- **Add data loader:** `loadRegistryItemDetail()` that fetches route-eligible item JSON and validates/normalizes safely.
- **Add preview metadata fields:** `previewImageUrl`, `screenshotUrl`, `previewUrl`, `docsUrl`, `visualStatus`, `visualSource`, maybe `previewUnavailableReason`.
- **Add optional future script:** screenshot capture can be a generated-data script later; keep it separate from app runtime.
- **Use `pnpm verify` as gate:** typecheck, tests, validation, build.

## Anti-stack decisions

- Do not add backend infrastructure for v1.2 unless static CORS/fetch limitations force it.
- Do not render arbitrary third-party component source directly in the browser.
- Do not iframe third-party docs/demos as the primary experience.
- Do not add AI recommendation/ranking dependencies yet; alternatives should be taxonomy-based groundwork.

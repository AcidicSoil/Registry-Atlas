# v1.2 Research: Pitfalls

**Milestone:** v1.2 Component Peek & Alternatives Foundation
**Date:** 2026-06-27

## Question

What mistakes are likely when adding component peeks, item detail routes, and alternatives groundwork to this static registry explorer?

## Pitfalls and prevention

### 1. Treating “peek” as iframe embedding

**Risk:** External sites can block iframe embedding using `X-Frame-Options` or CSP `frame-ancestors`. Users also clarified they do not mean embed-first.

**Prevent by:** Prioritize screenshots/thumbnails/preview images and metadata. Keep external links as normal links. Only use iframes later if explicitly safe and allowed.

### 2. Executing arbitrary third-party component code

**Risk:** Rendering remote component source inside Atlas would expand security and dependency scope sharply.

**Prevent by:** Load registry item JSON as data only. Display visuals from static images or safe preview URLs. Keep install/view commands copy-only.

### 3. Broken hover-only UX

**Risk:** Hover-only cards fail on touch devices and can be inaccessible for keyboard users.

**Prevent by:** Support hover/focus for quick peek and click/tap for pinned/open item route. Add escape/back behavior and clear controls.

### 4. Preview data overclaiming

**Risk:** A docs link or raw JSON can be mistaken for a real visual preview.

**Prevent by:** Track visual status explicitly: screenshot, preview-image, docs-link, raw-only, unavailable. Label fallback states clearly.

### 5. CORS/network failures crash detail pages

**Risk:** Runtime fetches to third-party raw item URLs can fail.

**Prevent by:** Use typed loader result states and render safe failure messages. Tests should cover failure branches.

### 6. Alternatives become fake rankings

**Risk:** Showing “better swaps” too early may imply quality scoring without evidence.

**Prevent by:** v1.2 should show related/similar alternatives based on taxonomy/category/tag only. Defer “good/better/best” claims until evidence exists.

### 7. Detail JSON leaks unescaped content

**Risk:** Registry JSON is third-party data and can contain strings that look like HTML/script.

**Prevent by:** Escape every rendered string, use safe link normalization, and render raw JSON in escaped `<pre>`/text content.

### 8. Scope creep into dynamic matrix/research automation

**Risk:** v1.2 could balloon into matrix presets, full crawling, screenshot automation, and recommendation AI.

**Prevent by:** Keep this milestone focused on visual peeks + item detail + related alternatives foundation. Dynamic matrix remains v1.3; broad research automation remains v1.4.

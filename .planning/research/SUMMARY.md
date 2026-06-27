# v1.2 Research Summary

**Milestone:** v1.2 Component Peek & Alternatives Foundation
**Date:** 2026-06-27

## Stack additions

- No new runtime UI dependency is needed for the first version.
- Add typed core/data modules for item detail loading and normalization.
- Add reusable peek/detail renderers inside the existing vanilla TypeScript UI layer.
- Treat screenshots/thumbnails/preview images as static data fields or generated assets, not live runtime automation.
- Playwright screenshot capture is a plausible future/generated-data path, but should stay separate from the runtime app.

## Feature table stakes

- Route-eligible items expose “Peek” / “View component” actions.
- Hover/focus can show a quick visual peek; click/tap opens or pins the detail route.
- Detail route supports `view=item&registry=&item=` style URL state.
- Detail loader fetches/normalizes item JSON and renders clear unavailable/failure states.
- Peek/detail surfaces show visual first when available, with layered fallback: screenshot/thumbnail → preview image → docs/demo link → raw metadata → unavailable.
- Details include overview, dependencies, dev dependencies, registry dependencies, files, raw JSON, source/docs links, and copy-only shadcn view/add commands.
- Type filters help narrow items by registry item type.
- Related/similar components are grouped by taxonomy/category/tag as alternatives groundwork, without quality claims.

## Watch out for

- Do not treat peeks as iframe/embed-first. External sites may block embedding, and the user clarified they want a visual peek, not necessarily an embedded site.
- Do not execute third-party registry component code inside Atlas.
- Do not make hover the only interaction; support keyboard and click/tap.
- Do not label a docs link as a real visual preview.
- Do not claim “better” component swaps until there is evidence for quality ranking.

## Recommended v1.2 shape

Two phases are enough:

1. **Item Detail Data & Routing** — URL state, item detail loader/model, JSON/failure handling, first detail page.
2. **Component Peek & Alternatives UI** — peek cards, visual fallback model, type filters, related/similar alternatives, UI/docs/tests.

Dynamic matrix presets and broad catalog/research automation should remain v1.3/v1.4 unless explicitly pulled forward.

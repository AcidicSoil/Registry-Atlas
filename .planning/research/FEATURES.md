# v1.2 Research: Features

**Milestone:** v1.2 Component Peek & Alternatives Foundation
**Date:** 2026-06-27

## Question

How should component peeks, item detail pages, and alternatives groundwork work for Registry Atlas users?

## User language captured

The user clarified that “inspect it” does not mean only JSON. They want to see the actual component or at least a visual of it from one place. They described a hover/pop-out style interaction, then refined it away from “embedded” toward a “peek”: a screenshot, thumbnail, or actual safe component visual so they can quickly understand what the component is without opening every registry site.

The longer-term direction is alternatives: when AI generates generic/sloppy UI, Registry Atlas should help users find better component swaps.

## Table stakes for v1.2

### Component peek cards

- Route-eligible items have a visible “Peek” or “View component” action.
- Hover/focus can reveal a peek card without navigating away.
- Click/tap can pin/open the same detail experience for accessibility and mobile.
- Peek card shows visual first when available, then item metadata and links.
- Missing visuals have a graceful fallback rather than an empty broken preview.

### Visual source model

Support layered visuals:

1. Local/static screenshot or thumbnail if available.
2. Preview image URL supplied by registry/enrichment data.
3. Docs/demo link with metadata if no image exists.
4. Raw item route and details if no visual exists.
5. “Preview unavailable” state with why.

### Item detail route

- URL state supports internal item view such as `view=item&registry=@delta&item=code-block`.
- Direct links can open item details without losing search/profile context.
- Failure states are specific: route unavailable, fetch failed, invalid JSON, blocked by CORS, item not found.

### Item detail content

- Overview: title, description, namespace, slug, type, category, taxonomy labels, status.
- Visual peek area: screenshot/thumbnail/preview metadata/fallback.
- Dependencies: dependencies, devDependencies, registryDependencies.
- Files: paths, target paths, types, and counts.
- Raw JSON: readable/copyable JSON after safe escaping.
- Actions: copy `npx shadcn@latest view ...`, copy `npx shadcn@latest add ...`, open raw route, open docs/demo.

### Item type filters

- Users can filter route/detail candidates by registry item type such as `registry:ui`, `registry:block`, `registry:page`, `registry:lib`, or unavailable/unknown type.
- Filters should not hide all results without an obvious reset path.

### Alternatives foundation

- Detail/peek surfaces show related or similar components using existing taxonomy/category/tag metadata.
- Related components are “similar alternatives,” not quality-ranked recommendations.
- The UI should avoid saying “best,” “approved,” or “safer” unless there is actual evidence.

## Differentiators to preserve for future milestones

- Automated screenshot capture pipeline.
- Side-by-side visual comparison.
- Dynamic matrix presets and tag picker.
- AI-assisted “swap this slop component” recommendations.
- Quality/evidence scoring from usage, design quality, accessibility, or maintained-source signals.

## Anti-features

- Embed-first external websites.
- Executing arbitrary registry component code in Atlas.
- Pretending an unavailable visual is a real preview.
- Ranking alternatives by quality before evidence exists.

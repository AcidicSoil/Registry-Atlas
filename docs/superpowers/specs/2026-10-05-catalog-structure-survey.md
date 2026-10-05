# Registry Atlas — catalog structure classification survey

**Date:** 2026-10-05  
**Status:** Approved direction; implementation authorized in this conversation.  
**Repository:** `registry-atlas`  
**Parent contracts:** `2026-10-01-scalable-registry-discovery.md`, `2026-10-04-component-catalog-and-deep-links.md`, and `2026-10-04-registry-pattern-verification.md`.

## Purpose

Registry Atlas needs to preserve how each source registry organizes its catalog so users can later filter items by source-defined groups such as `Free`, `Agents`, `Hero`, `Pricing`, or `FAQ`, while also distinguishing components, blocks, pages, templates, themes, icons, and other catalog asset kinds.

This first implementation is a **read-only shadow survey**. It must not mutate `data/shadcn`, `public/data`, the route-pattern SQLite database, or frontend runtime data.

## Core item model

Every observed catalog asset is described by three independent dimensions:

```text
kind
groups[]
access
```

- **kind** describes what the asset is. Preserve the source registry type when available and expose a small normalized kind for reporting. Blocks must not be collapsed into components; pages must not be silently renamed to templates.
- **groups[]** contains exact group/category labels observed on the source site. Registry Atlas must not invent, rename, or force these labels into one universal taxonomy.
- **access** is `free | paid | unknown`. Mark `free` or `paid` only from explicit source evidence. A group literally named `Free` is explicit free evidence. A literal `Paid` or `Premium` marker is explicit paid evidence. Absence from a Free group is not enough to infer paid unless a separate reviewed source rule exists. This survey does not create registry-specific commercial rules.

Existing upstream `categories` remain separate. This feature does not overwrite or reinterpret them.

## Existing system ownership

The new work extends the existing discovery system instead of creating a second crawler or inventory.

Authoritative inputs remain:

- `data/shadcn/registries.raw.json` — official registry namespace/homepage inventory.
- `public/data/registry-catalog-items.json` — compact indexed item identities and raw registry item types.
- `data/shadcn/registry-items.json` — curated identities not present in the compact index.
- `data/shadcn/registry-patterns.sqlite` — durable observed/verified route-pattern, example, sitemap, and item-route evidence.
- Managed `registry-atlas-source-audit` PinchTab browser — rendered source-page observation.

The survey may read these sources but does not modify them.

## Catalog-surface selection

The survey must build bounded source-page candidates from existing evidence before browsing:

1. Official homepage.
2. Parent collection path derived from an observed route pattern template, for example:
   - `https://site/docs/{slug}` -> `https://site/docs/`
   - `https://site/blocks/{slug}/` -> `https://site/blocks/`
3. Parent paths represented by observed pattern examples or sitemap/item-route evidence when they remain same-origin and public HTTPS.
4. Newly observed same-origin catalog/category links discovered while inspecting a selected surface.

Do not fabricate a route from an item slug. Existing route evidence is a seed, not proof that the parent page is a catalog surface.

Each registry has finite limits for surfaces visited and links observed. The runner supports cursor/batch execution and atomic per-registry output so the full 408-registry survey can resume safely.

## Generic structural group discovery

One deterministic extractor must recognize structural patterns, not registry names.

Supported patterns:

1. **Semantic group container** — a heading owns item links inside a section/nav/aside/article.
2. **Peer heading range** — a heading owns links until the next heading at the same or higher level.
3. **Category card** — a card/article links to one category page and exposes the category label.
4. **Category link collection** — a set of sibling links represents peer category pages.
5. **Flat catalog** — no credible source-defined grouping; return `groups: []`.

A group record preserves:

```ts
{
  label: string;          // exact source text
  sourcePattern: string;  // generic structural pattern
  sourceUrl: string;      // first observed source URL
  sourceUrls: string[];   // every surveyed surface that supplied this exact label
  memberIds: string[];    // exact known identities directly supported by structure
  links: { text: string; href: string; knownId?: string }[];
}
```

Do not accept generic umbrella headings such as `Categories`, page titles, FAQ/help copy, or promotional headings merely because catalog links exist somewhere in the same large container.

## Item membership

Membership resolution is ordered:

1. **Deterministic direct membership.** If an observed asset link is owned by exactly one discovered group, use that group. Do not call Clef.
2. **Deterministic multi-membership.** If the source explicitly places an item in multiple groups, preserve all directly observed groups.
3. **Ambiguous membership.** If the source evidence leaves multiple plausible groups and no direct ownership resolves them, call Clef with only:
   - the observed asset identity/link,
   - exact group labels discovered from the same source surface,
   - `NONE`.
   Small candidate sets pass through unchanged. When a surface exposes more than 16 groups, narrow the allowed choices deterministically using token overlap between the observed item ID/text and the exact observed labels. This step may only remove choices; it may not rename or create a label. If no defensible shortlist remains, do not call Clef.
4. **Unresolved.** If the candidate set is too broad to shortlist, or Clef is disabled, unavailable, invalid, or chooses `NONE`, preserve the item as unresolved rather than inventing a group.

Clef may select an observed label. Clef may not create, normalize, merge, or rename a label.

## Bounded Clef contract

`chooseObservedGroup({ state, groups, endpoint, timeoutMs })` uses llama.cpp `/v1/systemone` Choice.

Requirements:

- endpoint must be local HTTP on `127.0.0.1` or `localhost`, exact path `/v1/systemone`;
- choices are the exact non-empty same-surface discovered labels, or their deterministic shortlist, plus `NONE`;
- duplicate labels are rejected;
- response choice must be one of the supplied values;
- all probabilities and confidence must be finite values in `[0,1]`;
- timeout/fetch/validation failure is returned as unresolved by the survey, never promoted to a classification.

No confidence threshold is invented in this slice. The survey records probability/confidence for later evaluation.

## Read-only survey output

The CLI writes one atomic JSON file per registry under an explicit absolute `--output-dir`. It also prints a batch summary.

Schema: `registry-atlas-catalog-structure-survey/v1`.

Per-registry output includes:

- namespace, official homepage, catalog item count;
- raw and normalized kind counts;
- selected/visited catalog surfaces;
- discovered exact groups and generic source patterns;
- deterministic assignments;
- Clef assignments and `NONE` outcomes;
- unresolved items/reasons;
- access counts `free | paid | unknown`;
- errors/blocked states without aborting unrelated registries;
- survey timestamp and catalog/source fingerprint sufficient to identify stale output.

The first survey artifact remains operational evidence only. It is not loaded by the frontend.

## CLI

Create:

```text
scripts/survey-registry-catalog-structure.mjs
```

Required live arguments:

```text
--profile registry-atlas-source-audit
--server <managed instance server>
--tab <explicit tab id>
--output-dir <absolute path>
```

Optional:

```text
--cursor <exclusive namespace>
--max-registries <bounded batch>
--max-surfaces <per registry>
--max-links <per surface>
--delay-ms <minimum delay between source-page navigations>
--decision-url http://127.0.0.1:18080/v1/systemone
--no-clef
```

The CLI verifies that the named managed profile is running on the supplied server and that the tab belongs to that server. It never starts an anonymous browser or changes PPM configuration.

A planning/report-only mode may enumerate all registries and seed surfaces without browsing.

## Failure handling

- unsafe/non-HTTPS homepage: registry is blocked;
- no usable catalog surface: report `no-surface`;
- page navigation/render failure: record the surface error and continue;
- flat catalog: valid `groups: []`, not a failure;
- group extraction ambiguity: keep candidate evidence; do not invent a label;
- Clef failure: item remains unresolved;
- page redirect off the official host: reject; the exact bare-host/`www` canonical pair is accepted because many official homepages redirect between those two forms;
- output file collision: overwrite only the same registry's survey file through atomic partial-file replacement; never touch source data.

## Tests

Deterministic fixture tests must cover:

- Kobra-style semantic sidebar groups;
- assistant-ui-style sections with FAQ/help headings that must not become groups;
- 8bitcn-style peer-heading ranges;
- Wensity-style category cards;
- ReUI-style category-link collection;
- Magic UI/ProseKit-style flat catalog;
- nested item identities and repeated leaf names;
- multi-group direct membership;
- exact `Free` access classification and unknown fallback;
- unsafe/off-origin links ignored;
- surface derivation from route templates without slug fabrication;
- Clef allowed-choice validation, `NONE`, bad probabilities, duplicate labels, timeout and invalid endpoint.

Tests use serialized page observations or fake browser adapters. Unit tests do not access the network.

## Acceptance criteria

The first implementation is complete when:

1. The one-off v1-v8 evaluation logic has a reusable home in tested library modules rather than being the only implementation.
2. A dry/planning pass can enumerate all current registries from authoritative local data.
3. A bounded live survey can process multiple heterogeneous registries through the same code and write resumable per-registry reports.
4. Direct structural membership bypasses Clef.
5. Ambiguous membership can use Clef only from exact observed group labels plus `NONE`.
6. Flat sites remain group-less without false categories.
7. No production/generated catalog data is mutated.
8. Focused tests, source/test typechecks, build, and relevant existing discovery tests pass.
9. The managed source-audit profile is used for live browser verification; unrelated profiles remain untouched.

## Out of scope

- Loading survey output into the frontend.
- Adding Group/Free/Paid facets to the UI.
- Automatically publishing group/access classifications.
- Creating registry-specific category maps.
- Inferring paid status from absence of a Free label.
- Executing third-party component code.
- Replacing the existing route-pattern database, source-page verifier, or catalog sync.
- Claiming every registry has been browsed merely because the runner can address all registries.

A later reviewed slice can promote selected survey fields into generated runtime catalog data and add UI facets after full-survey quality is measured.

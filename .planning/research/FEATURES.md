# Feature Landscape

**Project:** Registry Atlas
**Domain:** shadcn registry discovery and install-assist tool
**Research dimension:** Features
**Researched:** 2026-05-25
**Overall confidence:** HIGH for official shadcn CLI/index behavior; MEDIUM for component-level discovery because registry item coverage varies by third-party registry.

## Executive Summary

Registry Atlas should become a faster decision layer over the official shadcn registry directory, not a replacement marketplace. The official directory and registry index already provide the canonical namespace list, and the live index currently returns 198 registries with `name`, `homepage`, `url`, and `description`. The next milestone should first make those 198 registries searchable, explainable, and actionable.

The core product gap is item-level discovery. The official registry index tells users which registries exist, while the shadcn CLI can search/list registries and add/view namespaced items. Registry Atlas should sit between those layers: ingest the official registry list, enrich or fetch item catalogs where possible, normalize component names and categories, then let users move from "I need an auth form/data table/chat widget" to a small set of registry/component candidates with copyable commands and source links.

For this milestone, table stakes are official directory parity, component-first search, registry profile pages/cards, source links, single install command copy, and a batch command builder. Differentiators are quality-of-decision features: command package-manager variants, inspect-before-install links, dependency/type badges, provenance freshness, comparable alternatives, and shareable filtered states.

The product must stay honest about trust. Community registries are third-party code, and shadcn explicitly tells users to review code before installation. Registry Atlas should help users inspect upstream source and CLI `view` output, but must avoid implying approval, safety certification, or one-click browser installation.

## Table Stakes

Features users would expect for this next milestone. Missing these makes the tool feel incomplete for a shadcn registry directory companion.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Official registry directory parity | The project promise is to mirror the official shadcn directory; the current upstream target is 198 registries. | Medium | Ingest `https://ui.shadcn.com/r/registries.json`, show current count, and surface sync mismatch states. Required before feature claims are credible. |
| Registry cards and profile detail | Users need more than a namespace; the official index exposes homepage, URL template, and description. | Low | Profiles should show namespace, description, homepage/source link, registry URL template, last synced, and available item count when known. |
| Component-first search | The user starts with "I need a component/block", not "I know the registry namespace." | High | Requires item-level data from registry catalogs or CLI search results, plus normalized component/focus vocabulary. This should become the primary view. |
| Registry-first browsing remains available | Some users evaluate a registry brand, author, or design language before choosing components. | Low | Preserve current focus/matrix/search affordances, but route profile CTAs to commands and source links. |
| Install command generation for one item | The official directory tells users to run `npx shadcn add @<registry>/<component>`. | Medium | Generate from namespace plus item name. Use `npx shadcn@latest add @namespace/item` or expose package-manager variants if the UI supports it. |
| Copy command affordance | Discovery tools are only useful if users can act immediately. | Low | Provide copy buttons for install, view, search/list, homepage, and raw item URL where available. Include copied state and keyboard support. |
| Source/homepage links | shadcn warns users to review third-party code; Registry Atlas should make inspection easy. | Low | Every registry profile and component row should link to homepage/source. If no repo is known, label it as homepage, not source. |
| Batch selection and command generation | shadcn namespaced installs support multiple resources in one `add` command. | Medium | Queue selected items and emit one command such as `npx shadcn@latest add @acme/button @v0/dashboard`. Deduplicate selections. |
| Search and filter by registry metadata | The official index provides descriptions and namespaces; users expect text search over them. | Low | Search namespace, description, focus tags, component aliases, framework/design hints, and item names. |
| Empty and partial-data states | Third-party registry catalogs can fail, omit metadata, or be inaccessible. | Medium | Show "registry listed but item catalog unavailable" separately from "no matching components." This avoids false negatives. |
| Data provenance and freshness | The codebase already lacks source/date metadata, and sync drift is a known risk. | Medium | Track official index source, last synced timestamp, item catalog fetch status, and validation errors per registry. |
| URL/share state | Users will want to share a filtered component search or registry profile. | Medium | Encode view, query, selected component, selected registry, and batch queue in URL state or query params. |
| Accessibility baseline for dynamic discovery UI | Tabs, command copy buttons, filters, and selection queues need keyboard and screen-reader support. | Medium | Use semantic buttons/links, visible focus, live copy status where useful, table labels, and no hover-only actions. |

## Differentiators

Features that improve decision speed and make Registry Atlas better than a plain mirror of the official directory.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Component alias normalization | Users search "login", "auth form", "sign in", or "authentication" and expect the same candidate set. | High | Build synonym maps and tag extraction from item names/descriptions. Keep the normalized tag separate from raw upstream item names. |
| Comparable component alternatives | Users want to compare competing implementations across registries without opening many tabs. | High | For a selected component need, show alternatives with registry, item type, description, dependencies, homepage, install command, and confidence. |
| Command package-manager variants | shadcn docs show pnpm/npm/yarn/bun variants; developers often prefer one package manager. | Low | Provide a preference toggle: `npx shadcn@latest`, `pnpm dlx shadcn@latest`, `yarn shadcn@latest`, `bunx shadcn@latest`. |
| Inspect-before-install action | shadcn CLI supports `view` for one or multiple items before installation. | Low | Pair every install command with a `view` command so users can inspect metadata/files before adding code. |
| Batch queue grouped by install risk | Multi-item installs are useful, but mixing registries can hide dependency/config changes. | Medium | Show selected item count, source registries, known dependencies, and a review reminder before copying the batch command. |
| Registry health badges | Helps users avoid dead or incomplete entries. | High | Derive from reachability, valid JSON, item count, last successful fetch, and schema validation. Label as "status" not "quality rating." |
| Item type badges | Registry items can be UI primitives, blocks, hooks, pages, themes, libs, etc. | Medium | Use shadcn registry item `type` values to distinguish components from hooks/themes/pages and avoid misleading component-only filters. |
| Dependency and file-impact preview | Users can judge whether a registry item is lightweight or invasive. | High | Surface `dependencies`, `devDependencies`, `registryDependencies`, file types, CSS vars, env vars, and docs when fetched from item JSON. |
| Official-index delta view | Maintainers need to know what changed since the last sync. | Medium | Show added/removed/changed registries and changed URL templates before accepting generated data updates. |
| Deep links to raw registry JSON and item JSON | Power users and maintainers can debug failures faster. | Low | Use the URL template when an item name is known; link to catalog URL when available. Validate protocols before rendering. |
| Saved/shareable batch command | Lets users assemble a shortlist and share it with a teammate. | Medium | Encode selected items in URL state; avoid accounts/storage for this milestone. |
| Similar registry suggestions | If a registry has no exact match, point users to related registries by focus or aliases. | Medium | Use normalized focus/component tags and item descriptions. Mark as inferred. |
| Keyboard command palette | Fast users expect quick navigation in discovery tools. | Medium | Search registries, components, and actions from one palette. Defer until core data quality exists. |

## Anti-Features

Features to explicitly avoid in this milestone.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Browser-executed installs | Static web apps should not mutate a user's project, and shadcn CLI already owns installation. | Generate copyable commands only. |
| Security badges or "approved" labels | shadcn warns that community registries are third-party code; Registry Atlas cannot audit all code safely. | Show provenance, source links, validation status, and inspect-before-install commands. |
| User accounts, ratings, reviews, or payments | The project is a discovery/install-assist layer, not a marketplace. | Keep anonymous, static, source-aligned browsing. |
| Rehosting registry source code as authoritative | Rehosting can drift from upstream and imply ownership. | Link to upstream homepage/source and fetch schema metadata for discovery only. |
| Manual curation as the primary data path | 198 registries make hand-maintained parity fragile. | Build automated sync plus validation, then allow small controlled overrides for classification. |
| Over-indexing every file's source text in the browser | It increases bundle size, security exposure, and maintenance cost. | Index names, descriptions, types, dependencies, and metadata first; link out for full source inspection. |
| Unlabeled inferred categories | Inference errors can mislead users into wrong install decisions. | Separate upstream facts from Registry Atlas tags and mark inferred/normalized fields. |
| One giant matrix as the primary interface | Dense matrices help comparison but are poor for component-first decisions at 198 registries. | Keep matrix as a secondary analysis view; lead with search and result cards/table. |
| Hidden fallback commands | Different CLI forms have different meanings: namespace, URL, local path, search, view, add. | Show the exact generated command and why it is valid. |

## Feature Dependencies

```text
Official registry sync -> Registry parity count -> Registry profiles
Official registry sync -> URL/protocol validation -> Safe source/homepage links
Official registry sync -> Registry URL templates -> Install command generation
Registry catalog/item fetch -> Item inventory -> Component-first search
Registry catalog/item fetch -> Item types/dependencies -> Component comparison
Component alias normalization -> Component-first search quality -> Similar registry suggestions
Single-item command generation -> Batch queue -> Batch command generation
Single-item command generation -> Inspect-before-install command pairing
Data provenance -> Empty/partial states -> User trust in search results
URL/share state -> Shareable filtered views -> Shareable batch commands
Accessibility baseline -> Copy buttons/search/tabs/queue can ship confidently
```

## MVP Recommendation

Prioritize:

1. Official registry index sync with current-count display, validation, and clear mismatch/error states.
2. Registry profiles with namespace, description, homepage, URL template, last synced, and copyable registry-level commands.
3. Component-first search over known item inventories plus normalized aliases for high-value needs like auth, table/data-grid, chat, dashboard, form, chart, navigation, and marketing blocks.
4. Single-item install and view command copy actions.
5. Batch queue with deduped multi-item install command generation.

Defer:

- Registry health scoring: useful, but it depends on robust sync and validation.
- Dependency/file-impact preview: valuable, but only after item JSON fetching is reliable.
- Command palette: nice for speed, but premature before core search and profiles are correct.
- User ratings/reviews: out of scope and would push the product toward marketplace behavior.
- Full visual previews: high effort, inconsistent across third-party registries, and not necessary for the next decision-layer milestone.

## Suggested Requirements for Next Milestone

| Requirement | Category | Complexity | Acceptance Signal |
|-------------|----------|------------|-------------------|
| Show official registry count and local count | Table stakes | Low | UI and/or validation output reports 198 upstream registries and flags mismatch. |
| Generate `npx shadcn@latest add @registry/item` for item rows | Table stakes | Medium | Every item with a namespace and name has a copyable command. |
| Generate multi-item `add` command from selected queue | Table stakes | Medium | User selects multiple items and copies one deduped command. |
| Pair install with `view` command | Differentiator | Low | User can copy `npx shadcn@latest view @registry/item` before install. |
| Link registry homepage and raw item/catalog URLs when valid | Table stakes | Medium | Links render only for `https:` URLs or explicitly allowed protocols. |
| Display source/provenance metadata | Table stakes | Medium | Each registry shows official index source, last sync, and item fetch status. |
| Normalize component aliases for search | Differentiator | High | Search terms like "login", "auth", and "sign in" return relevant auth candidates. |
| Distinguish upstream facts from Registry Atlas classifications | Table stakes | Medium | UI labels inferred tags separately from upstream name/description/type. |

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Official directory/index parity | HIGH | Verified official docs and live `registries.json`; current live count is 198. |
| CLI command capabilities | HIGH | Official CLI docs support namespaced `add`, multi-item `add`, `view`, `search`, and `list`. |
| Registry/item metadata fields | HIGH | Official schema docs define registry and registry-item fields including item type, dependencies, registry dependencies, files, docs, categories, and meta. |
| Component-first discovery design | MEDIUM | Strongly implied by user need and competing discovery discussions, but item catalog completeness varies by registry. |
| Batch command UX | HIGH | Official namespace docs show installing multiple resources in one command; UX details remain product-specific. |
| Registry health/status badges | MEDIUM | Feasible from validation data, but "health" must avoid overclaiming quality or safety. |

## Sources

- Official shadcn Registry Directory: https://ui.shadcn.com/docs/directory
  - Confidence: HIGH
  - Key facts: community registries are built into the CLI, install pattern is `npx shadcn add @<registry>/<component>`, users should review third-party code.
- Official shadcn Registry Index docs: https://ui.shadcn.com/docs/registry/registry-index
  - Confidence: HIGH
  - Key facts: CLI checks the open-source registry index for `add` and `search`; full list is `https://ui.shadcn.com/r/registries.json`; listed registries must be public, schema-valid, and flat.
- Live registry index: https://ui.shadcn.com/r/registries.json
  - Confidence: HIGH
  - Checked on 2026-05-25; returned 198 registries with `name`, `homepage`, `url`, and `description`.
- Official shadcn CLI docs: https://ui.shadcn.com/docs/cli
  - Confidence: HIGH
  - Key facts: `add` accepts components, `view` supports multiple/namespaced items, `search/list` support registry search and query/limit/offset options.
- Official shadcn Namespaces docs: https://ui.shadcn.com/docs/registry/namespace
  - Confidence: HIGH
  - Key facts: namespaced add supports multiple resources in one command; view/search/list work with namespaced registries; CLI tracks source and resolves dependencies.
- Official `registry.json` schema docs: https://ui.shadcn.com/docs/registry/registry-json
  - Confidence: HIGH
  - Key facts: registry root includes name/homepage/items; include-based source registries are flattened by build; item names must be unique.
- Official `registry-item.json` schema docs: https://ui.shadcn.com/docs/registry/registry-item-json
  - Confidence: HIGH
  - Key facts: items can expose type, title, description, dependencies, devDependencies, registryDependencies, files, docs, categories, and meta.
- Local project context: `.planning/PROJECT.md`, `README.md`, `docs/registry-explorer-data.md`, `.planning/codebase/CONCERNS.md`
  - Confidence: HIGH
  - Key facts: existing app has focus/component/matrix/search views over a hand-maintained static dataset; known gaps include no validation, no provenance, no deep links, and no user-facing install actions.

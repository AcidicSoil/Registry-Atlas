# Using Registry Atlas

Registry Atlas is a visual dictionary for discovering components in the mirrored shadcn community-registry ecosystem. The browser app has three main surfaces: **Discover**, **Registries**, and **Compare**.

This guide describes behavior available on the current `main` branch. Registry Atlas mirrors third-party metadata and generates install commands, but it does not audit or endorse the code in community registries.

## Discover components

Use **Discover** when you know roughly what kind of interface component you need but not which registry provides it.

1. Enter a component or interface concept in the global search field.
2. Narrow the candidate list with the available Category, Component, and Registry facets.
3. Use facet search fields when a facet group contains many values.
4. Sort the filtered candidates by relevance or name.
5. Open a component peek for quick context, or open the item for its detail view.

The search is intentionally useful with rough-language queries. Facets are multi-select, so a discovery session can progressively narrow a broad search without replacing earlier selections.

The Discover list is paginated. Changing the global search or a discovery facet returns the list to its first page.

## Browse registries

Use **Registries** when the registry source matters more than the component name.

The Registries surface supports the same global search context plus registry-oriented facets. Opening a registry profile shows its known items and coverage using the locally mirrored data.

A registry profile can be filtered further with catalog facets. Item rows can then be opened for item-level detail when that information exists in the mirror.

## Compare coverage

Use **Compare** to answer questions such as “which of these registries contains the component types I need?”

Choose registry and component selections in the Compare surface. Registry Atlas builds a coverage model from the local mirror and presents the selected registries against the selected component keys.

Treat the result as **mirror-backed coverage evidence**, not proof that a third-party package is safe or suitable for production. Missing or incomplete upstream metadata can produce unavailable or manual-follow-up states rather than fabricated coverage.

## Build an install queue

Component and item surfaces can add installable entries to the in-memory install queue. The queue supports removing individual entries and clearing the current batch.

Copy actions expose generated install commands for the selected registry item. Review the registry source and command before running it. Registry Atlas does not execute third-party install commands for you.

The install queue is browser-session state; it is not a persistent project manifest.

## Keyboard and accessibility behavior

Interactive component peeks support keyboard focus. `Escape` closes an active peek and returns focus to its trigger. Current navigation marks the active main view with `aria-current="page"`.

For the maintained release-browser checklist, including keyboard/focus, safe-link, disabled-state, queue, URL-restoration, and copy-command checks, see:

`.planning/phases/04-install-actions-release-hardening/04-BROWSER-A11Y-SMOKE.md`

## Understand the data status

Every main view includes mirror status in the content header. It identifies the official shadcn directory source, synchronization timestamp, mirrored/upstream counts, and any validation warning state supplied by the generated mirror metadata.

Registry membership comes from the official shadcn directory mirror. Atlas-specific item-summary enrichment is imported separately and merged during the registry synchronization workflow.

For data refresh and validation details, see [`registry-explorer-data.md`](./registry-explorer-data.md).

## Choose the right surface

| Goal | Start here |
| --- | --- |
| Find a component from a rough description | **Discover** |
| Narrow results by category, component type, or registry | **Discover** + facets |
| Inspect one registry and its known items | **Registries** |
| Compare known component coverage across registries | **Compare** |
| Review an individual mirrored item | Item detail from Discover or a registry profile |
| Collect commands for several items | Install queue |

## Limits to keep in mind

Registry Atlas is intentionally evidence-aware. It should not invent registry metadata when the mirror cannot support a claim. A missing component, incomplete catalog record, or unavailable upstream field is therefore different from a verified negative.

The application is a discovery and comparison tool. Before installing third-party code, review the upstream registry, package contents, dependencies, and project-specific compatibility yourself.

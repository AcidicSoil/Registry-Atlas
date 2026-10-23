# Compare and category filtering

## Sub-features

Catalog filters, category selection, compare route, and URL-scoped catalog views.

## How to get to it (user POV)

Use **Compare** in the primary navigation; use **Components** for search and category filtering. No account needed.

## Driving it with e2e

No dedicated e2e test yet. Inspect role/name selectors via `e2e mcp` before writing `tests/compare-filters.e2e.ts`; do not use class names as the primary contract.

## Proof

Filters change the visible results and can be cleared. Compare displays the selected items without losing their identity or source links.

## Charters

```text
compare-consistency|registry-atlas-web|skeptic|Starting at /Registry-Atlas/compare, inspect comparison controls and compare the selected item names, types, and links with the catalog detail routes
```

## Gotchas

Do not treat an empty selected comparison as missing catalog records.

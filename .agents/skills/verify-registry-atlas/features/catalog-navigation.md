# Catalog navigation and discovery

## Sub-features

Featured home, libraries directory, component/block/page/template/theme/icon browse routes, catalog search, and source links.

## How to get to it (user POV)

Open `/Registry-Atlas/`, select **Libraries**, then the relevant collection. No account required.

## Driving it with e2e

`tests/smoke.e2e.ts` checks **Catalog navigation**, **Search catalog**, and **Libraries**. `tests/catalog-navigation.e2e.ts` clicks **Libraries**, verifies the route, then opens the .NET detail route. Live MCP: `open_session`, `observe`, `locate` the link by role/name, `click`, `observe`.

## Proof

The browser URL becomes `/Registry-Atlas/registries` and navigation remains available. The .NET route renders its actual heading. No search-dependent browser state is stored outside the test.

## Charters

```text
catalog-search|registry-atlas-web|skeptic|Starting at /Registry-Atlas/components, search by name and registry, clear the search, and verify that the visible results and URL scope remain consistent
```

## Gotchas

Large collections use incremental rendering, so only currently loaded cards may exist in the DOM. Do not treat unrendered cards as deleted catalog data.

# Grouped catalog navigation

Route: `/Registry-Atlas/components`, with shared behavior on taxonomy-filtered catalog routes.

## User journey

1. Open the components route. Search, Grid/List and sort must remain available.
2. Open the Navigation family heading. Its disclosure opens without changing route, query, filter state or result count.
3. Choose a nested subtype such as Navbar. The canonical taxonomy filter becomes `navigation/navbar`, the URL records that value, the nested row is selected and the Navigation family stays open.
4. Close and reopen the disclosure using Enter or pointer. Closing must not clear the filter.
5. Choose "All Navigation" to match descendants under Navigation.
6. Change sort or layout. The selected family remains expanded. Opening another group must not silently apply its filter.
7. On a narrow screen, the same filters remain available inside the native mobile navigation dialog.

## Implementation boundaries

- `catalogSidebarNavigation.ts` renders taxonomy-owned nested `details` and `summary` groups. Do not introduce an independent hard-coded category list.
- `shell.ts` owns the ephemeral expanded-group state. A summary only toggles this state. Existing canonical filter actions own URL/query updates.
- Native disclosure and visible "All <family>" affordances replace flat parent buttons.
- Do not couple the grouped filters to the separate setup cart, upstream source previews, or non-React Workbench features.

## Repeatable verification

```sh
pnpm exec vitest run tests/registry-explorer/catalogSidebarNavigation.test.ts tests/registry-explorer/sidebarExemplar.test.ts
pnpm build
pnpm exec e2e run tests/grouped-sidebar.e2e.ts --trace on
pnpm test:e2e:mobile
```

Verify Navigation opens before filtering; Navbar filters `navigation/navbar`; closing and reopening preserves the filter; selected child and ancestor remain visible; groups use actual taxonomy counts and labels. Capture desktop/mobile proof only from the real built application.

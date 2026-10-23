# Theme browsing and editor

## Sub-features

Theme list, theme specimen colors, theme editor, and return navigation.

## How to get to it (user POV)

Open **Themes** from the navigation, then navigate to the theme editor route `/Registry-Atlas/themes/editor`. No account needed.

## Driving it with e2e

No e2e test yet. Use `e2e mcp` to find current semantic controls and create `tests/theme-editor.e2e.ts` before calling the feature tested.

## Proof

A selected theme displays its published swatches and editor changes without changing catalog provenance data. Browser navigation and reload preserve documented states.

## Charters

```text
theme-controls|registry-atlas-web|fuzzer|Starting at /Registry-Atlas/themes/editor, change editable theme controls, use return navigation, and check the preview for incorrect or stale colors
```

## Gotchas

Some registries do not publish complete light/dark theme colors. Missing source data is not a rendered verification pass.

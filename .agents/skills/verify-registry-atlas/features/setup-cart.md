# Non-payment setup cart

## Sub-features

Add from detail; selected count; setup review; command and agent instructions; remove and replace; persisted draft on reload.

## How to get to it (user POV)

Open any component detail, press **+ Add to setup**, then **View setup** and **Review setup**. Nothing is purchased or installed.

## Driving it with e2e

`tests/setup-cart.e2e.ts` covers add → view → review and checks the selected token in the isolated browser's `localStorage['registry-atlas.setup.v1']`. The remove/replace/reload cycle is a follow-up test to add.

## Proof

The cart shows the chosen .NET logo. The review screen has **Install command** and **Coding-agent instructions**. The saved draft contains `@logoforge/dotnet`; no payment or automatic installation happens.

## Charters

```text
cart-replace|registry-atlas-web|fuzzer|Starting at the .NET logo detail, add it, replace it with another component, reload the setup, then remove it and confirm no stale selection or command remains
```

## Gotchas

The cart persists locally in the user's browser. A fresh e2e browser context starts empty; do not infer that the user's PPM profile has an empty setup.

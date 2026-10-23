# Component details

## Sub-features

Title and description, upstream provenance and library links, install command, related items, technical disclosure, and add-to-setup.

## How to get to it (user POV)

Open a card from **Components**, or load `/Registry-Atlas/@logoforge/components/dotnet`. No account needed.

## Driving it with e2e

`tests/catalog-navigation.e2e.ts` verifies the .NET title and **+ Add to setup**. The page's upstream component page link and technical disclosure also need dedicated tests before calling all sub-features covered.

## Proof

The heading identifies the correct item. The visible install command and library navigation stay tied to that item; no unrelated source-image substitution.

## Charters

```text
detail-provenance|registry-atlas-web|skeptic|Starting on the .NET logo detail page, inspect the install token, upstream source, dependencies, and library navigation for mismatched item identity
```

## Gotchas

The install button creates only a local setup draft; it does not run a command.

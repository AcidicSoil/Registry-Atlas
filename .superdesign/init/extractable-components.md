# Extractable components

No framework components are present. Reusable DOM-rendered patterns for design reference:

## AppHeader
- Source: `index.html`
- Category: layout
- Description: brand, global search, and view navigation
- Extractable props: activeView, searchTerm
- Hardcoded: brand and view labels

## DiscoveryCard
- Source: `src/registry-explorer/ui/discoveryView.ts` (`renderCandidate`)
- Category: basic
- Description: registry component result with metadata and install actions
- Extractable props: candidate, selected, queued

## FilterBar
- Source: `src/registry-explorer/ui/discoveryView.ts` (`renderFilterBar`)
- Category: basic
- Description: component filters
- Extractable props: groups, selected

## InstallQueuePanel
- Source: `src/registry-explorer/ui/discoveryView.ts` (`renderInstallQueuePanel`)
- Category: basic
- Description: local copy-only install queue
- Extractable props: entries, batch, feedback

## RegistryCard
- Source: `src/registry-explorer/ui/focusView.ts`
- Category: basic
- Description: registry summary and taxonomy card
- Extractable props: registry, coverage status

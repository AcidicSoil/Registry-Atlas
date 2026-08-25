# Page dependency trees

## `/` Registry Atlas SPA
Entry: `index.html` → `src/registry-explorer/entry.ts`
- `src/registry-explorer/entry.ts`
  - `src/registry-explorer/ui/index.ts`
    - `src/registry-explorer/ui/shell.ts`
      - `src/registry-explorer/ui/discoveryView.ts`
        - `src/registry-explorer/ui/componentPeekView.ts`
        - `src/registry-explorer/ui/renderSafety.ts`
      - `src/registry-explorer/ui/focusView.ts`
      - `src/registry-explorer/ui/componentView.ts`
      - `src/registry-explorer/ui/matrixView.ts`
      - `src/registry-explorer/ui/itemDetailView.ts`
      - `src/registry-explorer/ui/registryProfileView.ts`
      - `src/registry-explorer/core/discovery.ts`
      - `src/registry-explorer/core/grouping.ts`
      - `src/registry-explorer/core/componentFilters.ts`
      - `src/registry-explorer/core/installQueue.ts`
      - `src/registry-explorer/core/urlState.ts`
      - `src/registry-explorer/core/registryProfile.ts`
      - `src/registry-explorer/core/registryItemDetail.ts`
  - `src/registry-explorer/data/loadRegistries.ts`
- `public/styles/registry-explorer.css`

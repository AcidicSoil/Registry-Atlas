# Registry Atlas feature map

Statuses describe the model-free e2e files, not the earlier unit/integration tests. A charter is exploratory until an approved `e2e explore` run and a failing deterministic repro confirm a bug.

| Feature | Route | Test | Status |
| --- | --- | --- | --- |
| [Catalog navigation and discovery](catalog-navigation.md) | `/`, `/registries`, `/components` | `tests/smoke.e2e.ts`, `tests/catalog-navigation.e2e.ts` | tested |
| [Actual upstream component previews](upstream-previews.md) | `/components` and item cards | `tests/catalog-link-preview.e2e.ts` | tested (one provider) |
| [Component details](component-details.md) | `/@logoforge/components/dotnet` | `tests/catalog-navigation.e2e.ts` | tested |
| [Non-payment setup cart](setup-cart.md) | `/setup`, `/setup/review` | `tests/setup-cart.e2e.ts` | tested |
| [Grouped taxonomy filter navigation](grouped-filter-navigation.md) | `/components` | `tests/grouped-sidebar.e2e.ts` | tested |
| [Compare and category filtering](compare-filters.md) | `/compare`, `/components` | — | untested |
| [Theme browsing and editor](theme-editor.md) | `/themes`, `/themes/editor` | — | untested |

Routes in this table are relative to `/Registry-Atlas/`. For a new provider preview, add a dedicated positive actual-image test, a negative marketing/docs case, and a UI proof before changing status.

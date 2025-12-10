# Registry Explorer Data Maintenance

This document describes the data model and maintenance workflow for the Registry Explorer.

## Data Model

The Registry Explorer uses a static dataset located in `src/registry-explorer/data/registries.data.ts`.
This data is typed using the schema defined in `src/registry-explorer/core/registry.schema.ts`.

### Registry Interface

Each registry entry must conform to the `Registry` interface:

```typescript
interface Registry {
  name: string;           // Display name of the registry
  url: string;            // URL to the registry's website or repo
  description: string;    // Short description (1-2 sentences)
  primary_focus: PrimaryFocus[]; // Array of focus keys
  component_tags: ComponentTag[]; // Array of component keys
  framework?: string;     // e.g., "React", "React (shadcn/ui)"
  license?: string;       // e.g., "MIT", "Commercial"
}
```

### Controlled Vocabularies

To ensure consistent grouping and filtering, `primary_focus` and `component_tags` use controlled vocabularies.

#### Primary Focus (`PrimaryFocus`)

Describes the high-level purpose of the registry.

- `ai-chat`: AI assistants, chat interfaces.
- `support`: Support inboxes, help desks.
- `buttons-and-primitives`: Base UI elements.
- `dashboards-and-admin`: Admin panels, data grids.
- `data-display-and-tables`: Tables, charts.
- `auth-and-user`: Authentication, profiles.
- `forms-and-inputs`: Form layouts, inputs.
- `navigation`: Sidebars, navbars.
- `templates-and-layouts`: Marketing pages, layouts.
- `marketing-sections`: Hero, features, pricing.
- `ecommerce`: Products, carts, checkout.
- `misc-utility`: Toasts, modals, hooks.

#### Component Tags (`ComponentTag`)

Describes specific components provided by the registry.

Allowed values are defined in `COMPONENT_TAG_VALUES` in `src/registry-explorer/core/registry.schema.ts`. Common tags include `button`, `table`, `chatbot`, `auth-form`, `hero-section`.

## Maintenance Workflow

### Adding a New Registry

1.  Open `src/registry-explorer/data/registries.data.ts`.
2.  Add a new object to the `registries` array.
3.  Ensure `primary_focus` and `component_tags` use valid keys from the schema.
4.  Run the application to verify the new entry appears in relevant Focus and Component groups.

### Updating Vocabularies

If a new focus or component type is needed:

1.  Open `src/registry-explorer/core/registry.schema.ts`.
2.  Add the new key to the `PrimaryFocus` or `ComponentTag` type union.
3.  Add the new key to the corresponding `VALUES` constant array.
4.  Open `src/registry-explorer/core/labels.ts`.
5.  Add a human-readable label mapping for the new key (for Focus) or ensure the default transformation works (for Component).

## Architecture Overview

The application is modularized into:

- **Core**: Schema, grouping logic, and metrics (`src/registry-explorer/core`).
- **Data**: Static dataset (`src/registry-explorer/data`).
- **UI**: View rendering and shell orchestration (`src/registry-explorer/ui`).
- **Entry**: Bootstrap logic (`src/registry-explorer/entry.ts`).

The `index.html` file serves as the shell, loading the CSS and entry script.

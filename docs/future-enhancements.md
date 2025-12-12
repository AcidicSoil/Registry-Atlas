# Future Enhancements

## Dynamic Component Deep-Linking

We can significantly improve the user experience in the "By Component" view by generating direct links to component documentation, rather than just linking to the registry homepage.

### Implementation Strategy

1.  **Data Augmentation**:
    *   Update `Registry` schema to include an optional `docBaseUrl` field (e.g., `https://ui.shadcn.com/docs/components/`).
    *   This data can be collected by the web agent (using the `docBaseUrl` field in the extraction schema) or manually curated.

2.  **Dynamic URL Generation**:
    *   In `componentView.ts`, modify the "Visit" link logic.
    *   If `docBaseUrl` exists, append the current `componentKey` (slugified if necessary) to the base URL.
    *   Example: `${registry.docBaseUrl}/${componentKey}` -> `https://ui.example.com/docs/components/button`

3.  **Fallback**:
    *   If `docBaseUrl` is missing, or if the generated link returns a 404 (advanced: link checking), fall back to the generic `registry.url`.

### Benefit
This allows users to jump straight from "I need a Button" in our UI to the "Button" documentation page on the external registry, saving them a navigation step.

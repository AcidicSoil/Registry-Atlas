# Update Plan for Registry Explorer

This document outlines the steps required to integrate the research artifacts into the **Registry Explorer** project.  The goal is to expand the component catalog, update the taxonomy and ensure that UI and validation rules accommodate new registries and items.

## 1. Refresh registry data

1. **Add new registry mirrors:**
   * Create mirror JSON files under `public/data/registries/<registry-name>.json` or a similar location for each newly cataloged registry (`@delego`, `@delta`, `@diceui`).  Use the `raw_item_url` fields from `registry-catalog.normalized.json` to populate item data.
   * Include top‑level registry metadata (homepage, license, framework, etc.) in the mirror file so the explorer can display it.
2. **Update `registries.json` or `registries.data.ts`:**  Append entries for the new registries with their name, homepage, description and URL template.  Ensure that `routeEligible` is set to `true` for registries with a machine‑readable catalog.

## 2. Extend the component taxonomy

1. **Update `COMPONENT_TAG_VALUES`:**
   * Append the proposed tags listed in `component-taxonomy.proposed.json` (`theme`, `status-pill`, `decision-pill`, `otp-input`, `code-block`, `syntax-highlighting`, `utility-button`, `zoomable-image`, `card-deck`, `admonition`, `qr-code`, `chat-interface`, `ai-chat`, `map-pointer`, `angle-slider`, `circular-progress`, `color-picker`, `color-swatch`, `compare-slider`, `cropper`, `receipt`, `audit`).
   * For each new tag, add a human‑readable label and assign it to a high‑level category (e.g., `styles-and-themes`, `badges-and-chips`, `form-controls`, `code-and-markdown`, `media-and-images`, `ai-and-chat`, `maps-and-location`).
2. **Alias definitions:**  If there are common synonyms (e.g., `chip` for `pill`), add alias mappings so that search is flexible.

## 3. Update `RegistryItemSummary` and validation rules

1. **Schema changes:**
   * Add optional fields for `license`, `framework`, `provenance`, `confidence`, `evidence_url`, `install_token`, `view_command`, `install_command`, `catalog_status` and `route_eligible` to the `RegistryItemSummary` interface.  These fields are present in the normalized catalog and support richer metadata.
   * Introduce a `files` array allowing each item to list multiple source files with target paths.
2. **Validation:**  Modify validation logic to enforce that every item has at least one evidence URL and an explicit confidence level.  New warnings or errors should be surfaced in development mode when data is incomplete.

## 4. Enhance route resolution and install/view commands

1. **Command generation:**  Use the `install_token` from the normalized catalog to generate `npx shadcn@latest view …` and `add …` commands.  Avoid hard‑coding patterns; instead, derive commands dynamically from registry metadata.
2. **Route resolution:**  Extend route resolution logic to support GitHub raw URLs (e.g., `raw.githubusercontent.com`) and domains like `deltacomponents.dev` and `diceui.com`.  Implement fallback handling for registries without a catalog (display a message that items may require manual installation).

## 5. Update UI components

1. **Component matrix:**  Regenerate the coverage matrix using `registry-coverage-matrix.json`.  The matrix should display new tags as columns and include the three new registries.  Provide tooltips explaining the status values (verified, inferred, unavailable).
2. **Detail views:**  For each item, display the new metadata fields (description, type, category, dependencies, devDependencies, registryDependencies, provenance, confidence and evidence).  Include a button to copy the install command.
3. **Registry profile:**  Display registry metadata such as license, framework, GitHub URL and catalog availability.  Highlight registries with AI/chat components or unique categories.

## 6. Search ranking and filtering

1. **Tag‑based filtering:**  Update search logic to recognize the new tags.  Users should be able to filter by `ai-chat`, `theme`, `code-block`, etc.
2. **Category grouping:**  Use the high‑level categories assigned to each tag to group components in the UI (e.g., show all “AI and chat” components together).

## 7. Documentation and tests

1. **Developer documentation:**  Add documentation explaining the new fields, tags and how to add future registries.  Include examples of updating registry mirror files and using the update scripts.
2. **Tests:**  Write unit tests to validate that the registry parser correctly reads new fields (e.g., license, provenance) and that tag generation functions return the expected values.  Include tests for route resolution on GitHub raw URLs.

## 8. Manual follow‑up registries

The following registries require additional research because their catalogs were unavailable or incomplete:

* **@7ovr:** Investigate the website and GitHub repository to manually list available blocks and sections.  Determine whether a hidden JSON endpoint exists or whether the CLI provides an index.
* **@devl:** Locate any catalog or docs pages and extract item names and descriptions.  If necessary, open issues or contact maintainers for guidance.

Document findings in a future research pass and update the normalized catalog accordingly.

---

By following these steps, a later implementation agent will be able to expand the Registry Explorer’s data models, UI and tooling to support a richer set of registries and components without repeating the research phase.
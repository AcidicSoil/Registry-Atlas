# Registry Research Report (June 27, 2026)

## Summary

This research pass investigated a sample of registries listed in the shadcn **Registry Explorer**.  Due to network restrictions and the size of the open source registry index, only a subset of registries could be cataloged.  The goal was to assemble a normalized catalog of registry items, expand the component taxonomy and produce a coverage matrix.  Three registries were successfully cataloged: **@delego**, **@delta** and **@diceui**.  A total of **26 items** were captured with high confidence and marked route‑eligible.

## Registries cataloged

| Registry | Catalog/Index status | Route resolution | Evidence |
|---|---|---|---|
| **@delego** | Provides a complete machine‑readable catalog at `public/r/registry.json` on GitHub【59244129981157†L114-L129】.  Items include a theme, button, status badge, decision pill, signed receipt and field. | All items include slugs that resolve to raw GitHub JSON files. | Delego’s `registry.json` lists each item with metadata, dependencies and file paths【59244129981157†L130-L162】. |
| **@delta** | Exposes a large catalog at `https://deltacomponents.dev/r/registry.json`【41141706564470†L38-L47】.  The file defines many UI and block components such as `input-otp`, `code-block`, `copy-button`, `cambio-image`, `card-deck`, `admonition`, `tabs`, `qrcode`, `chat` and `mapbox-pointer`. | Slugs resolve to item JSON files at the same domain (e.g., `.../r/code-block.json`). | The registry JSON shows dependencies, registry dependencies and categories for each item【41141706564470†L81-L99】. |
| **@diceui** | Contains a comprehensive registry at `https://diceui.com/r/registry.json`【294852709217546†L5-L23】.  Items studied include `action-bar`, `angle-slider`, `avatar-group`, `badge-overflow`, `banner`, `checkbox-group`, `circular-progress`, `color-picker`, `color-swatch`, `compare-slider`, `cropper` and `combobox`. | Each item slug resolves to a JSON file at `diceui.com/r/{slug}.json`. | Evidence lines from the registry JSON describe dependencies and file paths for each component (e.g., `angle-slider`【294852709217546†L27-L49】, `color-picker`【294852709217546†L142-L169】). |

### Registries requiring manual/docs-based collection

Several registries listed in the master `directory.json` could not be cataloged because their index or item endpoints returned **404** or were inaccessible.  For example:

* **@7ovr** – The registry URL template `https://7ovr.com/r/{name}.json` does not include a machine‑readable index; the `registry.json` path returns a 404 page【723972970384145†L10-L14】.  The site’s UI lists categories but does not expose item JSON routes.  A manual scrape of the documentation would be required to capture items.
* **@devl** – The registry template `https://devl.dev/r/{name}.json` also returns 404 for the index and item slugs【692134391967789†L0-L6】.  Without a catalog, only the GitHub repository or docs could be used.

Because of time constraints, these registries were not fully explored.  They are flagged for manual follow‑up in the update plan.

### Registries that failed or blocked research

No registry explicitly blocked crawling or served anti‑scraping measures.  However, some registries lacked a JSON catalog, which prevented machine‑based collection.  For example, 7ovr and devl require manual parsing of their docs pages.  There were no legal or technical restrictions encountered during research.

## Component categories observed

The items across the three cataloged registries span a wide range of categories.  Notable categories include:

* **Themes/Style:** Delego provides a `theme` item with comprehensive design tokens【59244129981157†L0-L60】.
* **Buttons and Variants:** Standard buttons (`button`), utility buttons (`copy-button`) and toolbars (`action-bar`) were captured.
* **Badges and Pills:** `status-badge` and `decision-pill` extend the idea of badges with protocol‑specific states【59244129981157†L130-L162】.
* **Form Controls:** OTP input, checkbox group, combobox and angle slider components illustrate advanced form controls【41141706564470†L38-L47】【294852709217546†L27-L49】.
* **Data Display:** Signed receipts and code blocks provide unique data display patterns【59244129981157†L166-L179】【41141706564470†L81-L99】.
* **Carousels and Media:** Card decks, zoomable images and color pickers show interactive media handling【41141706564470†L135-L146】.
* **AI and Chat:** Delta’s chat interface is designed for streaming AI/LLM interactions【41141706564470†L209-L227】.
* **Maps:** Mapbox pointer components enable geospatial display【41141706564470†L231-L237】.

## Largest registries by item count

* **@delta** – Roughly 80–100 items (based on the length of the catalog file) with numerous UI components, AI blocks and map‑based widgets.  Only a subset of items were captured in this pass due to scope.
* **@diceui** – Contains dozens of Radix‑based components and utilities; at least 30 items are defined in the registry JSON.  Ten of these were cataloged here.
* **@delego** – A small but focused registry featuring six items oriented around authentication and audit.

## Best registries for specialised domains

* **AI/chat components:** The **@delta** registry is currently the strongest source of AI and chat components.  It offers a streaming chat interface, AI‑chat sidebar block and chatbot window block【41141706564470†L209-L227】【41141706564470†L276-L304】.
* **Dashboards/Admin:** None of the sampled registries emphasised dashboards.  Additional research into registries such as `@7ovr` or `@devl` may surface dashboard components.
* **Forms:** **@diceui** provides rich form controls (checkbox group, combobox, color picker, angle slider) built on Radix UI【294852709217546†L27-L49】【294852709217546†L142-L169】.  **@delta** contributes OTP input and chat composer inputs.
* **Marketing/Pages:** **@delta** includes landing‑page blocks like testimonials and interactive feature showcases【41141706564470†L309-L337】.  Future passes should explore 7ovr and other marketing‑oriented registries.
* **Primitives:** Both **@diceui** and **@delta** supply many primitive components (e.g., avatar groups, badge overflows, tabs and sliders) that are absent from the core shadcn UI.

## Proposed schema and UI changes

Research revealed several gaps in the current project schema:

1. **New component tags:** Many items do not map to existing tags.  Proposed tags like `theme`, `status-pill`, `decision-pill`, `otp-input`, `code-block`, `card-deck`, `admonition`, `chat-interface`, `map-pointer`, `angle-slider`, `color-picker`, `color-swatch`, `compare-slider` and `cropper` should be added to improve filtering and matrix utility.  These tags are detailed in the proposed taxonomy file.
2. **Support for AI/block categories:** The schema should distinguish between UI components (`registry:ui`) and blocks (`registry:block`).  Blocks often contain multiple files and may install pages as well as components (e.g., Delta’s `ai-chat-sidebar` block【41141706564470†L276-L304】).  The UI could group blocks separately and surface metadata like `iframeHeight` and `container` for previews.
3. **Enhanced category metadata:** Registries like Delta include `categories` arrays (e.g., `ai-elements`, `landing-page`, `featured`)【41141706564470†L309-L337】.  The project should capture these categories and allow browsing by category.
4. **License and framework fields:** The registry schema currently omits `license` and `framework`.  Including these fields helps developers assess compatibility and legal requirements.
5. **Evidence and provenance:** Each item should include fields for `provenance`, `evidence_url` and `confidence` to support auditing of the catalog.  These have been added in the normalized catalog and should become part of the official schema.

## Unresolved questions and next steps

1. **Completeness of the registry list:** The master `registries.json` lists hundreds of registries.  Only three were cataloged.  A future research pass should systematically iterate through the remaining registries, prioritizing those with machine‑readable catalogs.
2. **Manual docs scraping:** Registries without a JSON catalog (e.g., 7ovr, devl) require manual inspection of their websites or GitHub repos to extract items.  This process is time‑consuming and may need automation tools or collaboration with registry maintainers.
3. **License verification:** Several registries did not specify a license.  Confirming licenses via GitHub or contacting maintainers is necessary before exposing items in production.
4. **Framework support:** Some registries may target frameworks other than React.  The current pass assumes React compatibility; further research should record framework specifics.

## Conclusion

This preliminary research demonstrates that machine‑readable registry catalogs greatly simplify data collection.  Registries such as **@delego**, **@delta** and **@diceui** provide rich metadata that can be normalized into a structured catalog.  Expanding the component taxonomy and coverage matrix will enhance the Registry Explorer’s filtering and recommendation capabilities.  Continued research and collaboration with registry maintainers will be essential to complete the catalog and keep it up‑to‑date.
import { renderCatalogGridAttributes } from "./catalogGrid";
import * as stylex from "@stylexjs/stylex";
import { cardMarker, cardStyles } from "./catalogCard.stylex";
import { discoveryStyles } from "./catalogDiscovery.stylex";
import { renderInfiniteScrollControl } from "./infiniteScrollControl";
import type { CatalogComponent, CatalogQueryResult } from "../core/catalogQuery";
import { catalogRoutePath, type CatalogBrowseQueryState } from "../core/catalogRoutes";
import type { CatalogAssetKind } from "../core/catalogCollections";
import { catalogTaxonomyNodeMap, type CatalogTaxonomy } from "../core/catalogTaxonomy";
import type { RegistryThemeSwatch } from "../core/registry.schema";
import { escapeHtml, renderStyleXAttributes } from "./renderSafety";
import { sourcePageNavigation, verifiedRegistryHomepage } from "./sourcePageLink";
import { renderRegistryIcon } from "./registryIdentity";

interface CatalogDiscoveryBand {
  label: string;
  routePath: string;
  items: readonly CatalogComponent[];
}

export interface CatalogComponentsViewOptions {
  searchTerm: string;
  browseState?: CatalogBrowseQueryState;
  browseControls?: string;
  discoveryBands?: readonly CatalogDiscoveryBand[];
  layout?: "grid" | "list";
}

export function renderCatalogComponents(
  headerRoot: HTMLElement,
  bodyRoot: HTMLElement,
  result: CatalogQueryResult,
  options: CatalogComponentsViewOptions,
): void {
  const countLabel = result.total === 1 ? "1 item" : `${result.total.toLocaleString()} items`;
  headerRoot.innerHTML = `
    <div class="catalog-page-heading">
      <div class="catalog-eyebrow">Explore</div>
      <h1>Components</h1>
      <p>${escapeHtml(countLabel)} across published registries.</p>
    </div>
  `;

  const emptyCopy = options.searchTerm.trim()
    ? `No catalog items match “${escapeHtml(options.searchTerm.trim())}”.`
    : "No catalog items are available.";

  const controls =
    options.browseControls ??
    (options.browseState ? renderCatalogBrowseControls(options.browseState) : "");

  bodyRoot.innerHTML = `
    ${controls}
    ${renderDiscoveryBands(options.discoveryBands ?? [])}
    ${
      result.items.length
        ? `
        ${renderResultMeta(result)}
        <div${renderCatalogGridAttributes({ layout: options.layout, kind: "component" })}>
          ${result.items.map((item) => renderCatalogComponentCard(item, "component", { layout: options.layout, context: "collection" })).join("")}
        </div>
        ${renderInfiniteScrollControl(result.page, result.pageCount)}
      `
        : `<div class="empty-state"><h2>${emptyCopy}</h2><p>Try a different item name, category, kind, or registry.</p></div>`
    }
  `;
}

function renderDiscoveryBands(bands: readonly CatalogDiscoveryBand[]): string {
  const visible = bands.filter((band) => band.items.length > 0);

  if (!visible.length) return "";

  return `
    <section class="catalog-discovery-bands" aria-label="Component discovery collections">
      ${visible
        .map(
          (band) => `
        <section class="catalog-discovery-band">
          <div class="catalog-discovery-band-heading">
            <h2>${escapeHtml(band.label)}</h2>
            <button type="button" class="link-button" data-catalog-route="${escapeHtml(band.routePath)}">View collection</button>
          </div>
          <div${renderStyleXAttributes(stylex.attrs(discoveryStyles.row))} data-catalog-discovery-row>
            ${band.items
              .slice(0, 6)
              .map((item) =>
                renderCatalogComponentCard(item, "component", { context: "discovery" }),
              )
              .join("")}
          </div>
        </section>
      `,
        )
        .join("")}
    </section>
  `;
}

function appliedCatalogFilters(
  state: CatalogBrowseQueryState,
  options: {
    taxonomy?: CatalogTaxonomy;
    selectedAssetKinds?: readonly AssetKindToken[];
  },
): Array<{ attribute: string; value: string; label: string }> {
  const canonicalIds = state.canonicalIds ?? [];
  const access = state.access ?? [];
  const selectedAssetKinds = options.selectedAssetKinds ?? state.assetKinds ?? [];
  const taxonomyMap = options.taxonomy ? catalogTaxonomyNodeMap(options.taxonomy) : null;

  return [
    ...state.registryNames.map((value) => ({
      attribute: "data-catalog-registry-value",
      value,
      label: "Registry: " + value,
    })),
    ...state.itemTypes.map((value) => ({
      attribute: "data-catalog-type-value",
      value,
      label: "Type: " + value.replace(/^registry:/, ""),
    })),
    ...state.categories.map((value) => ({
      attribute: "data-catalog-category-value",
      value,
      label: "Source: " + value,
    })),
    ...selectedAssetKinds.map((value) => ({
      attribute: "data-asset-kind-value",
      value,
      label: "Asset type: " + ASSET_KIND_LABELS[value],
    })),
    ...canonicalIds.map((value) => ({
      attribute: "data-catalog-canonical-value",
      value,
      label: "Category: " + (taxonomyMap?.get(value)?.label ?? value),
    })),
    ...access.map((value) => ({
      attribute: "data-catalog-access-value",
      value,
      label: "Access: " + value[0]!.toUpperCase() + value.slice(1),
    })),
  ];
}

export function renderCatalogBrowseControls(
  state: CatalogBrowseQueryState,
  options: {
    taxonomy?: CatalogTaxonomy;
    selectedAssetKinds?: readonly AssetKindToken[];
    searchTerm?: string;
  } = {},
): string {
  const activeFilters = appliedCatalogFilters(state, options);
  const query = options.searchTerm?.trim() ?? "";
  const active = Boolean(query) || activeFilters.length > 0;

  if (!active) return "";

  return `<div class="catalog-results-context" aria-label="Current catalog scope">
    ${query ? `<span class="catalog-search-context">Search: “${escapeHtml(query)}”</span>` : ""}
    ${
      activeFilters.length
        ? `<div class="catalog-applied-filters" role="group" aria-label="Active filters">
      ${activeFilters
        .map(
          (
            entry,
          ) => `<button type="button" class="catalog-applied-filter" ${entry.attribute}="${escapeHtml(entry.value)}"
        aria-label="Remove ${escapeHtml(entry.label)} filter">${escapeHtml(entry.label)} <span aria-hidden="true">×</span></button>`,
        )
        .join("")}
    </div>`
        : ""
    }
    <button class="link-button catalog-filter-clear" type="button" data-catalog-clear>Clear all</button>
  </div>`;
}

export type AssetKindToken = CatalogAssetKind;

const ASSET_KIND_LABELS: Readonly<Record<AssetKindToken, string>> = {
  component: "Components",
  block: "Blocks",
  page: "Pages",
  template: "Templates",
  theme: "Themes",
  icon: "Icons",
  other: "Other",
};

function catalogCardRoutePath(
  component: CatalogComponent,
  routeKind: "component" | "block" | "page" | "template" | "theme" | "icon",
): string {
  if (routeKind === "component") return component.routePath;
  const base = component.routePath.slice(0, component.routePath.indexOf(component.namespace));
  const kind = routeKind === "icon" ? "component" : routeKind;

  return catalogRoutePath({ kind, namespace: component.namespace, slug: component.slug }, base);
}

function renderCardRegistryHomepage(url: string | null, namespace: string): string {
  if (!url) return "";

  return `<a${renderStyleXAttributes(stylex.attrs(cardStyles.registryHomepage))}
    data-registry-homepage href="${escapeHtml(url)}"
    target="_blank" rel="noreferrer noopener"
    aria-label="Open registry homepage for ${escapeHtml(namespace)}">Registry homepage ↗</a>`;
}

function cardLayoutAttributes(options: {
  layout?: "grid" | "list";
  context?: "collection" | "discovery";
}): string {
  return renderStyleXAttributes(
    stylex.attrs(
      cardStyles.card,
      cardMarker,
      options.context === "collection" && cardStyles.collectionCard,
      options.layout === "list" && cardStyles.listCard,
      options.context === "discovery" && cardStyles.discoveryCard,
    ),
  );
}

function renderCardSourceLink(
  source: { url: string; level: string } | null,
  namespace: string,
): string {
  if (!source) return "";

  return `<a${renderStyleXAttributes(stylex.attrs(cardStyles.original))} data-catalog-source href="${escapeHtml(source.url)}"
    data-source-level="${escapeHtml(source.level)}"
    target="_blank" rel="noreferrer noopener"
    aria-label="Open source page on ${escapeHtml(namespace)}">Source ↗</a>`;
}

function cardOpenAttributes(layout: "grid" | "list" | undefined): string {
  return renderStyleXAttributes(
    stylex.attrs(cardStyles.open, layout === "list" && cardStyles.listOpen),
  );
}

function catalogCardSupportingCopy(component: CatalogComponent, kindLabel: string): string {
  return (
    component.description?.trim() ||
    (component.categories.length ? component.categories.slice(0, 3).join(" · ") : kindLabel)
  );
}

function catalogCardThemeSpecimen(component: CatalogComponent, routeKind: string): string {
  return routeKind === "theme" && component.themePreview
    ? renderCatalogThemeSpecimen(component)
    : "";
}

export function renderCatalogComponentCard(
  component: CatalogComponent,
  routeKind: "component" | "block" | "page" | "template" | "theme" | "icon" = "component",
  options: { layout?: "grid" | "list"; context?: "collection" | "discovery" } = {},
): string {
  const homepage = component.registry?.url ?? "";
  const registryHomepage = verifiedRegistryHomepage(homepage);

  const original = sourcePageNavigation(homepage, {
    docsUrl: component.docsUrl,
    sourcePage: component.sourcePage,
  });

  const routePath = catalogCardRoutePath(component, routeKind);

  const kindLabel =
    routeKind === "component" ? component.type.replace(/^registry:/, "") : routeKind;

  const supportingCopy = catalogCardSupportingCopy(component, kindLabel);
  const themeData = catalogCardThemeSpecimen(component, routeKind);

  const sourcePreviewAttribute = renderSourcePreviewAttribute(original);

  return `
    <article${cardLayoutAttributes(options)} data-catalog-card data-card-kind="${routeKind}">
      <a${cardOpenAttributes(options.layout)} data-catalog-open
        href="${escapeHtml(routePath)}"
        ${sourcePreviewAttribute}
        data-view-item-registry="${escapeHtml(component.namespace)}"
        data-view-item-slug="${escapeHtml(component.slug)}"
        data-view-item-kind="${routeKind}"
        aria-label="Open ${escapeHtml(component.displayName)} from ${escapeHtml(component.namespace)}">
        <div${renderStyleXAttributes(stylex.attrs(cardStyles.heading))} data-catalog-heading>
          <div${renderStyleXAttributes(stylex.attrs(cardStyles.library))} data-catalog-library>
            ${renderRegistryIcon(component.registry)}
            <div${renderStyleXAttributes(stylex.attrs(cardStyles.copy))} data-catalog-copy>
              <strong${renderStyleXAttributes(stylex.attrs(cardStyles.name))}>${escapeHtml(component.displayName)}</strong>
              <span${renderStyleXAttributes(stylex.attrs(cardStyles.registry))} data-catalog-registry>${escapeHtml(component.namespace)}</span>
            </div>
          </div>
          <span${renderStyleXAttributes(stylex.attrs(cardStyles.kind))} data-catalog-kind>${escapeHtml(kindLabel)}</span>
        </div>
        <p${renderStyleXAttributes(
          stylex.attrs(
            cardStyles.description,
            options.layout === "list" && cardStyles.listDescription,
          ),
        )} data-catalog-description>${escapeHtml(supportingCopy)}</p>
        ${themeData}
      </a>
      <div${renderStyleXAttributes(stylex.attrs(cardStyles.actions))} data-catalog-actions aria-label="Item actions">
        ${renderCardRegistryHomepage(registryHomepage, component.namespace)}
        ${renderCardSourceLink(original, component.namespace)}
        <button${renderStyleXAttributes(stylex.attrs(cardStyles.copyName))} type="button"
          data-catalog-copy-name data-copy-text="${escapeHtml(component.displayName)}"
          data-copy-label="Component name copied"
          aria-label="Copy ${escapeHtml(component.displayName)} name"
          title="Copy name">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"
            stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="8" y="8" width="13" height="13" rx="2" />
            <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" />
          </svg>
        </button>
      </div>
    </article>
  `;
}

function renderSourcePreviewAttribute(source: { url: string } | null): string {
  return source ? `data-preview-source-url="${escapeHtml(source.url)}"` : "";
}

const THEME_SWATCH_KEYS: readonly RegistryThemeSwatch[] = [
  "background",
  "foreground",
  "primary",
  "secondary",
  "accent",
];

function renderCatalogThemeSpecimen(component: CatalogComponent): string {
  const groups: ReadonlyArray<{
    label: string;
    values: Readonly<Partial<Record<RegistryThemeSwatch, string>>> | undefined;
  }> = [
    { label: "Light", values: component.themePreview?.light },
    { label: "Dark", values: component.themePreview?.dark },
  ];

  const visible = groups.filter(
    (group) => group.values && THEME_SWATCH_KEYS.some((key) => Boolean(group.values?.[key])),
  );

  if (!visible.length) return renderCatalogMetadataSpecimen(component);

  return `
    <div class="catalog-theme-swatches" aria-label="${escapeHtml(component.displayName)} theme swatches">
      ${visible
        .map(
          (group) => `
        <div class="catalog-theme-swatch-group">
          <span>${escapeHtml(group.label)}</span>
          <div class="catalog-theme-swatch-row">
            ${THEME_SWATCH_KEYS.map((name) => {
              const value = group.values?.[name];

              if (!value) return "";
              const color = safeCssColor(value);

              return `<span class="catalog-theme-swatch" title="${escapeHtml(name)}: ${escapeHtml(value)}"${color ? ` style="background-color:${escapeHtml(color)}"` : ""}></span>`;
            }).join("")}
          </div>
        </div>
      `,
        )
        .join("")}
    </div>
  `;
}

function safeCssColor(value: string): string | null {
  const candidate = value.trim();

  if (/^#[0-9a-f]{3,8}$/i.test(candidate)) return candidate;

  if (/^(?:rgb|rgba|hsl|hsla|oklch|oklab|lab|lch)\([0-9a-z.%+\-\s,/]+\)$/i.test(candidate))
    return candidate;

  return null;
}

function renderCatalogMetadataSpecimen(component: CatalogComponent): string {
  const facts = [
    component.author ? `By ${component.author}` : "",
    component.fileCount !== undefined
      ? `${component.fileCount.toLocaleString()} ${component.fileCount === 1 ? "file" : "files"}`
      : "",
    component.type.replace(/^registry:/, ""),
  ].filter(Boolean);

  return `
    <div${renderStyleXAttributes(stylex.attrs(cardStyles.metadata))} data-catalog-metadata>
      <p${renderStyleXAttributes(stylex.attrs(cardStyles.metadataText))}>${escapeHtml(component.description ?? `From ${component.namespace}.`)}</p>
      <div${renderStyleXAttributes(stylex.attrs(cardStyles.metadataFacts))} data-catalog-facts>
        ${facts.map((fact) => `<span>${escapeHtml(fact)}</span>`).join("")}
      </div>
    </div>
  `;
}

function renderResultMeta(result: CatalogQueryResult): string {
  const start = (result.page - 1) * result.pageSize + 1;
  const end = Math.min(result.page * result.pageSize, result.total);

  return `<div class="catalog-result-meta">Showing ${start.toLocaleString()}–${end.toLocaleString()} of ${result.total.toLocaleString()}</div>`;
}

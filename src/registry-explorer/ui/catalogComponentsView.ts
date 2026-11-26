import { controlIcon } from "./primitives/controlIcon";
import { emptyStateClasses } from "./primitives/emptyStateClasses";
import { actionClasses } from "./primitives/actionClasses";
import { catalogPresentationClasses } from "./primitives/catalogPresentationClasses";
import { cn } from "./primitives/cn";
import { renderCatalogGridAttributes } from "./catalogGrid";
import { cardStyles } from "./catalogCard.classes";
import { renderInfiniteScrollControl } from "./infiniteScrollControl";
import type { CatalogComponent, CatalogQueryResult } from "../core/catalogQuery";
import { catalogRoutePath, type CatalogBrowseQueryState } from "../core/catalogRoutes";
import type { CatalogAssetKind } from "../core/catalogCollections";
import { CATALOG_COMPONENT_TYPES } from "../core/catalogComponentTypes";
import { catalogTaxonomyNodeMap, type CatalogTaxonomy } from "../core/catalogTaxonomy";
import type { RegistryThemeSwatch } from "../core/registry.schema";
import { escapeHtml, renderClassAttribute } from "./renderSafety";
import { sourcePageNavigation, verifiedRegistryHomepage } from "./sourcePageLink";
import { renderRegistryIcon } from "./registryIdentity";

interface CatalogDiscoveryBand {
  label: string;
  routePath: string;
  items: readonly CatalogComponent[];
}

export interface CatalogComponentsViewOptions {
  searchTerm: string;
  selectedGroup?: string;
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
    <div class="catalog-page-heading ${catalogPresentationClasses.pageHeading}">
      <div class="catalog-eyebrow ${catalogPresentationClasses.eyebrow}">${options.selectedGroup ? "Explore / Components" : "Explore"}</div>
      <h1>${escapeHtml(options.selectedGroup ?? "Components")}</h1>
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
    ${renderCatalogResultList(result, options, emptyCopy)}
  `;
}

function renderCatalogResultList(
  result: CatalogQueryResult,
  options: CatalogComponentsViewOptions,
  emptyCopy: string,
): string {
  if (!result.items.length)
    return `<div class="empty-state ${emptyStateClasses}"><h2>${emptyCopy}</h2><p>Try a different item name, category, kind, or registry.</p></div>`;

  return `
    ${renderResultMeta(result)}
    <div${renderCatalogGridAttributes({ layout: options.layout, kind: "component" })}>
      ${result.items.map((item) => renderCatalogComponentCard(item, "component", { layout: options.layout, context: "collection" })).join("")}
    </div>
    ${renderInfiniteScrollControl(result.page, result.pageCount)}
  `;
}

function renderDiscoveryBands(bands: readonly CatalogDiscoveryBand[]): string {
  const visible = bands.filter((band) => band.items.length > 0);

  if (!visible.length) return "";

  return `
    <section class="catalog-discovery-bands mb-8 grid gap-8" aria-label="Component discovery collections">
      ${visible
        .map(
          (band) => `
        <section class="catalog-discovery-band grid gap-3">
          <div class="catalog-discovery-band-heading mt-2 flex items-center justify-between gap-3 [&>h2]:m-0">
            <h2>${escapeHtml(band.label)}</h2>
            <button type="button" class="link-button ${actionClasses.link}" data-catalog-route="${escapeHtml(band.routePath)}">View collection</button>
          </div>
          <div class="grid w-full auto-cols-[clamp(285px,calc((100%-36px)/3),355px)] grid-flow-col items-start gap-[18px] overflow-x-auto overflow-y-clip snap-x snap-proximity [scroll-padding-inline:2px] [overscroll-behavior-inline:contain] [scrollbar-width:thin] [scrollbar-color:var(--atlas-input)_transparent] pt-0.5 pb-[15px] max-[720px]:auto-cols-[minmax(255px,82%)]" data-catalog-discovery-row>
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
    ...state.componentTypes.map((value) => ({
      attribute: "data-catalog-component-type",
      value,
      label:
        "Type: " + (CATALOG_COMPONENT_TYPES.find((type) => type.value === value)?.label ?? value),
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

  return `<div class="catalog-results-context sticky top-0 z-5 mb-3 flex min-w-0 flex-wrap items-center gap-2 bg-atlas-background py-[7px]" aria-label="Current catalog scope">
    ${query ? `<span class="catalog-search-context text-xs text-atlas-muted-foreground">Search: “${escapeHtml(query)}”</span>` : ""}
    ${
      activeFilters.length
        ? `<div class="catalog-applied-filters mr-auto flex flex-wrap items-center gap-1.5" role="group" aria-label="Active filters">
      ${activeFilters
        .map(
          (
            entry,
          ) => `<button type="button" class="catalog-applied-filter inline-flex items-center gap-1.5 cursor-pointer rounded-[var(--atlas-radius-badge)] border border-atlas-input bg-atlas-secondary px-[9px] py-[7px] text-xs text-atlas-foreground hover:border-atlas-primary" ${entry.attribute}="${escapeHtml(entry.value)}"
        aria-label="Remove ${escapeHtml(entry.label)} filter">${escapeHtml(entry.label)} ${controlIcon("close")}</button>`,
        )
        .join("")}
    </div>`
        : ""
    }
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

  return `<a${renderClassAttribute(cn(cardStyles.registryHomepage))}
    data-registry-homepage href="${escapeHtml(url)}"
    target="_blank" rel="noreferrer noopener"
    aria-label="Open registry homepage for ${escapeHtml(namespace)}">Registry homepage ${controlIcon("arrow-up-right")}</a>`;
}

function cardLayoutAttributes(options: {
  layout?: "grid" | "list";
  context?: "collection" | "discovery";
}): string {
  return renderClassAttribute(
    cn(
      cardStyles.card,
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

  return `<a${renderClassAttribute(cn(cardStyles.original))} data-catalog-source href="${escapeHtml(source.url)}"
    data-source-level="${escapeHtml(source.level)}"
    target="_blank" rel="noreferrer noopener"
    aria-label="Open source page on ${escapeHtml(namespace)}">Source ${controlIcon("arrow-up-right")}</a>`;
}

function cardOpenAttributes(layout: "grid" | "list" | undefined): string {
  return renderClassAttribute(cn(cardStyles.open, layout === "list" && cardStyles.listOpen));
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

function cardCopyDetails(component: CatalogComponent): {
  value: string;
  action: string;
  feedback: string;
} {
  return component.slug.includes("/")
    ? {
        value: `${component.namespace}/${component.slug}`,
        action: "item path",
        feedback: "Item path copied",
      }
    : { value: component.displayName, action: "name", feedback: "Component name copied" };
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
  const copy = cardCopyDetails(component);

  return `
    <article${cardLayoutAttributes(options)} data-catalog-card data-card-kind="${routeKind}">
      <a${cardOpenAttributes(options.layout)} data-catalog-open
        href="${escapeHtml(routePath)}"
        ${sourcePreviewAttribute}
        data-view-item-registry="${escapeHtml(component.namespace)}"
        data-view-item-slug="${escapeHtml(component.slug)}"
        data-view-item-kind="${routeKind}"
        aria-label="Open ${escapeHtml(component.displayName)} from ${escapeHtml(component.namespace)}">
        <div${renderClassAttribute(cn(cardStyles.heading))} data-catalog-heading>
          <div${renderClassAttribute(cn(cardStyles.library))} data-catalog-library>
            ${renderRegistryIcon(component.registry)}
            <div${renderClassAttribute(cn(cardStyles.copy))} data-catalog-copy>
              <strong${renderClassAttribute(cn(cardStyles.name))}>${escapeHtml(component.displayName)}</strong>
              <span${renderClassAttribute(cn(cardStyles.registry))} data-catalog-registry>${escapeHtml(component.namespace)}</span>
            </div>
          </div>
          <span${renderClassAttribute(cn(cardStyles.kind))} data-catalog-kind>${escapeHtml(kindLabel)}</span>
        </div>
        <p${renderClassAttribute(
          cn(cardStyles.description, options.layout === "list" && cardStyles.listDescription),
        )} data-catalog-description>${escapeHtml(supportingCopy)}</p>
        ${themeData}
      </a>
      <div${renderClassAttribute(cn(cardStyles.actions))} data-catalog-actions aria-label="Item actions">
        ${renderCardRegistryHomepage(registryHomepage, component.namespace)}
        <button${renderClassAttribute(cn(cardStyles.copyName))} type="button"
          data-catalog-copy-name data-copy-text="${escapeHtml(copy.value)}"
          data-copy-label="${copy.feedback}"
          aria-label="Copy ${escapeHtml(component.displayName)} ${copy.action}"
          title="Copy ${copy.action}">
          ${controlIcon("copy")}
        </button>
        ${renderCardSourceLink(original, component.namespace)}
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
    <div class="catalog-theme-swatches grid size-full grid-cols-2 content-stretch bg-atlas-card" aria-label="${escapeHtml(component.displayName)} theme swatches">
      ${visible
        .map(
          (group) => `
        <div class="catalog-theme-swatch-group grid content-end gap-2 p-4 [&>span]:text-xs [&>span]:uppercase [&>span]:text-atlas-muted-foreground">
          <span>${escapeHtml(group.label)}</span>
          <div class="catalog-theme-swatch-row grid min-h-[84px] grid-cols-5 overflow-hidden rounded-[var(--atlas-radius-button)] border border-atlas-input">
            ${THEME_SWATCH_KEYS.map((name) => {
              const value = group.values?.[name];

              if (!value) return "";
              const color = safeCssColor(value);

              return `<span class="catalog-theme-swatch min-w-0 border-r border-black/[0.18] bg-atlas-secondary last:border-r-0" title="${escapeHtml(name)}: ${escapeHtml(value)}"${color ? ` style="background-color:${escapeHtml(color)}"` : ""}></span>`;
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
    <div${renderClassAttribute(cn(cardStyles.metadata))} data-catalog-metadata>
      <p${renderClassAttribute(cn(cardStyles.metadataText))}>${escapeHtml(component.description ?? `From ${component.namespace}.`)}</p>
      <div${renderClassAttribute(cn(cardStyles.metadataFacts))} data-catalog-facts>
        ${facts.map((fact) => `<span>${escapeHtml(fact)}</span>`).join("")}
      </div>
    </div>
  `;
}

function renderResultMeta(result: CatalogQueryResult): string {
  const start = (result.page - 1) * result.pageSize + 1;
  const end = Math.min(result.page * result.pageSize, result.total);

  return `<div class="catalog-result-meta ${catalogPresentationClasses.resultMeta}">Showing ${start.toLocaleString()}–${end.toLocaleString()} of ${result.total.toLocaleString()}</div>`;
}

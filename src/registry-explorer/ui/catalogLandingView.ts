import type { CatalogQueryResult } from "../core/catalogQuery";
import type { ExploreCollectionOption } from "../core/catalogCollections";
import { catalogRoutePath } from "../core/catalogRoutes";
import { renderCatalogComponentCard } from "./catalogComponentsView";
import { escapeHtml } from "./renderSafety";

export interface CatalogLandingOptions {
  itemCount: number;
  registryCount: number;
  indexedRegistryCount: number;
  featured: CatalogQueryResult;
  collections: readonly ExploreCollectionOption[];
  basePath: string;
}

export function renderCatalogLanding(
  headerRoot: HTMLElement,
  bodyRoot: HTMLElement,
  options: CatalogLandingOptions,
): void {
  headerRoot.innerHTML = `
    <div class="atlas-hero">
      <div class="catalog-eyebrow">Registry Atlas</div>
      <h1>The living map of shadcn registries.</h1>
      <p>Browse real upstream components, pages, themes, and registry libraries from one evidence-backed catalog.</p>
    </div>
  `;

  const featuredPath = catalogRoutePath({ kind: "components", lens: "featured" }, options.basePath);
  const registriesPath = catalogRoutePath({ kind: "registries" }, options.basePath);
  const componentsPath = catalogRoutePath({ kind: "components" }, options.basePath);

  bodyRoot.innerHTML = `
    <section class="landing-metrics" aria-label="Catalog totals">
      <div><strong>${options.itemCount.toLocaleString()}</strong><span>indexed assets</span></div>
      <div><strong>${options.indexedRegistryCount.toLocaleString()}</strong><span>indexed catalogs</span></div>
      <div><strong>${options.registryCount.toLocaleString()}</strong><span>registries</span></div>
    </section>
    <nav class="landing-shortcuts" aria-label="Catalog shortcuts">
      <button type="button" data-catalog-route="${escapeHtml(componentsPath)}">Browse components</button>
      <button type="button" data-catalog-route="${escapeHtml(featuredPath)}">Reviewed components</button>
      <button type="button" data-catalog-route="${escapeHtml(registriesPath)}">Explore registries</button>
      ${options.collections.slice(0, 5).map(collection => {
        const path = catalogRoutePath({ kind: "explore", collection: collection.slug }, options.basePath);
        return `<button type="button" data-catalog-route="${escapeHtml(path)}">${escapeHtml(collection.label)}</button>`;
      }).join("")}
    </nav>
    <section class="landing-section">
      <div class="landing-section-heading">
        <div>
          <div class="catalog-eyebrow">Reviewed evidence</div>
          <h2>Components with richer catalog metadata</h2>
        </div>
        <button type="button" class="link-button" data-catalog-route="${escapeHtml(featuredPath)}">View all</button>
      </div>
      ${options.featured.items.length
        ? `<div class="catalog-component-grid landing-grid">${options.featured.items.map(item => renderCatalogComponentCard(item)).join("")}</div>`
        : '<div class="empty-state"><h2>No reviewed components are available yet.</h2><p>The full real catalog remains browseable.</p></div>'}
    </section>
  `;
}

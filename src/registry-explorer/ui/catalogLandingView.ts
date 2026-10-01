import type { CatalogQueryResult } from "../core/catalogQuery";
import { catalogRoutePath } from "../core/catalogRoutes";
import { renderCatalogComponentCard } from "./catalogComponentsView";
import { escapeHtml } from "./renderSafety";

export interface CatalogLandingOptions {
  itemCount: number;
  registryCount: number;
  catalogCount: number;
  featured: CatalogQueryResult;
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
      <h1>Browse shadcn registries.</h1>
      <p>Browse components, templates, themes, and registries in one place.</p>
    </div>
  `;

  const registriesPath = catalogRoutePath({ kind: "registries" }, options.basePath);
  const componentsPath = catalogRoutePath({ kind: "components" }, options.basePath);
  const templatesPath = catalogRoutePath({ kind: "templates" }, options.basePath);
  const themesPath = catalogRoutePath({ kind: "themes" }, options.basePath);

  bodyRoot.innerHTML = `
    <section class="landing-metrics" aria-label="Catalog totals">
      <div><strong>${options.itemCount.toLocaleString()}</strong><span>items</span></div>
      <div><strong>${options.catalogCount.toLocaleString()}</strong><span>catalogs</span></div>
      <div><strong>${options.registryCount.toLocaleString()}</strong><span>registries</span></div>
    </section>
    <nav class="landing-shortcuts" aria-label="Catalog shortcuts">
      <button type="button" data-catalog-route="${escapeHtml(componentsPath)}">Browse components</button>
      <button type="button" data-catalog-route="${escapeHtml(templatesPath)}">Browse templates</button>
      <button type="button" data-catalog-route="${escapeHtml(themesPath)}">Browse themes</button>
      <button type="button" data-catalog-route="${escapeHtml(registriesPath)}">Browse registries</button>
    </nav>
    <section class="landing-section">
      <div class="landing-section-heading">
        <div>
          <div class="catalog-eyebrow">Explore</div>
          <h2>Components</h2>
        </div>
        <button type="button" class="link-button" data-catalog-route="${escapeHtml(componentsPath)}">View all</button>
      </div>
      ${options.featured.items.length
        ? `<div class="catalog-component-grid landing-grid">${options.featured.items.map(item => renderCatalogComponentCard(item)).join("")}</div>`
        : '<div class="empty-state"><h2>No components are available yet.</h2><p>Components will appear here when a registry provides them.</p></div>'}
    </section>
  `;
}

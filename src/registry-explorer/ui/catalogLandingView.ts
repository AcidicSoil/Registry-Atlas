import { emptyStateClasses } from "./primitives/emptyStateClasses";
import { actionClasses } from "./primitives/actionClasses";
import { catalogPresentationClasses } from "./primitives/catalogPresentationClasses";
import { renderCatalogGridAttributes } from "./catalogGrid";
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
    <div class="atlas-hero max-w-[780px] pt-3 pb-1 [&>h1]:max-w-[12ch] [&>h1]:mb-4 [&>h1]:text-[clamp(2.15rem,5vw,4.1rem)] [&>h1]:leading-[0.98] [&>h1]:tracking-[-0.06em] max-[640px]:[&>h1]:text-[clamp(2rem,12vw,3rem)] [&>p]:m-0 [&>p]:max-w-[60ch] [&>p]:text-[15px] [&>p]:text-atlas-muted-foreground">
      <div class="catalog-eyebrow ${catalogPresentationClasses.eyebrow}">Registry Atlas</div>
      <h1>Browse shadcn registries.</h1>
      <p>Browse components, templates, themes, and registries in one place.</p>
    </div>
  `;

  const registriesPath = catalogRoutePath({ kind: "registries" }, options.basePath);
  const componentsPath = catalogRoutePath({ kind: "components" }, options.basePath);
  const templatesPath = catalogRoutePath({ kind: "templates" }, options.basePath);
  const themesPath = catalogRoutePath({ kind: "themes" }, options.basePath);
  const authorsPath = catalogRoutePath({ kind: "authors" }, options.basePath);

  bodyRoot.innerHTML = `
    <section class="landing-metrics mb-4 grid grid-cols-3 gap-px overflow-hidden rounded-[var(--atlas-radius-card)] border border-atlas-border bg-atlas-border max-[640px]:grid-cols-1 [&>div]:bg-atlas-card [&>div]:p-4 [&_strong]:block [&_strong]:mb-0.5 [&_strong]:text-xl [&_span]:block [&_span]:text-[11px] [&_span]:text-atlas-muted-foreground" aria-label="Catalog totals">
      <div><strong>${options.itemCount.toLocaleString()}</strong><span>items</span></div>
      <div><strong>${options.catalogCount.toLocaleString()}</strong><span>catalogs</span></div>
      <div><strong>${options.registryCount.toLocaleString()}</strong><span>registries</span></div>
    </section>
    <nav class="landing-shortcuts mb-6 flex flex-wrap gap-2 [&>button]:cursor-pointer [&>button]:rounded-full [&>button]:border [&>button]:border-atlas-border [&>button]:bg-transparent [&>button]:px-3 [&>button]:py-2 [&>button]:text-atlas-muted-foreground [&>button:hover]:border-atlas-input [&>button:hover]:text-atlas-foreground" aria-label="Catalog shortcuts">
      <button type="button" data-catalog-route="${escapeHtml(componentsPath)}">Browse components</button>
      <button type="button" data-catalog-route="${escapeHtml(templatesPath)}">Browse templates</button>
      <button type="button" data-catalog-route="${escapeHtml(themesPath)}">Browse themes</button>
      <button type="button" data-catalog-route="${escapeHtml(registriesPath)}">Browse registries</button>
      <button type="button" data-catalog-route="${escapeHtml(authorsPath)}">Browse authors</button>
    </nav>
    <section class="landing-section grid gap-4 border-t border-atlas-border pt-5">
      <div class="landing-section-heading flex items-end justify-between gap-4 max-[640px]:flex-col max-[640px]:items-start">
        <div>
          <div class="catalog-eyebrow ${catalogPresentationClasses.eyebrow}">Explore</div>
          <h2>Components</h2>
        </div>
        <button type="button" class="link-button ${actionClasses.link}" data-catalog-route="${escapeHtml(componentsPath)}">View all</button>
      </div>
      ${
        options.featured.items.length
          ? `<div${renderCatalogGridAttributes()}>${options.featured.items.map((item) => renderCatalogComponentCard(item)).join("")}</div>`
          : `<div class="empty-state ${emptyStateClasses}"><h2>No components are available yet.</h2><p>Components will appear here when a registry provides them.</p></div>`
      }
    </section>
  `;
}

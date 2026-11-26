import { detailClasses } from "./primitives/detailClasses";
import { emptyStateClasses } from "./primitives/emptyStateClasses";
import { actionClasses } from "./primitives/actionClasses";
import { installCommandClasses } from "./primitives/installCommandClasses";
import { cn } from "./primitives/cn";
import { relatedStyles } from "./relatedItems.classes";
import type { RegistryItemDetailResult, RegistryItemDetail } from "../core/registryItemDetail.ts";
import type { InstallActionState, RegistryItemSummaryFile } from "../core/registry.schema.ts";
import type { CatalogComponent } from "../core/catalogQuery.ts";
import { assetKindForCatalogItem } from "../core/catalogCollections.ts";
import type { CatalogPolicy } from "../core/catalogPolicy";
import { catalogRoutePath } from "../core/catalogRoutes.ts";
import { escapeHtml, renderClassAttribute } from "./renderSafety.ts";
import { sourcePageNavigation, verifiedRegistryHomepage } from "./sourcePageLink.ts";
import { renderRegistryIcon } from "./registryIdentity.ts";

export function renderItemDetailView(
  headerRoot: HTMLElement,
  bodyRoot: HTMLElement,
  result: RegistryItemDetailResult,
  queuedTokens: ReadonlySet<string>,
  policy: CatalogPolicy,
  relatedItems: readonly CatalogComponent[] = [],
): void {
  const detail = result.detail;
  headerRoot.innerHTML = renderHeader(detail);
  bodyRoot.innerHTML = detail
    ? renderDetailBody(detail, result, queuedTokens, policy, relatedItems)
    : renderMissingBody(result);
}

function renderHeader(detail: RegistryItemDetail | null): string {
  if (!detail) {
    return `
      <div>
        <button class="link-button ${actionClasses.link}" type="button" data-back-from-item>← Back to results</button>
        <h1>Item details unavailable</h1>
        <p>Registry Atlas could not find this item in the selected registry.</p>
      </div>
    `;
  }

  const libraryUrl = catalogRoutePath(
    { kind: "registry", namespace: detail.namespace },
    "/Registry-Atlas/",
  );

  const registryHomepage = verifiedRegistryHomepage(detail.registry.url);

  const source = sourcePageNavigation(detail.registry.url, {
    docsUrl: detail.componentPageUrl,
    sourcePage: detail.sourcePage,
  });

  return `
    <div class="item-detail-header mx-auto grid w-[min(100%,800px)] min-w-0 gap-3">
      <nav class="item-quick-links flex w-full flex-wrap items-center justify-center gap-x-[18px] gap-y-2 [&>a]:text-xs [&>a]:underline-offset-[3px]" aria-label="Component links">
        <a href="${escapeHtml(libraryUrl)}" data-profile-registry="${escapeHtml(detail.namespace)}">Browse library</a>
        ${registryHomepage ? `<a href="${escapeHtml(registryHomepage)}" target="_blank" rel="noreferrer noopener">Registry homepage ↗</a>` : ""}
        ${
          source
            ? `<a href="${escapeHtml(source.url)}" data-preview-source-url="${escapeHtml(source.url)}" data-source-level="${escapeHtml(source.level)}"
          target="_blank" rel="noreferrer noopener">${escapeHtml(source.level === "reviewed" ? "Original component" : source.label)} ↗</a>`
            : ""
        }
      </nav>
      <button class="link-button ${actionClasses.link}" type="button" data-back-from-item>← Back to results</button>
      <div class="item-detail-title-row">
        ${renderRegistryIcon(detail.registry, "detail")}
        <div>
          <h1>${escapeHtml(detail.title)}</h1>
          <p class="item-origin-line flex flex-wrap items-baseline gap-[5px] [&>a]:underline [&>a]:decoration-transparent [&>a]:underline-offset-[3px] [&>a:hover]:decoration-current [&>a:focus-visible]:decoration-current">
            ${
              registryHomepage
                ? `<a href="${escapeHtml(registryHomepage)}" target="_blank" rel="noreferrer noopener"
                 aria-label="Visit upstream registry homepage for ${escapeHtml(detail.namespace)}">${escapeHtml(detail.namespace)} ↗</a>`
                : `<span title="Official registry homepage unavailable">${escapeHtml(detail.namespace)}</span>`
            }
            <span aria-hidden="true">·</span>
            ${
              source
                ? `<a href="${escapeHtml(source.url)}" data-preview-source-url="${escapeHtml(source.url)}" data-source-level="${escapeHtml(source.level)}"
                target="_blank" rel="noreferrer noopener"
                aria-label="Open upstream component page for ${escapeHtml(detail.slug)}">${escapeHtml(detail.slug)} ↗</a>`
                : `<span title="Upstream component page unavailable">${escapeHtml(detail.slug)}</span>`
            }
          </p>
          ${detail.description ? `<p class="item-title-description mt-2 mb-0 max-w-[70ch] text-atlas-muted-foreground leading-[1.6]">${escapeHtml(detail.description)}</p>` : ""}
        </div>
      </div>
    </div>
  `;
}

function renderDetailBody(
  detail: RegistryItemDetail,
  result: RegistryItemDetailResult,
  queuedTokens: ReadonlySet<string>,
  policy: CatalogPolicy,
  relatedItems: readonly CatalogComponent[],
): string {
  const fallback =
    result.status === "loaded" || result.status === "summary-only" ? "" : renderFallback(result);

  return `
    <article class="item-detail-page mx-auto grid w-[min(100%,800px)] gap-6">
      <section class="item-detail-hero flex flex-col-reverse items-stretch gap-5">
        <div class="item-detail-summary w-full max-w-full [&>p]:max-w-[70ch] grid min-w-0 content-start gap-4 [&>p]:mb-0 [&>p]:text-[15px] [&>p]:text-atlas-muted-foreground">
          ${renderInstallActions(detail.installAction, detail, queuedTokens)}
          ${fallback}
        </div>
      </section>
      ${renderRelatedComponentLinks(relatedItems, detail.namespace, detail.slug, policy)}
      <details class="item-technical-disclosure border-t border-atlas-border pt-3 [&>summary]:cursor-pointer [&>summary]:text-xs [&>summary]:text-atlas-muted-foreground [&>summary:hover]:text-atlas-foreground">
        <summary>Technical details and provenance</summary>
        <div class="item-technical-content grid grid-cols-2 gap-4 pt-3 max-[640px]:grid-cols-1">
          ${renderListCard("Dependencies", detail.dependencies)}
          ${renderListCard("Dev dependencies", detail.devDependencies)}
          ${renderListCard("Registry dependencies", detail.registryDependencies)}
          ${renderFilesCard(detail.files)}
          ${renderSourceCard(detail)}
        </div>
      </details>
    </article>
  `;
}

export function renderRelatedComponentLinks(
  items: readonly CatalogComponent[],
  namespace: string,
  currentSlug: string,
  policy: CatalogPolicy,
): string {
  const related = items
    .filter((item) => item.namespace === namespace && item.slug !== currentSlug)
    .slice(0, 8);

  if (!related.length) return "";

  return `<section${renderClassAttribute(cn(relatedStyles.section))} data-related-section aria-label="More from the same registry">
    <div${renderClassAttribute(cn(relatedStyles.heading))}>
      <h2${renderClassAttribute(cn(relatedStyles.title))}>More from <a class="item-library-link text-inherit underline-offset-[3px]" href="${escapeHtml(catalogRoutePath({ kind: "registry", namespace }, "/Registry-Atlas/"))}"
        data-profile-registry="${escapeHtml(namespace)}">${escapeHtml(namespace)}</a></h2>
      <span${renderClassAttribute(cn(relatedStyles.count))}>${related.length} items</span>
    </div>
    <div${renderClassAttribute(cn(relatedStyles.list))}>
      ${related
        .map((item) => {
          const routeKind = routeKindForItem(item, policy);
          const basePath = item.routePath.slice(0, item.routePath.indexOf(item.namespace));

          const routePath =
            routeKind === "component"
              ? item.routePath
              : catalogRoutePath(
                  { kind: routeKind, namespace: item.namespace, slug: item.slug },
                  basePath,
                );

          const original = sourcePageNavigation(item.registry.url, {
            docsUrl: item.docsUrl,
            sourcePage: item.sourcePage,
          });

          return `<div${renderClassAttribute(cn(relatedStyles.entry))} data-related-entry>
          <a${renderClassAttribute(cn(relatedStyles.link))} href="${escapeHtml(routePath)}"
            ${original ? `data-preview-source-url="${escapeHtml(original.url)}"` : ""}
            data-view-item-registry="${escapeHtml(item.namespace)}"
            data-view-item-slug="${escapeHtml(item.slug)}"
            data-view-item-kind="${routeKind}"
            aria-label="View ${escapeHtml(item.displayName)} from ${escapeHtml(namespace)}">
            ${renderRegistryIcon(item.registry, "related")}
            <span${renderClassAttribute(cn(relatedStyles.titleText))} data-related-title>${escapeHtml(item.displayName)}</span>
            <span${renderClassAttribute(cn(relatedStyles.arrow))} aria-hidden="true">↗</span>
          </a>
          <div data-related-source-actions>
            ${
              original
                ? `<a${renderClassAttribute(cn(relatedStyles.original))} data-related-source href="${escapeHtml(original.url)}"
              data-source-level="${escapeHtml(original.level)}"
              target="_blank" rel="noreferrer noopener">${escapeHtml(original.label)} ↗</a>`
                : ""
            }
          </div>
        </div>`;
        })
        .join("")}
    </div>
  </section>`;
}

function routeKindForItem(
  item: CatalogComponent,
  policy: CatalogPolicy,
): "component" | "block" | "page" | "template" | "theme" {
  const kind = assetKindForCatalogItem(item.item, policy, item.namespace);

  if (kind === "block") return "block";

  if (kind === "page") return "page";

  if (kind === "template") return "template";

  if (kind === "theme") return "theme";

  return "component";
}

function renderMissingBody(result: RegistryItemDetailResult): string {
  return `
    <div class="empty-state ${emptyStateClasses}">
      <div class="empty-state-icon text-2xl text-atlas-primary">⌕</div>
      <h2>Item details unavailable</h2>
      <p>${escapeHtml(result.message ?? "Registry Atlas could not load this item.")}</p>
    </div>
  `;
}

function renderInstallActions(
  action: InstallActionState,
  detail: RegistryItemDetail,
  queuedTokens: ReadonlySet<string>,
): string {
  if (action.status === "disabled") {
    return `<div class="setup-detail-unavailable [&>p]:m-0 [&>p]:mb-2">
      <p>Setup unavailable for this item.</p>
      <p class="muted text-atlas-muted-foreground">${escapeHtml(action.disabledReason)}</p>
    </div>`;
  }

  const queued = queuedTokens.has(action.token);

  const addButton = queued
    ? `<button class="install-button ${actionClasses.install}" type="button"
        data-queue-remove="${escapeHtml(action.token)}">Remove from setup</button>`
    : `<button class="install-button install-button-primary ${actionClasses.primary}" type="button"
        data-queue-add="${escapeHtml(action.token)}"
        data-queue-label="${escapeHtml(detail.title)}"
        data-queue-registry="${escapeHtml(detail.namespace)}"
        data-queue-item="${escapeHtml(detail.slug)}"
        data-queue-install="${escapeHtml(action.installCommand)}"
        data-queue-inspect="${escapeHtml(action.inspectCommand)}"
        data-queue-route="${escapeHtml(action.route)}">+ Add to setup</button>`;

  return `<div class="setup-detail-controls grid w-[min(100%,700px)] gap-4">
    <div class="setup-detail-main-actions flex flex-wrap items-center gap-2 [&>.install-button]:inline-flex [&>.install-button]:min-h-9 [&>.install-button]:items-center [&>.install-button]:justify-center [&>.install-button]:no-underline">
      ${addButton}
      <a class="install-button setup-detail-cart-link border border-atlas-border rounded-[var(--atlas-radius-button)] ${actionClasses.install}" href="/Registry-Atlas/setup"
        data-catalog-route="/Registry-Atlas/setup">View setup</a>
    </div>
    <div class="setup-manual-command grid min-w-0 gap-2 rounded-[var(--atlas-radius-card)] border border-atlas-border bg-atlas-secondary/20 p-3.5">
      <div class="setup-command-title text-xs font-semibold text-atlas-muted-foreground">Install directly</div>
      <div class="setup-command-line ${installCommandClasses.row}">
        <code class="${installCommandClasses.code}">${escapeHtml(action.installCommand)}</code>
        <button class="install-button ${actionClasses.install}" type="button"
          data-copy-text="${escapeHtml(action.installCommand)}"
          data-copy-label="Install command copied">Copy</button>
      </div>
      <details class="setup-command-more text-xs text-atlas-muted-foreground [&>summary]:w-max [&>summary]:cursor-pointer [&>p]:mt-2 [&>p]:mb-0 [&_code]:text-atlas-foreground">
        <summary>View component details</summary>
        <p>Registry token: <code>${escapeHtml(action.token)}</code></p>
        <p>View command: <code>${escapeHtml(action.inspectCommand)}</code></p>
      </details>
    </div>
  </div>`;
}

function renderListCard(title: string, items: readonly string[]): string {
  if (!items.length) return "";

  return `
    <section class="item-detail-card shadow-none ${detailClasses.card}">
      <h2>${escapeHtml(title)}</h2>
      <div class="item-dependency-list grid gap-2 [&_code]:min-w-0 [&_code]:rounded-sm [&_code]:bg-atlas-secondary [&_code]:px-2 [&_code]:py-1 [&_code]:font-atlas-mono [&_code]:text-[11px] [&_code]:text-atlas-primary [&_code]:[overflow-wrap:anywhere]">
        ${items.map((item) => `<code class="${detailClasses.code}">${escapeHtml(item)}</code>`).join("")}
      </div>
    </section>
  `;
}

function renderFilesCard(files: readonly RegistryItemSummaryFile[]): string {
  if (!files.length) return "";

  return `
    <section class="item-detail-card shadow-none ${detailClasses.card}">
      <h2>Files</h2>
      <div class="item-file-list grid gap-2 [&_code]:min-w-0 [&_code]:rounded-sm [&_code]:bg-atlas-secondary [&_code]:px-2 [&_code]:py-1 [&_code]:font-atlas-mono [&_code]:text-[11px] [&_code]:text-atlas-primary [&_code]:[overflow-wrap:anywhere] [&>div]:grid [&>div]:gap-1 [&_span]:text-xs [&_span]:text-atlas-muted-foreground">${files
        .map(
          (file) => `
        <div>
          <code class="${detailClasses.code}">${escapeHtml(file.path)}</code>
          <span>${escapeHtml(file.type)}${file.target ? ` → ${escapeHtml(file.target)}` : ""}</span>
        </div>
      `,
        )
        .join("")}</div>
    </section>
  `;
}

function renderSourceCard(detail: RegistryItemDetail): string {
  return `
    <section class="item-technical-group min-w-0 [&>h3]:m-0 [&>h3]:mb-2 [&>h3]:text-[13px]">
      <h3>Provenance</h3>
      <dl class="profile-facts ${detailClasses.facts}">
        <div class="profile-fact ${detailClasses.fact}"><dt>Source</dt><dd>${escapeHtml(detail.source)}</dd></div>
        <div class="profile-fact ${detailClasses.fact}"><dt>Imported from</dt><dd>${escapeHtml(detail.provenance)}</dd></div>
        ${
          detail.warnings.length
            ? `<div class="profile-fact ${detailClasses.fact}"><dt>Warnings</dt><dd>${escapeHtml(detail.warnings.join(", "))}</dd></div>`
            : ""
        }
      </dl>
    </section>
  `;
}

function renderFallback(result: RegistryItemDetailResult): string {
  if (result.status === "fetch-error") {
    return '<div class="partial-data-note mb-4 rounded-[var(--atlas-radius-button)] border border-dashed border-atlas-border p-3 text-xs text-atlas-muted-foreground">Full item details could not be loaded. Showing the saved summary.</div>';
  }

  if (result.status === "invalid-json" || result.status === "invalid-schema") {
    return '<div class="partial-data-note mb-4 rounded-[var(--atlas-radius-button)] border border-dashed border-atlas-border p-3 text-xs text-atlas-muted-foreground">Atlas could not read this registry item safely. Showing the saved summary.</div>';
  }

  return `<div class="partial-data-note mb-4 rounded-[var(--atlas-radius-button)] border border-dashed border-atlas-border p-3 text-xs text-atlas-muted-foreground">${escapeHtml(result.message ?? "Item details unavailable.")}</div>`;
}

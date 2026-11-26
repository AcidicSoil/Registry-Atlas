import { emptyStateClasses } from "./primitives/emptyStateClasses";
import { catalogPresentationClasses } from "./primitives/catalogPresentationClasses";
import { renderInfiniteScrollControl } from "./infiniteScrollControl";
import type { CatalogCompareResult } from "../core/catalogCompare";
import { escapeHtml } from "./renderSafety";
import { sourcePageNavigation } from "./sourcePageLink";

const REGISTRY_PICKER_LIMIT = 10;

export function renderCatalogCompare(
  headerRoot: HTMLElement,
  bodyRoot: HTMLElement,
  result: CatalogCompareResult,
  availableRegistryNames: readonly string[],
  registrySearch = "",
): void {
  headerRoot.innerHTML = `
    <div class="catalog-page-heading ${catalogPresentationClasses.pageHeading}">
      <div class="catalog-eyebrow ${catalogPresentationClasses.eyebrow}">Registry Atlas</div>
      <h1>Compare</h1>
      <p>Compare component availability across registries.</p>
    </div>
  `;

  bodyRoot.innerHTML = `
    ${renderRegistryPicker(result.selectedRegistryNames, availableRegistryNames, registrySearch)}
    ${
      result.selectedRegistryNames.length >= 2
        ? `${renderSummary(result)}${renderTable(result)}${renderInfiniteScrollControl(result.page, result.pageCount)}`
        : renderEmpty(result.selectedRegistryNames.length)
    }
  `;
}

function renderRegistryPicker(
  selectedNames: readonly string[],
  availableRegistryNames: readonly string[],
  search: string,
): string {
  const selected = new Set(selectedNames);
  const query = search.trim().toLocaleLowerCase();

  const candidates = availableRegistryNames
    .filter((name) => !selected.has(name) && (!query || name.toLocaleLowerCase().includes(query)))
    .slice(0, REGISTRY_PICKER_LIMIT);

  const full = selected.size >= 4;

  return `
    <section class="catalog-compare-picker mb-4 grid gap-3 rounded-[var(--atlas-radius-card)] border border-atlas-border bg-atlas-card p-4" aria-label="Compare registries">
      <div class="section-heading-row ${catalogPresentationClasses.sectionHeading}">
        <div>
          <h2>Registries</h2>
          <p>${selected.size} of 4 selected. Choose at least 2.</p>
        </div>
      </div>
      ${
        selectedNames.length
          ? `
        <div class="compare-selected-list flex min-w-0 flex-wrap gap-2" aria-label="Selected registries">
          ${selectedNames
            .map(
              (name) => `
            <button class="compare-selected-chip max-w-full cursor-pointer rounded-[var(--atlas-radius-button)] border border-atlas-input bg-atlas-secondary px-2 py-1 text-xs text-atlas-foreground [overflow-wrap:anywhere]" type="button" data-compare-registry="${escapeHtml(name)}" aria-pressed="true" aria-label="Remove ${escapeHtml(name)} from comparison">
              ${escapeHtml(name)} <span aria-hidden="true">×</span>
            </button>
          `,
            )
            .join("")}
        </div>
      `
          : ""
      }
      <label class="compare-search-label grid gap-1 text-[11px] text-atlas-muted-foreground [&>input]:min-h-9 [&>input]:min-w-0 [&>input]:w-full [&>input]:rounded-[var(--atlas-radius-button)] [&>input]:border [&>input]:border-atlas-input [&>input]:bg-atlas-background [&>input]:px-3 [&>input]:py-2 [&>input]:text-atlas-foreground">
        <span>Find a registry</span>
        <input type="search" data-compare-search="registry" value="${escapeHtml(search)}" placeholder="Search registry names">
      </label>
      <div class="compare-picker-results grid max-h-[216px] grid-cols-2 gap-1 overflow-y-auto max-[640px]:grid-cols-1" aria-label="Registry search results">
        ${
          candidates.length
            ? candidates
                .map(
                  (name) => `
              <button class="compare-picker-result flex min-w-0 cursor-pointer items-center justify-between gap-2 rounded-[var(--atlas-radius-button)] border border-transparent bg-transparent px-3 py-2 text-left text-atlas-foreground enabled:hover:border-atlas-input enabled:hover:bg-atlas-secondary disabled:cursor-not-allowed disabled:opacity-55 disabled:text-atlas-muted-foreground" type="button" data-compare-registry="${escapeHtml(name)}" aria-pressed="false" ${full ? "disabled" : ""}>
                <span>${escapeHtml(name)}</span><span aria-hidden="true">+</span>
              </button>
            `,
                )
                .join("")
            : `<span class="muted text-atlas-muted-foreground">${full ? "Remove a registry to choose another." : "No registries match this search."}</span>`
        }
      </div>
    </section>
  `;
}

function renderSummary(result: CatalogCompareResult): string {
  const shared =
    result.intersectionCount === 1
      ? "1 shared component"
      : `${result.intersectionCount.toLocaleString()} shared components`;

  return `
    <div class="catalog-compare-summary mb-3 flex min-w-0 flex-wrap items-center gap-2 border-b border-atlas-border py-3 text-[11px] text-atlas-muted-foreground [&>strong]:text-atlas-foreground">
      <strong>${escapeHtml(shared)}</strong>
      <span>${result.unionCount.toLocaleString()} unique components</span>
      <span>${result.total.toLocaleString()} rows matching the current search</span>
    </div>
  `;
}

function renderTable(result: CatalogCompareResult): string {
  if (result.rows.length === 0) {
    return `<div class="empty-state ${emptyStateClasses}"><h2>No components match this comparison search.</h2></div>`;
  }

  const headers = result.selectedRegistryNames
    .map((name) => `<th scope="col">${escapeHtml(name)}</th>`)
    .join("");

  const rows = result.rows
    .map(
      (row) => `
    <tr>
      <th scope="row"><code>${escapeHtml(row.slug)}</code></th>
      ${row.cells
        .map((cell) => {
          if (!cell.present)
            return '<td><span class="muted text-atlas-muted-foreground">Not listed</span></td>';

          const original = sourcePageNavigation(cell.registryHomepage ?? "", {
            docsUrl: cell.docsUrl,
            sourcePage: cell.sourcePage,
          });

          return `<td>${
            cell.routePath
              ? `<a class="compare-presence-link inline-block cursor-pointer rounded-[var(--atlas-radius-button)] border border-atlas-border bg-transparent px-3 py-2 text-[11px] text-atlas-primary no-underline" href="${escapeHtml(cell.routePath)}"
          data-view-item-registry="${escapeHtml(cell.namespace)}" data-view-item-slug="${escapeHtml(row.slug)}"
          data-view-item-kind="${escapeHtml(cell.routeKind ?? "component")}">Present</a>`
              : "<span>Present</span>"
          }
          ${
            original
              ? `<a class="compare-source-link inline-block mt-1.5 ml-2 text-[11px] text-atlas-muted-foreground focus-visible:outline-2 focus-visible:outline-atlas-focus focus-visible:outline-offset-2" href="${escapeHtml(original.url)}"
            data-source-level="${escapeHtml(original.level)}"
            target="_blank" rel="noreferrer noopener">${escapeHtml(original.label)} ↗</a>`
              : ""
          }
          </td>`;
        })
        .join("")}
    </tr>
  `,
    )
    .join("");

  return `
    <div class="compare-table-scroll w-full max-w-full overflow-auto rounded-[var(--atlas-radius-card)] border border-atlas-border bg-atlas-card" tabindex="0" role="region" aria-label="Component comparison">
      <table class="compare-table catalog-compare-table [&_code]:font-atlas-mono [&_code]:text-[11px] [&_code]:text-atlas-foreground w-full table-fixed border-separate border-spacing-0 text-xs max-[860px]:min-w-[720px] [&_th]:border-r [&_th]:border-b [&_th]:border-atlas-border [&_th]:p-3 [&_th]:align-middle [&_td]:border-r [&_td]:border-b [&_td]:border-atlas-border [&_td]:p-3 [&_td]:align-middle [&_tr>*:last-child]:border-r-0 [&_tbody_tr:last-child>*]:border-b-0 [&_thead_th]:sticky [&_thead_th]:top-0 [&_thead_th]:z-2 [&_thead_th]:bg-atlas-secondary [&_thead_th]:text-center [&_thead_th]:font-[650] [&_thead_th]:text-atlas-foreground">
        <thead><tr><th scope="col">Component</th>${headers}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function renderEmpty(selectedCount: number): string {
  return `
    <div class="compare-empty-state grid gap-1 rounded-[var(--atlas-radius-card)] border border-dashed border-atlas-border px-4 py-6 text-center text-atlas-muted-foreground [&>strong]:text-atlas-foreground">
      <strong>Choose 2–4 registries to compare.</strong>
      <span>${selectedCount === 0 ? "Start by searching for a registry above." : "Choose one more registry to compare components."}</span>
    </div>
  `;
}

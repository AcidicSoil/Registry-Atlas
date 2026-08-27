import { componentLabel } from '../core/labels.ts';
import type { CompareModel, CompareSelection } from '../core/compare.ts';
import { escapeHtml } from './renderSafety.ts';

export function renderCompareContent(
  headerRoot: HTMLElement,
  bodyRoot: HTMLElement,
  model: CompareModel,
  selection: CompareSelection,
  searchTerms: Readonly<Record<string, string>> = {},
): void {
  headerRoot.innerHTML = `
    <div>
      <h1>Compare</h1>
      <p>Compare registry coverage using the current verification-aware catalog data.</p>
      <button class="link-button" type="button" data-copy-current-url data-copy-label="Comparison link copied">Copy comparison link</button>
    </div>
  `;

  bodyRoot.innerHTML = `
    <section class="compare-controls" aria-label="Compare registries">
      <div class="compare-heading">
        <h2>Compare registries</h2>
        <p>Choose registries and component capabilities. Verification remains visible in every cell.</p>
      </div>
      ${renderRegistryControls(model, selection, searchTerms.registry)}
      ${renderComponentControls(model, selection, searchTerms.component)}
    </section>
    ${renderComparisonTable(model)}
  `;
}
function renderRegistryControls(model: CompareModel, selection: CompareSelection, search = ''): string {
  const selectedNames = new Set(
    selection.registryNames.filter(name => model.availableRegistryNames.includes(name)),
  );
  const query = search.trim().toLocaleLowerCase();
  const selectedOptions = model.availableRegistryNames.filter(name => selectedNames.has(name));
  const matchingOptions = model.availableRegistryNames.filter(name =>
    !selectedNames.has(name) && name.toLocaleLowerCase().includes(query),
  );
  const names = [
    ...selectedOptions,
    ...matchingOptions.slice(0, Math.max(0, 24 - selectedOptions.length)),
  ];

  const registrySummary = selection.registryNames.length === 0
    ? `All matching registries (${model.rows.length})`
    : selectedNames.size === 0
      ? 'No selected registries match'
      : `${selectedNames.size} selected${model.rows.length === selectedNames.size ? '' : ` (${model.rows.length} matching)`}`;

  return `
    <div class="compare-control-group">
      <span class="compare-control-label">Registries</span>
      <p>${registrySummary}</p>
      ${model.availableRegistryNames.length > 8 ? `<label>Search registries<input type="search" data-compare-search="registry" value="${escapeHtml(search)}"></label>` : ''}
      <div class="compare-option-list">
        ${names.map(name => `
          <button class="compare-option" type="button"
            data-compare-registry="${escapeHtml(name)}"
            aria-pressed="${selectedNames.has(name)}">
            ${escapeHtml(name)}
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

function renderComponentControls(model: CompareModel, selection: CompareSelection, search = ''): string {
  const selectedKeys = new Set(
    selection.componentKeys.filter(key => model.availableComponentKeys.includes(key)),
  );
  const query = search.trim().toLocaleLowerCase();
  const selectedOptions = model.availableComponentKeys.filter(key => selectedKeys.has(key));
  const matchingOptions = model.availableComponentKeys.filter(key =>
    !selectedKeys.has(key) && componentLabel(key).toLocaleLowerCase().includes(query),
  );
  const keys = [
    ...selectedOptions,
    ...matchingOptions.slice(0, Math.max(0, 24 - selectedOptions.length)),
  ];

  const componentSummary = selectedKeys.size > 0
    ? `${model.columns.length} capabilities selected`
    : `Default capabilities (${model.columns.length})`;

  return `
    <div class="compare-control-group">
      <span class="compare-control-label">Components</span>
      <p>${componentSummary}</p>
      ${model.availableComponentKeys.length > 8 ? `<label>Search components<input type="search" data-compare-search="component" value="${escapeHtml(search)}"></label>` : ''}
      <div class="compare-option-list">
        ${keys.map(key => `
          <button class="compare-option" type="button"
            data-compare-component="${escapeHtml(key)}"
            aria-pressed="${selectedKeys.has(key)}">
            ${escapeHtml(componentLabel(key))}
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

function renderComparisonTable(model: CompareModel): string {
  if (model.rows.length === 0) {
    return '<div class="empty-state"><h2>No registries match the current comparison selection.</h2></div>';
  }

  const headers = model.columns
    .map(column => `<th scope="col">${escapeHtml(componentLabel(column))}</th>`)
    .join('');
  const rows = model.rows.map(row => `
    <tr>
      <th scope="row">${escapeHtml(row.registry.name)}</th>
      ${row.cells.map(cell => `
        <td class="compare-cell compare-cell-${escapeHtml(cell.status)}">
          <span class="compare-match">${cell.matched ? 'Yes' : '—'}</span>
          <span class="compare-verification">${escapeHtml(cell.label)}</span>
        </td>
      `).join('')}
    </tr>
  `).join('');

  return `
    <div class="compare-table-scroll" tabindex="0" role="region" aria-label="Comparison results">
      <table class="compare-table">
        <thead><tr><th scope="col">Registry · Verification</th>${headers}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

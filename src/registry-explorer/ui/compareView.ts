import { componentLabel } from '../core/labels.ts';
import type { CompareModel, CompareSelection } from '../core/compare.ts';
import { escapeHtml } from './renderSafety.ts';

export function renderCompareContent(
  headerRoot: HTMLElement,
  bodyRoot: HTMLElement,
  model: CompareModel,
  selection: CompareSelection,
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
      ${renderRegistryControls(model, selection)}
      ${renderComponentControls(model, selection)}
    </section>
    ${renderComparisonTable(model)}
  `;
}
function renderRegistryControls(model: CompareModel, selection: CompareSelection): string {
  return `
    <div class="compare-control-group">
      <span class="compare-control-label">Registries</span>
      <div class="compare-option-list">
        ${model.availableRegistryNames.map(name => `
          <button class="compare-option" type="button"
            data-compare-registry="${escapeHtml(name)}"
            aria-pressed="${selection.registryNames.includes(name)}">
            ${escapeHtml(name)}
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

function renderComponentControls(model: CompareModel, selection: CompareSelection): string {
  return `
    <div class="compare-control-group">
      <span class="compare-control-label">Components</span>
      <div class="compare-option-list">
        ${model.availableComponentKeys.map(key => `
          <button class="compare-option" type="button"
            data-compare-component="${escapeHtml(key)}"
            aria-pressed="${selection.componentKeys.includes(key)}">
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
    <div class="compare-table-scroll">
      <table class="compare-table">
        <thead><tr><th scope="col">Registry · Verification</th>${headers}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

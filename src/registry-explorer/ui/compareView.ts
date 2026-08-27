import { componentLabel } from '../core/labels.ts';
import type { CompareModel, CompareSelection } from '../core/compare.ts';
import type { MatrixCell } from '../core/registry.schema.ts';
import { escapeHtml } from './renderSafety.ts';

const MAX_COMPARE_REGISTRIES = 4;
const PICKER_RESULT_LIMIT = 8;

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
      <p>Select 2–4 registries, then compare their known component coverage side by side.</p>
      <button class="link-button" type="button" data-copy-current-url data-copy-label="Comparison link copied">Copy comparison link</button>
    </div>
  `;

  const selectedNames = selection.registryNames.filter(name => model.availableRegistryNames.includes(name)).slice(0, MAX_COMPARE_REGISTRIES);
  bodyRoot.innerHTML = `
    <section class="compare-controls" aria-label="Compare registries">
      ${renderRegistryPicker(model, selectedNames, searchTerms.registry)}
      ${renderCapabilityFilter(model, selection, searchTerms.component)}
    </section>
    ${selectedNames.length >= 2
      ? renderComparisonTable(model)
      : renderCompareEmptyState(selectedNames.length)}
  `;
}

function renderRegistryPicker(model: CompareModel, selectedNames: readonly string[], search = ''): string {
  const selected = new Set(selectedNames);
  const query = search.trim().toLocaleLowerCase();
  const candidates = model.availableRegistryNames
    .filter(name => !selected.has(name) && (!query || name.toLocaleLowerCase().includes(query)))
    .slice(0, PICKER_RESULT_LIMIT);
  const full = selected.size >= MAX_COMPARE_REGISTRIES;

  return `
    <div class="compare-registry-picker">
      <div class="compare-picker-heading">
        <div>
          <strong>Registries</strong>
          <span>${selected.size} of ${MAX_COMPARE_REGISTRIES} selected</span>
        </div>
        <span class="muted">Choose at least 2.</span>
      </div>
      ${selected.size ? `
        <div class="compare-selected-list" aria-label="Selected registries">
          ${selectedNames.map(name => `
            <button class="compare-selected-chip" type="button" data-compare-registry="${escapeHtml(name)}" aria-pressed="true" aria-label="Remove ${escapeHtml(name)} from comparison">
              ${escapeHtml(name)} <span aria-hidden="true">×</span>
            </button>
          `).join('')}
        </div>
      ` : ''}
      <label class="compare-search-label">
        <span>Find a registry</span>
        <input type="search" data-compare-search="registry" value="${escapeHtml(search)}" placeholder="Search registry names">
      </label>
      <div class="compare-picker-results" aria-label="Registry search results">
        ${candidates.length
          ? candidates.map(name => `
              <button class="compare-picker-result" type="button" data-compare-registry="${escapeHtml(name)}" aria-pressed="false" ${full ? 'disabled' : ''}>
                <span>${escapeHtml(name)}</span><span aria-hidden="true">+</span>
              </button>
            `).join('')
          : `<span class="muted">${full ? 'Remove a registry to choose another.' : 'No registries match this search.'}</span>`}
      </div>
    </div>
  `;
}

function renderCapabilityFilter(model: CompareModel, selection: CompareSelection, search = ''): string {
  const selectedKeys = selection.componentKeys.filter(key => model.availableComponentKeys.includes(key));
  const selected = new Set(selectedKeys);
  const query = search.trim().toLocaleLowerCase();
  const candidates = model.availableComponentKeys
    .filter(key => !selected.has(key) && (!query || componentLabel(key).toLocaleLowerCase().includes(query)))
    .slice(0, PICKER_RESULT_LIMIT);
  const summary = selected.size
    ? `${selected.size} selected`
    : `Default capabilities (${model.columns.length})`;

  return `
    <details class="compare-capability-filter">
      <summary><span>Refine capabilities</span><span>${escapeHtml(summary)}</span></summary>
      <div class="compare-capability-body">
        ${selected.size ? `
          <div class="compare-selected-list" aria-label="Selected capabilities">
            ${selectedKeys.map(key => `
              <button class="compare-selected-chip" type="button" data-compare-component="${escapeHtml(key)}" aria-pressed="true" aria-label="Remove ${escapeHtml(componentLabel(key))} from comparison">
                ${escapeHtml(componentLabel(key))} <span aria-hidden="true">×</span>
              </button>
            `).join('')}
          </div>
        ` : ''}
        <label class="compare-search-label">
          <span>Find a capability</span>
          <input type="search" data-compare-search="component" value="${escapeHtml(search)}" placeholder="Search capabilities">
        </label>
        <div class="compare-picker-results" aria-label="Capability search results">
          ${candidates.length
            ? candidates.map(key => `
                <button class="compare-picker-result" type="button" data-compare-component="${escapeHtml(key)}" aria-pressed="false">
                  <span>${escapeHtml(componentLabel(key))}</span><span aria-hidden="true">+</span>
                </button>
              `).join('')
            : '<span class="muted">No capabilities match this search.</span>'}
        </div>
      </div>
    </details>
  `;
}

function renderCompareEmptyState(selectedCount: number): string {
  return `
    <div class="compare-empty-state">
      <strong>Choose 2–4 registries to compare.</strong>
      <span>${selectedCount === 0 ? 'Start by searching for a registry above.' : 'Choose one more registry to build the comparison.'}</span>
    </div>
  `;
}

function renderComparisonTable(model: CompareModel): string {
  const registryHeaders = model.rows
    .map(row => `<th scope="col" class="compare-registry-heading">${escapeHtml(row.registry.name)}</th>`)
    .join('');
  const capabilityRows = model.columns.map((componentKey, index) => `
    <tr>
      <th scope="row" class="compare-capability-heading">${escapeHtml(componentLabel(componentKey))}</th>
      ${model.rows.map(row => renderCell(row.cells[index])).join('')}
    </tr>
  `).join('');

  return `
    <div class="compare-table-scroll" tabindex="0" role="region" aria-label="Registry comparison table">
      <table class="compare-table">
        <thead><tr><th scope="col" class="compare-capability-heading">Capability</th>${registryHeaders}</tr></thead>
        <tbody>${capabilityRows}</tbody>
      </table>
    </div>
  `;
}

function renderCell(cell: MatrixCell): string {
  if (!cell.matched || cell.status === 'absent') {
    return `<td class="compare-cell compare-cell-unknown"><span class="compare-state" aria-label="${escapeHtml(cell.label)}" title="${escapeHtml(cell.label)}">Not listed</span></td>`;
  }

  const display = cell.status === 'verified'
    ? ['✓', 'Verified']
    : cell.status === 'inferred'
      ? ['~', 'Inferred']
      : cell.status === 'partial'
        ? ['◐', 'Partial']
        : ['?', 'Unverified'];
  return `<td class="compare-cell compare-cell-${escapeHtml(cell.status)}"><span class="compare-state"><strong>${display[0]}</strong> ${display[1]}</span></td>`;
}

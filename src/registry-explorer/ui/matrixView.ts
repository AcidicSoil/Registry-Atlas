import type { MatrixRow, RegistryExplorerMetrics, ComponentTag } from '../core/registry.schema';
import { componentLabel } from '../core/labels';
import { escapeHtml } from './renderSafety';

export function renderMatrixAside(
  root: HTMLElement,
  columns: readonly ComponentTag[],
  metrics: RegistryExplorerMetrics
): void {
  const summary = `
    <div class="aside-header">
      <div class="aside-title">Matrix axes</div>
      <div class="aside-summary">
        Rows: <span class="em">registries</span>. Columns: <span class="em">representative components</span>.
      </div>
    </div>`;

  const footer = `
    <div class="aside-footer">
      <span class="muted-em">Coverage overview</span>
      <span class="key">${metrics.visibleRegistries} registries · ${columns.length} columns</span>
    </div>`;

  const chips = `
    <div class="pill-list">
       ${columns.map(col => `
         <div class="chip chip-compact chip-tag">
           ${escapeHtml(componentLabel(col))}
         </div>
       `).join("")}
     </div>`;

  root.innerHTML = summary + chips + footer;
}

export function renderMatrixContent(
  headerRoot: HTMLElement,
  bodyRoot: HTMLElement,
  rows: MatrixRow[],
  columns: readonly ComponentTag[],
  metrics: RegistryExplorerMetrics
): void {
  // Header
  headerRoot.innerHTML = `
    <div class="content-heading">
      <div class="content-title">Coverage matrix</div>
      <div class="content-subtitle">
        Quick scan of which registries cover core component families.
      </div>
    </div>
    <div class="content-metrics">
      <span><strong>${metrics.visibleRegistries}</strong> registries</span>
      <span><strong>${columns.length}</strong> component columns</span>
    </div>`;

  // Body
  if (!rows.length) {
    bodyRoot.innerHTML = `
      <div class="empty-state">
         <div class="empty-state-icon">⊘</div>
         <div>No registries match this filter.</div>
         <div>Clear the search or choose a different group.</div>
       </div>`;
    return;
  }

  const tableRows = rows.map(r => {
    const cells = r.cells.map(cell => {
      const icon = cell.matched ? "●" : "";
      const cls = cell.matched ? `matrix-icon status-${cell.status}` : "matrix-empty";
      return `<td class="${cls}" title="${escapeHtml(cell.label)}"><span>${icon}</span><span class="matrix-status-label">${escapeHtml(cell.status)}</span></td>`;
    }).join("");

    return `
      <tr>
        <td>
          <div class="matrix-registry-name">${escapeHtml(r.registry.name)}</div>
        </td>
        ${cells}
      </tr>
    `;
  }).join("");

  const headers = columns.map(col =>
    `<th>${escapeHtml(componentLabel(col))}</th>`
  ).join("");

  bodyRoot.innerHTML = `
    <div class="matrix-wrapper">
       <table class="matrix">
         <thead>
           <tr>
             <th>Registry</th>
             ${headers}
           </tr>
         </thead>
         <tbody>
           ${tableRows}
         </tbody>
       </table>
     </div>`;
}

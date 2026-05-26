import type { ComponentGroup, RegistryExplorerMetrics, ComponentTag } from '../core/registry.schema';
import { componentLabel, focusLabel } from '../core/labels';
import { escapeHtml, renderExternalLink } from './renderSafety';

export function renderComponentAside(
  root: HTMLElement,
  groups: ComponentGroup[],
  selectedComponent: ComponentTag | null
): void {
  const summary = `
    <div class="aside-header">
      <div class="aside-title">Component index</div>
      <div class="aside-summary">
        Choose a <span class="em">component type</span> to see who ships it.
      </div>
    </div>`;

  const pills = groups
    // .slice(0, 32) // Removed limit to show all
    .map(group => {
      const active = selectedComponent === group.componentKey ? " pill-active" : "";
      return `
        <button class="pill-item${active}" data-component="${group.componentKey}">
          <span class="pill-item-label">${escapeHtml(group.label)}</span>
          <span class="pill-item-count">${group.count}</span>
          <span class="status-hint">${group.statusCounts.verified} verified · ${group.statusCounts.unverified} unverified</span>
        </button>
      `;
    })
    .join("");

  const footer = `
    <div class="aside-footer">
      <span class="muted-em">Filter by component</span>
      <span class="key">Component → registries</span>
    </div>`;

  root.innerHTML = summary + `<div class="pill-list">${pills}</div>` + footer;
}

export function renderComponentContent(
  headerRoot: HTMLElement,
  bodyRoot: HTMLElement,
  group: ComponentGroup | null,
  metrics: RegistryExplorerMetrics
): void {
  // Header
  headerRoot.innerHTML = `
    <div class="content-heading">
      <div class="content-title">Registries by component</div>
      <div class="content-subtitle">
        Start from the component you need; see every registry that ships it.
      </div>
    </div>
    <div class="content-metrics">
      <span><strong>${metrics.visibleRegistries}</strong> registries</span>
      <span><strong>${metrics.componentTypeCount}</strong> component types</span>
    </div>`;

  // Body
  if (!group) {
    bodyRoot.innerHTML = `
      <div class="empty-state">
         <div class="empty-state-icon">◎</div>
         <div>Select a component type in the left panel.</div>
       </div>`;
    return;
  }

  if (!group.registries.length) {
    bodyRoot.innerHTML = `
      <div class="empty-state">
         <div class="empty-state-icon">⊘</div>
         <div>No registries match this filter.</div>
         <div>Clear the search or choose a different group.</div>
       </div>`;
    return;
  }

  const rows = group.registries.map(r => {
    const focusTags = r.primary_focus
      .map(f => `<span class="chip chip-focus chip-compact">${escapeHtml(focusLabel(f))}</span>`)
      .join("");
    const extraTags = r.component_tags
      .filter(t => t !== group.componentKey)
      .slice(0, 3)
      .map(t => `<span class="chip chip-tag chip-compact">${escapeHtml(componentLabel(t))}</span>`)
      .join("");
    const extraCount = r.component_tags.length - 1 - 3; // -1 for selected, -3 shown
    const moreChip = extraCount > 0
      ? `<span class="chip chip-compact chip-tag">+${extraCount} more</span>`
      : "";
    const warningChip = r.mirror?.warnings.length
      ? `<span class="chip chip-warning chip-compact">${r.mirror.warnings.length} warning${r.mirror.warnings.length === 1 ? '' : 's'}</span>`
      : "";

            return `
              <div class="component-registry-row">
                <div class="component-registry-main">
                  <div style="display: flex; align-items: baseline; gap: 8px;">
                    <div class="component-registry-name">${escapeHtml(r.name)}</div>
                    ${warningChip}
                    ${renderExternalLink(r.url, 'Visit')}
                  </div>
                  <div class="component-registry-description">
                    ${escapeHtml(r.description)}
                  </div>
                </div>
                <div class="component-registry-meta">
                  ${focusTags}
                  ${extraTags}
                  ${moreChip}
                </div>
              </div>
            `;  }).join("");

  bodyRoot.innerHTML = `
    <div class="component-group-list">
      <div class="component-group">
        <div class="component-group-header">
          <div class="component-name">${escapeHtml(group.label)}</div>
          <div class="component-count">${group.registries.length} registries · ${group.statusCounts.verified} verified · ${group.statusCounts.unverified} unverified</div>
          <button class="link-button" type="button" data-discover-component="${escapeHtml(group.componentKey)}">Search this component</button>
        </div>
        <div class="component-group-body">
          ${rows}
        </div>
      </div>
    </div>
  `;
}

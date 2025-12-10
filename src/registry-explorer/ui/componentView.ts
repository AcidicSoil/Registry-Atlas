import type { ComponentGroup, RegistryExplorerMetrics, ComponentTag } from '../core/registry.schema';
import { componentLabel, focusLabel } from '../core/labels';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

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
    .slice(0, 32) // Limit list size as per original
    .map(group => {
      const active = selectedComponent === group.componentKey ? " pill-active" : "";
      return `
        <button class="pill-item${active}" data-component="${group.componentKey}">
          <span class="pill-item-label">${escapeHtml(group.label)}</span>
          <span class="pill-item-count">${group.count}</span>
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
         <div>No registries currently expose this component after filtering.</div>
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

    return `
      <div class="component-registry-row">
        <div class="component-registry-main">
          <div class="component-registry-name">${escapeHtml(r.name)}</div>
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
    `;
  }).join("");

  bodyRoot.innerHTML = `
    <div class="component-group-list">
      <div class="component-group">
        <div class="component-group-header">
          <div class="component-name">${escapeHtml(group.label)}</div>
          <div class="component-count">${group.registries.length} registries</div>
        </div>
        <div class="component-group-body">
          ${rows}
        </div>
      </div>
    </div>
  `;
}

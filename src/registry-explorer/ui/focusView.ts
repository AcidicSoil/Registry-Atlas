import type { FocusGroup, RegistryExplorerMetrics, PrimaryFocus, Registry } from '../core/registry.schema';
import { focusLabel, componentLabel } from '../core/labels';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function renderFocusAside(
  root: HTMLElement,
  groups: FocusGroup[],
  selectedFocus: PrimaryFocus | null
): void {
  const summary = `
    <div class="aside-header">
      <div class="aside-title">Focus clusters</div>
      <div class="aside-summary">
        Registry groups by dominant <span class="em">use-case</span>.
      </div>
    </div>`;

  const pills = groups
    .map(group => {
      const active = selectedFocus === group.focusKey ? " pill-active" : "";
      return `
        <button class="pill-item${active}" data-focus="${group.focusKey}">
          <span class="pill-item-label">${escapeHtml(group.label)}</span>
          <span class="pill-item-count">${group.count}</span>
        </button>
      `;
    })
    .join("");

  const footer = `
    <div class="aside-footer">
      <span class="muted-em">Filter by cluster</span>
      <span class="key">Focus → registries</span>
    </div>`;

  root.innerHTML = summary + `<div class="pill-list">${pills}</div>` + footer;
}

export function renderFocusContent(
  headerRoot: HTMLElement,
  bodyRoot: HTMLElement,
  registries: readonly Registry[],
  metrics: RegistryExplorerMetrics
): void {
  // Header
  headerRoot.innerHTML = `
    <div class="content-heading">
      <div class="content-title">Registries by focus</div>
      <div class="content-subtitle">
        Browse component registries clustered by dominant product use-case.
      </div>
    </div>
    <div class="content-metrics">
      <span><strong>${metrics.visibleRegistries}</strong> registries</span>
      <span><strong>${metrics.focusGroupCount}</strong> focus groups</span>
    </div>`;

  // Body
  if (!registries.length) {
     bodyRoot.innerHTML = `
      <div class="empty-state">
         <div class="empty-state-icon">⊘</div>
         <div>No registries match this filter.</div>
         <div>Try clearing the search or selecting a different group.</div>
       </div>`;
     return;
  }

  const cards = registries.map(r => {
    const focusChips = r.primary_focus
      .map(f => `<span class="chip chip-focus">${escapeHtml(focusLabel(f))}</span>`)
      .join("");
    const tagChips = r.component_tags.slice(0, 5)
      .map(tag => `<span class="chip chip-tag chip-compact">${escapeHtml(componentLabel(tag))}</span>`)
      .join("");
    const extraCount = r.component_tags.length - 5;
    const extraChip = extraCount > 0
      ? `<span class="chip chip-compact chip-tag">+${extraCount} more</span>`
      : "";

    return `
      <article class="registry-card">
        <div class="registry-header">
          <div>
            <div class="registry-name">${escapeHtml(r.name)}</div>
          </div>
          <a href="${escapeHtml(r.url)}" class="registry-url" target="_blank" rel="noreferrer">
            Visit
          </a>
        </div>
        <div class="registry-description">
          ${escapeHtml(r.description)}
        </div>
        <div class="chip-row">
          ${focusChips}
        </div>
        <div class="registry-footer">
          <div class="registry-meta">
            <span>${escapeHtml(r.framework || 'React')}</span>
            <span>${escapeHtml(r.license || 'MIT')}</span>
          </div>
          <div class="tag-row-compact">
            ${tagChips}${extraChip}
          </div>
        </div>
      </article>
    `;
  }).join("");

  bodyRoot.innerHTML = `<div class="registry-grid">${cards}</div>`;
}

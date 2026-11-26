import { escapeHtml } from "./renderSafety";
import { filterControlClasses } from "./primitives/filterControlClasses";

export function renderBrowseFacetPopover(label: string, rows: string, selection?: string): string {
  if (!rows) return "";

  return `<ui-popover>
    <ui-popover-trigger><button type="button" data-browse-facet="${escapeHtml(label)}" class="${filterControlClasses.trigger}">${escapeHtml(selection ? label + ": " + selection : label)} <span aria-hidden="true">⌄</span></button></ui-popover-trigger>
    <ui-popover-content hidden align="start" side-offset="6" class="${filterControlClasses.panel}">
      <ui-popover-title class="${filterControlClasses.title}">${escapeHtml(label)}</ui-popover-title>
      <div class="${filterControlClasses.list}">${rows}</div>
    </ui-popover-content>
  </ui-popover>`;
}

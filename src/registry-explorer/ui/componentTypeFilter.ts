import { controlIcon, dropdownChevron } from "./primitives/controlIcon";
import {
  CATALOG_COMPONENT_TYPES,
  isCatalogComponentType,
  type CatalogComponentType,
} from "../core/catalogComponentTypes";
import { escapeHtml } from "./renderSafety";
import { filterControlClasses } from "./primitives/filterControlClasses";

function sameSelection(left: readonly unknown[], right: readonly CatalogComponentType[]): boolean {
  const values = new Set(left);

  return left.length === right.length && right.every((type) => values.has(type));
}

export function createComponentTypeFilter(
  mount: HTMLElement,
  onChange: (types: CatalogComponentType[]) => void,
) {
  mount.innerHTML = `
    <ui-combobox multiple auto-highlight="always">
      <div class="${filterControlClasses.group}" role="group" aria-label="Component type search">
        <ui-combobox-input>
          <input class="${filterControlClasses.input}" aria-label="Find component types" placeholder="Find component types…" />
        </ui-combobox-input>
        <ui-combobox-trigger>
          <button class="${filterControlClasses.groupButton}" type="button" aria-label="Show component types"><span data-type-trigger-label>Types</span>${dropdownChevron()}</button>
        </ui-combobox-trigger>
      </div>
      <ui-combobox-content hidden align="start" side-offset="6" class="${filterControlClasses.panel}">
        <div class="${filterControlClasses.title}">Component types</div>
        <ui-combobox-empty>No matching types.</ui-combobox-empty>
        <ui-combobox-list class="${filterControlClasses.list}">
          ${CATALOG_COMPONENT_TYPES.map(
            ({ value, label }) => `
            <ui-combobox-item value="${escapeHtml(value)}" label="${escapeHtml(label)}" class="${filterControlClasses.option}">
              <span>${escapeHtml(label)}</span>
              <ui-combobox-item-indicator class="${filterControlClasses.indicator}" aria-hidden="true">${controlIcon("check")}</ui-combobox-item-indicator>
            </ui-combobox-item>`,
          ).join("")}
        </ui-combobox-list>
      </ui-combobox-content>
    </ui-combobox>`;
  const combobox = mount.querySelector("ui-combobox");
  const trigger = mount.querySelector<HTMLButtonElement>("ui-combobox-trigger button");

  const triggerLabel = trigger?.querySelector("[data-type-trigger-label]");

  if (!combobox || !trigger || !triggerLabel) throw new Error("Missing type filter controls");

  const lifetime = new AbortController();
  let selected: readonly CatalogComponentType[] = [];
  let syncing = false;
  combobox.addEventListener(
    "valuechange",
    (event) => {
      if (syncing) return;
      const value = event.detail.value;

      if (!Array.isArray(value)) return;
      const next = value.filter(isCatalogComponentType);

      if (sameSelection(selected, next)) return;
      onChange(next);
    },
    { signal: lifetime.signal },
  );

  return {
    sync(visible: boolean, types: readonly CatalogComponentType[]) {
      if (!visible && combobox.open) combobox.open = false;
      mount.hidden = !visible;
      selected = [...types];
      const current = combobox.value;

      if (!Array.isArray(current) || !sameSelection(current, types)) {
        syncing = true;
        combobox.value = [...types];
        syncing = false;
      }

      triggerLabel.textContent = types.length ? `Types (${types.length})` : "Types";
      trigger.setAttribute(
        "aria-label",
        types.length ? `Show component types, ${types.length} selected` : "Show component types",
      );
    },
    dispose() {
      lifetime.abort();
      mount.replaceChildren();
    },
  };
}

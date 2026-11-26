import {
  CATALOG_COMPONENT_TYPES,
  isCatalogComponentType,
  type CatalogComponentType,
} from "../core/catalogComponentTypes";
import { escapeHtml } from "./renderSafety";
import { filterControlClasses } from "./primitives/filterControlClasses";

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
          <button class="${filterControlClasses.groupButton}" type="button" aria-label="Show component types">Types <span aria-hidden="true">⌄</span></button>
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
              <ui-combobox-item-indicator class="${filterControlClasses.indicator}" aria-hidden="true">✓</ui-combobox-item-indicator>
            </ui-combobox-item>`,
          ).join("")}
        </ui-combobox-list>
      </ui-combobox-content>
    </ui-combobox>`;
  const combobox = mount.querySelector("ui-combobox");
  const trigger = mount.querySelector<HTMLButtonElement>("ui-combobox-trigger button");

  if (!combobox || !trigger) throw new Error("Missing type filter controls");

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

      if (next.length === selected.length && next.every((type) => selected.includes(type))) return;
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

      if (
        !Array.isArray(current) ||
        current.length !== types.length ||
        !types.every((type) => current.includes(type))
      ) {
        syncing = true;
        combobox.value = [...types];
        syncing = false;
      }

      trigger.textContent = types.length ? `Types (${types.length}) ⌄` : "Types ⌄";
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

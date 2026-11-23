import type { RegistryCatalogItem } from "./registry.schema";

/**
 * Browse facets are derived directly from catalog metadata.
 * Add a descriptor here to make a component type selectable without changing
 * the reviewed canonical taxonomy or rebuilding classification approvals.
 */
export const CATALOG_COMPONENT_TYPES = [
  { value: "accordion", label: "Accordion" },
  { value: "alert", label: "Alert" },
  { value: "avatar", label: "Avatar" },
  { value: "badge", label: "Badge" },
  { value: "button", label: "Button" },
  { value: "calendar", label: "Calendar" },
  { value: "card", label: "Card" },
  { value: "carousel", label: "Carousel" },
  { value: "chart", label: "Chart" },
  { value: "checkbox", label: "Checkbox" },
  { value: "code-block", label: "Code Block" },
  { value: "collapsible", label: "Collapsible" },
  { value: "combobox", label: "Combobox", aliases: ["combo box"] },
  { value: "command", label: "Command" },
  { value: "context-menu", label: "Context Menu" },
  { value: "data-table", label: "Data Table" },
  { value: "date-picker", label: "Date Picker", aliases: ["datepicker"] },
  { value: "dialog", label: "Dialog" },
  { value: "drawer", label: "Drawer" },
  { value: "dropdown", label: "Dropdown Menu", aliases: ["drop down"] },
  { value: "empty-state", label: "Empty State" },
  { value: "file-upload", label: "File Upload", aliases: ["file uploader"] },
  { value: "form", label: "Form", aliases: ["forms"] },
  { value: "input", label: "Input" },
  { value: "menubar", label: "Menubar" },
  { value: "navigation-menu", label: "Navigation Menu" },
  { value: "pagination", label: "Pagination" },
  { value: "popover", label: "Popover" },
  { value: "progress", label: "Progress" },
  { value: "radio", label: "Radio" },
  { value: "rating", label: "Rating" },
  { value: "resizable", label: "Resizable" },
  { value: "scroll-area", label: "Scroll Area" },
  { value: "select", label: "Select" },
  { value: "separator", label: "Separator" },
  { value: "sheet", label: "Sheet" },
  { value: "sidebar", label: "Sidebar" },
  { value: "skeleton", label: "Skeleton" },
  { value: "slider", label: "Slider" },
  { value: "stepper", label: "Stepper" },
  { value: "switch", label: "Switch" },
  { value: "table", label: "Table" },
  { value: "tabs", label: "Tabs" },
  { value: "textarea", label: "Textarea", aliases: ["text area"] },
  { value: "toast", label: "Toast" },
  { value: "toggle", label: "Toggle" },
  { value: "tooltip", label: "Tooltip" },
  { value: "tree", label: "Tree" },
] as const;

export type CatalogComponentType = (typeof CATALOG_COMPONENT_TYPES)[number]["value"];

const componentTypeIds = new Set<string>(CATALOG_COMPONENT_TYPES.map(({ value }) => value));

export function isCatalogComponentType(value: string): value is CatalogComponentType {
  return componentTypeIds.has(value);
}

function normalizedTerms(value: string): string {
  return value
    .replace(/([a-z\d])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const componentTypeTerms = CATALOG_COMPONENT_TYPES.map(({ value, label, ...rest }) => ({
  value,
  terms: [
    ...new Set(
      [value, label, ...("aliases" in rest ? rest.aliases : [])].map(
        (term) => ` ${normalizedTerms(term)} `,
      ),
    ),
  ],
}));

const itemTypeCache = new WeakMap<object, CatalogComponentType[]>();

/** Exact word/phrase boundaries avoid accidental matches such as form in format. */
export function catalogComponentTypesForItem(
  item: Pick<RegistryCatalogItem, "name" | "title" | "categories">,
): CatalogComponentType[] {
  const cached = itemTypeCache.get(item);

  if (cached) return cached;

  const searchable = ` ${normalizedTerms(
    [item.name, item.title ?? "", ...(item.categories ?? [])].join(" "),
  )} `;

  const types = componentTypeTerms
    .filter(({ terms }) => terms.some((term) => searchable.includes(term)))
    .map(({ value }) => value);

  itemTypeCache.set(item, types);

  return types;
}

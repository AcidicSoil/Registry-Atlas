import type { RegistryCatalogItem } from "./registry.schema";

export type CatalogAssetKind = "component" | "template" | "theme" | "icon";

export interface ExploreCollectionOption {
  slug: string;
  label: string;
  categories: readonly string[];
}

const COMPONENT_TYPES = new Set(["registry:block", "registry:component", "registry:ui", "registry:item"]);
const THEME_TYPES = new Set(["registry:style", "registry:theme"]);
const ICON_TYPES = new Set(["registry:icon"]);
const ICON_CATEGORIES = new Set(["icon", "icons", "icon-stack", "morph-icon"]);
const ICON_ONLY_REGISTRIES = new Set(["@svgl", "@heroicons-animated", "@hugeicons-animated", "@hugeicons-animated-vue"]);

const EXPLORE_COLLECTIONS: readonly ExploreCollectionOption[] = [
  { slug: "ai", label: "AI", categories: ["ai"] },
  { slug: "forms", label: "Forms", categories: ["forms", "form"] },
  { slug: "dashboard", label: "Dashboard", categories: ["dashboard"] },
  { slug: "marketing", label: "Marketing", categories: ["marketing"] },
  { slug: "navigation", label: "Navigation", categories: ["navigation"] },
  { slug: "charts", label: "Charts", categories: ["charts"] },
];

export function assetKindForCatalogItem(item: RegistryCatalogItem, namespace?: string): CatalogAssetKind | null {
  if (namespace && ICON_ONLY_REGISTRIES.has(namespace)) return "icon";
  if (item.type === "registry:page") return "template";
  if (ICON_TYPES.has(item.type) || (item.categories ?? []).some(category => ICON_CATEGORIES.has(normalize(category)))) {
    return "icon";
  }
  if (THEME_TYPES.has(item.type)) return "theme";
  if (COMPONENT_TYPES.has(item.type)) return "component";
  return null;
}

export function filterCatalogItemsByAssetKind(
  items: readonly RegistryCatalogItem[],
  kind: CatalogAssetKind,
): RegistryCatalogItem[] {
  return items.filter(item => assetKindForCatalogItem(item) === kind);
}

export function buildExploreCollectionOptions(
  observedCategories: readonly string[],
): ExploreCollectionOption[] {
  const observed = new Set(observedCategories.map(normalize));
  return EXPLORE_COLLECTIONS.filter(option =>
    option.categories.some(category => observed.has(normalize(category))),
  );
}

export function exploreCollectionBySlug(slug: string): ExploreCollectionOption | null {
  return EXPLORE_COLLECTIONS.find(option => option.slug === normalize(slug)) ?? null;
}

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase();
}

import kindOverrides from "../../../data/catalog-taxonomy/kind-overrides.json";
import type { CatalogCanonicalKind, RegistryCatalogItem } from "./registry.schema";

export type CatalogAssetKind = CatalogCanonicalKind;

export interface ExploreCollectionOption {
  slug: string;
  label: string;
  categories: readonly string[];
}

const COMPONENT_TYPES = new Set(["registry:component", "registry:ui", "registry:item"]);
const BLOCK_TYPES = new Set(["registry:block"]);
const PAGE_TYPES = new Set(["registry:page"]);
const THEME_TYPES = new Set(["registry:style", "registry:theme"]);
const ICON_TYPES = new Set(["registry:icon"]);
const ICON_CATEGORIES = new Set(["icon", "icons", "icon-stack", "morph-icon"]);
const REGISTRY_KIND_DEFAULTS = new Map<string, CatalogCanonicalKind>(
  Object.entries(kindOverrides.registryDefaults as Record<string, CatalogCanonicalKind>),
);

const EXPLORE_COLLECTIONS: readonly ExploreCollectionOption[] = [
  { slug: "ai", label: "AI", categories: ["ai"] },
  { slug: "forms", label: "Forms", categories: ["forms", "form"] },
  { slug: "dashboard", label: "Dashboard", categories: ["dashboard"] },
  { slug: "marketing", label: "Marketing", categories: ["marketing"] },
  { slug: "navigation", label: "Navigation", categories: ["navigation"] },
  { slug: "charts", label: "Charts", categories: ["charts"] },
];

export function assetKindForCatalogItem(
  item: RegistryCatalogItem,
  namespace?: string,
): CatalogCanonicalKind {
  if (item.kind) return item.kind;
  if (namespace) {
    const reviewed = REGISTRY_KIND_DEFAULTS.get(namespace);
    if (reviewed) return reviewed;
  }
  if (ICON_TYPES.has(item.type)
    || (item.categories ?? []).some(category => ICON_CATEGORIES.has(normalize(category)))) {
    return "icon";
  }
  if (BLOCK_TYPES.has(item.type)) return "block";
  if (PAGE_TYPES.has(item.type)) return "page";
  if (THEME_TYPES.has(item.type)) return "theme";
  if (COMPONENT_TYPES.has(item.type)) return "component";
  return "other";
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

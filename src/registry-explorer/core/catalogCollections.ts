import type { CatalogCanonicalKind, RegistryCatalogItem } from "./registry.schema";
import type { CatalogPolicy } from "./catalogPolicy";

export type CatalogAssetKind = CatalogCanonicalKind;

export interface ExploreCollectionOption {
  slug: string;
  label: string;
  categories: readonly string[];
}

const COMPONENT_TYPES = new Set(["registry:component", "registry:ui", "registry:item"]);

const TEMPLATE_CATEGORIES = new Set(["template", "templates"]);

const BLOCK_TYPES = new Set(["registry:block"]);

const PAGE_TYPES = new Set(["registry:page"]);

const THEME_TYPES = new Set(["registry:style", "registry:theme"]);

const ICON_TYPES = new Set(["registry:icon"]);

const ICON_CATEGORIES = new Set(["icon", "icons", "icon-stack", "morph-icon"]);

const EXPLORE_COLLECTIONS: readonly ExploreCollectionOption[] = [
  { slug: "ai", label: "AI", categories: ["ai"] },
  { slug: "forms", label: "Forms", categories: ["forms", "form"] },
  { slug: "dashboard", label: "Dashboard", categories: ["dashboard"] },
  { slug: "marketing", label: "Marketing", categories: ["marketing"] },
  { slug: "navigation", label: "Navigation", categories: ["navigation"] },
  { slug: "charts", label: "Charts", categories: ["charts"] },
];

function isTemplateCatalogItem(item: RegistryCatalogItem): boolean {
  return (item.categories ?? []).some((category) => TEMPLATE_CATEGORIES.has(normalize(category)));
}

function assetKindForItemType(type: string): CatalogCanonicalKind {
  const classes = [
    [BLOCK_TYPES, "block"],
    [PAGE_TYPES, "page"],
    [THEME_TYPES, "theme"],
    [COMPONENT_TYPES, "component"],
  ] as const;

  for (const [types, kind] of classes) {
    if (types.has(type)) return kind;
  }

  return "other";
}

export function assetKindForCatalogItem(
  item: RegistryCatalogItem,
  policy: CatalogPolicy,
  namespace?: string,
): CatalogCanonicalKind {
  if (isTemplateCatalogItem(item)) return "template";

  if (item.kind) return item.kind;

  if (namespace) {
    const reviewed = policy.kindOverrides.get(namespace);

    if (reviewed) return reviewed;
  }

  if (
    ICON_TYPES.has(item.type) ||
    (item.categories ?? []).some((category) => ICON_CATEGORIES.has(normalize(category)))
  ) {
    return "icon";
  }

  return assetKindForItemType(item.type);
}

export function filterCatalogItemsByAssetKind(
  items: readonly RegistryCatalogItem[],
  kind: CatalogAssetKind,
  policy: CatalogPolicy,
  namespace?: string,
): RegistryCatalogItem[] {
  return items.filter((item) => assetKindForCatalogItem(item, policy, namespace) === kind);
}

export function buildExploreCollectionOptions(
  observedCategories: readonly string[],
): ExploreCollectionOption[] {
  const observed = new Set(observedCategories.map(normalize));

  return EXPLORE_COLLECTIONS.filter((option) =>
    option.categories.some((category) => observed.has(normalize(category))),
  );
}

export function exploreCollectionBySlug(slug: string): ExploreCollectionOption | null {
  return EXPLORE_COLLECTIONS.find((option) => option.slug === normalize(slug)) ?? null;
}

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase();
}

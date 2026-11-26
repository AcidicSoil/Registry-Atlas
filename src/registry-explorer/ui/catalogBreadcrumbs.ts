/** Named map contract for dynamic keys in this module. */
type ROUTELABELSLookupContract = Readonly<Record<string, string>>;

import type { CatalogRoute } from "../core/catalogRoutes";
import type { CatalogAssetKind } from "../core/catalogCollections";
import { catalogRoutePath, REGISTRY_ASSET_SEGMENTS } from "../core/catalogRoutes";
import { escapeHtml } from "./renderSafety";

const ROUTE_LABELS = {
  home: "Home",
  components: "Components",
  blocks: "Blocks",
  pages: "Pages",
  templates: "Templates",
  themes: "Themes",
  icons: "Icons",
  registries: "Registries",
  authors: "Authors",
  compare: "Compare",
  explore: "Explore",
  "theme-editor": "Theme editor",
  setup: "Setup",
  "setup-review": "Review setup",
  "icon-category": "Category",
  "icon-family": "Family",
} satisfies ROUTELABELSLookupContract;

const ASSET_SEGMENT_LABELS = {
  components: "Components",
  blocks: "Blocks",
  pages: "Pages",
  templates: "Templates",
  themes: "Themes",
  icons: "Icons",
  other: "Other",
} satisfies ROUTELABELSLookupContract;

type Crumb = { label: string; route?: CatalogRoute };

type RegistryRoute = Extract<CatalogRoute, { namespace: string }>;

function assetKindForRoute(route: Exclude<RegistryRoute, { kind: "registry" }>): CatalogAssetKind {
  if (route.kind === "registry-assets") return route.assetKind;

  return route.kind;
}

function registryBreadcrumbs(route: RegistryRoute, itemTitle?: string): Crumb[] {
  const crumbs: Crumb[] = [{ label: "Registries", route: { kind: "registries" } }];

  if (route.kind === "registry") return [...crumbs, { label: route.namespace }];
  crumbs.push({ label: route.namespace, route: { kind: "registry", namespace: route.namespace } });

  const assetKind = assetKindForRoute(route);

  const segment = Object.entries(REGISTRY_ASSET_SEGMENTS).find(
    ([, kind]) => kind === assetKind,
  )?.[0];

  if (segment) {
    const crumb: Crumb = {
      label: new Map(Object.entries(ASSET_SEGMENT_LABELS)).get(segment) ?? segment,
    };

    if (route.kind !== "registry-assets") {
      crumb.route = { kind: "registry-assets", namespace: route.namespace, assetKind };
    }

    crumbs.push(crumb);
  }

  if (route.kind !== "registry-assets") {
    crumbs.push({ label: registryItemBreadcrumbTitle(route, itemTitle) });
  }

  return crumbs;
}

function registryItemBreadcrumbTitle(
  route: Extract<RegistryRoute, { slug: string }>,
  itemTitle?: string,
): string {
  return itemTitle || route.slug.split("/").at(-1) || route.slug;
}

function otherBreadcrumbs(route: Exclude<CatalogRoute, RegistryRoute>): Crumb[] {
  switch (route.kind) {
    case "icon-family":
      return [{ label: "Icons", route: { kind: "icons" } }, { label: route.family }];
    case "icon-category":
      return [{ label: "Icons", route: { kind: "icons" } }, { label: route.category }];
    case "setup-review":
      return [{ label: "Setup", route: { kind: "setup" } }, { label: "Review" }];
    case "theme-editor":
      return [{ label: "Themes", route: { kind: "themes" } }, { label: "Editor" }];
    case "explore":
      return [{ label: "Components", route: { kind: "components" } }, { label: route.collection }];
    default:
      return [{ label: new Map(Object.entries(ROUTE_LABELS)).get(route.kind) ?? route.kind }];
  }
}

function renderCrumb(crumb: Crumb, index: number, basePath: string): string {
  const label = escapeHtml(crumb.label);
  const url = crumb.route ? catalogRoutePath(crumb.route, basePath) : null;

  const separator = index
    ? '<span class="catalog-breadcrumb-separator text-atlas-muted-foreground opacity-60" aria-hidden="true">/</span>'
    : "";

  const content = url
    ? `<a class="text-atlas-muted-foreground no-underline hover:text-atlas-foreground hover:underline focus-visible:text-atlas-foreground focus-visible:underline" href="${escapeHtml(url)}" data-catalog-route="${escapeHtml(url)}">${label}</a>`
    : `<span class="font-[550] text-atlas-foreground [overflow-wrap:anywhere]" aria-current="page">${label}</span>`;

  return `<li class="inline-flex min-w-0 items-center gap-2 text-xs">${separator}${content}</li>`;
}

export function renderCatalogBreadcrumbs(
  route: CatalogRoute,
  basePath: string,
  itemTitle?: string,
): string {
  if (route.kind === "home" || route.kind === "not-found") return "";
  const root: Crumb = { label: "Home", route: { kind: "home" } };

  const trail =
    "namespace" in route ? registryBreadcrumbs(route, itemTitle) : otherBreadcrumbs(route);

  return `<nav class="catalog-breadcrumb mb-0.5 min-w-0 basis-full" aria-label="Breadcrumb">
    <ol class="m-0 flex list-none flex-wrap items-center gap-x-2 gap-y-[3px] p-0">${[root, ...trail].map((crumb, index) => renderCrumb(crumb, index, basePath)).join("")}</ol>
  </nav>`;
}

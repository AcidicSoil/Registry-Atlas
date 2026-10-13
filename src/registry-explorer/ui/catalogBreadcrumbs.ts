import type { CatalogRoute } from '../core/catalogRoutes';
import type { CatalogAssetKind } from '../core/catalogCollections';
import { catalogRoutePath, REGISTRY_ASSET_SEGMENTS } from '../core/catalogRoutes';
import { escapeHtml } from './renderSafety';

const ROUTE_LABELS: Readonly<Record<string, string>> = {
  home: 'Home', components: 'Components', blocks: 'Blocks', pages: 'Pages',
  templates: 'Templates', themes: 'Themes', icons: 'Icons',
  registries: 'Registries', authors: 'Authors', compare: 'Compare',
  explore: 'Explore', 'theme-editor': 'Theme editor',
  'icon-category': 'Category', 'icon-family': 'Family',
};

const ASSET_SEGMENT_LABELS: Readonly<Record<string, string>> = {
  components: 'Components', blocks: 'Blocks', pages: 'Pages',
  templates: 'Templates', themes: 'Themes', icons: 'Icons', other: 'Other',
};

type Crumb = { label: string; route?: CatalogRoute };

type RegistryRoute = Extract<CatalogRoute, { namespace: string }>;

function assetKindForRoute(route: Exclude<RegistryRoute, { kind: 'registry' }>): CatalogAssetKind {
  if (route.kind === 'registry-assets') return route.assetKind;

  return route.kind;
}

function registryBreadcrumbs(route: RegistryRoute, itemTitle?: string): Crumb[] {
  const crumbs: Crumb[] = [{ label: 'Registries', route: { kind: 'registries' } }];

  if (route.kind === 'registry') return [...crumbs, { label: route.namespace }];
  crumbs.push({ label: route.namespace, route: { kind: 'registry', namespace: route.namespace } });

  const assetKind = assetKindForRoute(route);
  const segment = Object.entries(REGISTRY_ASSET_SEGMENTS).find(([, kind]) => kind === assetKind)?.[0];

  if (segment) {
    crumbs.push({
      label: ASSET_SEGMENT_LABELS[segment] ?? segment,
      ...(route.kind === 'registry-assets' ? {} : {
        route: { kind: 'registry-assets', namespace: route.namespace, assetKind } as CatalogRoute,
      }),
    });
  }

  if (route.kind !== 'registry-assets') {
    crumbs.push({ label: itemTitle || route.slug.split('/').at(-1) || route.slug });
  }

  return crumbs;
}

function otherBreadcrumbs(route: Exclude<CatalogRoute, RegistryRoute>): Crumb[] {
  switch (route.kind) {
    case 'icon-family':
      return [{ label: 'Icons', route: { kind: 'icons' } }, { label: route.family }];
    case 'icon-category':
      return [{ label: 'Icons', route: { kind: 'icons' } }, { label: route.category }];
    case 'theme-editor':
      return [{ label: 'Themes', route: { kind: 'themes' } }, { label: 'Editor' }];
    case 'explore':
      return [{ label: 'Components', route: { kind: 'components' } }, { label: route.collection }];
    default:
      return [{ label: ROUTE_LABELS[route.kind] ?? route.kind }];
  }
}

function renderCrumb(crumb: Crumb, index: number, basePath: string): string {
  const label = escapeHtml(crumb.label);
  const url = crumb.route ? catalogRoutePath(crumb.route, basePath) : null;
  const separator = index ? '<span class="catalog-breadcrumb-separator" aria-hidden="true">/</span>' : '';

  const content = url
    ? `<a href="${escapeHtml(url)}" data-catalog-route="${escapeHtml(url)}">${label}</a>`
    : `<span aria-current="page">${label}</span>`;

  return `<li>${separator}${content}</li>`;
}

export function renderCatalogBreadcrumbs(
  route: CatalogRoute,
  basePath: string,
  itemTitle?: string,
): string {
  if (route.kind === 'home' || route.kind === 'not-found') return '';
  const root: Crumb = { label: 'Home', route: { kind: 'home' } };

  const trail = 'namespace' in route
    ? registryBreadcrumbs(route, itemTitle)
    : otherBreadcrumbs(route);

  return `<nav class="catalog-breadcrumb" aria-label="Breadcrumb">
    <ol>${[root, ...trail].map((crumb, index) => renderCrumb(crumb, index, basePath)).join('')}</ol>
  </nav>`;
}

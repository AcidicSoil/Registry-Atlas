import type { CatalogRoute } from '../core/catalogRoutes';
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

export function renderCatalogBreadcrumbs(
  route: CatalogRoute,
  basePath: string,
  itemTitle?: string,
): string {
  if (route.kind === 'home' || route.kind === 'not-found') return '';
  const trail: Crumb[] = [{ label: 'Home', route: { kind: 'home' } }];
  if ('namespace' in route) {
    trail.push({ label: 'Registries', route: { kind: 'registries' } });
    if (route.kind === 'registry') {
      trail.push({ label: route.namespace });
    } else {
      trail.push({ label: route.namespace, route: { kind: 'registry', namespace: route.namespace } });
      const assetKind = route.kind === 'registry-assets'
        ? route.assetKind
        : route.kind === 'component' ? 'component'
          : route.kind === 'block' ? 'block'
            : route.kind === 'page' ? 'page'
              : route.kind === 'template' ? 'template' : 'theme';
      const segment = Object.entries(REGISTRY_ASSET_SEGMENTS).find(([, kind]) => kind === assetKind)?.[0];
      if (segment) {
        const assetRoute: CatalogRoute = {
          kind: 'registry-assets', namespace: route.namespace, assetKind,
        };
        trail.push({
          label: ASSET_SEGMENT_LABELS[segment] ?? segment,
          ...(route.kind === 'registry-assets' ? {} : { route: assetRoute }),
        });
      }
      if (route.kind !== 'registry-assets') {
        trail.push({ label: itemTitle || route.slug.split('/').at(-1) || route.slug });
      }
    }
  } else if (route.kind === 'icon-family') {
    trail.push({ label: 'Icons', route: { kind: 'icons' } });
    trail.push({ label: route.family });
  } else if (route.kind === 'icon-category') {
    trail.push({ label: 'Icons', route: { kind: 'icons' } });
    trail.push({ label: route.category });
  } else if (route.kind === 'theme-editor') {
    trail.push({ label: 'Themes', route: { kind: 'themes' } });
    trail.push({ label: 'Editor' });
  } else if (route.kind === 'explore') {
    trail.push({ label: 'Components', route: { kind: 'components' } });
    trail.push({ label: route.collection });
  } else {
    trail.push({ label: ROUTE_LABELS[route.kind] ?? route.kind });
  }

  return `<nav class="catalog-breadcrumb" aria-label="Breadcrumb">
    <ol>${trail.map((crumb, index) => {
      const label = escapeHtml(crumb.label);
      const url = crumb.route ? catalogRoutePath(crumb.route, basePath) : null;
      return `<li>${index ? '<span class="catalog-breadcrumb-separator" aria-hidden="true">/</span>' : ''}
        ${url
          ? `<a href="${escapeHtml(url)}" data-catalog-route="${escapeHtml(url)}">${label}</a>`
          : `<span aria-current="page">${label}</span>`}</li>`;
    }).join('')}</ol>
  </nav>`;
}

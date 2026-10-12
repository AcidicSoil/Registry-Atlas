import { assetKindForCatalogItem } from './catalogCollections';
import { resolveSourceItemRoute, type SourceItemKind } from './sourceItemRoute';
import type {
  Registry,
  RegistryCatalogIndex,
  RegistryCatalogItem,
  RegistrySourcePage,
} from './registry.schema';

/**
 * One source-page decision for every catalog surface.
 * Exact stored evidence wins; verified registry route families are a fallback.
 * A registry homepage or installable JSON is never a component source page.
 */
export function resolveCatalogSourcePage(
  index: RegistryCatalogIndex,
  registry: Registry,
  item: RegistryCatalogItem,
): RegistrySourcePage | undefined {
  const direct = index.sourcePages?.[`${registry.name}/${item.name}`];
  if (direct) return direct;

  const kind = assetKindForCatalogItem(item, registry.name);
  const sourceKind: SourceItemKind = kind === 'other' ? 'component' : kind;
  const url = resolveSourceItemRoute({
    homepage: registry.url,
    slug: item.name,
    kind: sourceKind,
    categories: item.categories ?? [],
    directRoute: index.itemRoutes?.[`${registry.name}/${item.name}`],
    patterns: index.routePatterns?.[registry.name],
  });
  if (url) return {
    url,
    level: 'pattern',
    source: 'verified-route-pattern',
  };

  return undefined;
}

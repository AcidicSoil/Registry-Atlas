import { describe, expect, it } from 'vitest';
import { resolveCatalogSourcePage } from '../../src/registry-explorer/core/catalogSourcePage';
import { queryCatalogComponents } from '../../src/registry-explorer/core/catalogQuery';
import { buildCatalogComparison } from '../../src/registry-explorer/core/catalogCompare';
import { resolveRegistryItemDetailFromCatalogIndex } from '../../src/registry-explorer/core/registryItemDetail';
import type { Registry, RegistryCatalogIndex } from '../../src/registry-explorer/core/registry.schema';
import { sourcePageNavigation } from '../../src/registry-explorer/ui/sourcePageLink';

const hirael: Registry = { name: '@hirael', url: 'https://hirael.com/',
  description: 'Hirael', itemSummaries: [] };
const other: Registry = { name: '@other', url: 'https://other.example/',
  description: 'Other', itemSummaries: [] };
const akor = { name: 'akor', type: 'registry:block', kind: 'template' as const };
const catalog: RegistryCatalogIndex = {
  meta: { registry_count: 2, item_count: 2 },
  registries: { '@hirael': [akor], '@other': [akor] },
  sourcePages: {
    '@hirael/akor': {
      url: 'https://hirael.com/templates/akor',
      level: 'pattern', source: 'verified-route-pattern',
    },
  },
};

describe('source links across catalog surfaces', () => {
  it('retains exact known upstream pages with their evidence levels', () => {
    expect(resolveCatalogSourcePage(catalog, hirael, akor)).toMatchObject({
      url: 'https://hirael.com/templates/akor',
      level: 'pattern',
    });
    expect(sourcePageNavigation(hirael.url, {
      sourcePage: resolveCatalogSourcePage(catalog, hirael, akor),
    })?.url).toBe('https://hirael.com/templates/akor');
  });

  it('never borrows a different item or registry source URL', () => {
    expect(resolveCatalogSourcePage(catalog, other, akor)).toBeUndefined();
    const spaceui: Registry = { name: '@spaceui', url: 'https://www.spaceui.one/',
      description: 'SpaceUI', itemSummaries: [] };
    const demo = { name: 'demo-p-aspect-ratio-03', type: 'registry:ui',
      categories: ['aspect-ratio'] };
    const index: RegistryCatalogIndex = { ...catalog, sourcePages: {
      ...catalog.sourcePages,
      '@spaceui/primitives-aspect-ratio': {
        url: 'https://www.spaceui.one/primitives/aspect-ratio',
        level: 'sitemap', source: 'official-sitemap',
      },
    } };
    expect(resolveCatalogSourcePage(index, spaceui, demo)).toBeUndefined();
  });

  it('prefers the exact source-page record over an alternative route pattern', () => {
    const index: RegistryCatalogIndex = { ...catalog, routePatterns: {
      '@hirael': [{ urlTemplate: 'https://hirael.com/blocks/{slug}',
        slugPrefix: '', source: 'official-sitemap' }],
    } };
    expect(resolveCatalogSourcePage(index, hirael, akor)?.url)
      .toBe('https://hirael.com/templates/akor');
  });

  it('resolves the same source on listings, item details, and comparisons', () => {
    const components = queryCatalogComponents([hirael, other], catalog, {
      registryNames: ['@hirael'],
    }).items;
    const detail = resolveRegistryItemDetailFromCatalogIndex(
      [hirael, other], catalog, '@hirael', 'akor',
    ).detail;
    const cell = buildCatalogComparison([hirael, other], catalog,
      ['@hirael', '@other']).rows[0]?.cells[0];
    expect(components[0]?.sourcePage?.url).toBe('https://hirael.com/templates/akor');
    expect(detail?.sourcePage?.url).toBe(components[0]?.sourcePage?.url);
    expect(cell?.sourcePage?.url).toBe(components[0]?.sourcePage?.url);
    expect(cell?.routeKind).toBe('template');
    expect(cell?.routePath).toBe('/Registry-Atlas/@hirael/templates/akor');
  });

  it('falls back to the exact known item route, not registry homepage or JSON', () => {
    const index: RegistryCatalogIndex = { ...catalog, sourcePages: {},
      itemRoutes: { '@other/akor': {
        url: 'https://other.example/templates/akor', status: 'pattern-observed',
      } } };
    expect(resolveCatalogSourcePage(index, other, akor)).toMatchObject({
      url: 'https://other.example/templates/akor', level: 'pattern',
    });
    const invalid: RegistryCatalogIndex = { ...index, itemRoutes: {
      '@other/akor': { url: 'https://other.example/r/akor.json',
        status: 'pattern-observed' },
    } };
    expect(resolveCatalogSourcePage(invalid, other, akor)).toBeUndefined();
  });

  it('does not claim individual pages when only a source collection is known', () => {
    const seven: Registry = { name: '@7ovr', url: 'https://7ovr.com/',
      description: '7ovr', itemSummaries: [] };
    const index: RegistryCatalogIndex = { meta: { registry_count: 1, item_count: 1 },
      registries: { '@7ovr': [{ name: 'stats-4', type: 'registry:block',
        categories: ['stats'], rawItemUrl: 'https://7ovr.com/r/stats-4.json' }] } };
    expect(resolveCatalogSourcePage(index, seven, index.registries['@7ovr']![0]!))
      .toBeUndefined();
  });
});

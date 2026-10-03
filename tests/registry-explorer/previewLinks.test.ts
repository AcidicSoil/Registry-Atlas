import { describe, expect, it } from 'vitest';
import { queryCatalogComponents } from '../../src/registry-explorer/core/catalogQuery';
import { resolveRegistryItemDetailFromCatalogIndex, resolveRegistryItemDetailFromSummary } from '../../src/registry-explorer/core/registryItemDetail';
import { renderItemDetailView } from '../../src/registry-explorer/ui/itemDetailView';
import { renderCatalogComponentCard } from '../../src/registry-explorer/ui/catalogComponentsView';
import type { Registry, RegistryCatalogIndex } from '../../src/registry-explorer/core/registry.schema';

describe('preview and component page links', () => {
  it('carries the exact manifest URL and image from the catalog through both card and detail', () => {
    const registry = registryFixture();
    const officialPage = 'https://delta.example/docs/components/code-block';
    const imageUrl = '/Registry-Atlas/data/previews/delta/code-block.jpg';
    const index: RegistryCatalogIndex = {
      meta: { registry_count: 1, item_count: 1 },
      registries: { '@delta': [{ name: 'code-block', title: 'Code Block', type: 'registry:ui' }] },
      visualReferences: {
        '@delta/code-block': { officialPage, imageUrl },
      },
    };
    const [component] = queryCatalogComponents([registry], index).items;
    expect(component?.visualReference).toEqual({officialPage,imageUrl});
    expect(renderCatalogComponentCard(component!)).toContain(`href="${officialPage}"`);
    expect(renderCatalogComponentCard(component!)).toContain(`src="${imageUrl}"`);
    const detail = resolveRegistryItemDetailFromCatalogIndex([registry], index, '@delta', 'code-block');
    expect(detail.detail?.componentPageUrl).toBe(officialPage);
    const body = {innerHTML:''} as HTMLElement;
    renderItemDetailView({innerHTML:''} as HTMLElement,body,detail,new Set());
    expect(body.innerHTML).toContain(`src="${imageUrl}"`);
    expect(body.innerHTML).toContain(`href="${officialPage}"`);
  });

  it('keeps preview URLs distinct from component documentation URLs', () => {
    const registry = registryFixture();
    const previewUrl = 'https://delta.example/preview.png';
    const componentPageUrl = 'https://delta.example/components/code-block';
    const index: RegistryCatalogIndex = {
      meta: { registry_count: 1, item_count: 1 },
      registries: {
        '@delta': [{ name: 'code-block', title: 'Code Block', type: 'registry:ui', categories: ['code'] }],
      },
    };

    const [component] = queryCatalogComponents([registry], index, { search: 'code block' }).items;
    const result = resolveRegistryItemDetailFromSummary([registry], '@delta', 'code-block');
    const body = { innerHTML: '' } as HTMLElement;

    expect(component?.previewUrl).toBe(previewUrl);
    expect(component?.docsUrl).toBe(componentPageUrl);
    expect(component?.docsUrl).not.toBe(previewUrl);
    expect(result.detail?.componentPageUrl).toBe(componentPageUrl);
    expect(result.detail?.componentPageUrl).not.toBe(previewUrl);

    renderItemDetailView({ innerHTML: '' } as HTMLElement, body, result, new Set());

    expect(body.innerHTML).not.toContain('Open preview');
    expect(body.innerHTML).not.toContain(`href="${previewUrl}"`);
    expect(body.innerHTML).not.toContain('Visit source documentation');
    expect(body.innerHTML).not.toContain(`href="${componentPageUrl}"`);
    expect(body.innerHTML).not.toContain(`href="${previewUrl}" class="secondary-link"`);
  });
});

function registryFixture(): Registry {
  return {
    name: '@delta',
    url: 'https://delta.example',
    description: 'Delta registry fixture.',
    atlas: {
      aliases: [],
      coverageStatus: 'verified',
      confidence: 'high',
      notes: 'Fixture notes.',
      catalogStatus: 'available',
    },
    mirror: {
      officialName: '@delta',
      registryUrlTemplate: 'https://delta.example/r/{name}.json',
      sourceUrl: 'https://ui.shadcn.com/r/registries.json',
      syncedAt: '2026-06-27T00:00:00.000Z',
      upstreamCount: 1,
      localCount: 1,
      warnings: [],
    },
    itemSummaries: [{
      name: 'Code Block',
      slug: 'code-block',
      title: 'Code Block',
      description: 'Syntax highlighted code block.',
      type: 'registry:ui',
      category: 'code',
      source: 'registry-json',
      provenance: 'fixture',
      catalogStatus: 'available',
      confidence: 'high',
      routeEligible: true,
      rawItemUrl: 'https://delta.example/r/code-block.json',
      docsUrl: 'https://delta.example/components/code-block',
      previewUrl: 'https://delta.example/preview.png',
    }],
  };
}

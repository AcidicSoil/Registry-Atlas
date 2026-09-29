import { describe, expect, it } from 'vitest';
import {
  resolveRegistryItemDetailFromCatalogIndex,
  resolveRegistryItemDetailFromSummary,
} from '../../src/registry-explorer/core/registryItemDetail';
import {
  loadRegistryItemDetail,
  loadRegistryItemDetailFromCatalogIndex,
} from '../../src/registry-explorer/data/loadRegistryItemDetail';
import type { Registry } from '../../src/registry-explorer/core/registry.schema';

describe('registry item detail', () => {
  it('resolves a route-eligible summary into a summary-only component detail', () => {
    const result = resolveRegistryItemDetailFromSummary([registryFixture()], '@delta', 'code-block');

    expect(result).toEqual(expect.objectContaining({ status: 'summary-only' }));
    expect(result.detail).toEqual(expect.objectContaining({
      namespace: '@delta',
      slug: 'code-block',
      title: 'Code Block',
      componentPageUrl: 'https://delta.example/components/code-block',
      loadedFromJson: false,
    }));
    expect(result.detail?.installAction.status).toBe('enabled');
    expect(result.detail?.installAction.status === 'enabled' ? result.detail.installAction.token : null).toBe('@delta/code-block');
    expect(result.detail?.installAction.status === 'enabled' ? result.detail.installAction.inspectCommand : null).toBe('npx shadcn@latest view @delta/code-block');
    expect(result.detail?.installAction.status === 'enabled' ? result.detail.installAction.installCommand : null).toBe('npx shadcn@latest add @delta/code-block');
  });

  it('resolves indexed-only catalog items through the existing detail contract', () => {
    const result = resolveRegistryItemDetailFromCatalogIndex(
      [registryFixture()],
      {
        meta: { registry_count: 1, item_count: 1 },
        registries: { '@delta': [{ name: 'catalog-only', type: 'registry:ui' }] },
      },
      '@delta',
      'catalog-only',
    );

    expect(result.status).toBe('summary-only');
    expect(result.detail?.slug).toBe('catalog-only');
    expect(result.detail?.installAction.status).toBe('enabled');
  });

  it('loads raw JSON lazily for indexed-only catalog items', async () => {
    const result = await loadRegistryItemDetailFromCatalogIndex(
      [registryFixture()],
      {
        meta: { registry_count: 1, item_count: 1 },
        registries: { '@delta': [{ name: 'catalog-only', type: 'registry:ui' }] },
      },
      '@delta',
      'catalog-only',
      async () => jsonResponse({
        name: 'catalog-only',
        title: 'Catalog Only Loaded',
        description: 'Loaded from the real item route.',
        type: 'registry:ui',
        dependencies: ['react'],
        files: [{ path: 'registry/catalog-only.tsx', type: 'registry:ui' }],
      }),
    );

    expect(result.status).toBe('loaded');
    expect(result.detail).toEqual(expect.objectContaining({
      slug: 'catalog-only',
      title: 'Catalog Only Loaded',
      description: 'Loaded from the real item route.',
      loadedFromJson: true,
      dependencies: ['react'],
    }));
  });

  it('loads indexed detail from the same-origin registry bundle before the raw route', async () => {
    const seen: string[] = [];
    const result = await loadRegistryItemDetailFromCatalogIndex(
      [registryFixture()],
      {
        meta: { registry_count: 1, item_count: 1 },
        registries: { '@delta': [{ name: 'catalog-only', type: 'registry:ui' }] },
      },
      '@delta',
      'catalog-only',
      async (input) => {
        seen.push(String(input));
        if (String(input).includes('/data/registry-item-details/delta.json')) {
          return jsonResponse([{
            name: 'catalog-only',
            title: 'Same-origin detail',
            type: 'registry:ui',
            dependencies: ['react'],
            files: [{ path: 'registry/catalog-only.tsx', type: 'registry:ui' }],
          }]);
        }
        throw new Error('raw route must not be fetched');
      },
    );

    expect(result.status).toBe('loaded');
    expect(result.detail?.title).toBe('Same-origin detail');
    expect(seen).toHaveLength(1);
    expect(seen[0]).toContain('/data/registry-item-details/delta.json');
  });

  it('loads explicit author and structured css variables from safe detail JSON', async () => {
    const result = await loadRegistryItemDetailFromCatalogIndex(
      [registryFixture()],
      {
        meta: { registry_count: 1, item_count: 1 },
        registries: { '@delta': [{
          name: 'midnight',
          type: 'registry:theme',
          author: 'Ada Example',
          themePreview: { dark: { background: '#000000' } },
        }] },
      },
      '@delta',
      'midnight',
      async () => jsonResponse({
        name: 'midnight',
        type: 'registry:theme',
        author: 'Ada Example',
        cssVars: {
          light: { background: '#ffffff', primary: '#111111' },
          dark: { background: '#000000', foreground: '#ffffff' },
        },
      }),
    );

    expect(result.status).toBe('loaded');
    expect(result.detail).toEqual(expect.objectContaining({
      author: 'Ada Example',
      cssVars: {
        light: { background: '#ffffff', primary: '#111111' },
        dark: { background: '#000000', foreground: '#ffffff' },
      },
    }));
  });

  it('does not mislabel registry JSON as a component page when docs are absent', () => {
    const registry = registryFixture();
    const routeOnlyRegistry: Registry = {
      ...registry,
      itemSummaries: registry.itemSummaries?.map(item => item.slug === 'code-block'
        ? { ...item, docsUrl: undefined }
        : item),
    };

    const result = resolveRegistryItemDetailFromSummary([routeOnlyRegistry], '@delta', 'code-block');

    expect(result.detail?.componentPageUrl).toBeNull();
  });

  it('loads and normalizes valid registry item JSON without making raw data required for UI', async () => {
    const result = await loadRegistryItemDetail([registryFixture()], '@delta', 'code-block', async () => jsonResponse({
      name: 'code-block',
      title: 'Code Block JSON Title',
      description: 'Loaded from item JSON.',
      type: 'registry:ui',
      dependencies: ['shiki'],
      devDependencies: ['typescript'],
      registryDependencies: ['button'],
      files: [{ path: 'registry/code-block.tsx', type: 'registry:ui', target: 'components/code-block.tsx' }],
    }));

    expect(result.status).toBe('loaded');
    expect(result.detail?.title).toBe('Code Block JSON Title');
    expect(result.detail?.dependencies).toEqual(['shiki']);
    expect(result.detail?.devDependencies).toEqual(['typescript']);
    expect(result.detail?.registryDependencies).toEqual(['button']);
    expect(result.detail?.files).toEqual([{ path: 'registry/code-block.tsx', type: 'registry:ui', target: 'components/code-block.tsx' }]);
    expect(result.detail?.rawSource).toBeDefined();
  });

  it('returns explicit not-found states for missing registry and item', () => {
    expect(resolveRegistryItemDetailFromSummary([registryFixture()], '@missing', 'code-block')).toEqual(expect.objectContaining({
      status: 'not-found',
      reason: 'missing-registry',
    }));
    expect(resolveRegistryItemDetailFromSummary([registryFixture()], '@delta', 'missing')).toEqual(expect.objectContaining({
      status: 'not-found',
      reason: 'missing-item',
    }));
  });

  it('returns route-unavailable for route-ineligible summaries', () => {
    const result = resolveRegistryItemDetailFromSummary([registryFixture()], '@delta', 'manual-card');

    expect(result).toEqual(expect.objectContaining({ status: 'route-unavailable' }));
    expect(result.detail?.installAction).toEqual(expect.objectContaining({
      status: 'disabled',
      token: null,
    }));
  });

  it('returns fetch-error when item JSON cannot be fetched', async () => {
    const result = await loadRegistryItemDetail([registryFixture()], '@delta', 'code-block', async () => {
      throw new TypeError('Failed to fetch');
    });

    expect(result).toEqual(expect.objectContaining({ status: 'fetch-error' }));
    expect(result.detail?.slug).toBe('code-block');
  });

  it('returns invalid-json when response JSON parsing fails', async () => {
    const result = await loadRegistryItemDetail([registryFixture()], '@delta', 'code-block', async () => ({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => { throw new SyntaxError('bad json'); },
    } as unknown as Response));

    expect(result).toEqual(expect.objectContaining({ status: 'invalid-json' }));
  });

  it('returns invalid-schema when registry item shape is unsafe', async () => {
    const result = await loadRegistryItemDetail([registryFixture()], '@delta', 'code-block', async () => jsonResponse({
      name: 'code-block',
      files: [{ path: 'registry/code-block.tsx' }],
    }));

    expect(result).toEqual(expect.objectContaining({
      status: 'invalid-schema',
      reason: 'file-missing-path-or-type',
    }));
  });
});

function jsonResponse(data: unknown): Response {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    json: async () => data,
  } as Response;
}

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
      upstreamCount: 2,
      localCount: 2,
      warnings: [],
    },
    itemSummaries: [
      {
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
        dependencies: ['shiki'],
        files: [{ path: 'registry/code-block.tsx', type: 'registry:ui', target: 'components/code-block.tsx' }],
      },
      {
        name: 'Manual Card',
        slug: 'manual-card',
        source: 'known-catalog',
        provenance: 'fixture',
        catalogStatus: 'partial',
        routeEligible: false,
      },
    ],
  };
}

import { describe, expect, it } from 'vitest';
import {
  resolveRegistryItemDetailFromSummary,
} from '../../src/registry-explorer/core/registryItemDetail';
import { loadRegistryItemDetail } from '../../src/registry-explorer/data/loadRegistryItemDetail';
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
    } as Response));

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
    primary_focus: ['code-and-markdown'],
    component_tags: ['code-block', 'card'],
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
        componentTagsProposed: ['code-block'],
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

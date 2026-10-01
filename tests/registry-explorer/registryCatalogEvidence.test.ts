import { describe, expect, it } from 'vitest';
// @ts-ignore Executable Node .mjs script has no TypeScript declaration file.
import { buildCatalogCoverageFacts, buildCatalogEvidence, buildCompactCatalogItems, buildRegistryItemDetailBundle, classifyCatalogFailureReason, deriveCatalogUrl, deriveCatalogUrls, DISCOVERABLE_REGISTRY_ITEM_TYPES, mergeCatalogEvidence, mergeCatalogItems, syncCatalogEvidenceForRegistries } from '../../scripts/sync-registry-catalog-evidence.mjs';

describe('registry catalog evidence sync', () => {
  it('promotes real catalog availability without synthesizing taxonomy tags', () => {
    const atlas = buildCatalogCoverageFacts(
      { coverage_status: 'unverified', confidence: 'unknown' },
      [],
      {
        namespace: '@example',
        catalog_url: 'https://example.com/r/registry.json',
        item_count: 2,
        status: 'available',
      },
    );

    expect(atlas).toEqual({
      coverage_status: 'verified',
      confidence: 'high',
      comparison_evidence: 'catalog',
      catalog_item_count: 2,
      catalog_evidence_url: 'https://example.com/r/registry.json',
    });
    expect(atlas).not.toHaveProperty('component_tags');
  });

  it('derives the standard registry catalog URL from an item URL template', () => {
    expect(deriveCatalogUrl('https://example.com/r/{name}.json')).toBe('https://example.com/r/registry.json');
    expect(deriveCatalogUrl('https://example.com/r/{name}')).toBe('https://example.com/r/registry');
    expect(deriveCatalogUrl('https://example.com/r/{style}/{name}.json')).toBe('https://example.com/r/registry.json');
    expect(deriveCatalogUrl('https://example.com/r/button.json')).toBeNull();
  });

  it('derives bounded style-aware registry catalog candidates', () => {
    expect(deriveCatalogUrls('https://example.com/r/{style}/{name}.json')).toEqual([
      'https://example.com/r/registry.json',
      'https://example.com/r/new-york-v4/registry.json',
      'https://example.com/r/new-york/registry.json',
      'https://example.com/r/default/registry.json',
    ]);
  });

  it('falls through style candidates until a real registry catalog is found', async () => {
    const seen: string[] = [];
    const result = await syncCatalogEvidenceForRegistries([
      { name: '@style', url: 'https://example.com/r/{style}/{name}.json' },
    ], {
      concurrency: 1,
      timeoutMs: 1000,
      fetchImpl: async (url: string | URL | Request) => {
        seen.push(String(url));
        if (String(url).includes('/new-york-v4/')) {
          return new Response(JSON.stringify({
            items: [{ name: 'button', type: 'registry:ui' }],
          }), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          });
        }
        return new Response('missing', { status: 404 });
      },
    });

    expect(seen).toEqual([
      'https://example.com/r/registry.json',
      'https://example.com/r/new-york-v4/registry.json',
    ]);
    expect(result.report.failure_count).toBe(0);
    expect(result.itemsByNamespace['@style']).toEqual([
      { name: 'button', type: 'registry:ui' },
    ]);
  });

  it('classifies catalog failures for maintenance reporting', () => {
    expect(classifyCatalogFailureReason('http-404')).toBe('catalog-root-unavailable');
    expect(classifyCatalogFailureReason('http-429')).toBe('transient-network');
    expect(classifyCatalogFailureReason('timeout')).toBe('transient-network');
    expect(classifyCatalogFailureReason('network-error')).toBe('transient-network');
    expect(classifyCatalogFailureReason('invalid-json')).toBe('invalid-response');
    expect(classifyCatalogFailureReason('http-403')).toBe('access-restricted');
  });

  it('builds catalog evidence without inferred component vocabulary or source payloads', () => {
    const evidence = buildCatalogEvidence(
      '@example',
      'https://example.com/r/{name}.json',
      {
        name: 'example',
        items: [
          { name: 'button', title: 'Button', description: 'A button control.', type: 'registry:ui' },
          { name: 'input', title: 'Input', files: [{ path: 'input.tsx', content: 'large source payload' }] },
        ],
      },
      '2026-08-27T00:00:00.000Z',
    );

    expect(evidence).toEqual({
      namespace: '@example',
      catalog_url: 'https://example.com/r/registry.json',
      item_count: 2,
      status: 'available',
      synced_at: '2026-08-27T00:00:00.000Z',
    });
    expect(JSON.stringify(evidence)).not.toContain('large source payload');
    expect(evidence).not.toHaveProperty('component_tags');
  });

  it('syncs exact compact items and coverage evidence from the supplied directory snapshot', async () => {
    const fetchImpl = async (url: string) => new Response(JSON.stringify({
      name: 'example',
      items: [{ name: url.includes('alpha') ? 'button' : 'input', type: 'registry:ui' }],
    }), { status: 200, headers: { 'content-type': 'application/json' } });

    const result = await syncCatalogEvidenceForRegistries([
      { name: '@alpha', url: 'https://alpha.example/r/{name}.json' },
      { name: '@beta', url: 'https://beta.example/r/{name}.json' },
    ], { fetchImpl, concurrency: 2, timeoutMs: 1000, previous: {} });

    expect(result.report.registry_count).toBe(2);
    expect(result.report.fetched_catalog_count).toBe(2);
    expect(result.itemsByNamespace['@alpha']).toEqual([{ name: 'button', type: 'registry:ui' }]);
    expect(result.itemsByNamespace['@beta']).toEqual([{ name: 'input', type: 'registry:ui' }]);
    expect(result.evidence['@alpha']).not.toHaveProperty('component_tags');
    expect(result.evidence['@beta']).not.toHaveProperty('component_tags');
  });

  it('keeps only user-facing registry item types in the compact catalog index', () => {
    expect(DISCOVERABLE_REGISTRY_ITEM_TYPES).toEqual([
      'registry:block',
      'registry:component',
      'registry:ui',
      'registry:page',
      'registry:item',
      'registry:style',
      'registry:theme',
      'registry:icon',
    ]);

    expect(buildCompactCatalogItems({ items: [
      { name: 'hero-grid', title: 'Hero Grid', type: 'registry:block', categories: ['marketing'] },
      { name: 'button', type: 'registry:ui', category: 'forms' },
      { name: 'theme', type: 'registry:theme' },
      { name: 'icons', type: 'registry:icon', category: 'icons' },
      { name: 'helpers', type: 'registry:lib' },
    ] })).toEqual([
      { name: 'hero-grid', title: 'Hero Grid', type: 'registry:block', categories: ['marketing'] },
      { name: 'button', type: 'registry:ui', categories: ['forms'] },
      { name: 'theme', type: 'registry:theme' },
      { name: 'icons', type: 'registry:icon', categories: ['icons'] },
    ]);
  });

  it('promotes bounded native compact metadata and structured theme swatches', () => {
    const longDescription = 'd'.repeat(320);
    const longAuthor = 'a'.repeat(140);
    const items = buildCompactCatalogItems({ items: [{
      name: 'midnight',
      title: 'Midnight',
      description: longDescription,
      author: longAuthor,
      type: 'registry:theme',
      categories: ['dark'],
      files: [{ path: 'theme.ts', type: 'registry:theme', content: 'must not leak' }],
      cssVars: {
        light: { background: '#ffffff', primary: '#111111', radius: '1rem' },
        dark: { background: '#000000', foreground: '#ffffff', custom: 'ignore-me' },
      },
    }] });

    expect(items).toEqual([{
      name: 'midnight',
      title: 'Midnight',
      description: 'd'.repeat(280),
      author: 'a'.repeat(120),
      type: 'registry:theme',
      categories: ['dark'],
      fileCount: 1,
      themePreview: {
        light: { background: '#ffffff', primary: '#111111' },
        dark: { background: '#000000', foreground: '#ffffff' },
      },
    }]);
    expect(JSON.stringify(items)).not.toContain('must not leak');
    expect(JSON.stringify(items)).not.toContain('radius');
    expect(JSON.stringify(items)).not.toContain('custom');
  });

  it('builds a safe same-origin detail bundle without source file contents', () => {
    expect(buildRegistryItemDetailBundle({ items: [{
      name: 'accordion',
      title: 'Accordion',
      description: 'Expandable sections.',
      type: 'registry:ui',
      categories: ['navigation'],
      dependencies: ['react'],
      devDependencies: ['typescript'],
      registryDependencies: ['button'],
      files: [{
        path: 'registry/accordion.tsx',
        type: 'registry:ui',
        target: 'components/accordion.tsx',
        content: 'source must not be persisted',
      }],
    }] })).toEqual([{
      name: 'accordion',
      title: 'Accordion',
      description: 'Expandable sections.',
      type: 'registry:ui',
      categories: ['navigation'],
      dependencies: ['react'],
      devDependencies: ['typescript'],
      registryDependencies: ['button'],
      files: [{
        path: 'registry/accordion.tsx',
        type: 'registry:ui',
        target: 'components/accordion.tsx',
      }],
    }]);
  });

  it('preserves failed compact-item namespaces and replaces successfully refreshed ones', () => {
    const previous = {
      '@alpha': [{ name: 'old-alpha', type: 'registry:ui' }],
      '@beta': [{ name: 'old-beta', type: 'registry:ui' }],
    };
    const fresh = {
      '@beta': [{ name: 'new-beta', type: 'registry:block' }],
    };

    expect(mergeCatalogItems(previous, fresh, [{ namespace: '@alpha', reason: 'http-429' }])).toEqual({
      '@alpha': [{ name: 'old-alpha', type: 'registry:ui' }],
      '@beta': [{ name: 'new-beta', type: 'registry:block' }],
    });
  });

  it('preserves prior evidence on transient failure while scrubbing retired taxonomy fields', () => {
    const previous = {
      '@example': {
        namespace: '@example',
        catalog_url: 'https://example.com/r/registry.json',
        item_count: 12,
        status: 'available',
        synced_at: '2026-08-26T00:00:00.000Z',
      },
    };

    const merged = mergeCatalogEvidence(previous, {}, [{ namespace: '@example', reason: 'http-429' }]);
    expect(merged['@example']).toEqual({
      namespace: '@example',
      catalog_url: 'https://example.com/r/registry.json',
      item_count: 12,
      status: 'stale',
      synced_at: '2026-08-26T00:00:00.000Z',
    });
  });
});

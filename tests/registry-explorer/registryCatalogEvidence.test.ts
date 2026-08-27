import { describe, expect, it } from 'vitest';
import { COMPONENT_TAG_VALUES } from '../../src/registry-explorer/core/registry.schema';
// @ts-expect-error The synchronizer is an executable Node .mjs script with runtime exports tested here.
import { applyCatalogEvidenceToAtlas, buildCatalogEvidence, COMPONENT_TAGS, deriveCatalogUrl, inferComponentTagsFromCatalogItems, mergeCatalogEvidence, syncCatalogEvidenceForRegistries } from '../../scripts/sync-registry-catalog-evidence.mjs';

describe('registry catalog evidence sync', () => {
  it('keeps the sync capability vocabulary aligned with the runtime schema', () => {
    expect(COMPONENT_TAGS).toEqual([...COMPONENT_TAG_VALUES]);
  });

  it('promotes fetched catalog capability evidence without claiming verified item coverage', () => {
    const atlas = applyCatalogEvidenceToAtlas(
      { component_tags: [], coverage_status: 'unverified', confidence: 'unknown' },
      [],
      { component_tags: ['button', 'input'], status: 'available' },
    );

    expect(atlas.component_tags).toEqual(['button', 'input']);
    expect(atlas.coverage_status).toBe('inferred');
    expect(atlas.confidence).toBe('medium');
    expect(atlas.comparison_evidence).toBe('catalog');
    expect(atlas.catalog_item_count).toBe(0);
  });

  it('derives the standard registry catalog URL from an item URL template', () => {
    expect(deriveCatalogUrl('https://example.com/r/{name}.json')).toBe('https://example.com/r/registry.json');
    expect(deriveCatalogUrl('https://example.com/r/{name}')).toBe('https://example.com/r/registry');
    expect(deriveCatalogUrl('https://example.com/r/{style}/{name}.json')).toBeNull();
    expect(deriveCatalogUrl('https://example.com/r/button.json')).toBeNull();
  });

  it('infers component capabilities from real catalog item identity fields', () => {
    const tags = inferComponentTagsFromCatalogItems([
      { name: 'button', type: 'registry:ui' },
      { name: 'fancy-code-block', title: 'Fancy Code Block', type: 'registry:component' },
      { name: 'qrcode', title: 'QR Code', type: 'registry:ui' },
      { name: 'unrelated-template', title: 'Landing template', type: 'registry:block' },
    ]);

    expect(tags).toEqual(expect.arrayContaining(['button', 'code-block', 'qr-code']));
    expect(tags).not.toContain('table');
  });

  it('builds compact comparable evidence instead of persisting full catalog items', () => {
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

    expect(evidence).toEqual(expect.objectContaining({
      namespace: '@example',
      catalog_url: 'https://example.com/r/registry.json',
      item_count: 2,
      component_tags: expect.arrayContaining(['button', 'input']),
      status: 'available',
    }));
    expect(JSON.stringify(evidence)).not.toContain('large source payload');
  });

  it('syncs catalog evidence from the same supplied directory snapshot', async () => {
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
    expect(result.evidence['@alpha'].component_tags).toContain('button');
    expect(result.evidence['@beta'].component_tags).toContain('input');
  });

  it('preserves prior evidence when a later network sync fails', () => {
    const previous = {
      '@example': {
        namespace: '@example',
        catalog_url: 'https://example.com/r/registry.json',
        item_count: 12,
        component_tags: ['button'],
        status: 'available',
        synced_at: '2026-08-26T00:00:00.000Z',
      },
    };

    const merged = mergeCatalogEvidence(previous, {}, [{ namespace: '@example', reason: 'http-429' }]);
    expect(merged['@example']).toEqual(expect.objectContaining({
      item_count: 12,
      component_tags: ['button'],
      status: 'stale',
    }));
  });
});

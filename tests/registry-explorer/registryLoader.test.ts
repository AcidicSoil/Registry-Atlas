import { describe, expect, it } from 'vitest';
import { loadRegistries } from '../../src/registry-explorer/data/loadRegistries';

describe('loadRegistries', () => {
  it('fetches the runtime mirror from the Vite base path', async () => {
    const calls: string[] = [];
    const fetchImpl = async (input: RequestInfo | URL) => {
      calls.push(String(input));
      return jsonResponse(String(input).endsWith('registry-catalog-items.json')
        ? createCatalogIndex()
        : createMirror());
    };

    await loadRegistries(fetchImpl);

    expect(calls).toEqual([
      '/data/registries.json',
      '/data/registry-catalog-items.json',
      '/data/component-previews.json',
    ]);
  });

  it('converts normalized mirror records into display registries', async () => {
    const data = await loadRegistries(fetchFixture());

    expect(data.registries).toEqual([
      expect.objectContaining({
        name: '@example',
        url: 'https://example.com',
        description: 'Example registry.',
        atlas: {
          aliases: ['example-ui'],
          coverageStatus: 'inferred',
          confidence: 'medium',
          notes: 'Fixture notes',
          catalogStatus: 'partial',
          comparisonEvidence: 'catalog',
          catalogItemCount: 2,
          catalogEvidenceUrl: 'https://example.com/r/registry.json',
        },
        itemSummaries: [
          expect.objectContaining({
            slug: 'button',
            source: 'known-catalog',
            provenance: 'fixture',
            rawItemUrl: 'https://example.com/r/button.json',
            evidenceUrl: 'https://example.com/r/registry.json',
            registryDependencies: ['card'],
            dependencies: ['lucide-react'],
            files: [{ path: 'registry/button.tsx', type: 'registry:ui', target: 'components/button.tsx' }],
          }),
          expect.objectContaining({ slug: 'card', source: 'known-catalog', provenance: 'fixture' }),
        ],
        mirror: {
          officialName: '@example',
          registryUrlTemplate: 'https://example.com/r/{name}.json',
          sourceUrl: 'https://ui.shadcn.com/r/registries.json',
          syncedAt: '2026-05-25T17:28:25.832Z',
          upstreamCount: 1,
          localCount: 1,
          warnings: [],
        },
      }),
    ]);

    expect(data.registries[0]?.framework).toBeUndefined();
    expect(data.registries[0]?.license).toBeUndefined();
    expect(data.registries[0]?.itemSummaries?.[0]?.previewUrl).toBe(
      'https://example.com/previews/button.png',
    );
  });

  it('preserves mirror metadata and validation warnings separately', async () => {
    const data = await loadRegistries(fetchFixture(createMirror({
      homepage: 'http://example.com',
    })));

    expect(data.meta.source_url).toBe('https://ui.shadcn.com/r/registries.json');
    expect(data.meta.upstream_count).toBe(1);
    expect(data.warnings.map(warning => warning.code)).toEqual(['url-http']);
  });

  it('ignores retired inferred taxonomy fields from older mirrors', async () => {
    const mirror = createMirror() as any;
    mirror.registries[0].atlas.primary_focus = ['support'];
    mirror.registries[0].atlas.component_tags = ['button'];
    const data = await loadRegistries(fetchFixture(mirror));

    expect(data.registries[0]).not.toHaveProperty('primary_focus');
    expect(data.registries[0]).not.toHaveProperty('component_tags');
  });

  it('throws when the runtime mirror cannot be fetched', async () => {
    await expect(loadRegistries(async () => ({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    } as Response))).rejects.toThrow('Registry mirror fetch failed');
  });

  it('throws when runtime mirror validation fails', async () => {
    await expect(loadRegistries(fetchFixture(createMirror({
      name: 'example',
    })))).rejects.toThrow('Registry mirror validation failed');
  });

  it('ignores unsupported compact-index item types', async () => {
    const catalog = createCatalogIndex();
    catalog.registries['@example'].push({
      name: 'helpers',
      title: 'Helpers',
      type: 'registry:lib',
      categories: ['internal'],
    });
    const data = await loadRegistries(fetchFixture(createMirror(), catalog));

    expect(data.catalogIndex.registries['@example']).toHaveLength(1);
    expect(data.catalogIndex.registries['@example']?.[0]?.name).toBe('command-palette-pro');
  });

  it('rejects compact-index metadata count mismatches', async () => {
    const catalog = createCatalogIndex();
    catalog.meta.item_count = 2;

    await expect(loadRegistries(fetchFixture(createMirror(), catalog)))
      .rejects.toThrow('Registry catalog index validation failed');
  });

  it('throws when the compact catalog index is malformed', async () => {
    await expect(loadRegistries(fetchFixture(createMirror(), {
      meta: { item_count: 1 },
      registries: {
        '@example': [{ name: '', type: 'registry:ui' }],
      },
    }))).rejects.toThrow('Registry catalog index validation failed');
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

function fetchFixture(mirror: unknown = createMirror(), catalog: unknown = createCatalogIndex()) {
  return async (input: RequestInfo | URL) => jsonResponse(
    String(input).endsWith('registry-catalog-items.json') ? catalog : mirror,
  );
}

function createCatalogIndex() {
  return {
    meta: {
      source_url: 'https://ui.shadcn.com/r/registries.json',
      synced_at: '2026-09-28T00:00:00.000Z',
      registry_count: 1,
      item_count: 1,
    },
    registries: {
      '@example': [
        { name: 'command-palette-pro', title: 'Command Palette Pro', type: 'registry:ui', categories: ['navigation'] },
      ],
    },
  };
}

function createMirror(options: {
  name?: string;
  homepage?: string;
  registryUrlTemplate?: string;
} = {}) {
  return {
    meta: {
      source_url: 'https://ui.shadcn.com/r/registries.json',
      synced_at: '2026-05-25T17:28:25.832Z',
      upstream_count: 1,
      registry_count: 1,
      local_count: 1,
      validation_status: 'not_run',
      report_path: 'data/shadcn/sync-report.json',
    },
    registries: [
      {
        official: {
          name: options.name ?? '@example',
          homepage: options.homepage ?? 'https://example.com',
          registry_url_template: options.registryUrlTemplate ?? 'https://example.com/r/{name}.json',
          description: 'Example registry.',
        },
        atlas: {
          aliases: ['example-ui'],
          coverage_status: 'inferred',
          confidence: 'medium',
          notes: 'Fixture notes',
          catalog_status: 'partial',
          comparison_evidence: 'catalog',
          catalog_item_count: 2,
          catalog_evidence_url: 'https://example.com/r/registry.json',
          item_summaries: [
            {
              name: 'Button',
              slug: 'button',
              source: 'known-catalog',
              provenance: 'fixture',
              catalog_status: 'available',
              route_eligible: true,
              preview_url: 'https://example.com/previews/button.png',
              raw_item_url: 'https://example.com/r/button.json',
              evidence_url: 'https://example.com/r/registry.json',
              dependencies: ['lucide-react'],
              registryDependencies: ['card'],
              files: [{ path: 'registry/button.tsx', type: 'registry:ui', target: 'components/button.tsx' }],
            },
            {
              name: 'Card',
              slug: 'card',
              source: 'known-catalog',
              provenance: 'fixture',
              catalog_status: 'partial',
              route_eligible: true,
            },
          ],
        },
        status: {
          warnings: [],
        },
      },
    ],
  };
}

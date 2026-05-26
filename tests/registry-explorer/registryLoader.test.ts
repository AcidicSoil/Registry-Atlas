import { describe, expect, it } from 'vitest';
import { loadRegistries } from '../../src/registry-explorer/data/loadRegistries';

describe('loadRegistries', () => {
  it('fetches the runtime mirror from the Vite base path', async () => {
    const calls: string[] = [];
    const fetchImpl = async (input: RequestInfo | URL) => {
      calls.push(String(input));
      return jsonResponse(createMirror());
    };

    await loadRegistries(fetchImpl);

    expect(calls).toEqual(['/data/registries.json']);
  });

  it('converts normalized mirror records into display registries', async () => {
    const data = await loadRegistries(async () => jsonResponse(createMirror()));

    expect(data.registries).toEqual([
      expect.objectContaining({
        name: '@example',
        url: 'https://example.com',
        description: 'Example registry.',
        primary_focus: ['support'],
        component_tags: ['button'],
        framework: 'React',
        license: 'Community',
        atlas: {
          aliases: ['example-ui'],
          coverageStatus: 'inferred',
          confidence: 'medium',
          notes: 'Fixture notes',
          catalogStatus: 'partial',
        },
        itemSummaries: [
          expect.objectContaining({ slug: 'button', source: 'known-catalog', provenance: 'fixture' }),
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
  });

  it('preserves mirror metadata and validation warnings separately', async () => {
    const data = await loadRegistries(async () => jsonResponse(createMirror({
      homepage: 'http://example.com',
    })));

    expect(data.meta.source_url).toBe('https://ui.shadcn.com/r/registries.json');
    expect(data.meta.upstream_count).toBe(1);
    expect(data.warnings.map(warning => warning.code)).toEqual(['url-http']);
  });

  it('handles empty Atlas enrichment arrays without throwing', async () => {
    const data = await loadRegistries(async () => jsonResponse(createMirror({
      primaryFocus: [],
      componentTags: [],
    })));

    expect(data.registries[0]?.primary_focus).toEqual([]);
    expect(data.registries[0]?.component_tags).toEqual([]);
  });

  it('throws when the runtime mirror cannot be fetched', async () => {
    await expect(loadRegistries(async () => ({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    } as Response))).rejects.toThrow('Registry mirror fetch failed');
  });

  it('throws when runtime mirror validation fails', async () => {
    await expect(loadRegistries(async () => jsonResponse(createMirror({
      name: 'example',
    })))).rejects.toThrow('Registry mirror validation failed');
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

function createMirror(options: {
  name?: string;
  homepage?: string;
  registryUrlTemplate?: string;
  primaryFocus?: string[];
  componentTags?: string[];
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
          primary_focus: options.primaryFocus ?? ['support'],
          component_tags: options.componentTags ?? ['button'],
          aliases: ['example-ui'],
          coverage_status: 'inferred',
          confidence: 'medium',
          notes: 'Fixture notes',
          catalog_status: 'partial',
          item_summaries: [
            {
              name: 'Button',
              slug: 'button',
              source: 'known-catalog',
              provenance: 'fixture',
              catalog_status: 'available',
              route_eligible: true,
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

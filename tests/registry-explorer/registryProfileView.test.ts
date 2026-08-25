import { describe, expect, it } from 'vitest';
import { buildRegistryProfile } from '../../src/registry-explorer/core/registryProfile';
import type { Registry } from '../../src/registry-explorer/core/registry.schema';
import { renderRegistryProfile } from '../../src/registry-explorer/ui/registryProfileView';
import { buildCatalogFacetGroups } from '../../src/registry-explorer/core/catalogFacets';

describe('renderRegistryProfile', () => {
  it('shows source and known-item facts without legacy Focus wording', () => {
    const registry = fixture();
    const header = root();
    const body = root();
    renderRegistryProfile(header, body, buildRegistryProfile(registry), new Set(), buildCatalogFacetGroups([registry], []));

    expect(header.innerHTML).toContain('@delta');
    expect(body.innerHTML).toContain('Official shadcn facts');
    expect(body.innerHTML).toContain('Known items');
    expect(body.innerHTML).toContain('Code Block');
    expect(body.innerHTML).toContain('View details');
    expect(body.innerHTML).not.toContain('Focus tags');
    expect(body.innerHTML).not.toContain('high confidence');
    expect(body.innerHTML).toContain('data-facet-add-dimension');
    expect(body.innerHTML).not.toContain('data-filter-add-dimension');
    expect(header.innerHTML).toContain('data-copy-current-url');
  });
});

function root(): HTMLElement {
  return { innerHTML: '' } as HTMLElement;
}

function fixture(): Registry {
  return {    name: '@delta',
    url: 'https://delta.example',
    description: 'Delta registry fixture.',
    primary_focus: ['support'],
    component_tags: ['code-block'],
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
      type: 'registry:ui',
      category: 'code',
      componentTagsProposed: ['code-block'],
      source: 'fixture',
      provenance: 'fixture',
      catalogStatus: 'available',
      routeEligible: true,
    }],
  };
}

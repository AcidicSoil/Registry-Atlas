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
    expect(body.innerHTML).toContain('Quick preview');
    expect(body.innerHTML).toContain('data-component-peek-id="@delta:code-block"');
    expect(body.innerHTML).toContain('View details');
    expect(body.innerHTML).not.toContain('Focus tags');
    expect(body.innerHTML).not.toContain('high confidence');
    expect(body.innerHTML).toContain('data-facet-add-dimension');
    expect(body.innerHTML).not.toContain('data-filter-add-dimension');
    expect(header.innerHTML).toContain('data-copy-current-url data-copy-label="Profile link copied"');
  });

  it('preserves enabled shell action contracts with exact values', () => {
    const body = root();

    renderRegistryProfile(body, body, buildRegistryProfile(fixture()), new Set());

    expect(body.innerHTML).toContain('data-copy-command="npx shadcn@latest add @delta/code-block"');
    expect(body.innerHTML).toContain('data-copy-command="npx shadcn@latest view @delta/code-block"');
    expect(body.innerHTML).toContain('data-queue-add="@delta/code-block"');
    expect(body.innerHTML).toContain('data-queue-label="Code Block"');
    expect(body.innerHTML).toContain('data-queue-registry="@delta"');
    expect(body.innerHTML).toContain('data-queue-item="code-block"');
    expect(body.innerHTML).toContain('data-queue-install="npx shadcn@latest add @delta/code-block"');
    expect(body.innerHTML).toContain('data-queue-inspect="npx shadcn@latest view @delta/code-block"');
    expect(body.innerHTML).toContain('data-queue-route="https://delta.example/r/code-block.json"');
    expect(body.innerHTML).toContain('data-view-item-registry="@delta"');
    expect(body.innerHTML).toContain('data-view-item-slug="code-block"');
    expect(body.innerHTML).not.toContain('install-actions-disabled');
    expect(body.innerHTML).not.toMatch(/<button[^>]+disabled/);
    expect(body.innerHTML).toContain('Copy install');
    expect(body.innerHTML).toContain('Inspect first');
    expect(body.innerHTML).toContain('Add to queue');
    expect(body.innerHTML).toContain('Quick preview');
    expect(body.innerHTML).toContain('View details');
  });

  it('exposes selected facet options and removal labels', () => {
    const registry = fixture();
    const header = root();
    const body = root();
    renderRegistryProfile(
      header,
      body,
      buildRegistryProfile(registry),
      new Set(),
      buildCatalogFacetGroups([registry], []),
      [{ dimension: 'component', value: 'code-block', label: 'Code Block' }],
    );

    expect(body.innerHTML).toContain('data-facet-add-value="code-block" aria-pressed="true"');
    expect(body.innerHTML).toContain('aria-label="Remove Code Block filter"');
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

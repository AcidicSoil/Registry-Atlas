import { describe, expect, it } from 'vitest';
import {
  applyComponentFiltersToCandidates,
  applyComponentFiltersToProfileRows,
  buildComponentFilterGroups,
  createSelectedComponentFilter,
} from '../../src/registry-explorer/core/componentFilters';
import { searchComponentCandidates } from '../../src/registry-explorer/core/discovery';
import { buildRegistryProfile } from '../../src/registry-explorer/core/registryProfile';
import type { Registry } from '../../src/registry-explorer/core/registry.schema';

describe('componentFilters', () => {
  it('derives type/category/tag/visual/status options from loaded item summaries', () => {
    const groups = buildComponentFilterGroups(registriesFixture());

    expect(groups.find(group => group.dimension === 'type')?.options.map(option => option.value)).toContain('registry:ui');
    expect(groups.find(group => group.dimension === 'category')?.options.map(option => option.value)).toContain('code');
    expect(groups.find(group => group.dimension === 'tag')?.options.map(option => option.value)).toContain('code-block');
    expect(groups.find(group => group.dimension === 'visual')?.options.map(option => option.value)).toContain('available');
    expect(groups.find(group => group.dimension === 'status')?.options.map(option => option.value)).toContain('available');
  });

  it('applies item type filters to discovery candidates', () => {
    const registries = registriesFixture();
    const groups = buildComponentFilterGroups(registries);
    const selected = createSelectedComponentFilter(groups, 'type', 'registry:ui');
    const candidates = searchComponentCandidates(registries, '');

    expect(selected).not.toBeNull();
    const filtered = applyComponentFiltersToCandidates(candidates, selected ? [selected] : []);

    expect(filtered.map(candidate => candidate.itemSlug)).toEqual(['code-block', 'button']);
  });

  it('applies item type filters to registry profile rows', () => {
    const registry = registriesFixture()[0];
    const groups = buildComponentFilterGroups([registry]);
    const selected = createSelectedComponentFilter(groups, 'type', 'registry:block');
    const rows = buildRegistryProfile(registry).sections.find(section => section.items)?.items ?? [];

    expect(selected).not.toBeNull();
    const filtered = applyComponentFiltersToProfileRows(rows, selected ? [selected] : []);

    expect(filtered.map(row => row.slug)).toEqual(['hero']);
  });
});

function registriesFixture(): Registry[] {
  return [
    registryFixture('@delta', [
      { name: 'Code Block', slug: 'code-block', type: 'registry:ui', category: 'code', tag: 'code-block', previewUrl: 'https://delta.example/code-block.png' },
      { name: 'Hero', slug: 'hero', type: 'registry:block', category: 'marketing', tag: 'hero-section' },
    ]),
    registryFixture('@gamma', [
      { name: 'Button', slug: 'button', type: 'registry:ui', category: 'forms', tag: 'button' },
    ]),
  ];
}

function registryFixture(
  name: string,
  items: Array<{ name: string; slug: string; type: string; category: string; tag: string; previewUrl?: string }>,
): Registry {
  return {
    name,
    url: `https://${name.slice(1)}.example`,
    description: `${name} fixture.`,
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
      officialName: name,
      registryUrlTemplate: `https://${name.slice(1)}.example/r/{name}.json`,
      sourceUrl: 'https://ui.shadcn.com/r/registries.json',
      syncedAt: '2026-06-27T00:00:00.000Z',
      upstreamCount: 1,
      localCount: 1,
      warnings: [],
    },
    itemSummaries: items.map(item => ({
      name: item.name,
      slug: item.slug,
      title: item.name,
      description: `${item.name} description.`,
      type: item.type,
      category: item.category,
      componentTagsProposed: [item.tag],
      source: 'registry-json',
      provenance: 'fixture',
      catalogStatus: 'available',
      confidence: 'high',
      routeEligible: true,
      rawItemUrl: `https://${name.slice(1)}.example/r/${item.slug}.json`,
      docsUrl: `https://${name.slice(1)}.example/${item.slug}`,
      previewUrl: item.previewUrl,
    })),
  };
}

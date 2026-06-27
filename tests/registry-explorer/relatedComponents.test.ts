import { describe, expect, it } from 'vitest';
import { buildRelatedComponents } from '../../src/registry-explorer/core/relatedComponents';
import type { Registry } from '../../src/registry-explorer/core/registry.schema';

describe('relatedComponents', () => {
  it('returns metadata-similar items and excludes the current item', () => {
    const related = buildRelatedComponents(registriesFixture(), { registryName: '@delta', itemSlug: 'code-block' });

    expect(related.map(item => item.id)).not.toContain('@delta:code-block');
    expect(related[0]).toMatchObject({ id: '@gamma:code-snippet' });
    expect(related[0].matchReasons).toContain('Shared type');
    expect(related[0].matchReasons).toContain('Shared category');
  });

  it('does not emit quality ranking copy', () => {
    const related = buildRelatedComponents(registriesFixture(), { registryName: '@delta', itemSlug: 'code-block' });
    const text = JSON.stringify(related).toLowerCase();

    expect(text).not.toContain('best');
    expect(text).not.toContain('better');
    expect(text).not.toContain('production-grade');
    expect(text).not.toContain('approved');
    expect(text).not.toContain('audited');
  });
});

function registriesFixture(): Registry[] {
  return [
    registryFixture('@delta', [
      { name: 'Code Block', slug: 'code-block', type: 'registry:ui', category: 'code', tag: 'code-block' },
      { name: 'Hero', slug: 'hero', type: 'registry:block', category: 'marketing', tag: 'hero-section' },
    ]),
    registryFixture('@gamma', [
      { name: 'Code Snippet', slug: 'code-snippet', type: 'registry:ui', category: 'code', tag: 'code-block', previewUrl: 'https://gamma.example/snippet.png' },
      { name: 'Calendar', slug: 'calendar', type: 'registry:ui', category: 'date', tag: 'calendar' },
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
    itemSummaries: items.map(item => ({
      name: item.name,
      slug: item.slug,
      title: item.name,
      type: item.type,
      category: item.category,
      componentTagsProposed: [item.tag],
      source: 'registry-json',
      provenance: 'fixture',
      catalogStatus: 'available',
      routeEligible: true,
      previewUrl: item.previewUrl,
      docsUrl: `https://${name.slice(1)}.example/${item.slug}`,
    })),
  };
}

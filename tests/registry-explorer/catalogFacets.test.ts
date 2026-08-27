import { describe, expect, it } from 'vitest';
import {
  applyCatalogFacetsToCandidates,
  applyCatalogFacetsToProfileRows,
  buildCatalogFacetGroups,
  buildRegistryFacetGroups,
  createSelectedCatalogFacet,
} from '../../src/registry-explorer/core/catalogFacets';
import type { SelectedCatalogFacet } from '../../src/registry-explorer/core/catalogFacets';
import type { ComponentCandidate, Registry } from '../../src/registry-explorer/core/registry.schema';

describe('catalog facets', () => {
  it('builds exactly the Category, Component, and Registry groups', () => {
    const { registries, candidates } = fixtures();
    const groups = buildCatalogFacetGroups(registries, candidates);

    expect(groups.map(group => group.dimension)).toEqual(['category', 'component', 'registry']);
    expect(groups.map(group => group.label)).toEqual(['Category', 'Component', 'Registry']);
    expect(groups.map(group => group.dimension)).not.toEqual(expect.arrayContaining([
      'type',
      'tag',
      'visual',
      'status',
    ]));
    expect(groups.find(group => group.dimension === 'component')?.options.map(option => option.value))
      .toEqual(expect.arrayContaining(['button', 'input', 'table']));
  });

  it('applies OR semantics within a facet and AND semantics across facets', () => {
    const { registries, candidates } = fixtures();
    const selected = [
      facet('component', 'button'),
      facet('component', 'input'),
      facet('registry', '@delta'),
    ];

    const result = applyCatalogFacetsToCandidates(candidates, selected);

    expect(result.map(item => item.id)).toEqual([
      '@delta:button',
      '@delta:input',
    ]);
    expect(createSelectedCatalogFacet(
      buildCatalogFacetGroups(registries, candidates),
      'component',
      'button',
    )).toEqual({ dimension: 'component', value: 'button', label: 'Button' });
  });

  it('builds registry facets from one browse row per registry, including item-only tags', () => {
    const itemOnly = registryFixture('@item-only', ['forms-and-inputs'], [
      { name: 'Button', slug: 'button', tag: 'button' },
      { name: 'Table', slug: 'table', tag: 'table' },
    ]);
    itemOnly.component_tags = ['button'];

    const groups = buildRegistryFacetGroups([itemOnly], '', []);
    const componentOptions = groups.find(group => group.dimension === 'component')?.options ?? [];
    const categoryOptions = groups.find(group => group.dimension === 'category')?.options ?? [];
    const registryOptions = groups.find(group => group.dimension === 'registry')?.options ?? [];

    expect(componentOptions.find(option => option.value === 'button')?.count).toBe(1);
    expect(componentOptions.find(option => option.value === 'table')?.count).toBe(1);
    expect(categoryOptions.find(option => option.value === 'forms-and-inputs')?.count).toBe(1);
    expect(registryOptions.find(option => option.value === '@item-only')?.count).toBe(1);
  });

  it('keeps selected registry options when global search removes their browse row', () => {
    const { registries } = fixtures();
    const selected = [facet('registry', '@gamma')];

    const groups = buildRegistryFacetGroups(registries, '@delta', selected);
    const options = groups.find(group => group.dimension === 'registry')?.options ?? [];

    expect(options.find(option => option.value === '@gamma')).toMatchObject({ count: 1 });
  });

  it('uses OR semantics within profile dimensions and AND semantics across dimensions', () => {
    const rows = [
      { taxonomyTagLabels: ['Button'], taxonomyCategoryLabels: ['Forms & Inputs'] },
      { taxonomyTagLabels: ['Input'], taxonomyCategoryLabels: ['Forms & Inputs'] },
      { taxonomyTagLabels: ['Button'], taxonomyCategoryLabels: ['Data Display'] },
    ] as unknown as Parameters<typeof applyCatalogFacetsToProfileRows>[0];

    const result = applyCatalogFacetsToProfileRows(rows, [
      facet('component', 'button'),
      facet('component', 'input'),
      facet('category', 'forms-and-inputs'),
    ]);

    expect(result).toHaveLength(2);
  });

  it('does not expose or match raw type, preview, or catalog status metadata', () => {
    const { candidates } = fixtures();

    expect(applyCatalogFacetsToCandidates(candidates, [facet('component', 'registry:ui')])).toEqual([]);
    expect(applyCatalogFacetsToCandidates(candidates, [facet('component', 'available')])).toEqual([]);
  });
});

function facet(dimension: SelectedCatalogFacet['dimension'], value: string): SelectedCatalogFacet {
  return { dimension, value, label: value };
}

function fixtures(): { registries: Registry[]; candidates: ComponentCandidate[] } {
  const delta = registryFixture('@delta', ['forms-and-inputs'], [
    { name: 'Button', slug: 'button', tag: 'button' },
    { name: 'Input', slug: 'input', tag: 'input' },
  ]);
  const gamma = registryFixture('@gamma', ['dashboards-and-admin'], [
    { name: 'Button', slug: 'button', tag: 'button' },
    { name: 'Table', slug: 'table', tag: 'table' },
  ]);

  return {
    registries: [delta, gamma],
    candidates: [
      candidateFixture(delta, 'button', 'Button'),
      candidateFixture(delta, 'input', 'Input'),
      candidateFixture(gamma, 'button', 'Button'),
      candidateFixture(gamma, 'table', 'Table'),
    ],
  };
}

function candidateFixture(registry: Registry, slug: string, label: string): ComponentCandidate {
  return {
    id: `${registry.name}:${slug}`,
    registry,
    matchedLabel: label,
    matchedField: 'item',
    itemName: label,
    itemSlug: slug,
    itemType: 'registry:ui',
    previewUrl: 'https://example.com/preview.png',
    catalogStatus: 'available',
    routeEligible: true,
    installAction: {
      status: 'disabled',
      token: null,
      installCommand: null,
      inspectCommand: null,
      route: null,
      disabledReason: 'Fixture action.',
    },
    matchReasons: [],
    coverageStatus: 'verified',
    coverageLabel: 'Verified item',
    confidence: 'high',
    score: 1,
    warnings: [],
  };
}

function registryFixture(
  name: string,
  primary_focus: Registry['primary_focus'],
  items: Array<{ name: string; slug: string; tag: string }>,
): Registry {
  return {
    name,
    url: `https://${name.slice(1)}.example`,
    description: `${name} fixture.`,
    primary_focus,
    component_tags: items.map(item => item.tag) as Registry['component_tags'],
    itemSummaries: items.map(item => ({
      name: item.name,
      slug: item.slug,
      type: 'registry:ui',
      category: 'component',
      componentTagsProposed: [item.tag],
      source: 'fixture',
      provenance: 'fixture',
      catalogStatus: 'available',
      routeEligible: true,
    })),
  };
}

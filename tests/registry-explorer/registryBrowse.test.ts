import { describe, expect, it } from 'vitest';
import type { Registry } from '../../src/registry-explorer/core/registry.schema';
import { buildRegistryBrowseEntries } from '../../src/registry-explorer/core/registryBrowse';
import { renderRegistriesContent } from '../../src/registry-explorer/ui/registriesView';

describe('registry browser', () => {
  it('searches registries and derives real item counts', () => {
    const entries = buildRegistryBrowseEntries(registries(), 'delta', []);
    expect(entries.map(entry => entry.registry.name)).toEqual(['@delta']);
    expect(entries[0]).toMatchObject({ knownItemCount: 2, routeEligibleItemCount: 1, coverageStatus: 'verified' });
  });

  it('filters by concrete component content and sorts namespace A-Z', () => {
    const entries = buildRegistryBrowseEntries(registries(), '', [
      { dimension: 'component', value: 'button', label: 'Button' },
    ]);
    expect(entries.map(entry => entry.registry.name)).toEqual(['@alpha', '@delta']);
    expect(entries.every(entry => entry.components.includes('button'))).toBe(true);
  });

  it('uses OR within registry selections and AND across registry and component filters', () => {
    const registryOnly = buildRegistryBrowseEntries(registries(), '', [
      { dimension: 'registry', value: '@alpha', label: '@alpha' },
      { dimension: 'registry', value: '@delta', label: '@delta' },
    ]);
    expect(registryOnly.map(entry => entry.registry.name)).toEqual(['@alpha', '@delta']);

    const narrowed = buildRegistryBrowseEntries(registries(), '', [
      { dimension: 'registry', value: '@alpha', label: '@alpha' },
      { dimension: 'registry', value: '@delta', label: '@delta' },
      { dimension: 'component', value: 'input', label: 'Input' },
    ]);
    expect(narrowed.map(entry => entry.registry.name)).toEqual(['@delta']);
  });

  it('renders source facts without legacy Focus or fabricated metadata', () => {
    const body = root();
    renderRegistriesContent(root(), body, buildRegistryBrowseEntries(registries(), '', []), [], []);
    expect(body.innerHTML).toContain('@delta');
    expect(body.innerHTML).toContain('Delta registry');
    expect(body.innerHTML).toContain('2 known items');    expect(body.innerHTML).toContain('Verified item');
    expect(body.innerHTML).toContain('View registry');
    expect(body.innerHTML).not.toContain('Focus');
    expect(body.innerHTML).not.toContain('React');
    expect(body.innerHTML).not.toContain('Community');
  });

  it('exposes selected facet options and removal labels', () => {
    const body = root();
    renderRegistriesContent(
      root(),
      body,
      buildRegistryBrowseEntries(registries(), '', []),
      [
        { dimension: 'component', label: 'Component', options: [{ dimension: 'component', value: 'button', label: 'Button', count: 2 }] },
        { dimension: 'registry', label: 'Registry', options: [{ dimension: 'registry', value: '@delta', label: '@delta', count: 1 }] },
      ],
      [{ dimension: 'component', value: 'button', label: 'Button' }],
    );

    expect(body.innerHTML).toMatch(/data-facet-add-value="button"[\s\S]*?aria-pressed="true"/);
    expect(body.innerHTML).toContain('aria-label="Remove Button filter"');
    expect(body.innerHTML).toContain('<details');

    renderRegistriesContent(
      root(),
      body,
      buildRegistryBrowseEntries(registries(), '', [
        { dimension: 'registry', value: '@delta', label: '@delta' },
      ]),
      [{ dimension: 'registry', label: 'Registry', options: [{ dimension: 'registry', value: '@delta', label: '@delta', count: 1 }] }],
      [{ dimension: 'registry', value: '@delta', label: '@delta' }],
    );
    expect(body.innerHTML).toContain('@delta');
    expect(body.innerHTML).not.toContain('@alpha');
    expect(body.innerHTML).toContain('aria-pressed="true"');
  });
});

function root(): HTMLElement { return { innerHTML: '' } as HTMLElement; }

function registries(): Registry[] {
  return [
    registry('@delta', 'Delta registry', 'verified', ['button', 'input'], 2, 1),
    registry('@alpha', 'Alpha registry', 'inferred', ['button'], 1, 1),
    registry('@zeta', 'Zeta registry', 'unverified', ['table'], 1, 0),
  ];
}

function registry(
  name: string,
  description: string,
  coverageStatus: 'verified' | 'inferred' | 'unverified',
  componentTags: Registry['component_tags'],
  itemCount: number,
  eligibleCount: number,
): Registry {  return {
    name,
    url: `https://${name.slice(1)}.example`,
    description,
    primary_focus: ['forms-and-inputs'],
    component_tags: componentTags,
    atlas: {
      aliases: [],
      coverageStatus,
      confidence: 'medium',
      notes: '',
      catalogStatus: coverageStatus === 'verified' ? 'available' : 'partial',
    },
    itemSummaries: Array.from({ length: itemCount }, (_, index) => ({
      name: `Item ${index + 1}`,
      slug: `item-${index + 1}`,
      componentTagsExisting: [componentTags[index % componentTags.length] ?? componentTags[0]],
      source: 'fixture',
      provenance: 'fixture',
      catalogStatus: 'available' as const,
      routeEligible: index < eligibleCount,
    })),
  };
}

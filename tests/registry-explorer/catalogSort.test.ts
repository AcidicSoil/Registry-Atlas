import { describe, expect, it } from 'vitest';
import { sortCatalogCandidates } from '../../src/registry-explorer/core/catalogSort';
import type { ComponentCandidate, Registry } from '../../src/registry-explorer/core/registry.schema';

describe('catalog sort', () => {
  it('keeps relevance in discovery order and returns a new array', () => {
    const candidates = [candidateFixture('@gamma', 'Table', 'table'), candidateFixture('@delta', 'Button', 'button')];

    const result = sortCatalogCandidates(candidates, 'relevance');

    expect(result.map(candidate => candidate.id)).toEqual(candidates.map(candidate => candidate.id));
    expect(result).not.toBe(candidates);
  });

  it('sorts by matched name, then registry namespace, then item slug', () => {
    const candidates = [
      candidateFixture('@gamma', 'Table', 'table'),
      candidateFixture('@gamma', 'Button', 'z-button'),
      candidateFixture('@delta', 'Button', 'a-button'),
      candidateFixture('@delta', 'Input', 'input'),
    ];

    expect(sortCatalogCandidates(candidates, 'name').map(candidate => candidate.matchedLabel)).toEqual([
      'Button',
      'Button',
      'Input',
      'Table',
    ]);
    expect(sortCatalogCandidates(candidates, 'name').map(candidate => candidate.id)).toEqual([
      '@delta:a-button',
      '@gamma:z-button',
      '@delta:input',
      '@gamma:table',
    ]);
  });
});

function candidateFixture(registryName: string, matchedLabel: string, itemSlug: string): ComponentCandidate {
  const registry: Registry = {
    name: registryName,
    url: `https://${registryName.slice(1)}.example`,
    description: 'Fixture registry.',
    primary_focus: ['support'],
    component_tags: ['button'],
  };

  return {
    id: `${registryName}:${itemSlug}`,
    registry,
    matchedLabel,
    matchedField: 'item',
    itemSlug,
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

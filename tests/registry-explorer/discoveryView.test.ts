import { describe, expect, it } from 'vitest';
import type { ComponentCandidate, DiscoveryOverview, Registry } from '../../src/registry-explorer/core/registry.schema';
import { renderDiscoveryContent } from '../../src/registry-explorer/ui/discoveryView';

describe('renderDiscoveryContent', () => {
  it('renders filter controls and avoids prominent confidence copy', () => {
    const header = root();
    const body = root();

    renderDiscoveryContent(header, body, [candidateFixture()], overviewFixture(), '', null, new Set(), [
      { dimension: 'type', label: 'Type', options: [{ dimension: 'type', value: 'registry:ui', label: 'registry:ui', count: 1 }] },
    ], []);

    expect(body.innerHTML).toContain('+ Filter');
    expect(body.innerHTML).toContain('registry:ui');
    expect(body.innerHTML).toContain('View component');
    expect(body.innerHTML).not.toContain('high confidence');
  });

  it('renders selected filter badges and reset copy', () => {
    const header = root();
    const body = root();

    renderDiscoveryContent(header, body, [], overviewFixture(), 'button', null, new Set(), [
      { dimension: 'type', label: 'Type', options: [{ dimension: 'type', value: 'registry:ui', label: 'registry:ui', count: 1 }] },
    ], [{ dimension: 'type', value: 'registry:ui', label: 'registry:ui' }]);

    expect(body.innerHTML).toContain('Type: registry:ui');
    expect(body.innerHTML).toContain('Reset filters');
    expect(body.innerHTML).toContain('No components match these filters. Reset filters to see all results.');
  });
});

function root(): HTMLElement {
  return { innerHTML: '' } as HTMLElement;
}

function overviewFixture(): DiscoveryOverview {
  return {
    totalRegistries: 1,
    knownItemCount: 1,
    routeEligibleItemCount: 1,
    verifiedRegistryCount: 1,
    unverifiedRegistryCount: 0,
  };
}

function candidateFixture(): ComponentCandidate {
  return {
    id: '@delta:code-block',
    registry: registryFixture(),
    matchedLabel: 'Code Block',
    matchedField: 'item',
    itemName: 'Code Block',
    itemSlug: 'code-block',
    itemType: 'registry:ui',
    itemCategory: 'code',
    itemDescription: 'Syntax highlighted code block.',
    taxonomyTagLabels: ['Code block'],
    taxonomyCategoryLabels: ['Data display'],
    statusDisplayLabel: 'catalog-backed',
    statusExplanation: 'Registry Atlas has a concrete catalog item for this result.',
    docsUrl: 'https://delta.example/components/code-block',
    componentPageUrl: 'https://delta.example/components/code-block',
    catalogStatus: 'available',
    routeEligible: true,
    route: 'https://delta.example/r/code-block.json',
    installAction: {
      status: 'disabled',
      token: null,
      installCommand: null,
      inspectCommand: null,
      route: null,
      disabledReason: 'Fixture action disabled.',
    },
    matchReasons: ['Known item summary match'],
    coverageStatus: 'verified',
    coverageLabel: 'Verified coverage',
    confidence: 'high',
    score: 1,
    warnings: [],
  };
}

function registryFixture(): Registry {
  return {
    name: '@delta',
    url: 'https://delta.example',
    description: 'Delta registry fixture.',
    primary_focus: ['support'],
    component_tags: ['code-block'],
  };
}

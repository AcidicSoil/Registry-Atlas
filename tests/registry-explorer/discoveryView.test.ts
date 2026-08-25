import { describe, expect, it } from 'vitest';
import type {
  ComponentCandidate,
  DiscoveryOverview,
  Registry,
} from '../../src/registry-explorer/core/registry.schema';
import type { CatalogFacetGroup } from '../../src/registry-explorer/core/catalogFacets';
import { renderDiscoveryContent } from '../../src/registry-explorer/ui/discoveryView';

describe('renderDiscoveryContent', () => {
  it('renders the approved catalog facets and sort controls', () => {
    const header = root();
    const body = root();

    renderDiscoveryContent(header, body, [candidateFixture()], overviewFixture(), {
      searchTerm: '',
      facetGroups: facetGroups(),
      selectedFacets: [],
      sort: 'relevance',
      queuedTokens: new Set(),
      activePeekId: null,
    });

    expect(body.innerHTML).toContain('Category');
    expect(body.innerHTML).toContain('Component');
    expect(body.innerHTML).toContain('Registry');
    expect(body.innerHTML).toContain('Relevance');    expect(body.innerHTML).toContain('Name A-Z');
    expect(body.innerHTML).toContain('View details');
    expect(body.innerHTML).not.toContain('Type');
    expect(body.innerHTML).not.toContain('Visual');
    expect(body.innerHTML).not.toContain('Status');
  });

  it('renders selected facet chips and Clear all', () => {
    const body = root();
    renderDiscoveryContent(root(), body, [candidateFixture()], overviewFixture(), {
      searchTerm: 'button',
      facetGroups: facetGroups(),
      selectedFacets: [{ dimension: 'component', value: 'button', label: 'Button' }],
      sort: 'name',
      queuedTokens: new Set(),
      activePeekId: null,
    });

    expect(body.innerHTML).toContain('Button');
    expect(body.innerHTML).toContain('Clear all');
    expect(body.innerHTML).toContain('data-facet-remove-dimension="component"');
    expect(body.innerHTML).toContain('data-facet-clear');
  });
  it('renders real previews and a neutral unavailable state', () => {
    const withPreviewBody = root();
    renderDiscoveryContent(root(), withPreviewBody, [candidateFixture('https://example.com/button.png')], overviewFixture(), {
      searchTerm: '',
      facetGroups: facetGroups(),
      selectedFacets: [],
      sort: 'relevance',
      queuedTokens: new Set(),
      activePeekId: null,
    });
    expect(withPreviewBody.innerHTML).toContain('<img');
    expect(withPreviewBody.innerHTML).toContain('https://example.com/button.png');

    const withoutPreviewBody = root();
    renderDiscoveryContent(root(), withoutPreviewBody, [candidateFixture()], overviewFixture(), {
      searchTerm: '',
      facetGroups: facetGroups(),
      selectedFacets: [],
      sort: 'relevance',
      queuedTokens: new Set(),
      activePeekId: null,
    });
    expect(withoutPreviewBody.innerHTML).toContain('Preview unavailable');
    expect(withoutPreviewBody.innerHTML).not.toContain('<svg');
  });

  it('offers a current URL copy action for discovery state', () => {
    const header = root();
    renderDiscoveryContent(header, root(), [candidateFixture()], overviewFixture(), {
      searchTerm: 'button', facetGroups: [], selectedFacets: [], sort: 'relevance', queuedTokens: new Set(), activePeekId: null,
    });
    expect(header.innerHTML).toContain('data-copy-current-url');
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

function facetGroups(): CatalogFacetGroup[] {
  return [
    { dimension: 'category', label: 'Category', options: [{ dimension: 'category', value: 'developer-tools', label: 'Developer Tools', count: 1 }] },
    { dimension: 'component', label: 'Component', options: [{ dimension: 'component', value: 'code-block', label: 'Code Block', count: 1 }] },
    { dimension: 'registry', label: 'Registry', options: [{ dimension: 'registry', value: '@delta', label: '@delta', count: 1 }] },
  ];
}
function candidateFixture(previewUrl?: string): ComponentCandidate {
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
    previewUrl,
    componentPageUrl: previewUrl ?? 'https://delta.example/components/code-block',
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

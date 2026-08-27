import { describe, expect, it } from 'vitest';
import type {
  ComponentCandidate,
  Registry,
} from '../../src/registry-explorer/core/registry.schema';
import type { CatalogFacetGroup } from '../../src/registry-explorer/core/catalogFacets';
import { renderDiscoveryContent } from '../../src/registry-explorer/ui/discoveryView';

describe('renderDiscoveryContent', () => {
  it('renders the approved catalog facets and sort controls', () => {
    const header = root();
    const body = root();

    renderDiscoveryContent(header, body, [candidateFixture()], {
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
    expect(body.innerHTML).not.toContain('Quick preview');
    expect(body.innerHTML).not.toContain('data-component-peek-id="@delta:code-block"');
    expect(body.innerHTML).toContain('View details');
    expect(body.innerHTML).not.toContain('Type');
    expect(body.innerHTML).not.toContain('Visual');
    expect(body.innerHTML).not.toContain('Status');
  });

  it('renders selected facet chips and Clear all', () => {
    const body = root();
    renderDiscoveryContent(root(), body, [candidateFixture()], {
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

  it('exposes selected facet options and removal labels', () => {
    const body = root();
    renderDiscoveryContent(root(), body, [candidateFixture()], {
      searchTerm: '',
      facetGroups: facetGroups(),
      selectedFacets: [{ dimension: 'category', value: 'developer-tools', label: 'Developer Tools' }],
      sort: 'relevance',
      queuedTokens: new Set(),
      activePeekId: null,
    });

    expect(body.innerHTML).toMatch(/data-facet-add-value="developer-tools"[\s\S]*?aria-pressed="true"/);
    expect(body.innerHTML).toContain('aria-label="Remove Developer Tools filter"');
  });
  it('renders real previews and a neutral unavailable state', () => {
    const withPreviewBody = root();
    renderDiscoveryContent(root(), withPreviewBody, [candidateFixture({ previewUrl: 'https://example.com/button.png' })], {
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
    renderDiscoveryContent(root(), withoutPreviewBody, [candidateFixture()], {
      searchTerm: '',
      facetGroups: facetGroups(),
      selectedFacets: [],
      sort: 'relevance',
      queuedTokens: new Set(),
      activePeekId: null,
    });
    expect(withoutPreviewBody.innerHTML).not.toContain('Preview unavailable');
    expect(withoutPreviewBody.innerHTML).not.toContain('discovery-preview-unavailable');
    expect(withoutPreviewBody.innerHTML).not.toContain('<svg');
  });

  it('keeps unavailable result previews compact and removes repeated safety prose', () => {
    const body = root();

    renderDiscoveryContent(root(), body, [candidateFixture()], {
      searchTerm: '',
      facetGroups: [],
      selectedFacets: [],
      sort: 'relevance',
      queuedTokens: new Set(),
      activePeekId: null,
    });

    expect(body.innerHTML).not.toContain('discovery-specimen');
    expect(body.innerHTML).not.toContain('install-safety-note');
    expect(body.innerHTML).not.toContain('Why this matched');
    expect(body.innerHTML).toContain('Copy install');
    expect(body.innerHTML).toContain('Inspect first');
    expect(body.innerHTML).toContain('Add to queue');
    expect(body.innerHTML).not.toContain('Quick preview');
    expect(body.innerHTML).toContain('View details');
  });

  it('keeps one details route when quick preview is active', () => {
    const body = root();

    renderDiscoveryContent(root(), body, [candidateFixture()], {
      searchTerm: '',
      facetGroups: [],
      selectedFacets: [],
      sort: 'relevance',
      queuedTokens: new Set(),
      activePeekId: '@delta:code-block',
    });

    expect((body.innerHTML.match(/data-view-item-registry="@delta"/g) ?? [])).toHaveLength(1);
    expect((body.innerHTML.match(/data-view-item-slug="code-block"/g) ?? [])).toHaveLength(1);
  });

  it('preserves enabled shell action contracts with exact values', () => {
    const header = root();
    const body = root();

    renderDiscoveryContent(header, body, [candidateFixture({ installEnabled: true })], {
      searchTerm: '',
      facetGroups: [],
      selectedFacets: [],
      sort: 'relevance',
      queuedTokens: new Set(),
      activePeekId: null,
    });

    expect(header.innerHTML).toContain('data-copy-current-url data-copy-label="Search link copied"');
    expect(body.innerHTML).toContain('data-copy-text="npx shadcn@latest add @delta/code-block" data-copy-label="Install command copied"');
    expect(body.innerHTML).toContain('data-copy-text="npx shadcn@latest view @delta/code-block" data-copy-label="Inspect command copied"');
    expect(body.innerHTML).toContain('data-queue-add="@delta/code-block"');
    expect(body.innerHTML).toContain('data-queue-label="Code Block"');
    expect(body.innerHTML).toContain('data-queue-registry="@delta"');
    expect(body.innerHTML).toContain('data-queue-item="code-block"');
    expect(body.innerHTML).toContain('data-queue-install="npx shadcn@latest add @delta/code-block"');
    expect(body.innerHTML).toContain('data-queue-inspect="npx shadcn@latest view @delta/code-block"');
    expect(body.innerHTML).toContain('data-queue-route="https://delta.example/r/code-block.json"');
    expect(body.innerHTML).toContain('data-view-item-registry="@delta"');
    expect(body.innerHTML).toContain('data-view-item-slug="code-block"');
    expect(body.innerHTML).toContain('data-profile-registry="@delta"');
    expect(body.innerHTML).not.toContain('install-actions-disabled');
    expect(body.innerHTML).not.toMatch(/<button[^>]+disabled/);
  });


  it('pages long result sets instead of rendering an endless card wall', () => {
    const body = root();
    const candidates = Array.from({ length: 25 }, (_, index) => candidateFixture({ itemName: `Component ${index + 1}`, itemSlug: `component-${index + 1}` }));

    renderDiscoveryContent(root(), body, candidates, {
      searchTerm: '', facetGroups: [], selectedFacets: [], sort: 'relevance', queuedTokens: new Set(), activePeekId: null, page: 1,
    });

    expect((body.innerHTML.match(/<article class="discovery-card"/g) ?? []).length).toBe(12);
    expect(body.innerHTML).toContain('Showing 1–12 of 25');
    expect(body.innerHTML).toContain('data-discovery-page="2"');
    expect(body.innerHTML).not.toContain('Component 25');
  });

  it('keeps large facet groups behind searchable bounded disclosures', () => {
    const body = root();
    const largeGroup: CatalogFacetGroup = {
      dimension: 'registry', label: 'Registry',
      options: Array.from({ length: 20 }, (_, index) => ({ dimension: 'registry' as const, value: `@registry-${index}`, label: `@registry-${index}`, count: 1 })),
    };

    renderDiscoveryContent(root(), body, [candidateFixture()], {
      searchTerm: '', facetGroups: [largeGroup], selectedFacets: [], sort: 'relevance', queuedTokens: new Set(), activePeekId: null,
    });

    expect(body.innerHTML).toContain('data-facet-group="discover:registry"');
    expect(body.innerHTML).toContain('data-facet-search="registry"');
    expect((body.innerHTML.match(/data-facet-add-value=/g) ?? []).length).toBeLessThanOrEqual(8);
    expect(body.innerHTML).not.toContain('class="active-filter-list"');
  });

  it('does not visually persist a previously opened result as selected', () => {
    const body = root();
    renderDiscoveryContent(root(), body, [candidateFixture()], {
      searchTerm: '', facetGroups: [], selectedFacets: [], sort: 'relevance', queuedTokens: new Set(), activePeekId: null,
    });
    expect(body.innerHTML).not.toContain('discovery-card selected');
  });

  it('offers a current URL copy action for discovery state', () => {
    const header = root();
    renderDiscoveryContent(header, root(), [candidateFixture()], {
      searchTerm: 'button', facetGroups: [], selectedFacets: [], sort: 'relevance', queuedTokens: new Set(), activePeekId: null,
    });
    expect(header.innerHTML).toContain('data-copy-current-url');
  });
});

function root(): HTMLElement {
  return { innerHTML: '' } as HTMLElement;
}

function facetGroups(): CatalogFacetGroup[] {
  return [
    { dimension: 'category', label: 'Category', options: [{ dimension: 'category', value: 'developer-tools', label: 'Developer Tools', count: 1 }] },
    { dimension: 'component', label: 'Component', options: [{ dimension: 'component', value: 'code-block', label: 'Code Block', count: 1 }] },
    { dimension: 'registry', label: 'Registry', options: [{ dimension: 'registry', value: '@delta', label: '@delta', count: 1 }] },
  ];
}
function candidateFixture(options: { previewUrl?: string; installEnabled?: boolean; itemName?: string; itemSlug?: string } = {}): ComponentCandidate {
  return {
    id: `@delta:${options.itemSlug ?? 'code-block'}`,
    registry: registryFixture(),
    matchedLabel: options.itemName ?? 'Code Block',
    matchedField: 'item',
    itemName: options.itemName ?? 'Code Block',
    itemSlug: options.itemSlug ?? 'code-block',
    itemType: 'registry:ui',
    itemCategory: 'code',
    itemDescription: 'Syntax highlighted code block.',
    taxonomyTagLabels: ['Code block'],
    taxonomyCategoryLabels: ['Data display'],
    statusDisplayLabel: 'catalog-backed',
    statusExplanation: 'Registry Atlas has a concrete catalog item for this result.',
    docsUrl: 'https://delta.example/components/code-block',
    previewUrl: options.previewUrl,
    componentPageUrl: 'https://delta.example/components/code-block',
    catalogStatus: 'available',
    routeEligible: true,
    route: 'https://delta.example/r/code-block.json',
    installAction: options.installEnabled
      ? {
          status: 'enabled',
          token: '@delta/code-block',
          installCommand: 'npx shadcn@latest add @delta/code-block',
          inspectCommand: 'npx shadcn@latest view @delta/code-block',
          route: 'https://delta.example/r/code-block.json',
          disabledReason: null,
        }
      : {
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

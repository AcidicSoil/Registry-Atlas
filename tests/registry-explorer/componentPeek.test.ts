import { describe, expect, it } from 'vitest';
import { buildComponentPeekFromCandidate } from '../../src/registry-explorer/core/componentPeek';
import type { ComponentCandidate, Registry } from '../../src/registry-explorer/core/registry.schema';
import { renderComponentPeek } from '../../src/registry-explorer/ui/componentPeekView';

describe('componentPeek', () => {
  it('builds a route identity from a route-eligible candidate', () => {
    const model = buildComponentPeekFromCandidate(candidateFixture({ itemSlug: 'code-block' }));

    expect(model).toMatchObject({
      id: '@delta:code-block',
      registryName: '@delta',
      itemSlug: 'code-block',
      title: 'Code Block',
    });
  });

  it('renders the minimal unavailable preview fallback', () => {
    const model = buildComponentPeekFromCandidate(candidateFixture({ previewUrl: undefined }));
    expect(model).not.toBeNull();

    const html = model ? renderComponentPeek(model) : '';

    expect(html).toContain('Preview not available yet');
    expect(html).toContain('Open component page');
    expect(html).not.toContain('Dependencies');
    expect(html).not.toContain('Files');
    expect(html).not.toContain('Raw JSON');
    expect(html).not.toContain('install-queue');
    expect(html).not.toContain('<iframe');
  });

  it('escapes title text in peek markup', () => {
    const model = buildComponentPeekFromCandidate(candidateFixture({ itemName: '<img src=x onerror=alert(1)>' }));
    expect(model).not.toBeNull();

    const html = model ? renderComponentPeek(model) : '';

    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(html).not.toContain('<img src=x onerror=alert(1)>');
  });
});

function candidateFixture(options: { itemSlug?: string; itemName?: string; previewUrl?: string } = {}): ComponentCandidate {
  return {
    id: '@delta:code-block',
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
    itemSource: 'registry-json',
    itemProvenance: 'fixture',
    rawItemUrl: 'https://delta.example/r/code-block.json',
    docsUrl: 'https://delta.example/components/code-block',
    previewUrl: options.previewUrl,
    componentPageUrl: options.previewUrl ?? 'https://delta.example/components/code-block',
    dependencyCount: 1,
    registryDependencyCount: 0,
    fileCount: 1,
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

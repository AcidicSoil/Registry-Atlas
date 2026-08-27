import { describe, expect, it } from 'vitest';
import { buildComponentPeekFromCandidate } from '../../src/registry-explorer/core/componentPeek';
import type { ComponentCandidate, Registry } from '../../src/registry-explorer/core/registry.schema';
import { renderComponentPeek } from '../../src/registry-explorer/ui/componentPeekView';

describe('componentPeek', () => {
  it('does not create a preview without a visual asset', () => {
    expect(buildComponentPeekFromCandidate(candidateFixture({ previewUrl: undefined }))).toBeNull();
  });

  it.each(['javascript:alert(1)', 'not a URL', 'https://delta.example/r/code-block.json'])(
    'rejects non-renderable preview URL %s',
    (previewUrl) => {
      expect(buildComponentPeekFromCandidate(candidateFixture({ previewUrl }))).toBeNull();
    },
  );

  it('renders a real image preview inline', () => {
    const model = buildComponentPeekFromCandidate(candidateFixture({ previewUrl: 'https://delta.example/preview.png' }));
    expect(model).not.toBeNull();
    const html = model ? renderComponentPeek(model) : '';

    expect(html).toContain('class="component-peek-inline"');
    expect(html).toContain('<img');
    expect(html).toContain('src="https://delta.example/preview.png"');
    expect(html).not.toContain('Open preview');
    expect(html).not.toContain('Preview unavailable');
    expect(html).not.toContain('.json');
    expect(html).toContain('Open component page');
  });

  it('escapes title text while rendering a real preview', () => {
    const model = buildComponentPeekFromCandidate(candidateFixture({
      itemName: '<img src=x onerror=alert(1)>',
      previewUrl: 'https://delta.example/preview.png',
    }));
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
    componentPageUrl: 'https://delta.example/components/code-block',
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

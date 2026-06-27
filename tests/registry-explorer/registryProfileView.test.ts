import { describe, expect, it } from 'vitest';
import type { RegistryProfile } from '../../src/registry-explorer/core/registry.schema';
import { renderRegistryProfile } from '../../src/registry-explorer/ui/registryProfileView';

describe('renderRegistryProfile', () => {
  it('renders profile filters and compact rows without prominent confidence copy', () => {
    const header = root();
    const body = root();

    renderRegistryProfile(header, body, profileFixture(), new Set(), [
      { dimension: 'type', label: 'Type', options: [{ dimension: 'type', value: 'registry:ui', label: 'registry:ui', count: 1 }] },
    ], [{ dimension: 'type', value: 'registry:ui', label: 'registry:ui' }]);

    expect(body.innerHTML).toContain('+ Filter');
    expect(body.innerHTML).toContain('Type: registry:ui');
    expect(body.innerHTML).toContain('View component');
    expect(body.innerHTML).not.toContain('high confidence');
  });
});

function root(): HTMLElement {
  return { innerHTML: '' } as HTMLElement;
}

function profileFixture(): RegistryProfile {
  return {
    registry: {
      name: '@delta',
      url: 'https://delta.example',
      description: 'Delta registry fixture.',
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
        officialName: '@delta',
        registryUrlTemplate: 'https://delta.example/r/{name}.json',
        sourceUrl: 'https://ui.shadcn.com/r/registries.json',
        syncedAt: '2026-06-27T00:00:00.000Z',
        upstreamCount: 1,
        localCount: 1,
        warnings: [],
      },
    },
    sections: [
      {
        name: 'Item discovery status',
        items: [
          {
            name: 'Code Block',
            slug: 'code-block',
            type: 'registry:ui',
            category: 'code',
            catalogStatus: 'available',
            confidence: 'high',
            source: 'registry-json',
            provenance: 'fixture',
            description: 'Syntax highlighted code block.',
            taxonomyTagLabels: ['Code block'],
            taxonomyCategoryLabels: ['Data display'],
            statusDisplayLabel: 'catalog-backed',
            statusExplanation: 'Registry Atlas has a concrete catalog item for this result.',
            docsUrl: 'https://delta.example/components/code-block',
            componentPageUrl: 'https://delta.example/components/code-block',
            dependencyCount: 1,
            registryDependencyCount: 0,
            fileCount: 1,
            routeEligible: true,
            route: 'https://delta.example/r/code-block.json',
            routeLabel: 'Open item route',
            installAction: {
              status: 'disabled',
              token: null,
              installCommand: null,
              inspectCommand: null,
              route: null,
              disabledReason: 'Fixture action disabled.',
            },
          },
        ],
      },
    ],
  };
}

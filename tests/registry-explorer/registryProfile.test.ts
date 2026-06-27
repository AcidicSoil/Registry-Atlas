import { describe, expect, it } from 'vitest';
import { buildRegistryProfile } from '../../src/registry-explorer/core/registryProfile';
import type { ComponentCandidate, Registry } from '../../src/registry-explorer/core/registry.schema';

describe('buildRegistryProfile', () => {
  it('builds source-boundary sections with Atlas enrichment and item route labels', () => {
    const profile = buildRegistryProfile(registryFixture());

    expect(profile.sections.map(section => section.name)).toEqual([
      'Official shadcn facts',
      'Registry Atlas enrichment',
      'Item discovery status',
    ]);
    expect(profile.sections[0]?.facts).toEqual(expect.arrayContaining([
      { label: 'Namespace', value: '@profile' },
      { label: 'Homepage/source URL', value: 'https://profile.example', url: 'https://profile.example' },
      { label: 'Registry URL template', value: 'https://profile.example/r/{name}.json' },
      { label: 'Official source URL', value: 'https://ui.shadcn.com/r/registries.json', url: 'https://ui.shadcn.com/r/registries.json' },
    ]));
    expect(profile.sections[1]?.facts).toEqual(expect.arrayContaining([
      { label: 'Aliases', value: ['profile-kit'] },
      { label: 'Coverage status', value: 'Verified item' },
    ]));
    expect(profile.sections[2]?.items).toEqual([
      expect.objectContaining({
        name: 'Thread',
        slug: 'thread',
        description: 'Thread component for AI chat.',
        rawItemUrl: 'https://profile.example/r/thread.json',
        docsUrl: 'https://profile.example/docs/thread',
        evidenceUrl: 'https://profile.example/r/registry.json',
        dependencyCount: 1,
        registryDependencyCount: 1,
        fileCount: 1,
        routeEligible: true,
        route: 'https://profile.example/r/thread.json',
        routeLabel: 'Open item route',
        installAction: {
          status: 'enabled',
          token: '@profile/thread',
          installCommand: 'npx shadcn@latest add @profile/thread',
          inspectCommand: 'npx shadcn@latest view @profile/thread',
          route: 'https://profile.example/r/thread.json',
          disabledReason: null,
        },
      }),
      expect.objectContaining({
        name: 'Card',
        slug: 'card',
        routeEligible: false,
        route: undefined,
        routeLabel: 'Catalog not verified',
        installAction: expect.objectContaining({
          status: 'disabled',
          token: null,
          installCommand: null,
          inspectCommand: null,
          disabledReason: expect.any(String),
        }),
      }),
    ]);
  });

  it('adds why-this-matched facts when a candidate is selected', () => {
    const registry = registryFixture();
    const candidate: ComponentCandidate = {
      id: '@profile:thread',
      registry,
      matchedLabel: 'Thread',
      matchedField: 'item',
      itemName: 'Thread',
      itemSlug: 'thread',
      catalogStatus: 'available',
      routeEligible: true,
      route: 'https://profile.example/r/thread.json',
      installAction: {
        status: 'enabled',
        token: '@profile/thread',
        installCommand: 'npx shadcn@latest add @profile/thread',
        inspectCommand: 'npx shadcn@latest view @profile/thread',
        route: 'https://profile.example/r/thread.json',
        disabledReason: null,
      },
      matchReasons: ['Exact item match'],
      coverageStatus: 'verified',
      coverageLabel: 'Verified item',
      confidence: 'high',
      score: 1140,
      warnings: [],
    };

    const matchSection = buildRegistryProfile(registry, { candidate })
      .sections.find(section => section.name === 'Why this matched');

    expect(matchSection?.facts).toEqual([
      { label: 'Matched field', value: 'item' },
      { label: 'Matched label', value: 'Thread' },
      { label: 'Match reasons', value: ['Exact item match'] },
    ]);
  });
});

function registryFixture(): Registry {
  return {
    name: '@profile',
    url: 'https://profile.example',
    description: 'Profile registry fixture.',
    primary_focus: ['ai-chat'],
    component_tags: ['chat-window'],
    atlas: {
      aliases: ['profile-kit'],
      coverageStatus: 'verified',
      confidence: 'high',
      notes: 'Fixture notes.',
      catalogStatus: 'available',
    },
    mirror: {
      officialName: '@profile',
      registryUrlTemplate: 'https://profile.example/r/{name}.json',
      sourceUrl: 'https://ui.shadcn.com/r/registries.json',
      syncedAt: '2026-05-26T00:00:00.000Z',
      upstreamCount: 1,
      localCount: 1,
      warnings: [],
    },
    itemSummaries: [
      {
        name: 'Thread',
        slug: 'thread',
        type: 'component',
        category: 'chat',
        source: 'known-catalog',
        provenance: 'fixture',
        catalogStatus: 'available',
        confidence: 'high',
        description: 'Thread component for AI chat.',
        rawItemUrl: 'https://profile.example/r/thread.json',
        docsUrl: 'https://profile.example/docs/thread',
        evidenceUrl: 'https://profile.example/r/registry.json',
        dependencies: ['ai'],
        registryDependencies: ['button'],
        files: [{ path: 'registry/thread.tsx', type: 'registry:component', target: 'components/thread.tsx' }],
        routeEligible: true,
      },
      {
        name: 'Card',
        slug: 'card',
        type: 'component',
        category: 'display',
        source: 'known-catalog',
        provenance: 'fixture',
        catalogStatus: 'partial',
        routeEligible: false,
      },
    ],
  };
}

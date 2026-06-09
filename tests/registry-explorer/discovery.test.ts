import { describe, expect, it } from 'vitest';
import {
  buildDiscoveryOverview,
  searchComponentCandidates,
} from '../../src/registry-explorer/core/discovery';
import type { Registry } from '../../src/registry-explorer/core/registry.schema';

describe('component discovery', () => {
  it('summarizes known and route-eligible item coverage', () => {
    const overview = buildDiscoveryOverview([verifiedRegistry(), inferredRegistry()]);

    expect(overview).toEqual({
      totalRegistries: 2,
      knownItemCount: 2,
      routeEligibleItemCount: 1,
      verifiedRegistryCount: 1,
      unverifiedRegistryCount: 0,
    });
  });

  it('prioritizes exact item matches and resolves item routes without homepage fallback', () => {
    const [candidate] = searchComponentCandidates([verifiedRegistry()], 'thread');

    expect(candidate).toEqual(expect.objectContaining({
      id: '@verified:thread',
      matchedField: 'item',
      matchedLabel: 'Thread',
      itemSlug: 'thread',
      routeEligible: true,
      route: 'https://verified.example/r/thread.json',
      installAction: {
        status: 'enabled',
        token: '@verified/thread',
        installCommand: 'npx shadcn@latest add @verified/thread',
        inspectCommand: 'npx shadcn@latest view @verified/thread',
        route: 'https://verified.example/r/thread.json',
        disabledReason: null,
      },
      matchReasons: ['Exact item match'],
      coverageStatus: 'verified',
      coverageLabel: 'Verified item',
    }));
  });

  it('uses alias/tag fallback only when no known item matches exist', () => {
    const [aliasCandidate] = searchComponentCandidates([inferredRegistry()], 'conversation');

    expect(aliasCandidate).toEqual(expect.objectContaining({
      id: '@inferred:alias',
      matchedField: 'alias',
      matchedLabel: 'conversation-panel',
      routeEligible: false,
      installAction: expect.objectContaining({
        status: 'disabled',
        token: null,
        installCommand: null,
        inspectCommand: null,
        disabledReason: expect.stringContaining('fallback'),
      }),
      matchReasons: ['Why this matched: alias match'],
      coverageStatus: 'inferred',
    }));
    expect(aliasCandidate).not.toHaveProperty('route');
  });

  it('orders equal fallback matches by coverage contract before namespace', () => {
    const candidates = searchComponentCandidates([
      registryWithStatus('@unverified', 'unverified'),
      registryWithStatus('@unavailable', 'unavailable'),
      registryWithStatus('@partial', 'partial'),
      registryWithStatus('@inferred', 'inferred'),
    ], 'button');

    expect(candidates.map(candidate => candidate.registry.name)).toEqual([
      '@inferred',
      '@partial',
      '@unavailable',
      '@unverified',
    ]);
  });
});

function verifiedRegistry(): Registry {
  return {
    name: '@verified',
    url: 'https://verified.example',
    description: 'Verified registry with a thread item.',
    primary_focus: ['ai-chat'],
    component_tags: ['chat-window'],
    atlas: {
      aliases: ['thread-kit'],
      coverageStatus: 'verified',
      confidence: 'high',
      notes: 'Known catalog fixture.',
      catalogStatus: 'available',
    },
    mirror: {
      officialName: '@verified',
      registryUrlTemplate: 'https://verified.example/r/{name}.json',
      sourceUrl: 'https://ui.shadcn.com/r/registries.json',
      syncedAt: '2026-05-26T00:00:00.000Z',
      upstreamCount: 2,
      localCount: 2,
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
        routeEligible: true,
      },
    ],
  };
}

function inferredRegistry(): Registry {
  return {
    name: '@inferred',
    url: 'https://inferred.example',
    description: 'Inferred registry for support widgets.',
    primary_focus: ['support'],
    component_tags: ['button'],
    atlas: {
      aliases: ['conversation-panel'],
      coverageStatus: 'inferred',
      confidence: 'medium',
      notes: 'Inferred from Atlas metadata.',
      catalogStatus: 'partial',
    },
    mirror: {
      officialName: '@inferred',
      registryUrlTemplate: 'https://inferred.example/r/{name}.json',
      sourceUrl: 'https://ui.shadcn.com/r/registries.json',
      syncedAt: '2026-05-26T00:00:00.000Z',
      upstreamCount: 2,
      localCount: 2,
      warnings: [],
    },
    itemSummaries: [
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

function registryWithStatus(name: Registry['name'], coverageStatus: NonNullable<Registry['atlas']>['coverageStatus']): Registry {
  return {
    name,
    url: `https://${name.slice(1)}.example`,
    description: `${name} registry`,
    primary_focus: ['support'],
    component_tags: ['button'],
    atlas: {
      aliases: [],
      coverageStatus,
      confidence: 'medium',
      notes: 'Fixture registry.',
      catalogStatus: 'unverified',
    },
  };
}

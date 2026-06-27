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

  it('matches rich imported item metadata and exposes concise catalog-backed counts', () => {
    const [candidate] = searchComponentCandidates([richRegistry()], 'lucide-react');

    expect(candidate).toEqual(expect.objectContaining({
      id: '@delta:input-otp',
      matchedField: 'item',
      matchedLabel: 'Input OTP',
      itemDescription: 'OTP input component with six slots.',
      rawItemUrl: 'https://deltacomponents.dev/r/input-otp.json',
      docsUrl: 'https://deltacomponents.dev/components/input-otp',
      evidenceUrl: 'https://deltacomponents.dev/r/registry.json',
      dependencyCount: 1,
      registryDependencyCount: 1,
      fileCount: 1,
      route: 'https://deltacomponents.dev/r/input-otp.json',
      installAction: expect.objectContaining({
        status: 'enabled',
      }),
    }));
    expect(candidate?.installAction.status === 'enabled' ? candidate.installAction.token : null).toBe('@delta/input-otp');
  });

  it('matches proposed tags from imported item summaries', () => {
    const [candidate] = searchComponentCandidates([richRegistry()], 'otp-input');

    expect(candidate).toEqual(expect.objectContaining({
      id: '@delta:input-otp',
      matchedField: 'item',
      routeEligible: true,
      taxonomyTagLabels: ['OTP input'],
      taxonomyCategoryLabels: ['Forms'],
    }));
  });

  it('matches simple taxonomy aliases and category concepts for imported items', () => {
    expect(searchComponentCandidates([richRegistry()], 'qr')[0]).toEqual(expect.objectContaining({
      id: '@delta:qrcode',
      matchReasons: ['Taxonomy tag match'],
    }));
    expect(searchComponentCandidates([richRegistry()], 'ai chat')[0]).toEqual(expect.objectContaining({
      id: '@delta:chat',
      taxonomyCategoryLabels: ['AI & Chat'],
    }));
    expect(searchComponentCandidates([richRegistry()], 'map')[0]).toEqual(expect.objectContaining({
      id: '@delta:mapbox-pointer',
    }));
    expect(searchComponentCandidates([richRegistry()], 'color')[0]).toEqual(expect.objectContaining({
      id: '@delta:color-picker',
      taxonomyCategoryLabels: ['Forms'],
    }));
    expect(searchComponentCandidates([richRegistry()], 'receipt')[0]).toEqual(expect.objectContaining({
      id: '@delta:signed-receipt',
      taxonomyCategoryLabels: ['Data Display & Documents'],
    }));
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

function richRegistry(): Registry {
  return {
    name: '@delta',
    url: 'https://deltacomponents.dev',
    description: 'Delta component registry.',
    primary_focus: ['ai-chat'],
    component_tags: ['input', 'otp-input', 'qr-code', 'ai-chat', 'map-pointer', 'color-picker', 'receipt'],
    atlas: {
      aliases: [],
      coverageStatus: 'verified',
      confidence: 'high',
      notes: 'Imported fixture.',
      catalogStatus: 'available',
    },
    mirror: {
      officialName: '@delta',
      registryUrlTemplate: 'https://deltacomponents.dev/r/{name}.json',
      sourceUrl: 'https://ui.shadcn.com/r/registries.json',
      syncedAt: '2026-06-27T00:00:00.000Z',
      upstreamCount: 1,
      localCount: 1,
      warnings: [],
    },
    itemSummaries: [
      {
        name: 'Input OTP',
        slug: 'input-otp',
        title: 'Input OTP',
        description: 'OTP input component with six slots.',
        type: 'registry:ui',
        category: 'input',
        componentTagsExisting: ['input'],
        componentTagsProposed: ['otp-input'],
        source: 'registry-json',
        provenance: 'fixture',
        catalogStatus: 'available',
        confidence: 'high',
        routeEligible: true,
        rawItemUrl: 'https://deltacomponents.dev/r/input-otp.json',
        docsUrl: 'https://deltacomponents.dev/components/input-otp',
        evidenceUrl: 'https://deltacomponents.dev/r/registry.json',
        dependencies: ['lucide-react'],
        registryDependencies: ['button'],
        files: [{ path: 'registry/delta-ui/delta/input-otp.tsx', type: 'registry:ui', target: 'components/input-otp.tsx' }],
      },
      {
        name: 'QR Code',
        slug: 'qrcode',
        title: 'QR Code',
        description: 'QR code widget.',
        type: 'registry:ui',
        category: 'data-generation',
        componentTagsProposed: ['qr-code'],
        source: 'registry-json',
        provenance: 'fixture',
        catalogStatus: 'available',
        confidence: 'high',
        routeEligible: true,
        rawItemUrl: 'https://deltacomponents.dev/r/qrcode.json',
      },
      {
        name: 'Chat',
        slug: 'chat',
        title: 'Chat',
        description: 'AI chat interface.',
        type: 'registry:ui',
        category: 'ai-and-chat',
        componentTagsProposed: ['chat-interface', 'ai-chat'],
        source: 'registry-json',
        provenance: 'fixture',
        catalogStatus: 'available',
        confidence: 'high',
        routeEligible: true,
        rawItemUrl: 'https://deltacomponents.dev/r/chat.json',
      },
      {
        name: 'Mapbox Pointer',
        slug: 'mapbox-pointer',
        title: 'Mapbox Pointer',
        description: 'Map pointer widget.',
        type: 'registry:ui',
        category: 'maps-and-location',
        componentTagsProposed: ['map-pointer'],
        source: 'registry-json',
        provenance: 'fixture',
        catalogStatus: 'available',
        confidence: 'high',
        routeEligible: true,
        rawItemUrl: 'https://deltacomponents.dev/r/mapbox-pointer.json',
      },
      {
        name: 'Color Picker',
        slug: 'color-picker',
        title: 'Color Picker',
        description: 'Color picker control.',
        type: 'registry:ui',
        category: 'form-controls',
        componentTagsProposed: ['color-picker'],
        source: 'registry-json',
        provenance: 'fixture',
        catalogStatus: 'available',
        confidence: 'high',
        routeEligible: true,
        rawItemUrl: 'https://deltacomponents.dev/r/color-picker.json',
      },
      {
        name: 'Signed Receipt',
        slug: 'signed-receipt',
        title: 'Signed Receipt',
        description: 'Audit receipt record.',
        type: 'registry:ui',
        category: 'data-display-and-document',
        componentTagsProposed: ['receipt', 'audit'],
        source: 'registry-json',
        provenance: 'fixture',
        catalogStatus: 'available',
        confidence: 'high',
        routeEligible: true,
        rawItemUrl: 'https://deltacomponents.dev/r/signed-receipt.json',
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

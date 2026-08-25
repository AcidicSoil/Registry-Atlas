import { describe, expect, it } from 'vitest';
import {
  CATALOG_CATEGORY_LABELS,
  catalogCategoriesForCandidate,
  catalogCategoriesForRegistry,
} from '../../src/registry-explorer/core/catalogTaxonomy';
import type { ComponentCandidate, Registry } from '../../src/registry-explorer/core/registry.schema';

describe('catalog taxonomy', () => {
  it('exposes the fixed user-facing category vocabulary without legacy Focus labels', () => {
    expect(CATALOG_CATEGORY_LABELS).toEqual({
      'ai-and-chat': 'AI & Chat',
      'auth-and-account': 'Auth & Account',
      'buttons-and-controls': 'Buttons & Controls',
      'data-display': 'Data Display',
      'developer-tools': 'Developer Tools',
      ecommerce: 'Ecommerce',
      'feedback-and-overlays': 'Feedback & Overlays',
      'forms-and-inputs': 'Forms & Inputs',
      'layout-and-templates': 'Layout & Templates',
      marketing: 'Marketing',
      media: 'Media',
      navigation: 'Navigation',
      utilities: 'Utilities',
    });
    expect(Object.values(CATALOG_CATEGORY_LABELS).join(' ')).not.toContain('Focus');
  });

  it('maps registry focus and grounded component taxonomy into catalog categories', () => {
    const result = catalogCategoriesForRegistry(registryFixture({
      primary_focus: ['forms-and-inputs', 'marketing-sections'],
      component_tags: ['chat-interface', 'code-block', 'map-pointer', 'admonition', 'cropper'],
    }));

    expect(result).toEqual(expect.arrayContaining([
      'ai-and-chat',
      'developer-tools',
      'feedback-and-overlays',
      'forms-and-inputs',
      'marketing',
      'media',
      'utilities',
    ]));
    expect(result).not.toContain('forms');
    expect(result).not.toContain('Focus');
  });

  it('maps a ComponentCandidate from its grounded taxonomy metadata', () => {
    const candidate = candidateFixture(registryFixture({
      primary_focus: ['misc-utility'],
      component_tags: ['button'],
      itemSummaries: [{
        name: 'Input OTP',
        slug: 'input-otp',
        componentTagsProposed: ['otp-input'],
        source: 'fixture',
        provenance: 'fixture',
        catalogStatus: 'available',
        routeEligible: true,
      }],
    }));

    expect(catalogCategoriesForCandidate(candidate)).toContain('forms-and-inputs');
  });
});

function candidateFixture(registry: Registry): ComponentCandidate {
  return {
    id: `${registry.name}:input-otp`,
    registry,
    matchedLabel: 'Input OTP',
    matchedField: 'item',
    itemName: 'Input OTP',
    itemSlug: 'input-otp',
    taxonomyTagLabels: ['OTP input'],
    taxonomyCategoryLabels: ['Forms'],
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

function registryFixture(overrides: Partial<Registry> = {}): Registry {
  return {
    name: '@fixture',
    url: 'https://fixture.example',
    description: 'Fixture registry.',
    primary_focus: ['support'],
    component_tags: ['button'],
    ...overrides,
  };
}

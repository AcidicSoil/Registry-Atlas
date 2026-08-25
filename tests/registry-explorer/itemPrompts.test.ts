import { describe, expect, it } from 'vitest';
import { buildInstallAgentPrompt, buildInspectionPrompt } from '../../src/registry-explorer/core/itemPrompts';
import { buildBaseDetail } from '../../src/registry-explorer/core/registryItemDetail';
import type { Registry, RegistryItemSummary } from '../../src/registry-explorer/core/registry.schema';

describe('item prompts', () => {
  it('builds an agent prompt only from enabled install actions', () => {
    const detail = enabledDetail();
    const prompt = buildInstallAgentPrompt(detail);

    expect(prompt).toContain('@delta/code-block');
    expect(prompt).toContain('npx shadcn@latest view @delta/code-block');
    expect(prompt).toContain('npx shadcn@latest add @delta/code-block');
    expect(prompt).toContain('Review third-party registry code before applying changes.');
  });

  it('returns null instead of inventing commands for disabled installs', () => {
    const detail = buildBaseDetail(registry(false), summary(false));
    expect(buildInstallAgentPrompt(detail)).toBeNull();
  });

  it('builds inspection prompts from only grounded detail fields', () => {
    const detail = enabledDetail();
    const prompt = buildInspectionPrompt(detail);
    expect(prompt).toContain('Dependencies: shiki');
    expect(prompt).toContain('Files: registry/code-block.tsx');
    expect(prompt).toContain('Warnings: review generated styles');
    expect(prompt).toContain('Evidence: https://delta.example/evidence');
  });
  it('returns null when inspection metadata has no grounding', () => {
    const detail = enabledDetail();
    const empty = {
      ...detail,
      dependencies: [],
      devDependencies: [],
      registryDependencies: [],
      files: [],
      warnings: [],
      evidenceUrl: null,
    };
    expect(buildInspectionPrompt(empty)).toBeNull();
  });
});

function enabledDetail() {
  return buildBaseDetail(registry(true), summary(true));
}

function registry(withRoute: boolean): Registry {
  return {
    name: '@delta',
    url: 'https://delta.example',
    description: 'Delta registry.',
    primary_focus: ['support'],
    component_tags: ['code-block'],
    mirror: withRoute ? {
      officialName: '@delta',
      registryUrlTemplate: 'https://delta.example/r/{name}.json',
      sourceUrl: 'https://ui.shadcn.com/r/registries.json',
      syncedAt: '2026-08-24T00:00:00.000Z',
      upstreamCount: 1,
      localCount: 1,
      warnings: [],
    } : undefined,
  };
}function summary(routeEligible: boolean): RegistryItemSummary {
  return {
    name: 'Code Block',
    slug: 'code-block',
    description: 'Syntax highlighted code.',
    source: 'fixture',
    provenance: 'fixture',
    catalogStatus: 'available',
    routeEligible,
    rawItemUrl: routeEligible ? 'https://delta.example/r/code-block.json' : undefined,
    evidenceUrl: 'https://delta.example/evidence',
    dependencies: ['shiki'],
    files: [{ path: 'registry/code-block.tsx', type: 'registry:ui' }],
    warnings: ['review generated styles'],
  };
}

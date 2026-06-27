import { describe, expect, it } from 'vitest';
import { resolveRegistryItemDetailFromSummary } from '../../src/registry-explorer/core/registryItemDetail';
import type { Registry } from '../../src/registry-explorer/core/registry.schema';
import { renderItemDetailView } from '../../src/registry-explorer/ui/itemDetailView';

describe('renderItemDetailView', () => {
  it('renders a component-first item page without raw JSON UI labels', () => {
    const result = resolveRegistryItemDetailFromSummary([registryFixture()], '@delta', 'code-block');
    const header = root();
    const body = root();

    renderItemDetailView(header, body, result, new Set());

    expect(header.innerHTML).toContain('Code Block');
    expect(body.innerHTML).toContain('Preview not available yet');
    expect(body.innerHTML).toContain('Open component page');
    expect(body.innerHTML).toContain('Inspect first');
    expect(body.innerHTML).toContain('Copy install');
    expect(body.innerHTML).toContain('Dependencies');
    expect(`${header.innerHTML}${body.innerHTML}`).not.toContain('Raw JSON');
    expect(`${header.innerHTML}${body.innerHTML}`).not.toContain('Open raw item route');
  });

  it('escapes imported item text and file fields', () => {
    const result = resolveRegistryItemDetailFromSummary([registryFixture({
      title: '<img src=x onerror=alert(1)>',
      description: 'A&B <script>alert(1)</script>',
      filePath: 'registry/<bad>.tsx',
    })], '@delta', 'code-block');
    const header = root();
    const body = root();

    renderItemDetailView(header, body, result, new Set());

    expect(header.innerHTML).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(body.innerHTML).toContain('A&amp;B &lt;script&gt;alert(1)&lt;/script&gt;');
    expect(body.innerHTML).toContain('registry/&lt;bad&gt;.tsx');
    expect(body.innerHTML).not.toContain('<script>alert(1)</script>');
  });

  it('renders safe fallback states for failed detail loading', () => {
    const base = resolveRegistryItemDetailFromSummary([registryFixture()], '@delta', 'code-block');
    const detail = base.detail;
    expect(detail).not.toBeNull();
    const header = root();
    const body = root();

    renderItemDetailView(header, body, {
      status: 'fetch-error',
      detail,
      message: 'Registry item could not be loaded from the network.',
      reason: 'network-error',
    }, new Set());

    expect(body.innerHTML).toContain('Atlas could not load this item from the registry');
    expect(body.innerHTML).toContain('Open component page');
    expect(body.innerHTML).not.toContain('Open raw item route');
  });
});

function root(): HTMLElement {
  return { innerHTML: '' } as HTMLElement;
}

function registryFixture(options: { title?: string; description?: string; filePath?: string } = {}): Registry {
  return {
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
    itemSummaries: [
      {
        name: 'Code Block',
        slug: 'code-block',
        title: options.title ?? 'Code Block',
        description: options.description ?? 'Syntax highlighted code block.',
        type: 'registry:ui',
        category: 'code',
        componentTagsProposed: ['code-block'],
        source: 'registry-json',
        provenance: 'fixture',
        catalogStatus: 'available',
        confidence: 'high',
        routeEligible: true,
        rawItemUrl: 'https://delta.example/r/code-block.json',
        docsUrl: 'https://delta.example/components/code-block',
        dependencies: ['shiki'],
        files: [{ path: options.filePath ?? 'registry/code-block.tsx', type: 'registry:ui', target: 'components/code-block.tsx' }],
      },
    ],
  };
}

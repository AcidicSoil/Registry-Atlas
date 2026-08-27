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
    expect(body.innerHTML).toContain('Preview unavailable');
    expect(body.innerHTML).toContain('Open component page');
    expect(body.innerHTML).toContain('href="https://delta.example/components/code-block" class="secondary-link"');
    expect(body.innerHTML).toContain('Inspect first');
    expect(body.innerHTML).toContain('Copy install');
    expect((body.innerHTML.match(/install-button install-button-primary/g) ?? [])).toHaveLength(1);
    expect(body.innerHTML).toContain('Dependencies');
    expect(body.innerHTML).toContain('<dt>Warnings</dt>');
    expect(`${header.innerHTML}${body.innerHTML}`).not.toContain('Raw JSON');
    expect(`${header.innerHTML}${body.innerHTML}`).not.toContain('Open raw item route');
  });

  it('uses the component page as the sole primary action when installation is unavailable', () => {
    const result = resolveRegistryItemDetailFromSummary([registryFixture({ routeEligible: false })], '@delta', 'code-block');
    const body = root();

    renderItemDetailView(root(), body, result, new Set());

    expect(body.innerHTML).toContain('href="https://delta.example/components/code-block" class="install-button install-button-primary"');
    expect(body.innerHTML).toContain('<button class="install-button" type="button" disabled>Copy install</button>');
    expect((body.innerHTML.match(/install-button install-button-primary/g) ?? [])).toHaveLength(1);
  });

  it.each(['javascript:alert(1)', 'not a URL'])('treats unsafe preview URLs (%s) as unavailable in both imagery and status copy', (previewUrl) => {
    const result = resolveRegistryItemDetailFromSummary([registryFixture({ previewUrl })], '@delta', 'code-block');
    const body = root();

    renderItemDetailView(root(), body, result, new Set());

    expect(body.innerHTML).toContain('Preview unavailable');
    expect(body.innerHTML).not.toContain('<img');
    expect(body.innerHTML).not.toContain('Open preview');
    expect(body.innerHTML).not.toContain('visual available');
    expect(body.innerHTML).toContain('preview unavailable');
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

  it('omits empty technical groups and puts source details before recommendations', () => {
    const registry = registryFixture({ emptyTechnicalDetails: true });
    const result = resolveRegistryItemDetailFromSummary([registry, relatedRegistryFixture()], '@delta', 'code-block');
    const body = root();

    renderItemDetailView(root(), body, result, new Set(), [registry, relatedRegistryFixture()]);

    expect(body.innerHTML).not.toContain('<h2>Dependencies</h2>');
    expect(body.innerHTML).not.toContain('<h2>Dev dependencies</h2>');
    expect(body.innerHTML).not.toContain('<h2>Registry dependencies</h2>');
    expect(body.innerHTML).not.toContain('<h2>Files</h2>');
    expect(body.innerHTML).toContain('<h2>Source context</h2>');
    expect(body.innerHTML).not.toContain('Review third-party registry code before installing.');
    expect(body.innerHTML).not.toContain('install-safety-note');
    expect(body.innerHTML.indexOf('Source context')).toBeLessThan(body.innerHTML.indexOf('Similar patterns'));
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

function registryFixture(options: { title?: string; description?: string; filePath?: string; previewUrl?: string; emptyTechnicalDetails?: boolean; routeEligible?: boolean } = {}): Registry {
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
        routeEligible: options.routeEligible ?? true,
        rawItemUrl: 'https://delta.example/r/code-block.json',
        docsUrl: 'https://delta.example/components/code-block',
        previewUrl: options.previewUrl,
        evidenceUrl: 'https://delta.example/evidence',
        warnings: ['review generated styles'],
        dependencies: options.emptyTechnicalDetails ? [] : ['shiki'],
        devDependencies: [],
        registryDependencies: [],
        files: options.emptyTechnicalDetails ? [] : [{ path: options.filePath ?? 'registry/code-block.tsx', type: 'registry:ui', target: 'components/code-block.tsx' }],
      },
    ],
  };
}

describe('enriched detail actions', () => {
  it('renders grounded prompts, copy link, related registries, and real previews', () => {
    const delta = registryFixture({ previewUrl: 'https://delta.example/preview.png' });
    const gamma = relatedRegistryFixture();
    const result = resolveRegistryItemDetailFromSummary([delta, gamma], '@delta', 'code-block');
    const body = root();

    renderItemDetailView(root(), body, result, new Set(), [delta, gamma]);

    expect(body.innerHTML).toContain('<img');
    expect(body.innerHTML).not.toContain('Preview unavailable');
    expect(body.innerHTML).toContain('Alternate terminology');
    expect(body.innerHTML).toContain('Copy install-agent prompt');
    expect(body.innerHTML).toContain('Copy review prompt');
    expect(body.innerHTML).toContain('Copy link');
    expect(body.innerHTML).toContain('Related registries');
    expect(body.innerHTML).toContain('@gamma');
    expect(body.innerHTML).toContain('data-copy-current-url');
  });
});

function relatedRegistryFixture(): Registry {
  return {
    name: '@gamma',
    url: 'https://gamma.example',
    description: 'Gamma registry fixture.',
    primary_focus: ['support'],
    component_tags: ['code-block'],
    itemSummaries: [{
      name: 'Code Snippet',
      slug: 'code-snippet',
      type: 'registry:ui',
      category: 'code',
      componentTagsProposed: ['code-block'],
      source: 'fixture',
      provenance: 'fixture',
      catalogStatus: 'available',
      routeEligible: true,
      docsUrl: 'https://gamma.example/code-snippet',
    }],
  };
}

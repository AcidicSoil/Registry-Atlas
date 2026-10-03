import { describe, expect, it } from 'vitest';
import { resolveRegistryItemDetailFromSummary } from '../../src/registry-explorer/core/registryItemDetail';
import type { Registry } from '../../src/registry-explorer/core/registry.schema';
import { renderItemDetailView, renderRelatedComponentLinks } from '../../src/registry-explorer/ui/itemDetailView';

describe('renderItemDetailView', () => {
  it('renders a component-first item page without raw JSON UI labels', () => {
    const result = resolveRegistryItemDetailFromSummary([registryFixture()], '@delta', 'code-block');
    const header = root();
    const body = root();

    renderItemDetailView(header, body, result, new Set());

    expect(header.innerHTML).toContain('Code Block');
    expect(body.innerHTML).toContain('item-preview-metadata');
    expect(body.innerHTML).toContain('Syntax highlighted code block.');
    expect(body.innerHTML).not.toContain('Preview not published');
    expect(body.innerHTML).not.toContain('Visit source documentation');
    expect(body.innerHTML).not.toContain('href="https://delta.example/components/code-block"');
    expect(body.innerHTML).toContain('Inspect first');
    expect(body.innerHTML).toContain('Copy install');
    expect((body.innerHTML.match(/install-button install-button-primary/g) ?? [])).toHaveLength(1);
    expect(body.innerHTML).toContain('Dependencies');
    expect(body.innerHTML).toContain('<dt>Warnings</dt>');
    expect(`${header.innerHTML}${body.innerHTML}`).not.toContain('Raw JSON');
    expect(body.innerHTML).not.toContain('Open raw item');
    expect(body.innerHTML).not.toContain('Open registry homepage');
    expect(body.innerHTML).not.toContain('Registry homepage');
    expect(body.innerHTML).not.toContain('Open in v0');
    expect(body.innerHTML).not.toContain('Source record');
    expect(body.innerHTML).not.toContain('href="https://delta.example/r/');
  });

  it('shows related cards from only the matching registry with safe internal navigation', () => {
    const related = [{
      namespace:'@delta',slug:'button',displayName:'Button',type:'registry:component',
      routePath:'/Registry-Atlas/@delta/components/button',
    }, {
      namespace:'@foreign',slug:'button',displayName:'Foreign',type:'registry:component',
      routePath:'/Registry-Atlas/@foreign/components/button',
    }, {
      namespace:'@delta',slug:'code-block',displayName:'Code Block',type:'registry:component',
      routePath:'/Registry-Atlas/@delta/components/code-block',
    }].map(({ namespace, slug, displayName, type, routePath }) => ({
      id: namespace + '/' + slug,
      namespace, slug, displayName, type, routePath,
      registry: { ...registryFixture(), name: namespace },
      item: { name: slug, type },
      categories: [], reviewed: false,
    })) satisfies Parameters<typeof renderRelatedComponentLinks>[0];
    const html=renderRelatedComponentLinks(related,'@delta','code-block');
    expect(html).toContain('More from @delta');
    expect(html).toContain('href="/Registry-Atlas/@delta/components/button"');
    expect(html).toContain('data-view-item-registry="@delta"');
    expect(html).not.toContain('@foreign');
    expect(html).not.toContain('components/code-block');
  });

  it('does not substitute an external source link for an unavailable install action', () => {
    const result = resolveRegistryItemDetailFromSummary([registryFixture({ routeEligible: false })], '@delta', 'code-block');
    const body = root();

    renderItemDetailView(root(), body, result, new Set());

    expect(body.innerHTML).not.toContain('href="https://delta.example/components/code-block"');
    expect(body.innerHTML).toContain('<button class="install-button" type="button" disabled>Copy install</button>');
    expect((body.innerHTML.match(/install-button install-button-primary/g) ?? [])).toHaveLength(0);
    expect(body.innerHTML).toContain('Visual reference not yet available');
  });

  it('shows the recorded component image and a direct link to the actual demo page', () => {
    const result = resolveRegistryItemDetailFromSummary([registryFixture()], '@delta', 'code-block');
    if (!result.detail) throw new Error('Expected item detail');
    const body = root();
    renderItemDetailView(root(), body, { ...result, detail: {
      ...result.detail,
      visualReference: {
        imageUrl: '/Registry-Atlas/data/previews/delta/code-block.jpg',
        officialPage: 'https://delta.example/docs/code-block',
      },
    } }, new Set());
    expect(body.innerHTML).toContain('src="/Registry-Atlas/data/previews/delta/code-block.jpg"');
    expect(body.innerHTML).toContain('href="https://delta.example/docs/code-block"');
    expect(body.innerHTML).toContain('View original component');
    expect(body.innerHTML).not.toContain('item-preview-metadata');
  });

  it.each(['javascript:alert(1)', 'not a URL'])('treats unsafe preview URLs (%s) as unavailable in both imagery and status copy', (previewUrl) => {
    const result = resolveRegistryItemDetailFromSummary([registryFixture({ previewUrl })], '@delta', 'code-block');
    const body = root();

    renderItemDetailView(root(), body, result, new Set());

    expect(body.innerHTML).toContain('item-preview-metadata');
    expect(body.innerHTML).not.toContain('Preview not published');
    expect(body.innerHTML).not.toContain('<img');
    expect(body.innerHTML).not.toContain('Open preview');
    expect(body.innerHTML).not.toContain('visual available');
    expect(body.innerHTML).not.toContain('preview unavailable');
    expect(body.innerHTML).toContain('Visual reference not yet available');
  });

  it.each(['javascript:alert(1)', 'https://user:pass@delta.example/docs', '//attacker.example/docs'])
    ('does not expose unsafe source documentation (%s)', (docsUrl) => {
      const result = resolveRegistryItemDetailFromSummary(
        [registryFixture({ docsUrl })], '@delta', 'code-block');
      const body = root();
      renderItemDetailView(root(), body, result, new Set());
      expect(body.innerHTML).not.toContain('Visit source documentation');
      expect(body.innerHTML).not.toContain('href="javascript:');
      expect(body.innerHTML).not.toContain('user:pass@');
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

  it('omits empty technical groups and inferred recommendation sections', () => {
    const registry = registryFixture({ emptyTechnicalDetails: true });
    const result = resolveRegistryItemDetailFromSummary([registry], '@delta', 'code-block');
    const body = root();

    renderItemDetailView(root(), body, result, new Set());

    expect(body.innerHTML).not.toContain('<h2>Dependencies</h2>');
    expect(body.innerHTML).not.toContain('<h2>Dev dependencies</h2>');
    expect(body.innerHTML).not.toContain('<h2>Registry dependencies</h2>');
    expect(body.innerHTML).not.toContain('<h2>Files</h2>');
    expect(body.innerHTML).toContain('<h2>Source</h2>');
    expect(body.innerHTML).not.toContain('Review third-party registry code before installing.');
    expect(body.innerHTML).not.toContain('install-safety-note');
    expect(body.innerHTML).not.toContain('Similar patterns');
    expect(body.innerHTML).not.toContain('Alternate terminology');
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

    expect(header.innerHTML).toContain('Summary');
    expect(header.innerHTML).not.toContain('Catalog summary');
    expect(body.innerHTML).toContain('Full item details could not be loaded');
    expect(body.innerHTML).not.toContain('Open component page');
    expect(body.innerHTML).not.toContain('Open raw item');
    expect(body.innerHTML).not.toContain('Open registry homepage');
    expect(body.innerHTML).not.toContain('Registry homepage');
    expect(body.innerHTML).not.toContain('Open in v0');
    expect(body.innerHTML).not.toContain('Source record');
    expect(body.innerHTML).not.toContain('href="https://delta.example/r/');
  });
});

function root(): HTMLElement {
  return { innerHTML: '' } as HTMLElement;
}

function registryFixture(options: { title?: string; description?: string; filePath?: string; previewUrl?: string; docsUrl?: string; emptyTechnicalDetails?: boolean; routeEligible?: boolean } = {}): Registry {
  return {
    name: '@delta',
    url: 'https://delta.example',
    description: 'Delta registry fixture.',
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
        source: 'registry-json',
        provenance: 'fixture',
        catalogStatus: 'available',
        confidence: 'high',
        routeEligible: options.routeEligible ?? true,
        rawItemUrl: 'https://delta.example/r/code-block.json',
        docsUrl: options.docsUrl ?? 'https://delta.example/components/code-block',
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
  it('renders grounded prompts, copy link, and real previews without inferred recommendations', () => {
    const delta = registryFixture({ previewUrl: 'https://delta.example/preview.png' });
    const result = resolveRegistryItemDetailFromSummary([delta], '@delta', 'code-block');
    const body = root();

    renderItemDetailView(root(), body, result, new Set());

    expect(body.innerHTML).not.toContain('<img');
    expect(body.innerHTML).toContain('Visual reference not yet available');
    expect(body.innerHTML).not.toContain('Preview not published');
    expect(body.innerHTML).toContain('Copy install-agent prompt');
    expect(body.innerHTML).toContain('Copy inspection prompt');
    expect(body.innerHTML).not.toContain('Copy review prompt');
    expect(body.innerHTML).not.toContain('Open in v0');
    expect(body.innerHTML).not.toContain('v0.dev/chat/api/open');
    expect(body.innerHTML).toContain('Copy link');
    expect(body.innerHTML).toContain('data-copy-current-url');
    expect(body.innerHTML).not.toContain('Alternate terminology');
    expect(body.innerHTML).not.toContain('Similar patterns');
    expect(body.innerHTML).not.toContain('Related registries');
  });
});

import { describe, expect, it } from 'vitest';
import {
  resolveRegistryItemDetailFromCatalogIndex,
  resolveRegistryItemDetailFromSummary,
} from '../../src/registry-explorer/core/registryItemDetail';
import type { Registry } from '../../src/registry-explorer/core/registry.schema';
import type { CatalogComponent } from '../../src/registry-explorer/core/catalogQuery';
import {
  renderItemDetailView,
  renderRelatedComponentLinks,
} from '../../src/registry-explorer/ui/itemDetailView';

describe('renderItemDetailView', () => {
  it('renders the reviewed original page, item JSON, and registry as separate source actions', () => {
    const result = resolveRegistryItemDetailFromSummary(
      [registryFixture()],
      '@delta',
      'code-block',
    );
    const body = root();

    renderItemDetailView(root(), body, result, new Set());

    expect(body.innerHTML).toContain('href="https://delta.example/components/code-block"');
    expect(body.innerHTML).toContain('View original component');
    expect(body.innerHTML).toContain('href="https://delta.example/r/code-block.json"');
    expect(body.innerHTML).toContain('View item JSON');
    expect(body.innerHTML).toContain('href="https://delta.example/"');
    expect(body.innerHTML).toContain('View registry');
  });

  it('uses provisional sitemap source links when no reviewed item page is available', () => {
    const result = resolveRegistryItemDetailFromCatalogIndex(
      [registryFixture()],
      {
        meta: { registry_count: 1, item_count: 1 },
        registries: { '@delta': [{ name: 'source-only', type: 'registry:ui' }] },
        sourcePages: {
          '@delta/source-only': {
            url: 'https://delta.example/docs/source-only',
            level: 'sitemap',
            source: 'official-sitemap',
          },
        },
      },
      '@delta',
      'source-only',
    );
    const body = root();

    renderItemDetailView(root(), body, result, new Set());

    expect(body.innerHTML).toContain('href="https://delta.example/docs/source-only"');
    expect(body.innerHTML).toContain('View sitemap-listed page');
  });

  it('does not expose fake preview or local-build surfaces', () => {
    const body = root();
    renderItemDetailView(
      root(),
      body,
      resolveRegistryItemDetailFromSummary([registryFixture()], '@delta', 'code-block'),
      new Set(),
    );

    expect(body.innerHTML).not.toContain('<iframe');
    expect(body.innerHTML).not.toContain('data-component-demo');
    expect(body.innerHTML).not.toContain('data-local-build-preview');
    expect(body.innerHTML).not.toContain('data-source-sandbox');
    expect(body.innerHTML).not.toContain('Visual reference');
    expect(body.innerHTML).not.toContain('Preview not published');
  });

  it('renders concise install and inspection copy actions without defensive review boilerplate', () => {
    const body = root();
    renderItemDetailView(
      root(),
      body,
      resolveRegistryItemDetailFromSummary([registryFixture()], '@delta', 'code-block'),
      new Set(),
    );

    expect(body.innerHTML).toContain('Copy install-agent prompt');
    expect(body.innerHTML).toContain('Copy inspection prompt');
    expect(body.innerHTML).toContain('Copy link');
    expect(body.innerHTML).toContain('Do the work:');
    expect(body.innerHTML).toContain('Do not modify the repository.');
    expect(body.innerHTML).not.toContain('possible adoption');
    expect(body.innerHTML).not.toContain('Security, provenance, maintenance');
    expect(body.innerHTML).not.toContain('Copy review prompt');
  });

  it('renders grounded dependencies and files while omitting empty technical groups', () => {
    const populated = root();
    renderItemDetailView(
      root(),
      populated,
      resolveRegistryItemDetailFromSummary([registryFixture()], '@delta', 'code-block'),
      new Set(),
    );
    expect(populated.innerHTML).toContain('<h2>Dependencies</h2>');
    expect(populated.innerHTML).toContain('lucide-react');
    expect(populated.innerHTML).toContain('<h2>Files</h2>');
    expect(populated.innerHTML).toContain('registry/code-block.tsx');

    const empty = root();
    renderItemDetailView(
      root(),
      empty,
      resolveRegistryItemDetailFromSummary(
        [registryFixture({ emptyTechnicalDetails: true })],
        '@delta',
        'code-block',
      ),
      new Set(),
    );
    expect(empty.innerHTML).not.toContain('<h2>Dependencies</h2>');
    expect(empty.innerHTML).not.toContain('<h2>Files</h2>');
    expect(empty.innerHTML).toContain('<h2>Source</h2>');
  });

  it('escapes imported item text and file fields', () => {
    const result = resolveRegistryItemDetailFromSummary(
      [registryFixture({
        title: '<img src=x onerror=alert(1)>',
        description: 'A&B <script>alert(1)</script>',
        filePath: 'registry/<bad>.tsx',
      })],
      '@delta',
      'code-block',
    );
    const header = root();
    const body = root();

    renderItemDetailView(header, body, result, new Set());

    expect(header.innerHTML).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(body.innerHTML).toContain('A&amp;B &lt;script&gt;alert(1)&lt;/script&gt;');
    expect(body.innerHTML).toContain('registry/&lt;bad&gt;.tsx');
    expect(body.innerHTML).not.toContain('<script>alert(1)</script>');
  });

  it.each([
    'javascript:alert(1)',
    'https://user:pass@delta.example/docs',
    '//attacker.example/docs',
  ])('does not expose unsafe source documentation (%s)', docsUrl => {
    const body = root();
    renderItemDetailView(
      root(),
      body,
      resolveRegistryItemDetailFromSummary(
        [registryFixture({ docsUrl })],
        '@delta',
        'code-block',
      ),
      new Set(),
    );

    expect(body.innerHTML).not.toContain('href="javascript:');
    expect(body.innerHTML).not.toContain('user:pass@');
    expect(body.innerHTML).not.toContain('attacker.example');
  });

  it('renders safe fallback copy when full detail loading fails', () => {
    const base = resolveRegistryItemDetailFromSummary(
      [registryFixture()],
      '@delta',
      'code-block',
    );
    expect(base.detail).not.toBeNull();
    const body = root();

    renderItemDetailView(root(), body, {
      status: 'fetch-error',
      detail: base.detail,
      message: 'Registry item could not be loaded from the network.',
      reason: 'network-error',
    }, new Set());

    expect(body.innerHTML).toContain('Full item details could not be loaded');
    expect(body.innerHTML).not.toContain('Open in v0');
  });
});

describe('renderRelatedComponentLinks', () => {
  it('uses the correct first-class detail route and direct source links for related blocks', () => {
    const html = renderRelatedComponentLinks([
      catalogItem('current', 'component'),
      catalogItem('app-shell', 'block'),
    ], '@delta', 'current');

    expect(html).toContain('href="/Registry-Atlas/@delta/blocks/app-shell"');
    expect(html).toContain('data-view-item-kind="block"');
    expect(html).toContain('Item JSON');
    expect(html).toContain('registry-icon-related');
  });

  it('uses source-backed template categories for template detail routes', () => {
    const template = catalogItem('starter', 'block');
    template.item = {
      ...template.item,
      type: 'registry:block',
      categories: ['templates'],
    };
    template.categories = ['templates'];

    const html = renderRelatedComponentLinks([
      catalogItem('current', 'component'),
      template,
    ], '@delta', 'current');

    expect(html).toContain('href="/Registry-Atlas/@delta/templates/starter"');
    expect(html).toContain('data-view-item-kind="template"');
  });
});

function root(): HTMLElement {
  return { innerHTML: '' } as HTMLElement;
}

function registryFixture(options: {
  title?: string;
  description?: string;
  filePath?: string;
  docsUrl?: string;
  emptyTechnicalDetails?: boolean;
  routeEligible?: boolean;
} = {}): Registry {
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
    itemSummaries: [{
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
      evidenceUrl: 'https://delta.example/evidence',
      installCommand: 'npx shadcn@latest add @delta/code-block',
      viewCommand: 'npx shadcn@latest view @delta/code-block',
      warnings: ['review generated styles'],
      dependencies: options.emptyTechnicalDetails ? [] : ['lucide-react'],
      devDependencies: [],
      registryDependencies: [],
      files: options.emptyTechnicalDetails ? [] : [{
        path: options.filePath ?? 'registry/code-block.tsx',
        type: 'registry:ui',
        target: 'components/code-block.tsx',
      }],
    }],
  };
}

function catalogItem(
  slug: string,
  kind: 'component' | 'block' | 'page' | 'template' | 'theme',
): CatalogComponent {
  const registry = registryFixture();
  const rawType = kind === 'block'
    ? 'registry:block'
    : kind === 'page' || kind === 'template'
      ? 'registry:page'
      : kind === 'theme'
        ? 'registry:theme'
        : 'registry:component';
  return {
    id: `@delta:${slug}`,
    namespace: '@delta',
    registry,
    slug,
    displayName: slug,
    type: rawType,
    categories: [],
    reviewed: false,
    item: {
      name: slug,
      type: rawType,
      kind,
    },
    routePath: `/Registry-Atlas/@delta/components/${slug}`,
    reviewedSummary: {
      name: slug,
      slug,
      source: 'registry-json',
      provenance: 'fixture',
      catalogStatus: 'available',
      routeEligible: true,
      rawItemUrl: `https://delta.example/r/${slug}.json`,
    },
  };
}

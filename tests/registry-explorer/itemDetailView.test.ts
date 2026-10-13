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
  it('renders first-class library and original component links without exposing item JSON', () => {
    const result = resolveRegistryItemDetailFromSummary(
      [registryFixture()],
      '@delta',
      'code-block',
    );

    const header = root();
    const body = root();

    renderItemDetailView(header, body, result, new Set());

    expect(header.innerHTML).toContain('href="https://delta.example/components/code-block"');
    expect(header.innerHTML).toContain('Original component');
    expect(header.innerHTML).toContain('href="/Registry-Atlas/@delta"');
    expect(header.innerHTML).toContain('data-profile-registry="@delta"');
    expect(header.innerHTML).toContain('aria-label="Visit upstream registry homepage for @delta"');
    expect(header.innerHTML).toContain('aria-label="Open upstream component page for code-block"');
    expect(header.innerHTML).not.toContain('aria-label="View all components in @delta"');
    expect(header.innerHTML).not.toContain('aria-label="Component permalink for code-block"');
    expect(header.innerHTML).toContain('Registry homepage');
    expect(header.innerHTML + body.innerHTML).not.toContain('Item JSON');
    expect(header.innerHTML + body.innerHTML).not.toContain('href="https://delta.example/r/code-block.json"');
  });

  it.each(['registry:ui', 'registry:block', 'registry:page', 'registry:theme', 'registry:style'])(
    'uses external registry and original component destinations in the identity row for %s',
    type => {
      const registry = registryFixture();
      const summary = registry.itemSummaries?.[0];
      expect(summary).toBeDefined();

      const fixture = {
        ...registry,
        itemSummaries: [{ ...summary!, type }],
      };

      const result = resolveRegistryItemDetailFromSummary([fixture], '@delta', 'code-block');
      const header = root();
      renderItemDetailView(header, root(), result, new Set());
      const identity = header.innerHTML.match(/<p class="item-origin-line">([\s\S]*?)<\/p>/)?.[1];
      expect(identity).toBeDefined();
      expect(identity).toContain('href="https://delta.example/"');
      expect(identity).toContain('href="https://delta.example/components/code-block"');
      expect(identity).not.toContain('href="/Registry-Atlas/');
      expect(identity).not.toContain('data-profile-registry');
    },
  );

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

    const header = root();
    renderItemDetailView(header, root(), result, new Set());
    expect(header.innerHTML).toContain('href="https://delta.example/docs/source-only"');
    expect(header.innerHTML).toContain('View sitemap-listed page');
  });

  it('keeps missing original component pages as plain text, not self-referential internal links', () => {
    const result = resolveRegistryItemDetailFromCatalogIndex([registryFixture()], {
      meta: { registry_count: 1, item_count: 1 },
      registries: { '@delta': [{ name: 'unknown-original', type: 'registry:ui' }] },
    }, '@delta', 'unknown-original');

    const header = root();
    renderItemDetailView(header, root(), result, new Set());
    expect(header.innerHTML).toContain('aria-label="Visit upstream registry homepage for @delta"');
    expect(header.innerHTML).toContain('<span title="Upstream component page unavailable">unknown-original</span>');
    expect(header.innerHTML).not.toContain('Component permalink for unknown-original');
    expect(header.innerHTML).not.toContain('href="/Registry-Atlas/@delta/components/unknown-original"');
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

  it('shows a direct install command and setup action without badges, links, or old prompts', () => {
    const body = root();
    renderItemDetailView(root(), body,
      resolveRegistryItemDetailFromSummary([registryFixture()], '@delta', 'code-block'),
      new Set());
    expect(body.innerHTML).toContain('+ Add to setup');
    expect(body.innerHTML).toContain('View setup');
    expect(body.innerHTML).toContain('npx shadcn@latest add @delta/code-block');
    expect(body.innerHTML).toContain('Install directly');
    expect(body.innerHTML).not.toContain('Copy link');
    expect(body.innerHTML).not.toContain('Copy inspection prompt');
    expect(body.innerHTML).not.toContain('Copy install-agent prompt');
    expect(body.innerHTML).not.toContain('discovery-item-meta');
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
    expect(empty.innerHTML).toContain('<h3>Provenance</h3>');
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
    expect(header.innerHTML).toContain('A&amp;B &lt;script&gt;alert(1)&lt;/script&gt;');
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
    expect(html).not.toContain('Item JSON');
    expect(html).toContain('href="/Registry-Atlas/@delta"');
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
  // SAFETY: This test creates an in-memory DOM stub with the methods exercised by the renderer, not a browser-owned element.
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

import { describe, expect, it } from 'vitest';
import type { Registry, RegistryCatalogIndex } from '../../src/registry-explorer/core/registry.schema';
import { renderCatalogLinkPreview, resolveCatalogLinkPreview } from '../../src/registry-explorer/ui/catalogLinkPreview';

const registry: Registry = {
  name: '@logoforge',
  url: 'https://logoforge.example',
  description: 'Icon library',
  itemSummaries: [{
    name: 'dotnet', slug: 'dotnet', title: '.NET logo',
    description: 'An icon that respects color themes.',
    source: 'catalog', provenance: 'official',
    catalogStatus: 'available', routeEligible: true,
  }],
};

const index: RegistryCatalogIndex = {
  meta: { registry_count: 1, item_count: 1 },
  registries: {
    '@logoforge': [{
      name: 'dotnet', type: 'registry:component',
      title: '.NET logo', description: 'Rendered logo.',
      author: 'Logo maker', fileCount: 1, categories: ['Brand'],
    }],
  },
};

describe('catalog link previews', () => {
  it('resolves a real internal item route without replacing its destination', () => {
    const preview = resolveCatalogLinkPreview(
      '/Registry-Atlas/@logoforge/components/dotnet', '/Registry-Atlas/',
      index, [registry], 'http://127.0.0.1:5189',
    );

    expect(preview).toMatchObject({
      namespace: '@logoforge', title: '.NET logo',
      description: 'Rendered logo.', author: 'Logo maker',
      fileCount: 1, kind: 'component', categories: ['Brand'],
    });
  });

  it('does not preview external links, library pages, or unknown items', () => {
    const target = (href: string) => resolveCatalogLinkPreview(
      href, '/Registry-Atlas/', index, [registry], 'http://127.0.0.1:5189',
    );

    expect(target('https://logoforge.example/components/dotnet')).toBeNull();
    expect(target('/Registry-Atlas/@logoforge')).toBeNull();
    expect(target('/Registry-Atlas/@logoforge/components/missing')).toBeNull();
  });

  it('renders escaped source data and no fabricated screenshot', () => {
    const preview = resolveCatalogLinkPreview(
      '/Registry-Atlas/@logoforge/components/dotnet', '/Registry-Atlas/',
      index, [registry], 'http://127.0.0.1:5189',
    );

    expect(preview).not.toBeNull();

    if (!preview) return;

    const markup = renderCatalogLinkPreview({
      ...preview, description: '<img src=x onerror=alert(1)>',
    });

    expect(markup).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(markup).not.toContain('<iframe');
    expect(markup).not.toContain('preview-screenshot');
    expect(markup).toContain('1 file');
    expect(markup).toContain('Open item details');
  });

  it('renders published theme colors without accepting executable style input', () => {
    const markup = renderCatalogLinkPreview({
      namespace: '@logoforge', title: 'Colors', registry,
      kind: 'theme', categories: [],
      themePreview: { light: { background: '#fafafa', primary: 'url(javascript:alert(1))' } },
    });

    expect(markup).toContain('background-color:#fafafa');
    expect(markup).not.toContain('background-color:url(');
  });
});

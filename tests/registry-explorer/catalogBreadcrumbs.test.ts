import { describe, it, expect } from 'vitest';
import { renderCatalogBreadcrumbs } from '../../src/registry-explorer/ui/catalogBreadcrumbs';

const BASE = '/Registry-Atlas/';

describe('catalog breadcrumbs', () => {
  it('links a nested component to registries, library and library type', () => {
    const markup = renderCatalogBreadcrumbs({
      kind: 'block', namespace: '@spaceui', slug: 'demo-p-aspect-ratio-08',
    }, BASE);
    expect(markup).toContain('aria-label="Breadcrumb"');
    expect(markup).toContain('href="/Registry-Atlas/registries"');
    expect(markup).toContain('href="/Registry-Atlas/@spaceui"');
    expect(markup).toContain('href="/Registry-Atlas/@spaceui/blocks"');
    expect(markup).toContain('aria-current="page">demo-p-aspect-ratio-08');
  });

  it('does not make the current library crumb a self-navigation link', () => {
    const markup = renderCatalogBreadcrumbs({ kind: 'registry', namespace: '@spaceui' }, BASE);
    expect(markup).toContain('aria-current="page">@spaceui');
    expect(markup).not.toContain('href="/Registry-Atlas/@spaceui"');
  });

  it('supports family and category hierarchy without unsupported links', () => {
    const markup = renderCatalogBreadcrumbs({ kind: 'icon-category', category: 'layout' }, BASE);
    expect(markup).toContain('href="/Registry-Atlas/icons"');
    expect(markup).toContain('aria-current="page">layout');
  });
});

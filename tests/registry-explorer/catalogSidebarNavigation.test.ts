import { describe, expect, it } from 'vitest';
import { renderCatalogSidebarNavigation } from '../../src/registry-explorer/ui/catalogSidebarNavigation';
import type { CatalogFacetSummary } from '../../src/registry-explorer/core/catalogQuery';

const taxonomy = {
  version: 'v1',
  roots: [
    { id: 'application', label: 'Application', aliases: [], what: 'App structure', notFor: [], examples: [], children: [
      { id: 'application/app-shell', label: 'App Shell', aliases: ['workspace shell'], what: 'App shell', notFor: [], examples: [], children: [] },
    ] },
    { id: 'ai', label: 'AI', aliases: [], what: 'AI UI', notFor: [], examples: [], children: [
      { id: 'ai/chat', label: 'AI Chat', aliases: [], what: 'AI chat', notFor: [], examples: [], children: [] },
    ] },
    { id: 'controls', label: 'Controls', aliases: [], what: 'Controls', notFor: [], examples: [], children: [] },
  ],
};

const facets: CatalogFacetSummary = {
  categories: [
    { value:'forms', count:42 },
    { value:'custom<script>', count:3 },
  ],
  canonical: [
    {value:'application',count:4},
    {value:'application/app-shell',count:2},
    {value:'ai',count:2},
    {value:'ai/chat',count:2},
    {value:'controls',count:1},
  ],
  registries:[{value:'@alpha',count:150},{value:'@beta',count:25}],
  itemTypes:[],
  access:[{value:'free',count:11},{value:'paid',count:4}],
  reviewedCount:0,
  unreviewedCount:0,
};

describe('catalog browse sidebar', () => {
  it('places sorting before categories and access in the exemplar rail', () => {
    const html=renderCatalogSidebarNavigation(facets, {
      canonicalIds:['application/app-shell'],
      registryNames:['@beta'],
      kind:'components',
      sort:'registry',
      access:['free'],
    }, taxonomy);

    const categoryPosition = html.indexOf('>Categories<');
    const sortPosition = html.indexOf('>Sort<');
    const accessPosition = html.indexOf('>Access<');

    expect(categoryPosition).toBeGreaterThanOrEqual(0);
    expect(sortPosition).toBeGreaterThanOrEqual(0);
    expect(categoryPosition).toBeGreaterThan(sortPosition);
    expect(accessPosition).toBeGreaterThan(categoryPosition);
    expect(html).not.toContain('shadcn directory');

    expect(html).toContain('data-catalog-sort-value="registry"');
    expect(html).toMatch(/data-catalog-sort-value="registry"[\s\S]*?aria-pressed="true"/);
    expect(html).toContain('data-catalog-canonical-value="application"');
    expect(html).toMatch(/data-catalog-canonical-value="application"[\s\S]*?aria-pressed="true"/);
    expect(html).toContain('data-catalog-access-value="free"');
    expect(html).toMatch(/data-catalog-access-value="free"[\s\S]*?aria-pressed="true"/);
    expect(html).not.toContain('<select');
    expect(html).not.toContain('type="checkbox"');
    expect(html).not.toContain('type="radio"');
    expect(html).toContain('<details');
    expect(html).toContain('All Application');
    expect(html).toContain('data-catalog-canonical-value="application/app-shell"');
  });

  it('opens a category without selecting it, with nested choices in the group', () => {
    const html = renderCatalogSidebarNavigation(facets, {
      canonicalIds: [], registryNames: [], kind: 'components', sort: 'name', access: [],
    }, taxonomy, { expandedCategoryIds: ['application'] });

    expect(html).toMatch(/data-sidebar-taxonomy-group="application"[^>]*open/);
    expect(html).toContain('data-catalog-canonical-value="application/app-shell"');
    expect(html).toContain('data-catalog-canonical-value="application"');
    expect(html).toMatch(/data-sidebar-taxonomy-group="ai"[^>]*>/);
    expect(html).not.toMatch(/data-sidebar-taxonomy-group="ai"[^>]*open/);
    expect(html).toMatch(/data-catalog-canonical-value="application"[\s\S]*?aria-pressed="false"/);
  });

  it('preserves explicit collapsed state even when a child is selected', () => {
    const html = renderCatalogSidebarNavigation(facets, {
      canonicalIds: ['application/app-shell'], registryNames: [], kind: 'components',
      sort: 'name', access: [],
    }, taxonomy, { collapsedCategoryIds: ['application'] });

    expect(html).toMatch(/data-sidebar-taxonomy-group="application"[^>]*>/);
    expect(html).not.toMatch(/data-sidebar-taxonomy-group="application"[^>]*open/);
  });

  it('keeps high-cardinality registry discovery in the single global search instead of a second selector', () => {
    const html=renderCatalogSidebarNavigation(facets, {
      canonicalIds:[],
      registryNames:[],
      kind:'components',
      sort:'name',
      access:[],
    }, taxonomy);

    expect(html).not.toContain('shadcn directory');
    expect(html).toContain('data-catalog-sort-value="name"');
    expect(html).not.toContain('data-catalog-registry-select');
    expect(html).not.toContain('data-sidebar-registry-search');
    expect(html).not.toContain('data-sidebar-search-root');
    expect(html).not.toContain('@alpha');
    expect(html).not.toContain('@beta');
    expect(html).not.toContain('custom&lt;script&gt;');
  });

  it('shows only top-level taxonomy rows while a selected child activates its parent row', () => {
    const html=renderCatalogSidebarNavigation(facets, {
      canonicalIds:['application/app-shell'],
      registryNames:[],
      kind:'components',
      sort:'name',
      access:[],
    }, taxonomy);

    expect(html).toContain('data-catalog-canonical-value="application"');
    expect(html).toMatch(/data-catalog-canonical-value="application"[\s\S]*?aria-pressed="true"/);
    expect(html).toMatch(/>Application<[\s\S]*>4</);
    expect(html).toContain('data-catalog-canonical-value="application/app-shell"');
    expect(html).toContain('App Shell');
    expect(html).toContain('data-sidebar-taxonomy-group="application"');
    expect(html).toMatch(/data-sidebar-taxonomy-group="application"[^>]*open/);
  });
});

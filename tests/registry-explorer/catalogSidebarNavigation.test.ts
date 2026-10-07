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
  reviewedCount:0,
  unreviewedCount:0,
};

describe('canonical taxonomy sidebar navigation', () => {
  it('renders the canonical hierarchy with counts and pressed state', () => {
    const html=renderCatalogSidebarNavigation(facets, {
      canonicalIds:['application/app-shell'],
      registry:'@beta',
      kind:'components',
      canonicalSearch:'',
      registrySearch:'',
    }, taxonomy);

    expect(html).toContain('aria-label="Browse canonical categories"');
    expect(html).toContain('data-sidebar-canonical-search');
    expect(html).toContain('data-catalog-canonical-value="application"');
    expect(html).toMatch(/data-catalog-canonical-value="application\/app-shell"[\s\S]*aria-pressed="true"/);
    expect(html).toContain('>Application<');
    expect(html).toContain('>App Shell<');
    expect(html).toContain('>AI<');
    expect(html).toContain('>Controls<');
    expect(html).toContain('data-profile-registry="@beta"');
    expect(html).toContain('aria-current="page"');
  });

  it('keeps source categories out of the global semantic rail while preserving registry navigation', () => {
    const html=renderCatalogSidebarNavigation(facets, {
      canonicalIds:[],
      registry:'@alpha',
      kind:'registry',
      canonicalSearch:'ai',
      registrySearch:'beta',
    }, taxonomy);

    expect(html).toContain('value="ai"');
    expect(html).toContain('value="beta"');
    expect(html).toContain('data-catalog-canonical-value=""');
    expect(html).toContain('data-profile-registry="@alpha"');
    expect(html).toContain('data-profile-registry="@beta"');
    expect(html).not.toContain('data-catalog-category-value');
    expect(html).not.toContain('custom&lt;script&gt;');
  });

  it('keeps parent nodes selectable and exposes descendant counts from canonical facets', () => {
    const html=renderCatalogSidebarNavigation(facets, {
      canonicalIds:['application'],
      registry:null,
      kind:'components',
      canonicalSearch:'',
      registrySearch:'',
    }, taxonomy);
    expect(html).toMatch(/data-catalog-canonical-value="application"[\s\S]*aria-pressed="true"/);
    expect(html).toMatch(/>Application<[\s\S]*>4</);
    expect(html).toContain('aria-expanded="true"');
  });
});

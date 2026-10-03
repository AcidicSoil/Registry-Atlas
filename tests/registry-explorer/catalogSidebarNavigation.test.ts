import { describe, expect, it } from 'vitest';
import { renderCatalogSidebarNavigation } from '../../src/registry-explorer/ui/catalogSidebarNavigation';
import type { CatalogFacetSummary } from '../../src/registry-explorer/core/catalogQuery';

const facets: CatalogFacetSummary = {
  categories: [{ value:'forms', count:42 },{value:'ai',count:12},{value:'dashboard',count:13},{value:'custom<script>',count:3}],
  registries:[{value:'@alpha',count:150},{value:'@beta',count:25}],
  itemTypes:[],reviewedCount:0,unreviewedCount:0,
};

describe('reference-library sidebar navigation', () => {
  it('shows the complete category index with counts and pressed state', () => {
    const html=renderCatalogSidebarNavigation(facets, {
      categories:['forms'],registry:'@beta',kind:'components',
      categorySearch:'',registrySearch:'',
    });
    expect(html).toContain('aria-label="Browse component categories"');
    expect(html).toContain('data-sidebar-category-search');
    expect(html).toContain('data-catalog-category-value="forms"');
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('42');
    expect(html).toContain('data-profile-registry="@beta"');
    expect(html).toContain('aria-current="page"');
    expect(html).toContain('data-sidebar-registry-search');
    expect(html).toContain('custom&lt;script&gt;');
    expect(html).not.toContain('custom<script>');
  });

  it('uses scoped filters on registry pages but still offers all registries', () => {
    const html=renderCatalogSidebarNavigation(facets, {
      categories:[],registry:'@alpha',kind:'registry',
      categorySearch:'ai',registrySearch:'beta',
    });
    expect(html).toContain('value="ai"');
    expect(html).toContain('value="beta"');
    expect(html).toContain('data-catalog-category-value=""');
    expect(html).toContain('data-profile-registry="@alpha"');
    expect(html).toContain('data-profile-registry="@beta"');
  });
});

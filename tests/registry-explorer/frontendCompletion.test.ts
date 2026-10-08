import { describe, expect, it } from 'vitest';
import { catalogRoutePath, parseCatalogRoute } from '../../src/registry-explorer/core/catalogRoutes';
import type { CatalogComponent } from '../../src/registry-explorer/core/catalogQuery';
import type { Registry } from '../../src/registry-explorer/core/registry.schema';
import { buildInstallAgentPrompt, buildInspectionPrompt } from '../../src/registry-explorer/core/itemPrompts';
import { buildBaseDetail } from '../../src/registry-explorer/core/registryItemDetail';
import { renderCatalogComponentCard } from '../../src/registry-explorer/ui/catalogComponentsView';

const BASE = '/Registry-Atlas/';

describe('frontend completion contract', () => {
  it('provides first-class block and page collection/detail routes', () => {
    expect(parseCatalogRoute(BASE + 'blocks', BASE)).toEqual({ kind: 'blocks' });
    expect(parseCatalogRoute(BASE + 'pages', BASE)).toEqual({ kind: 'pages' });
    expect(catalogRoutePath({ kind: 'block', namespace: '@demo', slug: 'dashboard' }, BASE))
      .toBe(BASE + '@demo/blocks/dashboard');
    expect(catalogRoutePath({ kind: 'page', namespace: '@demo', slug: 'login' }, BASE))
      .toBe(BASE + '@demo/pages/login');
  });

  it('renders a source-first card with library identity and no preview media', () => {
    const html = renderCatalogComponentCard(component(), 'block');
    expect(html).toContain('class="registry-icon');
    expect(html).toContain('src="https://delta.example/favicon.ico"');
    expect(html).toContain('href="/Registry-Atlas/@delta/blocks/dashboard"');
    expect(html).toContain('href="https://delta.example/components/dashboard"');
    expect(html).toContain('View block');
    expect(html).not.toContain('href="https://delta.example/r/dashboard.json"');
    expect(html).not.toContain('View item JSON');
    expect(html).not.toContain('<iframe');
    expect(html).not.toContain('catalog-component-preview');
    expect(html).not.toContain('catalog-component-specimen');
    expect(html).not.toContain('Visual reference');
    expect(html).not.toContain('Reference image');
  });

  it('copies concise operational prompts without defensive review gates', () => {
    const registry = component().registry;
    const detail = buildBaseDetail(registry, {
      name: 'dashboard',
      slug: 'dashboard',
      title: 'Dashboard',
      description: 'Dashboard block.',
      source: 'fixture',
      provenance: 'fixture',
      catalogStatus: 'available',
      routeEligible: true,
      rawItemUrl: 'https://delta.example/r/dashboard.json',
      dependencies: ['react'],
      files: [{ path: 'registry/dashboard.tsx', type: 'registry:block' }],
    });
    const install = buildInstallAgentPrompt(detail) ?? '';
    const inspect = buildInspectionPrompt(detail) ?? '';

    expect(install).toContain('Install Dashboard from @delta');
    expect(install).toContain('npx shadcn@latest add @delta/dashboard');
    expect(install).not.toContain('If the item is unsafe');
    expect(install).not.toContain('do not install it');
    expect(install).not.toContain('approval');
    expect(inspect).toContain('Inspect Dashboard from @delta');
    expect(inspect).toContain('Do not modify the repository.');
    expect(inspect).not.toContain('possible adoption');
    expect(inspect).not.toContain('Security, provenance, maintenance');
  });
});

function component(): CatalogComponent {
  const registry: Registry = {
    name: '@delta',
    url: 'https://delta.example',
    description: 'Delta registry.',
    mirror: {
      officialName: '@delta',
      registryUrlTemplate: 'https://delta.example/r/{name}.json',
      sourceUrl: 'https://ui.shadcn.com/r/registries.json',
      syncedAt: '2026-10-07T00:00:00.000Z',
      upstreamCount: 1,
      localCount: 1,
      warnings: [],
    },
  };
  return {
    id: '@delta:dashboard',
    namespace: '@delta',
    registry,
    slug: 'dashboard',
    displayName: 'Dashboard',
    type: 'registry:block',
    categories: ['dashboard'],
    reviewed: false,
    docsUrl: 'https://delta.example/components/dashboard',
    item: { name: 'dashboard', type: 'registry:block', kind: 'block' },
    routePath: '/Registry-Atlas/@delta/components/dashboard',
  };
}

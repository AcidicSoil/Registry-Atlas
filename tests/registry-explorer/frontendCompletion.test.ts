import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { catalogRoutePath, parseCatalogRoute } from '../../src/registry-explorer/core/catalogRoutes';
import type { CatalogComponent } from '../../src/registry-explorer/core/catalogQuery';
import type { Registry } from '../../src/registry-explorer/core/registry.schema';
import { buildSetupPrompt } from '../../src/registry-explorer/core/itemPrompts';
import { renderCatalogComponentCard } from '../../src/registry-explorer/ui/catalogComponentsView';

const BASE = '/Registry-Atlas/';

describe('frontend completion contract', () => {
  it('globally limits CSS motion when reduced motion is requested', () => {
    const css = readFileSync(new URL('../../public/styles/registry-explorer.css', import.meta.url), 'utf8');
    const media = css.match(/@media \(prefers-reduced-motion: reduce\) \{\s*\*,\s*\*::before,\s*\*::after \{([^}]+)\}/);
    expect(media).not.toBeNull();
    const rule = media?.[1] ?? '';
    expect(rule).toMatch(/transition-duration:\s*0\.01ms\s*!important/);
    expect(rule).toMatch(/animation-duration:\s*0\.01ms\s*!important/);
    expect(rule).toMatch(/animation-iteration-count:\s*1\s*!important/);
    expect(rule).toMatch(/scroll-behavior:\s*auto\s*!important/);
  });

  it('runs the dependency security audit as part of normal verification', () => {
    const pkg = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));
    expect(pkg.scripts['audit:dependencies']).toBe('pnpm audit --audit-level moderate');
    expect(pkg.scripts.verify).toContain('pnpm audit:dependencies &&');
  });

  it('provides a keyboard skip link to the focusable main content header', () => {
    const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
    const css = readFileSync(new URL('../../public/styles/registry-explorer.css', import.meta.url), 'utf8');
    expect(html).toContain('<a class="skip-link" href="#contentHeader">Skip to main content</a>');
    expect(html).toContain('id="contentHeader" tabindex="-1"');
    expect(css).toContain('.skip-link:focus-visible');
  });

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

  it('has no inert Copy link action across any catalog route header', () => {
    const views = [
      'catalogAuthorsView', 'catalogCollectionView', 'catalogCompareView',
      'catalogComponentsView', 'registryCollectionView', 'registryDirectoryView',
      'itemDetailView',
    ];

    for (const name of views) {
      const source = readFileSync(new URL(`../../src/registry-explorer/ui/${name}.ts`, import.meta.url), 'utf8');

      expect(source).not.toContain('data-copy-current-url');
      expect(source).not.toContain('Copy link');
    }

    const shell = readFileSync(new URL('../../src/registry-explorer/ui/shell.ts', import.meta.url), 'utf8');

    expect(shell).not.toContain('data-copy-current-url');
  });

  it('builds a setup brief for selected components without an inspection prompt', () => {
    const text = buildSetupPrompt([
      { token: '@delta/dashboard', label: 'Dashboard', registry: '@delta', item: 'dashboard' },
    ]);

    expect(text).toContain('npx shadcn@latest add @delta/dashboard');
    expect(text).toContain('wait for my approval');
    expect(text).not.toContain('npx shadcn@latest view');
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

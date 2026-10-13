import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');

const css = readFileSync(new URL('../../public/styles/registry-explorer.css', import.meta.url), 'utf8');

describe('21st.dev-inspired sidebar shell', () => {
  it('keeps browse routes as real links in the single desktop sidebar, not a top toolbar', () => {
    for (const [view, href] of [
      ['home', '/Registry-Atlas/'],
      ['discover', '/Registry-Atlas/components'],
      ['registries', '/Registry-Atlas/registries'],
      ['authors', '/Registry-Atlas/authors'],
      ['blocks', '/Registry-Atlas/blocks'],
    ]) {
      expect(html).toContain(`data-view="${view}" href="${href}"`);
    }

    const search = html.indexOf('id="searchInput"');
    const layout = html.indexOf('id="sidebarLayout"');
    const navigation = html.indexOf('class="primary-nav"');
    const filters = html.indexOf('id="aside"');

    expect(search).toBeLessThan(layout);
    expect(layout).toBeLessThan(navigation);
    expect(navigation).toBeLessThan(filters);
    expect(html).toContain('class="sidebar-body-scroll"');
    expect(css).toMatch(/\.sidebar-body-scroll\s*\{[^}]*overflow-y:\s*auto/s);
    expect(html).not.toContain('shadcn directory');
    expect(html).toContain('<details class="sidebar-collections"');
    expect(html).toContain('id="sidebarCollectionCurrent"');
    const nav = html.slice(navigation, filters);
    expect(nav).toContain('data-view="home"');
    expect(nav).toContain('data-view="authors"');
    expect(nav).toContain('data-view="registries"');
    expect(nav).toContain('data-view="icons"');
    expect(nav).toContain('data-view="compare"');
  });
});

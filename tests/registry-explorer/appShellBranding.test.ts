import { existsSync, readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');

describe('app-shell navigation and browser branding', () => {
  it('points both branded home links to the actual app base path', () => {
    expect(html.match(/class="brand brand-home-link" href="\/Registry-Atlas\/"/g)).toHaveLength(2);
    expect(html).toContain('aria-label="Registry Atlas home"');
  });

  it('includes valid and owned favicon metadata', () => {
    expect(html).toContain('rel="icon" type="image/png" sizes="32x32"');
    expect(html).toContain('rel="shortcut icon"');
    expect(html).toContain('rel="apple-touch-icon"');
    expect(html).toContain('name="theme-color"');
    expect(html).toContain('name="description"');
    expect(existsSync(new URL('../../public/registry-atlas/favicon-32x32.png', import.meta.url))).toBe(true);
    expect(existsSync(new URL('../../public/registry-atlas/favicon.ico', import.meta.url))).toBe(true);
  });

  it('uses native nested navigation disclosure', () => {
    expect(html).toContain('<details class="sidebar-collections">');
    expect(html).toContain('<summary>Collections');
    expect(html).toContain('aria-label="Catalog navigation"');
  });
});

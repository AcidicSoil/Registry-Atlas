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

    expect(css).toMatch(/\.app-sidebar > \.primary-nav \{[^}]*position:\s*static/s);
    expect(css).toMatch(/\.app-sidebar > \.primary-nav \{[^}]*flex-direction:\s*column/s);
    expect(html).not.toContain('shadcn directory');
  });
});

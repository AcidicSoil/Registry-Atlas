import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = (path: string): string => readFileSync(new URL('../../' + path, import.meta.url), 'utf8');

describe('catalog stylesheet ownership', () => {
  it('loads feature CSS after the base sheet in cascade order', () => {
    const html = source('index.html');

    const sheets = [
      'styles/registry-explorer.css',
      'src/registry-explorer/ui/catalog-reference.css',
      'src/registry-explorer/ui/catalog-hierarchy.css',
      'src/registry-explorer/ui/app-shell-core.css',
      'src/registry-explorer/ui/catalog-browse.css',
      'src/registry-explorer/ui/catalog-item-detail.css',
      'src/registry-explorer/ui/catalog-library-cards.css',
      'src/registry-explorer/ui/sidebar-browse-rail.css',
      'src/registry-explorer/ui/registry-directory-navigation.css',
      'src/registry-explorer/ui/sidebar-exemplar-rail.css',
    ];

    let previous = -1;

    for (const path of sheets) {
      const at = html.indexOf('href="/' + path + '"');

      expect(at).toBeGreaterThan(previous);
      const repoPath = path.startsWith('styles/') ? 'public/' + path : path;

      expect(source(repoPath).length).toBeGreaterThan(100);
      previous = at;
    }
  });

  it('keeps each feature-owned source in one stylesheet', () => {
    const base = source('public/styles/registry-explorer.css');
    const catalog = source('src/registry-explorer/ui/catalog-reference.css');
    const shell = source('src/registry-explorer/ui/app-shell-core.css');
    const browse = source('src/registry-explorer/ui/catalog-library-cards.css');
    const sidebar = source('src/registry-explorer/ui/sidebar-browse-rail.css');

    expect(base).not.toContain('21st.dev-reference catalogue surfaces');
    expect(catalog).toContain('21st.dev-reference catalogue surfaces');
    expect(shell).toContain('Sidebar-first shell correction');
    expect(browse).toContain('Source-backed catalog cards');
    expect(sidebar).toContain('Authoritative browse sidebar');
  });
});

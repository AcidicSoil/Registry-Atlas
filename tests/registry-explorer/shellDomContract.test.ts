import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(new URL('../../' + path, import.meta.url), 'utf8');

describe('app shell DOM ownership', () => {
  it('uses one kebab-case main identifier across markup, behavior and feature CSS', () => {
    expect(source('index.html')).toContain('<main id="app-main">');
    expect(source('index.html')).not.toContain('id="appMain"');

    for (const path of [
      'src/registry-explorer/ui/appShellPanels.ts',
      'src/registry-explorer/ui/registryProfilePanel.ts',
    ]) {
      expect(source(path)).toContain("getElementById('app-main')");
      expect(source(path)).not.toContain("getElementById('appMain')");
    }

    const styles = source('src/registry-explorer/ui/split-panels.css');

    expect(styles).toContain('main#app-main');
    expect(styles).not.toContain('#appMain');
  });

  it('uses clip-path for the existing screen-reader-only treatment', () => {
    const stylesheet = source('src/registry-explorer/ui/catalog-browse.css');

    expect(stylesheet).toContain('clip-path: inset(50%)');
    expect(stylesheet).not.toMatch(/(^|[;{])\s*clip:\s*rect\(/m);
  });
});

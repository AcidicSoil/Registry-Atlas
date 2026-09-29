import { describe, expect, it } from 'vitest';

interface NodeFsLike {
  readFileSync(path: string, encoding: 'utf8'): string;
}

const nodeProcess = (globalThis as typeof globalThis & {
  process?: { getBuiltinModule?: (specifier: string) => unknown };
}).process;
const fs = nodeProcess?.getBuiltinModule?.('node:fs') as NodeFsLike | undefined;
if (!fs) throw new Error('Node filesystem module is unavailable.');
const css = fs.readFileSync('public/styles/registry-explorer.css', 'utf8').toLowerCase();
const index = fs.readFileSync('index.html', 'utf8');
const entry = fs.readFileSync('src/registry-explorer/entry.ts', 'utf8');
const packageJson = fs.readFileSync('package.json', 'utf8');
const pagesFallback = fs.readFileSync('scripts/create-pages-spa-fallback.mjs', 'utf8');

describe('visual dictionary design contract', () => {
  it('uses the approved dark visual system and removes legacy effects', () => {
    expect(css).toContain('--background: #0b0c0e');
    expect(css).toContain('--card: #121316');
    expect(css).toContain('--primary: #4ea1ff');
    expect(css).toContain('--radius-button: 11px');
    expect(css).toContain('--radius-card: 14px');
    expect(css).not.toContain('#ffd95e');
    expect(css).not.toContain('#65d4ff');
    expect(css).not.toContain('#8b6cff');
    expect(css).not.toContain('fractalnoise');
  });

  it('keeps the real-catalog grid bounded and responsive', () => {
    expect(css).toMatch(/\.catalog-component-grid\s*\{[\s\S]*?repeat\(4,\s*minmax\(0,\s*1fr\)\)/);
    expect(css).toMatch(/@media \(max-width:\s*1180px\)[\s\S]*?\.catalog-component-grid\s*\{[\s\S]*?repeat\(3,/);
    expect(css).toMatch(/@media \(max-width:\s*860px\)[\s\S]*?\.catalog-component-grid[\s\S]*?repeat\(2,/);
    expect(css).toMatch(/@media \(max-width:\s*640px\)[\s\S]*?\.catalog-component-grid[\s\S]*?grid-template-columns:\s*1fr/);
    expect(css).toMatch(/aside\s*>\s*\.primary-nav\s*\{[\s\S]*?flex-direction:\s*column/);
    expect(css).toContain('.catalog-pagination');
    expect(css).toContain('.registry-directory-grid');
  });

  it('announces loading and data-load failures without extra helper UI', () => {
    expect(entry).toContain('class=\"empty-state\" role=\"status\"');
    expect(entry).toContain('aria-live=\"polite\"');
    expect(entry).toContain('class=\"empty-state\" role=\"alert\"');
  });

  it('keeps the global search and primary navigation keyboard-accessible', () => {
    expect(index).toContain('aria-label="Search components or registries"');
    expect(index).toContain('<nav class="primary-nav" aria-label="Primary navigation">');
    expect(index).toContain('data-view="discover">Components</button>');
    const navButtons = index.match(/<button[^>]*data-view="(?:discover|registries|compare)"[^>]*>/g) ?? [];
    expect(navButtons).toHaveLength(3);
    navButtons.forEach(button => expect(button).toContain('type="button"'));
  });

  it('emits a GitHub Pages SPA fallback from the built index entrypoint', () => {
    expect(packageJson).toContain('node scripts/create-pages-spa-fallback.mjs');
    expect(pagesFallback).toContain("path.join(directory, 'index.html')");
    expect(pagesFallback).toContain("path.join(directory, '404.html')");
    expect(pagesFallback).toContain('copyFile(indexPath, fallbackPath)');
  });
});

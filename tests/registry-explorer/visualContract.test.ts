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
const shell = fs.readFileSync('src/registry-explorer/ui/shell.ts', 'utf8');
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

  it('uses the full desktop viewport instead of a centered capped shell', () => {
    expect(css).toMatch(/\.app-inner\s*\{[\s\S]*?width:\s*100%/);
    expect(css).toMatch(/\.app-inner\s*\{[\s\S]*?max-width:\s*none/);
    expect(css).toMatch(/\.app-inner\s*\{[\s\S]*?margin:\s*0/);
    expect(css).toMatch(/\.app-inner\s*\{[\s\S]*?padding:\s*0/);
    expect(css).toMatch(/@media \(max-width:\s*1180px\)[\s\S]*?\.app-inner\s*\{[\s\S]*?padding-inline:\s*0/);
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

  it('styles the reference-shaped landing, browse rail, directory controls, and honest empty states', () => {
    expect(css).toContain('.atlas-hero');
    expect(css).toContain('.landing-metrics');
    expect(css).toContain('.landing-shortcuts');
    expect(css).toContain('.catalog-sidebar-routes');
    expect(css).toContain('.aside-route');
    expect(css).toContain('.mobile-browse-menu');
    expect(css).toContain('.registry-directory-controls');
    expect(css).toContain('.evidence-unavailable');
    expect(css).toMatch(/\.catalog-component-card:has\(\.catalog-component-metadata-specimen\) \.catalog-component-specimen\s*\{[\s\S]*?min-height:\s*0[\s\S]*?aspect-ratio:\s*auto/);
    expect(css).not.toContain('.catalog-component-placeholder');
    expect(css).not.toContain('.catalog-rail-search-control');
  });

  it('pins exemplar-shaped desktop geometry and measured boundary contrast', () => {
    expect(css).toContain('--border: rgba(255, 255, 255, 0.35)');
    expect(css).toContain('--input: rgba(255, 255, 255, 0.4)');
    expect(css).toMatch(/main\s*\{[\s\S]*?grid-template-columns:\s*240px\s+minmax\(0,\s*1fr\)/);
    expect(css).toMatch(/main\s*\{[\s\S]*?gap:\s*20px/);
    expect(css).toMatch(/\.app-header\s*\{[\s\S]*?min-height:\s*40px/);
    expect(css).toMatch(/\.registry-directory-grid\s*\{[\s\S]*?repeat\(3,\s*minmax\(0,\s*1fr\)\)/);
    expect(css).toMatch(/\.item-detail-page\s*\{[\s\S]*?width:\s*min\(100%,\s*800px\)/);
    expect(css).toMatch(/\.registry-profile-layout\s*\{[\s\S]*?minmax\(240px,\s*320px\)/);
  });

  it('replaces the desktop rail with a mobile facet sheet and fixed supported navigation', () => {
    expect(shell).toContain('class="mobile-bottom-nav"');
    expect(shell).toContain('role="dialog"');
    expect(shell).toContain('data-mobile-browse-close');
    expect(shell).toContain("mobileBrowse.addEventListener('toggle'");
    expect(shell).toContain("mobileBrowse.querySelector<HTMLElement>('[data-mobile-browse-close]')?.focus()");
    expect(css).toMatch(/\.mobile-bottom-nav\s*\{[\s\S]*?position:\s*fixed/);
    expect(css).toMatch(/\.mobile-bottom-nav\s*\{[\s\S]*?height:\s*57px/);
    expect(css).toMatch(/@media \(max-width:\s*860px\)[\s\S]*?\.desktop-browse-rail\s*\{[\s\S]*?display:\s*none/);
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

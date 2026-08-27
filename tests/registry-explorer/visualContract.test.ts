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

  it('keeps dense controls bounded and puts primary content first on narrow screens', () => {
    expect(css).toContain('.component-peek-inline');
    expect(css).toContain('.component-peek-image');
    expect(css).not.toContain('.component-peek-unavailable');
    expect(css).toContain('.item-preview-unavailable');
    expect(css).toMatch(/\.compare-picker-results\s*\{[\s\S]*?max-height:/);
    expect(css).toMatch(/\.compare-picker-results\s*\{[\s\S]*?overflow-y:\s*auto/);
    expect(css).toContain('.discovery-pagination');
    expect(css).not.toContain('.discovery-card.selected');
    expect(css).toMatch(/@media \(max-width:\s*860px\)[\s\S]*?\.content\s*\{[\s\S]*?order:\s*1/);
    expect(css).toMatch(/@media \(max-width:\s*860px\)[\s\S]*?aside\s*\{[\s\S]*?order:\s*2/);
  });

  it('announces loading and data-load failures without extra helper UI', () => {
    expect(entry).toContain('class=\"empty-state\" role=\"status\"');
    expect(entry).toContain('aria-live=\"polite\"');
    expect(entry).toContain('class=\"empty-state\" role=\"alert\"');
  });

  it('keeps the global search and primary navigation keyboard-accessible', () => {
    expect(index).toContain('aria-label="Search components, items, registries, or aliases"');
    const navButtons = index.match(/<button[^>]*data-view="(?:discover|registries|compare)"[^>]*>/g) ?? [];
    expect(navButtons).toHaveLength(3);
    navButtons.forEach(button => expect(button).toContain('type="button"'));
  });
});

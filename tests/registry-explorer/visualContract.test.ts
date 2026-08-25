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

  it('keeps the global search and primary navigation keyboard-accessible', () => {
    expect(index).toContain('aria-label="Search components, items, registries, or aliases"');
    const navButtons = index.match(/<button[^>]*data-view="(?:discover|registries|compare)"[^>]*>/g) ?? [];
    expect(navButtons).toHaveLength(3);
    navButtons.forEach(button => expect(button).toContain('type="button"'));
  });
});

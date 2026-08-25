import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('public/styles/registry-explorer.css', 'utf8').toLowerCase();

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
});

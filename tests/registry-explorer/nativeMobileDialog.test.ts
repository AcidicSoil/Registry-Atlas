import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');

const entry = readFileSync(new URL('../../src/registry-explorer/entry.ts', import.meta.url), 'utf8');

const css = readFileSync(new URL('../../public/styles/registry-explorer.css', import.meta.url), 'utf8');

describe('native mobile navigation dialog', () => {
  it('uses a real modal element, not an aside claiming aria-modal', () => {
    expect(html).toContain('<dialog id="mobileSidebarDialog"');
    expect(entry).toContain('showModal()');
    expect(entry).toContain('.close()');
    expect(entry).not.toContain("setAttribute('aria-modal'");
    expect(entry).not.toContain("event.key === 'Tab'");
    expect(css).toContain('.mobile-sidebar-dialog::backdrop');
  });
});

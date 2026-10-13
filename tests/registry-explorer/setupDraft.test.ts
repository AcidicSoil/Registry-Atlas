import { describe, expect, it } from 'vitest';
import { parseSetupDraft, serializeSetupDraft } from '../../src/registry-explorer/core/setupDraft';
import { buildSetupPrompt } from '../../src/registry-explorer/core/itemPrompts';

const items = [
  { token: '@alpha/button', label: 'Button', registry: '@alpha', item: 'button',
    path: '/Registry-Atlas/@alpha/components/button' },
  { token: '@beta/chart', label: 'Chart', registry: '@beta', item: 'chart' },
];

describe('local setup draft', () => {
  it('round-trips selected components and user instructions', () => {
    const draft = { items, instructions: 'Use the existing theme.' };
    expect(parseSetupDraft(serializeSetupDraft(draft))).toEqual(draft);
  });
  it('recovers from broken and untrusted storage without rendering arbitrary tokens', () => {
    expect(parseSetupDraft('{broken')).toEqual({ items: [], instructions: '' });
    expect(parseSetupDraft(JSON.stringify({ version: 1, instructions: 'x', items: [
      { ...items[0], token: 'malicious token' }, items[0], items[0],
      { ...items[1], path: '//example.com' },
    ] }))).toEqual({ items: [items[0], { ...items[1] }], instructions: 'x' });
  });
  it('builds one install brief without an inspection prompt or fabricated results', () => {
    const text = buildSetupPrompt(items, 'Keep my theme.');
    expect(text).toContain('npx shadcn@latest add @alpha/button @beta/chart');
    expect(text).toContain('Keep my theme.');
    expect(text).toContain('wait for my approval');
    expect(text).not.toContain('Inspect:');
    expect(text).not.toContain('npx shadcn@latest view');
    expect(buildSetupPrompt([])).toBeNull();
  });
});

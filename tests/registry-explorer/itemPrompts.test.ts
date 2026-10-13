import { describe, expect, it } from 'vitest';
import { buildSetupPrompt } from '../../src/registry-explorer/core/itemPrompts';

describe('setup prompt', () => {
  it("only describes selected install tokens and the user's requirements", () => {
    const prompt = buildSetupPrompt([
      { token: '@delta/code-block', label: 'Code Block', registry: '@delta', item: 'code-block' },
    ], 'Keep our current styling.');

    expect(prompt).toContain('npx shadcn@latest add @delta/code-block');
    expect(prompt).toContain('Keep our current styling.');
    expect(prompt).toContain('wait for my approval');
    expect(prompt).not.toContain('inspection prompt');
    expect(prompt).not.toContain('npx shadcn@latest view');
  });
  it('omits the prompt for an empty setup', () => {
    expect(buildSetupPrompt([])).toBeNull();
  });
});

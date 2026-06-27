import { describe, expect, it } from 'vitest';
import { resolveRegistryItemRoute } from '../../src/registry-explorer/core/itemRoutes';

describe('resolveRegistryItemRoute', () => {
  it('resolves valid registry item routes', () => {
    expect(resolveRegistryItemRoute('@example', 'https://example.com/r/{name}.json', 'button')).toEqual({
      status: 'available',
      label: 'Open item route',
      url: 'https://example.com/r/button.json',
    });
  });

  it('rejects missing and invalid item slugs', () => {
    expect(resolveRegistryItemRoute('@example', 'https://example.com/r/{name}.json', '')).toEqual({
      status: 'missing-item-slug',
      label: 'Item route unavailable',
      url: null,
    });
    expect(resolveRegistryItemRoute('@example', 'https://example.com/r/{name}.json', '../button')).toEqual({
      status: 'invalid-item-slug',
      label: 'Item route unavailable',
      url: null,
    });
  });

  it('rejects templates without the name token', () => {
    expect(resolveRegistryItemRoute('@example', 'https://example.com/r/button.json', 'button')).toEqual({
      status: 'invalid-template',
      label: 'Item route unavailable',
      url: null,
    });
  });

  it('rejects disallowed and protocol-relative resolved URLs', () => {
    expect(resolveRegistryItemRoute('@example', 'javascript:alert({name})', 'button').status).toBe('invalid-url');
    expect(resolveRegistryItemRoute('@example', '//example.com/r/{name}.json', 'button').status).toBe('invalid-url');
  });

  it('rejects unresolved template placeholders unless a raw item URL is provided', () => {
    expect(resolveRegistryItemRoute('@diceui', 'https://diceui.com/r/{style}/{name}.json', 'action-bar')).toEqual({
      status: 'unresolved-template',
      label: 'Item route unavailable',
      url: null,
    });
    expect(resolveRegistryItemRoute(
      '@diceui',
      'https://diceui.com/r/{style}/{name}.json',
      'action-bar',
      'https://diceui.com/r/action-bar.json',
    )).toEqual({
      status: 'available',
      label: 'Open item route',
      url: 'https://diceui.com/r/action-bar.json',
    });
  });
});

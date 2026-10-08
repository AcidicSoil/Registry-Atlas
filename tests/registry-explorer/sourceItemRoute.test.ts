import { describe, expect, it } from 'vitest';
import {
  resolveSourceItemRoute,
  resolveSourcePattern,
  safeSourcePage,
} from '../../src/registry-explorer/core/sourceItemRoute';

describe('source item route resolution', () => {
  it('resolves a single verified generic component pattern', () => {
    expect(resolveSourceItemRoute({
      homepage: 'https://000h.cojeev.com/',
      slug: 'accordion',
      kind: 'component',
      patterns: [{
        urlTemplate: 'https://000h.cojeev.com/docs/{slug}/',
        slugPrefix: '',
        source: 'browser-observed',
      }],
    })).toBe('https://000h.cojeev.com/docs/accordion/');
  });

  it('uses the stored slug prefix for prefix-based registries', () => {
    expect(resolveSourcePattern({
      urlTemplate: 'https://animate-ui.com/docs/components/animate/{leaf}',
      slugPrefix: 'components-animate-',
      source: 'browser-observed',
    }, 'components-animate-avatar-group', 'https://animate-ui.com/'))
      .toBe('https://animate-ui.com/docs/components/animate/avatar-group');
  });

  it('prefers the route family that matches the card kind', () => {
    expect(resolveSourceItemRoute({
      homepage: 'https://www.8bitcn.com/',
      slug: 'button',
      kind: 'component',
      patterns: [
        {
          urlTemplate: 'https://www.8bitcn.com/docs/components/{slug}',
          slugPrefix: '',
          source: 'browser-observed',
        },
        {
          urlTemplate: 'https://www.8bitcn.com/docs/blocks/gaming/{slug}',
          slugPrefix: '',
          source: 'browser-observed',
        },
      ],
    })).toBe('https://www.8bitcn.com/docs/components/button');
  });

  it('uses category and slug tokens to choose among block pattern families', () => {
    expect(resolveSourceItemRoute({
      homepage: 'https://ui.aceternity.com/',
      slug: 'hero-section-with-grid-background',
      kind: 'block',
      categories: ['hero sections'],
      patterns: [
        {
          urlTemplate: 'https://ui.aceternity.com/blocks/hero-sections/{slug}',
          slugPrefix: '',
          source: 'official-sitemap',
        },
        {
          urlTemplate: 'https://ui.aceternity.com/blocks/testimonials/{slug}',
          slugPrefix: '',
          source: 'official-sitemap',
        },
      ],
    })).toBe('https://ui.aceternity.com/blocks/hero-sections/hero-section-with-grid-background');
  });

  it('prefers an exact stored item route over pattern inference', () => {
    expect(resolveSourceItemRoute({
      homepage: 'https://example.com/',
      slug: 'button',
      kind: 'component',
      directRoute: {
        url: 'https://example.com/library/button',
        status: 'pattern-observed',
      },
      patterns: [{
        urlTemplate: 'https://example.com/components/{slug}',
        slugPrefix: '',
        source: 'browser-observed',
      }],
    })).toBe('https://example.com/library/button');
  });

  it('refuses an unresolved tie instead of guessing a source page', () => {
    expect(resolveSourceItemRoute({
      homepage: 'https://example.com/',
      slug: 'advanced1',
      kind: 'block',
      patterns: [
        {
          urlTemplate: 'https://example.com/blocks/gaming/{slug}',
          slugPrefix: '',
          source: 'browser-observed',
        },
        {
          urlTemplate: 'https://example.com/blocks/authentication/{slug}',
          slugPrefix: '',
          source: 'browser-observed',
        },
      ],
    })).toBeNull();
  });

  it.each([
    'https://other.example.com/components/button',
    'https://example.com/r/button.json',
    'http://example.com/components/button',
    'https://example.com/',
  ])('rejects unsafe or non-page URLs: %s', url => {
    expect(safeSourcePage(url, 'https://example.com/')).toBeNull();
  });
});

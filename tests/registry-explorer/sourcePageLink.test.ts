import { describe, expect, it } from 'vitest';
import { verifiedRegistryHomepage, verifiedSourcePageUrl } from '../../src/registry-explorer/ui/sourcePageLink';

describe('original registry page link policy', () => {
  it('distinguishes pattern-matched links from individually reviewed pages',async()=> {
    const {sourcePageNavigation}=await import('../../src/registry-explorer/ui/sourcePageLink');
    const navigation=sourcePageNavigation('https://example.org/',{
      sourcePage:{url:'https://example.org/docs/button',level:'pattern',
        source:'verified-route-pattern',observedAt:new Date().toISOString()},
    });
    expect(navigation).toMatchObject({
      url:'https://example.org/docs/button',level:'pattern',label:'View pattern-matched page',
    });
  });
  const home = 'https://example.org/';
  it('keeps exact observed nested documentation routes and query-based component pages', () => {
    expect(verifiedSourcePageUrl('https://example.org/docs/forms/button', home))
      .toBe('https://example.org/docs/forms/button');
    expect(verifiedSourcePageUrl('https://example.org/?component=button', home))
      .toBe('https://example.org/?component=button');
  });
  it.each([
    'https://example.org/',
    'https://example.org/r/button.json',
    'https://example.org/r/button.JSON/',
    'https://another.example.org/docs/button',
    'http://example.org/docs/button',
    'https://user:pass@example.org/docs/button',
    'https://example.org:8443/docs/button',
    'javascript:alert(1)',
    '//example.org/docs/button',
  ])('does not claim unsafe or generic documentation: %s', url => {
    expect(verifiedSourcePageUrl(url, home)).toBeNull();
  });
  it('rejects private, malformed, and non-HTTPS registries', () => {
    for (const url of ['http://example.org/', 'http://localhost:5190',
      'https://127.0.0.1/', 'https://internal.local/', 'javascript:alert(1)',
      'https://example.org:8443/']) {
      expect(verifiedRegistryHomepage(url)).toBeNull();
    }
  });
  it('keeps safe source registry homepages separate from component pages', () => {
    expect(verifiedRegistryHomepage(home)).toBe(home);
    expect(verifiedSourcePageUrl(home, home)).toBeNull();
  });
});

import { describe, expect, it } from 'vitest';
import { verifiedRegistryHomepage, verifiedSourcePageUrl, sourcePageNavigationForItem } from '../../src/registry-explorer/ui/sourcePageLink';

describe('original registry page link policy', () => {
  it.each([
    ['demo-p-aspect-ratio-02', 'example-43-standard-aspect-ratio'],
    ['demo-p-aspect-ratio-03', 'example-11-square-aspect-ratio'],
    ['demo-p-aspect-ratio-04', 'example-219-ultrawide-aspect-ratio'],
    ['demo-p-aspect-ratio-05', 'example-916-portrait-aspect-ratio'],
    ['demo-p-aspect-ratio-06', 'example-32-classic-photography-aspect-ratio'],
    ['demo-p-aspect-ratio-07', 'example-45-social-media-portrait-aspect-ratio'],
    ['demo-p-aspect-ratio-08', 'example-1610-computer-monitor-aspect-ratio'],
  ])('links the observed Space UI demo %s to its original anchored example', (slug, anchor) => {
    const result = sourcePageNavigationForItem('@spaceui', slug, 'https://www.spaceui.one/', {});
    expect(result?.url).toBe(`https://www.spaceui.one/primitives/aspect-ratio#${anchor}`);
    expect(result?.url).not.toContain('/Registry-Atlas/');
    expect(result?.level).toBe('observed');
  });

  it('never infers an upstream page for an unobserved slug or another registry host', () => {
    expect(sourcePageNavigationForItem('@spaceui', 'demo-p-aspect-ratio-99', 'https://www.spaceui.one/', {})).toBeNull();
    expect(sourcePageNavigationForItem('@spaceui', 'demo-p-aspect-ratio-03', 'https://example.org/', {})).toBeNull();
    expect(sourcePageNavigationForItem('@other', 'demo-p-aspect-ratio-03', 'https://www.spaceui.one/', {})).toBeNull();
  });

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

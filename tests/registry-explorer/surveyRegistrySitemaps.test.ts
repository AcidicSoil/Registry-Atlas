import { describe, expect, it } from 'vitest';
// @ts-expect-error Node ESM source script without TS declarations.
import { sitemapUrlCandidates, sitemapXmlLinks, parseRobotsSitemaps } from '../../scripts/survey-registry-sitemaps.mjs';

describe('official registry sitemap route inventory', () => {
  it('discovers nested sitemap indexes and decodes source-declared URLs', () => {
    expect(parseRobotsSitemaps('Sitemap: https://alpha.example/sitemap-main.xml\n#comment\n'))
      .toEqual(['https://alpha.example/sitemap-main.xml']);
    expect(sitemapXmlLinks('<sitemapindex><sitemap><loc>https://alpha.example/docs.xml</loc></sitemap></sitemapindex>').kind)
      .toBe('index');
    expect(sitemapXmlLinks('<urlset><url><loc>https://alpha.example/docs/button?x=1&amp;y=2</loc></url></urlset>').urls)
      .toEqual(['https://alpha.example/docs/button?x=1&y=2']);
  });

  it('rejects two conflicting source URLs for one identity', () => {
    expect(sitemapUrlCandidates('https://alpha.example/', ['button'], [
      'https://alpha.example/docs/button', 'https://alpha.example/examples/button',
      'https://alpha.example/buttons/button',
    ])).toEqual([]);
  });
  it('only matches exact catalog identity suffixes from actual same-origin sitemap paths', () => {
    const matched=sitemapUrlCandidates('https://alpha.example/',[
      'button','card','components-animate-avatar-group','components-animate-code',
    ],[
      'https://alpha.example/docs/button',
      'https://alpha.example/docs/card/',
      'https://alpha.example/docs/components/animate/avatar-group',
      'https://alpha.example/docs/components/animate/code',
      'https://other.example/docs/button',
      'http://alpha.example/docs/card',
      'https://alpha.example/r/button.json',
      'https://alpha.example/docs/not-button',
    ]);
    expect(matched).toEqual([
      {slug:'button',url:'https://alpha.example/docs/button'},
      {slug:'card',url:'https://alpha.example/docs/card/'},
      {slug:'components-animate-avatar-group',
        url:'https://alpha.example/docs/components/animate/avatar-group'},
      {slug:'components-animate-code',
        url:'https://alpha.example/docs/components/animate/code'},
    ]);
  });
});

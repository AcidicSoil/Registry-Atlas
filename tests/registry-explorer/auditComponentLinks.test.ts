import { describe, expect, it } from 'vitest';
// @ts-ignore Standalone Node ESM script.
import { inventoryLinks, applyVerifiedLinks } from '../../scripts/audit-component-links.mjs';

const registries = [
  { name: '@delta', homepage: 'https://delta.example', url: 'https://delta.example/r/{name}.json' },
  { name: '@other', homepage: 'https://other.example', url: 'https://other.example/r/{name}.json' },
];
const catalog = { registries: { '@delta': [{ name: 'button' }, { name: 'card' }], '@other': [{ name: 'switch' }] } };
const curated = {
  '@delta': [{ slug: 'button', name: 'Button', docs_url: 'https://delta.example/docs/old', raw_item_url: 'https://delta.example/r/button.json' },
    { slug: 'orphan', name: 'Orphan', docs_url: 'https://delta.example/docs/orphan' }],
};
const observation = {
  namespace: '@delta', slug: 'button', previousUrl: 'https://delta.example/docs/old',
  verifiedUrl: 'https://delta.example/components/button',
  browser: {
    homepageUrl: 'https://delta.example/', listingUrl: 'https://delta.example/components',
    observedUrl: 'https://delta.example/components/button', observedSlug: 'button',
    renderedHeading: 'Button', checkedAt: '2026-10-01T19:00:00.000Z',
    capturePath: '/tmp/pinchtab-delta-button.png',
  },
};

describe('registry component link audit', () => {
  it('accounts for every indexed item and curated-only record without inventing docs URLs', () => {
    const report = inventoryLinks(registries, catalog, curated);
    expect(report.totals).toMatchObject({ registries: 2, items: 4, docsLinks: 2, missingDocsLinks: 2 });
    expect(report.rows.map((r: { token: string }) => r.token)).toEqual(
      ['@delta/button', '@delta/card', '@delta/orphan', '@other/switch'],
    );
    expect(report.rows.find((r: { token: string }) => r.token === '@delta/card')?.docsUrl).toBeNull();
    expect(report.rows.find((r: { token: string }) => r.token === '@delta/button')?.rawItemUrl)
      .toBe('https://delta.example/r/button.json');
    expect(report.totals.registryCoverage).toBe(0);
    expect(report.totals).toMatchObject({ catalogEntries: 3, duplicateCatalogEntries: 0 });
    const duplicate = inventoryLinks(registries, { registries: { ...catalog.registries,
      '@delta': [...catalog.registries['@delta'], { name: 'button', type: 'registry:block' }] } }, curated);
    expect(duplicate.totals).toMatchObject({ catalogEntries: 4, duplicateCatalogEntries: 1, items: 4 });
  });

  it('updates an exact existing item only after recorded browser identity and URL agreement', () => {
    const report = inventoryLinks(registries, catalog, curated);
    const result = applyVerifiedLinks(report, curated, [observation]);
    expect(result.repaired).toEqual(['@delta/button']);
    expect(result.verifiedUrls).toEqual([{ token: '@delta/button', url: observation.verifiedUrl,
      homepageUrl: observation.browser.homepageUrl, listingUrl: observation.browser.listingUrl,
      capturePath: observation.browser.capturePath, checkedAt: observation.browser.checkedAt,
      routePattern: null, exception: false }]);
    expect(result.curated['@delta'][0].docs_url).toBe('https://delta.example/components/button');
    expect(result.curated['@delta'][1].docs_url).toBe('https://delta.example/docs/orphan');
    expect(curated['@delta'][0].docs_url).toBe('https://delta.example/docs/old');
    expect(applyVerifiedLinks(inventoryLinks(registries, catalog, result.curated), result.curated,
      [{ ...observation, previousUrl: observation.verifiedUrl }]).repaired).toEqual([]);
  });

  it('supports explicitly witnessed query-based component-page exceptions', () => {
    const verifiedUrl = 'https://delta.example/?component=button';
    const result = applyVerifiedLinks(inventoryLinks(registries, catalog, curated), curated,
      [{ ...observation, verifiedUrl, exception: true,
        browser: { ...observation.browser, observedUrl: verifiedUrl } }]);
    expect(result.repaired).toEqual(['@delta/button']);
    expect(result.verifiedUrls[0]).toMatchObject({ url: verifiedUrl, exception: true });
  });

  it.each([
    [{ ...observation, previousUrl: 'https://delta.example/docs/other' }, 'stale-existing-url'],
    [{ ...observation, verifiedUrl: 'https://delta.example/' }, 'generic-homepage'],
    [{ ...observation, verifiedUrl: 'https://delta.example/components/elsewhere' }, 'browser-url-mismatch'],
    [{ ...observation, browser: { ...observation.browser, observedSlug: 'card' } }, 'browser-identity-mismatch'],
    [{ ...observation, browser: { ...observation.browser, capturePath: '' } }, 'missing-browser-evidence'],
    [{ ...observation, verifiedUrl: 'http://127.0.0.1/admin' }, 'invalid-public-url'],
    [{ ...observation, slug: 'unknown' }, 'unrecognized-item'],
  ] as const)('rejects unsupported or ambiguous link corrections (%s)', (candidate, reason) => {
    const result = applyVerifiedLinks(inventoryLinks(registries, catalog, curated), curated, [candidate]);
    expect(result.repaired).toEqual([]);
    expect(result.unresolved).toMatchObject([{ token: `@delta/${candidate.slug}`, reason }]);
  });
  it('rejects conflicting evidence and cannot silently drop existing links', () => {
    const report = inventoryLinks(registries, catalog, curated);
    const result = applyVerifiedLinks(report, curated,
      [observation, { ...observation, verifiedUrl: 'https://delta.example/components/button-2' }]);
    expect(result.repaired).toEqual([]);
    expect(result.unresolved.map((x: { reason: string }) => x.reason)).toContain('duplicate-evidence');
    expect(result.curated).toEqual(curated);
  });
});

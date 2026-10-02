import { describe, expect, it } from 'vitest';
// @ts-ignore standalone Node ESM.
import { planRegistryCrawl, runRegistryCrawl, summarizeRegistryCrawl, proposeVerifiedLinkUpdates, collectQualifiedRegistryRoutes } from '../../scripts/crawl-component-links.mjs';

const registries = [
  { name: '@a', homepage: 'https://a.example', url: 'https://a.example/r/{name}.json' },
  { name: '@b', homepage: 'https://b.example', url: 'https://b.example/r/{name}.json' },
  { name: '@empty', homepage: 'https://empty.example', url: 'https://empty.example/r/{name}.json' },
];
const catalog = { registries: {
  '@a': [{ name: 'button', type: 'registry:ui' }, { name: 'card', type: 'registry:ui' },
    { name: 'card', type: 'registry:block' }],
  '@b': [{ name: 'switch', type: 'registry:ui' }],
} };
const curated = { '@a': [{ slug: 'button', docs_url: 'https://a.example/old' },
  { slug: 'orphan', docs_url: 'https://a.example/orphan' }] };
function fakeBrowser() {
  let url = 'https://a.example/'; const navigations: string[] = [];
  return {
    navigations,
    url: async () => url,
    nav: async (next: string) => { url = next; navigations.push(next); },
    snap: async () => ({ url, nodes: [
      { role: 'link', ref: 'e1', name: 'Components' },
      { role: 'link', ref: 'e2', name: 'Button' },
      { role: 'heading', name: 'Button' },
    ] }),
  };
}
function memoryJournal() {
  const entries = new Map<string, any>();
  return {
    entries, get: (key: string) => entries.get(key),
    append: async (value: any) => { if (entries.has(value.token)) throw Error('duplicate write'); entries.set(value.token, value); },
  };
}

describe('autonomous full-catalog URL crawler', () => {
  it('plans every upstream registry, deduplicates indexed identities, and includes curated-only items', () => {
    const jobs = planRegistryCrawl(registries, catalog, curated);
    expect(jobs.map((j: any) => j.registry.name)).toEqual(['@a', '@b', '@empty']);
    expect(jobs[0].targets.map((x: any) => x.slug)).toEqual(['button', 'card', 'orphan']);
    expect(jobs[2].targets).toEqual([]);
    expect(jobs[0].targets[0].docs_url).toBe('https://a.example/old');
    expect(planRegistryCrawl(registries, catalog, curated,
      { registry: '@a', slug: 'card' })[0].targets.map((item: any) => item.slug)).toEqual(['card']);
  });
  it('handles a complete sample batch', async () => {
    const journal = memoryJournal();
    const browser = fakeBrowser();
    let calls = 0;
    const collect = async (_browser: any, reg: any, targets: any[]) => {
      calls++;
      expect(reg.name).toBe('@a');
      return { homepageUrl: 'https://a.example/', listingUrl: 'https://a.example/components',
        records: targets.filter(x => x.slug === 'button').map(x => ({
          namespace: reg.name, slug: x.slug, verifiedUrl: 'https://a.example/components/button',
          browser: { renderedHeading: 'Button', observedSlug: 'button',
            observedUrl: 'https://a.example/components/button', capturePath: '/fake/screenshot.jpg' },
        })),
        unresolved: targets.filter(x => x.slug !== 'button').map(x => ({
          slug: x.slug, reason: 'missing-unique-component-link',
        })),
      };
    };
    const jobs = planRegistryCrawl(registries, catalog, curated, { registry: '@a' });
    const result = await runRegistryCrawl({ jobs, browser, journal, collect, batchSize: 2, delayMs: 0,
      siteAllowed: (r: any) => r.name === '@a', probe: async () => ({ status: 'unresolved' }),
      verifyPage: async () => true });
    expect(calls).toBe(2);
    expect(result).toMatchObject({ verified: 1, unresolved: 2, pending: 0 });
    expect(journal.get('@a/button').status).toBe('verified');
    expect(journal.get('@a/button').evidence.browser.capturePath).toBeNull();
    expect(journal.get('@a/card').reason).toBe('missing-unique-component-link');
    expect(journal.get('@a/orphan').status).toBe('unresolved');
    expect(browser.navigations).toEqual(['https://a.example/', 'https://a.example/']);
  });
  it('resumes finished items and records unavailable registry domains', async () => {
    const journal = memoryJournal();
    await journal.append({ token: '@a/button', status: 'verified', verifiedUrl: 'https://a.example/components/button' });
    const result = await runRegistryCrawl({ jobs: planRegistryCrawl(registries, catalog, curated),
      browser: fakeBrowser(), journal, batchSize: 10, delayMs: 0,
      siteAllowed: (r: any) => r.name === '@a', probe: async () => ({ status: 'unresolved' }),
      collect: async (_browser: any, _reg: any, targets: any[]) => ({
        records: [], unresolved: targets.map(x => ({ slug: x.slug, reason: 'no-safe-catalog-link' })),
      }), verifyPage: async () => true });
    expect(result).toMatchObject({ verified: 1, unresolved: 4, blocked: 2 });
    expect(journal.get('@b/switch').reason).toBe('profile-domain-not-allowed');
    expect(journal.get('registry:@empty').reason).toBe('profile-domain-not-allowed');
  });
  it('never verifies a page without independent destination confirmation', async () => {
    const journal = memoryJournal();
    const result = await runRegistryCrawl({
      jobs: planRegistryCrawl(registries, catalog, curated, { registry: '@a' }),
      browser: fakeBrowser(), journal, batchSize: 5, delayMs: 0,
      siteAllowed: (r: any) => r.name === '@a', probe: async () => ({ status: 'verified' }),
      collect: async () => ({ records: [{
        namespace: '@a', slug: 'button', verifiedUrl: 'https://a.example/components/card',
      }], unresolved: [] }),
      verifyPage: async () => false,
    });
    expect(result.verified).toBe(0);
    expect(journal.get('@a/button').reason).toBe('source-identity-mismatch');
    expect(journal.get('@a/card').reason).toBe('collector-omitted-item');
  });
  it('does not capture screenshots and keeps a strict partial-batch item limit', async () => {
    const journal = memoryJournal();
    const captured: string[] = [];
    const result = await runRegistryCrawl({
      jobs: planRegistryCrawl(registries, catalog, curated, { registry: '@a' }),
      browser: { ...fakeBrowser(), capture: async (path: string) => { captured.push(path); throw Error('screenshots prohibited'); } },
      journal, delayMs: 0, maxItemsPerRun: 1, batchSize: 10,
      siteAllowed: () => true, probe: async () => ({ status: 'unresolved' }),
      collect: async (b: any, _reg: any, targets: any[]) => {
        expect(targets).toHaveLength(1);
        expect(await b.capture('/would-have-been.jpg')).toEqual({
          url: 'https://a.example/', capturePath: null,
        });
        return { records: [], unresolved: [{ slug: 'button', reason: 'not-visible' }] };
      },
      verifyPage: async () => false,
    });
    expect(captured).toEqual([]);
    expect(result).toMatchObject({ pending: 2, unresolved: 1 });
  });
  it('reports empty registries and preserves not-attempted counts', async () => {
    const journal = memoryJournal();
    const result = await runRegistryCrawl({
      jobs: planRegistryCrawl(registries, catalog, curated, { registry: '@empty' }),
      browser: fakeBrowser(), journal, batchSize: 5, delayMs: 0,
      siteAllowed: (r: any) => r.name === '@empty', probe: async () => ({ status: 'unresolved' }),
      collect: async () => ({ records: [], unresolved: [{ reason: 'no-safe-catalog-link' }] }),
      verifyPage: async () => true,
    });
    expect(result).toMatchObject({ verified: 0, unresolved: 1, pending: 0 });
    expect(journal.get('registry:@empty').reason).toBe('no-safe-catalog-link');
    const overall = summarizeRegistryCrawl(planRegistryCrawl(registries, catalog, curated), journal);
    expect(overall).toMatchObject({ registries: 3, items: 4, pending: 4, complete: false });
  });
});

describe('applying verified crawler results to Atlas sources', () => {
  const current = { '@a': [{ slug: 'button', name: 'Button',
    type: 'registry:ui', docs_url: 'https://a.example/old' }] };
  const runtime = { registries: [{ official: { name: '@a' },
    atlas: { item_summaries: [{ slug: 'button', name: 'Button',
      docs_url: 'https://a.example/old' }] } }] };
  const jobs = planRegistryCrawl([registries[0]], catalog, current, { registry: '@a' });
  function trustedEntry(slug: string, url: string, previousUrl: string | null) {
    return { token: '@a/' + slug, registry: '@a', slug, status: 'verified', verifiedUrl: url,
      evidence: { namespace: '@a', slug, previousUrl, verifiedUrl: url,
        browser: { observedUrl: url, observedSlug: slug,
          renderedHeading: slug === 'button' ? 'Button' : 'Card',
          homepageUrl: 'https://a.example/', listingUrl: 'https://a.example/components',
          checkedAt: '2026-10-01T19:00:00Z' } } };
  }
  it('repairs an exact item and adds a documented indexed identity without rewriting other fields', async () => {
    const journal = memoryJournal();
    await journal.append(trustedEntry('button', 'https://a.example/components/button',
      'https://a.example/old'));
    await journal.append(trustedEntry('card', 'https://a.example/components/card', null));
    const unambiguousJobs = planRegistryCrawl([registries[0]], {
      registries: { '@a': [{ name: 'button', type: 'registry:ui' },
        { name: 'card', type: 'registry:ui' }] },
    }, current, { registry: '@a' });
    const change = proposeVerifiedLinkUpdates(unambiguousJobs, journal, current, runtime);
    expect(change.unresolved).toEqual([]);
    expect(change.changes.map((x: any) => x.token)).toEqual(['@a/button', '@a/card']);
    expect(change.curated['@a'].find((x: any) => x.slug === 'button').docs_url)
      .toBe('https://a.example/components/button');
    expect(change.curated['@a'].find((x: any) => x.slug === 'card')).toMatchObject({
      docs_url: 'https://a.example/components/card', route_eligible: true,
      type: 'registry:ui',
    });
    expect(change.runtime.registries[0].atlas.item_summaries.find((x: any) => x.slug === 'card'))
      .toMatchObject({ docs_url: 'https://a.example/components/card' });
    expect(current['@a'][0].docs_url).toBe('https://a.example/old');
  });
  it('refuses stale source fields and forged browser destination identities', async () => {
    const journal = memoryJournal();
    await journal.append(trustedEntry('button', 'https://a.example/components/button',
      'https://a.example/different-old'));
    await journal.append(trustedEntry('card', 'https://another.example/components/card', null));
    const change = proposeVerifiedLinkUpdates(jobs, journal, current, runtime);
    expect(change.changes).toEqual([]);
    expect(change.unresolved).toMatchObject([
      { token: '@a/button', reason: 'source-link-changed' },
      { token: '@a/card', reason: 'unverified-source-identity' },
    ]);
    expect(change.curated).toEqual(current);
    expect(change.runtime).toEqual(runtime);
  });
});

describe('qualified registry route discovery', () => {
  const reg = { name: '@animate-ui', homepage: 'https://animate-ui.com',
    url: 'https://animate-ui.com/r/{name}.json' };
  const HOME = 'https://animate-ui.com/';
  const INDEX = 'https://animate-ui.com/docs/components';
  const PRIMITIVES = 'https://animate-ui.com/docs/primitives';
  const primitiveRadix = 'https://animate-ui.com/docs/primitives/radix/accordion';
  const radix = 'https://animate-ui.com/docs/components/radix/accordion';
  const base = 'https://animate-ui.com/docs/components/base/accordion';
  const pages = new Map([
    [HOME, { nodes: [], anchors: [{ name: 'Browse Components', href: '/docs/components' },
      { name: 'Browse Primitives', href: '/docs/primitives' }] }],
    [INDEX, { nodes: [], anchors: [{ name: 'Accordion', href: '/docs/components/radix/accordion' },
      { name: 'Accordion', href: '/docs/components/base/accordion' }] }],
    [radix, { nodes: [{ role: 'heading', name: 'Accordion' }], anchors: [] }],
    [PRIMITIVES, { nodes: [], anchors: [{ name: 'Accordion', href: '/docs/primitives/radix/accordion' }] }],
    [primitiveRadix, { nodes: [{ role: 'heading', name: 'Accordion' }], anchors: [] }],
    [base, { nodes: [{ role: 'heading', name: 'Accordion' }], anchors: [] }],
  ]);
  function source(_slug: string, file: string, title: string) {
    return { status: 'verified', summary: { title,
      files: [{ path: file, type: 'registry:ui' }] } };
  }
  function fakeSite() {
    let url = HOME; const visited: string[] = [];
    return { visited, url: async () => url,
      nav: async (dest: string) => { url = dest; visited.push(dest); },
      snap: async () => ({ url, nodes: pages.get(url)?.nodes ?? [] }),
      domLinks: async () => pages.get(url)?.anchors ?? [] };
  }
  it('distinguishes same-titled components using witnessed hrefs and official file paths', async () => {
    const targets = [{ slug: 'components-radix-accordion', token: '@animate-ui/components-radix-accordion', docs_url: null },
      { slug: 'components-base-accordion', token: '@animate-ui/components-base-accordion', docs_url: null }];
    const facts = new Map([
      [targets[0].token, source(targets[0].slug, 'registry/components/radix/accordion/index.tsx', 'Accordion')],
      [targets[1].token, source(targets[1].slug, 'registry/components/base/accordion/index.tsx', 'Accordion')],
    ]);
    const browser = fakeSite();
    const result = await collectQualifiedRegistryRoutes(browser, reg, targets, facts);
    expect(result.unresolved).toEqual([]);
    expect(result.records.map((x: any) => x.verifiedUrl)).toEqual([radix, base]);
    expect(result.records.every((x: any) => x.browser.capturePath === null)).toBe(true);
    expect(browser.visited).toEqual([INDEX, radix, base]);
  });
  it('returns to the homepage when the next item belongs to a different catalog route family', async () => {
    const targets = [{ slug: 'components-radix-accordion', token: '@animate-ui/components-radix-accordion', docs_url: null },
      { slug: 'primitives-radix-accordion', token: '@animate-ui/primitives-radix-accordion', docs_url: null }];
    const facts = new Map([
      [targets[0].token, source(targets[0].slug, 'registry/components/radix/accordion/index.tsx', 'Accordion')],
      [targets[1].token, source(targets[1].slug, 'registry/primitives/radix/accordion/index.tsx', 'Accordion')],
    ]);
    const browser = fakeSite();
    const result = await collectQualifiedRegistryRoutes(browser, reg, targets, facts);
    expect(result.unresolved).toEqual([]);
    expect(result.records.map((x: any) => x.verifiedUrl)).toEqual([radix, primitiveRadix]);
    expect(browser.visited).toEqual([INDEX, radix, HOME, PRIMITIVES, primitiveRadix]);
  });
  it('does not invent distinct component docs URLs for icon and demo registry assets', async () => {
    const targets = [{ slug: 'icons-accessibility', token: '@animate-ui/icons-accessibility' },
      { slug: 'demo-components-radix-accordion', token: '@animate-ui/demo-components-radix-accordion' }];
    const facts = new Map([
      [targets[0].token, source(targets[0].slug, 'registry/icons/accessibility/index.tsx', 'Accessibility Icon')],
      [targets[1].token, source(targets[1].slug,
        'registry/demo/components/radix/accordion/index.tsx', 'Accordion Demo')],
    ]);
    const result = await collectQualifiedRegistryRoutes(fakeSite(), reg, targets, facts);
    expect(result.records).toEqual([]);
    expect(result.unresolved.map((x: any) => x.reason)).toEqual([
      'icon-gallery-no-observed-item-page', 'auxiliary-demo-no-observed-page',
    ]);
  });
});

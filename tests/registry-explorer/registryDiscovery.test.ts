import { describe, expect, it } from 'vitest';
// @ts-ignore Node ESM runtime test (Node type declarations are not in the browser TS config).
import { mkdtemp, readFile, rm } from 'node:fs/promises';
// @ts-ignore Node ESM runtime test.
import { tmpdir } from 'node:os';
// @ts-ignore Node ESM runtime test.
import { join } from 'node:path';
// @ts-ignore Standalone Node ESM script.
import { discoverRegistry, DiscoveryLedger, catalogFingerprint } from '../../scripts/lib/registry-discovery.mjs';

type Page = { heading?: string; links?: Array<[string, string]> };
function fakeBrowser(pages: Record<string, Page>, initial: string) {
  let current = initial;
  const navigated: string[] = [];
  const home = () => pages[current] ?? { heading: 'Unknown', links: [] };
  return {
    navigated,
    async url() { return current; },
    async snap() {
      return { url: current, nodes: [
        ...(home().heading ? [{ role: 'heading', name: home().heading }] : []),
        ...(home().links ?? []).map(([name], i) => ({ role: 'link', name, ref: 'e' + i })),
      ] };
    },
    async attr(ref: string) { return home().links?.[Number(ref.slice(1))]?.[1]; },
    async domLinks() { return (home().links ?? []).map(([name, href]) => ({ name, href })); },
    async nav(url: string) {
      navigated.push(url);
      current = url;
    },
  };
}
function fakeLedger() {
  const rows = new Map<string, any>();
  const writes: any[] = [];
  return {
    writes,
    get(token: string) { return rows.get(token); },
    async append(row: any) { rows.set(row.token, structuredClone(row)); writes.push(structuredClone(row)); },
  };
}
const registry = { name: '@sample', homepage: 'https://sample.example' };
const HOME = 'https://sample.example/';
const pages: Record<string, Page> = {
  [HOME]: { links: [['Docs', '/docs'], ['Other site', 'https://other.example/catalog']] },
  'https://sample.example/docs': { heading: 'Documentation',
    links: [['Primitives', '/docs/primitives'], ['Components', '/docs/components']] },
  'https://sample.example/docs/primitives': { heading: 'Primitives',
    links: [['Actions', '/docs/components']] },
  'https://sample.example/docs/components': { heading: 'Components',
    links: [['Gradient Button', '/docs/bright-actions'],
      ['Card', '/other/ui-content'], ['Off-site Card', 'https://evil.example/card']] },
  'https://sample.example/docs/bright-actions': { heading: 'Gradient Button' },
  'https://sample.example/other/ui-content': { heading: 'Card' },
};
const at = '2026-10-01T20:00:00.000Z';

describe('evidence-based registry discovery', () => {
  it('uses an observed official JSON index with exact names and explicit docs URLs, then verifies the rendered page', async () => {
    const sample: Record<string, Page> = {
      [HOME]: { links: [['Registry index', '/r/registry.json'], ['Docs', '/docs']] },
      'https://sample.example/docs': { heading: 'Docs', links: [['About', '/about']] },
      'https://sample.example/about': { heading: 'About' },
      'https://sample.example/docs/button': { heading: 'Button' },
    };
    const browser = fakeBrowser(sample, HOME);
    const consulted: string[] = [];
    (browser as any).structuredIndex = async (url: string) => {
      consulted.push(url);
      return { items: [
        { name: 'button', title: 'Button', docsUrl: '/docs/button' },
        { name: 'missing', docsUrl: 'https://evil.example/docs/missing' },
        { name: 'fake', url: '/r/fake.json' },
      ] };
    };
    const result = await discoverRegistry({
      registry, indexedItems: ['button', 'missing', 'fake'], browser,
      ledger: fakeLedger(), checkedAt: at, maxPages: 3,
    });
    expect(consulted).toEqual(['https://sample.example/r/registry.json']);
    expect(result.records.find((row: any) => row.slug === 'button')).toMatchObject({
      status: 'page-observed',
      docsUrl: 'https://sample.example/docs/button',
      evidence: { strategy: 'observed-structured-index', indexUrl: 'https://sample.example/r/registry.json' },
    });
    expect(result.records.find((row: any) => row.slug === 'missing')?.status).toBe('unresolved');
    expect(result.records.find((row: any) => row.slug === 'fake')?.status).toBe('unresolved');
    expect(browser.navigated).not.toContain('https://evil.example/docs/missing');
    expect(browser.navigated).not.toContain('https://sample.example/r/fake.json');
  });

  it('does not infer docs pages from index entries with no explicit docs URL', async () => {
    const sample: Record<string, Page> = {
      [HOME]: { links: [['Catalog JSON', '/catalog/index.json'], ['Docs', '/docs']] },
      'https://sample.example/docs': { heading: 'Docs', links: [['About', '/about']] },
    };
    const browser = fakeBrowser(sample, HOME);
    (browser as any).structuredIndex = async () => ({
      items: [{ name: 'button', type: 'registry:ui', title: 'Button',
        files: [{ path: 'components/ui/button.tsx' }] }],
    });
    const result = await discoverRegistry({
      registry, indexedItems: ['button'], browser, ledger: fakeLedger(), checkedAt: at,
    });
    expect(result.records[0]).toMatchObject({
      status: 'unresolved', reason: 'not-found-in-observed-navigation',
    });
    expect(result.structuredIndexes).toEqual([expect.objectContaining({
      url: 'https://sample.example/catalog/index.json', identityCount: 1, candidateCount: 0,
    })]);
    expect(browser.navigated).not.toContain('https://sample.example/docs/button');
  });
  it('traverses observed multi-level listings once, verifies nonmatching URL slugs and checkpoints each identity', async () => {
    const browser = fakeBrowser(pages, HOME);
    const ledger = fakeLedger();
    const result = await discoverRegistry({
      registry, indexedItems: ['gradient-button', 'card', 'missing'], browser, ledger, checkedAt: at,
      limit: 2, maxPages: 12, maxDepth: 4,
    });
    expect(result.records.filter((x: any) => x.status === 'page-observed')
      .map((x: any) => [x.slug, x.docsUrl])).toEqual([
      ['card', 'https://sample.example/other/ui-content'],
      ['gradient-button', 'https://sample.example/docs/bright-actions'],
    ]);
    expect(result.pending).toBe(1);
    expect(result.complete).toBe(false);
    expect(ledger.writes[0]).toMatchObject({ token: 'registry:@sample', status: 'discovered' });
    expect(ledger.writes.filter((x: any) => x.token.startsWith('@sample/'))).toHaveLength(2);
    expect(browser.navigated).not.toContain('https://other.example/catalog');
    expect(browser.navigated).not.toContain('https://evil.example/card');

    const resumed = fakeBrowser(pages, HOME);
    const next = await discoverRegistry({
      registry, indexedItems: ['gradient-button', 'card', 'missing'], browser: resumed,
      ledger, checkedAt: at, limit: 2, maxPages: 12, maxDepth: 4,
    });
    expect(next.records.find((x: any) => x.slug === 'missing')).toMatchObject({
      status: 'unresolved', reason: 'not-found-in-observed-navigation',
    });
    expect(next.pending).toBe(0);
    expect(resumed.navigated).toEqual([]);
    expect(next.complete).toBe(true);
    expect(next.fullyVerified).toBe(false);
  });

  it('does not conflate two distinct nested items with the same leaf or accept guessed paths', async () => {
    const nestedPages: Record<string, Page> = {
      [HOME]: { links: [['Components', '/components']] },
      'https://sample.example/components': { heading: 'Components',
        links: [['Select', '/docs/forms/select'], ['Async', '/docs/forms/select/async']] },
      'https://sample.example/docs/forms/select': { heading: 'Select' },
      'https://sample.example/docs/forms/select/async': { heading: 'Async' },
    };
    const result = await discoverRegistry({
      registry, indexedItems: ['forms/select', 'lists/select', 'forms/select/async'],
      browser: fakeBrowser(nestedPages, HOME), ledger: fakeLedger(), checkedAt: at,
    });
    expect(result.records.find((x: any) => x.slug === 'forms/select/async')?.status).toBe('page-observed');
    expect(result.records.find((x: any) => x.slug === 'forms/select')).toMatchObject({
      status: 'page-observed', docsUrl: 'https://sample.example/docs/forms/select',
    });
    expect(result.records.find((x: any) => x.slug === 'lists/select')).toMatchObject({
      status: 'unresolved', reason: 'not-found-in-observed-navigation',
    });
  });

  it('does not misattribute a longer component name to its shorter prefix', async () => {
    const sample: Record<string, Page> = {
      [HOME]: { links: [['Components', '/components']] },
      'https://sample.example/components': { heading: 'Components',
        links: [
          ['Button Group', '/docs/components/button-group'],
          ['Button', '/docs/components/button'],
          ['Alert Dialog', '/docs/components/alert-dialog'],
          ['Alert', '/docs/components/alert'],
        ] },
      'https://sample.example/docs/components/button-group': { heading: 'Button Group' },
      'https://sample.example/docs/components/button': { heading: 'Button' },
      'https://sample.example/docs/components/alert-dialog': { heading: 'Alert Dialog' },
      'https://sample.example/docs/components/alert': { heading: 'Alert' },
    };
    const results = await discoverRegistry({
      registry, indexedItems: ['button', 'button-group', 'alert', 'alert-dialog'],
      browser: fakeBrowser(sample, HOME), ledger: fakeLedger(), checkedAt: at,
    });
    for (const slug of ['button', 'button-group', 'alert', 'alert-dialog']) {
      expect(results.records.find((x: any) => x.slug === slug)).toMatchObject({
        status: 'page-observed', docsUrl: 'https://sample.example/docs/components/' + slug,
      });
    }
  });

  it('maps flattened catalog identity to observed nested documentation paths without guessing URLs', async () => {
    const source: Record<string, Page> = {
      [HOME]: {links: [['Components', '/docs/components']]},
      'https://sample.example/docs/components': {heading: 'Components',
        links: [['Animate', '/docs/components/animate'], ['Base', '/docs/components/base']]},
      'https://sample.example/docs/components/animate': {heading: 'Animate',
        links: [['Avatar Group', '/docs/components/animate/avatar-group'],
          ['Code Tabs', '/docs/components/animate/code-tabs']]},
      'https://sample.example/docs/components/base': {heading: 'Base',
        links: [['Accordion', '/docs/components/base/accordion']]},
      'https://sample.example/docs/components/animate/avatar-group': {heading: 'Avatar Group'},
      'https://sample.example/docs/components/animate/code-tabs': {heading: 'Code Tabs'},
      'https://sample.example/docs/components/base/accordion': {heading: 'Accordion'},
    };
    const browser = fakeBrowser(source, HOME);
    const result = await discoverRegistry({
      registry, indexedItems: ['components-animate-avatar-group',
        'components-animate-code-tabs', 'components-base-accordion'],
      browser, ledger: fakeLedger(), checkedAt: at,
      maxDepth: 3, maxPages: 8,
    });
    expect(result.records.map((x: any) => [x.slug, x.status])).toEqual([
      ['components-animate-avatar-group', 'page-observed'],
      ['components-animate-code-tabs', 'page-observed'],
      ['components-base-accordion', 'page-observed'],
    ]);
    expect(result.records[0].docsUrl).toBe(
      'https://sample.example/docs/components/animate/avatar-group');
    expect(browser.navigated).not.toContain('https://sample.example/docs/components-animate-avatar-group');
  });

  it('distinguishes the official component link from block cards reusing the same label', async () => {
    const source: Record<string, Page> = {
      [HOME]: {links: [['Components', '/components']]},
      'https://sample.example/components': {heading: 'Components',
        links: [['Accordion', '/docs/components/accordion'],
          ['Accordion', '/docs/blocks/faq/faq1'],
          ['Carousel', '/docs/components/carousel'],
          ['Carousel', '/docs/blocks/features/feature3']]},
      'https://sample.example/docs/components/accordion': {heading: 'Accordion'},
      'https://sample.example/docs/blocks/faq/faq1': {heading: 'Accordion'},
      'https://sample.example/docs/components/carousel': {heading: 'Carousel'},
      'https://sample.example/docs/blocks/features/feature3': {heading: 'Carousel'},
    };
    const browser = fakeBrowser(source, HOME);
    const result = await discoverRegistry({
      registry, indexedItems: ['accordion', 'carousel'],
      browser, ledger: fakeLedger(), checkedAt: at,
    });
    for (const slug of ['accordion', 'carousel']) {
      expect(result.records.find((r: any) => r.slug === slug)).toMatchObject({
        status: 'page-observed', docsUrl: 'https://sample.example/docs/components/' + slug,
      });
    }
    expect(browser.navigated).not.toContain('https://sample.example/docs/blocks/faq/faq1');
    expect(browser.navigated).not.toContain('https://sample.example/docs/blocks/features/feature3');
  });

  it('refuses ambiguous leaf names without a disambiguating observed path', async () => {
    const sample: Record<string, Page> = {
      [HOME]: { links: [['Components', '/components']] },
      'https://sample.example/components': { heading: 'Components',
        links: [['Select', '/docs/not-revealing-family']] },
      'https://sample.example/docs/not-revealing-family': { heading: 'Select' },
    };
    const result = await discoverRegistry({
      registry, indexedItems: ['forms/select', 'lists/select'],
      browser: fakeBrowser(sample, HOME), ledger: fakeLedger(), checkedAt: at,
    });
    expect(result.records.map((r: any) => [r.status, r.reason])).toEqual([
      ['unresolved', 'ambiguous-component-identity'],
      ['unresolved', 'ambiguous-component-identity'],
    ]);
  });

  it('revisits only unresolved items when the discovery budget is increased', async () => {
    const ledger = fakeLedger();
    const limited = await discoverRegistry({
      registry, indexedItems: ['card'], browser: fakeBrowser(pages, HOME),
      ledger, checkedAt: at, maxPages: 1,
    });
    expect(limited.records[0].reason).toBe('discovery-budget-exhausted');
    const browser = fakeBrowser(pages, HOME);
    const expanded = await discoverRegistry({
      registry, indexedItems: ['card'], browser, ledger, checkedAt: at,
      maxPages: 10,
    });
    expect(expanded.records[0]).toMatchObject({status: 'page-observed'});
    expect(expanded.processed).toBe(1);
    expect(browser.navigated).toContain('https://sample.example/docs');
  });

  it('rechecks old discovery revisions rather than trusting previous ambiguous matches', async () => {
    const source: Record<string, Page> = {
      [HOME]: { links: [['Components', '/components']] },
      'https://sample.example/components': { heading: 'Components',
        links: [['Alert Dialog', '/docs/alert-dialog'], ['Alert', '/docs/alert']] },
      'https://sample.example/docs/alert-dialog': { heading: 'Alert Dialog' },
      'https://sample.example/docs/alert': { heading: 'Alert' },
    };
    const fp = catalogFingerprint(registry, ['alert', 'alert-dialog']);
    const ledger = fakeLedger();
    await ledger.append({schema: 'registry-atlas-discovery/v1',
      discoveryRevision: 'identity-resolution-v4',
      token: 'registry:@sample', status: 'discovered', namespace: '@sample',
      catalogFingerprint: fp, checkedAt: at, exhausted: false,
      listings: [], ambiguous: [], candidates: [
        {slug: 'alert', url: 'https://sample.example/docs/alert-dialog',
          name: 'Alert Dialog', listingUrl: 'https://sample.example/components',
          matching: 'full-name', navigationSource: 'observed-dom-anchor'},
      ]});
    await ledger.append({schema: 'registry-atlas-discovery/v1',
      discoveryRevision: 'identity-resolution-v4',
      token: '@sample/alert', status: 'page-observed',
      catalogFingerprint: fp, checkedAt: at,
      docsUrl: 'https://sample.example/docs/alert-dialog'});
    const result = await discoverRegistry({
      registry, indexedItems: ['alert', 'alert-dialog'],
      browser: fakeBrowser(source, HOME), ledger, checkedAt: at,
    });
    expect(result.records.find((r: any) => r.slug === 'alert')).toMatchObject({
      docsUrl: 'https://sample.example/docs/alert',
      status: 'page-observed',
    });
    expect(result.processed).toBe(2);
    expect(ledger.writes.filter(r => r.token === 'registry:@sample')).toHaveLength(2);
  });

  it('uses an official sitemap candidate only after the rendered component heading matches', async () => {
    const homepage = HOME;
    const url = 'https://sample.example/docs/card';
    const base = {[homepage]: {links:[]}, [url]:{heading:'Card'}} as Record<string, Page>;
    const matched = await discoverRegistry({
      registry, indexedItems:['card'],browser:fakeBrowser(base,homepage),
      ledger:fakeLedger(),checkedAt:at,
      sitemapCandidates:[{slug:'card',url,sitemapUrl:'https://sample.example/sitemap.xml'}],
    });
    expect(matched.records[0]).toMatchObject({
      status:'page-observed',docsUrl:url,
      evidence:{strategy:'official-sitemap-then-browser-verified',
        navigationSource:'official-xml-sitemap'},
    });
    const fake={...base,[url]:{heading:'Unrelated'}};
    const mismatch=await discoverRegistry({
      registry,indexedItems:['card'],browser:fakeBrowser(fake,homepage),
      ledger:fakeLedger(),checkedAt:at,
      sitemapCandidates:[{slug:'card',url,sitemapUrl:'https://sample.example/sitemap.xml'}],
    });
    expect(mismatch.records[0]).toMatchObject({
      status:'unresolved',reason:'rendered-identity-mismatch',
    });
    const foreign=await discoverRegistry({
      registry,indexedItems:['card'],browser:fakeBrowser(base,homepage),
      ledger:fakeLedger(),checkedAt:at,
      sitemapCandidates:[{slug:'card',url:'https://other.example/docs/card',
        sitemapUrl:'https://sample.example/sitemap.xml'}],
    });
    expect(foreign.records[0].status).not.toBe('page-observed');
  });

  it('prioritizes sitemap-matched identities in a bounded batch before unobserved catalog items', async () => {
    const url='https://sample.example/docs/card';
    const result=await discoverRegistry({
      registry,indexedItems:['aardvark','card'],
      browser:fakeBrowser({[HOME]:{links:[]},[url]:{heading:'Card'}},HOME),
      ledger:fakeLedger(),checkedAt:at,limit:1,
      sitemapCandidates:[{slug:'card',url,sitemapUrl:'https://sample.example/sitemap.xml'}],
    });
    expect(result.processed).toBe(1);
    expect(result.records[0]).toMatchObject({slug:'card',status:'page-observed'});
    expect(result.pending).toBe(1);
  });

  it('does not choose between two distinct observed destinations for one title', async () => {
    const alternate: Record<string, Page> = {
      [HOME]: { links: [['Components', '/components']] },
      'https://sample.example/components': { heading: 'Components',
        links: [['Button', '/a'], ['Button', '/b']] },
      'https://sample.example/a': { heading: 'Button' },
      'https://sample.example/b': { heading: 'Button' },
    };
    const browser = fakeBrowser(alternate, HOME);
    const result = await discoverRegistry({
      registry, indexedItems: ['button'], browser, ledger: fakeLedger(), checkedAt: at,
    });
    expect(result.records[0]).toMatchObject({
      status: 'unresolved', reason: 'multiple-observed-destinations',
    });
    expect(browser.navigated).not.toContain('https://sample.example/a');
    expect(browser.navigated).not.toContain('https://sample.example/b');
  });

  it('requires independently observed rendered identity; false headings cannot verify source pages', async () => {
    const wrong = structuredClone(pages);
    wrong['https://sample.example/docs/bright-actions'] = { heading: 'Completely Unrelated' };
    const result = await discoverRegistry({
      registry, indexedItems: ['gradient-button'], browser: fakeBrowser(wrong, HOME),
      ledger: fakeLedger(), checkedAt: at,
    });
    expect(result.records[0]).toMatchObject({
      status: 'unresolved', reason: 'rendered-identity-mismatch',
    });
  });

  it('fails closed on unsafe registry roots, budget exhaustion and invalid limit', async () => {
    const unsafe = ['http://sample.example', 'https://127.0.0.1',
      'https://10.12.0.1', 'https://100.64.0.1', 'https://8.8.8.8',
      'https://[::1]', 'https://someone:password@sample.example'];
    for (const homepage of unsafe) {
      await expect(discoverRegistry({ registry: { ...registry, homepage },
        indexedItems: ['button'], browser: fakeBrowser(pages, HOME),
        ledger: fakeLedger(), checkedAt: at,
      })).rejects.toThrow(/homepage/i);
    }
    await expect(discoverRegistry({
      registry, indexedItems: ['button'], browser: fakeBrowser(pages, HOME),
      ledger: fakeLedger(), checkedAt: at, limit: 0,
    })).rejects.toThrow(/limit/i);
    const result = await discoverRegistry({
      registry, indexedItems: ['gradient-button'], browser: fakeBrowser(pages, HOME),
      ledger: fakeLedger(), checkedAt: at, maxPages: 1,
    });
    expect(result.records[0].status).toBe('unresolved');
    expect(result.records[0].reason).toBe('discovery-budget-exhausted');
  });

  it('persists append-only checkpoints across process restarts and invalidates changed catalog identity sets', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'atlas-registry-discovery-'));
    const path = join(dir, 'evidence.jsonl');
    try {
      const ledger = await DiscoveryLedger.open(path);
      const first = await discoverRegistry({
        registry, indexedItems: ['card'], browser: fakeBrowser(pages, HOME),
        ledger, checkedAt: at,
      });
      expect(first.records[0].status).toBe('page-observed');
      const saved = await DiscoveryLedger.open(path);
      expect(saved.get('@sample/card')).toMatchObject({ status: 'page-observed' });
      const retry = fakeBrowser(pages, HOME);
      const repeat = await discoverRegistry({
        registry, indexedItems: ['card'], browser: retry, ledger: saved, checkedAt: at,
      });
      expect(repeat.processed).toBe(0);
      expect(retry.navigated).toEqual([]);
      const changed = await discoverRegistry({
        registry, indexedItems: ['card', 'new-component'],
        browser: fakeBrowser(pages, HOME), ledger: saved, checkedAt: at,
      });
      expect(changed.catalogFingerprint).not.toBe(first.catalogFingerprint);
      expect(changed.records.some((x: any) => x.slug === 'new-component')).toBe(true);
      const lines = (await readFile(path, 'utf8')).trim().split('\n').map(JSON.parse);
      expect(lines.filter((x: any) => x.token === 'registry:@sample')).toHaveLength(2);
      expect(catalogFingerprint(registry, ['card', 'new-component']))
        .toBe(changed.catalogFingerprint);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('waits for browser hydration when a rendered page initially has no observed links', async () => {
    const source: Record<string, Page> = {
      [HOME]: {links: [['Components', '/components']]},
      'https://sample.example/components': {heading: 'Components',
        links: [['Button', '/docs/button']]},
      'https://sample.example/docs/button': {heading: 'Button'},
    };
    const browser = fakeBrowser(source, HOME);
    const snapshot = browser.snap, dom = browser.domLinks;
    let hydrated = false, waited = 0;
    browser.snap = async () => hydrated ? snapshot() : {url: await browser.url(), nodes: []};
    browser.domLinks = async () => hydrated ? dom() : [];
    (browser as any).waitForLinks = async () => {hydrated = true; waited++;};
    const result = await discoverRegistry({
      registry, indexedItems: ['button'], browser, ledger: fakeLedger(), checkedAt: at,
    });
    expect(waited).toBe(1);
    expect(result.records[0]).toMatchObject({
      status: 'page-observed', docsUrl: 'https://sample.example/docs/button',
    });
  });

  it('retries a transient empty-navigation observation without requiring a new catalog fingerprint', async () => {
    const ledger = fakeLedger();
    const empty = fakeBrowser({[HOME]: {heading:'Loading'}}, HOME);
    const first = await discoverRegistry({
      registry, indexedItems: ['button'], browser: empty, ledger, checkedAt: at,
    });
    expect(first.records[0]).toMatchObject({
      status: 'unresolved', reason: 'discovery-navigation-error',
    });
    const hydrated = fakeBrowser({
      [HOME]: {links: [['Components', '/components']]},
      'https://sample.example/components': {heading: 'Components',
        links: [['Button', '/docs/button']]},
      'https://sample.example/docs/button': {heading: 'Button'},
    }, HOME);
    const retry = await discoverRegistry({
      registry, indexedItems: ['button'], browser: hydrated, ledger, checkedAt: at,
    });
    expect(retry.records[0]).toMatchObject({
      status: 'page-observed', docsUrl: 'https://sample.example/docs/button',
    });
    expect(ledger.writes.filter(row => row.token === 'registry:@sample')).toHaveLength(2);
  });

  it('reports unresolved navigation when no evidence appears after the bounded wait', async () => {
    const browser = fakeBrowser({[HOME]: {heading: 'Empty'}}, HOME);
    const result = await discoverRegistry({
      registry, indexedItems: ['button'], browser, ledger: fakeLedger(), checkedAt: at,
    });
    expect(result.records[0]).toMatchObject({
      status: 'unresolved', reason: 'discovery-navigation-error',
    });
    expect(result.observationError).toMatch(/no observed navigation/i);
  });

  it('can discover a DOM-only component link omitted from the semantic snapshot', async () => {
    const source: Record<string, Page> = {
      [HOME]: { links: [['Components', '/components']] },
      'https://sample.example/components': { heading: 'Components',
        links: [['Button', '/docs/actions']] },
      'https://sample.example/docs/actions': { heading: 'Button' },
    };
    const browser = fakeBrowser(source, HOME);
    const originalSnap = browser.snap;
    browser.snap = async () => {
      const snapshot = await originalSnap();
      if (snapshot.url === 'https://sample.example/components') {
        snapshot.nodes = snapshot.nodes.filter(node => node.role !== 'link');
      }
      return snapshot;
    };
    const result = await discoverRegistry({
      registry, indexedItems: ['button'], browser,
      ledger: fakeLedger(), checkedAt: at,
    });
    expect(result.records[0]).toMatchObject({
      status: 'page-observed', docsUrl: 'https://sample.example/docs/actions',
      evidence: {navigationSource: 'observed-dom-anchor'},
    });
  });

  it('invalidates a listing snapshot after the freshness window', async () => {
    const ledger = fakeLedger();
    await discoverRegistry({
      registry, indexedItems: ['card'], browser: fakeBrowser(pages, HOME),
      ledger, checkedAt: at,
    });
    const newTime = '2026-10-03T02:00:00.000Z';
    const rerun = fakeBrowser(pages, HOME);
    const next = await discoverRegistry({
      registry, indexedItems: ['card'], browser: rerun,
      ledger, checkedAt: newTime,
    });
    expect(next.processed).toBe(1);
    expect(rerun.navigated).toContain('https://sample.example/docs');
    expect(ledger.writes.filter(row => row.token === 'registry:@sample')).toHaveLength(2);
  });

  it('retains empty-registry discovery without claiming a verified upstream preview', async () => {
    const result = await discoverRegistry({
      registry, indexedItems: [], browser: fakeBrowser(pages, HOME),
      ledger: fakeLedger(), checkedAt: at,
    });
    expect(result.records).toEqual([]);
    expect(result.pending).toBe(0);
    expect(result.complete).toBe(true);
    expect(result.fullyVerified).toBe(false);
  });
});

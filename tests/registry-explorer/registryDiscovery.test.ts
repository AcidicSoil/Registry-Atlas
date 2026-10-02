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
    for (const slug of ['forms/select', 'lists/select']) {
      expect(result.records.find((x: any) => x.slug === slug)).toMatchObject({
        status: 'unresolved', reason: 'ambiguous-component-identity',
      });
    }
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
      'https://10.12.0.1', 'https://[::1]', 'https://someone:password@sample.example'];
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

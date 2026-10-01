import { describe, expect, it } from 'vitest';
// @ts-ignore Standalone Node ESM script.
import { collectBrowserLinkEvidence } from '../../scripts/collect-browser-link-evidence.mjs';

const registry = { name: '@eight', homepage: 'https://eight.example', url: 'https://eight.example/r/{name}.json' };
const records = [
  { slug: 'button', docs_url: 'https://eight.example/old-button' },
  { slug: 'card', docs_url: null },
];
const HOME = 'https://eight.example/';
const INDEX = 'https://eight.example/docs/components';
const BUTTON = 'https://eight.example/docs/components/button';
const CARD = 'https://eight.example/docs/components/card';

const pages: Record<string, {
  nodes: Array<{ role: string; ref: string; name: string }>;
  links: Record<string, string>;
}> = {
  [HOME]: {
    nodes: [{ role: 'link', ref: 'e2', name: 'Components' }, { role: 'link', ref: 'e3', name: 'Pricing' }],
    links: { e2: '/docs/components', e3: '/pricing' },
  },
  [INDEX]: {
    nodes: [{ role: 'heading', ref: 'h1', name: 'Components' },
      { role: 'link', ref: 'e98', name: 'Button Clickable pixel buttons' },
      { role: 'link', ref: 'e103', name: 'Card A card component' }],
    links: { e98: '/docs/components/button', e103: '/docs/components/card' },
  },
  [BUTTON]: { nodes: [{ role: 'heading', ref: 'h1', name: 'Button' }], links: {} },
  [CARD]: { nodes: [{ role: 'heading', ref: 'h1', name: 'Card' }], links: {} },
};

class FakeBrowser {
  current: string;
  pages: typeof pages;
  log: Array<[string, string]>;

  constructor(start = HOME, source = pages) {
    this.current = start;
    this.pages = structuredClone(source);
    this.log = [];
  }
  async url() { return this.current; }
  async snap() {
    this.log.push(['snap', this.current]);
    return { url: this.current, nodes: this.pages[this.current].nodes };
  }
  async attr(ref: string) { this.log.push(['attr', ref]); return this.pages[this.current].links[ref]; }
  async click(ref: string) {
    this.log.push(['click', ref]);
    this.current = new URL(this.pages[this.current].links[ref], this.current).href;
  }
  async nav(url: string) { this.log.push(['nav', url]); this.current = url; }
  async capture(path: string) { this.log.push(['capture', this.current]); return { url: this.current, capturePath: path }; }
  async extract() {
    this.log.push(['extract', this.current]);
    return { installationCommands: ['pnpm dlx shadcn@latest add @eight/button'],
      usageExamples: ['import { Button } from "@/components/ui/button"', '<Button />'] };
  }
}

describe('source-browser link collection', () => {
  it('discovers live catalog links, visits matching components, and prepares existing audit evidence without mutating catalog data', async () => {
    const browser = new FakeBrowser();
    const result = await collectBrowserLinkEvidence(browser, registry, records, '/tmp/source-captures', '2026-10-01T19:00:00Z');
    expect(result.schemaVersion).toBe('registry-atlas-component-link-evidence/v1');
    expect(result.records).toHaveLength(2);
    expect(result.unresolved).toEqual([]);
    expect(result.records.map((x: any) => x.verifiedUrl)).toEqual([BUTTON, CARD]);
    expect(result.records[0]).toMatchObject({
      namespace: '@eight', slug: 'button', previousUrl: 'https://eight.example/old-button',
      browser: {
        homepageUrl: HOME, listingUrl: INDEX, observedUrl: BUTTON,
        observedSlug: 'button', renderedHeading: 'Button', checkedAt: '2026-10-01T19:00:00Z',
      },
    });
    expect(result.records[1].previousUrl).toBeNull();
    expect(result.records[0].browser.pageEvidence).toMatchObject({
      installationCommands: ['pnpm dlx shadcn@latest add @eight/button'],
      usageExamples: ['import { Button } from "@/components/ui/button"', '<Button />'],
    });
    expect(browser.log.filter(([action]: string[]) => action === 'click')).toEqual([
      ['click', 'e2'], ['click', 'e98'], ['click', 'e103'],
    ]);
    expect(records[0].docs_url).toBe('https://eight.example/old-button');
  });

  it('refuses to repurpose an occupied source tab', async () => {
    const browser = new FakeBrowser(BUTTON);
    const result = await collectBrowserLinkEvidence(browser, registry, records, '/tmp/source-captures');
    expect(result.records).toEqual([]);
    expect(result.unresolved[0].reason).toBe('tab-not-on-homepage');
    expect(browser.log).toEqual([]);
  });

  it('does not promote a listing link that navigates to the wrong page', async () => {
    const source = structuredClone(pages);
    source[INDEX].links.e98 = '/docs/components/card';
    const browser = new FakeBrowser(HOME, source);
    const result = await collectBrowserLinkEvidence(browser, registry, [records[0]], '/tmp/source-captures');
    expect(result.records).toEqual([]);
    expect(result.unresolved[0]).toMatchObject({ slug: 'button', reason: 'missing-unique-component-link' });
  });

  it('rejects a cross-origin catalog link without clicking it', async () => {
    const source = structuredClone(pages);
    source[HOME].links.e2 = 'https://another.example/docs/components';
    const browser = new FakeBrowser(HOME, source);
    const result = await collectBrowserLinkEvidence(browser, registry, records, '/tmp/source-captures');
    expect(result.records).toEqual([]);
    expect(result.unresolved).toMatchObject([{ reason: 'no-safe-catalog-link' }]);
    expect(browser.log.some(([action, ref]: string[]) => action === 'click' && ref === 'e2')).toBe(false);
  });

  it('requires observed final headings and capture URL to agree with discovered component URL', async () => {
    const source = structuredClone(pages);
    source[BUTTON].nodes = [{ role: 'heading', ref: 'h1', name: 'Unrelated' }];
    const browser = new FakeBrowser(HOME, source);
    const result = await collectBrowserLinkEvidence(browser, registry, [records[0]], '/tmp/source-captures');
    expect(result.records).toEqual([]);
    expect(result.unresolved[0].reason).toBe('component-identity-mismatch');
  });

  it('accepts duplicate observed links only when their verified hrefs identify the same component page', async () => {
    const source = structuredClone(pages);
    source[INDEX].nodes.push({ role: 'link', ref: 'e201', name: 'Button' });
    source[INDEX].links.e201 = '/docs/components/button';
    const browser = new FakeBrowser(HOME, source);
    const result = await collectBrowserLinkEvidence(browser, registry, [records[0]], '/tmp/source-captures');
    expect(result.unresolved).toEqual([]);
    expect(result.records).toHaveLength(1);
    expect(result.records[0].verifiedUrl).toBe(BUTTON);
    expect(browser.log.filter(([action]: string[]) => action === 'click')).toEqual([['click', 'e2'], ['click', 'e98']]);
  });

  it('refuses competing same-name links pointing to different destinations', async () => {
    const source = structuredClone(pages);
    source[INDEX].nodes.push({ role: 'link', ref: 'e201', name: 'Button' });
    source[INDEX].links.e201 = '/docs/other/button';
    const browser = new FakeBrowser(HOME, source);
    const result = await collectBrowserLinkEvidence(browser, registry, [records[0]], '/tmp/source-captures');
    expect(result.records).toEqual([]);
    expect(result.unresolved[0].reason).toBe('missing-unique-component-link');
    expect(browser.log.some(([action, ref]: string[]) => action === 'click' && ref === 'e98')).toBe(false);
  });

  it('falls back to an observed DOM anchor when the semantic snapshot omits a component link', async () => {
    const source = structuredClone(pages);
    source[INDEX].nodes = source[INDEX].nodes.filter((n: { name: string }) => n.name !== 'Button Clickable pixel buttons');
    const browser = new FakeBrowser(HOME, source);
    (browser as FakeBrowser & { domLinks: () => Promise<{name: string; href: string}[]> }).domLinks =
      async () => [{ name: 'Button', href: '/docs/components/button' }];
    const result = await collectBrowserLinkEvidence(browser, registry, [records[0]], '/tmp/source-captures');
    expect(result.unresolved).toEqual([]);
    expect(result.records).toHaveLength(1);
    expect(result.records[0].browser.navigationSource).toBe('observed-dom-anchor');
    expect(result.records[0].verifiedUrl).toBe(BUTTON);
    expect(browser.log).toContainEqual(['nav', BUTTON]);
  });

  it('refuses cross-origin or conflicting DOM-anchor fallbacks', async () => {
    const source = structuredClone(pages);
    source[INDEX].nodes = source[INDEX].nodes.filter((n: { name: string }) => n.name !== 'Button Clickable pixel buttons');
    for (const domLinks of [
      [{ name: 'Button', href: 'https://another.example/docs/components/button' }],
      [{ name: 'Button', href: '/docs/components/button' }, { name: 'Button', href: '/docs/other/button' }],
    ]) {
      const browser = new FakeBrowser(HOME, source);
      (browser as FakeBrowser & { domLinks: () => Promise<{name: string; href: string}[]> }).domLinks = async () => domLinks;
      const result = await collectBrowserLinkEvidence(browser, registry, [records[0]], '/tmp/source-captures');
      expect(result.records).toEqual([]);
      expect(result.unresolved[0].reason).toBe('missing-unique-component-link');
      expect(browser.log.every(([action, url]: string[]) => action !== 'nav' || url !== BUTTON)).toBe(true);
    }
  });
});

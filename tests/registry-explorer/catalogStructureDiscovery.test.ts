import { describe, expect, it } from 'vitest';
// @ts-ignore Standalone Node ESM script.
import {
  classifyObservedAccess,
  discoverCatalogGroups,
  normalizeCatalogKind,
  resolveDirectMembership,
} from '../../scripts/lib/catalog-structure-discovery.mjs';

type Link = { text: string; href: string; heading?: string };
type Range = { text: string; tag?: string; ownerTag?: string; links: Link[] };
type Container = { tag: string; heads: Array<{ text: string; tag?: string }>; links: Link[] };

function observation({
  url,
  ranges = [],
  links = [],
  containers = [],
}: {
  url: string;
  ranges?: Range[];
  links?: Link[];
  containers?: Container[];
}) {
  return {
    title: 'Fixture',
    url,
    pathname: new URL(url).pathname,
    ranges,
    links,
    containers,
  };
}

const item = (name: string, type = 'registry:component') => ({ name, type });

describe('catalog structure discovery', () => {
  it('discovers Kobra-style source groups from nav heading ranges', () => {
    const page = observation({
      url: 'https://example.test/components/input-otp',
      ranges: [
        { text: 'Free', ownerTag: 'NAV', links: [
          { text: 'Input OTP', href: '/components/input-otp' },
          { text: 'Navigation Menu', href: '/components/navigation-menu' },
        ] },
        { text: 'Agents', ownerTag: 'NAV', links: [
          { text: 'Reasoning Steps', href: '/components/reasoning-steps' },
          { text: 'File Diff', href: '/components/file-diff' },
        ] },
      ],
    });

    const result = discoverCatalogGroups(page, {
      knownItems: [item('input-otp'), item('navigation-menu'), item('reasoning-steps'), item('file-diff')],
    });

    expect(result.groups.map((group: any) => [group.label, group.memberIds])).toEqual([
      ['Free', ['input-otp', 'navigation-menu']],
      ['Agents', ['reasoning-steps', 'file-diff']],
    ]);
  });

  it('does not turn unrelated FAQ/help headings into groups', () => {
    const page = observation({
      url: 'https://example.test/design/components',
      ranges: [
        { text: 'Actions', ownerTag: 'NAV', links: [
          { text: 'Button', href: '/design/components/button' },
          { text: 'Copy Button', href: '/design/components/copy-button' },
        ] },
        { text: 'Is it accessible?', ownerTag: 'SECTION', links: [
          { text: 'Button', href: '/design/components/button' },
          { text: 'Copy Button', href: '/design/components/copy-button' },
        ] },
      ],
      containers: [{
        tag: 'SECTION',
        heads: [{ text: 'Is it accessible?' }, { text: 'Is it styled?' }],
        links: [
          { text: 'Button', href: '/design/components/button' },
          { text: 'Copy Button', href: '/design/components/copy-button' },
        ],
      }],
    });

    const result = discoverCatalogGroups(page, {
      knownItems: [item('button'), item('copy-button')],
    });

    expect(result.groups.map((group: any) => group.label)).toEqual(['Actions']);
  });

  it('discovers heading-range groups when member routes nest under the heading slug', () => {
    const page = observation({
      url: 'https://example.test/docs/blocks',
      ranges: [
        { text: 'Hero', ownerTag: 'DIV', links: [
          { text: 'Hero 1', href: '/docs/blocks/hero/hero1' },
          { text: 'Hero 2', href: '/docs/blocks/hero/hero2' },
        ] },
        { text: 'Pricing', ownerTag: 'DIV', links: [
          { text: 'Pricing 1', href: '/docs/blocks/pricing/pricing1' },
        ] },
      ],
    });

    const result = discoverCatalogGroups(page, {
      knownItems: [item('hero/hero1', 'registry:block'), item('hero/hero2', 'registry:block'), item('pricing/pricing1', 'registry:block')],
    });

    expect(result.groups.map((group: any) => [group.label, group.sourcePattern])).toEqual([
      ['Hero', 'heading-range'],
      ['Pricing', 'heading-range'],
    ]);
  });

  it('discovers category cards without treating the category URL as an item', () => {
    const page = observation({
      url: 'https://example.test/blocks',
      ranges: [
        { text: 'Hero Sections', ownerTag: 'ARTICLE', links: [
          { text: 'Hero Sections', href: '/blocks/hero-sections' },
          { text: 'View category', href: '/blocks/hero-sections' },
        ] },
        { text: 'Pricing Sections', ownerTag: 'ARTICLE', links: [
          { text: 'Pricing Sections', href: '/blocks/pricing-sections' },
        ] },
      ],
      links: [
        { text: 'Hero Sections', href: '/blocks/hero-sections', heading: 'Hero Sections' },
        { text: 'Pricing Sections', href: '/blocks/pricing-sections', heading: 'Pricing Sections' },
      ],
    });

    const result = discoverCatalogGroups(page, {
      knownItems: [item('hero-01', 'registry:block'), item('pricing-01', 'registry:block')],
    });

    expect(result.groups.map((group: any) => [group.label, group.sourcePattern])).toEqual([
      ['Hero Sections', 'category-card'],
      ['Pricing Sections', 'category-card'],
    ]);
  });

  it('discovers a peer category-link collection and preserves exact labels', () => {
    const page = observation({
      url: 'https://example.test/blocks/marketing',
      links: [
        { text: 'Blog', href: '/blocks/marketing/blog' },
        { text: 'How It Works', href: '/blocks/marketing/how-it-works' },
        { text: 'Pricing', href: '/blocks/marketing/pricing' },
      ],
    });

    const result = discoverCatalogGroups(page, {
      knownItems: [item('hero-01', 'registry:block')],
    });

    expect(result.groups.map((group: any) => group.label)).toEqual([
      'Blog', 'How It Works', 'Pricing',
    ]);
    expect(result.groups.every((group: any) => group.sourcePattern === 'category-link')).toBe(true);
  });

  it('keeps a flat catalog group-less even when it has a feature heading', () => {
    const page = observation({
      url: 'https://example.test/docs/components',
      ranges: [{
        text: 'Command Palette',
        ownerTag: 'SECTION',
        links: [
          { text: 'Magic Card', href: '/docs/components/magic-card' },
          { text: 'Globe', href: '/docs/components/globe' },
        ],
      }],
      containers: [{
        tag: 'SECTION',
        heads: [{ text: 'Command Palette' }, { text: 'Components' }],
        links: [
          { text: 'Magic Card', href: '/docs/components/magic-card' },
          { text: 'Globe', href: '/docs/components/globe' },
        ],
      }],
    });

    const result = discoverCatalogGroups(page, {
      knownItems: [item('magic-card'), item('globe')],
    });

    expect(result.groups).toEqual([]);
  });

  it('does not conflate repeated nested leaves', () => {
    const page = observation({
      url: 'https://example.test/docs/forms',
      ranges: [{
        text: 'Inputs',
        ownerTag: 'NAV',
        links: [{ text: 'Select', href: '/docs/forms/select' }],
      }],
    });

    const result = discoverCatalogGroups(page, {
      knownItems: [item('forms/select'), item('lists/select')],
    });

    expect(result.groups).toEqual([]);
  });

  it('preserves explicit multi-group direct membership', () => {
    const groups = [
      { label: 'Free', memberIds: ['button'] },
      { label: 'Actions', memberIds: ['button', 'copy-button'] },
    ];

    expect(resolveDirectMembership('button', groups)).toEqual(['Free', 'Actions']);
    expect(resolveDirectMembership('missing', groups)).toEqual([]);
  });

  it('classifies explicit access evidence without treating non-Free as paid', () => {
    expect(classifyObservedAccess({ groups: ['Free'], markers: [] })).toBe('free');
    expect(classifyObservedAccess({ groups: ['Hero'], markers: ['Premium'] })).toBe('paid');
    expect(classifyObservedAccess({ groups: ['Hero'], markers: [] })).toBe('unknown');
    expect(classifyObservedAccess({ groups: ['Free'], markers: ['Premium'] })).toBe('unknown');
  });

  it('normalizes common asset kinds without collapsing blocks or pages', () => {
    expect(normalizeCatalogKind('registry:block')).toBe('block');
    expect(normalizeCatalogKind('registry:page')).toBe('page');
    expect(normalizeCatalogKind('registry:theme')).toBe('theme');
    expect(normalizeCatalogKind('registry:component')).toBe('component');
    expect(normalizeCatalogKind('registry:ui')).toBe('component');
    expect(normalizeCatalogKind('registry:icon')).toBe('icon');
    expect(normalizeCatalogKind('registry:unknown')).toBe('other');
  });
});

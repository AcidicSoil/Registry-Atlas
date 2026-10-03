import { describe, expect, it } from 'vitest';
// @ts-expect-error The legacy registry-discovery Node module does not publish a declaration yet.
import { catalogFingerprint, DISCOVERY_REVISION } from '../../scripts/lib/registry-discovery.mjs';
import { compileItemEvidence } from '../../scripts/lib/item-evidence.mjs';

const raw = [{ name: '@alpha', homepage: 'https://alpha.example' }, { name: '@empty', homepage: 'https://empty.example' }];
const catalog = { registries: { '@alpha': [{ name: 'button', type: 'registry:ui' }, { name: 'card', type: 'registry:ui' }], '@empty': [] } };
const fingerprint = catalogFingerprint(raw[0], ['button', 'card']);
const at = '2026-10-03T10:00:00.000Z';
const source = (slug: string, changes: Record<string, unknown> = {}) => ({
  discoveryRevision: DISCOVERY_REVISION, catalogFingerprint: fingerprint,
  status: 'page-observed', checkedAt: '2026-10-03T09:00:00.000Z',
  token: '@alpha/' + slug, docsUrl: 'https://alpha.example/docs/' + slug,
  evidence: { observedUrl: 'https://alpha.example/docs/' + slug }, ...changes,
});
const ledger = { get(token: string) {
  return token === '@alpha/button' ? source('button') : undefined;
} };
const visual = { schemaVersion: 1, previews: {
  '@alpha/button': { imageUrl: '/Registry-Atlas/data/previews/alpha/button.jpg',
    officialPage: 'https://alpha.example/docs/button', verification: 'official rendered demo screenshot' },
  '@alpha/card': { imageUrl: '/Registry-Atlas/data/previews/alpha/card.jpg',
    officialPage: 'https://alpha.example/docs/other', verification: 'official rendered demo screenshot' },
} };
const manifest = { schema: 'registry-atlas-component-demos/v1', items: [
  { namespace: '@alpha', slug: 'button', kind: 'source-informed-fixture',
    status: 'interaction-verified', path: '/Registry-Atlas/component-demos/alpha/index.html',
    source: { docsUrl: 'https://alpha.example/docs/button', registryItemUrl: 'https://alpha.example/r/button.json' },
    reviewedAt: at, verifiedAt: at },
] };
const make = (extra: Record<string, unknown> = {}) => compileItemEvidence({
  raw, catalog, curated: {}, visual, manifest, ledgers: { '@alpha': ledger },
  asOf: at, maxAgeMs: 86_400_000, assetExists: () => true, ...extra,
});

describe('per identity functional / source / visual evidence', () => {
  it('reports every identity and separates observed source, verified image and fixture-only behavior', () => {
    const result = make();
    expect(result.summary).toMatchObject({
      registryCount: 2, identityCount: 2,
      source: { observed: 1, pending: 1 },
      visual: { verified: 1, blocked: 1 },
      functional: { fixture: 1, pending: 1, upstreamBuilt: 0 },
      complete: false,
    });
    expect(result.items).toHaveLength(2);
    expect(result.items[0]).toMatchObject({ token: '@alpha/button',
      source: { status: 'observed', url: 'https://alpha.example/docs/button' },
      visual: { status: 'verified' }, functional: { status: 'fixture' } });
    expect(result.items[1]).toMatchObject({ token: '@alpha/card',
      source: { status: 'pending' }, visual: { status: 'blocked', reason: 'source-page-unverified' },
      functional: { status: 'pending' } });
  });
  it('demotes stale and mismatched discovery and never upgrades images to functional', () => {
    const staleLedger = { get(token: string) {
      return token === '@alpha/button'
        ? source('button', { catalogFingerprint: 'stale' }) : undefined;
    } };
    const report = make({ ledgers: { '@alpha': staleLedger } });
    expect(report.items[0].source.status).toBe('stale');
    expect(report.items[0].visual.status).toBe('blocked');
    expect(report.items[0].functional.status).toBe('fixture');
    expect(report.summary.complete).toBe(false);
  });

  it('blocks missing assets, duplicate manifest identities and orphan references', () => {
    const duplicates = { ...manifest, items: [ ...manifest.items, manifest.items[0] ] };
    const extraVisual = { ...visual, previews: {
      ...visual.previews, '@alpha/fake': visual.previews['@alpha/button'],
    } };
    const report = make({ manifest: duplicates, visual: extraVisual, assetExists: () => false });
    expect(report.items[0].functional.status).toBe('blocked');
    expect(report.items[0].visual).toMatchObject({ status: 'blocked', reason: 'missing-image-asset' });
    expect(report.errors).toContainEqual({ token: '@alpha/fake', reason: 'orphan-visual-reference' });
    expect(report.summary.complete).toBe(false);
  });

  it('exposes duplicate indexed identities as integrity findings rather than silently discarding them', () => {
    const withDuplicate = { registries: {
      ...catalog.registries, '@alpha': [...catalog.registries['@alpha'], catalog.registries['@alpha'][0]],
    } };
    const report = make({ catalog: withDuplicate });
    expect(report.summary).toMatchObject({ identityCount: 2, indexedRows: 3,
      indexedDistinct: 2, curatedOnly: 0, indexedDuplicates: 1, complete: false });
    expect(report.errors).toContainEqual({ token: '@alpha/button', reason: 'duplicate-indexed-identity', count: 1 });
    expect(report.items).toHaveLength(2);
  });

  it('never treats verified fixture counts as upstream runtime parity', () => {
    expect(make().summary.functional.upstreamBuilt).toBe(0);
    expect(make().summary.functional.fixture).toBe(1);
    expect(make().summary.complete).toBe(false);
  });
});

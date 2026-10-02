import { describe, expect, it } from 'vitest';
// @ts-expect-error The browser test tsconfig excludes Node builtin declarations.
import { existsSync } from 'node:fs';
// @ts-expect-error Source planner is a Node ESM script with no TypeScript declaration.
import { planPreviewCoverage } from '../../scripts/plan-component-previews.mjs';

const raw = [
  { name: '@a', homepage: 'https://a.example' },
  { name: '@b', homepage: 'https://b.example' },
  { name: '@empty', homepage: 'https://empty.example' },
];
const catalog = { registries: {
  '@a': [{ name: 'button', type: 'registry:ui' }, { name: 'button', type: 'registry:ui' },
    { name: 'card', type: 'registry:ui' }],
  '@b': [{ name: 'button', type: 'registry:ui' },
    { name: 'nested/accordion', type: 'registry:ui' }],
}};
const reviewed = { schema: 'registry-atlas-component-demos/v1', items: [{
  namespace: '@a', slug: 'button', kind: 'source-informed-fixture',
  status: 'interaction-verified', path: '/Registry-Atlas/component-demos/a/index.html',
  source: { docsUrl: 'https://a.example/components/button',
    registryItemUrl: 'https://a.example/r/button.json' },
  reviewedAt: '2026-10-01T15:00:00Z', verifiedAt: '2026-10-01T16:00:00Z',
}]};
const curated = { '@a': [{ slug: 'orphan', name: 'Orphan' }] };

describe('full-catalog preview coverage planner', () => {
  it('provides a read-only planning command', () => {
    expect(existsSync('scripts/plan-component-previews.mjs')).toBe(true);
  });

  it('counts exact identities across all registries without double-counting duplicates', () => {
    const report = planPreviewCoverage(raw, catalog, reviewed, {}, curated);
    expect(report.summary).toMatchObject({
      rawRegistries: 3, populatedRegistries: 2, emptyRegistries: 1,
      indexedRows: 5, indexedDuplicates: 1, indexedDistinct: 4,
      curatedOnly: 1, distinctItems: 5,
      fixtureVerified: 1, upstreamBuiltVerified: 0,
      pending: 4, blocked: 0, complete: false,
    });
    expect(report.registries).toEqual(expect.arrayContaining([
      expect.objectContaining({ namespace: '@empty', total: 0, status: 'empty' }),
      expect.objectContaining({ namespace: '@a', total: 3, fixtureVerified: 1 }),
      expect.objectContaining({ namespace: '@b', total: 2, fixtureVerified: 0 }),
    ]));
  });

  it('paginates only pending exact identities and supports slash-shaped slugs', () => {
    const first = planPreviewCoverage(raw, catalog, reviewed, { limit: 2 }, curated);
    expect(first.batch.map((x: {token: string}) => x.token)).toEqual(['@a/card', '@a/orphan']);
    expect(first.nextCursor).toBe('@a/orphan');
    const next = planPreviewCoverage(raw, catalog, reviewed,
      { limit: 2, cursor: first.nextCursor }, curated);
    expect(next.batch.map((x: {token: string}) => x.token))
      .toEqual(['@b/button', '@b/nested/accordion']);
    expect(next.nextCursor).toBeNull();
    expect(next.summary).toEqual(first.summary);
    expect(planPreviewCoverage(raw, catalog, reviewed,
      { registry: '@b', limit: 2 }, curated).batch).toHaveLength(2);
  });

  it('does not certify reviewed entries when the local executable asset is missing', () => {
    const missing = planPreviewCoverage(raw, catalog, reviewed,
      { assetExists: () => false }, curated);
    expect(missing.summary.fixtureVerified).toBe(0);
    expect(missing.summary.blocked).toBe(1);
    expect(missing.errors).toContainEqual(expect.objectContaining({
      token: '@a/button', reason: 'missing-built-asset',
    }));
  });

  it('rejects nonexistent cursors, unknown registries and unbounded batches', () => {
    expect(() => planPreviewCoverage(raw, catalog, reviewed,
      { cursor: '@a/nope' }, curated)).toThrow(/cursor/i);
    expect(() => planPreviewCoverage(raw, catalog, reviewed,
      { registry: '@absent' }, curated)).toThrow(/registry/i);
    for (const limit of [0, -1, 1.5, 201]) {
      expect(() => planPreviewCoverage(raw, catalog, reviewed,
        { limit }, curated)).toThrow(/limit/i);
    }
  });

  it('fails closed for forged manifest membership, duplicate review and nonlocal paths', () => {
    const injected = structuredClone(reviewed);
    injected.items.push({ ...reviewed.items[0], slug: 'absent' });
    const missing = planPreviewCoverage(raw, catalog, injected, {}, curated);
    expect(missing.errors).toContainEqual(expect.objectContaining({ token: '@a/absent' }));
    expect(missing.summary.complete).toBe(false);

    const same = structuredClone(reviewed);
    same.items.push({ ...reviewed.items[0] });
    const dup = planPreviewCoverage(raw, catalog, same, {}, curated);
    expect(dup.errors).toContainEqual(expect.objectContaining({ token: '@a/button' }));
    expect(dup.summary.fixtureVerified).toBe(0);

    const unsafe = structuredClone(reviewed);
    unsafe.items[0].path = 'https://evil.example/runnable';
    const invalid = planPreviewCoverage(raw, catalog, unsafe, {}, curated);
    expect(invalid.summary.fixtureVerified).toBe(0);
    expect(invalid.summary.blocked).toBe(1);
    expect(invalid.errors).toContainEqual(expect.objectContaining({ token: '@a/button' }));
  });
});

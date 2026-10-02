import { describe, expect, it } from 'vitest';
// @ts-ignore Standalone Node ESM scheduler.
import { planRegistryDiscovery, executeDiscoveryBatch } from '../../scripts/lib/registry-discovery-schedule.mjs';
// @ts-ignore Standalone Node ESM discovery helper.
import { catalogFingerprint, DISCOVERY_REVISION } from '../../scripts/lib/registry-discovery.mjs';

const raw = [
  {name: '@alpha', homepage: 'https://alpha.example/'},
  {name: '@beta', homepage: 'https://beta.example/'},
  {name: '@empty', homepage: 'https://empty.example/'},
];
const catalog = {registries: {
  '@alpha': [{name: 'button'}, {name: 'card'}, {name: 'button'}],
  '@beta': [{name: 'button'}],
  '@empty': [],
}};
const at = '2026-10-02T08:00:00.000Z';

describe('bounded registry discovery scheduler', () => {
  it('counts all registries and distinct item states without equating documentation with built previews', () => {
    const fp = catalogFingerprint(raw[0], ['button', 'card']);
    const evidence = {
      '@alpha': new Map([
        ['@alpha/button', {status: 'page-observed', discoveryRevision: DISCOVERY_REVISION,
          catalogFingerprint: fp, checkedAt: at}],
      ]),
    };
    const result = planRegistryDiscovery(raw, catalog, {}, evidence, {
      asOf: at, allowedDomains: ['alpha.example'], maxRegistries: 1,
    });
    expect(result.summary).toMatchObject({
      rawRegistries: 3, distinctItems: 3, pageObserved: 1,
      notVisited: 2, blockedByProfile: 2,
    });
    expect(result.batch.map((row: any) => row.namespace)).toEqual(['@alpha']);
    expect(result.batch[0]).toMatchObject({totalItems: 2, pageObserved: 1, notVisited: 1});
    expect(result.nextCursor).toBeNull();
    expect(result.registries.find((row: any) => row.namespace === '@empty'))
      .toMatchObject({totalItems: 0, notVisited: 0});
  });

  it('separates ambiguous, blocked, stale and unresolved records and resumes after the exact cursor', () => {
    const fp = catalogFingerprint(raw[0], ['button', 'card']);
    const first = planRegistryDiscovery(raw, catalog, {}, {}, {
      asOf: at, allowedDomains: ['alpha.example', 'beta.example'], maxRegistries: 1,
    });
    expect(first.batch.map((row: any) => row.namespace)).toEqual(['@alpha']);
    expect(first.nextCursor).toBe('@alpha');
    const result = planRegistryDiscovery(raw, catalog, {}, {
      '@alpha': new Map([
        ['@alpha/button', {status: 'unresolved', reason: 'multiple-observed-destinations',
          catalogFingerprint: fp, discoveryRevision: DISCOVERY_REVISION, checkedAt: at}],
        ['@alpha/card', {status: 'unresolved', reason: 'component-navigation-error',
          catalogFingerprint: 'stale', discoveryRevision: DISCOVERY_REVISION, checkedAt: at}],
      ]),
      '@beta': new Map([['@beta/button', {status: 'unresolved',
        reason: 'profile-domain-not-allowed',
        catalogFingerprint: catalogFingerprint(raw[1], ['button']),
        discoveryRevision: DISCOVERY_REVISION, checkedAt: at}]]),
    }, {asOf: at, allowedDomains: ['alpha.example', 'beta.example'],
      maxRegistries: 1, cursor: '@alpha'});
    expect(result.summary).toMatchObject({
      ambiguous: 1, stale: 1, blocked: 1, notVisited: 0,
    });
    expect(result.batch.map((row: any) => row.namespace)).toEqual(['@beta']);
    expect(result.nextCursor).toBeNull();
  });

  it('runs bounded jobs serially and keeps failures visible without blocking later registries', async () => {
    const order: string[] = [];
    const jobs = [{namespace: '@alpha'}, {namespace: '@beta'}];
    const results = await executeDiscoveryBatch(jobs, async (job: any) => {
      order.push(job.namespace);
      if (job.namespace === '@alpha') throw new Error('Source unavailable');
      return {processedThisRun: 1};
    });
    expect(order).toEqual(['@alpha', '@beta']);
    expect(results).toEqual([
      {namespace: '@alpha', outcome: 'failed', reason: 'Source unavailable'},
      {namespace: '@beta', outcome: 'completed', result: {processedThisRun: 1}},
    ]);
  });

  it('rejects invalid cursors, duplicate registry names and out-of-range budgets', () => {
    expect(() => planRegistryDiscovery(raw, catalog, {}, {}, {cursor: '@missing'}))
      .toThrow(/cursor/i);
    expect(() => planRegistryDiscovery([raw[0], raw[0]], catalog, {}, {}))
      .toThrow(/duplicate/i);
    expect(() => planRegistryDiscovery(raw, catalog, {}, {}, {maxRegistries: 999}))
      .toThrow(/maxRegistries/i);
  });
});

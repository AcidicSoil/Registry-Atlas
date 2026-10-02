import { describe, expect, it } from 'vitest';
// @ts-ignore Standalone Node ESM reconciliation.
import { reconcileCoverage, parseReconciliationArgs, domainsFromManagedProfile } from '../../scripts/reconcile-component-preview-coverage.mjs';

const raw = [
  {name: '@alpha', homepage: 'https://alpha.example/'},
  {name: '@empty', homepage: 'https://empty.example/'},
];
const catalog = {registries: {'@alpha': [
  {name: 'button', type: 'registry:ui'}, {name: 'card', type: 'registry:ui'},
], '@empty': []}};
const manifest = {schema: 'registry-atlas-component-demos/v1', items: [{
  namespace: '@alpha', slug: 'button', kind: 'source-informed-fixture',
  status: 'interaction-verified', path: '/Registry-Atlas/component-demos/alpha-button/index.html',
  source: {docsUrl: 'https://alpha.example/docs/button',
    registryItemUrl: 'https://alpha.example/r/button.json'},
  reviewedAt: '2026-10-01T00:00:00.000Z', verifiedAt: '2026-10-01T00:00:00.000Z',
}]};
const asOf = '2026-10-02T08:00:00.000Z';

describe('independent preview and discovery coverage reconciliation', () => {
  it('requires a named managed source profile and its running server for CLI reconciliation', () => {
    expect(() => parseReconciliationArgs(['--journal-dir', '/tmp/atlas'])).toThrow(/--profile/);
    expect(() => parseReconciliationArgs(['--journal-dir', '/tmp/atlas', '--profile', 'source'])).toThrow(/--server/);
    expect(() => parseReconciliationArgs(['--journal-dir', '/tmp/atlas', '--profile', 'source',
      '--server', 'http://127.0.0.1:9878', '--unsupported', 'yes'])).toThrow(/Unknown/);
    expect(parseReconciliationArgs(['--journal-dir', '/tmp/atlas', '--profile', 'source',
      '--server', 'http://127.0.0.1:9878'])).toMatchObject({
      profile: 'source', server: 'http://127.0.0.1:9878', journalDir: '/tmp/atlas',
    });
  });

  it('uses only the selected managed profile settings and rejects stale/untrusted status', () => {
    const status = {ok: true, profile: 'source', data: {
      instances: [{url: 'http://127.0.0.1:9878', status: 'running'}],
      settings: {allowedDomains: ['alpha.example']},
    }};
    expect(domainsFromManagedProfile(status, 'source', 'http://127.0.0.1:9878')).toEqual(['alpha.example']);
    expect(() => domainsFromManagedProfile(status, 'source', 'http://127.0.0.1:9877')).toThrow(/running/);
    expect(() => domainsFromManagedProfile(status, 'other', 'http://127.0.0.1:9878')).toThrow(/profile/);
    expect(() => domainsFromManagedProfile({...status, data: {...status.data, settings: {}}}, 'source',
      'http://127.0.0.1:9878')).toThrow(/allowedDomains/);
  });

  it('retains empty registries, separates document and functional stages, and flags unfinished coverage', () => {
    const result = reconcileCoverage(raw, catalog, {}, manifest, {}, {
      asOf, assetExists: () => true,
    });
    expect(result.summary).toMatchObject({
      rawRegistries: 2, distinctItems: 2,
      pageObserved: 0, notVisited: 2,
      blockedByProfile: 2,
      fixtureVerified: 1, upstreamBuiltVerified: 0, previewPending: 1,
      complete: false, errors: 0,
    });
    expect(result.registries).toHaveLength(2);
    expect(result.registries.find((r: any) => r.namespace === '@empty'))
      .toMatchObject({totalItems: 0, pageObserved: 0});
  });

  it('keeps reviewed fixture coverage when docs discovery is blocked, without upgrading to upstream-built', () => {
    const result = reconcileCoverage(raw, catalog, {}, manifest, {}, {
      asOf, allowedDomains: ['alpha.example'], assetExists: () => true,
    });
    expect(result.summary).toMatchObject({
      fixtureVerified: 1, upstreamBuiltVerified: 0,
      blockedByProfile: 1, previewPending: 1,
    });
    expect(result.summary.pageObserved).toBe(0);
  });

  it('rejects missing demo files and malformed reviewed manifest identities', () => {
    const result = reconcileCoverage(raw, catalog, {}, manifest, {}, {
      asOf, assetExists: () => false,
    });
    expect(result.summary).toMatchObject({fixtureVerified: 0, errors: 1, complete: false});
    expect(result.errors[0].reason).toBe('missing-built-asset');

    const unsupported = structuredClone(manifest);
    unsupported.items[0]!.slug = 'invented';
    const bad = reconcileCoverage(raw, catalog, {}, unsupported, {}, {
      asOf, assetExists: () => true,
    });
    expect(bad.summary.errors).toBe(1);
    expect(bad.summary.complete).toBe(false);
  });
});

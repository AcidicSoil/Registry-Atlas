import { describe, expect, it } from 'vitest';
// @ts-ignore Standalone Node ESM script.
import { evaluateCatalogClassifications, validateGoldSet, validatePromotionReview } from '../../scripts/evaluate-catalog-classifications.mjs';
import { readRepositoryDocument } from './testAtlasDatabase';

function item(namespace: string, name: string, kind: string, primary: string | null, path: string[], systemOne?: any) {
  return {
    namespace, name, kind, taxonomyVersion: 'v1', canonical: { primary, path },
    method: primary === null ? 'unclassified' : systemOne ? 'system-one' : 'deterministic-alias',
    inputFingerprint: `sha256:${'1'.repeat(64)}`,
    ...(systemOne ? { systemOne } : {}),
  };
}

const gold = validateGoldSet({
  version: 'gold-v1', taxonomyVersion: 'v1', records: [
    { registry: '@a', item: { name: 'shell', kind: 'block' }, expected: { kind: 'block', primary: 'application/app-shell', path: ['application', 'application/app-shell'] } },
    { registry: '@b', item: { name: 'chat', kind: 'block' }, expected: { kind: 'block', primary: 'ai/chat', path: ['ai', 'ai/chat'] } },
    { registry: '@c', item: { name: 'mystery', kind: 'component' }, expected: { kind: 'component', primary: null, path: [] } },
  ],
});

describe('canonical classification gold set', () => {
  it('contains reviewed cross-registry examples for the approved priority concepts', () => {
    const reviewed = validateGoldSet(readRepositoryDocument('catalog-gold-set'));
    const keys = new Set(reviewed.records.map((row: any) => `${row.registry}/${row.item.name}:${row.expected.primary}`));
    expect(keys.has('@7ovr/app-shell-1:application/app-shell')).toBe(true);
    expect(keys.has('@efferd/app-shell-1:application/app-shell')).toBe(true);
    expect(keys.has('@boardui/ai-chat:ai/chat')).toBe(true);
    expect(keys.has('@boardui/chat-starter:ai/chat')).toBe(true);
    expect(keys.has('@boardui/ai-image-generation:ai/generation')).toBe(true);
    expect(keys.has('@8bitcn/button:controls/button')).toBe(true);
    expect(keys.has('@boardui/color:foundation/color')).toBe(true);
    expect(keys.has('@boardui/typography:foundation/typography')).toBe(true);
    expect(reviewed.records.some((row: any) => row.registry === '@bencho' && row.expected.primary === null)).toBe(true);
  });

  it('rejects duplicate gold identities and invalid expected paths', () => {
    expect(() => validateGoldSet({
      version: 'gold-v1', taxonomyVersion: 'v1', records: [gold.records[0], gold.records[0]],
    })).toThrow(/duplicate/i);
    expect(() => validateGoldSet({
      version: 'gold-v1', taxonomyVersion: 'v1', records: [{
        registry: '@a', item: { name: 'bad', kind: 'block' },
        expected: { kind: 'block', primary: 'ai/chat', path: ['application', 'ai/chat'] },
      }],
    })).toThrow(/path/i);
  });
});

describe('classification evaluation', () => {
  it('reports exact, family, ancestor, unclassified, confusion, source/kind, and distribution metrics', () => {
    const beam = [
      item('@a', 'shell', 'block', 'application/app-shell', ['application', 'application/app-shell'], {
        decisions: [{ choice: 'application', probabilities: { application: 0.7 }, confidence: 0.4 }],
        finalPathScore: 0.72, runnerUpPathScore: 0.4, separation: 1.8,
      }),
      item('@b', 'chat', 'block', 'ai/agent', ['ai', 'ai/agent'], {
        decisions: [{ choice: 'ai', probabilities: { ai: 0.6 }, confidence: 0.3 }],
        finalPathScore: 0.61, runnerUpPathScore: 0.5, separation: 1.22,
      }),
      item('@c', 'mystery', 'component', null, []),
    ];
    const greedy = [
      item('@a', 'shell', 'block', 'application/dashboard', ['application', 'application/dashboard']),
      item('@b', 'chat', 'block', 'ai/chat', ['ai', 'ai/chat']),
      item('@c', 'mystery', 'component', 'content-media/card', ['content-media', 'content-media/card']),
    ];
    const report = evaluateCatalogClassifications({ gold, beamItems: beam, greedyItems: greedy });

    expect(report.metrics.exactPrimary).toEqual({ correct: 2, total: 3, accuracy: 2 / 3 });
    expect(report.metrics.topFamily).toEqual({ correct: 3, total: 3, accuracy: 1 });
    expect(report.metrics.ancestorPath.accuracy).toBeCloseTo(4 / 5, 8);
    expect(report.metrics.unclassified).toEqual({ precision: 1, recall: 1, truePositive: 1, falsePositive: 0, falseNegative: 0 });
    expect(report.metrics.confusions).toEqual([{ expected: 'ai/chat', actual: 'ai/agent', count: 1 }]);
    expect(report.metrics.byKind.block).toMatchObject({ correct: 1, total: 2, accuracy: 0.5 });
    expect(report.metrics.byRegistry['@b']).toMatchObject({ correct: 0, total: 1, accuracy: 0 });
    expect(report.greedyVsBeam).toMatchObject({ beamExactAccuracy: 2 / 3, greedyExactAccuracy: 1 / 3, delta: 1 / 3 });
    expect(report.distributions.finalPathScore).toMatchObject({ count: 2, min: 0.61, max: 0.72 });
    expect(report.distributions.separation).toMatchObject({ count: 2, min: 1.22, max: 1.8 });
  });

  it('counts partial ancestor agreement instead of requiring exact leaf equality', () => {
    const report = evaluateCatalogClassifications({
      gold: validateGoldSet({ version: 'g', taxonomyVersion: 'v1', records: [gold.records[0]] }),
      beamItems: [item('@a', 'shell', 'block', 'application/dashboard', ['application', 'application/dashboard'])],
    });
    expect(report.metrics.exactPrimary.accuracy).toBe(0);
    expect(report.metrics.topFamily.accuracy).toBe(1);
    expect(report.metrics.ancestorPath.accuracy).toBe(0.5);
  });
});

describe('promotion review gate', () => {
  it('requires explicit approval tied to exact taxonomy, run, and evaluation fingerprints', () => {
    const valid = {
      schema: 'registry-atlas.catalog-promotion-review.v1', approved: true,
      taxonomyVersion: 'v1',
      classificationRunFingerprint: `sha256:${'a'.repeat(64)}`,
      evaluationReportFingerprint: `sha256:${'b'.repeat(64)}`,
      reviewer: 'catalog-reviewer', approvedAt: '2026-10-06T20:00:00.000Z',
    };
    expect(validatePromotionReview(valid)).toEqual(valid);
    expect(() => validatePromotionReview({ ...valid, approved: false })).toThrow(/approved/i);
    expect(() => validatePromotionReview({ ...valid, classificationRunFingerprint: 'sha256:wrong' })).toThrow(/fingerprint/i);
    expect(() => validatePromotionReview({ ...valid, reviewer: '' })).toThrow(/reviewer/i);
  });
});

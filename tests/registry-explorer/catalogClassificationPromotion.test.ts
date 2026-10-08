import { describe, expect, it } from 'vitest';
// @ts-ignore Standalone Node ESM modules.
import { buildCatalogClassificationState } from '../../scripts/lib/catalog-classification-state.mjs';
// @ts-ignore Standalone Node ESM modules.
import { catalogClassificationInputFingerprint } from '../../scripts/lib/catalog-classifier.mjs';
// @ts-ignore Standalone Node ESM modules.
import { validateCatalogTaxonomy } from '../../scripts/lib/catalog-taxonomy.mjs';
// @ts-ignore Standalone Node ESM modules.
import { applyCatalogClassificationOverlay, validateCatalogClassificationOverlay } from '../../scripts/lib/catalog-classification-overlay.mjs';
// @ts-ignore Standalone Node ESM script.
import { buildReviewedClassificationOverlay } from '../../scripts/promote-catalog-classifications.mjs';
// @ts-ignore Standalone Node ESM script.
import { catalogArtifactFingerprint } from '../../scripts/evaluate-catalog-classifications.mjs';
// @ts-ignore Standalone Node ESM script.
import { projectReviewedCatalogClassifications } from '../../scripts/sync-shadcn-registries.mjs';
import { readRepositoryDocument } from './testAtlasDatabase';

const taxonomy = validateCatalogTaxonomy(readRepositoryDocument('catalog-taxonomy'));
const accessRules = readRepositoryDocument('catalog-access-rules');

function classification(namespace = '@7ovr', name = 'app-shell-1', categories = ['app-shell']) {
  const kind = 'block';
  const state = buildCatalogClassificationState({
    namespace,
    item: { name, title: 'Sidebar Dashboard Shell', description: 'App shell with navigation.', kind },
    sourceHints: { categories },
  });
  return {
    namespace,
    name,
    kind,
    taxonomyVersion: 'v1',
    canonical: { primary: 'application/app-shell', path: ['application', 'application/app-shell'] },
    method: 'deterministic-alias',
    inputFingerprint: catalogClassificationInputFingerprint(state),
    generatedAt: '2026-10-06T20:00:00.000Z',
  };
}

function reviewedBundle(items: any[]) {
  const classificationRunFingerprint = catalogArtifactFingerprint(items);
  const evaluationBase = {
    schema: 'registry-atlas.catalog-classification-evaluation.v1',
    taxonomyVersion: 'v1',
    classificationRunFingerprint,
    metrics: { exactPrimary: { correct: items.length, total: items.length, accuracy: 1 } },
  };
  const evaluationReportFingerprint = catalogArtifactFingerprint(evaluationBase);
  const evaluation = { ...evaluationBase, evaluationReportFingerprint };
  const review = {
    schema: 'registry-atlas.catalog-promotion-review.v1', approved: true,
    taxonomyVersion: 'v1', classificationRunFingerprint, evaluationReportFingerprint,
    reviewer: 'catalog-reviewer', approvedAt: '2026-10-06T21:00:00.000Z',
  };
  return { evaluation, review };
}

describe('reviewed classification promotion', () => {
  it('refuses absent approval and mismatched run/evaluation/taxonomy fingerprints', () => {
    const items = [classification()];
    const { evaluation, review } = reviewedBundle(items);
    expect(() => buildReviewedClassificationOverlay({
      taxonomy, classifications: items, evaluation, review: { ...review, approved: false },
    })).toThrow(/approved/i);
    expect(() => buildReviewedClassificationOverlay({
      taxonomy, classifications: items, evaluation,
      review: { ...review, classificationRunFingerprint: `sha256:${'c'.repeat(64)}` },
    })).toThrow(/fingerprint/i);
    expect(() => buildReviewedClassificationOverlay({
      taxonomy, classifications: items,
      evaluation: { ...evaluation, evaluationReportFingerprint: `sha256:${'d'.repeat(64)}` }, review,
    })).toThrow(/evaluation.*fingerprint/i);
    expect(() => buildReviewedClassificationOverlay({
      taxonomy, classifications: items, evaluation,
      review: { ...review, taxonomyVersion: 'v0' },
    })).toThrow(/taxonomy/i);
  });

  it('creates an overlay only from canonical paths present in the validated taxonomy', () => {
    const items = [classification()];
    const { evaluation, review } = reviewedBundle(items);
    const overlay = buildReviewedClassificationOverlay({ taxonomy, classifications: items, evaluation, review });
    expect(validateCatalogClassificationOverlay(overlay, taxonomy)).toEqual(overlay);
    expect(overlay).toMatchObject({
      schema: 'registry-atlas.catalog-classification-overlay.v1', taxonomyVersion: 'v1',
      approvedBy: 'catalog-reviewer', items: [expect.objectContaining({
        namespace: '@7ovr', name: 'app-shell-1', kind: 'block',
        canonical: { primary: 'application/app-shell', path: ['application', 'application/app-shell'] },
      })],
    });

    const invalid = structuredClone(overlay);
    invalid.items[0].canonical = { primary: 'application/not-real', path: ['application', 'application/not-real'] };
    expect(() => validateCatalogClassificationOverlay(invalid, taxonomy)).toThrow(/taxonomy|canonical/i);
  });
});

describe('classification overlay application', () => {
  it('preserves raw fields, keeps source groups separate, and adds only reviewed canonical fields', () => {
    const raw = {
      '@7ovr': [{
        name: 'app-shell-1', type: 'registry:block', title: 'Sidebar Dashboard Shell',
        description: 'App shell with navigation.', categories: ['app-shell'], fileCount: 3,
      }],
    };
    const entry = classification();
    const { evaluation, review } = reviewedBundle([entry]);
    const overlay = buildReviewedClassificationOverlay({ taxonomy, classifications: [entry], evaluation, review });
    overlay.items[0].sourceGroups = ['App'];
    const result = applyCatalogClassificationOverlay(raw, overlay, accessRules);
    const promoted = result.itemsByNamespace['@7ovr'][0];

    expect(promoted).toMatchObject({
      name: raw['@7ovr'][0].name,
      type: raw['@7ovr'][0].type,
      title: raw['@7ovr'][0].title,
      description: raw['@7ovr'][0].description,
      categories: raw['@7ovr'][0].categories,
      fileCount: 3,
      kind: 'block',
      canonical: { taxonomyVersion: 'v1', primary: 'application/app-shell', path: ['application', 'application/app-shell'] },
      sourceGroups: ['App'],
    });
    expect(promoted.access).toEqual({ normalized: 'free', sourceLabel: 'Free' });
    expect(result.report).toMatchObject({ applied: 1, stale: 0 });
  });

  it('uses a reviewed registry-level access default only when the source registry has explicit semantics', () => {
    const entries = [
      classification('@7ovr', 'app-shell-default', ['app-shell']),
      classification('@8bitcn', 'plain-block', ['layout']),
    ];
    const { evaluation, review } = reviewedBundle(entries);
    const overlay = buildReviewedClassificationOverlay({
      taxonomy, classifications: entries, evaluation, review,
    });
    const result = applyCatalogClassificationOverlay({
      '@7ovr': [{
        name: 'app-shell-default',
        type: 'registry:block',
        title: 'Sidebar Dashboard Shell',
        description: 'App shell with navigation.',
        categories: ['app-shell'],
      }],
      '@8bitcn': [{
        name: 'plain-block',
        type: 'registry:block',
        title: 'Sidebar Dashboard Shell',
        description: 'App shell with navigation.',
        categories: ['layout'],
      }],
    }, overlay, accessRules).itemsByNamespace;

    expect(result['@7ovr'][0].access).toEqual({
      normalized: 'free',
      sourceLabel: 'Free',
    });
    expect(result['@8bitcn'][0]).not.toHaveProperty('access');
  });

  it('normalizes explicit reviewed access labels but never invents unknown access', () => {
    const entries: any[] = [
      { ...classification('@7ovr', 'free-block', ['Free']), sourceGroups: ['Free'] },
      { ...classification('@7ovr', 'pro-block', ['Pro']), sourceGroups: ['Pro'] },
      { ...classification('@boardui', 'premium-block', ['Premium']), sourceGroups: ['Premium'] },
      { ...classification('@8bitcn', 'plain-block', ['layout']) },
    ];
    const itemsByNamespace: Record<string, any[]> = {};
    for (const entry of entries) {
      itemsByNamespace[entry.namespace] ??= [];
      const label = entry.sourceGroups?.[0] ?? 'layout';
      itemsByNamespace[entry.namespace].push({
        name: entry.name, type: 'registry:block', title: 'Sidebar Dashboard Shell',
        description: 'App shell with navigation.', categories: [label],
      });
    }
    const { evaluation, review } = reviewedBundle(entries);
    const overlay = buildReviewedClassificationOverlay({ taxonomy, classifications: entries, evaluation, review });
    const result = applyCatalogClassificationOverlay(itemsByNamespace, overlay, accessRules).itemsByNamespace;
    expect(result['@7ovr'][0].access).toEqual({ normalized: 'free', sourceLabel: 'Free' });
    expect(result['@7ovr'][1].access).toEqual({ normalized: 'paid', sourceLabel: 'Pro' });
    expect(result['@boardui'][0].access).toEqual({ normalized: 'paid', sourceLabel: 'Premium' });
    expect(result['@8bitcn'][0]).not.toHaveProperty('access');
    expect(JSON.stringify(result)).not.toContain('unknown');
  });

  it('omits stale reviewed entries when current semantic input fingerprint changes', () => {
    const entry = classification();
    const { evaluation, review } = reviewedBundle([entry]);
    const overlay = buildReviewedClassificationOverlay({ taxonomy, classifications: [entry], evaluation, review });
    const result = applyCatalogClassificationOverlay({
      '@7ovr': [{
        name: 'app-shell-1', type: 'registry:block', title: 'Renamed unrelated surface',
        description: 'Changed upstream meaning.', categories: ['app-shell'],
      }],
    }, overlay, accessRules);
    expect(result.itemsByNamespace['@7ovr'][0]).not.toHaveProperty('canonical');
    expect(result.report).toMatchObject({ applied: 0, stale: 1 });
  });

  it('sync projection strips previously managed fields before reapplying the current reviewed overlay', () => {
    const rawWithOldPromotion = { '@7ovr': [{
      name: 'app-shell-1', type: 'registry:block', title: 'Sidebar Dashboard Shell',
      description: 'App shell with navigation.', categories: ['app-shell'],
      kind: 'component',
      canonical: { taxonomyVersion: 'v1', primary: 'controls/button', path: ['controls', 'controls/button'] },
      access: { normalized: 'paid', sourceLabel: 'Old' },
    }] };
    const entry = classification();
    const { evaluation, review } = reviewedBundle([entry]);
    const overlay = buildReviewedClassificationOverlay({ taxonomy, classifications: [entry], evaluation, review });
    const projected = projectReviewedCatalogClassifications(rawWithOldPromotion, { taxonomy, overlay, accessRules });
    expect(projected.itemsByNamespace['@7ovr'][0]).toMatchObject({
      kind: 'block',
      canonical: { primary: 'application/app-shell', path: ['application', 'application/app-shell'] },
    });
    expect(projected.itemsByNamespace['@7ovr'][0].access).toEqual({
      normalized: 'free',
      sourceLabel: 'Free',
    });
  });

  it('is durable and idempotent across identical upstream refreshes', () => {
    const raw = { '@7ovr': [{
      name: 'app-shell-1', type: 'registry:block', title: 'Sidebar Dashboard Shell',
      description: 'App shell with navigation.', categories: ['app-shell'],
    }] };
    const entry = classification();
    const { evaluation, review } = reviewedBundle([entry]);
    const overlay = buildReviewedClassificationOverlay({ taxonomy, classifications: [entry], evaluation, review });
    const first = applyCatalogClassificationOverlay(raw, overlay, accessRules);
    const second = applyCatalogClassificationOverlay(raw, overlay, accessRules);
    expect(second).toEqual(first);
  });
});

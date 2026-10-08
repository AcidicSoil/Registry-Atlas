import { describe, expect, it } from 'vitest';
import { readRepositoryDocument } from './testAtlasDatabase';
// @ts-ignore Standalone Node ESM modules.
import { validateCatalogRuntimeContract } from '../../scripts/lib/catalog-runtime-contract.mjs';
// @ts-ignore Standalone Node ESM modules.
import { catalogArtifactFingerprint } from '../../scripts/evaluate-catalog-classifications.mjs';
// @ts-ignore Standalone Node ESM modules.
import { buildCatalogClassificationState } from '../../scripts/lib/catalog-classification-state.mjs';
// @ts-ignore Standalone Node ESM modules.
import { validateCatalogTaxonomy } from '../../scripts/lib/catalog-taxonomy.mjs';
// @ts-ignore Standalone Node ESM modules.
import { catalogClassificationInputFingerprint } from '../../scripts/lib/catalog-classifier.mjs';

const taxonomy = readRepositoryDocument<any>('catalog-taxonomy');

function fixture() {
  const raw = {
    name: 'app-shell',
    title: 'App Shell',
    type: 'registry:block',
  };
  const inputFingerprint = catalogClassificationInputFingerprint(
    buildCatalogClassificationState({
      namespace: '@demo',
      item: { name: raw.name, title: raw.title, kind: 'block' },
    }),
  );
  const overlay = {
    schema: 'registry-atlas.catalog-classification-overlay.v1',
    taxonomyVersion: 'v1',
    taxonomyFingerprint: catalogArtifactFingerprint(validateCatalogTaxonomy(taxonomy)),
    classificationRunFingerprint: `sha256:${'a'.repeat(64)}`,
    evaluationReportFingerprint: `sha256:${'b'.repeat(64)}`,
    approvedBy: 'reviewer',
    approvedAt: '2026-10-06T20:00:00.000Z',
    items: [{
      namespace: '@demo',
      name: 'app-shell',
      kind: 'block',
      canonical: {
        primary: 'application/app-shell',
        path: ['application', 'application/app-shell'],
      },
      inputFingerprint,
    }],
  };
  const runtimeCatalog: any = {
    meta: { registry_count: 1, item_count: 1 },
    registries: {
      '@demo': [{
        ...raw,
        kind: 'block',
        canonical: {
          taxonomyVersion: 'v1',
          primary: 'application/app-shell',
          path: ['application', 'application/app-shell'],
        },
      }],
    },
  };
  return { overlay, runtimeCatalog };
}

describe('canonical runtime contract', () => {
  it('accepts an exact source/runtime taxonomy, reviewed overlay, and promoted catalog projection', () => {
    const { overlay, runtimeCatalog } = fixture();
    const result = validateCatalogRuntimeContract({
      sourceTaxonomy: taxonomy,
      runtimeTaxonomy: structuredClone(taxonomy),
      overlay,
      runtimeCatalog,
      accessRules: {},
    });
    expect(result.errors).toEqual([]);
    expect(result.summary).toMatchObject({
      overlayItems: 1,
      runtimeCanonicalItems: 1,
      staleOverlayItems: 0,
      missingOverlayItems: 0,
    });
  });

  it('rejects taxonomy drift and canonical ids outside the reviewed taxonomy', () => {
    const { overlay, runtimeCatalog } = fixture();
    const drifted = structuredClone(taxonomy);
    drifted.roots = drifted.roots.filter((root: any) => root.id !== 'application');
    const driftResult = validateCatalogRuntimeContract({
      sourceTaxonomy: taxonomy,
      runtimeTaxonomy: drifted,
      overlay,
      runtimeCatalog,
      accessRules: {},
    });
    expect(driftResult.errors.join('\n')).toMatch(/runtime taxonomy.*source taxonomy/i);

    const invalidRuntime = structuredClone(runtimeCatalog);
    invalidRuntime.registries['@demo'][0].canonical = {
      taxonomyVersion: 'v1',
      primary: 'application/not-real',
      path: ['application', 'application/not-real'],
    };
    const invalidResult = validateCatalogRuntimeContract({
      sourceTaxonomy: taxonomy,
      runtimeTaxonomy: taxonomy,
      overlay,
      runtimeCatalog: invalidRuntime,
      accessRules: {},
    });
    expect(invalidResult.errors.join('\n')).toMatch(/canonical|taxonomy/i);
  });

  it('allows reviewed overlay identities that are absent from the current runtime catalog to remain dormant', () => {
    const { overlay, runtimeCatalog } = fixture();
    overlay.items.push({
      namespace: '@fixture-only',
      name: 'gold-example',
      kind: 'component',
      canonical: {
        primary: 'controls/button',
        path: ['controls', 'controls/button'],
      },
      inputFingerprint: `sha256:${'c'.repeat(64)}`,
    });

    const result = validateCatalogRuntimeContract({
      sourceTaxonomy: taxonomy,
      runtimeTaxonomy: taxonomy,
      overlay,
      runtimeCatalog,
      accessRules: {},
    });

    expect(result.errors).toEqual([]);
    expect(result.summary.missingOverlayItems).toBe(1);
    expect(result.summary.staleOverlayItems).toBe(0);
  });

  it('allows duplicate runtime identities when exactly one variant matches the reviewed fingerprint', () => {
    const { overlay, runtimeCatalog } = fixture();
    runtimeCatalog.registries['@demo'].push({
      name: 'app-shell',
      title: 'Different upstream variant',
      type: 'registry:block',
    });
    runtimeCatalog.meta.item_count = 2;

    const result = validateCatalogRuntimeContract({
      sourceTaxonomy: taxonomy,
      runtimeTaxonomy: taxonomy,
      overlay,
      runtimeCatalog,
      accessRules: {},
    });

    expect(result.errors).toEqual([]);
    expect(result.summary.staleOverlayItems).toBe(0);
    expect(result.summary.runtimeCanonicalItems).toBe(1);
  });

  it('rejects stale overlay input fingerprints instead of silently preserving old classification', () => {
    const { overlay, runtimeCatalog } = fixture();
    runtimeCatalog.registries['@demo'][0].title = 'Renamed unrelated surface';
    const result = validateCatalogRuntimeContract({
      sourceTaxonomy: taxonomy,
      runtimeTaxonomy: taxonomy,
      overlay,
      runtimeCatalog,
      accessRules: {},
    });
    expect(result.errors.join('\n')).toMatch(/stale|fingerprint|not applied/i);
    expect(result.summary.staleOverlayItems).toBe(1);
  });

  it('rejects runtime managed canonical fields that do not originate from the reviewed overlay', () => {
    const { overlay, runtimeCatalog } = fixture();
    runtimeCatalog.registries['@demo'].push({
      name: 'button',
      type: 'registry:ui',
      kind: 'component',
      canonical: {
        taxonomyVersion: 'v1',
        primary: 'controls/button',
        path: ['controls', 'controls/button'],
      },
    });
    runtimeCatalog.meta.item_count = 2;
    const result = validateCatalogRuntimeContract({
      sourceTaxonomy: taxonomy,
      runtimeTaxonomy: taxonomy,
      overlay,
      runtimeCatalog,
      accessRules: {},
    });
    expect(result.errors.join('\n')).toMatch(/not present in reviewed overlay/i);
  });
});

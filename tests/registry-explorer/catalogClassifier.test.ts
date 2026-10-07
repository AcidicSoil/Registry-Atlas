// @ts-ignore Node typings are intentionally not a project test dependency.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
// @ts-ignore Standalone Node ESM modules.
import { validateCatalogTaxonomy } from '../../scripts/lib/catalog-taxonomy.mjs';
// @ts-ignore Standalone Node ESM modules.
import { buildCatalogClassificationState } from '../../scripts/lib/catalog-classification-state.mjs';
// @ts-ignore Standalone Node ESM modules.
import { findDeterministicAliasClassification } from '../../scripts/lib/catalog-classifier.mjs';

const taxonomy = validateCatalogTaxonomy(
  JSON.parse(readFileSync('data/catalog-taxonomy/v1.json', 'utf8')),
);

describe('catalog classification state', () => {
  it('builds a compact browser-independent state from local item metadata', () => {
    const state = buildCatalogClassificationState({
      namespace: '@flat',
      item: {
        name: 'app-shell',
        title: '  App   Shell  ',
        description: `  ${'workspace '.repeat(100)}  `,
        kind: 'block',
      },
    });

    expect(state.item.name).toBe('app-shell');
    expect(state.item.title).toBe('App Shell');
    expect(state.item.description?.length).toBeLessThanOrEqual(600);
    expect(state.item.description).not.toMatch(/\s{2,}/);
    expect(state.item.kind).toBe('block');
    expect(state).not.toHaveProperty('sourceHints');
    expect(JSON.stringify(state)).not.toContain('@flat');
  });

  it('keeps only non-empty trusted source hints and rejects arbitrary page/navigation evidence', () => {
    const state = buildCatalogClassificationState({
      namespace: '@demo',
      item: { name: 'button', title: 'Button', kind: 'component' },
      sourceHints: {
        categories: ['  Controls  ', ''],
        verifiedGroups: [' Form controls '],
        breadcrumbs: [],
        pathHints: ['/components/button'],
      },
    });
    expect(state.sourceHints).toEqual({
      categories: ['Controls'],
      verifiedGroups: ['Form controls'],
      pathHints: ['/components/button'],
    });

    expect(() => buildCatalogClassificationState({
      namespace: '@demo',
      item: { name: 'button', title: 'Button', kind: 'component' },
      sourceHints: { categories: ['Controls'], navigation: ['Docs', 'Privacy'] },
    })).toThrow(/unsupported source hint/i);
    expect(() => buildCatalogClassificationState({
      namespace: '@demo',
      item: { name: 'button', title: 'Button', kind: 'component' },
      sourceHints: { pageDump: '<html>...</html>' },
    })).toThrow(/unsupported source hint/i);
  });
});

describe('deterministic canonical alias classification', () => {
  it.each([
    ['App Shell', 'application/app-shell', ['application', 'application/app-shell']],
    ['AI Chat', 'ai/chat', ['ai', 'ai/chat']],
    ['Button', 'controls/button', ['controls', 'controls/button']],
  ])('classifies exact %s evidence without System One', (title, primary, path) => {
    const state = buildCatalogClassificationState({
      namespace: '@demo',
      item: { name: title.toLowerCase().replace(/\s+/g, '-'), title, kind: 'block' },
    });
    const result = findDeterministicAliasClassification(state, taxonomy);

    expect(result).toMatchObject({
      taxonomyVersion: 'v1',
      primary,
      path,
      method: 'deterministic-alias',
    });
    expect(result?.inputFingerprint).toMatch(/^sha256:[a-f0-9]{64}$/);
  });

  it('uses trusted source category/group aliases but not description similarity', () => {
    const sourceMatch = buildCatalogClassificationState({
      namespace: '@demo',
      item: { name: 'shell-01', title: 'Workspace Layout 01', kind: 'block' },
      sourceHints: { categories: ['App Shell'] },
    });
    expect(findDeterministicAliasClassification(sourceMatch, taxonomy)?.primary)
      .toBe('application/app-shell');

    const descriptionOnly = buildCatalogClassificationState({
      namespace: '@demo',
      item: {
        name: 'workspace-layout',
        title: 'Workspace Layout',
        description: 'An app shell with navigation and content.',
        kind: 'block',
      },
    });
    expect(findDeterministicAliasClassification(descriptionOnly, taxonomy)).toBeNull();
  });

  it('falls through when exact evidence points to more than one canonical node', () => {
    const state = buildCatalogClassificationState({
      namespace: '@demo',
      item: { name: 'button-shell', title: 'Button', kind: 'block' },
      sourceHints: { verifiedGroups: ['App Shell'] },
    });
    expect(findDeterministicAliasClassification(state, taxonomy)).toBeNull();
  });

  it('produces a stable fingerprint for identical semantic state and changes it when state changes', () => {
    const first = buildCatalogClassificationState({
      namespace: '@one',
      item: { name: 'button', title: 'Button', kind: 'component' },
    });
    const second = buildCatalogClassificationState({
      namespace: '@two',
      item: { name: 'button', title: 'Button', kind: 'component' },
    });
    const changed = buildCatalogClassificationState({
      namespace: '@two',
      item: { name: 'button', title: 'Primary Button', kind: 'component' },
    });
    const a = findDeterministicAliasClassification(first, taxonomy);
    const b = findDeterministicAliasClassification(second, taxonomy);
    expect(a?.inputFingerprint).toBe(b?.inputFingerprint);
    expect(findDeterministicAliasClassification(changed, taxonomy)).toBeNull();
  });
});
